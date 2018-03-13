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
    this.mediaStreams = {};
    this.localMediaStream = null;
    this.pendingMediaRequests = new Map();

    this.timeOffsets = [];
    this.serverTimeRequests = 0;
    this.avgTimeOffset = 0;

    this.onWebsocketOpen = this.onWebsocketOpen.bind(this);
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
    debug(`connecting to ${this.serverUrl}`);
    this.ws = new WebSocket(this.serverUrl, "janus-protocol");
    this.session = new mj.JanusSession(this.ws.send.bind(this.ws));
    this.ws.addEventListener("open", this.onWebsocketOpen);
    this.ws.addEventListener("message", this.onWebsocketMessage);
  }

  onWebsocketOpen() {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this.updateTimeOffset();

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

    // we have to debounce these because janus gets angry if you send it a new SDP before it's finished processing an
    // existing SDP. maybe another, slightly more correct approach would be to not set the remote description until we
    // get the webrtcup event?
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
      _this3.associate(conn, handle);

      debug("pub waiting for sfu");
      yield handle.attach("janus.plugin.sfu");

      // Create an unreliable datachannel for sending and receiving component updates, etc.
      var unreliableChannel = conn.createDataChannel("unreliable", { ordered: false, maxRetransmits: 0 });
      unreliableChannel.addEventListener("message", _this3.onDataChannelMessage);

      // Create a reliable datachannel for sending and recieving entity instantiations, etc.
      var reliableChannel = conn.createDataChannel("reliable", { ordered: true });
      reliableChannel.addEventListener("message", _this3.onDataChannelMessage);

      if (_this3.localMediaStream) {
        _this3.localMediaStream.getTracks().forEach(function (track) {
          conn.addTrack(track, _this3.localMediaStream);
        });
      }

      debug("pub waiting for webrtcup");
      yield new Promise(function (resolve) {
        return handle.on("webrtcup", resolve);
      });

      // Handle all of the join and leave events.
      handle.on("event", function (ev) {
        var data = ev.plugindata.data;
        if (data.event == "join" && data.room_id == _this3.room) {
          _this3.addOccupant(data.user_id);
        } else if (data.event == "leave" && data.room_id == _this3.room) {
          _this3.removeOccupant(data.user_id);
        }
      });

      debug("pub waiting for join");
      // Send join message to janus. Listen for join/leave messages. Automatically subscribe to all users' WebRTC data.
      var message = yield _this3.sendJoin(handle, { notifications: true, data: true });
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
      _this4.associate(conn, handle);

      debug("sub waiting for sfu");
      yield handle.attach("janus.plugin.sfu");

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

  onDataChannelMessage(event) {
    var message = JSON.parse(event.data);

    if (message.dataType) {
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

  getMediaStream(clientId, type = 'audio') {
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

/** Destroys this session. **/
JanusSession.prototype.destroy = function() {
  return this.send("destroy").then(() => {
    this._killKeepalive();
  });
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
      // single request, or something else that isn't under our purview; that's fine
      return;
    }

    if (responseType === "ack" && txn.type == "message") {
      // this is an ack of an asynchronously-processed plugin request, we should wait to resolve the promise until the
      // actual response comes in
      return;
    }

    if (txn.timeout != null) {
      clearTimeout(txn.timeout);
    }

    delete this.txns[signal.transaction];
    (this.isError(signal) ? txn.reject : txn.resolve)(signal);
  }
};

/**
 * Sends a signal associated with this session. Signals should be JSON-serializable objects. Returns a promise that will
 * be resolved or rejected when a response to this signal is received, or when no response is received within the
 * session timeout.
 **/
JanusSession.prototype.send = function(type, signal) {
  var txid = (this.nextTxId++).toString();
  signal = Object.assign({ janus: type, transaction: txid }, signal);
  if (this.id != null) { // this.id is undefined in the special case when we're sending the session create message
    signal = Object.assign({ session_id: this.id }, signal);
  }
  if (this.options.verbose) {
    console.debug("Outgoing Janus signal: ", signal);
  }
  return new Promise((resolve, reject) => {
    var timeout = null;
    if (this.options.timeoutMs) {
      timeout = setTimeout(() => {
        delete this.txns[signal.transaction];
        reject(new Error("Signalling message with txid " + txid + " timed out."));
      }, this.options.timeoutMs);
    }
    this.txns[signal.transaction] = { resolve: resolve, reject: reject, timeout: timeout, type: type };
    this.output(JSON.stringify(signal));
    this._resetKeepalive();
  });
};

JanusSession.prototype._keepalive = function() {
  return this.send("keepalive");
};

JanusSession.prototype._killKeepalive = function() {
  if (this.keepaliveTimeout) {
    clearTimeout(this.keepaliveTimeout);
  }
};

JanusSession.prototype._resetKeepalive = function() {
  this._killKeepalive();
  if (this.options.keepaliveMs) {
    this.keepaliveTimeout = setTimeout(() => this._keepalive(), this.options.keepaliveMs);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMTEzNDA1MmY0YjI1MTdhZDg1NGMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9icm93c2VyLmpzIiwid2VicGFjazovLy8uL3NyYy9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbWluaWphbnVzL21pbmlqYW51cy5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvZGVidWcuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIl0sIm5hbWVzIjpbIm1qIiwicmVxdWlyZSIsImRlYnVnIiwid2FybiIsImVycm9yIiwiZGVib3VuY2UiLCJmbiIsImN1cnIiLCJQcm9taXNlIiwicmVzb2x2ZSIsImFyZ3MiLCJBcnJheSIsInByb3RvdHlwZSIsInNsaWNlIiwiY2FsbCIsImFyZ3VtZW50cyIsInRoZW4iLCJfIiwiYXBwbHkiLCJyYW5kb21VaW50IiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImlzSDI2NFZpZGVvU3VwcG9ydGVkIiwidmlkZW8iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjYW5QbGF5VHlwZSIsIlBFRVJfQ09OTkVDVElPTl9DT05GSUciLCJpY2VTZXJ2ZXJzIiwidXJscyIsIkphbnVzQWRhcHRlciIsImNvbnN0cnVjdG9yIiwicm9vbSIsInVzZXJJZCIsInNlcnZlclVybCIsIndlYlJ0Y09wdGlvbnMiLCJ3cyIsInNlc3Npb24iLCJwdWJsaXNoZXIiLCJvY2N1cGFudHMiLCJtZWRpYVN0cmVhbXMiLCJsb2NhbE1lZGlhU3RyZWFtIiwicGVuZGluZ01lZGlhUmVxdWVzdHMiLCJNYXAiLCJ0aW1lT2Zmc2V0cyIsInNlcnZlclRpbWVSZXF1ZXN0cyIsImF2Z1RpbWVPZmZzZXQiLCJvbldlYnNvY2tldE9wZW4iLCJiaW5kIiwib25XZWJzb2NrZXRNZXNzYWdlIiwib25EYXRhQ2hhbm5lbE1lc3NhZ2UiLCJzZXRTZXJ2ZXJVcmwiLCJ1cmwiLCJzZXRBcHAiLCJhcHAiLCJzZXRSb29tIiwicm9vbU5hbWUiLCJwYXJzZUludCIsImUiLCJFcnJvciIsInNldFdlYlJ0Y09wdGlvbnMiLCJvcHRpb25zIiwic2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyIsInN1Y2Nlc3NMaXN0ZW5lciIsImZhaWx1cmVMaXN0ZW5lciIsImNvbm5lY3RTdWNjZXNzIiwiY29ubmVjdEZhaWx1cmUiLCJzZXRSb29tT2NjdXBhbnRMaXN0ZW5lciIsIm9jY3VwYW50TGlzdGVuZXIiLCJvbk9jY3VwYW50c0NoYW5nZWQiLCJzZXREYXRhQ2hhbm5lbExpc3RlbmVycyIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwib25PY2N1cGFudENvbm5lY3RlZCIsIm9uT2NjdXBhbnREaXNjb25uZWN0ZWQiLCJvbk9jY3VwYW50TWVzc2FnZSIsImNvbm5lY3QiLCJXZWJTb2NrZXQiLCJKYW51c1Nlc3Npb24iLCJzZW5kIiwiYWRkRXZlbnRMaXN0ZW5lciIsInVwZGF0ZVRpbWVPZmZzZXQiLCJjcmVhdGUiLCJjcmVhdGVQdWJsaXNoZXIiLCJhbGwiLCJpbml0aWFsT2NjdXBhbnRzIiwibWFwIiwiYWRkT2NjdXBhbnQiLCJldmVudCIsInJlY2VpdmUiLCJKU09OIiwicGFyc2UiLCJkYXRhIiwib2NjdXBhbnRJZCIsInN1YnNjcmliZXIiLCJjcmVhdGVTdWJzY3JpYmVyIiwic2V0TWVkaWFTdHJlYW0iLCJtZWRpYVN0cmVhbSIsInJlbW92ZU9jY3VwYW50IiwiY29ubiIsImNsb3NlIiwiaGFzIiwibXNnIiwiZ2V0IiwiYXVkaW8iLCJyZWplY3QiLCJkZWxldGUiLCJhc3NvY2lhdGUiLCJoYW5kbGUiLCJldiIsInNlbmRUcmlja2xlIiwiY2FuZGlkYXRlIiwiY2F0Y2giLCJvZmZlciIsImNyZWF0ZU9mZmVyIiwibG9jYWwiLCJvIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsInJlbW90ZSIsImoiLCJzZW5kSnNlcCIsInIiLCJzZXRSZW1vdGVEZXNjcmlwdGlvbiIsImpzZXAiLCJvbiIsInR5cGUiLCJzZHAiLCJjb25maWd1cmVTdWJzY3JpYmVyU2RwIiwiYW5zd2VyIiwiY3JlYXRlQW5zd2VyIiwiYSIsIkphbnVzUGx1Z2luSGFuZGxlIiwiUlRDUGVlckNvbm5lY3Rpb24iLCJhdHRhY2giLCJ1bnJlbGlhYmxlQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwib3JkZXJlZCIsIm1heFJldHJhbnNtaXRzIiwicmVsaWFibGVDaGFubmVsIiwiZ2V0VHJhY2tzIiwiZm9yRWFjaCIsImFkZFRyYWNrIiwidHJhY2siLCJwbHVnaW5kYXRhIiwicm9vbV9pZCIsInVzZXJfaWQiLCJtZXNzYWdlIiwic2VuZEpvaW4iLCJub3RpZmljYXRpb25zIiwicmVzcG9uc2UiLCJ1c2VycyIsIm9yaWdpbmFsU2RwIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiaW5kZXhPZiIsInJlcGxhY2UiLCJyZXNwIiwibWVkaWEiLCJNZWRpYVN0cmVhbSIsInJlY2VpdmVycyIsImdldFJlY2VpdmVycyIsInJlY2VpdmVyIiwibGVuZ3RoIiwic3Vic2NyaWJlIiwic2VuZE1lc3NhZ2UiLCJraW5kIiwiZGF0YVR5cGUiLCJzaG91bGRTdGFydENvbm5lY3Rpb25UbyIsImNsaWVudCIsInN0YXJ0U3RyZWFtQ29ubmVjdGlvbiIsImNsb3NlU3RyZWFtQ29ubmVjdGlvbiIsImdldENvbm5lY3RTdGF0dXMiLCJjbGllbnRJZCIsIk5BRiIsImFkYXB0ZXJzIiwiSVNfQ09OTkVDVEVEIiwiTk9UX0NPTk5FQ1RFRCIsImNsaWVudFNlbnRUaW1lIiwiRGF0ZSIsIm5vdyIsInJlcyIsImZldGNoIiwibG9jYXRpb24iLCJocmVmIiwibWV0aG9kIiwiY2FjaGUiLCJwcmVjaXNpb24iLCJzZXJ2ZXJSZWNlaXZlZFRpbWUiLCJoZWFkZXJzIiwiZ2V0VGltZSIsImNsaWVudFJlY2VpdmVkVGltZSIsInNlcnZlclRpbWUiLCJ0aW1lT2Zmc2V0IiwicHVzaCIsInJlZHVjZSIsImFjYyIsIm9mZnNldCIsInNldFRpbWVvdXQiLCJnZXRTZXJ2ZXJUaW1lIiwiZ2V0TWVkaWFTdHJlYW0iLCJzZXQiLCJhdWRpb1Byb21pc2UiLCJ2aWRlb1Byb21pc2UiLCJwcm9taXNlIiwic3RyZWFtIiwiYXVkaW9TdHJlYW0iLCJnZXRBdWRpb1RyYWNrcyIsInZpZGVvU3RyZWFtIiwiZ2V0VmlkZW9UcmFja3MiLCJzZXRMb2NhbE1lZGlhU3RyZWFtIiwiZXhpc3RpbmdTZW5kZXJzIiwiZ2V0U2VuZGVycyIsIm5ld1NlbmRlcnMiLCJ0Iiwic2VuZGVyIiwiZmluZCIsInMiLCJyZXBsYWNlVHJhY2siLCJlbmFibGVkIiwicmVtb3ZlVHJhY2siLCJpbmNsdWRlcyIsImVuYWJsZU1pY3JvcGhvbmUiLCJzZW5kRGF0YSIsInN0cmluZ2lmeSIsInNlbmREYXRhR3VhcmFudGVlZCIsImJyb2FkY2FzdERhdGEiLCJicm9hZGNhc3REYXRhR3VhcmFudGVlZCIsInJlZ2lzdGVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLE9BQU87QUFDbkI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7Ozs7Ozs7Ozs7QUNsTUEsSUFBSUEsS0FBSyxtQkFBQUMsQ0FBUSxDQUFSLENBQVQ7QUFDQSxJQUFJQyxRQUFRLG1CQUFBRCxDQUFRLENBQVIsRUFBaUIseUJBQWpCLENBQVo7QUFDQSxJQUFJRSxPQUFPLG1CQUFBRixDQUFRLENBQVIsRUFBaUIsd0JBQWpCLENBQVg7QUFDQSxJQUFJRyxRQUFRLG1CQUFBSCxDQUFRLENBQVIsRUFBaUIseUJBQWpCLENBQVo7O0FBRUEsU0FBU0ksUUFBVCxDQUFrQkMsRUFBbEIsRUFBc0I7QUFDcEIsTUFBSUMsT0FBT0MsUUFBUUMsT0FBUixFQUFYO0FBQ0EsU0FBTyxZQUFXO0FBQ2hCLFFBQUlDLE9BQU9DLE1BQU1DLFNBQU4sQ0FBZ0JDLEtBQWhCLENBQXNCQyxJQUF0QixDQUEyQkMsU0FBM0IsQ0FBWDtBQUNBUixXQUFPQSxLQUFLUyxJQUFMLENBQVVDLEtBQUtYLEdBQUdZLEtBQUgsQ0FBUyxJQUFULEVBQWVSLElBQWYsQ0FBZixDQUFQO0FBQ0QsR0FIRDtBQUlEOztBQUVELFNBQVNTLFVBQVQsR0FBc0I7QUFDcEIsU0FBT0MsS0FBS0MsS0FBTCxDQUFXRCxLQUFLRSxNQUFMLEtBQWdCQyxPQUFPQyxnQkFBbEMsQ0FBUDtBQUNEOztBQUVELE1BQU1DLHVCQUF1QixDQUFDLE1BQU07QUFDbEMsUUFBTUMsUUFBUUMsU0FBU0MsYUFBVCxDQUF1QixPQUF2QixDQUFkO0FBQ0EsU0FBT0YsTUFBTUcsV0FBTixDQUFrQiw0Q0FBbEIsTUFBb0UsRUFBM0U7QUFDRCxDQUg0QixHQUE3Qjs7QUFLQSxNQUFNQyx5QkFBeUI7QUFDN0JDLGNBQVksQ0FDVixFQUFFQyxNQUFNLCtCQUFSLEVBRFUsRUFFVixFQUFFQSxNQUFNLCtCQUFSLEVBRlU7QUFEaUIsQ0FBL0I7O0FBT0EsTUFBTUMsWUFBTixDQUFtQjtBQUNqQkMsZ0JBQWM7QUFDWixTQUFLQyxJQUFMLEdBQVksSUFBWjtBQUNBLFNBQUtDLE1BQUwsR0FBY2pCLFlBQWQ7O0FBRUEsU0FBS2tCLFNBQUwsR0FBaUIsSUFBakI7QUFDQSxTQUFLQyxhQUFMLEdBQXFCLEVBQXJCO0FBQ0EsU0FBS0MsRUFBTCxHQUFVLElBQVY7QUFDQSxTQUFLQyxPQUFMLEdBQWUsSUFBZjs7QUFFQSxTQUFLQyxTQUFMLEdBQWlCLElBQWpCO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsRUFBcEI7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixJQUF4QjtBQUNBLFNBQUtDLG9CQUFMLEdBQTRCLElBQUlDLEdBQUosRUFBNUI7O0FBRUEsU0FBS0MsV0FBTCxHQUFtQixFQUFuQjtBQUNBLFNBQUtDLGtCQUFMLEdBQTBCLENBQTFCO0FBQ0EsU0FBS0MsYUFBTCxHQUFxQixDQUFyQjs7QUFFQSxTQUFLQyxlQUFMLEdBQXVCLEtBQUtBLGVBQUwsQ0FBcUJDLElBQXJCLENBQTBCLElBQTFCLENBQXZCO0FBQ0EsU0FBS0Msa0JBQUwsR0FBMEIsS0FBS0Esa0JBQUwsQ0FBd0JELElBQXhCLENBQTZCLElBQTdCLENBQTFCO0FBQ0EsU0FBS0Usb0JBQUwsR0FBNEIsS0FBS0Esb0JBQUwsQ0FBMEJGLElBQTFCLENBQStCLElBQS9CLENBQTVCO0FBQ0Q7O0FBRURHLGVBQWFDLEdBQWIsRUFBa0I7QUFDaEIsU0FBS2xCLFNBQUwsR0FBaUJrQixHQUFqQjtBQUNEOztBQUVEQyxTQUFPQyxHQUFQLEVBQVksQ0FBRTs7QUFFZEMsVUFBUUMsUUFBUixFQUFrQjtBQUNoQixRQUFJO0FBQ0YsV0FBS3hCLElBQUwsR0FBWXlCLFNBQVNELFFBQVQsQ0FBWjtBQUNELEtBRkQsQ0FFRSxPQUFPRSxDQUFQLEVBQVU7QUFDVixZQUFNLElBQUlDLEtBQUosQ0FBVSxrQ0FBVixDQUFOO0FBQ0Q7QUFDRjs7QUFFREMsbUJBQWlCQyxPQUFqQixFQUEwQjtBQUN4QixTQUFLMUIsYUFBTCxHQUFxQjBCLE9BQXJCO0FBQ0Q7O0FBRURDLDRCQUEwQkMsZUFBMUIsRUFBMkNDLGVBQTNDLEVBQTREO0FBQzFELFNBQUtDLGNBQUwsR0FBc0JGLGVBQXRCO0FBQ0EsU0FBS0csY0FBTCxHQUFzQkYsZUFBdEI7QUFDRDs7QUFFREcsMEJBQXdCQyxnQkFBeEIsRUFBMEM7QUFDeEMsU0FBS0Msa0JBQUwsR0FBMEJELGdCQUExQjtBQUNEOztBQUVERSwwQkFBd0JDLFlBQXhCLEVBQXNDQyxjQUF0QyxFQUFzREMsZUFBdEQsRUFBdUU7QUFDckUsU0FBS0MsbUJBQUwsR0FBMkJILFlBQTNCO0FBQ0EsU0FBS0ksc0JBQUwsR0FBOEJILGNBQTlCO0FBQ0EsU0FBS0ksaUJBQUwsR0FBeUJILGVBQXpCO0FBQ0Q7O0FBRURJLFlBQVU7QUFDUjlFLFVBQU8saUJBQWdCLEtBQUttQyxTQUFVLEVBQXRDO0FBQ0EsU0FBS0UsRUFBTCxHQUFVLElBQUkwQyxTQUFKLENBQWMsS0FBSzVDLFNBQW5CLEVBQThCLGdCQUE5QixDQUFWO0FBQ0EsU0FBS0csT0FBTCxHQUFlLElBQUl4QyxHQUFHa0YsWUFBUCxDQUFvQixLQUFLM0MsRUFBTCxDQUFRNEMsSUFBUixDQUFhaEMsSUFBYixDQUFrQixLQUFLWixFQUF2QixDQUFwQixDQUFmO0FBQ0EsU0FBS0EsRUFBTCxDQUFRNkMsZ0JBQVIsQ0FBeUIsTUFBekIsRUFBaUMsS0FBS2xDLGVBQXRDO0FBQ0EsU0FBS1gsRUFBTCxDQUFRNkMsZ0JBQVIsQ0FBeUIsU0FBekIsRUFBb0MsS0FBS2hDLGtCQUF6QztBQUNEOztBQUVLRixpQkFBTixHQUF3QjtBQUFBOztBQUFBO0FBQ3RCLFlBQU0sTUFBS21DLGdCQUFMLEVBQU47O0FBRUE7QUFDQSxZQUFNLE1BQUs3QyxPQUFMLENBQWE4QyxNQUFiLEVBQU47O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBSzdDLFNBQUwsR0FBaUIsTUFBTSxNQUFLOEMsZUFBTCxFQUF2Qjs7QUFFQTtBQUNBLFlBQUtuQixjQUFMLENBQW9CLE1BQUtoQyxNQUF6Qjs7QUFFQTtBQUNBLFlBQU01QixRQUFRZ0YsR0FBUixDQUFZLE1BQUsvQyxTQUFMLENBQWVnRCxnQkFBZixDQUFnQ0MsR0FBaEMsQ0FBb0MsTUFBS0MsV0FBTCxDQUFpQnhDLElBQWpCLE9BQXBDLENBQVosQ0FBTjtBQWZzQjtBQWdCdkI7O0FBRURDLHFCQUFtQndDLEtBQW5CLEVBQTBCO0FBQ3hCLFNBQUtwRCxPQUFMLENBQWFxRCxPQUFiLENBQXFCQyxLQUFLQyxLQUFMLENBQVdILE1BQU1JLElBQWpCLENBQXJCO0FBQ0Q7O0FBRUtMLGFBQU4sQ0FBa0JNLFVBQWxCLEVBQThCO0FBQUE7O0FBQUE7QUFDNUIsVUFBSUMsYUFBYSxNQUFNLE9BQUtDLGdCQUFMLENBQXNCRixVQUF0QixDQUF2Qjs7QUFFQSxhQUFLdkQsU0FBTCxDQUFldUQsVUFBZixJQUE2QkMsVUFBN0I7O0FBRUEsYUFBS0UsY0FBTCxDQUFvQkgsVUFBcEIsRUFBZ0NDLFdBQVdHLFdBQTNDOztBQUVBO0FBQ0EsYUFBS3hCLG1CQUFMLENBQXlCb0IsVUFBekI7QUFDQSxhQUFLekIsa0JBQUwsQ0FBd0IsT0FBSzlCLFNBQTdCOztBQUVBLGFBQU93RCxVQUFQO0FBWDRCO0FBWTdCOztBQUVESSxpQkFBZUwsVUFBZixFQUEyQjtBQUN6QixRQUFJLEtBQUt2RCxTQUFMLENBQWV1RCxVQUFmLENBQUosRUFBZ0M7QUFDOUI7QUFDQSxVQUFJLEtBQUt2RCxTQUFMLENBQWV1RCxVQUFmLENBQUosRUFBZ0M7QUFDOUIsYUFBS3ZELFNBQUwsQ0FBZXVELFVBQWYsRUFBMkJNLElBQTNCLENBQWdDQyxLQUFoQztBQUNBLGVBQU8sS0FBSzlELFNBQUwsQ0FBZXVELFVBQWYsQ0FBUDtBQUNEOztBQUVELFVBQUksS0FBS3RELFlBQUwsQ0FBa0JzRCxVQUFsQixDQUFKLEVBQW1DO0FBQ2pDLGVBQU8sS0FBS3RELFlBQUwsQ0FBa0JzRCxVQUFsQixDQUFQO0FBQ0Q7O0FBRUQsVUFBSSxLQUFLcEQsb0JBQUwsQ0FBMEI0RCxHQUExQixDQUE4QlIsVUFBOUIsQ0FBSixFQUErQztBQUM3QyxjQUFNUyxNQUFNLDZEQUFaO0FBQ0EsYUFBSzdELG9CQUFMLENBQTBCOEQsR0FBMUIsQ0FBOEJWLFVBQTlCLEVBQTBDVyxLQUExQyxDQUFnREMsTUFBaEQsQ0FBdURILEdBQXZEO0FBQ0EsYUFBSzdELG9CQUFMLENBQTBCOEQsR0FBMUIsQ0FBOEJWLFVBQTlCLEVBQTBDdkUsS0FBMUMsQ0FBZ0RtRixNQUFoRCxDQUF1REgsR0FBdkQ7QUFDQSxhQUFLN0Qsb0JBQUwsQ0FBMEJpRSxNQUExQixDQUFpQ2IsVUFBakM7QUFDRDs7QUFFRDtBQUNBLFdBQUtuQixzQkFBTCxDQUE0Qm1CLFVBQTVCO0FBQ0EsV0FBS3pCLGtCQUFMLENBQXdCLEtBQUs5QixTQUE3QjtBQUNEO0FBQ0Y7O0FBRURxRSxZQUFVUixJQUFWLEVBQWdCUyxNQUFoQixFQUF3QjtBQUN0QlQsU0FBS25CLGdCQUFMLENBQXNCLGNBQXRCLEVBQXNDNkIsTUFBTTtBQUMxQ0QsYUFBT0UsV0FBUCxDQUFtQkQsR0FBR0UsU0FBSCxJQUFnQixJQUFuQyxFQUF5Q0MsS0FBekMsQ0FBK0N2RCxLQUFLekQsTUFBTSx5QkFBTixFQUFpQ3lELENBQWpDLENBQXBEO0FBQ0QsS0FGRDs7QUFJQTtBQUNBO0FBQ0E7QUFDQTBDLFNBQUtuQixnQkFBTCxDQUFzQixtQkFBdEIsRUFBMkMvRSxTQUFTNEcsTUFBTTtBQUN4RC9HLFlBQU0sa0NBQU4sRUFBMEM4RyxNQUExQztBQUNBLFVBQUlLLFFBQVFkLEtBQUtlLFdBQUwsRUFBWjtBQUNBLFVBQUlDLFFBQVFGLE1BQU1yRyxJQUFOLENBQVd3RyxLQUFLakIsS0FBS2tCLG1CQUFMLENBQXlCRCxDQUF6QixDQUFoQixDQUFaO0FBQ0EsVUFBSUUsU0FBU0wsTUFBTXJHLElBQU4sQ0FBVzJHLEtBQUtYLE9BQU9ZLFFBQVAsQ0FBZ0JELENBQWhCLENBQWhCLEVBQW9DM0csSUFBcEMsQ0FBeUM2RyxLQUFLdEIsS0FBS3VCLG9CQUFMLENBQTBCRCxFQUFFRSxJQUE1QixDQUE5QyxDQUFiO0FBQ0EsYUFBT3ZILFFBQVFnRixHQUFSLENBQVksQ0FBQytCLEtBQUQsRUFBUUcsTUFBUixDQUFaLEVBQTZCTixLQUE3QixDQUFtQ3ZELEtBQUt6RCxNQUFNLDZCQUFOLEVBQXFDeUQsQ0FBckMsQ0FBeEMsQ0FBUDtBQUNELEtBTjBDLENBQTNDOztBQVFBbUQsV0FBT2dCLEVBQVAsQ0FBVSxPQUFWLEVBQW1CM0gsU0FBUzRHLE1BQU07QUFDaEMsVUFBSWMsT0FBT2QsR0FBR2MsSUFBZDtBQUNBLFVBQUlBLFFBQVFBLEtBQUtFLElBQUwsSUFBYSxPQUF6QixFQUFrQztBQUNoQy9ILGNBQU0sb0NBQU4sRUFBNEM4RyxNQUE1QztBQUNBZSxhQUFLRyxHQUFMLEdBQVcsS0FBS0Msc0JBQUwsQ0FBNEJKLEtBQUtHLEdBQWpDLENBQVg7QUFDQSxZQUFJRSxTQUFTN0IsS0FBS3VCLG9CQUFMLENBQTBCQyxJQUExQixFQUFnQy9HLElBQWhDLENBQXFDQyxLQUFLc0YsS0FBSzhCLFlBQUwsRUFBMUMsQ0FBYjtBQUNBLFlBQUlkLFFBQVFhLE9BQU9wSCxJQUFQLENBQVlzSCxLQUFLL0IsS0FBS2tCLG1CQUFMLENBQXlCYSxDQUF6QixDQUFqQixDQUFaO0FBQ0EsWUFBSVosU0FBU1UsT0FBT3BILElBQVAsQ0FBWTJHLEtBQUtYLE9BQU9ZLFFBQVAsQ0FBZ0JELENBQWhCLENBQWpCLENBQWI7QUFDQW5ILGdCQUFRZ0YsR0FBUixDQUFZLENBQUMrQixLQUFELEVBQVFHLE1BQVIsQ0FBWixFQUE2Qk4sS0FBN0IsQ0FBbUN2RCxLQUFLekQsTUFBTSw4QkFBTixFQUFzQ3lELENBQXRDLENBQXhDO0FBQ0Q7QUFDRixLQVZrQixDQUFuQjtBQVdEOztBQUVLMEIsaUJBQU4sR0FBd0I7QUFBQTs7QUFBQTtBQUN0QixVQUFJeUIsU0FBUyxJQUFJaEgsR0FBR3VJLGlCQUFQLENBQXlCLE9BQUsvRixPQUE5QixDQUFiO0FBQ0EsVUFBSStELE9BQU8sSUFBSWlDLGlCQUFKLENBQXNCMUcsc0JBQXRCLENBQVg7QUFDQSxhQUFLaUYsU0FBTCxDQUFlUixJQUFmLEVBQXFCUyxNQUFyQjs7QUFFQTlHLFlBQU0scUJBQU47QUFDQSxZQUFNOEcsT0FBT3lCLE1BQVAsQ0FBYyxrQkFBZCxDQUFOOztBQUVBO0FBQ0EsVUFBSUMsb0JBQW9CbkMsS0FBS29DLGlCQUFMLENBQXVCLFlBQXZCLEVBQXFDLEVBQUVDLFNBQVMsS0FBWCxFQUFrQkMsZ0JBQWdCLENBQWxDLEVBQXJDLENBQXhCO0FBQ0FILHdCQUFrQnRELGdCQUFsQixDQUFtQyxTQUFuQyxFQUE4QyxPQUFLL0Isb0JBQW5EOztBQUVBO0FBQ0EsVUFBSXlGLGtCQUFrQnZDLEtBQUtvQyxpQkFBTCxDQUF1QixVQUF2QixFQUFtQyxFQUFFQyxTQUFTLElBQVgsRUFBbkMsQ0FBdEI7QUFDQUUsc0JBQWdCMUQsZ0JBQWhCLENBQWlDLFNBQWpDLEVBQTRDLE9BQUsvQixvQkFBakQ7O0FBRUEsVUFBSSxPQUFLVCxnQkFBVCxFQUEyQjtBQUN6QixlQUFLQSxnQkFBTCxDQUFzQm1HLFNBQXRCLEdBQWtDQyxPQUFsQyxDQUEwQyxpQkFBUztBQUNqRHpDLGVBQUswQyxRQUFMLENBQWNDLEtBQWQsRUFBcUIsT0FBS3RHLGdCQUExQjtBQUNELFNBRkQ7QUFHRDs7QUFFRDFDLFlBQU0sMEJBQU47QUFDQSxZQUFNLElBQUlNLE9BQUosQ0FBWTtBQUFBLGVBQVd3RyxPQUFPZ0IsRUFBUCxDQUFVLFVBQVYsRUFBc0J2SCxPQUF0QixDQUFYO0FBQUEsT0FBWixDQUFOOztBQUVBO0FBQ0F1RyxhQUFPZ0IsRUFBUCxDQUFVLE9BQVYsRUFBbUIsY0FBTTtBQUN2QixZQUFJaEMsT0FBT2lCLEdBQUdrQyxVQUFILENBQWNuRCxJQUF6QjtBQUNBLFlBQUlBLEtBQUtKLEtBQUwsSUFBYyxNQUFkLElBQXdCSSxLQUFLb0QsT0FBTCxJQUFnQixPQUFLakgsSUFBakQsRUFBdUQ7QUFDckQsaUJBQUt3RCxXQUFMLENBQWlCSyxLQUFLcUQsT0FBdEI7QUFDRCxTQUZELE1BRU8sSUFBSXJELEtBQUtKLEtBQUwsSUFBYyxPQUFkLElBQXlCSSxLQUFLb0QsT0FBTCxJQUFnQixPQUFLakgsSUFBbEQsRUFBd0Q7QUFDN0QsaUJBQUttRSxjQUFMLENBQW9CTixLQUFLcUQsT0FBekI7QUFDRDtBQUNGLE9BUEQ7O0FBU0FuSixZQUFNLHNCQUFOO0FBQ0E7QUFDQSxVQUFJb0osVUFBVSxNQUFNLE9BQUtDLFFBQUwsQ0FBY3ZDLE1BQWQsRUFBc0IsRUFBRXdDLGVBQWUsSUFBakIsRUFBdUJ4RCxNQUFNLElBQTdCLEVBQXRCLENBQXBCO0FBQ0EsVUFBSVAsbUJBQW1CNkQsUUFBUUgsVUFBUixDQUFtQm5ELElBQW5CLENBQXdCeUQsUUFBeEIsQ0FBaUNDLEtBQWpDLENBQXVDLE9BQUt2SCxJQUE1QyxLQUFxRCxFQUE1RTs7QUFFQWpDLFlBQU0saUJBQU47QUFDQSxhQUFPO0FBQ0w4RyxjQURLO0FBRUx2Qix3QkFGSztBQUdMcUQsdUJBSEs7QUFJTEoseUJBSks7QUFLTG5DO0FBTEssT0FBUDtBQXpDc0I7QUFnRHZCOztBQUVENEIseUJBQXVCd0IsV0FBdkIsRUFBb0M7QUFDbEMsUUFBSSxDQUFDbEksb0JBQUwsRUFBMkI7QUFDekIsYUFBT2tJLFdBQVA7QUFDRDs7QUFFRDtBQUNBLFFBQUlDLFVBQVVDLFNBQVYsQ0FBb0JDLE9BQXBCLENBQTRCLFNBQTVCLE1BQTJDLENBQUMsQ0FBaEQsRUFBbUQ7QUFDakQsYUFBT0gsWUFBWUksT0FBWixDQUNMLDZCQURLLEVBRUwsZ0pBRkssQ0FBUDtBQUlELEtBTEQsTUFLTztBQUNMLGFBQU9KLFlBQVlJLE9BQVosQ0FDTCw2QkFESyxFQUVMLGdKQUZLLENBQVA7QUFJRDtBQUNGOztBQUVLNUQsa0JBQU4sQ0FBdUJGLFVBQXZCLEVBQW1DO0FBQUE7O0FBQUE7QUFDakMsVUFBSWUsU0FBUyxJQUFJaEgsR0FBR3VJLGlCQUFQLENBQXlCLE9BQUsvRixPQUE5QixDQUFiO0FBQ0EsVUFBSStELE9BQU8sSUFBSWlDLGlCQUFKLENBQXNCMUcsc0JBQXRCLENBQVg7QUFDQSxhQUFLaUYsU0FBTCxDQUFlUixJQUFmLEVBQXFCUyxNQUFyQjs7QUFFQTlHLFlBQU0scUJBQU47QUFDQSxZQUFNOEcsT0FBT3lCLE1BQVAsQ0FBYyxrQkFBZCxDQUFOOztBQUVBdkksWUFBTSxzQkFBTjtBQUNBO0FBQ0E7QUFDQSxZQUFNOEosT0FBTyxNQUFNLE9BQUtULFFBQUwsQ0FBY3ZDLE1BQWQsRUFBc0IsRUFBRWlELE9BQU9oRSxVQUFULEVBQXRCLENBQW5COztBQUVBL0YsWUFBTSwwQkFBTjtBQUNBLFlBQU0sSUFBSU0sT0FBSixDQUFZO0FBQUEsZUFBV3dHLE9BQU9nQixFQUFQLENBQVUsVUFBVixFQUFzQnZILE9BQXRCLENBQVg7QUFBQSxPQUFaLENBQU47O0FBRUEsVUFBSTRGLGNBQWMsSUFBSTZELFdBQUosRUFBbEI7QUFDQSxVQUFJQyxZQUFZNUQsS0FBSzZELFlBQUwsRUFBaEI7QUFDQUQsZ0JBQVVuQixPQUFWLENBQWtCLG9CQUFZO0FBQzVCLFlBQUlxQixTQUFTbkIsS0FBYixFQUFvQjtBQUNsQjdDLHNCQUFZNEMsUUFBWixDQUFxQm9CLFNBQVNuQixLQUE5QjtBQUNEO0FBQ0YsT0FKRDtBQUtBLFVBQUk3QyxZQUFZMEMsU0FBWixHQUF3QnVCLE1BQXhCLEtBQW1DLENBQXZDLEVBQTBDO0FBQ3hDakUsc0JBQWMsSUFBZDtBQUNEOztBQUVEbkcsWUFBTSxrQkFBTjtBQUNBLGFBQU87QUFDTDhHLGNBREs7QUFFTFgsbUJBRks7QUFHTEU7QUFISyxPQUFQO0FBNUJpQztBQWlDbEM7O0FBRURnRCxXQUFTdkMsTUFBVCxFQUFpQnVELFNBQWpCLEVBQTRCO0FBQzFCLFdBQU92RCxPQUFPd0QsV0FBUCxDQUFtQjtBQUN4QkMsWUFBTSxNQURrQjtBQUV4QnJCLGVBQVMsS0FBS2pILElBRlU7QUFHeEJrSCxlQUFTLEtBQUtqSCxNQUhVO0FBSXhCbUk7QUFKd0IsS0FBbkIsQ0FBUDtBQU1EOztBQUVEbEgsdUJBQXFCdUMsS0FBckIsRUFBNEI7QUFDMUIsUUFBSTBELFVBQVV4RCxLQUFLQyxLQUFMLENBQVdILE1BQU1JLElBQWpCLENBQWQ7O0FBRUEsUUFBSXNELFFBQVFvQixRQUFaLEVBQXNCO0FBQ3BCLFdBQUszRixpQkFBTCxDQUF1QixJQUF2QixFQUE2QnVFLFFBQVFvQixRQUFyQyxFQUErQ3BCLFFBQVF0RCxJQUF2RDtBQUNEO0FBQ0Y7O0FBRUQyRSwwQkFBd0JDLE1BQXhCLEVBQWdDO0FBQzlCLFdBQU8sSUFBUDtBQUNEOztBQUVEQyx3QkFBc0JELE1BQXRCLEVBQThCLENBQUU7O0FBRWhDRSx3QkFBc0JGLE1BQXRCLEVBQThCLENBQUU7O0FBRWhDRyxtQkFBaUJDLFFBQWpCLEVBQTJCO0FBQ3pCLFdBQU8sS0FBS3RJLFNBQUwsQ0FBZXNJLFFBQWYsSUFBMkJDLElBQUlDLFFBQUosQ0FBYUMsWUFBeEMsR0FBdURGLElBQUlDLFFBQUosQ0FBYUUsYUFBM0U7QUFDRDs7QUFFSy9GLGtCQUFOLEdBQXlCO0FBQUE7O0FBQUE7QUFDdkIsWUFBTWdHLGlCQUFpQkMsS0FBS0MsR0FBTCxFQUF2Qjs7QUFFQSxZQUFNQyxNQUFNLE1BQU1DLE1BQU05SixTQUFTK0osUUFBVCxDQUFrQkMsSUFBeEIsRUFBOEI7QUFDOUNDLGdCQUFRLE1BRHNDO0FBRTlDQyxlQUFPO0FBRnVDLE9BQTlCLENBQWxCOztBQUtBLFlBQU1DLFlBQVksSUFBbEI7QUFDQSxZQUFNQyxxQkFDSixJQUFJVCxJQUFKLENBQVNFLElBQUlRLE9BQUosQ0FBWXJGLEdBQVosQ0FBZ0IsTUFBaEIsQ0FBVCxFQUFrQ3NGLE9BQWxDLEtBQThDSCxZQUFZLENBRDVEO0FBRUEsWUFBTUkscUJBQXFCWixLQUFLQyxHQUFMLEVBQTNCO0FBQ0EsWUFBTVksYUFDSkoscUJBQXFCLENBQUNHLHFCQUFxQmIsY0FBdEIsSUFBd0MsQ0FEL0Q7QUFFQSxZQUFNZSxhQUFhRCxhQUFhRCxrQkFBaEM7O0FBRUEsYUFBS2xKLGtCQUFMOztBQUVBLFVBQUksT0FBS0Esa0JBQUwsSUFBMkIsRUFBL0IsRUFBbUM7QUFDakMsZUFBS0QsV0FBTCxDQUFpQnNKLElBQWpCLENBQXNCRCxVQUF0QjtBQUNELE9BRkQsTUFFTztBQUNMLGVBQUtySixXQUFMLENBQWlCLE9BQUtDLGtCQUFMLEdBQTBCLEVBQTNDLElBQWlEb0osVUFBakQ7QUFDRDs7QUFFRCxhQUFLbkosYUFBTCxHQUNFLE9BQUtGLFdBQUwsQ0FBaUJ1SixNQUFqQixDQUF3QixVQUFDQyxHQUFELEVBQU1DLE1BQU47QUFBQSxlQUFrQkQsT0FBT0MsTUFBekI7QUFBQSxPQUF4QixFQUEwRCxDQUExRCxJQUNBLE9BQUt6SixXQUFMLENBQWlCdUgsTUFGbkI7O0FBSUEsVUFBSSxPQUFLdEgsa0JBQUwsR0FBMEIsRUFBOUIsRUFBa0M7QUFDaEN5SixtQkFBVztBQUFBLGlCQUFNLE9BQUtwSCxnQkFBTCxFQUFOO0FBQUEsU0FBWCxFQUEwQyxJQUFJLEVBQUosR0FBUyxJQUFuRCxFQURnQyxDQUMwQjtBQUMzRCxPQUZELE1BRU87QUFDTCxlQUFLQSxnQkFBTDtBQUNEO0FBaENzQjtBQWlDeEI7O0FBRURxSCxrQkFBZ0I7QUFDZCxXQUFPcEIsS0FBS0MsR0FBTCxLQUFhLEtBQUt0SSxhQUF6QjtBQUNEOztBQUVEMEosaUJBQWUzQixRQUFmLEVBQXlCL0MsT0FBTyxPQUFoQyxFQUF5QztBQUN2QyxRQUFJLEtBQUt0RixZQUFMLENBQWtCcUksUUFBbEIsQ0FBSixFQUFpQztBQUMvQjlLLFlBQU8sZUFBYytILElBQUssUUFBTytDLFFBQVMsRUFBMUM7QUFDQSxhQUFPeEssUUFBUUMsT0FBUixDQUFnQixLQUFLa0MsWUFBTCxDQUFrQnFJLFFBQWxCLEVBQTRCL0MsSUFBNUIsQ0FBaEIsQ0FBUDtBQUNELEtBSEQsTUFHTztBQUNML0gsWUFBTyxjQUFhK0gsSUFBSyxRQUFPK0MsUUFBUyxFQUF6QztBQUNBLFVBQUksQ0FBQyxLQUFLbkksb0JBQUwsQ0FBMEI0RCxHQUExQixDQUE4QnVFLFFBQTlCLENBQUwsRUFBOEM7QUFDNUMsYUFBS25JLG9CQUFMLENBQTBCK0osR0FBMUIsQ0FBOEI1QixRQUE5QixFQUF3QyxFQUF4Qzs7QUFFQSxjQUFNNkIsZUFBZSxJQUFJck0sT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVW9HLE1BQVYsS0FBcUI7QUFDcEQsZUFBS2hFLG9CQUFMLENBQTBCOEQsR0FBMUIsQ0FBOEJxRSxRQUE5QixFQUF3Q3BFLEtBQXhDLEdBQWdELEVBQUVuRyxPQUFGLEVBQVdvRyxNQUFYLEVBQWhEO0FBQ0QsU0FGb0IsQ0FBckI7QUFHQSxjQUFNaUcsZUFBZSxJQUFJdE0sT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVW9HLE1BQVYsS0FBcUI7QUFDcEQsZUFBS2hFLG9CQUFMLENBQTBCOEQsR0FBMUIsQ0FBOEJxRSxRQUE5QixFQUF3Q3RKLEtBQXhDLEdBQWdELEVBQUVqQixPQUFGLEVBQVdvRyxNQUFYLEVBQWhEO0FBQ0QsU0FGb0IsQ0FBckI7O0FBSUEsYUFBS2hFLG9CQUFMLENBQTBCOEQsR0FBMUIsQ0FBOEJxRSxRQUE5QixFQUF3Q3BFLEtBQXhDLENBQThDbUcsT0FBOUMsR0FBd0RGLFlBQXhEO0FBQ0EsYUFBS2hLLG9CQUFMLENBQTBCOEQsR0FBMUIsQ0FBOEJxRSxRQUE5QixFQUF3Q3RKLEtBQXhDLENBQThDcUwsT0FBOUMsR0FBd0RELFlBQXhEO0FBQ0Q7QUFDRCxhQUFPLEtBQUtqSyxvQkFBTCxDQUEwQjhELEdBQTFCLENBQThCcUUsUUFBOUIsRUFBd0MvQyxJQUF4QyxFQUE4QzhFLE9BQXJEO0FBQ0Q7QUFDRjs7QUFFRDNHLGlCQUFlNEUsUUFBZixFQUF5QmdDLE1BQXpCLEVBQWlDO0FBQy9CO0FBQ0E7QUFDQSxVQUFNQyxjQUFjLElBQUkvQyxXQUFKLEVBQXBCO0FBQ0E4QyxXQUFPRSxjQUFQLEdBQXdCbEUsT0FBeEIsQ0FBZ0NFLFNBQVMrRCxZQUFZaEUsUUFBWixDQUFxQkMsS0FBckIsQ0FBekM7QUFDQSxVQUFNaUUsY0FBYyxJQUFJakQsV0FBSixFQUFwQjtBQUNBOEMsV0FBT0ksY0FBUCxHQUF3QnBFLE9BQXhCLENBQWdDRSxTQUFTaUUsWUFBWWxFLFFBQVosQ0FBcUJDLEtBQXJCLENBQXpDOztBQUVBLFNBQUt2RyxZQUFMLENBQWtCcUksUUFBbEIsSUFBOEIsRUFBRXBFLE9BQU9xRyxXQUFULEVBQXNCdkwsT0FBT3lMLFdBQTdCLEVBQTlCOztBQUVBO0FBQ0EsUUFBSSxLQUFLdEssb0JBQUwsQ0FBMEI0RCxHQUExQixDQUE4QnVFLFFBQTlCLENBQUosRUFBNkM7QUFDM0MsV0FBS25JLG9CQUFMLENBQTBCOEQsR0FBMUIsQ0FBOEJxRSxRQUE5QixFQUF3Q3BFLEtBQXhDLENBQThDbkcsT0FBOUMsQ0FBc0R3TSxXQUF0RDtBQUNBLFdBQUtwSyxvQkFBTCxDQUEwQjhELEdBQTFCLENBQThCcUUsUUFBOUIsRUFBd0N0SixLQUF4QyxDQUE4Q2pCLE9BQTlDLENBQXNEME0sV0FBdEQ7QUFDRDtBQUNGOztBQUVERSxzQkFBb0JMLE1BQXBCLEVBQTRCO0FBQzFCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFJLEtBQUt2SyxTQUFMLElBQWtCLEtBQUtBLFNBQUwsQ0FBZThELElBQXJDLEVBQTJDO0FBQ3pDLFVBQUkrRyxrQkFBa0IsS0FBSzdLLFNBQUwsQ0FBZThELElBQWYsQ0FBb0JnSCxVQUFwQixFQUF0QjtBQUNBLFVBQUlDLGFBQWEsRUFBakI7QUFDQVIsYUFBT2pFLFNBQVAsR0FBbUJDLE9BQW5CLENBQTJCeUUsS0FBSztBQUM5QixZQUFJQyxTQUFTSixnQkFBZ0JLLElBQWhCLENBQXFCQyxLQUFLQSxFQUFFMUUsS0FBRixJQUFXLElBQVgsSUFBbUIwRSxFQUFFMUUsS0FBRixDQUFRdUIsSUFBUixJQUFnQmdELEVBQUVoRCxJQUEvRCxDQUFiO0FBQ0EsWUFBSWlELFVBQVUsSUFBZCxFQUFvQjtBQUNsQixjQUFJQSxPQUFPRyxZQUFYLEVBQXlCO0FBQ3ZCSCxtQkFBT0csWUFBUCxDQUFvQkosQ0FBcEI7QUFDQUMsbUJBQU94RSxLQUFQLENBQWE0RSxPQUFiLEdBQXVCLElBQXZCO0FBQ0QsV0FIRCxNQUdPO0FBQ0w7QUFDQWQsbUJBQU9lLFdBQVAsQ0FBbUJMLE9BQU94RSxLQUExQjtBQUNBOEQsbUJBQU8vRCxRQUFQLENBQWdCd0UsQ0FBaEI7QUFDQUEsY0FBRUssT0FBRixHQUFZLElBQVo7QUFDRDtBQUNETixxQkFBV25CLElBQVgsQ0FBZ0JxQixNQUFoQjtBQUNELFNBWEQsTUFXTztBQUNMRixxQkFBV25CLElBQVgsQ0FBZ0IsS0FBSzVKLFNBQUwsQ0FBZThELElBQWYsQ0FBb0IwQyxRQUFwQixDQUE2QndFLENBQTdCLEVBQWdDVCxNQUFoQyxDQUFoQjtBQUNEO0FBQ0YsT0FoQkQ7QUFpQkFNLHNCQUFnQnRFLE9BQWhCLENBQXdCNEUsS0FBSztBQUMzQixZQUFJLENBQUNKLFdBQVdRLFFBQVgsQ0FBb0JKLENBQXBCLENBQUwsRUFBNkI7QUFDM0JBLFlBQUUxRSxLQUFGLENBQVE0RSxPQUFSLEdBQWtCLEtBQWxCO0FBQ0Q7QUFDRixPQUpEO0FBS0Q7QUFDRCxTQUFLbEwsZ0JBQUwsR0FBd0JvSyxNQUF4QjtBQUNBLFNBQUs1RyxjQUFMLENBQW9CLEtBQUtoRSxNQUF6QixFQUFpQzRLLE1BQWpDO0FBQ0Q7O0FBRURpQixtQkFBaUJILE9BQWpCLEVBQTBCO0FBQ3hCLFFBQUksS0FBS3JMLFNBQUwsSUFBa0IsS0FBS0EsU0FBTCxDQUFlOEQsSUFBckMsRUFBMkM7QUFDekMsV0FBSzlELFNBQUwsQ0FBZThELElBQWYsQ0FBb0JnSCxVQUFwQixHQUFpQ3ZFLE9BQWpDLENBQXlDNEUsS0FBSztBQUM1QyxZQUFJQSxFQUFFMUUsS0FBRixDQUFRdUIsSUFBUixJQUFnQixPQUFwQixFQUE2QjtBQUMzQm1ELFlBQUUxRSxLQUFGLENBQVE0RSxPQUFSLEdBQWtCQSxPQUFsQjtBQUNEO0FBQ0YsT0FKRDtBQUtEO0FBQ0Y7O0FBRURJLFdBQVNsRCxRQUFULEVBQW1CTixRQUFuQixFQUE2QjFFLElBQTdCLEVBQW1DO0FBQ2pDLFNBQUt2RCxTQUFMLENBQWVpRyxpQkFBZixDQUFpQ3ZELElBQWpDLENBQ0VXLEtBQUtxSSxTQUFMLENBQWUsRUFBRW5ELFFBQUYsRUFBWU4sUUFBWixFQUFzQjFFLElBQXRCLEVBQWYsQ0FERjtBQUdEOztBQUVEb0kscUJBQW1CcEQsUUFBbkIsRUFBNkJOLFFBQTdCLEVBQXVDMUUsSUFBdkMsRUFBNkM7QUFDM0MsU0FBS3ZELFNBQUwsQ0FBZXFHLGVBQWYsQ0FBK0IzRCxJQUEvQixDQUNFVyxLQUFLcUksU0FBTCxDQUFlLEVBQUVuRCxRQUFGLEVBQVlOLFFBQVosRUFBc0IxRSxJQUF0QixFQUFmLENBREY7QUFHRDs7QUFFRHFJLGdCQUFjM0QsUUFBZCxFQUF3QjFFLElBQXhCLEVBQThCO0FBQzVCLFNBQUt2RCxTQUFMLENBQWVpRyxpQkFBZixDQUFpQ3ZELElBQWpDLENBQXNDVyxLQUFLcUksU0FBTCxDQUFlLEVBQUV6RCxRQUFGLEVBQVkxRSxJQUFaLEVBQWYsQ0FBdEM7QUFDRDs7QUFFRHNJLDBCQUF3QjVELFFBQXhCLEVBQWtDMUUsSUFBbEMsRUFBd0M7QUFDdEMsU0FBS3ZELFNBQUwsQ0FBZXFHLGVBQWYsQ0FBK0IzRCxJQUEvQixDQUFvQ1csS0FBS3FJLFNBQUwsQ0FBZSxFQUFFekQsUUFBRixFQUFZMUUsSUFBWixFQUFmLENBQXBDO0FBQ0Q7QUFsYmdCOztBQXFibkJpRixJQUFJQyxRQUFKLENBQWFxRCxRQUFiLENBQXNCLE9BQXRCLEVBQStCdE0sWUFBL0I7O0FBRUF1TSxPQUFPQyxPQUFQLEdBQWlCeE0sWUFBakIsQzs7Ozs7O0FDcGRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QscUJBQXFCO0FBQ3JFOztBQUVBO0FBQ0E7QUFDQSwrQkFBK0IsYUFBYTtBQUM1Qzs7QUFFQTtBQUNBO0FBQ0EsK0JBQStCLFNBQVMsY0FBYztBQUN0RDs7QUFFQTtBQUNBO0FBQ0EsK0JBQStCLHVCQUF1QjtBQUN0RDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrRkFBK0Y7QUFDL0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixxQkFBcUI7QUFDeEM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0VBQXdFO0FBQ3hFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwQkFBMEIsaUNBQWlDO0FBQzNELHdCQUF3QjtBQUN4Qiw0QkFBNEIsc0JBQXNCO0FBQ2xEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EscUNBQXFDO0FBQ3JDO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDak5BO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsc0JBQXNCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxxQ0FBcUM7O0FBRXJDO0FBQ0E7QUFDQTs7QUFFQSwyQkFBMkI7QUFDM0I7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCLFVBQVU7Ozs7Ozs7O0FDdEx0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFDQTtBQUNBIiwiZmlsZSI6Im5hZi1qYW51cy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMTEzNDA1MmY0YjI1MTdhZDg1NGMiLCIvKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcbmV4cG9ydHMuc3RvcmFnZSA9ICd1bmRlZmluZWQnICE9IHR5cGVvZiBjaHJvbWVcbiAgICAgICAgICAgICAgICYmICd1bmRlZmluZWQnICE9IHR5cGVvZiBjaHJvbWUuc3RvcmFnZVxuICAgICAgICAgICAgICAgICAgPyBjaHJvbWUuc3RvcmFnZS5sb2NhbFxuICAgICAgICAgICAgICAgICAgOiBsb2NhbHN0b3JhZ2UoKTtcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICcjMDAwMENDJywgJyMwMDAwRkYnLCAnIzAwMzNDQycsICcjMDAzM0ZGJywgJyMwMDY2Q0MnLCAnIzAwNjZGRicsICcjMDA5OUNDJyxcbiAgJyMwMDk5RkYnLCAnIzAwQ0MwMCcsICcjMDBDQzMzJywgJyMwMENDNjYnLCAnIzAwQ0M5OScsICcjMDBDQ0NDJywgJyMwMENDRkYnLFxuICAnIzMzMDBDQycsICcjMzMwMEZGJywgJyMzMzMzQ0MnLCAnIzMzMzNGRicsICcjMzM2NkNDJywgJyMzMzY2RkYnLCAnIzMzOTlDQycsXG4gICcjMzM5OUZGJywgJyMzM0NDMDAnLCAnIzMzQ0MzMycsICcjMzNDQzY2JywgJyMzM0NDOTknLCAnIzMzQ0NDQycsICcjMzNDQ0ZGJyxcbiAgJyM2NjAwQ0MnLCAnIzY2MDBGRicsICcjNjYzM0NDJywgJyM2NjMzRkYnLCAnIzY2Q0MwMCcsICcjNjZDQzMzJywgJyM5OTAwQ0MnLFxuICAnIzk5MDBGRicsICcjOTkzM0NDJywgJyM5OTMzRkYnLCAnIzk5Q0MwMCcsICcjOTlDQzMzJywgJyNDQzAwMDAnLCAnI0NDMDAzMycsXG4gICcjQ0MwMDY2JywgJyNDQzAwOTknLCAnI0NDMDBDQycsICcjQ0MwMEZGJywgJyNDQzMzMDAnLCAnI0NDMzMzMycsICcjQ0MzMzY2JyxcbiAgJyNDQzMzOTknLCAnI0NDMzNDQycsICcjQ0MzM0ZGJywgJyNDQzY2MDAnLCAnI0NDNjYzMycsICcjQ0M5OTAwJywgJyNDQzk5MzMnLFxuICAnI0NDQ0MwMCcsICcjQ0NDQzMzJywgJyNGRjAwMDAnLCAnI0ZGMDAzMycsICcjRkYwMDY2JywgJyNGRjAwOTknLCAnI0ZGMDBDQycsXG4gICcjRkYwMEZGJywgJyNGRjMzMDAnLCAnI0ZGMzMzMycsICcjRkYzMzY2JywgJyNGRjMzOTknLCAnI0ZGMzNDQycsICcjRkYzM0ZGJyxcbiAgJyNGRjY2MDAnLCAnI0ZGNjYzMycsICcjRkY5OTAwJywgJyNGRjk5MzMnLCAnI0ZGQ0MwMCcsICcjRkZDQzMzJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIE5COiBJbiBhbiBFbGVjdHJvbiBwcmVsb2FkIHNjcmlwdCwgZG9jdW1lbnQgd2lsbCBiZSBkZWZpbmVkIGJ1dCBub3QgZnVsbHlcbiAgLy8gaW5pdGlhbGl6ZWQuIFNpbmNlIHdlIGtub3cgd2UncmUgaW4gQ2hyb21lLCB3ZSdsbCBqdXN0IGRldGVjdCB0aGlzIGNhc2VcbiAgLy8gZXhwbGljaXRseVxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnByb2Nlc3MgJiYgd2luZG93LnByb2Nlc3MudHlwZSA9PT0gJ3JlbmRlcmVyJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gSW50ZXJuZXQgRXhwbG9yZXIgYW5kIEVkZ2UgZG8gbm90IHN1cHBvcnQgY29sb3JzLlxuICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goLyhlZGdlfHRyaWRlbnQpXFwvKFxcZCspLykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICAvLyBkb2N1bWVudCBpcyB1bmRlZmluZWQgaW4gcmVhY3QtbmF0aXZlOiBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QtbmF0aXZlL3B1bGwvMTYzMlxuICByZXR1cm4gKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuV2Via2l0QXBwZWFyYW5jZSkgfHxcbiAgICAvLyBpcyBmaXJlYnVnPyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zOTgxMjAvMzc2NzczXG4gICAgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5jb25zb2xlICYmICh3aW5kb3cuY29uc29sZS5maXJlYnVnIHx8ICh3aW5kb3cuY29uc29sZS5leGNlcHRpb24gJiYgd2luZG93LmNvbnNvbGUudGFibGUpKSkgfHxcbiAgICAvLyBpcyBmaXJlZm94ID49IHYzMT9cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1Rvb2xzL1dlYl9Db25zb2xlI1N0eWxpbmdfbWVzc2FnZXNcbiAgICAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSkgfHxcbiAgICAvLyBkb3VibGUgY2hlY2sgd2Via2l0IGluIHVzZXJBZ2VudCBqdXN0IGluIGNhc2Ugd2UgYXJlIGluIGEgd29ya2VyXG4gICAgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9hcHBsZXdlYmtpdFxcLyhcXGQrKS8pKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHYpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gJ1tVbmV4cGVjdGVkSlNPTlBhcnNlRXJyb3JdOiAnICsgZXJyLm1lc3NhZ2U7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKGFyZ3MpIHtcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncy5zcGxpY2UoMSwgMCwgYywgJ2NvbG9yOiBpbmhlcml0JylcblxuICAvLyB0aGUgZmluYWwgXCIlY1wiIGlzIHNvbWV3aGF0IHRyaWNreSwgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlclxuICAvLyBhcmd1bWVudHMgcGFzc2VkIGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhlICVjLCBzbyB3ZSBuZWVkIHRvXG4gIC8vIGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgaW5kZXggdG8gaW5zZXJ0IHRoZSBDU1MgaW50b1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgbGFzdEMgPSAwO1xuICBhcmdzWzBdLnJlcGxhY2UoLyVbYS16QS1aJV0vZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICBpZiAoJyUlJyA9PT0gbWF0Y2gpIHJldHVybjtcbiAgICBpbmRleCsrO1xuICAgIGlmICgnJWMnID09PSBtYXRjaCkge1xuICAgICAgLy8gd2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiB0aGUgKmxhc3QqICVjXG4gICAgICAvLyAodGhlIHVzZXIgbWF5IGhhdmUgcHJvdmlkZWQgdGhlaXIgb3duKVxuICAgICAgbGFzdEMgPSBpbmRleDtcbiAgICB9XG4gIH0pO1xuXG4gIGFyZ3Muc3BsaWNlKGxhc3RDLCAwLCBjKTtcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIHRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG4gIC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gZXhwb3J0cy5zdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG5cbiAgLy8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuICBpZiAoIXIgJiYgdHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmICdlbnYnIGluIHByb2Nlc3MpIHtcbiAgICByID0gcHJvY2Vzcy5lbnYuREVCVUc7XG4gIH1cblxuICByZXR1cm4gcjtcbn1cblxuLyoqXG4gKiBFbmFibGUgbmFtZXNwYWNlcyBsaXN0ZWQgaW4gYGxvY2FsU3RvcmFnZS5kZWJ1Z2AgaW5pdGlhbGx5LlxuICovXG5cbmV4cG9ydHMuZW5hYmxlKGxvYWQoKSk7XG5cbi8qKlxuICogTG9jYWxzdG9yYWdlIGF0dGVtcHRzIHRvIHJldHVybiB0aGUgbG9jYWxzdG9yYWdlLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugc2FmYXJpIHRocm93c1xuICogd2hlbiBhIHVzZXIgZGlzYWJsZXMgY29va2llcy9sb2NhbHN0b3JhZ2VcbiAqIGFuZCB5b3UgYXR0ZW1wdCB0byBhY2Nlc3MgaXQuXG4gKlxuICogQHJldHVybiB7TG9jYWxTdG9yYWdlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9jYWxzdG9yYWdlKCkge1xuICB0cnkge1xuICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlO1xuICB9IGNhdGNoIChlKSB7fVxufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2Jyb3dzZXIuanNcbi8vIG1vZHVsZSBpZCA9IDBcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwidmFyIG1qID0gcmVxdWlyZShcIm1pbmlqYW51c1wiKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcIm5hZi1qYW51cy1hZGFwdGVyOmRlYnVnXCIpO1xudmFyIHdhcm4gPSByZXF1aXJlKFwiZGVidWdcIikoXCJuYWYtamFudXMtYWRhcHRlcjp3YXJuXCIpO1xudmFyIGVycm9yID0gcmVxdWlyZShcImRlYnVnXCIpKFwibmFmLWphbnVzLWFkYXB0ZXI6ZXJyb3JcIik7XG5cbmZ1bmN0aW9uIGRlYm91bmNlKGZuKSB7XG4gIHZhciBjdXJyID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgY3VyciA9IGN1cnIudGhlbihfID0+IGZuLmFwcGx5KHRoaXMsIGFyZ3MpKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmFuZG9tVWludCgpIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKTtcbn1cblxuY29uc3QgaXNIMjY0VmlkZW9TdXBwb3J0ZWQgPSAoKCkgPT4ge1xuICBjb25zdCB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ2aWRlb1wiKTtcbiAgcmV0dXJuIHZpZGVvLmNhblBsYXlUeXBlKCd2aWRlby9tcDQ7IGNvZGVjcz1cImF2YzEuNDJFMDFFLCBtcDRhLjQwLjJcIicpICE9PSBcIlwiO1xufSkoKTtcblxuY29uc3QgUEVFUl9DT05ORUNUSU9OX0NPTkZJRyA9IHtcbiAgaWNlU2VydmVyczogW1xuICAgIHsgdXJsczogXCJzdHVuOnN0dW4xLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXG4gICAgeyB1cmxzOiBcInN0dW46c3R1bjIubC5nb29nbGUuY29tOjE5MzAyXCIgfVxuICBdXG59O1xuXG5jbGFzcyBKYW51c0FkYXB0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnJvb20gPSBudWxsO1xuICAgIHRoaXMudXNlcklkID0gcmFuZG9tVWludCgpO1xuXG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSBudWxsO1xuICAgIHRoaXMud2ViUnRjT3B0aW9ucyA9IHt9O1xuICAgIHRoaXMud3MgPSBudWxsO1xuICAgIHRoaXMuc2Vzc2lvbiA9IG51bGw7XG5cbiAgICB0aGlzLnB1Ymxpc2hlciA9IG51bGw7XG4gICAgdGhpcy5vY2N1cGFudHMgPSB7fTtcbiAgICB0aGlzLm1lZGlhU3RyZWFtcyA9IHt9O1xuICAgIHRoaXMubG9jYWxNZWRpYVN0cmVhbSA9IG51bGw7XG4gICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cyA9IG5ldyBNYXAoKTtcblxuICAgIHRoaXMudGltZU9mZnNldHMgPSBbXTtcbiAgICB0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyA9IDA7XG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gMDtcblxuICAgIHRoaXMub25XZWJzb2NrZXRPcGVuID0gdGhpcy5vbldlYnNvY2tldE9wZW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSA9IHRoaXMub25XZWJzb2NrZXRNZXNzYWdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSA9IHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UuYmluZCh0aGlzKTtcbiAgfVxuXG4gIHNldFNlcnZlclVybCh1cmwpIHtcbiAgICB0aGlzLnNlcnZlclVybCA9IHVybDtcbiAgfVxuXG4gIHNldEFwcChhcHApIHt9XG5cbiAgc2V0Um9vbShyb29tTmFtZSkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnJvb20gPSBwYXJzZUludChyb29tTmFtZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUm9vbSBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci5cIik7XG4gICAgfVxuICB9XG5cbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgdGhpcy53ZWJSdGNPcHRpb25zID0gb3B0aW9ucztcbiAgfVxuXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xuICAgIHRoaXMuY29ubmVjdEZhaWx1cmUgPSBmYWlsdXJlTGlzdGVuZXI7XG4gIH1cblxuICBzZXRSb29tT2NjdXBhbnRMaXN0ZW5lcihvY2N1cGFudExpc3RlbmVyKSB7XG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQgPSBvY2N1cGFudExpc3RlbmVyO1xuICB9XG5cbiAgc2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XG4gICAgdGhpcy5vbk9jY3VwYW50Q29ubmVjdGVkID0gb3Blbkxpc3RlbmVyO1xuICAgIHRoaXMub25PY2N1cGFudERpc2Nvbm5lY3RlZCA9IGNsb3NlZExpc3RlbmVyO1xuICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UgPSBtZXNzYWdlTGlzdGVuZXI7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIGRlYnVnKGBjb25uZWN0aW5nIHRvICR7dGhpcy5zZXJ2ZXJVcmx9YCk7XG4gICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJVcmwsIFwiamFudXMtcHJvdG9jb2xcIik7XG4gICAgdGhpcy5zZXNzaW9uID0gbmV3IG1qLkphbnVzU2Vzc2lvbih0aGlzLndzLnNlbmQuYmluZCh0aGlzLndzKSk7XG4gICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKFwib3BlblwiLCB0aGlzLm9uV2Vic29ja2V0T3Blbik7XG4gICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBvbldlYnNvY2tldE9wZW4oKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGVUaW1lT2Zmc2V0KCk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIEphbnVzIFNlc3Npb25cbiAgICBhd2FpdCB0aGlzLnNlc3Npb24uY3JlYXRlKCk7XG5cbiAgICAvLyBBdHRhY2ggdGhlIFNGVSBQbHVnaW4gYW5kIGNyZWF0ZSBhIFJUQ1BlZXJDb25uZWN0aW9uIGZvciB0aGUgcHVibGlzaGVyLlxuICAgIC8vIFRoZSBwdWJsaXNoZXIgc2VuZHMgYXVkaW8gYW5kIG9wZW5zIHR3byBiaWRpcmVjdGlvbmFsIGRhdGEgY2hhbm5lbHMuXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cbiAgICB0aGlzLnB1Ymxpc2hlciA9IGF3YWl0IHRoaXMuY3JlYXRlUHVibGlzaGVyKCk7XG5cbiAgICAvLyBDYWxsIHRoZSBuYWYgY29ubmVjdFN1Y2Nlc3MgY2FsbGJhY2sgYmVmb3JlIHdlIHN0YXJ0IHJlY2VpdmluZyBXZWJSVEMgbWVzc2FnZXMuXG4gICAgdGhpcy5jb25uZWN0U3VjY2Vzcyh0aGlzLnVzZXJJZCk7XG5cbiAgICAvLyBBZGQgYWxsIG9mIHRoZSBpbml0aWFsIG9jY3VwYW50cy5cbiAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnB1Ymxpc2hlci5pbml0aWFsT2NjdXBhbnRzLm1hcCh0aGlzLmFkZE9jY3VwYW50LmJpbmQodGhpcykpKTtcbiAgfVxuXG4gIG9uV2Vic29ja2V0TWVzc2FnZShldmVudCkge1xuICAgIHRoaXMuc2Vzc2lvbi5yZWNlaXZlKEpTT04ucGFyc2UoZXZlbnQuZGF0YSkpO1xuICB9XG5cbiAgYXN5bmMgYWRkT2NjdXBhbnQob2NjdXBhbnRJZCkge1xuICAgIHZhciBzdWJzY3JpYmVyID0gYXdhaXQgdGhpcy5jcmVhdGVTdWJzY3JpYmVyKG9jY3VwYW50SWQpO1xuXG4gICAgdGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0gPSBzdWJzY3JpYmVyO1xuXG4gICAgdGhpcy5zZXRNZWRpYVN0cmVhbShvY2N1cGFudElkLCBzdWJzY3JpYmVyLm1lZGlhU3RyZWFtKTtcblxuICAgIC8vIENhbGwgdGhlIE5ldHdvcmtlZCBBRnJhbWUgY2FsbGJhY2tzIGZvciB0aGUgbmV3IG9jY3VwYW50LlxuICAgIHRoaXMub25PY2N1cGFudENvbm5lY3RlZChvY2N1cGFudElkKTtcbiAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XG5cbiAgICByZXR1cm4gc3Vic2NyaWJlcjtcbiAgfVxuXG4gIHJlbW92ZU9jY3VwYW50KG9jY3VwYW50SWQpIHtcbiAgICBpZiAodGhpcy5vY2N1cGFudHNbb2NjdXBhbnRJZF0pIHtcbiAgICAgIC8vIENsb3NlIHRoZSBzdWJzY3JpYmVyIHBlZXIgY29ubmVjdGlvbi4gV2hpY2ggYWxzbyBkZXRhY2hlcyB0aGUgcGx1Z2luIGhhbmRsZS5cbiAgICAgIGlmICh0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSkge1xuICAgICAgICB0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXS5jb25uLmNsb3NlKCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMubWVkaWFTdHJlYW1zW29jY3VwYW50SWRdKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLm1lZGlhU3RyZWFtc1tvY2N1cGFudElkXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuaGFzKG9jY3VwYW50SWQpKSB7XG4gICAgICAgIGNvbnN0IG1zZyA9IFwiVGhlIHVzZXIgZGlzY29ubmVjdGVkIGJlZm9yZSB0aGUgbWVkaWEgc3RyZWFtIHdhcyByZXNvbHZlZC5cIjtcbiAgICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQob2NjdXBhbnRJZCkuYXVkaW8ucmVqZWN0KG1zZyk7XG4gICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KG9jY3VwYW50SWQpLnZpZGVvLnJlamVjdChtc2cpO1xuICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmRlbGV0ZShvY2N1cGFudElkKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FsbCB0aGUgTmV0d29ya2VkIEFGcmFtZSBjYWxsYmFja3MgZm9yIHRoZSByZW1vdmVkIG9jY3VwYW50LlxuICAgICAgdGhpcy5vbk9jY3VwYW50RGlzY29ubmVjdGVkKG9jY3VwYW50SWQpO1xuICAgICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xuICAgIH1cbiAgfVxuXG4gIGFzc29jaWF0ZShjb25uLCBoYW5kbGUpIHtcbiAgICBjb25uLmFkZEV2ZW50TGlzdGVuZXIoXCJpY2VjYW5kaWRhdGVcIiwgZXYgPT4ge1xuICAgICAgaGFuZGxlLnNlbmRUcmlja2xlKGV2LmNhbmRpZGF0ZSB8fCBudWxsKS5jYXRjaChlID0+IGVycm9yKFwiRXJyb3IgdHJpY2tsaW5nIElDRTogJW9cIiwgZSkpO1xuICAgIH0pO1xuXG4gICAgLy8gd2UgaGF2ZSB0byBkZWJvdW5jZSB0aGVzZSBiZWNhdXNlIGphbnVzIGdldHMgYW5ncnkgaWYgeW91IHNlbmQgaXQgYSBuZXcgU0RQIGJlZm9yZSBpdCdzIGZpbmlzaGVkIHByb2Nlc3NpbmcgYW5cbiAgICAvLyBleGlzdGluZyBTRFAuIG1heWJlIGFub3RoZXIsIHNsaWdodGx5IG1vcmUgY29ycmVjdCBhcHByb2FjaCB3b3VsZCBiZSB0byBub3Qgc2V0IHRoZSByZW1vdGUgZGVzY3JpcHRpb24gdW50aWwgd2VcbiAgICAvLyBnZXQgdGhlIHdlYnJ0Y3VwIGV2ZW50P1xuICAgIGNvbm4uYWRkRXZlbnRMaXN0ZW5lcihcIm5lZ290aWF0aW9ubmVlZGVkXCIsIGRlYm91bmNlKGV2ID0+IHtcbiAgICAgIGRlYnVnKFwiU2VuZGluZyBuZXcgb2ZmZXIgZm9yIGhhbmRsZTogJW9cIiwgaGFuZGxlKTtcbiAgICAgIHZhciBvZmZlciA9IGNvbm4uY3JlYXRlT2ZmZXIoKTtcbiAgICAgIHZhciBsb2NhbCA9IG9mZmVyLnRoZW4obyA9PiBjb25uLnNldExvY2FsRGVzY3JpcHRpb24obykpO1xuICAgICAgdmFyIHJlbW90ZSA9IG9mZmVyLnRoZW4oaiA9PiBoYW5kbGUuc2VuZEpzZXAoaikpLnRoZW4ociA9PiBjb25uLnNldFJlbW90ZURlc2NyaXB0aW9uKHIuanNlcCkpO1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtsb2NhbCwgcmVtb3RlXSkuY2F0Y2goZSA9PiBlcnJvcihcIkVycm9yIG5lZ290aWF0aW5nIG9mZmVyOiAlb1wiLCBlKSk7XG4gICAgfSkpO1xuXG4gICAgaGFuZGxlLm9uKFwiZXZlbnRcIiwgZGVib3VuY2UoZXYgPT4ge1xuICAgICAgdmFyIGpzZXAgPSBldi5qc2VwO1xuICAgICAgaWYgKGpzZXAgJiYganNlcC50eXBlID09IFwib2ZmZXJcIikge1xuICAgICAgICBkZWJ1ZyhcIkFjY2VwdGluZyBuZXcgb2ZmZXIgZm9yIGhhbmRsZTogJW9cIiwgaGFuZGxlKTtcbiAgICAgICAganNlcC5zZHAgPSB0aGlzLmNvbmZpZ3VyZVN1YnNjcmliZXJTZHAoanNlcC5zZHApO1xuICAgICAgICB2YXIgYW5zd2VyID0gY29ubi5zZXRSZW1vdGVEZXNjcmlwdGlvbihqc2VwKS50aGVuKF8gPT4gY29ubi5jcmVhdGVBbnN3ZXIoKSk7XG4gICAgICAgIHZhciBsb2NhbCA9IGFuc3dlci50aGVuKGEgPT4gY29ubi5zZXRMb2NhbERlc2NyaXB0aW9uKGEpKTtcbiAgICAgICAgdmFyIHJlbW90ZSA9IGFuc3dlci50aGVuKGogPT4gaGFuZGxlLnNlbmRKc2VwKGopKTtcbiAgICAgICAgUHJvbWlzZS5hbGwoW2xvY2FsLCByZW1vdGVdKS5jYXRjaChlID0+IGVycm9yKFwiRXJyb3IgbmVnb3RpYXRpbmcgYW5zd2VyOiAlb1wiLCBlKSk7XG4gICAgICB9XG4gICAgfSkpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlUHVibGlzaGVyKCkge1xuICAgIHZhciBoYW5kbGUgPSBuZXcgbWouSmFudXNQbHVnaW5IYW5kbGUodGhpcy5zZXNzaW9uKTtcbiAgICB2YXIgY29ubiA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbihQRUVSX0NPTk5FQ1RJT05fQ09ORklHKTtcbiAgICB0aGlzLmFzc29jaWF0ZShjb25uLCBoYW5kbGUpO1xuXG4gICAgZGVidWcoXCJwdWIgd2FpdGluZyBmb3Igc2Z1XCIpO1xuICAgIGF3YWl0IGhhbmRsZS5hdHRhY2goXCJqYW51cy5wbHVnaW4uc2Z1XCIpO1xuXG4gICAgLy8gQ3JlYXRlIGFuIHVucmVsaWFibGUgZGF0YWNoYW5uZWwgZm9yIHNlbmRpbmcgYW5kIHJlY2VpdmluZyBjb21wb25lbnQgdXBkYXRlcywgZXRjLlxuICAgIHZhciB1bnJlbGlhYmxlQ2hhbm5lbCA9IGNvbm4uY3JlYXRlRGF0YUNoYW5uZWwoXCJ1bnJlbGlhYmxlXCIsIHsgb3JkZXJlZDogZmFsc2UsIG1heFJldHJhbnNtaXRzOiAwIH0pO1xuICAgIHVucmVsaWFibGVDaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UpO1xuXG4gICAgLy8gQ3JlYXRlIGEgcmVsaWFibGUgZGF0YWNoYW5uZWwgZm9yIHNlbmRpbmcgYW5kIHJlY2lldmluZyBlbnRpdHkgaW5zdGFudGlhdGlvbnMsIGV0Yy5cbiAgICB2YXIgcmVsaWFibGVDaGFubmVsID0gY29ubi5jcmVhdGVEYXRhQ2hhbm5lbChcInJlbGlhYmxlXCIsIHsgb3JkZXJlZDogdHJ1ZSB9KTtcbiAgICByZWxpYWJsZUNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbkRhdGFDaGFubmVsTWVzc2FnZSk7XG5cbiAgICBpZiAodGhpcy5sb2NhbE1lZGlhU3RyZWFtKSB7XG4gICAgICB0aGlzLmxvY2FsTWVkaWFTdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgIGNvbm4uYWRkVHJhY2sodHJhY2ssIHRoaXMubG9jYWxNZWRpYVN0cmVhbSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBkZWJ1ZyhcInB1YiB3YWl0aW5nIGZvciB3ZWJydGN1cFwiKTtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGhhbmRsZS5vbihcIndlYnJ0Y3VwXCIsIHJlc29sdmUpKTtcblxuICAgIC8vIEhhbmRsZSBhbGwgb2YgdGhlIGpvaW4gYW5kIGxlYXZlIGV2ZW50cy5cbiAgICBoYW5kbGUub24oXCJldmVudFwiLCBldiA9PiB7XG4gICAgICB2YXIgZGF0YSA9IGV2LnBsdWdpbmRhdGEuZGF0YTtcbiAgICAgIGlmIChkYXRhLmV2ZW50ID09IFwiam9pblwiICYmIGRhdGEucm9vbV9pZCA9PSB0aGlzLnJvb20pIHtcbiAgICAgICAgdGhpcy5hZGRPY2N1cGFudChkYXRhLnVzZXJfaWQpO1xuICAgICAgfSBlbHNlIGlmIChkYXRhLmV2ZW50ID09IFwibGVhdmVcIiAmJiBkYXRhLnJvb21faWQgPT0gdGhpcy5yb29tKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlT2NjdXBhbnQoZGF0YS51c2VyX2lkKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGRlYnVnKFwicHViIHdhaXRpbmcgZm9yIGpvaW5cIik7XG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIExpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gQXV0b21hdGljYWxseSBzdWJzY3JpYmUgdG8gYWxsIHVzZXJzJyBXZWJSVEMgZGF0YS5cbiAgICB2YXIgbWVzc2FnZSA9IGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB7IG5vdGlmaWNhdGlvbnM6IHRydWUsIGRhdGE6IHRydWUgfSk7XG4gICAgdmFyIGluaXRpYWxPY2N1cGFudHMgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YS5yZXNwb25zZS51c2Vyc1t0aGlzLnJvb21dIHx8IFtdO1xuXG4gICAgZGVidWcoXCJwdWJsaXNoZXIgcmVhZHlcIik7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhhbmRsZSxcbiAgICAgIGluaXRpYWxPY2N1cGFudHMsXG4gICAgICByZWxpYWJsZUNoYW5uZWwsXG4gICAgICB1bnJlbGlhYmxlQ2hhbm5lbCxcbiAgICAgIGNvbm5cbiAgICB9O1xuICB9XG5cbiAgY29uZmlndXJlU3Vic2NyaWJlclNkcChvcmlnaW5hbFNkcCkge1xuICAgIGlmICghaXNIMjY0VmlkZW9TdXBwb3J0ZWQpIHtcbiAgICAgIHJldHVybiBvcmlnaW5hbFNkcDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBIYWNrIHRvIGdldCB2aWRlbyB3b3JraW5nIG9uIENocm9tZSBmb3IgQW5kcm9pZC4gaHR0cHM6Ly9ncm91cHMuZ29vZ2xlLmNvbS9mb3J1bS8jIXRvcGljL21vemlsbGEuZGV2Lm1lZGlhL1llMjl2dU1UcG84XG4gICAgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkFuZHJvaWRcIikgPT09IC0xKSB7XG4gICAgICByZXR1cm4gb3JpZ2luYWxTZHAucmVwbGFjZShcbiAgICAgICAgXCJhPXJ0Y3AtZmI6MTA3IGdvb2ctcmVtYlxcclxcblwiLFxuICAgICAgICBcImE9cnRjcC1mYjoxMDcgZ29vZy1yZW1iXFxyXFxuYT1ydGNwLWZiOjEwNyB0cmFuc3BvcnQtY2NcXHJcXG5hPWZtdHA6MTA3IGxldmVsLWFzeW1tZXRyeS1hbGxvd2VkPTE7cGFja2V0aXphdGlvbi1tb2RlPTE7cHJvZmlsZS1sZXZlbC1pZD00MmUwMWZcXHJcXG5cIlxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9yaWdpbmFsU2RwLnJlcGxhY2UoXG4gICAgICAgIFwiYT1ydGNwLWZiOjEwNyBnb29nLXJlbWJcXHJcXG5cIixcbiAgICAgICAgXCJhPXJ0Y3AtZmI6MTA3IGdvb2ctcmVtYlxcclxcbmE9cnRjcC1mYjoxMDcgdHJhbnNwb3J0LWNjXFxyXFxuYT1mbXRwOjEwNyBsZXZlbC1hc3ltbWV0cnktYWxsb3dlZD0xO3BhY2tldGl6YXRpb24tbW9kZT0xO3Byb2ZpbGUtbGV2ZWwtaWQ9NDIwMDFmXFxyXFxuXCJcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKSB7XG4gICAgdmFyIGhhbmRsZSA9IG5ldyBtai5KYW51c1BsdWdpbkhhbmRsZSh0aGlzLnNlc3Npb24pO1xuICAgIHZhciBjb25uID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKFBFRVJfQ09OTkVDVElPTl9DT05GSUcpO1xuICAgIHRoaXMuYXNzb2NpYXRlKGNvbm4sIGhhbmRsZSk7XG5cbiAgICBkZWJ1ZyhcInN1YiB3YWl0aW5nIGZvciBzZnVcIik7XG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XG5cbiAgICBkZWJ1ZyhcInN1YiB3YWl0aW5nIGZvciBqb2luXCIpO1xuICAgIC8vIFNlbmQgam9pbiBtZXNzYWdlIHRvIGphbnVzLiBEb24ndCBsaXN0ZW4gZm9yIGpvaW4vbGVhdmUgbWVzc2FnZXMuIFN1YnNjcmliZSB0byB0aGUgb2NjdXBhbnQncyBtZWRpYS5cbiAgICAvLyBKYW51cyBzaG91bGQgc2VuZCB1cyBhbiBvZmZlciBmb3IgdGhpcyBvY2N1cGFudCdzIG1lZGlhIGluIHJlc3BvbnNlIHRvIHRoaXMuXG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB7IG1lZGlhOiBvY2N1cGFudElkIH0pO1xuXG4gICAgZGVidWcoXCJzdWIgd2FpdGluZyBmb3Igd2VicnRjdXBcIik7XG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBoYW5kbGUub24oXCJ3ZWJydGN1cFwiLCByZXNvbHZlKSk7XG5cbiAgICB2YXIgbWVkaWFTdHJlYW0gPSBuZXcgTWVkaWFTdHJlYW0oKTtcbiAgICB2YXIgcmVjZWl2ZXJzID0gY29ubi5nZXRSZWNlaXZlcnMoKTtcbiAgICByZWNlaXZlcnMuZm9yRWFjaChyZWNlaXZlciA9PiB7XG4gICAgICBpZiAocmVjZWl2ZXIudHJhY2spIHtcbiAgICAgICAgbWVkaWFTdHJlYW0uYWRkVHJhY2socmVjZWl2ZXIudHJhY2spO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChtZWRpYVN0cmVhbS5nZXRUcmFja3MoKS5sZW5ndGggPT09IDApIHtcbiAgICAgIG1lZGlhU3RyZWFtID0gbnVsbDtcbiAgICB9XG5cbiAgICBkZWJ1ZyhcInN1YnNjcmliZXIgcmVhZHlcIik7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhhbmRsZSxcbiAgICAgIG1lZGlhU3RyZWFtLFxuICAgICAgY29ublxuICAgIH07XG4gIH1cblxuICBzZW5kSm9pbihoYW5kbGUsIHN1YnNjcmliZSkge1xuICAgIHJldHVybiBoYW5kbGUuc2VuZE1lc3NhZ2Uoe1xuICAgICAga2luZDogXCJqb2luXCIsXG4gICAgICByb29tX2lkOiB0aGlzLnJvb20sXG4gICAgICB1c2VyX2lkOiB0aGlzLnVzZXJJZCxcbiAgICAgIHN1YnNjcmliZVxuICAgIH0pO1xuICB9XG5cbiAgb25EYXRhQ2hhbm5lbE1lc3NhZ2UoZXZlbnQpIHtcbiAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cbiAgICBpZiAobWVzc2FnZS5kYXRhVHlwZSkge1xuICAgICAgdGhpcy5vbk9jY3VwYW50TWVzc2FnZShudWxsLCBtZXNzYWdlLmRhdGFUeXBlLCBtZXNzYWdlLmRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHNob3VsZFN0YXJ0Q29ubmVjdGlvblRvKGNsaWVudCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKGNsaWVudCkge31cblxuICBjbG9zZVN0cmVhbUNvbm5lY3Rpb24oY2xpZW50KSB7fVxuXG4gIGdldENvbm5lY3RTdGF0dXMoY2xpZW50SWQpIHtcbiAgICByZXR1cm4gdGhpcy5vY2N1cGFudHNbY2xpZW50SWRdID8gTkFGLmFkYXB0ZXJzLklTX0NPTk5FQ1RFRCA6IE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlVGltZU9mZnNldCgpIHtcbiAgICBjb25zdCBjbGllbnRTZW50VGltZSA9IERhdGUubm93KCk7XG5cbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChkb2N1bWVudC5sb2NhdGlvbi5ocmVmLCB7XG4gICAgICBtZXRob2Q6IFwiSEVBRFwiLFxuICAgICAgY2FjaGU6IFwibm8tY2FjaGVcIlxuICAgIH0pO1xuXG4gICAgY29uc3QgcHJlY2lzaW9uID0gMTAwMDtcbiAgICBjb25zdCBzZXJ2ZXJSZWNlaXZlZFRpbWUgPVxuICAgICAgbmV3IERhdGUocmVzLmhlYWRlcnMuZ2V0KFwiRGF0ZVwiKSkuZ2V0VGltZSgpICsgcHJlY2lzaW9uIC8gMjtcbiAgICBjb25zdCBjbGllbnRSZWNlaXZlZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IHNlcnZlclRpbWUgPVxuICAgICAgc2VydmVyUmVjZWl2ZWRUaW1lICsgKGNsaWVudFJlY2VpdmVkVGltZSAtIGNsaWVudFNlbnRUaW1lKSAvIDI7XG4gICAgY29uc3QgdGltZU9mZnNldCA9IHNlcnZlclRpbWUgLSBjbGllbnRSZWNlaXZlZFRpbWU7XG5cbiAgICB0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cysrO1xuXG4gICAgaWYgKHRoaXMuc2VydmVyVGltZVJlcXVlc3RzIDw9IDEwKSB7XG4gICAgICB0aGlzLnRpbWVPZmZzZXRzLnB1c2godGltZU9mZnNldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudGltZU9mZnNldHNbdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgJSAxMF0gPSB0aW1lT2Zmc2V0O1xuICAgIH1cblxuICAgIHRoaXMuYXZnVGltZU9mZnNldCA9XG4gICAgICB0aGlzLnRpbWVPZmZzZXRzLnJlZHVjZSgoYWNjLCBvZmZzZXQpID0+IChhY2MgKz0gb2Zmc2V0KSwgMCkgL1xuICAgICAgdGhpcy50aW1lT2Zmc2V0cy5sZW5ndGg7XG5cbiAgICBpZiAodGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPiAxMCkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKSwgNSAqIDYwICogMTAwMCk7IC8vIFN5bmMgY2xvY2sgZXZlcnkgNSBtaW51dGVzLlxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKTtcbiAgICB9XG4gIH1cblxuICBnZXRTZXJ2ZXJUaW1lKCkge1xuICAgIHJldHVybiBEYXRlLm5vdygpICsgdGhpcy5hdmdUaW1lT2Zmc2V0O1xuICB9XG5cbiAgZ2V0TWVkaWFTdHJlYW0oY2xpZW50SWQsIHR5cGUgPSAnYXVkaW8nKSB7XG4gICAgaWYgKHRoaXMubWVkaWFTdHJlYW1zW2NsaWVudElkXSkge1xuICAgICAgZGVidWcoYEFscmVhZHkgaGFkICR7dHlwZX0gZm9yICR7Y2xpZW50SWR9YCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMubWVkaWFTdHJlYW1zW2NsaWVudElkXVt0eXBlXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnKGBXYWl0aW5nIG9uICR7dHlwZX0gZm9yICR7Y2xpZW50SWR9YCk7XG4gICAgICBpZiAoIXRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuaGFzKGNsaWVudElkKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLnNldChjbGllbnRJZCwge30pO1xuXG4gICAgICAgIGNvbnN0IGF1ZGlvUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChjbGllbnRJZCkuYXVkaW8gPSB7IHJlc29sdmUsIHJlamVjdCB9O1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdmlkZW9Qcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KGNsaWVudElkKS52aWRlbyA9IHsgcmVzb2x2ZSwgcmVqZWN0IH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KGNsaWVudElkKS5hdWRpby5wcm9taXNlID0gYXVkaW9Qcm9taXNlO1xuICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChjbGllbnRJZCkudmlkZW8ucHJvbWlzZSA9IHZpZGVvUHJvbWlzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChjbGllbnRJZClbdHlwZV0ucHJvbWlzZTtcbiAgICB9XG4gIH1cblxuICBzZXRNZWRpYVN0cmVhbShjbGllbnRJZCwgc3RyZWFtKSB7XG4gICAgLy8gU2FmYXJpIGRvZXNuJ3QgbGlrZSBpdCB3aGVuIHlvdSB1c2Ugc2luZ2xlIGEgbWl4ZWQgbWVkaWEgc3RyZWFtIHdoZXJlIG9uZSBvZiB0aGUgdHJhY2tzIGlzIGluYWN0aXZlLCBzbyB3ZVxuICAgIC8vIHNwbGl0IHRoZSB0cmFja3MgaW50byB0d28gc3RyZWFtcy5cbiAgICBjb25zdCBhdWRpb1N0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xuICAgIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2godHJhY2sgPT4gYXVkaW9TdHJlYW0uYWRkVHJhY2sodHJhY2spKTtcbiAgICBjb25zdCB2aWRlb1N0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xuICAgIHN0cmVhbS5nZXRWaWRlb1RyYWNrcygpLmZvckVhY2godHJhY2sgPT4gdmlkZW9TdHJlYW0uYWRkVHJhY2sodHJhY2spKTtcblxuICAgIHRoaXMubWVkaWFTdHJlYW1zW2NsaWVudElkXSA9IHsgYXVkaW86IGF1ZGlvU3RyZWFtLCB2aWRlbzogdmlkZW9TdHJlYW0gfTtcblxuICAgIC8vIFJlc29sdmUgdGhlIHByb21pc2UgZm9yIHRoZSB1c2VyJ3MgbWVkaWEgc3RyZWFtIGlmIGl0IGV4aXN0cy5cbiAgICBpZiAodGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5oYXMoY2xpZW50SWQpKSB7XG4gICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChjbGllbnRJZCkuYXVkaW8ucmVzb2x2ZShhdWRpb1N0cmVhbSk7XG4gICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChjbGllbnRJZCkudmlkZW8ucmVzb2x2ZSh2aWRlb1N0cmVhbSk7XG4gICAgfVxuICB9XG5cbiAgc2V0TG9jYWxNZWRpYVN0cmVhbShzdHJlYW0pIHtcbiAgICAvLyBvdXIgam9iIGhlcmUgaXMgdG8gbWFrZSBzdXJlIHRoZSBjb25uZWN0aW9uIHdpbmRzIHVwIHdpdGggUlRQIHNlbmRlcnMgc2VuZGluZyB0aGUgc3R1ZmYgaW4gdGhpcyBzdHJlYW0sXG4gICAgLy8gYW5kIG5vdCB0aGUgc3R1ZmYgdGhhdCBpc24ndCBpbiB0aGlzIHN0cmVhbS4gc3RyYXRlZ3kgaXMgdG8gcmVwbGFjZSBleGlzdGluZyB0cmFja3MgaWYgd2UgY2FuLCBhZGQgdHJhY2tzXG4gICAgLy8gdGhhdCB3ZSBjYW4ndCByZXBsYWNlLCBhbmQgZGlzYWJsZSB0cmFja3MgdGhhdCBkb24ndCBleGlzdCBhbnltb3JlLlxuXG4gICAgLy8gbm90ZSB0aGF0IHdlIGRvbid0IGV2ZXIgcmVtb3ZlIGEgdHJhY2sgZnJvbSB0aGUgc3RyZWFtIC0tIHNpbmNlIEphbnVzIGRvZXNuJ3Qgc3VwcG9ydCBVbmlmaWVkIFBsYW4sIHdlIGFic29sdXRlbHlcbiAgICAvLyBjYW4ndCB3aW5kIHVwIHdpdGggYSBTRFAgdGhhdCBoYXMgPjEgYXVkaW8gb3IgPjEgdmlkZW8gdHJhY2tzLCBldmVuIGlmIG9uZSBvZiB0aGVtIGlzIGluYWN0aXZlICh3aGF0IHlvdSBnZXQgaWZcbiAgICAvLyB5b3UgcmVtb3ZlIGEgdHJhY2sgZnJvbSBhbiBleGlzdGluZyBzdHJlYW0uKVxuICAgIGlmICh0aGlzLnB1Ymxpc2hlciAmJiB0aGlzLnB1Ymxpc2hlci5jb25uKSB7XG4gICAgICB2YXIgZXhpc3RpbmdTZW5kZXJzID0gdGhpcy5wdWJsaXNoZXIuY29ubi5nZXRTZW5kZXJzKCk7XG4gICAgICB2YXIgbmV3U2VuZGVycyA9IFtdO1xuICAgICAgc3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2godCA9PiB7XG4gICAgICAgIHZhciBzZW5kZXIgPSBleGlzdGluZ1NlbmRlcnMuZmluZChzID0+IHMudHJhY2sgIT0gbnVsbCAmJiBzLnRyYWNrLmtpbmQgPT0gdC5raW5kKTtcbiAgICAgICAgaWYgKHNlbmRlciAhPSBudWxsKSB7XG4gICAgICAgICAgaWYgKHNlbmRlci5yZXBsYWNlVHJhY2spIHtcbiAgICAgICAgICAgIHNlbmRlci5yZXBsYWNlVHJhY2sodCk7XG4gICAgICAgICAgICBzZW5kZXIudHJhY2suZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHJlcGxhY2VUcmFjayBpc24ndCBpbXBsZW1lbnRlZCBpbiBDaHJvbWUsIGV2ZW4gdmlhIHdlYnJ0Yy1hZGFwdGVyLlxuICAgICAgICAgICAgc3RyZWFtLnJlbW92ZVRyYWNrKHNlbmRlci50cmFjayk7XG4gICAgICAgICAgICBzdHJlYW0uYWRkVHJhY2sodCk7XG4gICAgICAgICAgICB0LmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdTZW5kZXJzLnB1c2goc2VuZGVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdTZW5kZXJzLnB1c2godGhpcy5wdWJsaXNoZXIuY29ubi5hZGRUcmFjayh0LCBzdHJlYW0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBleGlzdGluZ1NlbmRlcnMuZm9yRWFjaChzID0+IHtcbiAgICAgICAgaWYgKCFuZXdTZW5kZXJzLmluY2x1ZGVzKHMpKSB7XG4gICAgICAgICAgcy50cmFjay5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLmxvY2FsTWVkaWFTdHJlYW0gPSBzdHJlYW07XG4gICAgdGhpcy5zZXRNZWRpYVN0cmVhbSh0aGlzLnVzZXJJZCwgc3RyZWFtKTtcbiAgfVxuXG4gIGVuYWJsZU1pY3JvcGhvbmUoZW5hYmxlZCkge1xuICAgIGlmICh0aGlzLnB1Ymxpc2hlciAmJiB0aGlzLnB1Ymxpc2hlci5jb25uKSB7XG4gICAgICB0aGlzLnB1Ymxpc2hlci5jb25uLmdldFNlbmRlcnMoKS5mb3JFYWNoKHMgPT4ge1xuICAgICAgICBpZiAocy50cmFjay5raW5kID09IFwiYXVkaW9cIikge1xuICAgICAgICAgIHMudHJhY2suZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xuICAgIHRoaXMucHVibGlzaGVyLnVucmVsaWFibGVDaGFubmVsLnNlbmQoXG4gICAgICBKU09OLnN0cmluZ2lmeSh7IGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSB9KVxuICAgICk7XG4gIH1cblxuICBzZW5kRGF0YUd1YXJhbnRlZWQoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XG4gICAgdGhpcy5wdWJsaXNoZXIucmVsaWFibGVDaGFubmVsLnNlbmQoXG4gICAgICBKU09OLnN0cmluZ2lmeSh7IGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSB9KVxuICAgICk7XG4gIH1cblxuICBicm9hZGNhc3REYXRhKGRhdGFUeXBlLCBkYXRhKSB7XG4gICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcbiAgfVxuXG4gIGJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKGRhdGFUeXBlLCBkYXRhKSB7XG4gICAgdGhpcy5wdWJsaXNoZXIucmVsaWFibGVDaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSk7XG4gIH1cbn1cblxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwiamFudXNcIiwgSmFudXNBZGFwdGVyKTtcblxubW9kdWxlLmV4cG9ydHMgPSBKYW51c0FkYXB0ZXI7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvaW5kZXguanMiLCIvKipcbiAqIFJlcHJlc2VudHMgYSBoYW5kbGUgdG8gYSBzaW5nbGUgSmFudXMgcGx1Z2luIG9uIGEgSmFudXMgc2Vzc2lvbi4gRWFjaCBXZWJSVEMgY29ubmVjdGlvbiB0byB0aGUgSmFudXMgc2VydmVyIHdpbGwgYmVcbiAqIGFzc29jaWF0ZWQgd2l0aCBhIHNpbmdsZSBoYW5kbGUuIE9uY2UgYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgdGhpcyBoYW5kbGUgd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmVcbiAqIHVzZWQgdG8gYXNzb2NpYXRlIGl0IHdpdGggZnV0dXJlIHNpZ25hbGxpbmcgbWVzc2FnZXMuXG4gKlxuICogU2VlIGh0dHBzOi8vamFudXMuY29uZi5tZWV0ZWNoby5jb20vZG9jcy9yZXN0Lmh0bWwjaGFuZGxlcy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzUGx1Z2luSGFuZGxlKHNlc3Npb24pIHtcbiAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcbiAgdGhpcy5pZCA9IHVuZGVmaW5lZDtcbn1cblxuLyoqIEF0dGFjaGVzIHRoaXMgaGFuZGxlIHRvIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihwbHVnaW4pIHtcbiAgdmFyIHBheWxvYWQgPSB7IHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKFwiYXR0YWNoXCIsIHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwiZGV0YWNoXCIpO1xufTtcblxuLyoqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGZpcmVkIHVwb24gdGhlIHJlY2VwdGlvbiBvZiBhbnkgaW5jb21pbmcgSmFudXMgc2lnbmFscyBmb3IgdGhpcyBwbHVnaW4gaGFuZGxlIHdpdGggdGhlXG4gKiBgamFudXNgIGF0dHJpYnV0ZSBlcXVhbCB0byBgZXZgLlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXYsIGNhbGxiYWNrKSB7XG4gIHJldHVybiB0aGlzLnNlc3Npb24ub24oZXYsIHNpZ25hbCA9PiB7XG4gICAgaWYgKHNpZ25hbC5zZW5kZXIgPT0gdGhpcy5pZCkge1xuICAgICAgY2FsbGJhY2soc2lnbmFsKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBTZW5kcyBhIHNpZ25hbCBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24odHlwZSwgc2lnbmFsKSB7XG4gIHJldHVybiB0aGlzLnNlc3Npb24uc2VuZCh0eXBlLCBPYmplY3QuYXNzaWduKHsgaGFuZGxlX2lkOiB0aGlzLmlkIH0sIHNpZ25hbCkpO1xufTtcblxuLyoqIFNlbmRzIGEgcGx1Z2luLXNwZWNpZmljIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcIm1lc3NhZ2VcIiwgeyBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcIm1lc3NhZ2VcIiwgeyBib2R5OiB7fSwganNlcDoganNlcCB9KTtcbn07XG5cbi8qKiBTZW5kcyBhbiBJQ0UgdHJpY2tsZSBjYW5kaWRhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kVHJpY2tsZSA9IGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwidHJpY2tsZVwiLCB7IGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHZlcmJvc2U6IGZhbHNlLFxuICAgIHRpbWVvdXRNczogMTAwMDAsXG4gICAga2VlcGFsaXZlTXM6IDMwMDAwXG4gIH0sIG9wdGlvbnMpO1xufVxuXG4vKiogQ3JlYXRlcyB0aGlzIHNlc3Npb24gb24gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcImNyZWF0ZVwiKS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqIERlc3Ryb3lzIHRoaXMgc2Vzc2lvbi4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcImRlc3Ryb3lcIikudGhlbigoKSA9PiB7XG4gICAgdGhpcy5fa2lsbEtlZXBhbGl2ZSgpO1xuICB9KTtcbn07XG5cbi8qKlxuICogV2hldGhlciB0aGlzIHNpZ25hbCByZXByZXNlbnRzIGFuIGVycm9yLCBhbmQgdGhlIGFzc29jaWF0ZWQgcHJvbWlzZSAoaWYgYW55KSBzaG91bGQgYmUgcmVqZWN0ZWQuXG4gKiBVc2VycyBzaG91bGQgb3ZlcnJpZGUgdGhpcyB0byBoYW5kbGUgYW55IGN1c3RvbSBwbHVnaW4tc3BlY2lmaWMgZXJyb3IgY29udmVudGlvbnMuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLmlzRXJyb3IgPSBmdW5jdGlvbihzaWduYWwpIHtcbiAgcmV0dXJuIHNpZ25hbC5qYW51cyA9PT0gXCJlcnJvclwiO1xufTtcblxuLyoqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGZpcmVkIHVwb24gdGhlIHJlY2VwdGlvbiBvZiBhbnkgaW5jb21pbmcgSmFudXMgc2lnbmFscyBmb3IgdGhpcyBzZXNzaW9uIHdpdGggdGhlXG4gKiBgamFudXNgIGF0dHJpYnV0ZSBlcXVhbCB0byBgZXZgLlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2LCBjYWxsYmFjaykge1xuICB2YXIgaGFuZGxlcnMgPSB0aGlzLmV2ZW50SGFuZGxlcnNbZXZdO1xuICBpZiAoaGFuZGxlcnMgPT0gbnVsbCkge1xuICAgIGhhbmRsZXJzID0gdGhpcy5ldmVudEhhbmRsZXJzW2V2XSA9IFtdO1xuICB9XG4gIGhhbmRsZXJzLnB1c2goY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBDYWxsYmFjayBmb3IgcmVjZWl2aW5nIEpTT04gc2lnbmFsbGluZyBtZXNzYWdlcyBwZXJ0aW5lbnQgdG8gdGhpcyBzZXNzaW9uLiBJZiB0aGUgc2lnbmFscyBhcmUgcmVzcG9uc2VzIHRvIHByZXZpb3VzbHlcbiAqIHNlbnQgc2lnbmFscywgdGhlIHByb21pc2VzIGZvciB0aGUgb3V0Z29pbmcgc2lnbmFscyB3aWxsIGJlIHJlc29sdmVkIG9yIHJlamVjdGVkIGFwcHJvcHJpYXRlbHkgd2l0aCB0aGlzIHNpZ25hbCBhcyBhblxuICogYXJndW1lbnQuXG4gKlxuICogRXh0ZXJuYWwgY2FsbGVycyBzaG91bGQgY2FsbCB0aGlzIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgYSBuZXcgc2lnbmFsIGFycml2ZXMgb24gdGhlIHRyYW5zcG9ydDsgZm9yIGV4YW1wbGUsIGluIGFcbiAqIFdlYlNvY2tldCdzIGBtZXNzYWdlYCBldmVudCwgb3Igd2hlbiBhIG5ldyBkYXR1bSBzaG93cyB1cCBpbiBhbiBIVFRQIGxvbmctcG9sbGluZyByZXNwb25zZS5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUucmVjZWl2ZSA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICBpZiAodGhpcy5vcHRpb25zLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiSW5jb21pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICBpZiAoc2lnbmFsLnNlc3Npb25faWQgIT0gdGhpcy5pZCkge1xuICAgIGNvbnNvbGUud2FybihcIkluY29ycmVjdCBzZXNzaW9uIElEIHJlY2VpdmVkIGluIEphbnVzIHNpZ25hbGxpbmcgbWVzc2FnZTogd2FzIFwiICsgc2lnbmFsLnNlc3Npb25faWQgKyBcIiwgZXhwZWN0ZWQgXCIgKyB0aGlzLmlkICsgXCIuXCIpO1xuICB9XG5cbiAgdmFyIHJlc3BvbnNlVHlwZSA9IHNpZ25hbC5qYW51cztcbiAgdmFyIGhhbmRsZXJzID0gdGhpcy5ldmVudEhhbmRsZXJzW3Jlc3BvbnNlVHlwZV07XG4gIGlmIChoYW5kbGVycyAhPSBudWxsKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaGFuZGxlcnNbaV0oc2lnbmFsKTtcbiAgICB9XG4gIH1cblxuICBpZiAoc2lnbmFsLnRyYW5zYWN0aW9uICE9IG51bGwpIHtcbiAgICB2YXIgdHhuID0gdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgaWYgKHR4biA9PSBudWxsKSB7XG4gICAgICAvLyB0aGlzIGlzIGEgcmVzcG9uc2UgdG8gYSB0cmFuc2FjdGlvbiB0aGF0IHdhc24ndCBjYXVzZWQgdmlhIEphbnVzU2Vzc2lvbi5zZW5kLCBvciBhIHBsdWdpbiByZXBsaWVkIHR3aWNlIHRvIGFcbiAgICAgIC8vIHNpbmdsZSByZXF1ZXN0LCBvciBzb21ldGhpbmcgZWxzZSB0aGF0IGlzbid0IHVuZGVyIG91ciBwdXJ2aWV3OyB0aGF0J3MgZmluZVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChyZXNwb25zZVR5cGUgPT09IFwiYWNrXCIgJiYgdHhuLnR5cGUgPT0gXCJtZXNzYWdlXCIpIHtcbiAgICAgIC8vIHRoaXMgaXMgYW4gYWNrIG9mIGFuIGFzeW5jaHJvbm91c2x5LXByb2Nlc3NlZCBwbHVnaW4gcmVxdWVzdCwgd2Ugc2hvdWxkIHdhaXQgdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB1bnRpbCB0aGVcbiAgICAgIC8vIGFjdHVhbCByZXNwb25zZSBjb21lcyBpblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eG4udGltZW91dCAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodHhuLnRpbWVvdXQpO1xuICAgIH1cblxuICAgIGRlbGV0ZSB0aGlzLnR4bnNbc2lnbmFsLnRyYW5zYWN0aW9uXTtcbiAgICAodGhpcy5pc0Vycm9yKHNpZ25hbCkgPyB0eG4ucmVqZWN0IDogdHhuLnJlc29sdmUpKHNpZ25hbCk7XG4gIH1cbn07XG5cbi8qKlxuICogU2VuZHMgYSBzaWduYWwgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2Vzc2lvbi4gU2lnbmFscyBzaG91bGQgYmUgSlNPTi1zZXJpYWxpemFibGUgb2JqZWN0cy4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsXG4gKiBiZSByZXNvbHZlZCBvciByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgdG8gdGhpcyBzaWduYWwgaXMgcmVjZWl2ZWQsIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZVxuICogc2Vzc2lvbiB0aW1lb3V0LlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24odHlwZSwgc2lnbmFsKSB7XG4gIHZhciB0eGlkID0gKHRoaXMubmV4dFR4SWQrKykudG9TdHJpbmcoKTtcbiAgc2lnbmFsID0gT2JqZWN0LmFzc2lnbih7IGphbnVzOiB0eXBlLCB0cmFuc2FjdGlvbjogdHhpZCB9LCBzaWduYWwpO1xuICBpZiAodGhpcy5pZCAhPSBudWxsKSB7IC8vIHRoaXMuaWQgaXMgdW5kZWZpbmVkIGluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlbiB3ZSdyZSBzZW5kaW5nIHRoZSBzZXNzaW9uIGNyZWF0ZSBtZXNzYWdlXG4gICAgc2lnbmFsID0gT2JqZWN0LmFzc2lnbih7IHNlc3Npb25faWQ6IHRoaXMuaWQgfSwgc2lnbmFsKTtcbiAgfVxuICBpZiAodGhpcy5vcHRpb25zLnZlcmJvc2UpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiT3V0Z29pbmcgSmFudXMgc2lnbmFsOiBcIiwgc2lnbmFsKTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVvdXRNcykge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJTaWduYWxsaW5nIG1lc3NhZ2Ugd2l0aCB0eGlkIFwiICsgdHhpZCArIFwiIHRpbWVkIG91dC5cIikpO1xuICAgICAgfSwgdGhpcy5vcHRpb25zLnRpbWVvdXRNcyk7XG4gICAgfVxuICAgIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dID0geyByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCwgdGltZW91dDogdGltZW91dCwgdHlwZTogdHlwZSB9O1xuICAgIHRoaXMub3V0cHV0KEpTT04uc3RyaW5naWZ5KHNpZ25hbCkpO1xuICAgIHRoaXMuX3Jlc2V0S2VlcGFsaXZlKCk7XG4gIH0pO1xufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fa2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnNlbmQoXCJrZWVwYWxpdmVcIik7XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9raWxsS2VlcGFsaXZlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmtlZXBhbGl2ZVRpbWVvdXQpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5rZWVwYWxpdmVUaW1lb3V0KTtcbiAgfVxufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fcmVzZXRLZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fa2lsbEtlZXBhbGl2ZSgpO1xuICBpZiAodGhpcy5vcHRpb25zLmtlZXBhbGl2ZU1zKSB7XG4gICAgdGhpcy5rZWVwYWxpdmVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9rZWVwYWxpdmUoKSwgdGhpcy5vcHRpb25zLmtlZXBhbGl2ZU1zKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEphbnVzUGx1Z2luSGFuZGxlLFxuICBKYW51c1Nlc3Npb25cbn07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9taW5pamFudXMvbWluaWphbnVzLmpzXG4vLyBtb2R1bGUgaWQgPSAyXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcbi8vIG1vZHVsZSBpZCA9IDNcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZURlYnVnLmRlYnVnID0gY3JlYXRlRGVidWdbJ2RlZmF1bHQnXSA9IGNyZWF0ZURlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogQWN0aXZlIGBkZWJ1Z2AgaW5zdGFuY2VzLlxuICovXG5leHBvcnRzLmluc3RhbmNlcyA9IFtdO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXIgb3IgdXBwZXItY2FzZSBsZXR0ZXIsIGkuZS4gXCJuXCIgYW5kIFwiTlwiLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycyA9IHt9O1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VsZWN0Q29sb3IobmFtZXNwYWNlKSB7XG4gIHZhciBoYXNoID0gMCwgaTtcblxuICBmb3IgKGkgaW4gbmFtZXNwYWNlKSB7XG4gICAgaGFzaCAgPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSArIG5hbWVzcGFjZS5jaGFyQ29kZUF0KGkpO1xuICAgIGhhc2ggfD0gMDsgLy8gQ29udmVydCB0byAzMmJpdCBpbnRlZ2VyXG4gIH1cblxuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbTWF0aC5hYnMoaGFzaCkgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBjcmVhdGVEZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICB2YXIgcHJldlRpbWU7XG5cbiAgZnVuY3Rpb24gZGVidWcoKSB7XG4gICAgLy8gZGlzYWJsZWQ/XG4gICAgaWYgKCFkZWJ1Zy5lbmFibGVkKSByZXR1cm47XG5cbiAgICB2YXIgc2VsZiA9IGRlYnVnO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyB0dXJuIHRoZSBgYXJndW1lbnRzYCBpbnRvIGEgcHJvcGVyIEFycmF5XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGFyZ3NbMF0gPSBleHBvcnRzLmNvZXJjZShhcmdzWzBdKTtcblxuICAgIGlmICgnc3RyaW5nJyAhPT0gdHlwZW9mIGFyZ3NbMF0pIHtcbiAgICAgIC8vIGFueXRoaW5nIGVsc2UgbGV0J3MgaW5zcGVjdCB3aXRoICVPXG4gICAgICBhcmdzLnVuc2hpZnQoJyVPJyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EtekEtWiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIC8vIGFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nIChjb2xvcnMsIGV0Yy4pXG4gICAgZXhwb3J0cy5mb3JtYXRBcmdzLmNhbGwoc2VsZiwgYXJncyk7XG5cbiAgICB2YXIgbG9nRm4gPSBkZWJ1Zy5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuXG4gIGRlYnVnLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgZGVidWcuZW5hYmxlZCA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpO1xuICBkZWJ1Zy51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICBkZWJ1Zy5jb2xvciA9IHNlbGVjdENvbG9yKG5hbWVzcGFjZSk7XG4gIGRlYnVnLmRlc3Ryb3kgPSBkZXN0cm95O1xuXG4gIC8vIGVudi1zcGVjaWZpYyBpbml0aWFsaXphdGlvbiBsb2dpYyBmb3IgZGVidWcgaW5zdGFuY2VzXG4gIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5pbml0KSB7XG4gICAgZXhwb3J0cy5pbml0KGRlYnVnKTtcbiAgfVxuXG4gIGV4cG9ydHMuaW5zdGFuY2VzLnB1c2goZGVidWcpO1xuXG4gIHJldHVybiBkZWJ1Zztcbn1cblxuZnVuY3Rpb24gZGVzdHJveSAoKSB7XG4gIHZhciBpbmRleCA9IGV4cG9ydHMuaW5zdGFuY2VzLmluZGV4T2YodGhpcyk7XG4gIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICBleHBvcnRzLmluc3RhbmNlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcbiAgZXhwb3J0cy5zYXZlKG5hbWVzcGFjZXMpO1xuXG4gIGV4cG9ydHMubmFtZXMgPSBbXTtcbiAgZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4gIHZhciBpO1xuICB2YXIgc3BsaXQgPSAodHlwZW9mIG5hbWVzcGFjZXMgPT09ICdzdHJpbmcnID8gbmFtZXNwYWNlcyA6ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGkgPSAwOyBpIDwgZXhwb3J0cy5pbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaW5zdGFuY2UgPSBleHBvcnRzLmluc3RhbmNlc1tpXTtcbiAgICBpbnN0YW5jZS5lbmFibGVkID0gZXhwb3J0cy5lbmFibGVkKGluc3RhbmNlLm5hbWVzcGFjZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICBpZiAobmFtZVtuYW1lLmxlbmd0aCAtIDFdID09PSAnKicpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9ub2RlX21vZHVsZXMvZGVidWcvc3JjL2RlYnVnLmpzXG4vLyBtb2R1bGUgaWQgPSA0XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkodmFsKVxuICApO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKFxuICAgIHN0clxuICApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgfVxuICBpZiAobXMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIH1cbiAgaWYgKG1zID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JykgfHxcbiAgICBwbHVyYWwobXMsIGgsICdob3VyJykgfHxcbiAgICBwbHVyYWwobXMsIG0sICdtaW51dGUnKSB8fFxuICAgIHBsdXJhbChtcywgcywgJ3NlY29uZCcpIHx8XG4gICAgbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAobXMgPCBuICogMS41KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJztcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzXG4vLyBtb2R1bGUgaWQgPSA1XG4vLyBtb2R1bGUgY2h1bmtzID0gMCJdLCJzb3VyY2VSb290IjoiIn0=