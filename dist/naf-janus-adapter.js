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
    this.room = 1;
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

  setRoom(roomName) {}

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

      // Wait for the reliable datachannel to be open before we start sending messages on it.
      yield waitForEvent(publisher.reliableChannel, "open");

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

    console.log(message);

    // Handle all of the join and leave events from the publisher.
    if (this.publisher && message.sender && message.sender === this.publisher.handle.id && message.plugindata && message.plugindata.data) {
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

  getAudioStream(clientId) {
    var subscriber = this.occupantSubscribers[clientId];

    if (!subscriber) {
      throw new Error(`Subscriber for client: ${clientId} does not exist.`);
    }

    return subscriber.then(s => s.mediaStream);
  }

  enableMicrophone(enabled) {
    if (this.microphone) {
      var audioTracks = this.microphone.getAudioTracks();

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
  console.debug("Incoming Janus signal: ", signal);
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
  console.debug("Outgoing Janus signal: ", signal);
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
  JanusSession
};


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZjZiNjc2YzMzODFmZjMyOGI5ZmEiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsImF1ZGlvIiwiZSIsIm5hbWUiLCJjb25zb2xlIiwid2FybiIsImVycm9yIiwiZ2V0TWljcm9waG9uZSIsIm1qIiwicmVxdWlyZSIsIkNvbnRlbnRLaW5kIiwiQXVkaW8iLCJWaWRlbyIsIkRhdGEiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIndhaXRGb3JFdmVudCIsInRhcmdldCIsImV2ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRFdmVudExpc3RlbmVyIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJsIiwiSmFudXNBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyb29tIiwidXNlcklkIiwic2VydmVyVXJsIiwid3MiLCJzZXNzaW9uIiwicHVibGlzaGVyIiwib2NjdXBhbnRzIiwib2NjdXBhbnRTdWJzY3JpYmVycyIsIm9uV2Vic29ja2V0TWVzc2FnZSIsImJpbmQiLCJvbkRhdGFDaGFubmVsTWVzc2FnZSIsInNldFNlcnZlclVybCIsInNldEFwcCIsImFwcCIsInNldFJvb20iLCJyb29tTmFtZSIsInNldFdlYlJ0Y09wdGlvbnMiLCJvcHRpb25zIiwic2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyIsInN1Y2Nlc3NMaXN0ZW5lciIsImZhaWx1cmVMaXN0ZW5lciIsImNvbm5lY3RTdWNjZXNzIiwiY29ubmVjdEZhaWx1cmUiLCJzZXRSb29tT2NjdXBhbnRMaXN0ZW5lciIsIm9jY3VwYW50TGlzdGVuZXIiLCJvbk9jY3VwYW50c0NoYW5nZWQiLCJzZXREYXRhQ2hhbm5lbExpc3RlbmVycyIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwib25PY2N1cGFudENvbm5lY3RlZCIsIm9uT2NjdXBhbnREaXNjb25uZWN0ZWQiLCJvbk9jY3VwYW50TWVzc2FnZSIsImNvbm5lY3QiLCJXZWJTb2NrZXQiLCJKYW51c1Nlc3Npb24iLCJzZW5kIiwiXyIsIm9uV2Vic29ja2V0T3BlbiIsImNyZWF0ZSIsImNyZWF0ZVB1Ymxpc2hlciIsInJlbGlhYmxlQ2hhbm5lbCIsIm9jY3VwYW50SWQiLCJpbml0aWFsT2NjdXBhbnRzIiwiYWRkT2NjdXBhbnQiLCJtZXNzYWdlIiwiSlNPTiIsInBhcnNlIiwiZGF0YSIsInJlY2VpdmUiLCJsb2ciLCJzZW5kZXIiLCJoYW5kbGUiLCJpZCIsInBsdWdpbmRhdGEiLCJ1c2VyX2lkIiwicmVtb3ZlT2NjdXBhbnQiLCJzdWJzY3JpYmVyIiwiY3JlYXRlU3Vic2NyaWJlciIsIkphbnVzUGx1Z2luSGFuZGxlIiwiYXR0YWNoIiwicGVlckNvbm5lY3Rpb24iLCJSVENQZWVyQ29ubmVjdGlvbiIsInNlbmRUcmlja2xlIiwiY2FuZGlkYXRlIiwidW5yZWxpYWJsZUNoYW5uZWwiLCJjcmVhdGVEYXRhQ2hhbm5lbCIsIm9yZGVyZWQiLCJtYXhSZXRyYW5zbWl0cyIsIm1lZGlhU3RyZWFtIiwiYWRkU3RyZWFtIiwib2ZmZXIiLCJjcmVhdGVPZmZlciIsInNldExvY2FsRGVzY3JpcHRpb24iLCJhbnN3ZXIiLCJzZW5kSnNlcCIsInNldFJlbW90ZURlc2NyaXB0aW9uIiwianNlcCIsInNlbmRKb2luIiwicmVzcG9uc2UiLCJ1c2VyX2lkcyIsIm9mZmVyVG9SZWNlaXZlQXVkaW8iLCJwdWJsaXNoZXJfaWQiLCJjb250ZW50X2tpbmQiLCJzdHJlYW1zIiwiZ2V0UmVtb3RlU3RyZWFtcyIsImxlbmd0aCIsInJvb21JZCIsIm5vdGlmeSIsInNwZWNzIiwic2VuZE1lc3NhZ2UiLCJraW5kIiwicm9vbV9pZCIsInN1YnNjcmlwdGlvbl9zcGVjcyIsImRhdGFUeXBlIiwic2hvdWxkU3RhcnRDb25uZWN0aW9uVG8iLCJjbGllbnRJZCIsInN0YXJ0U3RyZWFtQ29ubmVjdGlvbiIsImNsb3NlU3RyZWFtQ29ubmVjdGlvbiIsImdldENvbm5lY3RTdGF0dXMiLCJOQUYiLCJhZGFwdGVycyIsIklTX0NPTk5FQ1RFRCIsIk5PVF9DT05ORUNURUQiLCJnZXRBdWRpb1N0cmVhbSIsIkVycm9yIiwidGhlbiIsInMiLCJlbmFibGVNaWNyb3Bob25lIiwiZW5hYmxlZCIsIm1pY3JvcGhvbmUiLCJhdWRpb1RyYWNrcyIsImdldEF1ZGlvVHJhY2tzIiwic2VuZERhdGEiLCJzdHJpbmdpZnkiLCJzZW5kRGF0YUd1YXJhbnRlZWQiLCJicm9hZGNhc3REYXRhIiwiYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQiLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7K0JDM0NBLGFBQStCO0FBQzdCLFFBQUk7QUFDRixhQUFPLE1BQU1BLFVBQVVDLFlBQVYsQ0FBdUJDLFlBQXZCLENBQW9DO0FBQy9DQyxlQUFPO0FBRHdDLE9BQXBDLENBQWI7QUFHRCxLQUpELENBSUUsT0FBT0MsQ0FBUCxFQUFV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dGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCBmNmI2NzZjMzM4MWZmMzI4YjlmYSIsInZhciBtaiA9IHJlcXVpcmUoXCJtaW5pamFudXNcIik7XG5cbmNvbnN0IENvbnRlbnRLaW5kID0ge1xuICBBdWRpbzogMSxcbiAgVmlkZW86IDIsXG4gIERhdGE6IDRcbn07XG5cbmZ1bmN0aW9uIHJhbmRvbVVpbnQoKSB7XG4gIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUik7XG59XG5cbmZ1bmN0aW9uIHdhaXRGb3JFdmVudCh0YXJnZXQsIGV2ZW50KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGUgPT4gcmVzb2x2ZShlKSwgeyBvbmNlOiB0cnVlIH0pO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0TWljcm9waG9uZSgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoe1xuICAgICAgYXVkaW86IHRydWVcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlLm5hbWUgPT09IFwiTm90QWxsb3dlZEVycm9yXCIpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIk1pY3JvcGhvbmUgYWNjZXNzIG5vdCBhbGxvd2VkLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgUEVFUl9DT05ORUNUSU9OX0NPTkZJRyA9IHtcbiAgaWNlU2VydmVyczogW1xuICAgIHsgdXJsOiBcInN0dW46c3R1bjEubC5nb29nbGUuY29tOjE5MzAyXCIgfSxcbiAgICB7IHVybDogXCJzdHVuOnN0dW4yLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH1cbiAgXVxufTtcblxuY2xhc3MgSmFudXNBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5yb29tID0gMTtcbiAgICB0aGlzLnVzZXJJZCA9IHJhbmRvbVVpbnQoKTtcblxuICAgIHRoaXMuc2VydmVyVXJsID0gbnVsbDtcbiAgICB0aGlzLndzID0gbnVsbDtcbiAgICB0aGlzLnNlc3Npb24gPSBudWxsO1xuXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBudWxsO1xuICAgIHRoaXMub2NjdXBhbnRzID0ge307XG4gICAgdGhpcy5vY2N1cGFudFN1YnNjcmliZXJzID0ge307XG5cbiAgICB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSA9IHRoaXMub25XZWJzb2NrZXRNZXNzYWdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSA9IHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UuYmluZCh0aGlzKTtcbiAgfVxuXG4gIHNldFNlcnZlclVybCh1cmwpIHtcbiAgICB0aGlzLnNlcnZlclVybCA9IHVybDtcbiAgfVxuXG4gIHNldEFwcChhcHApIHt9XG5cbiAgc2V0Um9vbShyb29tTmFtZSkge31cblxuICBzZXRXZWJSdGNPcHRpb25zKG9wdGlvbnMpIHt9XG5cbiAgc2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyhzdWNjZXNzTGlzdGVuZXIsIGZhaWx1cmVMaXN0ZW5lcikge1xuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcbiAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCA9IG9jY3VwYW50TGlzdGVuZXI7XG4gIH1cblxuICBzZXREYXRhQ2hhbm5lbExpc3RlbmVycyhvcGVuTGlzdGVuZXIsIGNsb3NlZExpc3RlbmVyLCBtZXNzYWdlTGlzdGVuZXIpIHtcbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQgPSBvcGVuTGlzdGVuZXI7XG4gICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkID0gY2xvc2VkTGlzdGVuZXI7XG4gICAgdGhpcy5vbk9jY3VwYW50TWVzc2FnZSA9IG1lc3NhZ2VMaXN0ZW5lcjtcbiAgfVxuXG4gIGNvbm5lY3QoKSB7XG4gICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJVcmwsIFwiamFudXMtcHJvdG9jb2xcIik7XG4gICAgdGhpcy5zZXNzaW9uID0gbmV3IG1qLkphbnVzU2Vzc2lvbih0aGlzLndzLnNlbmQuYmluZCh0aGlzLndzKSk7XG4gICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKFwib3BlblwiLCBfID0+IHRoaXMub25XZWJzb2NrZXRPcGVuKCkpO1xuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UpO1xuICB9XG5cbiAgYXN5bmMgb25XZWJzb2NrZXRPcGVuKCkge1xuICAgIC8vIENyZWF0ZSB0aGUgSmFudXMgU2Vzc2lvblxuICAgIGF3YWl0IHRoaXMuc2Vzc2lvbi5jcmVhdGUoKTtcblxuICAgIC8vIEF0dGFjaCB0aGUgU0ZVIFBsdWdpbiBhbmQgY3JlYXRlIGEgUlRDUGVlckNvbm5lY3Rpb24gZm9yIHRoZSBwdWJsaXNoZXIuXG4gICAgLy8gVGhlIHB1Ymxpc2hlciBzZW5kcyBhdWRpbyBhbmQgb3BlbnMgdHdvIGJpZGlyZWN0aW9uYWwgZGF0YSBjaGFubmVscy5cbiAgICAvLyBPbmUgcmVsaWFibGUgZGF0YWNoYW5uZWwgYW5kIG9uZSB1bnJlbGlhYmxlLlxuICAgIHZhciBwdWJsaXNoZXIgPSBhd2FpdCB0aGlzLmNyZWF0ZVB1Ymxpc2hlcigpO1xuICAgIHRoaXMucHVibGlzaGVyID0gcHVibGlzaGVyO1xuXG4gICAgLy8gV2FpdCBmb3IgdGhlIHJlbGlhYmxlIGRhdGFjaGFubmVsIHRvIGJlIG9wZW4gYmVmb3JlIHdlIHN0YXJ0IHNlbmRpbmcgbWVzc2FnZXMgb24gaXQuXG4gICAgYXdhaXQgd2FpdEZvckV2ZW50KHB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwsIFwib3BlblwiKTtcblxuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3ModGhpcy51c2VySWQpO1xuXG4gICAgLy8gQWRkIGFsbCBvZiB0aGUgaW5pdGlhbCBvY2N1cGFudHMuXG4gICAgZm9yIChsZXQgb2NjdXBhbnRJZCBvZiBwdWJsaXNoZXIuaW5pdGlhbE9jY3VwYW50cykge1xuICAgICAgaWYgKG9jY3VwYW50SWQgIT09IHB1Ymxpc2hlci51c2VySWQpIHtcbiAgICAgICAgdGhpcy5vY2N1cGFudFN1YnNjcmliZXJzW29jY3VwYW50SWRdID0gdGhpcy5hZGRPY2N1cGFudChvY2N1cGFudElkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvbldlYnNvY2tldE1lc3NhZ2UoZXZlbnQpIHtcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgdGhpcy5zZXNzaW9uLnJlY2VpdmUobWVzc2FnZSk7XG5cbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcblxuICAgIC8vIEhhbmRsZSBhbGwgb2YgdGhlIGpvaW4gYW5kIGxlYXZlIGV2ZW50cyBmcm9tIHRoZSBwdWJsaXNoZXIuXG4gICAgaWYgKFxuICAgICAgdGhpcy5wdWJsaXNoZXIgJiZcbiAgICAgIG1lc3NhZ2Uuc2VuZGVyICYmXG4gICAgICBtZXNzYWdlLnNlbmRlciA9PT0gdGhpcy5wdWJsaXNoZXIuaGFuZGxlLmlkICYmXG4gICAgICBtZXNzYWdlLnBsdWdpbmRhdGEgJiZcbiAgICAgIG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhXG4gICAgKSB7XG4gICAgICB2YXIgZGF0YSA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhO1xuXG4gICAgICBpZiAoZGF0YS5ldmVudCA9PT0gXCJqb2luXCIpIHtcbiAgICAgICAgdGhpcy5vY2N1cGFudFN1YnNjcmliZXJzW2RhdGEudXNlcl9pZF0gPSB0aGlzLmFkZE9jY3VwYW50KGRhdGEudXNlcl9pZCk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGEuZXZlbnQgJiYgZGF0YS5ldmVudCA9PT0gXCJsZWF2ZVwiKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlT2NjdXBhbnQoZGF0YS51c2VyX2lkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyBhZGRPY2N1cGFudChvY2N1cGFudElkKSB7XG4gICAgdmFyIHN1YnNjcmliZXIgPSBhd2FpdCB0aGlzLmNyZWF0ZVN1YnNjcmliZXIob2NjdXBhbnRJZCk7XG4gICAgLy8gQ2FsbCB0aGUgTmV0d29ya2VkIEFGcmFtZSBjYWxsYmFja3MgZm9yIHRoZSBuZXcgb2NjdXBhbnQuXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkKG9jY3VwYW50SWQpO1xuICAgIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdID0gdHJ1ZTtcbiAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XG4gICAgcmV0dXJuIHN1YnNjcmliZXI7XG4gIH1cblxuICByZW1vdmVPY2N1cGFudChvY2N1cGFudElkKSB7XG4gICAgaWYgKHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdKSB7XG4gICAgICBkZWxldGUgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF07XG4gICAgICAvLyBDYWxsIHRoZSBOZXR3b3JrZWQgQUZyYW1lIGNhbGxiYWNrcyBmb3IgdGhlIHJlbW92ZWQgb2NjdXBhbnQuXG4gICAgICB0aGlzLm9uT2NjdXBhbnREaXNjb25uZWN0ZWQob2NjdXBhbnRJZCk7XG4gICAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlUHVibGlzaGVyKCkge1xuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcbiAgICBhd2FpdCBoYW5kbGUuYXR0YWNoKFwiamFudXMucGx1Z2luLnNmdVwiKTtcblxuICAgIHZhciBwZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcblxuICAgIHBlZXJDb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJpY2VjYW5kaWRhdGVcIiwgZXZlbnQgPT4ge1xuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2ZW50LmNhbmRpZGF0ZSk7XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYW4gdW5yZWxpYWJsZSBkYXRhY2hhbm5lbCBmb3Igc2VuZGluZyBhbmQgcmVjZWl2aW5nIGNvbXBvbmVudCB1cGRhdGVzLCBldGMuXG4gICAgdmFyIHVucmVsaWFibGVDaGFubmVsID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJ1bnJlbGlhYmxlXCIsIHtcbiAgICAgIG9yZGVyZWQ6IGZhbHNlLFxuICAgICAgbWF4UmV0cmFuc21pdHM6IDBcbiAgICB9KTtcbiAgICB1bnJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcblxuICAgIC8vIENyZWF0ZSBhIHJlbGlhYmxlIGRhdGFjaGFubmVsIGZvciBzZW5kaW5nIGFuZCByZWNpZXZpbmcgZW50aXR5IGluc3RhbnRpYXRpb25zLCBldGMuXG4gICAgdmFyIHJlbGlhYmxlQ2hhbm5lbCA9IHBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwicmVsaWFibGVcIiwge1xuICAgICAgb3JkZXJlZDogdHJ1ZVxuICAgIH0pO1xuICAgIHJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcblxuICAgIHZhciBtZWRpYVN0cmVhbSA9IGF3YWl0IGdldE1pY3JvcGhvbmUoKTtcblxuICAgIGlmIChtZWRpYVN0cmVhbSkge1xuICAgICAgcGVlckNvbm5lY3Rpb24uYWRkU3RyZWFtKG1lZGlhU3RyZWFtKTtcbiAgICB9XG5cbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcigpO1xuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xuXG4gICAgdmFyIGFuc3dlciA9IGF3YWl0IGhhbmRsZS5zZW5kSnNlcChvZmZlcik7XG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0UmVtb3RlRGVzY3JpcHRpb24oYW5zd2VyLmpzZXApO1xuXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIExpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gQXV0b21hdGljYWxseSBzdWJzY3JpYmUgdG8gYWxsIHVzZXJzJyBXZWJSVEMgZGF0YS5cbiAgICB2YXIgbWVzc2FnZSA9IGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCB0cnVlKTtcblxuICAgIHZhciBpbml0aWFsT2NjdXBhbnRzID0gbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEucmVzcG9uc2UudXNlcl9pZHM7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaGFuZGxlLFxuICAgICAgaW5pdGlhbE9jY3VwYW50cyxcbiAgICAgIHJlbGlhYmxlQ2hhbm5lbCxcbiAgICAgIHVucmVsaWFibGVDaGFubmVsLFxuICAgICAgbWVkaWFTdHJlYW0sXG4gICAgICBwZWVyQ29ubmVjdGlvblxuICAgIH07XG4gIH1cblxuICBhc3luYyBjcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpIHtcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XG5cbiAgICB2YXIgcGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XG5cbiAgICBwZWVyQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ZW50ID0+IHtcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldmVudC5jYW5kaWRhdGUpO1xuICAgIH0pO1xuXG4gICAgdmFyIG9mZmVyID0gYXdhaXQgcGVlckNvbm5lY3Rpb24uY3JlYXRlT2ZmZXIoe1xuICAgICAgb2ZmZXJUb1JlY2VpdmVBdWRpbzogdHJ1ZVxuICAgIH0pO1xuXG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XG4gICAgdmFyIGFuc3dlciA9IGF3YWl0IGhhbmRsZS5zZW5kSnNlcChvZmZlcik7XG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0UmVtb3RlRGVzY3JpcHRpb24oYW5zd2VyLmpzZXApO1xuXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIERvbid0IGxpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gU3Vic2NyaWJlIHRvIHRoZSBvY2N1cGFudCdzIGF1ZGlvIHN0cmVhbS5cbiAgICBhd2FpdCB0aGlzLnNlbmRKb2luKGhhbmRsZSwgdGhpcy5yb29tLCB0aGlzLnVzZXJJZCwgZmFsc2UsIFtcbiAgICAgIHtcbiAgICAgICAgcHVibGlzaGVyX2lkOiBvY2N1cGFudElkLFxuICAgICAgICBjb250ZW50X2tpbmQ6IENvbnRlbnRLaW5kLkF1ZGlvXG4gICAgICB9XG4gICAgXSk7XG5cbiAgICAvLyBHZXQgdGhlIG9jY3VwYW50J3MgYXVkaW8gc3RyZWFtLlxuICAgIHZhciBzdHJlYW1zID0gcGVlckNvbm5lY3Rpb24uZ2V0UmVtb3RlU3RyZWFtcygpO1xuICAgIHZhciBtZWRpYVN0cmVhbSA9IHN0cmVhbXMubGVuZ3RoID4gMCA/IHN0cmVhbXNbMF0gOiBudWxsO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGhhbmRsZSxcbiAgICAgIG1lZGlhU3RyZWFtLFxuICAgICAgcGVlckNvbm5lY3Rpb25cbiAgICB9O1xuICB9XG5cbiAgc2VuZEpvaW4oaGFuZGxlLCByb29tSWQsIHVzZXJJZCwgbm90aWZ5LCBzcGVjcykge1xuICAgIHJldHVybiBoYW5kbGUuc2VuZE1lc3NhZ2Uoe1xuICAgICAga2luZDogXCJqb2luXCIsXG4gICAgICByb29tX2lkOiByb29tSWQsXG4gICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICBub3RpZnksXG4gICAgICBzdWJzY3JpcHRpb25fc3BlY3M6IHNwZWNzXG4gICAgfSk7XG4gIH1cblxuICBvbkRhdGFDaGFubmVsTWVzc2FnZShldmVudCkge1xuICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgIGlmIChtZXNzYWdlLmRhdGFUeXBlKSB7XG4gICAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlKG51bGwsIG1lc3NhZ2UuZGF0YVR5cGUsIG1lc3NhZ2UuZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkU3RhcnRDb25uZWN0aW9uVG8oY2xpZW50SWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHN0YXJ0U3RyZWFtQ29ubmVjdGlvbihjbGllbnRJZCkge31cblxuICBjbG9zZVN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHt9XG5cbiAgZ2V0Q29ubmVjdFN0YXR1cyhjbGllbnRJZCkge1xuICAgIGlmICh0aGlzLm9jY3VwYW50c1tjbGllbnRJZF0pIHtcbiAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuSVNfQ09OTkVDVEVEO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0QXVkaW9TdHJlYW0oY2xpZW50SWQpIHtcbiAgICB2YXIgc3Vic2NyaWJlciA9IHRoaXMub2NjdXBhbnRTdWJzY3JpYmVyc1tjbGllbnRJZF07XG5cbiAgICBpZiAoIXN1YnNjcmliZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU3Vic2NyaWJlciBmb3IgY2xpZW50OiAke2NsaWVudElkfSBkb2VzIG5vdCBleGlzdC5gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3Vic2NyaWJlci50aGVuKHMgPT4gcy5tZWRpYVN0cmVhbSk7XG4gIH1cblxuICBlbmFibGVNaWNyb3Bob25lKGVuYWJsZWQpIHtcbiAgICBpZiAodGhpcy5taWNyb3Bob25lKSB7XG4gICAgICB2YXIgYXVkaW9UcmFja3MgPSB0aGlzLm1pY3JvcGhvbmUuZ2V0QXVkaW9UcmFja3MoKTtcblxuICAgICAgaWYgKGF1ZGlvVHJhY2tzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYXVkaW9UcmFja3NbMF0uZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2VuZERhdGEoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pXG4gICAgKTtcbiAgfVxuXG4gIHNlbmREYXRhR3VhcmFudGVlZChjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pXG4gICAgKTtcbiAgfVxuXG4gIGJyb2FkY2FzdERhdGEoZGF0YVR5cGUsIGRhdGEpIHtcbiAgICB0aGlzLnB1Ymxpc2hlci51bnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xuICB9XG5cbiAgYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQoZGF0YVR5cGUsIGRhdGEpIHtcbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcbiAgfVxufVxuXG5OQUYuYWRhcHRlcnMucmVnaXN0ZXIoXCJqYW51c1wiLCBKYW51c0FkYXB0ZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEphbnVzQWRhcHRlcjtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9pbmRleC5qcyIsIi8qKlxuICogUmVwcmVzZW50cyBhIGhhbmRsZSB0byBhIHNpbmdsZSBKYW51cyBwbHVnaW4gb24gYSBKYW51cyBzZXNzaW9uLiBFYWNoIFdlYlJUQyBjb25uZWN0aW9uIHRvIHRoZSBKYW51cyBzZXJ2ZXIgd2lsbCBiZVxuICogYXNzb2NpYXRlZCB3aXRoIGEgc2luZ2xlIGhhbmRsZS4gT25jZSBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCB0aGlzIGhhbmRsZSB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZVxuICogdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNoYW5kbGVzLlxuICoqL1xuZnVuY3Rpb24gSmFudXNQbHVnaW5IYW5kbGUoc2Vzc2lvbikge1xuICB0aGlzLnNlc3Npb24gPSBzZXNzaW9uO1xuICB0aGlzLmlkID0gdW5kZWZpbmVkO1xufVxuXG4vKiogQXR0YWNoZXMgdGhpcyBoYW5kbGUgdG8gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKHBsdWdpbikge1xuICB2YXIgcGF5bG9hZCA9IHsgamFudXM6IFwiYXR0YWNoXCIsIHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGV0YWNoXCIgfSk7XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gU2lnbmFscyBzaG91bGQgYmUgSlNPTi1zZXJpYWxpemFibGUgb2JqZWN0cy4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsXG4gKiBiZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgdG8gdGhpcyBzaWduYWwgaXMgcmVjZWl2ZWQsIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZVxuICogc2Vzc2lvbiB0aW1lb3V0LlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKE9iamVjdC5hc3NpZ24oeyBoYW5kbGVfaWQ6IHRoaXMuaWQgfSwgc2lnbmFsKSk7XG59O1xuXG4vKiogU2VuZHMgYSBwbHVnaW4tc3BlY2lmaWMgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oYm9keSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcIm1lc3NhZ2VcIiwgYm9keToge30sIGpzZXA6IGpzZXAgfSk7XG59O1xuXG4vKiogU2VuZHMgYW4gSUNFIHRyaWNrbGUgY2FuZGlkYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZFRyaWNrbGUgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcInRyaWNrbGVcIiwgIGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7XG4gICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICBrZWVwYWxpdmVNczogMzAwMDBcbiAgfTtcbn1cblxuLyoqIENyZWF0ZXMgdGhpcyBzZXNzaW9uIG9uIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJjcmVhdGVcIiB9KS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqIERlc3Ryb3lzIHRoaXMgc2Vzc2lvbi4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImRlc3Ryb3lcIiB9KTtcbn07XG5cbi8qKlxuICogQ2FsbGJhY2sgZm9yIHJlY2VpdmluZyBKU09OIHNpZ25hbGxpbmcgbWVzc2FnZXMgcGVydGluZW50IHRvIHRoaXMgc2Vzc2lvbi4gSWYgdGhlIHNpZ25hbHMgYXJlIHJlc3BvbnNlcyB0byBwcmV2aW91c2x5XG4gKiBzZW50IHNpZ25hbHMsIHRoZSBwcm9taXNlcyBmb3IgdGhlIG91dGdvaW5nIHNpZ25hbHMgd2lsbCBiZSByZXNvbHZlZCBvciByZWplY3RlZCBhcHByb3ByaWF0ZWx5IHdpdGggdGhpcyBzaWduYWwgYXMgYW5cbiAqIGFyZ3VtZW50LlxuICpcbiAqIEV4dGVybmFsIGNhbGxlcnMgc2hvdWxkIGNhbGwgdGhpcyBmdW5jdGlvbiBldmVyeSB0aW1lIGEgbmV3IHNpZ25hbCBhcnJpdmVzIG9uIHRoZSB0cmFuc3BvcnQ7IGZvciBleGFtcGxlLCBpbiBhXG4gKiBXZWJTb2NrZXQncyBgbWVzc2FnZWAgZXZlbnQsIG9yIHdoZW4gYSBuZXcgZGF0dW0gc2hvd3MgdXAgaW4gYW4gSFRUUCBsb25nLXBvbGxpbmcgcmVzcG9uc2UuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLnJlY2VpdmUgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgY29uc29sZS5kZWJ1ZyhcIkluY29taW5nIEphbnVzIHNpZ25hbDogXCIsIHNpZ25hbCk7XG4gIGlmIChzaWduYWwudHJhbnNhY3Rpb24gIT0gbnVsbCkge1xuICAgIHZhciBoYW5kbGVycyA9IHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgIGlmIChzaWduYWwuamFudXMgPT09IFwiYWNrXCIgJiYgc2lnbmFsLmhpbnQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYW4gYWNrIG9mIGFuIGFzeW5jaHJvbm91c2x5LXByb2Nlc3NlZCByZXF1ZXN0LCB3ZSBzaG91bGQgd2FpdFxuICAgICAgLy8gdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB1bnRpbCB0aGUgYWN0dWFsIHJlc3BvbnNlIGNvbWVzIGluXG4gICAgfSBlbHNlIGlmIChoYW5kbGVycyAhPSBudWxsKSB7XG4gICAgICBpZiAoaGFuZGxlcnMudGltZW91dCAhPSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChoYW5kbGVycy50aW1lb3V0KTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgIChzaWduYWwuamFudXMgPT09IFwiZXJyb3JcIiA/IGhhbmRsZXJzLnJlamVjdCA6IGhhbmRsZXJzLnJlc29sdmUpKHNpZ25hbCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb24uIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBjb25zb2xlLmRlYnVnKFwiT3V0Z29pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgc2lnbmFsID0gT2JqZWN0LmFzc2lnbih7XG4gICAgc2Vzc2lvbl9pZDogdGhpcy5pZCxcbiAgICB0cmFuc2FjdGlvbjogKHRoaXMubmV4dFR4SWQrKykudG9TdHJpbmcoKVxuICB9LCBzaWduYWwpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVvdXRNcykge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJTaWduYWxsaW5nIG1lc3NhZ2UgdGltZWQgb3V0LlwiKSk7XG4gICAgICB9LCB0aGlzLm9wdGlvbnMudGltZW91dE1zKTtcbiAgICB9XG4gICAgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl0gPSB7IHJlc29sdmU6IHJlc29sdmUsIHJlamVjdDogcmVqZWN0LCB0aW1lb3V0OiB0aW1lb3V0IH07XG4gICAgdGhpcy5vdXRwdXQoSlNPTi5zdHJpbmdpZnkoc2lnbmFsKSk7XG4gICAgdGhpcy5fcmVzZXRLZWVwYWxpdmUoKTtcbiAgfSk7XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9yZXNldEtlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5rZWVwYWxpdmVUaW1lb3V0KSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMua2VlcGFsaXZlVGltZW91dCk7XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcykge1xuICAgIHRoaXMua2VlcGFsaXZlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fa2VlcGFsaXZlKCksIHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcyk7XG4gIH1cbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX2tlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwia2VlcGFsaXZlXCIgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgSmFudXNQbHVnaW5IYW5kbGUsXG4gIEphbnVzU2Vzc2lvblxufTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL21pbmlqYW51cy9taW5pamFudXMuanNcbi8vIG1vZHVsZSBpZCA9IDFcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sInNvdXJjZVJvb3QiOiIifQ==