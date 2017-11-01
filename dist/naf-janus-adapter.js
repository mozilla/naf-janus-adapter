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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMzIxMmI5MzEyOTI0ZjhmOTY2MDciLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsImF1ZGlvIiwiZSIsIm5hbWUiLCJjb25zb2xlIiwid2FybiIsImVycm9yIiwiZ2V0TWljcm9waG9uZSIsIm1qIiwicmVxdWlyZSIsIkNvbnRlbnRLaW5kIiwiQXVkaW8iLCJWaWRlbyIsIkRhdGEiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIndhaXRGb3JFdmVudCIsInRhcmdldCIsImV2ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRFdmVudExpc3RlbmVyIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJscyIsIkphbnVzQWRhcHRlciIsImNvbnN0cnVjdG9yIiwicm9vbSIsInVzZXJJZCIsInNlcnZlclVybCIsIndlYlJ0Y09wdGlvbnMiLCJ3cyIsInNlc3Npb24iLCJwdWJsaXNoZXIiLCJvY2N1cGFudHMiLCJvY2N1cGFudFByb21pc2VzIiwib25XZWJzb2NrZXRNZXNzYWdlIiwiYmluZCIsIm9uRGF0YUNoYW5uZWxNZXNzYWdlIiwic2V0U2VydmVyVXJsIiwidXJsIiwic2V0QXBwIiwiYXBwIiwic2V0Um9vbSIsInJvb21OYW1lIiwicGFyc2VJbnQiLCJFcnJvciIsInNldFdlYlJ0Y09wdGlvbnMiLCJvcHRpb25zIiwic2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyIsInN1Y2Nlc3NMaXN0ZW5lciIsImZhaWx1cmVMaXN0ZW5lciIsImNvbm5lY3RTdWNjZXNzIiwiY29ubmVjdEZhaWx1cmUiLCJzZXRSb29tT2NjdXBhbnRMaXN0ZW5lciIsIm9jY3VwYW50TGlzdGVuZXIiLCJvbk9jY3VwYW50c0NoYW5nZWQiLCJzZXREYXRhQ2hhbm5lbExpc3RlbmVycyIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwib25PY2N1cGFudENvbm5lY3RlZCIsIm9uT2NjdXBhbnREaXNjb25uZWN0ZWQiLCJvbk9jY3VwYW50TWVzc2FnZSIsImNvbm5lY3QiLCJXZWJTb2NrZXQiLCJKYW51c1Nlc3Npb24iLCJzZW5kIiwiXyIsIm9uV2Vic29ja2V0T3BlbiIsImNyZWF0ZSIsInB1Ymxpc2hlclByb21pc2UiLCJjcmVhdGVQdWJsaXNoZXIiLCJvY2N1cGFudElkIiwiaW5pdGlhbE9jY3VwYW50cyIsImFkZE9jY3VwYW50IiwibWVzc2FnZSIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJyZWNlaXZlIiwicGx1Z2luZGF0YSIsInVzZXJfaWQiLCJyZW1vdmVPY2N1cGFudCIsInN1YnNjcmliZXIiLCJjcmVhdGVTdWJzY3JpYmVyIiwiaGFuZGxlIiwiSmFudXNQbHVnaW5IYW5kbGUiLCJhdHRhY2giLCJwZWVyQ29ubmVjdGlvbiIsIlJUQ1BlZXJDb25uZWN0aW9uIiwic2VuZFRyaWNrbGUiLCJjYW5kaWRhdGUiLCJ1bnJlbGlhYmxlQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwib3JkZXJlZCIsIm1heFJldHJhbnNtaXRzIiwicmVsaWFibGVDaGFubmVsIiwibWVkaWFTdHJlYW0iLCJhZGRTdHJlYW0iLCJvZmZlciIsImNyZWF0ZU9mZmVyIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsImFuc3dlciIsInNlbmRKc2VwIiwic2V0UmVtb3RlRGVzY3JpcHRpb24iLCJqc2VwIiwic2VuZEpvaW4iLCJyZXNwb25zZSIsInVzZXJfaWRzIiwib2ZmZXJUb1JlY2VpdmVBdWRpbyIsInB1Ymxpc2hlcl9pZCIsImNvbnRlbnRfa2luZCIsInN0cmVhbXMiLCJnZXRSZW1vdGVTdHJlYW1zIiwibGVuZ3RoIiwicm9vbUlkIiwibm90aWZ5Iiwic3BlY3MiLCJzZW5kTWVzc2FnZSIsImtpbmQiLCJyb29tX2lkIiwic3Vic2NyaXB0aW9uX3NwZWNzIiwiZGF0YVR5cGUiLCJzaG91bGRTdGFydENvbm5lY3Rpb25UbyIsImNsaWVudElkIiwic3RhcnRTdHJlYW1Db25uZWN0aW9uIiwiY2xvc2VTdHJlYW1Db25uZWN0aW9uIiwiZ2V0Q29ubmVjdFN0YXR1cyIsIk5BRiIsImFkYXB0ZXJzIiwiSVNfQ09OTkVDVEVEIiwiTk9UX0NPTk5FQ1RFRCIsImdldE1lZGlhU3RyZWFtIiwib2NjdXBhbnRQcm9taXNlIiwidGhlbiIsInMiLCJlbmFibGVNaWNyb3Bob25lIiwiZW5hYmxlZCIsImF1ZGlvVHJhY2tzIiwiZ2V0QXVkaW9UcmFja3MiLCJzZW5kRGF0YSIsInN0cmluZ2lmeSIsInNlbmREYXRhR3VhcmFudGVlZCIsImJyb2FkY2FzdERhdGEiLCJicm9hZGNhc3REYXRhR3VhcmFudGVlZCIsInJlZ2lzdGVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7OzsrQkMzQ0EsYUFBK0I7QUFDN0IsUUFBSTtBQUNGLGFBQU8sTUFBTUEsVUFBVUMsWUFBVixDQUF1QkMsWUFBdkIsQ0FBb0M7QUFDL0NDLGVBQU87QUFEd0MsT0FBcEMs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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CLHFCQUFxQjtBQUN6Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im5hZi1qYW51cy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMzIxMmI5MzEyOTI0ZjhmOTY2MDciLCJ2YXIgbWogPSByZXF1aXJlKFwibWluaWphbnVzXCIpO1xuXG5jb25zdCBDb250ZW50S2luZCA9IHtcbiAgQXVkaW86IDEsXG4gIFZpZGVvOiAyLFxuICBEYXRhOiA0XG59O1xuXG5mdW5jdGlvbiByYW5kb21VaW50KCkge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpO1xufVxuXG5mdW5jdGlvbiB3YWl0Rm9yRXZlbnQodGFyZ2V0LCBldmVudCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBlID0+IHJlc29sdmUoZSksIHsgb25jZTogdHJ1ZSB9KTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldE1pY3JvcGhvbmUoKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHtcbiAgICAgIGF1ZGlvOiB0cnVlXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZS5uYW1lID09PSBcIk5vdEFsbG93ZWRFcnJvclwiKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJNaWNyb3Bob25lIGFjY2VzcyBub3QgYWxsb3dlZC5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IFBFRVJfQ09OTkVDVElPTl9DT05GSUcgPSB7XG4gIGljZVNlcnZlcnM6IFtcbiAgICB7IHVybHM6IFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICAgIHsgdXJsczogXCJzdHVuOnN0dW4yLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH1cbiAgXVxufTtcblxuY2xhc3MgSmFudXNBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5yb29tID0gbnVsbDtcbiAgICB0aGlzLnVzZXJJZCA9IHJhbmRvbVVpbnQoKTtcblxuICAgIHRoaXMuc2VydmVyVXJsID0gbnVsbDtcbiAgICB0aGlzLndlYlJ0Y09wdGlvbnMgPSB7fTtcbiAgICB0aGlzLndzID0gbnVsbDtcbiAgICB0aGlzLnNlc3Npb24gPSBudWxsO1xuXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBudWxsO1xuICAgIHRoaXMub2NjdXBhbnRzID0ge307XG4gICAgdGhpcy5vY2N1cGFudFByb21pc2VzID0ge307XG5cbiAgICB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSA9IHRoaXMub25XZWJzb2NrZXRNZXNzYWdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSA9IHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UuYmluZCh0aGlzKTtcbiAgfVxuXG4gIHNldFNlcnZlclVybCh1cmwpIHtcbiAgICB0aGlzLnNlcnZlclVybCA9IHVybDtcbiAgfVxuXG4gIHNldEFwcChhcHApIHt9XG5cbiAgc2V0Um9vbShyb29tTmFtZSkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnJvb20gPSBwYXJzZUludChyb29tTmFtZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUm9vbSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci5cIik7XG4gICAgfVxuICB9XG5cbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgdGhpcy53ZWJSdGNPcHRpb25zID0gb3B0aW9ucztcbiAgfVxuXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xuICAgIHRoaXMuY29ubmVjdEZhaWx1cmUgPSBmYWlsdXJlTGlzdGVuZXI7XG4gIH1cblxuICBzZXRSb29tT2NjdXBhbnRMaXN0ZW5lcihvY2N1cGFudExpc3RlbmVyKSB7XG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQgPSBvY2N1cGFudExpc3RlbmVyO1xuICB9XG5cbiAgc2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkID0gb3Blbkxpc3RlbmVyO1xuICAgIHRoaXMub25PY2N1cGFudERpc2Nvbm5lY3RlZCA9IGNsb3NlZExpc3RlbmVyO1xuICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UgPSBtZXNzYWdlTGlzdGVuZXI7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIHRoaXMud3MgPSBuZXcgV2ViU29ja2V0KHRoaXMuc2VydmVyVXJsLCBcImphbnVzLXByb3RvY29sXCIpO1xuICAgIHRoaXMuc2Vzc2lvbiA9IG5ldyBtai5KYW51c1Nlc3Npb24odGhpcy53cy5zZW5kLmJpbmQodGhpcy53cykpO1xuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgXyA9PiB0aGlzLm9uV2Vic29ja2V0T3BlbigpKTtcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlKTtcbiAgfVxuXG4gIGFzeW5jIG9uV2Vic29ja2V0T3BlbigpIHtcbiAgICAvLyBDcmVhdGUgdGhlIEphbnVzIFNlc3Npb25cbiAgICBhd2FpdCB0aGlzLnNlc3Npb24uY3JlYXRlKCk7XG5cbiAgICAvLyBBdHRhY2ggdGhlIFNGVSBQbHVnaW4gYW5kIGNyZWF0ZSBhIFJUQ1BlZXJDb25uZWN0aW9uIGZvciB0aGUgcHVibGlzaGVyLlxuICAgIC8vIFRoZSBwdWJsaXNoZXIgc2VuZHMgYXVkaW8gYW5kIG9wZW5zIHR3byBiaWRpcmVjdGlvbmFsIGRhdGEgY2hhbm5lbHMuXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cbiAgICB2YXIgcHVibGlzaGVyUHJvbWlzZSA9IHRoaXMuY3JlYXRlUHVibGlzaGVyKCk7XG4gICAgdGhpcy5vY2N1cGFudFByb21pc2VzW3RoaXMudXNlcklkXSA9IHB1Ymxpc2hlclByb21pc2U7XG4gICAgdGhpcy5wdWJsaXNoZXIgPSBhd2FpdCBwdWJsaXNoZXJQcm9taXNlO1xuXG4gICAgdGhpcy5jb25uZWN0U3VjY2Vzcyh0aGlzLnVzZXJJZCk7XG5cbiAgICAvLyBBZGQgYWxsIG9mIHRoZSBpbml0aWFsIG9jY3VwYW50cy5cbiAgICBmb3IgKGxldCBvY2N1cGFudElkIG9mIHRoaXMucHVibGlzaGVyLmluaXRpYWxPY2N1cGFudHMpIHtcbiAgICAgIGlmIChvY2N1cGFudElkICE9PSB0aGlzLnVzZXJJZCkge1xuICAgICAgICB0aGlzLm9jY3VwYW50UHJvbWlzZXNbb2NjdXBhbnRJZF0gPSB0aGlzLmFkZE9jY3VwYW50KG9jY3VwYW50SWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG9uV2Vic29ja2V0TWVzc2FnZShldmVudCkge1xuICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICB0aGlzLnNlc3Npb24ucmVjZWl2ZShtZXNzYWdlKTtcblxuICAgIC8vIEhhbmRsZSBhbGwgb2YgdGhlIGpvaW4gYW5kIGxlYXZlIGV2ZW50cyBmcm9tIHRoZSBwdWJsaXNoZXIuXG4gICAgaWYgKG1lc3NhZ2UucGx1Z2luZGF0YSAmJiBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YSkge1xuICAgICAgdmFyIGRhdGEgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YTtcblxuICAgICAgaWYgKGRhdGEuZXZlbnQgPT09IFwiam9pblwiKSB7XG4gICAgICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1tkYXRhLnVzZXJfaWRdID0gdGhpcy5hZGRPY2N1cGFudChkYXRhLnVzZXJfaWQpO1xuICAgICAgfSBlbHNlIGlmIChkYXRhLmV2ZW50ICYmIGRhdGEuZXZlbnQgPT09IFwibGVhdmVcIikge1xuICAgICAgICB0aGlzLnJlbW92ZU9jY3VwYW50KGRhdGEudXNlcl9pZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgYWRkT2NjdXBhbnQob2NjdXBhbnRJZCkge1xuICAgIHZhciBzdWJzY3JpYmVyID0gYXdhaXQgdGhpcy5jcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpO1xuICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgbmV3IG9jY3VwYW50LlxuICAgIHRoaXMub25PY2N1cGFudENvbm5lY3RlZChvY2N1cGFudElkKTtcbiAgICB0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSA9IHRydWU7XG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xuICAgIHJldHVybiBzdWJzY3JpYmVyO1xuICB9XG5cbiAgcmVtb3ZlT2NjdXBhbnQob2NjdXBhbnRJZCkge1xuICAgIGlmICh0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSkge1xuICAgICAgZGVsZXRlIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdO1xuICAgICAgLy8gQ2FsbCB0aGUgTmV0d29ya2VkIEFGcmFtZSBjYWxsYmFja3MgZm9yIHRoZSByZW1vdmVkIG9jY3VwYW50LlxuICAgICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkKG9jY3VwYW50SWQpO1xuICAgICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVB1Ymxpc2hlcigpIHtcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XG5cbiAgICB2YXIgcGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XG5cbiAgICBwZWVyQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ZW50ID0+IHtcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldmVudC5jYW5kaWRhdGUpO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGFuIHVucmVsaWFibGUgZGF0YWNoYW5uZWwgZm9yIHNlbmRpbmcgYW5kIHJlY2VpdmluZyBjb21wb25lbnQgdXBkYXRlcywgZXRjLlxuICAgIHZhciB1bnJlbGlhYmxlQ2hhbm5lbCA9IHBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwidW5yZWxpYWJsZVwiLCB7XG4gICAgICBvcmRlcmVkOiBmYWxzZSxcbiAgICAgIG1heFJldHJhbnNtaXRzOiAwXG4gICAgfSk7XG4gICAgdW5yZWxpYWJsZUNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSk7XG5cbiAgICAvLyBDcmVhdGUgYSByZWxpYWJsZSBkYXRhY2hhbm5lbCBmb3Igc2VuZGluZyBhbmQgcmVjaWV2aW5nIGVudGl0eSBpbnN0YW50aWF0aW9ucywgZXRjLlxuICAgIHZhciByZWxpYWJsZUNoYW5uZWwgPSBwZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbChcInJlbGlhYmxlXCIsIHtcbiAgICAgIG9yZGVyZWQ6IHRydWVcbiAgICB9KTtcbiAgICByZWxpYWJsZUNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSk7XG5cbiAgICB2YXIgbWVkaWFTdHJlYW07XG4gICAgaWYgKHRoaXMud2ViUnRjT3B0aW9ucy5hdWRpbykge1xuICAgICAgbWVkaWFTdHJlYW0gPSBhd2FpdCBnZXRNaWNyb3Bob25lKCk7XG5cbiAgICAgIGlmIChtZWRpYVN0cmVhbSkge1xuICAgICAgICBwZWVyQ29ubmVjdGlvbi5hZGRTdHJlYW0obWVkaWFTdHJlYW0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBvZmZlciA9IGF3YWl0IHBlZXJDb25uZWN0aW9uLmNyZWF0ZU9mZmVyKCk7XG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG5cbiAgICB2YXIgYW5zd2VyID0gYXdhaXQgaGFuZGxlLnNlbmRKc2VwKG9mZmVyKTtcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihhbnN3ZXIuanNlcCk7XG5cbiAgICAvLyBXYWl0IGZvciB0aGUgcmVsaWFibGUgZGF0YWNoYW5uZWwgdG8gYmUgb3BlbiBiZWZvcmUgd2Ugc3RhcnQgc2VuZGluZyBtZXNzYWdlcyBvbiBpdC5cbiAgICBhd2FpdCB3YWl0Rm9yRXZlbnQocmVsaWFibGVDaGFubmVsLCBcIm9wZW5cIik7XG5cbiAgICAvLyBTZW5kIGpvaW4gbWVzc2FnZSB0byBqYW51cy4gTGlzdGVuIGZvciBqb2luL2xlYXZlIG1lc3NhZ2VzLiBBdXRvbWF0aWNhbGx5IHN1YnNjcmliZSB0byBhbGwgdXNlcnMnIFdlYlJUQyBkYXRhLlxuICAgIHZhciBtZXNzYWdlID0gYXdhaXQgdGhpcy5zZW5kSm9pbihoYW5kbGUsIHRoaXMucm9vbSwgdGhpcy51c2VySWQsIHRydWUpO1xuXG4gICAgdmFyIGluaXRpYWxPY2N1cGFudHMgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YS5yZXNwb25zZS51c2VyX2lkcztcblxuICAgIHJldHVybiB7XG4gICAgICBoYW5kbGUsXG4gICAgICBpbml0aWFsT2NjdXBhbnRzLFxuICAgICAgcmVsaWFibGVDaGFubmVsLFxuICAgICAgdW5yZWxpYWJsZUNoYW5uZWwsXG4gICAgICBtZWRpYVN0cmVhbSxcbiAgICAgIHBlZXJDb25uZWN0aW9uXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVN1YnNjcmliZXIob2NjdXBhbnRJZCkge1xuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcbiAgICBhd2FpdCBoYW5kbGUuYXR0YWNoKFwiamFudXMucGx1Z2luLnNmdVwiKTtcblxuICAgIHZhciBwZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcblxuICAgIHBlZXJDb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJpY2VjYW5kaWRhdGVcIiwgZXZlbnQgPT4ge1xuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2ZW50LmNhbmRpZGF0ZSk7XG4gICAgfSk7XG5cbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcih7XG4gICAgICBvZmZlclRvUmVjZWl2ZUF1ZGlvOiB0cnVlXG4gICAgfSk7XG5cbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcbiAgICB2YXIgYW5zd2VyID0gYXdhaXQgaGFuZGxlLnNlbmRKc2VwKG9mZmVyKTtcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihhbnN3ZXIuanNlcCk7XG5cbiAgICAvLyBTZW5kIGpvaW4gbWVzc2FnZSB0byBqYW51cy4gRG9uJ3QgbGlzdGVuIGZvciBqb2luL2xlYXZlIG1lc3NhZ2VzLiBTdWJzY3JpYmUgdG8gdGhlIG9jY3VwYW50J3MgYXVkaW8gc3RyZWFtLlxuICAgIGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCBmYWxzZSwgW1xuICAgICAge1xuICAgICAgICBwdWJsaXNoZXJfaWQ6IG9jY3VwYW50SWQsXG4gICAgICAgIGNvbnRlbnRfa2luZDogQ29udGVudEtpbmQuQXVkaW9cbiAgICAgIH1cbiAgICBdKTtcblxuICAgIC8vIEdldCB0aGUgb2NjdXBhbnQncyBhdWRpbyBzdHJlYW0uXG4gICAgdmFyIHN0cmVhbXMgPSBwZWVyQ29ubmVjdGlvbi5nZXRSZW1vdGVTdHJlYW1zKCk7XG4gICAgdmFyIG1lZGlhU3RyZWFtID0gc3RyZWFtcy5sZW5ndGggPiAwID8gc3RyZWFtc1swXSA6IG51bGw7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaGFuZGxlLFxuICAgICAgbWVkaWFTdHJlYW0sXG4gICAgICBwZWVyQ29ubmVjdGlvblxuICAgIH07XG4gIH1cblxuICBzZW5kSm9pbihoYW5kbGUsIHJvb21JZCwgdXNlcklkLCBub3RpZnksIHNwZWNzKSB7XG4gICAgcmV0dXJuIGhhbmRsZS5zZW5kTWVzc2FnZSh7XG4gICAgICBraW5kOiBcImpvaW5cIixcbiAgICAgIHJvb21faWQ6IHJvb21JZCxcbiAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgIG5vdGlmeSxcbiAgICAgIHN1YnNjcmlwdGlvbl9zcGVjczogc3BlY3NcbiAgICB9KTtcbiAgfVxuXG4gIG9uRGF0YUNoYW5uZWxNZXNzYWdlKGV2ZW50KSB7XG4gICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuXG4gICAgaWYgKG1lc3NhZ2UuZGF0YVR5cGUpIHtcbiAgICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UobnVsbCwgbWVzc2FnZS5kYXRhVHlwZSwgbWVzc2FnZS5kYXRhKTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRTdGFydENvbm5lY3Rpb25UbyhjbGllbnRJZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7fVxuXG4gIGNsb3NlU3RyZWFtQ29ubmVjdGlvbihjbGllbnRJZCkge31cblxuICBnZXRDb25uZWN0U3RhdHVzKGNsaWVudElkKSB7XG4gICAgaWYgKHRoaXMub2NjdXBhbnRzW2NsaWVudElkXSkge1xuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuTk9UX0NPTk5FQ1RFRDtcbiAgICB9XG4gIH1cblxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkge1xuICAgIHZhciBvY2N1cGFudFByb21pc2UgPSB0aGlzLm9jY3VwYW50UHJvbWlzZXNbY2xpZW50SWRdO1xuXG4gICAgaWYgKCFvY2N1cGFudFByb21pc2UpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgbmV3IEVycm9yKGBTdWJzY3JpYmVyIGZvciBjbGllbnQ6ICR7Y2xpZW50SWR9IGRvZXMgbm90IGV4aXN0LmApXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBvY2N1cGFudFByb21pc2UudGhlbihzID0+IHMubWVkaWFTdHJlYW0pO1xuICB9XG5cbiAgZW5hYmxlTWljcm9waG9uZShlbmFibGVkKSB7XG4gICAgaWYgKHRoaXMucHVibGlzaGVyICYmIHRoaXMucHVibGlzaGVyLm1lZGlhU3RyZWFtKSB7XG4gICAgICB2YXIgYXVkaW9UcmFja3MgPSB0aGlzLnB1Ymxpc2hlci5tZWRpYVN0cmVhbS5nZXRBdWRpb1RyYWNrcygpO1xuXG4gICAgICBpZiAoYXVkaW9UcmFja3MubGVuZ3RoID4gMCkge1xuICAgICAgICBhdWRpb1RyYWNrc1swXS5lbmFibGVkID0gZW5hYmxlZDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZW5kRGF0YShjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcbiAgICB0aGlzLnB1Ymxpc2hlci51bnJlbGlhYmxlQ2hhbm5lbC5zZW5kKFxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcbiAgICApO1xuICB9XG5cbiAgc2VuZERhdGFHdWFyYW50ZWVkKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKFxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcbiAgICApO1xuICB9XG5cbiAgYnJvYWRjYXN0RGF0YShkYXRhVHlwZSwgZGF0YSkge1xuICAgIHRoaXMucHVibGlzaGVyLnVucmVsaWFibGVDaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSk7XG4gIH1cblxuICBicm9hZGNhc3REYXRhR3VhcmFudGVlZChkYXRhVHlwZSwgZGF0YSkge1xuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xuICB9XG59XG5cbk5BRi5hZGFwdGVycy5yZWdpc3RlcihcImphbnVzXCIsIEphbnVzQWRhcHRlcik7XG5cbm1vZHVsZS5leHBvcnRzID0gSmFudXNBZGFwdGVyO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2luZGV4LmpzIiwiLyoqIFdoZXRoZXIgdG8gbG9nIGluZm9ybWF0aW9uIGFib3V0IGluY29taW5nIGFuZCBvdXRnb2luZyBKYW51cyBzaWduYWxzLiAqKi9cbnZhciB2ZXJib3NlID0gZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGhhbmRsZSB0byBhIHNpbmdsZSBKYW51cyBwbHVnaW4gb24gYSBKYW51cyBzZXNzaW9uLiBFYWNoIFdlYlJUQyBjb25uZWN0aW9uIHRvIHRoZSBKYW51cyBzZXJ2ZXIgd2lsbCBiZVxuICogYXNzb2NpYXRlZCB3aXRoIGEgc2luZ2xlIGhhbmRsZS4gT25jZSBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCB0aGlzIGhhbmRsZSB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZVxuICogdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNoYW5kbGVzLlxuICoqL1xuZnVuY3Rpb24gSmFudXNQbHVnaW5IYW5kbGUoc2Vzc2lvbikge1xuICB0aGlzLnNlc3Npb24gPSBzZXNzaW9uO1xuICB0aGlzLmlkID0gdW5kZWZpbmVkO1xufVxuXG4vKiogQXR0YWNoZXMgdGhpcyBoYW5kbGUgdG8gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKHBsdWdpbikge1xuICB2YXIgcGF5bG9hZCA9IHsgamFudXM6IFwiYXR0YWNoXCIsIHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGV0YWNoXCIgfSk7XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gU2lnbmFscyBzaG91bGQgYmUgSlNPTi1zZXJpYWxpemFibGUgb2JqZWN0cy4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsXG4gKiBiZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgdG8gdGhpcyBzaWduYWwgaXMgcmVjZWl2ZWQsIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZVxuICogc2Vzc2lvbiB0aW1lb3V0LlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKE9iamVjdC5hc3NpZ24oeyBoYW5kbGVfaWQ6IHRoaXMuaWQgfSwgc2lnbmFsKSk7XG59O1xuXG4vKiogU2VuZHMgYSBwbHVnaW4tc3BlY2lmaWMgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oYm9keSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcIm1lc3NhZ2VcIiwgYm9keToge30sIGpzZXA6IGpzZXAgfSk7XG59O1xuXG4vKiogU2VuZHMgYW4gSUNFIHRyaWNrbGUgY2FuZGlkYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZFRyaWNrbGUgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcInRyaWNrbGVcIiwgIGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7XG4gICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICBrZWVwYWxpdmVNczogMzAwMDBcbiAgfTtcbn1cblxuLyoqIENyZWF0ZXMgdGhpcyBzZXNzaW9uIG9uIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJjcmVhdGVcIiB9KS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqIERlc3Ryb3lzIHRoaXMgc2Vzc2lvbi4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImRlc3Ryb3lcIiB9KTtcbn07XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIHJlY2VpdmluZyBKU09OIHNpZ25hbGxpbmcgbWVzc2FnZXMgcGVydGluZW50IHRvIHRoaXMgc2Vzc2lvbi4gSWYgdGhlIHNpZ25hbHMgYXJlIHJlc3BvbnNlcyB0byBwcmV2aW91c2x5XG4gKiBzZW50IHNpZ25hbHMsIHRoZSBwcm9taXNlcyBmb3IgdGhlIG91dGdvaW5nIHNpZ25hbHMgd2lsbCBiZSByZXNvbHZlZCBvciByZWplY3RlZCBhcHByb3ByaWF0ZWx5IHdpdGggdGhpcyBzaWduYWwgYXMgYW5cbiAqIGFyZ3VtZW50LlxuICpcbiAqIEV4dGVybmFsIGNhbGxlcnMgc2hvdWxkIGNhbGwgdGhpcyBmdW5jdGlvbiBldmVyeSB0aW1lIGEgbmV3IHNpZ25hbCBhcnJpdmVzIG9uIHRoZSB0cmFuc3BvcnQ7IGZvciBleGFtcGxlLCBpbiBhXG4gKiBXZWJTb2NrZXQncyBgbWVzc2FnZWAgZXZlbnQsIG9yIHdoZW4gYSBuZXcgZGF0dW0gc2hvd3MgdXAgaW4gYW4gSFRUUCBsb25nLXBvbGxpbmcgcmVzcG9uc2UuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLnJlY2VpdmUgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgaWYgKG1vZHVsZS5leHBvcnRzLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiSW5jb21pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICBpZiAoc2lnbmFsLnRyYW5zYWN0aW9uICE9IG51bGwpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICBpZiAoc2lnbmFsLmphbnVzID09PSBcImFja1wiICYmIHNpZ25hbC5oaW50KSB7XG4gICAgICAvLyB0aGlzIGlzIGFuIGFjayBvZiBhbiBhc3luY2hyb25vdXNseS1wcm9jZXNzZWQgcmVxdWVzdCwgd2Ugc2hvdWxkIHdhaXRcbiAgICAgIC8vIHRvIHJlc29sdmUgdGhlIHByb21pc2UgdW50aWwgdGhlIGFjdHVhbCByZXNwb25zZSBjb21lcyBpblxuICAgIH0gZWxzZSBpZiAoaGFuZGxlcnMgIT0gbnVsbCkge1xuICAgICAgaWYgKGhhbmRsZXJzLnRpbWVvdXQgIT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaGFuZGxlcnMudGltZW91dCk7XG4gICAgICB9XG4gICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAoc2lnbmFsLmphbnVzID09PSBcImVycm9yXCIgPyBoYW5kbGVycy5yZWplY3QgOiBoYW5kbGVycy5yZXNvbHZlKShzaWduYWwpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBTZW5kcyBhIHNpZ25hbCBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uLiBTaWduYWxzIHNob3VsZCBiZSBKU09OLXNlcmlhbGl6YWJsZSBvYmplY3RzLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGxcbiAqIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIHdoZW4gYSByZXNwb25zZSB0byB0aGlzIHNpZ25hbCBpcyByZWNlaXZlZCwgb3Igd2hlbiBubyByZXNwb25zZSBpcyByZWNlaXZlZCB3aXRoaW4gdGhlXG4gKiBzZXNzaW9uIHRpbWVvdXQuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgaWYgKG1vZHVsZS5leHBvcnRzLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiT3V0Z29pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICBzaWduYWwgPSBPYmplY3QuYXNzaWduKHtcbiAgICBzZXNzaW9uX2lkOiB0aGlzLmlkLFxuICAgIHRyYW5zYWN0aW9uOiAodGhpcy5uZXh0VHhJZCsrKS50b1N0cmluZygpXG4gIH0sIHNpZ25hbCk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZW91dE1zKSB7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlNpZ25hbGxpbmcgbWVzc2FnZSB0aW1lZCBvdXQuXCIpKTtcbiAgICAgIH0sIHRoaXMub3B0aW9ucy50aW1lb3V0TXMpO1xuICAgIH1cbiAgICB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXSA9IHsgcmVzb2x2ZTogcmVzb2x2ZSwgcmVqZWN0OiByZWplY3QsIHRpbWVvdXQ6IHRpbWVvdXQgfTtcbiAgICB0aGlzLm91dHB1dChKU09OLnN0cmluZ2lmeShzaWduYWwpKTtcbiAgICB0aGlzLl9yZXNldEtlZXBhbGl2ZSgpO1xuICB9KTtcbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX3Jlc2V0S2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmtlZXBhbGl2ZVRpbWVvdXQpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5rZWVwYWxpdmVUaW1lb3V0KTtcbiAgfVxuICBpZiAodGhpcy5vcHRpb25zLmtlZXBhbGl2ZU1zKSB7XG4gICAgdGhpcy5rZWVwYWxpdmVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9rZWVwYWxpdmUoKSwgdGhpcy5vcHRpb25zLmtlZXBhbGl2ZU1zKTtcbiAgfVxufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fa2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJrZWVwYWxpdmVcIiB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBKYW51c1BsdWdpbkhhbmRsZSxcbiAgSmFudXNTZXNzaW9uLFxuICB2ZXJib3NlXG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvbWluaWphbnVzL21pbmlqYW51cy5qc1xuLy8gbW9kdWxlIGlkID0gMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9