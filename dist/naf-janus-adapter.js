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
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/debug/src/browser.js":
/*!*******************************************!*\
  !*** ./node_modules/debug/src/browser.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(/*! ./debug */ "./node_modules/debug/src/debug.js");
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

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../process/browser.js */ "./node_modules/process/browser.js")))

/***/ }),

/***/ "./node_modules/debug/src/debug.js":
/*!*****************************************!*\
  !*** ./node_modules/debug/src/debug.js ***!
  \*****************************************/
/*! no static exports found */
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
exports.humanize = __webpack_require__(/*! ms */ "./node_modules/ms/index.js");

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

/***/ "./node_modules/minijanus/minijanus.js":
/*!*********************************************!*\
  !*** ./node_modules/minijanus/minijanus.js ***!
  \*********************************************/
/*! no static exports found */
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
    this._logIncoming(signal);
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
        reject(new Error("Signalling transaction with txid " + signal.transaction + " timed out."));
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
    this._logOutgoing(signal);
  }

  this.output(JSON.stringify(signal));
  this._resetKeepalive();
};

JanusSession.prototype._logOutgoing = function(signal) {
  var kind = signal.janus;
  if (kind === "message" && signal.jsep) {
    kind = signal.jsep.type;
  }
  var message = "> Outgoing Janus " + (kind || "signal") + " (#" + signal.transaction + "): ";
  console.debug("%c" + message, "color: #040", signal);
};

JanusSession.prototype._logIncoming = function(signal) {
  var kind = signal.janus;
  var message = signal.transaction ?
      "< Incoming Janus " + (kind || "signal") + " (#" + signal.transaction + "): " :
      "< Incoming Janus " + (kind || "signal") + ": ";
  console.debug("%c" + message, "color: #004", signal);
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

/***/ "./node_modules/ms/index.js":
/*!**********************************!*\
  !*** ./node_modules/ms/index.js ***!
  \**********************************/
/*! no static exports found */
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


/***/ }),

/***/ "./node_modules/process/browser.js":
/*!*****************************************!*\
  !*** ./node_modules/process/browser.js ***!
  \*****************************************/
/*! no static exports found */
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

/***/ "./node_modules/sdp/sdp.js":
/*!*********************************!*\
  !*** ./node_modules/sdp/sdp.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
 /* eslint-env node */


// SDP helpers.
var SDPUtils = {};

// Generate an alphanumeric identifier for cname or mids.
// TODO: use UUIDs instead? https://gist.github.com/jed/982883
SDPUtils.generateIdentifier = function() {
  return Math.random().toString(36).substr(2, 10);
};

// The RTCP CNAME used by all peerconnections from the same JS.
SDPUtils.localCName = SDPUtils.generateIdentifier();

// Splits SDP into lines, dealing with both CRLF and LF.
SDPUtils.splitLines = function(blob) {
  return blob.trim().split('\n').map(function(line) {
    return line.trim();
  });
};
// Splits SDP into sessionpart and mediasections. Ensures CRLF.
SDPUtils.splitSections = function(blob) {
  var parts = blob.split('\nm=');
  return parts.map(function(part, index) {
    return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
  });
};

// returns the session description.
SDPUtils.getDescription = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  return sections && sections[0];
};

// returns the individual media sections.
SDPUtils.getMediaSections = function(blob) {
  var sections = SDPUtils.splitSections(blob);
  sections.shift();
  return sections;
};

// Returns lines that start with a certain prefix.
SDPUtils.matchPrefix = function(blob, prefix) {
  return SDPUtils.splitLines(blob).filter(function(line) {
    return line.indexOf(prefix) === 0;
  });
};

// Parses an ICE candidate line. Sample input:
// candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
// rport 55996"
SDPUtils.parseCandidate = function(line) {
  var parts;
  // Parse both variants.
  if (line.indexOf('a=candidate:') === 0) {
    parts = line.substring(12).split(' ');
  } else {
    parts = line.substring(10).split(' ');
  }

  var candidate = {
    foundation: parts[0],
    component: parseInt(parts[1], 10),
    protocol: parts[2].toLowerCase(),
    priority: parseInt(parts[3], 10),
    ip: parts[4],
    port: parseInt(parts[5], 10),
    // skip parts[6] == 'typ'
    type: parts[7]
  };

  for (var i = 8; i < parts.length; i += 2) {
    switch (parts[i]) {
      case 'raddr':
        candidate.relatedAddress = parts[i + 1];
        break;
      case 'rport':
        candidate.relatedPort = parseInt(parts[i + 1], 10);
        break;
      case 'tcptype':
        candidate.tcpType = parts[i + 1];
        break;
      case 'ufrag':
        candidate.ufrag = parts[i + 1]; // for backward compability.
        candidate.usernameFragment = parts[i + 1];
        break;
      default: // extension handling, in particular ufrag
        candidate[parts[i]] = parts[i + 1];
        break;
    }
  }
  return candidate;
};

// Translates a candidate object into SDP candidate attribute.
SDPUtils.writeCandidate = function(candidate) {
  var sdp = [];
  sdp.push(candidate.foundation);
  sdp.push(candidate.component);
  sdp.push(candidate.protocol.toUpperCase());
  sdp.push(candidate.priority);
  sdp.push(candidate.ip);
  sdp.push(candidate.port);

  var type = candidate.type;
  sdp.push('typ');
  sdp.push(type);
  if (type !== 'host' && candidate.relatedAddress &&
      candidate.relatedPort) {
    sdp.push('raddr');
    sdp.push(candidate.relatedAddress);
    sdp.push('rport');
    sdp.push(candidate.relatedPort);
  }
  if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
    sdp.push('tcptype');
    sdp.push(candidate.tcpType);
  }
  if (candidate.usernameFragment || candidate.ufrag) {
    sdp.push('ufrag');
    sdp.push(candidate.usernameFragment || candidate.ufrag);
  }
  return 'candidate:' + sdp.join(' ');
};

// Parses an ice-options line, returns an array of option tags.
// a=ice-options:foo bar
SDPUtils.parseIceOptions = function(line) {
  return line.substr(14).split(' ');
}

// Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
// a=rtpmap:111 opus/48000/2
SDPUtils.parseRtpMap = function(line) {
  var parts = line.substr(9).split(' ');
  var parsed = {
    payloadType: parseInt(parts.shift(), 10) // was: id
  };

  parts = parts[0].split('/');

  parsed.name = parts[0];
  parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
  parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
  // legacy alias, got renamed back to channels in ORTC.
  parsed.numChannels = parsed.channels;
  return parsed;
};

// Generate an a=rtpmap line from RTCRtpCodecCapability or
// RTCRtpCodecParameters.
SDPUtils.writeRtpMap = function(codec) {
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  var channels = codec.channels || codec.numChannels || 1;
  return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
      (channels !== 1 ? '/' + channels : '') + '\r\n';
};

// Parses an a=extmap line (headerextension from RFC 5285). Sample input:
// a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:2/sendonly urn:ietf:params:rtp-hdrext:toffset
SDPUtils.parseExtmap = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    id: parseInt(parts[0], 10),
    direction: parts[0].indexOf('/') > 0 ? parts[0].split('/')[1] : 'sendrecv',
    uri: parts[1]
  };
};

// Generates a=extmap line from RTCRtpHeaderExtensionParameters or
// RTCRtpHeaderExtension.
SDPUtils.writeExtmap = function(headerExtension) {
  return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
      (headerExtension.direction && headerExtension.direction !== 'sendrecv'
          ? '/' + headerExtension.direction
          : '') +
      ' ' + headerExtension.uri + '\r\n';
};

// Parses an ftmp line, returns dictionary. Sample input:
// a=fmtp:96 vbr=on;cng=on
// Also deals with vbr=on; cng=on
SDPUtils.parseFmtp = function(line) {
  var parsed = {};
  var kv;
  var parts = line.substr(line.indexOf(' ') + 1).split(';');
  for (var j = 0; j < parts.length; j++) {
    kv = parts[j].trim().split('=');
    parsed[kv[0].trim()] = kv[1];
  }
  return parsed;
};

// Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeFmtp = function(codec) {
  var line = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.parameters && Object.keys(codec.parameters).length) {
    var params = [];
    Object.keys(codec.parameters).forEach(function(param) {
      if (codec.parameters[param]) {
        params.push(param + '=' + codec.parameters[param]);
      } else {
        params.push(param);
      }
    });
    line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
  }
  return line;
};

// Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
// a=rtcp-fb:98 nack rpsi
SDPUtils.parseRtcpFb = function(line) {
  var parts = line.substr(line.indexOf(' ') + 1).split(' ');
  return {
    type: parts.shift(),
    parameter: parts.join(' ')
  };
};
// Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeRtcpFb = function(codec) {
  var lines = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
    // FIXME: special handling for trr-int?
    codec.rtcpFeedback.forEach(function(fb) {
      lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
      (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
          '\r\n';
    });
  }
  return lines;
};

// Parses an RFC 5576 ssrc media attribute. Sample input:
// a=ssrc:3735928559 cname:something
SDPUtils.parseSsrcMedia = function(line) {
  var sp = line.indexOf(' ');
  var parts = {
    ssrc: parseInt(line.substr(7, sp - 7), 10)
  };
  var colon = line.indexOf(':', sp);
  if (colon > -1) {
    parts.attribute = line.substr(sp + 1, colon - sp - 1);
    parts.value = line.substr(colon + 1);
  } else {
    parts.attribute = line.substr(sp + 1);
  }
  return parts;
};

// Extracts the MID (RFC 5888) from a media section.
// returns the MID or undefined if no mid line was found.
SDPUtils.getMid = function(mediaSection) {
  var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0];
  if (mid) {
    return mid.substr(6);
  }
}

SDPUtils.parseFingerprint = function(line) {
  var parts = line.substr(14).split(' ');
  return {
    algorithm: parts[0].toLowerCase(), // algorithm is case-sensitive in Edge.
    value: parts[1]
  };
};

// Extracts DTLS parameters from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the fingerprint line as input. See also getIceParameters.
SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.matchPrefix(mediaSection + sessionpart,
      'a=fingerprint:');
  // Note: a=setup line is ignored since we use the 'auto' role.
  // Note2: 'algorithm' is not case sensitive except in Edge.
  return {
    role: 'auto',
    fingerprints: lines.map(SDPUtils.parseFingerprint)
  };
};

// Serializes DTLS parameters to SDP.
SDPUtils.writeDtlsParameters = function(params, setupType) {
  var sdp = 'a=setup:' + setupType + '\r\n';
  params.fingerprints.forEach(function(fp) {
    sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
  });
  return sdp;
};
// Parses ICE information from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the ice-ufrag and ice-pwd lines as input.
SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.splitLines(mediaSection);
  // Search in session part, too.
  lines = lines.concat(SDPUtils.splitLines(sessionpart));
  var iceParameters = {
    usernameFragment: lines.filter(function(line) {
      return line.indexOf('a=ice-ufrag:') === 0;
    })[0].substr(12),
    password: lines.filter(function(line) {
      return line.indexOf('a=ice-pwd:') === 0;
    })[0].substr(10)
  };
  return iceParameters;
};

// Serializes ICE parameters to SDP.
SDPUtils.writeIceParameters = function(params) {
  return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
      'a=ice-pwd:' + params.password + '\r\n';
};

// Parses the SDP media section and returns RTCRtpParameters.
SDPUtils.parseRtpParameters = function(mediaSection) {
  var description = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: [],
    rtcp: []
  };
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
    var pt = mline[i];
    var rtpmapline = SDPUtils.matchPrefix(
        mediaSection, 'a=rtpmap:' + pt + ' ')[0];
    if (rtpmapline) {
      var codec = SDPUtils.parseRtpMap(rtpmapline);
      var fmtps = SDPUtils.matchPrefix(
          mediaSection, 'a=fmtp:' + pt + ' ');
      // Only the first a=fmtp:<pt> is considered.
      codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
      codec.rtcpFeedback = SDPUtils.matchPrefix(
          mediaSection, 'a=rtcp-fb:' + pt + ' ')
        .map(SDPUtils.parseRtcpFb);
      description.codecs.push(codec);
      // parse FEC mechanisms from rtpmap lines.
      switch (codec.name.toUpperCase()) {
        case 'RED':
        case 'ULPFEC':
          description.fecMechanisms.push(codec.name.toUpperCase());
          break;
        default: // only RED and ULPFEC are recognized as FEC mechanisms.
          break;
      }
    }
  }
  SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
    description.headerExtensions.push(SDPUtils.parseExtmap(line));
  });
  // FIXME: parse rtcp.
  return description;
};

// Generates parts of the SDP media section describing the capabilities /
// parameters.
SDPUtils.writeRtpDescription = function(kind, caps) {
  var sdp = '';

  // Build the mline.
  sdp += 'm=' + kind + ' ';
  sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
  sdp += ' UDP/TLS/RTP/SAVPF ';
  sdp += caps.codecs.map(function(codec) {
    if (codec.preferredPayloadType !== undefined) {
      return codec.preferredPayloadType;
    }
    return codec.payloadType;
  }).join(' ') + '\r\n';

  sdp += 'c=IN IP4 0.0.0.0\r\n';
  sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';

  // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
  caps.codecs.forEach(function(codec) {
    sdp += SDPUtils.writeRtpMap(codec);
    sdp += SDPUtils.writeFmtp(codec);
    sdp += SDPUtils.writeRtcpFb(codec);
  });
  var maxptime = 0;
  caps.codecs.forEach(function(codec) {
    if (codec.maxptime > maxptime) {
      maxptime = codec.maxptime;
    }
  });
  if (maxptime > 0) {
    sdp += 'a=maxptime:' + maxptime + '\r\n';
  }
  sdp += 'a=rtcp-mux\r\n';

  if (caps.headerExtensions) {
    caps.headerExtensions.forEach(function(extension) {
      sdp += SDPUtils.writeExtmap(extension);
    });
  }
  // FIXME: write fecMechanisms.
  return sdp;
};

// Parses the SDP media section and returns an array of
// RTCRtpEncodingParameters.
SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
  var encodingParameters = [];
  var description = SDPUtils.parseRtpParameters(mediaSection);
  var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
  var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;

  // filter a=ssrc:... cname:, ignore PlanB-msid
  var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(parts) {
    return parts.attribute === 'cname';
  });
  var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
  var secondarySsrc;

  var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
  .map(function(line) {
    var parts = line.substr(17).split(' ');
    return parts.map(function(part) {
      return parseInt(part, 10);
    });
  });
  if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
    secondarySsrc = flows[0][1];
  }

  description.codecs.forEach(function(codec) {
    if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
      var encParam = {
        ssrc: primarySsrc,
        codecPayloadType: parseInt(codec.parameters.apt, 10),
      };
      if (primarySsrc && secondarySsrc) {
        encParam.rtx = {ssrc: secondarySsrc};
      }
      encodingParameters.push(encParam);
      if (hasRed) {
        encParam = JSON.parse(JSON.stringify(encParam));
        encParam.fec = {
          ssrc: secondarySsrc,
          mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
        };
        encodingParameters.push(encParam);
      }
    }
  });
  if (encodingParameters.length === 0 && primarySsrc) {
    encodingParameters.push({
      ssrc: primarySsrc
    });
  }

  // we support both b=AS and b=TIAS but interpret AS as TIAS.
  var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
  if (bandwidth.length) {
    if (bandwidth[0].indexOf('b=TIAS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(7), 10);
    } else if (bandwidth[0].indexOf('b=AS:') === 0) {
      // use formula from JSEP to convert b=AS to TIAS value.
      bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1000 * 0.95
          - (50 * 40 * 8);
    } else {
      bandwidth = undefined;
    }
    encodingParameters.forEach(function(params) {
      params.maxBitrate = bandwidth;
    });
  }
  return encodingParameters;
};

// parses http://draft.ortc.org/#rtcrtcpparameters*
SDPUtils.parseRtcpParameters = function(mediaSection) {
  var rtcpParameters = {};

  var cname;
  // Gets the first SSRC. Note that with RTX there might be multiple
  // SSRCs.
  var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
      .map(function(line) {
        return SDPUtils.parseSsrcMedia(line);
      })
      .filter(function(obj) {
        return obj.attribute === 'cname';
      })[0];
  if (remoteSsrc) {
    rtcpParameters.cname = remoteSsrc.value;
    rtcpParameters.ssrc = remoteSsrc.ssrc;
  }

  // Edge uses the compound attribute instead of reducedSize
  // compound is !reducedSize
  var rsize = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-rsize');
  rtcpParameters.reducedSize = rsize.length > 0;
  rtcpParameters.compound = rsize.length === 0;

  // parses the rtcp-mux attrіbute.
  // Note that Edge does not support unmuxed RTCP.
  var mux = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-mux');
  rtcpParameters.mux = mux.length > 0;

  return rtcpParameters;
};

// parses either a=msid: or a=ssrc:... msid lines and returns
// the id of the MediaStream and MediaStreamTrack.
SDPUtils.parseMsid = function(mediaSection) {
  var parts;
  var spec = SDPUtils.matchPrefix(mediaSection, 'a=msid:');
  if (spec.length === 1) {
    parts = spec[0].substr(7).split(' ');
    return {stream: parts[0], track: parts[1]};
  }
  var planB = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(parts) {
    return parts.attribute === 'msid';
  });
  if (planB.length > 0) {
    parts = planB[0].value.split(' ');
    return {stream: parts[0], track: parts[1]};
  }
};

// Generate a session ID for SDP.
// https://tools.ietf.org/html/draft-ietf-rtcweb-jsep-20#section-5.2.1
// recommends using a cryptographically random +ve 64-bit value
// but right now this should be acceptable and within the right range
SDPUtils.generateSessionId = function() {
  return Math.random().toString().substr(2, 21);
};

// Write boilder plate for start of SDP
// sessId argument is optional - if not supplied it will
// be generated randomly
// sessVersion is optional and defaults to 2
SDPUtils.writeSessionBoilerplate = function(sessId, sessVer) {
  var sessionId;
  var version = sessVer !== undefined ? sessVer : 2;
  if (sessId) {
    sessionId = sessId;
  } else {
    sessionId = SDPUtils.generateSessionId();
  }
  // FIXME: sess-id should be an NTP timestamp.
  return 'v=0\r\n' +
      'o=thisisadapterortc ' + sessionId + ' ' + version + ' IN IP4 127.0.0.1\r\n' +
      's=-\r\n' +
      't=0 0\r\n';
};

SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.direction) {
    sdp += 'a=' + transceiver.direction + '\r\n';
  } else if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    // spec.
    var msid = 'msid:' + stream.id + ' ' +
        transceiver.rtpSender.track.id + '\r\n';
    sdp += 'a=' + msid;

    // for Chrome.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
};

// Gets the direction from the mediaSection or the sessionpart.
SDPUtils.getDirection = function(mediaSection, sessionpart) {
  // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
  var lines = SDPUtils.splitLines(mediaSection);
  for (var i = 0; i < lines.length; i++) {
    switch (lines[i]) {
      case 'a=sendrecv':
      case 'a=sendonly':
      case 'a=recvonly':
      case 'a=inactive':
        return lines[i].substr(2);
      default:
        // FIXME: What should happen here?
    }
  }
  if (sessionpart) {
    return SDPUtils.getDirection(sessionpart);
  }
  return 'sendrecv';
};

SDPUtils.getKind = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  return mline[0].substr(2);
};

SDPUtils.isRejected = function(mediaSection) {
  return mediaSection.split(' ', 2)[1] === '0';
};

SDPUtils.parseMLine = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var parts = lines[0].substr(2).split(' ');
  return {
    kind: parts[0],
    port: parseInt(parts[1], 10),
    protocol: parts[2],
    fmt: parts.slice(3).join(' ')
  };
};

SDPUtils.parseOLine = function(mediaSection) {
  var line = SDPUtils.matchPrefix(mediaSection, 'o=')[0];
  var parts = line.substr(2).split(' ');
  return {
    username: parts[0],
    sessionId: parts[1],
    sessionVersion: parseInt(parts[2], 10),
    netType: parts[3],
    addressType: parts[4],
    address: parts[5],
  };
}

// Expose public methods.
if (true) {
  module.exports = SDPUtils;
}


/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var mj = __webpack_require__(/*! minijanus */ "./node_modules/minijanus/minijanus.js");
var sdpUtils = __webpack_require__(/*! sdp */ "./node_modules/sdp/sdp.js");
var debug = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("naf-janus-adapter:debug");
var warn = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("naf-janus-adapter:warn");
var error = __webpack_require__(/*! debug */ "./node_modules/debug/src/browser.js")("naf-janus-adapter:error");
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

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

function untilDataChannelOpen(dataChannel) {
  return new Promise((resolve, reject) => {
    if (dataChannel.readyState === "open") {
      resolve();
    } else {
      let resolver, rejector;

      const clear = () => {
        dataChannel.removeEventListener("open", resolver);
        dataChannel.removeEventListener("error", rejector);
      };

      resolver = () => {
        clear();
        resolve();
      };
      rejector = () => {
        clear();
        reject();
      };

      dataChannel.addEventListener("open", resolver);
      dataChannel.addEventListener("error", rejector);
    }
  });
}

const isH264VideoSupported = (() => {
  const video = document.createElement("video");
  return video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') !== "";
})();

const OPUS_PARAMETERS = {
  // indicates that we want to enable DTX to elide silence packets
  usedtx: 1,
  // indicates that we prefer to receive mono audio (important for voip profile)
  stereo: 0,
  // indicates that we prefer to send mono audio (important for voip profile)
  "sprop-stereo": 0
};

const PEER_CONNECTION_CONFIG = {
  iceServers: [{ urls: "stun:stun1.l.google.com:19302" }, { urls: "stun:stun2.l.google.com:19302" }]
};

const WS_NORMAL_CLOSURE = 1000;

class JanusAdapter {
  constructor() {
    this.room = null;
    // We expect the consumer to set a client id before connecting.
    this.clientId = null;
    this.joinToken = null;

    this.serverUrl = null;
    this.webRtcOptions = {};
    this.ws = null;
    this.session = null;
    this.reliableTransport = "datachannel";
    this.unreliableTransport = "datachannel";

    // In the event the server restarts and all clients lose connection, reconnect with
    // some random jitter added to prevent simultaneous reconnection requests.
    this.initialReconnectionDelay = 1000 * Math.random();
    this.reconnectionDelay = this.initialReconnectionDelay;
    this.reconnectionTimeout = null;
    this.maxReconnectionAttempts = 10;
    this.reconnectionAttempts = 0;

    this.publisher = null;
    this.occupants = {};
    this.leftOccupants = new Set();
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
    this.onData = this.onData.bind(this);
  }

  setServerUrl(url) {
    this.serverUrl = url;
  }

  setApp(app) {}

  setRoom(roomName) {
    this.room = roomName;
  }

  setJoinToken(joinToken) {
    this.joinToken = joinToken;
  }

  setClientId(clientId) {
    this.clientId = clientId;
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
      _this.connectSuccess(_this.clientId);

      for (let i = 0; i < _this.publisher.initialOccupants.length; i++) {
        yield _this.addOccupant(_this.publisher.initialOccupants[i]);
      }
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

      if (!subscriber) return;

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
    this.leftOccupants.add(occupantId);

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
      var offer = conn.createOffer().then(this.configurePublisherSdp);
      var local = offer.then(o => conn.setLocalDescription(o));
      var remote = offer;

      if (isSafari && iOS) {
        // On Safari, WebRTC negotiation fails easily if we do not pause before sending
        // a new offer to Janus here.
        remote = remote.then(o => new Promise(r => setTimeout(() => r(o), 5000)));
      }

      remote = remote.then(j => handle.sendJsep(j)).then(r => conn.setRemoteDescription(r.jsep));
      return Promise.all([local, remote]).catch(e => error("Error negotiating offer: %o", e));
    }));
    handle.on("event", debounce(ev => {
      var jsep = ev.jsep;
      if (jsep && jsep.type == "offer") {
        debug("Accepting new offer for handle: %o", handle);
        var answer = conn.setRemoteDescription(this.configureSubscriberSdp(jsep)).then(_ => conn.createAnswer());
        var local = answer.then(a => conn.setLocalDescription(a));
        var remote = answer.then(j => handle.sendJsep(j));
        return Promise.all([local, remote]).catch(e => error("Error negotiating answer: %o", e));
      } else {
        // some other kind of event, nothing to do
        return null;
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

      _this3.associate(conn, handle);

      debug("pub waiting for data channels & webrtcup");
      var webrtcup = new Promise(function (resolve) {
        return handle.on("webrtcup", resolve);
      });

      // Unreliable datachannel: sending and receiving component updates.
      // Reliable datachannel: sending and recieving entity instantiations.
      var reliableChannel = conn.createDataChannel("reliable", { ordered: true });
      var unreliableChannel = conn.createDataChannel("unreliable", {
        ordered: false,
        maxRetransmits: 0
      });

      reliableChannel.addEventListener("message", function (e) {
        return _this3.onDataChannelMessage(e, "janus-reliable");
      });
      unreliableChannel.addEventListener("message", function (e) {
        return _this3.onDataChannelMessage(e, "janus-unreliable");
      });

      yield webrtcup;
      yield untilDataChannelOpen(reliableChannel);
      yield untilDataChannelOpen(unreliableChannel);

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
        } else if (data.event === "data") {
          _this3.onData(JSON.parse(data.body), "janus-event");
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

  configurePublisherSdp(jsep) {
    jsep.sdp = jsep.sdp.replace(/a=fmtp:(109|111).*\r\n/g, (line, pt) => {
      const parameters = Object.assign(sdpUtils.parseFmtp(line), OPUS_PARAMETERS);
      return sdpUtils.writeFmtp({ payloadType: pt, parameters: parameters });
    });
    return jsep;
  }

  configureSubscriberSdp(jsep) {
    // todo: consider cleaning up these hacks to use sdputils
    if (!isH264VideoSupported) {
      if (navigator.userAgent.indexOf("HeadlessChrome") !== -1) {
        // HeadlessChrome (e.g. puppeteer) doesn't support webrtc video streams, so we remove those lines from the SDP.
        jsep.sdp = jsep.sdp.replace(/m=video[^]*m=/, "m=");
      }
    }

    // TODO: Hack to get video working on Chrome for Android. https://groups.google.com/forum/#!topic/mozilla.dev.media/Ye29vuMTpo8
    if (navigator.userAgent.indexOf("Android") === -1) {
      jsep.sdp = jsep.sdp.replace("a=rtcp-fb:107 goog-remb\r\n", "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\n");
    } else {
      jsep.sdp = jsep.sdp.replace("a=rtcp-fb:107 goog-remb\r\n", "a=rtcp-fb:107 goog-remb\r\na=rtcp-fb:107 transport-cc\r\na=fmtp:107 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\n");
    }
    return jsep;
  }

  createSubscriber(occupantId) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      if (_this4.leftOccupants.has(occupantId)) {
        console.warn(occupantId + ": cancelled occupant connection, occupant left before subscription negotation.");
        return null;
      }

      var handle = new mj.JanusPluginHandle(_this4.session);
      var conn = new RTCPeerConnection(PEER_CONNECTION_CONFIG);

      debug(occupantId + ": sub waiting for sfu");
      yield handle.attach("janus.plugin.sfu");

      _this4.associate(conn, handle);

      debug(occupantId + ": sub waiting for join");

      if (_this4.leftOccupants.has(occupantId)) {
        conn.close();
        console.warn(occupantId + ": cancelled occupant connection, occupant left after attach");
        return null;
      }

      // Send join message to janus. Don't listen for join/leave messages. Subscribe to the occupant's media.
      // Janus should send us an offer for this occupant's media in response to this.
      const resp = yield _this4.sendJoin(handle, { media: occupantId });

      if (_this4.leftOccupants.has(occupantId)) {
        conn.close();
        console.warn(occupantId + ": cancelled occupant connection, occupant left after join");
        return null;
      }

      debug(occupantId + ": sub waiting for webrtcup");

      yield new Promise(function (resolve) {
        const interval = setInterval(function () {
          if (_this4.leftOccupants.has(occupantId)) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);

        handle.on("webrtcup", function () {
          clearInterval(interval);
          resolve();
        });
      });

      if (_this4.leftOccupants.has(occupantId)) {
        conn.close();
        console.warn(occupantId + ": cancel occupant connection, occupant left during or after webrtcup");
        return null;
      }

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

      debug(occupantId + ": subscriber ready");
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
      user_id: this.clientId,
      subscribe,
      token: this.joinToken
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

  dataForUpdateMultiMessage(networkId, message) {
    for (let i = 0, l = message.data.d.length; i < l; i++) {
      const data = message.data.d[i];

      if (data.networkId === networkId) {
        return data;
      }
    }

    return null;
  }

  flushPendingUpdates() {
    for (const [networkId, message] of this.frozenUpdates) {
      let data;
      let dataType;

      if (message.dataType === "um") {
        data = this.dataForUpdateMultiMessage(networkId, message);
        dataType = "u";
      } else {
        dataType = message.dataType;
        data = message.data;
      }

      // ignore messages relating to users who have disconnected since freezing, their entities will have aleady been removed by NAF
      // note that delete messages have no "owner" so we have to check for that as well
      if (data.owner && !this.occupants[data.owner]) continue;

      this.onOccupantMessage(null, dataType, data, message.source);
    }
    this.frozenUpdates.clear();
  }

  storeMessage(message) {
    if (message.dataType === "um") {
      // UpdateMulti
      for (let i = 0, l = message.data.d.length; i < l; i++) {
        this.storeSingleMessage(message, i);
      }
    } else {
      this.storeSingleMessage(message);
    }
  }

  storeSingleMessage(message, index) {
    const data = index !== undefined ? message.data.d[index] : message.data;
    const dataType = message.dataType;
    const source = message.source;

    const networkId = data.networkId;

    if (!this.frozenUpdates.has(networkId)) {
      this.frozenUpdates.set(networkId, message);
    } else {
      const storedMessage = this.frozenUpdates.get(networkId);
      const storedData = storedMessage.dataType === "um" ? this.dataForUpdateMultiMessage(networkId, message) : storedMessage.data;

      // Avoid updating components if the entity data received did not come from the current owner.
      const isOutdatedMessage = data.lastOwnerTime < storedData.lastOwnerTime;
      const isContemporaneousMessage = data.lastOwnerTime === storedData.lastOwnerTime;
      if (isOutdatedMessage || isContemporaneousMessage && storedData.owner > data.owner) {
        return;
      }

      // Delete messages override any other messages for this entity
      if (dataType === "r") {
        this.frozenUpdates.set(networkId, message);
      } else {
        // merge in component updates
        Object.assign(storedData.components, data.components);
      }
    }
  }

  onDataChannelMessage(e, source) {
    this.onData(JSON.parse(e.data), source);
  }

  onData(message, source) {
    if (debug.enabled) {
      debug(`DC in: ${message}`);
    }

    if (!message.dataType) return;

    message.source = source;

    if (this.frozen) {
      this.storeMessage(message);
    } else {
      this.onOccupantMessage(null, message.dataType, message.data, message.source);
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
    this.setMediaStream(this.clientId, stream);
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
      console.warn("sendData called without a publisher");
    } else {
      switch (this.unreliableTransport) {
        case "websocket":
          this.publisher.handle.sendMessage({ kind: "data", body: JSON.stringify({ dataType, data }), whom: clientId });
          break;
        case "datachannel":
          this.publisher.unreliableChannel.send(JSON.stringify({ clientId, dataType, data }));
          break;
        default:
          this.unreliableTransport(clientId, dataType, data);
          break;
      }
    }
  }

  sendDataGuaranteed(clientId, dataType, data) {
    if (!this.publisher) {
      console.warn("sendDataGuaranteed called without a publisher");
    } else {
      switch (this.reliableTransport) {
        case "websocket":
          this.publisher.handle.sendMessage({ kind: "data", body: JSON.stringify({ dataType, data }), whom: clientId });
          break;
        case "datachannel":
          this.publisher.reliableChannel.send(JSON.stringify({ clientId, dataType, data }));
          break;
        default:
          this.reliableTransport(clientId, dataType, data);
          break;
      }
    }
  }

  broadcastData(dataType, data) {
    if (!this.publisher) {
      console.warn("broadcastData called without a publisher");
    } else {
      switch (this.unreliableTransport) {
        case "websocket":
          this.publisher.handle.sendMessage({ kind: "data", body: JSON.stringify({ dataType, data }) });
          break;
        case "datachannel":
          this.publisher.unreliableChannel.send(JSON.stringify({ dataType, data }));
          break;
        default:
          this.unreliableTransport(undefined, dataType, data);
          break;
      }
    }
  }

  broadcastDataGuaranteed(dataType, data) {
    if (!this.publisher) {
      console.warn("broadcastDataGuaranteed called without a publisher");
    } else {
      switch (this.reliableTransport) {
        case "websocket":
          this.publisher.handle.sendMessage({ kind: "data", body: JSON.stringify({ dataType, data }) });
          break;
        case "datachannel":
          this.publisher.reliableChannel.send(JSON.stringify({ dataType, data }));
          break;
        default:
          this.reliableTransport(undefined, dataType, data);
          break;
      }
    }
  }

  kick(clientId, permsToken) {
    return this.publisher.handle.sendMessage({ kind: "kick", room_id: this.room, user_id: clientId, token: permsToken }).then(() => {
      document.body.dispatchEvent(new CustomEvent("kicked", { detail: { clientId: clientId } }));
    });
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

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2RlYnVnL3NyYy9icm93c2VyLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9kZWJ1Zy9zcmMvZGVidWcuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL21pbmlqYW51cy9taW5pamFudXMuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL21zL2luZGV4LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3NkcC9zZHAuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbIm1qIiwicmVxdWlyZSIsInNkcFV0aWxzIiwiZGVidWciLCJ3YXJuIiwiZXJyb3IiLCJpc1NhZmFyaSIsInRlc3QiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJpT1MiLCJ3aW5kb3ciLCJNU1N0cmVhbSIsImRlYm91bmNlIiwiZm4iLCJjdXJyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJhcmdzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJzbGljZSIsImNhbGwiLCJhcmd1bWVudHMiLCJ0aGVuIiwiXyIsImFwcGx5IiwicmFuZG9tVWludCIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJ1bnRpbERhdGFDaGFubmVsT3BlbiIsImRhdGFDaGFubmVsIiwicmVqZWN0IiwicmVhZHlTdGF0ZSIsInJlc29sdmVyIiwicmVqZWN0b3IiLCJjbGVhciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJhZGRFdmVudExpc3RlbmVyIiwiaXNIMjY0VmlkZW9TdXBwb3J0ZWQiLCJ2aWRlbyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNhblBsYXlUeXBlIiwiT1BVU19QQVJBTUVURVJTIiwidXNlZHR4Iiwic3RlcmVvIiwiUEVFUl9DT05ORUNUSU9OX0NPTkZJRyIsImljZVNlcnZlcnMiLCJ1cmxzIiwiV1NfTk9STUFMX0NMT1NVUkUiLCJKYW51c0FkYXB0ZXIiLCJjb25zdHJ1Y3RvciIsInJvb20iLCJjbGllbnRJZCIsImpvaW5Ub2tlbiIsInNlcnZlclVybCIsIndlYlJ0Y09wdGlvbnMiLCJ3cyIsInNlc3Npb24iLCJyZWxpYWJsZVRyYW5zcG9ydCIsInVucmVsaWFibGVUcmFuc3BvcnQiLCJpbml0aWFsUmVjb25uZWN0aW9uRGVsYXkiLCJyZWNvbm5lY3Rpb25EZWxheSIsInJlY29ubmVjdGlvblRpbWVvdXQiLCJtYXhSZWNvbm5lY3Rpb25BdHRlbXB0cyIsInJlY29ubmVjdGlvbkF0dGVtcHRzIiwicHVibGlzaGVyIiwib2NjdXBhbnRzIiwibGVmdE9jY3VwYW50cyIsIlNldCIsIm1lZGlhU3RyZWFtcyIsImxvY2FsTWVkaWFTdHJlYW0iLCJwZW5kaW5nTWVkaWFSZXF1ZXN0cyIsIk1hcCIsImZyb3plblVwZGF0ZXMiLCJ0aW1lT2Zmc2V0cyIsInNlcnZlclRpbWVSZXF1ZXN0cyIsImF2Z1RpbWVPZmZzZXQiLCJvbldlYnNvY2tldE9wZW4iLCJiaW5kIiwib25XZWJzb2NrZXRDbG9zZSIsIm9uV2Vic29ja2V0TWVzc2FnZSIsIm9uRGF0YUNoYW5uZWxNZXNzYWdlIiwib25EYXRhIiwic2V0U2VydmVyVXJsIiwidXJsIiwic2V0QXBwIiwiYXBwIiwic2V0Um9vbSIsInJvb21OYW1lIiwic2V0Sm9pblRva2VuIiwic2V0Q2xpZW50SWQiLCJzZXRXZWJSdGNPcHRpb25zIiwib3B0aW9ucyIsInNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMiLCJzdWNjZXNzTGlzdGVuZXIiLCJmYWlsdXJlTGlzdGVuZXIiLCJjb25uZWN0U3VjY2VzcyIsImNvbm5lY3RGYWlsdXJlIiwic2V0Um9vbU9jY3VwYW50TGlzdGVuZXIiLCJvY2N1cGFudExpc3RlbmVyIiwib25PY2N1cGFudHNDaGFuZ2VkIiwic2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMiLCJvcGVuTGlzdGVuZXIiLCJjbG9zZWRMaXN0ZW5lciIsIm1lc3NhZ2VMaXN0ZW5lciIsIm9uT2NjdXBhbnRDb25uZWN0ZWQiLCJvbk9jY3VwYW50RGlzY29ubmVjdGVkIiwib25PY2N1cGFudE1lc3NhZ2UiLCJzZXRSZWNvbm5lY3Rpb25MaXN0ZW5lcnMiLCJyZWNvbm5lY3RpbmdMaXN0ZW5lciIsInJlY29ubmVjdGVkTGlzdGVuZXIiLCJyZWNvbm5lY3Rpb25FcnJvckxpc3RlbmVyIiwib25SZWNvbm5lY3RpbmciLCJvblJlY29ubmVjdGVkIiwib25SZWNvbm5lY3Rpb25FcnJvciIsImNvbm5lY3QiLCJ3ZWJzb2NrZXRDb25uZWN0aW9uIiwiV2ViU29ja2V0IiwiSmFudXNTZXNzaW9uIiwic2VuZCIsIm9uT3BlbiIsIm9uRXJyb3IiLCJjYXRjaCIsImFsbCIsInVwZGF0ZVRpbWVPZmZzZXQiLCJkaXNjb25uZWN0IiwiY2xlYXJUaW1lb3V0IiwicmVtb3ZlQWxsT2NjdXBhbnRzIiwiY29ubiIsImNsb3NlIiwiZGlzcG9zZSIsImlzRGlzY29ubmVjdGVkIiwiY3JlYXRlIiwiY3JlYXRlUHVibGlzaGVyIiwiaSIsImluaXRpYWxPY2N1cGFudHMiLCJsZW5ndGgiLCJhZGRPY2N1cGFudCIsImV2ZW50IiwiY29kZSIsInNldFRpbWVvdXQiLCJyZWNvbm5lY3QiLCJFcnJvciIsInJlY2VpdmUiLCJKU09OIiwicGFyc2UiLCJkYXRhIiwib2NjdXBhbnRJZCIsInN1YnNjcmliZXIiLCJjcmVhdGVTdWJzY3JpYmVyIiwic2V0TWVkaWFTdHJlYW0iLCJtZWRpYVN0cmVhbSIsIk9iamVjdCIsImdldE93blByb3BlcnR5TmFtZXMiLCJyZW1vdmVPY2N1cGFudCIsImFkZCIsImhhcyIsIm1zZyIsImdldCIsImF1ZGlvIiwiZGVsZXRlIiwiYXNzb2NpYXRlIiwiaGFuZGxlIiwiZXYiLCJzZW5kVHJpY2tsZSIsImNhbmRpZGF0ZSIsImUiLCJvZmZlciIsImNyZWF0ZU9mZmVyIiwiY29uZmlndXJlUHVibGlzaGVyU2RwIiwibG9jYWwiLCJvIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsInJlbW90ZSIsInIiLCJqIiwic2VuZEpzZXAiLCJzZXRSZW1vdGVEZXNjcmlwdGlvbiIsImpzZXAiLCJvbiIsInR5cGUiLCJhbnN3ZXIiLCJjb25maWd1cmVTdWJzY3JpYmVyU2RwIiwiY3JlYXRlQW5zd2VyIiwiYSIsIkphbnVzUGx1Z2luSGFuZGxlIiwiUlRDUGVlckNvbm5lY3Rpb24iLCJhdHRhY2giLCJ3ZWJydGN1cCIsInJlbGlhYmxlQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwib3JkZXJlZCIsInVucmVsaWFibGVDaGFubmVsIiwibWF4UmV0cmFuc21pdHMiLCJnZXRUcmFja3MiLCJmb3JFYWNoIiwiYWRkVHJhY2siLCJ0cmFjayIsInBsdWdpbmRhdGEiLCJyb29tX2lkIiwidXNlcl9pZCIsImJvZHkiLCJkaXNwYXRjaEV2ZW50IiwiQ3VzdG9tRXZlbnQiLCJkZXRhaWwiLCJieSIsIm1lc3NhZ2UiLCJzZW5kSm9pbiIsIm5vdGlmaWNhdGlvbnMiLCJzdWNjZXNzIiwiZXJyIiwiY29uc29sZSIsInJlc3BvbnNlIiwidXNlcnMiLCJzZHAiLCJyZXBsYWNlIiwibGluZSIsInB0IiwicGFyYW1ldGVycyIsImFzc2lnbiIsInBhcnNlRm10cCIsIndyaXRlRm10cCIsInBheWxvYWRUeXBlIiwiaW5kZXhPZiIsInJlc3AiLCJtZWRpYSIsImludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJjbGVhckludGVydmFsIiwiTWVkaWFTdHJlYW0iLCJyZWNlaXZlcnMiLCJnZXRSZWNlaXZlcnMiLCJyZWNlaXZlciIsInN1YnNjcmliZSIsInNlbmRNZXNzYWdlIiwia2luZCIsInRva2VuIiwidG9nZ2xlRnJlZXplIiwiZnJvemVuIiwidW5mcmVlemUiLCJmcmVlemUiLCJmbHVzaFBlbmRpbmdVcGRhdGVzIiwiZGF0YUZvclVwZGF0ZU11bHRpTWVzc2FnZSIsIm5ldHdvcmtJZCIsImwiLCJkIiwiZGF0YVR5cGUiLCJvd25lciIsInNvdXJjZSIsInN0b3JlTWVzc2FnZSIsInN0b3JlU2luZ2xlTWVzc2FnZSIsImluZGV4IiwidW5kZWZpbmVkIiwic2V0Iiwic3RvcmVkTWVzc2FnZSIsInN0b3JlZERhdGEiLCJpc091dGRhdGVkTWVzc2FnZSIsImxhc3RPd25lclRpbWUiLCJpc0NvbnRlbXBvcmFuZW91c01lc3NhZ2UiLCJjb21wb25lbnRzIiwiZW5hYmxlZCIsInNob3VsZFN0YXJ0Q29ubmVjdGlvblRvIiwiY2xpZW50Iiwic3RhcnRTdHJlYW1Db25uZWN0aW9uIiwiY2xvc2VTdHJlYW1Db25uZWN0aW9uIiwiZ2V0Q29ubmVjdFN0YXR1cyIsIk5BRiIsImFkYXB0ZXJzIiwiSVNfQ09OTkVDVEVEIiwiTk9UX0NPTk5FQ1RFRCIsImNsaWVudFNlbnRUaW1lIiwiRGF0ZSIsIm5vdyIsInJlcyIsImZldGNoIiwibG9jYXRpb24iLCJocmVmIiwibWV0aG9kIiwiY2FjaGUiLCJwcmVjaXNpb24iLCJzZXJ2ZXJSZWNlaXZlZFRpbWUiLCJoZWFkZXJzIiwiZ2V0VGltZSIsImNsaWVudFJlY2VpdmVkVGltZSIsInNlcnZlclRpbWUiLCJ0aW1lT2Zmc2V0IiwicHVzaCIsInJlZHVjZSIsImFjYyIsIm9mZnNldCIsImdldFNlcnZlclRpbWUiLCJnZXRNZWRpYVN0cmVhbSIsImF1ZGlvUHJvbWlzZSIsInZpZGVvUHJvbWlzZSIsInByb21pc2UiLCJzdHJlYW0iLCJhdWRpb1N0cmVhbSIsImdldEF1ZGlvVHJhY2tzIiwidmlkZW9TdHJlYW0iLCJnZXRWaWRlb1RyYWNrcyIsInNldExvY2FsTWVkaWFTdHJlYW0iLCJleGlzdGluZ1NlbmRlcnMiLCJnZXRTZW5kZXJzIiwibmV3U2VuZGVycyIsInQiLCJzZW5kZXIiLCJmaW5kIiwicyIsInJlcGxhY2VUcmFjayIsInJlbW92ZVRyYWNrIiwiaW5jbHVkZXMiLCJlbmFibGVNaWNyb3Bob25lIiwic2VuZERhdGEiLCJzdHJpbmdpZnkiLCJ3aG9tIiwic2VuZERhdGFHdWFyYW50ZWVkIiwiYnJvYWRjYXN0RGF0YSIsImJyb2FkY2FzdERhdGFHdWFyYW50ZWVkIiwia2ljayIsInBlcm1zVG9rZW4iLCJibG9jayIsInVuYmxvY2siLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGtEQUEwQyxnQ0FBZ0M7QUFDMUU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxnRUFBd0Qsa0JBQWtCO0FBQzFFO0FBQ0EseURBQWlELGNBQWM7QUFDL0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlEQUF5QyxpQ0FBaUM7QUFDMUUsd0hBQWdILG1CQUFtQixFQUFFO0FBQ3JJO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7OztBQUdBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQixZQUFZO0FBQ1o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3ZKQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLHNCQUFzQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEscUNBQXFDOztBQUVyQztBQUNBO0FBQ0E7O0FBRUEsMkJBQTJCO0FBQzNCO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QixVQUFVOzs7Ozs7Ozs7Ozs7O0FDdkx0QztBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsaUJBQWlCLGtCQUFrQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQjtBQUNwQiwwQkFBMEI7QUFDMUI7QUFDQTtBQUNBO0FBQ0EseURBQXlEO0FBQ3pELGlCQUFpQixrQkFBa0I7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLEtBQUs7QUFDTCxpREFBaUQ7QUFDakQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixrQkFBa0IsT0FBTztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNENBQTRDO0FBQzVDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBLEdBQUc7QUFDSDtBQUNBLEdBQUc7QUFDSDtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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NUI7QUFDRCxLQUZNLENBQVA7QUFHRDtBQXowQmdCOztBQTQwQm5Cc04sSUFBSUMsUUFBSixDQUFhdUQsUUFBYixDQUFzQixPQUF0QixFQUErQmpSLFlBQS9COztBQUVBa1IsT0FBT0MsT0FBUCxHQUFpQm5SLFlBQWpCLEMiLCJmaWxlIjoibmFmLWphbnVzLWFkYXB0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3NyYy9pbmRleC5qc1wiKTtcbiIsIi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZVxuICAgICAgICAgICAgICAgJiYgJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZS5zdG9yYWdlXG4gICAgICAgICAgICAgICAgICA/IGNocm9tZS5zdG9yYWdlLmxvY2FsXG4gICAgICAgICAgICAgICAgICA6IGxvY2Fsc3RvcmFnZSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJyMwMDAwQ0MnLCAnIzAwMDBGRicsICcjMDAzM0NDJywgJyMwMDMzRkYnLCAnIzAwNjZDQycsICcjMDA2NkZGJywgJyMwMDk5Q0MnLFxuICAnIzAwOTlGRicsICcjMDBDQzAwJywgJyMwMENDMzMnLCAnIzAwQ0M2NicsICcjMDBDQzk5JywgJyMwMENDQ0MnLCAnIzAwQ0NGRicsXG4gICcjMzMwMENDJywgJyMzMzAwRkYnLCAnIzMzMzNDQycsICcjMzMzM0ZGJywgJyMzMzY2Q0MnLCAnIzMzNjZGRicsICcjMzM5OUNDJyxcbiAgJyMzMzk5RkYnLCAnIzMzQ0MwMCcsICcjMzNDQzMzJywgJyMzM0NDNjYnLCAnIzMzQ0M5OScsICcjMzNDQ0NDJywgJyMzM0NDRkYnLFxuICAnIzY2MDBDQycsICcjNjYwMEZGJywgJyM2NjMzQ0MnLCAnIzY2MzNGRicsICcjNjZDQzAwJywgJyM2NkNDMzMnLCAnIzk5MDBDQycsXG4gICcjOTkwMEZGJywgJyM5OTMzQ0MnLCAnIzk5MzNGRicsICcjOTlDQzAwJywgJyM5OUNDMzMnLCAnI0NDMDAwMCcsICcjQ0MwMDMzJyxcbiAgJyNDQzAwNjYnLCAnI0NDMDA5OScsICcjQ0MwMENDJywgJyNDQzAwRkYnLCAnI0NDMzMwMCcsICcjQ0MzMzMzJywgJyNDQzMzNjYnLFxuICAnI0NDMzM5OScsICcjQ0MzM0NDJywgJyNDQzMzRkYnLCAnI0NDNjYwMCcsICcjQ0M2NjMzJywgJyNDQzk5MDAnLCAnI0NDOTkzMycsXG4gICcjQ0NDQzAwJywgJyNDQ0NDMzMnLCAnI0ZGMDAwMCcsICcjRkYwMDMzJywgJyNGRjAwNjYnLCAnI0ZGMDA5OScsICcjRkYwMENDJyxcbiAgJyNGRjAwRkYnLCAnI0ZGMzMwMCcsICcjRkYzMzMzJywgJyNGRjMzNjYnLCAnI0ZGMzM5OScsICcjRkYzM0NDJywgJyNGRjMzRkYnLFxuICAnI0ZGNjYwMCcsICcjRkY2NjMzJywgJyNGRjk5MDAnLCAnI0ZGOTkzMycsICcjRkZDQzAwJywgJyNGRkNDMzMnXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gTkI6IEluIGFuIEVsZWN0cm9uIHByZWxvYWQgc2NyaXB0LCBkb2N1bWVudCB3aWxsIGJlIGRlZmluZWQgYnV0IG5vdCBmdWxseVxuICAvLyBpbml0aWFsaXplZC4gU2luY2Ugd2Uga25vdyB3ZSdyZSBpbiBDaHJvbWUsIHdlJ2xsIGp1c3QgZGV0ZWN0IHRoaXMgY2FzZVxuICAvLyBleHBsaWNpdGx5XG4gIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvY2VzcyAmJiB3aW5kb3cucHJvY2Vzcy50eXBlID09PSAncmVuZGVyZXInKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBJbnRlcm5ldCBFeHBsb3JlciBhbmQgRWRnZSBkbyBub3Qgc3VwcG9ydCBjb2xvcnMuXG4gIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvKGVkZ2V8dHJpZGVudClcXC8oXFxkKykvKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGlzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG4gIC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG4gIHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5XZWJraXRBcHBlYXJhbmNlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLmZpcmVidWcgfHwgKHdpbmRvdy5jb25zb2xlLmV4Y2VwdGlvbiAmJiB3aW5kb3cuY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IudXNlckFnZW50ICYmIG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKSB8fFxuICAgIC8vIGRvdWJsZSBjaGVjayB3ZWJraXQgaW4gdXNlckFnZW50IGp1c3QgaW4gY2FzZSB3ZSBhcmUgaW4gYSB3b3JrZXJcbiAgICAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCAmJiBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2FwcGxld2Via2l0XFwvKFxcZCspLykpO1xufVxuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMuaiA9IGZ1bmN0aW9uKHYpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiAnW1VuZXhwZWN0ZWRKU09OUGFyc2VFcnJvcl06ICcgKyBlcnIubWVzc2FnZTtcbiAgfVxufTtcblxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoYXJncykge1xuICB2YXIgdXNlQ29sb3JzID0gdGhpcy51c2VDb2xvcnM7XG5cbiAgYXJnc1swXSA9ICh1c2VDb2xvcnMgPyAnJWMnIDogJycpXG4gICAgKyB0aGlzLm5hbWVzcGFjZVxuICAgICsgKHVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKVxuICAgICsgYXJnc1swXVxuICAgICsgKHVzZUNvbG9ycyA/ICclYyAnIDogJyAnKVxuICAgICsgJysnICsgZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG4gIGlmICghdXNlQ29sb3JzKSByZXR1cm47XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzLnNwbGljZSgxLCAwLCBjLCAnY29sb3I6IGluaGVyaXQnKVxuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXpBLVolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gdGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgvOSwgd2hlcmVcbiAgLy8gdGhlIGBjb25zb2xlLmxvZ2AgZnVuY3Rpb24gZG9lc24ndCBoYXZlICdhcHBseSdcbiAgcmV0dXJuICdvYmplY3QnID09PSB0eXBlb2YgY29uc29sZVxuICAgICYmIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGV4cG9ydHMuc3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBleHBvcnRzLnN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cblxuICAvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG4gIGlmICghciAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgJ2VudicgaW4gcHJvY2Vzcykge1xuICAgIHIgPSBwcm9jZXNzLmVudi5ERUJVRztcbiAgfVxuXG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcblxuLyoqXG4gKiBMb2NhbHN0b3JhZ2UgYXR0ZW1wdHMgdG8gcmV0dXJuIHRoZSBsb2NhbHN0b3JhZ2UuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzYWZhcmkgdGhyb3dzXG4gKiB3aGVuIGEgdXNlciBkaXNhYmxlcyBjb29raWVzL2xvY2Fsc3RvcmFnZVxuICogYW5kIHlvdSBhdHRlbXB0IHRvIGFjY2VzcyBpdC5cbiAqXG4gKiBAcmV0dXJuIHtMb2NhbFN0b3JhZ2V9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2NhbHN0b3JhZ2UoKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2U7XG4gIH0gY2F0Y2ggKGUpIHt9XG59XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gY3JlYXRlRGVidWcuZGVidWcgPSBjcmVhdGVEZWJ1Z1snZGVmYXVsdCddID0gY3JlYXRlRGVidWc7XG5leHBvcnRzLmNvZXJjZSA9IGNvZXJjZTtcbmV4cG9ydHMuZGlzYWJsZSA9IGRpc2FibGU7XG5leHBvcnRzLmVuYWJsZSA9IGVuYWJsZTtcbmV4cG9ydHMuZW5hYmxlZCA9IGVuYWJsZWQ7XG5leHBvcnRzLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblxuLyoqXG4gKiBBY3RpdmUgYGRlYnVnYCBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydHMuaW5zdGFuY2VzID0gW107XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlciBvciB1cHBlci1jYXNlIGxldHRlciwgaS5lLiBcIm5cIiBhbmQgXCJOXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogU2VsZWN0IGEgY29sb3IuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcihuYW1lc3BhY2UpIHtcbiAgdmFyIGhhc2ggPSAwLCBpO1xuXG4gIGZvciAoaSBpbiBuYW1lc3BhY2UpIHtcbiAgICBoYXNoICA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpICsgbmFtZXNwYWNlLmNoYXJDb2RlQXQoaSk7XG4gICAgaGFzaCB8PSAwOyAvLyBDb252ZXJ0IHRvIDMyYml0IGludGVnZXJcbiAgfVxuXG4gIHJldHVybiBleHBvcnRzLmNvbG9yc1tNYXRoLmFicyhoYXNoKSAlIGV4cG9ydHMuY29sb3JzLmxlbmd0aF07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGNyZWF0ZURlYnVnKG5hbWVzcGFjZSkge1xuXG4gIHZhciBwcmV2VGltZTtcblxuICBmdW5jdGlvbiBkZWJ1ZygpIHtcbiAgICAvLyBkaXNhYmxlZD9cbiAgICBpZiAoIWRlYnVnLmVuYWJsZWQpIHJldHVybjtcblxuICAgIHZhciBzZWxmID0gZGVidWc7XG5cbiAgICAvLyBzZXQgYGRpZmZgIHRpbWVzdGFtcFxuICAgIHZhciBjdXJyID0gK25ldyBEYXRlKCk7XG4gICAgdmFyIG1zID0gY3VyciAtIChwcmV2VGltZSB8fCBjdXJyKTtcbiAgICBzZWxmLmRpZmYgPSBtcztcbiAgICBzZWxmLnByZXYgPSBwcmV2VGltZTtcbiAgICBzZWxmLmN1cnIgPSBjdXJyO1xuICAgIHByZXZUaW1lID0gY3VycjtcblxuICAgIC8vIHR1cm4gdGhlIGBhcmd1bWVudHNgIGludG8gYSBwcm9wZXIgQXJyYXlcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJU9cbiAgICAgIGFyZ3MudW5zaGlmdCgnJU8nKTtcbiAgICB9XG5cbiAgICAvLyBhcHBseSBhbnkgYGZvcm1hdHRlcnNgIHRyYW5zZm9ybWF0aW9uc1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgYXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16QS1aJV0pL2csIGZ1bmN0aW9uKG1hdGNoLCBmb3JtYXQpIHtcbiAgICAgIC8vIGlmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcbiAgICAgIGlmIChtYXRjaCA9PT0gJyUlJykgcmV0dXJuIG1hdGNoO1xuICAgICAgaW5kZXgrKztcbiAgICAgIHZhciBmb3JtYXR0ZXIgPSBleHBvcnRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcbiAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm9ybWF0dGVyKSB7XG4gICAgICAgIHZhciB2YWwgPSBhcmdzW2luZGV4XTtcbiAgICAgICAgbWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xuXG4gICAgICAgIC8vIG5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcbiAgICAgICAgYXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpbmRleC0tO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuXG4gICAgLy8gYXBwbHkgZW52LXNwZWNpZmljIGZvcm1hdHRpbmcgKGNvbG9ycywgZXRjLilcbiAgICBleHBvcnRzLmZvcm1hdEFyZ3MuY2FsbChzZWxmLCBhcmdzKTtcblxuICAgIHZhciBsb2dGbiA9IGRlYnVnLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG5cbiAgZGVidWcubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICBkZWJ1Zy5lbmFibGVkID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSk7XG4gIGRlYnVnLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gIGRlYnVnLmNvbG9yID0gc2VsZWN0Q29sb3IobmFtZXNwYWNlKTtcbiAgZGVidWcuZGVzdHJveSA9IGRlc3Ryb3k7XG5cbiAgLy8gZW52LXNwZWNpZmljIGluaXRpYWxpemF0aW9uIGxvZ2ljIGZvciBkZWJ1ZyBpbnN0YW5jZXNcbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBleHBvcnRzLmluaXQpIHtcbiAgICBleHBvcnRzLmluaXQoZGVidWcpO1xuICB9XG5cbiAgZXhwb3J0cy5pbnN0YW5jZXMucHVzaChkZWJ1Zyk7XG5cbiAgcmV0dXJuIGRlYnVnO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95ICgpIHtcbiAgdmFyIGluZGV4ID0gZXhwb3J0cy5pbnN0YW5jZXMuaW5kZXhPZih0aGlzKTtcbiAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgIGV4cG9ydHMuaW5zdGFuY2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgZXhwb3J0cy5uYW1lcyA9IFtdO1xuICBleHBvcnRzLnNraXBzID0gW107XG5cbiAgdmFyIGk7XG4gIHZhciBzcGxpdCA9ICh0eXBlb2YgbmFtZXNwYWNlcyA9PT0gJ3N0cmluZycgPyBuYW1lc3BhY2VzIDogJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoaSA9IDA7IGkgPCBleHBvcnRzLmluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpbnN0YW5jZSA9IGV4cG9ydHMuaW5zdGFuY2VzW2ldO1xuICAgIGluc3RhbmNlLmVuYWJsZWQgPSBleHBvcnRzLmVuYWJsZWQoaW5zdGFuY2UubmFtZXNwYWNlKTtcbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIGlmIChuYW1lW25hbWUubGVuZ3RoIC0gMV0gPT09ICcqJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIvKipcbiAqIFJlcHJlc2VudHMgYSBoYW5kbGUgdG8gYSBzaW5nbGUgSmFudXMgcGx1Z2luIG9uIGEgSmFudXMgc2Vzc2lvbi4gRWFjaCBXZWJSVEMgY29ubmVjdGlvbiB0byB0aGUgSmFudXMgc2VydmVyIHdpbGwgYmVcbiAqIGFzc29jaWF0ZWQgd2l0aCBhIHNpbmdsZSBoYW5kbGUuIE9uY2UgYXR0YWNoZWQgdG8gdGhlIHNlcnZlciwgdGhpcyBoYW5kbGUgd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmVcbiAqIHVzZWQgdG8gYXNzb2NpYXRlIGl0IHdpdGggZnV0dXJlIHNpZ25hbGxpbmcgbWVzc2FnZXMuXG4gKlxuICogU2VlIGh0dHBzOi8vamFudXMuY29uZi5tZWV0ZWNoby5jb20vZG9jcy9yZXN0Lmh0bWwjaGFuZGxlcy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzUGx1Z2luSGFuZGxlKHNlc3Npb24pIHtcbiAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcbiAgdGhpcy5pZCA9IHVuZGVmaW5lZDtcbn1cblxuLyoqIEF0dGFjaGVzIHRoaXMgaGFuZGxlIHRvIHRoZSBKYW51cyBzZXJ2ZXIgYW5kIHNldHMgaXRzIElELiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbihwbHVnaW4pIHtcbiAgdmFyIHBheWxvYWQgPSB7IHBsdWdpbjogcGx1Z2luLCBcImZvcmNlLWJ1bmRsZVwiOiB0cnVlLCBcImZvcmNlLXJ0Y3AtbXV4XCI6IHRydWUgfTtcbiAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5zZW5kKFwiYXR0YWNoXCIsIHBheWxvYWQpLnRoZW4ocmVzcCA9PiB7XG4gICAgdGhpcy5pZCA9IHJlc3AuZGF0YS5pZDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfSk7XG59O1xuXG4vKiogRGV0YWNoZXMgdGhpcyBoYW5kbGUuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLmRldGFjaCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwiZGV0YWNoXCIpO1xufTtcblxuLyoqIFJlZ2lzdGVycyBhIGNhbGxiYWNrIHRvIGJlIGZpcmVkIHVwb24gdGhlIHJlY2VwdGlvbiBvZiBhbnkgaW5jb21pbmcgSmFudXMgc2lnbmFscyBmb3IgdGhpcyBwbHVnaW4gaGFuZGxlIHdpdGggdGhlXG4gKiBgamFudXNgIGF0dHJpYnV0ZSBlcXVhbCB0byBgZXZgLlxuICoqL1xuSmFudXNQbHVnaW5IYW5kbGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXYsIGNhbGxiYWNrKSB7XG4gIHJldHVybiB0aGlzLnNlc3Npb24ub24oZXYsIHNpZ25hbCA9PiB7XG4gICAgaWYgKHNpZ25hbC5zZW5kZXIgPT0gdGhpcy5pZCkge1xuICAgICAgY2FsbGJhY2soc2lnbmFsKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBTZW5kcyBhIHNpZ25hbCBhc3NvY2lhdGVkIHdpdGggdGhpcyBoYW5kbGUuIFNpZ25hbHMgc2hvdWxkIGJlIEpTT04tc2VyaWFsaXphYmxlIG9iamVjdHMuIFJldHVybnMgYSBwcm9taXNlIHRoYXQgd2lsbFxuICogYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgd2hlbiBhIHJlc3BvbnNlIHRvIHRoaXMgc2lnbmFsIGlzIHJlY2VpdmVkLCBvciB3aGVuIG5vIHJlc3BvbnNlIGlzIHJlY2VpdmVkIHdpdGhpbiB0aGVcbiAqIHNlc3Npb24gdGltZW91dC5cbiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24odHlwZSwgc2lnbmFsKSB7XG4gIHJldHVybiB0aGlzLnNlc3Npb24uc2VuZCh0eXBlLCBPYmplY3QuYXNzaWduKHsgaGFuZGxlX2lkOiB0aGlzLmlkIH0sIHNpZ25hbCkpO1xufTtcblxuLyoqIFNlbmRzIGEgcGx1Z2luLXNwZWNpZmljIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcIm1lc3NhZ2VcIiwgeyBib2R5OiBib2R5IH0pO1xufTtcblxuLyoqIFNlbmRzIGEgSlNFUCBvZmZlciBvciBhbnN3ZXIgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kSnNlcCA9IGZ1bmN0aW9uKGpzZXApIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcIm1lc3NhZ2VcIiwgeyBib2R5OiB7fSwganNlcDoganNlcCB9KTtcbn07XG5cbi8qKiBTZW5kcyBhbiBJQ0UgdHJpY2tsZSBjYW5kaWRhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaGFuZGxlLiAqKi9cbkphbnVzUGx1Z2luSGFuZGxlLnByb3RvdHlwZS5zZW5kVHJpY2tsZSA9IGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwidHJpY2tsZVwiLCB7IGNhbmRpZGF0ZTogY2FuZGlkYXRlIH0pO1xufTtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgSmFudXMgc2Vzc2lvbiAtLSBhIEphbnVzIGNvbnRleHQgZnJvbSB3aXRoaW4gd2hpY2ggeW91IGNhbiBvcGVuIG11bHRpcGxlIGhhbmRsZXMgYW5kIGNvbm5lY3Rpb25zLiBPbmNlXG4gKiBjcmVhdGVkLCB0aGlzIHNlc3Npb24gd2lsbCBiZSBnaXZlbiBhIHVuaXF1ZSBJRCB3aGljaCBzaG91bGQgYmUgdXNlZCB0byBhc3NvY2lhdGUgaXQgd2l0aCBmdXR1cmUgc2lnbmFsbGluZyBtZXNzYWdlcy5cbiAqXG4gKiBTZWUgaHR0cHM6Ly9qYW51cy5jb25mLm1lZXRlY2hvLmNvbS9kb2NzL3Jlc3QuaHRtbCNzZXNzaW9ucy5cbiAqKi9cbmZ1bmN0aW9uIEphbnVzU2Vzc2lvbihvdXRwdXQsIG9wdGlvbnMpIHtcbiAgdGhpcy5vdXRwdXQgPSBvdXRwdXQ7XG4gIHRoaXMuaWQgPSB1bmRlZmluZWQ7XG4gIHRoaXMubmV4dFR4SWQgPSAwO1xuICB0aGlzLnR4bnMgPSB7fTtcbiAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xuICAgIHZlcmJvc2U6IGZhbHNlLFxuICAgIHRpbWVvdXRNczogMTAwMDAsXG4gICAga2VlcGFsaXZlTXM6IDMwMDAwXG4gIH0sIG9wdGlvbnMpO1xufVxuXG4vKiogQ3JlYXRlcyB0aGlzIHNlc3Npb24gb24gdGhlIEphbnVzIHNlcnZlciBhbmQgc2V0cyBpdHMgSUQuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcImNyZWF0ZVwiKS50aGVuKHJlc3AgPT4ge1xuICAgIHRoaXMuaWQgPSByZXNwLmRhdGEuaWQ7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBEZXN0cm95cyB0aGlzIHNlc3Npb24uIE5vdGUgdGhhdCB1cG9uIGRlc3RydWN0aW9uLCBKYW51cyB3aWxsIGFsc28gY2xvc2UgdGhlIHNpZ25hbGxpbmcgdHJhbnNwb3J0IChpZiBhcHBsaWNhYmxlKSBhbmRcbiAqIGFueSBvcGVuIFdlYlJUQyBjb25uZWN0aW9ucy5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5zZW5kKFwiZGVzdHJveVwiKS50aGVuKChyZXNwKSA9PiB7XG4gICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBEaXNwb3NlcyBvZiB0aGlzIHNlc3Npb24gaW4gYSB3YXkgc3VjaCB0aGF0IG5vIGZ1cnRoZXIgaW5jb21pbmcgc2lnbmFsbGluZyBtZXNzYWdlcyB3aWxsIGJlIHByb2Nlc3NlZC5cbiAqIE91dHN0YW5kaW5nIHRyYW5zYWN0aW9ucyB3aWxsIGJlIHJlamVjdGVkLlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2tpbGxLZWVwYWxpdmUoKTtcbiAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gIGZvciAodmFyIHR4SWQgaW4gdGhpcy50eG5zKSB7XG4gICAgaWYgKHRoaXMudHhucy5oYXNPd25Qcm9wZXJ0eSh0eElkKSkge1xuICAgICAgdmFyIHR4biA9IHRoaXMudHhuc1t0eElkXTtcbiAgICAgIGNsZWFyVGltZW91dCh0eG4udGltZW91dCk7XG4gICAgICB0eG4ucmVqZWN0KG5ldyBFcnJvcihcIkphbnVzIHNlc3Npb24gd2FzIGRpc3Bvc2VkLlwiKSk7XG4gICAgICBkZWxldGUgdGhpcy50eG5zW3R4SWRdO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBXaGV0aGVyIHRoaXMgc2lnbmFsIHJlcHJlc2VudHMgYW4gZXJyb3IsIGFuZCB0aGUgYXNzb2NpYXRlZCBwcm9taXNlIChpZiBhbnkpIHNob3VsZCBiZSByZWplY3RlZC5cbiAqIFVzZXJzIHNob3VsZCBvdmVycmlkZSB0aGlzIHRvIGhhbmRsZSBhbnkgY3VzdG9tIHBsdWdpbi1zcGVjaWZpYyBlcnJvciBjb252ZW50aW9ucy5cbiAqKi9cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuaXNFcnJvciA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICByZXR1cm4gc2lnbmFsLmphbnVzID09PSBcImVycm9yXCI7XG59O1xuXG4vKiogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgZmlyZWQgdXBvbiB0aGUgcmVjZXB0aW9uIG9mIGFueSBpbmNvbWluZyBKYW51cyBzaWduYWxzIGZvciB0aGlzIHNlc3Npb24gd2l0aCB0aGVcbiAqIGBqYW51c2AgYXR0cmlidXRlIGVxdWFsIHRvIGBldmAuXG4gKiovXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXYsIGNhbGxiYWNrKSB7XG4gIHZhciBoYW5kbGVycyA9IHRoaXMuZXZlbnRIYW5kbGVyc1tldl07XG4gIGlmIChoYW5kbGVycyA9PSBudWxsKSB7XG4gICAgaGFuZGxlcnMgPSB0aGlzLmV2ZW50SGFuZGxlcnNbZXZdID0gW107XG4gIH1cbiAgaGFuZGxlcnMucHVzaChjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIENhbGxiYWNrIGZvciByZWNlaXZpbmcgSlNPTiBzaWduYWxsaW5nIG1lc3NhZ2VzIHBlcnRpbmVudCB0byB0aGlzIHNlc3Npb24uIElmIHRoZSBzaWduYWxzIGFyZSByZXNwb25zZXMgdG8gcHJldmlvdXNseVxuICogc2VudCBzaWduYWxzLCB0aGUgcHJvbWlzZXMgZm9yIHRoZSBvdXRnb2luZyBzaWduYWxzIHdpbGwgYmUgcmVzb2x2ZWQgb3IgcmVqZWN0ZWQgYXBwcm9wcmlhdGVseSB3aXRoIHRoaXMgc2lnbmFsIGFzIGFuXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBFeHRlcm5hbCBjYWxsZXJzIHNob3VsZCBjYWxsIHRoaXMgZnVuY3Rpb24gZXZlcnkgdGltZSBhIG5ldyBzaWduYWwgYXJyaXZlcyBvbiB0aGUgdHJhbnNwb3J0OyBmb3IgZXhhbXBsZSwgaW4gYVxuICogV2ViU29ja2V0J3MgYG1lc3NhZ2VgIGV2ZW50LCBvciB3aGVuIGEgbmV3IGRhdHVtIHNob3dzIHVwIGluIGFuIEhUVFAgbG9uZy1wb2xsaW5nIHJlc3BvbnNlLlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5yZWNlaXZlID0gZnVuY3Rpb24oc2lnbmFsKSB7XG4gIGlmICh0aGlzLm9wdGlvbnMudmVyYm9zZSkge1xuICAgIHRoaXMuX2xvZ0luY29taW5nKHNpZ25hbCk7XG4gIH1cbiAgaWYgKHNpZ25hbC5zZXNzaW9uX2lkICE9IHRoaXMuaWQpIHtcbiAgICBjb25zb2xlLndhcm4oXCJJbmNvcnJlY3Qgc2Vzc2lvbiBJRCByZWNlaXZlZCBpbiBKYW51cyBzaWduYWxsaW5nIG1lc3NhZ2U6IHdhcyBcIiArIHNpZ25hbC5zZXNzaW9uX2lkICsgXCIsIGV4cGVjdGVkIFwiICsgdGhpcy5pZCArIFwiLlwiKTtcbiAgfVxuXG4gIHZhciByZXNwb25zZVR5cGUgPSBzaWduYWwuamFudXM7XG4gIHZhciBoYW5kbGVycyA9IHRoaXMuZXZlbnRIYW5kbGVyc1tyZXNwb25zZVR5cGVdO1xuICBpZiAoaGFuZGxlcnMgIT0gbnVsbCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhhbmRsZXJzW2ldKHNpZ25hbCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHNpZ25hbC50cmFuc2FjdGlvbiAhPSBudWxsKSB7XG4gICAgdmFyIHR4biA9IHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dO1xuICAgIGlmICh0eG4gPT0gbnVsbCkge1xuICAgICAgLy8gdGhpcyBpcyBhIHJlc3BvbnNlIHRvIGEgdHJhbnNhY3Rpb24gdGhhdCB3YXNuJ3QgY2F1c2VkIHZpYSBKYW51c1Nlc3Npb24uc2VuZCwgb3IgYSBwbHVnaW4gcmVwbGllZCB0d2ljZSB0byBhXG4gICAgICAvLyBzaW5nbGUgcmVxdWVzdCwgb3IgdGhlIHNlc3Npb24gd2FzIGRpc3Bvc2VkLCBvciBzb21ldGhpbmcgZWxzZSB0aGF0IGlzbid0IHVuZGVyIG91ciBwdXJ2aWV3OyB0aGF0J3MgZmluZVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChyZXNwb25zZVR5cGUgPT09IFwiYWNrXCIgJiYgdHhuLnR5cGUgPT0gXCJtZXNzYWdlXCIpIHtcbiAgICAgIC8vIHRoaXMgaXMgYW4gYWNrIG9mIGFuIGFzeW5jaHJvbm91c2x5LXByb2Nlc3NlZCBwbHVnaW4gcmVxdWVzdCwgd2Ugc2hvdWxkIHdhaXQgdG8gcmVzb2x2ZSB0aGUgcHJvbWlzZSB1bnRpbCB0aGVcbiAgICAgIC8vIGFjdHVhbCByZXNwb25zZSBjb21lcyBpblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0eG4udGltZW91dCk7XG5cbiAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgKHRoaXMuaXNFcnJvcihzaWduYWwpID8gdHhuLnJlamVjdCA6IHR4bi5yZXNvbHZlKShzaWduYWwpO1xuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2lnbmFsIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb24sIGJlZ2lubmluZyBhIG5ldyB0cmFuc2FjdGlvbi4gUmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkIG9yXG4gKiByZWplY3RlZCB3aGVuIGEgcmVzcG9uc2UgaXMgcmVjZWl2ZWQgaW4gdGhlIHNhbWUgdHJhbnNhY3Rpb24sIG9yIHdoZW4gbm8gcmVzcG9uc2UgaXMgcmVjZWl2ZWQgd2l0aGluIHRoZSBzZXNzaW9uXG4gKiB0aW1lb3V0LlxuICoqL1xuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24odHlwZSwgc2lnbmFsKSB7XG4gIHNpZ25hbCA9IE9iamVjdC5hc3NpZ24oeyB0cmFuc2FjdGlvbjogKHRoaXMubmV4dFR4SWQrKykudG9TdHJpbmcoKSB9LCBzaWduYWwpO1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLnRpbWVvdXRNcykge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBkZWxldGUgdGhpcy50eG5zW3NpZ25hbC50cmFuc2FjdGlvbl07XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJTaWduYWxsaW5nIHRyYW5zYWN0aW9uIHdpdGggdHhpZCBcIiArIHNpZ25hbC50cmFuc2FjdGlvbiArIFwiIHRpbWVkIG91dC5cIikpO1xuICAgICAgfSwgdGhpcy5vcHRpb25zLnRpbWVvdXRNcyk7XG4gICAgfVxuICAgIHRoaXMudHhuc1tzaWduYWwudHJhbnNhY3Rpb25dID0geyByZXNvbHZlOiByZXNvbHZlLCByZWplY3Q6IHJlamVjdCwgdGltZW91dDogdGltZW91dCwgdHlwZTogdHlwZSB9O1xuICAgIHRoaXMuX3RyYW5zbWl0KHR5cGUsIHNpZ25hbCk7XG4gIH0pO1xufTtcblxuSmFudXNTZXNzaW9uLnByb3RvdHlwZS5fdHJhbnNtaXQgPSBmdW5jdGlvbih0eXBlLCBzaWduYWwpIHtcbiAgc2lnbmFsID0gT2JqZWN0LmFzc2lnbih7IGphbnVzOiB0eXBlIH0sIHNpZ25hbCk7XG5cbiAgaWYgKHRoaXMuaWQgIT0gbnVsbCkgeyAvLyB0aGlzLmlkIGlzIHVuZGVmaW5lZCBpbiB0aGUgc3BlY2lhbCBjYXNlIHdoZW4gd2UncmUgc2VuZGluZyB0aGUgc2Vzc2lvbiBjcmVhdGUgbWVzc2FnZVxuICAgIHNpZ25hbCA9IE9iamVjdC5hc3NpZ24oeyBzZXNzaW9uX2lkOiB0aGlzLmlkIH0sIHNpZ25hbCk7XG4gIH1cblxuICBpZiAodGhpcy5vcHRpb25zLnZlcmJvc2UpIHtcbiAgICB0aGlzLl9sb2dPdXRnb2luZyhzaWduYWwpO1xuICB9XG5cbiAgdGhpcy5vdXRwdXQoSlNPTi5zdHJpbmdpZnkoc2lnbmFsKSk7XG4gIHRoaXMuX3Jlc2V0S2VlcGFsaXZlKCk7XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9sb2dPdXRnb2luZyA9IGZ1bmN0aW9uKHNpZ25hbCkge1xuICB2YXIga2luZCA9IHNpZ25hbC5qYW51cztcbiAgaWYgKGtpbmQgPT09IFwibWVzc2FnZVwiICYmIHNpZ25hbC5qc2VwKSB7XG4gICAga2luZCA9IHNpZ25hbC5qc2VwLnR5cGU7XG4gIH1cbiAgdmFyIG1lc3NhZ2UgPSBcIj4gT3V0Z29pbmcgSmFudXMgXCIgKyAoa2luZCB8fCBcInNpZ25hbFwiKSArIFwiICgjXCIgKyBzaWduYWwudHJhbnNhY3Rpb24gKyBcIik6IFwiO1xuICBjb25zb2xlLmRlYnVnKFwiJWNcIiArIG1lc3NhZ2UsIFwiY29sb3I6ICMwNDBcIiwgc2lnbmFsKTtcbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX2xvZ0luY29taW5nID0gZnVuY3Rpb24oc2lnbmFsKSB7XG4gIHZhciBraW5kID0gc2lnbmFsLmphbnVzO1xuICB2YXIgbWVzc2FnZSA9IHNpZ25hbC50cmFuc2FjdGlvbiA/XG4gICAgICBcIjwgSW5jb21pbmcgSmFudXMgXCIgKyAoa2luZCB8fCBcInNpZ25hbFwiKSArIFwiICgjXCIgKyBzaWduYWwudHJhbnNhY3Rpb24gKyBcIik6IFwiIDpcbiAgICAgIFwiPCBJbmNvbWluZyBKYW51cyBcIiArIChraW5kIHx8IFwic2lnbmFsXCIpICsgXCI6IFwiO1xuICBjb25zb2xlLmRlYnVnKFwiJWNcIiArIG1lc3NhZ2UsIFwiY29sb3I6ICMwMDRcIiwgc2lnbmFsKTtcbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX3NlbmRLZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc2VuZChcImtlZXBhbGl2ZVwiKTtcbn07XG5cbkphbnVzU2Vzc2lvbi5wcm90b3R5cGUuX2tpbGxLZWVwYWxpdmUgPSBmdW5jdGlvbigpIHtcbiAgY2xlYXJUaW1lb3V0KHRoaXMua2VlcGFsaXZlVGltZW91dCk7XG59O1xuXG5KYW51c1Nlc3Npb24ucHJvdG90eXBlLl9yZXNldEtlZXBhbGl2ZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9raWxsS2VlcGFsaXZlKCk7XG4gIGlmICh0aGlzLm9wdGlvbnMua2VlcGFsaXZlTXMpIHtcbiAgICB0aGlzLmtlZXBhbGl2ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX3NlbmRLZWVwYWxpdmUoKS5jYXRjaChlID0+IGNvbnNvbGUuZXJyb3IoXCJFcnJvciByZWNlaXZlZCBmcm9tIGtlZXBhbGl2ZTogXCIsIGUpKTtcbiAgICB9LCB0aGlzLm9wdGlvbnMua2VlcGFsaXZlTXMpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgSmFudXNQbHVnaW5IYW5kbGUsXG4gIEphbnVzU2Vzc2lvblxufTtcbiIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmIGlzTmFOKHZhbCkgPT09IGZhbHNlKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMubG9uZyA/IGZtdExvbmcodmFsKSA6IGZtdFNob3J0KHZhbCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgICd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgK1xuICAgICAgSlNPTi5zdHJpbmdpZnkodmFsKVxuICApO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAoc3RyLmxlbmd0aCA+IDEwMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtaWxsaXNlY29uZHM/fG1zZWNzP3xtc3xzZWNvbmRzP3xzZWNzP3xzfG1pbnV0ZXM/fG1pbnM/fG18aG91cnM/fGhycz98aHxkYXlzP3xkfHllYXJzP3x5cnM/fHkpPyQvaS5leGVjKFxuICAgIHN0clxuICApO1xuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzZWNzJzpcbiAgICBjYXNlICdzZWMnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGZtdFNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgfVxuICBpZiAobXMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIH1cbiAgaWYgKG1zID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICB9XG4gIGlmIChtcyA+PSBzKSB7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JykgfHxcbiAgICBwbHVyYWwobXMsIGgsICdob3VyJykgfHxcbiAgICBwbHVyYWwobXMsIG0sICdtaW51dGUnKSB8fFxuICAgIHBsdXJhbChtcywgcywgJ3NlY29uZCcpIHx8XG4gICAgbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAobXMgPCBuICogMS41KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJztcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIgLyogZXNsaW50LWVudiBub2RlICovXG4ndXNlIHN0cmljdCc7XG5cbi8vIFNEUCBoZWxwZXJzLlxudmFyIFNEUFV0aWxzID0ge307XG5cbi8vIEdlbmVyYXRlIGFuIGFscGhhbnVtZXJpYyBpZGVudGlmaWVyIGZvciBjbmFtZSBvciBtaWRzLlxuLy8gVE9ETzogdXNlIFVVSURzIGluc3RlYWQ/IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2plZC85ODI4ODNcblNEUFV0aWxzLmdlbmVyYXRlSWRlbnRpZmllciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDEwKTtcbn07XG5cbi8vIFRoZSBSVENQIENOQU1FIHVzZWQgYnkgYWxsIHBlZXJjb25uZWN0aW9ucyBmcm9tIHRoZSBzYW1lIEpTLlxuU0RQVXRpbHMubG9jYWxDTmFtZSA9IFNEUFV0aWxzLmdlbmVyYXRlSWRlbnRpZmllcigpO1xuXG4vLyBTcGxpdHMgU0RQIGludG8gbGluZXMsIGRlYWxpbmcgd2l0aCBib3RoIENSTEYgYW5kIExGLlxuU0RQVXRpbHMuc3BsaXRMaW5lcyA9IGZ1bmN0aW9uKGJsb2IpIHtcbiAgcmV0dXJuIGJsb2IudHJpbSgpLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgIHJldHVybiBsaW5lLnRyaW0oKTtcbiAgfSk7XG59O1xuLy8gU3BsaXRzIFNEUCBpbnRvIHNlc3Npb25wYXJ0IGFuZCBtZWRpYXNlY3Rpb25zLiBFbnN1cmVzIENSTEYuXG5TRFBVdGlscy5zcGxpdFNlY3Rpb25zID0gZnVuY3Rpb24oYmxvYikge1xuICB2YXIgcGFydHMgPSBibG9iLnNwbGl0KCdcXG5tPScpO1xuICByZXR1cm4gcGFydHMubWFwKGZ1bmN0aW9uKHBhcnQsIGluZGV4KSB7XG4gICAgcmV0dXJuIChpbmRleCA+IDAgPyAnbT0nICsgcGFydCA6IHBhcnQpLnRyaW0oKSArICdcXHJcXG4nO1xuICB9KTtcbn07XG5cbi8vIHJldHVybnMgdGhlIHNlc3Npb24gZGVzY3JpcHRpb24uXG5TRFBVdGlscy5nZXREZXNjcmlwdGlvbiA9IGZ1bmN0aW9uKGJsb2IpIHtcbiAgdmFyIHNlY3Rpb25zID0gU0RQVXRpbHMuc3BsaXRTZWN0aW9ucyhibG9iKTtcbiAgcmV0dXJuIHNlY3Rpb25zICYmIHNlY3Rpb25zWzBdO1xufTtcblxuLy8gcmV0dXJucyB0aGUgaW5kaXZpZHVhbCBtZWRpYSBzZWN0aW9ucy5cblNEUFV0aWxzLmdldE1lZGlhU2VjdGlvbnMgPSBmdW5jdGlvbihibG9iKSB7XG4gIHZhciBzZWN0aW9ucyA9IFNEUFV0aWxzLnNwbGl0U2VjdGlvbnMoYmxvYik7XG4gIHNlY3Rpb25zLnNoaWZ0KCk7XG4gIHJldHVybiBzZWN0aW9ucztcbn07XG5cbi8vIFJldHVybnMgbGluZXMgdGhhdCBzdGFydCB3aXRoIGEgY2VydGFpbiBwcmVmaXguXG5TRFBVdGlscy5tYXRjaFByZWZpeCA9IGZ1bmN0aW9uKGJsb2IsIHByZWZpeCkge1xuICByZXR1cm4gU0RQVXRpbHMuc3BsaXRMaW5lcyhibG9iKS5maWx0ZXIoZnVuY3Rpb24obGluZSkge1xuICAgIHJldHVybiBsaW5lLmluZGV4T2YocHJlZml4KSA9PT0gMDtcbiAgfSk7XG59O1xuXG4vLyBQYXJzZXMgYW4gSUNFIGNhbmRpZGF0ZSBsaW5lLiBTYW1wbGUgaW5wdXQ6XG4vLyBjYW5kaWRhdGU6NzAyNzg2MzUwIDIgdWRwIDQxODE5OTAyIDguOC44LjggNjA3NjkgdHlwIHJlbGF5IHJhZGRyIDguOC44Ljhcbi8vIHJwb3J0IDU1OTk2XCJcblNEUFV0aWxzLnBhcnNlQ2FuZGlkYXRlID0gZnVuY3Rpb24obGluZSkge1xuICB2YXIgcGFydHM7XG4gIC8vIFBhcnNlIGJvdGggdmFyaWFudHMuXG4gIGlmIChsaW5lLmluZGV4T2YoJ2E9Y2FuZGlkYXRlOicpID09PSAwKSB7XG4gICAgcGFydHMgPSBsaW5lLnN1YnN0cmluZygxMikuc3BsaXQoJyAnKTtcbiAgfSBlbHNlIHtcbiAgICBwYXJ0cyA9IGxpbmUuc3Vic3RyaW5nKDEwKS5zcGxpdCgnICcpO1xuICB9XG5cbiAgdmFyIGNhbmRpZGF0ZSA9IHtcbiAgICBmb3VuZGF0aW9uOiBwYXJ0c1swXSxcbiAgICBjb21wb25lbnQ6IHBhcnNlSW50KHBhcnRzWzFdLCAxMCksXG4gICAgcHJvdG9jb2w6IHBhcnRzWzJdLnRvTG93ZXJDYXNlKCksXG4gICAgcHJpb3JpdHk6IHBhcnNlSW50KHBhcnRzWzNdLCAxMCksXG4gICAgaXA6IHBhcnRzWzRdLFxuICAgIHBvcnQ6IHBhcnNlSW50KHBhcnRzWzVdLCAxMCksXG4gICAgLy8gc2tpcCBwYXJ0c1s2XSA9PSAndHlwJ1xuICAgIHR5cGU6IHBhcnRzWzddXG4gIH07XG5cbiAgZm9yICh2YXIgaSA9IDg7IGkgPCBwYXJ0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHN3aXRjaCAocGFydHNbaV0pIHtcbiAgICAgIGNhc2UgJ3JhZGRyJzpcbiAgICAgICAgY2FuZGlkYXRlLnJlbGF0ZWRBZGRyZXNzID0gcGFydHNbaSArIDFdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3Jwb3J0JzpcbiAgICAgICAgY2FuZGlkYXRlLnJlbGF0ZWRQb3J0ID0gcGFyc2VJbnQocGFydHNbaSArIDFdLCAxMCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGNwdHlwZSc6XG4gICAgICAgIGNhbmRpZGF0ZS50Y3BUeXBlID0gcGFydHNbaSArIDFdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3VmcmFnJzpcbiAgICAgICAgY2FuZGlkYXRlLnVmcmFnID0gcGFydHNbaSArIDFdOyAvLyBmb3IgYmFja3dhcmQgY29tcGFiaWxpdHkuXG4gICAgICAgIGNhbmRpZGF0ZS51c2VybmFtZUZyYWdtZW50ID0gcGFydHNbaSArIDFdO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6IC8vIGV4dGVuc2lvbiBoYW5kbGluZywgaW4gcGFydGljdWxhciB1ZnJhZ1xuICAgICAgICBjYW5kaWRhdGVbcGFydHNbaV1dID0gcGFydHNbaSArIDFdO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNhbmRpZGF0ZTtcbn07XG5cbi8vIFRyYW5zbGF0ZXMgYSBjYW5kaWRhdGUgb2JqZWN0IGludG8gU0RQIGNhbmRpZGF0ZSBhdHRyaWJ1dGUuXG5TRFBVdGlscy53cml0ZUNhbmRpZGF0ZSA9IGZ1bmN0aW9uKGNhbmRpZGF0ZSkge1xuICB2YXIgc2RwID0gW107XG4gIHNkcC5wdXNoKGNhbmRpZGF0ZS5mb3VuZGF0aW9uKTtcbiAgc2RwLnB1c2goY2FuZGlkYXRlLmNvbXBvbmVudCk7XG4gIHNkcC5wdXNoKGNhbmRpZGF0ZS5wcm90b2NvbC50b1VwcGVyQ2FzZSgpKTtcbiAgc2RwLnB1c2goY2FuZGlkYXRlLnByaW9yaXR5KTtcbiAgc2RwLnB1c2goY2FuZGlkYXRlLmlwKTtcbiAgc2RwLnB1c2goY2FuZGlkYXRlLnBvcnQpO1xuXG4gIHZhciB0eXBlID0gY2FuZGlkYXRlLnR5cGU7XG4gIHNkcC5wdXNoKCd0eXAnKTtcbiAgc2RwLnB1c2godHlwZSk7XG4gIGlmICh0eXBlICE9PSAnaG9zdCcgJiYgY2FuZGlkYXRlLnJlbGF0ZWRBZGRyZXNzICYmXG4gICAgICBjYW5kaWRhdGUucmVsYXRlZFBvcnQpIHtcbiAgICBzZHAucHVzaCgncmFkZHInKTtcbiAgICBzZHAucHVzaChjYW5kaWRhdGUucmVsYXRlZEFkZHJlc3MpO1xuICAgIHNkcC5wdXNoKCdycG9ydCcpO1xuICAgIHNkcC5wdXNoKGNhbmRpZGF0ZS5yZWxhdGVkUG9ydCk7XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS50Y3BUeXBlICYmIGNhbmRpZGF0ZS5wcm90b2NvbC50b0xvd2VyQ2FzZSgpID09PSAndGNwJykge1xuICAgIHNkcC5wdXNoKCd0Y3B0eXBlJyk7XG4gICAgc2RwLnB1c2goY2FuZGlkYXRlLnRjcFR5cGUpO1xuICB9XG4gIGlmIChjYW5kaWRhdGUudXNlcm5hbWVGcmFnbWVudCB8fCBjYW5kaWRhdGUudWZyYWcpIHtcbiAgICBzZHAucHVzaCgndWZyYWcnKTtcbiAgICBzZHAucHVzaChjYW5kaWRhdGUudXNlcm5hbWVGcmFnbWVudCB8fCBjYW5kaWRhdGUudWZyYWcpO1xuICB9XG4gIHJldHVybiAnY2FuZGlkYXRlOicgKyBzZHAuam9pbignICcpO1xufTtcblxuLy8gUGFyc2VzIGFuIGljZS1vcHRpb25zIGxpbmUsIHJldHVybnMgYW4gYXJyYXkgb2Ygb3B0aW9uIHRhZ3MuXG4vLyBhPWljZS1vcHRpb25zOmZvbyBiYXJcblNEUFV0aWxzLnBhcnNlSWNlT3B0aW9ucyA9IGZ1bmN0aW9uKGxpbmUpIHtcbiAgcmV0dXJuIGxpbmUuc3Vic3RyKDE0KS5zcGxpdCgnICcpO1xufVxuXG4vLyBQYXJzZXMgYW4gcnRwbWFwIGxpbmUsIHJldHVybnMgUlRDUnRwQ29kZGVjUGFyYW1ldGVycy4gU2FtcGxlIGlucHV0OlxuLy8gYT1ydHBtYXA6MTExIG9wdXMvNDgwMDAvMlxuU0RQVXRpbHMucGFyc2VSdHBNYXAgPSBmdW5jdGlvbihsaW5lKSB7XG4gIHZhciBwYXJ0cyA9IGxpbmUuc3Vic3RyKDkpLnNwbGl0KCcgJyk7XG4gIHZhciBwYXJzZWQgPSB7XG4gICAgcGF5bG9hZFR5cGU6IHBhcnNlSW50KHBhcnRzLnNoaWZ0KCksIDEwKSAvLyB3YXM6IGlkXG4gIH07XG5cbiAgcGFydHMgPSBwYXJ0c1swXS5zcGxpdCgnLycpO1xuXG4gIHBhcnNlZC5uYW1lID0gcGFydHNbMF07XG4gIHBhcnNlZC5jbG9ja1JhdGUgPSBwYXJzZUludChwYXJ0c1sxXSwgMTApOyAvLyB3YXM6IGNsb2NrcmF0ZVxuICBwYXJzZWQuY2hhbm5lbHMgPSBwYXJ0cy5sZW5ndGggPT09IDMgPyBwYXJzZUludChwYXJ0c1syXSwgMTApIDogMTtcbiAgLy8gbGVnYWN5IGFsaWFzLCBnb3QgcmVuYW1lZCBiYWNrIHRvIGNoYW5uZWxzIGluIE9SVEMuXG4gIHBhcnNlZC5udW1DaGFubmVscyA9IHBhcnNlZC5jaGFubmVscztcbiAgcmV0dXJuIHBhcnNlZDtcbn07XG5cbi8vIEdlbmVyYXRlIGFuIGE9cnRwbWFwIGxpbmUgZnJvbSBSVENSdHBDb2RlY0NhcGFiaWxpdHkgb3Jcbi8vIFJUQ1J0cENvZGVjUGFyYW1ldGVycy5cblNEUFV0aWxzLndyaXRlUnRwTWFwID0gZnVuY3Rpb24oY29kZWMpIHtcbiAgdmFyIHB0ID0gY29kZWMucGF5bG9hZFR5cGU7XG4gIGlmIChjb2RlYy5wcmVmZXJyZWRQYXlsb2FkVHlwZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcHQgPSBjb2RlYy5wcmVmZXJyZWRQYXlsb2FkVHlwZTtcbiAgfVxuICB2YXIgY2hhbm5lbHMgPSBjb2RlYy5jaGFubmVscyB8fCBjb2RlYy5udW1DaGFubmVscyB8fCAxO1xuICByZXR1cm4gJ2E9cnRwbWFwOicgKyBwdCArICcgJyArIGNvZGVjLm5hbWUgKyAnLycgKyBjb2RlYy5jbG9ja1JhdGUgK1xuICAgICAgKGNoYW5uZWxzICE9PSAxID8gJy8nICsgY2hhbm5lbHMgOiAnJykgKyAnXFxyXFxuJztcbn07XG5cbi8vIFBhcnNlcyBhbiBhPWV4dG1hcCBsaW5lIChoZWFkZXJleHRlbnNpb24gZnJvbSBSRkMgNTI4NSkuIFNhbXBsZSBpbnB1dDpcbi8vIGE9ZXh0bWFwOjIgdXJuOmlldGY6cGFyYW1zOnJ0cC1oZHJleHQ6dG9mZnNldFxuLy8gYT1leHRtYXA6Mi9zZW5kb25seSB1cm46aWV0ZjpwYXJhbXM6cnRwLWhkcmV4dDp0b2Zmc2V0XG5TRFBVdGlscy5wYXJzZUV4dG1hcCA9IGZ1bmN0aW9uKGxpbmUpIHtcbiAgdmFyIHBhcnRzID0gbGluZS5zdWJzdHIoOSkuc3BsaXQoJyAnKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogcGFyc2VJbnQocGFydHNbMF0sIDEwKSxcbiAgICBkaXJlY3Rpb246IHBhcnRzWzBdLmluZGV4T2YoJy8nKSA+IDAgPyBwYXJ0c1swXS5zcGxpdCgnLycpWzFdIDogJ3NlbmRyZWN2JyxcbiAgICB1cmk6IHBhcnRzWzFdXG4gIH07XG59O1xuXG4vLyBHZW5lcmF0ZXMgYT1leHRtYXAgbGluZSBmcm9tIFJUQ1J0cEhlYWRlckV4dGVuc2lvblBhcmFtZXRlcnMgb3Jcbi8vIFJUQ1J0cEhlYWRlckV4dGVuc2lvbi5cblNEUFV0aWxzLndyaXRlRXh0bWFwID0gZnVuY3Rpb24oaGVhZGVyRXh0ZW5zaW9uKSB7XG4gIHJldHVybiAnYT1leHRtYXA6JyArIChoZWFkZXJFeHRlbnNpb24uaWQgfHwgaGVhZGVyRXh0ZW5zaW9uLnByZWZlcnJlZElkKSArXG4gICAgICAoaGVhZGVyRXh0ZW5zaW9uLmRpcmVjdGlvbiAmJiBoZWFkZXJFeHRlbnNpb24uZGlyZWN0aW9uICE9PSAnc2VuZHJlY3YnXG4gICAgICAgICAgPyAnLycgKyBoZWFkZXJFeHRlbnNpb24uZGlyZWN0aW9uXG4gICAgICAgICAgOiAnJykgK1xuICAgICAgJyAnICsgaGVhZGVyRXh0ZW5zaW9uLnVyaSArICdcXHJcXG4nO1xufTtcblxuLy8gUGFyc2VzIGFuIGZ0bXAgbGluZSwgcmV0dXJucyBkaWN0aW9uYXJ5LiBTYW1wbGUgaW5wdXQ6XG4vLyBhPWZtdHA6OTYgdmJyPW9uO2NuZz1vblxuLy8gQWxzbyBkZWFscyB3aXRoIHZicj1vbjsgY25nPW9uXG5TRFBVdGlscy5wYXJzZUZtdHAgPSBmdW5jdGlvbihsaW5lKSB7XG4gIHZhciBwYXJzZWQgPSB7fTtcbiAgdmFyIGt2O1xuICB2YXIgcGFydHMgPSBsaW5lLnN1YnN0cihsaW5lLmluZGV4T2YoJyAnKSArIDEpLnNwbGl0KCc7Jyk7XG4gIGZvciAodmFyIGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICBrdiA9IHBhcnRzW2pdLnRyaW0oKS5zcGxpdCgnPScpO1xuICAgIHBhcnNlZFtrdlswXS50cmltKCldID0ga3ZbMV07XG4gIH1cbiAgcmV0dXJuIHBhcnNlZDtcbn07XG5cbi8vIEdlbmVyYXRlcyBhbiBhPWZ0bXAgbGluZSBmcm9tIFJUQ1J0cENvZGVjQ2FwYWJpbGl0eSBvciBSVENSdHBDb2RlY1BhcmFtZXRlcnMuXG5TRFBVdGlscy53cml0ZUZtdHAgPSBmdW5jdGlvbihjb2RlYykge1xuICB2YXIgbGluZSA9ICcnO1xuICB2YXIgcHQgPSBjb2RlYy5wYXlsb2FkVHlwZTtcbiAgaWYgKGNvZGVjLnByZWZlcnJlZFBheWxvYWRUeXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICBwdCA9IGNvZGVjLnByZWZlcnJlZFBheWxvYWRUeXBlO1xuICB9XG4gIGlmIChjb2RlYy5wYXJhbWV0ZXJzICYmIE9iamVjdC5rZXlzKGNvZGVjLnBhcmFtZXRlcnMpLmxlbmd0aCkge1xuICAgIHZhciBwYXJhbXMgPSBbXTtcbiAgICBPYmplY3Qua2V5cyhjb2RlYy5wYXJhbWV0ZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKHBhcmFtKSB7XG4gICAgICBpZiAoY29kZWMucGFyYW1ldGVyc1twYXJhbV0pIHtcbiAgICAgICAgcGFyYW1zLnB1c2gocGFyYW0gKyAnPScgKyBjb2RlYy5wYXJhbWV0ZXJzW3BhcmFtXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJhbXMucHVzaChwYXJhbSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbGluZSArPSAnYT1mbXRwOicgKyBwdCArICcgJyArIHBhcmFtcy5qb2luKCc7JykgKyAnXFxyXFxuJztcbiAgfVxuICByZXR1cm4gbGluZTtcbn07XG5cbi8vIFBhcnNlcyBhbiBydGNwLWZiIGxpbmUsIHJldHVybnMgUlRDUFJ0Y3BGZWVkYmFjayBvYmplY3QuIFNhbXBsZSBpbnB1dDpcbi8vIGE9cnRjcC1mYjo5OCBuYWNrIHJwc2lcblNEUFV0aWxzLnBhcnNlUnRjcEZiID0gZnVuY3Rpb24obGluZSkge1xuICB2YXIgcGFydHMgPSBsaW5lLnN1YnN0cihsaW5lLmluZGV4T2YoJyAnKSArIDEpLnNwbGl0KCcgJyk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogcGFydHMuc2hpZnQoKSxcbiAgICBwYXJhbWV0ZXI6IHBhcnRzLmpvaW4oJyAnKVxuICB9O1xufTtcbi8vIEdlbmVyYXRlIGE9cnRjcC1mYiBsaW5lcyBmcm9tIFJUQ1J0cENvZGVjQ2FwYWJpbGl0eSBvciBSVENSdHBDb2RlY1BhcmFtZXRlcnMuXG5TRFBVdGlscy53cml0ZVJ0Y3BGYiA9IGZ1bmN0aW9uKGNvZGVjKSB7XG4gIHZhciBsaW5lcyA9ICcnO1xuICB2YXIgcHQgPSBjb2RlYy5wYXlsb2FkVHlwZTtcbiAgaWYgKGNvZGVjLnByZWZlcnJlZFBheWxvYWRUeXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICBwdCA9IGNvZGVjLnByZWZlcnJlZFBheWxvYWRUeXBlO1xuICB9XG4gIGlmIChjb2RlYy5ydGNwRmVlZGJhY2sgJiYgY29kZWMucnRjcEZlZWRiYWNrLmxlbmd0aCkge1xuICAgIC8vIEZJWE1FOiBzcGVjaWFsIGhhbmRsaW5nIGZvciB0cnItaW50P1xuICAgIGNvZGVjLnJ0Y3BGZWVkYmFjay5mb3JFYWNoKGZ1bmN0aW9uKGZiKSB7XG4gICAgICBsaW5lcyArPSAnYT1ydGNwLWZiOicgKyBwdCArICcgJyArIGZiLnR5cGUgK1xuICAgICAgKGZiLnBhcmFtZXRlciAmJiBmYi5wYXJhbWV0ZXIubGVuZ3RoID8gJyAnICsgZmIucGFyYW1ldGVyIDogJycpICtcbiAgICAgICAgICAnXFxyXFxuJztcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gbGluZXM7XG59O1xuXG4vLyBQYXJzZXMgYW4gUkZDIDU1NzYgc3NyYyBtZWRpYSBhdHRyaWJ1dGUuIFNhbXBsZSBpbnB1dDpcbi8vIGE9c3NyYzozNzM1OTI4NTU5IGNuYW1lOnNvbWV0aGluZ1xuU0RQVXRpbHMucGFyc2VTc3JjTWVkaWEgPSBmdW5jdGlvbihsaW5lKSB7XG4gIHZhciBzcCA9IGxpbmUuaW5kZXhPZignICcpO1xuICB2YXIgcGFydHMgPSB7XG4gICAgc3NyYzogcGFyc2VJbnQobGluZS5zdWJzdHIoNywgc3AgLSA3KSwgMTApXG4gIH07XG4gIHZhciBjb2xvbiA9IGxpbmUuaW5kZXhPZignOicsIHNwKTtcbiAgaWYgKGNvbG9uID4gLTEpIHtcbiAgICBwYXJ0cy5hdHRyaWJ1dGUgPSBsaW5lLnN1YnN0cihzcCArIDEsIGNvbG9uIC0gc3AgLSAxKTtcbiAgICBwYXJ0cy52YWx1ZSA9IGxpbmUuc3Vic3RyKGNvbG9uICsgMSk7XG4gIH0gZWxzZSB7XG4gICAgcGFydHMuYXR0cmlidXRlID0gbGluZS5zdWJzdHIoc3AgKyAxKTtcbiAgfVxuICByZXR1cm4gcGFydHM7XG59O1xuXG4vLyBFeHRyYWN0cyB0aGUgTUlEIChSRkMgNTg4OCkgZnJvbSBhIG1lZGlhIHNlY3Rpb24uXG4vLyByZXR1cm5zIHRoZSBNSUQgb3IgdW5kZWZpbmVkIGlmIG5vIG1pZCBsaW5lIHdhcyBmb3VuZC5cblNEUFV0aWxzLmdldE1pZCA9IGZ1bmN0aW9uKG1lZGlhU2VjdGlvbikge1xuICB2YXIgbWlkID0gU0RQVXRpbHMubWF0Y2hQcmVmaXgobWVkaWFTZWN0aW9uLCAnYT1taWQ6JylbMF07XG4gIGlmIChtaWQpIHtcbiAgICByZXR1cm4gbWlkLnN1YnN0cig2KTtcbiAgfVxufVxuXG5TRFBVdGlscy5wYXJzZUZpbmdlcnByaW50ID0gZnVuY3Rpb24obGluZSkge1xuICB2YXIgcGFydHMgPSBsaW5lLnN1YnN0cigxNCkuc3BsaXQoJyAnKTtcbiAgcmV0dXJuIHtcbiAgICBhbGdvcml0aG06IHBhcnRzWzBdLnRvTG93ZXJDYXNlKCksIC8vIGFsZ29yaXRobSBpcyBjYXNlLXNlbnNpdGl2ZSBpbiBFZGdlLlxuICAgIHZhbHVlOiBwYXJ0c1sxXVxuICB9O1xufTtcblxuLy8gRXh0cmFjdHMgRFRMUyBwYXJhbWV0ZXJzIGZyb20gU0RQIG1lZGlhIHNlY3Rpb24gb3Igc2Vzc2lvbnBhcnQuXG4vLyBGSVhNRTogZm9yIGNvbnNpc3RlbmN5IHdpdGggb3RoZXIgZnVuY3Rpb25zIHRoaXMgc2hvdWxkIG9ubHlcbi8vICAgZ2V0IHRoZSBmaW5nZXJwcmludCBsaW5lIGFzIGlucHV0LiBTZWUgYWxzbyBnZXRJY2VQYXJhbWV0ZXJzLlxuU0RQVXRpbHMuZ2V0RHRsc1BhcmFtZXRlcnMgPSBmdW5jdGlvbihtZWRpYVNlY3Rpb24sIHNlc3Npb25wYXJ0KSB7XG4gIHZhciBsaW5lcyA9IFNEUFV0aWxzLm1hdGNoUHJlZml4KG1lZGlhU2VjdGlvbiArIHNlc3Npb25wYXJ0LFxuICAgICAgJ2E9ZmluZ2VycHJpbnQ6Jyk7XG4gIC8vIE5vdGU6IGE9c2V0dXAgbGluZSBpcyBpZ25vcmVkIHNpbmNlIHdlIHVzZSB0aGUgJ2F1dG8nIHJvbGUuXG4gIC8vIE5vdGUyOiAnYWxnb3JpdGhtJyBpcyBub3QgY2FzZSBzZW5zaXRpdmUgZXhjZXB0IGluIEVkZ2UuXG4gIHJldHVybiB7XG4gICAgcm9sZTogJ2F1dG8nLFxuICAgIGZpbmdlcnByaW50czogbGluZXMubWFwKFNEUFV0aWxzLnBhcnNlRmluZ2VycHJpbnQpXG4gIH07XG59O1xuXG4vLyBTZXJpYWxpemVzIERUTFMgcGFyYW1ldGVycyB0byBTRFAuXG5TRFBVdGlscy53cml0ZUR0bHNQYXJhbWV0ZXJzID0gZnVuY3Rpb24ocGFyYW1zLCBzZXR1cFR5cGUpIHtcbiAgdmFyIHNkcCA9ICdhPXNldHVwOicgKyBzZXR1cFR5cGUgKyAnXFxyXFxuJztcbiAgcGFyYW1zLmZpbmdlcnByaW50cy5mb3JFYWNoKGZ1bmN0aW9uKGZwKSB7XG4gICAgc2RwICs9ICdhPWZpbmdlcnByaW50OicgKyBmcC5hbGdvcml0aG0gKyAnICcgKyBmcC52YWx1ZSArICdcXHJcXG4nO1xuICB9KTtcbiAgcmV0dXJuIHNkcDtcbn07XG4vLyBQYXJzZXMgSUNFIGluZm9ybWF0aW9uIGZyb20gU0RQIG1lZGlhIHNlY3Rpb24gb3Igc2Vzc2lvbnBhcnQuXG4vLyBGSVhNRTogZm9yIGNvbnNpc3RlbmN5IHdpdGggb3RoZXIgZnVuY3Rpb25zIHRoaXMgc2hvdWxkIG9ubHlcbi8vICAgZ2V0IHRoZSBpY2UtdWZyYWcgYW5kIGljZS1wd2QgbGluZXMgYXMgaW5wdXQuXG5TRFBVdGlscy5nZXRJY2VQYXJhbWV0ZXJzID0gZnVuY3Rpb24obWVkaWFTZWN0aW9uLCBzZXNzaW9ucGFydCkge1xuICB2YXIgbGluZXMgPSBTRFBVdGlscy5zcGxpdExpbmVzKG1lZGlhU2VjdGlvbik7XG4gIC8vIFNlYXJjaCBpbiBzZXNzaW9uIHBhcnQsIHRvby5cbiAgbGluZXMgPSBsaW5lcy5jb25jYXQoU0RQVXRpbHMuc3BsaXRMaW5lcyhzZXNzaW9ucGFydCkpO1xuICB2YXIgaWNlUGFyYW1ldGVycyA9IHtcbiAgICB1c2VybmFtZUZyYWdtZW50OiBsaW5lcy5maWx0ZXIoZnVuY3Rpb24obGluZSkge1xuICAgICAgcmV0dXJuIGxpbmUuaW5kZXhPZignYT1pY2UtdWZyYWc6JykgPT09IDA7XG4gICAgfSlbMF0uc3Vic3RyKDEyKSxcbiAgICBwYXNzd29yZDogbGluZXMuZmlsdGVyKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgIHJldHVybiBsaW5lLmluZGV4T2YoJ2E9aWNlLXB3ZDonKSA9PT0gMDtcbiAgICB9KVswXS5zdWJzdHIoMTApXG4gIH07XG4gIHJldHVybiBpY2VQYXJhbWV0ZXJzO1xufTtcblxuLy8gU2VyaWFsaXplcyBJQ0UgcGFyYW1ldGVycyB0byBTRFAuXG5TRFBVdGlscy53cml0ZUljZVBhcmFtZXRlcnMgPSBmdW5jdGlvbihwYXJhbXMpIHtcbiAgcmV0dXJuICdhPWljZS11ZnJhZzonICsgcGFyYW1zLnVzZXJuYW1lRnJhZ21lbnQgKyAnXFxyXFxuJyArXG4gICAgICAnYT1pY2UtcHdkOicgKyBwYXJhbXMucGFzc3dvcmQgKyAnXFxyXFxuJztcbn07XG5cbi8vIFBhcnNlcyB0aGUgU0RQIG1lZGlhIHNlY3Rpb24gYW5kIHJldHVybnMgUlRDUnRwUGFyYW1ldGVycy5cblNEUFV0aWxzLnBhcnNlUnRwUGFyYW1ldGVycyA9IGZ1bmN0aW9uKG1lZGlhU2VjdGlvbikge1xuICB2YXIgZGVzY3JpcHRpb24gPSB7XG4gICAgY29kZWNzOiBbXSxcbiAgICBoZWFkZXJFeHRlbnNpb25zOiBbXSxcbiAgICBmZWNNZWNoYW5pc21zOiBbXSxcbiAgICBydGNwOiBbXVxuICB9O1xuICB2YXIgbGluZXMgPSBTRFBVdGlscy5zcGxpdExpbmVzKG1lZGlhU2VjdGlvbik7XG4gIHZhciBtbGluZSA9IGxpbmVzWzBdLnNwbGl0KCcgJyk7XG4gIGZvciAodmFyIGkgPSAzOyBpIDwgbWxpbmUubGVuZ3RoOyBpKyspIHsgLy8gZmluZCBhbGwgY29kZWNzIGZyb20gbWxpbmVbMy4uXVxuICAgIHZhciBwdCA9IG1saW5lW2ldO1xuICAgIHZhciBydHBtYXBsaW5lID0gU0RQVXRpbHMubWF0Y2hQcmVmaXgoXG4gICAgICAgIG1lZGlhU2VjdGlvbiwgJ2E9cnRwbWFwOicgKyBwdCArICcgJylbMF07XG4gICAgaWYgKHJ0cG1hcGxpbmUpIHtcbiAgICAgIHZhciBjb2RlYyA9IFNEUFV0aWxzLnBhcnNlUnRwTWFwKHJ0cG1hcGxpbmUpO1xuICAgICAgdmFyIGZtdHBzID0gU0RQVXRpbHMubWF0Y2hQcmVmaXgoXG4gICAgICAgICAgbWVkaWFTZWN0aW9uLCAnYT1mbXRwOicgKyBwdCArICcgJyk7XG4gICAgICAvLyBPbmx5IHRoZSBmaXJzdCBhPWZtdHA6PHB0PiBpcyBjb25zaWRlcmVkLlxuICAgICAgY29kZWMucGFyYW1ldGVycyA9IGZtdHBzLmxlbmd0aCA/IFNEUFV0aWxzLnBhcnNlRm10cChmbXRwc1swXSkgOiB7fTtcbiAgICAgIGNvZGVjLnJ0Y3BGZWVkYmFjayA9IFNEUFV0aWxzLm1hdGNoUHJlZml4KFxuICAgICAgICAgIG1lZGlhU2VjdGlvbiwgJ2E9cnRjcC1mYjonICsgcHQgKyAnICcpXG4gICAgICAgIC5tYXAoU0RQVXRpbHMucGFyc2VSdGNwRmIpO1xuICAgICAgZGVzY3JpcHRpb24uY29kZWNzLnB1c2goY29kZWMpO1xuICAgICAgLy8gcGFyc2UgRkVDIG1lY2hhbmlzbXMgZnJvbSBydHBtYXAgbGluZXMuXG4gICAgICBzd2l0Y2ggKGNvZGVjLm5hbWUudG9VcHBlckNhc2UoKSkge1xuICAgICAgICBjYXNlICdSRUQnOlxuICAgICAgICBjYXNlICdVTFBGRUMnOlxuICAgICAgICAgIGRlc2NyaXB0aW9uLmZlY01lY2hhbmlzbXMucHVzaChjb2RlYy5uYW1lLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OiAvLyBvbmx5IFJFRCBhbmQgVUxQRkVDIGFyZSByZWNvZ25pemVkIGFzIEZFQyBtZWNoYW5pc21zLlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBTRFBVdGlscy5tYXRjaFByZWZpeChtZWRpYVNlY3Rpb24sICdhPWV4dG1hcDonKS5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICBkZXNjcmlwdGlvbi5oZWFkZXJFeHRlbnNpb25zLnB1c2goU0RQVXRpbHMucGFyc2VFeHRtYXAobGluZSkpO1xuICB9KTtcbiAgLy8gRklYTUU6IHBhcnNlIHJ0Y3AuXG4gIHJldHVybiBkZXNjcmlwdGlvbjtcbn07XG5cbi8vIEdlbmVyYXRlcyBwYXJ0cyBvZiB0aGUgU0RQIG1lZGlhIHNlY3Rpb24gZGVzY3JpYmluZyB0aGUgY2FwYWJpbGl0aWVzIC9cbi8vIHBhcmFtZXRlcnMuXG5TRFBVdGlscy53cml0ZVJ0cERlc2NyaXB0aW9uID0gZnVuY3Rpb24oa2luZCwgY2Fwcykge1xuICB2YXIgc2RwID0gJyc7XG5cbiAgLy8gQnVpbGQgdGhlIG1saW5lLlxuICBzZHAgKz0gJ209JyArIGtpbmQgKyAnICc7XG4gIHNkcCArPSBjYXBzLmNvZGVjcy5sZW5ndGggPiAwID8gJzknIDogJzAnOyAvLyByZWplY3QgaWYgbm8gY29kZWNzLlxuICBzZHAgKz0gJyBVRFAvVExTL1JUUC9TQVZQRiAnO1xuICBzZHAgKz0gY2Fwcy5jb2RlY3MubWFwKGZ1bmN0aW9uKGNvZGVjKSB7XG4gICAgaWYgKGNvZGVjLnByZWZlcnJlZFBheWxvYWRUeXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBjb2RlYy5wcmVmZXJyZWRQYXlsb2FkVHlwZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvZGVjLnBheWxvYWRUeXBlO1xuICB9KS5qb2luKCcgJykgKyAnXFxyXFxuJztcblxuICBzZHAgKz0gJ2M9SU4gSVA0IDAuMC4wLjBcXHJcXG4nO1xuICBzZHAgKz0gJ2E9cnRjcDo5IElOIElQNCAwLjAuMC4wXFxyXFxuJztcblxuICAvLyBBZGQgYT1ydHBtYXAgbGluZXMgZm9yIGVhY2ggY29kZWMuIEFsc28gZm10cCBhbmQgcnRjcC1mYi5cbiAgY2Fwcy5jb2RlY3MuZm9yRWFjaChmdW5jdGlvbihjb2RlYykge1xuICAgIHNkcCArPSBTRFBVdGlscy53cml0ZVJ0cE1hcChjb2RlYyk7XG4gICAgc2RwICs9IFNEUFV0aWxzLndyaXRlRm10cChjb2RlYyk7XG4gICAgc2RwICs9IFNEUFV0aWxzLndyaXRlUnRjcEZiKGNvZGVjKTtcbiAgfSk7XG4gIHZhciBtYXhwdGltZSA9IDA7XG4gIGNhcHMuY29kZWNzLmZvckVhY2goZnVuY3Rpb24oY29kZWMpIHtcbiAgICBpZiAoY29kZWMubWF4cHRpbWUgPiBtYXhwdGltZSkge1xuICAgICAgbWF4cHRpbWUgPSBjb2RlYy5tYXhwdGltZTtcbiAgICB9XG4gIH0pO1xuICBpZiAobWF4cHRpbWUgPiAwKSB7XG4gICAgc2RwICs9ICdhPW1heHB0aW1lOicgKyBtYXhwdGltZSArICdcXHJcXG4nO1xuICB9XG4gIHNkcCArPSAnYT1ydGNwLW11eFxcclxcbic7XG5cbiAgaWYgKGNhcHMuaGVhZGVyRXh0ZW5zaW9ucykge1xuICAgIGNhcHMuaGVhZGVyRXh0ZW5zaW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGV4dGVuc2lvbikge1xuICAgICAgc2RwICs9IFNEUFV0aWxzLndyaXRlRXh0bWFwKGV4dGVuc2lvbik7XG4gICAgfSk7XG4gIH1cbiAgLy8gRklYTUU6IHdyaXRlIGZlY01lY2hhbmlzbXMuXG4gIHJldHVybiBzZHA7XG59O1xuXG4vLyBQYXJzZXMgdGhlIFNEUCBtZWRpYSBzZWN0aW9uIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mXG4vLyBSVENSdHBFbmNvZGluZ1BhcmFtZXRlcnMuXG5TRFBVdGlscy5wYXJzZVJ0cEVuY29kaW5nUGFyYW1ldGVycyA9IGZ1bmN0aW9uKG1lZGlhU2VjdGlvbikge1xuICB2YXIgZW5jb2RpbmdQYXJhbWV0ZXJzID0gW107XG4gIHZhciBkZXNjcmlwdGlvbiA9IFNEUFV0aWxzLnBhcnNlUnRwUGFyYW1ldGVycyhtZWRpYVNlY3Rpb24pO1xuICB2YXIgaGFzUmVkID0gZGVzY3JpcHRpb24uZmVjTWVjaGFuaXNtcy5pbmRleE9mKCdSRUQnKSAhPT0gLTE7XG4gIHZhciBoYXNVbHBmZWMgPSBkZXNjcmlwdGlvbi5mZWNNZWNoYW5pc21zLmluZGV4T2YoJ1VMUEZFQycpICE9PSAtMTtcblxuICAvLyBmaWx0ZXIgYT1zc3JjOi4uLiBjbmFtZTosIGlnbm9yZSBQbGFuQi1tc2lkXG4gIHZhciBzc3JjcyA9IFNEUFV0aWxzLm1hdGNoUHJlZml4KG1lZGlhU2VjdGlvbiwgJ2E9c3NyYzonKVxuICAubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICByZXR1cm4gU0RQVXRpbHMucGFyc2VTc3JjTWVkaWEobGluZSk7XG4gIH0pXG4gIC5maWx0ZXIoZnVuY3Rpb24ocGFydHMpIHtcbiAgICByZXR1cm4gcGFydHMuYXR0cmlidXRlID09PSAnY25hbWUnO1xuICB9KTtcbiAgdmFyIHByaW1hcnlTc3JjID0gc3NyY3MubGVuZ3RoID4gMCAmJiBzc3Jjc1swXS5zc3JjO1xuICB2YXIgc2Vjb25kYXJ5U3NyYztcblxuICB2YXIgZmxvd3MgPSBTRFBVdGlscy5tYXRjaFByZWZpeChtZWRpYVNlY3Rpb24sICdhPXNzcmMtZ3JvdXA6RklEJylcbiAgLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgdmFyIHBhcnRzID0gbGluZS5zdWJzdHIoMTcpLnNwbGl0KCcgJyk7XG4gICAgcmV0dXJuIHBhcnRzLm1hcChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICByZXR1cm4gcGFyc2VJbnQocGFydCwgMTApO1xuICAgIH0pO1xuICB9KTtcbiAgaWYgKGZsb3dzLmxlbmd0aCA+IDAgJiYgZmxvd3NbMF0ubGVuZ3RoID4gMSAmJiBmbG93c1swXVswXSA9PT0gcHJpbWFyeVNzcmMpIHtcbiAgICBzZWNvbmRhcnlTc3JjID0gZmxvd3NbMF1bMV07XG4gIH1cblxuICBkZXNjcmlwdGlvbi5jb2RlY3MuZm9yRWFjaChmdW5jdGlvbihjb2RlYykge1xuICAgIGlmIChjb2RlYy5uYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdSVFgnICYmIGNvZGVjLnBhcmFtZXRlcnMuYXB0KSB7XG4gICAgICB2YXIgZW5jUGFyYW0gPSB7XG4gICAgICAgIHNzcmM6IHByaW1hcnlTc3JjLFxuICAgICAgICBjb2RlY1BheWxvYWRUeXBlOiBwYXJzZUludChjb2RlYy5wYXJhbWV0ZXJzLmFwdCwgMTApLFxuICAgICAgfTtcbiAgICAgIGlmIChwcmltYXJ5U3NyYyAmJiBzZWNvbmRhcnlTc3JjKSB7XG4gICAgICAgIGVuY1BhcmFtLnJ0eCA9IHtzc3JjOiBzZWNvbmRhcnlTc3JjfTtcbiAgICAgIH1cbiAgICAgIGVuY29kaW5nUGFyYW1ldGVycy5wdXNoKGVuY1BhcmFtKTtcbiAgICAgIGlmIChoYXNSZWQpIHtcbiAgICAgICAgZW5jUGFyYW0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGVuY1BhcmFtKSk7XG4gICAgICAgIGVuY1BhcmFtLmZlYyA9IHtcbiAgICAgICAgICBzc3JjOiBzZWNvbmRhcnlTc3JjLFxuICAgICAgICAgIG1lY2hhbmlzbTogaGFzVWxwZmVjID8gJ3JlZCt1bHBmZWMnIDogJ3JlZCdcbiAgICAgICAgfTtcbiAgICAgICAgZW5jb2RpbmdQYXJhbWV0ZXJzLnB1c2goZW5jUGFyYW0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIGlmIChlbmNvZGluZ1BhcmFtZXRlcnMubGVuZ3RoID09PSAwICYmIHByaW1hcnlTc3JjKSB7XG4gICAgZW5jb2RpbmdQYXJhbWV0ZXJzLnB1c2goe1xuICAgICAgc3NyYzogcHJpbWFyeVNzcmNcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHdlIHN1cHBvcnQgYm90aCBiPUFTIGFuZCBiPVRJQVMgYnV0IGludGVycHJldCBBUyBhcyBUSUFTLlxuICB2YXIgYmFuZHdpZHRoID0gU0RQVXRpbHMubWF0Y2hQcmVmaXgobWVkaWFTZWN0aW9uLCAnYj0nKTtcbiAgaWYgKGJhbmR3aWR0aC5sZW5ndGgpIHtcbiAgICBpZiAoYmFuZHdpZHRoWzBdLmluZGV4T2YoJ2I9VElBUzonKSA9PT0gMCkge1xuICAgICAgYmFuZHdpZHRoID0gcGFyc2VJbnQoYmFuZHdpZHRoWzBdLnN1YnN0cig3KSwgMTApO1xuICAgIH0gZWxzZSBpZiAoYmFuZHdpZHRoWzBdLmluZGV4T2YoJ2I9QVM6JykgPT09IDApIHtcbiAgICAgIC8vIHVzZSBmb3JtdWxhIGZyb20gSlNFUCB0byBjb252ZXJ0IGI9QVMgdG8gVElBUyB2YWx1ZS5cbiAgICAgIGJhbmR3aWR0aCA9IHBhcnNlSW50KGJhbmR3aWR0aFswXS5zdWJzdHIoNSksIDEwKSAqIDEwMDAgKiAwLjk1XG4gICAgICAgICAgLSAoNTAgKiA0MCAqIDgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYW5kd2lkdGggPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGVuY29kaW5nUGFyYW1ldGVycy5mb3JFYWNoKGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgcGFyYW1zLm1heEJpdHJhdGUgPSBiYW5kd2lkdGg7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGVuY29kaW5nUGFyYW1ldGVycztcbn07XG5cbi8vIHBhcnNlcyBodHRwOi8vZHJhZnQub3J0Yy5vcmcvI3J0Y3J0Y3BwYXJhbWV0ZXJzKlxuU0RQVXRpbHMucGFyc2VSdGNwUGFyYW1ldGVycyA9IGZ1bmN0aW9uKG1lZGlhU2VjdGlvbikge1xuICB2YXIgcnRjcFBhcmFtZXRlcnMgPSB7fTtcblxuICB2YXIgY25hbWU7XG4gIC8vIEdldHMgdGhlIGZpcnN0IFNTUkMuIE5vdGUgdGhhdCB3aXRoIFJUWCB0aGVyZSBtaWdodCBiZSBtdWx0aXBsZVxuICAvLyBTU1JDcy5cbiAgdmFyIHJlbW90ZVNzcmMgPSBTRFBVdGlscy5tYXRjaFByZWZpeChtZWRpYVNlY3Rpb24sICdhPXNzcmM6JylcbiAgICAgIC5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICByZXR1cm4gU0RQVXRpbHMucGFyc2VTc3JjTWVkaWEobGluZSk7XG4gICAgICB9KVxuICAgICAgLmZpbHRlcihmdW5jdGlvbihvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iai5hdHRyaWJ1dGUgPT09ICdjbmFtZSc7XG4gICAgICB9KVswXTtcbiAgaWYgKHJlbW90ZVNzcmMpIHtcbiAgICBydGNwUGFyYW1ldGVycy5jbmFtZSA9IHJlbW90ZVNzcmMudmFsdWU7XG4gICAgcnRjcFBhcmFtZXRlcnMuc3NyYyA9IHJlbW90ZVNzcmMuc3NyYztcbiAgfVxuXG4gIC8vIEVkZ2UgdXNlcyB0aGUgY29tcG91bmQgYXR0cmlidXRlIGluc3RlYWQgb2YgcmVkdWNlZFNpemVcbiAgLy8gY29tcG91bmQgaXMgIXJlZHVjZWRTaXplXG4gIHZhciByc2l6ZSA9IFNEUFV0aWxzLm1hdGNoUHJlZml4KG1lZGlhU2VjdGlvbiwgJ2E9cnRjcC1yc2l6ZScpO1xuICBydGNwUGFyYW1ldGVycy5yZWR1Y2VkU2l6ZSA9IHJzaXplLmxlbmd0aCA+IDA7XG4gIHJ0Y3BQYXJhbWV0ZXJzLmNvbXBvdW5kID0gcnNpemUubGVuZ3RoID09PSAwO1xuXG4gIC8vIHBhcnNlcyB0aGUgcnRjcC1tdXggYXR0ctGWYnV0ZS5cbiAgLy8gTm90ZSB0aGF0IEVkZ2UgZG9lcyBub3Qgc3VwcG9ydCB1bm11eGVkIFJUQ1AuXG4gIHZhciBtdXggPSBTRFBVdGlscy5tYXRjaFByZWZpeChtZWRpYVNlY3Rpb24sICdhPXJ0Y3AtbXV4Jyk7XG4gIHJ0Y3BQYXJhbWV0ZXJzLm11eCA9IG11eC5sZW5ndGggPiAwO1xuXG4gIHJldHVybiBydGNwUGFyYW1ldGVycztcbn07XG5cbi8vIHBhcnNlcyBlaXRoZXIgYT1tc2lkOiBvciBhPXNzcmM6Li4uIG1zaWQgbGluZXMgYW5kIHJldHVybnNcbi8vIHRoZSBpZCBvZiB0aGUgTWVkaWFTdHJlYW0gYW5kIE1lZGlhU3RyZWFtVHJhY2suXG5TRFBVdGlscy5wYXJzZU1zaWQgPSBmdW5jdGlvbihtZWRpYVNlY3Rpb24pIHtcbiAgdmFyIHBhcnRzO1xuICB2YXIgc3BlYyA9IFNEUFV0aWxzLm1hdGNoUHJlZml4KG1lZGlhU2VjdGlvbiwgJ2E9bXNpZDonKTtcbiAgaWYgKHNwZWMubGVuZ3RoID09PSAxKSB7XG4gICAgcGFydHMgPSBzcGVjWzBdLnN1YnN0cig3KS5zcGxpdCgnICcpO1xuICAgIHJldHVybiB7c3RyZWFtOiBwYXJ0c1swXSwgdHJhY2s6IHBhcnRzWzFdfTtcbiAgfVxuICB2YXIgcGxhbkIgPSBTRFBVdGlscy5tYXRjaFByZWZpeChtZWRpYVNlY3Rpb24sICdhPXNzcmM6JylcbiAgLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgcmV0dXJuIFNEUFV0aWxzLnBhcnNlU3NyY01lZGlhKGxpbmUpO1xuICB9KVxuICAuZmlsdGVyKGZ1bmN0aW9uKHBhcnRzKSB7XG4gICAgcmV0dXJuIHBhcnRzLmF0dHJpYnV0ZSA9PT0gJ21zaWQnO1xuICB9KTtcbiAgaWYgKHBsYW5CLmxlbmd0aCA+IDApIHtcbiAgICBwYXJ0cyA9IHBsYW5CWzBdLnZhbHVlLnNwbGl0KCcgJyk7XG4gICAgcmV0dXJuIHtzdHJlYW06IHBhcnRzWzBdLCB0cmFjazogcGFydHNbMV19O1xuICB9XG59O1xuXG4vLyBHZW5lcmF0ZSBhIHNlc3Npb24gSUQgZm9yIFNEUC5cbi8vIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9kcmFmdC1pZXRmLXJ0Y3dlYi1qc2VwLTIwI3NlY3Rpb24tNS4yLjFcbi8vIHJlY29tbWVuZHMgdXNpbmcgYSBjcnlwdG9ncmFwaGljYWxseSByYW5kb20gK3ZlIDY0LWJpdCB2YWx1ZVxuLy8gYnV0IHJpZ2h0IG5vdyB0aGlzIHNob3VsZCBiZSBhY2NlcHRhYmxlIGFuZCB3aXRoaW4gdGhlIHJpZ2h0IHJhbmdlXG5TRFBVdGlscy5nZW5lcmF0ZVNlc3Npb25JZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnN1YnN0cigyLCAyMSk7XG59O1xuXG4vLyBXcml0ZSBib2lsZGVyIHBsYXRlIGZvciBzdGFydCBvZiBTRFBcbi8vIHNlc3NJZCBhcmd1bWVudCBpcyBvcHRpb25hbCAtIGlmIG5vdCBzdXBwbGllZCBpdCB3aWxsXG4vLyBiZSBnZW5lcmF0ZWQgcmFuZG9tbHlcbi8vIHNlc3NWZXJzaW9uIGlzIG9wdGlvbmFsIGFuZCBkZWZhdWx0cyB0byAyXG5TRFBVdGlscy53cml0ZVNlc3Npb25Cb2lsZXJwbGF0ZSA9IGZ1bmN0aW9uKHNlc3NJZCwgc2Vzc1Zlcikge1xuICB2YXIgc2Vzc2lvbklkO1xuICB2YXIgdmVyc2lvbiA9IHNlc3NWZXIgIT09IHVuZGVmaW5lZCA/IHNlc3NWZXIgOiAyO1xuICBpZiAoc2Vzc0lkKSB7XG4gICAgc2Vzc2lvbklkID0gc2Vzc0lkO1xuICB9IGVsc2Uge1xuICAgIHNlc3Npb25JZCA9IFNEUFV0aWxzLmdlbmVyYXRlU2Vzc2lvbklkKCk7XG4gIH1cbiAgLy8gRklYTUU6IHNlc3MtaWQgc2hvdWxkIGJlIGFuIE5UUCB0aW1lc3RhbXAuXG4gIHJldHVybiAndj0wXFxyXFxuJyArXG4gICAgICAnbz10aGlzaXNhZGFwdGVyb3J0YyAnICsgc2Vzc2lvbklkICsgJyAnICsgdmVyc2lvbiArICcgSU4gSVA0IDEyNy4wLjAuMVxcclxcbicgK1xuICAgICAgJ3M9LVxcclxcbicgK1xuICAgICAgJ3Q9MCAwXFxyXFxuJztcbn07XG5cblNEUFV0aWxzLndyaXRlTWVkaWFTZWN0aW9uID0gZnVuY3Rpb24odHJhbnNjZWl2ZXIsIGNhcHMsIHR5cGUsIHN0cmVhbSkge1xuICB2YXIgc2RwID0gU0RQVXRpbHMud3JpdGVSdHBEZXNjcmlwdGlvbih0cmFuc2NlaXZlci5raW5kLCBjYXBzKTtcblxuICAvLyBNYXAgSUNFIHBhcmFtZXRlcnMgKHVmcmFnLCBwd2QpIHRvIFNEUC5cbiAgc2RwICs9IFNEUFV0aWxzLndyaXRlSWNlUGFyYW1ldGVycyhcbiAgICAgIHRyYW5zY2VpdmVyLmljZUdhdGhlcmVyLmdldExvY2FsUGFyYW1ldGVycygpKTtcblxuICAvLyBNYXAgRFRMUyBwYXJhbWV0ZXJzIHRvIFNEUC5cbiAgc2RwICs9IFNEUFV0aWxzLndyaXRlRHRsc1BhcmFtZXRlcnMoXG4gICAgICB0cmFuc2NlaXZlci5kdGxzVHJhbnNwb3J0LmdldExvY2FsUGFyYW1ldGVycygpLFxuICAgICAgdHlwZSA9PT0gJ29mZmVyJyA/ICdhY3RwYXNzJyA6ICdhY3RpdmUnKTtcblxuICBzZHAgKz0gJ2E9bWlkOicgKyB0cmFuc2NlaXZlci5taWQgKyAnXFxyXFxuJztcblxuICBpZiAodHJhbnNjZWl2ZXIuZGlyZWN0aW9uKSB7XG4gICAgc2RwICs9ICdhPScgKyB0cmFuc2NlaXZlci5kaXJlY3Rpb24gKyAnXFxyXFxuJztcbiAgfSBlbHNlIGlmICh0cmFuc2NlaXZlci5ydHBTZW5kZXIgJiYgdHJhbnNjZWl2ZXIucnRwUmVjZWl2ZXIpIHtcbiAgICBzZHAgKz0gJ2E9c2VuZHJlY3ZcXHJcXG4nO1xuICB9IGVsc2UgaWYgKHRyYW5zY2VpdmVyLnJ0cFNlbmRlcikge1xuICAgIHNkcCArPSAnYT1zZW5kb25seVxcclxcbic7XG4gIH0gZWxzZSBpZiAodHJhbnNjZWl2ZXIucnRwUmVjZWl2ZXIpIHtcbiAgICBzZHAgKz0gJ2E9cmVjdm9ubHlcXHJcXG4nO1xuICB9IGVsc2Uge1xuICAgIHNkcCArPSAnYT1pbmFjdGl2ZVxcclxcbic7XG4gIH1cblxuICBpZiAodHJhbnNjZWl2ZXIucnRwU2VuZGVyKSB7XG4gICAgLy8gc3BlYy5cbiAgICB2YXIgbXNpZCA9ICdtc2lkOicgKyBzdHJlYW0uaWQgKyAnICcgK1xuICAgICAgICB0cmFuc2NlaXZlci5ydHBTZW5kZXIudHJhY2suaWQgKyAnXFxyXFxuJztcbiAgICBzZHAgKz0gJ2E9JyArIG1zaWQ7XG5cbiAgICAvLyBmb3IgQ2hyb21lLlxuICAgIHNkcCArPSAnYT1zc3JjOicgKyB0cmFuc2NlaXZlci5zZW5kRW5jb2RpbmdQYXJhbWV0ZXJzWzBdLnNzcmMgK1xuICAgICAgICAnICcgKyBtc2lkO1xuICAgIGlmICh0cmFuc2NlaXZlci5zZW5kRW5jb2RpbmdQYXJhbWV0ZXJzWzBdLnJ0eCkge1xuICAgICAgc2RwICs9ICdhPXNzcmM6JyArIHRyYW5zY2VpdmVyLnNlbmRFbmNvZGluZ1BhcmFtZXRlcnNbMF0ucnR4LnNzcmMgK1xuICAgICAgICAgICcgJyArIG1zaWQ7XG4gICAgICBzZHAgKz0gJ2E9c3NyYy1ncm91cDpGSUQgJyArXG4gICAgICAgICAgdHJhbnNjZWl2ZXIuc2VuZEVuY29kaW5nUGFyYW1ldGVyc1swXS5zc3JjICsgJyAnICtcbiAgICAgICAgICB0cmFuc2NlaXZlci5zZW5kRW5jb2RpbmdQYXJhbWV0ZXJzWzBdLnJ0eC5zc3JjICtcbiAgICAgICAgICAnXFxyXFxuJztcbiAgICB9XG4gIH1cbiAgLy8gRklYTUU6IHRoaXMgc2hvdWxkIGJlIHdyaXR0ZW4gYnkgd3JpdGVSdHBEZXNjcmlwdGlvbi5cbiAgc2RwICs9ICdhPXNzcmM6JyArIHRyYW5zY2VpdmVyLnNlbmRFbmNvZGluZ1BhcmFtZXRlcnNbMF0uc3NyYyArXG4gICAgICAnIGNuYW1lOicgKyBTRFBVdGlscy5sb2NhbENOYW1lICsgJ1xcclxcbic7XG4gIGlmICh0cmFuc2NlaXZlci5ydHBTZW5kZXIgJiYgdHJhbnNjZWl2ZXIuc2VuZEVuY29kaW5nUGFyYW1ldGVyc1swXS5ydHgpIHtcbiAgICBzZHAgKz0gJ2E9c3NyYzonICsgdHJhbnNjZWl2ZXIuc2VuZEVuY29kaW5nUGFyYW1ldGVyc1swXS5ydHguc3NyYyArXG4gICAgICAgICcgY25hbWU6JyArIFNEUFV0aWxzLmxvY2FsQ05hbWUgKyAnXFxyXFxuJztcbiAgfVxuICByZXR1cm4gc2RwO1xufTtcblxuLy8gR2V0cyB0aGUgZGlyZWN0aW9uIGZyb20gdGhlIG1lZGlhU2VjdGlvbiBvciB0aGUgc2Vzc2lvbnBhcnQuXG5TRFBVdGlscy5nZXREaXJlY3Rpb24gPSBmdW5jdGlvbihtZWRpYVNlY3Rpb24sIHNlc3Npb25wYXJ0KSB7XG4gIC8vIExvb2sgZm9yIHNlbmRyZWN2LCBzZW5kb25seSwgcmVjdm9ubHksIGluYWN0aXZlLCBkZWZhdWx0IHRvIHNlbmRyZWN2LlxuICB2YXIgbGluZXMgPSBTRFBVdGlscy5zcGxpdExpbmVzKG1lZGlhU2VjdGlvbik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBzd2l0Y2ggKGxpbmVzW2ldKSB7XG4gICAgICBjYXNlICdhPXNlbmRyZWN2JzpcbiAgICAgIGNhc2UgJ2E9c2VuZG9ubHknOlxuICAgICAgY2FzZSAnYT1yZWN2b25seSc6XG4gICAgICBjYXNlICdhPWluYWN0aXZlJzpcbiAgICAgICAgcmV0dXJuIGxpbmVzW2ldLnN1YnN0cigyKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIEZJWE1FOiBXaGF0IHNob3VsZCBoYXBwZW4gaGVyZT9cbiAgICB9XG4gIH1cbiAgaWYgKHNlc3Npb25wYXJ0KSB7XG4gICAgcmV0dXJuIFNEUFV0aWxzLmdldERpcmVjdGlvbihzZXNzaW9ucGFydCk7XG4gIH1cbiAgcmV0dXJuICdzZW5kcmVjdic7XG59O1xuXG5TRFBVdGlscy5nZXRLaW5kID0gZnVuY3Rpb24obWVkaWFTZWN0aW9uKSB7XG4gIHZhciBsaW5lcyA9IFNEUFV0aWxzLnNwbGl0TGluZXMobWVkaWFTZWN0aW9uKTtcbiAgdmFyIG1saW5lID0gbGluZXNbMF0uc3BsaXQoJyAnKTtcbiAgcmV0dXJuIG1saW5lWzBdLnN1YnN0cigyKTtcbn07XG5cblNEUFV0aWxzLmlzUmVqZWN0ZWQgPSBmdW5jdGlvbihtZWRpYVNlY3Rpb24pIHtcbiAgcmV0dXJuIG1lZGlhU2VjdGlvbi5zcGxpdCgnICcsIDIpWzFdID09PSAnMCc7XG59O1xuXG5TRFBVdGlscy5wYXJzZU1MaW5lID0gZnVuY3Rpb24obWVkaWFTZWN0aW9uKSB7XG4gIHZhciBsaW5lcyA9IFNEUFV0aWxzLnNwbGl0TGluZXMobWVkaWFTZWN0aW9uKTtcbiAgdmFyIHBhcnRzID0gbGluZXNbMF0uc3Vic3RyKDIpLnNwbGl0KCcgJyk7XG4gIHJldHVybiB7XG4gICAga2luZDogcGFydHNbMF0sXG4gICAgcG9ydDogcGFyc2VJbnQocGFydHNbMV0sIDEwKSxcbiAgICBwcm90b2NvbDogcGFydHNbMl0sXG4gICAgZm10OiBwYXJ0cy5zbGljZSgzKS5qb2luKCcgJylcbiAgfTtcbn07XG5cblNEUFV0aWxzLnBhcnNlT0xpbmUgPSBmdW5jdGlvbihtZWRpYVNlY3Rpb24pIHtcbiAgdmFyIGxpbmUgPSBTRFBVdGlscy5tYXRjaFByZWZpeChtZWRpYVNlY3Rpb24sICdvPScpWzBdO1xuICB2YXIgcGFydHMgPSBsaW5lLnN1YnN0cigyKS5zcGxpdCgnICcpO1xuICByZXR1cm4ge1xuICAgIHVzZXJuYW1lOiBwYXJ0c1swXSxcbiAgICBzZXNzaW9uSWQ6IHBhcnRzWzFdLFxuICAgIHNlc3Npb25WZXJzaW9uOiBwYXJzZUludChwYXJ0c1syXSwgMTApLFxuICAgIG5ldFR5cGU6IHBhcnRzWzNdLFxuICAgIGFkZHJlc3NUeXBlOiBwYXJ0c1s0XSxcbiAgICBhZGRyZXNzOiBwYXJ0c1s1XSxcbiAgfTtcbn1cblxuLy8gRXhwb3NlIHB1YmxpYyBtZXRob2RzLlxuaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gU0RQVXRpbHM7XG59XG4iLCJ2YXIgbWogPSByZXF1aXJlKFwibWluaWphbnVzXCIpO1xudmFyIHNkcFV0aWxzID0gcmVxdWlyZShcInNkcFwiKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcIm5hZi1qYW51cy1hZGFwdGVyOmRlYnVnXCIpO1xudmFyIHdhcm4gPSByZXF1aXJlKFwiZGVidWdcIikoXCJuYWYtamFudXMtYWRhcHRlcjp3YXJuXCIpO1xudmFyIGVycm9yID0gcmVxdWlyZShcImRlYnVnXCIpKFwibmFmLWphbnVzLWFkYXB0ZXI6ZXJyb3JcIik7XG52YXIgaXNTYWZhcmkgPSAvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xudmFyIGlPUyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICF3aW5kb3cuTVNTdHJlYW07XG5cbmZ1bmN0aW9uIGRlYm91bmNlKGZuKSB7XG4gIHZhciBjdXJyID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgY3VyciA9IGN1cnIudGhlbihfID0+IGZuLmFwcGx5KHRoaXMsIGFyZ3MpKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmFuZG9tVWludCgpIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKTtcbn1cblxuZnVuY3Rpb24gdW50aWxEYXRhQ2hhbm5lbE9wZW4oZGF0YUNoYW5uZWwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBpZiAoZGF0YUNoYW5uZWwucmVhZHlTdGF0ZSA9PT0gXCJvcGVuXCIpIHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHJlc29sdmVyLCByZWplY3RvcjtcblxuICAgICAgY29uc3QgY2xlYXIgPSAoKSA9PiB7XG4gICAgICAgIGRhdGFDaGFubmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsIHJlc29sdmVyKTtcbiAgICAgICAgZGF0YUNoYW5uZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIHJlamVjdG9yKTtcbiAgICAgIH07XG5cbiAgICAgIHJlc29sdmVyID0gKCkgPT4ge1xuICAgICAgICBjbGVhcigpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuICAgICAgcmVqZWN0b3IgPSAoKSA9PiB7XG4gICAgICAgIGNsZWFyKCk7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgfTtcblxuICAgICAgZGF0YUNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgcmVzb2x2ZXIpO1xuICAgICAgZGF0YUNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIHJlamVjdG9yKTtcbiAgICB9XG4gIH0pO1xufVxuXG5jb25zdCBpc0gyNjRWaWRlb1N1cHBvcnRlZCA9ICgoKSA9PiB7XG4gIGNvbnN0IHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInZpZGVvXCIpO1xuICByZXR1cm4gdmlkZW8uY2FuUGxheVR5cGUoJ3ZpZGVvL21wNDsgY29kZWNzPVwiYXZjMS40MkUwMUUsIG1wNGEuNDAuMlwiJykgIT09IFwiXCI7XG59KSgpO1xuXG5jb25zdCBPUFVTX1BBUkFNRVRFUlMgPSB7XG4gIC8vIGluZGljYXRlcyB0aGF0IHdlIHdhbnQgdG8gZW5hYmxlIERUWCB0byBlbGlkZSBzaWxlbmNlIHBhY2tldHNcbiAgdXNlZHR4OiAxLFxuICAvLyBpbmRpY2F0ZXMgdGhhdCB3ZSBwcmVmZXIgdG8gcmVjZWl2ZSBtb25vIGF1ZGlvIChpbXBvcnRhbnQgZm9yIHZvaXAgcHJvZmlsZSlcbiAgc3RlcmVvOiAwLFxuICAvLyBpbmRpY2F0ZXMgdGhhdCB3ZSBwcmVmZXIgdG8gc2VuZCBtb25vIGF1ZGlvIChpbXBvcnRhbnQgZm9yIHZvaXAgcHJvZmlsZSlcbiAgXCJzcHJvcC1zdGVyZW9cIjogMFxufTtcblxuY29uc3QgUEVFUl9DT05ORUNUSU9OX0NPTkZJRyA9IHtcbiAgaWNlU2VydmVyczogW3sgdXJsczogXCJzdHVuOnN0dW4xLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sIHsgdXJsczogXCJzdHVuOnN0dW4yLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH1dXG59O1xuXG5jb25zdCBXU19OT1JNQUxfQ0xPU1VSRSA9IDEwMDA7XG5cbmNsYXNzIEphbnVzQWRhcHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMucm9vbSA9IG51bGw7XG4gICAgLy8gV2UgZXhwZWN0IHRoZSBjb25zdW1lciB0byBzZXQgYSBjbGllbnQgaWQgYmVmb3JlIGNvbm5lY3RpbmcuXG4gICAgdGhpcy5jbGllbnRJZCA9IG51bGw7XG4gICAgdGhpcy5qb2luVG9rZW4gPSBudWxsO1xuXG4gICAgdGhpcy5zZXJ2ZXJVcmwgPSBudWxsO1xuICAgIHRoaXMud2ViUnRjT3B0aW9ucyA9IHt9O1xuICAgIHRoaXMud3MgPSBudWxsO1xuICAgIHRoaXMuc2Vzc2lvbiA9IG51bGw7XG4gICAgdGhpcy5yZWxpYWJsZVRyYW5zcG9ydCA9IFwiZGF0YWNoYW5uZWxcIjtcbiAgICB0aGlzLnVucmVsaWFibGVUcmFuc3BvcnQgPSBcImRhdGFjaGFubmVsXCI7XG5cbiAgICAvLyBJbiB0aGUgZXZlbnQgdGhlIHNlcnZlciByZXN0YXJ0cyBhbmQgYWxsIGNsaWVudHMgbG9zZSBjb25uZWN0aW9uLCByZWNvbm5lY3Qgd2l0aFxuICAgIC8vIHNvbWUgcmFuZG9tIGppdHRlciBhZGRlZCB0byBwcmV2ZW50IHNpbXVsdGFuZW91cyByZWNvbm5lY3Rpb24gcmVxdWVzdHMuXG4gICAgdGhpcy5pbml0aWFsUmVjb25uZWN0aW9uRGVsYXkgPSAxMDAwICogTWF0aC5yYW5kb20oKTtcbiAgICB0aGlzLnJlY29ubmVjdGlvbkRlbGF5ID0gdGhpcy5pbml0aWFsUmVjb25uZWN0aW9uRGVsYXk7XG4gICAgdGhpcy5yZWNvbm5lY3Rpb25UaW1lb3V0ID0gbnVsbDtcbiAgICB0aGlzLm1heFJlY29ubmVjdGlvbkF0dGVtcHRzID0gMTA7XG4gICAgdGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cyA9IDA7XG5cbiAgICB0aGlzLnB1Ymxpc2hlciA9IG51bGw7XG4gICAgdGhpcy5vY2N1cGFudHMgPSB7fTtcbiAgICB0aGlzLmxlZnRPY2N1cGFudHMgPSBuZXcgU2V0KCk7XG4gICAgdGhpcy5tZWRpYVN0cmVhbXMgPSB7fTtcbiAgICB0aGlzLmxvY2FsTWVkaWFTdHJlYW0gPSBudWxsO1xuICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLmZyb3plblVwZGF0ZXMgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLnRpbWVPZmZzZXRzID0gW107XG4gICAgdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPSAwO1xuICAgIHRoaXMuYXZnVGltZU9mZnNldCA9IDA7XG5cbiAgICB0aGlzLm9uV2Vic29ja2V0T3BlbiA9IHRoaXMub25XZWJzb2NrZXRPcGVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbldlYnNvY2tldENsb3NlID0gdGhpcy5vbldlYnNvY2tldENsb3NlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UgPSB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UgPSB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkRhdGEgPSB0aGlzLm9uRGF0YS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgc2V0U2VydmVyVXJsKHVybCkge1xuICAgIHRoaXMuc2VydmVyVXJsID0gdXJsO1xuICB9XG5cbiAgc2V0QXBwKGFwcCkge31cblxuICBzZXRSb29tKHJvb21OYW1lKSB7XG4gICAgdGhpcy5yb29tID0gcm9vbU5hbWU7XG4gIH1cblxuICBzZXRKb2luVG9rZW4oam9pblRva2VuKSB7XG4gICAgdGhpcy5qb2luVG9rZW4gPSBqb2luVG9rZW47XG4gIH1cblxuICBzZXRDbGllbnRJZChjbGllbnRJZCkge1xuICAgIHRoaXMuY2xpZW50SWQgPSBjbGllbnRJZDtcbiAgfVxuXG4gIHNldFdlYlJ0Y09wdGlvbnMob3B0aW9ucykge1xuICAgIHRoaXMud2ViUnRjT3B0aW9ucyA9IG9wdGlvbnM7XG4gIH1cblxuICBzZXRTZXJ2ZXJDb25uZWN0TGlzdGVuZXJzKHN1Y2Nlc3NMaXN0ZW5lciwgZmFpbHVyZUxpc3RlbmVyKSB7XG4gICAgdGhpcy5jb25uZWN0U3VjY2VzcyA9IHN1Y2Nlc3NMaXN0ZW5lcjtcbiAgICB0aGlzLmNvbm5lY3RGYWlsdXJlID0gZmFpbHVyZUxpc3RlbmVyO1xuICB9XG5cbiAgc2V0Um9vbU9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRMaXN0ZW5lcikge1xuICAgIHRoaXMub25PY2N1cGFudHNDaGFuZ2VkID0gb2NjdXBhbnRMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xuICAgIHRoaXMub25PY2N1cGFudENvbm5lY3RlZCA9IG9wZW5MaXN0ZW5lcjtcbiAgICB0aGlzLm9uT2NjdXBhbnREaXNjb25uZWN0ZWQgPSBjbG9zZWRMaXN0ZW5lcjtcbiAgICB0aGlzLm9uT2NjdXBhbnRNZXNzYWdlID0gbWVzc2FnZUxpc3RlbmVyO1xuICB9XG5cbiAgc2V0UmVjb25uZWN0aW9uTGlzdGVuZXJzKHJlY29ubmVjdGluZ0xpc3RlbmVyLCByZWNvbm5lY3RlZExpc3RlbmVyLCByZWNvbm5lY3Rpb25FcnJvckxpc3RlbmVyKSB7XG4gICAgLy8gb25SZWNvbm5lY3RpbmcgaXMgY2FsbGVkIHdpdGggdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdW50aWwgdGhlIG5leHQgcmVjb25uZWN0aW9uIGF0dGVtcHRcbiAgICB0aGlzLm9uUmVjb25uZWN0aW5nID0gcmVjb25uZWN0aW5nTGlzdGVuZXI7XG4gICAgLy8gb25SZWNvbm5lY3RlZCBpcyBjYWxsZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBoYXMgYmVlbiByZWVzdGFibGlzaGVkXG4gICAgdGhpcy5vblJlY29ubmVjdGVkID0gcmVjb25uZWN0ZWRMaXN0ZW5lcjtcbiAgICAvLyBvblJlY29ubmVjdGlvbkVycm9yIGlzIGNhbGxlZCB3aXRoIGFuIGVycm9yIHdoZW4gbWF4UmVjb25uZWN0aW9uQXR0ZW1wdHMgaGFzIGJlZW4gcmVhY2hlZFxuICAgIHRoaXMub25SZWNvbm5lY3Rpb25FcnJvciA9IHJlY29ubmVjdGlvbkVycm9yTGlzdGVuZXI7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIGRlYnVnKGBjb25uZWN0aW5nIHRvICR7dGhpcy5zZXJ2ZXJVcmx9YCk7XG5cbiAgICBjb25zdCB3ZWJzb2NrZXRDb25uZWN0aW9uID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodGhpcy5zZXJ2ZXJVcmwsIFwiamFudXMtcHJvdG9jb2xcIik7XG5cbiAgICAgIHRoaXMuc2Vzc2lvbiA9IG5ldyBtai5KYW51c1Nlc3Npb24odGhpcy53cy5zZW5kLmJpbmQodGhpcy53cykpO1xuXG4gICAgICBsZXQgb25PcGVuO1xuXG4gICAgICBjb25zdCBvbkVycm9yID0gKCkgPT4ge1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKFwiY2xvc2VcIiwgdGhpcy5vbldlYnNvY2tldENsb3NlKTtcbiAgICAgIHRoaXMud3MuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgdGhpcy5vbldlYnNvY2tldE1lc3NhZ2UpO1xuXG4gICAgICBvbk9wZW4gPSAoKSA9PiB7XG4gICAgICAgIHRoaXMud3MucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgb25PcGVuKTtcbiAgICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgb25FcnJvcik7XG4gICAgICAgIHRoaXMub25XZWJzb2NrZXRPcGVuKClcbiAgICAgICAgICAudGhlbihyZXNvbHZlKVxuICAgICAgICAgIC5jYXRjaChyZWplY3QpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy53cy5hZGRFdmVudExpc3RlbmVyKFwib3BlblwiLCBvbk9wZW4pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFt3ZWJzb2NrZXRDb25uZWN0aW9uLCB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKV0pO1xuICB9XG5cbiAgZGlzY29ubmVjdCgpIHtcbiAgICBkZWJ1ZyhgZGlzY29ubmVjdGluZ2ApO1xuXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMucmVjb25uZWN0aW9uVGltZW91dCk7XG5cbiAgICB0aGlzLnJlbW92ZUFsbE9jY3VwYW50cygpO1xuXG4gICAgaWYgKHRoaXMucHVibGlzaGVyKSB7XG4gICAgICAvLyBDbG9zZSB0aGUgcHVibGlzaGVyIHBlZXIgY29ubmVjdGlvbi4gV2hpY2ggYWxzbyBkZXRhY2hlcyB0aGUgcGx1Z2luIGhhbmRsZS5cbiAgICAgIHRoaXMucHVibGlzaGVyLmNvbm4uY2xvc2UoKTtcbiAgICAgIHRoaXMucHVibGlzaGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zZXNzaW9uKSB7XG4gICAgICB0aGlzLnNlc3Npb24uZGlzcG9zZSgpO1xuICAgICAgdGhpcy5zZXNzaW9uID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy53cykge1xuICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKFwib3BlblwiLCB0aGlzLm9uV2Vic29ja2V0T3Blbik7XG4gICAgICB0aGlzLndzLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbG9zZVwiLCB0aGlzLm9uV2Vic29ja2V0Q2xvc2UpO1xuICAgICAgdGhpcy53cy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCB0aGlzLm9uV2Vic29ja2V0TWVzc2FnZSk7XG4gICAgICB0aGlzLndzLmNsb3NlKCk7XG4gICAgICB0aGlzLndzID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBpc0Rpc2Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy53cyA9PT0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIG9uV2Vic29ja2V0T3BlbigpIHtcbiAgICAvLyBDcmVhdGUgdGhlIEphbnVzIFNlc3Npb25cbiAgICBhd2FpdCB0aGlzLnNlc3Npb24uY3JlYXRlKCk7XG5cbiAgICAvLyBBdHRhY2ggdGhlIFNGVSBQbHVnaW4gYW5kIGNyZWF0ZSBhIFJUQ1BlZXJDb25uZWN0aW9uIGZvciB0aGUgcHVibGlzaGVyLlxuICAgIC8vIFRoZSBwdWJsaXNoZXIgc2VuZHMgYXVkaW8gYW5kIG9wZW5zIHR3byBiaWRpcmVjdGlvbmFsIGRhdGEgY2hhbm5lbHMuXG4gICAgLy8gT25lIHJlbGlhYmxlIGRhdGFjaGFubmVsIGFuZCBvbmUgdW5yZWxpYWJsZS5cbiAgICB0aGlzLnB1Ymxpc2hlciA9IGF3YWl0IHRoaXMuY3JlYXRlUHVibGlzaGVyKCk7XG5cbiAgICAvLyBDYWxsIHRoZSBuYWYgY29ubmVjdFN1Y2Nlc3MgY2FsbGJhY2sgYmVmb3JlIHdlIHN0YXJ0IHJlY2VpdmluZyBXZWJSVEMgbWVzc2FnZXMuXG4gICAgdGhpcy5jb25uZWN0U3VjY2Vzcyh0aGlzLmNsaWVudElkKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJsaXNoZXIuaW5pdGlhbE9jY3VwYW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgYXdhaXQgdGhpcy5hZGRPY2N1cGFudCh0aGlzLnB1Ymxpc2hlci5pbml0aWFsT2NjdXBhbnRzW2ldKTtcbiAgICB9XG4gIH1cblxuICBvbldlYnNvY2tldENsb3NlKGV2ZW50KSB7XG4gICAgLy8gVGhlIGNvbm5lY3Rpb24gd2FzIGNsb3NlZCBzdWNjZXNzZnVsbHkuIERvbid0IHRyeSB0byByZWNvbm5lY3QuXG4gICAgaWYgKGV2ZW50LmNvZGUgPT09IFdTX05PUk1BTF9DTE9TVVJFKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub25SZWNvbm5lY3RpbmcpIHtcbiAgICAgIHRoaXMub25SZWNvbm5lY3RpbmcodGhpcy5yZWNvbm5lY3Rpb25EZWxheSk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvbm5lY3Rpb25UaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlY29ubmVjdCgpLCB0aGlzLnJlY29ubmVjdGlvbkRlbGF5KTtcbiAgfVxuXG4gIHJlY29ubmVjdCgpIHtcbiAgICAvLyBEaXNwb3NlIG9mIGFsbCBuZXR3b3JrZWQgZW50aXRpZXMgYW5kIG90aGVyIHJlc291cmNlcyB0aWVkIHRvIHRoZSBzZXNzaW9uLlxuICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuXG4gICAgdGhpcy5jb25uZWN0KClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25EZWxheSA9IHRoaXMuaW5pdGlhbFJlY29ubmVjdGlvbkRlbGF5O1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkF0dGVtcHRzID0gMDtcblxuICAgICAgICBpZiAodGhpcy5vblJlY29ubmVjdGVkKSB7XG4gICAgICAgICAgdGhpcy5vblJlY29ubmVjdGVkKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkRlbGF5ICs9IDEwMDA7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uQXR0ZW1wdHMrKztcblxuICAgICAgICBpZiAodGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cyA+IHRoaXMubWF4UmVjb25uZWN0aW9uQXR0ZW1wdHMgJiYgdGhpcy5vblJlY29ubmVjdGlvbkVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMub25SZWNvbm5lY3Rpb25FcnJvcihcbiAgICAgICAgICAgIG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gY291bGQgbm90IGJlIHJlZXN0YWJsaXNoZWQsIGV4Y2VlZGVkIG1heGltdW0gbnVtYmVyIG9mIHJlY29ubmVjdGlvbiBhdHRlbXB0cy5cIilcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub25SZWNvbm5lY3RpbmcpIHtcbiAgICAgICAgICB0aGlzLm9uUmVjb25uZWN0aW5nKHRoaXMucmVjb25uZWN0aW9uRGVsYXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25UaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlY29ubmVjdCgpLCB0aGlzLnJlY29ubmVjdGlvbkRlbGF5KTtcbiAgICAgIH0pO1xuICB9XG5cbiAgb25XZWJzb2NrZXRNZXNzYWdlKGV2ZW50KSB7XG4gICAgdGhpcy5zZXNzaW9uLnJlY2VpdmUoSlNPTi5wYXJzZShldmVudC5kYXRhKSk7XG4gIH1cblxuICBhc3luYyBhZGRPY2N1cGFudChvY2N1cGFudElkKSB7XG4gICAgdmFyIHN1YnNjcmliZXIgPSBhd2FpdCB0aGlzLmNyZWF0ZVN1YnNjcmliZXIob2NjdXBhbnRJZCk7XG5cbiAgICBpZiAoIXN1YnNjcmliZXIpIHJldHVybjtcblxuICAgIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdID0gc3Vic2NyaWJlcjtcblxuICAgIHRoaXMuc2V0TWVkaWFTdHJlYW0ob2NjdXBhbnRJZCwgc3Vic2NyaWJlci5tZWRpYVN0cmVhbSk7XG5cbiAgICAvLyBDYWxsIHRoZSBOZXR3b3JrZWQgQUZyYW1lIGNhbGxiYWNrcyBmb3IgdGhlIG5ldyBvY2N1cGFudC5cbiAgICB0aGlzLm9uT2NjdXBhbnRDb25uZWN0ZWQob2NjdXBhbnRJZCk7XG4gICAgdGhpcy5vbk9jY3VwYW50c0NoYW5nZWQodGhpcy5vY2N1cGFudHMpO1xuXG4gICAgcmV0dXJuIHN1YnNjcmliZXI7XG4gIH1cblxuICByZW1vdmVBbGxPY2N1cGFudHMoKSB7XG4gICAgZm9yIChjb25zdCBvY2N1cGFudElkIG9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMub2NjdXBhbnRzKSkge1xuICAgICAgdGhpcy5yZW1vdmVPY2N1cGFudChvY2N1cGFudElkKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVPY2N1cGFudChvY2N1cGFudElkKSB7XG4gICAgdGhpcy5sZWZ0T2NjdXBhbnRzLmFkZChvY2N1cGFudElkKTtcblxuICAgIGlmICh0aGlzLm9jY3VwYW50c1tvY2N1cGFudElkXSkge1xuICAgICAgLy8gQ2xvc2UgdGhlIHN1YnNjcmliZXIgcGVlciBjb25uZWN0aW9uLiBXaGljaCBhbHNvIGRldGFjaGVzIHRoZSBwbHVnaW4gaGFuZGxlLlxuICAgICAgaWYgKHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdKSB7XG4gICAgICAgIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdLmNvbm4uY2xvc2UoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMub2NjdXBhbnRzW29jY3VwYW50SWRdO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5tZWRpYVN0cmVhbXNbb2NjdXBhbnRJZF0pIHtcbiAgICAgICAgZGVsZXRlIHRoaXMubWVkaWFTdHJlYW1zW29jY3VwYW50SWRdO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5oYXMob2NjdXBhbnRJZCkpIHtcbiAgICAgICAgY29uc3QgbXNnID0gXCJUaGUgdXNlciBkaXNjb25uZWN0ZWQgYmVmb3JlIHRoZSBtZWRpYSBzdHJlYW0gd2FzIHJlc29sdmVkLlwiO1xuICAgICAgICB0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmdldChvY2N1cGFudElkKS5hdWRpby5yZWplY3QobXNnKTtcbiAgICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQob2NjdXBhbnRJZCkudmlkZW8ucmVqZWN0KG1zZyk7XG4gICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZGVsZXRlKG9jY3VwYW50SWQpO1xuICAgICAgfVxuXG4gICAgICAvLyBDYWxsIHRoZSBOZXR3b3JrZWQgQUZyYW1lIGNhbGxiYWNrcyBmb3IgdGhlIHJlbW92ZWQgb2NjdXBhbnQuXG4gICAgICB0aGlzLm9uT2NjdXBhbnREaXNjb25uZWN0ZWQob2NjdXBhbnRJZCk7XG4gICAgICB0aGlzLm9uT2NjdXBhbnRzQ2hhbmdlZCh0aGlzLm9jY3VwYW50cyk7XG4gICAgfVxuICB9XG5cbiAgYXNzb2NpYXRlKGNvbm4sIGhhbmRsZSkge1xuICAgIGNvbm4uYWRkRXZlbnRMaXN0ZW5lcihcImljZWNhbmRpZGF0ZVwiLCBldiA9PiB7XG4gICAgICBoYW5kbGUuc2VuZFRyaWNrbGUoZXYuY2FuZGlkYXRlIHx8IG51bGwpLmNhdGNoKGUgPT4gZXJyb3IoXCJFcnJvciB0cmlja2xpbmcgSUNFOiAlb1wiLCBlKSk7XG4gICAgfSk7XG5cbiAgICAvLyB3ZSBoYXZlIHRvIGRlYm91bmNlIHRoZXNlIGJlY2F1c2UgamFudXMgZ2V0cyBhbmdyeSBpZiB5b3Ugc2VuZCBpdCBhIG5ldyBTRFAgYmVmb3JlXG4gICAgLy8gaXQncyBmaW5pc2hlZCBwcm9jZXNzaW5nIGFuIGV4aXN0aW5nIFNEUC4gaW4gYWN0dWFsaXR5LCBpdCBzZWVtcyBsaWtlIHRoaXMgaXMgbWF5YmVcbiAgICAvLyB0b28gbGliZXJhbCBhbmQgd2UgbmVlZCB0byB3YWl0IHNvbWUgYW1vdW50IG9mIHRpbWUgYWZ0ZXIgYW4gb2ZmZXIgYmVmb3JlIHNlbmRpbmcgYW5vdGhlcixcbiAgICAvLyBidXQgd2UgZG9uJ3QgY3VycmVudGx5IGtub3cgYW55IGdvb2Qgd2F5IG9mIGRldGVjdGluZyBleGFjdGx5IGhvdyBsb25nIDooXG4gICAgY29ubi5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgXCJuZWdvdGlhdGlvbm5lZWRlZFwiLFxuICAgICAgZGVib3VuY2UoZXYgPT4ge1xuICAgICAgICBkZWJ1ZyhcIlNlbmRpbmcgbmV3IG9mZmVyIGZvciBoYW5kbGU6ICVvXCIsIGhhbmRsZSk7XG4gICAgICAgIHZhciBvZmZlciA9IGNvbm4uY3JlYXRlT2ZmZXIoKS50aGVuKHRoaXMuY29uZmlndXJlUHVibGlzaGVyU2RwKTtcbiAgICAgICAgdmFyIGxvY2FsID0gb2ZmZXIudGhlbihvID0+IGNvbm4uc2V0TG9jYWxEZXNjcmlwdGlvbihvKSk7XG4gICAgICAgIHZhciByZW1vdGUgPSBvZmZlcjtcblxuICAgICAgICBpZiAoaXNTYWZhcmkgJiYgaU9TKSB7XG4gICAgICAgICAgLy8gT24gU2FmYXJpLCBXZWJSVEMgbmVnb3RpYXRpb24gZmFpbHMgZWFzaWx5IGlmIHdlIGRvIG5vdCBwYXVzZSBiZWZvcmUgc2VuZGluZ1xuICAgICAgICAgIC8vIGEgbmV3IG9mZmVyIHRvIEphbnVzIGhlcmUuXG4gICAgICAgICAgcmVtb3RlID0gcmVtb3RlLnRoZW4obyA9PiBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQoKCkgPT4gcihvKSwgNTAwMCkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlbW90ZSA9IHJlbW90ZS50aGVuKGogPT4gaGFuZGxlLnNlbmRKc2VwKGopKS50aGVuKHIgPT4gY29ubi5zZXRSZW1vdGVEZXNjcmlwdGlvbihyLmpzZXApKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFtsb2NhbCwgcmVtb3RlXSkuY2F0Y2goZSA9PiBlcnJvcihcIkVycm9yIG5lZ290aWF0aW5nIG9mZmVyOiAlb1wiLCBlKSk7XG4gICAgICB9KVxuICAgICk7XG4gICAgaGFuZGxlLm9uKFxuICAgICAgXCJldmVudFwiLFxuICAgICAgZGVib3VuY2UoZXYgPT4ge1xuICAgICAgICB2YXIganNlcCA9IGV2LmpzZXA7XG4gICAgICAgIGlmIChqc2VwICYmIGpzZXAudHlwZSA9PSBcIm9mZmVyXCIpIHtcbiAgICAgICAgICBkZWJ1ZyhcIkFjY2VwdGluZyBuZXcgb2ZmZXIgZm9yIGhhbmRsZTogJW9cIiwgaGFuZGxlKTtcbiAgICAgICAgICB2YXIgYW5zd2VyID0gY29ubi5zZXRSZW1vdGVEZXNjcmlwdGlvbih0aGlzLmNvbmZpZ3VyZVN1YnNjcmliZXJTZHAoanNlcCkpLnRoZW4oXyA9PiBjb25uLmNyZWF0ZUFuc3dlcigpKTtcbiAgICAgICAgICB2YXIgbG9jYWwgPSBhbnN3ZXIudGhlbihhID0+IGNvbm4uc2V0TG9jYWxEZXNjcmlwdGlvbihhKSk7XG4gICAgICAgICAgdmFyIHJlbW90ZSA9IGFuc3dlci50aGVuKGogPT4gaGFuZGxlLnNlbmRKc2VwKGopKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoW2xvY2FsLCByZW1vdGVdKS5jYXRjaChlID0+IGVycm9yKFwiRXJyb3IgbmVnb3RpYXRpbmcgYW5zd2VyOiAlb1wiLCBlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc29tZSBvdGhlciBraW5kIG9mIGV2ZW50LCBub3RoaW5nIHRvIGRvXG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVB1Ymxpc2hlcigpIHtcbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XG4gICAgdmFyIGNvbm4gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XG5cbiAgICBkZWJ1ZyhcInB1YiB3YWl0aW5nIGZvciBzZnVcIik7XG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XG5cbiAgICB0aGlzLmFzc29jaWF0ZShjb25uLCBoYW5kbGUpO1xuXG4gICAgZGVidWcoXCJwdWIgd2FpdGluZyBmb3IgZGF0YSBjaGFubmVscyAmIHdlYnJ0Y3VwXCIpO1xuICAgIHZhciB3ZWJydGN1cCA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gaGFuZGxlLm9uKFwid2VicnRjdXBcIiwgcmVzb2x2ZSkpO1xuXG4gICAgLy8gVW5yZWxpYWJsZSBkYXRhY2hhbm5lbDogc2VuZGluZyBhbmQgcmVjZWl2aW5nIGNvbXBvbmVudCB1cGRhdGVzLlxuICAgIC8vIFJlbGlhYmxlIGRhdGFjaGFubmVsOiBzZW5kaW5nIGFuZCByZWNpZXZpbmcgZW50aXR5IGluc3RhbnRpYXRpb25zLlxuICAgIHZhciByZWxpYWJsZUNoYW5uZWwgPSBjb25uLmNyZWF0ZURhdGFDaGFubmVsKFwicmVsaWFibGVcIiwgeyBvcmRlcmVkOiB0cnVlIH0pO1xuICAgIHZhciB1bnJlbGlhYmxlQ2hhbm5lbCA9IGNvbm4uY3JlYXRlRGF0YUNoYW5uZWwoXCJ1bnJlbGlhYmxlXCIsIHtcbiAgICAgIG9yZGVyZWQ6IGZhbHNlLFxuICAgICAgbWF4UmV0cmFuc21pdHM6IDBcbiAgICB9KTtcblxuICAgIHJlbGlhYmxlQ2hhbm5lbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBlID0+IHRoaXMub25EYXRhQ2hhbm5lbE1lc3NhZ2UoZSwgXCJqYW51cy1yZWxpYWJsZVwiKSk7XG4gICAgdW5yZWxpYWJsZUNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZSA9PiB0aGlzLm9uRGF0YUNoYW5uZWxNZXNzYWdlKGUsIFwiamFudXMtdW5yZWxpYWJsZVwiKSk7XG5cbiAgICBhd2FpdCB3ZWJydGN1cDtcbiAgICBhd2FpdCB1bnRpbERhdGFDaGFubmVsT3BlbihyZWxpYWJsZUNoYW5uZWwpO1xuICAgIGF3YWl0IHVudGlsRGF0YUNoYW5uZWxPcGVuKHVucmVsaWFibGVDaGFubmVsKTtcblxuICAgIC8vIGRvaW5nIHRoaXMgaGVyZSBpcyBzb3J0IG9mIGEgaGFjayBhcm91bmQgY2hyb21lIHJlbmVnb3RpYXRpb24gd2VpcmRuZXNzIC0tXG4gICAgLy8gaWYgd2UgZG8gaXQgcHJpb3IgdG8gd2VicnRjdXAsIGNocm9tZSBvbiBnZWFyIFZSIHdpbGwgc29tZXRpbWVzIHB1dCBhXG4gICAgLy8gcmVuZWdvdGlhdGlvbiBvZmZlciBpbiBmbGlnaHQgd2hpbGUgdGhlIGZpcnN0IG9mZmVyIHdhcyBzdGlsbCBiZWluZ1xuICAgIC8vIHByb2Nlc3NlZCBieSBqYW51cy4gd2Ugc2hvdWxkIGZpbmQgc29tZSBtb3JlIHByaW5jaXBsZWQgd2F5IHRvIGZpZ3VyZSBvdXRcbiAgICAvLyB3aGVuIGphbnVzIGlzIGRvbmUgaW4gdGhlIGZ1dHVyZS5cbiAgICBpZiAodGhpcy5sb2NhbE1lZGlhU3RyZWFtKSB7XG4gICAgICB0aGlzLmxvY2FsTWVkaWFTdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiB7XG4gICAgICAgIGNvbm4uYWRkVHJhY2sodHJhY2ssIHRoaXMubG9jYWxNZWRpYVN0cmVhbSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgYWxsIG9mIHRoZSBqb2luIGFuZCBsZWF2ZSBldmVudHMuXG4gICAgaGFuZGxlLm9uKFwiZXZlbnRcIiwgZXYgPT4ge1xuICAgICAgdmFyIGRhdGEgPSBldi5wbHVnaW5kYXRhLmRhdGE7XG4gICAgICBpZiAoZGF0YS5ldmVudCA9PSBcImpvaW5cIiAmJiBkYXRhLnJvb21faWQgPT0gdGhpcy5yb29tKSB7XG4gICAgICAgIHRoaXMuYWRkT2NjdXBhbnQoZGF0YS51c2VyX2lkKTtcbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5ldmVudCA9PSBcImxlYXZlXCIgJiYgZGF0YS5yb29tX2lkID09IHRoaXMucm9vbSkge1xuICAgICAgICB0aGlzLnJlbW92ZU9jY3VwYW50KGRhdGEudXNlcl9pZCk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGEuZXZlbnQgPT0gXCJibG9ja2VkXCIpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImJsb2NrZWRcIiwgeyBkZXRhaWw6IHsgY2xpZW50SWQ6IGRhdGEuYnkgfSB9KSk7XG4gICAgICB9IGVsc2UgaWYgKGRhdGEuZXZlbnQgPT0gXCJ1bmJsb2NrZWRcIikge1xuICAgICAgICBkb2N1bWVudC5ib2R5LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidW5ibG9ja2VkXCIsIHsgZGV0YWlsOiB7IGNsaWVudElkOiBkYXRhLmJ5IH0gfSkpO1xuICAgICAgfSBlbHNlIGlmIChkYXRhLmV2ZW50ID09PSBcImRhdGFcIikge1xuICAgICAgICB0aGlzLm9uRGF0YShKU09OLnBhcnNlKGRhdGEuYm9keSksIFwiamFudXMtZXZlbnRcIik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBkZWJ1ZyhcInB1YiB3YWl0aW5nIGZvciBqb2luXCIpO1xuXG4gICAgLy8gU2VuZCBqb2luIG1lc3NhZ2UgdG8gamFudXMuIExpc3RlbiBmb3Igam9pbi9sZWF2ZSBtZXNzYWdlcy4gQXV0b21hdGljYWxseSBzdWJzY3JpYmUgdG8gYWxsIHVzZXJzJyBXZWJSVEMgZGF0YS5cbiAgICB2YXIgbWVzc2FnZSA9IGF3YWl0IHRoaXMuc2VuZEpvaW4oaGFuZGxlLCB7XG4gICAgICBub3RpZmljYXRpb25zOiB0cnVlLFxuICAgICAgZGF0YTogdHJ1ZVxuICAgIH0pO1xuXG4gICAgaWYgKCFtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YS5zdWNjZXNzKSB7XG4gICAgICBjb25zdCBlcnIgPSBtZXNzYWdlLnBsdWdpbmRhdGEuZGF0YS5lcnJvcjtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICB2YXIgaW5pdGlhbE9jY3VwYW50cyA9IG1lc3NhZ2UucGx1Z2luZGF0YS5kYXRhLnJlc3BvbnNlLnVzZXJzW3RoaXMucm9vbV0gfHwgW107XG5cbiAgICBkZWJ1ZyhcInB1Ymxpc2hlciByZWFkeVwiKTtcbiAgICByZXR1cm4ge1xuICAgICAgaGFuZGxlLFxuICAgICAgaW5pdGlhbE9jY3VwYW50cyxcbiAgICAgIHJlbGlhYmxlQ2hhbm5lbCxcbiAgICAgIHVucmVsaWFibGVDaGFubmVsLFxuICAgICAgY29ublxuICAgIH07XG4gIH1cblxuICBjb25maWd1cmVQdWJsaXNoZXJTZHAoanNlcCkge1xuICAgIGpzZXAuc2RwID0ganNlcC5zZHAucmVwbGFjZSgvYT1mbXRwOigxMDl8MTExKS4qXFxyXFxuL2csIChsaW5lLCBwdCkgPT4ge1xuICAgICAgY29uc3QgcGFyYW1ldGVycyA9IE9iamVjdC5hc3NpZ24oc2RwVXRpbHMucGFyc2VGbXRwKGxpbmUpLCBPUFVTX1BBUkFNRVRFUlMpO1xuICAgICAgcmV0dXJuIHNkcFV0aWxzLndyaXRlRm10cCh7IHBheWxvYWRUeXBlOiBwdCwgcGFyYW1ldGVyczogcGFyYW1ldGVycyB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4ganNlcDtcbiAgfVxuXG4gIGNvbmZpZ3VyZVN1YnNjcmliZXJTZHAoanNlcCkge1xuICAgIC8vIHRvZG86IGNvbnNpZGVyIGNsZWFuaW5nIHVwIHRoZXNlIGhhY2tzIHRvIHVzZSBzZHB1dGlsc1xuICAgIGlmICghaXNIMjY0VmlkZW9TdXBwb3J0ZWQpIHtcbiAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJIZWFkbGVzc0Nocm9tZVwiKSAhPT0gLTEpIHtcbiAgICAgICAgLy8gSGVhZGxlc3NDaHJvbWUgKGUuZy4gcHVwcGV0ZWVyKSBkb2Vzbid0IHN1cHBvcnQgd2VicnRjIHZpZGVvIHN0cmVhbXMsIHNvIHdlIHJlbW92ZSB0aG9zZSBsaW5lcyBmcm9tIHRoZSBTRFAuXG4gICAgICAgIGpzZXAuc2RwID0ganNlcC5zZHAucmVwbGFjZSgvbT12aWRlb1teXSptPS8sIFwibT1cIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzogSGFjayB0byBnZXQgdmlkZW8gd29ya2luZyBvbiBDaHJvbWUgZm9yIEFuZHJvaWQuIGh0dHBzOi8vZ3JvdXBzLmdvb2dsZS5jb20vZm9ydW0vIyF0b3BpYy9tb3ppbGxhLmRldi5tZWRpYS9ZZTI5dnVNVHBvOFxuICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJBbmRyb2lkXCIpID09PSAtMSkge1xuICAgICAganNlcC5zZHAgPSBqc2VwLnNkcC5yZXBsYWNlKFxuICAgICAgICBcImE9cnRjcC1mYjoxMDcgZ29vZy1yZW1iXFxyXFxuXCIsXG4gICAgICAgIFwiYT1ydGNwLWZiOjEwNyBnb29nLXJlbWJcXHJcXG5hPXJ0Y3AtZmI6MTA3IHRyYW5zcG9ydC1jY1xcclxcbmE9Zm10cDoxMDcgbGV2ZWwtYXN5bW1ldHJ5LWFsbG93ZWQ9MTtwYWNrZXRpemF0aW9uLW1vZGU9MTtwcm9maWxlLWxldmVsLWlkPTQyZTAxZlxcclxcblwiXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBqc2VwLnNkcCA9IGpzZXAuc2RwLnJlcGxhY2UoXG4gICAgICAgIFwiYT1ydGNwLWZiOjEwNyBnb29nLXJlbWJcXHJcXG5cIixcbiAgICAgICAgXCJhPXJ0Y3AtZmI6MTA3IGdvb2ctcmVtYlxcclxcbmE9cnRjcC1mYjoxMDcgdHJhbnNwb3J0LWNjXFxyXFxuYT1mbXRwOjEwNyBsZXZlbC1hc3ltbWV0cnktYWxsb3dlZD0xO3BhY2tldGl6YXRpb24tbW9kZT0xO3Byb2ZpbGUtbGV2ZWwtaWQ9NDIwMDFmXFxyXFxuXCJcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBqc2VwO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlU3Vic2NyaWJlcihvY2N1cGFudElkKSB7XG4gICAgaWYgKHRoaXMubGVmdE9jY3VwYW50cy5oYXMob2NjdXBhbnRJZCkpIHtcbiAgICAgIGNvbnNvbGUud2FybihvY2N1cGFudElkICsgXCI6IGNhbmNlbGxlZCBvY2N1cGFudCBjb25uZWN0aW9uLCBvY2N1cGFudCBsZWZ0IGJlZm9yZSBzdWJzY3JpcHRpb24gbmVnb3RhdGlvbi5cIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgaGFuZGxlID0gbmV3IG1qLkphbnVzUGx1Z2luSGFuZGxlKHRoaXMuc2Vzc2lvbik7XG4gICAgdmFyIGNvbm4gPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oUEVFUl9DT05ORUNUSU9OX0NPTkZJRyk7XG5cbiAgICBkZWJ1ZyhvY2N1cGFudElkICsgXCI6IHN1YiB3YWl0aW5nIGZvciBzZnVcIik7XG4gICAgYXdhaXQgaGFuZGxlLmF0dGFjaChcImphbnVzLnBsdWdpbi5zZnVcIik7XG5cbiAgICB0aGlzLmFzc29jaWF0ZShjb25uLCBoYW5kbGUpO1xuXG4gICAgZGVidWcob2NjdXBhbnRJZCArIFwiOiBzdWIgd2FpdGluZyBmb3Igam9pblwiKTtcblxuICAgIGlmICh0aGlzLmxlZnRPY2N1cGFudHMuaGFzKG9jY3VwYW50SWQpKSB7XG4gICAgICBjb25uLmNsb3NlKCk7XG4gICAgICBjb25zb2xlLndhcm4ob2NjdXBhbnRJZCArIFwiOiBjYW5jZWxsZWQgb2NjdXBhbnQgY29ubmVjdGlvbiwgb2NjdXBhbnQgbGVmdCBhZnRlciBhdHRhY2hcIik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBTZW5kIGpvaW4gbWVzc2FnZSB0byBqYW51cy4gRG9uJ3QgbGlzdGVuIGZvciBqb2luL2xlYXZlIG1lc3NhZ2VzLiBTdWJzY3JpYmUgdG8gdGhlIG9jY3VwYW50J3MgbWVkaWEuXG4gICAgLy8gSmFudXMgc2hvdWxkIHNlbmQgdXMgYW4gb2ZmZXIgZm9yIHRoaXMgb2NjdXBhbnQncyBtZWRpYSBpbiByZXNwb25zZSB0byB0aGlzLlxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLnNlbmRKb2luKGhhbmRsZSwgeyBtZWRpYTogb2NjdXBhbnRJZCB9KTtcblxuICAgIGlmICh0aGlzLmxlZnRPY2N1cGFudHMuaGFzKG9jY3VwYW50SWQpKSB7XG4gICAgICBjb25uLmNsb3NlKCk7XG4gICAgICBjb25zb2xlLndhcm4ob2NjdXBhbnRJZCArIFwiOiBjYW5jZWxsZWQgb2NjdXBhbnQgY29ubmVjdGlvbiwgb2NjdXBhbnQgbGVmdCBhZnRlciBqb2luXCIpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZGVidWcob2NjdXBhbnRJZCArIFwiOiBzdWIgd2FpdGluZyBmb3Igd2VicnRjdXBcIik7XG5cbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5sZWZ0T2NjdXBhbnRzLmhhcyhvY2N1cGFudElkKSkge1xuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSwgMTAwMCk7XG5cbiAgICAgIGhhbmRsZS5vbihcIndlYnJ0Y3VwXCIsICgpID0+IHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMubGVmdE9jY3VwYW50cy5oYXMob2NjdXBhbnRJZCkpIHtcbiAgICAgIGNvbm4uY2xvc2UoKTtcbiAgICAgIGNvbnNvbGUud2FybihvY2N1cGFudElkICsgXCI6IGNhbmNlbCBvY2N1cGFudCBjb25uZWN0aW9uLCBvY2N1cGFudCBsZWZ0IGR1cmluZyBvciBhZnRlciB3ZWJydGN1cFwiKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBtZWRpYVN0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xuICAgIHZhciByZWNlaXZlcnMgPSBjb25uLmdldFJlY2VpdmVycygpO1xuICAgIHJlY2VpdmVycy5mb3JFYWNoKHJlY2VpdmVyID0+IHtcbiAgICAgIGlmIChyZWNlaXZlci50cmFjaykge1xuICAgICAgICBtZWRpYVN0cmVhbS5hZGRUcmFjayhyZWNlaXZlci50cmFjayk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKG1lZGlhU3RyZWFtLmdldFRyYWNrcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbWVkaWFTdHJlYW0gPSBudWxsO1xuICAgIH1cblxuICAgIGRlYnVnKG9jY3VwYW50SWQgKyBcIjogc3Vic2NyaWJlciByZWFkeVwiKTtcbiAgICByZXR1cm4ge1xuICAgICAgaGFuZGxlLFxuICAgICAgbWVkaWFTdHJlYW0sXG4gICAgICBjb25uXG4gICAgfTtcbiAgfVxuXG4gIHNlbmRKb2luKGhhbmRsZSwgc3Vic2NyaWJlKSB7XG4gICAgcmV0dXJuIGhhbmRsZS5zZW5kTWVzc2FnZSh7XG4gICAgICBraW5kOiBcImpvaW5cIixcbiAgICAgIHJvb21faWQ6IHRoaXMucm9vbSxcbiAgICAgIHVzZXJfaWQ6IHRoaXMuY2xpZW50SWQsXG4gICAgICBzdWJzY3JpYmUsXG4gICAgICB0b2tlbjogdGhpcy5qb2luVG9rZW5cbiAgICB9KTtcbiAgfVxuXG4gIHRvZ2dsZUZyZWV6ZSgpIHtcbiAgICBpZiAodGhpcy5mcm96ZW4pIHtcbiAgICAgIHRoaXMudW5mcmVlemUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5mcmVlemUoKTtcbiAgICB9XG4gIH1cblxuICBmcmVlemUoKSB7XG4gICAgdGhpcy5mcm96ZW4gPSB0cnVlO1xuICB9XG5cbiAgdW5mcmVlemUoKSB7XG4gICAgdGhpcy5mcm96ZW4gPSBmYWxzZTtcbiAgICB0aGlzLmZsdXNoUGVuZGluZ1VwZGF0ZXMoKTtcbiAgfVxuXG4gIGRhdGFGb3JVcGRhdGVNdWx0aU1lc3NhZ2UobmV0d29ya0lkLCBtZXNzYWdlKSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBtZXNzYWdlLmRhdGEuZC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBtZXNzYWdlLmRhdGEuZFtpXTtcblxuICAgICAgaWYgKGRhdGEubmV0d29ya0lkID09PSBuZXR3b3JrSWQpIHtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmbHVzaFBlbmRpbmdVcGRhdGVzKCkge1xuICAgIGZvciAoY29uc3QgW25ldHdvcmtJZCwgbWVzc2FnZV0gb2YgdGhpcy5mcm96ZW5VcGRhdGVzKSB7XG4gICAgICBsZXQgZGF0YTtcbiAgICAgIGxldCBkYXRhVHlwZTtcblxuICAgICAgaWYgKG1lc3NhZ2UuZGF0YVR5cGUgPT09IFwidW1cIikge1xuICAgICAgICBkYXRhID0gdGhpcy5kYXRhRm9yVXBkYXRlTXVsdGlNZXNzYWdlKG5ldHdvcmtJZCwgbWVzc2FnZSk7XG4gICAgICAgIGRhdGFUeXBlID0gXCJ1XCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkYXRhVHlwZSA9IG1lc3NhZ2UuZGF0YVR5cGU7XG4gICAgICAgIGRhdGEgPSBtZXNzYWdlLmRhdGE7XG4gICAgICB9XG5cbiAgICAgIC8vIGlnbm9yZSBtZXNzYWdlcyByZWxhdGluZyB0byB1c2VycyB3aG8gaGF2ZSBkaXNjb25uZWN0ZWQgc2luY2UgZnJlZXppbmcsIHRoZWlyIGVudGl0aWVzIHdpbGwgaGF2ZSBhbGVhZHkgYmVlbiByZW1vdmVkIGJ5IE5BRlxuICAgICAgLy8gbm90ZSB0aGF0IGRlbGV0ZSBtZXNzYWdlcyBoYXZlIG5vIFwib3duZXJcIiBzbyB3ZSBoYXZlIHRvIGNoZWNrIGZvciB0aGF0IGFzIHdlbGxcbiAgICAgIGlmIChkYXRhLm93bmVyICYmICF0aGlzLm9jY3VwYW50c1tkYXRhLm93bmVyXSkgY29udGludWU7XG5cbiAgICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UobnVsbCwgZGF0YVR5cGUsIGRhdGEsIG1lc3NhZ2Uuc291cmNlKTtcbiAgICB9XG4gICAgdGhpcy5mcm96ZW5VcGRhdGVzLmNsZWFyKCk7XG4gIH1cblxuICBzdG9yZU1lc3NhZ2UobWVzc2FnZSkge1xuICAgIGlmIChtZXNzYWdlLmRhdGFUeXBlID09PSBcInVtXCIpIHsgLy8gVXBkYXRlTXVsdGlcbiAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gbWVzc2FnZS5kYXRhLmQubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRoaXMuc3RvcmVTaW5nbGVNZXNzYWdlKG1lc3NhZ2UsIGkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0b3JlU2luZ2xlTWVzc2FnZShtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICBzdG9yZVNpbmdsZU1lc3NhZ2UobWVzc2FnZSwgaW5kZXgpIHtcbiAgICBjb25zdCBkYXRhID0gaW5kZXggIT09IHVuZGVmaW5lZCA/IG1lc3NhZ2UuZGF0YS5kW2luZGV4XSA6IG1lc3NhZ2UuZGF0YTtcbiAgICBjb25zdCBkYXRhVHlwZSA9IG1lc3NhZ2UuZGF0YVR5cGU7XG4gICAgY29uc3Qgc291cmNlID0gbWVzc2FnZS5zb3VyY2U7XG5cbiAgICBjb25zdCBuZXR3b3JrSWQgPSBkYXRhLm5ldHdvcmtJZDtcblxuICAgIGlmICghdGhpcy5mcm96ZW5VcGRhdGVzLmhhcyhuZXR3b3JrSWQpKSB7XG4gICAgICB0aGlzLmZyb3plblVwZGF0ZXMuc2V0KG5ldHdvcmtJZCwgbWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0b3JlZE1lc3NhZ2UgPSB0aGlzLmZyb3plblVwZGF0ZXMuZ2V0KG5ldHdvcmtJZCk7XG4gICAgICBjb25zdCBzdG9yZWREYXRhID0gc3RvcmVkTWVzc2FnZS5kYXRhVHlwZSA9PT0gXCJ1bVwiID8gdGhpcy5kYXRhRm9yVXBkYXRlTXVsdGlNZXNzYWdlKG5ldHdvcmtJZCwgbWVzc2FnZSkgOiBzdG9yZWRNZXNzYWdlLmRhdGE7XG5cbiAgICAgIC8vIEF2b2lkIHVwZGF0aW5nIGNvbXBvbmVudHMgaWYgdGhlIGVudGl0eSBkYXRhIHJlY2VpdmVkIGRpZCBub3QgY29tZSBmcm9tIHRoZSBjdXJyZW50IG93bmVyLlxuICAgICAgY29uc3QgaXNPdXRkYXRlZE1lc3NhZ2UgPSBkYXRhLmxhc3RPd25lclRpbWUgPCBzdG9yZWREYXRhLmxhc3RPd25lclRpbWU7XG4gICAgICBjb25zdCBpc0NvbnRlbXBvcmFuZW91c01lc3NhZ2UgPSBkYXRhLmxhc3RPd25lclRpbWUgPT09IHN0b3JlZERhdGEubGFzdE93bmVyVGltZTtcbiAgICAgIGlmIChpc091dGRhdGVkTWVzc2FnZSB8fCAoaXNDb250ZW1wb3JhbmVvdXNNZXNzYWdlICYmIHN0b3JlZERhdGEub3duZXIgPiBkYXRhLm93bmVyKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIERlbGV0ZSBtZXNzYWdlcyBvdmVycmlkZSBhbnkgb3RoZXIgbWVzc2FnZXMgZm9yIHRoaXMgZW50aXR5XG4gICAgICBpZiAoZGF0YVR5cGUgPT09IFwiclwiKSB7XG4gICAgICAgIHRoaXMuZnJvemVuVXBkYXRlcy5zZXQobmV0d29ya0lkLCBtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG1lcmdlIGluIGNvbXBvbmVudCB1cGRhdGVzXG4gICAgICAgIE9iamVjdC5hc3NpZ24oc3RvcmVkRGF0YS5jb21wb25lbnRzLCBkYXRhLmNvbXBvbmVudHMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG9uRGF0YUNoYW5uZWxNZXNzYWdlKGUsIHNvdXJjZSkge1xuICAgIHRoaXMub25EYXRhKEpTT04ucGFyc2UoZS5kYXRhKSwgc291cmNlKTtcbiAgfVxuXG4gIG9uRGF0YShtZXNzYWdlLCBzb3VyY2UpIHtcbiAgICBpZiAoZGVidWcuZW5hYmxlZCkge1xuICAgICAgZGVidWcoYERDIGluOiAke21lc3NhZ2V9YCk7XG4gICAgfVxuXG4gICAgaWYgKCFtZXNzYWdlLmRhdGFUeXBlKSByZXR1cm47XG5cbiAgICBtZXNzYWdlLnNvdXJjZSA9IHNvdXJjZTtcblxuICAgIGlmICh0aGlzLmZyb3plbikge1xuICAgICAgdGhpcy5zdG9yZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub25PY2N1cGFudE1lc3NhZ2UobnVsbCwgbWVzc2FnZS5kYXRhVHlwZSwgbWVzc2FnZS5kYXRhLCBtZXNzYWdlLnNvdXJjZSk7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkU3RhcnRDb25uZWN0aW9uVG8oY2xpZW50KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBzdGFydFN0cmVhbUNvbm5lY3Rpb24oY2xpZW50KSB7fVxuXG4gIGNsb3NlU3RyZWFtQ29ubmVjdGlvbihjbGllbnQpIHt9XG5cbiAgZ2V0Q29ubmVjdFN0YXR1cyhjbGllbnRJZCkge1xuICAgIHJldHVybiB0aGlzLm9jY3VwYW50c1tjbGllbnRJZF0gPyBOQUYuYWRhcHRlcnMuSVNfQ09OTkVDVEVEIDogTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XG4gIH1cblxuICBhc3luYyB1cGRhdGVUaW1lT2Zmc2V0KCkge1xuICAgIGlmICh0aGlzLmlzRGlzY29ubmVjdGVkKCkpIHJldHVybjtcblxuICAgIGNvbnN0IGNsaWVudFNlbnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsIHtcbiAgICAgIG1ldGhvZDogXCJIRUFEXCIsXG4gICAgICBjYWNoZTogXCJuby1jYWNoZVwiXG4gICAgfSk7XG5cbiAgICBjb25zdCBwcmVjaXNpb24gPSAxMDAwO1xuICAgIGNvbnN0IHNlcnZlclJlY2VpdmVkVGltZSA9IG5ldyBEYXRlKHJlcy5oZWFkZXJzLmdldChcIkRhdGVcIikpLmdldFRpbWUoKSArIHByZWNpc2lvbiAvIDI7XG4gICAgY29uc3QgY2xpZW50UmVjZWl2ZWRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBzZXJ2ZXJUaW1lID0gc2VydmVyUmVjZWl2ZWRUaW1lICsgKGNsaWVudFJlY2VpdmVkVGltZSAtIGNsaWVudFNlbnRUaW1lKSAvIDI7XG4gICAgY29uc3QgdGltZU9mZnNldCA9IHNlcnZlclRpbWUgLSBjbGllbnRSZWNlaXZlZFRpbWU7XG5cbiAgICB0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cysrO1xuXG4gICAgaWYgKHRoaXMuc2VydmVyVGltZVJlcXVlc3RzIDw9IDEwKSB7XG4gICAgICB0aGlzLnRpbWVPZmZzZXRzLnB1c2godGltZU9mZnNldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudGltZU9mZnNldHNbdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgJSAxMF0gPSB0aW1lT2Zmc2V0O1xuICAgIH1cblxuICAgIHRoaXMuYXZnVGltZU9mZnNldCA9IHRoaXMudGltZU9mZnNldHMucmVkdWNlKChhY2MsIG9mZnNldCkgPT4gKGFjYyArPSBvZmZzZXQpLCAwKSAvIHRoaXMudGltZU9mZnNldHMubGVuZ3RoO1xuXG4gICAgaWYgKHRoaXMuc2VydmVyVGltZVJlcXVlc3RzID4gMTApIHtcbiAgICAgIGRlYnVnKGBuZXcgc2VydmVyIHRpbWUgb2Zmc2V0OiAke3RoaXMuYXZnVGltZU9mZnNldH1tc2ApO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKSwgNSAqIDYwICogMTAwMCk7IC8vIFN5bmMgY2xvY2sgZXZlcnkgNSBtaW51dGVzLlxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKTtcbiAgICB9XG4gIH1cblxuICBnZXRTZXJ2ZXJUaW1lKCkge1xuICAgIHJldHVybiBEYXRlLm5vdygpICsgdGhpcy5hdmdUaW1lT2Zmc2V0O1xuICB9XG5cbiAgZ2V0TWVkaWFTdHJlYW0oY2xpZW50SWQsIHR5cGUgPSBcImF1ZGlvXCIpIHtcbiAgICBpZiAodGhpcy5tZWRpYVN0cmVhbXNbY2xpZW50SWRdKSB7XG4gICAgICBkZWJ1ZyhgQWxyZWFkeSBoYWQgJHt0eXBlfSBmb3IgJHtjbGllbnRJZH1gKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5tZWRpYVN0cmVhbXNbY2xpZW50SWRdW3R5cGVdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWcoYFdhaXRpbmcgb24gJHt0eXBlfSBmb3IgJHtjbGllbnRJZH1gKTtcbiAgICAgIGlmICghdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5oYXMoY2xpZW50SWQpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuc2V0KGNsaWVudElkLCB7fSk7XG5cbiAgICAgICAgY29uc3QgYXVkaW9Qcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KGNsaWVudElkKS5hdWRpbyA9IHsgcmVzb2x2ZSwgcmVqZWN0IH07XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB2aWRlb1Byb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQoY2xpZW50SWQpLnZpZGVvID0geyByZXNvbHZlLCByZWplY3QgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5wZW5kaW5nTWVkaWFSZXF1ZXN0cy5nZXQoY2xpZW50SWQpLmF1ZGlvLnByb21pc2UgPSBhdWRpb1Byb21pc2U7XG4gICAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KGNsaWVudElkKS52aWRlby5wcm9taXNlID0gdmlkZW9Qcm9taXNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KGNsaWVudElkKVt0eXBlXS5wcm9taXNlO1xuICAgIH1cbiAgfVxuXG4gIHNldE1lZGlhU3RyZWFtKGNsaWVudElkLCBzdHJlYW0pIHtcbiAgICAvLyBTYWZhcmkgZG9lc24ndCBsaWtlIGl0IHdoZW4geW91IHVzZSBzaW5nbGUgYSBtaXhlZCBtZWRpYSBzdHJlYW0gd2hlcmUgb25lIG9mIHRoZSB0cmFja3MgaXMgaW5hY3RpdmUsIHNvIHdlXG4gICAgLy8gc3BsaXQgdGhlIHRyYWNrcyBpbnRvIHR3byBzdHJlYW1zLlxuICAgIGNvbnN0IGF1ZGlvU3RyZWFtID0gbmV3IE1lZGlhU3RyZWFtKCk7XG4gICAgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiBhdWRpb1N0cmVhbS5hZGRUcmFjayh0cmFjaykpO1xuICAgIGNvbnN0IHZpZGVvU3RyZWFtID0gbmV3IE1lZGlhU3RyZWFtKCk7XG4gICAgc3RyZWFtLmdldFZpZGVvVHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiB2aWRlb1N0cmVhbS5hZGRUcmFjayh0cmFjaykpO1xuXG4gICAgdGhpcy5tZWRpYVN0cmVhbXNbY2xpZW50SWRdID0geyBhdWRpbzogYXVkaW9TdHJlYW0sIHZpZGVvOiB2aWRlb1N0cmVhbSB9O1xuXG4gICAgLy8gUmVzb2x2ZSB0aGUgcHJvbWlzZSBmb3IgdGhlIHVzZXIncyBtZWRpYSBzdHJlYW0gaWYgaXQgZXhpc3RzLlxuICAgIGlmICh0aGlzLnBlbmRpbmdNZWRpYVJlcXVlc3RzLmhhcyhjbGllbnRJZCkpIHtcbiAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KGNsaWVudElkKS5hdWRpby5yZXNvbHZlKGF1ZGlvU3RyZWFtKTtcbiAgICAgIHRoaXMucGVuZGluZ01lZGlhUmVxdWVzdHMuZ2V0KGNsaWVudElkKS52aWRlby5yZXNvbHZlKHZpZGVvU3RyZWFtKTtcbiAgICB9XG4gIH1cblxuICBzZXRMb2NhbE1lZGlhU3RyZWFtKHN0cmVhbSkge1xuICAgIC8vIG91ciBqb2IgaGVyZSBpcyB0byBtYWtlIHN1cmUgdGhlIGNvbm5lY3Rpb24gd2luZHMgdXAgd2l0aCBSVFAgc2VuZGVycyBzZW5kaW5nIHRoZSBzdHVmZiBpbiB0aGlzIHN0cmVhbSxcbiAgICAvLyBhbmQgbm90IHRoZSBzdHVmZiB0aGF0IGlzbid0IGluIHRoaXMgc3RyZWFtLiBzdHJhdGVneSBpcyB0byByZXBsYWNlIGV4aXN0aW5nIHRyYWNrcyBpZiB3ZSBjYW4sIGFkZCB0cmFja3NcbiAgICAvLyB0aGF0IHdlIGNhbid0IHJlcGxhY2UsIGFuZCBkaXNhYmxlIHRyYWNrcyB0aGF0IGRvbid0IGV4aXN0IGFueW1vcmUuXG5cbiAgICAvLyBub3RlIHRoYXQgd2UgZG9uJ3QgZXZlciByZW1vdmUgYSB0cmFjayBmcm9tIHRoZSBzdHJlYW0gLS0gc2luY2UgSmFudXMgZG9lc24ndCBzdXBwb3J0IFVuaWZpZWQgUGxhbiwgd2UgYWJzb2x1dGVseVxuICAgIC8vIGNhbid0IHdpbmQgdXAgd2l0aCBhIFNEUCB0aGF0IGhhcyA+MSBhdWRpbyBvciA+MSB2aWRlbyB0cmFja3MsIGV2ZW4gaWYgb25lIG9mIHRoZW0gaXMgaW5hY3RpdmUgKHdoYXQgeW91IGdldCBpZlxuICAgIC8vIHlvdSByZW1vdmUgYSB0cmFjayBmcm9tIGFuIGV4aXN0aW5nIHN0cmVhbS4pXG4gICAgaWYgKHRoaXMucHVibGlzaGVyICYmIHRoaXMucHVibGlzaGVyLmNvbm4pIHtcbiAgICAgIHZhciBleGlzdGluZ1NlbmRlcnMgPSB0aGlzLnB1Ymxpc2hlci5jb25uLmdldFNlbmRlcnMoKTtcbiAgICAgIHZhciBuZXdTZW5kZXJzID0gW107XG4gICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0ID0+IHtcbiAgICAgICAgdmFyIHNlbmRlciA9IGV4aXN0aW5nU2VuZGVycy5maW5kKHMgPT4gcy50cmFjayAhPSBudWxsICYmIHMudHJhY2sua2luZCA9PSB0LmtpbmQpO1xuICAgICAgICBpZiAoc2VuZGVyICE9IG51bGwpIHtcbiAgICAgICAgICBpZiAoc2VuZGVyLnJlcGxhY2VUcmFjaykge1xuICAgICAgICAgICAgc2VuZGVyLnJlcGxhY2VUcmFjayh0KTtcbiAgICAgICAgICAgIHNlbmRlci50cmFjay5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcmVwbGFjZVRyYWNrIGlzbid0IGltcGxlbWVudGVkIGluIENocm9tZSwgZXZlbiB2aWEgd2VicnRjLWFkYXB0ZXIuXG4gICAgICAgICAgICBzdHJlYW0ucmVtb3ZlVHJhY2soc2VuZGVyLnRyYWNrKTtcbiAgICAgICAgICAgIHN0cmVhbS5hZGRUcmFjayh0KTtcbiAgICAgICAgICAgIHQuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5ld1NlbmRlcnMucHVzaChzZW5kZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld1NlbmRlcnMucHVzaCh0aGlzLnB1Ymxpc2hlci5jb25uLmFkZFRyYWNrKHQsIHN0cmVhbSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGV4aXN0aW5nU2VuZGVycy5mb3JFYWNoKHMgPT4ge1xuICAgICAgICBpZiAoIW5ld1NlbmRlcnMuaW5jbHVkZXMocykpIHtcbiAgICAgICAgICBzLnRyYWNrLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMubG9jYWxNZWRpYVN0cmVhbSA9IHN0cmVhbTtcbiAgICB0aGlzLnNldE1lZGlhU3RyZWFtKHRoaXMuY2xpZW50SWQsIHN0cmVhbSk7XG4gIH1cblxuICBlbmFibGVNaWNyb3Bob25lKGVuYWJsZWQpIHtcbiAgICBpZiAodGhpcy5wdWJsaXNoZXIgJiYgdGhpcy5wdWJsaXNoZXIuY29ubikge1xuICAgICAgdGhpcy5wdWJsaXNoZXIuY29ubi5nZXRTZW5kZXJzKCkuZm9yRWFjaChzID0+IHtcbiAgICAgICAgaWYgKHMudHJhY2sua2luZCA9PSBcImF1ZGlvXCIpIHtcbiAgICAgICAgICBzLnRyYWNrLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzZW5kRGF0YShjbGllbnRJZCwgZGF0YVR5cGUsIGRhdGEpIHtcbiAgICBpZiAoIXRoaXMucHVibGlzaGVyKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJzZW5kRGF0YSBjYWxsZWQgd2l0aG91dCBhIHB1Ymxpc2hlclwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoICh0aGlzLnVucmVsaWFibGVUcmFuc3BvcnQpIHtcbiAgICAgICAgY2FzZSBcIndlYnNvY2tldFwiOlxuICAgICAgICAgIHRoaXMucHVibGlzaGVyLmhhbmRsZS5zZW5kTWVzc2FnZSh7IGtpbmQ6IFwiZGF0YVwiLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pLCB3aG9tOiBjbGllbnRJZCB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImRhdGFjaGFubmVsXCI6XG4gICAgICAgICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSB9KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhpcy51bnJlbGlhYmxlVHJhbnNwb3J0KGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2VuZERhdGFHdWFyYW50ZWVkKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xuICAgIGlmICghdGhpcy5wdWJsaXNoZXIpIHtcbiAgICAgIGNvbnNvbGUud2FybihcInNlbmREYXRhR3VhcmFudGVlZCBjYWxsZWQgd2l0aG91dCBhIHB1Ymxpc2hlclwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoICh0aGlzLnJlbGlhYmxlVHJhbnNwb3J0KSB7XG4gICAgICAgIGNhc2UgXCJ3ZWJzb2NrZXRcIjpcbiAgICAgICAgICB0aGlzLnB1Ymxpc2hlci5oYW5kbGUuc2VuZE1lc3NhZ2UoeyBraW5kOiBcImRhdGFcIiwgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSwgd2hvbTogY2xpZW50SWQgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkYXRhY2hhbm5lbFwiOlxuICAgICAgICAgIHRoaXMucHVibGlzaGVyLnJlbGlhYmxlQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhIH0pKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aGlzLnJlbGlhYmxlVHJhbnNwb3J0KGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYnJvYWRjYXN0RGF0YShkYXRhVHlwZSwgZGF0YSkge1xuICAgIGlmICghdGhpcy5wdWJsaXNoZXIpIHtcbiAgICAgIGNvbnNvbGUud2FybihcImJyb2FkY2FzdERhdGEgY2FsbGVkIHdpdGhvdXQgYSBwdWJsaXNoZXJcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaCAodGhpcy51bnJlbGlhYmxlVHJhbnNwb3J0KSB7XG4gICAgICAgIGNhc2UgXCJ3ZWJzb2NrZXRcIjpcbiAgICAgICAgICB0aGlzLnB1Ymxpc2hlci5oYW5kbGUuc2VuZE1lc3NhZ2UoeyBraW5kOiBcImRhdGFcIiwgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImRhdGFjaGFubmVsXCI6XG4gICAgICAgICAgdGhpcy5wdWJsaXNoZXIudW5yZWxpYWJsZUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IGRhdGFUeXBlLCBkYXRhIH0pKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aGlzLnVucmVsaWFibGVUcmFuc3BvcnQodW5kZWZpbmVkLCBkYXRhVHlwZSwgZGF0YSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQoZGF0YVR5cGUsIGRhdGEpIHtcbiAgICBpZiAoIXRoaXMucHVibGlzaGVyKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJicm9hZGNhc3REYXRhR3VhcmFudGVlZCBjYWxsZWQgd2l0aG91dCBhIHB1Ymxpc2hlclwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoICh0aGlzLnJlbGlhYmxlVHJhbnNwb3J0KSB7XG4gICAgICAgIGNhc2UgXCJ3ZWJzb2NrZXRcIjpcbiAgICAgICAgICB0aGlzLnB1Ymxpc2hlci5oYW5kbGUuc2VuZE1lc3NhZ2UoeyBraW5kOiBcImRhdGFcIiwgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSB9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImRhdGFjaGFubmVsXCI6XG4gICAgICAgICAgdGhpcy5wdWJsaXNoZXIucmVsaWFibGVDaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBkYXRhVHlwZSwgZGF0YSB9KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhpcy5yZWxpYWJsZVRyYW5zcG9ydCh1bmRlZmluZWQsIGRhdGFUeXBlLCBkYXRhKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBraWNrKGNsaWVudElkLCBwZXJtc1Rva2VuKSB7XG4gICAgcmV0dXJuIHRoaXMucHVibGlzaGVyLmhhbmRsZS5zZW5kTWVzc2FnZSh7IGtpbmQ6IFwia2lja1wiLCByb29tX2lkOiB0aGlzLnJvb20sIHVzZXJfaWQ6IGNsaWVudElkLCB0b2tlbjogcGVybXNUb2tlbiB9KS50aGVuKCgpID0+IHtcbiAgICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJraWNrZWRcIiwgeyBkZXRhaWw6IHsgY2xpZW50SWQ6IGNsaWVudElkIH0gfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgYmxvY2soY2xpZW50SWQpIHtcbiAgICByZXR1cm4gdGhpcy5wdWJsaXNoZXIuaGFuZGxlLnNlbmRNZXNzYWdlKHsga2luZDogXCJibG9ja1wiLCB3aG9tOiBjbGllbnRJZCB9KS50aGVuKCgpID0+IHtcbiAgICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJibG9ja2VkXCIsIHsgZGV0YWlsOiB7IGNsaWVudElkOiBjbGllbnRJZCB9IH0pKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuYmxvY2soY2xpZW50SWQpIHtcbiAgICByZXR1cm4gdGhpcy5wdWJsaXNoZXIuaGFuZGxlLnNlbmRNZXNzYWdlKHsga2luZDogXCJ1bmJsb2NrXCIsIHdob206IGNsaWVudElkIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgZG9jdW1lbnQuYm9keS5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInVuYmxvY2tlZFwiLCB7IGRldGFpbDogeyBjbGllbnRJZDogY2xpZW50SWQgfSB9KSk7XG4gICAgfSk7XG4gIH1cbn1cblxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwiamFudXNcIiwgSmFudXNBZGFwdGVyKTtcblxubW9kdWxlLmV4cG9ydHMgPSBKYW51c0FkYXB0ZXI7XG4iXSwic291cmNlUm9vdCI6IiJ9