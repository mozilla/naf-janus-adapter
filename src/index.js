var mj = require("minijanus");
var debug = require("debug")("naf-janus-adapter:debug");
var warn = require("debug")("naf-janus-adapter:warn");
var error = require("debug")("naf-janus-adapter:error");

function randomUint() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

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
    this.pendingMediaRequests = new Map();

    this.timeOffsets = [];
    this.serverTimeRequests = 0;
    this.avgTimeOffset = 0;

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
    this.ws.addEventListener("open", _ => this.onWebsocketOpen());
    this.ws.addEventListener("message", this.onWebsocketMessage);
  }

  async onWebsocketOpen() {
    await this.updateTimeOffset();

    // Create the Janus Session
    await this.session.create();

    // Attach the SFU Plugin and create a RTCPeerConnection for the publisher.
    // The publisher sends audio and opens two bidirectional data channels.
    // One reliable datachannel and one unreliable.
    this.publisher = await this.createPublisher();

    this.setMediaStream(this.userId, this.publisher.mediaStream);

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
        this.pendingMediaRequests
          .get(occupantId)
          .reject(
            "The user disconnected before the media stream was resolved."
          );
        this.pendingMediaRequests.delete(occupantId);
      }

      // Call the Networked AFrame callbacks for the removed occupant.
      this.onOccupantDisconnected(occupantId);
      this.onOccupantsChanged(this.occupants);
    }
  }

  negotiateIce(conn, handle) {
    return new Promise((resolve, reject) => {
      conn.addEventListener("icecandidate", ev => {
        handle.sendTrickle(ev.candidate || null).then(() => {
          if (!ev.candidate) { // this was the last candidate on our end and now they received it
            resolve();
          }
        }, reject);
      });
    });
  }

  async negotiatePublisherMedia(conn, handle) {
    debug("pub sending offer and setting remote/local description");
    var offer = await conn.createOffer();
    var localReady = conn.setLocalDescription(offer);
    var remoteReady = handle.sendJsep(offer).then(({ jsep }) => conn.setRemoteDescription(jsep));
    return await Promise.all([localReady, remoteReady]);
  }

  async negotiateSubscriberMedia(conn, handle, offer) {
    debug("sub sending answer and setting remote/local description");
    var desc = await conn.setRemoteDescription(offer);
    var answer = await conn.createAnswer();
    var localReady = conn.setLocalDescription(answer);
    var remoteReady = handle.sendJsep(answer);
    return await Promise.all([localReady, remoteReady]);
  }

  async createPublisher() {
    var handle = new mj.JanusPluginHandle(this.session);
    debug("pub waiting for sfu");
    await handle.attach("janus.plugin.sfu");

    var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    this.negotiateIce(conn, handle).catch(err => error("Error negotiating ICE candidates: %o", err));

    // Create an unreliable datachannel for sending and receiving component updates, etc.
    var unreliableChannel = conn.createDataChannel("unreliable", { ordered: false, maxRetransmits: 0 });
    unreliableChannel.addEventListener("message", this.onDataChannelMessage);

    // Create a reliable datachannel for sending and recieving entity instantiations, etc.
    var reliableChannel = conn.createDataChannel("reliable", { ordered: true });
    reliableChannel.addEventListener("message", this.onDataChannelMessage);

    var mediaStream;
    // @TODO either this should wait or setLocalMediaStream should renegotiate (or both)
    if (this.localMediaStream) {
      mediaStream = this.localMediaStream;
      conn.addStream(this.localMediaStream);
    } else {
      warn("localMediaStream not set. Will not publish audio or video");
    }

    this.negotiatePublisherMedia(conn, handle).catch(err => error("Error negotiating media: %o", err));

    debug("pub waiting for webrtcup");
    await new Promise(resolve => handle.on("webrtcup", resolve));

    // Call the naf connectSuccess callback before we start receiving WebRTC messages.
    this.connectSuccess(this.userId);

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
      mediaStream,
      conn
    };
  }

  configureSubscriberSdp(originalSdp) {
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
    debug("sub waiting for sfu");
    await handle.attach("janus.plugin.sfu");

    var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    this.negotiateIce(conn, handle).catch(err => error("Error negotiating ICE candidates: %o", err));

    debug("sub waiting for join");
    // Send join message to janus. Don't listen for join/leave messages. Subscribe to the occupant's audio stream.
    const resp = await this.sendJoin(handle, { media: occupantId });
    resp.jsep.sdp = this.configureSubscriberSdp(resp.jsep.sdp);

    this.negotiateSubscriberMedia(conn, handle, resp.jsep).catch(err => error("Error negotiating media: %o", err));

    debug("sub waiting for webrtcup");
    await new Promise(resolve => handle.on("webrtcup", resolve));

    // Get the occupant's audio stream.
    var streams = conn.getRemoteStreams();
    var mediaStream = streams.length > 0 ? streams[0] : null;

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

  onDataChannelMessage(event) {
    var message = JSON.parse(event.data);

    if (message.dataType) {
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
      setTimeout(() => this.updateTimeOffset(), 5 * 60 * 1000); // Sync clock every 5 minutes.
    } else {
      this.updateTimeOffset();
    }
  }

  getServerTime() {
    return Date.now() + this.avgTimeOffset;
  }

  getMediaStream(clientId) {
    if (this.mediaStreams[clientId]) {
      debug("Already had audio for " + clientId);
      return Promise.resolve(this.mediaStreams[clientId]);
    } else {
      debug("Waiting on audio for " + clientId);
      if (!this.pendingMediaRequests.has(clientId)) {
        const promise = new Promise((resolve, reject) => {
          this.pendingMediaRequests.set(clientId, { resolve, reject });
        });
        this.pendingMediaRequests.get(clientId).promise = promise;
      }
      return this.pendingMediaRequests.get(clientId).promise;
    }
  }

  setMediaStream(clientId, stream) {
    this.mediaStreams[clientId] = stream;

    // Resolve the promise for the user's media stream if it exists.
    if (this.pendingMediaRequests.has(clientId)) {
      this.pendingMediaRequests.get(clientId).resolve(stream);
    }
  }

  setLocalMediaStream(stream) {
    if (this.publisher) {
      console.warn(
        "setLocalMediaStream called after publisher created. Will not publish new stream."
      );
    }
    // @TODO this should handle renegotiating the publisher connection if it has already been made
    this.localMediaStream = stream;
  }

  enableMicrophone(enabled) {
    if (this.publisher && this.publisher.mediaStream) {
      var audioTracks = this.publisher.mediaStream.getAudioTracks();

      if (audioTracks.length > 0) {
        audioTracks[0].enabled = enabled;
      }
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
