var mj = require("minijanus");
var sdpUtils = require("sdp");
var debug = require("debug")("naf-janus-adapter:debug");
var warn = require("debug")("naf-janus-adapter:warn");
var error = require("debug")("naf-janus-adapter:error");
var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

function debounce(fn) {
  var curr = Promise.resolve();
  return function() {
    var args = Array.prototype.slice.call(arguments);
    curr = curr.then(_ => fn.apply(this, args));
  };
}

function randomUint() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function untilDataChannelOpen(dataChannel) {
  return new Promise((resolve, reject) => {
    if (dataChannel.readyState === "open") {
      resolve();
    } else {
      let resolver, rejector;

      const clear = () => {
        dataChannel.removeEventListener("open", resolver);
        dataChannel.removeEventListener("error", rejector);
      };

      resolver = () => {
        clear();
        resolve();
      };
      rejector = () => {
        clear();
        reject();
      };

      dataChannel.addEventListener("open", resolver);
      dataChannel.addEventListener("error", rejector);
    }
  });
}

const isH264VideoSupported = (() => {
  const video = document.createElement("video");
  return video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') !== "";
})();

const OPUS_PARAMETERS = {
  // indicates that we want to enable DTX to elide silence packets
  usedtx: 1,
  // indicates that we prefer to receive mono audio (important for voip profile)
  stereo: 0,
  // indicates that we prefer to send mono audio (important for voip profile)
  "sprop-stereo": 0
};

const PEER_CONNECTION_CONFIG = {
  iceServers: [{ urls: "stun:stun1.l.google.com:19302" }, { urls: "stun:stun2.l.google.com:19302" }]
};

const WS_NORMAL_CLOSURE = 1000;

class JanusAdapter {
  constructor() {
    this.room = null;
    this.userId = String(randomUint());

    this.serverUrl = null;
    this.webRtcOptions = {};
    this.ws = null;
    this.session = null;
    this.reliableTransport = "datachannel";
    this.unreliableTransport = "datachannel";

    // In the event the server restarts and all clients lose connection, reconnect with
    // some random jitter added to prevent simultaneous reconnection requests.
    this.initialReconnectionDelay = 1000 * Math.random();
    this.reconnectionDelay = this.initialReconnectionDelay;
    this.reconnectionTimeout = null;
    this.maxReconnectionAttempts = 10;
    this.reconnectionAttempts = 0;

    this.publisher = null;
    this.occupants = {};
    this.mediaStreams = {};
    this.localMediaStream = null;
    this.pendingMediaRequests = new Map();

    this.frozenUpdates = new Map();

    this.timeOffsets = [];
    this.serverTimeRequests = 0;
    this.avgTimeOffset = 0;

    this.onWebsocketOpen = this.onWebsocketOpen.bind(this);
    this.onWebsocketClose = this.onWebsocketClose.bind(this);
    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    this.onDataChannelMessage = this.onDataChannelMessage.bind(this);
    this.onData = this.onData.bind(this);
  }

  setServerUrl(url) {
    this.serverUrl = url;
  }

  setApp(app) {}

  setRoom(roomName) {
    this.room = roomName;
  }

  setWebRtcOptions(options) {
    this.webRtcOptions = options;
  }

  setServerConnectListeners(successListener, failureListener) {
    this.connectSuccess = successListener;
    this.connectFailure = failureListener;
  }

  setRoomOccupantListener(occupantListener) {
    this.onOccupantsChanged = occupantListener;
  }

  setDataChannelListeners(openListener, closedListener, messageListener) {
    this.onOccupantConnected = openListener;
    this.onOccupantDisconnected = closedListener;
    this.onOccupantMessage = messageListener;
  }

  setReconnectionListeners(reconnectingListener, reconnectedListener, reconnectionErrorListener) {
    // onReconnecting is called with the number of milliseconds until the next reconnection attempt
    this.onReconnecting = reconnectingListener;
    // onReconnected is called when the connection has been reestablished
    this.onReconnected = reconnectedListener;
    // onReconnectionError is called with an error when maxReconnectionAttempts has been reached
    this.onReconnectionError = reconnectionErrorListener;
  }

  connect() {
    debug(`connecting to ${this.serverUrl}`);

    const websocketConnection = new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl, "janus-protocol");

      this.session = new mj.JanusSession(this.ws.send.bind(this.ws));

      let onOpen;

      const onError = () => {
        reject(error);
      };

      this.ws.addEventListener("close", this.onWebsocketClose);
      this.ws.addEventListener("message", this.onWebsocketMessage);

      onOpen = () => {
        this.ws.removeEventListener("open", onOpen);
        this.ws.removeEventListener("error", onError);
        this.onWebsocketOpen()
          .then(resolve)
          .catch(reject);
      };

      this.ws.addEventListener("open", onOpen);
    });

    return Promise.all([websocketConnection, this.updateTimeOffset()]);
  }

  disconnect() {
    debug(`disconnecting`);

    clearTimeout(this.reconnectionTimeout);

    this.removeAllOccupants();

    if (this.publisher) {
      // Close the publisher peer connection. Which also detaches the plugin handle.
      this.publisher.conn.close();
      this.publisher = null;
    }

    if (this.session) {
      this.session.dispose();
      this.session = null;
    }

    if (this.ws) {
      this.ws.removeEventListener("open", this.onWebsocketOpen);
      this.ws.removeEventListener("close", this.onWebsocketClose);
      this.ws.removeEventListener("message", this.onWebsocketMessage);
      this.ws.close();
      this.ws = null;
    }
  }

  isDisconnected() {
    return this.ws === null;
  }

  async onWebsocketOpen() {
    // Create the Janus Session
    await this.session.create();

    // Attach the SFU Plugin and create a RTCPeerConnection for the publisher.
    // The publisher sends audio and opens two bidirectional data channels.
    // One reliable datachannel and one unreliable.
    this.publisher = await this.createPublisher();

    // Call the naf connectSuccess callback before we start receiving WebRTC messages.
    this.connectSuccess(this.userId);

    for (let i = 0; i < this.publisher.initialOccupants; i++) {
      await this.addOccupant(this.publisher.initialOccupants[i]);
    }

  }

  onWebsocketClose(event) {
    // The connection was closed successfully. Don't try to reconnect.
    if (event.code === WS_NORMAL_CLOSURE) {
      return;
    }

    if (this.onReconnecting) {
      this.onReconnecting(this.reconnectionDelay);
    }

    this.reconnectionTimeout = setTimeout(() => this.reconnect(), this.reconnectionDelay);
  }

  reconnect() {
    // Dispose of all networked entities and other resources tied to the session.
    this.disconnect();

    this.connect()
      .then(() => {
        this.reconnectionDelay = this.initialReconnectionDelay;
        this.reconnectionAttempts = 0;

        if (this.onReconnected) {
          this.onReconnected();
        }
      })
      .catch(error => {
        this.reconnectionDelay += 1000;
        this.reconnectionAttempts++;

        if (this.reconnectionAttempts > this.maxReconnectionAttempts && this.onReconnectionError) {
          return this.onReconnectionError(
            new Error("Connection could not be reestablished, exceeded maximum number of reconnection attempts.")
          );
        }

        if (this.onReconnecting) {
          this.onReconnecting(this.reconnectionDelay);
        }

        this.reconnectionTimeout = setTimeout(() => this.reconnect(), this.reconnectionDelay);
      });
  }

  onWebsocketMessage(event) {
    this.session.receive(JSON.parse(event.data));
  }

  async addOccupant(occupantId) {
    var subscriber = await this.createSubscriber(occupantId);

    this.occupants[occupantId] = subscriber;

    this.setMediaStream(occupantId, subscriber.mediaStream);

    // Call the Networked AFrame callbacks for the new occupant.
    this.onOccupantConnected(occupantId);
    this.onOccupantsChanged(this.occupants);

    return subscriber;
  }

  removeAllOccupants() {
    for (const occupantId of Object.getOwnPropertyNames(this.occupants)) {
      this.removeOccupant(occupantId);
    }
  }

  removeOccupant(occupantId) {
    if (this.occupants[occupantId]) {
      // Close the subscriber peer connection. Which also detaches the plugin handle.
      if (this.occupants[occupantId]) {
        this.occupants[occupantId].conn.close();
        delete this.occupants[occupantId];
      }

      if (this.mediaStreams[occupantId]) {
        delete this.mediaStreams[occupantId];
      }

      if (this.pendingMediaRequests.has(occupantId)) {
        const msg = "The user disconnected before the media stream was resolved.";
        this.pendingMediaRequests.get(occupantId).audio.reject(msg);
        this.pendingMediaRequests.get(occupantId).video.reject(msg);
        this.pendingMediaRequests.delete(occupantId);
      }

      // Call the Networked AFrame callbacks for the removed occupant.
      this.onOccupantDisconnected(occupantId);
      this.onOccupantsChanged(this.occupants);
    }
  }

  associate(conn, handle) {
    conn.addEventListener("icecandidate", ev => {
      handle.sendTrickle(ev.candidate || null).catch(e => error("Error trickling ICE: %o", e));
    });

    // we have to debounce these because janus gets angry if you send it a new SDP before
    // it's finished processing an existing SDP. in actuality, it seems like this is maybe
    // too liberal and we need to wait some amount of time after an offer before sending another,
    // but we don't currently know any good way of detecting exactly how long :(
    //
    conn.addEventListener(
      "negotiationneeded",
      debounce(async ev => {
        debug("Sending new offer for handle: %o", handle);
        var offer = await conn.createOffer().then(this.configurePublisherSdp);
        await conn.setLocalDescription(offer);
        // On iOS Safari, WebRTC negotiation fails easily if we do not pause before sending
        // a new offer to Janus here.
        if (iOS) {
          await return new Promise(r => { setTimeout(r, 5000); });
        }
        const setRemote = handle.sendJsep(offer).then(r => conn.setRemoteDescription(r.jsep));;
        return setRemote.catch(e => debug("Error negotiating offer: " + e));
      })
    );
    handle.on(
      "event",
      debounce(ev => {
        var jsep = ev.jsep;
        if (jsep && jsep.type == "offer") {
          debug("Accepting new offer for handle: %o", handle);
          var answer = conn.setRemoteDescription(this.configureSubscriberSdp(jsep)).then(_ => conn.createAnswer());
          var local = answer.then(a => conn.setLocalDescription(a));
          var remote = answer.then(j => handle.sendJsep(j));
          return Promise.all([local, remote]).catch(e => error("Error negotiating answer: %o", e));
        } else {
          // some other kind of event, nothing to do
          return null;
        }
      })
    );
  }

  async createPublisher() {
    var handle = new mj.JanusPluginHandle(this.session);
    var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    debug("pub waiting for sfu");
    await handle.attach("janus.plugin.sfu");

    this.associate(conn, handle);

    debug("pub waiting for data channels & webrtcup");
    var webrtcup = new Promise(resolve => handle.on("webrtcup", resolve));

    // Unreliable datachannel: sending and receiving component updates.
    // Reliable datachannel: sending and recieving entity instantiations.
    var reliableChannel = conn.createDataChannel("reliable", { ordered: true });
    var unreliableChannel = conn.createDataChannel("unreliable", {
      ordered: false,
      maxRetransmits: 0
    });

    reliableChannel.addEventListener("message", this.onDataChannelMessage);
    unreliableChannel.addEventListener("message", this.onDataChannelMessage);

    await webrtcup;
    await untilDataChannelOpen(reliableChannel);
    await untilDataChannelOpen(unreliableChannel);

    // doing this here is sort of a hack around chrome renegotiation weirdness --
    // if we do it prior to webrtcup, chrome on gear VR will sometimes put a
    // renegotiation offer in flight while the first offer was still being
    // processed by janus. we should find some more principled way to figure out
    // when janus is done in the future.
    if (this.localMediaStream) {
      this.localMediaStream.getTracks().forEach(track => {
        conn.addTrack(track, this.localMediaStream);
      });
    }

    // Handle all of the join and leave events.
    handle.on("event", ev => {
      var data = ev.plugindata.data;
      if (data.event == "join" && data.room_id == this.room) {
        this.addOccupant(data.user_id);
      } else if (data.event == "leave" && data.room_id == this.room) {
        this.removeOccupant(data.user_id);
      } else if (data.event == "blocked") {
        document.body.dispatchEvent(new CustomEvent("blocked", { detail: { clientId: data.by } }));
      } else if (data.event == "unblocked") {
        document.body.dispatchEvent(new CustomEvent("unblocked", { detail: { clientId: data.by } }));
      } else if (data.event === "data") {
        this.onData(JSON.parse(data.body));
      }
    });

    debug("pub waiting for join");

    // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
    var message = await this.sendJoin(handle, {
      notifications: true,
      data: true
    });

    if (!message.plugindata.data.success) {
      const err = message.plugindata.data.error;
      console.error(err);
      throw err;
    }

    var initialOccupants = message.plugindata.data.response.users[this.room] || [];

    debug("publisher ready");
    return {
      handle,
      initialOccupants,
      reliableChannel,
      unreliableChannel,
      conn
    };
  }

  configurePublisherSdp(jsep) {
    jsep.sdp = jsep.sdp.replace(/a=fmtp:(109|111).*\r\n/g, (line, pt) => {
      const parameters = Object.assign(sdpUtils.parseFmtp(line), OPUS_PARAMETERS);
      return sdpUtils.writeFmtp({ payloadType: pt, parameters: parameters });
    });
    return jsep;
  }

  configureSubscriberSdp(jsep) {
    // todo: consider cleaning up these hacks to use sdputils
    if (!isH264VideoSupported) {
      if (navigator.userAgent.indexOf("HeadlessChrome") !== -1) {
        // HeadlessChrome (e.g. puppeteer) doesn't support webrtc video streams, so we remove those lines from the SDP.
        jsep.sdp = jsep.sdp.replace(/m=video[^]*m=/, "m=");
      }
    }

    // TODO: Hack to get video working on Chrome for Android. https://groups.google.com/forum/#!topic/mozilla.dev.media/Ye29vuMTpo8
    if (navigator.userAgent.indexOf("Android") === -1) {
      jsep.sdp = jsep.sdp.replace(
        "a=rtcp-fb:107 goog-remb\r\n",
        "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\n"
      );
    } else {
      jsep.sdp = jsep.sdp.replace(
        "a=rtcp-fb:107 goog-remb\r\n",
        "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\n"
      );
    }
    return jsep;
  }

  async createSubscriber(occupantId) {
    var handle = new mj.JanusPluginHandle(this.session);
    var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    debug("sub waiting for sfu");
    await handle.attach("janus.plugin.sfu");

    this.associate(conn, handle);

    debug("sub waiting for join");
    // Send join message to janus. Don't listen for join/leave messages. Subscribe to the occupant's media.
    // Janus should send us an offer for this occupant's media in response to this.
    const resp = await this.sendJoin(handle, { media: occupantId });

    debug("sub waiting for webrtcup");
    await new Promise(resolve => handle.on("webrtcup", resolve));

    var mediaStream = new MediaStream();
    var receivers = conn.getReceivers();
    receivers.forEach(receiver => {
      if (receiver.track) {
        mediaStream.addTrack(receiver.track);
      }
    });
    if (mediaStream.getTracks().length === 0) {
      mediaStream = null;
    }

    debug("subscriber ready");
    return {
      handle,
      mediaStream,
      conn
    };
  }

  sendJoin(handle, subscribe) {
    return handle.sendMessage({
      kind: "join",
      room_id: this.room,
      user_id: this.userId,
      subscribe
    });
  }

  toggleFreeze() {
    if (this.frozen) {
      this.unfreeze();
    } else {
      this.freeze();
    }
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
    this.flushPendingUpdates();
  }

  flushPendingUpdates() {
    for (const [networkId, message] of this.frozenUpdates) {
      // ignore messages relating to users who have disconnected since freezing, their entities will have aleady been removed by NAF
      // note that delete messages have no "owner" so we have to check for that as well
      if (message.data.owner && !this.occupants[message.data.owner]) continue;

      this.onOccupantMessage(null, message.dataType, message.data);
    }
    this.frozenUpdates.clear();
  }

  storeMessage(message) {
    const networkId = message.data.networkId;
    if (!this.frozenUpdates.has(networkId)) {
      this.frozenUpdates.set(networkId, message);
    } else {
      const storedMessage = this.frozenUpdates.get(networkId);

      // Avoid updating components if the entity data received did not come from the current owner.
      const isOutdatedMessage = message.data.lastOwnerTime < storedMessage.data.lastOwnerTime;
      const isContemporaneousMessage = message.data.lastOwnerTime === storedMessage.data.lastOwnerTime;
      if (isOutdatedMessage || (isContemporaneousMessage && storedMessage.data.owner > message.data.owner)) {
        return;
      }

      // Delete messages override any other messages for this entity
      if (message.dataType === "r") {
        this.frozenUpdates.set(networkId, message);
      } else {
        // merge in component updates
        Object.assign(storedMessage.data.components, message.data.components);
      }
    }
  }

  onDataChannelMessage(e) {
    this.onData(JSON.parse(e.data));
  }

  onData(message) {
    if (debug.enabled) {
      debug(`DC in: ${message}`);
    }

    if (!message.dataType) return;

    if (this.frozen) {
      this.storeMessage(message);
    } else {
      this.onOccupantMessage(null, message.dataType, message.data);
    }
  }

  shouldStartConnectionTo(client) {
    return true;
  }

  startStreamConnection(client) {}

  closeStreamConnection(client) {}

  getConnectStatus(clientId) {
    return this.occupants[clientId] ? NAF.adapters.IS_CONNECTED : NAF.adapters.NOT_CONNECTED;
  }

  async updateTimeOffset() {
    if (this.isDisconnected()) return;

    const clientSentTime = Date.now();

    const res = await fetch(document.location.href, {
      method: "HEAD",
      cache: "no-cache"
    });

    const precision = 1000;
    const serverReceivedTime = new Date(res.headers.get("Date")).getTime() + precision / 2;
    const clientReceivedTime = Date.now();
    const serverTime = serverReceivedTime + (clientReceivedTime - clientSentTime) / 2;
    const timeOffset = serverTime - clientReceivedTime;

    this.serverTimeRequests++;

    if (this.serverTimeRequests <= 10) {
      this.timeOffsets.push(timeOffset);
    } else {
      this.timeOffsets[this.serverTimeRequests % 10] = timeOffset;
    }

    this.avgTimeOffset = this.timeOffsets.reduce((acc, offset) => (acc += offset), 0) / this.timeOffsets.length;

    if (this.serverTimeRequests > 10) {
      debug(`new server time offset: ${this.avgTimeOffset}ms`);
      setTimeout(() => this.updateTimeOffset(), 5 * 60 * 1000); // Sync clock every 5 minutes.
    } else {
      this.updateTimeOffset();
    }
  }

  getServerTime() {
    return Date.now() + this.avgTimeOffset;
  }

  getMediaStream(clientId, type = "audio") {
    if (this.mediaStreams[clientId]) {
      debug(`Already had ${type} for ${clientId}`);
      return Promise.resolve(this.mediaStreams[clientId][type]);
    } else {
      debug(`Waiting on ${type} for ${clientId}`);
      if (!this.pendingMediaRequests.has(clientId)) {
        this.pendingMediaRequests.set(clientId, {});

        const audioPromise = new Promise((resolve, reject) => {
          this.pendingMediaRequests.get(clientId).audio = { resolve, reject };
        });
        const videoPromise = new Promise((resolve, reject) => {
          this.pendingMediaRequests.get(clientId).video = { resolve, reject };
        });

        this.pendingMediaRequests.get(clientId).audio.promise = audioPromise;
        this.pendingMediaRequests.get(clientId).video.promise = videoPromise;
      }
      return this.pendingMediaRequests.get(clientId)[type].promise;
    }
  }

  setMediaStream(clientId, stream) {
    // Safari doesn't like it when you use single a mixed media stream where one of the tracks is inactive, so we
    // split the tracks into two streams.
    const audioStream = new MediaStream();
    stream.getAudioTracks().forEach(track => audioStream.addTrack(track));
    const videoStream = new MediaStream();
    stream.getVideoTracks().forEach(track => videoStream.addTrack(track));

    this.mediaStreams[clientId] = { audio: audioStream, video: videoStream };

    // Resolve the promise for the user's media stream if it exists.
    if (this.pendingMediaRequests.has(clientId)) {
      this.pendingMediaRequests.get(clientId).audio.resolve(audioStream);
      this.pendingMediaRequests.get(clientId).video.resolve(videoStream);
    }
  }

  setLocalMediaStream(stream) {
    // our job here is to make sure the connection winds up with RTP senders sending the stuff in this stream,
    // and not the stuff that isn't in this stream. strategy is to replace existing tracks if we can, add tracks
    // that we can't replace, and disable tracks that don't exist anymore.

    // note that we don't ever remove a track from the stream -- since Janus doesn't support Unified Plan, we absolutely
    // can't wind up with a SDP that has >1 audio or >1 video tracks, even if one of them is inactive (what you get if
    // you remove a track from an existing stream.)
    if (this.publisher && this.publisher.conn) {
      var existingSenders = this.publisher.conn.getSenders();
      var newSenders = [];
      stream.getTracks().forEach(t => {
        var sender = existingSenders.find(s => s.track != null && s.track.kind == t.kind);
        if (sender != null) {
          if (sender.replaceTrack) {
            sender.replaceTrack(t);
            sender.track.enabled = true;
          } else {
            // replaceTrack isn't implemented in Chrome, even via webrtc-adapter.
            stream.removeTrack(sender.track);
            stream.addTrack(t);
            t.enabled = true;
          }
          newSenders.push(sender);
        } else {
          newSenders.push(this.publisher.conn.addTrack(t, stream));
        }
      });
      existingSenders.forEach(s => {
        if (!newSenders.includes(s)) {
          s.track.enabled = false;
        }
      });
    }
    this.localMediaStream = stream;
    this.setMediaStream(this.userId, stream);
  }

  enableMicrophone(enabled) {
    if (this.publisher && this.publisher.conn) {
      this.publisher.conn.getSenders().forEach(s => {
        if (s.track.kind == "audio") {
          s.track.enabled = enabled;
        }
      });
    }
  }

  sendData(clientId, dataType, data) {
    if (!this.publisher) {
      console.warn("sendData called without a publisher");
    } else {
      switch (this.unreliableTransport) {
        case "websocket":
          this.publisher.handle.sendMessage({ kind: "data", body: JSON.stringify({ dataType, data }), whom: clientId });
          break;
        case "datachannel":
          this.publisher.unreliableChannel.send(JSON.stringify({ clientId, dataType, data }));
          break;
        default:
          this.unreliableTransport(clientId, dataType, data);
          break;
      }
    }
  }

  sendDataGuaranteed(clientId, dataType, data) {
    if (!this.publisher) {
      console.warn("sendDataGuaranteed called without a publisher");
    } else {
      switch (this.reliableTransport) {
        case "websocket":
          this.publisher.handle.sendMessage({ kind: "data", body: JSON.stringify({ dataType, data }), whom: clientId });
          break;
        case "datachannel":
          this.publisher.reliableChannel.send(JSON.stringify({ clientId, dataType, data }));
          break;
        default:
          this.reliableTransport(clientId, dataType, data);
          break;
      }
    }
  }

  broadcastData(dataType, data) {
    if (!this.publisher) {
      console.warn("broadcastData called without a publisher");
    } else {
      switch (this.unreliableTransport) {
        case "websocket":
          this.publisher.handle.sendMessage({ kind: "data", body: JSON.stringify({ dataType, data }) });
          break;
        case "datachannel":
          this.publisher.unreliableChannel.send(JSON.stringify({ dataType, data }));
          break;
        default:
          this.unreliableTransport(undefined, dataType, data);
          break;
      }
    }
  }

  broadcastDataGuaranteed(dataType, data) {
    if (!this.publisher) {
      console.warn("broadcastDataGuaranteed called without a publisher");
    } else {
      switch (this.reliableTransport) {
        case "websocket":
          this.publisher.handle.sendMessage({ kind: "data", body: JSON.stringify({ dataType, data }) });
          break;
        case "datachannel":
          this.publisher.reliableChannel.send(JSON.stringify({ dataType, data }));
          break;
        default:
          this.reliableTransport(undefined, dataType, data);
          break;
      }
    }
  }

  block(clientId) {
    return this.publisher.handle.sendMessage({ kind: "block", whom: clientId }).then(() => {
      document.body.dispatchEvent(new CustomEvent("blocked", { detail: { clientId: clientId } }));
    });
  }

  unblock(clientId) {
    return this.publisher.handle.sendMessage({ kind: "unblock", whom: clientId }).then(() => {
      document.body.dispatchEvent(new CustomEvent("unblocked", { detail: { clientId: clientId } }));
    });
  }
}

NAF.adapters.register("janus", JanusAdapter);

module.exports = JanusAdapter;
