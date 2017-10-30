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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNzExYzQ2ZTIzZDBkZWM2MGQzNzEiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsImF1ZGlvIiwiZSIsIm5hbWUiLCJjb25zb2xlIiwid2FybiIsImVycm9yIiwiZ2V0TWljcm9waG9uZSIsIm1qIiwicmVxdWlyZSIsIkNvbnRlbnRLaW5kIiwiQXVkaW8iLCJWaWRlbyIsIkRhdGEiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIndhaXRGb3JFdmVudCIsInRhcmdldCIsImV2ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRFdmVudExpc3RlbmVyIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJsIiwiSmFudXNBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyb29tIiwidXNlcklkIiwic2VydmVyVXJsIiwid3MiLCJzZXNzaW9uIiwicHVibGlzaGVyIiwib2NjdXBhbnRzIiwib2NjdXBhbnRQcm9taXNlcyIsIm9uV2Vic29ja2V0TWVzc2FnZSIsImJpbmQiLCJvbkRhdGFDaGFubmVsTWVzc2FnZSIsInNldFNlcnZlclVybCIsInNldEFwcCIsImFwcCIsInNldFJvb20iLCJyb29tTmFtZSIsInBhcnNlSW50IiwiRXJyb3IiLCJzZXRXZWJSdGNPcHRpb25zIiwib3B0aW9ucyIsInNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMiLCJzdWNjZXNzTGlzdGVuZXIiLCJmYWlsdXJlTGlzdGVuZXIiLCJjb25uZWN0U3VjY2VzcyIsImNvbm5lY3RGYWlsdXJlIiwic2V0Um9vbU9jY3VwYW50TGlzdGVuZXIiLCJvY2N1cGFudExpc3RlbmVyIiwib25PY2N1cGFudHNDaGFuZ2VkIiwic2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMiLCJvcGVuTGlzdGVuZXIiLCJjbG9zZWRMaXN0ZW5lciIsIm1lc3NhZ2VMaXN0ZW5lciIsIm9uT2NjdXBhbnRDb25uZWN0ZWQiLCJvbk9jY3VwYW50RGlzY29ubmVjdGVkIiwib25PY2N1cGFudE1lc3NhZ2UiLCJjb25uZWN0IiwiV2ViU29ja2V0IiwiSmFudXNTZXNzaW9uIiwic2VuZCIsIl8iLCJvbldlYnNvY2tldE9wZW4iLCJjcmVhdGUiLCJwdWJsaXNoZXJQcm9taXNlIiwiY3JlYXRlUHVibGlzaGVyIiwib2NjdXBhbnRJZCIsImluaXRpYWxPY2N1cGFudHMiLCJhZGRPY2N1cGFudCIsIm1lc3NhZ2UiLCJKU09OIiwicGFyc2UiLCJkYXRhIiwicmVjZWl2ZSIsInBsdWdpbmRhdGEiLCJ1c2VyX2lkIiwicmVtb3ZlT2NjdXBhbnQiLCJzdWJzY3JpYmVyIiwiY3JlYXRlU3Vic2NyaWJlciIsImhhbmRsZSIsIkphbnVzUGx1Z2luSGFuZGxlIiwiYXR0YWNoIiwicGVlckNvbm5lY3Rpb24iLCJSVENQZWVyQ29ubmVjdGlvbiIsInNlbmRUcmlja2xlIiwiY2FuZGlkYXRlIiwidW5yZWxpYWJsZUNoYW5uZWwiLCJjcmVhdGVEYXRhQ2hhbm5lbCIsIm9yZGVyZWQiLCJtYXhSZXRyYW5zbWl0cyIsInJlbGlhYmxlQ2hhbm5lbCIsIm1lZGlhU3RyZWFtIiwiYWRkU3RyZWFtIiwib2ZmZXIiLCJjcmVhdGVPZmZlciIsInNldExvY2FsRGVzY3JpcHRpb24iLCJhbnN3ZXIiLCJzZW5kSnNlcCIsInNldFJlbW90ZURlc2NyaXB0aW9uIiwianNlcCIsInNlbmRKb2luIiwicmVzcG9uc2UiLCJ1c2VyX2lkcyIsIm9mZmVyVG9SZWNlaXZlQXVkaW8iLCJwdWJsaXNoZXJfaWQiLCJjb250ZW50X2tpbmQiLCJzdHJlYW1zIiwiZ2V0UmVtb3RlU3RyZWFtcyIsImxlbmd0aCIsInJvb21JZCIsIm5vdGlmeSIsInNwZWNzIiwic2VuZE1lc3NhZ2UiLCJraW5kIiwicm9vbV9pZCIsInN1YnNjcmlwdGlvbl9zcGVjcyIsImRhdGFUeXBlIiwic2hvdWxkU3RhcnRDb25uZWN0aW9uVG8iLCJjbGllbnRJZCIsInN0YXJ0U3RyZWFtQ29ubmVjdGlvbiIsImNsb3NlU3RyZWFtQ29ubmVjdGlvbiIsImdldENvbm5lY3RTdGF0dXMiLCJOQUYiLCJhZGFwdGVycyIsIklTX0NPTk5FQ1RFRCIsIk5PVF9DT05ORUNURUQiLCJnZXRNZWRpYVN0cmVhbSIsIm9jY3VwYW50UHJvbWlzZSIsInRoZW4iLCJzIiwiZW5hYmxlTWljcm9waG9uZSIsImVuYWJsZWQiLCJhdWRpb1RyYWNrcyIsImdldEF1ZGlvVHJhY2tzIiwic2VuZERhdGEiLCJzdHJpbmdpZnkiLCJzZW5kRGF0YUd1YXJhbnRlZWQiLCJicm9hZGNhc3REYXRhIiwiYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQiLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7K0JDM0NBLGFBQStCO0FBQzdCLFFBQUk7QUFDRixhQUFPLE1BQU1BLFVBQVVDLFlBQVYsQ0FBdUJDLFlBQXZCLENBQW9DO0FBQy9DQyxlQUFPO0FBRHdDLE9BQXBDLENBQWI7QUFHRCxLQUpELENBSUUsT0FB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LEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CLHFCQUFxQjtBQUN6Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im5hZi1qYW51cy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgNzExYzQ2ZTIzZDBkZWM2MGQzNzEiLCJ2YXIgbWogPSByZXF1aXJlKFwibWluaWphbnVzXCIpO1xyXG5cclxuY29uc3QgQ29udGVudEtpbmQgPSB7XHJcbiAgQXVkaW86IDEsXHJcbiAgVmlkZW86IDIsXHJcbiAgRGF0YTogNFxyXG59O1xyXG5cclxuZnVuY3Rpb24gcmFuZG9tVWludCgpIHtcclxuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3YWl0Rm9yRXZlbnQodGFyZ2V0LCBldmVudCkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZSA9PiByZXNvbHZlKGUpLCB7IG9uY2U6IHRydWUgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldE1pY3JvcGhvbmUoKSB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7XHJcbiAgICAgIGF1ZGlvOiB0cnVlXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICBpZiAoZS5uYW1lID09PSBcIk5vdEFsbG93ZWRFcnJvclwiKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihcIk1pY3JvcGhvbmUgYWNjZXNzIG5vdCBhbGxvd2VkLlwiKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBQRUVSX0NPTk5FQ1RJT05fQ09ORklHID0ge1xyXG4gIGljZVNlcnZlcnM6IFtcclxuICAgIHsgdXJsOiBcInN0dW46c3R1bjEubC5nb29nbGUuY29tOjE5MzAyXCIgfSxcclxuICAgIHsgdXJsOiBcInN0dW46c3R1bjIubC5nb29nbGUuY29tOjE5MzAyXCIgfVxyXG4gIF1cclxufTtcclxuXHJcbmNsYXNzIEphbnVzQWRhcHRlciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnJvb20gPSBudWxsO1xyXG4gICAgdGhpcy51c2VySWQgPSByYW5kb21VaW50KCk7XHJcblxyXG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSBudWxsO1xyXG4gICAgdGhpcy53cyA9IG51bGw7XHJcbiAgICB0aGlzLnNlc3Npb24gPSBudWxsO1xyXG5cclxuICAgIHRoaXMucHVibGlzaGVyID0gbnVsbDtcclxuICAgIHRoaXMub2NjdXBhbnRzID0ge307XHJcbiAgICB0aGlzLm9jY3VwYW50UHJvbWlzZXMgPSB7fTtcclxuXHJcbiAgICB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSA9IHRoaXMub25XZWJzb2NrZXRNZXNzYWdlLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlID0gdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZS5iaW5kKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgc2V0U2VydmVyVXJsKHVybCkge1xyXG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSB1cmw7XHJcbiAgfVxyXG5cclxuICBzZXRBcHAoYXBwKSB7fVxyXG5cclxuICBzZXRSb29tKHJvb21OYW1lKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICB0aGlzLnJvb20gPSBwYXJzZUludChyb29tTmFtZSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJvb20gbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXIuXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7fVxyXG5cclxuICBzZXRTZXJ2ZXJDb25uZWN0TGlzdGVuZXJzKHN1Y2Nlc3NMaXN0ZW5lciwgZmFpbHVyZUxpc3RlbmVyKSB7XHJcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xyXG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcclxuICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkID0gb2NjdXBhbnRMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkID0gb3Blbkxpc3RlbmVyO1xyXG4gICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkID0gY2xvc2VkTGlzdGVuZXI7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlID0gbWVzc2FnZUxpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgY29ubmVjdCgpIHtcclxuICAgIHRoaXMud3MgPSBuZXcgV2ViU29ja2V0KHRoaXMuc2VydmVyVXJsLCBcImphbnVzLXByb3RvY29sXCIpO1xyXG4gICAgdGhpcy5zZXNzaW9uID0gbmV3IG1qLkphbnVzU2Vzc2lvbih0aGlzLndzLnNlbmQuYmluZCh0aGlzLndzKSk7XHJcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsIF8gPT4gdGhpcy5vbldlYnNvY2tldE9wZW4oKSk7XHJcbiAgICB0aGlzLndzLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIG9uV2Vic29ja2V0T3BlbigpIHtcclxuICAgIC8vIENyZWF0ZSB0aGUgSmFudXMgU2Vzc2lvblxyXG4gICAgYXdhaXQgdGhpcy5zZXNzaW9uLmNyZWF0ZSgpO1xyXG5cclxuICAgIC8vIEF0dGFjaCB0aGUgU0ZVIFBsdWdpbiBhbmQgY3JlYXRlIGEgUlRDUGVlckNvbm5lY3Rpb24gZm9yIHRoZSBwdWJsaXNoZXIuXHJcbiAgICAvLyBUaGUgcHVibGlzaGVyIHNlbmRzIGF1ZGlvIGFuZCBvcGVucyB0d28gYmlkaXJlY3Rpb25hbCBkYXRhIGNoYW5uZWxzLlxyXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cclxuICAgIHZhciBwdWJsaXNoZXJQcm9taXNlID0gdGhpcy5jcmVhdGVQdWJsaXNoZXIoKTtcclxuICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1t0aGlzLnVzZXJJZF0gPSBwdWJsaXNoZXJQcm9taXNlO1xyXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBhd2FpdCBwdWJsaXNoZXJQcm9taXNlO1xyXG5cclxuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3ModGhpcy51c2VySWQpO1xyXG5cclxuICAgIC8vIEFkZCBhbGwgb2YgdGhlIGluaXRpYWwgb2NjdXBhbnRzLlxyXG4gICAgZm9yIChsZXQgb2NjdXBhbnRJZCBvZiB0aGlzLnB1Ymxpc2hlci5pbml0aWFsT2NjdXBhbnRzKSB7XHJcbiAgICAgIGlmIChvY2N1cGFudElkICE9PSB0aGlzLnVzZXJJZCkge1xyXG4gICAgICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1tvY2N1cGFudElkXSA9IHRoaXMuYWRkT2NjdXBhbnQob2NjdXBhbnRJZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIG9uV2Vic29ja2V0TWVzc2FnZShldmVudCkge1xyXG4gICAgdmFyIG1lc3NhZ2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xyXG4gICAgdGhpcy5zZXNzaW9uLnJlY2VpdmUobWVzc2FnZSk7XHJcblxyXG4gICAgLy8gSGFuZGxlIGFsbCBvZiB0aGUgam9pbiBhbmQgbGVhdmUgZXZlbnRzIGZyb20gdGhlIHB1Ymxpc2hlci5cclxuICAgIGlmIChtZXNzYWdlLnBsdWdpbmRhdGEgJiYgbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEpIHtcclxuICAgICAgdmFyIGRhdGEgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YTtcclxuXHJcbiAgICAgIGlmIChkYXRhLmV2ZW50ID09PSBcImpvaW5cIikge1xyXG4gICAgICAgIHRoaXMub2NjdXBhbnRQcm9taXNlc1tkYXRhLnVzZXJfaWRdID0gdGhpcy5hZGRPY2N1cGFudChkYXRhLnVzZXJfaWQpO1xyXG4gICAgICB9IGVsc2UgaWYgKGRhdGEuZXZlbnQgJiYgZGF0YS5ldmVudCA9PT0gXCJsZWF2ZVwiKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmVPY2N1cGFudChkYXRhLnVzZXJfaWQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBhZGRPY2N1cGFudChvY2N1cGFudElkKSB7XHJcbiAgICB2YXIgc3Vic2NyaWJlciA9IGF3YWl0IHRoaXMuY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKTtcclxuICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgbmV3IG9jY3VwYW50LlxyXG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkKG9jY3VwYW50SWQpO1xyXG4gICAgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0gPSB0cnVlO1xyXG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xyXG4gICAgcmV0dXJuIHN1YnNjcmliZXI7XHJcbiAgfVxyXG5cclxuICByZW1vdmVPY2N1cGFudChvY2N1cGFudElkKSB7XHJcbiAgICBpZiAodGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0pIHtcclxuICAgICAgZGVsZXRlIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdO1xyXG4gICAgICAvLyBDYWxsIHRoZSBOZXR3b3JrZWQgQUZyYW1lIGNhbGxiYWNrcyBmb3IgdGhlIHJlbW92ZWQgb2NjdXBhbnQuXHJcbiAgICAgIHRoaXMub25PY2N1cGFudERpc2Nvbm5lY3RlZChvY2N1cGFudElkKTtcclxuICAgICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgY3JlYXRlUHVibGlzaGVyKCkge1xyXG4gICAgdmFyIGhhbmRsZSA9IG5ldyBtai5KYW51c1BsdWdpbkhhbmRsZSh0aGlzLnNlc3Npb24pO1xyXG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XHJcblxyXG4gICAgdmFyIHBlZXJDb25uZWN0aW9uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKFBFRVJfQ09OTkVDVElPTl9DT05GSUcpO1xyXG5cclxuICAgIHBlZXJDb25uZWN0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJpY2VjYW5kaWRhdGVcIiwgZXZlbnQgPT4ge1xyXG4gICAgICBoYW5kbGUuc2VuZFRyaWNrbGUoZXZlbnQuY2FuZGlkYXRlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhbiB1bnJlbGlhYmxlIGRhdGFjaGFubmVsIGZvciBzZW5kaW5nIGFuZCByZWNlaXZpbmcgY29tcG9uZW50IHVwZGF0ZXMsIGV0Yy5cclxuICAgIHZhciB1bnJlbGlhYmxlQ2hhbm5lbCA9IHBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwidW5yZWxpYWJsZVwiLCB7XHJcbiAgICAgIG9yZGVyZWQ6IGZhbHNlLFxyXG4gICAgICBtYXhSZXRyYW5zbWl0czogMFxyXG4gICAgfSk7XHJcbiAgICB1bnJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSByZWxpYWJsZSBkYXRhY2hhbm5lbCBmb3Igc2VuZGluZyBhbmQgcmVjaWV2aW5nIGVudGl0eSBpbnN0YW50aWF0aW9ucywgZXRjLlxyXG4gICAgdmFyIHJlbGlhYmxlQ2hhbm5lbCA9IHBlZXJDb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKFwicmVsaWFibGVcIiwge1xyXG4gICAgICBvcmRlcmVkOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIHJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcclxuXHJcbiAgICB2YXIgbWVkaWFTdHJlYW0gPSBhd2FpdCBnZXRNaWNyb3Bob25lKCk7XHJcblxyXG4gICAgaWYgKG1lZGlhU3RyZWFtKSB7XHJcbiAgICAgIHBlZXJDb25uZWN0aW9uLmFkZFN0cmVhbShtZWRpYVN0cmVhbSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG9mZmVyID0gYXdhaXQgcGVlckNvbm5lY3Rpb24uY3JlYXRlT2ZmZXIoKTtcclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xyXG5cclxuICAgIHZhciBhbnN3ZXIgPSBhd2FpdCBoYW5kbGUuc2VuZEpzZXAob2ZmZXIpO1xyXG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0UmVtb3RlRGVzY3JpcHRpb24oYW5zd2VyLmpzZXApO1xyXG5cclxuICAgIC8vIFdhaXQgZm9yIHRoZSByZWxpYWJsZSBkYXRhY2hhbm5lbCB0byBiZSBvcGVuIGJlZm9yZSB3ZSBzdGFydCBzZW5kaW5nIG1lc3NhZ2VzIG9uIGl0LlxyXG4gICAgYXdhaXQgd2FpdEZvckV2ZW50KHJlbGlhYmxlQ2hhbm5lbCwgXCJvcGVuXCIpO1xyXG5cclxuICAgIC8vIFNlbmQgam9pbiBtZXNzYWdlIHRvIGphbnVzLiBMaXN0ZW4gZm9yIGpvaW4vbGVhdmUgbWVzc2FnZXMuIEF1dG9tYXRpY2FsbHkgc3Vic2NyaWJlIHRvIGFsbCB1c2VycycgV2ViUlRDIGRhdGEuXHJcbiAgICB2YXIgbWVzc2FnZSA9IGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCB0cnVlKTtcclxuXHJcbiAgICB2YXIgaW5pdGlhbE9jY3VwYW50cyA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhLnJlc3BvbnNlLnVzZXJfaWRzO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhhbmRsZSxcclxuICAgICAgaW5pdGlhbE9jY3VwYW50cyxcclxuICAgICAgcmVsaWFibGVDaGFubmVsLFxyXG4gICAgICB1bnJlbGlhYmxlQ2hhbm5lbCxcclxuICAgICAgbWVkaWFTdHJlYW0sXHJcbiAgICAgIHBlZXJDb25uZWN0aW9uXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKSB7XHJcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XHJcbiAgICBhd2FpdCBoYW5kbGUuYXR0YWNoKFwiamFudXMucGx1Z2luLnNmdVwiKTtcclxuXHJcbiAgICB2YXIgcGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XHJcblxyXG4gICAgcGVlckNvbm5lY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcihcImljZWNhbmRpZGF0ZVwiLCBldmVudCA9PiB7XHJcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldmVudC5jYW5kaWRhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIG9mZmVyID0gYXdhaXQgcGVlckNvbm5lY3Rpb24uY3JlYXRlT2ZmZXIoe1xyXG4gICAgICBvZmZlclRvUmVjZWl2ZUF1ZGlvOiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcclxuICAgIHZhciBhbnN3ZXIgPSBhd2FpdCBoYW5kbGUuc2VuZEpzZXAob2ZmZXIpO1xyXG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0UmVtb3RlRGVzY3JpcHRpb24oYW5zd2VyLmpzZXApO1xyXG5cclxuICAgIC8vIFNlbmQgam9pbiBtZXNzYWdlIHRvIGphbnVzLiBEb24ndCBsaXN0ZW4gZm9yIGpvaW4vbGVhdmUgbWVzc2FnZXMuIFN1YnNjcmliZSB0byB0aGUgb2NjdXBhbnQncyBhdWRpbyBzdHJlYW0uXHJcbiAgICBhd2FpdCB0aGlzLnNlbmRKb2luKGhhbmRsZSwgdGhpcy5yb29tLCB0aGlzLnVzZXJJZCwgZmFsc2UsIFtcclxuICAgICAge1xyXG4gICAgICAgIHB1Ymxpc2hlcl9pZDogb2NjdXBhbnRJZCxcclxuICAgICAgICBjb250ZW50X2tpbmQ6IENvbnRlbnRLaW5kLkF1ZGlvXHJcbiAgICAgIH1cclxuICAgIF0pO1xyXG5cclxuICAgIC8vIEdldCB0aGUgb2NjdXBhbnQncyBhdWRpbyBzdHJlYW0uXHJcbiAgICB2YXIgc3RyZWFtcyA9IHBlZXJDb25uZWN0aW9uLmdldFJlbW90ZVN0cmVhbXMoKTtcclxuICAgIHZhciBtZWRpYVN0cmVhbSA9IHN0cmVhbXMubGVuZ3RoID4gMCA/IHN0cmVhbXNbMF0gOiBudWxsO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhhbmRsZSxcclxuICAgICAgbWVkaWFTdHJlYW0sXHJcbiAgICAgIHBlZXJDb25uZWN0aW9uXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgc2VuZEpvaW4oaGFuZGxlLCByb29tSWQsIHVzZXJJZCwgbm90aWZ5LCBzcGVjcykge1xyXG4gICAgcmV0dXJuIGhhbmRsZS5zZW5kTWVzc2FnZSh7XHJcbiAgICAgIGtpbmQ6IFwiam9pblwiLFxyXG4gICAgICByb29tX2lkOiByb29tSWQsXHJcbiAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcclxuICAgICAgbm90aWZ5LFxyXG4gICAgICBzdWJzY3JpcHRpb25fc3BlY3M6IHNwZWNzXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG9uRGF0YUNoYW5uZWxNZXNzYWdlKGV2ZW50KSB7XHJcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuZGF0YVR5cGUpIHtcclxuICAgICAgdGhpcy5vbk9jY3VwYW50TWVzc2FnZShudWxsLCBtZXNzYWdlLmRhdGFUeXBlLCBtZXNzYWdlLmRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2hvdWxkU3RhcnRDb25uZWN0aW9uVG8oY2xpZW50SWQpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7fVxyXG5cclxuICBjbG9zZVN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHt9XHJcblxyXG4gIGdldENvbm5lY3RTdGF0dXMoY2xpZW50SWQpIHtcclxuICAgIGlmICh0aGlzLm9jY3VwYW50c1tjbGllbnRJZF0pIHtcclxuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkge1xyXG4gICAgdmFyIG9jY3VwYW50UHJvbWlzZSA9IHRoaXMub2NjdXBhbnRQcm9taXNlc1tjbGllbnRJZF07XHJcblxyXG4gICAgaWYgKCFvY2N1cGFudFByb21pc2UpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdWJzY3JpYmVyIGZvciBjbGllbnQ6ICR7Y2xpZW50SWR9IGRvZXMgbm90IGV4aXN0LmApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvY2N1cGFudFByb21pc2UudGhlbihzID0+IHMubWVkaWFTdHJlYW0pO1xyXG4gIH1cclxuXHJcbiAgZW5hYmxlTWljcm9waG9uZShlbmFibGVkKSB7XHJcbiAgICBpZiAodGhpcy5wdWJsaXNoZXIgJiYgdGhpcy5wdWJsaXNoZXIubWVkaWFTdHJlYW0pIHtcclxuICAgICAgdmFyIGF1ZGlvVHJhY2tzID0gdGhpcy5wdWJsaXNoZXIubWVkaWFTdHJlYW0uZ2V0QXVkaW9UcmFja3MoKTtcclxuXHJcbiAgICAgIGlmIChhdWRpb1RyYWNrcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgYXVkaW9UcmFja3NbMF0uZW5hYmxlZCA9IGVuYWJsZWQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChcclxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YUd1YXJhbnRlZWQoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChcclxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBicm9hZGNhc3REYXRhKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci51bnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xyXG4gIH1cclxuXHJcbiAgYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQoZGF0YVR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xyXG4gIH1cclxufVxyXG5cclxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwiamFudXNcIiwgSmFudXNBZGFwdGVyKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSmFudXNBZGFwdGVyO1xyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvaW5kZXguanMiLCIvKiogV2hldGhlciB0byBsb2cgaW5mb3JtYXRpb24gYWJvdXQgaW5jb21pbmcgYW5kIG91dGdvaW5nIEphbnVzIHNpZ25hbHMuICoqL1xudmFyIHZlcmJvc2UgPSBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgaGFuZGxlIHRvIGEgc2luZ2xlIEphbnVzIHBsdWdpbiBvbiBhIEphbnVzIHNlc3Npb24uIEVhY2ggV2ViUlRDIGNvbm5lY3Rpb24gdG8gdGhlIEphbnVzIHNlcnZlciB3aWxsIGJlXG4gKiBhc3NvY2lhdGVkIHdpdGggYSBzaW5nbGUgaGFuZGxlLiBPbmNlIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIHRoaXMgaGFuZGxlIHdpbGwgYmUgZ2l2ZW4gYSB1bmlxdWUgSUQgd2hpY2ggc2hvdWxkIGJlXG4gKiB1c2VkIHRvIGFzc29jaWF0ZSBpdCB3aXRoIGZ1dHVyZSBzaWduYWxsaW5nIG1lc3NhZ2VzLlxuICpcbiAqIFNlZSBodHRwczovL2phbnVzLmNvbmYubWVldGVjaG8uY29tL2RvY3MvcmVzdC5odG1sI2hhbmRsZXMuXG4gKiovXG5mdW5jdGlvbiBKYW51c1BsdWdpbkhhbmRsZShzZXNzaW9uKSB7XG4gIHRoaXMuc2Vzc2lvbiA9IHNlc3Npb247XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG59XG5cbi8qKiBBdHRhY2hlcyB0aGlzIGhhbmRsZSB0byB0aGUgSmFudXMgc2VydmVyIGFuZCBzZXRzIGl0cyBJRC4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24ocGx1Z2luKSB7XG4gIHZhciBwYXlsb2FkID0geyBqYW51czogXCJhdHRhY2hcIiwgcGx1Z2luOiBwbHVnaW4sIFwiZm9yY2UtYnVuZGxlXCI6IHRydWUsIFwiZm9yY2UtcnRjcC1tdXhcIjogdHJ1ZSB9O1xuICByZXR1cm4gdGhpcy5zZXNzaW9uLnNlbmQocGF5bG9hZCkudGhlbihyZXNwID0+IHtcbiAgICB0aGlzLmlkID0gcmVzcC5kYXRhLmlkO1xuICAgIHJldHVybiByZXNwO1xuICB9KTtcbn07XG5cbi8qKiBEZXRhY2hlcyB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuZGV0YWNoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJkZXRhY2hcIiB9KTtcbn07XG5cbi8qKlxuICogU2VuZHMgYSBzaWduYWwgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiBTaWduYWxzIHNob3VsZCBiZSBKU09OLXNlcmlhbGl6YWJsZSBvYmplY3RzLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGxcbiAqIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIHdoZW4gYSByZXNwb25zZSB0byB0aGlzIHNpZ25hbCBpcyByZWNlaXZlZCwgb3Igd2hlbiBubyByZXNwb25zZSBpcyByZWNlaXZlZCB3aXRoaW4gdGhlXG4gKiBzZXNzaW9uIHRpbWVvdXQuXG4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICByZXR1cm4gdGhpcy5zZXNzaW9uLnNlbmQoT2JqZWN0LmFzc2lnbih7IGhhbmRsZV9pZDogdGhpcy5pZCB9LCBzaWduYWwpKTtcbn07XG5cbi8qKiBTZW5kcyBhIHBsdWdpbi1zcGVjaWZpYyBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihib2R5KSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJtZXNzYWdlXCIsIGJvZHk6IGJvZHkgfSk7XG59O1xuXG4vKiogU2VuZHMgYSBKU0VQIG9mZmVyIG9yIGFuc3dlciBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRKc2VwID0gZnVuY3Rpb24oanNlcCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiB7fSwganNlcDoganNlcCB9KTtcbn07XG5cbi8qKiBTZW5kcyBhbiBJQ0UgdHJpY2tsZSBjYW5kaWRhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kVHJpY2tsZSA9IGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwidHJpY2tsZVwiLCAgY2FuZGlkYXRlOiBjYW5kaWRhdGUgfSk7XG59O1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBKYW51cyBzZXNzaW9uIC0tIGEgSmFudXMgY29udGV4dCBmcm9tIHdpdGhpbiB3aGljaCB5b3UgY2FuIG9wZW4gbXVsdGlwbGUgaGFuZGxlcyBhbmQgY29ubmVjdGlvbnMuIE9uY2VcbiAqIGNyZWF0ZWQsIHRoaXMgc2Vzc2lvbiB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZSB1c2VkIHRvIGFzc29jaWF0ZSBpdCB3aXRoIGZ1dHVyZSBzaWduYWxsaW5nIG1lc3NhZ2VzLlxuICpcbiAqIFNlZSBodHRwczovL2phbnVzLmNvbmYubWVldGVjaG8uY29tL2RvY3MvcmVzdC5odG1sI3Nlc3Npb25zLlxuICoqL1xuZnVuY3Rpb24gSmFudXNTZXNzaW9uKG91dHB1dCwgb3B0aW9ucykge1xuICB0aGlzLm91dHB1dCA9IG91dHB1dDtcbiAgdGhpcy5pZCA9IHVuZGVmaW5lZDtcbiAgdGhpcy5uZXh0VHhJZCA9IDA7XG4gIHRoaXMudHhucyA9IHt9O1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHtcbiAgICB0aW1lb3V0TXM6IDEwMDAwLFxuICAgIGtlZXBhbGl2ZU1zOiAzMDAwMFxuICB9O1xufVxuXG4vKiogQ3JlYXRlcyB0aGlzIHNlc3Npb24gb24gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImNyZWF0ZVwiIH0pLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGVzdHJveXMgdGhpcyBzZXNzaW9uLiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGVzdHJveVwiIH0pO1xufTtcblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgcmVjZWl2aW5nIEpTT04gc2lnbmFsbGluZyBtZXNzYWdlcyBwZXJ0aW5lbnQgdG8gdGhpcyBzZXNzaW9uLiBJZiB0aGUgc2lnbmFscyBhcmUgcmVzcG9uc2VzIHRvIHByZXZpb3VzbHlcbiAqIHNlbnQgc2lnbmFscywgdGhlIHByb21pc2VzIGZvciB0aGUgb3V0Z29pbmcgc2lnbmFscyB3aWxsIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIGFwcHJvcHJpYXRlbHkgd2l0aCB0aGlzIHNpZ25hbCBhcyBhblxuICogYXJndW1lbnQuXG4gKlxuICogRXh0ZXJuYWwgY2FsbGVycyBzaG91bGQgY2FsbCB0aGlzIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgYSBuZXcgc2lnbmFsIGFycml2ZXMgb24gdGhlIHRyYW5zcG9ydDsgZm9yIGV4YW1wbGUsIGluIGFcbiAqIFdlYlNvY2tldCdzIGBtZXNzYWdlYCBldmVudCwgb3Igd2hlbiBhIG5ldyBkYXR1bSBzaG93cyB1cCBpbiBhbiBIVFRQIGxvbmctcG9sbGluZyByZXNwb25zZS5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUucmVjZWl2ZSA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAobW9kdWxlLmV4cG9ydHMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJJbmNvbWluZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIGlmIChzaWduYWwudHJhbnNhY3Rpb24gIT0gbnVsbCkge1xuICAgIHZhciBoYW5kbGVycyA9IHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgIGlmIChzaWduYWwuamFudXMgPT09IFwiYWNrXCIgJiYgc2lnbmFsLmhpbnQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYW4gYWNrIG9mIGFuIGFzeW5jaHJvbm91c2x5LXByb2Nlc3NlZCByZXF1ZXN0LCB3ZSBzaG91bGQgd2FpdFxuICAgICAgLy8gdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB1bnRpbCB0aGUgYWN0dWFsIHJlc3BvbnNlIGNvbWVzIGluXG4gICAgfSBlbHNlIGlmIChoYW5kbGVycyAhPSBudWxsKSB7XG4gICAgICBpZiAoaGFuZGxlcnMudGltZW91dCAhPSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChoYW5kbGVycy50aW1lb3V0KTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgIChzaWduYWwuamFudXMgPT09IFwiZXJyb3JcIiA/IGhhbmRsZXJzLnJlamVjdCA6IGhhbmRsZXJzLnJlc29sdmUpKHNpZ25hbCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb24uIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAobW9kdWxlLmV4cG9ydHMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJPdXRnb2luZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIHNpZ25hbCA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHNlc3Npb25faWQ6IHRoaXMuaWQsXG4gICAgdHJhbnNhY3Rpb246ICh0aGlzLm5leHRUeElkKyspLnRvU3RyaW5nKClcbiAgfSwgc2lnbmFsKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lb3V0TXMpIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZGVsZXRlIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKFwiU2lnbmFsbGluZyBtZXNzYWdlIHRpbWVkIG91dC5cIikpO1xuICAgICAgfSwgdGhpcy5vcHRpb25zLnRpbWVvdXRNcyk7XG4gICAgfVxuICAgIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dID0geyByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCwgdGltZW91dDogdGltZW91dCB9O1xuICAgIHRoaXMub3V0cHV0KEpTT04uc3RyaW5naWZ5KHNpZ25hbCkpO1xuICAgIHRoaXMuX3Jlc2V0S2VlcGFsaXZlKCk7XG4gIH0pO1xufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fcmVzZXRLZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMua2VlcGFsaXZlVGltZW91dCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmtlZXBhbGl2ZVRpbWVvdXQpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMua2VlcGFsaXZlTXMpIHtcbiAgICB0aGlzLmtlZXBhbGl2ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2tlZXBhbGl2ZSgpLCB0aGlzLm9wdGlvbnMua2VlcGFsaXZlTXMpO1xuICB9XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9rZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImtlZXBhbGl2ZVwiIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEphbnVzUGx1Z2luSGFuZGxlLFxuICBKYW51c1Nlc3Npb24sXG4gIHZlcmJvc2Vcbn07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCJdLCJzb3VyY2VSb290IjoiIn0=