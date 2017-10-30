var mj = require("minijanus");

const ContentKind = {
  Audio: 1,
  Video: 2,
  Data: 4
};

function randomUint() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function waitForEvent(target, event) {
  return new Promise((resolve, reject) => {
    target.addEventListener(event, e => resolve(e), { once: true });
  });
}

async function getMicrophone() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true
    });
  } catch (e) {
    if (e.name === "NotAllowedError") {
      console.warn("Microphone access not allowed.");
    } else {
      console.error(e);
    }
  }
}

const PEER_CONNECTION_CONFIG = {
  iceServers: [
    { url: "stun:stun1.l.google.com:19302" },
    { url: "stun:stun2.l.google.com:19302" }
  ]
};

class JanusAdapter {
  constructor() {
    this.room = null;
    this.userId = randomUint();

    this.serverUrl = null;
    this.ws = null;
    this.session = null;

    this.publisher = null;
    this.occupants = {};
    this.occupantPromises = {};

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

  setWebRtcOptions(options) {}

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
    var publisherPromise = this.createPublisher();
    this.occupantPromises[this.userId] = publisherPromise;
    this.publisher = await publisherPromise;

    this.connectSuccess(this.userId);

    // Add all of the initial occupants.
    for (let occupantId of this.publisher.initialOccupants) {
      if (occupantId !== this.userId) {
        this.occupantPromises[occupantId] = this.addOccupant(occupantId);
      }
    }
  }

  onWebsocketMessage(event) {
    var message = JSON.parse(event.data);
    this.session.receive(message);

    // Handle all of the join and leave events from the publisher.
    if (message.plugindata && message.plugindata.data) {
      var data = message.plugindata.data;

      if (data.event === "join") {
        this.occupantPromises[data.user_id] = this.addOccupant(data.user_id);
      } else if (data.event && data.event === "leave") {
        this.removeOccupant(data.user_id);
      }
    }
  }

  async addOccupant(occupantId) {
    var subscriber = await this.createSubscriber(occupantId);
    // Call the Networked AFrame callbacks for the new occupant.
    this.onOccupantConnected(occupantId);
    this.occupants[occupantId] = true;
    this.onOccupantsChanged(this.occupants);
    return subscriber;
  }

  removeOccupant(occupantId) {
    if (this.occupants[occupantId]) {
      delete this.occupants[occupantId];
      // Call the Networked AFrame callbacks for the removed occupant.
      this.onOccupantDisconnected(occupantId);
      this.onOccupantsChanged(this.occupants);
    }
  }

  async createPublisher() {
    var handle = new mj.JanusPluginHandle(this.session);
    await handle.attach("janus.plugin.sfu");

    var peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    peerConnection.addEventListener("icecandidate", event => {
      handle.sendTrickle(event.candidate);
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

    var mediaStream = await getMicrophone();

    if (mediaStream) {
      peerConnection.addStream(mediaStream);
    }

    var offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    var answer = await handle.sendJsep(offer);
    await peerConnection.setRemoteDescription(answer.jsep);

    // Wait for the reliable datachannel to be open before we start sending messages on it.
    await waitForEvent(reliableChannel, "open");

    // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
    var message = await this.sendJoin(handle, this.room, this.userId, true);

    var initialOccupants = message.plugindata.data.response.user_ids;

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
    await handle.attach("janus.plugin.sfu");

    var peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

    peerConnection.addEventListener("icecandidate", event => {
      handle.sendTrickle(event.candidate);
    });

    var offer = await peerConnection.createOffer({
      offerToReceiveAudio: true
    });

    await peerConnection.setLocalDescription(offer);
    var answer = await handle.sendJsep(offer);
    await peerConnection.setRemoteDescription(answer.jsep);

    // Send join message to janus. Don't listen for join/leave messages. Subscribe to the occupant's audio stream.
    await this.sendJoin(handle, this.room, this.userId, false, [
      {
        publisher_id: occupantId,
        content_kind: ContentKind.Audio
      }
    ]);

    // Get the occupant's audio stream.
    var streams = peerConnection.getRemoteStreams();
    var mediaStream = streams.length > 0 ? streams[0] : null;

    return {
      handle,
      mediaStream,
      peerConnection
    };
  }

  sendJoin(handle, roomId, userId, notify, specs) {
    return handle.sendMessage({
      kind: "join",
      room_id: roomId,
      user_id: userId,
      notify,
      subscription_specs: specs
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
    var occupantPromise = this.occupantPromises[clientId];

    if (!occupantPromise) {
      throw new Error(`Subscriber for client: ${clientId} does not exist.`);
    }

    return occupantPromise.then(s => s.mediaStream);
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
