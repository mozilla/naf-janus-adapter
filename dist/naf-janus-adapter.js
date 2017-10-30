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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgY2ZiYzIwZDEyOWYxN2JkMWE3MTIiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsImF1ZGlvIiwiZSIsIm5hbWUiLCJjb25zb2xlIiwid2FybiIsImVycm9yIiwiZ2V0TWljcm9waG9uZSIsIm1qIiwicmVxdWlyZSIsIkNvbnRlbnRLaW5kIiwiQXVkaW8iLCJWaWRlbyIsIkRhdGEiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIndhaXRGb3JFdmVudCIsInRhcmdldCIsImV2ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRFdmVudExpc3RlbmVyIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJsIiwiSmFudXNBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyb29tIiwidXNlcklkIiwic2VydmVyVXJsIiwid3MiLCJzZXNzaW9uIiwicHVibGlzaGVyIiwib2NjdXBhbnRzIiwib2NjdXBhbnRQcm9taXNlcyIsIm9uV2Vic29ja2V0TWVzc2FnZSIsImJpbmQiLCJvbkRhdGFDaGFubmVsTWVzc2FnZSIsInNldFNlcnZlclVybCIsInNldEFwcCIsImFwcCIsInNldFJvb20iLCJyb29tTmFtZSIsInBhcnNlSW50IiwiRXJyb3IiLCJzZXRXZWJSdGNPcHRpb25zIiwib3B0aW9ucyIsInNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMiLCJzdWNjZXNzTGlzdGVuZXIiLCJmYWlsdXJlTGlzdGVuZXIiLCJjb25uZWN0U3VjY2VzcyIsImNvbm5lY3RGYWlsdXJlIiwic2V0Um9vbU9jY3VwYW50TGlzdGVuZXIiLCJvY2N1cGFudExpc3RlbmVyIiwib25PY2N1cGFudHNDaGFuZ2VkIiwic2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMiLCJvcGVuTGlzdGVuZXIiLCJjbG9zZWRMaXN0ZW5lciIsIm1lc3NhZ2VMaXN0ZW5lciIsIm9uT2NjdXBhbnRDb25uZWN0ZWQiLCJvbk9jY3VwYW50RGlzY29ubmVjdGVkIiwib25PY2N1cGFudE1lc3NhZ2UiLCJjb25uZWN0IiwiV2ViU29ja2V0IiwiSmFudXNTZXNzaW9uIiwic2VuZCIsIl8iLCJvbldlYnNvY2tldE9wZW4iLCJjcmVhdGUiLCJwdWJsaXNoZXJQcm9taXNlIiwiY3JlYXRlUHVibGlzaGVyIiwib2NjdXBhbnRJZCIsImluaXRpYWxPY2N1cGFudHMiLCJhZGRPY2N1cGFudCIsIm1lc3NhZ2UiLCJKU09OIiwicGFyc2UiLCJkYXRhIiwicmVjZWl2ZSIsInBsdWdpbmRhdGEiLCJ1c2VyX2lkIiwicmVtb3ZlT2NjdXBhbnQiLCJzdWJzY3JpYmVyIiwiY3JlYXRlU3Vic2NyaWJlciIsImhhbmRsZSIsIkphbnVzUGx1Z2luSGFuZGxlIiwiYXR0YWNoIiwicGVlckNvbm5lY3Rpb24iLCJSVENQZWVyQ29ubmVjdGlvbiIsInNlbmRUcmlja2xlIiwiY2FuZGlkYXRlIiwidW5yZWxpYWJsZUNoYW5uZWwiLCJjcmVhdGVEYXRhQ2hhbm5lbCIsIm9yZGVyZWQiLCJtYXhSZXRyYW5zbWl0cyIsInJlbGlhYmxlQ2hhbm5lbCIsIm1lZGlhU3RyZWFtIiwiYWRkU3RyZWFtIiwib2ZmZXIiLCJjcmVhdGVPZmZlciIsInNldExvY2FsRGVzY3JpcHRpb24iLCJhbnN3ZXIiLCJzZW5kSnNlcCIsInNldFJlbW90ZURlc2NyaXB0aW9uIiwianNlcCIsInNlbmRKb2luIiwicmVzcG9uc2UiLCJ1c2VyX2lkcyIsIm9mZmVyVG9SZWNlaXZlQXVkaW8iLCJwdWJsaXNoZXJfaWQiLCJjb250ZW50X2tpbmQiLCJzdHJlYW1zIiwiZ2V0UmVtb3RlU3RyZWFtcyIsImxlbmd0aCIsInJvb21JZCIsIm5vdGlmeSIsInNwZWNzIiwic2VuZE1lc3NhZ2UiLCJraW5kIiwicm9vbV9pZCIsInN1YnNjcmlwdGlvbl9zcGVjcyIsImRhdGFUeXBlIiwic2hvdWxkU3RhcnRDb25uZWN0aW9uVG8iLCJjbGllbnRJZCIsInN0YXJ0U3RyZWFtQ29ubmVjdGlvbiIsImNsb3NlU3RyZWFtQ29ubmVjdGlvbiIsImdldENvbm5lY3RTdGF0dXMiLCJOQUYiLCJhZGFwdGVycyIsIklTX0NPTk5FQ1RFRCIsIk5PVF9DT05ORUNURUQiLCJnZXRNZWRpYVN0cmVhbSIsIm9jY3VwYW50UHJvbWlzZSIsInRoZW4iLCJzIiwiZW5hYmxlTWljcm9waG9uZSIsImVuYWJsZWQiLCJtaWNyb3Bob25lU3RyZWFtIiwiYXVkaW9UcmFja3MiLCJnZXRBdWRpb1RyYWNrcyIsInNlbmREYXRhIiwic3RyaW5naWZ5Iiwic2VuZERhdGFHdWFyYW50ZWVkIiwiYnJvYWRjYXN0RGF0YSIsImJyb2FkY2FzdERhdGFHdWFyYW50ZWVkIiwicmVnaXN0ZXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7OytCQzNDQSxhQUErQjtBQUM3QixRQUFJO0FBQ0YsYUFBTyxNQUFNQSxVQUFVQyxZQUFWLENBQXVCQyxZQUF2QixDQUFvQztBQUMvQ0MsZUFBTztBQUR3QyxPQUFwQyxDQUFiO0FBR0QsS0FKRCxDQUlFLE9BQU9DLENBQVAsRUFBVTtBQUNWLFVBQUlBLEVBQUVDLElBQUYsS0FBVyxpQkFBZixFQUFrQztBQUNoQ0MsZ0JBQVFDLElBQVIsQ0FBYSxnQ0FBYjtBQUNELE9BRkQsTUFFTztBQUNMRCxnQkFBUUUsS0FBUixDQUFjSixDQUFkO0FBQ0Q7QUFDRjtBQUNGLEc7O2tCQVpjSyxhOzs7Ozs7O0FBbEJmLElBQUlDLEtBQUssbUJBQUFDLENBQVEsQ0FBUixDQUFUOztBQUVBLE1BQU1DLGNBQWM7QUFDbEJDLFNBQU8sQ0FEVztBQUVsQkMsU0FBTyxDQUZXO0FBR2xCQyxRQUFNO0FBSFksQ0FBcEI7O0FBTUEsU0FBU0MsVUFBVCxHQUFzQjtBQUNwQixTQUFPQyxLQUFLQyxLQUFMLENBQVdELEtBQUtFLE1BQUwsS0FBZ0JDLE9BQU9DLGdCQUFsQyxDQUFQO0FBQ0Q7O0FBRUQsU0FBU0MsWUFBVCxDQUFzQkMsTUFBdEIsRUFBOEJDLEtBQTlCLEVBQXFDO0FBQ25DLFNBQU8sSUFBSUMsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUN0Q0osV0FBT0ssZ0JBQVAsQ0FBd0JKLEtBQXhCLEVBQStCcEIsS0FBS3NCLFFBQVF0QixDQUFSLENBQXBDLEVBQWdELEVBQUV5QixNQUFNLElBQVIsRUFBaEQ7QUFDRCxHQUZNLENBQVA7QUFHRDs7QUFnQkQsTUFBTUMseUJBQXlCO0FBQzdCQyxjQUFZLENBQ1YsRUFBRUMsS0FBSywrQkFBUCxFQURVLEVBRVYsRUFBRUEsS0FBSywrQkFBUCxFQUZVO0FBRGlCLENBQS9COztBQU9BLE1BQU1DLFlBQU4sQ0FBbUI7QUFDakJDLGdCQUFjO0FBQ1osU0FBS0MsSUFBTCxHQUFZLElBQVo7QUFDQSxTQUFLQyxNQUFMLEdBQWNwQixZQUFkOztBQUVBLFNBQUtxQixTQUFMLEdBQWlCLElBQWpCO0FBQ0EsU0FBS0MsRUFBTCxHQUFVLElBQVY7QUFDQSxTQUFLQyxPQUFMLEdBQWUsSUFBZjs7QUFFQSxTQUFLQyxTQUFMLEdBQWlCLElBQWpCO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFNBQUtDLGdCQUFMLEdBQXdCLEVBQXhCOztBQUVBLFNBQUtDLGtCQUFMLEdBQTBCLEtBQUtBLGtCQUFMLENBQXdCQyxJQUF4QixDQUE2QixJQUE3QixDQUExQjtBQUNBLFNBQUtDLG9CQUFMLEdBQTRCLEtBQUtBLG9CQUFMLENBQTBCRCxJQUExQixDQUErQixJQUEvQixDQUE1QjtBQUNEOztBQUVERSxlQUFhZCxHQUFiLEVBQWtCO0FBQ2hCLFNBQUtLLFNBQUwsR0FBaUJMLEdBQWpCO0FBQ0Q7O0FBRURlLFNBQU9DLEdBQVAsRUFBWSxDQUFFOztBQUVkQyxVQUFRQyxRQUFSLEVBQWtCO0FBQ2hCLFFBQUk7QUFDRixXQUFLZixJQUFMLEdBQVlnQixTQUFTRCxRQUFULENBQVo7QUFDRCxLQUZELENBRUUsT0FBTzlDLENBQVAsRUFBVTtBQUNWLFlBQU0sSUFBSWdELEtBQUosQ0FBVSxrQ0FBVixDQUFOO0FBQ0Q7QUFDRjs7QUFFREMsbUJBQWlCQyxPQUFqQixFQUEwQixDQUFFOztBQUU1QkMsNEJBQTBCQyxlQUExQixFQUEyQ0MsZUFBM0MsRUFBNEQ7QUFDMUQsU0FBS0MsY0FBTCxHQUFzQkYsZUFBdEI7QUFDQSxTQUFLRyxjQUFMLEdBQXNCRixlQUF0QjtBQUNEOztBQUVERywwQkFBd0JDLGdCQUF4QixFQUEwQztBQUN4QyxTQUFLQyxrQkFBTCxHQUEwQkQsZ0JBQTFCO0FBQ0Q7O0FBRURFLDBCQUF3QkMsWUFBeEIsRUFBc0NDLGNBQXRDLEVBQXNEQyxlQUF0RCxFQUF1RTtBQUNyRSxTQUFLQyxtQkFBTCxHQUEyQkgsWUFBM0I7QUFDQSxTQUFLSSxzQkFBTCxHQUE4QkgsY0FBOUI7QUFDQSxTQUFLSSxpQkFBTCxHQUF5QkgsZUFBekI7QUFDRDs7QUFFREksWUFBVTtBQUNSLFNBQUtoQyxFQUFMLEdBQVUsSUFBSWlDLFNBQUosQ0FBYyxLQUFLbEMsU0FBbkIsRUFBOEIsZ0JBQTlCLENBQVY7QUFDQSxTQUFLRSxPQUFMLEdBQWUsSUFBSTdCLEdBQUc4RCxZQUFQLENBQW9CLEtBQUtsQyxFQUFMLENBQVFtQyxJQUFSLENBQWE3QixJQUFiLENBQWtCLEtBQUtOLEVBQXZCLENBQXBCLENBQWY7QUFDQSxTQUFLQSxFQUFMLENBQVFWLGdCQUFSLENBQXlCLE1BQXpCLEVBQWlDOEMsS0FBSyxLQUFLQyxlQUFMLEVBQXRDO0FBQ0EsU0FBS3JDLEVBQUwsQ0FBUVYsZ0JBQVIsQ0FBeUIsU0FBekIsRUFBb0MsS0FBS2Usa0JBQXpDO0FBQ0Q7O0FBRUtnQyxpQkFBTixHQUF3QjtBQUFBOztBQUFBO0FBQ3RCO0FBQ0EsWUFBTSxNQUFLcEMsT0FBTCxDQUFhcUMsTUFBYixFQUFOOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQUlDLG1CQUFtQixNQUFLQyxlQUFMLEVBQXZCO0FBQ0EsWUFBS3BDLGdCQUFMLENBQXNCLE1BQUtOLE1BQTNCLElBQXFDeUMsZ0JBQXJDO0FBQ0EsWUFBS3JDLFNBQUwsR0FBaUIsTUFBTXFDLGdCQUF2Qjs7QUFFQSxZQUFLbkIsY0FBTCxDQUFvQixNQUFLdEIsTUFBekI7O0FBRUE7QUFDQSxXQUFLLElBQUkyQyxVQUFULElBQXVCLE1BQUt2QyxTQUFMLENBQWV3QyxnQkFBdEMsRUFBd0Q7QUFDdEQsWUFBSUQsZUFBZSxNQUFLM0MsTUFBeEIsRUFBZ0M7QUFDOUIsZ0JBQUtNLGdCQUFMLENBQXNCcUMsVUFBdEIsSUFBb0MsTUFBS0UsV0FBTCxDQUFpQkYsVUFBakIsQ0FBcEM7QUFDRDtBQUNGO0FBbEJxQjtBQW1CdkI7O0FBRURwQyxxQkFBbUJuQixLQUFuQixFQUEwQjtBQUN4QixRQUFJMEQsVUFBVUMsS0FBS0MsS0FBTCxDQUFXNUQsTUFBTTZELElBQWpCLENBQWQ7QUFDQSxTQUFLOUMsT0FBTCxDQUFhK0MsT0FBYixDQUFxQkosT0FBckI7O0FBRUE7QUFDQSxRQUFJQSxRQUFRSyxVQUFSLElBQXNCTCxRQUFRSyxVQUFSLENBQW1CRixJQUE3QyxFQUFtRDtBQUNqRCxVQUFJQSxPQUFPSCxRQUFRSyxVQUFSLENBQW1CRixJQUE5Qjs7QUFFQSxVQUFJQSxLQUFLN0QsS0FBTCxLQUFlLE1BQW5CLEVBQTJCO0FBQ3pCLGFBQUtrQixnQkFBTCxDQUFzQjJDLEtBQUtHLE9BQTNCLElBQXNDLEtBQUtQLFdBQUwsQ0FBaUJJLEtBQUtHLE9BQXRCLENBQXRDO0FBQ0QsT0FGRCxNQUVPLElBQUlILEtBQUs3RCxLQUFMLElBQWM2RCxLQUFLN0QsS0FBTCxLQUFlLE9BQWpDLEVBQTBDO0FBQy9DLGFBQUtpRSxjQUFMLENBQW9CSixLQUFLRyxPQUF6QjtBQUNEO0FBQ0Y7QUFDRjs7QUFFS1AsYUFBTixDQUFrQkYsVUFBbEIsRUFBOEI7QUFBQTs7QUFBQTtBQUM1QixVQUFJVyxhQUFhLE1BQU0sT0FBS0MsZ0JBQUwsQ0FBc0JaLFVBQXRCLENBQXZCO0FBQ0E7QUFDQSxhQUFLWixtQkFBTCxDQUF5QlksVUFBekI7QUFDQSxhQUFLdEMsU0FBTCxDQUFlc0MsVUFBZixJQUE2QixJQUE3QjtBQUNBLGFBQUtqQixrQkFBTCxDQUF3QixPQUFLckIsU0FBN0I7QUFDQSxhQUFPaUQsVUFBUDtBQU40QjtBQU83Qjs7QUFFREQsaUJBQWVWLFVBQWYsRUFBMkI7QUFDekIsUUFBSSxLQUFLdEMsU0FBTCxDQUFlc0MsVUFBZixDQUFKLEVBQWdDO0FBQzlCLGFBQU8sS0FBS3RDLFNBQUwsQ0FBZXNDLFVBQWYsQ0FBUDtBQUNBO0FBQ0EsV0FBS1gsc0JBQUwsQ0FBNEJXLFVBQTVCO0FBQ0EsV0FBS2pCLGtCQUFMLENBQXdCLEtBQUtyQixTQUE3QjtBQUNEO0FBQ0Y7O0FBRUtxQyxpQkFBTixHQUF3QjtBQUFBOztBQUFBO0FBQ3RCLFVBQUljLFNBQVMsSUFBSWxGLEdBQUdtRixpQkFBUCxDQUF5QixPQUFLdEQsT0FBOUIsQ0FBYjtBQUNBLFlBQU1xRCxPQUFPRSxNQUFQLENBQWMsa0JBQWQsQ0FBTjs7QUFFQSxVQUFJQyxpQkFBaUIsSUFBSUMsaUJBQUosQ0FBc0JsRSxzQkFBdEIsQ0FBckI7O0FBRUFpRSxxQkFBZW5FLGdCQUFmLENBQWdDLGNBQWhDLEVBQWdELGlCQUFTO0FBQ3ZEZ0UsZUFBT0ssV0FBUCxDQUFtQnpFLE1BQU0wRSxTQUF6QjtBQUNELE9BRkQ7O0FBSUE7QUFDQSxVQUFJQyxvQkFBb0JKLGVBQWVLLGlCQUFmLENBQWlDLFlBQWpDLEVBQStDO0FBQ3JFQyxpQkFBUyxLQUQ0RDtBQUVyRUMsd0JBQWdCO0FBRnFELE9BQS9DLENBQXhCO0FBSUFILHdCQUFrQnZFLGdCQUFsQixDQUFtQyxTQUFuQyxFQUE4QyxPQUFLaUIsb0JBQW5EOztBQUVBO0FBQ0EsVUFBSTBELGtCQUFrQlIsZUFBZUssaUJBQWYsQ0FBaUMsVUFBakMsRUFBNkM7QUFDakVDLGlCQUFTO0FBRHdELE9BQTdDLENBQXRCO0FBR0FFLHNCQUFnQjNFLGdCQUFoQixDQUFpQyxTQUFqQyxFQUE0QyxPQUFLaUIsb0JBQWpEOztBQUVBLFVBQUkyRCxjQUFjLE1BQU0vRixlQUF4Qjs7QUFFQSxVQUFJK0YsV0FBSixFQUFpQjtBQUNmVCx1QkFBZVUsU0FBZixDQUF5QkQsV0FBekI7QUFDRDs7QUFFRCxVQUFJRSxRQUFRLE1BQU1YLGVBQWVZLFdBQWYsRUFBbEI7QUFDQSxZQUFNWixlQUFlYSxtQkFBZixDQUFtQ0YsS0FBbkMsQ0FBTjs7QUFFQSxVQUFJRyxTQUFTLE1BQU1qQixPQUFPa0IsUUFBUCxDQUFnQkosS0FBaEIsQ0FBbkI7QUFDQSxZQUFNWCxlQUFlZ0Isb0JBQWYsQ0FBb0NGLE9BQU9HLElBQTNDLENBQU47O0FBRUE7QUFDQSxZQUFNMUYsYUFBYWlGLGVBQWIsRUFBOEIsTUFBOUIsQ0FBTjs7QUFFQTtBQUNBLFVBQUlyQixVQUFVLE1BQU0sT0FBSytCLFFBQUwsQ0FBY3JCLE1BQWQsRUFBc0IsT0FBS3pELElBQTNCLEVBQWlDLE9BQUtDLE1BQXRDLEVBQThDLElBQTlDLENBQXBCOztBQUVBLFVBQUk0QyxtQkFBbUJFLFFBQVFLLFVBQVIsQ0FBbUJGLElBQW5CLENBQXdCNkIsUUFBeEIsQ0FBaUNDLFFBQXhEOztBQUVBLGFBQU87QUFDTHZCLGNBREs7QUFFTFosd0JBRks7QUFHTHVCLHVCQUhLO0FBSUxKLHlCQUpLO0FBS0xLLG1CQUxLO0FBTUxUO0FBTkssT0FBUDtBQTNDc0I7QUFtRHZCOztBQUVLSixrQkFBTixDQUF1QlosVUFBdkIsRUFBbUM7QUFBQTs7QUFBQTtBQUNqQyxVQUFJYSxTQUFTLElBQUlsRixHQUFHbUYsaUJBQVAsQ0FBeUIsT0FBS3RELE9BQTlCLENBQWI7QUFDQSxZQUFNcUQsT0FBT0UsTUFBUCxDQUFjLGtCQUFkLENBQU47O0FBRUEsVUFBSUMsaUJBQWlCLElBQUlDLGlCQUFKLENBQXNCbEUsc0JBQXRCLENBQXJCOztBQUVBaUUscUJBQWVuRSxnQkFBZixDQUFnQyxjQUFoQyxFQUFnRCxpQkFBUztBQUN2RGdFLGVBQU9LLFdBQVAsQ0FBbUJ6RSxNQUFNMEUsU0FBekI7QUFDRCxPQUZEOztBQUlBLFVBQUlRLFFBQVEsTUFBTVgsZUFBZVksV0FBZixDQUEyQjtBQUMzQ1MsNkJBQXFCO0FBRHNCLE9BQTNCLENBQWxCOztBQUlBLFlBQU1yQixlQUFlYSxtQkFBZixDQUFtQ0YsS0FBbkMsQ0FBTjtBQUNBLFVBQUlHLFNBQVMsTUFBTWpCLE9BQU9rQixRQUFQLENBQWdCSixLQUFoQixDQUFuQjtBQUNBLFlBQU1YLGVBQWVnQixvQkFBZixDQUFvQ0YsT0FBT0csSUFBM0MsQ0FBTjs7QUFFQTtBQUNBLFlBQU0sT0FBS0MsUUFBTCxDQUFjckIsTUFBZCxFQUFzQixPQUFLekQsSUFBM0IsRUFBaUMsT0FBS0MsTUFBdEMsRUFBOEMsS0FBOUMsRUFBcUQsQ0FDekQ7QUFDRWlGLHNCQUFjdEMsVUFEaEI7QUFFRXVDLHNCQUFjMUcsWUFBWUM7QUFGNUIsT0FEeUQsQ0FBckQsQ0FBTjs7QUFPQTtBQUNBLFVBQUkwRyxVQUFVeEIsZUFBZXlCLGdCQUFmLEVBQWQ7QUFDQSxVQUFJaEIsY0FBY2UsUUFBUUUsTUFBUixHQUFpQixDQUFqQixHQUFxQkYsUUFBUSxDQUFSLENBQXJCLEdBQWtDLElBQXBEOztBQUVBLGFBQU87QUFDTDNCLGNBREs7QUFFTFksbUJBRks7QUFHTFQ7QUFISyxPQUFQO0FBOUJpQztBQW1DbEM7O0FBRURrQixXQUFTckIsTUFBVCxFQUFpQjhCLE1BQWpCLEVBQXlCdEYsTUFBekIsRUFBaUN1RixNQUFqQyxFQUF5Q0MsS0FBekMsRUFBZ0Q7QUFDOUMsV0FBT2hDLE9BQU9pQyxXQUFQLENBQW1CO0FBQ3hCQyxZQUFNLE1BRGtCO0FBRXhCQyxlQUFTTCxNQUZlO0FBR3hCbEMsZUFBU3BELE1BSGU7QUFJeEJ1RixZQUp3QjtBQUt4QkssMEJBQW9CSjtBQUxJLEtBQW5CLENBQVA7QUFPRDs7QUFFRC9FLHVCQUFxQnJCLEtBQXJCLEVBQTRCO0FBQzFCLFFBQUkwRCxVQUFVQyxLQUFLQyxLQUFMLENBQVc1RCxNQUFNNkQsSUFBakIsQ0FBZDs7QUFFQSxRQUFJSCxRQUFRK0MsUUFBWixFQUFzQjtBQUNwQixXQUFLNUQsaUJBQUwsQ0FBdUIsSUFBdkIsRUFBNkJhLFFBQVErQyxRQUFyQyxFQUErQy9DLFFBQVFHLElBQXZEO0FBQ0Q7QUFDRjs7QUFFRDZDLDBCQUF3QkMsUUFBeEIsRUFBa0M7QUFDaEMsV0FBTyxJQUFQO0FBQ0Q7O0FBRURDLHdCQUFzQkQsUUFBdEIsRUFBZ0MsQ0FBRTs7QUFFbENFLHdCQUFzQkYsUUFBdEIsRUFBZ0MsQ0FBRTs7QUFFbENHLG1CQUFpQkgsUUFBakIsRUFBMkI7QUFDekIsUUFBSSxLQUFLMUYsU0FBTCxDQUFlMEYsUUFBZixDQUFKLEVBQThCO0FBQzVCLGFBQU9JLElBQUlDLFFBQUosQ0FBYUMsWUFBcEI7QUFDRCxLQUZELE1BRU87QUFDTCxhQUFPRixJQUFJQyxRQUFKLENBQWFFLGFBQXBCO0FBQ0Q7QUFDRjs7QUFFREMsaUJBQWVSLFFBQWYsRUFBeUI7QUFDdkIsUUFBSVMsa0JBQWtCLEtBQUtsRyxnQkFBTCxDQUFzQnlGLFFBQXRCLENBQXRCOztBQUVBLFFBQUksQ0FBQ1MsZUFBTCxFQUFzQjtBQUNwQixZQUFNLElBQUl4RixLQUFKLENBQVcsMEJBQXlCK0UsUUFBUyxrQkFBN0MsQ0FBTjtBQUNEOztBQUVELFdBQU9TLGdCQUFnQkMsSUFBaEIsQ0FBcUJDLEtBQUtBLEVBQUV0QyxXQUE1QixDQUFQO0FBQ0Q7O0FBRUR1QyxtQkFBaUJDLE9BQWpCLEVBQTBCO0FBQ3hCLFFBQUlDLG1CQUFtQixLQUFLdkQsVUFBTCxDQUFnQmMsV0FBdkM7O0FBRUEsUUFBSXlDLGdCQUFKLEVBQXNCO0FBQ3BCLFVBQUlDLGNBQWNELGlCQUFpQkUsY0FBakIsRUFBbEI7O0FBRUEsVUFBSUQsWUFBWXpCLE1BQVosR0FBcUIsQ0FBekIsRUFBNEI7QUFDMUJ5QixvQkFBWSxDQUFaLEVBQWVGLE9BQWYsR0FBeUJBLE9BQXpCO0FBQ0Q7QUFDRjtBQUNGOztBQUVESSxXQUFTakIsUUFBVCxFQUFtQkYsUUFBbkIsRUFBNkI1QyxJQUE3QixFQUFtQztBQUNqQyxTQUFLN0MsU0FBTCxDQUFlMkQsaUJBQWYsQ0FBaUMxQixJQUFqQyxDQUNFVSxLQUFLa0UsU0FBTCxDQUFlLEVBQUVsQixRQUFGLEVBQVlGLFFBQVosRUFBc0I1QyxJQUF0QixFQUFmLENBREY7QUFHRDs7QUFFRGlFLHFCQUFtQm5CLFFBQW5CLEVBQTZCRixRQUE3QixFQUF1QzVDLElBQXZDLEVBQTZDO0FBQzNDLFNBQUs3QyxTQUFMLENBQWUrRCxlQUFmLENBQStCOUIsSUFBL0IsQ0FDRVUsS0FBS2tFLFNBQUwsQ0FBZSxFQUFFbEIsUUFBRixFQUFZRixRQUFaLEVBQXNCNUMsSUFBdEIsRUFBZixDQURGO0FBR0Q7O0FBRURrRSxnQkFBY3RCLFFBQWQsRUFBd0I1QyxJQUF4QixFQUE4QjtBQUM1QixTQUFLN0MsU0FBTCxDQUFlMkQsaUJBQWYsQ0FBaUMxQixJQUFqQyxDQUFzQ1UsS0FBS2tFLFNBQUwsQ0FBZSxFQUFFcEIsUUFBRixFQUFZNUMsSUFBWixFQUFmLENBQXRDO0FBQ0Q7O0FBRURtRSwwQkFBd0J2QixRQUF4QixFQUFrQzVDLElBQWxDLEVBQXdDO0FBQ3RDLFNBQUs3QyxTQUFMLENBQWUrRCxlQUFmLENBQStCOUIsSUFBL0IsQ0FBb0NVLEtBQUtrRSxTQUFMLENBQWUsRUFBRXBCLFFBQUYsRUFBWTVDLElBQVosRUFBZixDQUFwQztBQUNEO0FBbFJnQjs7QUFxUm5Ca0QsSUFBSUMsUUFBSixDQUFhaUIsUUFBYixDQUFzQixPQUF0QixFQUErQnhILFlBQS9COztBQUVBeUgsT0FBT0MsT0FBUCxHQUFpQjFILFlBQWpCLEM7Ozs7OztBQzlUQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBLG9CQUFvQixrQkFBa0I7QUFDdEM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMENBQTBDLHFCQUFxQjtBQUMvRDs7QUFFQTtBQUNBO0FBQ0Esb0JBQW9CLCtCQUErQjtBQUNuRDs7QUFFQTtBQUNBO0FBQ0Esb0JBQW9CLDJCQUEyQixjQUFjO0FBQzdEOztBQUVBO0FBQ0E7QUFDQSxvQkFBb0IsMENBQTBDO0FBQzlEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxvQkFBb0Isa0JBQWtCO0FBQ3RDO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBLG9CQUFvQixtQkFBbUI7QUFDdkM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtGQUErRjtBQUMvRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxvQkFBb0IscUJBQXFCO0FBQ3pDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibmFmLWphbnVzLWFkYXB0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCBjZmJjMjBkMTI5ZjE3YmQxYTcxMiIsInZhciBtaiA9IHJlcXVpcmUoXCJtaW5pamFudXNcIik7XHJcblxyXG5jb25zdCBDb250ZW50S2luZCA9IHtcclxuICBBdWRpbzogMSxcclxuICBWaWRlbzogMixcclxuICBEYXRhOiA0XHJcbn07XHJcblxyXG5mdW5jdGlvbiByYW5kb21VaW50KCkge1xyXG4gIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdhaXRGb3JFdmVudCh0YXJnZXQsIGV2ZW50KSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBlID0+IHJlc29sdmUoZSksIHsgb25jZTogdHJ1ZSB9KTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TWljcm9waG9uZSgpIHtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHtcclxuICAgICAgYXVkaW86IHRydWVcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGlmIChlLm5hbWUgPT09IFwiTm90QWxsb3dlZEVycm9yXCIpIHtcclxuICAgICAgY29uc29sZS53YXJuKFwiTWljcm9waG9uZSBhY2Nlc3Mgbm90IGFsbG93ZWQuXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IFBFRVJfQ09OTkVDVElPTl9DT05GSUcgPSB7XHJcbiAgaWNlU2VydmVyczogW1xyXG4gICAgeyB1cmw6IFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxyXG4gICAgeyB1cmw6IFwic3R1bjpzdHVuMi5sLmdvb2dsZS5jb206MTkzMDJcIiB9XHJcbiAgXVxyXG59O1xyXG5cclxuY2xhc3MgSmFudXNBZGFwdGVyIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMucm9vbSA9IG51bGw7XHJcbiAgICB0aGlzLnVzZXJJZCA9IHJhbmRvbVVpbnQoKTtcclxuXHJcbiAgICB0aGlzLnNlcnZlclVybCA9IG51bGw7XHJcbiAgICB0aGlzLndzID0gbnVsbDtcclxuICAgIHRoaXMuc2Vzc2lvbiA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBudWxsO1xyXG4gICAgdGhpcy5vY2N1cGFudHMgPSB7fTtcclxuICAgIHRoaXMub2NjdXBhbnRQcm9taXNlcyA9IHt9O1xyXG5cclxuICAgIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlID0gdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UuYmluZCh0aGlzKTtcclxuICAgIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UgPSB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlLmJpbmQodGhpcyk7XHJcbiAgfVxyXG5cclxuICBzZXRTZXJ2ZXJVcmwodXJsKSB7XHJcbiAgICB0aGlzLnNlcnZlclVybCA9IHVybDtcclxuICB9XHJcblxyXG4gIHNldEFwcChhcHApIHt9XHJcblxyXG4gIHNldFJvb20ocm9vbU5hbWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMucm9vbSA9IHBhcnNlSW50KHJvb21OYW1lKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUm9vbSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci5cIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRXZWJSdGNPcHRpb25zKG9wdGlvbnMpIHt9XHJcblxyXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcclxuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XHJcbiAgICB0aGlzLmNvbm5lY3RGYWlsdXJlID0gZmFpbHVyZUxpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgc2V0Um9vbU9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQgPSBvY2N1cGFudExpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgc2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQgPSBvcGVuTGlzdGVuZXI7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnREaXNjb25uZWN0ZWQgPSBjbG9zZWRMaXN0ZW5lcjtcclxuICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UgPSBtZXNzYWdlTGlzdGVuZXI7XHJcbiAgfVxyXG5cclxuICBjb25uZWN0KCkge1xyXG4gICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJVcmwsIFwiamFudXMtcHJvdG9jb2xcIik7XHJcbiAgICB0aGlzLnNlc3Npb24gPSBuZXcgbWouSmFudXNTZXNzaW9uKHRoaXMud3Muc2VuZC5iaW5kKHRoaXMud3MpKTtcclxuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgXyA9PiB0aGlzLm9uV2Vic29ja2V0T3BlbigpKTtcclxuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgb25XZWJzb2NrZXRPcGVuKCkge1xyXG4gICAgLy8gQ3JlYXRlIHRoZSBKYW51cyBTZXNzaW9uXHJcbiAgICBhd2FpdCB0aGlzLnNlc3Npb24uY3JlYXRlKCk7XHJcblxyXG4gICAgLy8gQXR0YWNoIHRoZSBTRlUgUGx1Z2luIGFuZCBjcmVhdGUgYSBSVENQZWVyQ29ubmVjdGlvbiBmb3IgdGhlIHB1Ymxpc2hlci5cclxuICAgIC8vIFRoZSBwdWJsaXNoZXIgc2VuZHMgYXVkaW8gYW5kIG9wZW5zIHR3byBiaWRpcmVjdGlvbmFsIGRhdGEgY2hhbm5lbHMuXHJcbiAgICAvLyBPbmUgcmVsaWFibGUgZGF0YWNoYW5uZWwgYW5kIG9uZSB1bnJlbGlhYmxlLlxyXG4gICAgdmFyIHB1Ymxpc2hlclByb21pc2UgPSB0aGlzLmNyZWF0ZVB1Ymxpc2hlcigpO1xyXG4gICAgdGhpcy5vY2N1cGFudFByb21pc2VzW3RoaXMudXNlcklkXSA9IHB1Ymxpc2hlclByb21pc2U7XHJcbiAgICB0aGlzLnB1Ymxpc2hlciA9IGF3YWl0IHB1Ymxpc2hlclByb21pc2U7XHJcblxyXG4gICAgdGhpcy5jb25uZWN0U3VjY2Vzcyh0aGlzLnVzZXJJZCk7XHJcblxyXG4gICAgLy8gQWRkIGFsbCBvZiB0aGUgaW5pdGlhbCBvY2N1cGFudHMuXHJcbiAgICBmb3IgKGxldCBvY2N1cGFudElkIG9mIHRoaXMucHVibGlzaGVyLmluaXRpYWxPY2N1cGFudHMpIHtcclxuICAgICAgaWYgKG9jY3VwYW50SWQgIT09IHRoaXMudXNlcklkKSB7XHJcbiAgICAgICAgdGhpcy5vY2N1cGFudFByb21pc2VzW29jY3VwYW50SWRdID0gdGhpcy5hZGRPY2N1cGFudChvY2N1cGFudElkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25XZWJzb2NrZXRNZXNzYWdlKGV2ZW50KSB7XHJcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XHJcbiAgICB0aGlzLnNlc3Npb24ucmVjZWl2ZShtZXNzYWdlKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgYWxsIG9mIHRoZSBqb2luIGFuZCBsZWF2ZSBldmVudHMgZnJvbSB0aGUgcHVibGlzaGVyLlxyXG4gICAgaWYgKG1lc3NhZ2UucGx1Z2luZGF0YSAmJiBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YSkge1xyXG4gICAgICB2YXIgZGF0YSA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhO1xyXG5cclxuICAgICAgaWYgKGRhdGEuZXZlbnQgPT09IFwiam9pblwiKSB7XHJcbiAgICAgICAgdGhpcy5vY2N1cGFudFByb21pc2VzW2RhdGEudXNlcl9pZF0gPSB0aGlzLmFkZE9jY3VwYW50KGRhdGEudXNlcl9pZCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5ldmVudCAmJiBkYXRhLmV2ZW50ID09PSBcImxlYXZlXCIpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZU9jY3VwYW50KGRhdGEudXNlcl9pZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGFkZE9jY3VwYW50KG9jY3VwYW50SWQpIHtcclxuICAgIHZhciBzdWJzY3JpYmVyID0gYXdhaXQgdGhpcy5jcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpO1xyXG4gICAgLy8gQ2FsbCB0aGUgTmV0d29ya2VkIEFGcmFtZSBjYWxsYmFja3MgZm9yIHRoZSBuZXcgb2NjdXBhbnQuXHJcbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQob2NjdXBhbnRJZCk7XHJcbiAgICB0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSA9IHRydWU7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XHJcbiAgICByZXR1cm4gc3Vic2NyaWJlcjtcclxuICB9XHJcblxyXG4gIHJlbW92ZU9jY3VwYW50KG9jY3VwYW50SWQpIHtcclxuICAgIGlmICh0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSkge1xyXG4gICAgICBkZWxldGUgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF07XHJcbiAgICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgcmVtb3ZlZCBvY2N1cGFudC5cclxuICAgICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkKG9jY3VwYW50SWQpO1xyXG4gICAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVQdWJsaXNoZXIoKSB7XHJcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XHJcbiAgICBhd2FpdCBoYW5kbGUuYXR0YWNoKFwiamFudXMucGx1Z2luLnNmdVwiKTtcclxuXHJcbiAgICB2YXIgcGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XHJcblxyXG4gICAgcGVlckNvbm5lY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcihcImljZWNhbmRpZGF0ZVwiLCBldmVudCA9PiB7XHJcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldmVudC5jYW5kaWRhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuIHVucmVsaWFibGUgZGF0YWNoYW5uZWwgZm9yIHNlbmRpbmcgYW5kIHJlY2VpdmluZyBjb21wb25lbnQgdXBkYXRlcywgZXRjLlxyXG4gICAgdmFyIHVucmVsaWFibGVDaGFubmVsID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJ1bnJlbGlhYmxlXCIsIHtcclxuICAgICAgb3JkZXJlZDogZmFsc2UsXHJcbiAgICAgIG1heFJldHJhbnNtaXRzOiAwXHJcbiAgICB9KTtcclxuICAgIHVucmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIHJlbGlhYmxlIGRhdGFjaGFubmVsIGZvciBzZW5kaW5nIGFuZCByZWNpZXZpbmcgZW50aXR5IGluc3RhbnRpYXRpb25zLCBldGMuXHJcbiAgICB2YXIgcmVsaWFibGVDaGFubmVsID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJyZWxpYWJsZVwiLCB7XHJcbiAgICAgIG9yZGVyZWQ6IHRydWVcclxuICAgIH0pO1xyXG4gICAgcmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xyXG5cclxuICAgIHZhciBtZWRpYVN0cmVhbSA9IGF3YWl0IGdldE1pY3JvcGhvbmUoKTtcclxuXHJcbiAgICBpZiAobWVkaWFTdHJlYW0pIHtcclxuICAgICAgcGVlckNvbm5lY3Rpb24uYWRkU3RyZWFtKG1lZGlhU3RyZWFtKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcigpO1xyXG4gICAgYXdhaXQgcGVlckNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihvZmZlcik7XHJcblxyXG4gICAgdmFyIGFuc3dlciA9IGF3YWl0IGhhbmRsZS5zZW5kSnNlcChvZmZlcik7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihhbnN3ZXIuanNlcCk7XHJcblxyXG4gICAgLy8gV2FpdCBmb3IgdGhlIHJlbGlhYmxlIGRhdGFjaGFubmVsIHRvIGJlIG9wZW4gYmVmb3JlIHdlIHN0YXJ0IHNlbmRpbmcgbWVzc2FnZXMgb24gaXQuXHJcbiAgICBhd2FpdCB3YWl0Rm9yRXZlbnQocmVsaWFibGVDaGFubmVsLCBcIm9wZW5cIik7XHJcblxyXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIExpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gQXV0b21hdGljYWxseSBzdWJzY3JpYmUgdG8gYWxsIHVzZXJzJyBXZWJSVEMgZGF0YS5cclxuICAgIHZhciBtZXNzYWdlID0gYXdhaXQgdGhpcy5zZW5kSm9pbihoYW5kbGUsIHRoaXMucm9vbSwgdGhpcy51c2VySWQsIHRydWUpO1xyXG5cclxuICAgIHZhciBpbml0aWFsT2NjdXBhbnRzID0gbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEucmVzcG9uc2UudXNlcl9pZHM7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGFuZGxlLFxyXG4gICAgICBpbml0aWFsT2NjdXBhbnRzLFxyXG4gICAgICByZWxpYWJsZUNoYW5uZWwsXHJcbiAgICAgIHVucmVsaWFibGVDaGFubmVsLFxyXG4gICAgICBtZWRpYVN0cmVhbSxcclxuICAgICAgcGVlckNvbm5lY3Rpb25cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpIHtcclxuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcclxuICAgIGF3YWl0IGhhbmRsZS5hdHRhY2goXCJqYW51cy5wbHVnaW4uc2Z1XCIpO1xyXG5cclxuICAgIHZhciBwZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcclxuXHJcbiAgICBwZWVyQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ZW50ID0+IHtcclxuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2ZW50LmNhbmRpZGF0ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcih7XHJcbiAgICAgIG9mZmVyVG9SZWNlaXZlQXVkaW86IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xyXG4gICAgdmFyIGFuc3dlciA9IGF3YWl0IGhhbmRsZS5zZW5kSnNlcChvZmZlcik7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihhbnN3ZXIuanNlcCk7XHJcblxyXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIERvbid0IGxpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gU3Vic2NyaWJlIHRvIHRoZSBvY2N1cGFudCdzIGF1ZGlvIHN0cmVhbS5cclxuICAgIGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCBmYWxzZSwgW1xyXG4gICAgICB7XHJcbiAgICAgICAgcHVibGlzaGVyX2lkOiBvY2N1cGFudElkLFxyXG4gICAgICAgIGNvbnRlbnRfa2luZDogQ29udGVudEtpbmQuQXVkaW9cclxuICAgICAgfVxyXG4gICAgXSk7XHJcblxyXG4gICAgLy8gR2V0IHRoZSBvY2N1cGFudCdzIGF1ZGlvIHN0cmVhbS5cclxuICAgIHZhciBzdHJlYW1zID0gcGVlckNvbm5lY3Rpb24uZ2V0UmVtb3RlU3RyZWFtcygpO1xyXG4gICAgdmFyIG1lZGlhU3RyZWFtID0gc3RyZWFtcy5sZW5ndGggPiAwID8gc3RyZWFtc1swXSA6IG51bGw7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGFuZGxlLFxyXG4gICAgICBtZWRpYVN0cmVhbSxcclxuICAgICAgcGVlckNvbm5lY3Rpb25cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBzZW5kSm9pbihoYW5kbGUsIHJvb21JZCwgdXNlcklkLCBub3RpZnksIHNwZWNzKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlLnNlbmRNZXNzYWdlKHtcclxuICAgICAga2luZDogXCJqb2luXCIsXHJcbiAgICAgIHJvb21faWQ6IHJvb21JZCxcclxuICAgICAgdXNlcl9pZDogdXNlcklkLFxyXG4gICAgICBub3RpZnksXHJcbiAgICAgIHN1YnNjcmlwdGlvbl9zcGVjczogc3BlY3NcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgb25EYXRhQ2hhbm5lbE1lc3NhZ2UoZXZlbnQpIHtcclxuICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5kYXRhVHlwZSkge1xyXG4gICAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlKG51bGwsIG1lc3NhZ2UuZGF0YVR5cGUsIG1lc3NhZ2UuZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzaG91bGRTdGFydENvbm5lY3Rpb25UbyhjbGllbnRJZCkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBzdGFydFN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHt9XHJcblxyXG4gIGNsb3NlU3RyZWFtQ29ubmVjdGlvbihjbGllbnRJZCkge31cclxuXHJcbiAgZ2V0Q29ubmVjdFN0YXR1cyhjbGllbnRJZCkge1xyXG4gICAgaWYgKHRoaXMub2NjdXBhbnRzW2NsaWVudElkXSkge1xyXG4gICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLklTX0NPTk5FQ1RFRDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuTk9UX0NPTk5FQ1RFRDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdldE1lZGlhU3RyZWFtKGNsaWVudElkKSB7XHJcbiAgICB2YXIgb2NjdXBhbnRQcm9taXNlID0gdGhpcy5vY2N1cGFudFByb21pc2VzW2NsaWVudElkXTtcclxuXHJcbiAgICBpZiAoIW9jY3VwYW50UHJvbWlzZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFN1YnNjcmliZXIgZm9yIGNsaWVudDogJHtjbGllbnRJZH0gZG9lcyBub3QgZXhpc3QuYCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9jY3VwYW50UHJvbWlzZS50aGVuKHMgPT4gcy5tZWRpYVN0cmVhbSk7XHJcbiAgfVxyXG5cclxuICBlbmFibGVNaWNyb3Bob25lKGVuYWJsZWQpIHtcclxuICAgIHZhciBtaWNyb3Bob25lU3RyZWFtID0gdGhpcy5zdWJzY3JpYmVyLm1lZGlhU3RyZWFtO1xyXG5cclxuICAgIGlmIChtaWNyb3Bob25lU3RyZWFtKSB7XHJcbiAgICAgIHZhciBhdWRpb1RyYWNrcyA9IG1pY3JvcGhvbmVTdHJlYW0uZ2V0QXVkaW9UcmFja3MoKTtcclxuXHJcbiAgICAgIGlmIChhdWRpb1RyYWNrcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgYXVkaW9UcmFja3NbMF0uZW5hYmxlZCA9IGVuYWJsZWQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChcclxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YUd1YXJhbnRlZWQoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChcclxuICAgICAgSlNPTi5zdHJpbmdpZnkoeyBjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEgfSlcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBicm9hZGNhc3REYXRhKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci51bnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xyXG4gIH1cclxuXHJcbiAgYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQoZGF0YVR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xyXG4gIH1cclxufVxyXG5cclxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwiamFudXNcIiwgSmFudXNBZGFwdGVyKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSmFudXNBZGFwdGVyO1xyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvaW5kZXguanMiLCIvKiogV2hldGhlciB0byBsb2cgaW5mb3JtYXRpb24gYWJvdXQgaW5jb21pbmcgYW5kIG91dGdvaW5nIEphbnVzIHNpZ25hbHMuICoqL1xudmFyIHZlcmJvc2UgPSBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgaGFuZGxlIHRvIGEgc2luZ2xlIEphbnVzIHBsdWdpbiBvbiBhIEphbnVzIHNlc3Npb24uIEVhY2ggV2ViUlRDIGNvbm5lY3Rpb24gdG8gdGhlIEphbnVzIHNlcnZlciB3aWxsIGJlXG4gKiBhc3NvY2lhdGVkIHdpdGggYSBzaW5nbGUgaGFuZGxlLiBPbmNlIGF0dGFjaGVkIHRvIHRoZSBzZXJ2ZXIsIHRoaXMgaGFuZGxlIHdpbGwgYmUgZ2l2ZW4gYSB1bmlxdWUgSUQgd2hpY2ggc2hvdWxkIGJlXG4gKiB1c2VkIHRvIGFzc29jaWF0ZSBpdCB3aXRoIGZ1dHVyZSBzaWduYWxsaW5nIG1lc3NhZ2VzLlxuICpcbiAqIFNlZSBodHRwczovL2phbnVzLmNvbmYubWVldGVjaG8uY29tL2RvY3MvcmVzdC5odG1sI2hhbmRsZXMuXG4gKiovXG5mdW5jdGlvbiBKYW51c1BsdWdpbkhhbmRsZShzZXNzaW9uKSB7XG4gIHRoaXMuc2Vzc2lvbiA9IHNlc3Npb247XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG59XG5cbi8qKiBBdHRhY2hlcyB0aGlzIGhhbmRsZSB0byB0aGUgSmFudXMgc2VydmVyIGFuZCBzZXRzIGl0cyBJRC4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24ocGx1Z2luKSB7XG4gIHZhciBwYXlsb2FkID0geyBqYW51czogXCJhdHRhY2hcIiwgcGx1Z2luOiBwbHVnaW4sIFwiZm9yY2UtYnVuZGxlXCI6IHRydWUsIFwiZm9yY2UtcnRjcC1tdXhcIjogdHJ1ZSB9O1xuICByZXR1cm4gdGhpcy5zZXNzaW9uLnNlbmQocGF5bG9hZCkudGhlbihyZXNwID0+IHtcbiAgICB0aGlzLmlkID0gcmVzcC5kYXRhLmlkO1xuICAgIHJldHVybiByZXNwO1xuICB9KTtcbn07XG5cbi8qKiBEZXRhY2hlcyB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuZGV0YWNoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJkZXRhY2hcIiB9KTtcbn07XG5cbi8qKlxuICogU2VuZHMgYSBzaWduYWwgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiBTaWduYWxzIHNob3VsZCBiZSBKU09OLXNlcmlhbGl6YWJsZSBvYmplY3RzLiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGxcbiAqIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIHdoZW4gYSByZXNwb25zZSB0byB0aGlzIHNpZ25hbCBpcyByZWNlaXZlZCwgb3Igd2hlbiBubyByZXNwb25zZSBpcyByZWNlaXZlZCB3aXRoaW4gdGhlXG4gKiBzZXNzaW9uIHRpbWVvdXQuXG4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICByZXR1cm4gdGhpcy5zZXNzaW9uLnNlbmQoT2JqZWN0LmFzc2lnbih7IGhhbmRsZV9pZDogdGhpcy5pZCB9LCBzaWduYWwpKTtcbn07XG5cbi8qKiBTZW5kcyBhIHBsdWdpbi1zcGVjaWZpYyBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihib2R5KSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJtZXNzYWdlXCIsIGJvZHk6IGJvZHkgfSk7XG59O1xuXG4vKiogU2VuZHMgYSBKU0VQIG9mZmVyIG9yIGFuc3dlciBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRKc2VwID0gZnVuY3Rpb24oanNlcCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiB7fSwganNlcDoganNlcCB9KTtcbn07XG5cbi8qKiBTZW5kcyBhbiBJQ0UgdHJpY2tsZSBjYW5kaWRhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kVHJpY2tsZSA9IGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwidHJpY2tsZVwiLCAgY2FuZGlkYXRlOiBjYW5kaWRhdGUgfSk7XG59O1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBKYW51cyBzZXNzaW9uIC0tIGEgSmFudXMgY29udGV4dCBmcm9tIHdpdGhpbiB3aGljaCB5b3UgY2FuIG9wZW4gbXVsdGlwbGUgaGFuZGxlcyBhbmQgY29ubmVjdGlvbnMuIE9uY2VcbiAqIGNyZWF0ZWQsIHRoaXMgc2Vzc2lvbiB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZSB1c2VkIHRvIGFzc29jaWF0ZSBpdCB3aXRoIGZ1dHVyZSBzaWduYWxsaW5nIG1lc3NhZ2VzLlxuICpcbiAqIFNlZSBodHRwczovL2phbnVzLmNvbmYubWVldGVjaG8uY29tL2RvY3MvcmVzdC5odG1sI3Nlc3Npb25zLlxuICoqL1xuZnVuY3Rpb24gSmFudXNTZXNzaW9uKG91dHB1dCwgb3B0aW9ucykge1xuICB0aGlzLm91dHB1dCA9IG91dHB1dDtcbiAgdGhpcy5pZCA9IHVuZGVmaW5lZDtcbiAgdGhpcy5uZXh0VHhJZCA9IDA7XG4gIHRoaXMudHhucyA9IHt9O1xuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHtcbiAgICB0aW1lb3V0TXM6IDEwMDAwLFxuICAgIGtlZXBhbGl2ZU1zOiAzMDAwMFxuICB9O1xufVxuXG4vKiogQ3JlYXRlcyB0aGlzIHNlc3Npb24gb24gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImNyZWF0ZVwiIH0pLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGVzdHJveXMgdGhpcyBzZXNzaW9uLiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGVzdHJveVwiIH0pO1xufTtcblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgcmVjZWl2aW5nIEpTT04gc2lnbmFsbGluZyBtZXNzYWdlcyBwZXJ0aW5lbnQgdG8gdGhpcyBzZXNzaW9uLiBJZiB0aGUgc2lnbmFscyBhcmUgcmVzcG9uc2VzIHRvIHByZXZpb3VzbHlcbiAqIHNlbnQgc2lnbmFscywgdGhlIHByb21pc2VzIGZvciB0aGUgb3V0Z29pbmcgc2lnbmFscyB3aWxsIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIGFwcHJvcHJpYXRlbHkgd2l0aCB0aGlzIHNpZ25hbCBhcyBhblxuICogYXJndW1lbnQuXG4gKlxuICogRXh0ZXJuYWwgY2FsbGVycyBzaG91bGQgY2FsbCB0aGlzIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgYSBuZXcgc2lnbmFsIGFycml2ZXMgb24gdGhlIHRyYW5zcG9ydDsgZm9yIGV4YW1wbGUsIGluIGFcbiAqIFdlYlNvY2tldCdzIGBtZXNzYWdlYCBldmVudCwgb3Igd2hlbiBhIG5ldyBkYXR1bSBzaG93cyB1cCBpbiBhbiBIVFRQIGxvbmctcG9sbGluZyByZXNwb25zZS5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUucmVjZWl2ZSA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAobW9kdWxlLmV4cG9ydHMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJJbmNvbWluZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIGlmIChzaWduYWwudHJhbnNhY3Rpb24gIT0gbnVsbCkge1xuICAgIHZhciBoYW5kbGVycyA9IHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgIGlmIChzaWduYWwuamFudXMgPT09IFwiYWNrXCIgJiYgc2lnbmFsLmhpbnQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYW4gYWNrIG9mIGFuIGFzeW5jaHJvbm91c2x5LXByb2Nlc3NlZCByZXF1ZXN0LCB3ZSBzaG91bGQgd2FpdFxuICAgICAgLy8gdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB1bnRpbCB0aGUgYWN0dWFsIHJlc3BvbnNlIGNvbWVzIGluXG4gICAgfSBlbHNlIGlmIChoYW5kbGVycyAhPSBudWxsKSB7XG4gICAgICBpZiAoaGFuZGxlcnMudGltZW91dCAhPSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChoYW5kbGVycy50aW1lb3V0KTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgIChzaWduYWwuamFudXMgPT09IFwiZXJyb3JcIiA/IGhhbmRsZXJzLnJlamVjdCA6IGhhbmRsZXJzLnJlc29sdmUpKHNpZ25hbCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb24uIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAobW9kdWxlLmV4cG9ydHMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJPdXRnb2luZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIHNpZ25hbCA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHNlc3Npb25faWQ6IHRoaXMuaWQsXG4gICAgdHJhbnNhY3Rpb246ICh0aGlzLm5leHRUeElkKyspLnRvU3RyaW5nKClcbiAgfSwgc2lnbmFsKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lb3V0TXMpIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZGVsZXRlIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKFwiU2lnbmFsbGluZyBtZXNzYWdlIHRpbWVkIG91dC5cIikpO1xuICAgICAgfSwgdGhpcy5vcHRpb25zLnRpbWVvdXRNcyk7XG4gICAgfVxuICAgIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dID0geyByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCwgdGltZW91dDogdGltZW91dCB9O1xuICAgIHRoaXMub3V0cHV0KEpTT04uc3RyaW5naWZ5KHNpZ25hbCkpO1xuICAgIHRoaXMuX3Jlc2V0S2VlcGFsaXZlKCk7XG4gIH0pO1xufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fcmVzZXRLZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMua2VlcGFsaXZlVGltZW91dCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmtlZXBhbGl2ZVRpbWVvdXQpO1xuICB9XG4gIGlmICh0aGlzLm9wdGlvbnMua2VlcGFsaXZlTXMpIHtcbiAgICB0aGlzLmtlZXBhbGl2ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX2tlZXBhbGl2ZSgpLCB0aGlzLm9wdGlvbnMua2VlcGFsaXZlTXMpO1xuICB9XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9rZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImtlZXBhbGl2ZVwiIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEphbnVzUGx1Z2luSGFuZGxlLFxuICBKYW51c1Nlc3Npb24sXG4gIHZlcmJvc2Vcbn07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCJdLCJzb3VyY2VSb290IjoiIn0=