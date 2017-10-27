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

let getMicrophone = (() => {
  var _ref = _asyncToGenerator(function* () {
    try {
      return yield navigator.mediaDevices.getUserMedia({
        audio: true
      });
    } catch (e) {
      if (e.name === "NotAllowedError") {
        console.warn("Microphone access not allowed.");
      } else {
        console.error(e);
      }
    }
  });

  return function getMicrophone() {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var mj = __webpack_require__(1);

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

const PEER_CONNECTION_CONFIG = {
  iceServers: [{ url: "stun:stun1.l.google.com:19302" }, { url: "stun:stun2.l.google.com:19302" }]
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
    this.occupantSubscribers = {};

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

  onWebsocketOpen() {
    var _this = this;

    return _asyncToGenerator(function* () {
      // Create the Janus Session
      yield _this.session.create();

      // Attach the SFU Plugin and create a RTCPeerConnection for the publisher.
      // The publisher sends audio and opens two bidirectional data channels.
      // One reliable datachannel and one unreliable.
      var publisher = yield _this.createPublisher();
      _this.publisher = publisher;

      _this.connectSuccess(_this.userId);

      // Add all of the initial occupants.
      for (let occupantId of publisher.initialOccupants) {
        if (occupantId !== publisher.userId) {
          _this.occupantSubscribers[occupantId] = _this.addOccupant(occupantId);
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

      if (data.event === "join") {
        this.occupantSubscribers[data.user_id] = this.addOccupant(data.user_id);
      } else if (data.event && data.event === "leave") {
        this.removeOccupant(data.user_id);
      }
    }
  }

  addOccupant(occupantId) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var subscriber = yield _this2.createSubscriber(occupantId);
      // Call the Networked AFrame callbacks for the new occupant.
      _this2.onOccupantConnected(occupantId);
      _this2.occupants[occupantId] = true;
      _this2.onOccupantsChanged(_this2.occupants);
      return subscriber;
    })();
  }

  removeOccupant(occupantId) {
    if (this.occupants[occupantId]) {
      delete this.occupants[occupantId];
      // Call the Networked AFrame callbacks for the removed occupant.
      this.onOccupantDisconnected(occupantId);
      this.onOccupantsChanged(this.occupants);
    }
  }

  createPublisher() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      var handle = new mj.JanusPluginHandle(_this3.session);
      yield handle.attach("janus.plugin.sfu");

      var peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

      peerConnection.addEventListener("icecandidate", function (event) {
        handle.sendTrickle(event.candidate);
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

      var mediaStream = yield getMicrophone();

      if (mediaStream) {
        peerConnection.addStream(mediaStream);
      }

      var offer = yield peerConnection.createOffer();
      yield peerConnection.setLocalDescription(offer);

      var answer = yield handle.sendJsep(offer);
      yield peerConnection.setRemoteDescription(answer.jsep);

      // Wait for the reliable datachannel to be open before we start sending messages on it.
      yield waitForEvent(reliableChannel, "open");

      // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
      var message = yield _this3.sendJoin(handle, _this3.room, _this3.userId, true);

      var initialOccupants = message.plugindata.data.response.user_ids;

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
      yield handle.attach("janus.plugin.sfu");

      var peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

      peerConnection.addEventListener("icecandidate", function (event) {
        handle.sendTrickle(event.candidate);
      });

      var offer = yield peerConnection.createOffer({
        offerToReceiveAudio: true
      });

      yield peerConnection.setLocalDescription(offer);
      var answer = yield handle.sendJsep(offer);
      yield peerConnection.setRemoteDescription(answer.jsep);

      // Send join message to janus. Don't listen for join/leave messages. Subscribe to the occupant's audio stream.
      yield _this4.sendJoin(handle, _this4.room, _this4.userId, false, [{
        publisher_id: occupantId,
        content_kind: ContentKind.Audio
      }]);

      // Get the occupant's audio stream.
      var streams = peerConnection.getRemoteStreams();
      var mediaStream = streams.length > 0 ? streams[0] : null;

      return {
        handle,
        mediaStream,
        peerConnection
      };
    })();
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
    var subscriber = this.occupantSubscribers[clientId];

    if (!subscriber) {
      throw new Error(`Subscriber for client: ${clientId} does not exist.`);
    }

    return subscriber.then(s => s.mediaStream);
  }

  enableMicrophone(enabled) {
    var microphoneStream = this.subscriber.mediaStream;

    if (microphoneStream) {
      var audioTracks = microphoneStream.getAudioTracks();

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
      (signal.janus === "error" ? handlers.reject : handlers.resolve)(signal);
    }
  }
};

/**
 * Sends a signal associated with this session. Signals should be JSON-serializable objects. Returns a promise that will
 * be resolved or rejected when a response to this signal is received, or when no response is received within the
 * session timeout.
 **/
JanusSession.prototype.send = function(signal) {
  if (module.exports.verbose) {
    console.debug("Outgoing Janus signal: ", signal);
  }
  signal = Object.assign({
    session_id: this.id,
    transaction: (this.nextTxId++).toString()
  }, signal);
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


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZTZiNGVjNjUwMWZhZmExODBkYjAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsImF1ZGlvIiwiZSIsIm5hbWUiLCJjb25zb2xlIiwid2FybiIsImVycm9yIiwiZ2V0TWljcm9waG9uZSIsIm1qIiwicmVxdWlyZSIsIkNvbnRlbnRLaW5kIiwiQXVkaW8iLCJWaWRlbyIsIkRhdGEiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIndhaXRGb3JFdmVudCIsInRhcmdldCIsImV2ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRFdmVudExpc3RlbmVyIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJsIiwiSmFudXNBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyb29tIiwidXNlcklkIiwic2VydmVyVXJsIiwid3MiLCJzZXNzaW9uIiwicHVibGlzaGVyIiwib2NjdXBhbnRzIiwib2NjdXBhbnRTdWJzY3JpYmVycyIsIm9uV2Vic29ja2V0TWVzc2FnZSIsImJpbmQiLCJvbkRhdGFDaGFubmVsTWVzc2FnZSIsInNldFNlcnZlclVybCIsInNldEFwcCIsImFwcCIsInNldFJvb20iLCJyb29tTmFtZSIsInBhcnNlSW50IiwiRXJyb3IiLCJzZXRXZWJSdGNPcHRpb25zIiwib3B0aW9ucyIsInNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMiLCJzdWNjZXNzTGlzdGVuZXIiLCJmYWlsdXJlTGlzdGVuZXIiLCJjb25uZWN0U3VjY2VzcyIsImNvbm5lY3RGYWlsdXJlIiwic2V0Um9vbU9jY3VwYW50TGlzdGVuZXIiLCJvY2N1cGFudExpc3RlbmVyIiwib25PY2N1cGFudHNDaGFuZ2VkIiwic2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMiLCJvcGVuTGlzdGVuZXIiLCJjbG9zZWRMaXN0ZW5lciIsIm1lc3NhZ2VMaXN0ZW5lciIsIm9uT2NjdXBhbnRDb25uZWN0ZWQiLCJvbk9jY3VwYW50RGlzY29ubmVjdGVkIiwib25PY2N1cGFudE1lc3NhZ2UiLCJjb25uZWN0IiwiV2ViU29ja2V0IiwiSmFudXNTZXNzaW9uIiwic2VuZCIsIl8iLCJvbldlYnNvY2tldE9wZW4iLCJjcmVhdGUiLCJjcmVhdGVQdWJsaXNoZXIiLCJvY2N1cGFudElkIiwiaW5pdGlhbE9jY3VwYW50cyIsImFkZE9jY3VwYW50IiwibWVzc2FnZSIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJyZWNlaXZlIiwicGx1Z2luZGF0YSIsInVzZXJfaWQiLCJyZW1vdmVPY2N1cGFudCIsInN1YnNjcmliZXIiLCJjcmVhdGVTdWJzY3JpYmVyIiwiaGFuZGxlIiwiSmFudXNQbHVnaW5IYW5kbGUiLCJhdHRhY2giLCJwZWVyQ29ubmVjdGlvbiIsIlJUQ1BlZXJDb25uZWN0aW9uIiwic2VuZFRyaWNrbGUiLCJjYW5kaWRhdGUiLCJ1bnJlbGlhYmxlQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwib3JkZXJlZCIsIm1heFJldHJhbnNtaXRzIiwicmVsaWFibGVDaGFubmVsIiwibWVkaWFTdHJlYW0iLCJhZGRTdHJlYW0iLCJvZmZlciIsImNyZWF0ZU9mZmVyIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsImFuc3dlciIsInNlbmRKc2VwIiwic2V0UmVtb3RlRGVzY3JpcHRpb24iLCJqc2VwIiwic2VuZEpvaW4iLCJyZXNwb25zZSIsInVzZXJfaWRzIiwib2ZmZXJUb1JlY2VpdmVBdWRpbyIsInB1Ymxpc2hlcl9pZCIsImNvbnRlbnRfa2luZCIsInN0cmVhbXMiLCJnZXRSZW1vdGVTdHJlYW1zIiwibGVuZ3RoIiwicm9vbUlkIiwibm90aWZ5Iiwic3BlY3MiLCJzZW5kTWVzc2FnZSIsImtpbmQiLCJyb29tX2lkIiwic3Vic2NyaXB0aW9uX3NwZWNzIiwiZGF0YVR5cGUiLCJzaG91bGRTdGFydENvbm5lY3Rpb25UbyIsImNsaWVudElkIiwic3RhcnRTdHJlYW1Db25uZWN0aW9uIiwiY2xvc2VTdHJlYW1Db25uZWN0aW9uIiwiZ2V0Q29ubmVjdFN0YXR1cyIsIk5BRiIsImFkYXB0ZXJzIiwiSVNfQ09OTkVDVEVEIiwiTk9UX0NPTk5FQ1RFRCIsImdldE1lZGlhU3RyZWFtIiwidGhlbiIsInMiLCJlbmFibGVNaWNyb3Bob25lIiwiZW5hYmxlZCIsIm1pY3JvcGhvbmVTdHJlYW0iLCJhdWRpb1RyYWNrcyIsImdldEF1ZGlvVHJhY2tzIiwic2VuZERhdGEiLCJzdHJpbmdpZnkiLCJzZW5kRGF0YUd1YXJhbnRlZWQiLCJicm9hZGNhc3REYXRhIiwiYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQiLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7K0JDM0NBLGFBQStCO0FBQzdCLFFBQUk7QUFDRixhQUFPLE1BQU1BLFVBQVVDLFlBQVYsQ0FBdUJDLFlBQXZCLENBQW9DO0FBQy9DQyxlQUFPO0FBRHdDLE9BQXBDLENBQWI7QUFHRCxLQUpELENBSUUsT0FBT0MsQ0FBUCxFQUFVO0FB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Q0E7QUFDQTtBQUNBIiwiZmlsZSI6Im5hZi1qYW51cy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgZTZiNGVjNjUwMWZhZmExODBkYjAiLCJ2YXIgbWogPSByZXF1aXJlKFwibWluaWphbnVzXCIpO1xyXG5cclxuY29uc3QgQ29udGVudEtpbmQgPSB7XHJcbiAgQXVkaW86IDEsXHJcbiAgVmlkZW86IDIsXHJcbiAgRGF0YTogNFxyXG59O1xyXG5cclxuZnVuY3Rpb24gcmFuZG9tVWludCgpIHtcclxuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3YWl0Rm9yRXZlbnQodGFyZ2V0LCBldmVudCkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZSA9PiByZXNvbHZlKGUpLCB7IG9uY2U6IHRydWUgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE1pY3JvcGhvbmUoKSB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7XHJcbiAgICAgIGF1ZGlvOiB0cnVlXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZiAoZS5uYW1lID09PSBcIk5vdEFsbG93ZWRFcnJvclwiKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihcIk1pY3JvcGhvbmUgYWNjZXNzIG5vdCBhbGxvd2VkLlwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBQRUVSX0NPTk5FQ1RJT05fQ09ORklHID0ge1xyXG4gIGljZVNlcnZlcnM6IFtcclxuICAgIHsgdXJsOiBcInN0dW46c3R1bjEubC5nb29nbGUuY29tOjE5MzAyXCIgfSxcclxuICAgIHsgdXJsOiBcInN0dW46c3R1bjIubC5nb29nbGUuY29tOjE5MzAyXCIgfVxyXG4gIF1cclxufTtcclxuXHJcbmNsYXNzIEphbnVzQWRhcHRlciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnJvb20gPSBudWxsO1xyXG4gICAgdGhpcy51c2VySWQgPSByYW5kb21VaW50KCk7XHJcblxyXG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSBudWxsO1xyXG4gICAgdGhpcy53cyA9IG51bGw7XHJcbiAgICB0aGlzLnNlc3Npb24gPSBudWxsO1xyXG5cclxuICAgIHRoaXMucHVibGlzaGVyID0gbnVsbDtcclxuICAgIHRoaXMub2NjdXBhbnRzID0ge307XHJcbiAgICB0aGlzLm9jY3VwYW50U3Vic2NyaWJlcnMgPSB7fTtcclxuXHJcbiAgICB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSA9IHRoaXMub25XZWJzb2NrZXRNZXNzYWdlLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlID0gdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZS5iaW5kKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgc2V0U2VydmVyVXJsKHVybCkge1xyXG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSB1cmw7XHJcbiAgfVxyXG5cclxuICBzZXRBcHAoYXBwKSB7fVxyXG5cclxuICBzZXRSb29tKHJvb21OYW1lKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLnJvb20gPSBwYXJzZUludChyb29tTmFtZSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJvb20gbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXIuXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7fVxyXG5cclxuICBzZXRTZXJ2ZXJDb25uZWN0TGlzdGVuZXJzKHN1Y2Nlc3NMaXN0ZW5lciwgZmFpbHVyZUxpc3RlbmVyKSB7XHJcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xyXG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcclxuICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkID0gb2NjdXBhbnRMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkID0gb3Blbkxpc3RlbmVyO1xyXG4gICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkID0gY2xvc2VkTGlzdGVuZXI7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlID0gbWVzc2FnZUxpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgY29ubmVjdCgpIHtcclxuICAgIHRoaXMud3MgPSBuZXcgV2ViU29ja2V0KHRoaXMuc2VydmVyVXJsLCBcImphbnVzLXByb3RvY29sXCIpO1xyXG4gICAgdGhpcy5zZXNzaW9uID0gbmV3IG1qLkphbnVzU2Vzc2lvbih0aGlzLndzLnNlbmQuYmluZCh0aGlzLndzKSk7XHJcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsIF8gPT4gdGhpcy5vbldlYnNvY2tldE9wZW4oKSk7XHJcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIG9uV2Vic29ja2V0T3BlbigpIHtcclxuICAgIC8vIENyZWF0ZSB0aGUgSmFudXMgU2Vzc2lvblxyXG4gICAgYXdhaXQgdGhpcy5zZXNzaW9uLmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vIEF0dGFjaCB0aGUgU0ZVIFBsdWdpbiBhbmQgY3JlYXRlIGEgUlRDUGVlckNvbm5lY3Rpb24gZm9yIHRoZSBwdWJsaXNoZXIuXHJcbiAgICAvLyBUaGUgcHVibGlzaGVyIHNlbmRzIGF1ZGlvIGFuZCBvcGVucyB0d28gYmlkaXJlY3Rpb25hbCBkYXRhIGNoYW5uZWxzLlxyXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cclxuICAgIHZhciBwdWJsaXNoZXIgPSBhd2FpdCB0aGlzLmNyZWF0ZVB1Ymxpc2hlcigpO1xyXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBwdWJsaXNoZXI7XHJcblxyXG4gICAgdGhpcy5jb25uZWN0U3VjY2Vzcyh0aGlzLnVzZXJJZCk7XHJcblxyXG4gICAgLy8gQWRkIGFsbCBvZiB0aGUgaW5pdGlhbCBvY2N1cGFudHMuXHJcbiAgICBmb3IgKGxldCBvY2N1cGFudElkIG9mIHB1Ymxpc2hlci5pbml0aWFsT2NjdXBhbnRzKSB7XHJcbiAgICAgIGlmIChvY2N1cGFudElkICE9PSBwdWJsaXNoZXIudXNlcklkKSB7XHJcbiAgICAgICAgdGhpcy5vY2N1cGFudFN1YnNjcmliZXJzW29jY3VwYW50SWRdID0gdGhpcy5hZGRPY2N1cGFudChvY2N1cGFudElkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25XZWJzb2NrZXRNZXNzYWdlKGV2ZW50KSB7XHJcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XHJcbiAgICB0aGlzLnNlc3Npb24ucmVjZWl2ZShtZXNzYWdlKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgYWxsIG9mIHRoZSBqb2luIGFuZCBsZWF2ZSBldmVudHMgZnJvbSB0aGUgcHVibGlzaGVyLlxyXG4gICAgaWYgKFxyXG4gICAgICBtZXNzYWdlLnBsdWdpbmRhdGEgJiZcclxuICAgICAgbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGFcclxuICAgICkge1xyXG4gICAgICB2YXIgZGF0YSA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhO1xyXG5cclxuICAgICAgaWYgKGRhdGEuZXZlbnQgPT09IFwiam9pblwiKSB7XHJcbiAgICAgICAgdGhpcy5vY2N1cGFudFN1YnNjcmliZXJzW2RhdGEudXNlcl9pZF0gPSB0aGlzLmFkZE9jY3VwYW50KGRhdGEudXNlcl9pZCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5ldmVudCAmJiBkYXRhLmV2ZW50ID09PSBcImxlYXZlXCIpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZU9jY3VwYW50KGRhdGEudXNlcl9pZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGFkZE9jY3VwYW50KG9jY3VwYW50SWQpIHtcclxuICAgIHZhciBzdWJzY3JpYmVyID0gYXdhaXQgdGhpcy5jcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpO1xyXG4gICAgLy8gQ2FsbCB0aGUgTmV0d29ya2VkIEFGcmFtZSBjYWxsYmFja3MgZm9yIHRoZSBuZXcgb2NjdXBhbnQuXHJcbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQob2NjdXBhbnRJZCk7XHJcbiAgICB0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSA9IHRydWU7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XHJcbiAgICByZXR1cm4gc3Vic2NyaWJlcjtcclxuICB9XHJcblxyXG4gIHJlbW92ZU9jY3VwYW50KG9jY3VwYW50SWQpIHtcclxuICAgIGlmICh0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSkge1xyXG4gICAgICBkZWxldGUgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF07XHJcbiAgICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgcmVtb3ZlZCBvY2N1cGFudC5cclxuICAgICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkKG9jY3VwYW50SWQpO1xyXG4gICAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVQdWJsaXNoZXIoKSB7XHJcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XHJcbiAgICBhd2FpdCBoYW5kbGUuYXR0YWNoKFwiamFudXMucGx1Z2luLnNmdVwiKTtcclxuXHJcbiAgICB2YXIgcGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XHJcblxyXG4gICAgcGVlckNvbm5lY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcihcImljZWNhbmRpZGF0ZVwiLCBldmVudCA9PiB7XHJcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldmVudC5jYW5kaWRhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuIHVucmVsaWFibGUgZGF0YWNoYW5uZWwgZm9yIHNlbmRpbmcgYW5kIHJlY2VpdmluZyBjb21wb25lbnQgdXBkYXRlcywgZXRjLlxyXG4gICAgdmFyIHVucmVsaWFibGVDaGFubmVsID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJ1bnJlbGlhYmxlXCIsIHtcclxuICAgICAgb3JkZXJlZDogZmFsc2UsXHJcbiAgICAgIG1heFJldHJhbnNtaXRzOiAwXHJcbiAgICB9KTtcclxuICAgIHVucmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIHJlbGlhYmxlIGRhdGFjaGFubmVsIGZvciBzZW5kaW5nIGFuZCByZWNpZXZpbmcgZW50aXR5IGluc3RhbnRpYXRpb25zLCBldGMuXHJcbiAgICB2YXIgcmVsaWFibGVDaGFubmVsID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJyZWxpYWJsZVwiLCB7XHJcbiAgICAgIG9yZGVyZWQ6IHRydWVcclxuICAgIH0pO1xyXG4gICAgcmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xyXG5cclxuICAgIHZhciBtZWRpYVN0cmVhbSA9IGF3YWl0IGdldE1pY3JvcGhvbmUoKTtcclxuXHJcbiAgICBpZiAobWVkaWFTdHJlYW0pIHtcclxuICAgICAgcGVlckNvbm5lY3Rpb24uYWRkU3RyZWFtKG1lZGlhU3RyZWFtKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcigpO1xyXG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XHJcblxyXG4gICAgdmFyIGFuc3dlciA9IGF3YWl0IGhhbmRsZS5zZW5kSnNlcChvZmZlcik7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihhbnN3ZXIuanNlcCk7XHJcblxyXG4gICAgLy8gV2FpdCBmb3IgdGhlIHJlbGlhYmxlIGRhdGFjaGFubmVsIHRvIGJlIG9wZW4gYmVmb3JlIHdlIHN0YXJ0IHNlbmRpbmcgbWVzc2FnZXMgb24gaXQuXHJcbiAgICBhd2FpdCB3YWl0Rm9yRXZlbnQocmVsaWFibGVDaGFubmVsLCBcIm9wZW5cIik7ICAgIFxyXG5cclxuICAgIC8vIFNlbmQgam9pbiBtZXNzYWdlIHRvIGphbnVzLiBMaXN0ZW4gZm9yIGpvaW4vbGVhdmUgbWVzc2FnZXMuIEF1dG9tYXRpY2FsbHkgc3Vic2NyaWJlIHRvIGFsbCB1c2VycycgV2ViUlRDIGRhdGEuXHJcbiAgICB2YXIgbWVzc2FnZSA9IGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCB0cnVlKTtcclxuXHJcbiAgICB2YXIgaW5pdGlhbE9jY3VwYW50cyA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhLnJlc3BvbnNlLnVzZXJfaWRzO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhhbmRsZSxcclxuICAgICAgaW5pdGlhbE9jY3VwYW50cyxcclxuICAgICAgcmVsaWFibGVDaGFubmVsLFxyXG4gICAgICB1bnJlbGlhYmxlQ2hhbm5lbCxcclxuICAgICAgbWVkaWFTdHJlYW0sXHJcbiAgICAgIHBlZXJDb25uZWN0aW9uXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKSB7XHJcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XHJcbiAgICBhd2FpdCBoYW5kbGUuYXR0YWNoKFwiamFudXMucGx1Z2luLnNmdVwiKTtcclxuXHJcbiAgICB2YXIgcGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XHJcblxyXG4gICAgcGVlckNvbm5lY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcihcImljZWNhbmRpZGF0ZVwiLCBldmVudCA9PiB7XHJcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldmVudC5jYW5kaWRhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIG9mZmVyID0gYXdhaXQgcGVlckNvbm5lY3Rpb24uY3JlYXRlT2ZmZXIoe1xyXG4gICAgICBvZmZlclRvUmVjZWl2ZUF1ZGlvOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcclxuICAgIHZhciBhbnN3ZXIgPSBhd2FpdCBoYW5kbGUuc2VuZEpzZXAob2ZmZXIpO1xyXG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0UmVtb3RlRGVzY3JpcHRpb24oYW5zd2VyLmpzZXApO1xyXG5cclxuICAgIC8vIFNlbmQgam9pbiBtZXNzYWdlIHRvIGphbnVzLiBEb24ndCBsaXN0ZW4gZm9yIGpvaW4vbGVhdmUgbWVzc2FnZXMuIFN1YnNjcmliZSB0byB0aGUgb2NjdXBhbnQncyBhdWRpbyBzdHJlYW0uXHJcbiAgICBhd2FpdCB0aGlzLnNlbmRKb2luKGhhbmRsZSwgdGhpcy5yb29tLCB0aGlzLnVzZXJJZCwgZmFsc2UsIFtcclxuICAgICAge1xyXG4gICAgICAgIHB1Ymxpc2hlcl9pZDogb2NjdXBhbnRJZCxcclxuICAgICAgICBjb250ZW50X2tpbmQ6IENvbnRlbnRLaW5kLkF1ZGlvXHJcbiAgICAgIH1cclxuICAgIF0pO1xyXG5cclxuICAgIC8vIEdldCB0aGUgb2NjdXBhbnQncyBhdWRpbyBzdHJlYW0uXHJcbiAgICB2YXIgc3RyZWFtcyA9IHBlZXJDb25uZWN0aW9uLmdldFJlbW90ZVN0cmVhbXMoKTtcclxuICAgIHZhciBtZWRpYVN0cmVhbSA9IHN0cmVhbXMubGVuZ3RoID4gMCA/IHN0cmVhbXNbMF0gOiBudWxsO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhhbmRsZSxcclxuICAgICAgbWVkaWFTdHJlYW0sXHJcbiAgICAgIHBlZXJDb25uZWN0aW9uXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgc2VuZEpvaW4oaGFuZGxlLCByb29tSWQsIHVzZXJJZCwgbm90aWZ5LCBzcGVjcykge1xyXG4gICAgcmV0dXJuIGhhbmRsZS5zZW5kTWVzc2FnZSh7XHJcbiAgICAgIGtpbmQ6IFwiam9pblwiLFxyXG4gICAgICByb29tX2lkOiByb29tSWQsXHJcbiAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcclxuICAgICAgbm90aWZ5LFxyXG4gICAgICBzdWJzY3JpcHRpb25fc3BlY3M6IHNwZWNzXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG9uRGF0YUNoYW5uZWxNZXNzYWdlKGV2ZW50KSB7XHJcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuZGF0YVR5cGUpIHtcclxuICAgICAgdGhpcy5vbk9jY3VwYW50TWVzc2FnZShudWxsLCBtZXNzYWdlLmRhdGFUeXBlLCBtZXNzYWdlLmRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2hvdWxkU3RhcnRDb25uZWN0aW9uVG8oY2xpZW50SWQpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7fVxyXG5cclxuICBjbG9zZVN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHt9XHJcblxyXG4gIGdldENvbm5lY3RTdGF0dXMoY2xpZW50SWQpIHtcclxuICAgIGlmICh0aGlzLm9jY3VwYW50c1tjbGllbnRJZF0pIHtcclxuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkge1xyXG4gICAgdmFyIHN1YnNjcmliZXIgPSB0aGlzLm9jY3VwYW50U3Vic2NyaWJlcnNbY2xpZW50SWRdO1xyXG5cclxuICAgIGlmICghc3Vic2NyaWJlcikge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFN1YnNjcmliZXIgZm9yIGNsaWVudDogJHtjbGllbnRJZH0gZG9lcyBub3QgZXhpc3QuYCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHN1YnNjcmliZXIudGhlbihzID0+IHMubWVkaWFTdHJlYW0pO1xyXG4gIH1cclxuXHJcbiAgZW5hYmxlTWljcm9waG9uZShlbmFibGVkKSB7XHJcbiAgICB2YXIgbWljcm9waG9uZVN0cmVhbSA9IHRoaXMuc3Vic2NyaWJlci5tZWRpYVN0cmVhbTtcclxuXHJcbiAgICBpZiAobWljcm9waG9uZVN0cmVhbSkge1xyXG4gICAgICB2YXIgYXVkaW9UcmFja3MgPSBtaWNyb3Bob25lU3RyZWFtLmdldEF1ZGlvVHJhY2tzKCk7XHJcblxyXG4gICAgICBpZiAoYXVkaW9UcmFja3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGF1ZGlvVHJhY2tzWzBdLmVuYWJsZWQgPSBlbmFibGVkO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YShjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMucHVibGlzaGVyLnVucmVsaWFibGVDaGFubmVsLnNlbmQoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFHdWFyYW50ZWVkKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIucmVsaWFibGVDaGFubmVsLnNlbmQoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgYnJvYWRjYXN0RGF0YShkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcclxuICB9XHJcblxyXG4gIGJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcclxuICB9XHJcbn1cclxuXHJcbk5BRi5hZGFwdGVycy5yZWdpc3RlcihcImphbnVzXCIsIEphbnVzQWRhcHRlcik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEphbnVzQWRhcHRlcjtcclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2luZGV4LmpzIiwiLyoqIFdoZXRoZXIgdG8gbG9nIGluZm9ybWF0aW9uIGFib3V0IGluY29taW5nIGFuZCBvdXRnb2luZyBKYW51cyBzaWduYWxzLiAqKi9cbnZhciB2ZXJib3NlID0gZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGhhbmRsZSB0byBhIHNpbmdsZSBKYW51cyBwbHVnaW4gb24gYSBKYW51cyBzZXNzaW9uLiBFYWNoIFdlYlJUQyBjb25uZWN0aW9uIHRvIHRoZSBKYW51cyBzZXJ2ZXIgd2lsbCBiZVxuICogYXNzb2NpYXRlZCB3aXRoIGEgc2luZ2xlIGhhbmRsZS4gT25jZSBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCB0aGlzIGhhbmRsZSB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZVxuICogdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNoYW5kbGVzLlxuICoqL1xuZnVuY3Rpb24gSmFudXNQbHVnaW5IYW5kbGUoc2Vzc2lvbikge1xuICB0aGlzLnNlc3Npb24gPSBzZXNzaW9uO1xuICB0aGlzLmlkID0gdW5kZWZpbmVkO1xufVxuXG4vKiogQXR0YWNoZXMgdGhpcyBoYW5kbGUgdG8gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKHBsdWdpbikge1xuICB2YXIgcGF5bG9hZCA9IHsgamFudXM6IFwiYXR0YWNoXCIsIHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGV0YWNoXCIgfSk7XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gU2lnbmFscyBzaG91bGQgYmUgSlNPTi1zZXJpYWxpemFibGUgb2JqZWN0cy4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsXG4gKiBiZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgdG8gdGhpcyBzaWduYWwgaXMgcmVjZWl2ZWQsIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZVxuICogc2Vzc2lvbiB0aW1lb3V0LlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKE9iamVjdC5hc3NpZ24oeyBoYW5kbGVfaWQ6IHRoaXMuaWQgfSwgc2lnbmFsKSk7XG59O1xuXG4vKiogU2VuZHMgYSBwbHVnaW4tc3BlY2lmaWMgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oYm9keSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcIm1lc3NhZ2VcIiwgYm9keToge30sIGpzZXA6IGpzZXAgfSk7XG59O1xuXG4vKiogU2VuZHMgYW4gSUNFIHRyaWNrbGUgY2FuZGlkYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZFRyaWNrbGUgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcInRyaWNrbGVcIiwgIGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7XG4gICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICBrZWVwYWxpdmVNczogMzAwMDBcbiAgfTtcbn1cblxuLyoqIENyZWF0ZXMgdGhpcyBzZXNzaW9uIG9uIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJjcmVhdGVcIiB9KS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqIERlc3Ryb3lzIHRoaXMgc2Vzc2lvbi4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImRlc3Ryb3lcIiB9KTtcbn07XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIHJlY2VpdmluZyBKU09OIHNpZ25hbGxpbmcgbWVzc2FnZXMgcGVydGluZW50IHRvIHRoaXMgc2Vzc2lvbi4gSWYgdGhlIHNpZ25hbHMgYXJlIHJlc3BvbnNlcyB0byBwcmV2aW91c2x5XG4gKiBzZW50IHNpZ25hbHMsIHRoZSBwcm9taXNlcyBmb3IgdGhlIG91dGdvaW5nIHNpZ25hbHMgd2lsbCBiZSByZXNvbHZlZCBvciByZWplY3RlZCBhcHByb3ByaWF0ZWx5IHdpdGggdGhpcyBzaWduYWwgYXMgYW5cbiAqIGFyZ3VtZW50LlxuICpcbiAqIEV4dGVybmFsIGNhbGxlcnMgc2hvdWxkIGNhbGwgdGhpcyBmdW5jdGlvbiBldmVyeSB0aW1lIGEgbmV3IHNpZ25hbCBhcnJpdmVzIG9uIHRoZSB0cmFuc3BvcnQ7IGZvciBleGFtcGxlLCBpbiBhXG4gKiBXZWJTb2NrZXQncyBgbWVzc2FnZWAgZXZlbnQsIG9yIHdoZW4gYSBuZXcgZGF0dW0gc2hvd3MgdXAgaW4gYW4gSFRUUCBsb25nLXBvbGxpbmcgcmVzcG9uc2UuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLnJlY2VpdmUgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgaWYgKG1vZHVsZS5leHBvcnRzLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiSW5jb21pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICBpZiAoc2lnbmFsLnRyYW5zYWN0aW9uICE9IG51bGwpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICBpZiAoc2lnbmFsLmphbnVzID09PSBcImFja1wiICYmIHNpZ25hbC5oaW50KSB7XG4gICAgICAvLyB0aGlzIGlzIGFuIGFjayBvZiBhbiBhc3luY2hyb25vdXNseS1wcm9jZXNzZWQgcmVxdWVzdCwgd2Ugc2hvdWxkIHdhaXRcbiAgICAgIC8vIHRvIHJlc29sdmUgdGhlIHByb21pc2UgdW50aWwgdGhlIGFjdHVhbCByZXNwb25zZSBjb21lcyBpblxuICAgIH0gZWxzZSBpZiAoaGFuZGxlcnMgIT0gbnVsbCkge1xuICAgICAgaWYgKGhhbmRsZXJzLnRpbWVvdXQgIT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaGFuZGxlcnMudGltZW91dCk7XG4gICAgICB9XG4gICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAoc2lnbmFsLmphbnVzID09PSBcImVycm9yXCIgPyBoYW5kbGVycy5yZWplY3QgOiBoYW5kbGVycy5yZXNvbHZlKShzaWduYWwpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBTZW5kcyBhIHNpZ25hbCBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uLiBTaWduYWxzIHNob3VsZCBiZSBKU09OLXNlcmlhbGl6YWJsZSBvYmplY3RzLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGxcbiAqIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIHdoZW4gYSByZXNwb25zZSB0byB0aGlzIHNpZ25hbCBpcyByZWNlaXZlZCwgb3Igd2hlbiBubyByZXNwb25zZSBpcyByZWNlaXZlZCB3aXRoaW4gdGhlXG4gKiBzZXNzaW9uIHRpbWVvdXQuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgaWYgKG1vZHVsZS5leHBvcnRzLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiT3V0Z29pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICBzaWduYWwgPSBPYmplY3QuYXNzaWduKHtcbiAgICBzZXNzaW9uX2lkOiB0aGlzLmlkLFxuICAgIHRyYW5zYWN0aW9uOiAodGhpcy5uZXh0VHhJZCsrKS50b1N0cmluZygpXG4gIH0sIHNpZ25hbCk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZW91dE1zKSB7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlNpZ25hbGxpbmcgbWVzc2FnZSB0aW1lZCBvdXQuXCIpKTtcbiAgICAgIH0sIHRoaXMub3B0aW9ucy50aW1lb3V0TXMpO1xuICAgIH1cbiAgICB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXSA9IHsgcmVzb2x2ZTogcmVzb2x2ZSwgcmVqZWN0OiByZWplY3QsIHRpbWVvdXQ6IHRpbWVvdXQgfTtcbiAgICB0aGlzLm91dHB1dChKU09OLnN0cmluZ2lmeShzaWduYWwpKTtcbiAgICB0aGlzLl9yZXNldEtlZXBhbGl2ZSgpO1xuICB9KTtcbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX3Jlc2V0S2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmtlZXBhbGl2ZVRpbWVvdXQpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5rZWVwYWxpdmVUaW1lb3V0KTtcbiAgfVxuICBpZiAodGhpcy5vcHRpb25zLmtlZXBhbGl2ZU1zKSB7XG4gICAgdGhpcy5rZWVwYWxpdmVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9rZWVwYWxpdmUoKSwgdGhpcy5vcHRpb25zLmtlZXBhbGl2ZU1zKTtcbiAgfVxufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fa2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJrZWVwYWxpdmVcIiB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBKYW51c1BsdWdpbkhhbmRsZSxcbiAgSmFudXNTZXNzaW9uLFxuICB2ZXJib3NlXG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvbWluaWphbnVzL21pbmlqYW51cy5qc1xuLy8gbW9kdWxlIGlkID0gMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9