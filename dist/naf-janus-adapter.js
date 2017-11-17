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
      var publisherPromise = _this.createPublisher();
      _this.occupantPromises[_this.userId] = publisherPromise;
      _this.publisher = yield publisherPromise;

      _this.connectSuccess(_this.userId);

      // Add all of the initial occupants.
      for (let occupantId of _this.publisher.initialOccupants) {
        if (occupantId !== _this.userId) {
          _this.occupantPromises[occupantId] = _this.addOccupant(occupantId);
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
        this.occupantPromises[data.user_id] = this.addOccupant(data.user_id);
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

      var mediaStream;
      if (_this3.webRtcOptions.audio) {
        mediaStream = yield getMicrophone();

        if (mediaStream) {
          peerConnection.addStream(mediaStream);
        }
      }

      var offer = yield peerConnection.createOffer();
      yield peerConnection.setLocalDescription(offer);

      var answer = yield handle.sendJsep(offer);
      yield peerConnection.setRemoteDescription(answer.jsep);

      // Wait for the reliable datachannel to be open before we start sending messages on it.
      yield waitForEvent(reliableChannel, "open");

      // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
      var message = yield _this3.sendJoin(handle, _this3.room, _this3.userId, { notifications: true, data: true });

      var initialOccupants = message.plugindata.data.response.users[_this3.room];

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
      yield _this4.sendJoin(handle, _this4.room, _this4.userId, { notifications: false, media: occupantId });

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
    var occupantPromise = this.occupantPromises[clientId];

    if (!occupantPromise) {
      return Promise.reject(new Error(`Subscriber for client: ${clientId} does not exist.`));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYjEwZGMxY2YyNjQzYTJkYzM4MDEiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsImF1ZGlvIiwiZSIsIm5hbWUiLCJjb25zb2xlIiwid2FybiIsImVycm9yIiwiZ2V0TWljcm9waG9uZSIsIm1qIiwicmVxdWlyZSIsIkNvbnRlbnRLaW5kIiwiQXVkaW8iLCJWaWRlbyIsIkRhdGEiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIndhaXRGb3JFdmVudCIsInRhcmdldCIsImV2ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRFdmVudExpc3RlbmVyIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJscyIsIkphbnVzQWRhcHRlciIsImNvbnN0cnVjdG9yIiwicm9vbSIsInVzZXJJZCIsInNlcnZlclVybCIsIndlYlJ0Y09wdGlvbnMiLCJ3cyIsInNlc3Npb24iLCJwdWJsaXNoZXIiLCJvY2N1cGFudHMiLCJvY2N1cGFudFByb21pc2VzIiwib25XZWJzb2NrZXRNZXNzYWdlIiwiYmluZCIsIm9uRGF0YUNoYW5uZWxNZXNzYWdlIiwic2V0U2VydmVyVXJsIiwidXJsIiwic2V0QXBwIiwiYXBwIiwic2V0Um9vbSIsInJvb21OYW1lIiwicGFyc2VJbnQiLCJFcnJvciIsInNldFdlYlJ0Y09wdGlvbnMiLCJvcHRpb25zIiwic2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyIsInN1Y2Nlc3NMaXN0ZW5lciIsImZhaWx1cmVMaXN0ZW5lciIsImNvbm5lY3RTdWNjZXNzIiwiY29ubmVjdEZhaWx1cmUiLCJzZXRSb29tT2NjdXBhbnRMaXN0ZW5lciIsIm9jY3VwYW50TGlzdGVuZXIiLCJvbk9jY3VwYW50c0NoYW5nZWQiLCJzZXREYXRhQ2hhbm5lbExpc3RlbmVycyIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwib25PY2N1cGFudENvbm5lY3RlZCIsIm9uT2NjdXBhbnREaXNjb25uZWN0ZWQiLCJvbk9jY3VwYW50TWVzc2FnZSIsImNvbm5lY3QiLCJXZWJTb2NrZXQiLCJKYW51c1Nlc3Npb24iLCJzZW5kIiwiXyIsIm9uV2Vic29ja2V0T3BlbiIsImNyZWF0ZSIsInB1Ymxpc2hlclByb21pc2UiLCJjcmVhdGVQdWJsaXNoZXIiLCJvY2N1cGFudElkIiwiaW5pdGlhbE9jY3VwYW50cyIsImFkZE9jY3VwYW50IiwibWVzc2FnZSIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJyZWNlaXZlIiwicGx1Z2luZGF0YSIsInVzZXJfaWQiLCJyZW1vdmVPY2N1cGFudCIsInN1YnNjcmliZXIiLCJjcmVhdGVTdWJzY3JpYmVyIiwiaGFuZGxlIiwiSmFudXNQbHVnaW5IYW5kbGUiLCJhdHRhY2giLCJwZWVyQ29ubmVjdGlvbiIsIlJUQ1BlZXJDb25uZWN0aW9uIiwic2VuZFRyaWNrbGUiLCJjYW5kaWRhdGUiLCJ1bnJlbGlhYmxlQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwib3JkZXJlZCIsIm1heFJldHJhbnNtaXRzIiwicmVsaWFibGVDaGFubmVsIiwibWVkaWFTdHJlYW0iLCJhZGRTdHJlYW0iLCJvZmZlciIsImNyZWF0ZU9mZmVyIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsImFuc3dlciIsInNlbmRKc2VwIiwic2V0UmVtb3RlRGVzY3JpcHRpb24iLCJqc2VwIiwic2VuZEpvaW4iLCJub3RpZmljYXRpb25zIiwicmVzcG9uc2UiLCJ1c2VycyIsIm9mZmVyVG9SZWNlaXZlQXVkaW8iLCJtZWRpYSIsInN0cmVhbXMiLCJnZXRSZW1vdGVTdHJlYW1zIiwibGVuZ3RoIiwicm9vbUlkIiwic3Vic2NyaWJlIiwic2VuZE1lc3NhZ2UiLCJraW5kIiwicm9vbV9pZCIsImRhdGFUeXBlIiwic2hvdWxkU3RhcnRDb25uZWN0aW9uVG8iLCJjbGllbnRJZCIsInN0YXJ0U3RyZWFtQ29ubmVjdGlvbiIsImNsb3NlU3RyZWFtQ29ubmVjdGlvbiIsImdldENvbm5lY3RTdGF0dXMiLCJOQUYiLCJhZGFwdGVycyIsIklTX0NPTk5FQ1RFRCIsIk5PVF9DT05ORUNURUQiLCJnZXRNZWRpYVN0cmVhbSIsIm9jY3VwYW50UHJvbWlzZSIsInRoZW4iLCJzIiwiZW5hYmxlTWljcm9waG9uZSIsImVuYWJsZWQiLCJhdWRpb1RyYWNrcyIsImdldEF1ZGlvVHJhY2tzIiwic2VuZERhdGEiLCJzdHJpbmdpZnkiLCJzZW5kRGF0YUd1YXJhbnRlZWQiLCJicm9hZGNhc3REYXRhIiwiYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQiLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7K0JDM0NBLGFBQStCO0FBQzdCLFFBQUk7QUFDRixhQUFPLE1BQU1BLFVBQVVDLFlBQVYsQ0FBdUJDLFlBQXZCLENBQW9DO0FBQy9DQyxlQUFPO0FBRHdDLE9BQXBDLENBQWI7QUFHRCxLQUpELENBSUUsT0FBT0MsQ0FBUCxFQUFV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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQixxQkFBcUI7QUFDekM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJuYWYtamFudXMtYWRhcHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIGIxMGRjMWNmMjY0M2EyZGMzODAxIiwidmFyIG1qID0gcmVxdWlyZShcIm1pbmlqYW51c1wiKTtcclxuXHJcbmNvbnN0IENvbnRlbnRLaW5kID0ge1xyXG4gIEF1ZGlvOiAxLFxyXG4gIFZpZGVvOiAyLFxyXG4gIERhdGE6IDRcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJhbmRvbVVpbnQoKSB7XHJcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKTtcclxufVxyXG5cclxuZnVuY3Rpb24gd2FpdEZvckV2ZW50KHRhcmdldCwgZXZlbnQpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGUgPT4gcmVzb2x2ZShlKSwgeyBvbmNlOiB0cnVlIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRNaWNyb3Bob25lKCkge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoe1xyXG4gICAgICBhdWRpbzogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgaWYgKGUubmFtZSA9PT0gXCJOb3RBbGxvd2VkRXJyb3JcIikge1xyXG4gICAgICBjb25zb2xlLndhcm4oXCJNaWNyb3Bob25lIGFjY2VzcyBub3QgYWxsb3dlZC5cIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuY29uc3QgUEVFUl9DT05ORUNUSU9OX0NPTkZJRyA9IHtcclxuICBpY2VTZXJ2ZXJzOiBbXHJcbiAgICB7IHVybHM6IFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxyXG4gICAgeyB1cmxzOiBcInN0dW46c3R1bjIubC5nb29nbGUuY29tOjE5MzAyXCIgfVxyXG4gIF1cclxufTtcclxuXHJcbmNsYXNzIEphbnVzQWRhcHRlciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnJvb20gPSBudWxsO1xyXG4gICAgdGhpcy51c2VySWQgPSByYW5kb21VaW50KCk7XHJcblxyXG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSBudWxsO1xyXG4gICAgdGhpcy53ZWJSdGNPcHRpb25zID0ge307XHJcbiAgICB0aGlzLndzID0gbnVsbDtcclxuICAgIHRoaXMuc2Vzc2lvbiA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBudWxsO1xyXG4gICAgdGhpcy5vY2N1cGFudHMgPSB7fTtcclxuICAgIHRoaXMub2NjdXBhbnRQcm9taXNlcyA9IHt9O1xyXG5cclxuICAgIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlID0gdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UuYmluZCh0aGlzKTtcclxuICAgIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UgPSB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlLmJpbmQodGhpcyk7XHJcbiAgfVxyXG5cclxuICBzZXRTZXJ2ZXJVcmwodXJsKSB7XHJcbiAgICB0aGlzLnNlcnZlclVybCA9IHVybDtcclxuICB9XHJcblxyXG4gIHNldEFwcChhcHApIHt9XHJcblxyXG4gIHNldFJvb20ocm9vbU5hbWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMucm9vbSA9IHBhcnNlSW50KHJvb21OYW1lKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUm9vbSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci5cIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRXZWJSdGNPcHRpb25zKG9wdGlvbnMpIHtcclxuICAgIHRoaXMud2ViUnRjT3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgfVxyXG5cclxuICBzZXRTZXJ2ZXJDb25uZWN0TGlzdGVuZXJzKHN1Y2Nlc3NMaXN0ZW5lciwgZmFpbHVyZUxpc3RlbmVyKSB7XHJcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xyXG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcclxuICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkID0gb2NjdXBhbnRMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkID0gb3Blbkxpc3RlbmVyO1xyXG4gICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkID0gY2xvc2VkTGlzdGVuZXI7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlID0gbWVzc2FnZUxpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgY29ubmVjdCgpIHtcclxuICAgIHRoaXMud3MgPSBuZXcgV2ViU29ja2V0KHRoaXMuc2VydmVyVXJsLCBcImphbnVzLXByb3RvY29sXCIpO1xyXG4gICAgdGhpcy5zZXNzaW9uID0gbmV3IG1qLkphbnVzU2Vzc2lvbih0aGlzLndzLnNlbmQuYmluZCh0aGlzLndzKSk7XHJcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsIF8gPT4gdGhpcy5vbldlYnNvY2tldE9wZW4oKSk7XHJcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIG9uV2Vic29ja2V0T3BlbigpIHtcclxuICAgIC8vIENyZWF0ZSB0aGUgSmFudXMgU2Vzc2lvblxyXG4gICAgYXdhaXQgdGhpcy5zZXNzaW9uLmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vIEF0dGFjaCB0aGUgU0ZVIFBsdWdpbiBhbmQgY3JlYXRlIGEgUlRDUGVlckNvbm5lY3Rpb24gZm9yIHRoZSBwdWJsaXNoZXIuXHJcbiAgICAvLyBUaGUgcHVibGlzaGVyIHNlbmRzIGF1ZGlvIGFuZCBvcGVucyB0d28gYmlkaXJlY3Rpb25hbCBkYXRhIGNoYW5uZWxzLlxyXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cclxuICAgIHZhciBwdWJsaXNoZXJQcm9taXNlID0gdGhpcy5jcmVhdGVQdWJsaXNoZXIoKTtcclxuICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1t0aGlzLnVzZXJJZF0gPSBwdWJsaXNoZXJQcm9taXNlO1xyXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBhd2FpdCBwdWJsaXNoZXJQcm9taXNlO1xyXG5cclxuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3ModGhpcy51c2VySWQpO1xyXG5cclxuICAgIC8vIEFkZCBhbGwgb2YgdGhlIGluaXRpYWwgb2NjdXBhbnRzLlxyXG4gICAgZm9yIChsZXQgb2NjdXBhbnRJZCBvZiB0aGlzLnB1Ymxpc2hlci5pbml0aWFsT2NjdXBhbnRzKSB7XHJcbiAgICAgIGlmIChvY2N1cGFudElkICE9PSB0aGlzLnVzZXJJZCkge1xyXG4gICAgICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1tvY2N1cGFudElkXSA9IHRoaXMuYWRkT2NjdXBhbnQob2NjdXBhbnRJZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIG9uV2Vic29ja2V0TWVzc2FnZShldmVudCkge1xyXG4gICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xyXG4gICAgdGhpcy5zZXNzaW9uLnJlY2VpdmUobWVzc2FnZSk7XHJcblxyXG4gICAgLy8gSGFuZGxlIGFsbCBvZiB0aGUgam9pbiBhbmQgbGVhdmUgZXZlbnRzIGZyb20gdGhlIHB1Ymxpc2hlci5cclxuICAgIGlmIChtZXNzYWdlLnBsdWdpbmRhdGEgJiYgbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEpIHtcclxuICAgICAgdmFyIGRhdGEgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YTtcclxuXHJcbiAgICAgIGlmIChkYXRhLmV2ZW50ID09PSBcImpvaW5cIikge1xyXG4gICAgICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1tkYXRhLnVzZXJfaWRdID0gdGhpcy5hZGRPY2N1cGFudChkYXRhLnVzZXJfaWQpO1xyXG4gICAgICB9IGVsc2UgaWYgKGRhdGEuZXZlbnQgJiYgZGF0YS5ldmVudCA9PT0gXCJsZWF2ZVwiKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVPY2N1cGFudChkYXRhLnVzZXJfaWQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBhZGRPY2N1cGFudChvY2N1cGFudElkKSB7XHJcbiAgICB2YXIgc3Vic2NyaWJlciA9IGF3YWl0IHRoaXMuY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKTtcclxuICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgbmV3IG9jY3VwYW50LlxyXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkKG9jY3VwYW50SWQpO1xyXG4gICAgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0gPSB0cnVlO1xyXG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xyXG4gICAgcmV0dXJuIHN1YnNjcmliZXI7XHJcbiAgfVxyXG5cclxuICByZW1vdmVPY2N1cGFudChvY2N1cGFudElkKSB7XHJcbiAgICBpZiAodGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0pIHtcclxuICAgICAgZGVsZXRlIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdO1xyXG4gICAgICAvLyBDYWxsIHRoZSBOZXR3b3JrZWQgQUZyYW1lIGNhbGxiYWNrcyBmb3IgdGhlIHJlbW92ZWQgb2NjdXBhbnQuXHJcbiAgICAgIHRoaXMub25PY2N1cGFudERpc2Nvbm5lY3RlZChvY2N1cGFudElkKTtcclxuICAgICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgY3JlYXRlUHVibGlzaGVyKCkge1xyXG4gICAgdmFyIGhhbmRsZSA9IG5ldyBtai5KYW51c1BsdWdpbkhhbmRsZSh0aGlzLnNlc3Npb24pO1xyXG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XHJcblxyXG4gICAgdmFyIHBlZXJDb25uZWN0aW9uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKFBFRVJfQ09OTkVDVElPTl9DT05GSUcpO1xyXG5cclxuICAgIHBlZXJDb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJpY2VjYW5kaWRhdGVcIiwgZXZlbnQgPT4ge1xyXG4gICAgICBoYW5kbGUuc2VuZFRyaWNrbGUoZXZlbnQuY2FuZGlkYXRlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhbiB1bnJlbGlhYmxlIGRhdGFjaGFubmVsIGZvciBzZW5kaW5nIGFuZCByZWNlaXZpbmcgY29tcG9uZW50IHVwZGF0ZXMsIGV0Yy5cclxuICAgIHZhciB1bnJlbGlhYmxlQ2hhbm5lbCA9IHBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwidW5yZWxpYWJsZVwiLCB7XHJcbiAgICAgIG9yZGVyZWQ6IGZhbHNlLFxyXG4gICAgICBtYXhSZXRyYW5zbWl0czogMFxyXG4gICAgfSk7XHJcbiAgICB1bnJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSByZWxpYWJsZSBkYXRhY2hhbm5lbCBmb3Igc2VuZGluZyBhbmQgcmVjaWV2aW5nIGVudGl0eSBpbnN0YW50aWF0aW9ucywgZXRjLlxyXG4gICAgdmFyIHJlbGlhYmxlQ2hhbm5lbCA9IHBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwicmVsaWFibGVcIiwge1xyXG4gICAgICBvcmRlcmVkOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIHJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcclxuXHJcbiAgICB2YXIgbWVkaWFTdHJlYW07XHJcbiAgICBpZiAodGhpcy53ZWJSdGNPcHRpb25zLmF1ZGlvKSB7XHJcbiAgICAgIG1lZGlhU3RyZWFtID0gYXdhaXQgZ2V0TWljcm9waG9uZSgpO1xyXG5cclxuICAgICAgaWYgKG1lZGlhU3RyZWFtKSB7XHJcbiAgICAgICAgcGVlckNvbm5lY3Rpb24uYWRkU3RyZWFtKG1lZGlhU3RyZWFtKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBvZmZlciA9IGF3YWl0IHBlZXJDb25uZWN0aW9uLmNyZWF0ZU9mZmVyKCk7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcclxuXHJcbiAgICB2YXIgYW5zd2VyID0gYXdhaXQgaGFuZGxlLnNlbmRKc2VwKG9mZmVyKTtcclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKGFuc3dlci5qc2VwKTtcclxuXHJcbiAgICAvLyBXYWl0IGZvciB0aGUgcmVsaWFibGUgZGF0YWNoYW5uZWwgdG8gYmUgb3BlbiBiZWZvcmUgd2Ugc3RhcnQgc2VuZGluZyBtZXNzYWdlcyBvbiBpdC5cclxuICAgIGF3YWl0IHdhaXRGb3JFdmVudChyZWxpYWJsZUNoYW5uZWwsIFwib3BlblwiKTtcclxuXHJcbiAgICAvLyBTZW5kIGpvaW4gbWVzc2FnZSB0byBqYW51cy4gTGlzdGVuIGZvciBqb2luL2xlYXZlIG1lc3NhZ2VzLiBBdXRvbWF0aWNhbGx5IHN1YnNjcmliZSB0byBhbGwgdXNlcnMnIFdlYlJUQyBkYXRhLlxyXG4gICAgdmFyIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnNlbmRKb2luKGhhbmRsZSwgdGhpcy5yb29tLCB0aGlzLnVzZXJJZCwge25vdGlmaWNhdGlvbnM6IHRydWUsIGRhdGE6IHRydWV9KTtcclxuXHJcbiAgICB2YXIgaW5pdGlhbE9jY3VwYW50cyA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhLnJlc3BvbnNlLnVzZXJzW3RoaXMucm9vbV07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGFuZGxlLFxyXG4gICAgICBpbml0aWFsT2NjdXBhbnRzLFxyXG4gICAgICByZWxpYWJsZUNoYW5uZWwsXHJcbiAgICAgIHVucmVsaWFibGVDaGFubmVsLFxyXG4gICAgICBtZWRpYVN0cmVhbSxcclxuICAgICAgcGVlckNvbm5lY3Rpb25cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpIHtcclxuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcclxuICAgIGF3YWl0IGhhbmRsZS5hdHRhY2goXCJqYW51cy5wbHVnaW4uc2Z1XCIpO1xyXG5cclxuICAgIHZhciBwZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcclxuXHJcbiAgICBwZWVyQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ZW50ID0+IHtcclxuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2ZW50LmNhbmRpZGF0ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcih7XHJcbiAgICAgIG9mZmVyVG9SZWNlaXZlQXVkaW86IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xyXG4gICAgdmFyIGFuc3dlciA9IGF3YWl0IGhhbmRsZS5zZW5kSnNlcChvZmZlcik7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihhbnN3ZXIuanNlcCk7XHJcblxyXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIERvbid0IGxpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gU3Vic2NyaWJlIHRvIHRoZSBvY2N1cGFudCdzIGF1ZGlvIHN0cmVhbS5cclxuICAgIGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCB7IG5vdGlmaWNhdGlvbnM6IGZhbHNlLCBtZWRpYTogb2NjdXBhbnRJZCB9KTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIG9jY3VwYW50J3MgYXVkaW8gc3RyZWFtLlxyXG4gICAgdmFyIHN0cmVhbXMgPSBwZWVyQ29ubmVjdGlvbi5nZXRSZW1vdGVTdHJlYW1zKCk7XHJcbiAgICB2YXIgbWVkaWFTdHJlYW0gPSBzdHJlYW1zLmxlbmd0aCA+IDAgPyBzdHJlYW1zWzBdIDogbnVsbDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBoYW5kbGUsXHJcbiAgICAgIG1lZGlhU3RyZWFtLFxyXG4gICAgICBwZWVyQ29ubmVjdGlvblxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHNlbmRKb2luKGhhbmRsZSwgcm9vbUlkLCB1c2VySWQsIHN1YnNjcmliZSkge1xyXG4gICAgcmV0dXJuIGhhbmRsZS5zZW5kTWVzc2FnZSh7XHJcbiAgICAgIGtpbmQ6IFwiam9pblwiLFxyXG4gICAgICByb29tX2lkOiByb29tSWQsXHJcbiAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcclxuICAgICAgc3Vic2NyaWJlXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG9uRGF0YUNoYW5uZWxNZXNzYWdlKGV2ZW50KSB7XHJcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuZGF0YVR5cGUpIHtcclxuICAgICAgdGhpcy5vbk9jY3VwYW50TWVzc2FnZShudWxsLCBtZXNzYWdlLmRhdGFUeXBlLCBtZXNzYWdlLmRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2hvdWxkU3RhcnRDb25uZWN0aW9uVG8oY2xpZW50SWQpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7fVxyXG5cclxuICBjbG9zZVN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHt9XHJcblxyXG4gIGdldENvbm5lY3RTdGF0dXMoY2xpZW50SWQpIHtcclxuICAgIGlmICh0aGlzLm9jY3VwYW50c1tjbGllbnRJZF0pIHtcclxuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkge1xyXG4gICAgdmFyIG9jY3VwYW50UHJvbWlzZSA9IHRoaXMub2NjdXBhbnRQcm9taXNlc1tjbGllbnRJZF07XHJcblxyXG4gICAgaWYgKCFvY2N1cGFudFByb21pc2UpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxyXG4gICAgICAgIG5ldyBFcnJvcihgU3Vic2NyaWJlciBmb3IgY2xpZW50OiAke2NsaWVudElkfSBkb2VzIG5vdCBleGlzdC5gKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvY2N1cGFudFByb21pc2UudGhlbihzID0+IHMubWVkaWFTdHJlYW0pO1xyXG4gIH1cclxuXHJcbiAgZW5hYmxlTWljcm9waG9uZShlbmFibGVkKSB7XHJcbiAgICBpZiAodGhpcy5wdWJsaXNoZXIgJiYgdGhpcy5wdWJsaXNoZXIubWVkaWFTdHJlYW0pIHtcclxuICAgICAgdmFyIGF1ZGlvVHJhY2tzID0gdGhpcy5wdWJsaXNoZXIubWVkaWFTdHJlYW0uZ2V0QXVkaW9UcmFja3MoKTtcclxuXHJcbiAgICAgIGlmIChhdWRpb1RyYWNrcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgYXVkaW9UcmFja3NbMF0uZW5hYmxlZCA9IGVuYWJsZWQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChcclxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YUd1YXJhbnRlZWQoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChcclxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBicm9hZGNhc3REYXRhKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci51bnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xyXG4gIH1cclxuXHJcbiAgYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQoZGF0YVR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xyXG4gIH1cclxufVxyXG5cclxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwiamFudXNcIiwgSmFudXNBZGFwdGVyKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSmFudXNBZGFwdGVyO1xyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvaW5kZXguanMiLCIvKiogV2hldGhlciB0byBsb2cgaW5mb3JtYXRpb24gYWJvdXQgaW5jb21pbmcgYW5kIG91dGdvaW5nIEphbnVzIHNpZ25hbHMuICoqL1xudmFyIHZlcmJvc2UgPSBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgaGFuZGxlIHRvIGEgc2luZ2xlIEphbnVzIHBsdWdpbiBvbiBhIEphbnVzIHNlc3Npb24uIEVhY2ggV2ViUlRDIGNvbm5lY3Rpb24gdG8gdGhlIEphbnVzIHNlcnZlciB3aWxsIGJlXG4gKiBhc3NvY2lhdGVkIHdpdGggYSBzaW5nbGUgaGFuZGxlLiBPbmNlIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIHRoaXMgaGFuZGxlIHdpbGwgYmUgZ2l2ZW4gYSB1bmlxdWUgSUQgd2hpY2ggc2hvdWxkIGJlXG4gKiB1c2VkIHRvIGFzc29jaWF0ZSBpdCB3aXRoIGZ1dHVyZSBzaWduYWxsaW5nIG1lc3NhZ2VzLlxuICpcbiAqIFNlZSBodHRwczovL2phbnVzLmNvbmYubWVldGVjaG8uY29tL2RvY3MvcmVzdC5odG1sI2hhbmRsZXMuXG4gKiovXG5mdW5jdGlvbiBKYW51c1BsdWdpbkhhbmRsZShzZXNzaW9uKSB7XG4gIHRoaXMuc2Vzc2lvbiA9IHNlc3Npb247XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG59XG5cbi8qKiBBdHRhY2hlcyB0aGlzIGhhbmRsZSB0byB0aGUgSmFudXMgc2VydmVyIGFuZCBzZXRzIGl0cyBJRC4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24ocGx1Z2luKSB7XG4gIHZhciBwYXlsb2FkID0geyBqYW51czogXCJhdHRhY2hcIiwgcGx1Z2luOiBwbHVnaW4sIFwiZm9yY2UtYnVuZGxlXCI6IHRydWUsIFwiZm9yY2UtcnRjcC1tdXhcIjogdHJ1ZSB9O1xuICByZXR1cm4gdGhpcy5zZXNzaW9uLnNlbmQocGF5bG9hZCkudGhlbihyZXNwID0+IHtcbiAgICB0aGlzLmlkID0gcmVzcC5kYXRhLmlkO1xuICAgIHJldHVybiByZXNwO1xuICB9KTtcbn07XG5cbi8qKiBEZXRhY2hlcyB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuZGV0YWNoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJkZXRhY2hcIiB9KTtcbn07XG5cbi8qKlxuICogU2VuZHMgYSBzaWduYWwgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiBTaWduYWxzIHNob3VsZCBiZSBKU09OLXNlcmlhbGl6YWJsZSBvYmplY3RzLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGxcbiAqIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIHdoZW4gYSByZXNwb25zZSB0byB0aGlzIHNpZ25hbCBpcyByZWNlaXZlZCwgb3Igd2hlbiBubyByZXNwb25zZSBpcyByZWNlaXZlZCB3aXRoaW4gdGhlXG4gKiBzZXNzaW9uIHRpbWVvdXQuXG4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICByZXR1cm4gdGhpcy5zZXNzaW9uLnNlbmQoT2JqZWN0LmFzc2lnbih7IGhhbmRsZV9pZDogdGhpcy5pZCB9LCBzaWduYWwpKTtcbn07XG5cbi8qKiBTZW5kcyBhIHBsdWdpbi1zcGVjaWZpYyBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihib2R5KSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJtZXNzYWdlXCIsIGJvZHk6IGJvZHkgfSk7XG59O1xuXG4vKiogU2VuZHMgYSBKU0VQIG9mZmVyIG9yIGFuc3dlciBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRKc2VwID0gZnVuY3Rpb24oanNlcCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiB7fSwganNlcDoganNlcCB9KTtcbn07XG5cbi8qKiBTZW5kcyBhbiBJQ0UgdHJpY2tsZSBjYW5kaWRhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kVHJpY2tsZSA9IGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwidHJpY2tsZVwiLCAgY2FuZGlkYXRlOiBjYW5kaWRhdGUgfSk7XG59O1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBKYW51cyBzZXNzaW9uIC0tIGEgSmFudXMgY29udGV4dCBmcm9tIHdpdGhpbiB3aGljaCB5b3UgY2FuIG9wZW4gbXVsdGlwbGUgaGFuZGxlcyBhbmQgY29ubmVjdGlvbnMuIE9uY2VcbiAqIGNyZWF0ZWQsIHRoaXMgc2Vzc2lvbiB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZSB1c2VkIHRvIGFzc29jaWF0ZSBpdCB3aXRoIGZ1dHVyZSBzaWduYWxsaW5nIG1lc3NhZ2VzLlxuICpcbiAqIFNlZSBodHRwczovL2phbnVzLmNvbmYubWVldGVjaG8uY29tL2RvY3MvcmVzdC5odG1sI3Nlc3Npb25zLlxuICoqL1xuZnVuY3Rpb24gSmFudXNTZXNzaW9uKG91dHB1dCwgb3B0aW9ucykge1xuICB0aGlzLm91dHB1dCA9IG91dHB1dDtcbiAgdGhpcy5pZCA9IHVuZGVmaW5lZDtcbiAgdGhpcy5uZXh0VHhJZCA9IDA7XG4gIHRoaXMudHhucyA9IHt9O1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHtcbiAgICB0aW1lb3V0TXM6IDEwMDAwLFxuICAgIGtlZXBhbGl2ZU1zOiAzMDAwMFxuICB9O1xufVxuXG4vKiogQ3JlYXRlcyB0aGlzIHNlc3Npb24gb24gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImNyZWF0ZVwiIH0pLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGVzdHJveXMgdGhpcyBzZXNzaW9uLiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGVzdHJveVwiIH0pO1xufTtcblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgcmVjZWl2aW5nIEpTT04gc2lnbmFsbGluZyBtZXNzYWdlcyBwZXJ0aW5lbnQgdG8gdGhpcyBzZXNzaW9uLiBJZiB0aGUgc2lnbmFscyBhcmUgcmVzcG9uc2VzIHRvIHByZXZpb3VzbHlcbiAqIHNlbnQgc2lnbmFscywgdGhlIHByb21pc2VzIGZvciB0aGUgb3V0Z29pbmcgc2lnbmFscyB3aWxsIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIGFwcHJvcHJpYXRlbHkgd2l0aCB0aGlzIHNpZ25hbCBhcyBhblxuICogYXJndW1lbnQuXG4gKlxuICogRXh0ZXJuYWwgY2FsbGVycyBzaG91bGQgY2FsbCB0aGlzIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgYSBuZXcgc2lnbmFsIGFycml2ZXMgb24gdGhlIHRyYW5zcG9ydDsgZm9yIGV4YW1wbGUsIGluIGFcbiAqIFdlYlNvY2tldCdzIGBtZXNzYWdlYCBldmVudCwgb3Igd2hlbiBhIG5ldyBkYXR1bSBzaG93cyB1cCBpbiBhbiBIVFRQIGxvbmctcG9sbGluZyByZXNwb25zZS5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUucmVjZWl2ZSA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAobW9kdWxlLmV4cG9ydHMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJJbmNvbWluZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIGlmIChzaWduYWwudHJhbnNhY3Rpb24gIT0gbnVsbCkge1xuICAgIHZhciBoYW5kbGVycyA9IHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgIGlmIChzaWduYWwuamFudXMgPT09IFwiYWNrXCIgJiYgc2lnbmFsLmhpbnQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYW4gYWNrIG9mIGFuIGFzeW5jaHJvbm91c2x5LXByb2Nlc3NlZCByZXF1ZXN0LCB3ZSBzaG91bGQgd2FpdFxuICAgICAgLy8gdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB1bnRpbCB0aGUgYWN0dWFsIHJlc3BvbnNlIGNvbWVzIGluXG4gICAgfSBlbHNlIGlmIChoYW5kbGVycyAhPSBudWxsKSB7XG4gICAgICBpZiAoaGFuZGxlcnMudGltZW91dCAhPSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChoYW5kbGVycy50aW1lb3V0KTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgIChzaWduYWwuamFudXMgPT09IFwiZXJyb3JcIiA/IGhhbmRsZXJzLnJlamVjdCA6IGhhbmRsZXJzLnJlc29sdmUpKHNpZ25hbCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb24uIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAobW9kdWxlLmV4cG9ydHMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJPdXRnb2luZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIHNpZ25hbCA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHNlc3Npb25faWQ6IHRoaXMuaWQsXG4gICAgdHJhbnNhY3Rpb246ICh0aGlzLm5leHRUeElkKyspLnRvU3RyaW5nKClcbiAgfSwgc2lnbmFsKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lb3V0TXMpIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZGVsZXRlIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKFwiU2lnbmFsbGluZyBtZXNzYWdlIHRpbWVkIG91dC5cIikpO1xuICAgICAgfSwgdGhpcy5vcHRpb25zLnRpbWVvdXRNcyk7XG4gICAgfVxuICAgIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dID0geyByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCwgdGltZW91dDogdGltZW91dCB9O1xuICAgIHRoaXMub3V0cHV0KEpTT04uc3RyaW5naWZ5KHNpZ25hbCkpO1xuICAgIHRoaXMuX3Jlc2V0S2VlcGFsaXZlKCk7XG4gIH0pO1xufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fcmVzZXRLZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMua2VlcGFsaXZlVGltZW91dCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmtlZXBhbGl2ZVRpbWVvdXQpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMua2VlcGFsaXZlTXMpIHtcbiAgICB0aGlzLmtlZXBhbGl2ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2tlZXBhbGl2ZSgpLCB0aGlzLm9wdGlvbnMua2VlcGFsaXZlTXMpO1xuICB9XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9rZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImtlZXBhbGl2ZVwiIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEphbnVzUGx1Z2luSGFuZGxlLFxuICBKYW51c1Nlc3Npb24sXG4gIHZlcmJvc2Vcbn07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCJdLCJzb3VyY2VSb290IjoiIn0=