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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var mj = __webpack_require__(2);
var debug = __webpack_require__(0)("naf-janus-adapter:debug");
var warn = __webpack_require__(0)("naf-janus-adapter:warn");
var error = __webpack_require__(0)("naf-janus-adapter:error");

function debounce(fn) {
  var curr = Promise.resolve();
  return function () {
    var args = Array.prototype.slice.call(arguments);
    curr = curr.then(_ => fn.apply(this, args));
  };
}

function randomUint() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

const isH264VideoSupported = (() => {
  const video = document.createElement("video");
  return video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') !== "";
})();

const PEER_CONNECTION_CONFIG = {
  iceServers: [{ urls: "stun:stun1.l.google.com:19302" }, { urls: "stun:stun2.l.google.com:19302" }]
};

const WS_NORMAL_CLOSURE = 1000;

class JanusAdapter {
  constructor() {
    this.room = null;
    this.userId = String(randomUint());

    this.serverUrl = null;
    this.webRtcOptions = {};
    this.ws = null;
    this.session = null;

    // In the event the server restarts and all clients lose connection, reconnect with
    // some random jitter added to prevent simultaneous reconnection requests.
    this.initialReconnectionDelay = 1000 * Math.random();
    this.reconnectionDelay = this.initialReconnectionDelay;
    this.reconnectionTimeout = null;
    this.maxReconnectionAttempts = 10;
    this.reconnectionAttempts = 0;

    this.publisher = null;
    this.occupants = {};
    this.mediaStreams = {};
    this.localMediaStream = null;
    this.pendingMediaRequests = new Map();

    this.frozenUpdates = new Map();

    this.timeOffsets = [];
    this.serverTimeRequests = 0;
    this.avgTimeOffset = 0;

    this.onWebsocketOpen = this.onWebsocketOpen.bind(this);
    this.onWebsocketClose = this.onWebsocketClose.bind(this);
    this.onWebsocketMessage = this.onWebsocketMessage.bind(this);
    this.onDataChannelMessage = this.onDataChannelMessage.bind(this);
  }

  setServerUrl(url) {
    this.serverUrl = url;
  }

  setApp(app) {}

  setRoom(roomName) {
    this.room = roomName;
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

  setReconnectionListeners(reconnectingListener, reconnectedListener, reconnectionErrorListener) {
    // onReconnecting is called with the number of milliseconds until the next reconnection attempt
    this.onReconnecting = reconnectingListener;
    // onReconnected is called when the connection has been reestablished
    this.onReconnected = reconnectedListener;
    // onReconnectionError is called with an error when maxReconnectionAttempts has been reached
    this.onReconnectionError = reconnectionErrorListener;
  }

  connect() {
    debug(`connecting to ${this.serverUrl}`);

    const websocketConnection = new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl, "janus-protocol");

      this.session = new mj.JanusSession(this.ws.send.bind(this.ws));

      let onOpen;

      const onError = () => {
        reject(error);
      };

      this.ws.addEventListener("close", this.onWebsocketClose);
      this.ws.addEventListener("message", this.onWebsocketMessage);

      onOpen = () => {
        this.ws.removeEventListener("open", onOpen);
        this.ws.removeEventListener("error", onError);
        this.onWebsocketOpen().then(resolve).catch(reject);
      };

      this.ws.addEventListener("open", onOpen);
    });

    return Promise.all([websocketConnection, this.updateTimeOffset()]);
  }

  disconnect() {
    debug(`disconnecting`);

    clearTimeout(this.reconnectionTimeout);

    this.removeAllOccupants();

    if (this.publisher) {
      // Close the publisher peer connection. Which also detaches the plugin handle.
      this.publisher.conn.close();
      this.publisher = null;
    }

    if (this.session) {
      this.session.dispose();
      this.session = null;
    }

    if (this.ws) {
      this.ws.removeEventListener("open", this.onWebsocketOpen);
      this.ws.removeEventListener("close", this.onWebsocketClose);
      this.ws.removeEventListener("message", this.onWebsocketMessage);
      this.ws.close();
      this.ws = null;
    }
  }

  isDisconnected() {
    return this.ws === null;
  }

  onWebsocketOpen() {
    var _this = this;

    return _asyncToGenerator(function* () {
      // Create the Janus Session
      yield _this.session.create();

      // Attach the SFU Plugin and create a RTCPeerConnection for the publisher.
      // The publisher sends audio and opens two bidirectional data channels.
      // One reliable datachannel and one unreliable.
      _this.publisher = yield _this.createPublisher();

      // Call the naf connectSuccess callback before we start receiving WebRTC messages.
      _this.connectSuccess(_this.userId);

      // Add all of the initial occupants.
      yield Promise.all(_this.publisher.initialOccupants.map(_this.addOccupant.bind(_this)));
    })();
  }

  onWebsocketClose(event) {
    // The connection was closed successfully. Don't try to reconnect.
    if (event.code === WS_NORMAL_CLOSURE) {
      return;
    }

    if (this.onReconnecting) {
      this.onReconnecting(this.reconnectionDelay);
    }

    this.reconnectionTimeout = setTimeout(() => this.reconnect(), this.reconnectionDelay);
  }

  reconnect() {
    // Dispose of all networked entities and other resources tied to the session.
    this.disconnect();

    this.connect().then(() => {
      this.reconnectionDelay = this.initialReconnectionDelay;
      this.reconnectionAttempts = 0;

      if (this.onReconnected) {
        this.onReconnected();
      }
    }).catch(error => {
      this.reconnectionDelay += 1000;
      this.reconnectionAttempts++;

      if (this.reconnectionAttempts > this.maxReconnectionAttempts && this.onReconnectionError) {
        return this.onReconnectionError(new Error("Connection could not be reestablished, exceeded maximum number of reconnection attempts."));
      }

      if (this.onReconnecting) {
        this.onReconnecting(this.reconnectionDelay);
      }

      this.reconnectionTimeout = setTimeout(() => this.reconnect(), this.reconnectionDelay);
    });
  }

  onWebsocketMessage(event) {
    this.session.receive(JSON.parse(event.data));
  }

  addOccupant(occupantId) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      var subscriber = yield _this2.createSubscriber(occupantId);

      _this2.occupants[occupantId] = subscriber;

      _this2.setMediaStream(occupantId, subscriber.mediaStream);

      // Call the Networked AFrame callbacks for the new occupant.
      _this2.onOccupantConnected(occupantId);
      _this2.onOccupantsChanged(_this2.occupants);

      return subscriber;
    })();
  }

  removeAllOccupants() {
    for (const occupantId of Object.getOwnPropertyNames(this.occupants)) {
      this.removeOccupant(occupantId);
    }
  }

  removeOccupant(occupantId) {
    if (this.occupants[occupantId]) {
      // Close the subscriber peer connection. Which also detaches the plugin handle.
      if (this.occupants[occupantId]) {
        this.occupants[occupantId].conn.close();
        delete this.occupants[occupantId];
      }

      if (this.mediaStreams[occupantId]) {
        delete this.mediaStreams[occupantId];
      }

      if (this.pendingMediaRequests.has(occupantId)) {
        const msg = "The user disconnected before the media stream was resolved.";
        this.pendingMediaRequests.get(occupantId).audio.reject(msg);
        this.pendingMediaRequests.get(occupantId).video.reject(msg);
        this.pendingMediaRequests.delete(occupantId);
      }

      // Call the Networked AFrame callbacks for the removed occupant.
      this.onOccupantDisconnected(occupantId);
      this.onOccupantsChanged(this.occupants);
    }
  }

  associate(conn, handle) {
    conn.addEventListener("icecandidate", ev => {
      handle.sendTrickle(ev.candidate || null).catch(e => error("Error trickling ICE: %o", e));
    });

    // we have to debounce these because janus gets angry if you send it a new SDP before
    // it's finished processing an existing SDP. in actuality, it seems like this is maybe
    // too liberal and we need to wait some amount of time after an offer before sending another,
    // but we don't currently know any good way of detecting exactly how long :(
    conn.addEventListener("negotiationneeded", debounce(ev => {
      debug("Sending new offer for handle: %o", handle);
      var offer = conn.createOffer();
      var local = offer.then(o => conn.setLocalDescription(o));
      var remote = offer.then(j => handle.sendJsep(j)).then(r => conn.setRemoteDescription(r.jsep));
      return Promise.all([local, remote]).catch(e => error("Error negotiating offer: %o", e));
    }));
    handle.on("event", debounce(ev => {
      var jsep = ev.jsep;
      if (jsep && jsep.type == "offer") {
        debug("Accepting new offer for handle: %o", handle);
        jsep.sdp = this.configureSubscriberSdp(jsep.sdp);
        var answer = conn.setRemoteDescription(jsep).then(_ => conn.createAnswer());
        var local = answer.then(a => conn.setLocalDescription(a));
        var remote = answer.then(j => handle.sendJsep(j));
        Promise.all([local, remote]).catch(e => error("Error negotiating answer: %o", e));
      }
    }));
  }

  createPublisher() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      var handle = new mj.JanusPluginHandle(_this3.session);
      var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

      debug("pub waiting for sfu");
      yield handle.attach("janus.plugin.sfu");

      // Unreliable datachannel: sending and receiving component updates.
      // Reliable datachannel: sending and recieving entity instantiations.
      var reliableChannel = conn.createDataChannel("reliable", { ordered: true });
      var unreliableChannel = conn.createDataChannel("unreliable", {
        ordered: false,
        maxRetransmits: 0
      });
      reliableChannel.addEventListener("message", _this3.onDataChannelMessage);
      unreliableChannel.addEventListener("message", _this3.onDataChannelMessage);

      _this3.associate(conn, handle);

      debug("pub waiting for webrtcup");
      yield new Promise(function (resolve) {
        return handle.on("webrtcup", resolve);
      });

      // doing this here is sort of a hack around chrome renegotiation weirdness --
      // if we do it prior to webrtcup, chrome on gear VR will sometimes put a
      // renegotiation offer in flight while the first offer was still being
      // processed by janus. we should find some more principled way to figure out
      // when janus is done in the future.
      if (_this3.localMediaStream) {
        _this3.localMediaStream.getTracks().forEach(function (track) {
          conn.addTrack(track, _this3.localMediaStream);
        });
      }

      // Handle all of the join and leave events.
      handle.on("event", function (ev) {
        var data = ev.plugindata.data;
        if (data.event == "join" && data.room_id == _this3.room) {
          _this3.addOccupant(data.user_id);
        } else if (data.event == "leave" && data.room_id == _this3.room) {
          _this3.removeOccupant(data.user_id);
        } else if (data.event == "blocked") {
          document.body.dispatchEvent(new CustomEvent("blocked", { detail: { clientId: data.by } }));
        } else if (data.event == "unblocked") {
          document.body.dispatchEvent(new CustomEvent("unblocked", { detail: { clientId: data.by } }));
        }
      });

      debug("pub waiting for join");
      // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
      var message = yield _this3.sendJoin(handle, {
        notifications: true,
        data: true
      });

      if (!message.plugindata.data.success) {
        const err = message.plugindata.data.error;
        console.error(err);
        throw err;
      }

      var initialOccupants = message.plugindata.data.response.users[_this3.room] || [];

      debug("publisher ready");
      return {
        handle,
        initialOccupants,
        reliableChannel,
        unreliableChannel,
        conn
      };
    })();
  }

  configureSubscriberSdp(originalSdp) {
    if (!isH264VideoSupported) {
      return originalSdp;
    }

    // TODO: Hack to get video working on Chrome for Android. https://groups.google.com/forum/#!topic/mozilla.dev.media/Ye29vuMTpo8
    if (navigator.userAgent.indexOf("Android") === -1) {
      return originalSdp.replace("a=rtcp-fb:107 goog-remb\r\n", "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\n");
    } else {
      return originalSdp.replace("a=rtcp-fb:107 goog-remb\r\n", "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\n");
    }
  }

  createSubscriber(occupantId) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      var handle = new mj.JanusPluginHandle(_this4.session);
      var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

      debug("sub waiting for sfu");
      yield handle.attach("janus.plugin.sfu");

      _this4.associate(conn, handle);

      debug("sub waiting for join");
      // Send join message to janus. Don't listen for join/leave messages. Subscribe to the occupant's media.
      // Janus should send us an offer for this occupant's media in response to this.
      const resp = yield _this4.sendJoin(handle, { media: occupantId });

      debug("sub waiting for webrtcup");
      yield new Promise(function (resolve) {
        return handle.on("webrtcup", resolve);
      });

      var mediaStream = new MediaStream();
      var receivers = conn.getReceivers();
      receivers.forEach(function (receiver) {
        if (receiver.track) {
          mediaStream.addTrack(receiver.track);
        }
      });
      if (mediaStream.getTracks().length === 0) {
        mediaStream = null;
      }

      debug("subscriber ready");
      return {
        handle,
        mediaStream,
        conn
      };
    })();
  }

  sendJoin(handle, subscribe) {
    return handle.sendMessage({
      kind: "join",
      room_id: this.room,
      user_id: this.userId,
      subscribe
    });
  }

  toggleFreeze() {
    if (this.frozen) {
      this.unfreeze();
    } else {
      this.freeze();
    }
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
    this.flushPendingUpdates();
  }

  flushPendingUpdates() {
    for (const [networkId, message] of this.frozenUpdates) {
      // ignore messages relating to users who have disconnected since freezing, their entities will have aleady been removed by NAF
      // note that delete messages have no "owner" so we have to check for that as well
      if (message.data.owner && !this.occupants[message.data.owner]) continue;

      this.onOccupantMessage(null, message.dataType, message.data);
    }
    this.frozenUpdates.clear();
  }

  storeMessage(message) {
    const networkId = message.data.networkId;
    if (!this.frozenUpdates.has(networkId)) {
      this.frozenUpdates.set(networkId, message);
    } else {
      const storedMessage = this.frozenUpdates.get(networkId);

      // Avoid updating components if the entity data received did not come from the current owner.
      if (message.data.lastOwnerTime < storedMessage.data.lastOwnerTime || storedMessage.data.lastOwnerTime === message.data.lastOwnerTime && storedMessage.data.owner > message.data.owner) {
        return;
      }

      // Delete messages override any other messages for this entity
      if (message.dataType === "r") {
        this.frozenUpdates.set(networkId, message);
      } else {
        // merge in component updates
        Object.assign(storedMessage.data.components, message.data.components);
      }
      storedMessage.data.isFirstSync = storedMessage.data.isFirstSync || message.data.isFirstSync;
    }
  }

  onDataChannelMessage(event) {
    var message = JSON.parse(event.data);

    if (!message.dataType) return;

    if (this.frozen) {
      this.storeMessage(message);
    } else {
      this.onOccupantMessage(null, message.dataType, message.data);
    }
  }

  shouldStartConnectionTo(client) {
    return true;
  }

  startStreamConnection(client) {}

  closeStreamConnection(client) {}

  getConnectStatus(clientId) {
    return this.occupants[clientId] ? NAF.adapters.IS_CONNECTED : NAF.adapters.NOT_CONNECTED;
  }

  updateTimeOffset() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      if (_this5.isDisconnected()) return;

      const clientSentTime = Date.now();

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
        debug(`new server time offset: ${_this5.avgTimeOffset}ms`);
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

  getMediaStream(clientId, type = "audio") {
    if (this.mediaStreams[clientId]) {
      debug(`Already had ${type} for ${clientId}`);
      return Promise.resolve(this.mediaStreams[clientId][type]);
    } else {
      debug(`Waiting on ${type} for ${clientId}`);
      if (!this.pendingMediaRequests.has(clientId)) {
        this.pendingMediaRequests.set(clientId, {});

        const audioPromise = new Promise((resolve, reject) => {
          this.pendingMediaRequests.get(clientId).audio = { resolve, reject };
        });
        const videoPromise = new Promise((resolve, reject) => {
          this.pendingMediaRequests.get(clientId).video = { resolve, reject };
        });

        this.pendingMediaRequests.get(clientId).audio.promise = audioPromise;
        this.pendingMediaRequests.get(clientId).video.promise = videoPromise;
      }
      return this.pendingMediaRequests.get(clientId)[type].promise;
    }
  }

  setMediaStream(clientId, stream) {
    // Safari doesn't like it when you use single a mixed media stream where one of the tracks is inactive, so we
    // split the tracks into two streams.
    const audioStream = new MediaStream();
    stream.getAudioTracks().forEach(track => audioStream.addTrack(track));
    const videoStream = new MediaStream();
    stream.getVideoTracks().forEach(track => videoStream.addTrack(track));

    this.mediaStreams[clientId] = { audio: audioStream, video: videoStream };

    // Resolve the promise for the user's media stream if it exists.
    if (this.pendingMediaRequests.has(clientId)) {
      this.pendingMediaRequests.get(clientId).audio.resolve(audioStream);
      this.pendingMediaRequests.get(clientId).video.resolve(videoStream);
    }
  }

  setLocalMediaStream(stream) {
    // our job here is to make sure the connection winds up with RTP senders sending the stuff in this stream,
    // and not the stuff that isn't in this stream. strategy is to replace existing tracks if we can, add tracks
    // that we can't replace, and disable tracks that don't exist anymore.

    // note that we don't ever remove a track from the stream -- since Janus doesn't support Unified Plan, we absolutely
    // can't wind up with a SDP that has >1 audio or >1 video tracks, even if one of them is inactive (what you get if
    // you remove a track from an existing stream.)
    if (this.publisher && this.publisher.conn) {
      var existingSenders = this.publisher.conn.getSenders();
      var newSenders = [];
      stream.getTracks().forEach(t => {
        var sender = existingSenders.find(s => s.track != null && s.track.kind == t.kind);
        if (sender != null) {
          if (sender.replaceTrack) {
            sender.replaceTrack(t);
            sender.track.enabled = true;
          } else {
            // replaceTrack isn't implemented in Chrome, even via webrtc-adapter.
            stream.removeTrack(sender.track);
            stream.addTrack(t);
            t.enabled = true;
          }
          newSenders.push(sender);
        } else {
          newSenders.push(this.publisher.conn.addTrack(t, stream));
        }
      });
      existingSenders.forEach(s => {
        if (!newSenders.includes(s)) {
          s.track.enabled = false;
        }
      });
    }
    this.localMediaStream = stream;
    this.setMediaStream(this.userId, stream);
  }

  enableMicrophone(enabled) {
    if (this.publisher && this.publisher.conn) {
      this.publisher.conn.getSenders().forEach(s => {
        if (s.track.kind == "audio") {
          s.track.enabled = enabled;
        }
      });
    }
  }

  sendData(clientId, dataType, data) {
    if (!this.publisher) {
      return console.warn("sendData called without a publisher");
    }

    this.publisher.unreliableChannel.send(JSON.stringify({ clientId, dataType, data }));
  }

  sendDataGuaranteed(clientId, dataType, data) {
    if (!this.publisher) {
      return console.warn("sendDataGuaranteed called without a publisher");
    }

    this.publisher.reliableChannel.send(JSON.stringify({ clientId, dataType, data }));
  }

  broadcastData(dataType, data) {
    if (!this.publisher) {
      return console.warn("broadcastData called without a publisher");
    }

    this.publisher.unreliableChannel.send(JSON.stringify({ dataType, data }));
  }

  broadcastDataGuaranteed(dataType, data) {
    if (!this.publisher) {
      return console.warn("broadcastDataGuaranteed called without a publisher");
    }

    this.publisher.reliableChannel.send(JSON.stringify({ dataType, data }));
  }

  block(clientId) {
    return this.publisher.handle.sendMessage({ kind: "block", whom: clientId }).then(() => {
      document.body.dispatchEvent(new CustomEvent("blocked", { detail: { clientId: clientId } }));
    });
  }

  unblock(clientId) {
    return this.publisher.handle.sendMessage({ kind: "unblock", whom: clientId }).then(() => {
      document.body.dispatchEvent(new CustomEvent("unblocked", { detail: { clientId: clientId } }));
    });
  }
}

NAF.adapters.register("janus", JanusAdapter);

module.exports = JanusAdapter;

/***/ }),
/* 2 */
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
  var payload = { plugin: plugin, "force-bundle": true, "force-rtcp-mux": true };
  return this.session.send("attach", payload).then(resp => {
    this.id = resp.data.id;
    return resp;
  });
};

/** Detaches this handle. **/
JanusPluginHandle.prototype.detach = function() {
  return this.send("detach");
};

/** Registers a callback to be fired upon the reception of any incoming Janus signals for this plugin handle with the
 * `janus` attribute equal to `ev`.
 **/
JanusPluginHandle.prototype.on = function(ev, callback) {
  return this.session.on(ev, signal => {
    if (signal.sender == this.id) {
      callback(signal);
    }
  });
};

/**
 * Sends a signal associated with this handle. Signals should be JSON-serializable objects. Returns a promise that will
 * be resolved or rejected when a response to this signal is received, or when no response is received within the
 * session timeout.
 **/
JanusPluginHandle.prototype.send = function(type, signal) {
  return this.session.send(type, Object.assign({ handle_id: this.id }, signal));
};

/** Sends a plugin-specific message associated with this handle. **/
JanusPluginHandle.prototype.sendMessage = function(body) {
  return this.send("message", { body: body });
};

/** Sends a JSEP offer or answer associated with this handle. **/
JanusPluginHandle.prototype.sendJsep = function(jsep) {
  return this.send("message", { body: {}, jsep: jsep });
};

/** Sends an ICE trickle candidate associated with this handle. **/
JanusPluginHandle.prototype.sendTrickle = function(candidate) {
  return this.send("trickle", { candidate: candidate });
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
  this.eventHandlers = {};
  this.options = Object.assign({
    verbose: false,
    timeoutMs: 10000,
    keepaliveMs: 30000
  }, options);
}

/** Creates this session on the Janus server and sets its ID. **/
JanusSession.prototype.create = function() {
  return this.send("create").then(resp => {
    this.id = resp.data.id;
    return resp;
  });
};

/**
 * Destroys this session. Note that upon destruction, Janus will also close the signalling transport (if applicable) and
 * any open WebRTC connections.
 **/
JanusSession.prototype.destroy = function() {
  return this.send("destroy").then((resp) => {
    this.dispose();
    return resp;
  });
};

/**
 * Disposes of this session in a way such that no further incoming signalling messages will be processed.
 * Outstanding transactions will be rejected.
 **/
JanusSession.prototype.dispose = function() {
  this._killKeepalive();
  this.eventHandlers = {};
  for (var txId in this.txns) {
    if (this.txns.hasOwnProperty(txId)) {
      var txn = this.txns[txId];
      clearTimeout(txn.timeout);
      txn.reject(new Error("Janus session was disposed."));
      delete this.txns[txId];
    }
  }
};

/**
 * Whether this signal represents an error, and the associated promise (if any) should be rejected.
 * Users should override this to handle any custom plugin-specific error conventions.
 **/
JanusSession.prototype.isError = function(signal) {
  return signal.janus === "error";
};

/** Registers a callback to be fired upon the reception of any incoming Janus signals for this session with the
 * `janus` attribute equal to `ev`.
 **/
JanusSession.prototype.on = function(ev, callback) {
  var handlers = this.eventHandlers[ev];
  if (handlers == null) {
    handlers = this.eventHandlers[ev] = [];
  }
  handlers.push(callback);
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
  if (this.options.verbose) {
    console.debug("Incoming Janus signal: ", signal);
  }
  if (signal.session_id != this.id) {
    console.warn("Incorrect session ID received in Janus signalling message: was " + signal.session_id + ", expected " + this.id + ".");
  }

  var responseType = signal.janus;
  var handlers = this.eventHandlers[responseType];
  if (handlers != null) {
    for (var i = 0; i < handlers.length; i++) {
      handlers[i](signal);
    }
  }

  if (signal.transaction != null) {
    var txn = this.txns[signal.transaction];
    if (txn == null) {
      // this is a response to a transaction that wasn't caused via JanusSession.send, or a plugin replied twice to a
      // single request, or the session was disposed, or something else that isn't under our purview; that's fine
      return;
    }

    if (responseType === "ack" && txn.type == "message") {
      // this is an ack of an asynchronously-processed plugin request, we should wait to resolve the promise until the
      // actual response comes in
      return;
    }

    clearTimeout(txn.timeout);

    delete this.txns[signal.transaction];
    (this.isError(signal) ? txn.reject : txn.resolve)(signal);
  }
};

/**
 * Sends a signal associated with this session, beginning a new transaction. Returns a promise that will be resolved or
 * rejected when a response is received in the same transaction, or when no response is received within the session
 * timeout.
 **/
JanusSession.prototype.send = function(type, signal) {
  signal = Object.assign({ transaction: (this.nextTxId++).toString() }, signal);
  return new Promise((resolve, reject) => {
    var timeout = null;
    if (this.options.timeoutMs) {
      timeout = setTimeout(() => {
        delete this.txns[signal.transaction];
        reject(new Error("Signalling message with txid " + signal.transaction + " timed out."));
      }, this.options.timeoutMs);
    }
    this.txns[signal.transaction] = { resolve: resolve, reject: reject, timeout: timeout, type: type };
    this._transmit(type, signal);
  });
};

JanusSession.prototype._transmit = function(type, signal) {
  signal = Object.assign({ janus: type }, signal);

  if (this.id != null) { // this.id is undefined in the special case when we're sending the session create message
    signal = Object.assign({ session_id: this.id }, signal);
  }

  if (this.options.verbose) {
    console.debug("Outgoing Janus signal: ", signal);
  }

  this.output(JSON.stringify(signal));
  this._resetKeepalive();
};

JanusSession.prototype._sendKeepalive = function() {
  return this.send("keepalive");
};

JanusSession.prototype._killKeepalive = function() {
  clearTimeout(this.keepaliveTimeout);
};

JanusSession.prototype._resetKeepalive = function() {
  this._killKeepalive();
  if (this.options.keepaliveMs) {
    this.keepaliveTimeout = setTimeout(() => {
      this._sendKeepalive().catch(e => console.error("Error received from keepalive: ", e));
    }, this.options.keepaliveMs);
  }
};

module.exports = {
  JanusPluginHandle,
  JanusSession
};


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


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMjI1YWRiMWY3NWMxOTkwNzZlMjYiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9icm93c2VyLmpzIiwid2VicGFjazovLy8uL3NyYy9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbWluaWphbnVzL21pbmlqYW51cy5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvZGVidWcuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIl0sIm5hbWVzIjpbIm1qIiwicmVxdWlyZSIsImRlYnVnIiwid2FybiIsImVycm9yIiwiZGVib3VuY2UiLCJmbiIsImN1cnIiLCJQcm9taXNlIiwicmVzb2x2ZSIsImFyZ3MiLCJBcnJheSIsInByb3RvdHlwZSIsInNsaWNlIiwiY2FsbCIsImFyZ3VtZW50cyIsInRoZW4iLCJfIiwiYXBwbHkiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImlzSDI2NFZpZGVvU3VwcG9ydGVkIiwidmlkZW8iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjYW5QbGF5VHlwZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJscyIsIldTX05PUk1BTF9DTE9TVVJFIiwiSmFudXNBZGFwdGVyIiwiY29uc3RydWN0b3IiLCJyb29tIiwidXNlcklkIiwiU3RyaW5nIiwic2VydmVyVXJsIiwid2ViUnRjT3B0aW9ucyIsIndzIiwic2Vzc2lvbiIsImluaXRpYWxSZWNvbm5lY3Rpb25EZWxheSIsInJlY29ubmVjdGlvbkRlbGF5IiwicmVjb25uZWN0aW9uVGltZW91dCIsIm1heFJlY29ubmVjdGlvbkF0dGVtcHRzIiwicmVjb25uZWN0aW9uQXR0ZW1wdHMiLCJwdWJsaXNoZXIiLCJvY2N1cGFudHMiLCJtZWRpYVN0cmVhbXMiLCJsb2NhbE1lZGlhU3RyZWFtIiwicGVuZGluZ01lZGlhUmVxdWVzdHMiLCJNYXAiLCJmcm96ZW5VcGRhdGVzIiwidGltZU9mZnNldHMiLCJzZXJ2ZXJUaW1lUmVxdWVzdHMiLCJhdmdUaW1lT2Zmc2V0Iiwib25XZWJzb2NrZXRPcGVuIiwiYmluZCIsIm9uV2Vic29ja2V0Q2xvc2UiLCJvbldlYnNvY2tldE1lc3NhZ2UiLCJvbkRhdGFDaGFubmVsTWVzc2FnZSIsInNldFNlcnZlclVybCIsInVybCIsInNldEFwcCIsImFwcCIsInNldFJvb20iLCJyb29tTmFtZSIsInNldFdlYlJ0Y09wdGlvbnMiLCJvcHRpb25zIiwic2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyIsInN1Y2Nlc3NMaXN0ZW5lciIsImZhaWx1cmVMaXN0ZW5lciIsImNvbm5lY3RTdWNjZXNzIiwiY29ubmVjdEZhaWx1cmUiLCJzZXRSb29tT2NjdXBhbnRMaXN0ZW5lciIsIm9jY3VwYW50TGlzdGVuZXIiLCJvbk9jY3VwYW50c0NoYW5nZWQiLCJzZXREYXRhQ2hhbm5lbExpc3RlbmVycyIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwib25PY2N1cGFudENvbm5lY3RlZCIsIm9uT2NjdXBhbnREaXNjb25uZWN0ZWQiLCJvbk9jY3VwYW50TWVzc2FnZSIsInNldFJlY29ubmVjdGlvbkxpc3RlbmVycyIsInJlY29ubmVjdGluZ0xpc3RlbmVyIiwicmVjb25uZWN0ZWRMaXN0ZW5lciIsInJlY29ubmVjdGlvbkVycm9yTGlzdGVuZXIiLCJvblJlY29ubmVjdGluZyIsIm9uUmVjb25uZWN0ZWQiLCJvblJlY29ubmVjdGlvbkVycm9yIiwiY29ubmVjdCIsIndlYnNvY2tldENvbm5lY3Rpb24iLCJyZWplY3QiLCJXZWJTb2NrZXQiLCJKYW51c1Nlc3Npb24iLCJzZW5kIiwib25PcGVuIiwib25FcnJvciIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiY2F0Y2giLCJhbGwiLCJ1cGRhdGVUaW1lT2Zmc2V0IiwiZGlzY29ubmVjdCIsImNsZWFyVGltZW91dCIsInJlbW92ZUFsbE9jY3VwYW50cyIsImNvbm4iLCJjbG9zZSIsImRpc3Bvc2UiLCJpc0Rpc2Nvbm5lY3RlZCIsImNyZWF0ZSIsImNyZWF0ZVB1Ymxpc2hlciIsImluaXRpYWxPY2N1cGFudHMiLCJtYXAiLCJhZGRPY2N1cGFudCIsImV2ZW50IiwiY29kZSIsInNldFRpbWVvdXQiLCJyZWNvbm5lY3QiLCJFcnJvciIsInJlY2VpdmUiLCJKU09OIiwicGFyc2UiLCJkYXRhIiwib2NjdXBhbnRJZCIsInN1YnNjcmliZXIiLCJjcmVhdGVTdWJzY3JpYmVyIiwic2V0TWVkaWFTdHJlYW0iLCJtZWRpYVN0cmVhbSIsIk9iamVjdCIsImdldE93blByb3BlcnR5TmFtZXMiLCJyZW1vdmVPY2N1cGFudCIsImhhcyIsIm1zZyIsImdldCIsImF1ZGlvIiwiZGVsZXRlIiwiYXNzb2NpYXRlIiwiaGFuZGxlIiwiZXYiLCJzZW5kVHJpY2tsZSIsImNhbmRpZGF0ZSIsImUiLCJvZmZlciIsImNyZWF0ZU9mZmVyIiwibG9jYWwiLCJvIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsInJlbW90ZSIsImoiLCJzZW5kSnNlcCIsInIiLCJzZXRSZW1vdGVEZXNjcmlwdGlvbiIsImpzZXAiLCJvbiIsInR5cGUiLCJzZHAiLCJjb25maWd1cmVTdWJzY3JpYmVyU2RwIiwiYW5zd2VyIiwiY3JlYXRlQW5zd2VyIiwiYSIsIkphbnVzUGx1Z2luSGFuZGxlIiwiUlRDUGVlckNvbm5lY3Rpb24iLCJhdHRhY2giLCJyZWxpYWJsZUNoYW5uZWwiLCJjcmVhdGVEYXRhQ2hhbm5lbCIsIm9yZGVyZWQiLCJ1bnJlbGlhYmxlQ2hhbm5lbCIsIm1heFJldHJhbnNtaXRzIiwiZ2V0VHJhY2tzIiwiZm9yRWFjaCIsImFkZFRyYWNrIiwidHJhY2siLCJwbHVnaW5kYXRhIiwicm9vbV9pZCIsInVzZXJfaWQiLCJib2R5IiwiZGlzcGF0Y2hFdmVudCIsIkN1c3RvbUV2ZW50IiwiZGV0YWlsIiwiY2xpZW50SWQiLCJieSIsIm1lc3NhZ2UiLCJzZW5kSm9pbiIsIm5vdGlmaWNhdGlvbnMiLCJzdWNjZXNzIiwiZXJyIiwiY29uc29sZSIsInJlc3BvbnNlIiwidXNlcnMiLCJvcmlnaW5hbFNkcCIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsImluZGV4T2YiLCJyZXBsYWNlIiwicmVzcCIsIm1lZGlhIiwiTWVkaWFTdHJlYW0iLCJyZWNlaXZlcnMiLCJnZXRSZWNlaXZlcnMiLCJyZWNlaXZlciIsImxlbmd0aCIsInN1YnNjcmliZSIsInNlbmRNZXNzYWdlIiwia2luZCIsInRvZ2dsZUZyZWV6ZSIsImZyb3plbiIsInVuZnJlZXplIiwiZnJlZXplIiwiZmx1c2hQZW5kaW5nVXBkYXRlcyIsIm5ldHdvcmtJZCIsIm93bmVyIiwiZGF0YVR5cGUiLCJjbGVhciIsInN0b3JlTWVzc2FnZSIsInNldCIsInN0b3JlZE1lc3NhZ2UiLCJsYXN0T3duZXJUaW1lIiwiYXNzaWduIiwiY29tcG9uZW50cyIsImlzRmlyc3RTeW5jIiwic2hvdWxkU3RhcnRDb25uZWN0aW9uVG8iLCJjbGllbnQiLCJzdGFydFN0cmVhbUNvbm5lY3Rpb24iLCJjbG9zZVN0cmVhbUNvbm5lY3Rpb24iLCJnZXRDb25uZWN0U3RhdHVzIiwiTkFGIiwiYWRhcHRlcnMiLCJJU19DT05ORUNURUQiLCJOT1RfQ09OTkVDVEVEIiwiY2xpZW50U2VudFRpbWUiLCJEYXRlIiwibm93IiwicmVzIiwiZmV0Y2giLCJsb2NhdGlvbiIsImhyZWYiLCJtZXRob2QiLCJjYWNoZSIsInByZWNpc2lvbiIsInNlcnZlclJlY2VpdmVkVGltZSIsImhlYWRlcnMiLCJnZXRUaW1lIiwiY2xpZW50UmVjZWl2ZWRUaW1lIiwic2VydmVyVGltZSIsInRpbWVPZmZzZXQiLCJwdXNoIiwicmVkdWNlIiwiYWNjIiwib2Zmc2V0IiwiZ2V0U2VydmVyVGltZSIsImdldE1lZGlhU3RyZWFtIiwiYXVkaW9Qcm9taXNlIiwidmlkZW9Qcm9taXNlIiwicHJvbWlzZSIsInN0cmVhbSIsImF1ZGlvU3RyZWFtIiwiZ2V0QXVkaW9UcmFja3MiLCJ2aWRlb1N0cmVhbSIsImdldFZpZGVvVHJhY2tzIiwic2V0TG9jYWxNZWRpYVN0cmVhbSIsImV4aXN0aW5nU2VuZGVycyIsImdldFNlbmRlcnMiLCJuZXdTZW5kZXJzIiwidCIsInNlbmRlciIsImZpbmQiLCJzIiwicmVwbGFjZVRyYWNrIiwiZW5hYmxlZCIsInJlbW92ZVRyYWNrIiwiaW5jbHVkZXMiLCJlbmFibGVNaWNyb3Bob25lIiwic2VuZERhdGEiLCJzdHJpbmdpZnkiLCJzZW5kRGF0YUd1YXJhbnRlZWQiLCJicm9hZGNhc3REYXRhIiwiYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQiLCJibG9jayIsIndob20iLCJ1bmJsb2NrIiwicmVnaXN0ZXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsc0JBQXNCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQ0FBcUM7O0FBRXJDO0FBQ0E7QUFDQTs7QUFFQSwyQkFBMkI7QUFDM0I7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCLFVBQVU7Ozs7Ozs7O0FDdEx0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLFdBQVcsT0FBTztB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LmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMjI1YWRiMWY3NWMxOTkwNzZlMjYiLCIvKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcbmV4cG9ydHMuc3RvcmFnZSA9ICd1bmRlZmluZWQnICE9IHR5cGVvZiBjaHJvbWVcbiAgICAgICAgICAgICAgICYmICd1bmRlZmluZWQnICE9IHR5cGVvZiBjaHJvbWUuc3RvcmFnZVxuICAgICAgICAgICAgICAgICAgPyBjaHJvbWUuc3RvcmFnZS5sb2NhbFxuICAgICAgICAgICAgICAgICAgOiBsb2NhbHN0b3JhZ2UoKTtcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICcjMDAwMENDJywgJyMwMDAwRkYnLCAnIzAwMzNDQycsICcjMDAzM0ZGJywgJyMwMDY2Q0MnLCAnIzAwNjZGRicsICcjMDA5OUNDJyxcbiAgJyMwMDk5RkYnLCAnIzAwQ0MwMCcsICcjMDBDQzMzJywgJyMwMENDNjYnLCAnIzAwQ0M5OScsICcjMDBDQ0NDJywgJyMwMENDRkYnLFxuICAnIzMzMDBDQycsICcjMzMwMEZGJywgJyMzMzMzQ0MnLCAnIzMzMzNGRicsICcjMzM2NkNDJywgJyMzMzY2RkYnLCAnIzMzOTlDQycsXG4gICcjMzM5OUZGJywgJyMzM0NDMDAnLCAnIzMzQ0MzMycsICcjMzNDQzY2JywgJyMzM0NDOTknLCAnIzMzQ0NDQycsICcjMzNDQ0ZGJyxcbiAgJyM2NjAwQ0MnLCAnIzY2MDBGRicsICcjNjYzM0NDJywgJyM2NjMzRkYnLCAnIzY2Q0MwMCcsICcjNjZDQzMzJywgJyM5OTAwQ0MnLFxuICAnIzk5MDBGRicsICcjOTkzM0NDJywgJyM5OTMzRkYnLCAnIzk5Q0MwMCcsICcjOTlDQzMzJywgJyNDQzAwMDAnLCAnI0NDMDAzMycsXG4gICcjQ0MwMDY2JywgJyNDQzAwOTknLCAnI0NDMDBDQycsICcjQ0MwMEZGJywgJyNDQzMzMDAnLCAnI0NDMzMzMycsICcjQ0MzMzY2JyxcbiAgJyNDQzMzOTknLCAnI0NDMzNDQycsICcjQ0MzM0ZGJywgJyNDQzY2MDAnLCAnI0NDNjYzMycsICcjQ0M5OTAwJywgJyNDQzk5MzMnLFxuICAnI0NDQ0MwMCcsICcjQ0NDQzMzJywgJyNGRjAwMDAnLCAnI0ZGMDAzMycsICcjRkYwMDY2JywgJyNGRjAwOTknLCAnI0ZGMDBDQycsXG4gICcjRkYwMEZGJywgJyNGRjMzMDAnLCAnI0ZGMzMzMycsICcjRkYzMzY2JywgJyNGRjMzOTknLCAnI0ZGMzNDQycsICcjRkYzM0ZGJyxcbiAgJyNGRjY2MDAnLCAnI0ZGNjYzMycsICcjRkY5OTAwJywgJyNGRjk5MzMnLCAnI0ZGQ0MwMCcsICcjRkZDQzMzJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIE5COiBJbiBhbiBFbGVjdHJvbiBwcmVsb2FkIHNjcmlwdCwgZG9jdW1lbnQgd2lsbCBiZSBkZWZpbmVkIGJ1dCBub3QgZnVsbHlcbiAgLy8gaW5pdGlhbGl6ZWQuIFNpbmNlIHdlIGtub3cgd2UncmUgaW4gQ2hyb21lLCB3ZSdsbCBqdXN0IGRldGVjdCB0aGlzIGNhc2VcbiAgLy8gZXhwbGljaXRseVxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnByb2Nlc3MgJiYgd2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gSW50ZXJuZXQgRXhwbG9yZXIgYW5kIEVkZ2UgZG8gbm90IHN1cHBvcnQgY29sb3JzLlxuICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goLyhlZGdlfHRyaWRlbnQpXFwvKFxcZCspLykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICAvLyBkb2N1bWVudCBpcyB1bmRlZmluZWQgaW4gcmVhY3QtbmF0aXZlOiBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QtbmF0aXZlL3B1bGwvMTYzMlxuICByZXR1cm4gKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuV2Via2l0QXBwZWFyYW5jZSkgfHxcbiAgICAvLyBpcyBmaXJlYnVnPyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zOTgxMjAvMzc2NzczXG4gICAgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5jb25zb2xlICYmICh3aW5kb3cuY29uc29sZS5maXJlYnVnIHx8ICh3aW5kb3cuY29uc29sZS5leGNlcHRpb24gJiYgd2luZG93LmNvbnNvbGUudGFibGUpKSkgfHxcbiAgICAvLyBpcyBmaXJlZm94ID49IHYzMT9cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1Rvb2xzL1dlYl9Db25zb2xlI1N0eWxpbmdfbWVzc2FnZXNcbiAgICAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSkgfHxcbiAgICAvLyBkb3VibGUgY2hlY2sgd2Via2l0IGluIHVzZXJBZ2VudCBqdXN0IGluIGNhc2Ugd2UgYXJlIGluIGEgd29ya2VyXG4gICAgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9hcHBsZXdlYmtpdFxcLyhcXGQrKS8pKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHYpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyLm1lc3NhZ2U7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKGFyZ3MpIHtcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0JylcblxuICAvLyB0aGUgZmluYWwgXCIlY1wiIGlzIHNvbWV3aGF0IHRyaWNreSwgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlclxuICAvLyBhcmd1bWVudHMgcGFzc2VkIGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhlICVjLCBzbyB3ZSBuZWVkIHRvXG4gIC8vIGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgaW5kZXggdG8gaW5zZXJ0IHRoZSBDU1MgaW50b1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgbGFzdEMgPSAwO1xuICBhcmdzWzBdLnJlcGxhY2UoLyVbYS16QS1aJV0vZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICBpZiAoJyUlJyA9PT0gbWF0Y2gpIHJldHVybjtcbiAgICBpbmRleCsrO1xuICAgIGlmICgnJWMnID09PSBtYXRjaCkge1xuICAgICAgLy8gd2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiB0aGUgKmxhc3QqICVjXG4gICAgICAvLyAodGhlIHVzZXIgbWF5IGhhdmUgcHJvdmlkZWQgdGhlaXIgb3duKVxuICAgICAgbGFzdEMgPSBpbmRleDtcbiAgICB9XG4gIH0pO1xuXG4gIGFyZ3Muc3BsaWNlKGxhc3RDLCAwLCBjKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIHRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG4gIC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gZXhwb3J0cy5zdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG5cbiAgLy8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuICBpZiAoIXIgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICdlbnYnIGluIHByb2Nlc3MpIHtcbiAgICByID0gcHJvY2Vzcy5lbnYuREVCVUc7XG4gIH1cblxuICByZXR1cm4gcjtcbn1cblxuLyoqXG4gKiBFbmFibGUgbmFtZXNwYWNlcyBsaXN0ZWQgaW4gYGxvY2FsU3RvcmFnZS5kZWJ1Z2AgaW5pdGlhbGx5LlxuICovXG5cbmV4cG9ydHMuZW5hYmxlKGxvYWQoKSk7XG5cbi8qKlxuICogTG9jYWxzdG9yYWdlIGF0dGVtcHRzIHRvIHJldHVybiB0aGUgbG9jYWxzdG9yYWdlLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugc2FmYXJpIHRocm93c1xuICogd2hlbiBhIHVzZXIgZGlzYWJsZXMgY29va2llcy9sb2NhbHN0b3JhZ2VcbiAqIGFuZCB5b3UgYXR0ZW1wdCB0byBhY2Nlc3MgaXQuXG4gKlxuICogQHJldHVybiB7TG9jYWxTdG9yYWdlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9jYWxzdG9yYWdlKCkge1xuICB0cnkge1xuICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlO1xuICB9IGNhdGNoIChlKSB7fVxufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanNcbi8vIG1vZHVsZSBpZCA9IDBcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwidmFyIG1qID0gcmVxdWlyZShcIm1pbmlqYW51c1wiKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcIm5hZi1qYW51cy1hZGFwdGVyOmRlYnVnXCIpO1xudmFyIHdhcm4gPSByZXF1aXJlKFwiZGVidWdcIikoXCJuYWYtamFudXMtYWRhcHRlcjp3YXJuXCIpO1xudmFyIGVycm9yID0gcmVxdWlyZShcImRlYnVnXCIpKFwibmFmLWphbnVzLWFkYXB0ZXI6ZXJyb3JcIik7XG5cbmZ1bmN0aW9uIGRlYm91bmNlKGZuKSB7XG4gIHZhciBjdXJyID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgY3VyciA9IGN1cnIudGhlbihfID0+IGZuLmFwcGx5KHRoaXMsIGFyZ3MpKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmFuZG9tVWludCgpIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKTtcbn1cblxuY29uc3QgaXNIMjY0VmlkZW9TdXBwb3J0ZWQgPSAoKCkgPT4ge1xuICBjb25zdCB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ2aWRlb1wiKTtcbiAgcmV0dXJuIHZpZGVvLmNhblBsYXlUeXBlKCd2aWRlby9tcDQ7IGNvZGVjcz1cImF2YzEuNDJFMDFFLCBtcDRhLjQwLjJcIicpICE9PSBcIlwiO1xufSkoKTtcblxuY29uc3QgUEVFUl9DT05ORUNUSU9OX0NPTkZJRyA9IHtcbiAgaWNlU2VydmVyczogW3sgdXJsczogXCJzdHVuOnN0dW4xLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sIHsgdXJsczogXCJzdHVuOnN0dW4yLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH1dXG59O1xuXG5jb25zdCBXU19OT1JNQUxfQ0xPU1VSRSA9IDEwMDA7XG5cbmNsYXNzIEphbnVzQWRhcHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMucm9vbSA9IG51bGw7XG4gICAgdGhpcy51c2VySWQgPSBTdHJpbmcocmFuZG9tVWludCgpKTtcblxuICAgIHRoaXMuc2VydmVyVXJsID0gbnVsbDtcbiAgICB0aGlzLndlYlJ0Y09wdGlvbnMgPSB7fTtcbiAgICB0aGlzLndzID0gbnVsbDtcbiAgICB0aGlzLnNlc3Npb24gPSBudWxsO1xuXG4gICAgLy8gSW4gdGhlIGV2ZW50IHRoZSBzZXJ2ZXIgcmVzdGFydHMgYW5kIGFsbCBjbGllbnRzIGxvc2UgY29ubmVjdGlvbiwgcmVjb25uZWN0IHdpdGhcbiAgICAvLyBzb21lIHJhbmRvbSBqaXR0ZXIgYWRkZWQgdG8gcHJldmVudCBzaW11bHRhbmVvdXMgcmVjb25uZWN0aW9uIHJlcXVlc3RzLlxuICAgIHRoaXMuaW5pdGlhbFJlY29ubmVjdGlvbkRlbGF5ID0gMTAwMCAqIE1hdGgucmFuZG9tKCk7XG4gICAgdGhpcy5yZWNvbm5lY3Rpb25EZWxheSA9IHRoaXMuaW5pdGlhbFJlY29ubmVjdGlvbkRlbGF5O1xuICAgIHRoaXMucmVjb25uZWN0aW9uVGltZW91dCA9IG51bGw7XG4gICAgdGhpcy5tYXhSZWNvbm5lY3Rpb25BdHRlbXB0cyA9IDEwO1xuICAgIHRoaXMucmVjb25uZWN0aW9uQXR0ZW1wdHMgPSAwO1xuXG4gICAgdGhpcy5wdWJsaXNoZXIgPSBudWxsO1xuICAgIHRoaXMub2NjdXBhbnRzID0ge307XG4gICAgdGhpcy5tZWRpYVN0cmVhbXMgPSB7fTtcbiAgICB0aGlzLmxvY2FsTWVkaWFTdHJlYW0gPSBudWxsO1xuICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLmZyb3plblVwZGF0ZXMgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLnRpbWVPZmZzZXRzID0gW107XG4gICAgdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPSAwO1xuICAgIHRoaXMuYXZnVGltZU9mZnNldCA9IDA7XG5cbiAgICB0aGlzLm9uV2Vic29ja2V0T3BlbiA9IHRoaXMub25XZWJzb2NrZXRPcGVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbldlYnNvY2tldENsb3NlID0gdGhpcy5vbldlYnNvY2tldENsb3NlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UgPSB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UgPSB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlLmJpbmQodGhpcyk7XG4gIH1cblxuICBzZXRTZXJ2ZXJVcmwodXJsKSB7XG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSB1cmw7XG4gIH1cblxuICBzZXRBcHAoYXBwKSB7fVxuXG4gIHNldFJvb20ocm9vbU5hbWUpIHtcbiAgICB0aGlzLnJvb20gPSByb29tTmFtZTtcbiAgfVxuXG4gIHNldFdlYlJ0Y09wdGlvbnMob3B0aW9ucykge1xuICAgIHRoaXMud2ViUnRjT3B0aW9ucyA9IG9wdGlvbnM7XG4gIH1cblxuICBzZXRTZXJ2ZXJDb25uZWN0TGlzdGVuZXJzKHN1Y2Nlc3NMaXN0ZW5lciwgZmFpbHVyZUxpc3RlbmVyKSB7XG4gICAgdGhpcy5jb25uZWN0U3VjY2VzcyA9IHN1Y2Nlc3NMaXN0ZW5lcjtcbiAgICB0aGlzLmNvbm5lY3RGYWlsdXJlID0gZmFpbHVyZUxpc3RlbmVyO1xuICB9XG5cbiAgc2V0Um9vbU9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRMaXN0ZW5lcikge1xuICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkID0gb2NjdXBhbnRMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xuICAgIHRoaXMub25PY2N1cGFudENvbm5lY3RlZCA9IG9wZW5MaXN0ZW5lcjtcbiAgICB0aGlzLm9uT2NjdXBhbnREaXNjb25uZWN0ZWQgPSBjbG9zZWRMaXN0ZW5lcjtcbiAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlID0gbWVzc2FnZUxpc3RlbmVyO1xuICB9XG5cbiAgc2V0UmVjb25uZWN0aW9uTGlzdGVuZXJzKHJlY29ubmVjdGluZ0xpc3RlbmVyLCByZWNvbm5lY3RlZExpc3RlbmVyLCByZWNvbm5lY3Rpb25FcnJvckxpc3RlbmVyKSB7XG4gICAgLy8gb25SZWNvbm5lY3RpbmcgaXMgY2FsbGVkIHdpdGggdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdW50aWwgdGhlIG5leHQgcmVjb25uZWN0aW9uIGF0dGVtcHRcbiAgICB0aGlzLm9uUmVjb25uZWN0aW5nID0gcmVjb25uZWN0aW5nTGlzdGVuZXI7XG4gICAgLy8gb25SZWNvbm5lY3RlZCBpcyBjYWxsZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBoYXMgYmVlbiByZWVzdGFibGlzaGVkXG4gICAgdGhpcy5vblJlY29ubmVjdGVkID0gcmVjb25uZWN0ZWRMaXN0ZW5lcjtcbiAgICAvLyBvblJlY29ubmVjdGlvbkVycm9yIGlzIGNhbGxlZCB3aXRoIGFuIGVycm9yIHdoZW4gbWF4UmVjb25uZWN0aW9uQXR0ZW1wdHMgaGFzIGJlZW4gcmVhY2hlZFxuICAgIHRoaXMub25SZWNvbm5lY3Rpb25FcnJvciA9IHJlY29ubmVjdGlvbkVycm9yTGlzdGVuZXI7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIGRlYnVnKGBjb25uZWN0aW5nIHRvICR7dGhpcy5zZXJ2ZXJVcmx9YCk7XG5cbiAgICBjb25zdCB3ZWJzb2NrZXRDb25uZWN0aW9uID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJVcmwsIFwiamFudXMtcHJvdG9jb2xcIik7XG5cbiAgICAgIHRoaXMuc2Vzc2lvbiA9IG5ldyBtai5KYW51c1Nlc3Npb24odGhpcy53cy5zZW5kLmJpbmQodGhpcy53cykpO1xuXG4gICAgICBsZXQgb25PcGVuO1xuXG4gICAgICBjb25zdCBvbkVycm9yID0gKCkgPT4ge1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKFwiY2xvc2VcIiwgdGhpcy5vbldlYnNvY2tldENsb3NlKTtcbiAgICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UpO1xuXG4gICAgICBvbk9wZW4gPSAoKSA9PiB7XG4gICAgICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgb25PcGVuKTtcbiAgICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgb25FcnJvcik7XG4gICAgICAgIHRoaXMub25XZWJzb2NrZXRPcGVuKClcbiAgICAgICAgICAudGhlbihyZXNvbHZlKVxuICAgICAgICAgIC5jYXRjaChyZWplY3QpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKFwib3BlblwiLCBvbk9wZW4pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFt3ZWJzb2NrZXRDb25uZWN0aW9uLCB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKV0pO1xuICB9XG5cbiAgZGlzY29ubmVjdCgpIHtcbiAgICBkZWJ1ZyhgZGlzY29ubmVjdGluZ2ApO1xuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMucmVjb25uZWN0aW9uVGltZW91dCk7XG5cbiAgICB0aGlzLnJlbW92ZUFsbE9jY3VwYW50cygpO1xuXG4gICAgaWYgKHRoaXMucHVibGlzaGVyKSB7XG4gICAgICAvLyBDbG9zZSB0aGUgcHVibGlzaGVyIHBlZXIgY29ubmVjdGlvbi4gV2hpY2ggYWxzbyBkZXRhY2hlcyB0aGUgcGx1Z2luIGhhbmRsZS5cbiAgICAgIHRoaXMucHVibGlzaGVyLmNvbm4uY2xvc2UoKTtcbiAgICAgIHRoaXMucHVibGlzaGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXNzaW9uKSB7XG4gICAgICB0aGlzLnNlc3Npb24uZGlzcG9zZSgpO1xuICAgICAgdGhpcy5zZXNzaW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy53cykge1xuICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKFwib3BlblwiLCB0aGlzLm9uV2Vic29ja2V0T3Blbik7XG4gICAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbG9zZVwiLCB0aGlzLm9uV2Vic29ja2V0Q2xvc2UpO1xuICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSk7XG4gICAgICB0aGlzLndzLmNsb3NlKCk7XG4gICAgICB0aGlzLndzID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBpc0Rpc2Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy53cyA9PT0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIG9uV2Vic29ja2V0T3BlbigpIHtcbiAgICAvLyBDcmVhdGUgdGhlIEphbnVzIFNlc3Npb25cbiAgICBhd2FpdCB0aGlzLnNlc3Npb24uY3JlYXRlKCk7XG5cbiAgICAvLyBBdHRhY2ggdGhlIFNGVSBQbHVnaW4gYW5kIGNyZWF0ZSBhIFJUQ1BlZXJDb25uZWN0aW9uIGZvciB0aGUgcHVibGlzaGVyLlxuICAgIC8vIFRoZSBwdWJsaXNoZXIgc2VuZHMgYXVkaW8gYW5kIG9wZW5zIHR3byBiaWRpcmVjdGlvbmFsIGRhdGEgY2hhbm5lbHMuXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cbiAgICB0aGlzLnB1Ymxpc2hlciA9IGF3YWl0IHRoaXMuY3JlYXRlUHVibGlzaGVyKCk7XG5cbiAgICAvLyBDYWxsIHRoZSBuYWYgY29ubmVjdFN1Y2Nlc3MgY2FsbGJhY2sgYmVmb3JlIHdlIHN0YXJ0IHJlY2VpdmluZyBXZWJSVEMgbWVzc2FnZXMuXG4gICAgdGhpcy5jb25uZWN0U3VjY2Vzcyh0aGlzLnVzZXJJZCk7XG5cbiAgICAvLyBBZGQgYWxsIG9mIHRoZSBpbml0aWFsIG9jY3VwYW50cy5cbiAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnB1Ymxpc2hlci5pbml0aWFsT2NjdXBhbnRzLm1hcCh0aGlzLmFkZE9jY3VwYW50LmJpbmQodGhpcykpKTtcbiAgfVxuXG4gIG9uV2Vic29ja2V0Q2xvc2UoZXZlbnQpIHtcbiAgICAvLyBUaGUgY29ubmVjdGlvbiB3YXMgY2xvc2VkIHN1Y2Nlc3NmdWxseS4gRG9uJ3QgdHJ5IHRvIHJlY29ubmVjdC5cbiAgICBpZiAoZXZlbnQuY29kZSA9PT0gV1NfTk9STUFMX0NMT1NVUkUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vblJlY29ubmVjdGluZykge1xuICAgICAgdGhpcy5vblJlY29ubmVjdGluZyh0aGlzLnJlY29ubmVjdGlvbkRlbGF5KTtcbiAgICB9XG5cbiAgICB0aGlzLnJlY29ubmVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMucmVjb25uZWN0KCksIHRoaXMucmVjb25uZWN0aW9uRGVsYXkpO1xuICB9XG5cbiAgcmVjb25uZWN0KCkge1xuICAgIC8vIERpc3Bvc2Ugb2YgYWxsIG5ldHdvcmtlZCBlbnRpdGllcyBhbmQgb3RoZXIgcmVzb3VyY2VzIHRpZWQgdG8gdGhlIHNlc3Npb24uXG4gICAgdGhpcy5kaXNjb25uZWN0KCk7XG5cbiAgICB0aGlzLmNvbm5lY3QoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkRlbGF5ID0gdGhpcy5pbml0aWFsUmVjb25uZWN0aW9uRGVsYXk7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uQXR0ZW1wdHMgPSAwO1xuXG4gICAgICAgIGlmICh0aGlzLm9uUmVjb25uZWN0ZWQpIHtcbiAgICAgICAgICB0aGlzLm9uUmVjb25uZWN0ZWQoKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uRGVsYXkgKz0gMTAwMDtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cysrO1xuXG4gICAgICAgIGlmICh0aGlzLnJlY29ubmVjdGlvbkF0dGVtcHRzID4gdGhpcy5tYXhSZWNvbm5lY3Rpb25BdHRlbXB0cyAmJiB0aGlzLm9uUmVjb25uZWN0aW9uRXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5vblJlY29ubmVjdGlvbkVycm9yKFxuICAgICAgICAgICAgbmV3IEVycm9yKFwiQ29ubmVjdGlvbiBjb3VsZCBub3QgYmUgcmVlc3RhYmxpc2hlZCwgZXhjZWVkZWQgbWF4aW11bSBudW1iZXIgb2YgcmVjb25uZWN0aW9uIGF0dGVtcHRzLlwiKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vblJlY29ubmVjdGluZykge1xuICAgICAgICAgIHRoaXMub25SZWNvbm5lY3RpbmcodGhpcy5yZWNvbm5lY3Rpb25EZWxheSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlY29ubmVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMucmVjb25uZWN0KCksIHRoaXMucmVjb25uZWN0aW9uRGVsYXkpO1xuICAgICAgfSk7XG4gIH1cblxuICBvbldlYnNvY2tldE1lc3NhZ2UoZXZlbnQpIHtcbiAgICB0aGlzLnNlc3Npb24ucmVjZWl2ZShKU09OLnBhcnNlKGV2ZW50LmRhdGEpKTtcbiAgfVxuXG4gIGFzeW5jIGFkZE9jY3VwYW50KG9jY3VwYW50SWQpIHtcbiAgICB2YXIgc3Vic2NyaWJlciA9IGF3YWl0IHRoaXMuY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKTtcblxuICAgIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdID0gc3Vic2NyaWJlcjtcblxuICAgIHRoaXMuc2V0TWVkaWFTdHJlYW0ob2NjdXBhbnRJZCwgc3Vic2NyaWJlci5tZWRpYVN0cmVhbSk7XG5cbiAgICAvLyBDYWxsIHRoZSBOZXR3b3JrZWQgQUZyYW1lIGNhbGxiYWNrcyBmb3IgdGhlIG5ldyBvY2N1cGFudC5cbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQob2NjdXBhbnRJZCk7XG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xuXG4gICAgcmV0dXJuIHN1YnNjcmliZXI7XG4gIH1cblxuICByZW1vdmVBbGxPY2N1cGFudHMoKSB7XG4gICAgZm9yIChjb25zdCBvY2N1cGFudElkIG9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMub2NjdXBhbnRzKSkge1xuICAgICAgdGhpcy5yZW1vdmVPY2N1cGFudChvY2N1cGFudElkKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVPY2N1cGFudChvY2N1cGFudElkKSB7XG4gICAgaWYgKHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdKSB7XG4gICAgICAvLyBDbG9zZSB0aGUgc3Vic2NyaWJlciBwZWVyIGNvbm5lY3Rpb24uIFdoaWNoIGFsc28gZGV0YWNoZXMgdGhlIHBsdWdpbiBoYW5kbGUuXG4gICAgICBpZiAodGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0pIHtcbiAgICAgICAgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0uY29ubi5jbG9zZSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF07XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm1lZGlhU3RyZWFtc1tvY2N1cGFudElkXSkge1xuICAgICAgICBkZWxldGUgdGhpcy5tZWRpYVN0cmVhbXNbb2NjdXBhbnRJZF07XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmhhcyhvY2N1cGFudElkKSkge1xuICAgICAgICBjb25zdCBtc2cgPSBcIlRoZSB1c2VyIGRpc2Nvbm5lY3RlZCBiZWZvcmUgdGhlIG1lZGlhIHN0cmVhbSB3YXMgcmVzb2x2ZWQuXCI7XG4gICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KG9jY3VwYW50SWQpLmF1ZGlvLnJlamVjdChtc2cpO1xuICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChvY2N1cGFudElkKS52aWRlby5yZWplY3QobXNnKTtcbiAgICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5kZWxldGUob2NjdXBhbnRJZCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgcmVtb3ZlZCBvY2N1cGFudC5cbiAgICAgIHRoaXMub25PY2N1cGFudERpc2Nvbm5lY3RlZChvY2N1cGFudElkKTtcbiAgICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkKHRoaXMub2NjdXBhbnRzKTtcbiAgICB9XG4gIH1cblxuICBhc3NvY2lhdGUoY29ubiwgaGFuZGxlKSB7XG4gICAgY29ubi5hZGRFdmVudExpc3RlbmVyKFwiaWNlY2FuZGlkYXRlXCIsIGV2ID0+IHtcbiAgICAgIGhhbmRsZS5zZW5kVHJpY2tsZShldi5jYW5kaWRhdGUgfHwgbnVsbCkuY2F0Y2goZSA9PiBlcnJvcihcIkVycm9yIHRyaWNrbGluZyBJQ0U6ICVvXCIsIGUpKTtcbiAgICB9KTtcblxuICAgIC8vIHdlIGhhdmUgdG8gZGVib3VuY2UgdGhlc2UgYmVjYXVzZSBqYW51cyBnZXRzIGFuZ3J5IGlmIHlvdSBzZW5kIGl0IGEgbmV3IFNEUCBiZWZvcmVcbiAgICAvLyBpdCdzIGZpbmlzaGVkIHByb2Nlc3NpbmcgYW4gZXhpc3RpbmcgU0RQLiBpbiBhY3R1YWxpdHksIGl0IHNlZW1zIGxpa2UgdGhpcyBpcyBtYXliZVxuICAgIC8vIHRvbyBsaWJlcmFsIGFuZCB3ZSBuZWVkIHRvIHdhaXQgc29tZSBhbW91bnQgb2YgdGltZSBhZnRlciBhbiBvZmZlciBiZWZvcmUgc2VuZGluZyBhbm90aGVyLFxuICAgIC8vIGJ1dCB3ZSBkb24ndCBjdXJyZW50bHkga25vdyBhbnkgZ29vZCB3YXkgb2YgZGV0ZWN0aW5nIGV4YWN0bHkgaG93IGxvbmcgOihcbiAgICBjb25uLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICBcIm5lZ290aWF0aW9ubmVlZGVkXCIsXG4gICAgICBkZWJvdW5jZShldiA9PiB7XG4gICAgICAgIGRlYnVnKFwiU2VuZGluZyBuZXcgb2ZmZXIgZm9yIGhhbmRsZTogJW9cIiwgaGFuZGxlKTtcbiAgICAgICAgdmFyIG9mZmVyID0gY29ubi5jcmVhdGVPZmZlcigpO1xuICAgICAgICB2YXIgbG9jYWwgPSBvZmZlci50aGVuKG8gPT4gY29ubi5zZXRMb2NhbERlc2NyaXB0aW9uKG8pKTtcbiAgICAgICAgdmFyIHJlbW90ZSA9IG9mZmVyLnRoZW4oaiA9PiBoYW5kbGUuc2VuZEpzZXAoaikpLnRoZW4ociA9PiBjb25uLnNldFJlbW90ZURlc2NyaXB0aW9uKHIuanNlcCkpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW2xvY2FsLCByZW1vdGVdKS5jYXRjaChlID0+IGVycm9yKFwiRXJyb3IgbmVnb3RpYXRpbmcgb2ZmZXI6ICVvXCIsIGUpKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICBoYW5kbGUub24oXG4gICAgICBcImV2ZW50XCIsXG4gICAgICBkZWJvdW5jZShldiA9PiB7XG4gICAgICAgIHZhciBqc2VwID0gZXYuanNlcDtcbiAgICAgICAgaWYgKGpzZXAgJiYganNlcC50eXBlID09IFwib2ZmZXJcIikge1xuICAgICAgICAgIGRlYnVnKFwiQWNjZXB0aW5nIG5ldyBvZmZlciBmb3IgaGFuZGxlOiAlb1wiLCBoYW5kbGUpO1xuICAgICAgICAgIGpzZXAuc2RwID0gdGhpcy5jb25maWd1cmVTdWJzY3JpYmVyU2RwKGpzZXAuc2RwKTtcbiAgICAgICAgICB2YXIgYW5zd2VyID0gY29ubi5zZXRSZW1vdGVEZXNjcmlwdGlvbihqc2VwKS50aGVuKF8gPT4gY29ubi5jcmVhdGVBbnN3ZXIoKSk7XG4gICAgICAgICAgdmFyIGxvY2FsID0gYW5zd2VyLnRoZW4oYSA9PiBjb25uLnNldExvY2FsRGVzY3JpcHRpb24oYSkpO1xuICAgICAgICAgIHZhciByZW1vdGUgPSBhbnN3ZXIudGhlbihqID0+IGhhbmRsZS5zZW5kSnNlcChqKSk7XG4gICAgICAgICAgUHJvbWlzZS5hbGwoW2xvY2FsLCByZW1vdGVdKS5jYXRjaChlID0+IGVycm9yKFwiRXJyb3IgbmVnb3RpYXRpbmcgYW5zd2VyOiAlb1wiLCBlKSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVB1Ymxpc2hlcigpIHtcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XG4gICAgdmFyIGNvbm4gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XG5cbiAgICBkZWJ1ZyhcInB1YiB3YWl0aW5nIGZvciBzZnVcIik7XG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XG5cbiAgICAvLyBVbnJlbGlhYmxlIGRhdGFjaGFubmVsOiBzZW5kaW5nIGFuZCByZWNlaXZpbmcgY29tcG9uZW50IHVwZGF0ZXMuXG4gICAgLy8gUmVsaWFibGUgZGF0YWNoYW5uZWw6IHNlbmRpbmcgYW5kIHJlY2lldmluZyBlbnRpdHkgaW5zdGFudGlhdGlvbnMuXG4gICAgdmFyIHJlbGlhYmxlQ2hhbm5lbCA9IGNvbm4uY3JlYXRlRGF0YUNoYW5uZWwoXCJyZWxpYWJsZVwiLCB7IG9yZGVyZWQ6IHRydWUgfSk7XG4gICAgdmFyIHVucmVsaWFibGVDaGFubmVsID0gY29ubi5jcmVhdGVEYXRhQ2hhbm5lbChcInVucmVsaWFibGVcIiwge1xuICAgICAgb3JkZXJlZDogZmFsc2UsXG4gICAgICBtYXhSZXRyYW5zbWl0czogMFxuICAgIH0pO1xuICAgIHJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcbiAgICB1bnJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKTtcblxuICAgIHRoaXMuYXNzb2NpYXRlKGNvbm4sIGhhbmRsZSk7XG5cbiAgICBkZWJ1ZyhcInB1YiB3YWl0aW5nIGZvciB3ZWJydGN1cFwiKTtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGhhbmRsZS5vbihcIndlYnJ0Y3VwXCIsIHJlc29sdmUpKTtcblxuICAgIC8vIGRvaW5nIHRoaXMgaGVyZSBpcyBzb3J0IG9mIGEgaGFjayBhcm91bmQgY2hyb21lIHJlbmVnb3RpYXRpb24gd2VpcmRuZXNzIC0tXG4gICAgLy8gaWYgd2UgZG8gaXQgcHJpb3IgdG8gd2VicnRjdXAsIGNocm9tZSBvbiBnZWFyIFZSIHdpbGwgc29tZXRpbWVzIHB1dCBhXG4gICAgLy8gcmVuZWdvdGlhdGlvbiBvZmZlciBpbiBmbGlnaHQgd2hpbGUgdGhlIGZpcnN0IG9mZmVyIHdhcyBzdGlsbCBiZWluZ1xuICAgIC8vIHByb2Nlc3NlZCBieSBqYW51cy4gd2Ugc2hvdWxkIGZpbmQgc29tZSBtb3JlIHByaW5jaXBsZWQgd2F5IHRvIGZpZ3VyZSBvdXRcbiAgICAvLyB3aGVuIGphbnVzIGlzIGRvbmUgaW4gdGhlIGZ1dHVyZS5cbiAgICBpZiAodGhpcy5sb2NhbE1lZGlhU3RyZWFtKSB7XG4gICAgICB0aGlzLmxvY2FsTWVkaWFTdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgIGNvbm4uYWRkVHJhY2sodHJhY2ssIHRoaXMubG9jYWxNZWRpYVN0cmVhbSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgYWxsIG9mIHRoZSBqb2luIGFuZCBsZWF2ZSBldmVudHMuXG4gICAgaGFuZGxlLm9uKFwiZXZlbnRcIiwgZXYgPT4ge1xuICAgICAgdmFyIGRhdGEgPSBldi5wbHVnaW5kYXRhLmRhdGE7XG4gICAgICBpZiAoZGF0YS5ldmVudCA9PSBcImpvaW5cIiAmJiBkYXRhLnJvb21faWQgPT0gdGhpcy5yb29tKSB7XG4gICAgICAgIHRoaXMuYWRkT2NjdXBhbnQoZGF0YS51c2VyX2lkKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5ldmVudCA9PSBcImxlYXZlXCIgJiYgZGF0YS5yb29tX2lkID09IHRoaXMucm9vbSkge1xuICAgICAgICB0aGlzLnJlbW92ZU9jY3VwYW50KGRhdGEudXNlcl9pZCk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGEuZXZlbnQgPT0gXCJibG9ja2VkXCIpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5kaXNwYXRjaEV2ZW50KFxuICAgICAgICAgIG5ldyBDdXN0b21FdmVudChcImJsb2NrZWRcIiwgeyBkZXRhaWw6IHsgY2xpZW50SWQ6IGRhdGEuYnkgfSB9KVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChkYXRhLmV2ZW50ID09IFwidW5ibG9ja2VkXCIpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5kaXNwYXRjaEV2ZW50KFxuICAgICAgICAgIG5ldyBDdXN0b21FdmVudChcInVuYmxvY2tlZFwiLCB7IGRldGFpbDogeyBjbGllbnRJZDogZGF0YS5ieSB9IH0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBkZWJ1ZyhcInB1YiB3YWl0aW5nIGZvciBqb2luXCIpO1xuICAgIC8vIFNlbmQgam9pbiBtZXNzYWdlIHRvIGphbnVzLiBMaXN0ZW4gZm9yIGpvaW4vbGVhdmUgbWVzc2FnZXMuIEF1dG9tYXRpY2FsbHkgc3Vic2NyaWJlIHRvIGFsbCB1c2VycycgV2ViUlRDIGRhdGEuXG4gICAgdmFyIG1lc3NhZ2UgPSBhd2FpdCB0aGlzLnNlbmRKb2luKGhhbmRsZSwge1xuICAgICAgbm90aWZpY2F0aW9uczogdHJ1ZSxcbiAgICAgIGRhdGE6IHRydWVcbiAgICB9KTtcblxuICAgIGlmICghbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEuc3VjY2Vzcykge1xuICAgICAgY29uc3QgZXJyID0gbWVzc2FnZS5wbHVnaW5kYXRhLmRhdGEuZXJyb3I7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuXG4gICAgdmFyIGluaXRpYWxPY2N1cGFudHMgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YS5yZXNwb25zZS51c2Vyc1t0aGlzLnJvb21dIHx8IFtdO1xuXG4gICAgZGVidWcoXCJwdWJsaXNoZXIgcmVhZHlcIik7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhhbmRsZSxcbiAgICAgIGluaXRpYWxPY2N1cGFudHMsXG4gICAgICByZWxpYWJsZUNoYW5uZWwsXG4gICAgICB1bnJlbGlhYmxlQ2hhbm5lbCxcbiAgICAgIGNvbm5cbiAgICB9O1xuICB9XG5cbiAgY29uZmlndXJlU3Vic2NyaWJlclNkcChvcmlnaW5hbFNkcCkge1xuICAgIGlmICghaXNIMjY0VmlkZW9TdXBwb3J0ZWQpIHtcbiAgICAgIHJldHVybiBvcmlnaW5hbFNkcDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBIYWNrIHRvIGdldCB2aWRlbyB3b3JraW5nIG9uIENocm9tZSBmb3IgQW5kcm9pZC4gaHR0cHM6Ly9ncm91cHMuZ29vZ2xlLmNvbS9mb3J1bS8jIXRvcGljL21vemlsbGEuZGV2Lm1lZGlhL1llMjl2dU1UcG84XG4gICAgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkFuZHJvaWRcIikgPT09IC0xKSB7XG4gICAgICByZXR1cm4gb3JpZ2luYWxTZHAucmVwbGFjZShcbiAgICAgICAgXCJhPXJ0Y3AtZmI6MTA3IGdvb2ctcmVtYlxcclxcblwiLFxuICAgICAgICBcImE9cnRjcC1mYjoxMDcgZ29vZy1yZW1iXFxyXFxuYT1ydGNwLWZiOjEwNyB0cmFuc3BvcnQtY2NcXHJcXG5hPWZtdHA6MTA3IGxldmVsLWFzeW1tZXRyeS1hbGxvd2VkPTE7cGFja2V0aXphdGlvbi1tb2RlPTE7cHJvZmlsZS1sZXZlbC1pZD00MmUwMWZcXHJcXG5cIlxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9yaWdpbmFsU2RwLnJlcGxhY2UoXG4gICAgICAgIFwiYT1ydGNwLWZiOjEwNyBnb29nLXJlbWJcXHJcXG5cIixcbiAgICAgICAgXCJhPXJ0Y3AtZmI6MTA3IGdvb2ctcmVtYlxcclxcbmE9cnRjcC1mYjoxMDcgdHJhbnNwb3J0LWNjXFxyXFxuYT1mbXRwOjEwNyBsZXZlbC1hc3ltbWV0cnktYWxsb3dlZD0xO3BhY2tldGl6YXRpb24tbW9kZT0xO3Byb2ZpbGUtbGV2ZWwtaWQ9NDIwMDFmXFxyXFxuXCJcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKSB7XG4gICAgdmFyIGhhbmRsZSA9IG5ldyBtai5KYW51c1BsdWdpbkhhbmRsZSh0aGlzLnNlc3Npb24pO1xuICAgIHZhciBjb25uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKFBFRVJfQ09OTkVDVElPTl9DT05GSUcpO1xuXG4gICAgZGVidWcoXCJzdWIgd2FpdGluZyBmb3Igc2Z1XCIpO1xuICAgIGF3YWl0IGhhbmRsZS5hdHRhY2goXCJqYW51cy5wbHVnaW4uc2Z1XCIpO1xuXG4gICAgdGhpcy5hc3NvY2lhdGUoY29ubiwgaGFuZGxlKTtcblxuICAgIGRlYnVnKFwic3ViIHdhaXRpbmcgZm9yIGpvaW5cIik7XG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIERvbid0IGxpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gU3Vic2NyaWJlIHRvIHRoZSBvY2N1cGFudCdzIG1lZGlhLlxuICAgIC8vIEphbnVzIHNob3VsZCBzZW5kIHVzIGFuIG9mZmVyIGZvciB0aGlzIG9jY3VwYW50J3MgbWVkaWEgaW4gcmVzcG9uc2UgdG8gdGhpcy5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5zZW5kSm9pbihoYW5kbGUsIHsgbWVkaWE6IG9jY3VwYW50SWQgfSk7XG5cbiAgICBkZWJ1ZyhcInN1YiB3YWl0aW5nIGZvciB3ZWJydGN1cFwiKTtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGhhbmRsZS5vbihcIndlYnJ0Y3VwXCIsIHJlc29sdmUpKTtcblxuICAgIHZhciBtZWRpYVN0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xuICAgIHZhciByZWNlaXZlcnMgPSBjb25uLmdldFJlY2VpdmVycygpO1xuICAgIHJlY2VpdmVycy5mb3JFYWNoKHJlY2VpdmVyID0+IHtcbiAgICAgIGlmIChyZWNlaXZlci50cmFjaykge1xuICAgICAgICBtZWRpYVN0cmVhbS5hZGRUcmFjayhyZWNlaXZlci50cmFjayk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKG1lZGlhU3RyZWFtLmdldFRyYWNrcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbWVkaWFTdHJlYW0gPSBudWxsO1xuICAgIH1cblxuICAgIGRlYnVnKFwic3Vic2NyaWJlciByZWFkeVwiKTtcbiAgICByZXR1cm4ge1xuICAgICAgaGFuZGxlLFxuICAgICAgbWVkaWFTdHJlYW0sXG4gICAgICBjb25uXG4gICAgfTtcbiAgfVxuXG4gIHNlbmRKb2luKGhhbmRsZSwgc3Vic2NyaWJlKSB7XG4gICAgcmV0dXJuIGhhbmRsZS5zZW5kTWVzc2FnZSh7XG4gICAgICBraW5kOiBcImpvaW5cIixcbiAgICAgIHJvb21faWQ6IHRoaXMucm9vbSxcbiAgICAgIHVzZXJfaWQ6IHRoaXMudXNlcklkLFxuICAgICAgc3Vic2NyaWJlXG4gICAgfSk7XG4gIH1cblxuICB0b2dnbGVGcmVlemUoKSB7XG4gICAgaWYodGhpcy5mcm96ZW4pIHtcbiAgICAgIHRoaXMudW5mcmVlemUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5mcmVlemUoKTtcbiAgICB9XG4gIH1cblxuICBmcmVlemUoKSB7XG4gICAgdGhpcy5mcm96ZW4gPSB0cnVlO1xuICB9XG5cbiAgdW5mcmVlemUoKSB7XG4gICAgdGhpcy5mcm96ZW4gPSBmYWxzZTtcbiAgICB0aGlzLmZsdXNoUGVuZGluZ1VwZGF0ZXMoKTtcbiAgfVxuXG4gIGZsdXNoUGVuZGluZ1VwZGF0ZXMoKSB7XG4gICAgZm9yIChjb25zdCBbbmV0d29ya0lkLCBtZXNzYWdlXSBvZiB0aGlzLmZyb3plblVwZGF0ZXMpIHtcbiAgICAgIC8vIGlnbm9yZSBtZXNzYWdlcyByZWxhdGluZyB0byB1c2VycyB3aG8gaGF2ZSBkaXNjb25uZWN0ZWQgc2luY2UgZnJlZXppbmcsIHRoZWlyIGVudGl0aWVzIHdpbGwgaGF2ZSBhbGVhZHkgYmVlbiByZW1vdmVkIGJ5IE5BRlxuICAgICAgLy8gbm90ZSB0aGF0IGRlbGV0ZSBtZXNzYWdlcyBoYXZlIG5vIFwib3duZXJcIiBzbyB3ZSBoYXZlIHRvIGNoZWNrIGZvciB0aGF0IGFzIHdlbGxcbiAgICAgIGlmKG1lc3NhZ2UuZGF0YS5vd25lciAmJiAhdGhpcy5vY2N1cGFudHNbbWVzc2FnZS5kYXRhLm93bmVyXSkgY29udGludWU7XG5cbiAgICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UobnVsbCwgbWVzc2FnZS5kYXRhVHlwZSwgbWVzc2FnZS5kYXRhKTtcbiAgICB9XG4gICAgdGhpcy5mcm96ZW5VcGRhdGVzLmNsZWFyKCk7XG4gIH1cblxuICBzdG9yZU1lc3NhZ2UobWVzc2FnZSkge1xuICAgIGNvbnN0IG5ldHdvcmtJZCA9IG1lc3NhZ2UuZGF0YS5uZXR3b3JrSWQ7XG4gICAgaWYoIXRoaXMuZnJvemVuVXBkYXRlcy5oYXMobmV0d29ya0lkKSkge1xuICAgICAgdGhpcy5mcm96ZW5VcGRhdGVzLnNldChuZXR3b3JrSWQsIG1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdG9yZWRNZXNzYWdlID0gdGhpcy5mcm96ZW5VcGRhdGVzLmdldChuZXR3b3JrSWQpO1xuXG4gICAgICAvLyBBdm9pZCB1cGRhdGluZyBjb21wb25lbnRzIGlmIHRoZSBlbnRpdHkgZGF0YSByZWNlaXZlZCBkaWQgbm90IGNvbWUgZnJvbSB0aGUgY3VycmVudCBvd25lci5cbiAgICAgIGlmIChtZXNzYWdlLmRhdGEubGFzdE93bmVyVGltZSA8IHN0b3JlZE1lc3NhZ2UuZGF0YS5sYXN0T3duZXJUaW1lIHx8XG4gICAgICAgICAgICAoc3RvcmVkTWVzc2FnZS5kYXRhLmxhc3RPd25lclRpbWUgPT09IG1lc3NhZ2UuZGF0YS5sYXN0T3duZXJUaW1lICYmIHN0b3JlZE1lc3NhZ2UuZGF0YS5vd25lciA+IG1lc3NhZ2UuZGF0YS5vd25lcikpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBEZWxldGUgbWVzc2FnZXMgb3ZlcnJpZGUgYW55IG90aGVyIG1lc3NhZ2VzIGZvciB0aGlzIGVudGl0eVxuICAgICAgaWYobWVzc2FnZS5kYXRhVHlwZSA9PT0gXCJyXCIpIHtcbiAgICAgICAgdGhpcy5mcm96ZW5VcGRhdGVzLnNldChuZXR3b3JrSWQsIG1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbWVyZ2UgaW4gY29tcG9uZW50IHVwZGF0ZXNcbiAgICAgICAgT2JqZWN0LmFzc2lnbihzdG9yZWRNZXNzYWdlLmRhdGEuY29tcG9uZW50cywgbWVzc2FnZS5kYXRhLmNvbXBvbmVudHMpO1xuICAgICAgfVxuICAgICAgc3RvcmVkTWVzc2FnZS5kYXRhLmlzRmlyc3RTeW5jID0gc3RvcmVkTWVzc2FnZS5kYXRhLmlzRmlyc3RTeW5jIHx8IG1lc3NhZ2UuZGF0YS5pc0ZpcnN0U3luYztcbiAgICB9XG4gIH1cblxuICBvbkRhdGFDaGFubmVsTWVzc2FnZShldmVudCkge1xuICAgIHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcblxuICAgIGlmKCFtZXNzYWdlLmRhdGFUeXBlKSByZXR1cm47XG5cbiAgICBpZih0aGlzLmZyb3plbikge1xuICAgICAgdGhpcy5zdG9yZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UobnVsbCwgbWVzc2FnZS5kYXRhVHlwZSwgbWVzc2FnZS5kYXRhKTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRTdGFydENvbm5lY3Rpb25UbyhjbGllbnQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHN0YXJ0U3RyZWFtQ29ubmVjdGlvbihjbGllbnQpIHt9XG5cbiAgY2xvc2VTdHJlYW1Db25uZWN0aW9uKGNsaWVudCkge31cblxuICBnZXRDb25uZWN0U3RhdHVzKGNsaWVudElkKSB7XG4gICAgcmV0dXJuIHRoaXMub2NjdXBhbnRzW2NsaWVudElkXSA/IE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQgOiBOQUYuYWRhcHRlcnMuTk9UX0NPTk5FQ1RFRDtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZVRpbWVPZmZzZXQoKSB7XG4gICAgaWYgKHRoaXMuaXNEaXNjb25uZWN0ZWQoKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgY2xpZW50U2VudFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goZG9jdW1lbnQubG9jYXRpb24uaHJlZiwge1xuICAgICAgbWV0aG9kOiBcIkhFQURcIixcbiAgICAgIGNhY2hlOiBcIm5vLWNhY2hlXCJcbiAgICB9KTtcblxuICAgIGNvbnN0IHByZWNpc2lvbiA9IDEwMDA7XG4gICAgY29uc3Qgc2VydmVyUmVjZWl2ZWRUaW1lID0gbmV3IERhdGUocmVzLmhlYWRlcnMuZ2V0KFwiRGF0ZVwiKSkuZ2V0VGltZSgpICsgcHJlY2lzaW9uIC8gMjtcbiAgICBjb25zdCBjbGllbnRSZWNlaXZlZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHNlcnZlclRpbWUgPSBzZXJ2ZXJSZWNlaXZlZFRpbWUgKyAoY2xpZW50UmVjZWl2ZWRUaW1lIC0gY2xpZW50U2VudFRpbWUpIC8gMjtcbiAgICBjb25zdCB0aW1lT2Zmc2V0ID0gc2VydmVyVGltZSAtIGNsaWVudFJlY2VpdmVkVGltZTtcblxuICAgIHRoaXMuc2VydmVyVGltZVJlcXVlc3RzKys7XG5cbiAgICBpZiAodGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPD0gMTApIHtcbiAgICAgIHRoaXMudGltZU9mZnNldHMucHVzaCh0aW1lT2Zmc2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50aW1lT2Zmc2V0c1t0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyAlIDEwXSA9IHRpbWVPZmZzZXQ7XG4gICAgfVxuXG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gdGhpcy50aW1lT2Zmc2V0cy5yZWR1Y2UoKGFjYywgb2Zmc2V0KSA9PiAoYWNjICs9IG9mZnNldCksIDApIC8gdGhpcy50aW1lT2Zmc2V0cy5sZW5ndGg7XG5cbiAgICBpZiAodGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPiAxMCkge1xuICAgICAgZGVidWcoYG5ldyBzZXJ2ZXIgdGltZSBvZmZzZXQ6ICR7dGhpcy5hdmdUaW1lT2Zmc2V0fW1zYCk7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMudXBkYXRlVGltZU9mZnNldCgpLCA1ICogNjAgKiAxMDAwKTsgLy8gU3luYyBjbG9jayBldmVyeSA1IG1pbnV0ZXMuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXBkYXRlVGltZU9mZnNldCgpO1xuICAgIH1cbiAgfVxuXG4gIGdldFNlcnZlclRpbWUoKSB7XG4gICAgcmV0dXJuIERhdGUubm93KCkgKyB0aGlzLmF2Z1RpbWVPZmZzZXQ7XG4gIH1cblxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCwgdHlwZSA9IFwiYXVkaW9cIikge1xuICAgIGlmICh0aGlzLm1lZGlhU3RyZWFtc1tjbGllbnRJZF0pIHtcbiAgICAgIGRlYnVnKGBBbHJlYWR5IGhhZCAke3R5cGV9IGZvciAke2NsaWVudElkfWApO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm1lZGlhU3RyZWFtc1tjbGllbnRJZF1bdHlwZV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1ZyhgV2FpdGluZyBvbiAke3R5cGV9IGZvciAke2NsaWVudElkfWApO1xuICAgICAgaWYgKCF0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmhhcyhjbGllbnRJZCkpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5zZXQoY2xpZW50SWQsIHt9KTtcblxuICAgICAgICBjb25zdCBhdWRpb1Byb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQoY2xpZW50SWQpLmF1ZGlvID0geyByZXNvbHZlLCByZWplY3QgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHZpZGVvUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChjbGllbnRJZCkudmlkZW8gPSB7IHJlc29sdmUsIHJlamVjdCB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChjbGllbnRJZCkuYXVkaW8ucHJvbWlzZSA9IGF1ZGlvUHJvbWlzZTtcbiAgICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQoY2xpZW50SWQpLnZpZGVvLnByb21pc2UgPSB2aWRlb1Byb21pc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQoY2xpZW50SWQpW3R5cGVdLnByb21pc2U7XG4gICAgfVxuICB9XG5cbiAgc2V0TWVkaWFTdHJlYW0oY2xpZW50SWQsIHN0cmVhbSkge1xuICAgIC8vIFNhZmFyaSBkb2Vzbid0IGxpa2UgaXQgd2hlbiB5b3UgdXNlIHNpbmdsZSBhIG1peGVkIG1lZGlhIHN0cmVhbSB3aGVyZSBvbmUgb2YgdGhlIHRyYWNrcyBpcyBpbmFjdGl2ZSwgc28gd2VcbiAgICAvLyBzcGxpdCB0aGUgdHJhY2tzIGludG8gdHdvIHN0cmVhbXMuXG4gICAgY29uc3QgYXVkaW9TdHJlYW0gPSBuZXcgTWVkaWFTdHJlYW0oKTtcbiAgICBzdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IGF1ZGlvU3RyZWFtLmFkZFRyYWNrKHRyYWNrKSk7XG4gICAgY29uc3QgdmlkZW9TdHJlYW0gPSBuZXcgTWVkaWFTdHJlYW0oKTtcbiAgICBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHZpZGVvU3RyZWFtLmFkZFRyYWNrKHRyYWNrKSk7XG5cbiAgICB0aGlzLm1lZGlhU3RyZWFtc1tjbGllbnRJZF0gPSB7IGF1ZGlvOiBhdWRpb1N0cmVhbSwgdmlkZW86IHZpZGVvU3RyZWFtIH07XG5cbiAgICAvLyBSZXNvbHZlIHRoZSBwcm9taXNlIGZvciB0aGUgdXNlcidzIG1lZGlhIHN0cmVhbSBpZiBpdCBleGlzdHMuXG4gICAgaWYgKHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuaGFzKGNsaWVudElkKSkge1xuICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQoY2xpZW50SWQpLmF1ZGlvLnJlc29sdmUoYXVkaW9TdHJlYW0pO1xuICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQoY2xpZW50SWQpLnZpZGVvLnJlc29sdmUodmlkZW9TdHJlYW0pO1xuICAgIH1cbiAgfVxuXG4gIHNldExvY2FsTWVkaWFTdHJlYW0oc3RyZWFtKSB7XG4gICAgLy8gb3VyIGpvYiBoZXJlIGlzIHRvIG1ha2Ugc3VyZSB0aGUgY29ubmVjdGlvbiB3aW5kcyB1cCB3aXRoIFJUUCBzZW5kZXJzIHNlbmRpbmcgdGhlIHN0dWZmIGluIHRoaXMgc3RyZWFtLFxuICAgIC8vIGFuZCBub3QgdGhlIHN0dWZmIHRoYXQgaXNuJ3QgaW4gdGhpcyBzdHJlYW0uIHN0cmF0ZWd5IGlzIHRvIHJlcGxhY2UgZXhpc3RpbmcgdHJhY2tzIGlmIHdlIGNhbiwgYWRkIHRyYWNrc1xuICAgIC8vIHRoYXQgd2UgY2FuJ3QgcmVwbGFjZSwgYW5kIGRpc2FibGUgdHJhY2tzIHRoYXQgZG9uJ3QgZXhpc3QgYW55bW9yZS5cblxuICAgIC8vIG5vdGUgdGhhdCB3ZSBkb24ndCBldmVyIHJlbW92ZSBhIHRyYWNrIGZyb20gdGhlIHN0cmVhbSAtLSBzaW5jZSBKYW51cyBkb2Vzbid0IHN1cHBvcnQgVW5pZmllZCBQbGFuLCB3ZSBhYnNvbHV0ZWx5XG4gICAgLy8gY2FuJ3Qgd2luZCB1cCB3aXRoIGEgU0RQIHRoYXQgaGFzID4xIGF1ZGlvIG9yID4xIHZpZGVvIHRyYWNrcywgZXZlbiBpZiBvbmUgb2YgdGhlbSBpcyBpbmFjdGl2ZSAod2hhdCB5b3UgZ2V0IGlmXG4gICAgLy8geW91IHJlbW92ZSBhIHRyYWNrIGZyb20gYW4gZXhpc3Rpbmcgc3RyZWFtLilcbiAgICBpZiAodGhpcy5wdWJsaXNoZXIgJiYgdGhpcy5wdWJsaXNoZXIuY29ubikge1xuICAgICAgdmFyIGV4aXN0aW5nU2VuZGVycyA9IHRoaXMucHVibGlzaGVyLmNvbm4uZ2V0U2VuZGVycygpO1xuICAgICAgdmFyIG5ld1NlbmRlcnMgPSBbXTtcbiAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHQgPT4ge1xuICAgICAgICB2YXIgc2VuZGVyID0gZXhpc3RpbmdTZW5kZXJzLmZpbmQocyA9PiBzLnRyYWNrICE9IG51bGwgJiYgcy50cmFjay5raW5kID09IHQua2luZCk7XG4gICAgICAgIGlmIChzZW5kZXIgIT0gbnVsbCkge1xuICAgICAgICAgIGlmIChzZW5kZXIucmVwbGFjZVRyYWNrKSB7XG4gICAgICAgICAgICBzZW5kZXIucmVwbGFjZVRyYWNrKHQpO1xuICAgICAgICAgICAgc2VuZGVyLnRyYWNrLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyByZXBsYWNlVHJhY2sgaXNuJ3QgaW1wbGVtZW50ZWQgaW4gQ2hyb21lLCBldmVuIHZpYSB3ZWJydGMtYWRhcHRlci5cbiAgICAgICAgICAgIHN0cmVhbS5yZW1vdmVUcmFjayhzZW5kZXIudHJhY2spO1xuICAgICAgICAgICAgc3RyZWFtLmFkZFRyYWNrKHQpO1xuICAgICAgICAgICAgdC5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV3U2VuZGVycy5wdXNoKHNlbmRlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3U2VuZGVycy5wdXNoKHRoaXMucHVibGlzaGVyLmNvbm4uYWRkVHJhY2sodCwgc3RyZWFtKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZXhpc3RpbmdTZW5kZXJzLmZvckVhY2gocyA9PiB7XG4gICAgICAgIGlmICghbmV3U2VuZGVycy5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgIHMudHJhY2suZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5sb2NhbE1lZGlhU3RyZWFtID0gc3RyZWFtO1xuICAgIHRoaXMuc2V0TWVkaWFTdHJlYW0odGhpcy51c2VySWQsIHN0cmVhbSk7XG4gIH1cblxuICBlbmFibGVNaWNyb3Bob25lKGVuYWJsZWQpIHtcbiAgICBpZiAodGhpcy5wdWJsaXNoZXIgJiYgdGhpcy5wdWJsaXNoZXIuY29ubikge1xuICAgICAgdGhpcy5wdWJsaXNoZXIuY29ubi5nZXRTZW5kZXJzKCkuZm9yRWFjaChzID0+IHtcbiAgICAgICAgaWYgKHMudHJhY2sua2luZCA9PSBcImF1ZGlvXCIpIHtcbiAgICAgICAgICBzLnRyYWNrLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzZW5kRGF0YShjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcbiAgICBpZiAoIXRoaXMucHVibGlzaGVyKSB7XG4gICAgICByZXR1cm4gY29uc29sZS53YXJuKFwic2VuZERhdGEgY2FsbGVkIHdpdGhvdXQgYSBwdWJsaXNoZXJcIik7XG4gICAgfVxuXG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSB9KSk7XG4gIH1cblxuICBzZW5kRGF0YUd1YXJhbnRlZWQoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XG4gICAgaWYgKCF0aGlzLnB1Ymxpc2hlcikge1xuICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihcInNlbmREYXRhR3VhcmFudGVlZCBjYWxsZWQgd2l0aG91dCBhIHB1Ymxpc2hlclwiKTtcbiAgICB9XG5cbiAgICB0aGlzLnB1Ymxpc2hlci5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSB9KSk7XG4gIH1cblxuICBicm9hZGNhc3REYXRhKGRhdGFUeXBlLCBkYXRhKSB7XG4gICAgaWYgKCF0aGlzLnB1Ymxpc2hlcikge1xuICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihcImJyb2FkY2FzdERhdGEgY2FsbGVkIHdpdGhvdXQgYSBwdWJsaXNoZXJcIik7XG4gICAgfVxuXG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcbiAgfVxuXG4gIGJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKGRhdGFUeXBlLCBkYXRhKSB7XG4gICAgaWYgKCF0aGlzLnB1Ymxpc2hlcikge1xuICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihcImJyb2FkY2FzdERhdGFHdWFyYW50ZWVkIGNhbGxlZCB3aXRob3V0IGEgcHVibGlzaGVyXCIpO1xuICAgIH1cblxuICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgZGF0YVR5cGUsIGRhdGEgfSkpO1xuICB9XG5cbiAgYmxvY2soY2xpZW50SWQpe1xuICAgIHJldHVybiB0aGlzLnB1Ymxpc2hlci5oYW5kbGUuc2VuZE1lc3NhZ2UoeyBraW5kOiBcImJsb2NrXCIsIHdob206IGNsaWVudElkIH0pLnRoZW4oKCk9PntcbiAgICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgbmV3IEN1c3RvbUV2ZW50KFwiYmxvY2tlZFwiLCB7IGRldGFpbDogeyBjbGllbnRJZDogY2xpZW50SWQgfSB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuYmxvY2soY2xpZW50SWQpe1xuICAgIHJldHVybiB0aGlzLnB1Ymxpc2hlci5oYW5kbGUuc2VuZE1lc3NhZ2UoeyBraW5kOiBcInVuYmxvY2tcIiwgd2hvbTogY2xpZW50SWQgfSkudGhlbigoKT0+e1xuICAgICAgZG9jdW1lbnQuYm9keS5kaXNwYXRjaEV2ZW50KFxuICAgICAgICBuZXcgQ3VzdG9tRXZlbnQoXCJ1bmJsb2NrZWRcIiwgeyBkZXRhaWw6IHsgY2xpZW50SWQ6IGNsaWVudElkIH0gfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbn1cblxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwiamFudXNcIiwgSmFudXNBZGFwdGVyKTtcblxubW9kdWxlLmV4cG9ydHMgPSBKYW51c0FkYXB0ZXI7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvaW5kZXguanMiLCIvKipcbiAqIFJlcHJlc2VudHMgYSBoYW5kbGUgdG8gYSBzaW5nbGUgSmFudXMgcGx1Z2luIG9uIGEgSmFudXMgc2Vzc2lvbi4gRWFjaCBXZWJSVEMgY29ubmVjdGlvbiB0byB0aGUgSmFudXMgc2VydmVyIHdpbGwgYmVcbiAqIGFzc29jaWF0ZWQgd2l0aCBhIHNpbmdsZSBoYW5kbGUuIE9uY2UgYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgdGhpcyBoYW5kbGUgd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmVcbiAqIHVzZWQgdG8gYXNzb2NpYXRlIGl0IHdpdGggZnV0dXJlIHNpZ25hbGxpbmcgbWVzc2FnZXMuXG4gKlxuICogU2VlIGh0dHBzOi8vamFudXMuY29uZi5tZWV0ZWNoby5jb20vZG9jcy9yZXN0Lmh0bWwjaGFuZGxlcy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzUGx1Z2luSGFuZGxlKHNlc3Npb24pIHtcbiAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcbiAgdGhpcy5pZCA9IHVuZGVmaW5lZDtcbn1cblxuLyoqIEF0dGFjaGVzIHRoaXMgaGFuZGxlIHRvIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihwbHVnaW4pIHtcbiAgdmFyIHBheWxvYWQgPSB7IHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKFwiYXR0YWNoXCIsIHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwiZGV0YWNoXCIpO1xufTtcblxuLyoqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGZpcmVkIHVwb24gdGhlIHJlY2VwdGlvbiBvZiBhbnkgaW5jb21pbmcgSmFudXMgc2lnbmFscyBmb3IgdGhpcyBwbHVnaW4gaGFuZGxlIHdpdGggdGhlXG4gKiBgamFudXNgIGF0dHJpYnV0ZSBlcXVhbCB0byBgZXZgLlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXYsIGNhbGxiYWNrKSB7XG4gIHJldHVybiB0aGlzLnNlc3Npb24ub24oZXYsIHNpZ25hbCA9PiB7XG4gICAgaWYgKHNpZ25hbC5zZW5kZXIgPT0gdGhpcy5pZCkge1xuICAgICAgY2FsbGJhY2soc2lnbmFsKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBTZW5kcyBhIHNpZ25hbCBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24odHlwZSwgc2lnbmFsKSB7XG4gIHJldHVybiB0aGlzLnNlc3Npb24uc2VuZCh0eXBlLCBPYmplY3QuYXNzaWduKHsgaGFuZGxlX2lkOiB0aGlzLmlkIH0sIHNpZ25hbCkpO1xufTtcblxuLyoqIFNlbmRzIGEgcGx1Z2luLXNwZWNpZmljIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcIm1lc3NhZ2VcIiwgeyBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcIm1lc3NhZ2VcIiwgeyBib2R5OiB7fSwganNlcDoganNlcCB9KTtcbn07XG5cbi8qKiBTZW5kcyBhbiBJQ0UgdHJpY2tsZSBjYW5kaWRhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kVHJpY2tsZSA9IGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwidHJpY2tsZVwiLCB7IGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHZlcmJvc2U6IGZhbHNlLFxuICAgIHRpbWVvdXRNczogMTAwMDAsXG4gICAga2VlcGFsaXZlTXM6IDMwMDAwXG4gIH0sIG9wdGlvbnMpO1xufVxuXG4vKiogQ3JlYXRlcyB0aGlzIHNlc3Npb24gb24gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcImNyZWF0ZVwiKS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBEZXN0cm95cyB0aGlzIHNlc3Npb24uIE5vdGUgdGhhdCB1cG9uIGRlc3RydWN0aW9uLCBKYW51cyB3aWxsIGFsc28gY2xvc2UgdGhlIHNpZ25hbGxpbmcgdHJhbnNwb3J0IChpZiBhcHBsaWNhYmxlKSBhbmRcbiAqIGFueSBvcGVuIFdlYlJUQyBjb25uZWN0aW9ucy5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwiZGVzdHJveVwiKS50aGVuKChyZXNwKSA9PiB7XG4gICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBEaXNwb3NlcyBvZiB0aGlzIHNlc3Npb24gaW4gYSB3YXkgc3VjaCB0aGF0IG5vIGZ1cnRoZXIgaW5jb21pbmcgc2lnbmFsbGluZyBtZXNzYWdlcyB3aWxsIGJlIHByb2Nlc3NlZC5cbiAqIE91dHN0YW5kaW5nIHRyYW5zYWN0aW9ucyB3aWxsIGJlIHJlamVjdGVkLlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2tpbGxLZWVwYWxpdmUoKTtcbiAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gIGZvciAodmFyIHR4SWQgaW4gdGhpcy50eG5zKSB7XG4gICAgaWYgKHRoaXMudHhucy5oYXNPd25Qcm9wZXJ0eSh0eElkKSkge1xuICAgICAgdmFyIHR4biA9IHRoaXMudHhuc1t0eElkXTtcbiAgICAgIGNsZWFyVGltZW91dCh0eG4udGltZW91dCk7XG4gICAgICB0eG4ucmVqZWN0KG5ldyBFcnJvcihcIkphbnVzIHNlc3Npb24gd2FzIGRpc3Bvc2VkLlwiKSk7XG4gICAgICBkZWxldGUgdGhpcy50eG5zW3R4SWRdO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBXaGV0aGVyIHRoaXMgc2lnbmFsIHJlcHJlc2VudHMgYW4gZXJyb3IsIGFuZCB0aGUgYXNzb2NpYXRlZCBwcm9taXNlIChpZiBhbnkpIHNob3VsZCBiZSByZWplY3RlZC5cbiAqIFVzZXJzIHNob3VsZCBvdmVycmlkZSB0aGlzIHRvIGhhbmRsZSBhbnkgY3VzdG9tIHBsdWdpbi1zcGVjaWZpYyBlcnJvciBjb252ZW50aW9ucy5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuaXNFcnJvciA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICByZXR1cm4gc2lnbmFsLmphbnVzID09PSBcImVycm9yXCI7XG59O1xuXG4vKiogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgZmlyZWQgdXBvbiB0aGUgcmVjZXB0aW9uIG9mIGFueSBpbmNvbWluZyBKYW51cyBzaWduYWxzIGZvciB0aGlzIHNlc3Npb24gd2l0aCB0aGVcbiAqIGBqYW51c2AgYXR0cmlidXRlIGVxdWFsIHRvIGBldmAuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXYsIGNhbGxiYWNrKSB7XG4gIHZhciBoYW5kbGVycyA9IHRoaXMuZXZlbnRIYW5kbGVyc1tldl07XG4gIGlmIChoYW5kbGVycyA9PSBudWxsKSB7XG4gICAgaGFuZGxlcnMgPSB0aGlzLmV2ZW50SGFuZGxlcnNbZXZdID0gW107XG4gIH1cbiAgaGFuZGxlcnMucHVzaChjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIENhbGxiYWNrIGZvciByZWNlaXZpbmcgSlNPTiBzaWduYWxsaW5nIG1lc3NhZ2VzIHBlcnRpbmVudCB0byB0aGlzIHNlc3Npb24uIElmIHRoZSBzaWduYWxzIGFyZSByZXNwb25zZXMgdG8gcHJldmlvdXNseVxuICogc2VudCBzaWduYWxzLCB0aGUgcHJvbWlzZXMgZm9yIHRoZSBvdXRnb2luZyBzaWduYWxzIHdpbGwgYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgYXBwcm9wcmlhdGVseSB3aXRoIHRoaXMgc2lnbmFsIGFzIGFuXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBFeHRlcm5hbCBjYWxsZXJzIHNob3VsZCBjYWxsIHRoaXMgZnVuY3Rpb24gZXZlcnkgdGltZSBhIG5ldyBzaWduYWwgYXJyaXZlcyBvbiB0aGUgdHJhbnNwb3J0OyBmb3IgZXhhbXBsZSwgaW4gYVxuICogV2ViU29ja2V0J3MgYG1lc3NhZ2VgIGV2ZW50LCBvciB3aGVuIGEgbmV3IGRhdHVtIHNob3dzIHVwIGluIGFuIEhUVFAgbG9uZy1wb2xsaW5nIHJlc3BvbnNlLlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5yZWNlaXZlID0gZnVuY3Rpb24oc2lnbmFsKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMudmVyYm9zZSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJJbmNvbWluZyBKYW51cyBzaWduYWw6IFwiLCBzaWduYWwpO1xuICB9XG4gIGlmIChzaWduYWwuc2Vzc2lvbl9pZCAhPSB0aGlzLmlkKSB7XG4gICAgY29uc29sZS53YXJuKFwiSW5jb3JyZWN0IHNlc3Npb24gSUQgcmVjZWl2ZWQgaW4gSmFudXMgc2lnbmFsbGluZyBtZXNzYWdlOiB3YXMgXCIgKyBzaWduYWwuc2Vzc2lvbl9pZCArIFwiLCBleHBlY3RlZCBcIiArIHRoaXMuaWQgKyBcIi5cIik7XG4gIH1cblxuICB2YXIgcmVzcG9uc2VUeXBlID0gc2lnbmFsLmphbnVzO1xuICB2YXIgaGFuZGxlcnMgPSB0aGlzLmV2ZW50SGFuZGxlcnNbcmVzcG9uc2VUeXBlXTtcbiAgaWYgKGhhbmRsZXJzICE9IG51bGwpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBoYW5kbGVyc1tpXShzaWduYWwpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzaWduYWwudHJhbnNhY3Rpb24gIT0gbnVsbCkge1xuICAgIHZhciB0eG4gPSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICBpZiAodHhuID09IG51bGwpIHtcbiAgICAgIC8vIHRoaXMgaXMgYSByZXNwb25zZSB0byBhIHRyYW5zYWN0aW9uIHRoYXQgd2Fzbid0IGNhdXNlZCB2aWEgSmFudXNTZXNzaW9uLnNlbmQsIG9yIGEgcGx1Z2luIHJlcGxpZWQgdHdpY2UgdG8gYVxuICAgICAgLy8gc2luZ2xlIHJlcXVlc3QsIG9yIHRoZSBzZXNzaW9uIHdhcyBkaXNwb3NlZCwgb3Igc29tZXRoaW5nIGVsc2UgdGhhdCBpc24ndCB1bmRlciBvdXIgcHVydmlldzsgdGhhdCdzIGZpbmVcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocmVzcG9uc2VUeXBlID09PSBcImFja1wiICYmIHR4bi50eXBlID09IFwibWVzc2FnZVwiKSB7XG4gICAgICAvLyB0aGlzIGlzIGFuIGFjayBvZiBhbiBhc3luY2hyb25vdXNseS1wcm9jZXNzZWQgcGx1Z2luIHJlcXVlc3QsIHdlIHNob3VsZCB3YWl0IHRvIHJlc29sdmUgdGhlIHByb21pc2UgdW50aWwgdGhlXG4gICAgICAvLyBhY3R1YWwgcmVzcG9uc2UgY29tZXMgaW5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjbGVhclRpbWVvdXQodHhuLnRpbWVvdXQpO1xuXG4gICAgZGVsZXRlIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgICh0aGlzLmlzRXJyb3Ioc2lnbmFsKSA/IHR4bi5yZWplY3QgOiB0eG4ucmVzb2x2ZSkoc2lnbmFsKTtcbiAgfVxufTtcblxuLyoqXG4gKiBTZW5kcyBhIHNpZ25hbCBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uLCBiZWdpbm5pbmcgYSBuZXcgdHJhbnNhY3Rpb24uIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbCBiZSByZXNvbHZlZCBvclxuICogcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIGlzIHJlY2VpdmVkIGluIHRoZSBzYW1lIHRyYW5zYWN0aW9uLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGUgc2Vzc2lvblxuICogdGltZW91dC5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHR5cGUsIHNpZ25hbCkge1xuICBzaWduYWwgPSBPYmplY3QuYXNzaWduKHsgdHJhbnNhY3Rpb246ICh0aGlzLm5leHRUeElkKyspLnRvU3RyaW5nKCkgfSwgc2lnbmFsKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgaWYgKHRoaXMub3B0aW9ucy50aW1lb3V0TXMpIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZGVsZXRlIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKFwiU2lnbmFsbGluZyBtZXNzYWdlIHdpdGggdHhpZCBcIiArIHNpZ25hbC50cmFuc2FjdGlvbiArIFwiIHRpbWVkIG91dC5cIikpO1xuICAgICAgfSwgdGhpcy5vcHRpb25zLnRpbWVvdXRNcyk7XG4gICAgfVxuICAgIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dID0geyByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCwgdGltZW91dDogdGltZW91dCwgdHlwZTogdHlwZSB9O1xuICAgIHRoaXMuX3RyYW5zbWl0KHR5cGUsIHNpZ25hbCk7XG4gIH0pO1xufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fdHJhbnNtaXQgPSBmdW5jdGlvbih0eXBlLCBzaWduYWwpIHtcbiAgc2lnbmFsID0gT2JqZWN0LmFzc2lnbih7IGphbnVzOiB0eXBlIH0sIHNpZ25hbCk7XG5cbiAgaWYgKHRoaXMuaWQgIT0gbnVsbCkgeyAvLyB0aGlzLmlkIGlzIHVuZGVmaW5lZCBpbiB0aGUgc3BlY2lhbCBjYXNlIHdoZW4gd2UncmUgc2VuZGluZyB0aGUgc2Vzc2lvbiBjcmVhdGUgbWVzc2FnZVxuICAgIHNpZ25hbCA9IE9iamVjdC5hc3NpZ24oeyBzZXNzaW9uX2lkOiB0aGlzLmlkIH0sIHNpZ25hbCk7XG4gIH1cblxuICBpZiAodGhpcy5vcHRpb25zLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiT3V0Z29pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuXG4gIHRoaXMub3V0cHV0KEpTT04uc3RyaW5naWZ5KHNpZ25hbCkpO1xuICB0aGlzLl9yZXNldEtlZXBhbGl2ZSgpO1xufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fc2VuZEtlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwia2VlcGFsaXZlXCIpO1xufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fa2lsbEtlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICBjbGVhclRpbWVvdXQodGhpcy5rZWVwYWxpdmVUaW1lb3V0KTtcbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX3Jlc2V0S2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2tpbGxLZWVwYWxpdmUoKTtcbiAgaWYgKHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcykge1xuICAgIHRoaXMua2VlcGFsaXZlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5fc2VuZEtlZXBhbGl2ZSgpLmNhdGNoKGUgPT4gY29uc29sZS5lcnJvcihcIkVycm9yIHJlY2VpdmVkIGZyb20ga2VlcGFsaXZlOiBcIiwgZSkpO1xuICAgIH0sIHRoaXMub3B0aW9ucy5rZWVwYWxpdmVNcyk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBKYW51c1BsdWdpbkhhbmRsZSxcbiAgSmFudXNTZXNzaW9uXG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvbWluaWphbnVzL21pbmlqYW51cy5qc1xuLy8gbW9kdWxlIGlkID0gMlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXG4vLyBtb2R1bGUgaWQgPSAzXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVEZWJ1Zy5kZWJ1ZyA9IGNyZWF0ZURlYnVnWydkZWZhdWx0J10gPSBjcmVhdGVEZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIEFjdGl2ZSBgZGVidWdgIGluc3RhbmNlcy5cbiAqL1xuZXhwb3J0cy5pbnN0YW5jZXMgPSBbXTtcblxuLyoqXG4gKiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLCBhbmQgbmFtZXMgdG8gc2tpcC5cbiAqL1xuXG5leHBvcnRzLm5hbWVzID0gW107XG5leHBvcnRzLnNraXBzID0gW107XG5cbi8qKlxuICogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuICpcbiAqIFZhbGlkIGtleSBuYW1lcyBhcmUgYSBzaW5nbGUsIGxvd2VyIG9yIHVwcGVyLWNhc2UgbGV0dGVyLCBpLmUuIFwiblwiIGFuZCBcIk5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKG5hbWVzcGFjZSkge1xuICB2YXIgaGFzaCA9IDAsIGk7XG5cbiAgZm9yIChpIGluIG5hbWVzcGFjZSkge1xuICAgIGhhc2ggID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBuYW1lc3BhY2UuY2hhckNvZGVBdChpKTtcbiAgICBoYXNoIHw9IDA7IC8vIENvbnZlcnQgdG8gMzJiaXQgaW50ZWdlclxuICB9XG5cbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW01hdGguYWJzKGhhc2gpICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gY3JlYXRlRGVidWcobmFtZXNwYWNlKSB7XG5cbiAgdmFyIHByZXZUaW1lO1xuXG4gIGZ1bmN0aW9uIGRlYnVnKCkge1xuICAgIC8vIGRpc2FibGVkP1xuICAgIGlmICghZGVidWcuZW5hYmxlZCkgcmV0dXJuO1xuXG4gICAgdmFyIHNlbGYgPSBkZWJ1ZztcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gdHVybiB0aGUgYGFyZ3VtZW50c2AgaW50byBhIHByb3BlciBBcnJheVxuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlT1xuICAgICAgYXJncy51bnNoaWZ0KCclTycpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXpBLVolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICAvLyBhcHBseSBlbnYtc3BlY2lmaWMgZm9ybWF0dGluZyAoY29sb3JzLCBldGMuKVxuICAgIGV4cG9ydHMuZm9ybWF0QXJncy5jYWxsKHNlbGYsIGFyZ3MpO1xuXG4gICAgdmFyIGxvZ0ZuID0gZGVidWcubG9nIHx8IGV4cG9ydHMubG9nIHx8IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gICAgbG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gIH1cblxuICBkZWJ1Zy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gIGRlYnVnLmVuYWJsZWQgPSBleHBvcnRzLmVuYWJsZWQobmFtZXNwYWNlKTtcbiAgZGVidWcudXNlQ29sb3JzID0gZXhwb3J0cy51c2VDb2xvcnMoKTtcbiAgZGVidWcuY29sb3IgPSBzZWxlY3RDb2xvcihuYW1lc3BhY2UpO1xuICBkZWJ1Zy5kZXN0cm95ID0gZGVzdHJveTtcblxuICAvLyBlbnYtc3BlY2lmaWMgaW5pdGlhbGl6YXRpb24gbG9naWMgZm9yIGRlYnVnIGluc3RhbmNlc1xuICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuaW5pdCkge1xuICAgIGV4cG9ydHMuaW5pdChkZWJ1Zyk7XG4gIH1cblxuICBleHBvcnRzLmluc3RhbmNlcy5wdXNoKGRlYnVnKTtcblxuICByZXR1cm4gZGVidWc7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3kgKCkge1xuICB2YXIgaW5kZXggPSBleHBvcnRzLmluc3RhbmNlcy5pbmRleE9mKHRoaXMpO1xuICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgZXhwb3J0cy5pbnN0YW5jZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICBleHBvcnRzLm5hbWVzID0gW107XG4gIGV4cG9ydHMuc2tpcHMgPSBbXTtcblxuICB2YXIgaTtcbiAgdmFyIHNwbGl0ID0gKHR5cGVvZiBuYW1lc3BhY2VzID09PSAnc3RyaW5nJyA/IG5hbWVzcGFjZXMgOiAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoIXNwbGl0W2ldKSBjb250aW51ZTsgLy8gaWdub3JlIGVtcHR5IHN0cmluZ3NcbiAgICBuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcbiAgICBpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG4gICAgICBleHBvcnRzLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChpID0gMDsgaSA8IGV4cG9ydHMuaW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGluc3RhbmNlID0gZXhwb3J0cy5pbnN0YW5jZXNbaV07XG4gICAgaW5zdGFuY2UuZW5hYmxlZCA9IGV4cG9ydHMuZW5hYmxlZChpbnN0YW5jZS5uYW1lc3BhY2UpO1xuICB9XG59XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkaXNhYmxlKCkge1xuICBleHBvcnRzLmVuYWJsZSgnJyk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcbiAgaWYgKG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJyonKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9kZWJ1Zy5qc1xuLy8gbW9kdWxlIGlkID0gNFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHkgPSBkICogMzY1LjI1O1xuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHRocm93cyB7RXJyb3J9IHRocm93IGFuIGVycm9yIGlmIHZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgbnVtYmVyXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuICBpZiAodHlwZSA9PT0gJ3N0cmluZycgJiYgdmFsLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gcGFyc2UodmFsKTtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiBpc05hTih2YWwpID09PSBmYWxzZSkge1xuICAgIHJldHVybiBvcHRpb25zLmxvbmcgPyBmbXRMb25nKHZhbCkgOiBmbXRTaG9ydCh2YWwpO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICAndmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSB2YWxpZCBudW1iZXIuIHZhbD0nICtcbiAgICAgIEpTT04uc3RyaW5naWZ5KHZhbClcbiAgKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICBzdHIgPSBTdHJpbmcoc3RyKTtcbiAgaWYgKHN0ci5sZW5ndGggPiAxMDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIG1hdGNoID0gL14oKD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhcbiAgICBzdHJcbiAgKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneXJzJzpcbiAgICBjYXNlICd5cic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaHJzJzpcbiAgICBjYXNlICdocic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtaW5zJzpcbiAgICBjYXNlICdtaW4nOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtO1xuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAnc2Vjcyc6XG4gICAgY2FzZSAnc2VjJzpcbiAgICBjYXNlICdzJzpcbiAgICAgIHJldHVybiBuICogcztcbiAgICBjYXNlICdtaWxsaXNlY29uZHMnOlxuICAgIGNhc2UgJ21pbGxpc2Vjb25kJzpcbiAgICBjYXNlICdtc2Vjcyc6XG4gICAgY2FzZSAnbXNlYyc6XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG47XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRTaG9ydChtcykge1xuICBpZiAobXMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIH1cbiAgaWYgKG1zID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICB9XG4gIGlmIChtcyA+PSBtKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgfVxuICBpZiAobXMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdExvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpIHx8XG4gICAgcGx1cmFsKG1zLCBoLCAnaG91cicpIHx8XG4gICAgcGx1cmFsKG1zLCBtLCAnbWludXRlJykgfHxcbiAgICBwbHVyYWwobXMsIHMsICdzZWNvbmQnKSB8fFxuICAgIG1zICsgJyBtcyc7XG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XG4gIGlmIChtcyA8IG4pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKG1zIDwgbiAqIDEuNSkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICB9XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncyc7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9tcy9pbmRleC5qc1xuLy8gbW9kdWxlIGlkID0gNVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9