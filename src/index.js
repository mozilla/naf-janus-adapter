var mj = require("minijanus");
var debug = require("debug")("naf-janus-adapter:debug");
var warn = require("debug")("naf-janus-adapter:warn");
var error = require("debug")("naf-janus-adapter:error");

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

const isH264VideoSupported = (() => {
  const video = document.createElement("video");
  return video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') !== "";
})();

const PEER_CONNECTION_CONFIG = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
};

class JanusAdapter {
  constructor() {
    this.room = null;
    this.userId = randomUint();

    this.serverUrl = null;
    this.webRtcOptions = {};
    this.ws = null;
    this.session = null;

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
    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    this.onDataChannelMessage = this.onDataChannelMessage.bind(this);
  }

  setServerUrl(url) {
    this.serverUrl = url;
  }

  setApp(app) {}

  setRoom(roomName) {
    try {
      this.room = parseInt(roomName);
    } catch (e) {
      throw new Error("Room must be a positive integer.");
    }
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

  connect() {
    debug(`connecting to ${this.serverUrl}`);
    this.ws = new WebSocket(this.serverUrl, "janus-protocol");
    this.session = new mj.JanusSession(this.ws.send.bind(this.ws));
    this.ws.addEventListener("open", this.onWebsocketOpen);
    this.ws.addEventListener("message", this.onWebsocketMessage);
    this.updateTimeOffset();
  }

  disconnect() {
    debug(`disconnecting`);

    this.removeAllOccupants();

    if (this.publisher) {
      this.destroyPublisher(this.publisher);
      this.publisher = null;
    }

    if (this.session) {
      this.session.destroy();
      this.session = null;
    }

    if (this.ws) {
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

    // Add all of the initial occupants.
    await Promise.all(this.publisher.initialOccupants.map(this.addOccupant.bind(this)));
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

    // we have to debounce these because janus gets angry if you send it a new SDP before it's finished processing an
    // existing SDP. maybe another, slightly more correct approach would be to not set the remote description until we
    // get the webrtcup event?
    conn.addEventListener("negotiationneeded", debounce(ev => {
      debug("Sending new offer for handle: %o", handle);
      var offer = conn.createOffer();
      var local = offer.then(o => conn.setLocalDescription(o));
      var remote = offer.then(j => handle.sendJsep(j)).then(r => conn.setRemoteDescription(r.jsep));
      return Promise.all([local, remote]).catch(e => error("Error negotiating offer: %o", e));
    }));

    handle.on("event", debounce(ev => {
      var jsep = ev.jsep;
      if (jsep && jsep.type == "offer") {
        debug("Accepting new offer for handle: %o", handle);
        jsep.sdp = this.configureSubscriberSdp(jsep.sdp);
        var answer = conn.setRemoteDescription(jsep).then(_ => conn.createAnswer());
        var local = answer.then(a => conn.setLocalDescription(a));
        var remote = answer.then(j => handle.sendJsep(j));
        Promise.all([local, remote]).catch(e => error("Error negotiating answer: %o", e));
      }
    }));
  }

  async createPublisher() {
    var handle = new mj.JanusPluginHandle(this.session);
    var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);
    this.associate(conn, handle);

    debug("pub waiting for sfu");
    await handle.attach("janus.plugin.sfu");

    // Create an unreliable datachannel for sending and receiving component updates, etc.
    var unreliableChannel = conn.createDataChannel("unreliable", { ordered: false, maxRetransmits: 0 });
    unreliableChannel.addEventListener("message", this.onDataChannelMessage);

    // Create a reliable datachannel for sending and recieving entity instantiations, etc.
    var reliableChannel = conn.createDataChannel("reliable", { ordered: true });
    reliableChannel.addEventListener("message", this.onDataChannelMessage);

    if (this.localMediaStream) {
      this.localMediaStream.getTracks().forEach(track => {
        conn.addTrack(track, this.localMediaStream);
      });
    }

    debug("pub waiting for webrtcup");
    await new Promise(resolve => handle.on("webrtcup", resolve));

    // Handle all of the join and leave events.
    handle.on("event", ev => {
      var data = ev.plugindata.data;
      if (data.event == "join" && data.room_id == this.room) {
        this.addOccupant(data.user_id);
      } else if (data.event == "leave" && data.room_id == this.room) {
        this.removeOccupant(data.user_id);
      }
    });

    debug("pub waiting for join");
    // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
    var message = await this.sendJoin(handle, { notifications: true, data: true });
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

  destroyPublisher(publisher) {
    debug(`destroying publisher`);

    const { handle, conn } = publisher;

    handle.detach();
    conn.close();
  }

  configureSubscriberSdp(originalSdp) {
    if (!isH264VideoSupported) {
      return originalSdp;
    }

    // TODO: Hack to get video working on Chrome for Android. https://groups.google.com/forum/#!topic/mozilla.dev.media/Ye29vuMTpo8
    if (navigator.userAgent.indexOf("Android") === -1) {
      return originalSdp.replace(
        "a=rtcp-fb:107 goog-remb\r\n",
        "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\n"
      );
    } else {
      return originalSdp.replace(
        "a=rtcp-fb:107 goog-remb\r\n",
        "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\n"
      );
    }
  }

  async createSubscriber(occupantId) {
    var handle = new mj.JanusPluginHandle(this.session);
    var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);
    this.associate(conn, handle);

    debug("sub waiting for sfu");
    await handle.attach("janus.plugin.sfu");

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

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
    this.flushPendingUpdates();
  }

  flushPendingUpdates() {
    for (let [networkId, message] of this.frozenUpdates) {
        if(!message.data.owner || this.occupants[message.data.owner]) { // ignore users who have disconnected since freezing, since their entities will have already been removed by NAF
          this.onOccupantMessage(null, message.dataType, message.data);
      }
    }
    this.frozenUpdates.clear();
  }

  storeMessage(message) {
    const networkId = message.data.networkId;
    if(!this.frozenUpdates.has(networkId)) {
      this.frozenUpdates.set(networkId, message);
    } else {
      const storedMessage = this.frozenUpdates.get(networkId);

      // Avoid updating components if the entity data received did not come from the current owner.
      if (message.data.lastOwnerTime < storedMessage.data.lastOwnerTime ||
            (storedMessage.data.lastOwnerTime === message.data.lastOwnerTime && storedMessage.data.owner > message.data.owner)) {
        return;
      }

      // Delete messages override any other messages for this entity
      if(message.dataType === "r") {
        console.log("got delete message, overwriting", networkId)
        this.frozenUpdates.set(networkId, message);
      } else {
        // merge in component updates
        Object.assign(storedMessage.data.components, message.data.components);
      }
    }
  }

  onDataChannelMessage(event) {
    var message = JSON.parse(event.data);

    if(!message.dataType) return;

    if(this.frozen) {
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
    const serverReceivedTime =
      new Date(res.headers.get("Date")).getTime() + precision / 2;
    const clientReceivedTime = Date.now();
    const serverTime =
      serverReceivedTime + (clientReceivedTime - clientSentTime) / 2;
    const timeOffset = serverTime - clientReceivedTime;

    this.serverTimeRequests++;

    if (this.serverTimeRequests <= 10) {
      this.timeOffsets.push(timeOffset);
    } else {
      this.timeOffsets[this.serverTimeRequests % 10] = timeOffset;
    }

    this.avgTimeOffset =
      this.timeOffsets.reduce((acc, offset) => (acc += offset), 0) /
      this.timeOffsets.length;

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

  getMediaStream(clientId, type = 'audio') {
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
    this.publisher.unreliableChannel.send(
      JSON.stringify({ clientId, dataType, data })
    );
  }

  sendDataGuaranteed(clientId, dataType, data) {
    this.publisher.reliableChannel.send(
      JSON.stringify({ clientId, dataType, data })
    );
  }

  broadcastData(dataType, data) {
    this.publisher.unreliableChannel.send(JSON.stringify({ dataType, data }));
  }

  broadcastDataGuaranteed(dataType, data) {
    this.publisher.reliableChannel.send(JSON.stringify({ dataType, data }));
  }
}

NAF.adapters.register("janus", JanusAdapter);

module.exports = JanusAdapter;
