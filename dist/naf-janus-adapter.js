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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgOGRmM2FkZTJhYjhkNDBjZDJmMTciLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsImF1ZGlvIiwiZSIsIm5hbWUiLCJjb25zb2xlIiwid2FybiIsImVycm9yIiwiZ2V0TWljcm9waG9uZSIsIm1qIiwicmVxdWlyZSIsIkNvbnRlbnRLaW5kIiwiQXVkaW8iLCJWaWRlbyIsIkRhdGEiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIndhaXRGb3JFdmVudCIsInRhcmdldCIsImV2ZW50IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJhZGRFdmVudExpc3RlbmVyIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJsIiwiSmFudXNBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyb29tIiwidXNlcklkIiwic2VydmVyVXJsIiwid3MiLCJzZXNzaW9uIiwicHVibGlzaGVyIiwib2NjdXBhbnRzIiwib2NjdXBhbnRTdWJzY3JpYmVycyIsIm9uV2Vic29ja2V0TWVzc2FnZSIsImJpbmQiLCJvbkRhdGFDaGFubmVsTWVzc2FnZSIsInNldFNlcnZlclVybCIsInNldEFwcCIsImFwcCIsInNldFJvb20iLCJyb29tTmFtZSIsInBhcnNlSW50IiwiRXJyb3IiLCJzZXRXZWJSdGNPcHRpb25zIiwib3B0aW9ucyIsInNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMiLCJzdWNjZXNzTGlzdGVuZXIiLCJmYWlsdXJlTGlzdGVuZXIiLCJjb25uZWN0U3VjY2VzcyIsImNvbm5lY3RGYWlsdXJlIiwic2V0Um9vbU9jY3VwYW50TGlzdGVuZXIiLCJvY2N1cGFudExpc3RlbmVyIiwib25PY2N1cGFudHNDaGFuZ2VkIiwic2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMiLCJvcGVuTGlzdGVuZXIiLCJjbG9zZWRMaXN0ZW5lciIsIm1lc3NhZ2VMaXN0ZW5lciIsIm9uT2NjdXBhbnRDb25uZWN0ZWQiLCJvbk9jY3VwYW50RGlzY29ubmVjdGVkIiwib25PY2N1cGFudE1lc3NhZ2UiLCJjb25uZWN0IiwiV2ViU29ja2V0IiwiSmFudXNTZXNzaW9uIiwic2VuZCIsIl8iLCJvbldlYnNvY2tldE9wZW4iLCJjcmVhdGUiLCJjcmVhdGVQdWJsaXNoZXIiLCJvY2N1cGFudElkIiwiaW5pdGlhbE9jY3VwYW50cyIsImFkZE9jY3VwYW50IiwibWVzc2FnZSIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJyZWNlaXZlIiwicGx1Z2luZGF0YSIsInVzZXJfaWQiLCJyZW1vdmVPY2N1cGFudCIsInN1YnNjcmliZXIiLCJjcmVhdGVTdWJzY3JpYmVyIiwiaGFuZGxlIiwiSmFudXNQbHVnaW5IYW5kbGUiLCJhdHRhY2giLCJwZWVyQ29ubmVjdGlvbiIsIlJUQ1BlZXJDb25uZWN0aW9uIiwic2VuZFRyaWNrbGUiLCJjYW5kaWRhdGUiLCJ1bnJlbGlhYmxlQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwib3JkZXJlZCIsIm1heFJldHJhbnNtaXRzIiwicmVsaWFibGVDaGFubmVsIiwibWVkaWFTdHJlYW0iLCJhZGRTdHJlYW0iLCJvZmZlciIsImNyZWF0ZU9mZmVyIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsImFuc3dlciIsInNlbmRKc2VwIiwic2V0UmVtb3RlRGVzY3JpcHRpb24iLCJqc2VwIiwic2VuZEpvaW4iLCJyZXNwb25zZSIsInVzZXJfaWRzIiwib2ZmZXJUb1JlY2VpdmVBdWRpbyIsInB1Ymxpc2hlcl9pZCIsImNvbnRlbnRfa2luZCIsInN0cmVhbXMiLCJnZXRSZW1vdGVTdHJlYW1zIiwibGVuZ3RoIiwicm9vbUlkIiwibm90aWZ5Iiwic3BlY3MiLCJzZW5kTWVzc2FnZSIsImtpbmQiLCJyb29tX2lkIiwic3Vic2NyaXB0aW9uX3NwZWNzIiwiZGF0YVR5cGUiLCJzaG91bGRTdGFydENvbm5lY3Rpb25UbyIsImNsaWVudElkIiwic3RhcnRTdHJlYW1Db25uZWN0aW9uIiwiY2xvc2VTdHJlYW1Db25uZWN0aW9uIiwiZ2V0Q29ubmVjdFN0YXR1cyIsIk5BRiIsImFkYXB0ZXJzIiwiSVNfQ09OTkVDVEVEIiwiTk9UX0NPTk5FQ1RFRCIsImdldE1lZGlhU3RyZWFtIiwidGhlbiIsInMiLCJlbmFibGVNaWNyb3Bob25lIiwiZW5hYmxlZCIsImF1ZGlvVHJhY2tzIiwiZ2V0QXVkaW9UcmFja3MiLCJzZW5kRGF0YSIsInN0cmluZ2lmeSIsInNlbmREYXRhR3VhcmFudGVlZCIsImJyb2FkY2FzdERhdGEiLCJicm9hZGNhc3REYXRhR3VhcmFudGVlZCIsInJlZ2lzdGVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7OzsrQkMzQ0EsYUFBK0I7QUFDN0IsUUFBSTtBQUNGLGFBQU8sTUFBTUEsVUFBVUMsWUFBVixDQUF1QkMsWUFBdkIsQ0FBb0M7QUFDL0NDLGVBQU87QUFEd0MsT0FBcEMsQ0FBYjtBQUdELEtBSkQsQ0FJRSxPQUFPQyxDQUFQLEVBQVU7QUFDVixVQUFJQSxFQUFFQyxJQUFG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O0FBQ0EiLCJmaWxlIjoibmFmLWphbnVzLWFkYXB0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCA4ZGYzYWRlMmFiOGQ0MGNkMmYxNyIsInZhciBtaiA9IHJlcXVpcmUoXCJtaW5pamFudXNcIik7XHJcblxyXG5jb25zdCBDb250ZW50S2luZCA9IHtcclxuICBBdWRpbzogMSxcclxuICBWaWRlbzogMixcclxuICBEYXRhOiA0XHJcbn07XHJcblxyXG5mdW5jdGlvbiByYW5kb21VaW50KCkge1xyXG4gIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdhaXRGb3JFdmVudCh0YXJnZXQsIGV2ZW50KSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBlID0+IHJlc29sdmUoZSksIHsgb25jZTogdHJ1ZSB9KTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TWljcm9waG9uZSgpIHtcclxuICB0cnkge1xyXG4gICAgcmV0dXJuIGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHtcclxuICAgICAgYXVkaW86IHRydWVcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGlmIChlLm5hbWUgPT09IFwiTm90QWxsb3dlZEVycm9yXCIpIHtcclxuICAgICAgY29uc29sZS53YXJuKFwiTWljcm9waG9uZSBhY2Nlc3Mgbm90IGFsbG93ZWQuXCIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IFBFRVJfQ09OTkVDVElPTl9DT05GSUcgPSB7XHJcbiAgaWNlU2VydmVyczogW1xyXG4gICAgeyB1cmw6IFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxyXG4gICAgeyB1cmw6IFwic3R1bjpzdHVuMi5sLmdvb2dsZS5jb206MTkzMDJcIiB9XHJcbiAgXVxyXG59O1xyXG5cclxuY2xhc3MgSmFudXNBZGFwdGVyIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMucm9vbSA9IG51bGw7XHJcbiAgICB0aGlzLnVzZXJJZCA9IHJhbmRvbVVpbnQoKTtcclxuXHJcbiAgICB0aGlzLnNlcnZlclVybCA9IG51bGw7XHJcbiAgICB0aGlzLndzID0gbnVsbDtcclxuICAgIHRoaXMuc2Vzc2lvbiA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBudWxsO1xyXG4gICAgdGhpcy5vY2N1cGFudHMgPSB7fTtcclxuICAgIHRoaXMub2NjdXBhbnRTdWJzY3JpYmVycyA9IHt9O1xyXG5cclxuICAgIHRoaXMub25XZWJzb2NrZXRNZXNzYWdlID0gdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UuYmluZCh0aGlzKTtcclxuICAgIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UgPSB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlLmJpbmQodGhpcyk7XHJcbiAgfVxyXG5cclxuICBzZXRTZXJ2ZXJVcmwodXJsKSB7XHJcbiAgICB0aGlzLnNlcnZlclVybCA9IHVybDtcclxuICB9XHJcblxyXG4gIHNldEFwcChhcHApIHt9XHJcblxyXG4gIHNldFJvb20ocm9vbU5hbWUpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMucm9vbSA9IHBhcnNlSW50KHJvb21OYW1lKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUm9vbSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci5cIik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRXZWJSdGNPcHRpb25zKG9wdGlvbnMpIHt9XHJcblxyXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcclxuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XHJcbiAgICB0aGlzLmNvbm5lY3RGYWlsdXJlID0gZmFpbHVyZUxpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgc2V0Um9vbU9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQgPSBvY2N1cGFudExpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgc2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQgPSBvcGVuTGlzdGVuZXI7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnREaXNjb25uZWN0ZWQgPSBjbG9zZWRMaXN0ZW5lcjtcclxuICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UgPSBtZXNzYWdlTGlzdGVuZXI7XHJcbiAgfVxyXG5cclxuICBjb25uZWN0KCkge1xyXG4gICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJVcmwsIFwiamFudXMtcHJvdG9jb2xcIik7XHJcbiAgICB0aGlzLnNlc3Npb24gPSBuZXcgbWouSmFudXNTZXNzaW9uKHRoaXMud3Muc2VuZC5iaW5kKHRoaXMud3MpKTtcclxuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgXyA9PiB0aGlzLm9uV2Vic29ja2V0T3BlbigpKTtcclxuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgb25XZWJzb2NrZXRPcGVuKCkge1xyXG4gICAgLy8gQ3JlYXRlIHRoZSBKYW51cyBTZXNzaW9uXHJcbiAgICBhd2FpdCB0aGlzLnNlc3Npb24uY3JlYXRlKCk7XHJcblxyXG4gICAgLy8gQXR0YWNoIHRoZSBTRlUgUGx1Z2luIGFuZCBjcmVhdGUgYSBSVENQZWVyQ29ubmVjdGlvbiBmb3IgdGhlIHB1Ymxpc2hlci5cclxuICAgIC8vIFRoZSBwdWJsaXNoZXIgc2VuZHMgYXVkaW8gYW5kIG9wZW5zIHR3byBiaWRpcmVjdGlvbmFsIGRhdGEgY2hhbm5lbHMuXHJcbiAgICAvLyBPbmUgcmVsaWFibGUgZGF0YWNoYW5uZWwgYW5kIG9uZSB1bnJlbGlhYmxlLlxyXG4gICAgdmFyIHB1Ymxpc2hlciA9IGF3YWl0IHRoaXMuY3JlYXRlUHVibGlzaGVyKCk7XHJcbiAgICB0aGlzLnB1Ymxpc2hlciA9IHB1Ymxpc2hlcjtcclxuXHJcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzKHRoaXMudXNlcklkKTtcclxuXHJcbiAgICAvLyBBZGQgYWxsIG9mIHRoZSBpbml0aWFsIG9jY3VwYW50cy5cclxuICAgIGZvciAobGV0IG9jY3VwYW50SWQgb2YgcHVibGlzaGVyLmluaXRpYWxPY2N1cGFudHMpIHtcclxuICAgICAgaWYgKG9jY3VwYW50SWQgIT09IHB1Ymxpc2hlci51c2VySWQpIHtcclxuICAgICAgICB0aGlzLm9jY3VwYW50U3Vic2NyaWJlcnNbb2NjdXBhbnRJZF0gPSB0aGlzLmFkZE9jY3VwYW50KG9jY3VwYW50SWQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBvbldlYnNvY2tldE1lc3NhZ2UoZXZlbnQpIHtcclxuICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcclxuICAgIHRoaXMuc2Vzc2lvbi5yZWNlaXZlKG1lc3NhZ2UpO1xyXG5cclxuICAgIC8vIEhhbmRsZSBhbGwgb2YgdGhlIGpvaW4gYW5kIGxlYXZlIGV2ZW50cyBmcm9tIHRoZSBwdWJsaXNoZXIuXHJcbiAgICBpZiAoXHJcbiAgICAgIG1lc3NhZ2UucGx1Z2luZGF0YSAmJlxyXG4gICAgICBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YVxyXG4gICAgKSB7XHJcbiAgICAgIHZhciBkYXRhID0gbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGE7XHJcblxyXG4gICAgICBpZiAoZGF0YS5ldmVudCA9PT0gXCJqb2luXCIpIHtcclxuICAgICAgICB0aGlzLm9jY3VwYW50U3Vic2NyaWJlcnNbZGF0YS51c2VyX2lkXSA9IHRoaXMuYWRkT2NjdXBhbnQoZGF0YS51c2VyX2lkKTtcclxuICAgICAgfSBlbHNlIGlmIChkYXRhLmV2ZW50ICYmIGRhdGEuZXZlbnQgPT09IFwibGVhdmVcIikge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlT2NjdXBhbnQoZGF0YS51c2VyX2lkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgYWRkT2NjdXBhbnQob2NjdXBhbnRJZCkge1xyXG4gICAgdmFyIHN1YnNjcmliZXIgPSBhd2FpdCB0aGlzLmNyZWF0ZVN1YnNjcmliZXIob2NjdXBhbnRJZCk7XHJcbiAgICAvLyBDYWxsIHRoZSBOZXR3b3JrZWQgQUZyYW1lIGNhbGxiYWNrcyBmb3IgdGhlIG5ldyBvY2N1cGFudC5cclxuICAgIHRoaXMub25PY2N1cGFudENvbm5lY3RlZChvY2N1cGFudElkKTtcclxuICAgIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdID0gdHJ1ZTtcclxuICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkKHRoaXMub2NjdXBhbnRzKTtcclxuICAgIHJldHVybiBzdWJzY3JpYmVyO1xyXG4gIH1cclxuXHJcbiAgcmVtb3ZlT2NjdXBhbnQob2NjdXBhbnRJZCkge1xyXG4gICAgaWYgKHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdKSB7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXTtcclxuICAgICAgLy8gQ2FsbCB0aGUgTmV0d29ya2VkIEFGcmFtZSBjYWxsYmFja3MgZm9yIHRoZSByZW1vdmVkIG9jY3VwYW50LlxyXG4gICAgICB0aGlzLm9uT2NjdXBhbnREaXNjb25uZWN0ZWQob2NjdXBhbnRJZCk7XHJcbiAgICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkKHRoaXMub2NjdXBhbnRzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGNyZWF0ZVB1Ymxpc2hlcigpIHtcclxuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcclxuICAgIGF3YWl0IGhhbmRsZS5hdHRhY2goXCJqYW51cy5wbHVnaW4uc2Z1XCIpO1xyXG5cclxuICAgIHZhciBwZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcclxuXHJcbiAgICBwZWVyQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ZW50ID0+IHtcclxuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2ZW50LmNhbmRpZGF0ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYW4gdW5yZWxpYWJsZSBkYXRhY2hhbm5lbCBmb3Igc2VuZGluZyBhbmQgcmVjZWl2aW5nIGNvbXBvbmVudCB1cGRhdGVzLCBldGMuXHJcbiAgICB2YXIgdW5yZWxpYWJsZUNoYW5uZWwgPSBwZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbChcInVucmVsaWFibGVcIiwge1xyXG4gICAgICBvcmRlcmVkOiBmYWxzZSxcclxuICAgICAgbWF4UmV0cmFuc21pdHM6IDBcclxuICAgIH0pO1xyXG4gICAgdW5yZWxpYWJsZUNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgcmVsaWFibGUgZGF0YWNoYW5uZWwgZm9yIHNlbmRpbmcgYW5kIHJlY2lldmluZyBlbnRpdHkgaW5zdGFudGlhdGlvbnMsIGV0Yy5cclxuICAgIHZhciByZWxpYWJsZUNoYW5uZWwgPSBwZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbChcInJlbGlhYmxlXCIsIHtcclxuICAgICAgb3JkZXJlZDogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICByZWxpYWJsZUNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSk7XHJcblxyXG4gICAgdmFyIG1lZGlhU3RyZWFtID0gYXdhaXQgZ2V0TWljcm9waG9uZSgpO1xyXG5cclxuICAgIGlmIChtZWRpYVN0cmVhbSkge1xyXG4gICAgICBwZWVyQ29ubmVjdGlvbi5hZGRTdHJlYW0obWVkaWFTdHJlYW0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBvZmZlciA9IGF3YWl0IHBlZXJDb25uZWN0aW9uLmNyZWF0ZU9mZmVyKCk7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcclxuXHJcbiAgICB2YXIgYW5zd2VyID0gYXdhaXQgaGFuZGxlLnNlbmRKc2VwKG9mZmVyKTtcclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKGFuc3dlci5qc2VwKTtcclxuXHJcbiAgICAvLyBXYWl0IGZvciB0aGUgcmVsaWFibGUgZGF0YWNoYW5uZWwgdG8gYmUgb3BlbiBiZWZvcmUgd2Ugc3RhcnQgc2VuZGluZyBtZXNzYWdlcyBvbiBpdC5cclxuICAgIGF3YWl0IHdhaXRGb3JFdmVudChyZWxpYWJsZUNoYW5uZWwsIFwib3BlblwiKTsgICAgXHJcblxyXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIExpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gQXV0b21hdGljYWxseSBzdWJzY3JpYmUgdG8gYWxsIHVzZXJzJyBXZWJSVEMgZGF0YS5cclxuICAgIHZhciBtZXNzYWdlID0gYXdhaXQgdGhpcy5zZW5kSm9pbihoYW5kbGUsIHRoaXMucm9vbSwgdGhpcy51c2VySWQsIHRydWUpO1xyXG5cclxuICAgIHZhciBpbml0aWFsT2NjdXBhbnRzID0gbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEucmVzcG9uc2UudXNlcl9pZHM7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGFuZGxlLFxyXG4gICAgICBpbml0aWFsT2NjdXBhbnRzLFxyXG4gICAgICByZWxpYWJsZUNoYW5uZWwsXHJcbiAgICAgIHVucmVsaWFibGVDaGFubmVsLFxyXG4gICAgICBtZWRpYVN0cmVhbSxcclxuICAgICAgcGVlckNvbm5lY3Rpb25cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpIHtcclxuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcclxuICAgIGF3YWl0IGhhbmRsZS5hdHRhY2goXCJqYW51cy5wbHVnaW4uc2Z1XCIpO1xyXG5cclxuICAgIHZhciBwZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcclxuXHJcbiAgICBwZWVyQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ZW50ID0+IHtcclxuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2ZW50LmNhbmRpZGF0ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcih7XHJcbiAgICAgIG9mZmVyVG9SZWNlaXZlQXVkaW86IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xyXG4gICAgdmFyIGFuc3dlciA9IGF3YWl0IGhhbmRsZS5zZW5kSnNlcChvZmZlcik7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihhbnN3ZXIuanNlcCk7XHJcblxyXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIERvbid0IGxpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gU3Vic2NyaWJlIHRvIHRoZSBvY2N1cGFudCdzIGF1ZGlvIHN0cmVhbS5cclxuICAgIGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCBmYWxzZSwgW1xyXG4gICAgICB7XHJcbiAgICAgICAgcHVibGlzaGVyX2lkOiBvY2N1cGFudElkLFxyXG4gICAgICAgIGNvbnRlbnRfa2luZDogQ29udGVudEtpbmQuQXVkaW9cclxuICAgICAgfVxyXG4gICAgXSk7XHJcblxyXG4gICAgLy8gR2V0IHRoZSBvY2N1cGFudCdzIGF1ZGlvIHN0cmVhbS5cclxuICAgIHZhciBzdHJlYW1zID0gcGVlckNvbm5lY3Rpb24uZ2V0UmVtb3RlU3RyZWFtcygpO1xyXG4gICAgdmFyIG1lZGlhU3RyZWFtID0gc3RyZWFtcy5sZW5ndGggPiAwID8gc3RyZWFtc1swXSA6IG51bGw7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGFuZGxlLFxyXG4gICAgICBtZWRpYVN0cmVhbSxcclxuICAgICAgcGVlckNvbm5lY3Rpb25cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBzZW5kSm9pbihoYW5kbGUsIHJvb21JZCwgdXNlcklkLCBub3RpZnksIHNwZWNzKSB7XHJcbiAgICByZXR1cm4gaGFuZGxlLnNlbmRNZXNzYWdlKHtcclxuICAgICAga2luZDogXCJqb2luXCIsXHJcbiAgICAgIHJvb21faWQ6IHJvb21JZCxcclxuICAgICAgdXNlcl9pZDogdXNlcklkLFxyXG4gICAgICBub3RpZnksXHJcbiAgICAgIHN1YnNjcmlwdGlvbl9zcGVjczogc3BlY3NcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgb25EYXRhQ2hhbm5lbE1lc3NhZ2UoZXZlbnQpIHtcclxuICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5kYXRhVHlwZSkge1xyXG4gICAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlKG51bGwsIG1lc3NhZ2UuZGF0YVR5cGUsIG1lc3NhZ2UuZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzaG91bGRTdGFydENvbm5lY3Rpb25UbyhjbGllbnRJZCkge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBzdGFydFN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHt9XHJcblxyXG4gIGNsb3NlU3RyZWFtQ29ubmVjdGlvbihjbGllbnRJZCkge31cclxuXHJcbiAgZ2V0Q29ubmVjdFN0YXR1cyhjbGllbnRJZCkge1xyXG4gICAgaWYgKHRoaXMub2NjdXBhbnRzW2NsaWVudElkXSkge1xyXG4gICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLklTX0NPTk5FQ1RFRDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuTk9UX0NPTk5FQ1RFRDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdldE1lZGlhU3RyZWFtKGNsaWVudElkKSB7XHJcbiAgICB2YXIgc3Vic2NyaWJlciA9IHRoaXMub2NjdXBhbnRTdWJzY3JpYmVyc1tjbGllbnRJZF07XHJcblxyXG4gICAgaWYgKCFzdWJzY3JpYmVyKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU3Vic2NyaWJlciBmb3IgY2xpZW50OiAke2NsaWVudElkfSBkb2VzIG5vdCBleGlzdC5gKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3Vic2NyaWJlci50aGVuKHMgPT4gcy5tZWRpYVN0cmVhbSk7XHJcbiAgfVxyXG5cclxuICBlbmFibGVNaWNyb3Bob25lKGVuYWJsZWQpIHtcclxuICAgIGlmICh0aGlzLnB1Ymxpc2hlciAmJiB0aGlzLnB1Ymxpc2hlci5tZWRpYVN0cmVhbSkge1xyXG4gICAgICB2YXIgYXVkaW9UcmFja3MgPSB0aGlzLnB1Ymxpc2hlci5tZWRpYVN0cmVhbS5nZXRBdWRpb1RyYWNrcygpO1xyXG5cclxuICAgICAgaWYgKGF1ZGlvVHJhY2tzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBhdWRpb1RyYWNrc1swXS5lbmFibGVkID0gZW5hYmxlZDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2VuZERhdGEoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci51bnJlbGlhYmxlQ2hhbm5lbC5zZW5kKFxyXG4gICAgICBKU09OLnN0cmluZ2lmeSh7IGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHNlbmREYXRhR3VhcmFudGVlZChjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKFxyXG4gICAgICBKU09OLnN0cmluZ2lmeSh7IGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSB9KVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIGJyb2FkY2FzdERhdGEoZGF0YVR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMucHVibGlzaGVyLnVucmVsaWFibGVDaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSk7XHJcbiAgfVxyXG5cclxuICBicm9hZGNhc3REYXRhR3VhcmFudGVlZChkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIucmVsaWFibGVDaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSk7XHJcbiAgfVxyXG59XHJcblxyXG5OQUYuYWRhcHRlcnMucmVnaXN0ZXIoXCJqYW51c1wiLCBKYW51c0FkYXB0ZXIpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBKYW51c0FkYXB0ZXI7XHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9pbmRleC5qcyIsIi8qKiBXaGV0aGVyIHRvIGxvZyBpbmZvcm1hdGlvbiBhYm91dCBpbmNvbWluZyBhbmQgb3V0Z29pbmcgSmFudXMgc2lnbmFscy4gKiovXG52YXIgdmVyYm9zZSA9IGZhbHNlO1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBoYW5kbGUgdG8gYSBzaW5nbGUgSmFudXMgcGx1Z2luIG9uIGEgSmFudXMgc2Vzc2lvbi4gRWFjaCBXZWJSVEMgY29ubmVjdGlvbiB0byB0aGUgSmFudXMgc2VydmVyIHdpbGwgYmVcbiAqIGFzc29jaWF0ZWQgd2l0aCBhIHNpbmdsZSBoYW5kbGUuIE9uY2UgYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgdGhpcyBoYW5kbGUgd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmVcbiAqIHVzZWQgdG8gYXNzb2NpYXRlIGl0IHdpdGggZnV0dXJlIHNpZ25hbGxpbmcgbWVzc2FnZXMuXG4gKlxuICogU2VlIGh0dHBzOi8vamFudXMuY29uZi5tZWV0ZWNoby5jb20vZG9jcy9yZXN0Lmh0bWwjaGFuZGxlcy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzUGx1Z2luSGFuZGxlKHNlc3Npb24pIHtcbiAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcbiAgdGhpcy5pZCA9IHVuZGVmaW5lZDtcbn1cblxuLyoqIEF0dGFjaGVzIHRoaXMgaGFuZGxlIHRvIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihwbHVnaW4pIHtcbiAgdmFyIHBheWxvYWQgPSB7IGphbnVzOiBcImF0dGFjaFwiLCBwbHVnaW46IHBsdWdpbiwgXCJmb3JjZS1idW5kbGVcIjogdHJ1ZSwgXCJmb3JjZS1ydGNwLW11eFwiOiB0cnVlIH07XG4gIHJldHVybiB0aGlzLnNlc3Npb24uc2VuZChwYXlsb2FkKS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqIERldGFjaGVzIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5kZXRhY2ggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImRldGFjaFwiIH0pO1xufTtcblxuLyoqXG4gKiBTZW5kcyBhIHNpZ25hbCBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oc2lnbmFsKSB7XG4gIHJldHVybiB0aGlzLnNlc3Npb24uc2VuZChPYmplY3QuYXNzaWduKHsgaGFuZGxlX2lkOiB0aGlzLmlkIH0sIHNpZ25hbCkpO1xufTtcblxuLyoqIFNlbmRzIGEgcGx1Z2luLXNwZWNpZmljIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcIm1lc3NhZ2VcIiwgYm9keTogYm9keSB9KTtcbn07XG5cbi8qKiBTZW5kcyBhIEpTRVAgb2ZmZXIgb3IgYW5zd2VyIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZEpzZXAgPSBmdW5jdGlvbihqc2VwKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJtZXNzYWdlXCIsIGJvZHk6IHt9LCBqc2VwOiBqc2VwIH0pO1xufTtcblxuLyoqIFNlbmRzIGFuIElDRSB0cmlja2xlIGNhbmRpZGF0ZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRUcmlja2xlID0gZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJ0cmlja2xlXCIsICBjYW5kaWRhdGU6IGNhbmRpZGF0ZSB9KTtcbn07XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIEphbnVzIHNlc3Npb24gLS0gYSBKYW51cyBjb250ZXh0IGZyb20gd2l0aGluIHdoaWNoIHlvdSBjYW4gb3BlbiBtdWx0aXBsZSBoYW5kbGVzIGFuZCBjb25uZWN0aW9ucy4gT25jZVxuICogY3JlYXRlZCwgdGhpcyBzZXNzaW9uIHdpbGwgYmUgZ2l2ZW4gYSB1bmlxdWUgSUQgd2hpY2ggc2hvdWxkIGJlIHVzZWQgdG8gYXNzb2NpYXRlIGl0IHdpdGggZnV0dXJlIHNpZ25hbGxpbmcgbWVzc2FnZXMuXG4gKlxuICogU2VlIGh0dHBzOi8vamFudXMuY29uZi5tZWV0ZWNoby5jb20vZG9jcy9yZXN0Lmh0bWwjc2Vzc2lvbnMuXG4gKiovXG5mdW5jdGlvbiBKYW51c1Nlc3Npb24ob3V0cHV0LCBvcHRpb25zKSB7XG4gIHRoaXMub3V0cHV0ID0gb3V0cHV0O1xuICB0aGlzLmlkID0gdW5kZWZpbmVkO1xuICB0aGlzLm5leHRUeElkID0gMDtcbiAgdGhpcy50eG5zID0ge307XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge1xuICAgIHRpbWVvdXRNczogMTAwMDAsXG4gICAga2VlcGFsaXZlTXM6IDMwMDAwXG4gIH07XG59XG5cbi8qKiBDcmVhdGVzIHRoaXMgc2Vzc2lvbiBvbiB0aGUgSmFudXMgc2VydmVyIGFuZCBzZXRzIGl0cyBJRC4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiY3JlYXRlXCIgfSkudGhlbihyZXNwID0+IHtcbiAgICB0aGlzLmlkID0gcmVzcC5kYXRhLmlkO1xuICAgIHJldHVybiByZXNwO1xuICB9KTtcbn07XG5cbi8qKiBEZXN0cm95cyB0aGlzIHNlc3Npb24uICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJkZXN0cm95XCIgfSk7XG59O1xuXG4vKipcbiAqIENhbGxiYWNrIGZvciByZWNlaXZpbmcgSlNPTiBzaWduYWxsaW5nIG1lc3NhZ2VzIHBlcnRpbmVudCB0byB0aGlzIHNlc3Npb24uIElmIHRoZSBzaWduYWxzIGFyZSByZXNwb25zZXMgdG8gcHJldmlvdXNseVxuICogc2VudCBzaWduYWxzLCB0aGUgcHJvbWlzZXMgZm9yIHRoZSBvdXRnb2luZyBzaWduYWxzIHdpbGwgYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgYXBwcm9wcmlhdGVseSB3aXRoIHRoaXMgc2lnbmFsIGFzIGFuXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBFeHRlcm5hbCBjYWxsZXJzIHNob3VsZCBjYWxsIHRoaXMgZnVuY3Rpb24gZXZlcnkgdGltZSBhIG5ldyBzaWduYWwgYXJyaXZlcyBvbiB0aGUgdHJhbnNwb3J0OyBmb3IgZXhhbXBsZSwgaW4gYVxuICogV2ViU29ja2V0J3MgYG1lc3NhZ2VgIGV2ZW50LCBvciB3aGVuIGEgbmV3IGRhdHVtIHNob3dzIHVwIGluIGFuIEhUVFAgbG9uZy1wb2xsaW5nIHJlc3BvbnNlLlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5yZWNlaXZlID0gZnVuY3Rpb24oc2lnbmFsKSB7XG4gIGlmIChtb2R1bGUuZXhwb3J0cy52ZXJib3NlKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcIkluY29taW5nIEphbnVzIHNpZ25hbDogXCIsIHNpZ25hbCk7XG4gIH1cbiAgaWYgKHNpZ25hbC50cmFuc2FjdGlvbiAhPSBudWxsKSB7XG4gICAgdmFyIGhhbmRsZXJzID0gdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgaWYgKHNpZ25hbC5qYW51cyA9PT0gXCJhY2tcIiAmJiBzaWduYWwuaGludCkge1xuICAgICAgLy8gdGhpcyBpcyBhbiBhY2sgb2YgYW4gYXN5bmNocm9ub3VzbHktcHJvY2Vzc2VkIHJlcXVlc3QsIHdlIHNob3VsZCB3YWl0XG4gICAgICAvLyB0byByZXNvbHZlIHRoZSBwcm9taXNlIHVudGlsIHRoZSBhY3R1YWwgcmVzcG9uc2UgY29tZXMgaW5cbiAgICB9IGVsc2UgaWYgKGhhbmRsZXJzICE9IG51bGwpIHtcbiAgICAgIGlmIChoYW5kbGVycy50aW1lb3V0ICE9IG51bGwpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGhhbmRsZXJzLnRpbWVvdXQpO1xuICAgICAgfVxuICAgICAgZGVsZXRlIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgICAgKHNpZ25hbC5qYW51cyA9PT0gXCJlcnJvclwiID8gaGFuZGxlcnMucmVqZWN0IDogaGFuZGxlcnMucmVzb2x2ZSkoc2lnbmFsKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogU2VuZHMgYSBzaWduYWwgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2Vzc2lvbi4gU2lnbmFscyBzaG91bGQgYmUgSlNPTi1zZXJpYWxpemFibGUgb2JqZWN0cy4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsXG4gKiBiZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgdG8gdGhpcyBzaWduYWwgaXMgcmVjZWl2ZWQsIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZVxuICogc2Vzc2lvbiB0aW1lb3V0LlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24oc2lnbmFsKSB7XG4gIGlmIChtb2R1bGUuZXhwb3J0cy52ZXJib3NlKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcIk91dGdvaW5nIEphbnVzIHNpZ25hbDogXCIsIHNpZ25hbCk7XG4gIH1cbiAgc2lnbmFsID0gT2JqZWN0LmFzc2lnbih7XG4gICAgc2Vzc2lvbl9pZDogdGhpcy5pZCxcbiAgICB0cmFuc2FjdGlvbjogKHRoaXMubmV4dFR4SWQrKykudG9TdHJpbmcoKVxuICB9LCBzaWduYWwpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVvdXRNcykge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJTaWduYWxsaW5nIG1lc3NhZ2UgdGltZWQgb3V0LlwiKSk7XG4gICAgICB9LCB0aGlzLm9wdGlvbnMudGltZW91dE1zKTtcbiAgICB9XG4gICAgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl0gPSB7IHJlc29sdmU6IHJlc29sdmUsIHJlamVjdDogcmVqZWN0LCB0aW1lb3V0OiB0aW1lb3V0IH07XG4gICAgdGhpcy5vdXRwdXQoSlNPTi5zdHJpbmdpZnkoc2lnbmFsKSk7XG4gICAgdGhpcy5fcmVzZXRLZWVwYWxpdmUoKTtcbiAgfSk7XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9yZXNldEtlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5rZWVwYWxpdmVUaW1lb3V0KSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMua2VlcGFsaXZlVGltZW91dCk7XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcykge1xuICAgIHRoaXMua2VlcGFsaXZlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fa2VlcGFsaXZlKCksIHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcyk7XG4gIH1cbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX2tlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwia2VlcGFsaXZlXCIgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgSmFudXNQbHVnaW5IYW5kbGUsXG4gIEphbnVzU2Vzc2lvbixcbiAgdmVyYm9zZVxufTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL21pbmlqYW51cy9taW5pamFudXMuanNcbi8vIG1vZHVsZSBpZCA9IDFcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sInNvdXJjZVJvb3QiOiIifQ==