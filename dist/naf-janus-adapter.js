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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNWEyMmFiZmQ5ZmRhZWFmMzk0YTUiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsImF1ZGlvIiwiZSIsIm5hbWUiLCJjb25zb2xlIiwid2FybiIsImVycm9yIiwiZ2V0TWljcm9waG9uZSIsIm1qIiwicmVxdWlyZSIsIkNvbnRlbnRLaW5kIiwiQXVkaW8iLCJWaWRlbyIsIkRhdGEiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIndhaXRGb3JFdmVudCIsInRhcmdldCIsImV2ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRFdmVudExpc3RlbmVyIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJsIiwiSmFudXNBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyb29tIiwidXNlcklkIiwic2VydmVyVXJsIiwid2ViUnRjT3B0aW9ucyIsIndzIiwic2Vzc2lvbiIsInB1Ymxpc2hlciIsIm9jY3VwYW50cyIsIm9jY3VwYW50UHJvbWlzZXMiLCJvbldlYnNvY2tldE1lc3NhZ2UiLCJiaW5kIiwib25EYXRhQ2hhbm5lbE1lc3NhZ2UiLCJzZXRTZXJ2ZXJVcmwiLCJzZXRBcHAiLCJhcHAiLCJzZXRSb29tIiwicm9vbU5hbWUiLCJwYXJzZUludCIsIkVycm9yIiwic2V0V2ViUnRjT3B0aW9ucyIsIm9wdGlvbnMiLCJzZXRTZXJ2ZXJDb25uZWN0TGlzdGVuZXJzIiwic3VjY2Vzc0xpc3RlbmVyIiwiZmFpbHVyZUxpc3RlbmVyIiwiY29ubmVjdFN1Y2Nlc3MiLCJjb25uZWN0RmFpbHVyZSIsInNldFJvb21PY2N1cGFudExpc3RlbmVyIiwib2NjdXBhbnRMaXN0ZW5lciIsIm9uT2NjdXBhbnRzQ2hhbmdlZCIsInNldERhdGFDaGFubmVsTGlzdGVuZXJzIiwib3Blbkxpc3RlbmVyIiwiY2xvc2VkTGlzdGVuZXIiLCJtZXNzYWdlTGlzdGVuZXIiLCJvbk9jY3VwYW50Q29ubmVjdGVkIiwib25PY2N1cGFudERpc2Nvbm5lY3RlZCIsIm9uT2NjdXBhbnRNZXNzYWdlIiwiY29ubmVjdCIsIldlYlNvY2tldCIsIkphbnVzU2Vzc2lvbiIsInNlbmQiLCJfIiwib25XZWJzb2NrZXRPcGVuIiwiY3JlYXRlIiwicHVibGlzaGVyUHJvbWlzZSIsImNyZWF0ZVB1Ymxpc2hlciIsIm9jY3VwYW50SWQiLCJpbml0aWFsT2NjdXBhbnRzIiwiYWRkT2NjdXBhbnQiLCJtZXNzYWdlIiwiSlNPTiIsInBhcnNlIiwiZGF0YSIsInJlY2VpdmUiLCJwbHVnaW5kYXRhIiwidXNlcl9pZCIsInJlbW92ZU9jY3VwYW50Iiwic3Vic2NyaWJlciIsImNyZWF0ZVN1YnNjcmliZXIiLCJoYW5kbGUiLCJKYW51c1BsdWdpbkhhbmRsZSIsImF0dGFjaCIsInBlZXJDb25uZWN0aW9uIiwiUlRDUGVlckNvbm5lY3Rpb24iLCJzZW5kVHJpY2tsZSIsImNhbmRpZGF0ZSIsInVucmVsaWFibGVDaGFubmVsIiwiY3JlYXRlRGF0YUNoYW5uZWwiLCJvcmRlcmVkIiwibWF4UmV0cmFuc21pdHMiLCJyZWxpYWJsZUNoYW5uZWwiLCJtZWRpYVN0cmVhbSIsImFkZFN0cmVhbSIsIm9mZmVyIiwiY3JlYXRlT2ZmZXIiLCJzZXRMb2NhbERlc2NyaXB0aW9uIiwiYW5zd2VyIiwic2VuZEpzZXAiLCJzZXRSZW1vdGVEZXNjcmlwdGlvbiIsImpzZXAiLCJzZW5kSm9pbiIsInJlc3BvbnNlIiwidXNlcl9pZHMiLCJvZmZlclRvUmVjZWl2ZUF1ZGlvIiwicHVibGlzaGVyX2lkIiwiY29udGVudF9raW5kIiwic3RyZWFtcyIsImdldFJlbW90ZVN0cmVhbXMiLCJsZW5ndGgiLCJyb29tSWQiLCJub3RpZnkiLCJzcGVjcyIsInNlbmRNZXNzYWdlIiwia2luZCIsInJvb21faWQiLCJzdWJzY3JpcHRpb25fc3BlY3MiLCJkYXRhVHlwZSIsInNob3VsZFN0YXJ0Q29ubmVjdGlvblRvIiwiY2xpZW50SWQiLCJzdGFydFN0cmVhbUNvbm5lY3Rpb24iLCJjbG9zZVN0cmVhbUNvbm5lY3Rpb24iLCJnZXRDb25uZWN0U3RhdHVzIiwiTkFGIiwiYWRhcHRlcnMiLCJJU19DT05ORUNURUQiLCJOT1RfQ09OTkVDVEVEIiwiZ2V0TWVkaWFTdHJlYW0iLCJvY2N1cGFudFByb21pc2UiLCJ0aGVuIiwicyIsImVuYWJsZU1pY3JvcGhvbmUiLCJlbmFibGVkIiwiYXVkaW9UcmFja3MiLCJnZXRBdWRpb1RyYWNrcyIsInNlbmREYXRhIiwic3RyaW5naWZ5Iiwic2VuZERhdGFHdWFyYW50ZWVkIiwiYnJvYWRjYXN0RGF0YSIsImJyb2FkY2FzdERhdGFHdWFyYW50ZWVkIiwicmVnaXN0ZXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7OytCQzNDQSxhQUErQjtBQUM3QixRQUFJO0FBQ0YsYUFBTyxNQUFNQSxVQUFVQyxZQUFWLENBQXVCQyxZQUF2QixDQUFvQztBQUMvQ0MsZUFBTztBQUR3QyxPQUFwQyxDQUFiO0FB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QUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CLHFCQUFxQjtBQUN6Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im5hZi1qYW51cy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgNWEyMmFiZmQ5ZmRhZWFmMzk0YTUiLCJ2YXIgbWogPSByZXF1aXJlKFwibWluaWphbnVzXCIpO1xyXG5cclxuY29uc3QgQ29udGVudEtpbmQgPSB7XHJcbiAgQXVkaW86IDEsXHJcbiAgVmlkZW86IDIsXHJcbiAgRGF0YTogNFxyXG59O1xyXG5cclxuZnVuY3Rpb24gcmFuZG9tVWludCgpIHtcclxuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3YWl0Rm9yRXZlbnQodGFyZ2V0LCBldmVudCkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZSA9PiByZXNvbHZlKGUpLCB7IG9uY2U6IHRydWUgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE1pY3JvcGhvbmUoKSB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7XHJcbiAgICAgIGF1ZGlvOiB0cnVlXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZiAoZS5uYW1lID09PSBcIk5vdEFsbG93ZWRFcnJvclwiKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihcIk1pY3JvcGhvbmUgYWNjZXNzIG5vdCBhbGxvd2VkLlwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBQRUVSX0NPTk5FQ1RJT05fQ09ORklHID0ge1xyXG4gIGljZVNlcnZlcnM6IFtcclxuICAgIHsgdXJsOiBcInN0dW46c3R1bjEubC5nb29nbGUuY29tOjE5MzAyXCIgfSxcclxuICAgIHsgdXJsOiBcInN0dW46c3R1bjIubC5nb29nbGUuY29tOjE5MzAyXCIgfVxyXG4gIF1cclxufTtcclxuXHJcbmNsYXNzIEphbnVzQWRhcHRlciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnJvb20gPSBudWxsO1xyXG4gICAgdGhpcy51c2VySWQgPSByYW5kb21VaW50KCk7XHJcblxyXG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSBudWxsO1xyXG4gICAgdGhpcy53ZWJSdGNPcHRpb25zID0ge307XHJcbiAgICB0aGlzLndzID0gbnVsbDtcclxuICAgIHRoaXMuc2Vzc2lvbiA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBudWxsO1xyXG4gICAgdGhpcy5vY2N1cGFudHMgPSB7fTtcclxuICAgIHRoaXMub2NjdXBhbnRQcm9taXNlcyA9IHt9O1xyXG5cclxuICAgIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlID0gdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UuYmluZCh0aGlzKTtcclxuICAgIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UgPSB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlLmJpbmQodGhpcyk7XHJcbiAgfVxyXG5cclxuICBzZXRTZXJ2ZXJVcmwodXJsKSB7XHJcbiAgICB0aGlzLnNlcnZlclVybCA9IHVybDtcclxuICB9XHJcblxyXG4gIHNldEFwcChhcHApIHt9XHJcblxyXG4gIHNldFJvb20ocm9vbU5hbWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMucm9vbSA9IHBhcnNlSW50KHJvb21OYW1lKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUm9vbSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci5cIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRXZWJSdGNPcHRpb25zKG9wdGlvbnMpIHtcclxuICAgIHRoaXMud2ViUnRjT3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgfVxyXG5cclxuICBzZXRTZXJ2ZXJDb25uZWN0TGlzdGVuZXJzKHN1Y2Nlc3NMaXN0ZW5lciwgZmFpbHVyZUxpc3RlbmVyKSB7XHJcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xyXG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcclxuICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkID0gb2NjdXBhbnRMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkID0gb3Blbkxpc3RlbmVyO1xyXG4gICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkID0gY2xvc2VkTGlzdGVuZXI7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlID0gbWVzc2FnZUxpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgY29ubmVjdCgpIHtcclxuICAgIHRoaXMud3MgPSBuZXcgV2ViU29ja2V0KHRoaXMuc2VydmVyVXJsLCBcImphbnVzLXByb3RvY29sXCIpO1xyXG4gICAgdGhpcy5zZXNzaW9uID0gbmV3IG1qLkphbnVzU2Vzc2lvbih0aGlzLndzLnNlbmQuYmluZCh0aGlzLndzKSk7XHJcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsIF8gPT4gdGhpcy5vbldlYnNvY2tldE9wZW4oKSk7XHJcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIG9uV2Vic29ja2V0T3BlbigpIHtcclxuICAgIC8vIENyZWF0ZSB0aGUgSmFudXMgU2Vzc2lvblxyXG4gICAgYXdhaXQgdGhpcy5zZXNzaW9uLmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vIEF0dGFjaCB0aGUgU0ZVIFBsdWdpbiBhbmQgY3JlYXRlIGEgUlRDUGVlckNvbm5lY3Rpb24gZm9yIHRoZSBwdWJsaXNoZXIuXHJcbiAgICAvLyBUaGUgcHVibGlzaGVyIHNlbmRzIGF1ZGlvIGFuZCBvcGVucyB0d28gYmlkaXJlY3Rpb25hbCBkYXRhIGNoYW5uZWxzLlxyXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cclxuICAgIHZhciBwdWJsaXNoZXJQcm9taXNlID0gdGhpcy5jcmVhdGVQdWJsaXNoZXIoKTtcclxuICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1t0aGlzLnVzZXJJZF0gPSBwdWJsaXNoZXJQcm9taXNlO1xyXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBhd2FpdCBwdWJsaXNoZXJQcm9taXNlO1xyXG5cclxuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3ModGhpcy51c2VySWQpO1xyXG5cclxuICAgIC8vIEFkZCBhbGwgb2YgdGhlIGluaXRpYWwgb2NjdXBhbnRzLlxyXG4gICAgZm9yIChsZXQgb2NjdXBhbnRJZCBvZiB0aGlzLnB1Ymxpc2hlci5pbml0aWFsT2NjdXBhbnRzKSB7XHJcbiAgICAgIGlmIChvY2N1cGFudElkICE9PSB0aGlzLnVzZXJJZCkge1xyXG4gICAgICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1tvY2N1cGFudElkXSA9IHRoaXMuYWRkT2NjdXBhbnQob2NjdXBhbnRJZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIG9uV2Vic29ja2V0TWVzc2FnZShldmVudCkge1xyXG4gICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xyXG4gICAgdGhpcy5zZXNzaW9uLnJlY2VpdmUobWVzc2FnZSk7XHJcblxyXG4gICAgLy8gSGFuZGxlIGFsbCBvZiB0aGUgam9pbiBhbmQgbGVhdmUgZXZlbnRzIGZyb20gdGhlIHB1Ymxpc2hlci5cclxuICAgIGlmIChtZXNzYWdlLnBsdWdpbmRhdGEgJiYgbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEpIHtcclxuICAgICAgdmFyIGRhdGEgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YTtcclxuXHJcbiAgICAgIGlmIChkYXRhLmV2ZW50ID09PSBcImpvaW5cIikge1xyXG4gICAgICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1tkYXRhLnVzZXJfaWRdID0gdGhpcy5hZGRPY2N1cGFudChkYXRhLnVzZXJfaWQpO1xyXG4gICAgICB9IGVsc2UgaWYgKGRhdGEuZXZlbnQgJiYgZGF0YS5ldmVudCA9PT0gXCJsZWF2ZVwiKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVPY2N1cGFudChkYXRhLnVzZXJfaWQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBhZGRPY2N1cGFudChvY2N1cGFudElkKSB7XHJcbiAgICB2YXIgc3Vic2NyaWJlciA9IGF3YWl0IHRoaXMuY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKTtcclxuICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgbmV3IG9jY3VwYW50LlxyXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkKG9jY3VwYW50SWQpO1xyXG4gICAgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0gPSB0cnVlO1xyXG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xyXG4gICAgcmV0dXJuIHN1YnNjcmliZXI7XHJcbiAgfVxyXG5cclxuICByZW1vdmVPY2N1cGFudChvY2N1cGFudElkKSB7XHJcbiAgICBpZiAodGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0pIHtcclxuICAgICAgZGVsZXRlIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdO1xyXG4gICAgICAvLyBDYWxsIHRoZSBOZXR3b3JrZWQgQUZyYW1lIGNhbGxiYWNrcyBmb3IgdGhlIHJlbW92ZWQgb2NjdXBhbnQuXHJcbiAgICAgIHRoaXMub25PY2N1cGFudERpc2Nvbm5lY3RlZChvY2N1cGFudElkKTtcclxuICAgICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgY3JlYXRlUHVibGlzaGVyKCkge1xyXG4gICAgdmFyIGhhbmRsZSA9IG5ldyBtai5KYW51c1BsdWdpbkhhbmRsZSh0aGlzLnNlc3Npb24pO1xyXG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XHJcblxyXG4gICAgdmFyIHBlZXJDb25uZWN0aW9uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKFBFRVJfQ09OTkVDVElPTl9DT05GSUcpO1xyXG5cclxuICAgIHBlZXJDb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJpY2VjYW5kaWRhdGVcIiwgZXZlbnQgPT4ge1xyXG4gICAgICBoYW5kbGUuc2VuZFRyaWNrbGUoZXZlbnQuY2FuZGlkYXRlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhbiB1bnJlbGlhYmxlIGRhdGFjaGFubmVsIGZvciBzZW5kaW5nIGFuZCByZWNlaXZpbmcgY29tcG9uZW50IHVwZGF0ZXMsIGV0Yy5cclxuICAgIHZhciB1bnJlbGlhYmxlQ2hhbm5lbCA9IHBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwidW5yZWxpYWJsZVwiLCB7XHJcbiAgICAgIG9yZGVyZWQ6IGZhbHNlLFxyXG4gICAgICBtYXhSZXRyYW5zbWl0czogMFxyXG4gICAgfSk7XHJcbiAgICB1bnJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSByZWxpYWJsZSBkYXRhY2hhbm5lbCBmb3Igc2VuZGluZyBhbmQgcmVjaWV2aW5nIGVudGl0eSBpbnN0YW50aWF0aW9ucywgZXRjLlxyXG4gICAgdmFyIHJlbGlhYmxlQ2hhbm5lbCA9IHBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwicmVsaWFibGVcIiwge1xyXG4gICAgICBvcmRlcmVkOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIHJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcclxuXHJcbiAgICB2YXIgbWVkaWFTdHJlYW07XHJcbiAgICBpZiAodGhpcy53ZWJSdGNPcHRpb25zLmF1ZGlvKSB7XHJcbiAgICAgIG1lZGlhU3RyZWFtID0gYXdhaXQgZ2V0TWljcm9waG9uZSgpO1xyXG5cclxuICAgICAgaWYgKG1lZGlhU3RyZWFtKSB7XHJcbiAgICAgICAgcGVlckNvbm5lY3Rpb24uYWRkU3RyZWFtKG1lZGlhU3RyZWFtKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBvZmZlciA9IGF3YWl0IHBlZXJDb25uZWN0aW9uLmNyZWF0ZU9mZmVyKCk7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcclxuXHJcbiAgICB2YXIgYW5zd2VyID0gYXdhaXQgaGFuZGxlLnNlbmRKc2VwKG9mZmVyKTtcclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKGFuc3dlci5qc2VwKTtcclxuXHJcbiAgICAvLyBXYWl0IGZvciB0aGUgcmVsaWFibGUgZGF0YWNoYW5uZWwgdG8gYmUgb3BlbiBiZWZvcmUgd2Ugc3RhcnQgc2VuZGluZyBtZXNzYWdlcyBvbiBpdC5cclxuICAgIGF3YWl0IHdhaXRGb3JFdmVudChyZWxpYWJsZUNoYW5uZWwsIFwib3BlblwiKTtcclxuXHJcbiAgICAvLyBTZW5kIGpvaW4gbWVzc2FnZSB0byBqYW51cy4gTGlzdGVuIGZvciBqb2luL2xlYXZlIG1lc3NhZ2VzLiBBdXRvbWF0aWNhbGx5IHN1YnNjcmliZSB0byBhbGwgdXNlcnMnIFdlYlJUQyBkYXRhLlxyXG4gICAgdmFyIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnNlbmRKb2luKGhhbmRsZSwgdGhpcy5yb29tLCB0aGlzLnVzZXJJZCwgdHJ1ZSk7XHJcblxyXG4gICAgdmFyIGluaXRpYWxPY2N1cGFudHMgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YS5yZXNwb25zZS51c2VyX2lkcztcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBoYW5kbGUsXHJcbiAgICAgIGluaXRpYWxPY2N1cGFudHMsXHJcbiAgICAgIHJlbGlhYmxlQ2hhbm5lbCxcclxuICAgICAgdW5yZWxpYWJsZUNoYW5uZWwsXHJcbiAgICAgIG1lZGlhU3RyZWFtLFxyXG4gICAgICBwZWVyQ29ubmVjdGlvblxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGNyZWF0ZVN1YnNjcmliZXIob2NjdXBhbnRJZCkge1xyXG4gICAgdmFyIGhhbmRsZSA9IG5ldyBtai5KYW51c1BsdWdpbkhhbmRsZSh0aGlzLnNlc3Npb24pO1xyXG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XHJcblxyXG4gICAgdmFyIHBlZXJDb25uZWN0aW9uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKFBFRVJfQ09OTkVDVElPTl9DT05GSUcpO1xyXG5cclxuICAgIHBlZXJDb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJpY2VjYW5kaWRhdGVcIiwgZXZlbnQgPT4ge1xyXG4gICAgICBoYW5kbGUuc2VuZFRyaWNrbGUoZXZlbnQuY2FuZGlkYXRlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBvZmZlciA9IGF3YWl0IHBlZXJDb25uZWN0aW9uLmNyZWF0ZU9mZmVyKHtcclxuICAgICAgb2ZmZXJUb1JlY2VpdmVBdWRpbzogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XHJcbiAgICB2YXIgYW5zd2VyID0gYXdhaXQgaGFuZGxlLnNlbmRKc2VwKG9mZmVyKTtcclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKGFuc3dlci5qc2VwKTtcclxuXHJcbiAgICAvLyBTZW5kIGpvaW4gbWVzc2FnZSB0byBqYW51cy4gRG9uJ3QgbGlzdGVuIGZvciBqb2luL2xlYXZlIG1lc3NhZ2VzLiBTdWJzY3JpYmUgdG8gdGhlIG9jY3VwYW50J3MgYXVkaW8gc3RyZWFtLlxyXG4gICAgYXdhaXQgdGhpcy5zZW5kSm9pbihoYW5kbGUsIHRoaXMucm9vbSwgdGhpcy51c2VySWQsIGZhbHNlLCBbXHJcbiAgICAgIHtcclxuICAgICAgICBwdWJsaXNoZXJfaWQ6IG9jY3VwYW50SWQsXHJcbiAgICAgICAgY29udGVudF9raW5kOiBDb250ZW50S2luZC5BdWRpb1xyXG4gICAgICB9XHJcbiAgICBdKTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIG9jY3VwYW50J3MgYXVkaW8gc3RyZWFtLlxyXG4gICAgdmFyIHN0cmVhbXMgPSBwZWVyQ29ubmVjdGlvbi5nZXRSZW1vdGVTdHJlYW1zKCk7XHJcbiAgICB2YXIgbWVkaWFTdHJlYW0gPSBzdHJlYW1zLmxlbmd0aCA+IDAgPyBzdHJlYW1zWzBdIDogbnVsbDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBoYW5kbGUsXHJcbiAgICAgIG1lZGlhU3RyZWFtLFxyXG4gICAgICBwZWVyQ29ubmVjdGlvblxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHNlbmRKb2luKGhhbmRsZSwgcm9vbUlkLCB1c2VySWQsIG5vdGlmeSwgc3BlY3MpIHtcclxuICAgIHJldHVybiBoYW5kbGUuc2VuZE1lc3NhZ2Uoe1xyXG4gICAgICBraW5kOiBcImpvaW5cIixcclxuICAgICAgcm9vbV9pZDogcm9vbUlkLFxyXG4gICAgICB1c2VyX2lkOiB1c2VySWQsXHJcbiAgICAgIG5vdGlmeSxcclxuICAgICAgc3Vic2NyaXB0aW9uX3NwZWNzOiBzcGVjc1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBvbkRhdGFDaGFubmVsTWVzc2FnZShldmVudCkge1xyXG4gICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLmRhdGFUeXBlKSB7XHJcbiAgICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UobnVsbCwgbWVzc2FnZS5kYXRhVHlwZSwgbWVzc2FnZS5kYXRhKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNob3VsZFN0YXJ0Q29ubmVjdGlvblRvKGNsaWVudElkKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHN0YXJ0U3RyZWFtQ29ubmVjdGlvbihjbGllbnRJZCkge31cclxuXHJcbiAgY2xvc2VTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7fVxyXG5cclxuICBnZXRDb25uZWN0U3RhdHVzKGNsaWVudElkKSB7XHJcbiAgICBpZiAodGhpcy5vY2N1cGFudHNbY2xpZW50SWRdKSB7XHJcbiAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuSVNfQ09OTkVDVEVEO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0TWVkaWFTdHJlYW0oY2xpZW50SWQpIHtcclxuICAgIHZhciBvY2N1cGFudFByb21pc2UgPSB0aGlzLm9jY3VwYW50UHJvbWlzZXNbY2xpZW50SWRdO1xyXG5cclxuICAgIGlmICghb2NjdXBhbnRQcm9taXNlKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcclxuICAgICAgICBuZXcgRXJyb3IoYFN1YnNjcmliZXIgZm9yIGNsaWVudDogJHtjbGllbnRJZH0gZG9lcyBub3QgZXhpc3QuYClcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gb2NjdXBhbnRQcm9taXNlLnRoZW4ocyA9PiBzLm1lZGlhU3RyZWFtKTtcclxuICB9XHJcblxyXG4gIGVuYWJsZU1pY3JvcGhvbmUoZW5hYmxlZCkge1xyXG4gICAgaWYgKHRoaXMucHVibGlzaGVyICYmIHRoaXMucHVibGlzaGVyLm1lZGlhU3RyZWFtKSB7XHJcbiAgICAgIHZhciBhdWRpb1RyYWNrcyA9IHRoaXMucHVibGlzaGVyLm1lZGlhU3RyZWFtLmdldEF1ZGlvVHJhY2tzKCk7XHJcblxyXG4gICAgICBpZiAoYXVkaW9UcmFja3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGF1ZGlvVHJhY2tzWzBdLmVuYWJsZWQgPSBlbmFibGVkO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YShjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMucHVibGlzaGVyLnVucmVsaWFibGVDaGFubmVsLnNlbmQoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFHdWFyYW50ZWVkKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIucmVsaWFibGVDaGFubmVsLnNlbmQoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgYnJvYWRjYXN0RGF0YShkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcclxuICB9XHJcblxyXG4gIGJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcclxuICB9XHJcbn1cclxuXHJcbk5BRi5hZGFwdGVycy5yZWdpc3RlcihcImphbnVzXCIsIEphbnVzQWRhcHRlcik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEphbnVzQWRhcHRlcjtcclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2luZGV4LmpzIiwiLyoqIFdoZXRoZXIgdG8gbG9nIGluZm9ybWF0aW9uIGFib3V0IGluY29taW5nIGFuZCBvdXRnb2luZyBKYW51cyBzaWduYWxzLiAqKi9cbnZhciB2ZXJib3NlID0gZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGhhbmRsZSB0byBhIHNpbmdsZSBKYW51cyBwbHVnaW4gb24gYSBKYW51cyBzZXNzaW9uLiBFYWNoIFdlYlJUQyBjb25uZWN0aW9uIHRvIHRoZSBKYW51cyBzZXJ2ZXIgd2lsbCBiZVxuICogYXNzb2NpYXRlZCB3aXRoIGEgc2luZ2xlIGhhbmRsZS4gT25jZSBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCB0aGlzIGhhbmRsZSB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZVxuICogdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNoYW5kbGVzLlxuICoqL1xuZnVuY3Rpb24gSmFudXNQbHVnaW5IYW5kbGUoc2Vzc2lvbikge1xuICB0aGlzLnNlc3Npb24gPSBzZXNzaW9uO1xuICB0aGlzLmlkID0gdW5kZWZpbmVkO1xufVxuXG4vKiogQXR0YWNoZXMgdGhpcyBoYW5kbGUgdG8gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKHBsdWdpbikge1xuICB2YXIgcGF5bG9hZCA9IHsgamFudXM6IFwiYXR0YWNoXCIsIHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGV0YWNoXCIgfSk7XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gU2lnbmFscyBzaG91bGQgYmUgSlNPTi1zZXJpYWxpemFibGUgb2JqZWN0cy4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsXG4gKiBiZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgdG8gdGhpcyBzaWduYWwgaXMgcmVjZWl2ZWQsIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZVxuICogc2Vzc2lvbiB0aW1lb3V0LlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKE9iamVjdC5hc3NpZ24oeyBoYW5kbGVfaWQ6IHRoaXMuaWQgfSwgc2lnbmFsKSk7XG59O1xuXG4vKiogU2VuZHMgYSBwbHVnaW4tc3BlY2lmaWMgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oYm9keSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcIm1lc3NhZ2VcIiwgYm9keToge30sIGpzZXA6IGpzZXAgfSk7XG59O1xuXG4vKiogU2VuZHMgYW4gSUNFIHRyaWNrbGUgY2FuZGlkYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZFRyaWNrbGUgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcInRyaWNrbGVcIiwgIGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7XG4gICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICBrZWVwYWxpdmVNczogMzAwMDBcbiAgfTtcbn1cblxuLyoqIENyZWF0ZXMgdGhpcyBzZXNzaW9uIG9uIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJjcmVhdGVcIiB9KS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqIERlc3Ryb3lzIHRoaXMgc2Vzc2lvbi4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImRlc3Ryb3lcIiB9KTtcbn07XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIHJlY2VpdmluZyBKU09OIHNpZ25hbGxpbmcgbWVzc2FnZXMgcGVydGluZW50IHRvIHRoaXMgc2Vzc2lvbi4gSWYgdGhlIHNpZ25hbHMgYXJlIHJlc3BvbnNlcyB0byBwcmV2aW91c2x5XG4gKiBzZW50IHNpZ25hbHMsIHRoZSBwcm9taXNlcyBmb3IgdGhlIG91dGdvaW5nIHNpZ25hbHMgd2lsbCBiZSByZXNvbHZlZCBvciByZWplY3RlZCBhcHByb3ByaWF0ZWx5IHdpdGggdGhpcyBzaWduYWwgYXMgYW5cbiAqIGFyZ3VtZW50LlxuICpcbiAqIEV4dGVybmFsIGNhbGxlcnMgc2hvdWxkIGNhbGwgdGhpcyBmdW5jdGlvbiBldmVyeSB0aW1lIGEgbmV3IHNpZ25hbCBhcnJpdmVzIG9uIHRoZSB0cmFuc3BvcnQ7IGZvciBleGFtcGxlLCBpbiBhXG4gKiBXZWJTb2NrZXQncyBgbWVzc2FnZWAgZXZlbnQsIG9yIHdoZW4gYSBuZXcgZGF0dW0gc2hvd3MgdXAgaW4gYW4gSFRUUCBsb25nLXBvbGxpbmcgcmVzcG9uc2UuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLnJlY2VpdmUgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgaWYgKG1vZHVsZS5leHBvcnRzLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiSW5jb21pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICBpZiAoc2lnbmFsLnRyYW5zYWN0aW9uICE9IG51bGwpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICBpZiAoc2lnbmFsLmphbnVzID09PSBcImFja1wiICYmIHNpZ25hbC5oaW50KSB7XG4gICAgICAvLyB0aGlzIGlzIGFuIGFjayBvZiBhbiBhc3luY2hyb25vdXNseS1wcm9jZXNzZWQgcmVxdWVzdCwgd2Ugc2hvdWxkIHdhaXRcbiAgICAgIC8vIHRvIHJlc29sdmUgdGhlIHByb21pc2UgdW50aWwgdGhlIGFjdHVhbCByZXNwb25zZSBjb21lcyBpblxuICAgIH0gZWxzZSBpZiAoaGFuZGxlcnMgIT0gbnVsbCkge1xuICAgICAgaWYgKGhhbmRsZXJzLnRpbWVvdXQgIT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaGFuZGxlcnMudGltZW91dCk7XG4gICAgICB9XG4gICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAoc2lnbmFsLmphbnVzID09PSBcImVycm9yXCIgPyBoYW5kbGVycy5yZWplY3QgOiBoYW5kbGVycy5yZXNvbHZlKShzaWduYWwpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBTZW5kcyBhIHNpZ25hbCBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uLiBTaWduYWxzIHNob3VsZCBiZSBKU09OLXNlcmlhbGl6YWJsZSBvYmplY3RzLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGxcbiAqIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIHdoZW4gYSByZXNwb25zZSB0byB0aGlzIHNpZ25hbCBpcyByZWNlaXZlZCwgb3Igd2hlbiBubyByZXNwb25zZSBpcyByZWNlaXZlZCB3aXRoaW4gdGhlXG4gKiBzZXNzaW9uIHRpbWVvdXQuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgaWYgKG1vZHVsZS5leHBvcnRzLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiT3V0Z29pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICBzaWduYWwgPSBPYmplY3QuYXNzaWduKHtcbiAgICBzZXNzaW9uX2lkOiB0aGlzLmlkLFxuICAgIHRyYW5zYWN0aW9uOiAodGhpcy5uZXh0VHhJZCsrKS50b1N0cmluZygpXG4gIH0sIHNpZ25hbCk7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudGltZW91dE1zKSB7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlNpZ25hbGxpbmcgbWVzc2FnZSB0aW1lZCBvdXQuXCIpKTtcbiAgICAgIH0sIHRoaXMub3B0aW9ucy50aW1lb3V0TXMpO1xuICAgIH1cbiAgICB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXSA9IHsgcmVzb2x2ZTogcmVzb2x2ZSwgcmVqZWN0OiByZWplY3QsIHRpbWVvdXQ6IHRpbWVvdXQgfTtcbiAgICB0aGlzLm91dHB1dChKU09OLnN0cmluZ2lmeShzaWduYWwpKTtcbiAgICB0aGlzLl9yZXNldEtlZXBhbGl2ZSgpO1xuICB9KTtcbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX3Jlc2V0S2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmtlZXBhbGl2ZVRpbWVvdXQpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5rZWVwYWxpdmVUaW1lb3V0KTtcbiAgfVxuICBpZiAodGhpcy5vcHRpb25zLmtlZXBhbGl2ZU1zKSB7XG4gICAgdGhpcy5rZWVwYWxpdmVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9rZWVwYWxpdmUoKSwgdGhpcy5vcHRpb25zLmtlZXBhbGl2ZU1zKTtcbiAgfVxufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fa2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJrZWVwYWxpdmVcIiB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBKYW51c1BsdWdpbkhhbmRsZSxcbiAgSmFudXNTZXNzaW9uLFxuICB2ZXJib3NlXG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvbWluaWphbnVzL21pbmlqYW51cy5qc1xuLy8gbW9kdWxlIGlkID0gMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9