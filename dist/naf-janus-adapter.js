/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var mj = __webpack_require__(1);
var debug = __webpack_require__(2)("naf-janus-adapter:debug");
var codecDetect = __webpack_require__(6);

function randomUint() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function waitForEvent(target, event) {
  return new Promise((resolve, reject) => {
    target.addEventListener(event, e => resolve(e), { once: true });
  });
}

const PEER_CONNECTION_CONFIG = {
  iceServers: [{ urls: "stun:stun1.l.google.com:19302" }, { urls: "stun:stun2.l.google.com:19302" }]
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

    this.timeOffsets = [];
    this.serverTimeRequests = 0;
    this.avgTimeOffset = 0;

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

  onWebsocketOpen() {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this.updateTimeOffset();

      // Create the Janus Session
      yield _this.session.create();

      // Attach the SFU Plugin and create a RTCPeerConnection for the publisher.
      // The publisher sends audio and opens two bidirectional data channels.
      // One reliable datachannel and one unreliable.
      _this.publisher = yield _this.createPublisher();

      _this.mediaStreams[_this.userId] = _this.publisher.mediaStream;

      // Resolve the promise for the user's media stream if it exists.
      if (_this.pendingMediaRequests.has(_this.userId)) {
        _this.pendingMediaRequests.get(_this.userId).resolve(_this.publisher.mediaStream);
      }

      // Add all of the initial occupants.
      for (let occupantId of _this.publisher.initialOccupants) {
        if (occupantId !== _this.userId) {
          _this.addOccupant(occupantId);
        }
      }
    })();
  }

  onWebsocketMessage(event) {
    var message = JSON.parse(event.data);
    this.session.receive(message);

    // Handle all of the join and leave events from the publisher.
    if (message.plugindata && message.plugindata.data) {
      var data = message.plugindata.data;
      if (data.event === "join" && data.room_id === this.room) {
        this.addOccupant(data.user_id);
      } else if (data.event && data.event === "leave" && data.room_id === this.room) {
        this.removeOccupant(data.user_id);
      }
    }

    if (message.janus && message.janus === "webrtcup") {
      this.getWebRtcUpPromise(message.sender).resolve();
    }
  }

  addOccupant(occupantId) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var subscriber = yield _this2.createSubscriber(occupantId);

      _this2.occupants[occupantId] = true;
      _this2.occupantPeerConnections[occupantId] = subscriber.peerConnection;
      _this2.mediaStreams[occupantId] = subscriber.mediaStream;

      // Resolve the promise for the user's media stream if it exists.
      if (_this2.pendingMediaRequests.has(occupantId)) {
        _this2.pendingMediaRequests.get(occupantId).resolve(subscriber.mediaStream);
      }

      // Call the Networked AFrame callbacks for the new occupant.
      _this2.onOccupantConnected(occupantId);
      _this2.onOccupantsChanged(_this2.occupants);

      return subscriber;
    })();
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
        this.pendingMediaRequests.get(occupantId).reject("The user disconnected before the media stream was resolved.");
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

  createPublisher() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      var handle = new mj.JanusPluginHandle(_this3.session);
      debug("pub waiting for sfu");
      yield handle.attach("janus.plugin.sfu");

      var peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

      peerConnection.addEventListener("icecandidate", function (event) {
        handle.sendTrickle(event.candidate || null);
      });

      // Create an unreliable datachannel for sending and receiving component updates, etc.
      var unreliableChannel = peerConnection.createDataChannel("unreliable", {
        ordered: false,
        maxRetransmits: 0
      });
      unreliableChannel.addEventListener("message", _this3.onDataChannelMessage);

      // Create a reliable datachannel for sending and recieving entity instantiations, etc.
      var reliableChannel = peerConnection.createDataChannel("reliable", {
        ordered: true
      });
      reliableChannel.addEventListener("message", _this3.onDataChannelMessage);

      var mediaStream;
      // @TODO either this should wait or setLocalMediaStream should renegotiate (or both)
      if (_this3.localMediaStream) {
        mediaStream = _this3.localMediaStream;
        peerConnection.addStream(_this3.localMediaStream);
      } else {
        console.warn("localMediaStream not set. Will not publish audio or video");
      }

      debug("pub waiting for offer");
      var offer = yield peerConnection.createOffer();

      debug("pub waiting for local/remote descriptions");

      yield Promise.all([peerConnection.setLocalDescription(offer), handle.sendJsep(offer).then(function ({ jsep }) {
        return peerConnection.setRemoteDescription(jsep);
      })]);

      debug("pub waiting for webrtcup");
      yield _this3.getWebRtcUpPromise(handle.id).promise;

      if (reliableChannel.readyState !== "open") {
        debug("pub waiting for channel to open");
        // Wait for the reliable datachannel to be open before we start sending messages on it.
        yield waitForEvent(reliableChannel, "open");
      }

      // Call the naf connectSuccess callback before we start receiving WebRTC messages.
      _this3.connectSuccess(_this3.userId);

      debug("pub waiting for join");
      // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
      var message = yield _this3.sendJoin(handle, _this3.room, _this3.userId, {
        notifications: true,
        data: true
      });

      var initialOccupants = message.plugindata.data.response.users[_this3.room] || [];

      debug("publisher ready");
      return {
        handle,
        initialOccupants,
        reliableChannel,
        unreliableChannel,
        mediaStream,
        peerConnection
      };
    })();
  }

  createSubscriber(occupantId) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      var handle = new mj.JanusPluginHandle(_this4.session);
      debug("sub waiting for sfu");
      yield handle.attach("janus.plugin.sfu");

      var peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

      peerConnection.addEventListener("icecandidate", function (event) {
        handle.sendTrickle(event.candidate || null);
      });

      debug("sub waiting for join");
      // Send join message to janus. Don't listen for join/leave messages. Subscribe to the occupant's audio stream.
      const resp = yield _this4.sendJoin(handle, _this4.room, _this4.userId, {
        notifications: false,
        media: occupantId
      });

      debug("sub waiting for answer");
      let sdp = resp.jsep.sdp;

      const h246Support = codecDetect.isH264VideoSupported();
      if (h246Support === 'probably' || h246Support === 'maybe') {
        // TODO: Hack to get video working on Chrome for Android. https://groups.google.com/forum/#!topic/mozilla.dev.media/Ye29vuMTpo8
        if (navigator.userAgent.indexOf("Android") === -1) {
          sdp = sdp.replace("a=rtcp-fb:107 goog-remb\r\n", "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\n");
        } else {
          sdp = sdp.replace("a=rtcp-fb:107 goog-remb\r\n", "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\n");
        }
      }

      resp.jsep.sdp = sdp;

      debug("sub sending answer and setting remote/local description");
      yield Promise.all([peerConnection.setRemoteDescription(resp.jsep), peerConnection.createAnswer().then(function (answer) {
        return Promise.all([peerConnection.setLocalDescription(answer), handle.sendJsep(answer)]);
      })]);

      debug("sub waiting for webrtcup");
      yield _this4.getWebRtcUpPromise(handle.id).promise;

      // Get the occupant's audio stream.
      var streams = peerConnection.getRemoteStreams();
      var mediaStream = streams.length > 0 ? streams[0] : null;

      debug("subscriber ready");
      return {
        handle,
        mediaStream,
        peerConnection
      };
    })();
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

  updateTimeOffset() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const clientSentTime = Date.now() + _this5.avgTimeOffset;

      const res = yield fetch(document.location.href, {
        method: "HEAD",
        cache: "no-cache"
      });

      const precision = 1000;
      const serverReceivedTime = new Date(res.headers.get("Date")).getTime() + precision / 2;
      const clientReceivedTime = Date.now();
      const serverTime = serverReceivedTime + (clientReceivedTime - clientSentTime) / 2;
      const timeOffset = serverTime - clientReceivedTime;

      _this5.serverTimeRequests++;

      if (_this5.serverTimeRequests <= 10) {
        _this5.timeOffsets.push(timeOffset);
      } else {
        _this5.timeOffsets[_this5.serverTimeRequests % 10] = timeOffset;
      }

      _this5.avgTimeOffset = _this5.timeOffsets.reduce(function (acc, offset) {
        return acc += offset;
      }, 0) / _this5.timeOffsets.length;

      if (_this5.serverTimeRequests > 10) {
        setTimeout(function () {
          return _this5.updateTimeOffset();
        }, 5 * 60 * 1000); // Sync clock every 5 minutes.
      } else {
        _this5.updateTimeOffset();
      }
    })();
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

  setLocalMediaStream(stream) {
    if (this.publisher) {
      console.warn("setLocalMediaStream called after publisher created. Will not publish new stream.");
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
    this.publisher.unreliableChannel.send(JSON.stringify({ clientId, dataType, data }));
  }

  sendDataGuaranteed(clientId, dataType, data) {
    this.publisher.reliableChannel.send(JSON.stringify({ clientId, dataType, data }));
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

/***/ }),
/* 1 */
/***/ (function(module, exports) {

/** Whether to log information about incoming and outgoing Janus signals. **/
var verbose = false;

/**
 * Represents a handle to a single Janus plugin on a Janus session. Each WebRTC connection to the Janus server will be
 * associated with a single handle. Once attached to the server, this handle will be given a unique ID which should be
 * used to associate it with future signalling messages.
 *
 * See https://janus.conf.meetecho.com/docs/rest.html#handles.
 **/
function JanusPluginHandle(session) {
  this.session = session;
  this.id = undefined;
}

/** Attaches this handle to the Janus server and sets its ID. **/
JanusPluginHandle.prototype.attach = function(plugin) {
  var payload = { janus: "attach", plugin: plugin, "force-bundle": true, "force-rtcp-mux": true };
  return this.session.send(payload).then(resp => {
    this.id = resp.data.id;
    return resp;
  });
};

/** Detaches this handle. **/
JanusPluginHandle.prototype.detach = function() {
  return this.send({ janus: "detach" });
};

/**
 * Sends a signal associated with this handle. Signals should be JSON-serializable objects. Returns a promise that will
 * be resolved or rejected when a response to this signal is received, or when no response is received within the
 * session timeout.
 **/
JanusPluginHandle.prototype.send = function(signal) {
  return this.session.send(Object.assign({ handle_id: this.id }, signal));
};

/** Sends a plugin-specific message associated with this handle. **/
JanusPluginHandle.prototype.sendMessage = function(body) {
  return this.send({ janus: "message", body: body });
};

/** Sends a JSEP offer or answer associated with this handle. **/
JanusPluginHandle.prototype.sendJsep = function(jsep) {
  return this.send({ janus: "message", body: {}, jsep: jsep });
};

/** Sends an ICE trickle candidate associated with this handle. **/
JanusPluginHandle.prototype.sendTrickle = function(candidate) {
  return this.send({ janus: "trickle",  candidate: candidate });
};

/**
 * Represents a Janus session -- a Janus context from within which you can open multiple handles and connections. Once
 * created, this session will be given a unique ID which should be used to associate it with future signalling messages.
 *
 * See https://janus.conf.meetecho.com/docs/rest.html#sessions.
 **/
function JanusSession(output, options) {
  this.output = output;
  this.id = undefined;
  this.nextTxId = 0;
  this.txns = {};
  this.options = options || {
    timeoutMs: 10000,
    keepaliveMs: 30000
  };
}

/** Creates this session on the Janus server and sets its ID. **/
JanusSession.prototype.create = function() {
  return this.send({ janus: "create" }).then(resp => {
    this.id = resp.data.id;
    return resp;
  });
};

/** Destroys this session. **/
JanusSession.prototype.destroy = function() {
  return this.send({ janus: "destroy" });
};

/**
 * Whether this signal represents an error, and the associated promise (if any) should be rejected.
 * Users should override this to handle any custom plugin-specific error conventions.
 **/
JanusSession.prototype.isError = function(signal) {
  return signal.janus === "error";
};

/**
 * Callback for receiving JSON signalling messages pertinent to this session. If the signals are responses to previously
 * sent signals, the promises for the outgoing signals will be resolved or rejected appropriately with this signal as an
 * argument.
 *
 * External callers should call this function every time a new signal arrives on the transport; for example, in a
 * WebSocket's `message` event, or when a new datum shows up in an HTTP long-polling response.
 **/
JanusSession.prototype.receive = function(signal) {
  if (module.exports.verbose) {
    console.debug("Incoming Janus signal: ", signal);
  }
  if (signal.transaction != null) {
    var handlers = this.txns[signal.transaction];
    if (signal.janus === "ack" && signal.hint) {
      // this is an ack of an asynchronously-processed request, we should wait
      // to resolve the promise until the actual response comes in
    } else if (handlers != null) {
      if (handlers.timeout != null) {
        clearTimeout(handlers.timeout);
      }
      delete this.txns[signal.transaction];
      (this.isError(signal) ? handlers.reject : handlers.resolve)(signal);
    }
  }
};

/**
 * Sends a signal associated with this session. Signals should be JSON-serializable objects. Returns a promise that will
 * be resolved or rejected when a response to this signal is received, or when no response is received within the
 * session timeout.
 **/
JanusSession.prototype.send = function(signal) {
  if (this.id != null) { // this.id is undefined in the special case when we're sending the session create message
    signal = Object.assign({ session_id: this.id }, signal);
  }
  signal = Object.assign({ transaction: (this.nextTxId++).toString() }, signal);
  if (module.exports.verbose) {
    console.debug("Outgoing Janus signal: ", signal);
  }
  return new Promise((resolve, reject) => {
    var timeout = null;
    if (this.options.timeoutMs) {
      timeout = setTimeout(() => {
        delete this.txns[signal.transaction];
        reject(new Error("Signalling message timed out."));
      }, this.options.timeoutMs);
    }
    this.txns[signal.transaction] = { resolve: resolve, reject: reject, timeout: timeout };
    this.output(JSON.stringify(signal));
    this._resetKeepalive();
  });
};

JanusSession.prototype._resetKeepalive = function() {
  if (this.keepaliveTimeout) {
    clearTimeout(this.keepaliveTimeout);
  }
  if (this.options.keepaliveMs) {
    this.keepaliveTimeout = setTimeout(() => this._keepalive(), this.options.keepaliveMs);
  }
};

JanusSession.prototype._keepalive = function() {
  return this.send({ janus: "keepalive" });
};

module.exports = {
  JanusPluginHandle,
  JanusSession,
  verbose
};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(4);
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC',
  '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',
  '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC',
  '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',
  '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC',
  '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',
  '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366',
  '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933',
  '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC',
  '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
  '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // Internet Explorer and Edge do not support colors.
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = __webpack_require__(5);

/**
 * Active `debug` instances.
 */
exports.instances = [];

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  var prevTime;

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);
  debug.destroy = destroy;

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  exports.instances.push(debug);

  return debug;
}

function destroy () {
  var index = exports.instances.indexOf(this);
  if (index !== -1) {
    exports.instances.splice(index, 1);
    return true;
  } else {
    return false;
  }
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var i;
  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }

  for (i = 0; i < exports.instances.length; i++) {
    var instance = exports.instances[i];
    instance.enabled = exports.enabled(instance.namespace);
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  if (name[name.length - 1] === '*') {
    return true;
  }
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}


/***/ }),
/* 5 */
/***/ (function(module, exports) {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}


/***/ }),
/* 6 */
/***/ (function(module, exports) {

var CodecDetect = CodecDetect || (function CodecDetectIIFE() {

  // constants
  var Support = {
    PENDING: 'pending',
    PROBABLY: 'probably',
    MAYBE: 'maybe'
  };
  var Method = {
    OPTIMISTIC: 'optimistic',
    PESSIMISTIC: 'pessimistic',
    EXACT: 'exact'
  };

  // vars
  var _video;
  var _videoSupport = {
    mpeg4: Support.PENDING,
    h264: Support.PENDING,
    ogg: Support.PENDING,
    webm: Support.PENDING
  };
  var _audio;
  var _audioSupport = {
    mp3: Support.PENDING,
    aac: Support.PENDING,
    oggVorbis: Support.PENDING,
    oggOpus: Support.PENDING,
    webm: Support.PENDING,
    wave: Support.PENDING
  };

  // public api
  var cd = {
    // constants
    VERSION: '1.1.3',
    // properties
    method: Method.EXACT,
    // video methods
    getVideoSupport: getVideoSupport,
    isMPEG4VideoSupported: isMPEG4VideoSupported,
    isH264VideoSupported: isH264VideoSupported,
    isOGGVideoSupported: isOGGVideoSupported,
    isWEBMVideoSupported: isWEBMVideoSupported,
    // audio methods
    getAudioSupport: getAudioSupport,
    isMP3AudioSupported: isMP3AudioSupported,
    isAACAudioSupported: isAACAudioSupported,
    isOGGVorbisAudioSupported: isOGGVorbisAudioSupported,
    isOGGOpusAudioSupported: isOGGOpusAudioSupported,
    isWEBMAudioSupported: isWEBMAudioSupported,
    isWaveAudioSupported: isWaveAudioSupported
  };

  // auto initialization
  init();

  // return public api
  return cd;

  // private methods
  function init() {
    detectVideoSupport();
    detectAudioSupport();
  }

  function getVideoSupport() {
    return _videoSupport;
  }

  function isMPEG4VideoSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _videoSupport.mpeg4 !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _videoSupport.mpeg4 === true;
        break;

      default:
        isSupported = _videoSupport.mpeg4;
        break;
    }
    return isSupported;
  }

  function isH264VideoSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _videoSupport.h264 !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _videoSupport.h264 === true;
        break;

      default:
        isSupported = _videoSupport.h264;
        break;
    }
    return isSupported;
  }

  function isOGGVideoSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _videoSupport.ogg !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _videoSupport.ogg === true;
        break;

      default:
        isSupported = _videoSupport.ogg;
        break;
    }
    return isSupported;
  }

  function isWEBMVideoSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _videoSupport.webm !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _videoSupport.webm === true;
        break;

      default:
        isSupported = _videoSupport.webm;
        break;
    }
    return isSupported;
  }

  function detectVideoSupport() {
    // create a video element to use for testing
    _video = document.createElement('video');

    // get supported video codecs
    if (_video) {
      _videoSupport.mpeg4 = _video.canPlayType('video/mp4; codecs="mp4v.20.8"');
      _videoSupport.h264 = _video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
      _videoSupport.ogg = _video.canPlayType('video/ogg; codecs="theora"');
      _videoSupport.webm = _video.canPlayType('video/webm; codecs="vp8, vorbis"');
      convertEmptyStringsToFalse(_videoSupport);

    // video dom element couldn't be created, video is not supported
    } else {
      _videoSupport.mpeg4 = false;
      _videoSupport.h264 = false;
      _videoSupport.ogg = false;
      _videoSupport.webm = false;
    }

    // memory management
    _video = null;
  }

  function getAudioSupport() {
    return _audioSupport;
  }

  function isMP3AudioSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _audioSupport.mp3 !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _audioSupport.mp3 === true;
        break;

      case Method.EXACT:
        isSupported = _audioSupport.mp3;
        break;

      default:
        isSupported = _audioSupport.mp3;
        break;
    }
    return isSupported;
  }

  function isAACAudioSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _audioSupport.aac !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _audioSupport.aac === true;
        break;

      default:
        isSupported = _audioSupport.aac;
        break;
    }
    return isSupported;
  }

  function isOGGVorbisAudioSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _audioSupport.oggVorbis !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _audioSupport.oggVorbis === true;
        break;

      default:
        isSupported = _audioSupport.oggVorbis;
        break;
    }
    return isSupported;
  }

  function isOGGOpusAudioSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _audioSupport.oggOpus !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _audioSupport.oggOpus === true;
        break;

      default:
        isSupported = _audioSupport.oggOpus;
        break;
    }
    return isSupported;
  }

  function isWEBMAudioSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _audioSupport.webm !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _audioSupport.webm === true;
        break;

      default:
        isSupported = _audioSupport.webm;
        break;
    }
    return isSupported;
  }

  function isWaveAudioSupported() {
    var isSupported;
    switch (CodecDetect.method) {
      case Method.OPTIMISTIC:
        isSupported = _audioSupport.wave !== false;
        break;

      case Method.PESSIMISTIC:
        isSupported = _audioSupport.wave === true;
        break;

      default:
        isSupported = _audioSupport.wave;
        break;
    }
    return isSupported;
  }

  function detectAudioSupport() {
    // create a audio element to use for testing
    _audio = document.createElement('audio');

    // get supported audio codecs
    if (_audio) {
      _audioSupport.mp3 = _audio.canPlayType('audio/mpeg');
      _audioSupport.aac = _audio.canPlayType('audio/mp4; codecs="mp4a.40.2"');
      _audioSupport.oggVorbis = _audio.canPlayType('audio/ogg; codecs="vorbis"');
      _audioSupport.oggOpus = _audio.canPlayType('audio/ogg; codecs="opus"');
      _audioSupport.webm = _audio.canPlayType('audio/webm; codecs="vorbis"');
      _audioSupport.wave = _audio.canPlayType('audio/wav; codecs="1"');
      convertEmptyStringsToFalse(_audioSupport);

    // audio dom element couldn't be created, audio is not supported
    } else {
      _audioSupport.mp3 = false;
      _audioSupport.aac = false;
      _audioSupport.oggVorbis = false;
      _audioSupport.oggOpus = false;
      _audioSupport.webm = false;
      _audioSupport.wave = false;
    }

    // memory management
    _audio = null;
  }

  // utils
  function convertEmptyStringsToFalse(support) {
    // iterate through codecs, set as not supported if is empty string
    Object.keys(support).forEach(setAsFalseIfEmpty);

    // iterator method
    function setAsFalseIfEmpty(key) {
      if (support[key] === '') {
        support[key] = false;
      }
    }
  }

})();

module.exports = CodecDetect;


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMWFiN2JmNzY3M2E4NjRkYzZhOGEiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvYnJvd3Nlci5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvZGVidWcuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9jb2RlYy1kZXRlY3Qvc3JjL2NvZGVjLWRldGVjdC5qcyJdLCJuYW1lcyI6WyJtaiIsInJlcXVpcmUiLCJkZWJ1ZyIsImNvZGVjRGV0ZWN0IiwicmFuZG9tVWludCIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJ3YWl0Rm9yRXZlbnQiLCJ0YXJnZXQiLCJldmVudCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJvbmNlIiwiUEVFUl9DT05ORUNUSU9OX0NPTkZJRyIsImljZVNlcnZlcnMiLCJ1cmxzIiwiSmFudXNBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyb29tIiwidXNlcklkIiwic2VydmVyVXJsIiwid2ViUnRjT3B0aW9ucyIsIndzIiwic2Vzc2lvbiIsInB1Ymxpc2hlciIsIm9jY3VwYW50cyIsIm9jY3VwYW50UGVlckNvbm5lY3Rpb25zIiwibWVkaWFTdHJlYW1zIiwicGVuZGluZ01lZGlhUmVxdWVzdHMiLCJNYXAiLCJ0aW1lT2Zmc2V0cyIsInNlcnZlclRpbWVSZXF1ZXN0cyIsImF2Z1RpbWVPZmZzZXQiLCJvbldlYnNvY2tldE1lc3NhZ2UiLCJiaW5kIiwib25EYXRhQ2hhbm5lbE1lc3NhZ2UiLCJ3ZWJSdGNVcFByb21pc2VzIiwic2V0U2VydmVyVXJsIiwidXJsIiwic2V0QXBwIiwiYXBwIiwic2V0Um9vbSIsInJvb21OYW1lIiwicGFyc2VJbnQiLCJFcnJvciIsInNldFdlYlJ0Y09wdGlvbnMiLCJvcHRpb25zIiwic2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyIsInN1Y2Nlc3NMaXN0ZW5lciIsImZhaWx1cmVMaXN0ZW5lciIsImNvbm5lY3RTdWNjZXNzIiwiY29ubmVjdEZhaWx1cmUiLCJzZXRSb29tT2NjdXBhbnRMaXN0ZW5lciIsIm9jY3VwYW50TGlzdGVuZXIiLCJvbk9jY3VwYW50c0NoYW5nZWQiLCJzZXREYXRhQ2hhbm5lbExpc3RlbmVycyIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwib25PY2N1cGFudENvbm5lY3RlZCIsIm9uT2NjdXBhbnREaXNjb25uZWN0ZWQiLCJvbk9jY3VwYW50TWVzc2FnZSIsImNvbm5lY3QiLCJXZWJTb2NrZXQiLCJKYW51c1Nlc3Npb24iLCJzZW5kIiwiXyIsIm9uV2Vic29ja2V0T3BlbiIsInVwZGF0ZVRpbWVPZmZzZXQiLCJjcmVhdGUiLCJjcmVhdGVQdWJsaXNoZXIiLCJtZWRpYVN0cmVhbSIsImhhcyIsImdldCIsIm9jY3VwYW50SWQiLCJpbml0aWFsT2NjdXBhbnRzIiwiYWRkT2NjdXBhbnQiLCJtZXNzYWdlIiwiSlNPTiIsInBhcnNlIiwiZGF0YSIsInJlY2VpdmUiLCJwbHVnaW5kYXRhIiwicm9vbV9pZCIsInVzZXJfaWQiLCJyZW1vdmVPY2N1cGFudCIsImphbnVzIiwiZ2V0V2ViUnRjVXBQcm9taXNlIiwic2VuZGVyIiwic3Vic2NyaWJlciIsImNyZWF0ZVN1YnNjcmliZXIiLCJwZWVyQ29ubmVjdGlvbiIsImNsb3NlIiwiZGVsZXRlIiwiaWQiLCJwcm9taXNlIiwic2V0IiwiaGFuZGxlIiwiSmFudXNQbHVnaW5IYW5kbGUiLCJhdHRhY2giLCJSVENQZWVyQ29ubmVjdGlvbiIsInNlbmRUcmlja2xlIiwiY2FuZGlkYXRlIiwidW5yZWxpYWJsZUNoYW5uZWwiLCJjcmVhdGVEYXRhQ2hhbm5lbCIsIm9yZGVyZWQiLCJtYXhSZXRyYW5zbWl0cyIsInJlbGlhYmxlQ2hhbm5lbCIsImxvY2FsTWVkaWFTdHJlYW0iLCJhZGRTdHJlYW0iLCJjb25zb2xlIiwid2FybiIsIm9mZmVyIiwiY3JlYXRlT2ZmZXIiLCJhbGwiLCJzZXRMb2NhbERlc2NyaXB0aW9uIiwic2VuZEpzZXAiLCJ0aGVuIiwianNlcCIsInNldFJlbW90ZURlc2NyaXB0aW9uIiwicmVhZHlTdGF0ZSIsInNlbmRKb2luIiwibm90aWZpY2F0aW9ucyIsInJlc3BvbnNlIiwidXNlcnMiLCJyZXNwIiwibWVkaWEiLCJzZHAiLCJoMjQ2U3VwcG9ydCIsImlzSDI2NFZpZGVvU3VwcG9ydGVkIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiaW5kZXhPZiIsInJlcGxhY2UiLCJjcmVhdGVBbnN3ZXIiLCJhbnN3ZXIiLCJzdHJlYW1zIiwiZ2V0UmVtb3RlU3RyZWFtcyIsImxlbmd0aCIsInJvb21JZCIsInN1YnNjcmliZSIsInNlbmRNZXNzYWdlIiwia2luZCIsImRhdGFUeXBlIiwic2hvdWxkU3RhcnRDb25uZWN0aW9uVG8iLCJjbGllbnRJZCIsInN0YXJ0U3RyZWFtQ29ubmVjdGlvbiIsImNsb3NlU3RyZWFtQ29ubmVjdGlvbiIsImdldENvbm5lY3RTdGF0dXMiLCJOQUYiLCJhZGFwdGVycyIsIklTX0NPTk5FQ1RFRCIsIk5PVF9DT05ORUNURUQiLCJjbGllbnRTZW50VGltZSIsIkRhdGUiLCJub3ciLCJyZXMiLCJmZXRjaCIsImRvY3VtZW50IiwibG9jYXRpb24iLCJocmVmIiwibWV0aG9kIiwiY2FjaGUiLCJwcmVjaXNpb24iLCJzZXJ2ZXJSZWNlaXZlZFRpbWUiLCJoZWFkZXJzIiwiZ2V0VGltZSIsImNsaWVudFJlY2VpdmVkVGltZSIsInNlcnZlclRpbWUiLCJ0aW1lT2Zmc2V0IiwicHVzaCIsInJlZHVjZSIsImFjYyIsIm9mZnNldCIsInNldFRpbWVvdXQiLCJnZXRTZXJ2ZXJUaW1lIiwiZ2V0TWVkaWFTdHJlYW0iLCJzZXRMb2NhbE1lZGlhU3RyZWFtIiwic3RyZWFtIiwiZW5hYmxlTWljcm9waG9uZSIsImVuYWJsZWQiLCJhdWRpb1RyYWNrcyIsImdldEF1ZGlvVHJhY2tzIiwic2VuZERhdGEiLCJzdHJpbmdpZnkiLCJzZW5kRGF0YUd1YXJhbnRlZWQiLCJicm9hZGNhc3REYXRhIiwiYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQiLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7O0FDN0RBLElBQUlBLEtBQUssbUJBQUFDLENBQVEsQ0FBUixDQUFUO0FBQ0EsSUFBSUMsUUFBUSxtQkFBQUQsQ0FBUSxDQUFSLEVBQWlCLHlCQUFqQixDQUFaO0FBQ0EsSUFBSUUsY0FBYyxtQkFBQUYsQ0FBUSxDQUFSLENBQWxCOztBQUVBLFNBQVNHLFVBQVQsR0FBc0I7QUFDcEIsU0FBT0MsS0FBS0MsS0FBTCxDQUFXRCxLQUFLRSxNQUFMLEtBQWdCQyxPQUFPQyxnQkFBbEMsQ0FBUDtBQUNEOztBQUVELFNBQVNDLFlBQVQsQ0FBc0JDLE1BQXRCLEVBQThCQyxLQUE5QixFQUFxQztBQUNuQyxTQUFPLElBQUlD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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEIsNEJBQTRCLHNCQUFzQjtBQUNsRDtBQUNBLDBCQUEwQiw0Q0FBNEM7QUFDdEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQixxQkFBcUI7QUFDekM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBWSxPQUFPO0FBQ25CO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOzs7Ozs7OztBQ2xNQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLHNCQUFzQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEscUNBQXFDOztBQUVyQztBQUNBO0FBQ0E7O0FBRUEsMkJBQTJCO0FBQzNCO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixVQUFVOzs7Ozs7OztBQ3RMdEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEIsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsY0FBYztBQUNkOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFlBQVk7QUFDWjtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsbUJBQW1CLGlCQUFpQjtBQUNwQztBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsYUFBYSxTQUFTO0FBQ3RCLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBLGFBQWEsOEJBQThCO0FBQzNDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQixZQUFZO0FBQ1o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDLFNBQVM7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUMsU0FBUztBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDaE9BO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxjQUFjO0FBQ3pCLFdBQVcsT0FBTztBQUNsQixZQUFZLE1BQU07QUFDbEIsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEIsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEIsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ3ZKQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDBEQUEwRDtBQUMxRCx5REFBeUQ7QUFDekQsd0RBQXdEO0FBQ3hELDBEQUEwRDtBQUMxRDs7QUFFQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx3REFBd0Q7QUFDeEQsOERBQThEO0FBQzlELDREQUE0RDtBQUM1RCwwREFBMEQ7QUFDMUQseURBQXlEO0FBQ3pEOztBQUVBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxDQUFDOztBQUVEIiwiZmlsZSI6Im5hZi1qYW51cy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMWFiN2JmNzY3M2E4NjRkYzZhOGEiLCJ2YXIgbWogPSByZXF1aXJlKFwibWluaWphbnVzXCIpO1xudmFyIGRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwibmFmLWphbnVzLWFkYXB0ZXI6ZGVidWdcIik7XG52YXIgY29kZWNEZXRlY3QgPSByZXF1aXJlKFwiY29kZWMtZGV0ZWN0XCIpO1xuXG5mdW5jdGlvbiByYW5kb21VaW50KCkge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpO1xufVxuXG5mdW5jdGlvbiB3YWl0Rm9yRXZlbnQodGFyZ2V0LCBldmVudCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBlID0+IHJlc29sdmUoZSksIHsgb25jZTogdHJ1ZSB9KTtcbiAgfSk7XG59XG5cbmNvbnN0IFBFRVJfQ09OTkVDVElPTl9DT05GSUcgPSB7XG4gIGljZVNlcnZlcnM6IFtcbiAgICB7IHVybHM6IFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICAgIHsgdXJsczogXCJzdHVuOnN0dW4yLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH1cbiAgXVxufTtcblxuY2xhc3MgSmFudXNBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5yb29tID0gbnVsbDtcbiAgICB0aGlzLnVzZXJJZCA9IHJhbmRvbVVpbnQoKTtcblxuICAgIHRoaXMuc2VydmVyVXJsID0gbnVsbDtcbiAgICB0aGlzLndlYlJ0Y09wdGlvbnMgPSB7fTtcbiAgICB0aGlzLndzID0gbnVsbDtcbiAgICB0aGlzLnNlc3Npb24gPSBudWxsO1xuXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBudWxsO1xuICAgIHRoaXMub2NjdXBhbnRzID0ge307XG4gICAgdGhpcy5vY2N1cGFudFBlZXJDb25uZWN0aW9ucyA9IHt9O1xuICAgIHRoaXMubWVkaWFTdHJlYW1zID0ge307XG4gICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cyA9IG5ldyBNYXAoKTtcblxuICAgIHRoaXMudGltZU9mZnNldHMgPSBbXTtcbiAgICB0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyA9IDA7XG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gMDtcblxuICAgIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlID0gdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlID0gdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy53ZWJSdGNVcFByb21pc2VzID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgc2V0U2VydmVyVXJsKHVybCkge1xuICAgIHRoaXMuc2VydmVyVXJsID0gdXJsO1xuICB9XG5cbiAgc2V0QXBwKGFwcCkge31cblxuICBzZXRSb29tKHJvb21OYW1lKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucm9vbSA9IHBhcnNlSW50KHJvb21OYW1lKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSb29tIG11c3QgYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyLlwiKTtcbiAgICB9XG4gIH1cblxuICBzZXRXZWJSdGNPcHRpb25zKG9wdGlvbnMpIHtcbiAgICB0aGlzLndlYlJ0Y09wdGlvbnMgPSBvcHRpb25zO1xuICB9XG5cbiAgc2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyhzdWNjZXNzTGlzdGVuZXIsIGZhaWx1cmVMaXN0ZW5lcikge1xuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcbiAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCA9IG9jY3VwYW50TGlzdGVuZXI7XG4gIH1cblxuICBzZXREYXRhQ2hhbm5lbExpc3RlbmVycyhvcGVuTGlzdGVuZXIsIGNsb3NlZExpc3RlbmVyLCBtZXNzYWdlTGlzdGVuZXIpIHtcbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQgPSBvcGVuTGlzdGVuZXI7XG4gICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkID0gY2xvc2VkTGlzdGVuZXI7XG4gICAgdGhpcy5vbk9jY3VwYW50TWVzc2FnZSA9IG1lc3NhZ2VMaXN0ZW5lcjtcbiAgfVxuXG4gIGNvbm5lY3QoKSB7XG4gICAgZGVidWcoYGNvbm5lY3RpbmcgdG8gJHt0aGlzLnNlcnZlclVybH1gKTtcbiAgICB0aGlzLndzID0gbmV3IFdlYlNvY2tldCh0aGlzLnNlcnZlclVybCwgXCJqYW51cy1wcm90b2NvbFwiKTtcbiAgICB0aGlzLnNlc3Npb24gPSBuZXcgbWouSmFudXNTZXNzaW9uKHRoaXMud3Muc2VuZC5iaW5kKHRoaXMud3MpKTtcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsIF8gPT4gdGhpcy5vbldlYnNvY2tldE9wZW4oKSk7XG4gICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBvbldlYnNvY2tldE9wZW4oKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGVUaW1lT2Zmc2V0KCk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIEphbnVzIFNlc3Npb25cbiAgICBhd2FpdCB0aGlzLnNlc3Npb24uY3JlYXRlKCk7XG5cbiAgICAvLyBBdHRhY2ggdGhlIFNGVSBQbHVnaW4gYW5kIGNyZWF0ZSBhIFJUQ1BlZXJDb25uZWN0aW9uIGZvciB0aGUgcHVibGlzaGVyLlxuICAgIC8vIFRoZSBwdWJsaXNoZXIgc2VuZHMgYXVkaW8gYW5kIG9wZW5zIHR3byBiaWRpcmVjdGlvbmFsIGRhdGEgY2hhbm5lbHMuXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cbiAgICB0aGlzLnB1Ymxpc2hlciA9IGF3YWl0IHRoaXMuY3JlYXRlUHVibGlzaGVyKCk7XG5cbiAgICB0aGlzLm1lZGlhU3RyZWFtc1t0aGlzLnVzZXJJZF0gPSB0aGlzLnB1Ymxpc2hlci5tZWRpYVN0cmVhbTtcblxuICAgIC8vIFJlc29sdmUgdGhlIHByb21pc2UgZm9yIHRoZSB1c2VyJ3MgbWVkaWEgc3RyZWFtIGlmIGl0IGV4aXN0cy5cbiAgICBpZiAodGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5oYXModGhpcy51c2VySWQpKSB7XG4gICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzXG4gICAgICAgIC5nZXQodGhpcy51c2VySWQpXG4gICAgICAgIC5yZXNvbHZlKHRoaXMucHVibGlzaGVyLm1lZGlhU3RyZWFtKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgYWxsIG9mIHRoZSBpbml0aWFsIG9jY3VwYW50cy5cbiAgICBmb3IgKGxldCBvY2N1cGFudElkIG9mIHRoaXMucHVibGlzaGVyLmluaXRpYWxPY2N1cGFudHMpIHtcbiAgICAgIGlmIChvY2N1cGFudElkICE9PSB0aGlzLnVzZXJJZCkge1xuICAgICAgICB0aGlzLmFkZE9jY3VwYW50KG9jY3VwYW50SWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG9uV2Vic29ja2V0TWVzc2FnZShldmVudCkge1xuICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICB0aGlzLnNlc3Npb24ucmVjZWl2ZShtZXNzYWdlKTtcblxuICAgIC8vIEhhbmRsZSBhbGwgb2YgdGhlIGpvaW4gYW5kIGxlYXZlIGV2ZW50cyBmcm9tIHRoZSBwdWJsaXNoZXIuXG4gICAgaWYgKG1lc3NhZ2UucGx1Z2luZGF0YSAmJiBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YSkge1xuICAgICAgdmFyIGRhdGEgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YTtcbiAgICAgIGlmIChkYXRhLmV2ZW50ID09PSBcImpvaW5cIiAmJiBkYXRhLnJvb21faWQgPT09IHRoaXMucm9vbSkge1xuICAgICAgICB0aGlzLmFkZE9jY3VwYW50KGRhdGEudXNlcl9pZCk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBkYXRhLmV2ZW50ICYmXG4gICAgICAgIGRhdGEuZXZlbnQgPT09IFwibGVhdmVcIiAmJlxuICAgICAgICBkYXRhLnJvb21faWQgPT09IHRoaXMucm9vbVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlT2NjdXBhbnQoZGF0YS51c2VyX2lkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobWVzc2FnZS5qYW51cyAmJiBtZXNzYWdlLmphbnVzID09PSBcIndlYnJ0Y3VwXCIpIHtcbiAgICAgIHRoaXMuZ2V0V2ViUnRjVXBQcm9taXNlKG1lc3NhZ2Uuc2VuZGVyKS5yZXNvbHZlKCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYWRkT2NjdXBhbnQob2NjdXBhbnRJZCkge1xuICAgIHZhciBzdWJzY3JpYmVyID0gYXdhaXQgdGhpcy5jcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpO1xuXG4gICAgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0gPSB0cnVlO1xuICAgIHRoaXMub2NjdXBhbnRQZWVyQ29ubmVjdGlvbnNbb2NjdXBhbnRJZF0gPSBzdWJzY3JpYmVyLnBlZXJDb25uZWN0aW9uO1xuICAgIHRoaXMubWVkaWFTdHJlYW1zW29jY3VwYW50SWRdID0gc3Vic2NyaWJlci5tZWRpYVN0cmVhbTtcblxuICAgIC8vIFJlc29sdmUgdGhlIHByb21pc2UgZm9yIHRoZSB1c2VyJ3MgbWVkaWEgc3RyZWFtIGlmIGl0IGV4aXN0cy5cbiAgICBpZiAodGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5oYXMob2NjdXBhbnRJZCkpIHtcbiAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KG9jY3VwYW50SWQpLnJlc29sdmUoc3Vic2NyaWJlci5tZWRpYVN0cmVhbSk7XG4gICAgfVxuXG4gICAgLy8gQ2FsbCB0aGUgTmV0d29ya2VkIEFGcmFtZSBjYWxsYmFja3MgZm9yIHRoZSBuZXcgb2NjdXBhbnQuXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkKG9jY3VwYW50SWQpO1xuICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkKHRoaXMub2NjdXBhbnRzKTtcblxuICAgIHJldHVybiBzdWJzY3JpYmVyO1xuICB9XG5cbiAgcmVtb3ZlT2NjdXBhbnQob2NjdXBhbnRJZCkge1xuICAgIGlmICh0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSkge1xuICAgICAgLy8gQ2xvc2UgdGhlIHN1YnNjcmliZXIgcGVlciBjb25uZWN0aW9uLiBXaGljaCBhbHNvIGRldGFjaGVzIHRoZSBwbHVnaW4gaGFuZGxlLlxuICAgICAgaWYgKHRoaXMub2NjdXBhbnRQZWVyQ29ubmVjdGlvbnNbb2NjdXBhbnRJZF0pIHtcbiAgICAgICAgdGhpcy5vY2N1cGFudFBlZXJDb25uZWN0aW9uc1tvY2N1cGFudElkXS5jbG9zZSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5vY2N1cGFudFBlZXJDb25uZWN0aW9uc1tvY2N1cGFudElkXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMubWVkaWFTdHJlYW1zW29jY3VwYW50SWRdKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLm1lZGlhU3RyZWFtc1tvY2N1cGFudElkXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuaGFzKG9jY3VwYW50SWQpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHNcbiAgICAgICAgICAuZ2V0KG9jY3VwYW50SWQpXG4gICAgICAgICAgLnJlamVjdChcbiAgICAgICAgICAgIFwiVGhlIHVzZXIgZGlzY29ubmVjdGVkIGJlZm9yZSB0aGUgbWVkaWEgc3RyZWFtIHdhcyByZXNvbHZlZC5cIlxuICAgICAgICAgICk7XG4gICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZGVsZXRlKG9jY3VwYW50SWQpO1xuICAgICAgfVxuXG4gICAgICBkZWxldGUgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF07XG5cbiAgICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgcmVtb3ZlZCBvY2N1cGFudC5cbiAgICAgIHRoaXMub25PY2N1cGFudERpc2Nvbm5lY3RlZChvY2N1cGFudElkKTtcbiAgICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkKHRoaXMub2NjdXBhbnRzKTtcbiAgICB9XG4gIH1cblxuICBnZXRXZWJSdGNVcFByb21pc2UoaWQpIHtcbiAgICBpZiAoIXRoaXMud2ViUnRjVXBQcm9taXNlcy5nZXQoaWQpKSB7XG4gICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLndlYlJ0Y1VwUHJvbWlzZXMuc2V0KGlkLCB7IHJlc29sdmUgfSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMud2ViUnRjVXBQcm9taXNlcy5nZXQoaWQpLnByb21pc2UgPSBwcm9taXNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy53ZWJSdGNVcFByb21pc2VzLmdldChpZCk7XG4gIH1cblxuICBhc3luYyBjcmVhdGVQdWJsaXNoZXIoKSB7XG4gICAgdmFyIGhhbmRsZSA9IG5ldyBtai5KYW51c1BsdWdpbkhhbmRsZSh0aGlzLnNlc3Npb24pO1xuICAgIGRlYnVnKFwicHViIHdhaXRpbmcgZm9yIHNmdVwiKTtcbiAgICBhd2FpdCBoYW5kbGUuYXR0YWNoKFwiamFudXMucGx1Z2luLnNmdVwiKTtcblxuICAgIHZhciBwZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcblxuICAgIHBlZXJDb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJpY2VjYW5kaWRhdGVcIiwgZXZlbnQgPT4ge1xuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2ZW50LmNhbmRpZGF0ZSB8fCBudWxsKTtcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhbiB1bnJlbGlhYmxlIGRhdGFjaGFubmVsIGZvciBzZW5kaW5nIGFuZCByZWNlaXZpbmcgY29tcG9uZW50IHVwZGF0ZXMsIGV0Yy5cbiAgICB2YXIgdW5yZWxpYWJsZUNoYW5uZWwgPSBwZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbChcInVucmVsaWFibGVcIiwge1xuICAgICAgb3JkZXJlZDogZmFsc2UsXG4gICAgICBtYXhSZXRyYW5zbWl0czogMFxuICAgIH0pO1xuICAgIHVucmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xuXG4gICAgLy8gQ3JlYXRlIGEgcmVsaWFibGUgZGF0YWNoYW5uZWwgZm9yIHNlbmRpbmcgYW5kIHJlY2lldmluZyBlbnRpdHkgaW5zdGFudGlhdGlvbnMsIGV0Yy5cbiAgICB2YXIgcmVsaWFibGVDaGFubmVsID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJyZWxpYWJsZVwiLCB7XG4gICAgICBvcmRlcmVkOiB0cnVlXG4gICAgfSk7XG4gICAgcmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xuXG4gICAgdmFyIG1lZGlhU3RyZWFtO1xuICAgIC8vIEBUT0RPIGVpdGhlciB0aGlzIHNob3VsZCB3YWl0IG9yIHNldExvY2FsTWVkaWFTdHJlYW0gc2hvdWxkIHJlbmVnb3RpYXRlIChvciBib3RoKVxuICAgIGlmICh0aGlzLmxvY2FsTWVkaWFTdHJlYW0pIHtcbiAgICAgIG1lZGlhU3RyZWFtID0gdGhpcy5sb2NhbE1lZGlhU3RyZWFtO1xuICAgICAgcGVlckNvbm5lY3Rpb24uYWRkU3RyZWFtKHRoaXMubG9jYWxNZWRpYVN0cmVhbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcImxvY2FsTWVkaWFTdHJlYW0gbm90IHNldC4gV2lsbCBub3QgcHVibGlzaCBhdWRpbyBvciB2aWRlb1wiKTtcbiAgICB9XG5cbiAgICBkZWJ1ZyhcInB1YiB3YWl0aW5nIGZvciBvZmZlclwiKTtcbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcigpO1xuXG4gICAgZGVidWcoXCJwdWIgd2FpdGluZyBmb3IgbG9jYWwvcmVtb3RlIGRlc2NyaXB0aW9uc1wiKTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpLFxuICAgICAgaGFuZGxlXG4gICAgICAgIC5zZW5kSnNlcChvZmZlcilcbiAgICAgICAgLnRoZW4oKHsganNlcCB9KSA9PiBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihqc2VwKSlcbiAgICBdKTtcblxuICAgIGRlYnVnKFwicHViIHdhaXRpbmcgZm9yIHdlYnJ0Y3VwXCIpO1xuICAgIGF3YWl0IHRoaXMuZ2V0V2ViUnRjVXBQcm9taXNlKGhhbmRsZS5pZCkucHJvbWlzZTtcblxuICAgIGlmIChyZWxpYWJsZUNoYW5uZWwucmVhZHlTdGF0ZSAhPT0gXCJvcGVuXCIpIHtcbiAgICAgIGRlYnVnKFwicHViIHdhaXRpbmcgZm9yIGNoYW5uZWwgdG8gb3BlblwiKTtcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSByZWxpYWJsZSBkYXRhY2hhbm5lbCB0byBiZSBvcGVuIGJlZm9yZSB3ZSBzdGFydCBzZW5kaW5nIG1lc3NhZ2VzIG9uIGl0LlxuICAgICAgYXdhaXQgd2FpdEZvckV2ZW50KHJlbGlhYmxlQ2hhbm5lbCwgXCJvcGVuXCIpO1xuICAgIH1cblxuICAgIC8vIENhbGwgdGhlIG5hZiBjb25uZWN0U3VjY2VzcyBjYWxsYmFjayBiZWZvcmUgd2Ugc3RhcnQgcmVjZWl2aW5nIFdlYlJUQyBtZXNzYWdlcy5cbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzKHRoaXMudXNlcklkKTtcblxuICAgIGRlYnVnKFwicHViIHdhaXRpbmcgZm9yIGpvaW5cIik7XG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIExpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gQXV0b21hdGljYWxseSBzdWJzY3JpYmUgdG8gYWxsIHVzZXJzJyBXZWJSVEMgZGF0YS5cbiAgICB2YXIgbWVzc2FnZSA9IGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCB7XG4gICAgICBub3RpZmljYXRpb25zOiB0cnVlLFxuICAgICAgZGF0YTogdHJ1ZVxuICAgIH0pO1xuXG4gICAgdmFyIGluaXRpYWxPY2N1cGFudHMgPVxuICAgICAgbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEucmVzcG9uc2UudXNlcnNbdGhpcy5yb29tXSB8fCBbXTtcblxuICAgIGRlYnVnKFwicHVibGlzaGVyIHJlYWR5XCIpO1xuICAgIHJldHVybiB7XG4gICAgICBoYW5kbGUsXG4gICAgICBpbml0aWFsT2NjdXBhbnRzLFxuICAgICAgcmVsaWFibGVDaGFubmVsLFxuICAgICAgdW5yZWxpYWJsZUNoYW5uZWwsXG4gICAgICBtZWRpYVN0cmVhbSxcbiAgICAgIHBlZXJDb25uZWN0aW9uXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1YnNjcmliZXIob2NjdXBhbnRJZCkge1xuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcbiAgICBkZWJ1ZyhcInN1YiB3YWl0aW5nIGZvciBzZnVcIik7XG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XG5cbiAgICB2YXIgcGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XG5cbiAgICBwZWVyQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ZW50ID0+IHtcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldmVudC5jYW5kaWRhdGUgfHwgbnVsbCk7XG4gICAgfSk7XG5cbiAgICBkZWJ1ZyhcInN1YiB3YWl0aW5nIGZvciBqb2luXCIpO1xuICAgIC8vIFNlbmQgam9pbiBtZXNzYWdlIHRvIGphbnVzLiBEb24ndCBsaXN0ZW4gZm9yIGpvaW4vbGVhdmUgbWVzc2FnZXMuIFN1YnNjcmliZSB0byB0aGUgb2NjdXBhbnQncyBhdWRpbyBzdHJlYW0uXG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCB7XG4gICAgICBub3RpZmljYXRpb25zOiBmYWxzZSxcbiAgICAgIG1lZGlhOiBvY2N1cGFudElkXG4gICAgfSk7XG5cbiAgICBkZWJ1ZyhcInN1YiB3YWl0aW5nIGZvciBhbnN3ZXJcIik7XG4gICAgbGV0IHNkcCA9IHJlc3AuanNlcC5zZHA7XG5cbiAgICBjb25zdCBoMjQ2U3VwcG9ydCA9IGNvZGVjRGV0ZWN0LmlzSDI2NFZpZGVvU3VwcG9ydGVkKCk7XG4gICAgaWYgKGgyNDZTdXBwb3J0ID09PSAncHJvYmFibHknIHx8IGgyNDZTdXBwb3J0ID09PSAnbWF5YmUnKSB7XG4gICAgICAvLyBUT0RPOiBIYWNrIHRvIGdldCB2aWRlbyB3b3JraW5nIG9uIENocm9tZSBmb3IgQW5kcm9pZC4gaHR0cHM6Ly9ncm91cHMuZ29vZ2xlLmNvbS9mb3J1bS8jIXRvcGljL21vemlsbGEuZGV2Lm1lZGlhL1llMjl2dU1UcG84XG4gICAgICBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiQW5kcm9pZFwiKSA9PT0gLTEpIHtcbiAgICAgICAgc2RwID0gc2RwLnJlcGxhY2UoXG4gICAgICAgICAgXCJhPXJ0Y3AtZmI6MTA3IGdvb2ctcmVtYlxcclxcblwiLFxuICAgICAgICAgIFwiYT1ydGNwLWZiOjEwNyBnb29nLXJlbWJcXHJcXG5hPXJ0Y3AtZmI6MTA3IHRyYW5zcG9ydC1jY1xcclxcbmE9Zm10cDoxMDcgbGV2ZWwtYXN5bW1ldHJ5LWFsbG93ZWQ9MTtwYWNrZXRpemF0aW9uLW1vZGU9MTtwcm9maWxlLWxldmVsLWlkPTQyZTAxZlxcclxcblwiXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZHAgPSBzZHAucmVwbGFjZShcbiAgICAgICAgICBcImE9cnRjcC1mYjoxMDcgZ29vZy1yZW1iXFxyXFxuXCIsXG4gICAgICAgICAgXCJhPXJ0Y3AtZmI6MTA3IGdvb2ctcmVtYlxcclxcbmE9cnRjcC1mYjoxMDcgdHJhbnNwb3J0LWNjXFxyXFxuYT1mbXRwOjEwNyBsZXZlbC1hc3ltbWV0cnktYWxsb3dlZD0xO3BhY2tldGl6YXRpb24tbW9kZT0xO3Byb2ZpbGUtbGV2ZWwtaWQ9NDIwMDFmXFxyXFxuXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXNwLmpzZXAuc2RwID0gc2RwO1xuXG4gICAgZGVidWcoXCJzdWIgc2VuZGluZyBhbnN3ZXIgYW5kIHNldHRpbmcgcmVtb3RlL2xvY2FsIGRlc2NyaXB0aW9uXCIpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKHJlc3AuanNlcCksXG4gICAgICBwZWVyQ29ubmVjdGlvblxuICAgICAgICAuY3JlYXRlQW5zd2VyKClcbiAgICAgICAgLnRoZW4oYW5zd2VyID0+XG4gICAgICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgcGVlckNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihhbnN3ZXIpLFxuICAgICAgICAgICAgaGFuZGxlLnNlbmRKc2VwKGFuc3dlcilcbiAgICAgICAgICBdKVxuICAgICAgICApXG4gICAgXSk7XG5cbiAgICBkZWJ1ZyhcInN1YiB3YWl0aW5nIGZvciB3ZWJydGN1cFwiKTtcbiAgICBhd2FpdCB0aGlzLmdldFdlYlJ0Y1VwUHJvbWlzZShoYW5kbGUuaWQpLnByb21pc2U7XG5cbiAgICAvLyBHZXQgdGhlIG9jY3VwYW50J3MgYXVkaW8gc3RyZWFtLlxuICAgIHZhciBzdHJlYW1zID0gcGVlckNvbm5lY3Rpb24uZ2V0UmVtb3RlU3RyZWFtcygpO1xuICAgIHZhciBtZWRpYVN0cmVhbSA9IHN0cmVhbXMubGVuZ3RoID4gMCA/IHN0cmVhbXNbMF0gOiBudWxsO1xuXG4gICAgZGVidWcoXCJzdWJzY3JpYmVyIHJlYWR5XCIpO1xuICAgIHJldHVybiB7XG4gICAgICBoYW5kbGUsXG4gICAgICBtZWRpYVN0cmVhbSxcbiAgICAgIHBlZXJDb25uZWN0aW9uXG4gICAgfTtcbiAgfVxuXG4gIHNlbmRKb2luKGhhbmRsZSwgcm9vbUlkLCB1c2VySWQsIHN1YnNjcmliZSkge1xuICAgIHJldHVybiBoYW5kbGUuc2VuZE1lc3NhZ2Uoe1xuICAgICAga2luZDogXCJqb2luXCIsXG4gICAgICByb29tX2lkOiByb29tSWQsXG4gICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICBzdWJzY3JpYmVcbiAgICB9KTtcbiAgfVxuXG4gIG9uRGF0YUNoYW5uZWxNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuXG4gICAgaWYgKG1lc3NhZ2UuZGF0YVR5cGUpIHtcbiAgICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UobnVsbCwgbWVzc2FnZS5kYXRhVHlwZSwgbWVzc2FnZS5kYXRhKTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRTdGFydENvbm5lY3Rpb25UbyhjbGllbnRJZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7fVxuXG4gIGNsb3NlU3RyZWFtQ29ubmVjdGlvbihjbGllbnRJZCkge31cblxuICBnZXRDb25uZWN0U3RhdHVzKGNsaWVudElkKSB7XG4gICAgaWYgKHRoaXMub2NjdXBhbnRzW2NsaWVudElkXSkge1xuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuTk9UX0NPTk5FQ1RFRDtcbiAgICB9XG4gIH1cblxuICBhc3luYyB1cGRhdGVUaW1lT2Zmc2V0KCkge1xuICAgIGNvbnN0IGNsaWVudFNlbnRUaW1lID0gRGF0ZS5ub3coKSArIHRoaXMuYXZnVGltZU9mZnNldDtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsIHtcbiAgICAgIG1ldGhvZDogXCJIRUFEXCIsXG4gICAgICBjYWNoZTogXCJuby1jYWNoZVwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBwcmVjaXNpb24gPSAxMDAwO1xuICAgIGNvbnN0IHNlcnZlclJlY2VpdmVkVGltZSA9XG4gICAgICBuZXcgRGF0ZShyZXMuaGVhZGVycy5nZXQoXCJEYXRlXCIpKS5nZXRUaW1lKCkgKyBwcmVjaXNpb24gLyAyO1xuICAgIGNvbnN0IGNsaWVudFJlY2VpdmVkVGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3Qgc2VydmVyVGltZSA9XG4gICAgICBzZXJ2ZXJSZWNlaXZlZFRpbWUgKyAoY2xpZW50UmVjZWl2ZWRUaW1lIC0gY2xpZW50U2VudFRpbWUpIC8gMjtcbiAgICBjb25zdCB0aW1lT2Zmc2V0ID0gc2VydmVyVGltZSAtIGNsaWVudFJlY2VpdmVkVGltZTtcblxuICAgIHRoaXMuc2VydmVyVGltZVJlcXVlc3RzKys7XG5cbiAgICBpZiAodGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPD0gMTApIHtcbiAgICAgIHRoaXMudGltZU9mZnNldHMucHVzaCh0aW1lT2Zmc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50aW1lT2Zmc2V0c1t0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyAlIDEwXSA9IHRpbWVPZmZzZXQ7XG4gICAgfVxuXG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID1cbiAgICAgIHRoaXMudGltZU9mZnNldHMucmVkdWNlKChhY2MsIG9mZnNldCkgPT4gKGFjYyArPSBvZmZzZXQpLCAwKSAvXG4gICAgICB0aGlzLnRpbWVPZmZzZXRzLmxlbmd0aDtcblxuICAgIGlmICh0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyA+IDEwKSB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMudXBkYXRlVGltZU9mZnNldCgpLCA1ICogNjAgKiAxMDAwKTsgLy8gU3luYyBjbG9jayBldmVyeSA1IG1pbnV0ZXMuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXBkYXRlVGltZU9mZnNldCgpO1xuICAgIH1cbiAgfVxuXG4gIGdldFNlcnZlclRpbWUoKSB7XG4gICAgcmV0dXJuIERhdGUubm93KCkgKyB0aGlzLmF2Z1RpbWVPZmZzZXQ7XG4gIH1cblxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkge1xuICAgIGlmICh0aGlzLm1lZGlhU3RyZWFtc1tjbGllbnRJZF0pIHtcbiAgICAgIGRlYnVnKFwiQWxyZWFkeSBoYWQgYXVkaW8gZm9yIFwiICsgY2xpZW50SWQpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm1lZGlhU3RyZWFtc1tjbGllbnRJZF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1ZyhcIldhaXRpbmcgb24gYXVkaW8gZm9yIFwiICsgY2xpZW50SWQpO1xuICAgICAgaWYgKCF0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmhhcyhjbGllbnRJZCkpIHtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLnNldChjbGllbnRJZCwgeyByZXNvbHZlLCByZWplY3QgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChjbGllbnRJZCkucHJvbWlzZSA9IHByb21pc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQoY2xpZW50SWQpLnByb21pc2U7XG4gICAgfVxuICB9XG5cbiAgc2V0TG9jYWxNZWRpYVN0cmVhbShzdHJlYW0pIHtcbiAgICBpZiAodGhpcy5wdWJsaXNoZXIpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgXCJzZXRMb2NhbE1lZGlhU3RyZWFtIGNhbGxlZCBhZnRlciBwdWJsaXNoZXIgY3JlYXRlZC4gV2lsbCBub3QgcHVibGlzaCBuZXcgc3RyZWFtLlwiXG4gICAgICApO1xuICAgIH1cbiAgICAvLyBAVE9ETyB0aGlzIHNob3VsZCBoYW5kbGUgcmVuZWdvdGlhdGluZyB0aGUgcHVibGlzaGVyIGNvbm5lY3Rpb24gaWYgaXQgaGFzIGFscmVhZHkgYmVlbiBtYWRlXG4gICAgdGhpcy5sb2NhbE1lZGlhU3RyZWFtID0gc3RyZWFtO1xuICB9XG5cbiAgZW5hYmxlTWljcm9waG9uZShlbmFibGVkKSB7XG4gICAgaWYgKHRoaXMucHVibGlzaGVyICYmIHRoaXMucHVibGlzaGVyLm1lZGlhU3RyZWFtKSB7XG4gICAgICB2YXIgYXVkaW9UcmFja3MgPSB0aGlzLnB1Ymxpc2hlci5tZWRpYVN0cmVhbS5nZXRBdWRpb1RyYWNrcygpO1xuXG4gICAgICBpZiAoYXVkaW9UcmFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICBhdWRpb1RyYWNrc1swXS5lbmFibGVkID0gZW5hYmxlZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZW5kRGF0YShjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcbiAgICB0aGlzLnB1Ymxpc2hlci51bnJlbGlhYmxlQ2hhbm5lbC5zZW5kKFxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcbiAgICApO1xuICB9XG5cbiAgc2VuZERhdGFHdWFyYW50ZWVkKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKFxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcbiAgICApO1xuICB9XG5cbiAgYnJvYWRjYXN0RGF0YShkYXRhVHlwZSwgZGF0YSkge1xuICAgIHRoaXMucHVibGlzaGVyLnVucmVsaWFibGVDaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSk7XG4gIH1cblxuICBicm9hZGNhc3REYXRhR3VhcmFudGVlZChkYXRhVHlwZSwgZGF0YSkge1xuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xuICB9XG59XG5cbk5BRi5hZGFwdGVycy5yZWdpc3RlcihcImphbnVzXCIsIEphbnVzQWRhcHRlcik7XG5cbm1vZHVsZS5leHBvcnRzID0gSmFudXNBZGFwdGVyO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2luZGV4LmpzIiwiLyoqIFdoZXRoZXIgdG8gbG9nIGluZm9ybWF0aW9uIGFib3V0IGluY29taW5nIGFuZCBvdXRnb2luZyBKYW51cyBzaWduYWxzLiAqKi9cbnZhciB2ZXJib3NlID0gZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGhhbmRsZSB0byBhIHNpbmdsZSBKYW51cyBwbHVnaW4gb24gYSBKYW51cyBzZXNzaW9uLiBFYWNoIFdlYlJUQyBjb25uZWN0aW9uIHRvIHRoZSBKYW51cyBzZXJ2ZXIgd2lsbCBiZVxuICogYXNzb2NpYXRlZCB3aXRoIGEgc2luZ2xlIGhhbmRsZS4gT25jZSBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCB0aGlzIGhhbmRsZSB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZVxuICogdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNoYW5kbGVzLlxuICoqL1xuZnVuY3Rpb24gSmFudXNQbHVnaW5IYW5kbGUoc2Vzc2lvbikge1xuICB0aGlzLnNlc3Npb24gPSBzZXNzaW9uO1xuICB0aGlzLmlkID0gdW5kZWZpbmVkO1xufVxuXG4vKiogQXR0YWNoZXMgdGhpcyBoYW5kbGUgdG8gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKHBsdWdpbikge1xuICB2YXIgcGF5bG9hZCA9IHsgamFudXM6IFwiYXR0YWNoXCIsIHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGV0YWNoXCIgfSk7XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gU2lnbmFscyBzaG91bGQgYmUgSlNPTi1zZXJpYWxpemFibGUgb2JqZWN0cy4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsXG4gKiBiZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgdG8gdGhpcyBzaWduYWwgaXMgcmVjZWl2ZWQsIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZVxuICogc2Vzc2lvbiB0aW1lb3V0LlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKE9iamVjdC5hc3NpZ24oeyBoYW5kbGVfaWQ6IHRoaXMuaWQgfSwgc2lnbmFsKSk7XG59O1xuXG4vKiogU2VuZHMgYSBwbHVnaW4tc3BlY2lmaWMgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oYm9keSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcIm1lc3NhZ2VcIiwgYm9keToge30sIGpzZXA6IGpzZXAgfSk7XG59O1xuXG4vKiogU2VuZHMgYW4gSUNFIHRyaWNrbGUgY2FuZGlkYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZFRyaWNrbGUgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcInRyaWNrbGVcIiwgIGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7XG4gICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICBrZWVwYWxpdmVNczogMzAwMDBcbiAgfTtcbn1cblxuLyoqIENyZWF0ZXMgdGhpcyBzZXNzaW9uIG9uIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJjcmVhdGVcIiB9KS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqIERlc3Ryb3lzIHRoaXMgc2Vzc2lvbi4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImRlc3Ryb3lcIiB9KTtcbn07XG5cbi8qKlxuICogV2hldGhlciB0aGlzIHNpZ25hbCByZXByZXNlbnRzIGFuIGVycm9yLCBhbmQgdGhlIGFzc29jaWF0ZWQgcHJvbWlzZSAoaWYgYW55KSBzaG91bGQgYmUgcmVqZWN0ZWQuXG4gKiBVc2VycyBzaG91bGQgb3ZlcnJpZGUgdGhpcyB0byBoYW5kbGUgYW55IGN1c3RvbSBwbHVnaW4tc3BlY2lmaWMgZXJyb3IgY29udmVudGlvbnMuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmlzRXJyb3IgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHNpZ25hbC5qYW51cyA9PT0gXCJlcnJvclwiO1xufTtcblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgcmVjZWl2aW5nIEpTT04gc2lnbmFsbGluZyBtZXNzYWdlcyBwZXJ0aW5lbnQgdG8gdGhpcyBzZXNzaW9uLiBJZiB0aGUgc2lnbmFscyBhcmUgcmVzcG9uc2VzIHRvIHByZXZpb3VzbHlcbiAqIHNlbnQgc2lnbmFscywgdGhlIHByb21pc2VzIGZvciB0aGUgb3V0Z29pbmcgc2lnbmFscyB3aWxsIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIGFwcHJvcHJpYXRlbHkgd2l0aCB0aGlzIHNpZ25hbCBhcyBhblxuICogYXJndW1lbnQuXG4gKlxuICogRXh0ZXJuYWwgY2FsbGVycyBzaG91bGQgY2FsbCB0aGlzIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgYSBuZXcgc2lnbmFsIGFycml2ZXMgb24gdGhlIHRyYW5zcG9ydDsgZm9yIGV4YW1wbGUsIGluIGFcbiAqIFdlYlNvY2tldCdzIGBtZXNzYWdlYCBldmVudCwgb3Igd2hlbiBhIG5ldyBkYXR1bSBzaG93cyB1cCBpbiBhbiBIVFRQIGxvbmctcG9sbGluZyByZXNwb25zZS5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUucmVjZWl2ZSA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAobW9kdWxlLmV4cG9ydHMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJJbmNvbWluZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIGlmIChzaWduYWwudHJhbnNhY3Rpb24gIT0gbnVsbCkge1xuICAgIHZhciBoYW5kbGVycyA9IHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgIGlmIChzaWduYWwuamFudXMgPT09IFwiYWNrXCIgJiYgc2lnbmFsLmhpbnQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYW4gYWNrIG9mIGFuIGFzeW5jaHJvbm91c2x5LXByb2Nlc3NlZCByZXF1ZXN0LCB3ZSBzaG91bGQgd2FpdFxuICAgICAgLy8gdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB1bnRpbCB0aGUgYWN0dWFsIHJlc3BvbnNlIGNvbWVzIGluXG4gICAgfSBlbHNlIGlmIChoYW5kbGVycyAhPSBudWxsKSB7XG4gICAgICBpZiAoaGFuZGxlcnMudGltZW91dCAhPSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChoYW5kbGVycy50aW1lb3V0KTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgICh0aGlzLmlzRXJyb3Ioc2lnbmFsKSA/IGhhbmRsZXJzLnJlamVjdCA6IGhhbmRsZXJzLnJlc29sdmUpKHNpZ25hbCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb24uIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAodGhpcy5pZCAhPSBudWxsKSB7IC8vIHRoaXMuaWQgaXMgdW5kZWZpbmVkIGluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlbiB3ZSdyZSBzZW5kaW5nIHRoZSBzZXNzaW9uIGNyZWF0ZSBtZXNzYWdlXG4gICAgc2lnbmFsID0gT2JqZWN0LmFzc2lnbih7IHNlc3Npb25faWQ6IHRoaXMuaWQgfSwgc2lnbmFsKTtcbiAgfVxuICBzaWduYWwgPSBPYmplY3QuYXNzaWduKHsgdHJhbnNhY3Rpb246ICh0aGlzLm5leHRUeElkKyspLnRvU3RyaW5nKCkgfSwgc2lnbmFsKTtcbiAgaWYgKG1vZHVsZS5leHBvcnRzLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiT3V0Z29pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVvdXRNcykge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJTaWduYWxsaW5nIG1lc3NhZ2UgdGltZWQgb3V0LlwiKSk7XG4gICAgICB9LCB0aGlzLm9wdGlvbnMudGltZW91dE1zKTtcbiAgICB9XG4gICAgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl0gPSB7IHJlc29sdmU6IHJlc29sdmUsIHJlamVjdDogcmVqZWN0LCB0aW1lb3V0OiB0aW1lb3V0IH07XG4gICAgdGhpcy5vdXRwdXQoSlNPTi5zdHJpbmdpZnkoc2lnbmFsKSk7XG4gICAgdGhpcy5fcmVzZXRLZWVwYWxpdmUoKTtcbiAgfSk7XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9yZXNldEtlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5rZWVwYWxpdmVUaW1lb3V0KSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMua2VlcGFsaXZlVGltZW91dCk7XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcykge1xuICAgIHRoaXMua2VlcGFsaXZlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fa2VlcGFsaXZlKCksIHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcyk7XG4gIH1cbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX2tlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwia2VlcGFsaXZlXCIgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgSmFudXNQbHVnaW5IYW5kbGUsXG4gIEphbnVzU2Vzc2lvbixcbiAgdmVyYm9zZVxufTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL21pbmlqYW51cy9taW5pamFudXMuanNcbi8vIG1vZHVsZSBpZCA9IDFcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5leHBvcnRzLnN0b3JhZ2UgPSAndW5kZWZpbmVkJyAhPSB0eXBlb2YgY2hyb21lXG4gICAgICAgICAgICAgICAmJiAndW5kZWZpbmVkJyAhPSB0eXBlb2YgY2hyb21lLnN0b3JhZ2VcbiAgICAgICAgICAgICAgICAgID8gY2hyb21lLnN0b3JhZ2UubG9jYWxcbiAgICAgICAgICAgICAgICAgIDogbG9jYWxzdG9yYWdlKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnIzAwMDBDQycsICcjMDAwMEZGJywgJyMwMDMzQ0MnLCAnIzAwMzNGRicsICcjMDA2NkNDJywgJyMwMDY2RkYnLCAnIzAwOTlDQycsXG4gICcjMDA5OUZGJywgJyMwMENDMDAnLCAnIzAwQ0MzMycsICcjMDBDQzY2JywgJyMwMENDOTknLCAnIzAwQ0NDQycsICcjMDBDQ0ZGJyxcbiAgJyMzMzAwQ0MnLCAnIzMzMDBGRicsICcjMzMzM0NDJywgJyMzMzMzRkYnLCAnIzMzNjZDQycsICcjMzM2NkZGJywgJyMzMzk5Q0MnLFxuICAnIzMzOTlGRicsICcjMzNDQzAwJywgJyMzM0NDMzMnLCAnIzMzQ0M2NicsICcjMzNDQzk5JywgJyMzM0NDQ0MnLCAnIzMzQ0NGRicsXG4gICcjNjYwMENDJywgJyM2NjAwRkYnLCAnIzY2MzNDQycsICcjNjYzM0ZGJywgJyM2NkNDMDAnLCAnIzY2Q0MzMycsICcjOTkwMENDJyxcbiAgJyM5OTAwRkYnLCAnIzk5MzNDQycsICcjOTkzM0ZGJywgJyM5OUNDMDAnLCAnIzk5Q0MzMycsICcjQ0MwMDAwJywgJyNDQzAwMzMnLFxuICAnI0NDMDA2NicsICcjQ0MwMDk5JywgJyNDQzAwQ0MnLCAnI0NDMDBGRicsICcjQ0MzMzAwJywgJyNDQzMzMzMnLCAnI0NDMzM2NicsXG4gICcjQ0MzMzk5JywgJyNDQzMzQ0MnLCAnI0NDMzNGRicsICcjQ0M2NjAwJywgJyNDQzY2MzMnLCAnI0NDOTkwMCcsICcjQ0M5OTMzJyxcbiAgJyNDQ0NDMDAnLCAnI0NDQ0MzMycsICcjRkYwMDAwJywgJyNGRjAwMzMnLCAnI0ZGMDA2NicsICcjRkYwMDk5JywgJyNGRjAwQ0MnLFxuICAnI0ZGMDBGRicsICcjRkYzMzAwJywgJyNGRjMzMzMnLCAnI0ZGMzM2NicsICcjRkYzMzk5JywgJyNGRjMzQ0MnLCAnI0ZGMzNGRicsXG4gICcjRkY2NjAwJywgJyNGRjY2MzMnLCAnI0ZGOTkwMCcsICcjRkY5OTMzJywgJyNGRkNDMDAnLCAnI0ZGQ0MzMydcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuICAvLyBOQjogSW4gYW4gRWxlY3Ryb24gcHJlbG9hZCBzY3JpcHQsIGRvY3VtZW50IHdpbGwgYmUgZGVmaW5lZCBidXQgbm90IGZ1bGx5XG4gIC8vIGluaXRpYWxpemVkLiBTaW5jZSB3ZSBrbm93IHdlJ3JlIGluIENocm9tZSwgd2UnbGwganVzdCBkZXRlY3QgdGhpcyBjYXNlXG4gIC8vIGV4cGxpY2l0bHlcbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5wcm9jZXNzICYmIHdpbmRvdy5wcm9jZXNzLnR5cGUgPT09ICdyZW5kZXJlcicpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEludGVybmV0IEV4cGxvcmVyIGFuZCBFZGdlIGRvIG5vdCBzdXBwb3J0IGNvbG9ycy5cbiAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC8oZWRnZXx0cmlkZW50KVxcLyhcXGQrKS8pKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgLy8gZG9jdW1lbnQgaXMgdW5kZWZpbmVkIGluIHJlYWN0LW5hdGl2ZTogaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0LW5hdGl2ZS9wdWxsLzE2MzJcbiAgcmV0dXJuICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLldlYmtpdEFwcGVhcmFuY2UpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuY29uc29sZSAmJiAod2luZG93LmNvbnNvbGUuZmlyZWJ1ZyB8fCAod2luZG93LmNvbnNvbGUuZXhjZXB0aW9uICYmIHdpbmRvdy5jb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9maXJlZm94XFwvKFxcZCspLykgJiYgcGFyc2VJbnQoUmVnRXhwLiQxLCAxMCkgPj0gMzEpIHx8XG4gICAgLy8gZG91YmxlIGNoZWNrIHdlYmtpdCBpbiB1c2VyQWdlbnQganVzdCBpbiBjYXNlIHdlIGFyZSBpbiBhIHdvcmtlclxuICAgICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvYXBwbGV3ZWJraXRcXC8oXFxkKykvKSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuICdbVW5leHBlY3RlZEpTT05QYXJzZUVycm9yXTogJyArIGVyci5tZXNzYWdlO1xuICB9XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncyhhcmdzKSB7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybjtcblxuICB2YXIgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XG4gIGFyZ3Muc3BsaWNlKDEsIDAsIGMsICdjb2xvcjogaW5oZXJpdCcpXG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EtekEtWiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gbG9nKCkge1xuICAvLyB0aGlzIGhhY2tlcnkgaXMgcmVxdWlyZWQgZm9yIElFOC85LCB3aGVyZVxuICAvLyB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT09IHR5cGVvZiBjb25zb2xlXG4gICAgJiYgY29uc29sZS5sb2dcbiAgICAmJiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbn1cblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG4gIHRyeSB7XG4gICAgaWYgKG51bGwgPT0gbmFtZXNwYWNlcykge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMuc3RvcmFnZS5kZWJ1ZyA9IG5hbWVzcGFjZXM7XG4gICAgfVxuICB9IGNhdGNoKGUpIHt9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9hZCgpIHtcbiAgdmFyIHI7XG4gIHRyeSB7XG4gICAgciA9IGV4cG9ydHMuc3RvcmFnZS5kZWJ1ZztcbiAgfSBjYXRjaChlKSB7fVxuXG4gIC8vIElmIGRlYnVnIGlzbid0IHNldCBpbiBMUywgYW5kIHdlJ3JlIGluIEVsZWN0cm9uLCB0cnkgdG8gbG9hZCAkREVCVUdcbiAgaWYgKCFyICYmIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiAnZW52JyBpbiBwcm9jZXNzKSB7XG4gICAgciA9IHByb2Nlc3MuZW52LkRFQlVHO1xuICB9XG5cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZTtcbiAgfSBjYXRjaCAoZSkge31cbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9icm93c2VyLmpzXG4vLyBtb2R1bGUgaWQgPSAyXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcbi8vIG1vZHVsZSBpZCA9IDNcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZURlYnVnLmRlYnVnID0gY3JlYXRlRGVidWdbJ2RlZmF1bHQnXSA9IGNyZWF0ZURlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogQWN0aXZlIGBkZWJ1Z2AgaW5zdGFuY2VzLlxuICovXG5leHBvcnRzLmluc3RhbmNlcyA9IFtdO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXIgb3IgdXBwZXItY2FzZSBsZXR0ZXIsIGkuZS4gXCJuXCIgYW5kIFwiTlwiLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycyA9IHt9O1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG4gIHZhciBoYXNoID0gMCwgaTtcblxuICBmb3IgKGkgaW4gbmFtZXNwYWNlKSB7XG4gICAgaGFzaCAgPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gIH1cblxuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbTWF0aC5hYnMoaGFzaCkgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICB2YXIgcHJldlRpbWU7XG5cbiAgZnVuY3Rpb24gZGVidWcoKSB7XG4gICAgLy8gZGlzYWJsZWQ/XG4gICAgaWYgKCFkZWJ1Zy5lbmFibGVkKSByZXR1cm47XG5cbiAgICB2YXIgc2VsZiA9IGRlYnVnO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyB0dXJuIHRoZSBgYXJndW1lbnRzYCBpbnRvIGEgcHJvcGVyIEFycmF5XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGFyZ3NbMF0gPSBleHBvcnRzLmNvZXJjZShhcmdzWzBdKTtcblxuICAgIGlmICgnc3RyaW5nJyAhPT0gdHlwZW9mIGFyZ3NbMF0pIHtcbiAgICAgIC8vIGFueXRoaW5nIGVsc2UgbGV0J3MgaW5zcGVjdCB3aXRoICVPXG4gICAgICBhcmdzLnVuc2hpZnQoJyVPJyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EtekEtWiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIC8vIGFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nIChjb2xvcnMsIGV0Yy4pXG4gICAgZXhwb3J0cy5mb3JtYXRBcmdzLmNhbGwoc2VsZiwgYXJncyk7XG5cbiAgICB2YXIgbG9nRm4gPSBkZWJ1Zy5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuXG4gIGRlYnVnLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgZGVidWcuZW5hYmxlZCA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpO1xuICBkZWJ1Zy51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICBkZWJ1Zy5jb2xvciA9IHNlbGVjdENvbG9yKG5hbWVzcGFjZSk7XG4gIGRlYnVnLmRlc3Ryb3kgPSBkZXN0cm95O1xuXG4gIC8vIGVudi1zcGVjaWZpYyBpbml0aWFsaXphdGlvbiBsb2dpYyBmb3IgZGVidWcgaW5zdGFuY2VzXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5pbml0KSB7XG4gICAgZXhwb3J0cy5pbml0KGRlYnVnKTtcbiAgfVxuXG4gIGV4cG9ydHMuaW5zdGFuY2VzLnB1c2goZGVidWcpO1xuXG4gIHJldHVybiBkZWJ1Zztcbn1cblxuZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gIHZhciBpbmRleCA9IGV4cG9ydHMuaW5zdGFuY2VzLmluZGV4T2YodGhpcyk7XG4gIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICBleHBvcnRzLmluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcbiAgZXhwb3J0cy5zYXZlKG5hbWVzcGFjZXMpO1xuXG4gIGV4cG9ydHMubmFtZXMgPSBbXTtcbiAgZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4gIHZhciBpO1xuICB2YXIgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGkgPSAwOyBpIDwgZXhwb3J0cy5pbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaW5zdGFuY2UgPSBleHBvcnRzLmluc3RhbmNlc1tpXTtcbiAgICBpbnN0YW5jZS5lbmFibGVkID0gZXhwb3J0cy5lbmFibGVkKGluc3RhbmNlLm5hbWVzcGFjZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICBpZiAobmFtZVtuYW1lLmxlbmd0aCAtIDFdID09PSAnKicpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2RlYnVnLmpzXG4vLyBtb2R1bGUgaWQgPSA0XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkodmFsKVxuICApO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKFxuICAgIHN0clxuICApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgfVxuICBpZiAobXMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIH1cbiAgaWYgKG1zID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JykgfHxcbiAgICBwbHVyYWwobXMsIGgsICdob3VyJykgfHxcbiAgICBwbHVyYWwobXMsIG0sICdtaW51dGUnKSB8fFxuICAgIHBsdXJhbChtcywgcywgJ3NlY29uZCcpIHx8XG4gICAgbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAobXMgPCBuICogMS41KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJztcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzXG4vLyBtb2R1bGUgaWQgPSA1XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsInZhciBDb2RlY0RldGVjdCA9IENvZGVjRGV0ZWN0IHx8IChmdW5jdGlvbiBDb2RlY0RldGVjdElJRkUoKSB7XG5cbiAgLy8gY29uc3RhbnRzXG4gIHZhciBTdXBwb3J0ID0ge1xuICAgIFBFTkRJTkc6ICdwZW5kaW5nJyxcbiAgICBQUk9CQUJMWTogJ3Byb2JhYmx5JyxcbiAgICBNQVlCRTogJ21heWJlJ1xuICB9O1xuICB2YXIgTWV0aG9kID0ge1xuICAgIE9QVElNSVNUSUM6ICdvcHRpbWlzdGljJyxcbiAgICBQRVNTSU1JU1RJQzogJ3Blc3NpbWlzdGljJyxcbiAgICBFWEFDVDogJ2V4YWN0J1xuICB9O1xuXG4gIC8vIHZhcnNcbiAgdmFyIF92aWRlbztcbiAgdmFyIF92aWRlb1N1cHBvcnQgPSB7XG4gICAgbXBlZzQ6IFN1cHBvcnQuUEVORElORyxcbiAgICBoMjY0OiBTdXBwb3J0LlBFTkRJTkcsXG4gICAgb2dnOiBTdXBwb3J0LlBFTkRJTkcsXG4gICAgd2VibTogU3VwcG9ydC5QRU5ESU5HXG4gIH07XG4gIHZhciBfYXVkaW87XG4gIHZhciBfYXVkaW9TdXBwb3J0ID0ge1xuICAgIG1wMzogU3VwcG9ydC5QRU5ESU5HLFxuICAgIGFhYzogU3VwcG9ydC5QRU5ESU5HLFxuICAgIG9nZ1ZvcmJpczogU3VwcG9ydC5QRU5ESU5HLFxuICAgIG9nZ09wdXM6IFN1cHBvcnQuUEVORElORyxcbiAgICB3ZWJtOiBTdXBwb3J0LlBFTkRJTkcsXG4gICAgd2F2ZTogU3VwcG9ydC5QRU5ESU5HXG4gIH07XG5cbiAgLy8gcHVibGljIGFwaVxuICB2YXIgY2QgPSB7XG4gICAgLy8gY29uc3RhbnRzXG4gICAgVkVSU0lPTjogJzEuMS4zJyxcbiAgICAvLyBwcm9wZXJ0aWVzXG4gICAgbWV0aG9kOiBNZXRob2QuRVhBQ1QsXG4gICAgLy8gdmlkZW8gbWV0aG9kc1xuICAgIGdldFZpZGVvU3VwcG9ydDogZ2V0VmlkZW9TdXBwb3J0LFxuICAgIGlzTVBFRzRWaWRlb1N1cHBvcnRlZDogaXNNUEVHNFZpZGVvU3VwcG9ydGVkLFxuICAgIGlzSDI2NFZpZGVvU3VwcG9ydGVkOiBpc0gyNjRWaWRlb1N1cHBvcnRlZCxcbiAgICBpc09HR1ZpZGVvU3VwcG9ydGVkOiBpc09HR1ZpZGVvU3VwcG9ydGVkLFxuICAgIGlzV0VCTVZpZGVvU3VwcG9ydGVkOiBpc1dFQk1WaWRlb1N1cHBvcnRlZCxcbiAgICAvLyBhdWRpbyBtZXRob2RzXG4gICAgZ2V0QXVkaW9TdXBwb3J0OiBnZXRBdWRpb1N1cHBvcnQsXG4gICAgaXNNUDNBdWRpb1N1cHBvcnRlZDogaXNNUDNBdWRpb1N1cHBvcnRlZCxcbiAgICBpc0FBQ0F1ZGlvU3VwcG9ydGVkOiBpc0FBQ0F1ZGlvU3VwcG9ydGVkLFxuICAgIGlzT0dHVm9yYmlzQXVkaW9TdXBwb3J0ZWQ6IGlzT0dHVm9yYmlzQXVkaW9TdXBwb3J0ZWQsXG4gICAgaXNPR0dPcHVzQXVkaW9TdXBwb3J0ZWQ6IGlzT0dHT3B1c0F1ZGlvU3VwcG9ydGVkLFxuICAgIGlzV0VCTUF1ZGlvU3VwcG9ydGVkOiBpc1dFQk1BdWRpb1N1cHBvcnRlZCxcbiAgICBpc1dhdmVBdWRpb1N1cHBvcnRlZDogaXNXYXZlQXVkaW9TdXBwb3J0ZWRcbiAgfTtcblxuICAvLyBhdXRvIGluaXRpYWxpemF0aW9uXG4gIGluaXQoKTtcblxuICAvLyByZXR1cm4gcHVibGljIGFwaVxuICByZXR1cm4gY2Q7XG5cbiAgLy8gcHJpdmF0ZSBtZXRob2RzXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgZGV0ZWN0VmlkZW9TdXBwb3J0KCk7XG4gICAgZGV0ZWN0QXVkaW9TdXBwb3J0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRWaWRlb1N1cHBvcnQoKSB7XG4gICAgcmV0dXJuIF92aWRlb1N1cHBvcnQ7XG4gIH1cblxuICBmdW5jdGlvbiBpc01QRUc0VmlkZW9TdXBwb3J0ZWQoKSB7XG4gICAgdmFyIGlzU3VwcG9ydGVkO1xuICAgIHN3aXRjaCAoQ29kZWNEZXRlY3QubWV0aG9kKSB7XG4gICAgICBjYXNlIE1ldGhvZC5PUFRJTUlTVElDOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF92aWRlb1N1cHBvcnQubXBlZzQgIT09IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBNZXRob2QuUEVTU0lNSVNUSUM6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX3ZpZGVvU3VwcG9ydC5tcGVnNCA9PT0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX3ZpZGVvU3VwcG9ydC5tcGVnNDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBpc1N1cHBvcnRlZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzSDI2NFZpZGVvU3VwcG9ydGVkKCkge1xuICAgIHZhciBpc1N1cHBvcnRlZDtcbiAgICBzd2l0Y2ggKENvZGVjRGV0ZWN0Lm1ldGhvZCkge1xuICAgICAgY2FzZSBNZXRob2QuT1BUSU1JU1RJQzpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfdmlkZW9TdXBwb3J0LmgyNjQgIT09IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBNZXRob2QuUEVTU0lNSVNUSUM6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX3ZpZGVvU3VwcG9ydC5oMjY0ID09PSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfdmlkZW9TdXBwb3J0LmgyNjQ7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gaXNTdXBwb3J0ZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBpc09HR1ZpZGVvU3VwcG9ydGVkKCkge1xuICAgIHZhciBpc1N1cHBvcnRlZDtcbiAgICBzd2l0Y2ggKENvZGVjRGV0ZWN0Lm1ldGhvZCkge1xuICAgICAgY2FzZSBNZXRob2QuT1BUSU1JU1RJQzpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfdmlkZW9TdXBwb3J0Lm9nZyAhPT0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIE1ldGhvZC5QRVNTSU1JU1RJQzpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfdmlkZW9TdXBwb3J0Lm9nZyA9PT0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX3ZpZGVvU3VwcG9ydC5vZ2c7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gaXNTdXBwb3J0ZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBpc1dFQk1WaWRlb1N1cHBvcnRlZCgpIHtcbiAgICB2YXIgaXNTdXBwb3J0ZWQ7XG4gICAgc3dpdGNoIChDb2RlY0RldGVjdC5tZXRob2QpIHtcbiAgICAgIGNhc2UgTWV0aG9kLk9QVElNSVNUSUM6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX3ZpZGVvU3VwcG9ydC53ZWJtICE9PSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTWV0aG9kLlBFU1NJTUlTVElDOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF92aWRlb1N1cHBvcnQud2VibSA9PT0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX3ZpZGVvU3VwcG9ydC53ZWJtO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGlzU3VwcG9ydGVkO1xuICB9XG5cbiAgZnVuY3Rpb24gZGV0ZWN0VmlkZW9TdXBwb3J0KCkge1xuICAgIC8vIGNyZWF0ZSBhIHZpZGVvIGVsZW1lbnQgdG8gdXNlIGZvciB0ZXN0aW5nXG4gICAgX3ZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcblxuICAgIC8vIGdldCBzdXBwb3J0ZWQgdmlkZW8gY29kZWNzXG4gICAgaWYgKF92aWRlbykge1xuICAgICAgX3ZpZGVvU3VwcG9ydC5tcGVnNCA9IF92aWRlby5jYW5QbGF5VHlwZSgndmlkZW8vbXA0OyBjb2RlY3M9XCJtcDR2LjIwLjhcIicpO1xuICAgICAgX3ZpZGVvU3VwcG9ydC5oMjY0ID0gX3ZpZGVvLmNhblBsYXlUeXBlKCd2aWRlby9tcDQ7IGNvZGVjcz1cImF2YzEuNDJFMDFFLCBtcDRhLjQwLjJcIicpO1xuICAgICAgX3ZpZGVvU3VwcG9ydC5vZ2cgPSBfdmlkZW8uY2FuUGxheVR5cGUoJ3ZpZGVvL29nZzsgY29kZWNzPVwidGhlb3JhXCInKTtcbiAgICAgIF92aWRlb1N1cHBvcnQud2VibSA9IF92aWRlby5jYW5QbGF5VHlwZSgndmlkZW8vd2VibTsgY29kZWNzPVwidnA4LCB2b3JiaXNcIicpO1xuICAgICAgY29udmVydEVtcHR5U3RyaW5nc1RvRmFsc2UoX3ZpZGVvU3VwcG9ydCk7XG5cbiAgICAvLyB2aWRlbyBkb20gZWxlbWVudCBjb3VsZG4ndCBiZSBjcmVhdGVkLCB2aWRlbyBpcyBub3Qgc3VwcG9ydGVkXG4gICAgfSBlbHNlIHtcbiAgICAgIF92aWRlb1N1cHBvcnQubXBlZzQgPSBmYWxzZTtcbiAgICAgIF92aWRlb1N1cHBvcnQuaDI2NCA9IGZhbHNlO1xuICAgICAgX3ZpZGVvU3VwcG9ydC5vZ2cgPSBmYWxzZTtcbiAgICAgIF92aWRlb1N1cHBvcnQud2VibSA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vwqBtZW1vcnkgbWFuYWdlbWVudFxuICAgIF92aWRlbyA9IG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBdWRpb1N1cHBvcnQoKSB7XG4gICAgcmV0dXJuIF9hdWRpb1N1cHBvcnQ7XG4gIH1cblxuICBmdW5jdGlvbiBpc01QM0F1ZGlvU3VwcG9ydGVkKCkge1xuICAgIHZhciBpc1N1cHBvcnRlZDtcbiAgICBzd2l0Y2ggKENvZGVjRGV0ZWN0Lm1ldGhvZCkge1xuICAgICAgY2FzZSBNZXRob2QuT1BUSU1JU1RJQzpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfYXVkaW9TdXBwb3J0Lm1wMyAhPT0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIE1ldGhvZC5QRVNTSU1JU1RJQzpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfYXVkaW9TdXBwb3J0Lm1wMyA9PT0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTWV0aG9kLkVYQUNUOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF9hdWRpb1N1cHBvcnQubXAzO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfYXVkaW9TdXBwb3J0Lm1wMztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBpc1N1cHBvcnRlZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzQUFDQXVkaW9TdXBwb3J0ZWQoKSB7XG4gICAgdmFyIGlzU3VwcG9ydGVkO1xuICAgIHN3aXRjaCAoQ29kZWNEZXRlY3QubWV0aG9kKSB7XG4gICAgICBjYXNlIE1ldGhvZC5PUFRJTUlTVElDOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF9hdWRpb1N1cHBvcnQuYWFjICE9PSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTWV0aG9kLlBFU1NJTUlTVElDOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF9hdWRpb1N1cHBvcnQuYWFjID09PSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfYXVkaW9TdXBwb3J0LmFhYztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBpc1N1cHBvcnRlZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzT0dHVm9yYmlzQXVkaW9TdXBwb3J0ZWQoKSB7XG4gICAgdmFyIGlzU3VwcG9ydGVkO1xuICAgIHN3aXRjaCAoQ29kZWNEZXRlY3QubWV0aG9kKSB7XG4gICAgICBjYXNlIE1ldGhvZC5PUFRJTUlTVElDOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF9hdWRpb1N1cHBvcnQub2dnVm9yYmlzICE9PSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTWV0aG9kLlBFU1NJTUlTVElDOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF9hdWRpb1N1cHBvcnQub2dnVm9yYmlzID09PSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfYXVkaW9TdXBwb3J0Lm9nZ1ZvcmJpcztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBpc1N1cHBvcnRlZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzT0dHT3B1c0F1ZGlvU3VwcG9ydGVkKCkge1xuICAgIHZhciBpc1N1cHBvcnRlZDtcbiAgICBzd2l0Y2ggKENvZGVjRGV0ZWN0Lm1ldGhvZCkge1xuICAgICAgY2FzZSBNZXRob2QuT1BUSU1JU1RJQzpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfYXVkaW9TdXBwb3J0Lm9nZ09wdXMgIT09IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBNZXRob2QuUEVTU0lNSVNUSUM6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX2F1ZGlvU3VwcG9ydC5vZ2dPcHVzID09PSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfYXVkaW9TdXBwb3J0Lm9nZ09wdXM7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gaXNTdXBwb3J0ZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBpc1dFQk1BdWRpb1N1cHBvcnRlZCgpIHtcbiAgICB2YXIgaXNTdXBwb3J0ZWQ7XG4gICAgc3dpdGNoIChDb2RlY0RldGVjdC5tZXRob2QpIHtcbiAgICAgIGNhc2UgTWV0aG9kLk9QVElNSVNUSUM6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX2F1ZGlvU3VwcG9ydC53ZWJtICE9PSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgTWV0aG9kLlBFU1NJTUlTVElDOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF9hdWRpb1N1cHBvcnQud2VibSA9PT0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlzU3VwcG9ydGVkID0gX2F1ZGlvU3VwcG9ydC53ZWJtO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGlzU3VwcG9ydGVkO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNXYXZlQXVkaW9TdXBwb3J0ZWQoKSB7XG4gICAgdmFyIGlzU3VwcG9ydGVkO1xuICAgIHN3aXRjaCAoQ29kZWNEZXRlY3QubWV0aG9kKSB7XG4gICAgICBjYXNlIE1ldGhvZC5PUFRJTUlTVElDOlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF9hdWRpb1N1cHBvcnQud2F2ZSAhPT0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIE1ldGhvZC5QRVNTSU1JU1RJQzpcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBfYXVkaW9TdXBwb3J0LndhdmUgPT09IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpc1N1cHBvcnRlZCA9IF9hdWRpb1N1cHBvcnQud2F2ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBpc1N1cHBvcnRlZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRldGVjdEF1ZGlvU3VwcG9ydCgpIHtcbiAgICAvLyBjcmVhdGUgYSBhdWRpbyBlbGVtZW50IHRvIHVzZSBmb3IgdGVzdGluZ1xuICAgIF9hdWRpbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG5cbiAgICAvLyBnZXQgc3VwcG9ydGVkIGF1ZGlvIGNvZGVjc1xuICAgIGlmIChfYXVkaW8pIHtcbiAgICAgIF9hdWRpb1N1cHBvcnQubXAzID0gX2F1ZGlvLmNhblBsYXlUeXBlKCdhdWRpby9tcGVnJyk7XG4gICAgICBfYXVkaW9TdXBwb3J0LmFhYyA9IF9hdWRpby5jYW5QbGF5VHlwZSgnYXVkaW8vbXA0OyBjb2RlY3M9XCJtcDRhLjQwLjJcIicpO1xuICAgICAgX2F1ZGlvU3VwcG9ydC5vZ2dWb3JiaXMgPSBfYXVkaW8uY2FuUGxheVR5cGUoJ2F1ZGlvL29nZzsgY29kZWNzPVwidm9yYmlzXCInKTtcbiAgICAgIF9hdWRpb1N1cHBvcnQub2dnT3B1cyA9IF9hdWRpby5jYW5QbGF5VHlwZSgnYXVkaW8vb2dnOyBjb2RlY3M9XCJvcHVzXCInKTtcbiAgICAgIF9hdWRpb1N1cHBvcnQud2VibSA9IF9hdWRpby5jYW5QbGF5VHlwZSgnYXVkaW8vd2VibTsgY29kZWNzPVwidm9yYmlzXCInKTtcbiAgICAgIF9hdWRpb1N1cHBvcnQud2F2ZSA9IF9hdWRpby5jYW5QbGF5VHlwZSgnYXVkaW8vd2F2OyBjb2RlY3M9XCIxXCInKTtcbiAgICAgIGNvbnZlcnRFbXB0eVN0cmluZ3NUb0ZhbHNlKF9hdWRpb1N1cHBvcnQpO1xuXG4gICAgLy8gYXVkaW8gZG9tIGVsZW1lbnQgY291bGRuJ3QgYmUgY3JlYXRlZCwgYXVkaW8gaXMgbm90IHN1cHBvcnRlZFxuICAgIH0gZWxzZSB7XG4gICAgICBfYXVkaW9TdXBwb3J0Lm1wMyA9IGZhbHNlO1xuICAgICAgX2F1ZGlvU3VwcG9ydC5hYWMgPSBmYWxzZTtcbiAgICAgIF9hdWRpb1N1cHBvcnQub2dnVm9yYmlzID0gZmFsc2U7XG4gICAgICBfYXVkaW9TdXBwb3J0Lm9nZ09wdXMgPSBmYWxzZTtcbiAgICAgIF9hdWRpb1N1cHBvcnQud2VibSA9IGZhbHNlO1xuICAgICAgX2F1ZGlvU3VwcG9ydC53YXZlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy/CoG1lbW9yeSBtYW5hZ2VtZW50XG4gICAgX2F1ZGlvID0gbnVsbDtcbiAgfVxuXG4gIC8vIHV0aWxzXG4gIGZ1bmN0aW9uIGNvbnZlcnRFbXB0eVN0cmluZ3NUb0ZhbHNlKHN1cHBvcnQpIHtcbiAgICAvLyBpdGVyYXRlIHRocm91Z2ggY29kZWNzLCBzZXQgYXMgbm90IHN1cHBvcnRlZCBpZiBpcyBlbXB0eSBzdHJpbmdcbiAgICBPYmplY3Qua2V5cyhzdXBwb3J0KS5mb3JFYWNoKHNldEFzRmFsc2VJZkVtcHR5KTtcblxuICAgIC8vIGl0ZXJhdG9yIG1ldGhvZFxuICAgIGZ1bmN0aW9uIHNldEFzRmFsc2VJZkVtcHR5KGtleSkge1xuICAgICAgaWYgKHN1cHBvcnRba2V5XSA9PT0gJycpIHtcbiAgICAgICAgc3VwcG9ydFtrZXldID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29kZWNEZXRlY3Q7XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9jb2RlYy1kZXRlY3Qvc3JjL2NvZGVjLWRldGVjdC5qc1xuLy8gbW9kdWxlIGlkID0gNlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9