var mj = require("minijanus");
var debug = require("debug")("naf-janus-adapter:debug");

function randomUint() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function waitForEvent(target, event) {
  return new Promise((resolve, reject) => {
    target.addEventListener(event, e => resolve(e), { once: true });
  });
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
    this.occupantPeerConnections = {};
    this.mediaStreams = {};
    this.pendingMediaRequests = new Map();

    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    this.onDataChannelMessage = this.onDataChannelMessage.bind(this);

    this.webRtcUpPromises = new Map();
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
    // Create the Janus Session
    await this.session.create();

    // Attach the SFU Plugin and create a RTCPeerConnection for the publisher.
    // The publisher sends audio and opens two bidirectional data channels.
    // One reliable datachannel and one unreliable.
    this.publisher = await this.createPublisher();

    this.mediaStreams[this.userId] = this.publisher.mediaStream;

    // Resolve the promise for the user's media stream if it exists.
    if (this.pendingMediaRequests.has(this.userId)) {
      this.pendingMediaRequests
        .get(this.userId)
        .resolve(this.publisher.mediaStream);
    }

    // Add all of the initial occupants.
    for (let occupantId of this.publisher.initialOccupants) {
      if (occupantId !== this.userId) {
        this.addOccupant(occupantId);
      }
    }
  }

  onWebsocketMessage(event) {
    var message = JSON.parse(event.data);
    this.session.receive(message);

    // Handle all of the join and leave events from the publisher.
    if (message.plugindata && message.plugindata.data) {
      var data = message.plugindata.data;
      if (data.event === "join" && data.room_id === this.room) {
        this.addOccupant(data.user_id);
      } else if (
        data.event &&
        data.event === "leave" &&
        data.room_id === this.room
      ) {
        this.removeOccupant(data.user_id);
      }
    }

    if (message.janus && message.janus === "webrtcup") {
      this.getWebRtcUpPromise(message.sender).resolve();
    }
  }

  async addOccupant(occupantId) {
    var subscriber = await this.createSubscriber(occupantId);

    this.occupants[occupantId] = true;
    this.occupantPeerConnections[occupantId] = subscriber.peerConnection;
    this.mediaStreams[occupantId] = subscriber.mediaStream;

    // Resolve the promise for the user's media stream if it exists.
    if (this.pendingMediaRequests.has(occupantId)) {
      this.pendingMediaRequests.get(occupantId).resolve(subscriber.mediaStream);
    }

    // Call the Networked AFrame callbacks for the new occupant.
    this.onOccupantConnected(occupantId);
    this.onOccupantsChanged(this.occupants);

    return subscriber;
  }

  removeOccupant(occupantId) {
    if (this.occupants[occupantId]) {
      // Close the subscriber peer connection. Which also detaches the plugin handle.
      if (this.occupantPeerConnections[occupantId]) {
        this.occupantPeerConnections[occupantId].close();
        delete this.occupantPeerConnections[occupantId];
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

      delete this.occupants[occupantId];

      // Call the Networked AFrame callbacks for the removed occupant.
      this.onOccupantDisconnected(occupantId);
      this.onOccupantsChanged(this.occupants);
    }
  }

  getWebRtcUpPromise(id) {
    if (!this.webRtcUpPromises.get(id)) {
      const promise = new Promise((resolve, reject) => {
        this.webRtcUpPromises.set(id, { resolve });
      });
      this.webRtcUpPromises.get(id).promise = promise;
    }
    return this.webRtcUpPromises.get(id);
  }

  async createPublisher() {
    var handle = new mj.JanusPluginHandle(this.session);
    debug("pub waiting for sfu");
    await handle.attach("janus.plugin.sfu");

    var peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    peerConnection.addEventListener("icecandidate", event => {
      handle.sendTrickle(event.candidate || null);
    });

    // Create an unreliable datachannel for sending and receiving component updates, etc.
    var unreliableChannel = peerConnection.createDataChannel("unreliable", {
      ordered: false,
      maxRetransmits: 0
    });
    unreliableChannel.addEventListener("message", this.onDataChannelMessage);

    // Create a reliable datachannel for sending and recieving entity instantiations, etc.
    var reliableChannel = peerConnection.createDataChannel("reliable", {
      ordered: true
    });
    reliableChannel.addEventListener("message", this.onDataChannelMessage);

    var mediaStream;
    // @TODO either this should wait or setLocalMediaStream should renegotiate (or both)
    if (this.localMediaStream) {
      mediaStream = this.localMediaStream;
      peerConnection.addStream(this.localMediaStream);
    } else {
      console.warn("localMediaStream not set. Will not publish audio or video");
    }

    debug("pub waiting for offer");
    var offer = await peerConnection.createOffer();

    debug("pub waiting for local/remote descriptions");

    await Promise.all([
      peerConnection.setLocalDescription(offer),
      handle
        .sendJsep(offer)
        .then(({ jsep }) => peerConnection.setRemoteDescription(jsep))
    ]);

    debug("pub waiting for webrtcup");
    await this.getWebRtcUpPromise(handle.id).promise;

    if (reliableChannel.readyState !== "open") {
      debug("pub waiting for channel to open");
      // Wait for the reliable datachannel to be open before we start sending messages on it.
      await waitForEvent(reliableChannel, "open");
    }

    // Call the naf connectSuccess callback before we start receiving WebRTC messages.
    this.connectSuccess(this.userId);

    debug("pub waiting for join");
    // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
    var message = await this.sendJoin(handle, this.room, this.userId, {
      notifications: true,
      data: true
    });

    var initialOccupants =
      message.plugindata.data.response.users[this.room] || [];

    debug("publisher ready");
    return {
      handle,
      initialOccupants,
      reliableChannel,
      unreliableChannel,
      mediaStream,
      peerConnection
    };
  }

  async createSubscriber(occupantId) {
    var handle = new mj.JanusPluginHandle(this.session);
    debug("sub waiting for sfu");
    await handle.attach("janus.plugin.sfu");

    var peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    peerConnection.addEventListener("icecandidate", event => {
      handle.sendTrickle(event.candidate || null);
    });

    debug("sub waiting for join");
    // Send join message to janus. Don't listen for join/leave messages. Subscribe to the occupant's audio stream.
    const resp = await this.sendJoin(handle, this.room, this.userId, {
      notifications: false,
      media: occupantId
    });

    debug("sub waiting for answer");
    let sdp = resp.jsep.sdp;

    // TODO: Hack to get video working on Chrome for Android. https://groups.google.com/forum/#!topic/mozilla.dev.media/Ye29vuMTpo8
    if (navigator.userAgent.indexOf("Android") === -1) {
      sdp = sdp.replace(
        "a=rtcp-fb:107 goog-remb\r\n",
        "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\n"
      );
    } else {
      sdp = sdp.replace(
        "a=rtcp-fb:107 goog-remb\r\n",
        "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\n"
      );
    }

    resp.jsep.sdp = sdp;

    debug("sub sending answer and setting remote/local description");
    await Promise.all([
      peerConnection.setRemoteDescription(resp.jsep),
      peerConnection
        .createAnswer()
        .then(answer =>
          Promise.all([
            peerConnection.setLocalDescription(answer),
            handle.sendJsep(answer)
          ])
        )
    ]);

    debug("sub waiting for webrtcup");
    await this.getWebRtcUpPromise(handle.id).promise;

    // Get the occupant's audio stream.
    var streams = peerConnection.getRemoteStreams();
    var mediaStream = streams.length > 0 ? streams[0] : null;

    debug("subscriber ready");
    return {
      handle,
      mediaStream,
      peerConnection
    };
  }

  sendJoin(handle, roomId, userId, subscribe) {
    return handle.sendMessage({
      kind: "join",
      room_id: roomId,
      user_id: userId,
      subscribe
    });
  }

  onDataChannelMessage(event) {
    var message = JSON.parse(event.data);

    if (message.dataType) {
      this.onOccupantMessage(null, message.dataType, message.data);
    }
  }

  shouldStartConnectionTo(clientId) {
    return true;
  }

  startStreamConnection(clientId) {}

  closeStreamConnection(clientId) {}

  getConnectStatus(clientId) {
    if (this.occupants[clientId]) {
      return NAF.adapters.IS_CONNECTED;
    } else {
      return NAF.adapters.NOT_CONNECTED;
    }
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
