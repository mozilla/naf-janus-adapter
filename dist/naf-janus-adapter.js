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
      // @TODO either this should wait or setLocalMediaStream should renegotiate (or both)
      if (_this3.localMediaStream) {
        mediaStream = _this3.localMediaStream;
        peerConnection.addStream(_this3.localMediaStream);
      } else {
        console.warn("localMediaStream not set. Will not publish audio or video");
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
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
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


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgM2I5Mzc0ZjdiZDg5NjAxNmJkMWIiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzIl0sIm5hbWVzIjpbIm1qIiwicmVxdWlyZSIsInJhbmRvbVVpbnQiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwid2FpdEZvckV2ZW50IiwidGFyZ2V0IiwiZXZlbnQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwib25jZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJscyIsIkphbnVzQWRhcHRlciIsImNvbnN0cnVjdG9yIiwicm9vbSIsInVzZXJJZCIsInNlcnZlclVybCIsIndlYlJ0Y09wdGlvbnMiLCJ3cyIsInNlc3Npb24iLCJwdWJsaXNoZXIiLCJvY2N1cGFudHMiLCJvY2N1cGFudFByb21pc2VzIiwib25XZWJzb2NrZXRNZXNzYWdlIiwiYmluZCIsIm9uRGF0YUNoYW5uZWxNZXNzYWdlIiwic2V0U2VydmVyVXJsIiwidXJsIiwic2V0QXBwIiwiYXBwIiwic2V0Um9vbSIsInJvb21OYW1lIiwicGFyc2VJbnQiLCJFcnJvciIsInNldFdlYlJ0Y09wdGlvbnMiLCJvcHRpb25zIiwic2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyIsInN1Y2Nlc3NMaXN0ZW5lciIsImZhaWx1cmVMaXN0ZW5lciIsImNvbm5lY3RTdWNjZXNzIiwiY29ubmVjdEZhaWx1cmUiLCJzZXRSb29tT2NjdXBhbnRMaXN0ZW5lciIsIm9jY3VwYW50TGlzdGVuZXIiLCJvbk9jY3VwYW50c0NoYW5nZWQiLCJzZXREYXRhQ2hhbm5lbExpc3RlbmVycyIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwib25PY2N1cGFudENvbm5lY3RlZCIsIm9uT2NjdXBhbnREaXNjb25uZWN0ZWQiLCJvbk9jY3VwYW50TWVzc2FnZSIsImNvbm5lY3QiLCJXZWJTb2NrZXQiLCJKYW51c1Nlc3Npb24iLCJzZW5kIiwiXyIsIm9uV2Vic29ja2V0T3BlbiIsImNyZWF0ZSIsInB1Ymxpc2hlclByb21pc2UiLCJjcmVhdGVQdWJsaXNoZXIiLCJvY2N1cGFudElkIiwiaW5pdGlhbE9jY3VwYW50cyIsImFkZE9jY3VwYW50IiwibWVzc2FnZSIsIkpTT04iLCJwYXJzZSIsImRhdGEiLCJyZWNlaXZlIiwicGx1Z2luZGF0YSIsInVzZXJfaWQiLCJyZW1vdmVPY2N1cGFudCIsInN1YnNjcmliZXIiLCJjcmVhdGVTdWJzY3JpYmVyIiwiaGFuZGxlIiwiSmFudXNQbHVnaW5IYW5kbGUiLCJhdHRhY2giLCJwZWVyQ29ubmVjdGlvbiIsIlJUQ1BlZXJDb25uZWN0aW9uIiwic2VuZFRyaWNrbGUiLCJjYW5kaWRhdGUiLCJ1bnJlbGlhYmxlQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwib3JkZXJlZCIsIm1heFJldHJhbnNtaXRzIiwicmVsaWFibGVDaGFubmVsIiwibWVkaWFTdHJlYW0iLCJsb2NhbE1lZGlhU3RyZWFtIiwiYWRkU3RyZWFtIiwiY29uc29sZSIsIndhcm4iLCJvZmZlciIsImNyZWF0ZU9mZmVyIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsImFuc3dlciIsInNlbmRKc2VwIiwic2V0UmVtb3RlRGVzY3JpcHRpb24iLCJqc2VwIiwic2VuZEpvaW4iLCJub3RpZmljYXRpb25zIiwicmVzcG9uc2UiLCJ1c2VycyIsIm9mZmVyVG9SZWNlaXZlQXVkaW8iLCJvZmZlclRvUmVjZWl2ZVZpZGVvIiwibWVkaWEiLCJzdHJlYW1zIiwiZ2V0UmVtb3RlU3RyZWFtcyIsImxlbmd0aCIsInJvb21JZCIsInN1YnNjcmliZSIsInNlbmRNZXNzYWdlIiwia2luZCIsInJvb21faWQiLCJkYXRhVHlwZSIsInNob3VsZFN0YXJ0Q29ubmVjdGlvblRvIiwiY2xpZW50SWQiLCJzdGFydFN0cmVhbUNvbm5lY3Rpb24iLCJjbG9zZVN0cmVhbUNvbm5lY3Rpb24iLCJnZXRDb25uZWN0U3RhdHVzIiwiTkFGIiwiYWRhcHRlcnMiLCJJU19DT05ORUNURUQiLCJOT1RfQ09OTkVDVEVEIiwiZ2V0TWVkaWFTdHJlYW0iLCJvY2N1cGFudFByb21pc2UiLCJ0aGVuIiwicyIsInNldExvY2FsTWVkaWFTdHJlYW0iLCJzdHJlYW0iLCJlbmFibGVNaWNyb3Bob25lIiwiZW5hYmxlZCIsImF1ZGlvVHJhY2tzIiwiZ2V0QXVkaW9UcmFja3MiLCJzZW5kRGF0YSIsInN0cmluZ2lmeSIsInNlbmREYXRhR3VhcmFudGVlZCIsImJyb2FkY2FzdERhdGEiLCJicm9hZGNhc3REYXRhR3VhcmFudGVlZCIsInJlZ2lzdGVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7QUM3REEsSUFBSUEsS0FBSyxtQkFBQUMsQ0FBUSxDQUFSLENBQVQ7O0FBRUEsU0FBU0MsVUFBVCxHQUFzQjtBQUNwQixTQUFPQyxLQUFLQyxLQUFMLENBQVdELEtBQUtFLE1BQUwsS0FBZ0JDLE9BQU9DLGdCQUFsQyxDQUFQO0FBQ0Q7O0FBRUQsU0FBU0MsWUFBVCxDQUFzQkMsTUFBdEIsRUFBOEJDLEtBQTlC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QUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQixxQkFBcUI7QUFDekM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJuYWYtamFudXMtYWRhcHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIDNiOTM3NGY3YmQ4OTYwMTZiZDFiIiwidmFyIG1qID0gcmVxdWlyZShcIm1pbmlqYW51c1wiKTtcclxuXHJcbmZ1bmN0aW9uIHJhbmRvbVVpbnQoKSB7XHJcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKTtcclxufVxyXG5cclxuZnVuY3Rpb24gd2FpdEZvckV2ZW50KHRhcmdldCwgZXZlbnQpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGUgPT4gcmVzb2x2ZShlKSwgeyBvbmNlOiB0cnVlIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5jb25zdCBQRUVSX0NPTk5FQ1RJT05fQ09ORklHID0ge1xyXG4gIGljZVNlcnZlcnM6IFtcclxuICAgIHsgdXJsczogXCJzdHVuOnN0dW4xLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXHJcbiAgICB7IHVybHM6IFwic3R1bjpzdHVuMi5sLmdvb2dsZS5jb206MTkzMDJcIiB9XHJcbiAgXVxyXG59O1xyXG5cclxuY2xhc3MgSmFudXNBZGFwdGVyIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMucm9vbSA9IG51bGw7XHJcbiAgICB0aGlzLnVzZXJJZCA9IHJhbmRvbVVpbnQoKTtcclxuXHJcbiAgICB0aGlzLnNlcnZlclVybCA9IG51bGw7XHJcbiAgICB0aGlzLndlYlJ0Y09wdGlvbnMgPSB7fTtcclxuICAgIHRoaXMud3MgPSBudWxsO1xyXG4gICAgdGhpcy5zZXNzaW9uID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLnB1Ymxpc2hlciA9IG51bGw7XHJcbiAgICB0aGlzLm9jY3VwYW50cyA9IHt9O1xyXG4gICAgdGhpcy5vY2N1cGFudFByb21pc2VzID0ge307XHJcblxyXG4gICAgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UgPSB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZS5iaW5kKHRoaXMpO1xyXG4gICAgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSA9IHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UuYmluZCh0aGlzKTtcclxuICB9XHJcblxyXG4gIHNldFNlcnZlclVybCh1cmwpIHtcclxuICAgIHRoaXMuc2VydmVyVXJsID0gdXJsO1xyXG4gIH1cclxuXHJcbiAgc2V0QXBwKGFwcCkge31cclxuXHJcbiAgc2V0Um9vbShyb29tTmFtZSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgdGhpcy5yb29tID0gcGFyc2VJbnQocm9vbU5hbWUpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSb29tIG11c3QgYmUgYSBwb3NpdGl2ZSBpbnRlZ2VyLlwiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldFdlYlJ0Y09wdGlvbnMob3B0aW9ucykge1xyXG4gICAgdGhpcy53ZWJSdGNPcHRpb25zID0gb3B0aW9ucztcclxuICB9XHJcblxyXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcclxuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XHJcbiAgICB0aGlzLmNvbm5lY3RGYWlsdXJlID0gZmFpbHVyZUxpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgc2V0Um9vbU9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQgPSBvY2N1cGFudExpc3RlbmVyO1xyXG4gIH1cclxuXHJcbiAgc2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQgPSBvcGVuTGlzdGVuZXI7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnREaXNjb25uZWN0ZWQgPSBjbG9zZWRMaXN0ZW5lcjtcclxuICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UgPSBtZXNzYWdlTGlzdGVuZXI7XHJcbiAgfVxyXG5cclxuICBjb25uZWN0KCkge1xyXG4gICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJVcmwsIFwiamFudXMtcHJvdG9jb2xcIik7XHJcbiAgICB0aGlzLnNlc3Npb24gPSBuZXcgbWouSmFudXNTZXNzaW9uKHRoaXMud3Muc2VuZC5iaW5kKHRoaXMud3MpKTtcclxuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgXyA9PiB0aGlzLm9uV2Vic29ja2V0T3BlbigpKTtcclxuICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgb25XZWJzb2NrZXRPcGVuKCkge1xyXG4gICAgLy8gQ3JlYXRlIHRoZSBKYW51cyBTZXNzaW9uXHJcbiAgICBhd2FpdCB0aGlzLnNlc3Npb24uY3JlYXRlKCk7XHJcblxyXG4gICAgLy8gQXR0YWNoIHRoZSBTRlUgUGx1Z2luIGFuZCBjcmVhdGUgYSBSVENQZWVyQ29ubmVjdGlvbiBmb3IgdGhlIHB1Ymxpc2hlci5cclxuICAgIC8vIFRoZSBwdWJsaXNoZXIgc2VuZHMgYXVkaW8gYW5kIG9wZW5zIHR3byBiaWRpcmVjdGlvbmFsIGRhdGEgY2hhbm5lbHMuXHJcbiAgICAvLyBPbmUgcmVsaWFibGUgZGF0YWNoYW5uZWwgYW5kIG9uZSB1bnJlbGlhYmxlLlxyXG4gICAgdmFyIHB1Ymxpc2hlclByb21pc2UgPSB0aGlzLmNyZWF0ZVB1Ymxpc2hlcigpO1xyXG4gICAgdGhpcy5vY2N1cGFudFByb21pc2VzW3RoaXMudXNlcklkXSA9IHB1Ymxpc2hlclByb21pc2U7XHJcbiAgICB0aGlzLnB1Ymxpc2hlciA9IGF3YWl0IHB1Ymxpc2hlclByb21pc2U7XHJcblxyXG4gICAgdGhpcy5jb25uZWN0U3VjY2Vzcyh0aGlzLnVzZXJJZCk7XHJcblxyXG4gICAgLy8gQWRkIGFsbCBvZiB0aGUgaW5pdGlhbCBvY2N1cGFudHMuXHJcbiAgICBmb3IgKGxldCBvY2N1cGFudElkIG9mIHRoaXMucHVibGlzaGVyLmluaXRpYWxPY2N1cGFudHMpIHtcclxuICAgICAgaWYgKG9jY3VwYW50SWQgIT09IHRoaXMudXNlcklkKSB7XHJcbiAgICAgICAgdGhpcy5vY2N1cGFudFByb21pc2VzW29jY3VwYW50SWRdID0gdGhpcy5hZGRPY2N1cGFudChvY2N1cGFudElkKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25XZWJzb2NrZXRNZXNzYWdlKGV2ZW50KSB7XHJcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XHJcbiAgICB0aGlzLnNlc3Npb24ucmVjZWl2ZShtZXNzYWdlKTtcclxuXHJcbiAgICAvLyBIYW5kbGUgYWxsIG9mIHRoZSBqb2luIGFuZCBsZWF2ZSBldmVudHMgZnJvbSB0aGUgcHVibGlzaGVyLlxyXG4gICAgaWYgKG1lc3NhZ2UucGx1Z2luZGF0YSAmJiBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YSkge1xyXG4gICAgICB2YXIgZGF0YSA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhO1xyXG5cclxuICAgICAgaWYgKGRhdGEuZXZlbnQgPT09IFwiam9pblwiKSB7XHJcbiAgICAgICAgdGhpcy5vY2N1cGFudFByb21pc2VzW2RhdGEudXNlcl9pZF0gPSB0aGlzLmFkZE9jY3VwYW50KGRhdGEudXNlcl9pZCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5ldmVudCAmJiBkYXRhLmV2ZW50ID09PSBcImxlYXZlXCIpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZU9jY3VwYW50KGRhdGEudXNlcl9pZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGFkZE9jY3VwYW50KG9jY3VwYW50SWQpIHtcclxuICAgIHZhciBzdWJzY3JpYmVyID0gYXdhaXQgdGhpcy5jcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpO1xyXG4gICAgLy8gQ2FsbCB0aGUgTmV0d29ya2VkIEFGcmFtZSBjYWxsYmFja3MgZm9yIHRoZSBuZXcgb2NjdXBhbnQuXHJcbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQob2NjdXBhbnRJZCk7XHJcbiAgICB0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSA9IHRydWU7XHJcbiAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XHJcbiAgICByZXR1cm4gc3Vic2NyaWJlcjtcclxuICB9XHJcblxyXG4gIHJlbW92ZU9jY3VwYW50KG9jY3VwYW50SWQpIHtcclxuICAgIGlmICh0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSkge1xyXG4gICAgICBkZWxldGUgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF07XHJcbiAgICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgcmVtb3ZlZCBvY2N1cGFudC5cclxuICAgICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkKG9jY3VwYW50SWQpO1xyXG4gICAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVQdWJsaXNoZXIoKSB7XHJcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XHJcbiAgICBhd2FpdCBoYW5kbGUuYXR0YWNoKFwiamFudXMucGx1Z2luLnNmdVwiKTtcclxuXHJcbiAgICB2YXIgcGVlckNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XHJcblxyXG4gICAgcGVlckNvbm5lY3Rpb24uYWRkRXZlbnRMaXN0ZW5lcihcImljZWNhbmRpZGF0ZVwiLCBldmVudCA9PiB7XHJcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldmVudC5jYW5kaWRhdGUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuIHVucmVsaWFibGUgZGF0YWNoYW5uZWwgZm9yIHNlbmRpbmcgYW5kIHJlY2VpdmluZyBjb21wb25lbnQgdXBkYXRlcywgZXRjLlxyXG4gICAgdmFyIHVucmVsaWFibGVDaGFubmVsID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJ1bnJlbGlhYmxlXCIsIHtcclxuICAgICAgb3JkZXJlZDogZmFsc2UsXHJcbiAgICAgIG1heFJldHJhbnNtaXRzOiAwXHJcbiAgICB9KTtcclxuICAgIHVucmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIHJlbGlhYmxlIGRhdGFjaGFubmVsIGZvciBzZW5kaW5nIGFuZCByZWNpZXZpbmcgZW50aXR5IGluc3RhbnRpYXRpb25zLCBldGMuXHJcbiAgICB2YXIgcmVsaWFibGVDaGFubmVsID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJyZWxpYWJsZVwiLCB7XHJcbiAgICAgIG9yZGVyZWQ6IHRydWVcclxuICAgIH0pO1xyXG4gICAgcmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xyXG5cclxuICAgIHZhciBtZWRpYVN0cmVhbTtcclxuICAgIC8vIEBUT0RPIGVpdGhlciB0aGlzIHNob3VsZCB3YWl0IG9yIHNldExvY2FsTWVkaWFTdHJlYW0gc2hvdWxkIHJlbmVnb3RpYXRlIChvciBib3RoKVxyXG4gICAgaWYgKHRoaXMubG9jYWxNZWRpYVN0cmVhbSkge1xyXG4gICAgICBtZWRpYVN0cmVhbSA9IHRoaXMubG9jYWxNZWRpYVN0cmVhbTtcclxuICAgICAgcGVlckNvbm5lY3Rpb24uYWRkU3RyZWFtKHRoaXMubG9jYWxNZWRpYVN0cmVhbSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc29sZS53YXJuKFwibG9jYWxNZWRpYVN0cmVhbSBub3Qgc2V0LiBXaWxsIG5vdCBwdWJsaXNoIGF1ZGlvIG9yIHZpZGVvXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBvZmZlciA9IGF3YWl0IHBlZXJDb25uZWN0aW9uLmNyZWF0ZU9mZmVyKCk7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG9mZmVyKTtcclxuXHJcbiAgICB2YXIgYW5zd2VyID0gYXdhaXQgaGFuZGxlLnNlbmRKc2VwKG9mZmVyKTtcclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKGFuc3dlci5qc2VwKTtcclxuXHJcbiAgICAvLyBXYWl0IGZvciB0aGUgcmVsaWFibGUgZGF0YWNoYW5uZWwgdG8gYmUgb3BlbiBiZWZvcmUgd2Ugc3RhcnQgc2VuZGluZyBtZXNzYWdlcyBvbiBpdC5cclxuICAgIGF3YWl0IHdhaXRGb3JFdmVudChyZWxpYWJsZUNoYW5uZWwsIFwib3BlblwiKTtcclxuXHJcbiAgICAvLyBTZW5kIGpvaW4gbWVzc2FnZSB0byBqYW51cy4gTGlzdGVuIGZvciBqb2luL2xlYXZlIG1lc3NhZ2VzLiBBdXRvbWF0aWNhbGx5IHN1YnNjcmliZSB0byBhbGwgdXNlcnMnIFdlYlJUQyBkYXRhLlxyXG4gICAgdmFyIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnNlbmRKb2luKGhhbmRsZSwgdGhpcy5yb29tLCB0aGlzLnVzZXJJZCwge25vdGlmaWNhdGlvbnM6IHRydWUsIGRhdGE6IHRydWV9KTtcclxuXHJcbiAgICB2YXIgaW5pdGlhbE9jY3VwYW50cyA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhLnJlc3BvbnNlLnVzZXJzW3RoaXMucm9vbV07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgaGFuZGxlLFxyXG4gICAgICBpbml0aWFsT2NjdXBhbnRzLFxyXG4gICAgICByZWxpYWJsZUNoYW5uZWwsXHJcbiAgICAgIHVucmVsaWFibGVDaGFubmVsLFxyXG4gICAgICBtZWRpYVN0cmVhbSxcclxuICAgICAgcGVlckNvbm5lY3Rpb25cclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpIHtcclxuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcclxuICAgIGF3YWl0IGhhbmRsZS5hdHRhY2goXCJqYW51cy5wbHVnaW4uc2Z1XCIpO1xyXG5cclxuICAgIHZhciBwZWVyQ29ubmVjdGlvbiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcclxuXHJcbiAgICBwZWVyQ29ubmVjdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ZW50ID0+IHtcclxuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2ZW50LmNhbmRpZGF0ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgb2ZmZXIgPSBhd2FpdCBwZWVyQ29ubmVjdGlvbi5jcmVhdGVPZmZlcih7XHJcbiAgICAgIG9mZmVyVG9SZWNlaXZlQXVkaW86IHRydWUsXHJcbiAgICAgIG9mZmVyVG9SZWNlaXZlVmlkZW86IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIGF3YWl0IHBlZXJDb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24ob2ZmZXIpO1xyXG4gICAgdmFyIGFuc3dlciA9IGF3YWl0IGhhbmRsZS5zZW5kSnNlcChvZmZlcik7XHJcbiAgICBhd2FpdCBwZWVyQ29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihhbnN3ZXIuanNlcCk7XHJcblxyXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIERvbid0IGxpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gU3Vic2NyaWJlIHRvIHRoZSBvY2N1cGFudCdzIGF1ZGlvIHN0cmVhbS5cclxuICAgIGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB0aGlzLnJvb20sIHRoaXMudXNlcklkLCB7IG5vdGlmaWNhdGlvbnM6IGZhbHNlLCBtZWRpYTogb2NjdXBhbnRJZCB9KTtcclxuXHJcbiAgICAvLyBHZXQgdGhlIG9jY3VwYW50J3MgYXVkaW8gc3RyZWFtLlxyXG4gICAgdmFyIHN0cmVhbXMgPSBwZWVyQ29ubmVjdGlvbi5nZXRSZW1vdGVTdHJlYW1zKCk7XHJcbiAgICB2YXIgbWVkaWFTdHJlYW0gPSBzdHJlYW1zLmxlbmd0aCA+IDAgPyBzdHJlYW1zWzBdIDogbnVsbDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBoYW5kbGUsXHJcbiAgICAgIG1lZGlhU3RyZWFtLFxyXG4gICAgICBwZWVyQ29ubmVjdGlvblxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHNlbmRKb2luKGhhbmRsZSwgcm9vbUlkLCB1c2VySWQsIHN1YnNjcmliZSkge1xyXG4gICAgcmV0dXJuIGhhbmRsZS5zZW5kTWVzc2FnZSh7XHJcbiAgICAgIGtpbmQ6IFwiam9pblwiLFxyXG4gICAgICByb29tX2lkOiByb29tSWQsXHJcbiAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcclxuICAgICAgc3Vic2NyaWJlXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG9uRGF0YUNoYW5uZWxNZXNzYWdlKGV2ZW50KSB7XHJcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2UuZGF0YVR5cGUpIHtcclxuICAgICAgdGhpcy5vbk9jY3VwYW50TWVzc2FnZShudWxsLCBtZXNzYWdlLmRhdGFUeXBlLCBtZXNzYWdlLmRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2hvdWxkU3RhcnRDb25uZWN0aW9uVG8oY2xpZW50SWQpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7fVxyXG5cclxuICBjbG9zZVN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHt9XHJcblxyXG4gIGdldENvbm5lY3RTdGF0dXMoY2xpZW50SWQpIHtcclxuICAgIGlmICh0aGlzLm9jY3VwYW50c1tjbGllbnRJZF0pIHtcclxuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkge1xyXG4gICAgdmFyIG9jY3VwYW50UHJvbWlzZSA9IHRoaXMub2NjdXBhbnRQcm9taXNlc1tjbGllbnRJZF07XHJcblxyXG4gICAgaWYgKCFvY2N1cGFudFByb21pc2UpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxyXG4gICAgICAgIG5ldyBFcnJvcihgU3Vic2NyaWJlciBmb3IgY2xpZW50OiAke2NsaWVudElkfSBkb2VzIG5vdCBleGlzdC5gKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBvY2N1cGFudFByb21pc2UudGhlbihzID0+IHMubWVkaWFTdHJlYW0pO1xyXG4gIH1cclxuXHJcbiAgc2V0TG9jYWxNZWRpYVN0cmVhbShzdHJlYW0pIHtcclxuICAgIGlmICh0aGlzLnB1Ymxpc2hlcikge1xyXG4gICAgICBjb25zb2xlLndhcm4oXCJzZXRMb2NhbE1lZGlhU3RyZWFtIGNhbGxlZCBhZnRlciBwdWJsaXNoZXIgY3JlYXRlZC4gV2lsbCBub3QgcHVibGlzaCBuZXcgc3RyZWFtLlwiKTtcclxuICAgIH1cclxuICAgIC8vIEBUT0RPIHRoaXMgc2hvdWxkIGhhbmRsZSByZW5lZ290aWF0aW5nIHRoZSBwdWJsaXNoZXIgY29ubmVjdGlvbiBpZiBpdCBoYXMgYWxyZWFkeSBiZWVuIG1hZGVcclxuICAgIHRoaXMubG9jYWxNZWRpYVN0cmVhbSA9IHN0cmVhbTtcclxuICB9XHJcblxyXG4gIGVuYWJsZU1pY3JvcGhvbmUoZW5hYmxlZCkge1xyXG4gICAgaWYgKHRoaXMucHVibGlzaGVyICYmIHRoaXMucHVibGlzaGVyLm1lZGlhU3RyZWFtKSB7XHJcbiAgICAgIHZhciBhdWRpb1RyYWNrcyA9IHRoaXMucHVibGlzaGVyLm1lZGlhU3RyZWFtLmdldEF1ZGlvVHJhY2tzKCk7XHJcblxyXG4gICAgICBpZiAoYXVkaW9UcmFja3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGF1ZGlvVHJhY2tzWzBdLmVuYWJsZWQgPSBlbmFibGVkO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YShjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcclxuICAgIHRoaXMucHVibGlzaGVyLnVucmVsaWFibGVDaGFubmVsLnNlbmQoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgc2VuZERhdGFHdWFyYW50ZWVkKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIucmVsaWFibGVDaGFubmVsLnNlbmQoXHJcbiAgICAgIEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgYnJvYWRjYXN0RGF0YShkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcclxuICB9XHJcblxyXG4gIGJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcclxuICB9XHJcbn1cclxuXHJcbk5BRi5hZGFwdGVycy5yZWdpc3RlcihcImphbnVzXCIsIEphbnVzQWRhcHRlcik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEphbnVzQWRhcHRlcjtcclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2luZGV4LmpzIiwiLyoqIFdoZXRoZXIgdG8gbG9nIGluZm9ybWF0aW9uIGFib3V0IGluY29taW5nIGFuZCBvdXRnb2luZyBKYW51cyBzaWduYWxzLiAqKi9cbnZhciB2ZXJib3NlID0gZmFsc2U7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGhhbmRsZSB0byBhIHNpbmdsZSBKYW51cyBwbHVnaW4gb24gYSBKYW51cyBzZXNzaW9uLiBFYWNoIFdlYlJUQyBjb25uZWN0aW9uIHRvIHRoZSBKYW51cyBzZXJ2ZXIgd2lsbCBiZVxuICogYXNzb2NpYXRlZCB3aXRoIGEgc2luZ2xlIGhhbmRsZS4gT25jZSBhdHRhY2hlZCB0byB0aGUgc2VydmVyLCB0aGlzIGhhbmRsZSB3aWxsIGJlIGdpdmVuIGEgdW5pcXVlIElEIHdoaWNoIHNob3VsZCBiZVxuICogdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNoYW5kbGVzLlxuICoqL1xuZnVuY3Rpb24gSmFudXNQbHVnaW5IYW5kbGUoc2Vzc2lvbikge1xuICB0aGlzLnNlc3Npb24gPSBzZXNzaW9uO1xuICB0aGlzLmlkID0gdW5kZWZpbmVkO1xufVxuXG4vKiogQXR0YWNoZXMgdGhpcyBoYW5kbGUgdG8gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmF0dGFjaCA9IGZ1bmN0aW9uKHBsdWdpbikge1xuICB2YXIgcGF5bG9hZCA9IHsgamFudXM6IFwiYXR0YWNoXCIsIHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwiZGV0YWNoXCIgfSk7XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gU2lnbmFscyBzaG91bGQgYmUgSlNPTi1zZXJpYWxpemFibGUgb2JqZWN0cy4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsXG4gKiBiZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgdG8gdGhpcyBzaWduYWwgaXMgcmVjZWl2ZWQsIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZVxuICogc2Vzc2lvbiB0aW1lb3V0LlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKE9iamVjdC5hc3NpZ24oeyBoYW5kbGVfaWQ6IHRoaXMuaWQgfSwgc2lnbmFsKSk7XG59O1xuXG4vKiogU2VuZHMgYSBwbHVnaW4tc3BlY2lmaWMgbWVzc2FnZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oYm9keSkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwibWVzc2FnZVwiLCBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcIm1lc3NhZ2VcIiwgYm9keToge30sIGpzZXA6IGpzZXAgfSk7XG59O1xuXG4vKiogU2VuZHMgYW4gSUNFIHRyaWNrbGUgY2FuZGlkYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhhbmRsZS4gKiovXG5KYW51c1BsdWdpbkhhbmRsZS5wcm90b3R5cGUuc2VuZFRyaWNrbGUgPSBmdW5jdGlvbihjYW5kaWRhdGUpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcInRyaWNrbGVcIiwgIGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7XG4gICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICBrZWVwYWxpdmVNczogMzAwMDBcbiAgfTtcbn1cblxuLyoqIENyZWF0ZXMgdGhpcyBzZXNzaW9uIG9uIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoeyBqYW51czogXCJjcmVhdGVcIiB9KS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqIERlc3Ryb3lzIHRoaXMgc2Vzc2lvbi4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZCh7IGphbnVzOiBcImRlc3Ryb3lcIiB9KTtcbn07XG5cbi8qKlxuICogV2hldGhlciB0aGlzIHNpZ25hbCByZXByZXNlbnRzIGFuIGVycm9yLCBhbmQgdGhlIGFzc29jaWF0ZWQgcHJvbWlzZSAoaWYgYW55KSBzaG91bGQgYmUgcmVqZWN0ZWQuXG4gKiBVc2VycyBzaG91bGQgb3ZlcnJpZGUgdGhpcyB0byBoYW5kbGUgYW55IGN1c3RvbSBwbHVnaW4tc3BlY2lmaWMgZXJyb3IgY29udmVudGlvbnMuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmlzRXJyb3IgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHNpZ25hbC5qYW51cyA9PT0gXCJlcnJvclwiO1xufTtcblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgcmVjZWl2aW5nIEpTT04gc2lnbmFsbGluZyBtZXNzYWdlcyBwZXJ0aW5lbnQgdG8gdGhpcyBzZXNzaW9uLiBJZiB0aGUgc2lnbmFscyBhcmUgcmVzcG9uc2VzIHRvIHByZXZpb3VzbHlcbiAqIHNlbnQgc2lnbmFscywgdGhlIHByb21pc2VzIGZvciB0aGUgb3V0Z29pbmcgc2lnbmFscyB3aWxsIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIGFwcHJvcHJpYXRlbHkgd2l0aCB0aGlzIHNpZ25hbCBhcyBhblxuICogYXJndW1lbnQuXG4gKlxuICogRXh0ZXJuYWwgY2FsbGVycyBzaG91bGQgY2FsbCB0aGlzIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgYSBuZXcgc2lnbmFsIGFycml2ZXMgb24gdGhlIHRyYW5zcG9ydDsgZm9yIGV4YW1wbGUsIGluIGFcbiAqIFdlYlNvY2tldCdzIGBtZXNzYWdlYCBldmVudCwgb3Igd2hlbiBhIG5ldyBkYXR1bSBzaG93cyB1cCBpbiBhbiBIVFRQIGxvbmctcG9sbGluZyByZXNwb25zZS5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUucmVjZWl2ZSA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAobW9kdWxlLmV4cG9ydHMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJJbmNvbWluZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIGlmIChzaWduYWwudHJhbnNhY3Rpb24gIT0gbnVsbCkge1xuICAgIHZhciBoYW5kbGVycyA9IHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgIGlmIChzaWduYWwuamFudXMgPT09IFwiYWNrXCIgJiYgc2lnbmFsLmhpbnQpIHtcbiAgICAgIC8vIHRoaXMgaXMgYW4gYWNrIG9mIGFuIGFzeW5jaHJvbm91c2x5LXByb2Nlc3NlZCByZXF1ZXN0LCB3ZSBzaG91bGQgd2FpdFxuICAgICAgLy8gdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB1bnRpbCB0aGUgYWN0dWFsIHJlc3BvbnNlIGNvbWVzIGluXG4gICAgfSBlbHNlIGlmIChoYW5kbGVycyAhPSBudWxsKSB7XG4gICAgICBpZiAoaGFuZGxlcnMudGltZW91dCAhPSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChoYW5kbGVycy50aW1lb3V0KTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAgICh0aGlzLmlzRXJyb3Ioc2lnbmFsKSA/IGhhbmRsZXJzLnJlamVjdCA6IGhhbmRsZXJzLnJlc29sdmUpKHNpZ25hbCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb24uIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAodGhpcy5pZCAhPSBudWxsKSB7IC8vIHRoaXMuaWQgaXMgdW5kZWZpbmVkIGluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlbiB3ZSdyZSBzZW5kaW5nIHRoZSBzZXNzaW9uIGNyZWF0ZSBtZXNzYWdlXG4gICAgc2lnbmFsID0gT2JqZWN0LmFzc2lnbih7IHNlc3Npb25faWQ6IHRoaXMuaWQgfSwgc2lnbmFsKTtcbiAgfVxuICBzaWduYWwgPSBPYmplY3QuYXNzaWduKHsgdHJhbnNhY3Rpb246ICh0aGlzLm5leHRUeElkKyspLnRvU3RyaW5nKCkgfSwgc2lnbmFsKTtcbiAgaWYgKG1vZHVsZS5leHBvcnRzLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiT3V0Z29pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVvdXRNcykge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJTaWduYWxsaW5nIG1lc3NhZ2UgdGltZWQgb3V0LlwiKSk7XG4gICAgICB9LCB0aGlzLm9wdGlvbnMudGltZW91dE1zKTtcbiAgICB9XG4gICAgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl0gPSB7IHJlc29sdmU6IHJlc29sdmUsIHJlamVjdDogcmVqZWN0LCB0aW1lb3V0OiB0aW1lb3V0IH07XG4gICAgdGhpcy5vdXRwdXQoSlNPTi5zdHJpbmdpZnkoc2lnbmFsKSk7XG4gICAgdGhpcy5fcmVzZXRLZWVwYWxpdmUoKTtcbiAgfSk7XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9yZXNldEtlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5rZWVwYWxpdmVUaW1lb3V0KSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMua2VlcGFsaXZlVGltZW91dCk7XG4gIH1cbiAgaWYgKHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcykge1xuICAgIHRoaXMua2VlcGFsaXZlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fa2VlcGFsaXZlKCksIHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcyk7XG4gIH1cbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX2tlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKHsgamFudXM6IFwia2VlcGFsaXZlXCIgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgSmFudXNQbHVnaW5IYW5kbGUsXG4gIEphbnVzU2Vzc2lvbixcbiAgdmVyYm9zZVxufTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL21pbmlqYW51cy9taW5pamFudXMuanNcbi8vIG1vZHVsZSBpZCA9IDFcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sInNvdXJjZVJvb3QiOiIifQ==