(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.easyReact = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
'use strict';

var EasyReact = _dereq_('./lib/EasyReact');
var React = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);
var Link = _dereq_('./lib/Link');

var Provider = React.createClass({
  displayName: 'Provider',
  getChildContext: function getChildContext() {
    var app = this.props.app;
    return {
      update: app.update.bind(app),
      to: app.to.bind(app),
      Link: Link(app)
    };
  },

  render: function render() {
    return this.props.children;
  }
});

Provider.PropTypes = {
  app: React.PropTypes.instanceOf(EasyReact)
};

Provider.childContextTypes = {
  update: React.PropTypes.func.isRequired,
  to: React.PropTypes.func.isRequired,
  Link: React.PropTypes.func.isRequired
};

module.exports = Provider;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./lib/EasyReact":3,"./lib/Link":5}],2:[function(_dereq_,module,exports){
'use strict';

var EasyReact = _dereq_('./lib/EasyReact');
var Provider = _dereq_('./Provider');

module.exports = {
  App: EasyReact,
  Provider: Provider
};
},{"./Provider":1,"./lib/EasyReact":3}],3:[function(_dereq_,module,exports){
(function (global){
'use strict';

var ReactDOMServer = (typeof window !== "undefined" ? window['ReactDOMServer'] : typeof global !== "undefined" ? global['ReactDOMServer'] : null);
var ReactDOM = (typeof window !== "undefined" ? window['ReactDOM'] : typeof global !== "undefined" ? global['ReactDOM'] : null);
var Router = _dereq_('mini-routerjs');
var JSONStore = _dereq_('jsonstore-js');
var History = _dereq_('./History');

function EasyReact(options) {
  this.isBrowserContext = typeof window !== 'undefined';
  this.view = null;

  this.store = new JSONStore({
    store: options.store || {}
  });

  this.router = new Router({
    strict: options.strict !== false
  });

  this.reInitStore = !this.isBrowserContext;

  this.router.createMismatch(function () {
    this.view = null;
  }.bind(this));

  if (this.isBrowserContext) {
    this.history = new History({
      onHistoryChange: this._onHistoryChange.bind(this),
      historyType: options.historyType
    });
    this.viewContainer = window.document.querySelector(options.viewContainer);
  }
}

EasyReact.prototype = {
  _mountView: function _mountView(view) {
    ReactDOM.render(view, this.viewContainer);
  },
  _onHistoryChange: function _onHistoryChange(path) {
    this.router.match(path);
    this._mountView(this.getView(path));
  },
  createRoute: function createRoute(route, callback) {
    this.router.create(route, function (request) {
      this.view = callback(request, this.store.get());
      if (this.reInitStore) {
        this.store.reInit();
      }
    }.bind(this));
  },
  createMismatch: function createMismatch(callback) {
    this.router.createMismatch(function () {
      this.view = callback(this.store.get()) || null;
    }.bind(this));
  },
  getView: function getView(path, stringify) {
    this.router.match(path);
    return stringify === true ? ReactDOMServer.renderToString(this.view) : this.view;
  },
  updateStore: function updateStore(name, action, a, b, c, d, e, f) {
    return this.store.do(name, action, a, b, c, d, e, f);
  },
  to: function to(url, action, a, b, c, d, e, f) {
    var result = {};
    if (typeof action === 'function') {
      result = this.store.do(action, a, b, c, d, e, f);
    }
    this.history.updateUrl(url);
    return result;
  },
  update: function update(name, action, a, b, c, d, e, f) {
    var result = {};
    if (typeof name === 'function' || typeof action === 'function') {
      result = this.store.do(name, action, a, b, c, d, e, f);
    }
    var view = this.getView(this.history.getCurrentUrl(true));
    this._mountView(view);
    return result;
  },
  getStore: function getStore(path, copy) {
    return this.store.get(path, copy);
  }
};

module.exports = EasyReact;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./History":4,"jsonstore-js":10,"mini-routerjs":12}],4:[function(_dereq_,module,exports){
'use strict';

var urlParser = _dereq_('simple-url');
var historyTypes = {
  'h5': 'h5',
  'hash': 'hash'
};

function History(options) {
  this.historyType = historyTypes[options.historyType] || this._detectHistoryType();
  this.onHistoryChange = typeof options.onHistoryChange === 'function' ? options.onHistoryChange : function () {};
  this._init();
}

History.prototype = {
  updateUrl: function updateUrl(url) {
    url = this._formatUrl(url, true);
    if (this.historyType === 'h5') {
      window.history.pushState({}, '', url);
      this.onHistoryChange(this._formatUrl(url, true));
    } else if (this.historyType === 'hash') {
      window.location.hash = url;
    }
  },
  getCurrentUrl: function getCurrentUrl(pathOnly) {
    return this._formatUrl(window.location.href, pathOnly);
  },
  _detectHistoryType: function _detectHistoryType() {
    return typeof window.history.pushState === 'function' ? 'h5' : 'hash';
  },
  _isHashUrl: function _isHashUrl(hash) {
    return hash.charAt(0) === '/';
  },
  _formatUrl: function _formatUrl(url, pathOnly) {
    var urlObj = urlParser.parse(url, false);
    if (this._isHashUrl(urlObj.hash)) {
      urlObj = urlParser.parse(urlObj.hash, false);
    }
    return pathOnly === true ? urlParser.createPath(urlObj.pathname, urlObj.query, urlObj.hash) : urlParser.create(urlObj);
  },
  _init: function _init() {
    if (this.historyType === 'h5') {
      window.addEventListener("popstate", function () {
        this.onHistoryChange(this.getCurrentUrl(true));
      }.bind(this));
    } else if (this.historyType === 'hash') {
      var location = window.location;
      if (location.pathname.length > 1) {
        window.location.href = '/#' + location.pathname + location.search + location.hash;
        return void 0;
      }
      window.addEventListener("hashchange", function () {
        this.onHistoryChange(this.getCurrentUrl(true));
      }.bind(this));
    }
  }
};

module.exports = History;
},{"simple-url":18}],5:[function(_dereq_,module,exports){
(function (global){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = (typeof window !== "undefined" ? window['React'] : typeof global !== "undefined" ? global['React'] : null);

module.exports = function (app) {
  return React.createClass({
    _onLinkClick: function _onLinkClick(event) {
      event.preventDefault();
      if (typeof this.props.onClick === 'function') {
        this.props.onClick(event);
      }
      app.to(event.target.href);
    },
    render: function render() {
      return React.createElement(
        'a',
        _extends({}, this.props, { onClick: this._onLinkClick }),
        this.props.children
      );
    }
  });
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],6:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');
var array = _dereq_('./array');
var object = _dereq_('./object');

var patchTypes = {
  add: 'add',
  remove: 'remove',
  update: 'update',
  moveUp: 'moveUp',
  moveDown: 'moveDown',
  moveTo: 'moveTo',
  exchange: 'exchange',
  extendObject: 'extendObject',
  spreadArray: 'spreadArray',
  spread2dArrayCol: 'spread2dArrayCol',
  spread2dArrayRow: 'spread2dArrayRow'
};

var createPatch = function createPatch(type, args) {
  args = Array.prototype.slice.call(args);
  return utils.copy({
    type: type,
    args: args
  });
};

/**
 * create patch operations
 * */

var patchMethods = {
  createAdd: function createAdd(path, value, key) {
    return createPatch(patchTypes.add, arguments);
  },
  createRemove: function createRemove(path) {
    return createPatch(patchTypes.remove, arguments);
  },
  createUpdate: function createUpdate(path, value, forceUpdate) {
    return createPatch(patchTypes.update, arguments);
  },
  createMoveUp: function createMoveUp(path) {
    return createPatch(patchTypes.moveUp, arguments);
  },
  createMoveDown: function createMoveDown(path) {
    return createPatch(patchTypes.moveDown, arguments);
  },
  createMoveTo: function createMoveTo(from, to, key) {
    return createPatch(patchTypes.moveTo, arguments);
  },
  createExchange: function createExchange(from, to) {
    return createPatch(patchTypes.exchange, arguments);
  },
  createExtendObject: function createExtendObject(path, a, b, c, d, e) {
    return createPatch(patchTypes.extendObject, arguments);
  },
  createSpreadArray: function createSpreadArray(path, begin, infilling) {
    return createPatch(patchTypes.spreadArray, arguments);
  },
  createSpread2dArrayRow: function createSpread2dArrayRow(path, begin, rows) {
    return createPatch(patchTypes.spread2dArrayRow, arguments);
  },
  createSpread2dArrayCol: function createSpread2dArrayCol(path, begin, cols) {
    return createPatch(patchTypes.spread2dArrayCol, arguments);
  }
};

function JSONDataStore(options) {
  options = options || {};
  this.initialOptions = utils.copy(options);
  var store = options.store,
      copyStore = options.copyStore !== false;
  this.store = copyStore ? utils.copy(store) : store;
  // 'do' about attributes
  this.patches = [];
  this.relativePatches = [];
  this.backPatches = [];
  this.currentPath = [];
  this.isDoing = false;
}

JSONDataStore.prototype = {
  _getRef: function _getRef(path) {
    var ref = this.store,
        i = 0,
        len = path.length;
    for (; i < len; i++) {
      ref = ref[path[i]];
    }
    return ref;
  },
  _detectPath: function _detectPath(path) {
    var detected = [],
        ref = this.store,
        i = 0,
        len = path.length,
        key,
        keyType,
        refType;
    for (; i < len; i++) {
      key = path[i];
      keyType = utils.type(key);
      refType = utils.type(ref);
      if (refType === 'object') {
        if (object.hasOwnProperty.call(key, '__value')) {
          var objKey = object.getObjectKeyByValue(ref, key.__value);
          if (objKey) {
            ref = ref[objKey];
            detected.push(objKey);
          } else {
            return [];
          }
        } else if (object.hasOwnProperty.call(ref, key)) {
          ref = ref[key];
          detected.push(key);
        } else {
          return [];
        }
      } else if (refType === 'array') {
        if (object.hasOwnProperty.call(key, '__value')) {
          var index = array.getArrayIndexByValue(ref, key.__value);
          if (index > -1) {
            ref = ref[index];
            detected.push(index);
          } else {
            return [];
          }
        } else if (object.hasOwnProperty.call(ref, key)) {
          ref = ref[key];
          detected.push(key);
        } else {
          return [];
        }
      }
    }
    return detected;
  },
  _formatPath: function _formatPath(path, detect) {
    var pathType = utils.type(path);
    if (pathType === 'undefined' || pathType === 'null') {
      path = [];
    } else if (pathType !== 'array') {
      path = [path];
    }
    if (detect !== false) {
      var detected = this._detectPath(path);
      if (detected.length === path.length) {
        return detected;
      }
      return null;
    }
    return path;
  },
  _moveArrayItem: function _moveArrayItem(path, moveUp) {
    var fullPath = this._getFullPath(path);
    if (!fullPath || fullPath.length < 1) return this;
    var itemIndex = fullPath.pop(),
        arr = this._getRef(fullPath);
    if (utils.type(arr) !== 'array') return this;
    var method = moveUp === true ? 'createMoveUp' : 'createMoveDown',
        reverseMethod = method === 'createMoveUp' ? 'createMoveDown' : 'createMoveUp';
    if (this.isDoing) {
      this.patches.push(patchMethods[method](fullPath.concat(itemIndex)));
      this.relativePatches.push(patchMethods[method](this._getRelativePath(fullPath.concat(itemIndex))));
      if (moveUp === true && itemIndex > 0 || moveUp !== true && itemIndex < arr.length - 1) {
        this.backPatches.unshift(patchMethods[reverseMethod](fullPath.concat(moveUp === true ? itemIndex - 1 : itemIndex + 1)));
      }
    }
    if (moveUp === true) {
      array.moveArrayItemUp(arr, itemIndex);
    } else {
      array.moveArrayItemDown(arr, itemIndex);
    }
    return this;
  },
  _getFullPath: function _getFullPath(path) {
    var currentPath = this._formatPath(this.currentPath, false),
        fullPath = currentPath.concat(this._formatPath(path, false));
    return this._formatPath(fullPath);
  },
  _getRelativePath: function _getRelativePath(fullPath) {
    return fullPath.slice(this.currentPath.length);
  },
  reInit: function reInit(options) {
    JSONDataStore.call(this, options || this.initialOptions);
    return this;
  },
  goTo: function goTo(path, addUp) {
    if (!this.isDoing) {
      throw new Error('You are using store.goTo outside store.do!');
    }
    if (addUp === true) {
      this.currentPath = this._formatPath(this.currentPath.concat(this._formatPath(path, false)));
    } else {
      this.currentPath = this._formatPath(path);
    }
    return this;
  },
  do: function _do(name, action, a, b, c, d, e, f) {
    var result = {};
    this.isDoing = true;
    if (typeof name === 'function') {
      name(this, action, a, b, c, d, e, f);
    } else if (typeof action === 'function') {
      action(this, a, b, c, d, e, f);
    } else {
      throw new Error('Invalid parameter action.');
    }
    // compose result
    result.patches = this.patches;
    result.relativePatches = this.relativePatches;
    result.backPatches = this.backPatches;
    // reset 'do' about attributes
    this.patches = [];
    this.relativePatches = [];
    this.backPatches = [];
    this.currentPath = [];
    this.isDoing = false;
    return result;
  },
  add: function add(path, value, key) {
    var ref, refType;
    path = this._getFullPath(path);
    if (!path || !utils.isReferenceType(ref = this._getRef(path)) || (refType = utils.type(ref)) === 'object' && !utils.isCommonKeyType(key)) {
      return this;
    }
    if (this.isDoing) {
      this.patches.push(patchMethods.createAdd(path, value, key));
      this.relativePatches.push(patchMethods.createAdd(this._getRelativePath(path), value, key));
      if (refType === 'object') {
        this.backPatches.unshift(patchMethods.createRemove(path.concat(key)));
      } else {
        this.backPatches.unshift(patchMethods.createUpdate(path, this.get(path), true));
      }
    }
    if (refType === 'object') {
      ref[key] = value;
    } else {
      var index = array.parseArrayIndex(key);
      if (index !== undefined) {
        ref.splice(index, 0, value);
      } else {
        ref.push(value);
      }
    }
    return this;
  },
  remove: function remove(path) {
    if (!(path = this._getFullPath(path))) return this;
    if (this.isDoing) {
      this.patches.push(patchMethods.createRemove(path));
      this.relativePatches.push(patchMethods.createRemove(this._getRelativePath(path)));
      this.backPatches.unshift(patchMethods.createUpdate(path, this.get(path), true));
    }
    if (path.length < 1) {
      this.store = undefined;
      return this;
    }
    var lastKey = path.pop(),
        ref = this._getRef(path),
        refType = utils.type(ref);
    if (refType === 'array') {
      ref.splice(lastKey, 1);
    } else if (refType === 'object') {
      delete ref[lastKey];
    }
    return this;
  },
  update: function update(path, value, forceUpdate) {
    path = this._formatPath(path, false);
    var lastKey,
        fullPath = this._formatPath(path);
    if (fullPath) {
      if (this.isDoing) {
        this.patches.push(patchMethods.createUpdate(fullPath, value));
        this.relativePatches.push(patchMethods.createUpdate(this._getRelativePath(fullPath), value));
        this.backPatches.unshift(patchMethods.createUpdate(fullPath, this.get(fullPath)));
      }
      lastKey = fullPath.pop();
      if (lastKey !== undefined) {
        this._getRef(fullPath)[lastKey] = value;
      } else {
        this.store = value;
      }
      return this;
    } else if (forceUpdate === true && path.length > 0) {
      lastKey = path.pop();
      return this.add(path, value, lastKey);
    }
    return this;
  },
  set: function set(path, value) {
    return this.update(path, value, true);
  },
  moveUp: function moveUp(path) {
    return this._moveArrayItem(path, true);
  },
  moveDown: function moveDown(path) {
    return this._moveArrayItem(path);
  },
  moveTo: function moveTo(from, to, key) {
    from = this._getFullPath(from);
    to = this._getFullPath(to);
    if (!from || !to || !utils.isReferenceType(this._getRef(to))) return this;
    this.add(to, this._getRef(from), key);
    this.remove(from);
    return this;
  },
  exchange: function exchange(from, to) {
    from = this._formatPath(from);
    to = this._formatPath(to);
    if (from && to) {
      var fromRef = this._getRef(from),
          toRef = this.get(to);
      this.update(from, toRef);
      this.update(to, fromRef);
    }
    return this;
  },
  extendObject: function extendObject(path, a, b, c, d, e, f) {
    var ref;
    if (!(path = this._formatPath(path)) || utils.type(ref = this._getRef(path)) !== 'object') return this;
    if (this.isDoing) {
      this.patches.push(patchMethods.createExtendObject.apply(this, arguments));
      this.relativePatches.push(patchMethods.createExtendObject(this._getRelativePath(path), a, b, c, d, e, f));
      this.backPatches.push(patchMethods.createUpdate(path, this.get(path)));
    }
    object.extend(ref, a, b, c, d, e, f);
    return this;
  },
  spreadArray: function spreadArray(path, begin, infilling) {
    var ref;
    if (!(path = this._formatPath(path)) || utils.type(ref = this._getRef(path)) !== 'array') {
      return this;
    }
    begin = begin || ref.length;
    if (!(utils.type(begin) === 'number')) return this;
    if (this.isDoing) {
      this.patches.push(patchMethods.createSpreadArray(path, begin, infilling));
      this.relativePatches.push(patchMethods.createSpreadArray(this._getRelativePath(path), begin, infilling));
      this.backPatches.unshift(patchMethods.createUpdate(path, this.get(path)));
    }
    array.spreadArray(ref, begin, infilling);
    return this;
  },
  spread2dArrayRow: function spread2dArrayRow(path, begin, rows) {
    var ref;
    if (!(path = this._formatPath(path)) || !array.is2dArray(ref = this._getRef(path)) || !(utils.type(begin) === 'number')) {
      return this;
    }
    begin = begin || ref.length;
    if (!(utils.type(begin) === 'number')) return this;
    if (this.isDoing) {
      this.patches.push(patchMethods.createSpread2dArrayRow(path, begin, rows));
      this.relativePatches.push(patchMethods.createSpread2dArrayRow(this._getRelativePath(path), begin, rows));
      this.backPatches.unshift(patchMethods.createUpdate(path, this.get(path)));
    }
    array.spread2dArrayRow(ref, begin, rows);
    return this;
  },
  spread2dArrayCol: function spread2dArrayCol(path, begin, cols) {
    var ref;
    if (!(path = this._formatPath(path)) || !array.is2dArray(ref = this._getRef(path)) || !(utils.type(begin) === 'number')) {
      return this;
    }
    begin = begin || ref.length;
    if (!(utils.type(begin) === 'number')) return this;
    if (this.isDoing) {
      this.patches.push(patchMethods.createSpread2dArrayCol(path, begin, cols));
      this.relativePatches.push(patchMethods.createSpread2dArrayCol(this._getRelativePath(path), begin, cols));
      this.backPatches.unshift(patchMethods.createUpdate(path, this.get(path)));
    }
    array.spread2dArrayCol(ref, begin, cols);
    return this;
  },
  get: function get(path, copy) {
    if (path = this._getFullPath(path)) {
      return copy === false ? this._getRef(path) : utils.copy(this._getRef(path));
    }
  },
  patch: patchMethods,
  applyPatch: function applyPatch(patches) {
    patches = utils.type(patches) === 'array' ? patches : [patches];
    patches.forEach(function (patch) {
      this[patch.type].apply(this, patch.args);
    }.bind(this));
    return this;
  }
};

JSONDataStore.patch = patchMethods;

module.exports = JSONDataStore;
},{"./array":7,"./object":8,"./utils":9}],7:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');

var splice = Array.prototype.splice;

var createArray = function createArray(length, infilling) {
  length = length || 0;
  var arr = [],
      i = 0;
  for (; i < length; i++) {
    arr.push(infilling === undefined ? null : infilling);
  }
  return arr;
};

var is2dArray = function is2dArray(arr) {
  var is2d;
  if (is2d = utils.type(arr) === 'array' && arr.length > 0) {
    var i = 0,
        len = arr.length;
    for (; i < len; i++) {
      is2d &= utils.type(arr[i]) === 'array';
      if (!is2d) return false;
    }
    return true;
  }
  return false;
};

var create2dArray = function create2dArray(row, col, infilling) {
  row = row || 0;
  col = col || 0;
  var arr = new Array(row),
      i = 0;
  for (; i < row; i++) {
    arr[i] = createArray(col, infilling);
  }
  return arr;
};

var parseArrayIndex = function parseArrayIndex(index) {
  var type = utils.type(index);
  if (type === 'string' || type === 'number') {
    return parseInt(index);
  }
  return void 0;
};

var getArrayIndexByValue = function getArrayIndexByValue(arr, value) {
  if (utils.type(arr) === 'array') {
    var valueType = utils.type(value);
    if (valueType === 'object') {
      var i = 0,
          len = arr.length,
          item;
      for (; i < len; i++) {
        item = arr[i];
        var isEqual = false;
        for (var key in value) {
          if (value.hasOwnProperty(key)) {
            isEqual = item[key] === value[key];
            if (!isEqual) break;
          }
        }
        if (isEqual) {
          return i;
        }
      }
      return -1;
    } else {
      return arr.indexOf(value);
    }
  }
};

var moveArrayItemUp = function moveArrayItemUp(arr, index) {
  if (utils.type(arr) === 'array') {
    index = parseArrayIndex(index);
    var currItem = arr[index];
    if (index > 0) {
      arr[index] = arr[index - 1];
      arr[index - 1] = currItem;
    }
  }
};

var moveArrayItemDown = function moveArrayItemDown(arr, index) {
  if (utils.type(arr) === 'array') {
    index = parseArrayIndex(index);
    var currItem = arr[index];
    if (index < arr.length - 1) {
      arr[index] = arr[index + 1];
      arr[index + 1] = currItem;
    }
  }
};

var spreadArray = function spreadArray(arr, begin, infilling) {
  var deleted = [];
  if (utils.type(arr) === 'array') {
    var infillingType = utils.type(infilling);
    if (infillingType === 'array') {
      splice.apply(arr, [begin, 0].concat(infilling));
    } else if (infillingType === 'number') {
      if (infilling > 0) {
        splice.apply(arr, [begin, 0].concat(createArray(infilling)));
      } else if (infilling < 0) {
        deleted = splice.apply(arr, [begin, Math.abs(infilling)]);
      }
    }
  }
  return deleted;
};

var spread2dArrayRow = function spread2dArrayRow(arr, begin, rows) {
  var deleted = [],
      rowsType = utils.type(rows);
  if (is2dArray(arr)) {
    var colCount = arr[0].length;
    if (rowsType === 'number') {
      if (rows > 0) {
        spreadArray(arr, begin, create2dArray(rows, colCount));
      } else if (rows < 0) {
        deleted = spreadArray(arr, begin, rows);
      }
    } else if (rowsType === 'array') {
      spreadArray(arr, begin, rows);
    }
  }
  return deleted;
};

var spread2dArrayCol = function spread2dArrayCol(arr, begin, cols) {
  var deleted = [],
      deletedCol,
      colsType = utils.type(cols);
  if (is2dArray(arr)) {
    var rowCount = arr.length,
        i = 0;
    if (colsType === 'number') {
      for (; i < rowCount; i++) {
        deletedCol = spreadArray(arr[i], begin, cols);
        if (deletedCol.length) {
          deleted.push(deletedCol);
        }
      }
    } else if (colsType === 'array') {
      for (; i < rowCount; i++) {
        spreadArray(arr[i], begin, cols[i]);
      }
    }
  }
  return deleted;
};

module.exports = {
  is2dArray: is2dArray,
  createArray: createArray,
  create2dArray: create2dArray,
  parseArrayIndex: parseArrayIndex,
  getArrayIndexByValue: getArrayIndexByValue,
  moveArrayItemUp: moveArrayItemUp,
  moveArrayItemDown: moveArrayItemDown,
  spreadArray: spreadArray,
  spread2dArrayRow: spread2dArrayRow,
  spread2dArrayCol: spread2dArrayCol
};
},{"./utils":9}],8:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');

var getObjectKeyByValue = function getObjectKeyByValue(obj, value) {
  var objKey, objValue, valueKey;
  if (utils.type(value) === 'object') {
    outer: for (objKey in obj) {
      if (obj.hasOwnProperty(objKey) && utils.type(objValue = obj[objKey]) === 'object') {
        for (valueKey in value) {
          if (value.hasOwnProperty(valueKey) && value[valueKey] !== objValue[valueKey]) {
            continue outer;
          }
        }
        return objKey;
      }
    }
  } else {
    for (objKey in obj) {
      if (obj.hasOwnProperty(objKey) && obj[objKey] === value) {
        return objKey;
      }
    }
  }
  return undefined;
};

var extend = function extend() {
  var target = arguments[0],
      argLen = arguments.length;
  for (var i = 1; i < argLen; i++) {
    var source = arguments[i],
        key;
    if (utils.type(source) === 'object') {
      for (key in source) {
        if (source.hasOwnProperty(key)) {
          target[key] = utils.copy(source[key]);
        }
      }
    }
  }
  return target;
};

module.exports = {
  hasOwnProperty: Object.prototype.hasOwnProperty,
  extend: extend,
  getObjectKeyByValue: getObjectKeyByValue
};
},{"./utils":9}],9:[function(_dereq_,module,exports){
'use strict';

var referenceTypes = {
  'array': true,
  'object': true
};

var commonKeyTypes = {
  'string': true,
  'number': true
};

var type = function type(data) {
  return Object.prototype.toString.call(data).slice(8, -1).toLowerCase();
};

var isReferenceType = function isReferenceType(data) {
  return referenceTypes[type(data)] || false;
};

var isCommonKeyType = function isCommonKeyType(key) {
  return commonKeyTypes[type(key)] || false;
};

var copy = function copy(data) {
  return isReferenceType(data) ? JSON.parse(JSON.stringify(data)) : data;
};

module.exports = {
  type: type,
  copy: copy,
  isReferenceType: isReferenceType,
  isCommonKeyType: isCommonKeyType
};
},{}],10:[function(_dereq_,module,exports){
'use strict';

module.exports = _dereq_('./lib/JSONDataStore');
},{"./lib/JSONDataStore":6}],11:[function(_dereq_,module,exports){
"use strict";

var CompiledRoutePaths = {};

var tokenRegex = /\(|\*\*|\*|:[^/)]*|\)/g;

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function _compile(routePath, strict) {
  var match,
      lastIndex = 0,
      pattern = "",
      token,
      tokens = [];
  while ((match = tokenRegex.exec(routePath)) !== null) {
    if (match.index !== lastIndex) {
      pattern += escapeRegExp(routePath.slice(lastIndex, match.index));
    }
    token = match[0];
    if (token[0] === ":") {
      pattern += '([^/]*)';
      tokens.push(token);
    } else if (token === "**") {
      pattern += "(.*)";
      tokens.push(token);
    } else if (token === "*") {
      pattern += "(.*?)";
      tokens.push(token);
    } else if (token === "(") {
      pattern += '(?:';
    } else if (token === ")") {
      pattern += ')?';
    }
    lastIndex = tokenRegex.lastIndex;
  }
  pattern += escapeRegExp(routePath.slice(lastIndex));
  pattern = strict === true ? pattern : pattern.slice(-1) === "/" ? pattern + "?" : pattern + "/?";
  pattern += "$";
  return {
    regex: new RegExp(pattern),
    tokens: tokens
  };
}

module.exports = {
  compile: function compile(routePath, strict) {
    var compiled,
        pathIndex = routePath + (strict || '');
    compiled = CompiledRoutePaths[pathIndex] || _compile(routePath, strict);
    return CompiledRoutePaths[pathIndex] = compiled;
  },
  parsePath: function parsePath(pathMatch, tokens) {
    var params = {},
        paramIndex = 0;
    tokens.forEach(function (token, index) {
      if (token[0] === ":") {
        params[token.slice(1)] = pathMatch[index + 1];
      } else {
        params[paramIndex] = pathMatch[index + 1];
        paramIndex++;
      }
    });
    return params;
  }
};
},{}],12:[function(_dereq_,module,exports){
'use strict';

var routeCompiler = _dereq_('./lib/route-compiler');
var urlUtils = _dereq_('simple-url');
var emptyFunc = function emptyFunc() {};

function Router(options) {
  this.options = options || {};
  this.regexRouters = [];
  this.stringRouters = {};
  this.onMismatch = emptyFunc;
}

Router.prototype = {
  createMismatch: function createMismatch(mismatch) {
    if (typeof mismatch === 'function') {
      this.onMismatch = mismatch;
    }
  },
  create: function create(route, callback, strict) {
    strict = typeof strict === 'boolean' ? strict : this.options.strict || false;
    callback = callback || emptyFunc;
    var compiled = routeCompiler.compile(route, strict);
    if (compiled.tokens.length === 0) {
      this.stringRouters[route] = callback;
      if (strict !== true) {
        this.stringRouters[route.slice(-1) === "/" ? route.slice(0, -1) : route + "/"] = callback;
      }
    } else {
      this.regexRouters.push([compiled, callback]);
    }
  },
  match: function match(url, data) {
    var urlObj = urlUtils.parse(url),
        path = urlObj.pathname;
    urlObj.url = url;
    if (this.stringRouters[path]) {
      this.stringRouters[path]({ url: urlObj, params: null, data: data });
      return true;
    } else {
      var i = 0,
          len = this.regexRouters.length,
          router,
          match;
      while (i < len) {
        router = this.regexRouters[i];
        match = router[0].regex.exec(path);
        if (match !== null) {
          router[1]({ url: urlObj, params: routeCompiler.parsePath(match, router[0].tokens), data: data });
          return true;
        }
        i++;
      }
    }
    this.onMismatch({ url: urlObj, data: data });
    return false;
  }
};

module.exports = Router;
},{"./lib/route-compiler":11,"simple-url":18}],13:[function(_dereq_,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

module.exports = {
    'default': 'RFC3986',
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return value;
        }
    },
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

},{}],14:[function(_dereq_,module,exports){
'use strict';

var stringify = _dereq_('./stringify');
var parse = _dereq_('./parse');
var formats = _dereq_('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":13,"./parse":15,"./stringify":16}],15:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');

var has = Object.prototype.hasOwnProperty;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    arrayLimit: 20,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    parameterLimit: 1000,
    plainObjects: false,
    strictNullHandling: false
};

var parseValues = function parseValues(str, options) {
    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0; i < parts.length; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part);
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos));
            val = options.decoder(part.slice(pos + 1));
        }
        if (has.call(obj, key)) {
            obj[key] = [].concat(obj[key]).concat(val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function parseObject(chain, val, options) {
    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(parseObject(chain, val, options));
    } else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        if (
            !isNaN(index) &&
            root !== cleanRoot &&
            String(index) === cleanRoot &&
            index >= 0 &&
            (options.parseArrays && index <= options.arrayLimit)
        ) {
            obj = [];
            obj[index] = parseObject(chain, val, options);
        } else {
            obj[cleanRoot] = parseObject(chain, val, options);
        }
    }

    return obj;
};

var parseKeys = function parseKeys(givenKey, val, options) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^\.\[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, segment[1])) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].replace(/\[|\]/g, ''))) {
            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options);
};

module.exports = function (str, opts) {
    var options = opts || {};

    if (options.decoder !== null && options.decoder !== undefined && typeof options.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    options.delimiter = typeof options.delimiter === 'string' || utils.isRegExp(options.delimiter) ? options.delimiter : defaults.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : defaults.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : defaults.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.decoder = typeof options.decoder === 'function' ? options.decoder : defaults.decoder;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : defaults.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : defaults.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : defaults.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : defaults.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options);
        obj = utils.merge(obj, newObj, options);
    }

    return utils.compact(obj);
};

},{"./utils":17}],16:[function(_dereq_,module,exports){
'use strict';

var utils = _dereq_('./utils');
var formats = _dereq_('./formats');

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var toISO = Date.prototype.toISOString;

var defaults = {
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var stringify = function stringify(object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots, serializeDate, formatter) {
    var obj = object;
    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (obj === null) {
        if (strictNullHandling) {
            return encoder ? encoder(prefix) : prefix;
        }

        obj = '';
    }

    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils.isBuffer(obj)) {
        if (encoder) {
            return [formatter(encoder(prefix)) + '=' + formatter(encoder(obj))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (Array.isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        if (Array.isArray(obj)) {
            values = values.concat(stringify(
                obj[key],
                generateArrayPrefix(prefix, key),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter
            ));
        } else {
            values = values.concat(stringify(
                obj[key],
                prefix + (allowDots ? '.' + key : '[' + key + ']'),
                generateArrayPrefix,
                strictNullHandling,
                skipNulls,
                encoder,
                filter,
                sort,
                allowDots,
                serializeDate,
                formatter
            ));
        }
    }

    return values;
};

module.exports = function (object, opts) {
    var obj = object;
    var options = opts || {};
    var delimiter = typeof options.delimiter === 'undefined' ? defaults.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : defaults.strictNullHandling;
    var skipNulls = typeof options.skipNulls === 'boolean' ? options.skipNulls : defaults.skipNulls;
    var encode = typeof options.encode === 'boolean' ? options.encode : defaults.encode;
    var encoder = encode ? (typeof options.encoder === 'function' ? options.encoder : defaults.encoder) : null;
    var sort = typeof options.sort === 'function' ? options.sort : null;
    var allowDots = typeof options.allowDots === 'undefined' ? false : options.allowDots;
    var serializeDate = typeof options.serializeDate === 'function' ? options.serializeDate : defaults.serializeDate;
    if (typeof options.format === 'undefined') {
        options.format = formats.default;
    } else if (!Object.prototype.hasOwnProperty.call(formats.formatters, options.format)) {
        throw new TypeError('Unknown format option provided.');
    }
    var formatter = formats.formatters[options.format];
    var objKeys;
    var filter;

    if (options.encoder !== null && options.encoder !== undefined && typeof options.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (Array.isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    } else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (sort) {
        objKeys.sort(sort);
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (skipNulls && obj[key] === null) {
            continue;
        }

        keys = keys.concat(stringify(
            obj[key],
            key,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            formatter
        ));
    }

    return keys.join(delimiter);
};

},{"./formats":13,"./utils":17}],17:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

exports.arrayToObject = function (source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

exports.merge = function (target, source, options) {
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        } else if (typeof target === 'object') {
            target[source] = true;
        } else {
            return [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (Array.isArray(target) && !Array.isArray(source)) {
        mergeTarget = exports.arrayToObject(target, options);
    }

    if (Array.isArray(target) && Array.isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                if (target[i] && typeof target[i] === 'object') {
                    target[i] = exports.merge(target[i], item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (Object.prototype.hasOwnProperty.call(acc, key)) {
            acc[key] = exports.merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

exports.decode = function (str) {
    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = typeof str === 'string' ? str : String(str);

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A) // A-Z
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)] + hexTable[0x80 | ((c >> 12) & 0x3F)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

exports.compact = function (obj, references) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    var refs = references || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0; i < obj.length; ++i) {
            if (obj[i] && typeof obj[i] === 'object') {
                compacted.push(exports.compact(obj[i], refs));
            } else if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    keys.forEach(function (key) {
        obj[key] = exports.compact(obj[key], refs);
    });

    return obj;
};

exports.isRegExp = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

exports.isBuffer = function (obj) {
    if (obj === null || typeof obj === 'undefined') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

},{}],18:[function(_dereq_,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var qs = _dereq_('qs');

var urlRegex = /^(?:([^:/?#]+):(?=\/\/))?(?:\/\/(?:(.*?)@)?([^/?#]*)?)?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/;

var parseUrl = function parseUrl(url, parseQuery) {
  var match = urlRegex.exec(url);
  return match && {
    protocol: match[1] || '',
    auth: match[2] || '',
    host: match[3] || '',
    pathname: match[4] || '',
    query: parseQuery === true ? qs.parse(match[5]) : match[5],
    hash: decodeURIComponent(match[6] || '')
  };
};

var url = {
  parse: parseUrl,
  create: function create(options) {
    options.protocol = options.protocol || 'http';
    options.host = options.host || 'localhost';
    return options.protocol + '://' + options.host + url.createPath(options.pathname, options.query, options.hash);
  },
  createPath: function createPath(pathname, query, hash) {
    if ((typeof pathname === 'undefined' ? 'undefined' : _typeof(pathname)) === 'object' && pathname !== null) {
      query = pathname.query;
      hash = pathname.hash;
      pathname = pathname.pathname;
    }
    pathname = pathname || '/';
    pathname = pathname.charAt(0) === '/' ? pathname : '/' + pathname;
    query = query ? typeof query === 'string' ? query : '?' + qs.stringify(query) : '';
    hash = hash ? '#' + encodeURIComponent(hash) : '';
    return pathname + query + hash;
  },
  qs: qs
};

module.exports = url;
},{"qs":14}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy8uNi4wLjFAYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYnVpbGQvbW9kdWxlcy9Qcm92aWRlci5qcyIsImJ1aWxkL21vZHVsZXMvZWFzeS1yZWFjdC5qcyIsImJ1aWxkL21vZHVsZXMvbGliL0Vhc3lSZWFjdC5qcyIsImJ1aWxkL21vZHVsZXMvbGliL0hpc3RvcnkuanMiLCJidWlsZC9tb2R1bGVzL2xpYi9MaW5rLmpzIiwibm9kZV9tb2R1bGVzL2pzb25zdG9yZS1qcy9saWIvSlNPTkRhdGFTdG9yZS5qcyIsIm5vZGVfbW9kdWxlcy9qc29uc3RvcmUtanMvbGliL2FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2pzb25zdG9yZS1qcy9saWIvb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2pzb25zdG9yZS1qcy9saWIvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvanNvbnN0b3JlLWpzL3N0b3JlLmpzIiwibm9kZV9tb2R1bGVzL21pbmktcm91dGVyanMvbGliL3JvdXRlLWNvbXBpbGVyLmpzIiwibm9kZV9tb2R1bGVzL21pbmktcm91dGVyanMvcm91dGVyLmpzIiwibm9kZV9tb2R1bGVzL3FzL2xpYi9mb3JtYXRzLmpzIiwibm9kZV9tb2R1bGVzL3FzL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9xcy9saWIvcGFyc2UuanMiLCJub2RlX21vZHVsZXMvcXMvbGliL3N0cmluZ2lmeS5qcyIsIm5vZGVfbW9kdWxlcy9xcy9saWIvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvc2ltcGxlLXVybC91cmwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVhc3lSZWFjdCA9IHJlcXVpcmUoJy4vbGliL0Vhc3lSZWFjdCcpO1xudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1JlYWN0J10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydSZWFjdCddIDogbnVsbCk7XG52YXIgTGluayA9IHJlcXVpcmUoJy4vbGliL0xpbmsnKTtcblxudmFyIFByb3ZpZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBkaXNwbGF5TmFtZTogJ1Byb3ZpZGVyJyxcbiAgZ2V0Q2hpbGRDb250ZXh0OiBmdW5jdGlvbiBnZXRDaGlsZENvbnRleHQoKSB7XG4gICAgdmFyIGFwcCA9IHRoaXMucHJvcHMuYXBwO1xuICAgIHJldHVybiB7XG4gICAgICB1cGRhdGU6IGFwcC51cGRhdGUuYmluZChhcHApLFxuICAgICAgdG86IGFwcC50by5iaW5kKGFwcCksXG4gICAgICBMaW5rOiBMaW5rKGFwcClcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmNoaWxkcmVuO1xuICB9XG59KTtcblxuUHJvdmlkZXIuUHJvcFR5cGVzID0ge1xuICBhcHA6IFJlYWN0LlByb3BUeXBlcy5pbnN0YW5jZU9mKEVhc3lSZWFjdClcbn07XG5cblByb3ZpZGVyLmNoaWxkQ29udGV4dFR5cGVzID0ge1xuICB1cGRhdGU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIHRvOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICBMaW5rOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVhc3lSZWFjdCA9IHJlcXVpcmUoJy4vbGliL0Vhc3lSZWFjdCcpO1xudmFyIFByb3ZpZGVyID0gcmVxdWlyZSgnLi9Qcm92aWRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQXBwOiBFYXN5UmVhY3QsXG4gIFByb3ZpZGVyOiBQcm92aWRlclxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdERPTVNlcnZlciA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydSZWFjdERPTVNlcnZlciddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnUmVhY3RET01TZXJ2ZXInXSA6IG51bGwpO1xudmFyIFJlYWN0RE9NID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1JlYWN0RE9NJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydSZWFjdERPTSddIDogbnVsbCk7XG52YXIgUm91dGVyID0gcmVxdWlyZSgnbWluaS1yb3V0ZXJqcycpO1xudmFyIEpTT05TdG9yZSA9IHJlcXVpcmUoJ2pzb25zdG9yZS1qcycpO1xudmFyIEhpc3RvcnkgPSByZXF1aXJlKCcuL0hpc3RvcnknKTtcblxuZnVuY3Rpb24gRWFzeVJlYWN0KG9wdGlvbnMpIHtcbiAgdGhpcy5pc0Jyb3dzZXJDb250ZXh0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG4gIHRoaXMudmlldyA9IG51bGw7XG5cbiAgdGhpcy5zdG9yZSA9IG5ldyBKU09OU3RvcmUoe1xuICAgIHN0b3JlOiBvcHRpb25zLnN0b3JlIHx8IHt9XG4gIH0pO1xuXG4gIHRoaXMucm91dGVyID0gbmV3IFJvdXRlcih7XG4gICAgc3RyaWN0OiBvcHRpb25zLnN0cmljdCAhPT0gZmFsc2VcbiAgfSk7XG5cbiAgdGhpcy5yZUluaXRTdG9yZSA9ICF0aGlzLmlzQnJvd3NlckNvbnRleHQ7XG5cbiAgdGhpcy5yb3V0ZXIuY3JlYXRlTWlzbWF0Y2goZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudmlldyA9IG51bGw7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgaWYgKHRoaXMuaXNCcm93c2VyQ29udGV4dCkge1xuICAgIHRoaXMuaGlzdG9yeSA9IG5ldyBIaXN0b3J5KHtcbiAgICAgIG9uSGlzdG9yeUNoYW5nZTogdGhpcy5fb25IaXN0b3J5Q2hhbmdlLmJpbmQodGhpcyksXG4gICAgICBoaXN0b3J5VHlwZTogb3B0aW9ucy5oaXN0b3J5VHlwZVxuICAgIH0pO1xuICAgIHRoaXMudmlld0NvbnRhaW5lciA9IHdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKG9wdGlvbnMudmlld0NvbnRhaW5lcik7XG4gIH1cbn1cblxuRWFzeVJlYWN0LnByb3RvdHlwZSA9IHtcbiAgX21vdW50VmlldzogZnVuY3Rpb24gX21vdW50Vmlldyh2aWV3KSB7XG4gICAgUmVhY3RET00ucmVuZGVyKHZpZXcsIHRoaXMudmlld0NvbnRhaW5lcik7XG4gIH0sXG4gIF9vbkhpc3RvcnlDaGFuZ2U6IGZ1bmN0aW9uIF9vbkhpc3RvcnlDaGFuZ2UocGF0aCkge1xuICAgIHRoaXMucm91dGVyLm1hdGNoKHBhdGgpO1xuICAgIHRoaXMuX21vdW50Vmlldyh0aGlzLmdldFZpZXcocGF0aCkpO1xuICB9LFxuICBjcmVhdGVSb3V0ZTogZnVuY3Rpb24gY3JlYXRlUm91dGUocm91dGUsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5yb3V0ZXIuY3JlYXRlKHJvdXRlLCBmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgdGhpcy52aWV3ID0gY2FsbGJhY2socmVxdWVzdCwgdGhpcy5zdG9yZS5nZXQoKSk7XG4gICAgICBpZiAodGhpcy5yZUluaXRTdG9yZSkge1xuICAgICAgICB0aGlzLnN0b3JlLnJlSW5pdCgpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG4gIGNyZWF0ZU1pc21hdGNoOiBmdW5jdGlvbiBjcmVhdGVNaXNtYXRjaChjYWxsYmFjaykge1xuICAgIHRoaXMucm91dGVyLmNyZWF0ZU1pc21hdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMudmlldyA9IGNhbGxiYWNrKHRoaXMuc3RvcmUuZ2V0KCkpIHx8IG51bGw7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcbiAgZ2V0VmlldzogZnVuY3Rpb24gZ2V0VmlldyhwYXRoLCBzdHJpbmdpZnkpIHtcbiAgICB0aGlzLnJvdXRlci5tYXRjaChwYXRoKTtcbiAgICByZXR1cm4gc3RyaW5naWZ5ID09PSB0cnVlID8gUmVhY3RET01TZXJ2ZXIucmVuZGVyVG9TdHJpbmcodGhpcy52aWV3KSA6IHRoaXMudmlldztcbiAgfSxcbiAgdXBkYXRlU3RvcmU6IGZ1bmN0aW9uIHVwZGF0ZVN0b3JlKG5hbWUsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZikge1xuICAgIHJldHVybiB0aGlzLnN0b3JlLmRvKG5hbWUsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZik7XG4gIH0sXG4gIHRvOiBmdW5jdGlvbiB0byh1cmwsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBpZiAodHlwZW9mIGFjdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmVzdWx0ID0gdGhpcy5zdG9yZS5kbyhhY3Rpb24sIGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgIH1cbiAgICB0aGlzLmhpc3RvcnkudXBkYXRlVXJsKHVybCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUobmFtZSwgYWN0aW9uLCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgYWN0aW9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXN1bHQgPSB0aGlzLnN0b3JlLmRvKG5hbWUsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZik7XG4gICAgfVxuICAgIHZhciB2aWV3ID0gdGhpcy5nZXRWaWV3KHRoaXMuaGlzdG9yeS5nZXRDdXJyZW50VXJsKHRydWUpKTtcbiAgICB0aGlzLl9tb3VudFZpZXcodmlldyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcbiAgZ2V0U3RvcmU6IGZ1bmN0aW9uIGdldFN0b3JlKHBhdGgsIGNvcHkpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9yZS5nZXQocGF0aCwgY29weSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWFzeVJlYWN0OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHVybFBhcnNlciA9IHJlcXVpcmUoJ3NpbXBsZS11cmwnKTtcbnZhciBoaXN0b3J5VHlwZXMgPSB7XG4gICdoNSc6ICdoNScsXG4gICdoYXNoJzogJ2hhc2gnXG59O1xuXG5mdW5jdGlvbiBIaXN0b3J5KG9wdGlvbnMpIHtcbiAgdGhpcy5oaXN0b3J5VHlwZSA9IGhpc3RvcnlUeXBlc1tvcHRpb25zLmhpc3RvcnlUeXBlXSB8fCB0aGlzLl9kZXRlY3RIaXN0b3J5VHlwZSgpO1xuICB0aGlzLm9uSGlzdG9yeUNoYW5nZSA9IHR5cGVvZiBvcHRpb25zLm9uSGlzdG9yeUNoYW5nZSA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMub25IaXN0b3J5Q2hhbmdlIDogZnVuY3Rpb24gKCkge307XG4gIHRoaXMuX2luaXQoKTtcbn1cblxuSGlzdG9yeS5wcm90b3R5cGUgPSB7XG4gIHVwZGF0ZVVybDogZnVuY3Rpb24gdXBkYXRlVXJsKHVybCkge1xuICAgIHVybCA9IHRoaXMuX2Zvcm1hdFVybCh1cmwsIHRydWUpO1xuICAgIGlmICh0aGlzLmhpc3RvcnlUeXBlID09PSAnaDUnKSB7XG4gICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUoe30sICcnLCB1cmwpO1xuICAgICAgdGhpcy5vbkhpc3RvcnlDaGFuZ2UodGhpcy5fZm9ybWF0VXJsKHVybCwgdHJ1ZSkpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5oaXN0b3J5VHlwZSA9PT0gJ2hhc2gnKSB7XG4gICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IHVybDtcbiAgICB9XG4gIH0sXG4gIGdldEN1cnJlbnRVcmw6IGZ1bmN0aW9uIGdldEN1cnJlbnRVcmwocGF0aE9ubHkpIHtcbiAgICByZXR1cm4gdGhpcy5fZm9ybWF0VXJsKHdpbmRvdy5sb2NhdGlvbi5ocmVmLCBwYXRoT25seSk7XG4gIH0sXG4gIF9kZXRlY3RIaXN0b3J5VHlwZTogZnVuY3Rpb24gX2RldGVjdEhpc3RvcnlUeXBlKCkge1xuICAgIHJldHVybiB0eXBlb2Ygd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlID09PSAnZnVuY3Rpb24nID8gJ2g1JyA6ICdoYXNoJztcbiAgfSxcbiAgX2lzSGFzaFVybDogZnVuY3Rpb24gX2lzSGFzaFVybChoYXNoKSB7XG4gICAgcmV0dXJuIGhhc2guY2hhckF0KDApID09PSAnLyc7XG4gIH0sXG4gIF9mb3JtYXRVcmw6IGZ1bmN0aW9uIF9mb3JtYXRVcmwodXJsLCBwYXRoT25seSkge1xuICAgIHZhciB1cmxPYmogPSB1cmxQYXJzZXIucGFyc2UodXJsLCBmYWxzZSk7XG4gICAgaWYgKHRoaXMuX2lzSGFzaFVybCh1cmxPYmouaGFzaCkpIHtcbiAgICAgIHVybE9iaiA9IHVybFBhcnNlci5wYXJzZSh1cmxPYmouaGFzaCwgZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aE9ubHkgPT09IHRydWUgPyB1cmxQYXJzZXIuY3JlYXRlUGF0aCh1cmxPYmoucGF0aG5hbWUsIHVybE9iai5xdWVyeSwgdXJsT2JqLmhhc2gpIDogdXJsUGFyc2VyLmNyZWF0ZSh1cmxPYmopO1xuICB9LFxuICBfaW5pdDogZnVuY3Rpb24gX2luaXQoKSB7XG4gICAgaWYgKHRoaXMuaGlzdG9yeVR5cGUgPT09ICdoNScpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicG9wc3RhdGVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm9uSGlzdG9yeUNoYW5nZSh0aGlzLmdldEN1cnJlbnRVcmwodHJ1ZSkpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaGlzdG9yeVR5cGUgPT09ICdoYXNoJykge1xuICAgICAgdmFyIGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xuICAgICAgaWYgKGxvY2F0aW9uLnBhdGhuYW1lLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyMnICsgbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2ggKyBsb2NhdGlvbi5oYXNoO1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgfVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJoYXNoY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5vbkhpc3RvcnlDaGFuZ2UodGhpcy5nZXRDdXJyZW50VXJsKHRydWUpKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEhpc3Rvcnk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9O1xuXG52YXIgUmVhY3QgPSAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvd1snUmVhY3QnXSA6IHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxbJ1JlYWN0J10gOiBudWxsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYXBwKSB7XG4gIHJldHVybiBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgX29uTGlua0NsaWNrOiBmdW5jdGlvbiBfb25MaW5rQ2xpY2soZXZlbnQpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMub25DbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLnByb3BzLm9uQ2xpY2soZXZlbnQpO1xuICAgICAgfVxuICAgICAgYXBwLnRvKGV2ZW50LnRhcmdldC5ocmVmKTtcbiAgICB9LFxuICAgIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICdhJyxcbiAgICAgICAgX2V4dGVuZHMoe30sIHRoaXMucHJvcHMsIHsgb25DbGljazogdGhpcy5fb25MaW5rQ2xpY2sgfSksXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgYXJyYXkgPSByZXF1aXJlKCcuL2FycmF5Jyk7XG52YXIgb2JqZWN0ID0gcmVxdWlyZSgnLi9vYmplY3QnKTtcblxudmFyIHBhdGNoVHlwZXMgPSB7XG4gIGFkZDogJ2FkZCcsXG4gIHJlbW92ZTogJ3JlbW92ZScsXG4gIHVwZGF0ZTogJ3VwZGF0ZScsXG4gIG1vdmVVcDogJ21vdmVVcCcsXG4gIG1vdmVEb3duOiAnbW92ZURvd24nLFxuICBtb3ZlVG86ICdtb3ZlVG8nLFxuICBleGNoYW5nZTogJ2V4Y2hhbmdlJyxcbiAgZXh0ZW5kT2JqZWN0OiAnZXh0ZW5kT2JqZWN0JyxcbiAgc3ByZWFkQXJyYXk6ICdzcHJlYWRBcnJheScsXG4gIHNwcmVhZDJkQXJyYXlDb2w6ICdzcHJlYWQyZEFycmF5Q29sJyxcbiAgc3ByZWFkMmRBcnJheVJvdzogJ3NwcmVhZDJkQXJyYXlSb3cnXG59O1xuXG52YXIgY3JlYXRlUGF0Y2ggPSBmdW5jdGlvbiBjcmVhdGVQYXRjaCh0eXBlLCBhcmdzKSB7XG4gIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzKTtcbiAgcmV0dXJuIHV0aWxzLmNvcHkoe1xuICAgIHR5cGU6IHR5cGUsXG4gICAgYXJnczogYXJnc1xuICB9KTtcbn07XG5cbi8qKlxuICogY3JlYXRlIHBhdGNoIG9wZXJhdGlvbnNcbiAqICovXG5cbnZhciBwYXRjaE1ldGhvZHMgPSB7XG4gIGNyZWF0ZUFkZDogZnVuY3Rpb24gY3JlYXRlQWRkKHBhdGgsIHZhbHVlLCBrZXkpIHtcbiAgICByZXR1cm4gY3JlYXRlUGF0Y2gocGF0Y2hUeXBlcy5hZGQsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGNyZWF0ZVJlbW92ZTogZnVuY3Rpb24gY3JlYXRlUmVtb3ZlKHBhdGgpIHtcbiAgICByZXR1cm4gY3JlYXRlUGF0Y2gocGF0Y2hUeXBlcy5yZW1vdmUsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGNyZWF0ZVVwZGF0ZTogZnVuY3Rpb24gY3JlYXRlVXBkYXRlKHBhdGgsIHZhbHVlLCBmb3JjZVVwZGF0ZSkge1xuICAgIHJldHVybiBjcmVhdGVQYXRjaChwYXRjaFR5cGVzLnVwZGF0ZSwgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlTW92ZVVwOiBmdW5jdGlvbiBjcmVhdGVNb3ZlVXAocGF0aCkge1xuICAgIHJldHVybiBjcmVhdGVQYXRjaChwYXRjaFR5cGVzLm1vdmVVcCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlTW92ZURvd246IGZ1bmN0aW9uIGNyZWF0ZU1vdmVEb3duKHBhdGgpIHtcbiAgICByZXR1cm4gY3JlYXRlUGF0Y2gocGF0Y2hUeXBlcy5tb3ZlRG93biwgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlTW92ZVRvOiBmdW5jdGlvbiBjcmVhdGVNb3ZlVG8oZnJvbSwgdG8sIGtleSkge1xuICAgIHJldHVybiBjcmVhdGVQYXRjaChwYXRjaFR5cGVzLm1vdmVUbywgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlRXhjaGFuZ2U6IGZ1bmN0aW9uIGNyZWF0ZUV4Y2hhbmdlKGZyb20sIHRvKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVBhdGNoKHBhdGNoVHlwZXMuZXhjaGFuZ2UsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGNyZWF0ZUV4dGVuZE9iamVjdDogZnVuY3Rpb24gY3JlYXRlRXh0ZW5kT2JqZWN0KHBhdGgsIGEsIGIsIGMsIGQsIGUpIHtcbiAgICByZXR1cm4gY3JlYXRlUGF0Y2gocGF0Y2hUeXBlcy5leHRlbmRPYmplY3QsIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGNyZWF0ZVNwcmVhZEFycmF5OiBmdW5jdGlvbiBjcmVhdGVTcHJlYWRBcnJheShwYXRoLCBiZWdpbiwgaW5maWxsaW5nKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVBhdGNoKHBhdGNoVHlwZXMuc3ByZWFkQXJyYXksIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGNyZWF0ZVNwcmVhZDJkQXJyYXlSb3c6IGZ1bmN0aW9uIGNyZWF0ZVNwcmVhZDJkQXJyYXlSb3cocGF0aCwgYmVnaW4sIHJvd3MpIHtcbiAgICByZXR1cm4gY3JlYXRlUGF0Y2gocGF0Y2hUeXBlcy5zcHJlYWQyZEFycmF5Um93LCBhcmd1bWVudHMpO1xuICB9LFxuICBjcmVhdGVTcHJlYWQyZEFycmF5Q29sOiBmdW5jdGlvbiBjcmVhdGVTcHJlYWQyZEFycmF5Q29sKHBhdGgsIGJlZ2luLCBjb2xzKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVBhdGNoKHBhdGNoVHlwZXMuc3ByZWFkMmRBcnJheUNvbCwgYXJndW1lbnRzKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gSlNPTkRhdGFTdG9yZShvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLmluaXRpYWxPcHRpb25zID0gdXRpbHMuY29weShvcHRpb25zKTtcbiAgdmFyIHN0b3JlID0gb3B0aW9ucy5zdG9yZSxcbiAgICAgIGNvcHlTdG9yZSA9IG9wdGlvbnMuY29weVN0b3JlICE9PSBmYWxzZTtcbiAgdGhpcy5zdG9yZSA9IGNvcHlTdG9yZSA/IHV0aWxzLmNvcHkoc3RvcmUpIDogc3RvcmU7XG4gIC8vICdkbycgYWJvdXQgYXR0cmlidXRlc1xuICB0aGlzLnBhdGNoZXMgPSBbXTtcbiAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMgPSBbXTtcbiAgdGhpcy5iYWNrUGF0Y2hlcyA9IFtdO1xuICB0aGlzLmN1cnJlbnRQYXRoID0gW107XG4gIHRoaXMuaXNEb2luZyA9IGZhbHNlO1xufVxuXG5KU09ORGF0YVN0b3JlLnByb3RvdHlwZSA9IHtcbiAgX2dldFJlZjogZnVuY3Rpb24gX2dldFJlZihwYXRoKSB7XG4gICAgdmFyIHJlZiA9IHRoaXMuc3RvcmUsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICByZWYgPSByZWZbcGF0aFtpXV07XG4gICAgfVxuICAgIHJldHVybiByZWY7XG4gIH0sXG4gIF9kZXRlY3RQYXRoOiBmdW5jdGlvbiBfZGV0ZWN0UGF0aChwYXRoKSB7XG4gICAgdmFyIGRldGVjdGVkID0gW10sXG4gICAgICAgIHJlZiA9IHRoaXMuc3RvcmUsXG4gICAgICAgIGkgPSAwLFxuICAgICAgICBsZW4gPSBwYXRoLmxlbmd0aCxcbiAgICAgICAga2V5LFxuICAgICAgICBrZXlUeXBlLFxuICAgICAgICByZWZUeXBlO1xuICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGtleSA9IHBhdGhbaV07XG4gICAgICBrZXlUeXBlID0gdXRpbHMudHlwZShrZXkpO1xuICAgICAgcmVmVHlwZSA9IHV0aWxzLnR5cGUocmVmKTtcbiAgICAgIGlmIChyZWZUeXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwoa2V5LCAnX192YWx1ZScpKSB7XG4gICAgICAgICAgdmFyIG9iaktleSA9IG9iamVjdC5nZXRPYmplY3RLZXlCeVZhbHVlKHJlZiwga2V5Ll9fdmFsdWUpO1xuICAgICAgICAgIGlmIChvYmpLZXkpIHtcbiAgICAgICAgICAgIHJlZiA9IHJlZltvYmpLZXldO1xuICAgICAgICAgICAgZGV0ZWN0ZWQucHVzaChvYmpLZXkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlZiwga2V5KSkge1xuICAgICAgICAgIHJlZiA9IHJlZltrZXldO1xuICAgICAgICAgIGRldGVjdGVkLnB1c2goa2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAocmVmVHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwoa2V5LCAnX192YWx1ZScpKSB7XG4gICAgICAgICAgdmFyIGluZGV4ID0gYXJyYXkuZ2V0QXJyYXlJbmRleEJ5VmFsdWUocmVmLCBrZXkuX192YWx1ZSk7XG4gICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHJlZiA9IHJlZltpbmRleF07XG4gICAgICAgICAgICBkZXRlY3RlZC5wdXNoKGluZGV4KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChyZWYsIGtleSkpIHtcbiAgICAgICAgICByZWYgPSByZWZba2V5XTtcbiAgICAgICAgICBkZXRlY3RlZC5wdXNoKGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZXRlY3RlZDtcbiAgfSxcbiAgX2Zvcm1hdFBhdGg6IGZ1bmN0aW9uIF9mb3JtYXRQYXRoKHBhdGgsIGRldGVjdCkge1xuICAgIHZhciBwYXRoVHlwZSA9IHV0aWxzLnR5cGUocGF0aCk7XG4gICAgaWYgKHBhdGhUeXBlID09PSAndW5kZWZpbmVkJyB8fCBwYXRoVHlwZSA9PT0gJ251bGwnKSB7XG4gICAgICBwYXRoID0gW107XG4gICAgfSBlbHNlIGlmIChwYXRoVHlwZSAhPT0gJ2FycmF5Jykge1xuICAgICAgcGF0aCA9IFtwYXRoXTtcbiAgICB9XG4gICAgaWYgKGRldGVjdCAhPT0gZmFsc2UpIHtcbiAgICAgIHZhciBkZXRlY3RlZCA9IHRoaXMuX2RldGVjdFBhdGgocGF0aCk7XG4gICAgICBpZiAoZGV0ZWN0ZWQubGVuZ3RoID09PSBwYXRoLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZGV0ZWN0ZWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGg7XG4gIH0sXG4gIF9tb3ZlQXJyYXlJdGVtOiBmdW5jdGlvbiBfbW92ZUFycmF5SXRlbShwYXRoLCBtb3ZlVXApIHtcbiAgICB2YXIgZnVsbFBhdGggPSB0aGlzLl9nZXRGdWxsUGF0aChwYXRoKTtcbiAgICBpZiAoIWZ1bGxQYXRoIHx8IGZ1bGxQYXRoLmxlbmd0aCA8IDEpIHJldHVybiB0aGlzO1xuICAgIHZhciBpdGVtSW5kZXggPSBmdWxsUGF0aC5wb3AoKSxcbiAgICAgICAgYXJyID0gdGhpcy5fZ2V0UmVmKGZ1bGxQYXRoKTtcbiAgICBpZiAodXRpbHMudHlwZShhcnIpICE9PSAnYXJyYXknKSByZXR1cm4gdGhpcztcbiAgICB2YXIgbWV0aG9kID0gbW92ZVVwID09PSB0cnVlID8gJ2NyZWF0ZU1vdmVVcCcgOiAnY3JlYXRlTW92ZURvd24nLFxuICAgICAgICByZXZlcnNlTWV0aG9kID0gbWV0aG9kID09PSAnY3JlYXRlTW92ZVVwJyA/ICdjcmVhdGVNb3ZlRG93bicgOiAnY3JlYXRlTW92ZVVwJztcbiAgICBpZiAodGhpcy5pc0RvaW5nKSB7XG4gICAgICB0aGlzLnBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHNbbWV0aG9kXShmdWxsUGF0aC5jb25jYXQoaXRlbUluZGV4KSkpO1xuICAgICAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHNbbWV0aG9kXSh0aGlzLl9nZXRSZWxhdGl2ZVBhdGgoZnVsbFBhdGguY29uY2F0KGl0ZW1JbmRleCkpKSk7XG4gICAgICBpZiAobW92ZVVwID09PSB0cnVlICYmIGl0ZW1JbmRleCA+IDAgfHwgbW92ZVVwICE9PSB0cnVlICYmIGl0ZW1JbmRleCA8IGFyci5sZW5ndGggLSAxKSB7XG4gICAgICAgIHRoaXMuYmFja1BhdGNoZXMudW5zaGlmdChwYXRjaE1ldGhvZHNbcmV2ZXJzZU1ldGhvZF0oZnVsbFBhdGguY29uY2F0KG1vdmVVcCA9PT0gdHJ1ZSA/IGl0ZW1JbmRleCAtIDEgOiBpdGVtSW5kZXggKyAxKSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobW92ZVVwID09PSB0cnVlKSB7XG4gICAgICBhcnJheS5tb3ZlQXJyYXlJdGVtVXAoYXJyLCBpdGVtSW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcnJheS5tb3ZlQXJyYXlJdGVtRG93bihhcnIsIGl0ZW1JbmRleCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBfZ2V0RnVsbFBhdGg6IGZ1bmN0aW9uIF9nZXRGdWxsUGF0aChwYXRoKSB7XG4gICAgdmFyIGN1cnJlbnRQYXRoID0gdGhpcy5fZm9ybWF0UGF0aCh0aGlzLmN1cnJlbnRQYXRoLCBmYWxzZSksXG4gICAgICAgIGZ1bGxQYXRoID0gY3VycmVudFBhdGguY29uY2F0KHRoaXMuX2Zvcm1hdFBhdGgocGF0aCwgZmFsc2UpKTtcbiAgICByZXR1cm4gdGhpcy5fZm9ybWF0UGF0aChmdWxsUGF0aCk7XG4gIH0sXG4gIF9nZXRSZWxhdGl2ZVBhdGg6IGZ1bmN0aW9uIF9nZXRSZWxhdGl2ZVBhdGgoZnVsbFBhdGgpIHtcbiAgICByZXR1cm4gZnVsbFBhdGguc2xpY2UodGhpcy5jdXJyZW50UGF0aC5sZW5ndGgpO1xuICB9LFxuICByZUluaXQ6IGZ1bmN0aW9uIHJlSW5pdChvcHRpb25zKSB7XG4gICAgSlNPTkRhdGFTdG9yZS5jYWxsKHRoaXMsIG9wdGlvbnMgfHwgdGhpcy5pbml0aWFsT3B0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIGdvVG86IGZ1bmN0aW9uIGdvVG8ocGF0aCwgYWRkVXApIHtcbiAgICBpZiAoIXRoaXMuaXNEb2luZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgYXJlIHVzaW5nIHN0b3JlLmdvVG8gb3V0c2lkZSBzdG9yZS5kbyEnKTtcbiAgICB9XG4gICAgaWYgKGFkZFVwID09PSB0cnVlKSB7XG4gICAgICB0aGlzLmN1cnJlbnRQYXRoID0gdGhpcy5fZm9ybWF0UGF0aCh0aGlzLmN1cnJlbnRQYXRoLmNvbmNhdCh0aGlzLl9mb3JtYXRQYXRoKHBhdGgsIGZhbHNlKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmN1cnJlbnRQYXRoID0gdGhpcy5fZm9ybWF0UGF0aChwYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIGRvOiBmdW5jdGlvbiBfZG8obmFtZSwgYWN0aW9uLCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHRoaXMuaXNEb2luZyA9IHRydWU7XG4gICAgaWYgKHR5cGVvZiBuYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBuYW1lKHRoaXMsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYWN0aW9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY3Rpb24odGhpcywgYSwgYiwgYywgZCwgZSwgZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwYXJhbWV0ZXIgYWN0aW9uLicpO1xuICAgIH1cbiAgICAvLyBjb21wb3NlIHJlc3VsdFxuICAgIHJlc3VsdC5wYXRjaGVzID0gdGhpcy5wYXRjaGVzO1xuICAgIHJlc3VsdC5yZWxhdGl2ZVBhdGNoZXMgPSB0aGlzLnJlbGF0aXZlUGF0Y2hlcztcbiAgICByZXN1bHQuYmFja1BhdGNoZXMgPSB0aGlzLmJhY2tQYXRjaGVzO1xuICAgIC8vIHJlc2V0ICdkbycgYWJvdXQgYXR0cmlidXRlc1xuICAgIHRoaXMucGF0Y2hlcyA9IFtdO1xuICAgIHRoaXMucmVsYXRpdmVQYXRjaGVzID0gW107XG4gICAgdGhpcy5iYWNrUGF0Y2hlcyA9IFtdO1xuICAgIHRoaXMuY3VycmVudFBhdGggPSBbXTtcbiAgICB0aGlzLmlzRG9pbmcgPSBmYWxzZTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuICBhZGQ6IGZ1bmN0aW9uIGFkZChwYXRoLCB2YWx1ZSwga2V5KSB7XG4gICAgdmFyIHJlZiwgcmVmVHlwZTtcbiAgICBwYXRoID0gdGhpcy5fZ2V0RnVsbFBhdGgocGF0aCk7XG4gICAgaWYgKCFwYXRoIHx8ICF1dGlscy5pc1JlZmVyZW5jZVR5cGUocmVmID0gdGhpcy5fZ2V0UmVmKHBhdGgpKSB8fCAocmVmVHlwZSA9IHV0aWxzLnR5cGUocmVmKSkgPT09ICdvYmplY3QnICYmICF1dGlscy5pc0NvbW1vbktleVR5cGUoa2V5KSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzRG9pbmcpIHtcbiAgICAgIHRoaXMucGF0Y2hlcy5wdXNoKHBhdGNoTWV0aG9kcy5jcmVhdGVBZGQocGF0aCwgdmFsdWUsIGtleSkpO1xuICAgICAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlQWRkKHRoaXMuX2dldFJlbGF0aXZlUGF0aChwYXRoKSwgdmFsdWUsIGtleSkpO1xuICAgICAgaWYgKHJlZlR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHRoaXMuYmFja1BhdGNoZXMudW5zaGlmdChwYXRjaE1ldGhvZHMuY3JlYXRlUmVtb3ZlKHBhdGguY29uY2F0KGtleSkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYmFja1BhdGNoZXMudW5zaGlmdChwYXRjaE1ldGhvZHMuY3JlYXRlVXBkYXRlKHBhdGgsIHRoaXMuZ2V0KHBhdGgpLCB0cnVlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZWZUeXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgcmVmW2tleV0gPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGluZGV4ID0gYXJyYXkucGFyc2VBcnJheUluZGV4KGtleSk7XG4gICAgICBpZiAoaW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZWYuc3BsaWNlKGluZGV4LCAwLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWYucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZShwYXRoKSB7XG4gICAgaWYgKCEocGF0aCA9IHRoaXMuX2dldEZ1bGxQYXRoKHBhdGgpKSkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHRoaXMuaXNEb2luZykge1xuICAgICAgdGhpcy5wYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVJlbW92ZShwYXRoKSk7XG4gICAgICB0aGlzLnJlbGF0aXZlUGF0Y2hlcy5wdXNoKHBhdGNoTWV0aG9kcy5jcmVhdGVSZW1vdmUodGhpcy5fZ2V0UmVsYXRpdmVQYXRoKHBhdGgpKSk7XG4gICAgICB0aGlzLmJhY2tQYXRjaGVzLnVuc2hpZnQocGF0Y2hNZXRob2RzLmNyZWF0ZVVwZGF0ZShwYXRoLCB0aGlzLmdldChwYXRoKSwgdHJ1ZSkpO1xuICAgIH1cbiAgICBpZiAocGF0aC5sZW5ndGggPCAxKSB7XG4gICAgICB0aGlzLnN0b3JlID0gdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciBsYXN0S2V5ID0gcGF0aC5wb3AoKSxcbiAgICAgICAgcmVmID0gdGhpcy5fZ2V0UmVmKHBhdGgpLFxuICAgICAgICByZWZUeXBlID0gdXRpbHMudHlwZShyZWYpO1xuICAgIGlmIChyZWZUeXBlID09PSAnYXJyYXknKSB7XG4gICAgICByZWYuc3BsaWNlKGxhc3RLZXksIDEpO1xuICAgIH0gZWxzZSBpZiAocmVmVHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGRlbGV0ZSByZWZbbGFzdEtleV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZShwYXRoLCB2YWx1ZSwgZm9yY2VVcGRhdGUpIHtcbiAgICBwYXRoID0gdGhpcy5fZm9ybWF0UGF0aChwYXRoLCBmYWxzZSk7XG4gICAgdmFyIGxhc3RLZXksXG4gICAgICAgIGZ1bGxQYXRoID0gdGhpcy5fZm9ybWF0UGF0aChwYXRoKTtcbiAgICBpZiAoZnVsbFBhdGgpIHtcbiAgICAgIGlmICh0aGlzLmlzRG9pbmcpIHtcbiAgICAgICAgdGhpcy5wYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVVwZGF0ZShmdWxsUGF0aCwgdmFsdWUpKTtcbiAgICAgICAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlVXBkYXRlKHRoaXMuX2dldFJlbGF0aXZlUGF0aChmdWxsUGF0aCksIHZhbHVlKSk7XG4gICAgICAgIHRoaXMuYmFja1BhdGNoZXMudW5zaGlmdChwYXRjaE1ldGhvZHMuY3JlYXRlVXBkYXRlKGZ1bGxQYXRoLCB0aGlzLmdldChmdWxsUGF0aCkpKTtcbiAgICAgIH1cbiAgICAgIGxhc3RLZXkgPSBmdWxsUGF0aC5wb3AoKTtcbiAgICAgIGlmIChsYXN0S2V5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fZ2V0UmVmKGZ1bGxQYXRoKVtsYXN0S2V5XSA9IHZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdG9yZSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIGlmIChmb3JjZVVwZGF0ZSA9PT0gdHJ1ZSAmJiBwYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgIGxhc3RLZXkgPSBwYXRoLnBvcCgpO1xuICAgICAgcmV0dXJuIHRoaXMuYWRkKHBhdGgsIHZhbHVlLCBsYXN0S2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIHNldDogZnVuY3Rpb24gc2V0KHBhdGgsIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlKHBhdGgsIHZhbHVlLCB0cnVlKTtcbiAgfSxcbiAgbW92ZVVwOiBmdW5jdGlvbiBtb3ZlVXAocGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9tb3ZlQXJyYXlJdGVtKHBhdGgsIHRydWUpO1xuICB9LFxuICBtb3ZlRG93bjogZnVuY3Rpb24gbW92ZURvd24ocGF0aCkge1xuICAgIHJldHVybiB0aGlzLl9tb3ZlQXJyYXlJdGVtKHBhdGgpO1xuICB9LFxuICBtb3ZlVG86IGZ1bmN0aW9uIG1vdmVUbyhmcm9tLCB0bywga2V5KSB7XG4gICAgZnJvbSA9IHRoaXMuX2dldEZ1bGxQYXRoKGZyb20pO1xuICAgIHRvID0gdGhpcy5fZ2V0RnVsbFBhdGgodG8pO1xuICAgIGlmICghZnJvbSB8fCAhdG8gfHwgIXV0aWxzLmlzUmVmZXJlbmNlVHlwZSh0aGlzLl9nZXRSZWYodG8pKSkgcmV0dXJuIHRoaXM7XG4gICAgdGhpcy5hZGQodG8sIHRoaXMuX2dldFJlZihmcm9tKSwga2V5KTtcbiAgICB0aGlzLnJlbW92ZShmcm9tKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgZXhjaGFuZ2U6IGZ1bmN0aW9uIGV4Y2hhbmdlKGZyb20sIHRvKSB7XG4gICAgZnJvbSA9IHRoaXMuX2Zvcm1hdFBhdGgoZnJvbSk7XG4gICAgdG8gPSB0aGlzLl9mb3JtYXRQYXRoKHRvKTtcbiAgICBpZiAoZnJvbSAmJiB0bykge1xuICAgICAgdmFyIGZyb21SZWYgPSB0aGlzLl9nZXRSZWYoZnJvbSksXG4gICAgICAgICAgdG9SZWYgPSB0aGlzLmdldCh0byk7XG4gICAgICB0aGlzLnVwZGF0ZShmcm9tLCB0b1JlZik7XG4gICAgICB0aGlzLnVwZGF0ZSh0bywgZnJvbVJlZik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBleHRlbmRPYmplY3Q6IGZ1bmN0aW9uIGV4dGVuZE9iamVjdChwYXRoLCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgdmFyIHJlZjtcbiAgICBpZiAoIShwYXRoID0gdGhpcy5fZm9ybWF0UGF0aChwYXRoKSkgfHwgdXRpbHMudHlwZShyZWYgPSB0aGlzLl9nZXRSZWYocGF0aCkpICE9PSAnb2JqZWN0JykgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHRoaXMuaXNEb2luZykge1xuICAgICAgdGhpcy5wYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZUV4dGVuZE9iamVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICAgIHRoaXMucmVsYXRpdmVQYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZUV4dGVuZE9iamVjdCh0aGlzLl9nZXRSZWxhdGl2ZVBhdGgocGF0aCksIGEsIGIsIGMsIGQsIGUsIGYpKTtcbiAgICAgIHRoaXMuYmFja1BhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlVXBkYXRlKHBhdGgsIHRoaXMuZ2V0KHBhdGgpKSk7XG4gICAgfVxuICAgIG9iamVjdC5leHRlbmQocmVmLCBhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc3ByZWFkQXJyYXk6IGZ1bmN0aW9uIHNwcmVhZEFycmF5KHBhdGgsIGJlZ2luLCBpbmZpbGxpbmcpIHtcbiAgICB2YXIgcmVmO1xuICAgIGlmICghKHBhdGggPSB0aGlzLl9mb3JtYXRQYXRoKHBhdGgpKSB8fCB1dGlscy50eXBlKHJlZiA9IHRoaXMuX2dldFJlZihwYXRoKSkgIT09ICdhcnJheScpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBiZWdpbiA9IGJlZ2luIHx8IHJlZi5sZW5ndGg7XG4gICAgaWYgKCEodXRpbHMudHlwZShiZWdpbikgPT09ICdudW1iZXInKSkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHRoaXMuaXNEb2luZykge1xuICAgICAgdGhpcy5wYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVNwcmVhZEFycmF5KHBhdGgsIGJlZ2luLCBpbmZpbGxpbmcpKTtcbiAgICAgIHRoaXMucmVsYXRpdmVQYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVNwcmVhZEFycmF5KHRoaXMuX2dldFJlbGF0aXZlUGF0aChwYXRoKSwgYmVnaW4sIGluZmlsbGluZykpO1xuICAgICAgdGhpcy5iYWNrUGF0Y2hlcy51bnNoaWZ0KHBhdGNoTWV0aG9kcy5jcmVhdGVVcGRhdGUocGF0aCwgdGhpcy5nZXQocGF0aCkpKTtcbiAgICB9XG4gICAgYXJyYXkuc3ByZWFkQXJyYXkocmVmLCBiZWdpbiwgaW5maWxsaW5nKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc3ByZWFkMmRBcnJheVJvdzogZnVuY3Rpb24gc3ByZWFkMmRBcnJheVJvdyhwYXRoLCBiZWdpbiwgcm93cykge1xuICAgIHZhciByZWY7XG4gICAgaWYgKCEocGF0aCA9IHRoaXMuX2Zvcm1hdFBhdGgocGF0aCkpIHx8ICFhcnJheS5pczJkQXJyYXkocmVmID0gdGhpcy5fZ2V0UmVmKHBhdGgpKSB8fCAhKHV0aWxzLnR5cGUoYmVnaW4pID09PSAnbnVtYmVyJykpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBiZWdpbiA9IGJlZ2luIHx8IHJlZi5sZW5ndGg7XG4gICAgaWYgKCEodXRpbHMudHlwZShiZWdpbikgPT09ICdudW1iZXInKSkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHRoaXMuaXNEb2luZykge1xuICAgICAgdGhpcy5wYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVNwcmVhZDJkQXJyYXlSb3cocGF0aCwgYmVnaW4sIHJvd3MpKTtcbiAgICAgIHRoaXMucmVsYXRpdmVQYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVNwcmVhZDJkQXJyYXlSb3codGhpcy5fZ2V0UmVsYXRpdmVQYXRoKHBhdGgpLCBiZWdpbiwgcm93cykpO1xuICAgICAgdGhpcy5iYWNrUGF0Y2hlcy51bnNoaWZ0KHBhdGNoTWV0aG9kcy5jcmVhdGVVcGRhdGUocGF0aCwgdGhpcy5nZXQocGF0aCkpKTtcbiAgICB9XG4gICAgYXJyYXkuc3ByZWFkMmRBcnJheVJvdyhyZWYsIGJlZ2luLCByb3dzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc3ByZWFkMmRBcnJheUNvbDogZnVuY3Rpb24gc3ByZWFkMmRBcnJheUNvbChwYXRoLCBiZWdpbiwgY29scykge1xuICAgIHZhciByZWY7XG4gICAgaWYgKCEocGF0aCA9IHRoaXMuX2Zvcm1hdFBhdGgocGF0aCkpIHx8ICFhcnJheS5pczJkQXJyYXkocmVmID0gdGhpcy5fZ2V0UmVmKHBhdGgpKSB8fCAhKHV0aWxzLnR5cGUoYmVnaW4pID09PSAnbnVtYmVyJykpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBiZWdpbiA9IGJlZ2luIHx8IHJlZi5sZW5ndGg7XG4gICAgaWYgKCEodXRpbHMudHlwZShiZWdpbikgPT09ICdudW1iZXInKSkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKHRoaXMuaXNEb2luZykge1xuICAgICAgdGhpcy5wYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVNwcmVhZDJkQXJyYXlDb2wocGF0aCwgYmVnaW4sIGNvbHMpKTtcbiAgICAgIHRoaXMucmVsYXRpdmVQYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVNwcmVhZDJkQXJyYXlDb2wodGhpcy5fZ2V0UmVsYXRpdmVQYXRoKHBhdGgpLCBiZWdpbiwgY29scykpO1xuICAgICAgdGhpcy5iYWNrUGF0Y2hlcy51bnNoaWZ0KHBhdGNoTWV0aG9kcy5jcmVhdGVVcGRhdGUocGF0aCwgdGhpcy5nZXQocGF0aCkpKTtcbiAgICB9XG4gICAgYXJyYXkuc3ByZWFkMmRBcnJheUNvbChyZWYsIGJlZ2luLCBjb2xzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgZ2V0OiBmdW5jdGlvbiBnZXQocGF0aCwgY29weSkge1xuICAgIGlmIChwYXRoID0gdGhpcy5fZ2V0RnVsbFBhdGgocGF0aCkpIHtcbiAgICAgIHJldHVybiBjb3B5ID09PSBmYWxzZSA/IHRoaXMuX2dldFJlZihwYXRoKSA6IHV0aWxzLmNvcHkodGhpcy5fZ2V0UmVmKHBhdGgpKTtcbiAgICB9XG4gIH0sXG4gIHBhdGNoOiBwYXRjaE1ldGhvZHMsXG4gIGFwcGx5UGF0Y2g6IGZ1bmN0aW9uIGFwcGx5UGF0Y2gocGF0Y2hlcykge1xuICAgIHBhdGNoZXMgPSB1dGlscy50eXBlKHBhdGNoZXMpID09PSAnYXJyYXknID8gcGF0Y2hlcyA6IFtwYXRjaGVzXTtcbiAgICBwYXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKHBhdGNoKSB7XG4gICAgICB0aGlzW3BhdGNoLnR5cGVdLmFwcGx5KHRoaXMsIHBhdGNoLmFyZ3MpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn07XG5cbkpTT05EYXRhU3RvcmUucGF0Y2ggPSBwYXRjaE1ldGhvZHM7XG5cbm1vZHVsZS5leHBvcnRzID0gSlNPTkRhdGFTdG9yZTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIHNwbGljZSA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2U7XG5cbnZhciBjcmVhdGVBcnJheSA9IGZ1bmN0aW9uIGNyZWF0ZUFycmF5KGxlbmd0aCwgaW5maWxsaW5nKSB7XG4gIGxlbmd0aCA9IGxlbmd0aCB8fCAwO1xuICB2YXIgYXJyID0gW10sXG4gICAgICBpID0gMDtcbiAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGFyci5wdXNoKGluZmlsbGluZyA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGluZmlsbGluZyk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn07XG5cbnZhciBpczJkQXJyYXkgPSBmdW5jdGlvbiBpczJkQXJyYXkoYXJyKSB7XG4gIHZhciBpczJkO1xuICBpZiAoaXMyZCA9IHV0aWxzLnR5cGUoYXJyKSA9PT0gJ2FycmF5JyAmJiBhcnIubGVuZ3RoID4gMCkge1xuICAgIHZhciBpID0gMCxcbiAgICAgICAgbGVuID0gYXJyLmxlbmd0aDtcbiAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBpczJkICY9IHV0aWxzLnR5cGUoYXJyW2ldKSA9PT0gJ2FycmF5JztcbiAgICAgIGlmICghaXMyZCkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG52YXIgY3JlYXRlMmRBcnJheSA9IGZ1bmN0aW9uIGNyZWF0ZTJkQXJyYXkocm93LCBjb2wsIGluZmlsbGluZykge1xuICByb3cgPSByb3cgfHwgMDtcbiAgY29sID0gY29sIHx8IDA7XG4gIHZhciBhcnIgPSBuZXcgQXJyYXkocm93KSxcbiAgICAgIGkgPSAwO1xuICBmb3IgKDsgaSA8IHJvdzsgaSsrKSB7XG4gICAgYXJyW2ldID0gY3JlYXRlQXJyYXkoY29sLCBpbmZpbGxpbmcpO1xuICB9XG4gIHJldHVybiBhcnI7XG59O1xuXG52YXIgcGFyc2VBcnJheUluZGV4ID0gZnVuY3Rpb24gcGFyc2VBcnJheUluZGV4KGluZGV4KSB7XG4gIHZhciB0eXBlID0gdXRpbHMudHlwZShpbmRleCk7XG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyB8fCB0eXBlID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBwYXJzZUludChpbmRleCk7XG4gIH1cbiAgcmV0dXJuIHZvaWQgMDtcbn07XG5cbnZhciBnZXRBcnJheUluZGV4QnlWYWx1ZSA9IGZ1bmN0aW9uIGdldEFycmF5SW5kZXhCeVZhbHVlKGFyciwgdmFsdWUpIHtcbiAgaWYgKHV0aWxzLnR5cGUoYXJyKSA9PT0gJ2FycmF5Jykge1xuICAgIHZhciB2YWx1ZVR5cGUgPSB1dGlscy50eXBlKHZhbHVlKTtcbiAgICBpZiAodmFsdWVUeXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgIGxlbiA9IGFyci5sZW5ndGgsXG4gICAgICAgICAgaXRlbTtcbiAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGFycltpXTtcbiAgICAgICAgdmFyIGlzRXF1YWwgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIGlzRXF1YWwgPSBpdGVtW2tleV0gPT09IHZhbHVlW2tleV07XG4gICAgICAgICAgICBpZiAoIWlzRXF1YWwpIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNFcXVhbCkge1xuICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhcnIuaW5kZXhPZih2YWx1ZSk7XG4gICAgfVxuICB9XG59O1xuXG52YXIgbW92ZUFycmF5SXRlbVVwID0gZnVuY3Rpb24gbW92ZUFycmF5SXRlbVVwKGFyciwgaW5kZXgpIHtcbiAgaWYgKHV0aWxzLnR5cGUoYXJyKSA9PT0gJ2FycmF5Jykge1xuICAgIGluZGV4ID0gcGFyc2VBcnJheUluZGV4KGluZGV4KTtcbiAgICB2YXIgY3Vyckl0ZW0gPSBhcnJbaW5kZXhdO1xuICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgIGFycltpbmRleF0gPSBhcnJbaW5kZXggLSAxXTtcbiAgICAgIGFycltpbmRleCAtIDFdID0gY3Vyckl0ZW07XG4gICAgfVxuICB9XG59O1xuXG52YXIgbW92ZUFycmF5SXRlbURvd24gPSBmdW5jdGlvbiBtb3ZlQXJyYXlJdGVtRG93bihhcnIsIGluZGV4KSB7XG4gIGlmICh1dGlscy50eXBlKGFycikgPT09ICdhcnJheScpIHtcbiAgICBpbmRleCA9IHBhcnNlQXJyYXlJbmRleChpbmRleCk7XG4gICAgdmFyIGN1cnJJdGVtID0gYXJyW2luZGV4XTtcbiAgICBpZiAoaW5kZXggPCBhcnIubGVuZ3RoIC0gMSkge1xuICAgICAgYXJyW2luZGV4XSA9IGFycltpbmRleCArIDFdO1xuICAgICAgYXJyW2luZGV4ICsgMV0gPSBjdXJySXRlbTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBzcHJlYWRBcnJheSA9IGZ1bmN0aW9uIHNwcmVhZEFycmF5KGFyciwgYmVnaW4sIGluZmlsbGluZykge1xuICB2YXIgZGVsZXRlZCA9IFtdO1xuICBpZiAodXRpbHMudHlwZShhcnIpID09PSAnYXJyYXknKSB7XG4gICAgdmFyIGluZmlsbGluZ1R5cGUgPSB1dGlscy50eXBlKGluZmlsbGluZyk7XG4gICAgaWYgKGluZmlsbGluZ1R5cGUgPT09ICdhcnJheScpIHtcbiAgICAgIHNwbGljZS5hcHBseShhcnIsIFtiZWdpbiwgMF0uY29uY2F0KGluZmlsbGluZykpO1xuICAgIH0gZWxzZSBpZiAoaW5maWxsaW5nVHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGlmIChpbmZpbGxpbmcgPiAwKSB7XG4gICAgICAgIHNwbGljZS5hcHBseShhcnIsIFtiZWdpbiwgMF0uY29uY2F0KGNyZWF0ZUFycmF5KGluZmlsbGluZykpKTtcbiAgICAgIH0gZWxzZSBpZiAoaW5maWxsaW5nIDwgMCkge1xuICAgICAgICBkZWxldGVkID0gc3BsaWNlLmFwcGx5KGFyciwgW2JlZ2luLCBNYXRoLmFicyhpbmZpbGxpbmcpXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWxldGVkO1xufTtcblxudmFyIHNwcmVhZDJkQXJyYXlSb3cgPSBmdW5jdGlvbiBzcHJlYWQyZEFycmF5Um93KGFyciwgYmVnaW4sIHJvd3MpIHtcbiAgdmFyIGRlbGV0ZWQgPSBbXSxcbiAgICAgIHJvd3NUeXBlID0gdXRpbHMudHlwZShyb3dzKTtcbiAgaWYgKGlzMmRBcnJheShhcnIpKSB7XG4gICAgdmFyIGNvbENvdW50ID0gYXJyWzBdLmxlbmd0aDtcbiAgICBpZiAocm93c1R5cGUgPT09ICdudW1iZXInKSB7XG4gICAgICBpZiAocm93cyA+IDApIHtcbiAgICAgICAgc3ByZWFkQXJyYXkoYXJyLCBiZWdpbiwgY3JlYXRlMmRBcnJheShyb3dzLCBjb2xDb3VudCkpO1xuICAgICAgfSBlbHNlIGlmIChyb3dzIDwgMCkge1xuICAgICAgICBkZWxldGVkID0gc3ByZWFkQXJyYXkoYXJyLCBiZWdpbiwgcm93cyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChyb3dzVHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgc3ByZWFkQXJyYXkoYXJyLCBiZWdpbiwgcm93cyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWxldGVkO1xufTtcblxudmFyIHNwcmVhZDJkQXJyYXlDb2wgPSBmdW5jdGlvbiBzcHJlYWQyZEFycmF5Q29sKGFyciwgYmVnaW4sIGNvbHMpIHtcbiAgdmFyIGRlbGV0ZWQgPSBbXSxcbiAgICAgIGRlbGV0ZWRDb2wsXG4gICAgICBjb2xzVHlwZSA9IHV0aWxzLnR5cGUoY29scyk7XG4gIGlmIChpczJkQXJyYXkoYXJyKSkge1xuICAgIHZhciByb3dDb3VudCA9IGFyci5sZW5ndGgsXG4gICAgICAgIGkgPSAwO1xuICAgIGlmIChjb2xzVHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGZvciAoOyBpIDwgcm93Q291bnQ7IGkrKykge1xuICAgICAgICBkZWxldGVkQ29sID0gc3ByZWFkQXJyYXkoYXJyW2ldLCBiZWdpbiwgY29scyk7XG4gICAgICAgIGlmIChkZWxldGVkQ29sLmxlbmd0aCkge1xuICAgICAgICAgIGRlbGV0ZWQucHVzaChkZWxldGVkQ29sKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29sc1R5cGUgPT09ICdhcnJheScpIHtcbiAgICAgIGZvciAoOyBpIDwgcm93Q291bnQ7IGkrKykge1xuICAgICAgICBzcHJlYWRBcnJheShhcnJbaV0sIGJlZ2luLCBjb2xzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlbGV0ZWQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaXMyZEFycmF5OiBpczJkQXJyYXksXG4gIGNyZWF0ZUFycmF5OiBjcmVhdGVBcnJheSxcbiAgY3JlYXRlMmRBcnJheTogY3JlYXRlMmRBcnJheSxcbiAgcGFyc2VBcnJheUluZGV4OiBwYXJzZUFycmF5SW5kZXgsXG4gIGdldEFycmF5SW5kZXhCeVZhbHVlOiBnZXRBcnJheUluZGV4QnlWYWx1ZSxcbiAgbW92ZUFycmF5SXRlbVVwOiBtb3ZlQXJyYXlJdGVtVXAsXG4gIG1vdmVBcnJheUl0ZW1Eb3duOiBtb3ZlQXJyYXlJdGVtRG93bixcbiAgc3ByZWFkQXJyYXk6IHNwcmVhZEFycmF5LFxuICBzcHJlYWQyZEFycmF5Um93OiBzcHJlYWQyZEFycmF5Um93LFxuICBzcHJlYWQyZEFycmF5Q29sOiBzcHJlYWQyZEFycmF5Q29sXG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgZ2V0T2JqZWN0S2V5QnlWYWx1ZSA9IGZ1bmN0aW9uIGdldE9iamVjdEtleUJ5VmFsdWUob2JqLCB2YWx1ZSkge1xuICB2YXIgb2JqS2V5LCBvYmpWYWx1ZSwgdmFsdWVLZXk7XG4gIGlmICh1dGlscy50eXBlKHZhbHVlKSA9PT0gJ29iamVjdCcpIHtcbiAgICBvdXRlcjogZm9yIChvYmpLZXkgaW4gb2JqKSB7XG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KG9iaktleSkgJiYgdXRpbHMudHlwZShvYmpWYWx1ZSA9IG9ialtvYmpLZXldKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgZm9yICh2YWx1ZUtleSBpbiB2YWx1ZSkge1xuICAgICAgICAgIGlmICh2YWx1ZS5oYXNPd25Qcm9wZXJ0eSh2YWx1ZUtleSkgJiYgdmFsdWVbdmFsdWVLZXldICE9PSBvYmpWYWx1ZVt2YWx1ZUtleV0pIHtcbiAgICAgICAgICAgIGNvbnRpbnVlIG91dGVyO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JqS2V5O1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKG9iaktleSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkob2JqS2V5KSAmJiBvYmpbb2JqS2V5XSA9PT0gdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG9iaktleTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5cbnZhciBleHRlbmQgPSBmdW5jdGlvbiBleHRlbmQoKSB7XG4gIHZhciB0YXJnZXQgPSBhcmd1bWVudHNbMF0sXG4gICAgICBhcmdMZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ0xlbjsgaSsrKSB7XG4gICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXSxcbiAgICAgICAga2V5O1xuICAgIGlmICh1dGlscy50eXBlKHNvdXJjZSkgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgdGFyZ2V0W2tleV0gPSB1dGlscy5jb3B5KHNvdXJjZVtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGhhc093blByb3BlcnR5OiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuICBleHRlbmQ6IGV4dGVuZCxcbiAgZ2V0T2JqZWN0S2V5QnlWYWx1ZTogZ2V0T2JqZWN0S2V5QnlWYWx1ZVxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciByZWZlcmVuY2VUeXBlcyA9IHtcbiAgJ2FycmF5JzogdHJ1ZSxcbiAgJ29iamVjdCc6IHRydWVcbn07XG5cbnZhciBjb21tb25LZXlUeXBlcyA9IHtcbiAgJ3N0cmluZyc6IHRydWUsXG4gICdudW1iZXInOiB0cnVlXG59O1xuXG52YXIgdHlwZSA9IGZ1bmN0aW9uIHR5cGUoZGF0YSkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGEpLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpO1xufTtcblxudmFyIGlzUmVmZXJlbmNlVHlwZSA9IGZ1bmN0aW9uIGlzUmVmZXJlbmNlVHlwZShkYXRhKSB7XG4gIHJldHVybiByZWZlcmVuY2VUeXBlc1t0eXBlKGRhdGEpXSB8fCBmYWxzZTtcbn07XG5cbnZhciBpc0NvbW1vbktleVR5cGUgPSBmdW5jdGlvbiBpc0NvbW1vbktleVR5cGUoa2V5KSB7XG4gIHJldHVybiBjb21tb25LZXlUeXBlc1t0eXBlKGtleSldIHx8IGZhbHNlO1xufTtcblxudmFyIGNvcHkgPSBmdW5jdGlvbiBjb3B5KGRhdGEpIHtcbiAgcmV0dXJuIGlzUmVmZXJlbmNlVHlwZShkYXRhKSA/IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZGF0YSkpIDogZGF0YTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB0eXBlOiB0eXBlLFxuICBjb3B5OiBjb3B5LFxuICBpc1JlZmVyZW5jZVR5cGU6IGlzUmVmZXJlbmNlVHlwZSxcbiAgaXNDb21tb25LZXlUeXBlOiBpc0NvbW1vbktleVR5cGVcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL0pTT05EYXRhU3RvcmUnKTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIENvbXBpbGVkUm91dGVQYXRocyA9IHt9O1xuXG52YXIgdG9rZW5SZWdleCA9IC9cXCh8XFwqXFwqfFxcKnw6W14vKV0qfFxcKS9nO1xuXG5mdW5jdGlvbiBlc2NhcGVSZWdFeHAoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKTtcbn1cblxuZnVuY3Rpb24gX2NvbXBpbGUocm91dGVQYXRoLCBzdHJpY3QpIHtcbiAgdmFyIG1hdGNoLFxuICAgICAgbGFzdEluZGV4ID0gMCxcbiAgICAgIHBhdHRlcm4gPSBcIlwiLFxuICAgICAgdG9rZW4sXG4gICAgICB0b2tlbnMgPSBbXTtcbiAgd2hpbGUgKChtYXRjaCA9IHRva2VuUmVnZXguZXhlYyhyb3V0ZVBhdGgpKSAhPT0gbnVsbCkge1xuICAgIGlmIChtYXRjaC5pbmRleCAhPT0gbGFzdEluZGV4KSB7XG4gICAgICBwYXR0ZXJuICs9IGVzY2FwZVJlZ0V4cChyb3V0ZVBhdGguc2xpY2UobGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgIH1cbiAgICB0b2tlbiA9IG1hdGNoWzBdO1xuICAgIGlmICh0b2tlblswXSA9PT0gXCI6XCIpIHtcbiAgICAgIHBhdHRlcm4gKz0gJyhbXi9dKiknO1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgIH0gZWxzZSBpZiAodG9rZW4gPT09IFwiKipcIikge1xuICAgICAgcGF0dGVybiArPSBcIiguKilcIjtcbiAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICB9IGVsc2UgaWYgKHRva2VuID09PSBcIipcIikge1xuICAgICAgcGF0dGVybiArPSBcIiguKj8pXCI7XG4gICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgfSBlbHNlIGlmICh0b2tlbiA9PT0gXCIoXCIpIHtcbiAgICAgIHBhdHRlcm4gKz0gJyg/Oic7XG4gICAgfSBlbHNlIGlmICh0b2tlbiA9PT0gXCIpXCIpIHtcbiAgICAgIHBhdHRlcm4gKz0gJyk/JztcbiAgICB9XG4gICAgbGFzdEluZGV4ID0gdG9rZW5SZWdleC5sYXN0SW5kZXg7XG4gIH1cbiAgcGF0dGVybiArPSBlc2NhcGVSZWdFeHAocm91dGVQYXRoLnNsaWNlKGxhc3RJbmRleCkpO1xuICBwYXR0ZXJuID0gc3RyaWN0ID09PSB0cnVlID8gcGF0dGVybiA6IHBhdHRlcm4uc2xpY2UoLTEpID09PSBcIi9cIiA/IHBhdHRlcm4gKyBcIj9cIiA6IHBhdHRlcm4gKyBcIi8/XCI7XG4gIHBhdHRlcm4gKz0gXCIkXCI7XG4gIHJldHVybiB7XG4gICAgcmVnZXg6IG5ldyBSZWdFeHAocGF0dGVybiksXG4gICAgdG9rZW5zOiB0b2tlbnNcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNvbXBpbGU6IGZ1bmN0aW9uIGNvbXBpbGUocm91dGVQYXRoLCBzdHJpY3QpIHtcbiAgICB2YXIgY29tcGlsZWQsXG4gICAgICAgIHBhdGhJbmRleCA9IHJvdXRlUGF0aCArIChzdHJpY3QgfHwgJycpO1xuICAgIGNvbXBpbGVkID0gQ29tcGlsZWRSb3V0ZVBhdGhzW3BhdGhJbmRleF0gfHwgX2NvbXBpbGUocm91dGVQYXRoLCBzdHJpY3QpO1xuICAgIHJldHVybiBDb21waWxlZFJvdXRlUGF0aHNbcGF0aEluZGV4XSA9IGNvbXBpbGVkO1xuICB9LFxuICBwYXJzZVBhdGg6IGZ1bmN0aW9uIHBhcnNlUGF0aChwYXRoTWF0Y2gsIHRva2Vucykge1xuICAgIHZhciBwYXJhbXMgPSB7fSxcbiAgICAgICAgcGFyYW1JbmRleCA9IDA7XG4gICAgdG9rZW5zLmZvckVhY2goZnVuY3Rpb24gKHRva2VuLCBpbmRleCkge1xuICAgICAgaWYgKHRva2VuWzBdID09PSBcIjpcIikge1xuICAgICAgICBwYXJhbXNbdG9rZW4uc2xpY2UoMSldID0gcGF0aE1hdGNoW2luZGV4ICsgMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJhbXNbcGFyYW1JbmRleF0gPSBwYXRoTWF0Y2hbaW5kZXggKyAxXTtcbiAgICAgICAgcGFyYW1JbmRleCsrO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBwYXJhbXM7XG4gIH1cbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcm91dGVDb21waWxlciA9IHJlcXVpcmUoJy4vbGliL3JvdXRlLWNvbXBpbGVyJyk7XG52YXIgdXJsVXRpbHMgPSByZXF1aXJlKCdzaW1wbGUtdXJsJyk7XG52YXIgZW1wdHlGdW5jID0gZnVuY3Rpb24gZW1wdHlGdW5jKCkge307XG5cbmZ1bmN0aW9uIFJvdXRlcihvcHRpb25zKSB7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMucmVnZXhSb3V0ZXJzID0gW107XG4gIHRoaXMuc3RyaW5nUm91dGVycyA9IHt9O1xuICB0aGlzLm9uTWlzbWF0Y2ggPSBlbXB0eUZ1bmM7XG59XG5cblJvdXRlci5wcm90b3R5cGUgPSB7XG4gIGNyZWF0ZU1pc21hdGNoOiBmdW5jdGlvbiBjcmVhdGVNaXNtYXRjaChtaXNtYXRjaCkge1xuICAgIGlmICh0eXBlb2YgbWlzbWF0Y2ggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMub25NaXNtYXRjaCA9IG1pc21hdGNoO1xuICAgIH1cbiAgfSxcbiAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUocm91dGUsIGNhbGxiYWNrLCBzdHJpY3QpIHtcbiAgICBzdHJpY3QgPSB0eXBlb2Ygc3RyaWN0ID09PSAnYm9vbGVhbicgPyBzdHJpY3QgOiB0aGlzLm9wdGlvbnMuc3RyaWN0IHx8IGZhbHNlO1xuICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZW1wdHlGdW5jO1xuICAgIHZhciBjb21waWxlZCA9IHJvdXRlQ29tcGlsZXIuY29tcGlsZShyb3V0ZSwgc3RyaWN0KTtcbiAgICBpZiAoY29tcGlsZWQudG9rZW5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5zdHJpbmdSb3V0ZXJzW3JvdXRlXSA9IGNhbGxiYWNrO1xuICAgICAgaWYgKHN0cmljdCAhPT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnN0cmluZ1JvdXRlcnNbcm91dGUuc2xpY2UoLTEpID09PSBcIi9cIiA/IHJvdXRlLnNsaWNlKDAsIC0xKSA6IHJvdXRlICsgXCIvXCJdID0gY2FsbGJhY2s7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVnZXhSb3V0ZXJzLnB1c2goW2NvbXBpbGVkLCBjYWxsYmFja10pO1xuICAgIH1cbiAgfSxcbiAgbWF0Y2g6IGZ1bmN0aW9uIG1hdGNoKHVybCwgZGF0YSkge1xuICAgIHZhciB1cmxPYmogPSB1cmxVdGlscy5wYXJzZSh1cmwpLFxuICAgICAgICBwYXRoID0gdXJsT2JqLnBhdGhuYW1lO1xuICAgIHVybE9iai51cmwgPSB1cmw7XG4gICAgaWYgKHRoaXMuc3RyaW5nUm91dGVyc1twYXRoXSkge1xuICAgICAgdGhpcy5zdHJpbmdSb3V0ZXJzW3BhdGhdKHsgdXJsOiB1cmxPYmosIHBhcmFtczogbnVsbCwgZGF0YTogZGF0YSB9KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgbGVuID0gdGhpcy5yZWdleFJvdXRlcnMubGVuZ3RoLFxuICAgICAgICAgIHJvdXRlcixcbiAgICAgICAgICBtYXRjaDtcbiAgICAgIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgICAgIHJvdXRlciA9IHRoaXMucmVnZXhSb3V0ZXJzW2ldO1xuICAgICAgICBtYXRjaCA9IHJvdXRlclswXS5yZWdleC5leGVjKHBhdGgpO1xuICAgICAgICBpZiAobWF0Y2ggIT09IG51bGwpIHtcbiAgICAgICAgICByb3V0ZXJbMV0oeyB1cmw6IHVybE9iaiwgcGFyYW1zOiByb3V0ZUNvbXBpbGVyLnBhcnNlUGF0aChtYXRjaCwgcm91dGVyWzBdLnRva2VucyksIGRhdGE6IGRhdGEgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLm9uTWlzbWF0Y2goeyB1cmw6IHVybE9iaiwgZGF0YTogZGF0YSB9KTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVyOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcGxhY2UgPSBTdHJpbmcucHJvdG90eXBlLnJlcGxhY2U7XG52YXIgcGVyY2VudFR3ZW50aWVzID0gLyUyMC9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnZGVmYXVsdCc6ICdSRkMzOTg2JyxcbiAgICBmb3JtYXR0ZXJzOiB7XG4gICAgICAgIFJGQzE3Mzg6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2UuY2FsbCh2YWx1ZSwgcGVyY2VudFR3ZW50aWVzLCAnKycpO1xuICAgICAgICB9LFxuICAgICAgICBSRkMzOTg2OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgUkZDMTczODogJ1JGQzE3MzgnLFxuICAgIFJGQzM5ODY6ICdSRkMzOTg2J1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHN0cmluZ2lmeSA9IHJlcXVpcmUoJy4vc3RyaW5naWZ5Jyk7XG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlJyk7XG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBmb3JtYXRzOiBmb3JtYXRzLFxuICAgIHBhcnNlOiBwYXJzZSxcbiAgICBzdHJpbmdpZnk6IHN0cmluZ2lmeVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIGFsbG93RG90czogZmFsc2UsXG4gICAgYWxsb3dQcm90b3R5cGVzOiBmYWxzZSxcbiAgICBhcnJheUxpbWl0OiAyMCxcbiAgICBkZWNvZGVyOiB1dGlscy5kZWNvZGUsXG4gICAgZGVsaW1pdGVyOiAnJicsXG4gICAgZGVwdGg6IDUsXG4gICAgcGFyYW1ldGVyTGltaXQ6IDEwMDAsXG4gICAgcGxhaW5PYmplY3RzOiBmYWxzZSxcbiAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IGZhbHNlXG59O1xuXG52YXIgcGFyc2VWYWx1ZXMgPSBmdW5jdGlvbiBwYXJzZVZhbHVlcyhzdHIsIG9wdGlvbnMpIHtcbiAgICB2YXIgb2JqID0ge307XG4gICAgdmFyIHBhcnRzID0gc3RyLnNwbGl0KG9wdGlvbnMuZGVsaW1pdGVyLCBvcHRpb25zLnBhcmFtZXRlckxpbWl0ID09PSBJbmZpbml0eSA/IHVuZGVmaW5lZCA6IG9wdGlvbnMucGFyYW1ldGVyTGltaXQpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICB2YXIgcG9zID0gcGFydC5pbmRleE9mKCddPScpID09PSAtMSA/IHBhcnQuaW5kZXhPZignPScpIDogcGFydC5pbmRleE9mKCddPScpICsgMTtcblxuICAgICAgICB2YXIga2V5LCB2YWw7XG4gICAgICAgIGlmIChwb3MgPT09IC0xKSB7XG4gICAgICAgICAgICBrZXkgPSBvcHRpb25zLmRlY29kZXIocGFydCk7XG4gICAgICAgICAgICB2YWwgPSBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA/IG51bGwgOiAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGtleSA9IG9wdGlvbnMuZGVjb2RlcihwYXJ0LnNsaWNlKDAsIHBvcykpO1xuICAgICAgICAgICAgdmFsID0gb3B0aW9ucy5kZWNvZGVyKHBhcnQuc2xpY2UocG9zICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChoYXMuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gW10uY29uY2F0KG9ialtrZXldKS5jb25jYXQodmFsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9ialtrZXldID0gdmFsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBwYXJzZU9iamVjdCA9IGZ1bmN0aW9uIHBhcnNlT2JqZWN0KGNoYWluLCB2YWwsIG9wdGlvbnMpIHtcbiAgICBpZiAoIWNoYWluLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIHZhciByb290ID0gY2hhaW4uc2hpZnQoKTtcblxuICAgIHZhciBvYmo7XG4gICAgaWYgKHJvb3QgPT09ICdbXScpIHtcbiAgICAgICAgb2JqID0gW107XG4gICAgICAgIG9iaiA9IG9iai5jb25jYXQocGFyc2VPYmplY3QoY2hhaW4sIHZhbCwgb3B0aW9ucykpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG9iaiA9IG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgICAgICB2YXIgY2xlYW5Sb290ID0gcm9vdFswXSA9PT0gJ1snICYmIHJvb3Rbcm9vdC5sZW5ndGggLSAxXSA9PT0gJ10nID8gcm9vdC5zbGljZSgxLCByb290Lmxlbmd0aCAtIDEpIDogcm9vdDtcbiAgICAgICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoY2xlYW5Sb290LCAxMCk7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICFpc05hTihpbmRleCkgJiZcbiAgICAgICAgICAgIHJvb3QgIT09IGNsZWFuUm9vdCAmJlxuICAgICAgICAgICAgU3RyaW5nKGluZGV4KSA9PT0gY2xlYW5Sb290ICYmXG4gICAgICAgICAgICBpbmRleCA+PSAwICYmXG4gICAgICAgICAgICAob3B0aW9ucy5wYXJzZUFycmF5cyAmJiBpbmRleCA8PSBvcHRpb25zLmFycmF5TGltaXQpXG4gICAgICAgICkge1xuICAgICAgICAgICAgb2JqID0gW107XG4gICAgICAgICAgICBvYmpbaW5kZXhdID0gcGFyc2VPYmplY3QoY2hhaW4sIHZhbCwgb3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvYmpbY2xlYW5Sb290XSA9IHBhcnNlT2JqZWN0KGNoYWluLCB2YWwsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBwYXJzZUtleXMgPSBmdW5jdGlvbiBwYXJzZUtleXMoZ2l2ZW5LZXksIHZhbCwgb3B0aW9ucykge1xuICAgIGlmICghZ2l2ZW5LZXkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRyYW5zZm9ybSBkb3Qgbm90YXRpb24gdG8gYnJhY2tldCBub3RhdGlvblxuICAgIHZhciBrZXkgPSBvcHRpb25zLmFsbG93RG90cyA/IGdpdmVuS2V5LnJlcGxhY2UoL1xcLihbXlxcLlxcW10rKS9nLCAnWyQxXScpIDogZ2l2ZW5LZXk7XG5cbiAgICAvLyBUaGUgcmVnZXggY2h1bmtzXG5cbiAgICB2YXIgcGFyZW50ID0gL14oW15cXFtcXF1dKikvO1xuICAgIHZhciBjaGlsZCA9IC8oXFxbW15cXFtcXF1dKlxcXSkvZztcblxuICAgIC8vIEdldCB0aGUgcGFyZW50XG5cbiAgICB2YXIgc2VnbWVudCA9IHBhcmVudC5leGVjKGtleSk7XG5cbiAgICAvLyBTdGFzaCB0aGUgcGFyZW50IGlmIGl0IGV4aXN0c1xuXG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBpZiAoc2VnbWVudFsxXSkge1xuICAgICAgICAvLyBJZiB3ZSBhcmVuJ3QgdXNpbmcgcGxhaW4gb2JqZWN0cywgb3B0aW9uYWxseSBwcmVmaXgga2V5c1xuICAgICAgICAvLyB0aGF0IHdvdWxkIG92ZXJ3cml0ZSBvYmplY3QgcHJvdG90eXBlIHByb3BlcnRpZXNcbiAgICAgICAgaWYgKCFvcHRpb25zLnBsYWluT2JqZWN0cyAmJiBoYXMuY2FsbChPYmplY3QucHJvdG90eXBlLCBzZWdtZW50WzFdKSkge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmFsbG93UHJvdG90eXBlcykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGtleXMucHVzaChzZWdtZW50WzFdKTtcbiAgICB9XG5cbiAgICAvLyBMb29wIHRocm91Z2ggY2hpbGRyZW4gYXBwZW5kaW5nIHRvIHRoZSBhcnJheSB1bnRpbCB3ZSBoaXQgZGVwdGhcblxuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoKHNlZ21lbnQgPSBjaGlsZC5leGVjKGtleSkpICE9PSBudWxsICYmIGkgPCBvcHRpb25zLmRlcHRoKSB7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgaWYgKCFvcHRpb25zLnBsYWluT2JqZWN0cyAmJiBoYXMuY2FsbChPYmplY3QucHJvdG90eXBlLCBzZWdtZW50WzFdLnJlcGxhY2UoL1xcW3xcXF0vZywgJycpKSkge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmFsbG93UHJvdG90eXBlcykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGtleXMucHVzaChzZWdtZW50WzFdKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSdzIGEgcmVtYWluZGVyLCBqdXN0IGFkZCB3aGF0ZXZlciBpcyBsZWZ0XG5cbiAgICBpZiAoc2VnbWVudCkge1xuICAgICAgICBrZXlzLnB1c2goJ1snICsga2V5LnNsaWNlKHNlZ21lbnQuaW5kZXgpICsgJ10nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyc2VPYmplY3Qoa2V5cywgdmFsLCBvcHRpb25zKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHN0ciwgb3B0cykge1xuICAgIHZhciBvcHRpb25zID0gb3B0cyB8fCB7fTtcblxuICAgIGlmIChvcHRpb25zLmRlY29kZXIgIT09IG51bGwgJiYgb3B0aW9ucy5kZWNvZGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuZGVjb2RlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdEZWNvZGVyIGhhcyB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIG9wdGlvbnMuZGVsaW1pdGVyID0gdHlwZW9mIG9wdGlvbnMuZGVsaW1pdGVyID09PSAnc3RyaW5nJyB8fCB1dGlscy5pc1JlZ0V4cChvcHRpb25zLmRlbGltaXRlcikgPyBvcHRpb25zLmRlbGltaXRlciA6IGRlZmF1bHRzLmRlbGltaXRlcjtcbiAgICBvcHRpb25zLmRlcHRoID0gdHlwZW9mIG9wdGlvbnMuZGVwdGggPT09ICdudW1iZXInID8gb3B0aW9ucy5kZXB0aCA6IGRlZmF1bHRzLmRlcHRoO1xuICAgIG9wdGlvbnMuYXJyYXlMaW1pdCA9IHR5cGVvZiBvcHRpb25zLmFycmF5TGltaXQgPT09ICdudW1iZXInID8gb3B0aW9ucy5hcnJheUxpbWl0IDogZGVmYXVsdHMuYXJyYXlMaW1pdDtcbiAgICBvcHRpb25zLnBhcnNlQXJyYXlzID0gb3B0aW9ucy5wYXJzZUFycmF5cyAhPT0gZmFsc2U7XG4gICAgb3B0aW9ucy5kZWNvZGVyID0gdHlwZW9mIG9wdGlvbnMuZGVjb2RlciA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuZGVjb2RlciA6IGRlZmF1bHRzLmRlY29kZXI7XG4gICAgb3B0aW9ucy5hbGxvd0RvdHMgPSB0eXBlb2Ygb3B0aW9ucy5hbGxvd0RvdHMgPT09ICdib29sZWFuJyA/IG9wdGlvbnMuYWxsb3dEb3RzIDogZGVmYXVsdHMuYWxsb3dEb3RzO1xuICAgIG9wdGlvbnMucGxhaW5PYmplY3RzID0gdHlwZW9mIG9wdGlvbnMucGxhaW5PYmplY3RzID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnBsYWluT2JqZWN0cyA6IGRlZmF1bHRzLnBsYWluT2JqZWN0cztcbiAgICBvcHRpb25zLmFsbG93UHJvdG90eXBlcyA9IHR5cGVvZiBvcHRpb25zLmFsbG93UHJvdG90eXBlcyA9PT0gJ2Jvb2xlYW4nID8gb3B0aW9ucy5hbGxvd1Byb3RvdHlwZXMgOiBkZWZhdWx0cy5hbGxvd1Byb3RvdHlwZXM7XG4gICAgb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdCA9IHR5cGVvZiBvcHRpb25zLnBhcmFtZXRlckxpbWl0ID09PSAnbnVtYmVyJyA/IG9wdGlvbnMucGFyYW1ldGVyTGltaXQgOiBkZWZhdWx0cy5wYXJhbWV0ZXJMaW1pdDtcbiAgICBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA9IHR5cGVvZiBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA9PT0gJ2Jvb2xlYW4nID8gb3B0aW9ucy5zdHJpY3ROdWxsSGFuZGxpbmcgOiBkZWZhdWx0cy5zdHJpY3ROdWxsSGFuZGxpbmc7XG5cbiAgICBpZiAoc3RyID09PSAnJyB8fCBzdHIgPT09IG51bGwgfHwgdHlwZW9mIHN0ciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuICAgIH1cblxuICAgIHZhciB0ZW1wT2JqID0gdHlwZW9mIHN0ciA9PT0gJ3N0cmluZycgPyBwYXJzZVZhbHVlcyhzdHIsIG9wdGlvbnMpIDogc3RyO1xuICAgIHZhciBvYmogPSBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcblxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUga2V5cyBhbmQgc2V0dXAgdGhlIG5ldyBvYmplY3RcblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGVtcE9iaik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICB2YXIgbmV3T2JqID0gcGFyc2VLZXlzKGtleSwgdGVtcE9ialtrZXldLCBvcHRpb25zKTtcbiAgICAgICAgb2JqID0gdXRpbHMubWVyZ2Uob2JqLCBuZXdPYmosIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiB1dGlscy5jb21wYWN0KG9iaik7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpO1xuXG52YXIgYXJyYXlQcmVmaXhHZW5lcmF0b3JzID0ge1xuICAgIGJyYWNrZXRzOiBmdW5jdGlvbiBicmFja2V0cyhwcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeCArICdbXSc7XG4gICAgfSxcbiAgICBpbmRpY2VzOiBmdW5jdGlvbiBpbmRpY2VzKHByZWZpeCwga2V5KSB7XG4gICAgICAgIHJldHVybiBwcmVmaXggKyAnWycgKyBrZXkgKyAnXSc7XG4gICAgfSxcbiAgICByZXBlYXQ6IGZ1bmN0aW9uIHJlcGVhdChwcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeDtcbiAgICB9XG59O1xuXG52YXIgdG9JU08gPSBEYXRlLnByb3RvdHlwZS50b0lTT1N0cmluZztcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIGRlbGltaXRlcjogJyYnLFxuICAgIGVuY29kZTogdHJ1ZSxcbiAgICBlbmNvZGVyOiB1dGlscy5lbmNvZGUsXG4gICAgc2VyaWFsaXplRGF0ZTogZnVuY3Rpb24gc2VyaWFsaXplRGF0ZShkYXRlKSB7XG4gICAgICAgIHJldHVybiB0b0lTTy5jYWxsKGRhdGUpO1xuICAgIH0sXG4gICAgc2tpcE51bGxzOiBmYWxzZSxcbiAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IGZhbHNlXG59O1xuXG52YXIgc3RyaW5naWZ5ID0gZnVuY3Rpb24gc3RyaW5naWZ5KG9iamVjdCwgcHJlZml4LCBnZW5lcmF0ZUFycmF5UHJlZml4LCBzdHJpY3ROdWxsSGFuZGxpbmcsIHNraXBOdWxscywgZW5jb2RlciwgZmlsdGVyLCBzb3J0LCBhbGxvd0RvdHMsIHNlcmlhbGl6ZURhdGUsIGZvcm1hdHRlcikge1xuICAgIHZhciBvYmogPSBvYmplY3Q7XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb2JqID0gZmlsdGVyKHByZWZpeCwgb2JqKTtcbiAgICB9IGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgb2JqID0gc2VyaWFsaXplRGF0ZShvYmopO1xuICAgIH0gZWxzZSBpZiAob2JqID09PSBudWxsKSB7XG4gICAgICAgIGlmIChzdHJpY3ROdWxsSGFuZGxpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVyID8gZW5jb2RlcihwcmVmaXgpIDogcHJlZml4O1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBvYmogPT09ICdudW1iZXInIHx8IHR5cGVvZiBvYmogPT09ICdib29sZWFuJyB8fCB1dGlscy5pc0J1ZmZlcihvYmopKSB7XG4gICAgICAgIGlmIChlbmNvZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gW2Zvcm1hdHRlcihlbmNvZGVyKHByZWZpeCkpICsgJz0nICsgZm9ybWF0dGVyKGVuY29kZXIob2JqKSldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbZm9ybWF0dGVyKHByZWZpeCkgKyAnPScgKyBmb3JtYXR0ZXIoU3RyaW5nKG9iaikpXTtcbiAgICB9XG5cbiAgICB2YXIgdmFsdWVzID0gW107XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9XG5cbiAgICB2YXIgb2JqS2V5cztcbiAgICBpZiAoQXJyYXkuaXNBcnJheShmaWx0ZXIpKSB7XG4gICAgICAgIG9iaktleXMgPSBmaWx0ZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgICAgICBvYmpLZXlzID0gc29ydCA/IGtleXMuc29ydChzb3J0KSA6IGtleXM7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmpLZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBrZXkgPSBvYmpLZXlzW2ldO1xuXG4gICAgICAgIGlmIChza2lwTnVsbHMgJiYgb2JqW2tleV0gPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICAgICAgdmFsdWVzID0gdmFsdWVzLmNvbmNhdChzdHJpbmdpZnkoXG4gICAgICAgICAgICAgICAgb2JqW2tleV0sXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVBcnJheVByZWZpeChwcmVmaXgsIGtleSksXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVBcnJheVByZWZpeCxcbiAgICAgICAgICAgICAgICBzdHJpY3ROdWxsSGFuZGxpbmcsXG4gICAgICAgICAgICAgICAgc2tpcE51bGxzLFxuICAgICAgICAgICAgICAgIGVuY29kZXIsXG4gICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgIHNvcnQsXG4gICAgICAgICAgICAgICAgYWxsb3dEb3RzLFxuICAgICAgICAgICAgICAgIHNlcmlhbGl6ZURhdGUsXG4gICAgICAgICAgICAgICAgZm9ybWF0dGVyXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlcyA9IHZhbHVlcy5jb25jYXQoc3RyaW5naWZ5KFxuICAgICAgICAgICAgICAgIG9ialtrZXldLFxuICAgICAgICAgICAgICAgIHByZWZpeCArIChhbGxvd0RvdHMgPyAnLicgKyBrZXkgOiAnWycgKyBrZXkgKyAnXScpLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlQXJyYXlQcmVmaXgsXG4gICAgICAgICAgICAgICAgc3RyaWN0TnVsbEhhbmRsaW5nLFxuICAgICAgICAgICAgICAgIHNraXBOdWxscyxcbiAgICAgICAgICAgICAgICBlbmNvZGVyLFxuICAgICAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgICAgICBzb3J0LFxuICAgICAgICAgICAgICAgIGFsbG93RG90cyxcbiAgICAgICAgICAgICAgICBzZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgICAgIGZvcm1hdHRlclxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqZWN0LCBvcHRzKSB7XG4gICAgdmFyIG9iaiA9IG9iamVjdDtcbiAgICB2YXIgb3B0aW9ucyA9IG9wdHMgfHwge307XG4gICAgdmFyIGRlbGltaXRlciA9IHR5cGVvZiBvcHRpb25zLmRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyBkZWZhdWx0cy5kZWxpbWl0ZXIgOiBvcHRpb25zLmRlbGltaXRlcjtcbiAgICB2YXIgc3RyaWN0TnVsbEhhbmRsaW5nID0gdHlwZW9mIG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA6IGRlZmF1bHRzLnN0cmljdE51bGxIYW5kbGluZztcbiAgICB2YXIgc2tpcE51bGxzID0gdHlwZW9mIG9wdGlvbnMuc2tpcE51bGxzID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnNraXBOdWxscyA6IGRlZmF1bHRzLnNraXBOdWxscztcbiAgICB2YXIgZW5jb2RlID0gdHlwZW9mIG9wdGlvbnMuZW5jb2RlID09PSAnYm9vbGVhbicgPyBvcHRpb25zLmVuY29kZSA6IGRlZmF1bHRzLmVuY29kZTtcbiAgICB2YXIgZW5jb2RlciA9IGVuY29kZSA/ICh0eXBlb2Ygb3B0aW9ucy5lbmNvZGVyID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5lbmNvZGVyIDogZGVmYXVsdHMuZW5jb2RlcikgOiBudWxsO1xuICAgIHZhciBzb3J0ID0gdHlwZW9mIG9wdGlvbnMuc29ydCA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuc29ydCA6IG51bGw7XG4gICAgdmFyIGFsbG93RG90cyA9IHR5cGVvZiBvcHRpb25zLmFsbG93RG90cyA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IG9wdGlvbnMuYWxsb3dEb3RzO1xuICAgIHZhciBzZXJpYWxpemVEYXRlID0gdHlwZW9mIG9wdGlvbnMuc2VyaWFsaXplRGF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IG9wdGlvbnMuc2VyaWFsaXplRGF0ZSA6IGRlZmF1bHRzLnNlcmlhbGl6ZURhdGU7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLmZvcm1hdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgb3B0aW9ucy5mb3JtYXQgPSBmb3JtYXRzLmRlZmF1bHQ7XG4gICAgfSBlbHNlIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGZvcm1hdHMuZm9ybWF0dGVycywgb3B0aW9ucy5mb3JtYXQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZm9ybWF0IG9wdGlvbiBwcm92aWRlZC4nKTtcbiAgICB9XG4gICAgdmFyIGZvcm1hdHRlciA9IGZvcm1hdHMuZm9ybWF0dGVyc1tvcHRpb25zLmZvcm1hdF07XG4gICAgdmFyIG9iaktleXM7XG4gICAgdmFyIGZpbHRlcjtcblxuICAgIGlmIChvcHRpb25zLmVuY29kZXIgIT09IG51bGwgJiYgb3B0aW9ucy5lbmNvZGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuZW5jb2RlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFbmNvZGVyIGhhcyB0byBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5maWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIG9iaiA9IGZpbHRlcignJywgb2JqKTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5maWx0ZXIpKSB7XG4gICAgICAgIGZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgICAgICBvYmpLZXlzID0gZmlsdGVyO1xuICAgIH1cblxuICAgIHZhciBrZXlzID0gW107XG5cbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICB2YXIgYXJyYXlGb3JtYXQ7XG4gICAgaWYgKG9wdGlvbnMuYXJyYXlGb3JtYXQgaW4gYXJyYXlQcmVmaXhHZW5lcmF0b3JzKSB7XG4gICAgICAgIGFycmF5Rm9ybWF0ID0gb3B0aW9ucy5hcnJheUZvcm1hdDtcbiAgICB9IGVsc2UgaWYgKCdpbmRpY2VzJyBpbiBvcHRpb25zKSB7XG4gICAgICAgIGFycmF5Rm9ybWF0ID0gb3B0aW9ucy5pbmRpY2VzID8gJ2luZGljZXMnIDogJ3JlcGVhdCc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYXJyYXlGb3JtYXQgPSAnaW5kaWNlcyc7XG4gICAgfVxuXG4gICAgdmFyIGdlbmVyYXRlQXJyYXlQcmVmaXggPSBhcnJheVByZWZpeEdlbmVyYXRvcnNbYXJyYXlGb3JtYXRdO1xuXG4gICAgaWYgKCFvYmpLZXlzKSB7XG4gICAgICAgIG9iaktleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIH1cblxuICAgIGlmIChzb3J0KSB7XG4gICAgICAgIG9iaktleXMuc29ydChzb3J0KTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iaktleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IG9iaktleXNbaV07XG5cbiAgICAgICAgaWYgKHNraXBOdWxscyAmJiBvYmpba2V5XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBrZXlzID0ga2V5cy5jb25jYXQoc3RyaW5naWZ5KFxuICAgICAgICAgICAgb2JqW2tleV0sXG4gICAgICAgICAgICBrZXksXG4gICAgICAgICAgICBnZW5lcmF0ZUFycmF5UHJlZml4LFxuICAgICAgICAgICAgc3RyaWN0TnVsbEhhbmRsaW5nLFxuICAgICAgICAgICAgc2tpcE51bGxzLFxuICAgICAgICAgICAgZW5jb2RlcixcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNvcnQsXG4gICAgICAgICAgICBhbGxvd0RvdHMsXG4gICAgICAgICAgICBzZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgZm9ybWF0dGVyXG4gICAgICAgICkpO1xuICAgIH1cblxuICAgIHJldHVybiBrZXlzLmpvaW4oZGVsaW1pdGVyKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgaGV4VGFibGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcnJheSA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyArK2kpIHtcbiAgICAgICAgYXJyYXkucHVzaCgnJScgKyAoKGkgPCAxNiA/ICcwJyA6ICcnKSArIGkudG9TdHJpbmcoMTYpKS50b1VwcGVyQ2FzZSgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59KCkpO1xuXG5leHBvcnRzLmFycmF5VG9PYmplY3QgPSBmdW5jdGlvbiAoc291cmNlLCBvcHRpb25zKSB7XG4gICAgdmFyIG9iaiA9IG9wdGlvbnMgJiYgb3B0aW9ucy5wbGFpbk9iamVjdHMgPyBPYmplY3QuY3JlYXRlKG51bGwpIDoge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2UubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2VbaV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBvYmpbaV0gPSBzb3VyY2VbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxuZXhwb3J0cy5tZXJnZSA9IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSwgb3B0aW9ucykge1xuICAgIGlmICghc291cmNlKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldC5wdXNoKHNvdXJjZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHRhcmdldFtzb3VyY2VdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbdGFyZ2V0LCBzb3VyY2VdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIFt0YXJnZXRdLmNvbmNhdChzb3VyY2UpO1xuICAgIH1cblxuICAgIHZhciBtZXJnZVRhcmdldCA9IHRhcmdldDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQpICYmICFBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgICAgbWVyZ2VUYXJnZXQgPSBleHBvcnRzLmFycmF5VG9PYmplY3QodGFyZ2V0LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0YXJnZXQpICYmIEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgICAgICBzb3VyY2UuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSwgaSkge1xuICAgICAgICAgICAgaWYgKGhhcy5jYWxsKHRhcmdldCwgaSkpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0W2ldICYmIHR5cGVvZiB0YXJnZXRbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtpXSA9IGV4cG9ydHMubWVyZ2UodGFyZ2V0W2ldLCBpdGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRhcmdldFtpXSA9IGl0ZW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgIHJldHVybiBPYmplY3Qua2V5cyhzb3VyY2UpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW2tleV07XG5cbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhY2MsIGtleSkpIHtcbiAgICAgICAgICAgIGFjY1trZXldID0gZXhwb3J0cy5tZXJnZShhY2Nba2V5XSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWNjW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH0sIG1lcmdlVGFyZ2V0KTtcbn07XG5cbmV4cG9ydHMuZGVjb2RlID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxufTtcblxuZXhwb3J0cy5lbmNvZGUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgLy8gVGhpcyBjb2RlIHdhcyBvcmlnaW5hbGx5IHdyaXR0ZW4gYnkgQnJpYW4gV2hpdGUgKG1zY2RleCkgZm9yIHRoZSBpby5qcyBjb3JlIHF1ZXJ5c3RyaW5nIGxpYnJhcnkuXG4gICAgLy8gSXQgaGFzIGJlZW4gYWRhcHRlZCBoZXJlIGZvciBzdHJpY3RlciBhZGhlcmVuY2UgdG8gUkZDIDM5ODZcbiAgICBpZiAoc3RyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICAgIHZhciBzdHJpbmcgPSB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyA/IHN0ciA6IFN0cmluZyhzdHIpO1xuXG4gICAgdmFyIG91dCA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgYyA9PT0gMHgyRCB8fCAvLyAtXG4gICAgICAgICAgICBjID09PSAweDJFIHx8IC8vIC5cbiAgICAgICAgICAgIGMgPT09IDB4NUYgfHwgLy8gX1xuICAgICAgICAgICAgYyA9PT0gMHg3RSB8fCAvLyB+XG4gICAgICAgICAgICAoYyA+PSAweDMwICYmIGMgPD0gMHgzOSkgfHwgLy8gMC05XG4gICAgICAgICAgICAoYyA+PSAweDQxICYmIGMgPD0gMHg1QSkgfHwgLy8gYS16XG4gICAgICAgICAgICAoYyA+PSAweDYxICYmIGMgPD0gMHg3QSkgLy8gQS1aXG4gICAgICAgICkge1xuICAgICAgICAgICAgb3V0ICs9IHN0cmluZy5jaGFyQXQoaSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjIDwgMHg4MCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgaGV4VGFibGVbY107XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjIDwgMHg4MDApIHtcbiAgICAgICAgICAgIG91dCA9IG91dCArIChoZXhUYWJsZVsweEMwIHwgKGMgPj4gNildICsgaGV4VGFibGVbMHg4MCB8IChjICYgMHgzRildKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweEQ4MDAgfHwgYyA+PSAweEUwMDApIHtcbiAgICAgICAgICAgIG91dCA9IG91dCArIChoZXhUYWJsZVsweEUwIHwgKGMgPj4gMTIpXSArIGhleFRhYmxlWzB4ODAgfCAoKGMgPj4gNikgJiAweDNGKV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpICs9IDE7XG4gICAgICAgIGMgPSAweDEwMDAwICsgKCgoYyAmIDB4M0ZGKSA8PCAxMCkgfCAoc3RyaW5nLmNoYXJDb2RlQXQoaSkgJiAweDNGRikpO1xuICAgICAgICBvdXQgKz0gaGV4VGFibGVbMHhGMCB8IChjID4+IDE4KV0gKyBoZXhUYWJsZVsweDgwIHwgKChjID4+IDEyKSAmIDB4M0YpXSArIGhleFRhYmxlWzB4ODAgfCAoKGMgPj4gNikgJiAweDNGKV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbmV4cG9ydHMuY29tcGFjdCA9IGZ1bmN0aW9uIChvYmosIHJlZmVyZW5jZXMpIHtcbiAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG4gICAgdmFyIHJlZnMgPSByZWZlcmVuY2VzIHx8IFtdO1xuICAgIHZhciBsb29rdXAgPSByZWZzLmluZGV4T2Yob2JqKTtcbiAgICBpZiAobG9va3VwICE9PSAtMSkge1xuICAgICAgICByZXR1cm4gcmVmc1tsb29rdXBdO1xuICAgIH1cblxuICAgIHJlZnMucHVzaChvYmopO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICB2YXIgY29tcGFjdGVkID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChvYmpbaV0gJiYgdHlwZW9mIG9ialtpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBjb21wYWN0ZWQucHVzaChleHBvcnRzLmNvbXBhY3Qob2JqW2ldLCByZWZzKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmpbaV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29tcGFjdGVkLnB1c2gob2JqW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb21wYWN0ZWQ7XG4gICAgfVxuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIG9ialtrZXldID0gZXhwb3J0cy5jb21wYWN0KG9ialtrZXldLCByZWZzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBvYmo7XG59O1xuXG5leHBvcnRzLmlzUmVnRXhwID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59O1xuXG5leHBvcnRzLmlzQnVmZmVyID0gZnVuY3Rpb24gKG9iaikge1xuICAgIGlmIChvYmogPT09IG51bGwgfHwgdHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiAhIShvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9IDogZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTtcblxudmFyIHFzID0gcmVxdWlyZSgncXMnKTtcblxudmFyIHVybFJlZ2V4ID0gL14oPzooW146Lz8jXSspOig/PVxcL1xcLykpPyg/OlxcL1xcLyg/OiguKj8pQCk/KFteLz8jXSopPyk/KFtePyNdKikoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/LztcblxudmFyIHBhcnNlVXJsID0gZnVuY3Rpb24gcGFyc2VVcmwodXJsLCBwYXJzZVF1ZXJ5KSB7XG4gIHZhciBtYXRjaCA9IHVybFJlZ2V4LmV4ZWModXJsKTtcbiAgcmV0dXJuIG1hdGNoICYmIHtcbiAgICBwcm90b2NvbDogbWF0Y2hbMV0gfHwgJycsXG4gICAgYXV0aDogbWF0Y2hbMl0gfHwgJycsXG4gICAgaG9zdDogbWF0Y2hbM10gfHwgJycsXG4gICAgcGF0aG5hbWU6IG1hdGNoWzRdIHx8ICcnLFxuICAgIHF1ZXJ5OiBwYXJzZVF1ZXJ5ID09PSB0cnVlID8gcXMucGFyc2UobWF0Y2hbNV0pIDogbWF0Y2hbNV0sXG4gICAgaGFzaDogZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzZdIHx8ICcnKVxuICB9O1xufTtcblxudmFyIHVybCA9IHtcbiAgcGFyc2U6IHBhcnNlVXJsLFxuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZShvcHRpb25zKSB7XG4gICAgb3B0aW9ucy5wcm90b2NvbCA9IG9wdGlvbnMucHJvdG9jb2wgfHwgJ2h0dHAnO1xuICAgIG9wdGlvbnMuaG9zdCA9IG9wdGlvbnMuaG9zdCB8fCAnbG9jYWxob3N0JztcbiAgICByZXR1cm4gb3B0aW9ucy5wcm90b2NvbCArICc6Ly8nICsgb3B0aW9ucy5ob3N0ICsgdXJsLmNyZWF0ZVBhdGgob3B0aW9ucy5wYXRobmFtZSwgb3B0aW9ucy5xdWVyeSwgb3B0aW9ucy5oYXNoKTtcbiAgfSxcbiAgY3JlYXRlUGF0aDogZnVuY3Rpb24gY3JlYXRlUGF0aChwYXRobmFtZSwgcXVlcnksIGhhc2gpIHtcbiAgICBpZiAoKHR5cGVvZiBwYXRobmFtZSA9PT0gJ3VuZGVmaW5lZCcgPyAndW5kZWZpbmVkJyA6IF90eXBlb2YocGF0aG5hbWUpKSA9PT0gJ29iamVjdCcgJiYgcGF0aG5hbWUgIT09IG51bGwpIHtcbiAgICAgIHF1ZXJ5ID0gcGF0aG5hbWUucXVlcnk7XG4gICAgICBoYXNoID0gcGF0aG5hbWUuaGFzaDtcbiAgICAgIHBhdGhuYW1lID0gcGF0aG5hbWUucGF0aG5hbWU7XG4gICAgfVxuICAgIHBhdGhuYW1lID0gcGF0aG5hbWUgfHwgJy8nO1xuICAgIHBhdGhuYW1lID0gcGF0aG5hbWUuY2hhckF0KDApID09PSAnLycgPyBwYXRobmFtZSA6ICcvJyArIHBhdGhuYW1lO1xuICAgIHF1ZXJ5ID0gcXVlcnkgPyB0eXBlb2YgcXVlcnkgPT09ICdzdHJpbmcnID8gcXVlcnkgOiAnPycgKyBxcy5zdHJpbmdpZnkocXVlcnkpIDogJyc7XG4gICAgaGFzaCA9IGhhc2ggPyAnIycgKyBlbmNvZGVVUklDb21wb25lbnQoaGFzaCkgOiAnJztcbiAgICByZXR1cm4gcGF0aG5hbWUgKyBxdWVyeSArIGhhc2g7XG4gIH0sXG4gIHFzOiBxc1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1cmw7Il19
