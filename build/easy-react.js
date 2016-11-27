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
  getView: function getView(path, stringify, staticMarkup) {
    this.router.match(path);
    return stringify === true ? staticMarkup === true ? ReactDOMServer.renderToStaticMarkup(this.view) : ReactDOMServer.renderToString(this.view) : this.view;
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
  get: function get(path, copy) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy8uNi4wLjFAYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiYnVpbGQvbW9kdWxlcy9Qcm92aWRlci5qcyIsImJ1aWxkL21vZHVsZXMvZWFzeS1yZWFjdC5qcyIsImJ1aWxkL21vZHVsZXMvbGliL0Vhc3lSZWFjdC5qcyIsImJ1aWxkL21vZHVsZXMvbGliL0hpc3RvcnkuanMiLCJidWlsZC9tb2R1bGVzL2xpYi9MaW5rLmpzIiwibm9kZV9tb2R1bGVzL2pzb25zdG9yZS1qcy9saWIvSlNPTkRhdGFTdG9yZS5qcyIsIm5vZGVfbW9kdWxlcy9qc29uc3RvcmUtanMvbGliL2FycmF5LmpzIiwibm9kZV9tb2R1bGVzL2pzb25zdG9yZS1qcy9saWIvb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2pzb25zdG9yZS1qcy9saWIvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvanNvbnN0b3JlLWpzL3N0b3JlLmpzIiwibm9kZV9tb2R1bGVzL21pbmktcm91dGVyanMvbGliL3JvdXRlLWNvbXBpbGVyLmpzIiwibm9kZV9tb2R1bGVzL21pbmktcm91dGVyanMvcm91dGVyLmpzIiwibm9kZV9tb2R1bGVzL3FzL2xpYi9mb3JtYXRzLmpzIiwibm9kZV9tb2R1bGVzL3FzL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9xcy9saWIvcGFyc2UuanMiLCJub2RlX21vZHVsZXMvcXMvbGliL3N0cmluZ2lmeS5qcyIsIm5vZGVfbW9kdWxlcy9xcy9saWIvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvc2ltcGxlLXVybC91cmwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVhc3lSZWFjdCA9IHJlcXVpcmUoJy4vbGliL0Vhc3lSZWFjdCcpO1xudmFyIFJlYWN0ID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1JlYWN0J10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydSZWFjdCddIDogbnVsbCk7XG52YXIgTGluayA9IHJlcXVpcmUoJy4vbGliL0xpbmsnKTtcblxudmFyIFByb3ZpZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBkaXNwbGF5TmFtZTogJ1Byb3ZpZGVyJyxcbiAgZ2V0Q2hpbGRDb250ZXh0OiBmdW5jdGlvbiBnZXRDaGlsZENvbnRleHQoKSB7XG4gICAgdmFyIGFwcCA9IHRoaXMucHJvcHMuYXBwO1xuICAgIHJldHVybiB7XG4gICAgICB1cGRhdGU6IGFwcC51cGRhdGUuYmluZChhcHApLFxuICAgICAgdG86IGFwcC50by5iaW5kKGFwcCksXG4gICAgICBMaW5rOiBMaW5rKGFwcClcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmNoaWxkcmVuO1xuICB9XG59KTtcblxuUHJvdmlkZXIuUHJvcFR5cGVzID0ge1xuICBhcHA6IFJlYWN0LlByb3BUeXBlcy5pbnN0YW5jZU9mKEVhc3lSZWFjdClcbn07XG5cblByb3ZpZGVyLmNoaWxkQ29udGV4dFR5cGVzID0ge1xuICB1cGRhdGU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gIHRvOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICBMaW5rOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEVhc3lSZWFjdCA9IHJlcXVpcmUoJy4vbGliL0Vhc3lSZWFjdCcpO1xudmFyIFByb3ZpZGVyID0gcmVxdWlyZSgnLi9Qcm92aWRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQXBwOiBFYXN5UmVhY3QsXG4gIFByb3ZpZGVyOiBQcm92aWRlclxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdERPTVNlcnZlciA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydSZWFjdERPTVNlcnZlciddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnUmVhY3RET01TZXJ2ZXInXSA6IG51bGwpO1xudmFyIFJlYWN0RE9NID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ1JlYWN0RE9NJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydSZWFjdERPTSddIDogbnVsbCk7XG52YXIgUm91dGVyID0gcmVxdWlyZSgnbWluaS1yb3V0ZXJqcycpO1xudmFyIEpTT05TdG9yZSA9IHJlcXVpcmUoJ2pzb25zdG9yZS1qcycpO1xudmFyIEhpc3RvcnkgPSByZXF1aXJlKCcuL0hpc3RvcnknKTtcblxuZnVuY3Rpb24gRWFzeVJlYWN0KG9wdGlvbnMpIHtcbiAgdGhpcy5pc0Jyb3dzZXJDb250ZXh0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG4gIHRoaXMudmlldyA9IG51bGw7XG5cbiAgdGhpcy5zdG9yZSA9IG5ldyBKU09OU3RvcmUoe1xuICAgIHN0b3JlOiBvcHRpb25zLnN0b3JlIHx8IHt9XG4gIH0pO1xuXG4gIHRoaXMucm91dGVyID0gbmV3IFJvdXRlcih7XG4gICAgc3RyaWN0OiBvcHRpb25zLnN0cmljdCAhPT0gZmFsc2VcbiAgfSk7XG5cbiAgdGhpcy5yZUluaXRTdG9yZSA9ICF0aGlzLmlzQnJvd3NlckNvbnRleHQ7XG5cbiAgdGhpcy5yb3V0ZXIuY3JlYXRlTWlzbWF0Y2goZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudmlldyA9IG51bGw7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgaWYgKHRoaXMuaXNCcm93c2VyQ29udGV4dCkge1xuICAgIHRoaXMuaGlzdG9yeSA9IG5ldyBIaXN0b3J5KHtcbiAgICAgIG9uSGlzdG9yeUNoYW5nZTogdGhpcy5fb25IaXN0b3J5Q2hhbmdlLmJpbmQodGhpcyksXG4gICAgICBoaXN0b3J5VHlwZTogb3B0aW9ucy5oaXN0b3J5VHlwZVxuICAgIH0pO1xuICAgIHRoaXMudmlld0NvbnRhaW5lciA9IHdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKG9wdGlvbnMudmlld0NvbnRhaW5lcik7XG4gIH1cbn1cblxuRWFzeVJlYWN0LnByb3RvdHlwZSA9IHtcbiAgX21vdW50VmlldzogZnVuY3Rpb24gX21vdW50Vmlldyh2aWV3KSB7XG4gICAgUmVhY3RET00ucmVuZGVyKHZpZXcsIHRoaXMudmlld0NvbnRhaW5lcik7XG4gIH0sXG4gIF9vbkhpc3RvcnlDaGFuZ2U6IGZ1bmN0aW9uIF9vbkhpc3RvcnlDaGFuZ2UocGF0aCkge1xuICAgIHRoaXMucm91dGVyLm1hdGNoKHBhdGgpO1xuICAgIHRoaXMuX21vdW50Vmlldyh0aGlzLmdldFZpZXcocGF0aCkpO1xuICB9LFxuICBjcmVhdGVSb3V0ZTogZnVuY3Rpb24gY3JlYXRlUm91dGUocm91dGUsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5yb3V0ZXIuY3JlYXRlKHJvdXRlLCBmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgdGhpcy52aWV3ID0gY2FsbGJhY2socmVxdWVzdCwgdGhpcy5zdG9yZS5nZXQoKSk7XG4gICAgICBpZiAodGhpcy5yZUluaXRTdG9yZSkge1xuICAgICAgICB0aGlzLnN0b3JlLnJlSW5pdCgpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSk7XG4gIH0sXG4gIGNyZWF0ZU1pc21hdGNoOiBmdW5jdGlvbiBjcmVhdGVNaXNtYXRjaChjYWxsYmFjaykge1xuICAgIHRoaXMucm91dGVyLmNyZWF0ZU1pc21hdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMudmlldyA9IGNhbGxiYWNrKHRoaXMuc3RvcmUuZ2V0KCkpIHx8IG51bGw7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfSxcbiAgZ2V0VmlldzogZnVuY3Rpb24gZ2V0VmlldyhwYXRoLCBzdHJpbmdpZnksIHN0YXRpY01hcmt1cCkge1xuICAgIHRoaXMucm91dGVyLm1hdGNoKHBhdGgpO1xuICAgIHJldHVybiBzdHJpbmdpZnkgPT09IHRydWUgPyBzdGF0aWNNYXJrdXAgPT09IHRydWUgPyBSZWFjdERPTVNlcnZlci5yZW5kZXJUb1N0YXRpY01hcmt1cCh0aGlzLnZpZXcpIDogUmVhY3RET01TZXJ2ZXIucmVuZGVyVG9TdHJpbmcodGhpcy52aWV3KSA6IHRoaXMudmlldztcbiAgfSxcbiAgdXBkYXRlU3RvcmU6IGZ1bmN0aW9uIHVwZGF0ZVN0b3JlKG5hbWUsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZikge1xuICAgIHJldHVybiB0aGlzLnN0b3JlLmRvKG5hbWUsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZik7XG4gIH0sXG4gIHRvOiBmdW5jdGlvbiB0byh1cmwsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBpZiAodHlwZW9mIGFjdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmVzdWx0ID0gdGhpcy5zdG9yZS5kbyhhY3Rpb24sIGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgIH1cbiAgICB0aGlzLmhpc3RvcnkudXBkYXRlVXJsKHVybCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcbiAgdXBkYXRlOiBmdW5jdGlvbiB1cGRhdGUobmFtZSwgYWN0aW9uLCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgYWN0aW9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXN1bHQgPSB0aGlzLnN0b3JlLmRvKG5hbWUsIGFjdGlvbiwgYSwgYiwgYywgZCwgZSwgZik7XG4gICAgfVxuICAgIHZhciB2aWV3ID0gdGhpcy5nZXRWaWV3KHRoaXMuaGlzdG9yeS5nZXRDdXJyZW50VXJsKHRydWUpKTtcbiAgICB0aGlzLl9tb3VudFZpZXcodmlldyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcbiAgZ2V0OiBmdW5jdGlvbiBnZXQocGF0aCwgY29weSkge1xuICAgIHJldHVybiB0aGlzLnN0b3JlLmdldChwYXRoLCBjb3B5KTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFYXN5UmVhY3Q7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXJsUGFyc2VyID0gcmVxdWlyZSgnc2ltcGxlLXVybCcpO1xudmFyIGhpc3RvcnlUeXBlcyA9IHtcbiAgJ2g1JzogJ2g1JyxcbiAgJ2hhc2gnOiAnaGFzaCdcbn07XG5cbmZ1bmN0aW9uIEhpc3Rvcnkob3B0aW9ucykge1xuICB0aGlzLmhpc3RvcnlUeXBlID0gaGlzdG9yeVR5cGVzW29wdGlvbnMuaGlzdG9yeVR5cGVdIHx8IHRoaXMuX2RldGVjdEhpc3RvcnlUeXBlKCk7XG4gIHRoaXMub25IaXN0b3J5Q2hhbmdlID0gdHlwZW9mIG9wdGlvbnMub25IaXN0b3J5Q2hhbmdlID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5vbkhpc3RvcnlDaGFuZ2UgOiBmdW5jdGlvbiAoKSB7fTtcbiAgdGhpcy5faW5pdCgpO1xufVxuXG5IaXN0b3J5LnByb3RvdHlwZSA9IHtcbiAgdXBkYXRlVXJsOiBmdW5jdGlvbiB1cGRhdGVVcmwodXJsKSB7XG4gICAgdXJsID0gdGhpcy5fZm9ybWF0VXJsKHVybCwgdHJ1ZSk7XG4gICAgaWYgKHRoaXMuaGlzdG9yeVR5cGUgPT09ICdoNScpIHtcbiAgICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSh7fSwgJycsIHVybCk7XG4gICAgICB0aGlzLm9uSGlzdG9yeUNoYW5nZSh0aGlzLl9mb3JtYXRVcmwodXJsLCB0cnVlKSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmhpc3RvcnlUeXBlID09PSAnaGFzaCcpIHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gdXJsO1xuICAgIH1cbiAgfSxcbiAgZ2V0Q3VycmVudFVybDogZnVuY3Rpb24gZ2V0Q3VycmVudFVybChwYXRoT25seSkge1xuICAgIHJldHVybiB0aGlzLl9mb3JtYXRVcmwod2luZG93LmxvY2F0aW9uLmhyZWYsIHBhdGhPbmx5KTtcbiAgfSxcbiAgX2RldGVjdEhpc3RvcnlUeXBlOiBmdW5jdGlvbiBfZGV0ZWN0SGlzdG9yeVR5cGUoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUgPT09ICdmdW5jdGlvbicgPyAnaDUnIDogJ2hhc2gnO1xuICB9LFxuICBfaXNIYXNoVXJsOiBmdW5jdGlvbiBfaXNIYXNoVXJsKGhhc2gpIHtcbiAgICByZXR1cm4gaGFzaC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfSxcbiAgX2Zvcm1hdFVybDogZnVuY3Rpb24gX2Zvcm1hdFVybCh1cmwsIHBhdGhPbmx5KSB7XG4gICAgdmFyIHVybE9iaiA9IHVybFBhcnNlci5wYXJzZSh1cmwsIGZhbHNlKTtcbiAgICBpZiAodGhpcy5faXNIYXNoVXJsKHVybE9iai5oYXNoKSkge1xuICAgICAgdXJsT2JqID0gdXJsUGFyc2VyLnBhcnNlKHVybE9iai5oYXNoLCBmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiBwYXRoT25seSA9PT0gdHJ1ZSA/IHVybFBhcnNlci5jcmVhdGVQYXRoKHVybE9iai5wYXRobmFtZSwgdXJsT2JqLnF1ZXJ5LCB1cmxPYmouaGFzaCkgOiB1cmxQYXJzZXIuY3JlYXRlKHVybE9iaik7XG4gIH0sXG4gIF9pbml0OiBmdW5jdGlvbiBfaW5pdCgpIHtcbiAgICBpZiAodGhpcy5oaXN0b3J5VHlwZSA9PT0gJ2g1Jykge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMub25IaXN0b3J5Q2hhbmdlKHRoaXMuZ2V0Q3VycmVudFVybCh0cnVlKSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5oaXN0b3J5VHlwZSA9PT0gJ2hhc2gnKSB7XG4gICAgICB2YXIgbG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XG4gICAgICBpZiAobG9jYXRpb24ucGF0aG5hbWUubGVuZ3RoID4gMSkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvIycgKyBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaCArIGxvY2F0aW9uLmhhc2g7XG4gICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICB9XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImhhc2hjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm9uSGlzdG9yeUNoYW5nZSh0aGlzLmdldEN1cnJlbnRVcmwodHJ1ZSkpO1xuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSGlzdG9yeTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBfZXh0ZW5kcyA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gKHRhcmdldCkgeyBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgeyB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldOyBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gfSB9IHJldHVybiB0YXJnZXQ7IH07XG5cbnZhciBSZWFjdCA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93WydSZWFjdCddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnUmVhY3QnXSA6IG51bGwpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcHApIHtcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICBfb25MaW5rQ2xpY2s6IGZ1bmN0aW9uIF9vbkxpbmtDbGljayhldmVudCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5vbkNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25DbGljayhldmVudCk7XG4gICAgICB9XG4gICAgICBhcHAudG8oZXZlbnQudGFyZ2V0LmhyZWYpO1xuICAgIH0sXG4gICAgcmVuZGVyOiBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2EnLFxuICAgICAgICBfZXh0ZW5kcyh7fSwgdGhpcy5wcm9wcywgeyBvbkNsaWNrOiB0aGlzLl9vbkxpbmtDbGljayB9KSxcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBhcnJheSA9IHJlcXVpcmUoJy4vYXJyYXknKTtcbnZhciBvYmplY3QgPSByZXF1aXJlKCcuL29iamVjdCcpO1xuXG52YXIgcGF0Y2hUeXBlcyA9IHtcbiAgYWRkOiAnYWRkJyxcbiAgcmVtb3ZlOiAncmVtb3ZlJyxcbiAgdXBkYXRlOiAndXBkYXRlJyxcbiAgbW92ZVVwOiAnbW92ZVVwJyxcbiAgbW92ZURvd246ICdtb3ZlRG93bicsXG4gIG1vdmVUbzogJ21vdmVUbycsXG4gIGV4Y2hhbmdlOiAnZXhjaGFuZ2UnLFxuICBleHRlbmRPYmplY3Q6ICdleHRlbmRPYmplY3QnLFxuICBzcHJlYWRBcnJheTogJ3NwcmVhZEFycmF5JyxcbiAgc3ByZWFkMmRBcnJheUNvbDogJ3NwcmVhZDJkQXJyYXlDb2wnLFxuICBzcHJlYWQyZEFycmF5Um93OiAnc3ByZWFkMmRBcnJheVJvdydcbn07XG5cbnZhciBjcmVhdGVQYXRjaCA9IGZ1bmN0aW9uIGNyZWF0ZVBhdGNoKHR5cGUsIGFyZ3MpIHtcbiAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MpO1xuICByZXR1cm4gdXRpbHMuY29weSh7XG4gICAgdHlwZTogdHlwZSxcbiAgICBhcmdzOiBhcmdzXG4gIH0pO1xufTtcblxuLyoqXG4gKiBjcmVhdGUgcGF0Y2ggb3BlcmF0aW9uc1xuICogKi9cblxudmFyIHBhdGNoTWV0aG9kcyA9IHtcbiAgY3JlYXRlQWRkOiBmdW5jdGlvbiBjcmVhdGVBZGQocGF0aCwgdmFsdWUsIGtleSkge1xuICAgIHJldHVybiBjcmVhdGVQYXRjaChwYXRjaFR5cGVzLmFkZCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlUmVtb3ZlOiBmdW5jdGlvbiBjcmVhdGVSZW1vdmUocGF0aCkge1xuICAgIHJldHVybiBjcmVhdGVQYXRjaChwYXRjaFR5cGVzLnJlbW92ZSwgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlVXBkYXRlOiBmdW5jdGlvbiBjcmVhdGVVcGRhdGUocGF0aCwgdmFsdWUsIGZvcmNlVXBkYXRlKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVBhdGNoKHBhdGNoVHlwZXMudXBkYXRlLCBhcmd1bWVudHMpO1xuICB9LFxuICBjcmVhdGVNb3ZlVXA6IGZ1bmN0aW9uIGNyZWF0ZU1vdmVVcChwYXRoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZVBhdGNoKHBhdGNoVHlwZXMubW92ZVVwLCBhcmd1bWVudHMpO1xuICB9LFxuICBjcmVhdGVNb3ZlRG93bjogZnVuY3Rpb24gY3JlYXRlTW92ZURvd24ocGF0aCkge1xuICAgIHJldHVybiBjcmVhdGVQYXRjaChwYXRjaFR5cGVzLm1vdmVEb3duLCBhcmd1bWVudHMpO1xuICB9LFxuICBjcmVhdGVNb3ZlVG86IGZ1bmN0aW9uIGNyZWF0ZU1vdmVUbyhmcm9tLCB0bywga2V5KSB7XG4gICAgcmV0dXJuIGNyZWF0ZVBhdGNoKHBhdGNoVHlwZXMubW92ZVRvLCBhcmd1bWVudHMpO1xuICB9LFxuICBjcmVhdGVFeGNoYW5nZTogZnVuY3Rpb24gY3JlYXRlRXhjaGFuZ2UoZnJvbSwgdG8pIHtcbiAgICByZXR1cm4gY3JlYXRlUGF0Y2gocGF0Y2hUeXBlcy5leGNoYW5nZSwgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlRXh0ZW5kT2JqZWN0OiBmdW5jdGlvbiBjcmVhdGVFeHRlbmRPYmplY3QocGF0aCwgYSwgYiwgYywgZCwgZSkge1xuICAgIHJldHVybiBjcmVhdGVQYXRjaChwYXRjaFR5cGVzLmV4dGVuZE9iamVjdCwgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlU3ByZWFkQXJyYXk6IGZ1bmN0aW9uIGNyZWF0ZVNwcmVhZEFycmF5KHBhdGgsIGJlZ2luLCBpbmZpbGxpbmcpIHtcbiAgICByZXR1cm4gY3JlYXRlUGF0Y2gocGF0Y2hUeXBlcy5zcHJlYWRBcnJheSwgYXJndW1lbnRzKTtcbiAgfSxcbiAgY3JlYXRlU3ByZWFkMmRBcnJheVJvdzogZnVuY3Rpb24gY3JlYXRlU3ByZWFkMmRBcnJheVJvdyhwYXRoLCBiZWdpbiwgcm93cykge1xuICAgIHJldHVybiBjcmVhdGVQYXRjaChwYXRjaFR5cGVzLnNwcmVhZDJkQXJyYXlSb3csIGFyZ3VtZW50cyk7XG4gIH0sXG4gIGNyZWF0ZVNwcmVhZDJkQXJyYXlDb2w6IGZ1bmN0aW9uIGNyZWF0ZVNwcmVhZDJkQXJyYXlDb2wocGF0aCwgYmVnaW4sIGNvbHMpIHtcbiAgICByZXR1cm4gY3JlYXRlUGF0Y2gocGF0Y2hUeXBlcy5zcHJlYWQyZEFycmF5Q29sLCBhcmd1bWVudHMpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBKU09ORGF0YVN0b3JlKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMuaW5pdGlhbE9wdGlvbnMgPSB1dGlscy5jb3B5KG9wdGlvbnMpO1xuICB2YXIgc3RvcmUgPSBvcHRpb25zLnN0b3JlLFxuICAgICAgY29weVN0b3JlID0gb3B0aW9ucy5jb3B5U3RvcmUgIT09IGZhbHNlO1xuICB0aGlzLnN0b3JlID0gY29weVN0b3JlID8gdXRpbHMuY29weShzdG9yZSkgOiBzdG9yZTtcbiAgLy8gJ2RvJyBhYm91dCBhdHRyaWJ1dGVzXG4gIHRoaXMucGF0Y2hlcyA9IFtdO1xuICB0aGlzLnJlbGF0aXZlUGF0Y2hlcyA9IFtdO1xuICB0aGlzLmJhY2tQYXRjaGVzID0gW107XG4gIHRoaXMuY3VycmVudFBhdGggPSBbXTtcbiAgdGhpcy5pc0RvaW5nID0gZmFsc2U7XG59XG5cbkpTT05EYXRhU3RvcmUucHJvdG90eXBlID0ge1xuICBfZ2V0UmVmOiBmdW5jdGlvbiBfZ2V0UmVmKHBhdGgpIHtcbiAgICB2YXIgcmVmID0gdGhpcy5zdG9yZSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIGxlbiA9IHBhdGgubGVuZ3RoO1xuICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHJlZiA9IHJlZltwYXRoW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlZjtcbiAgfSxcbiAgX2RldGVjdFBhdGg6IGZ1bmN0aW9uIF9kZXRlY3RQYXRoKHBhdGgpIHtcbiAgICB2YXIgZGV0ZWN0ZWQgPSBbXSxcbiAgICAgICAgcmVmID0gdGhpcy5zdG9yZSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIGxlbiA9IHBhdGgubGVuZ3RoLFxuICAgICAgICBrZXksXG4gICAgICAgIGtleVR5cGUsXG4gICAgICAgIHJlZlR5cGU7XG4gICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAga2V5ID0gcGF0aFtpXTtcbiAgICAgIGtleVR5cGUgPSB1dGlscy50eXBlKGtleSk7XG4gICAgICByZWZUeXBlID0gdXRpbHMudHlwZShyZWYpO1xuICAgICAgaWYgKHJlZlR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChrZXksICdfX3ZhbHVlJykpIHtcbiAgICAgICAgICB2YXIgb2JqS2V5ID0gb2JqZWN0LmdldE9iamVjdEtleUJ5VmFsdWUocmVmLCBrZXkuX192YWx1ZSk7XG4gICAgICAgICAgaWYgKG9iaktleSkge1xuICAgICAgICAgICAgcmVmID0gcmVmW29iaktleV07XG4gICAgICAgICAgICBkZXRlY3RlZC5wdXNoKG9iaktleSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwocmVmLCBrZXkpKSB7XG4gICAgICAgICAgcmVmID0gcmVmW2tleV07XG4gICAgICAgICAgZGV0ZWN0ZWQucHVzaChrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChyZWZUeXBlID09PSAnYXJyYXknKSB7XG4gICAgICAgIGlmIChvYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChrZXksICdfX3ZhbHVlJykpIHtcbiAgICAgICAgICB2YXIgaW5kZXggPSBhcnJheS5nZXRBcnJheUluZGV4QnlWYWx1ZShyZWYsIGtleS5fX3ZhbHVlKTtcbiAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgcmVmID0gcmVmW2luZGV4XTtcbiAgICAgICAgICAgIGRldGVjdGVkLnB1c2goaW5kZXgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlZiwga2V5KSkge1xuICAgICAgICAgIHJlZiA9IHJlZltrZXldO1xuICAgICAgICAgIGRldGVjdGVkLnB1c2goa2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRldGVjdGVkO1xuICB9LFxuICBfZm9ybWF0UGF0aDogZnVuY3Rpb24gX2Zvcm1hdFBhdGgocGF0aCwgZGV0ZWN0KSB7XG4gICAgdmFyIHBhdGhUeXBlID0gdXRpbHMudHlwZShwYXRoKTtcbiAgICBpZiAocGF0aFR5cGUgPT09ICd1bmRlZmluZWQnIHx8IHBhdGhUeXBlID09PSAnbnVsbCcpIHtcbiAgICAgIHBhdGggPSBbXTtcbiAgICB9IGVsc2UgaWYgKHBhdGhUeXBlICE9PSAnYXJyYXknKSB7XG4gICAgICBwYXRoID0gW3BhdGhdO1xuICAgIH1cbiAgICBpZiAoZGV0ZWN0ICE9PSBmYWxzZSkge1xuICAgICAgdmFyIGRldGVjdGVkID0gdGhpcy5fZGV0ZWN0UGF0aChwYXRoKTtcbiAgICAgIGlmIChkZXRlY3RlZC5sZW5ndGggPT09IHBhdGgubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBkZXRlY3RlZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcbiAgX21vdmVBcnJheUl0ZW06IGZ1bmN0aW9uIF9tb3ZlQXJyYXlJdGVtKHBhdGgsIG1vdmVVcCkge1xuICAgIHZhciBmdWxsUGF0aCA9IHRoaXMuX2dldEZ1bGxQYXRoKHBhdGgpO1xuICAgIGlmICghZnVsbFBhdGggfHwgZnVsbFBhdGgubGVuZ3RoIDwgMSkgcmV0dXJuIHRoaXM7XG4gICAgdmFyIGl0ZW1JbmRleCA9IGZ1bGxQYXRoLnBvcCgpLFxuICAgICAgICBhcnIgPSB0aGlzLl9nZXRSZWYoZnVsbFBhdGgpO1xuICAgIGlmICh1dGlscy50eXBlKGFycikgIT09ICdhcnJheScpIHJldHVybiB0aGlzO1xuICAgIHZhciBtZXRob2QgPSBtb3ZlVXAgPT09IHRydWUgPyAnY3JlYXRlTW92ZVVwJyA6ICdjcmVhdGVNb3ZlRG93bicsXG4gICAgICAgIHJldmVyc2VNZXRob2QgPSBtZXRob2QgPT09ICdjcmVhdGVNb3ZlVXAnID8gJ2NyZWF0ZU1vdmVEb3duJyA6ICdjcmVhdGVNb3ZlVXAnO1xuICAgIGlmICh0aGlzLmlzRG9pbmcpIHtcbiAgICAgIHRoaXMucGF0Y2hlcy5wdXNoKHBhdGNoTWV0aG9kc1ttZXRob2RdKGZ1bGxQYXRoLmNvbmNhdChpdGVtSW5kZXgpKSk7XG4gICAgICB0aGlzLnJlbGF0aXZlUGF0Y2hlcy5wdXNoKHBhdGNoTWV0aG9kc1ttZXRob2RdKHRoaXMuX2dldFJlbGF0aXZlUGF0aChmdWxsUGF0aC5jb25jYXQoaXRlbUluZGV4KSkpKTtcbiAgICAgIGlmIChtb3ZlVXAgPT09IHRydWUgJiYgaXRlbUluZGV4ID4gMCB8fCBtb3ZlVXAgIT09IHRydWUgJiYgaXRlbUluZGV4IDwgYXJyLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgdGhpcy5iYWNrUGF0Y2hlcy51bnNoaWZ0KHBhdGNoTWV0aG9kc1tyZXZlcnNlTWV0aG9kXShmdWxsUGF0aC5jb25jYXQobW92ZVVwID09PSB0cnVlID8gaXRlbUluZGV4IC0gMSA6IGl0ZW1JbmRleCArIDEpKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChtb3ZlVXAgPT09IHRydWUpIHtcbiAgICAgIGFycmF5Lm1vdmVBcnJheUl0ZW1VcChhcnIsIGl0ZW1JbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFycmF5Lm1vdmVBcnJheUl0ZW1Eb3duKGFyciwgaXRlbUluZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIF9nZXRGdWxsUGF0aDogZnVuY3Rpb24gX2dldEZ1bGxQYXRoKHBhdGgpIHtcbiAgICB2YXIgY3VycmVudFBhdGggPSB0aGlzLl9mb3JtYXRQYXRoKHRoaXMuY3VycmVudFBhdGgsIGZhbHNlKSxcbiAgICAgICAgZnVsbFBhdGggPSBjdXJyZW50UGF0aC5jb25jYXQodGhpcy5fZm9ybWF0UGF0aChwYXRoLCBmYWxzZSkpO1xuICAgIHJldHVybiB0aGlzLl9mb3JtYXRQYXRoKGZ1bGxQYXRoKTtcbiAgfSxcbiAgX2dldFJlbGF0aXZlUGF0aDogZnVuY3Rpb24gX2dldFJlbGF0aXZlUGF0aChmdWxsUGF0aCkge1xuICAgIHJldHVybiBmdWxsUGF0aC5zbGljZSh0aGlzLmN1cnJlbnRQYXRoLmxlbmd0aCk7XG4gIH0sXG4gIHJlSW5pdDogZnVuY3Rpb24gcmVJbml0KG9wdGlvbnMpIHtcbiAgICBKU09ORGF0YVN0b3JlLmNhbGwodGhpcywgb3B0aW9ucyB8fCB0aGlzLmluaXRpYWxPcHRpb25zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgZ29UbzogZnVuY3Rpb24gZ29UbyhwYXRoLCBhZGRVcCkge1xuICAgIGlmICghdGhpcy5pc0RvaW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBhcmUgdXNpbmcgc3RvcmUuZ29UbyBvdXRzaWRlIHN0b3JlLmRvIScpO1xuICAgIH1cbiAgICBpZiAoYWRkVXAgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuY3VycmVudFBhdGggPSB0aGlzLl9mb3JtYXRQYXRoKHRoaXMuY3VycmVudFBhdGguY29uY2F0KHRoaXMuX2Zvcm1hdFBhdGgocGF0aCwgZmFsc2UpKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY3VycmVudFBhdGggPSB0aGlzLl9mb3JtYXRQYXRoKHBhdGgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgZG86IGZ1bmN0aW9uIF9kbyhuYW1lLCBhY3Rpb24sIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdGhpcy5pc0RvaW5nID0gdHJ1ZTtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG5hbWUodGhpcywgYWN0aW9uLCBhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhY3Rpb24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGFjdGlvbih0aGlzLCBhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHBhcmFtZXRlciBhY3Rpb24uJyk7XG4gICAgfVxuICAgIC8vIGNvbXBvc2UgcmVzdWx0XG4gICAgcmVzdWx0LnBhdGNoZXMgPSB0aGlzLnBhdGNoZXM7XG4gICAgcmVzdWx0LnJlbGF0aXZlUGF0Y2hlcyA9IHRoaXMucmVsYXRpdmVQYXRjaGVzO1xuICAgIHJlc3VsdC5iYWNrUGF0Y2hlcyA9IHRoaXMuYmFja1BhdGNoZXM7XG4gICAgLy8gcmVzZXQgJ2RvJyBhYm91dCBhdHRyaWJ1dGVzXG4gICAgdGhpcy5wYXRjaGVzID0gW107XG4gICAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMgPSBbXTtcbiAgICB0aGlzLmJhY2tQYXRjaGVzID0gW107XG4gICAgdGhpcy5jdXJyZW50UGF0aCA9IFtdO1xuICAgIHRoaXMuaXNEb2luZyA9IGZhbHNlO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG4gIGFkZDogZnVuY3Rpb24gYWRkKHBhdGgsIHZhbHVlLCBrZXkpIHtcbiAgICB2YXIgcmVmLCByZWZUeXBlO1xuICAgIHBhdGggPSB0aGlzLl9nZXRGdWxsUGF0aChwYXRoKTtcbiAgICBpZiAoIXBhdGggfHwgIXV0aWxzLmlzUmVmZXJlbmNlVHlwZShyZWYgPSB0aGlzLl9nZXRSZWYocGF0aCkpIHx8IChyZWZUeXBlID0gdXRpbHMudHlwZShyZWYpKSA9PT0gJ29iamVjdCcgJiYgIXV0aWxzLmlzQ29tbW9uS2V5VHlwZShrZXkpKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNEb2luZykge1xuICAgICAgdGhpcy5wYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZUFkZChwYXRoLCB2YWx1ZSwga2V5KSk7XG4gICAgICB0aGlzLnJlbGF0aXZlUGF0Y2hlcy5wdXNoKHBhdGNoTWV0aG9kcy5jcmVhdGVBZGQodGhpcy5fZ2V0UmVsYXRpdmVQYXRoKHBhdGgpLCB2YWx1ZSwga2V5KSk7XG4gICAgICBpZiAocmVmVHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgdGhpcy5iYWNrUGF0Y2hlcy51bnNoaWZ0KHBhdGNoTWV0aG9kcy5jcmVhdGVSZW1vdmUocGF0aC5jb25jYXQoa2V5KSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5iYWNrUGF0Y2hlcy51bnNoaWZ0KHBhdGNoTWV0aG9kcy5jcmVhdGVVcGRhdGUocGF0aCwgdGhpcy5nZXQocGF0aCksIHRydWUpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlZlR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICByZWZba2V5XSA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaW5kZXggPSBhcnJheS5wYXJzZUFycmF5SW5kZXgoa2V5KTtcbiAgICAgIGlmIChpbmRleCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlZi5zcGxpY2UoaW5kZXgsIDAsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlZi5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKHBhdGgpIHtcbiAgICBpZiAoIShwYXRoID0gdGhpcy5fZ2V0RnVsbFBhdGgocGF0aCkpKSByZXR1cm4gdGhpcztcbiAgICBpZiAodGhpcy5pc0RvaW5nKSB7XG4gICAgICB0aGlzLnBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlUmVtb3ZlKHBhdGgpKTtcbiAgICAgIHRoaXMucmVsYXRpdmVQYXRjaGVzLnB1c2gocGF0Y2hNZXRob2RzLmNyZWF0ZVJlbW92ZSh0aGlzLl9nZXRSZWxhdGl2ZVBhdGgocGF0aCkpKTtcbiAgICAgIHRoaXMuYmFja1BhdGNoZXMudW5zaGlmdChwYXRjaE1ldGhvZHMuY3JlYXRlVXBkYXRlKHBhdGgsIHRoaXMuZ2V0KHBhdGgpLCB0cnVlKSk7XG4gICAgfVxuICAgIGlmIChwYXRoLmxlbmd0aCA8IDEpIHtcbiAgICAgIHRoaXMuc3RvcmUgPSB1bmRlZmluZWQ7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIGxhc3RLZXkgPSBwYXRoLnBvcCgpLFxuICAgICAgICByZWYgPSB0aGlzLl9nZXRSZWYocGF0aCksXG4gICAgICAgIHJlZlR5cGUgPSB1dGlscy50eXBlKHJlZik7XG4gICAgaWYgKHJlZlR5cGUgPT09ICdhcnJheScpIHtcbiAgICAgIHJlZi5zcGxpY2UobGFzdEtleSwgMSk7XG4gICAgfSBlbHNlIGlmIChyZWZUeXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgZGVsZXRlIHJlZltsYXN0S2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKHBhdGgsIHZhbHVlLCBmb3JjZVVwZGF0ZSkge1xuICAgIHBhdGggPSB0aGlzLl9mb3JtYXRQYXRoKHBhdGgsIGZhbHNlKTtcbiAgICB2YXIgbGFzdEtleSxcbiAgICAgICAgZnVsbFBhdGggPSB0aGlzLl9mb3JtYXRQYXRoKHBhdGgpO1xuICAgIGlmIChmdWxsUGF0aCkge1xuICAgICAgaWYgKHRoaXMuaXNEb2luZykge1xuICAgICAgICB0aGlzLnBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlVXBkYXRlKGZ1bGxQYXRoLCB2YWx1ZSkpO1xuICAgICAgICB0aGlzLnJlbGF0aXZlUGF0Y2hlcy5wdXNoKHBhdGNoTWV0aG9kcy5jcmVhdGVVcGRhdGUodGhpcy5fZ2V0UmVsYXRpdmVQYXRoKGZ1bGxQYXRoKSwgdmFsdWUpKTtcbiAgICAgICAgdGhpcy5iYWNrUGF0Y2hlcy51bnNoaWZ0KHBhdGNoTWV0aG9kcy5jcmVhdGVVcGRhdGUoZnVsbFBhdGgsIHRoaXMuZ2V0KGZ1bGxQYXRoKSkpO1xuICAgICAgfVxuICAgICAgbGFzdEtleSA9IGZ1bGxQYXRoLnBvcCgpO1xuICAgICAgaWYgKGxhc3RLZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9nZXRSZWYoZnVsbFBhdGgpW2xhc3RLZXldID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0b3JlID0gdmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2UgaWYgKGZvcmNlVXBkYXRlID09PSB0cnVlICYmIHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgbGFzdEtleSA9IHBhdGgucG9wKCk7XG4gICAgICByZXR1cm4gdGhpcy5hZGQocGF0aCwgdmFsdWUsIGxhc3RLZXkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbiBzZXQocGF0aCwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGUocGF0aCwgdmFsdWUsIHRydWUpO1xuICB9LFxuICBtb3ZlVXA6IGZ1bmN0aW9uIG1vdmVVcChwYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21vdmVBcnJheUl0ZW0ocGF0aCwgdHJ1ZSk7XG4gIH0sXG4gIG1vdmVEb3duOiBmdW5jdGlvbiBtb3ZlRG93bihwYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21vdmVBcnJheUl0ZW0ocGF0aCk7XG4gIH0sXG4gIG1vdmVUbzogZnVuY3Rpb24gbW92ZVRvKGZyb20sIHRvLCBrZXkpIHtcbiAgICBmcm9tID0gdGhpcy5fZ2V0RnVsbFBhdGgoZnJvbSk7XG4gICAgdG8gPSB0aGlzLl9nZXRGdWxsUGF0aCh0byk7XG4gICAgaWYgKCFmcm9tIHx8ICF0byB8fCAhdXRpbHMuaXNSZWZlcmVuY2VUeXBlKHRoaXMuX2dldFJlZih0bykpKSByZXR1cm4gdGhpcztcbiAgICB0aGlzLmFkZCh0bywgdGhpcy5fZ2V0UmVmKGZyb20pLCBrZXkpO1xuICAgIHRoaXMucmVtb3ZlKGZyb20pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBleGNoYW5nZTogZnVuY3Rpb24gZXhjaGFuZ2UoZnJvbSwgdG8pIHtcbiAgICBmcm9tID0gdGhpcy5fZm9ybWF0UGF0aChmcm9tKTtcbiAgICB0byA9IHRoaXMuX2Zvcm1hdFBhdGgodG8pO1xuICAgIGlmIChmcm9tICYmIHRvKSB7XG4gICAgICB2YXIgZnJvbVJlZiA9IHRoaXMuX2dldFJlZihmcm9tKSxcbiAgICAgICAgICB0b1JlZiA9IHRoaXMuZ2V0KHRvKTtcbiAgICAgIHRoaXMudXBkYXRlKGZyb20sIHRvUmVmKTtcbiAgICAgIHRoaXMudXBkYXRlKHRvLCBmcm9tUmVmKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIGV4dGVuZE9iamVjdDogZnVuY3Rpb24gZXh0ZW5kT2JqZWN0KHBhdGgsIGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICB2YXIgcmVmO1xuICAgIGlmICghKHBhdGggPSB0aGlzLl9mb3JtYXRQYXRoKHBhdGgpKSB8fCB1dGlscy50eXBlKHJlZiA9IHRoaXMuX2dldFJlZihwYXRoKSkgIT09ICdvYmplY3QnKSByZXR1cm4gdGhpcztcbiAgICBpZiAodGhpcy5pc0RvaW5nKSB7XG4gICAgICB0aGlzLnBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlRXh0ZW5kT2JqZWN0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgICAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlRXh0ZW5kT2JqZWN0KHRoaXMuX2dldFJlbGF0aXZlUGF0aChwYXRoKSwgYSwgYiwgYywgZCwgZSwgZikpO1xuICAgICAgdGhpcy5iYWNrUGF0Y2hlcy5wdXNoKHBhdGNoTWV0aG9kcy5jcmVhdGVVcGRhdGUocGF0aCwgdGhpcy5nZXQocGF0aCkpKTtcbiAgICB9XG4gICAgb2JqZWN0LmV4dGVuZChyZWYsIGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzcHJlYWRBcnJheTogZnVuY3Rpb24gc3ByZWFkQXJyYXkocGF0aCwgYmVnaW4sIGluZmlsbGluZykge1xuICAgIHZhciByZWY7XG4gICAgaWYgKCEocGF0aCA9IHRoaXMuX2Zvcm1hdFBhdGgocGF0aCkpIHx8IHV0aWxzLnR5cGUocmVmID0gdGhpcy5fZ2V0UmVmKHBhdGgpKSAhPT0gJ2FycmF5Jykge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGJlZ2luID0gYmVnaW4gfHwgcmVmLmxlbmd0aDtcbiAgICBpZiAoISh1dGlscy50eXBlKGJlZ2luKSA9PT0gJ251bWJlcicpKSByZXR1cm4gdGhpcztcbiAgICBpZiAodGhpcy5pc0RvaW5nKSB7XG4gICAgICB0aGlzLnBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlU3ByZWFkQXJyYXkocGF0aCwgYmVnaW4sIGluZmlsbGluZykpO1xuICAgICAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlU3ByZWFkQXJyYXkodGhpcy5fZ2V0UmVsYXRpdmVQYXRoKHBhdGgpLCBiZWdpbiwgaW5maWxsaW5nKSk7XG4gICAgICB0aGlzLmJhY2tQYXRjaGVzLnVuc2hpZnQocGF0Y2hNZXRob2RzLmNyZWF0ZVVwZGF0ZShwYXRoLCB0aGlzLmdldChwYXRoKSkpO1xuICAgIH1cbiAgICBhcnJheS5zcHJlYWRBcnJheShyZWYsIGJlZ2luLCBpbmZpbGxpbmcpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzcHJlYWQyZEFycmF5Um93OiBmdW5jdGlvbiBzcHJlYWQyZEFycmF5Um93KHBhdGgsIGJlZ2luLCByb3dzKSB7XG4gICAgdmFyIHJlZjtcbiAgICBpZiAoIShwYXRoID0gdGhpcy5fZm9ybWF0UGF0aChwYXRoKSkgfHwgIWFycmF5LmlzMmRBcnJheShyZWYgPSB0aGlzLl9nZXRSZWYocGF0aCkpIHx8ICEodXRpbHMudHlwZShiZWdpbikgPT09ICdudW1iZXInKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGJlZ2luID0gYmVnaW4gfHwgcmVmLmxlbmd0aDtcbiAgICBpZiAoISh1dGlscy50eXBlKGJlZ2luKSA9PT0gJ251bWJlcicpKSByZXR1cm4gdGhpcztcbiAgICBpZiAodGhpcy5pc0RvaW5nKSB7XG4gICAgICB0aGlzLnBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlU3ByZWFkMmRBcnJheVJvdyhwYXRoLCBiZWdpbiwgcm93cykpO1xuICAgICAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlU3ByZWFkMmRBcnJheVJvdyh0aGlzLl9nZXRSZWxhdGl2ZVBhdGgocGF0aCksIGJlZ2luLCByb3dzKSk7XG4gICAgICB0aGlzLmJhY2tQYXRjaGVzLnVuc2hpZnQocGF0Y2hNZXRob2RzLmNyZWF0ZVVwZGF0ZShwYXRoLCB0aGlzLmdldChwYXRoKSkpO1xuICAgIH1cbiAgICBhcnJheS5zcHJlYWQyZEFycmF5Um93KHJlZiwgYmVnaW4sIHJvd3MpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBzcHJlYWQyZEFycmF5Q29sOiBmdW5jdGlvbiBzcHJlYWQyZEFycmF5Q29sKHBhdGgsIGJlZ2luLCBjb2xzKSB7XG4gICAgdmFyIHJlZjtcbiAgICBpZiAoIShwYXRoID0gdGhpcy5fZm9ybWF0UGF0aChwYXRoKSkgfHwgIWFycmF5LmlzMmRBcnJheShyZWYgPSB0aGlzLl9nZXRSZWYocGF0aCkpIHx8ICEodXRpbHMudHlwZShiZWdpbikgPT09ICdudW1iZXInKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGJlZ2luID0gYmVnaW4gfHwgcmVmLmxlbmd0aDtcbiAgICBpZiAoISh1dGlscy50eXBlKGJlZ2luKSA9PT0gJ251bWJlcicpKSByZXR1cm4gdGhpcztcbiAgICBpZiAodGhpcy5pc0RvaW5nKSB7XG4gICAgICB0aGlzLnBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlU3ByZWFkMmRBcnJheUNvbChwYXRoLCBiZWdpbiwgY29scykpO1xuICAgICAgdGhpcy5yZWxhdGl2ZVBhdGNoZXMucHVzaChwYXRjaE1ldGhvZHMuY3JlYXRlU3ByZWFkMmRBcnJheUNvbCh0aGlzLl9nZXRSZWxhdGl2ZVBhdGgocGF0aCksIGJlZ2luLCBjb2xzKSk7XG4gICAgICB0aGlzLmJhY2tQYXRjaGVzLnVuc2hpZnQocGF0Y2hNZXRob2RzLmNyZWF0ZVVwZGF0ZShwYXRoLCB0aGlzLmdldChwYXRoKSkpO1xuICAgIH1cbiAgICBhcnJheS5zcHJlYWQyZEFycmF5Q29sKHJlZiwgYmVnaW4sIGNvbHMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBnZXQ6IGZ1bmN0aW9uIGdldChwYXRoLCBjb3B5KSB7XG4gICAgaWYgKHBhdGggPSB0aGlzLl9nZXRGdWxsUGF0aChwYXRoKSkge1xuICAgICAgcmV0dXJuIGNvcHkgPT09IGZhbHNlID8gdGhpcy5fZ2V0UmVmKHBhdGgpIDogdXRpbHMuY29weSh0aGlzLl9nZXRSZWYocGF0aCkpO1xuICAgIH1cbiAgfSxcbiAgcGF0Y2g6IHBhdGNoTWV0aG9kcyxcbiAgYXBwbHlQYXRjaDogZnVuY3Rpb24gYXBwbHlQYXRjaChwYXRjaGVzKSB7XG4gICAgcGF0Y2hlcyA9IHV0aWxzLnR5cGUocGF0Y2hlcykgPT09ICdhcnJheScgPyBwYXRjaGVzIDogW3BhdGNoZXNdO1xuICAgIHBhdGNoZXMuZm9yRWFjaChmdW5jdGlvbiAocGF0Y2gpIHtcbiAgICAgIHRoaXNbcGF0Y2gudHlwZV0uYXBwbHkodGhpcywgcGF0Y2guYXJncyk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcblxuSlNPTkRhdGFTdG9yZS5wYXRjaCA9IHBhdGNoTWV0aG9kcztcblxubW9kdWxlLmV4cG9ydHMgPSBKU09ORGF0YVN0b3JlOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgc3BsaWNlID0gQXJyYXkucHJvdG90eXBlLnNwbGljZTtcblxudmFyIGNyZWF0ZUFycmF5ID0gZnVuY3Rpb24gY3JlYXRlQXJyYXkobGVuZ3RoLCBpbmZpbGxpbmcpIHtcbiAgbGVuZ3RoID0gbGVuZ3RoIHx8IDA7XG4gIHZhciBhcnIgPSBbXSxcbiAgICAgIGkgPSAwO1xuICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgYXJyLnB1c2goaW5maWxsaW5nID09PSB1bmRlZmluZWQgPyBudWxsIDogaW5maWxsaW5nKTtcbiAgfVxuICByZXR1cm4gYXJyO1xufTtcblxudmFyIGlzMmRBcnJheSA9IGZ1bmN0aW9uIGlzMmRBcnJheShhcnIpIHtcbiAgdmFyIGlzMmQ7XG4gIGlmIChpczJkID0gdXRpbHMudHlwZShhcnIpID09PSAnYXJyYXknICYmIGFyci5sZW5ndGggPiAwKSB7XG4gICAgdmFyIGkgPSAwLFxuICAgICAgICBsZW4gPSBhcnIubGVuZ3RoO1xuICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGlzMmQgJj0gdXRpbHMudHlwZShhcnJbaV0pID09PSAnYXJyYXknO1xuICAgICAgaWYgKCFpczJkKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbnZhciBjcmVhdGUyZEFycmF5ID0gZnVuY3Rpb24gY3JlYXRlMmRBcnJheShyb3csIGNvbCwgaW5maWxsaW5nKSB7XG4gIHJvdyA9IHJvdyB8fCAwO1xuICBjb2wgPSBjb2wgfHwgMDtcbiAgdmFyIGFyciA9IG5ldyBBcnJheShyb3cpLFxuICAgICAgaSA9IDA7XG4gIGZvciAoOyBpIDwgcm93OyBpKyspIHtcbiAgICBhcnJbaV0gPSBjcmVhdGVBcnJheShjb2wsIGluZmlsbGluZyk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn07XG5cbnZhciBwYXJzZUFycmF5SW5kZXggPSBmdW5jdGlvbiBwYXJzZUFycmF5SW5kZXgoaW5kZXgpIHtcbiAgdmFyIHR5cGUgPSB1dGlscy50eXBlKGluZGV4KTtcbiAgaWYgKHR5cGUgPT09ICdzdHJpbmcnIHx8IHR5cGUgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIHBhcnNlSW50KGluZGV4KTtcbiAgfVxuICByZXR1cm4gdm9pZCAwO1xufTtcblxudmFyIGdldEFycmF5SW5kZXhCeVZhbHVlID0gZnVuY3Rpb24gZ2V0QXJyYXlJbmRleEJ5VmFsdWUoYXJyLCB2YWx1ZSkge1xuICBpZiAodXRpbHMudHlwZShhcnIpID09PSAnYXJyYXknKSB7XG4gICAgdmFyIHZhbHVlVHlwZSA9IHV0aWxzLnR5cGUodmFsdWUpO1xuICAgIGlmICh2YWx1ZVR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgbGVuID0gYXJyLmxlbmd0aCxcbiAgICAgICAgICBpdGVtO1xuICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBpdGVtID0gYXJyW2ldO1xuICAgICAgICB2YXIgaXNFcXVhbCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgICBpZiAodmFsdWUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgaXNFcXVhbCA9IGl0ZW1ba2V5XSA9PT0gdmFsdWVba2V5XTtcbiAgICAgICAgICAgIGlmICghaXNFcXVhbCkgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpc0VxdWFsKSB7XG4gICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGFyci5pbmRleE9mKHZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBtb3ZlQXJyYXlJdGVtVXAgPSBmdW5jdGlvbiBtb3ZlQXJyYXlJdGVtVXAoYXJyLCBpbmRleCkge1xuICBpZiAodXRpbHMudHlwZShhcnIpID09PSAnYXJyYXknKSB7XG4gICAgaW5kZXggPSBwYXJzZUFycmF5SW5kZXgoaW5kZXgpO1xuICAgIHZhciBjdXJySXRlbSA9IGFycltpbmRleF07XG4gICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgYXJyW2luZGV4XSA9IGFycltpbmRleCAtIDFdO1xuICAgICAgYXJyW2luZGV4IC0gMV0gPSBjdXJySXRlbTtcbiAgICB9XG4gIH1cbn07XG5cbnZhciBtb3ZlQXJyYXlJdGVtRG93biA9IGZ1bmN0aW9uIG1vdmVBcnJheUl0ZW1Eb3duKGFyciwgaW5kZXgpIHtcbiAgaWYgKHV0aWxzLnR5cGUoYXJyKSA9PT0gJ2FycmF5Jykge1xuICAgIGluZGV4ID0gcGFyc2VBcnJheUluZGV4KGluZGV4KTtcbiAgICB2YXIgY3Vyckl0ZW0gPSBhcnJbaW5kZXhdO1xuICAgIGlmIChpbmRleCA8IGFyci5sZW5ndGggLSAxKSB7XG4gICAgICBhcnJbaW5kZXhdID0gYXJyW2luZGV4ICsgMV07XG4gICAgICBhcnJbaW5kZXggKyAxXSA9IGN1cnJJdGVtO1xuICAgIH1cbiAgfVxufTtcblxudmFyIHNwcmVhZEFycmF5ID0gZnVuY3Rpb24gc3ByZWFkQXJyYXkoYXJyLCBiZWdpbiwgaW5maWxsaW5nKSB7XG4gIHZhciBkZWxldGVkID0gW107XG4gIGlmICh1dGlscy50eXBlKGFycikgPT09ICdhcnJheScpIHtcbiAgICB2YXIgaW5maWxsaW5nVHlwZSA9IHV0aWxzLnR5cGUoaW5maWxsaW5nKTtcbiAgICBpZiAoaW5maWxsaW5nVHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgc3BsaWNlLmFwcGx5KGFyciwgW2JlZ2luLCAwXS5jb25jYXQoaW5maWxsaW5nKSk7XG4gICAgfSBlbHNlIGlmIChpbmZpbGxpbmdUeXBlID09PSAnbnVtYmVyJykge1xuICAgICAgaWYgKGluZmlsbGluZyA+IDApIHtcbiAgICAgICAgc3BsaWNlLmFwcGx5KGFyciwgW2JlZ2luLCAwXS5jb25jYXQoY3JlYXRlQXJyYXkoaW5maWxsaW5nKSkpO1xuICAgICAgfSBlbHNlIGlmIChpbmZpbGxpbmcgPCAwKSB7XG4gICAgICAgIGRlbGV0ZWQgPSBzcGxpY2UuYXBwbHkoYXJyLCBbYmVnaW4sIE1hdGguYWJzKGluZmlsbGluZyldKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlbGV0ZWQ7XG59O1xuXG52YXIgc3ByZWFkMmRBcnJheVJvdyA9IGZ1bmN0aW9uIHNwcmVhZDJkQXJyYXlSb3coYXJyLCBiZWdpbiwgcm93cykge1xuICB2YXIgZGVsZXRlZCA9IFtdLFxuICAgICAgcm93c1R5cGUgPSB1dGlscy50eXBlKHJvd3MpO1xuICBpZiAoaXMyZEFycmF5KGFycikpIHtcbiAgICB2YXIgY29sQ291bnQgPSBhcnJbMF0ubGVuZ3RoO1xuICAgIGlmIChyb3dzVHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGlmIChyb3dzID4gMCkge1xuICAgICAgICBzcHJlYWRBcnJheShhcnIsIGJlZ2luLCBjcmVhdGUyZEFycmF5KHJvd3MsIGNvbENvdW50KSk7XG4gICAgICB9IGVsc2UgaWYgKHJvd3MgPCAwKSB7XG4gICAgICAgIGRlbGV0ZWQgPSBzcHJlYWRBcnJheShhcnIsIGJlZ2luLCByb3dzKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHJvd3NUeXBlID09PSAnYXJyYXknKSB7XG4gICAgICBzcHJlYWRBcnJheShhcnIsIGJlZ2luLCByb3dzKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlbGV0ZWQ7XG59O1xuXG52YXIgc3ByZWFkMmRBcnJheUNvbCA9IGZ1bmN0aW9uIHNwcmVhZDJkQXJyYXlDb2woYXJyLCBiZWdpbiwgY29scykge1xuICB2YXIgZGVsZXRlZCA9IFtdLFxuICAgICAgZGVsZXRlZENvbCxcbiAgICAgIGNvbHNUeXBlID0gdXRpbHMudHlwZShjb2xzKTtcbiAgaWYgKGlzMmRBcnJheShhcnIpKSB7XG4gICAgdmFyIHJvd0NvdW50ID0gYXJyLmxlbmd0aCxcbiAgICAgICAgaSA9IDA7XG4gICAgaWYgKGNvbHNUeXBlID09PSAnbnVtYmVyJykge1xuICAgICAgZm9yICg7IGkgPCByb3dDb3VudDsgaSsrKSB7XG4gICAgICAgIGRlbGV0ZWRDb2wgPSBzcHJlYWRBcnJheShhcnJbaV0sIGJlZ2luLCBjb2xzKTtcbiAgICAgICAgaWYgKGRlbGV0ZWRDb2wubGVuZ3RoKSB7XG4gICAgICAgICAgZGVsZXRlZC5wdXNoKGRlbGV0ZWRDb2wpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjb2xzVHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgZm9yICg7IGkgPCByb3dDb3VudDsgaSsrKSB7XG4gICAgICAgIHNwcmVhZEFycmF5KGFycltpXSwgYmVnaW4sIGNvbHNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZGVsZXRlZDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpczJkQXJyYXk6IGlzMmRBcnJheSxcbiAgY3JlYXRlQXJyYXk6IGNyZWF0ZUFycmF5LFxuICBjcmVhdGUyZEFycmF5OiBjcmVhdGUyZEFycmF5LFxuICBwYXJzZUFycmF5SW5kZXg6IHBhcnNlQXJyYXlJbmRleCxcbiAgZ2V0QXJyYXlJbmRleEJ5VmFsdWU6IGdldEFycmF5SW5kZXhCeVZhbHVlLFxuICBtb3ZlQXJyYXlJdGVtVXA6IG1vdmVBcnJheUl0ZW1VcCxcbiAgbW92ZUFycmF5SXRlbURvd246IG1vdmVBcnJheUl0ZW1Eb3duLFxuICBzcHJlYWRBcnJheTogc3ByZWFkQXJyYXksXG4gIHNwcmVhZDJkQXJyYXlSb3c6IHNwcmVhZDJkQXJyYXlSb3csXG4gIHNwcmVhZDJkQXJyYXlDb2w6IHNwcmVhZDJkQXJyYXlDb2xcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBnZXRPYmplY3RLZXlCeVZhbHVlID0gZnVuY3Rpb24gZ2V0T2JqZWN0S2V5QnlWYWx1ZShvYmosIHZhbHVlKSB7XG4gIHZhciBvYmpLZXksIG9ialZhbHVlLCB2YWx1ZUtleTtcbiAgaWYgKHV0aWxzLnR5cGUodmFsdWUpID09PSAnb2JqZWN0Jykge1xuICAgIG91dGVyOiBmb3IgKG9iaktleSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkob2JqS2V5KSAmJiB1dGlscy50eXBlKG9ialZhbHVlID0gb2JqW29iaktleV0pID09PSAnb2JqZWN0Jykge1xuICAgICAgICBmb3IgKHZhbHVlS2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgaWYgKHZhbHVlLmhhc093blByb3BlcnR5KHZhbHVlS2V5KSAmJiB2YWx1ZVt2YWx1ZUtleV0gIT09IG9ialZhbHVlW3ZhbHVlS2V5XSkge1xuICAgICAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvYmpLZXk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAob2JqS2V5IGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShvYmpLZXkpICYmIG9ialtvYmpLZXldID09PSB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gb2JqS2V5O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufTtcblxudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgdmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXSxcbiAgICAgIGFyZ0xlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJnTGVuOyBpKyspIHtcbiAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2ldLFxuICAgICAgICBrZXk7XG4gICAgaWYgKHV0aWxzLnR5cGUoc291cmNlKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAoa2V5IGluIHNvdXJjZSkge1xuICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICB0YXJnZXRba2V5XSA9IHV0aWxzLmNvcHkoc291cmNlW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaGFzT3duUHJvcGVydHk6IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHksXG4gIGV4dGVuZDogZXh0ZW5kLFxuICBnZXRPYmplY3RLZXlCeVZhbHVlOiBnZXRPYmplY3RLZXlCeVZhbHVlXG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlZmVyZW5jZVR5cGVzID0ge1xuICAnYXJyYXknOiB0cnVlLFxuICAnb2JqZWN0JzogdHJ1ZVxufTtcblxudmFyIGNvbW1vbktleVR5cGVzID0ge1xuICAnc3RyaW5nJzogdHJ1ZSxcbiAgJ251bWJlcic6IHRydWVcbn07XG5cbnZhciB0eXBlID0gZnVuY3Rpb24gdHlwZShkYXRhKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0YSkuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKCk7XG59O1xuXG52YXIgaXNSZWZlcmVuY2VUeXBlID0gZnVuY3Rpb24gaXNSZWZlcmVuY2VUeXBlKGRhdGEpIHtcbiAgcmV0dXJuIHJlZmVyZW5jZVR5cGVzW3R5cGUoZGF0YSldIHx8IGZhbHNlO1xufTtcblxudmFyIGlzQ29tbW9uS2V5VHlwZSA9IGZ1bmN0aW9uIGlzQ29tbW9uS2V5VHlwZShrZXkpIHtcbiAgcmV0dXJuIGNvbW1vbktleVR5cGVzW3R5cGUoa2V5KV0gfHwgZmFsc2U7XG59O1xuXG52YXIgY29weSA9IGZ1bmN0aW9uIGNvcHkoZGF0YSkge1xuICByZXR1cm4gaXNSZWZlcmVuY2VUeXBlKGRhdGEpID8gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhKSkgOiBkYXRhO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHR5cGU6IHR5cGUsXG4gIGNvcHk6IGNvcHksXG4gIGlzUmVmZXJlbmNlVHlwZTogaXNSZWZlcmVuY2VUeXBlLFxuICBpc0NvbW1vbktleVR5cGU6IGlzQ29tbW9uS2V5VHlwZVxufTsiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvSlNPTkRhdGFTdG9yZScpOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgQ29tcGlsZWRSb3V0ZVBhdGhzID0ge307XG5cbnZhciB0b2tlblJlZ2V4ID0gL1xcKHxcXCpcXCp8XFwqfDpbXi8pXSp8XFwpL2c7XG5cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpO1xufVxuXG5mdW5jdGlvbiBfY29tcGlsZShyb3V0ZVBhdGgsIHN0cmljdCkge1xuICB2YXIgbWF0Y2gsXG4gICAgICBsYXN0SW5kZXggPSAwLFxuICAgICAgcGF0dGVybiA9IFwiXCIsXG4gICAgICB0b2tlbixcbiAgICAgIHRva2VucyA9IFtdO1xuICB3aGlsZSAoKG1hdGNoID0gdG9rZW5SZWdleC5leGVjKHJvdXRlUGF0aCkpICE9PSBudWxsKSB7XG4gICAgaWYgKG1hdGNoLmluZGV4ICE9PSBsYXN0SW5kZXgpIHtcbiAgICAgIHBhdHRlcm4gKz0gZXNjYXBlUmVnRXhwKHJvdXRlUGF0aC5zbGljZShsYXN0SW5kZXgsIG1hdGNoLmluZGV4KSk7XG4gICAgfVxuICAgIHRva2VuID0gbWF0Y2hbMF07XG4gICAgaWYgKHRva2VuWzBdID09PSBcIjpcIikge1xuICAgICAgcGF0dGVybiArPSAnKFteL10qKSc7XG4gICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgfSBlbHNlIGlmICh0b2tlbiA9PT0gXCIqKlwiKSB7XG4gICAgICBwYXR0ZXJuICs9IFwiKC4qKVwiO1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgIH0gZWxzZSBpZiAodG9rZW4gPT09IFwiKlwiKSB7XG4gICAgICBwYXR0ZXJuICs9IFwiKC4qPylcIjtcbiAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICB9IGVsc2UgaWYgKHRva2VuID09PSBcIihcIikge1xuICAgICAgcGF0dGVybiArPSAnKD86JztcbiAgICB9IGVsc2UgaWYgKHRva2VuID09PSBcIilcIikge1xuICAgICAgcGF0dGVybiArPSAnKT8nO1xuICAgIH1cbiAgICBsYXN0SW5kZXggPSB0b2tlblJlZ2V4Lmxhc3RJbmRleDtcbiAgfVxuICBwYXR0ZXJuICs9IGVzY2FwZVJlZ0V4cChyb3V0ZVBhdGguc2xpY2UobGFzdEluZGV4KSk7XG4gIHBhdHRlcm4gPSBzdHJpY3QgPT09IHRydWUgPyBwYXR0ZXJuIDogcGF0dGVybi5zbGljZSgtMSkgPT09IFwiL1wiID8gcGF0dGVybiArIFwiP1wiIDogcGF0dGVybiArIFwiLz9cIjtcbiAgcGF0dGVybiArPSBcIiRcIjtcbiAgcmV0dXJuIHtcbiAgICByZWdleDogbmV3IFJlZ0V4cChwYXR0ZXJuKSxcbiAgICB0b2tlbnM6IHRva2Vuc1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY29tcGlsZTogZnVuY3Rpb24gY29tcGlsZShyb3V0ZVBhdGgsIHN0cmljdCkge1xuICAgIHZhciBjb21waWxlZCxcbiAgICAgICAgcGF0aEluZGV4ID0gcm91dGVQYXRoICsgKHN0cmljdCB8fCAnJyk7XG4gICAgY29tcGlsZWQgPSBDb21waWxlZFJvdXRlUGF0aHNbcGF0aEluZGV4XSB8fCBfY29tcGlsZShyb3V0ZVBhdGgsIHN0cmljdCk7XG4gICAgcmV0dXJuIENvbXBpbGVkUm91dGVQYXRoc1twYXRoSW5kZXhdID0gY29tcGlsZWQ7XG4gIH0sXG4gIHBhcnNlUGF0aDogZnVuY3Rpb24gcGFyc2VQYXRoKHBhdGhNYXRjaCwgdG9rZW5zKSB7XG4gICAgdmFyIHBhcmFtcyA9IHt9LFxuICAgICAgICBwYXJhbUluZGV4ID0gMDtcbiAgICB0b2tlbnMuZm9yRWFjaChmdW5jdGlvbiAodG9rZW4sIGluZGV4KSB7XG4gICAgICBpZiAodG9rZW5bMF0gPT09IFwiOlwiKSB7XG4gICAgICAgIHBhcmFtc1t0b2tlbi5zbGljZSgxKV0gPSBwYXRoTWF0Y2hbaW5kZXggKyAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtc1twYXJhbUluZGV4XSA9IHBhdGhNYXRjaFtpbmRleCArIDFdO1xuICAgICAgICBwYXJhbUluZGV4Kys7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciByb3V0ZUNvbXBpbGVyID0gcmVxdWlyZSgnLi9saWIvcm91dGUtY29tcGlsZXInKTtcbnZhciB1cmxVdGlscyA9IHJlcXVpcmUoJ3NpbXBsZS11cmwnKTtcbnZhciBlbXB0eUZ1bmMgPSBmdW5jdGlvbiBlbXB0eUZ1bmMoKSB7fTtcblxuZnVuY3Rpb24gUm91dGVyKG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5yZWdleFJvdXRlcnMgPSBbXTtcbiAgdGhpcy5zdHJpbmdSb3V0ZXJzID0ge307XG4gIHRoaXMub25NaXNtYXRjaCA9IGVtcHR5RnVuYztcbn1cblxuUm91dGVyLnByb3RvdHlwZSA9IHtcbiAgY3JlYXRlTWlzbWF0Y2g6IGZ1bmN0aW9uIGNyZWF0ZU1pc21hdGNoKG1pc21hdGNoKSB7XG4gICAgaWYgKHR5cGVvZiBtaXNtYXRjaCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5vbk1pc21hdGNoID0gbWlzbWF0Y2g7XG4gICAgfVxuICB9LFxuICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZShyb3V0ZSwgY2FsbGJhY2ssIHN0cmljdCkge1xuICAgIHN0cmljdCA9IHR5cGVvZiBzdHJpY3QgPT09ICdib29sZWFuJyA/IHN0cmljdCA6IHRoaXMub3B0aW9ucy5zdHJpY3QgfHwgZmFsc2U7XG4gICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBlbXB0eUZ1bmM7XG4gICAgdmFyIGNvbXBpbGVkID0gcm91dGVDb21waWxlci5jb21waWxlKHJvdXRlLCBzdHJpY3QpO1xuICAgIGlmIChjb21waWxlZC50b2tlbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLnN0cmluZ1JvdXRlcnNbcm91dGVdID0gY2FsbGJhY2s7XG4gICAgICBpZiAoc3RyaWN0ICE9PSB0cnVlKSB7XG4gICAgICAgIHRoaXMuc3RyaW5nUm91dGVyc1tyb3V0ZS5zbGljZSgtMSkgPT09IFwiL1wiID8gcm91dGUuc2xpY2UoMCwgLTEpIDogcm91dGUgKyBcIi9cIl0gPSBjYWxsYmFjaztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZWdleFJvdXRlcnMucHVzaChbY29tcGlsZWQsIGNhbGxiYWNrXSk7XG4gICAgfVxuICB9LFxuICBtYXRjaDogZnVuY3Rpb24gbWF0Y2godXJsLCBkYXRhKSB7XG4gICAgdmFyIHVybE9iaiA9IHVybFV0aWxzLnBhcnNlKHVybCksXG4gICAgICAgIHBhdGggPSB1cmxPYmoucGF0aG5hbWU7XG4gICAgdXJsT2JqLnVybCA9IHVybDtcbiAgICBpZiAodGhpcy5zdHJpbmdSb3V0ZXJzW3BhdGhdKSB7XG4gICAgICB0aGlzLnN0cmluZ1JvdXRlcnNbcGF0aF0oeyB1cmw6IHVybE9iaiwgcGFyYW1zOiBudWxsLCBkYXRhOiBkYXRhIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBpID0gMCxcbiAgICAgICAgICBsZW4gPSB0aGlzLnJlZ2V4Um91dGVycy5sZW5ndGgsXG4gICAgICAgICAgcm91dGVyLFxuICAgICAgICAgIG1hdGNoO1xuICAgICAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICAgICAgcm91dGVyID0gdGhpcy5yZWdleFJvdXRlcnNbaV07XG4gICAgICAgIG1hdGNoID0gcm91dGVyWzBdLnJlZ2V4LmV4ZWMocGF0aCk7XG4gICAgICAgIGlmIChtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgICAgIHJvdXRlclsxXSh7IHVybDogdXJsT2JqLCBwYXJhbXM6IHJvdXRlQ29tcGlsZXIucGFyc2VQYXRoKG1hdGNoLCByb3V0ZXJbMF0udG9rZW5zKSwgZGF0YTogZGF0YSB9KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMub25NaXNtYXRjaCh7IHVybDogdXJsT2JqLCBkYXRhOiBkYXRhIH0pO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSb3V0ZXI7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVwbGFjZSA9IFN0cmluZy5wcm90b3R5cGUucmVwbGFjZTtcbnZhciBwZXJjZW50VHdlbnRpZXMgPSAvJTIwL2c7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdkZWZhdWx0JzogJ1JGQzM5ODYnLFxuICAgIGZvcm1hdHRlcnM6IHtcbiAgICAgICAgUkZDMTczODogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwbGFjZS5jYWxsKHZhbHVlLCBwZXJjZW50VHdlbnRpZXMsICcrJyk7XG4gICAgICAgIH0sXG4gICAgICAgIFJGQzM5ODY6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBSRkMxNzM4OiAnUkZDMTczOCcsXG4gICAgUkZDMzk4NjogJ1JGQzM5ODYnXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5ID0gcmVxdWlyZSgnLi9zdHJpbmdpZnknKTtcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4vcGFyc2UnKTtcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGZvcm1hdHM6IGZvcm1hdHMsXG4gICAgcGFyc2U6IHBhcnNlLFxuICAgIHN0cmluZ2lmeTogc3RyaW5naWZ5XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgYWxsb3dEb3RzOiBmYWxzZSxcbiAgICBhbGxvd1Byb3RvdHlwZXM6IGZhbHNlLFxuICAgIGFycmF5TGltaXQ6IDIwLFxuICAgIGRlY29kZXI6IHV0aWxzLmRlY29kZSxcbiAgICBkZWxpbWl0ZXI6ICcmJyxcbiAgICBkZXB0aDogNSxcbiAgICBwYXJhbWV0ZXJMaW1pdDogMTAwMCxcbiAgICBwbGFpbk9iamVjdHM6IGZhbHNlLFxuICAgIHN0cmljdE51bGxIYW5kbGluZzogZmFsc2Vcbn07XG5cbnZhciBwYXJzZVZhbHVlcyA9IGZ1bmN0aW9uIHBhcnNlVmFsdWVzKHN0ciwgb3B0aW9ucykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICB2YXIgcGFydHMgPSBzdHIuc3BsaXQob3B0aW9ucy5kZWxpbWl0ZXIsIG9wdGlvbnMucGFyYW1ldGVyTGltaXQgPT09IEluZmluaXR5ID8gdW5kZWZpbmVkIDogb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdCk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gcGFydHNbaV07XG4gICAgICAgIHZhciBwb3MgPSBwYXJ0LmluZGV4T2YoJ109JykgPT09IC0xID8gcGFydC5pbmRleE9mKCc9JykgOiBwYXJ0LmluZGV4T2YoJ109JykgKyAxO1xuXG4gICAgICAgIHZhciBrZXksIHZhbDtcbiAgICAgICAgaWYgKHBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgIGtleSA9IG9wdGlvbnMuZGVjb2RlcihwYXJ0KTtcbiAgICAgICAgICAgIHZhbCA9IG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nID8gbnVsbCA6ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5ID0gb3B0aW9ucy5kZWNvZGVyKHBhcnQuc2xpY2UoMCwgcG9zKSk7XG4gICAgICAgICAgICB2YWwgPSBvcHRpb25zLmRlY29kZXIocGFydC5zbGljZShwb3MgKyAxKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSBbXS5jb25jYXQob2JqW2tleV0pLmNvbmNhdCh2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2JqW2tleV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxudmFyIHBhcnNlT2JqZWN0ID0gZnVuY3Rpb24gcGFyc2VPYmplY3QoY2hhaW4sIHZhbCwgb3B0aW9ucykge1xuICAgIGlmICghY2hhaW4ubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgdmFyIHJvb3QgPSBjaGFpbi5zaGlmdCgpO1xuXG4gICAgdmFyIG9iajtcbiAgICBpZiAocm9vdCA9PT0gJ1tdJykge1xuICAgICAgICBvYmogPSBbXTtcbiAgICAgICAgb2JqID0gb2JqLmNvbmNhdChwYXJzZU9iamVjdChjaGFpbiwgdmFsLCBvcHRpb25zKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgb2JqID0gb3B0aW9ucy5wbGFpbk9iamVjdHMgPyBPYmplY3QuY3JlYXRlKG51bGwpIDoge307XG4gICAgICAgIHZhciBjbGVhblJvb3QgPSByb290WzBdID09PSAnWycgJiYgcm9vdFtyb290Lmxlbmd0aCAtIDFdID09PSAnXScgPyByb290LnNsaWNlKDEsIHJvb3QubGVuZ3RoIC0gMSkgOiByb290O1xuICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludChjbGVhblJvb3QsIDEwKTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWlzTmFOKGluZGV4KSAmJlxuICAgICAgICAgICAgcm9vdCAhPT0gY2xlYW5Sb290ICYmXG4gICAgICAgICAgICBTdHJpbmcoaW5kZXgpID09PSBjbGVhblJvb3QgJiZcbiAgICAgICAgICAgIGluZGV4ID49IDAgJiZcbiAgICAgICAgICAgIChvcHRpb25zLnBhcnNlQXJyYXlzICYmIGluZGV4IDw9IG9wdGlvbnMuYXJyYXlMaW1pdClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBvYmogPSBbXTtcbiAgICAgICAgICAgIG9ialtpbmRleF0gPSBwYXJzZU9iamVjdChjaGFpbiwgdmFsLCBvcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9ialtjbGVhblJvb3RdID0gcGFyc2VPYmplY3QoY2hhaW4sIHZhbCwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxudmFyIHBhcnNlS2V5cyA9IGZ1bmN0aW9uIHBhcnNlS2V5cyhnaXZlbktleSwgdmFsLCBvcHRpb25zKSB7XG4gICAgaWYgKCFnaXZlbktleSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVHJhbnNmb3JtIGRvdCBub3RhdGlvbiB0byBicmFja2V0IG5vdGF0aW9uXG4gICAgdmFyIGtleSA9IG9wdGlvbnMuYWxsb3dEb3RzID8gZ2l2ZW5LZXkucmVwbGFjZSgvXFwuKFteXFwuXFxbXSspL2csICdbJDFdJykgOiBnaXZlbktleTtcblxuICAgIC8vIFRoZSByZWdleCBjaHVua3NcblxuICAgIHZhciBwYXJlbnQgPSAvXihbXlxcW1xcXV0qKS87XG4gICAgdmFyIGNoaWxkID0gLyhcXFtbXlxcW1xcXV0qXFxdKS9nO1xuXG4gICAgLy8gR2V0IHRoZSBwYXJlbnRcblxuICAgIHZhciBzZWdtZW50ID0gcGFyZW50LmV4ZWMoa2V5KTtcblxuICAgIC8vIFN0YXNoIHRoZSBwYXJlbnQgaWYgaXQgZXhpc3RzXG5cbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGlmIChzZWdtZW50WzFdKSB7XG4gICAgICAgIC8vIElmIHdlIGFyZW4ndCB1c2luZyBwbGFpbiBvYmplY3RzLCBvcHRpb25hbGx5IHByZWZpeCBrZXlzXG4gICAgICAgIC8vIHRoYXQgd291bGQgb3ZlcndyaXRlIG9iamVjdCBwcm90b3R5cGUgcHJvcGVydGllc1xuICAgICAgICBpZiAoIW9wdGlvbnMucGxhaW5PYmplY3RzICYmIGhhcy5jYWxsKE9iamVjdC5wcm90b3R5cGUsIHNlZ21lbnRbMV0pKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuYWxsb3dQcm90b3R5cGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAga2V5cy5wdXNoKHNlZ21lbnRbMV0pO1xuICAgIH1cblxuICAgIC8vIExvb3AgdGhyb3VnaCBjaGlsZHJlbiBhcHBlbmRpbmcgdG8gdGhlIGFycmF5IHVudGlsIHdlIGhpdCBkZXB0aFxuXG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlICgoc2VnbWVudCA9IGNoaWxkLmV4ZWMoa2V5KSkgIT09IG51bGwgJiYgaSA8IG9wdGlvbnMuZGVwdGgpIHtcbiAgICAgICAgaSArPSAxO1xuICAgICAgICBpZiAoIW9wdGlvbnMucGxhaW5PYmplY3RzICYmIGhhcy5jYWxsKE9iamVjdC5wcm90b3R5cGUsIHNlZ21lbnRbMV0ucmVwbGFjZSgvXFxbfFxcXS9nLCAnJykpKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuYWxsb3dQcm90b3R5cGVzKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAga2V5cy5wdXNoKHNlZ21lbnRbMV0pO1xuICAgIH1cblxuICAgIC8vIElmIHRoZXJlJ3MgYSByZW1haW5kZXIsIGp1c3QgYWRkIHdoYXRldmVyIGlzIGxlZnRcblxuICAgIGlmIChzZWdtZW50KSB7XG4gICAgICAgIGtleXMucHVzaCgnWycgKyBrZXkuc2xpY2Uoc2VnbWVudC5pbmRleCkgKyAnXScpO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZU9iamVjdChrZXlzLCB2YWwsIG9wdGlvbnMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyLCBvcHRzKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBvcHRzIHx8IHt9O1xuXG4gICAgaWYgKG9wdGlvbnMuZGVjb2RlciAhPT0gbnVsbCAmJiBvcHRpb25zLmRlY29kZXIgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy5kZWNvZGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0RlY29kZXIgaGFzIHRvIGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5kZWxpbWl0ZXIgPSB0eXBlb2Ygb3B0aW9ucy5kZWxpbWl0ZXIgPT09ICdzdHJpbmcnIHx8IHV0aWxzLmlzUmVnRXhwKG9wdGlvbnMuZGVsaW1pdGVyKSA/IG9wdGlvbnMuZGVsaW1pdGVyIDogZGVmYXVsdHMuZGVsaW1pdGVyO1xuICAgIG9wdGlvbnMuZGVwdGggPSB0eXBlb2Ygb3B0aW9ucy5kZXB0aCA9PT0gJ251bWJlcicgPyBvcHRpb25zLmRlcHRoIDogZGVmYXVsdHMuZGVwdGg7XG4gICAgb3B0aW9ucy5hcnJheUxpbWl0ID0gdHlwZW9mIG9wdGlvbnMuYXJyYXlMaW1pdCA9PT0gJ251bWJlcicgPyBvcHRpb25zLmFycmF5TGltaXQgOiBkZWZhdWx0cy5hcnJheUxpbWl0O1xuICAgIG9wdGlvbnMucGFyc2VBcnJheXMgPSBvcHRpb25zLnBhcnNlQXJyYXlzICE9PSBmYWxzZTtcbiAgICBvcHRpb25zLmRlY29kZXIgPSB0eXBlb2Ygb3B0aW9ucy5kZWNvZGVyID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5kZWNvZGVyIDogZGVmYXVsdHMuZGVjb2RlcjtcbiAgICBvcHRpb25zLmFsbG93RG90cyA9IHR5cGVvZiBvcHRpb25zLmFsbG93RG90cyA9PT0gJ2Jvb2xlYW4nID8gb3B0aW9ucy5hbGxvd0RvdHMgOiBkZWZhdWx0cy5hbGxvd0RvdHM7XG4gICAgb3B0aW9ucy5wbGFpbk9iamVjdHMgPSB0eXBlb2Ygb3B0aW9ucy5wbGFpbk9iamVjdHMgPT09ICdib29sZWFuJyA/IG9wdGlvbnMucGxhaW5PYmplY3RzIDogZGVmYXVsdHMucGxhaW5PYmplY3RzO1xuICAgIG9wdGlvbnMuYWxsb3dQcm90b3R5cGVzID0gdHlwZW9mIG9wdGlvbnMuYWxsb3dQcm90b3R5cGVzID09PSAnYm9vbGVhbicgPyBvcHRpb25zLmFsbG93UHJvdG90eXBlcyA6IGRlZmF1bHRzLmFsbG93UHJvdG90eXBlcztcbiAgICBvcHRpb25zLnBhcmFtZXRlckxpbWl0ID0gdHlwZW9mIG9wdGlvbnMucGFyYW1ldGVyTGltaXQgPT09ICdudW1iZXInID8gb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdCA6IGRlZmF1bHRzLnBhcmFtZXRlckxpbWl0O1xuICAgIG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nID0gdHlwZW9mIG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nID09PSAnYm9vbGVhbicgPyBvcHRpb25zLnN0cmljdE51bGxIYW5kbGluZyA6IGRlZmF1bHRzLnN0cmljdE51bGxIYW5kbGluZztcblxuICAgIGlmIChzdHIgPT09ICcnIHx8IHN0ciA9PT0gbnVsbCB8fCB0eXBlb2Ygc3RyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5wbGFpbk9iamVjdHMgPyBPYmplY3QuY3JlYXRlKG51bGwpIDoge307XG4gICAgfVxuXG4gICAgdmFyIHRlbXBPYmogPSB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyA/IHBhcnNlVmFsdWVzKHN0ciwgb3B0aW9ucykgOiBzdHI7XG4gICAgdmFyIG9iaiA9IG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuXG4gICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBrZXlzIGFuZCBzZXR1cCB0aGUgbmV3IG9iamVjdFxuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh0ZW1wT2JqKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgIHZhciBuZXdPYmogPSBwYXJzZUtleXMoa2V5LCB0ZW1wT2JqW2tleV0sIG9wdGlvbnMpO1xuICAgICAgICBvYmogPSB1dGlscy5tZXJnZShvYmosIG5ld09iaiwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHV0aWxzLmNvbXBhY3Qob2JqKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG5cbnZhciBhcnJheVByZWZpeEdlbmVyYXRvcnMgPSB7XG4gICAgYnJhY2tldHM6IGZ1bmN0aW9uIGJyYWNrZXRzKHByZWZpeCkge1xuICAgICAgICByZXR1cm4gcHJlZml4ICsgJ1tdJztcbiAgICB9LFxuICAgIGluZGljZXM6IGZ1bmN0aW9uIGluZGljZXMocHJlZml4LCBrZXkpIHtcbiAgICAgICAgcmV0dXJuIHByZWZpeCArICdbJyArIGtleSArICddJztcbiAgICB9LFxuICAgIHJlcGVhdDogZnVuY3Rpb24gcmVwZWF0KHByZWZpeCkge1xuICAgICAgICByZXR1cm4gcHJlZml4O1xuICAgIH1cbn07XG5cbnZhciB0b0lTTyA9IERhdGUucHJvdG90eXBlLnRvSVNPU3RyaW5nO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgZGVsaW1pdGVyOiAnJicsXG4gICAgZW5jb2RlOiB0cnVlLFxuICAgIGVuY29kZXI6IHV0aWxzLmVuY29kZSxcbiAgICBzZXJpYWxpemVEYXRlOiBmdW5jdGlvbiBzZXJpYWxpemVEYXRlKGRhdGUpIHtcbiAgICAgICAgcmV0dXJuIHRvSVNPLmNhbGwoZGF0ZSk7XG4gICAgfSxcbiAgICBza2lwTnVsbHM6IGZhbHNlLFxuICAgIHN0cmljdE51bGxIYW5kbGluZzogZmFsc2Vcbn07XG5cbnZhciBzdHJpbmdpZnkgPSBmdW5jdGlvbiBzdHJpbmdpZnkob2JqZWN0LCBwcmVmaXgsIGdlbmVyYXRlQXJyYXlQcmVmaXgsIHN0cmljdE51bGxIYW5kbGluZywgc2tpcE51bGxzLCBlbmNvZGVyLCBmaWx0ZXIsIHNvcnQsIGFsbG93RG90cywgc2VyaWFsaXplRGF0ZSwgZm9ybWF0dGVyKSB7XG4gICAgdmFyIG9iaiA9IG9iamVjdDtcbiAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmogPSBmaWx0ZXIocHJlZml4LCBvYmopO1xuICAgIH0gZWxzZSBpZiAob2JqIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICBvYmogPSBzZXJpYWxpemVEYXRlKG9iaik7XG4gICAgfSBlbHNlIGlmIChvYmogPT09IG51bGwpIHtcbiAgICAgICAgaWYgKHN0cmljdE51bGxIYW5kbGluZykge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZXIgPyBlbmNvZGVyKHByZWZpeCkgOiBwcmVmaXg7XG4gICAgICAgIH1cblxuICAgICAgICBvYmogPSAnJztcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIG9iaiA9PT0gJ251bWJlcicgfHwgdHlwZW9mIG9iaiA9PT0gJ2Jvb2xlYW4nIHx8IHV0aWxzLmlzQnVmZmVyKG9iaikpIHtcbiAgICAgICAgaWYgKGVuY29kZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBbZm9ybWF0dGVyKGVuY29kZXIocHJlZml4KSkgKyAnPScgKyBmb3JtYXR0ZXIoZW5jb2RlcihvYmopKV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtmb3JtYXR0ZXIocHJlZml4KSArICc9JyArIGZvcm1hdHRlcihTdHJpbmcob2JqKSldO1xuICAgIH1cblxuICAgIHZhciB2YWx1ZXMgPSBbXTtcblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH1cblxuICAgIHZhciBvYmpLZXlzO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGZpbHRlcikpIHtcbiAgICAgICAgb2JqS2V5cyA9IGZpbHRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgICAgIG9iaktleXMgPSBzb3J0ID8ga2V5cy5zb3J0KHNvcnQpIDoga2V5cztcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iaktleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IG9iaktleXNbaV07XG5cbiAgICAgICAgaWYgKHNraXBOdWxscyAmJiBvYmpba2V5XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgICAgICB2YWx1ZXMgPSB2YWx1ZXMuY29uY2F0KHN0cmluZ2lmeShcbiAgICAgICAgICAgICAgICBvYmpba2V5XSxcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUFycmF5UHJlZml4KHByZWZpeCwga2V5KSxcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUFycmF5UHJlZml4LFxuICAgICAgICAgICAgICAgIHN0cmljdE51bGxIYW5kbGluZyxcbiAgICAgICAgICAgICAgICBza2lwTnVsbHMsXG4gICAgICAgICAgICAgICAgZW5jb2RlcixcbiAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgc29ydCxcbiAgICAgICAgICAgICAgICBhbGxvd0RvdHMsXG4gICAgICAgICAgICAgICAgc2VyaWFsaXplRGF0ZSxcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZXJcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWVzID0gdmFsdWVzLmNvbmNhdChzdHJpbmdpZnkoXG4gICAgICAgICAgICAgICAgb2JqW2tleV0sXG4gICAgICAgICAgICAgICAgcHJlZml4ICsgKGFsbG93RG90cyA/ICcuJyArIGtleSA6ICdbJyArIGtleSArICddJyksXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVBcnJheVByZWZpeCxcbiAgICAgICAgICAgICAgICBzdHJpY3ROdWxsSGFuZGxpbmcsXG4gICAgICAgICAgICAgICAgc2tpcE51bGxzLFxuICAgICAgICAgICAgICAgIGVuY29kZXIsXG4gICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgIHNvcnQsXG4gICAgICAgICAgICAgICAgYWxsb3dEb3RzLFxuICAgICAgICAgICAgICAgIHNlcmlhbGl6ZURhdGUsXG4gICAgICAgICAgICAgICAgZm9ybWF0dGVyXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QsIG9wdHMpIHtcbiAgICB2YXIgb2JqID0gb2JqZWN0O1xuICAgIHZhciBvcHRpb25zID0gb3B0cyB8fCB7fTtcbiAgICB2YXIgZGVsaW1pdGVyID0gdHlwZW9mIG9wdGlvbnMuZGVsaW1pdGVyID09PSAndW5kZWZpbmVkJyA/IGRlZmF1bHRzLmRlbGltaXRlciA6IG9wdGlvbnMuZGVsaW1pdGVyO1xuICAgIHZhciBzdHJpY3ROdWxsSGFuZGxpbmcgPSB0eXBlb2Ygb3B0aW9ucy5zdHJpY3ROdWxsSGFuZGxpbmcgPT09ICdib29sZWFuJyA/IG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nIDogZGVmYXVsdHMuc3RyaWN0TnVsbEhhbmRsaW5nO1xuICAgIHZhciBza2lwTnVsbHMgPSB0eXBlb2Ygb3B0aW9ucy5za2lwTnVsbHMgPT09ICdib29sZWFuJyA/IG9wdGlvbnMuc2tpcE51bGxzIDogZGVmYXVsdHMuc2tpcE51bGxzO1xuICAgIHZhciBlbmNvZGUgPSB0eXBlb2Ygb3B0aW9ucy5lbmNvZGUgPT09ICdib29sZWFuJyA/IG9wdGlvbnMuZW5jb2RlIDogZGVmYXVsdHMuZW5jb2RlO1xuICAgIHZhciBlbmNvZGVyID0gZW5jb2RlID8gKHR5cGVvZiBvcHRpb25zLmVuY29kZXIgPT09ICdmdW5jdGlvbicgPyBvcHRpb25zLmVuY29kZXIgOiBkZWZhdWx0cy5lbmNvZGVyKSA6IG51bGw7XG4gICAgdmFyIHNvcnQgPSB0eXBlb2Ygb3B0aW9ucy5zb3J0ID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5zb3J0IDogbnVsbDtcbiAgICB2YXIgYWxsb3dEb3RzID0gdHlwZW9mIG9wdGlvbnMuYWxsb3dEb3RzID09PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogb3B0aW9ucy5hbGxvd0RvdHM7XG4gICAgdmFyIHNlcmlhbGl6ZURhdGUgPSB0eXBlb2Ygb3B0aW9ucy5zZXJpYWxpemVEYXRlID09PSAnZnVuY3Rpb24nID8gb3B0aW9ucy5zZXJpYWxpemVEYXRlIDogZGVmYXVsdHMuc2VyaWFsaXplRGF0ZTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuZm9ybWF0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBvcHRpb25zLmZvcm1hdCA9IGZvcm1hdHMuZGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZm9ybWF0cy5mb3JtYXR0ZXJzLCBvcHRpb25zLmZvcm1hdCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBmb3JtYXQgb3B0aW9uIHByb3ZpZGVkLicpO1xuICAgIH1cbiAgICB2YXIgZm9ybWF0dGVyID0gZm9ybWF0cy5mb3JtYXR0ZXJzW29wdGlvbnMuZm9ybWF0XTtcbiAgICB2YXIgb2JqS2V5cztcbiAgICB2YXIgZmlsdGVyO1xuXG4gICAgaWYgKG9wdGlvbnMuZW5jb2RlciAhPT0gbnVsbCAmJiBvcHRpb25zLmVuY29kZXIgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0aW9ucy5lbmNvZGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0VuY29kZXIgaGFzIHRvIGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLmZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgb2JqID0gZmlsdGVyKCcnLCBvYmopO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmZpbHRlcikpIHtcbiAgICAgICAgZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIG9iaktleXMgPSBmaWx0ZXI7XG4gICAgfVxuXG4gICAgdmFyIGtleXMgPSBbXTtcblxuICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIHZhciBhcnJheUZvcm1hdDtcbiAgICBpZiAob3B0aW9ucy5hcnJheUZvcm1hdCBpbiBhcnJheVByZWZpeEdlbmVyYXRvcnMpIHtcbiAgICAgICAgYXJyYXlGb3JtYXQgPSBvcHRpb25zLmFycmF5Rm9ybWF0O1xuICAgIH0gZWxzZSBpZiAoJ2luZGljZXMnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgYXJyYXlGb3JtYXQgPSBvcHRpb25zLmluZGljZXMgPyAnaW5kaWNlcycgOiAncmVwZWF0JztcbiAgICB9IGVsc2Uge1xuICAgICAgICBhcnJheUZvcm1hdCA9ICdpbmRpY2VzJztcbiAgICB9XG5cbiAgICB2YXIgZ2VuZXJhdGVBcnJheVByZWZpeCA9IGFycmF5UHJlZml4R2VuZXJhdG9yc1thcnJheUZvcm1hdF07XG5cbiAgICBpZiAoIW9iaktleXMpIHtcbiAgICAgICAgb2JqS2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgICAgb2JqS2V5cy5zb3J0KHNvcnQpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqS2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIga2V5ID0gb2JqS2V5c1tpXTtcblxuICAgICAgICBpZiAoc2tpcE51bGxzICYmIG9ialtrZXldID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGtleXMgPSBrZXlzLmNvbmNhdChzdHJpbmdpZnkoXG4gICAgICAgICAgICBvYmpba2V5XSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIGdlbmVyYXRlQXJyYXlQcmVmaXgsXG4gICAgICAgICAgICBzdHJpY3ROdWxsSGFuZGxpbmcsXG4gICAgICAgICAgICBza2lwTnVsbHMsXG4gICAgICAgICAgICBlbmNvZGVyLFxuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc29ydCxcbiAgICAgICAgICAgIGFsbG93RG90cyxcbiAgICAgICAgICAgIHNlcmlhbGl6ZURhdGUsXG4gICAgICAgICAgICBmb3JtYXR0ZXJcbiAgICAgICAgKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleXMuam9pbihkZWxpbWl0ZXIpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbnZhciBoZXhUYWJsZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFycmF5ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7ICsraSkge1xuICAgICAgICBhcnJheS5wdXNoKCclJyArICgoaSA8IDE2ID8gJzAnIDogJycpICsgaS50b1N0cmluZygxNikpLnRvVXBwZXJDYXNlKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBhcnJheTtcbn0oKSk7XG5cbmV4cG9ydHMuYXJyYXlUb09iamVjdCA9IGZ1bmN0aW9uIChzb3VyY2UsIG9wdGlvbnMpIHtcbiAgICB2YXIgb2JqID0gb3B0aW9ucyAmJiBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZVtpXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9ialtpXSA9IHNvdXJjZVtpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG59O1xuXG5leHBvcnRzLm1lcmdlID0gZnVuY3Rpb24gKHRhcmdldCwgc291cmNlLCBvcHRpb25zKSB7XG4gICAgaWYgKCFzb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGFyZ2V0KSkge1xuICAgICAgICAgICAgdGFyZ2V0LnB1c2goc291cmNlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGFyZ2V0W3NvdXJjZV0gPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFt0YXJnZXQsIHNvdXJjZV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gW3RhcmdldF0uY29uY2F0KHNvdXJjZSk7XG4gICAgfVxuXG4gICAgdmFyIG1lcmdlVGFyZ2V0ID0gdGFyZ2V0O1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRhcmdldCkgJiYgIUFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgICAgICBtZXJnZVRhcmdldCA9IGV4cG9ydHMuYXJyYXlUb09iamVjdCh0YXJnZXQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHRhcmdldCkgJiYgQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgICAgIHNvdXJjZS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtLCBpKSB7XG4gICAgICAgICAgICBpZiAoaGFzLmNhbGwodGFyZ2V0LCBpKSkge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRbaV0gJiYgdHlwZW9mIHRhcmdldFtpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W2ldID0gZXhwb3J0cy5tZXJnZSh0YXJnZXRbaV0sIGl0ZW0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2ldID0gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHNvdXJjZSkucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGtleSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2Vba2V5XTtcblxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGFjYywga2V5KSkge1xuICAgICAgICAgICAgYWNjW2tleV0gPSBleHBvcnRzLm1lcmdlKGFjY1trZXldLCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY2Nba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgbWVyZ2VUYXJnZXQpO1xufTtcblxuZXhwb3J0cy5kZWNvZGUgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIucmVwbGFjZSgvXFwrL2csICcgJykpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG59O1xuXG5leHBvcnRzLmVuY29kZSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAvLyBUaGlzIGNvZGUgd2FzIG9yaWdpbmFsbHkgd3JpdHRlbiBieSBCcmlhbiBXaGl0ZSAobXNjZGV4KSBmb3IgdGhlIGlvLmpzIGNvcmUgcXVlcnlzdHJpbmcgbGlicmFyeS5cbiAgICAvLyBJdCBoYXMgYmVlbiBhZGFwdGVkIGhlcmUgZm9yIHN0cmljdGVyIGFkaGVyZW5jZSB0byBSRkMgMzk4NlxuICAgIGlmIChzdHIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuXG4gICAgdmFyIHN0cmluZyA9IHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnID8gc3RyIDogU3RyaW5nKHN0cik7XG5cbiAgICB2YXIgb3V0ID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGMgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcblxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBjID09PSAweDJEIHx8IC8vIC1cbiAgICAgICAgICAgIGMgPT09IDB4MkUgfHwgLy8gLlxuICAgICAgICAgICAgYyA9PT0gMHg1RiB8fCAvLyBfXG4gICAgICAgICAgICBjID09PSAweDdFIHx8IC8vIH5cbiAgICAgICAgICAgIChjID49IDB4MzAgJiYgYyA8PSAweDM5KSB8fCAvLyAwLTlcbiAgICAgICAgICAgIChjID49IDB4NDEgJiYgYyA8PSAweDVBKSB8fCAvLyBhLXpcbiAgICAgICAgICAgIChjID49IDB4NjEgJiYgYyA8PSAweDdBKSAvLyBBLVpcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBvdXQgKz0gc3RyaW5nLmNoYXJBdChpKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICAgICAgICBvdXQgPSBvdXQgKyBoZXhUYWJsZVtjXTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwMCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgKGhleFRhYmxlWzB4QzAgfCAoYyA+PiA2KV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYyA8IDB4RDgwMCB8fCBjID49IDB4RTAwMCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgKGhleFRhYmxlWzB4RTAgfCAoYyA+PiAxMildICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiA2KSAmIDB4M0YpXSArIGhleFRhYmxlWzB4ODAgfCAoYyAmIDB4M0YpXSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgYyA9IDB4MTAwMDAgKyAoKChjICYgMHgzRkYpIDw8IDEwKSB8IChzdHJpbmcuY2hhckNvZGVBdChpKSAmIDB4M0ZGKSk7XG4gICAgICAgIG91dCArPSBoZXhUYWJsZVsweEYwIHwgKGMgPj4gMTgpXSArIGhleFRhYmxlWzB4ODAgfCAoKGMgPj4gMTIpICYgMHgzRildICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiA2KSAmIDB4M0YpXSArIGhleFRhYmxlWzB4ODAgfCAoYyAmIDB4M0YpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuZXhwb3J0cy5jb21wYWN0ID0gZnVuY3Rpb24gKG9iaiwgcmVmZXJlbmNlcykge1xuICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cbiAgICB2YXIgcmVmcyA9IHJlZmVyZW5jZXMgfHwgW107XG4gICAgdmFyIGxvb2t1cCA9IHJlZnMuaW5kZXhPZihvYmopO1xuICAgIGlmIChsb29rdXAgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiByZWZzW2xvb2t1cF07XG4gICAgfVxuXG4gICAgcmVmcy5wdXNoKG9iaik7XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgIHZhciBjb21wYWN0ZWQgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iai5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKG9ialtpXSAmJiB0eXBlb2Ygb2JqW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGNvbXBhY3RlZC5wdXNoKGV4cG9ydHMuY29tcGFjdChvYmpbaV0sIHJlZnMpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIG9ialtpXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb21wYWN0ZWQucHVzaChvYmpbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbXBhY3RlZDtcbiAgICB9XG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgb2JqW2tleV0gPSBleHBvcnRzLmNvbXBhY3Qob2JqW2tleV0sIHJlZnMpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbmV4cG9ydHMuaXNSZWdFeHAgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBSZWdFeHBdJztcbn07XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgaWYgKG9iaiA9PT0gbnVsbCB8fCB0eXBlb2Ygb2JqID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuICEhKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyKG9iaikpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH0gOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG52YXIgcXMgPSByZXF1aXJlKCdxcycpO1xuXG52YXIgdXJsUmVnZXggPSAvXig/OihbXjovPyNdKyk6KD89XFwvXFwvKSk/KD86XFwvXFwvKD86KC4qPylAKT8oW14vPyNdKik/KT8oW14/I10qKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8vO1xuXG52YXIgcGFyc2VVcmwgPSBmdW5jdGlvbiBwYXJzZVVybCh1cmwsIHBhcnNlUXVlcnkpIHtcbiAgdmFyIG1hdGNoID0gdXJsUmVnZXguZXhlYyh1cmwpO1xuICByZXR1cm4gbWF0Y2ggJiYge1xuICAgIHByb3RvY29sOiBtYXRjaFsxXSB8fCAnJyxcbiAgICBhdXRoOiBtYXRjaFsyXSB8fCAnJyxcbiAgICBob3N0OiBtYXRjaFszXSB8fCAnJyxcbiAgICBwYXRobmFtZTogbWF0Y2hbNF0gfHwgJycsXG4gICAgcXVlcnk6IHBhcnNlUXVlcnkgPT09IHRydWUgPyBxcy5wYXJzZShtYXRjaFs1XSkgOiBtYXRjaFs1XSxcbiAgICBoYXNoOiBkZWNvZGVVUklDb21wb25lbnQobWF0Y2hbNl0gfHwgJycpXG4gIH07XG59O1xuXG52YXIgdXJsID0ge1xuICBwYXJzZTogcGFyc2VVcmwsXG4gIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zLnByb3RvY29sID0gb3B0aW9ucy5wcm90b2NvbCB8fCAnaHR0cCc7XG4gICAgb3B0aW9ucy5ob3N0ID0gb3B0aW9ucy5ob3N0IHx8ICdsb2NhbGhvc3QnO1xuICAgIHJldHVybiBvcHRpb25zLnByb3RvY29sICsgJzovLycgKyBvcHRpb25zLmhvc3QgKyB1cmwuY3JlYXRlUGF0aChvcHRpb25zLnBhdGhuYW1lLCBvcHRpb25zLnF1ZXJ5LCBvcHRpb25zLmhhc2gpO1xuICB9LFxuICBjcmVhdGVQYXRoOiBmdW5jdGlvbiBjcmVhdGVQYXRoKHBhdGhuYW1lLCBxdWVyeSwgaGFzaCkge1xuICAgIGlmICgodHlwZW9mIHBhdGhuYW1lID09PSAndW5kZWZpbmVkJyA/ICd1bmRlZmluZWQnIDogX3R5cGVvZihwYXRobmFtZSkpID09PSAnb2JqZWN0JyAmJiBwYXRobmFtZSAhPT0gbnVsbCkge1xuICAgICAgcXVlcnkgPSBwYXRobmFtZS5xdWVyeTtcbiAgICAgIGhhc2ggPSBwYXRobmFtZS5oYXNoO1xuICAgICAgcGF0aG5hbWUgPSBwYXRobmFtZS5wYXRobmFtZTtcbiAgICB9XG4gICAgcGF0aG5hbWUgPSBwYXRobmFtZSB8fCAnLyc7XG4gICAgcGF0aG5hbWUgPSBwYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJyA/IHBhdGhuYW1lIDogJy8nICsgcGF0aG5hbWU7XG4gICAgcXVlcnkgPSBxdWVyeSA/IHR5cGVvZiBxdWVyeSA9PT0gJ3N0cmluZycgPyBxdWVyeSA6ICc/JyArIHFzLnN0cmluZ2lmeShxdWVyeSkgOiAnJztcbiAgICBoYXNoID0gaGFzaCA/ICcjJyArIGVuY29kZVVSSUNvbXBvbmVudChoYXNoKSA6ICcnO1xuICAgIHJldHVybiBwYXRobmFtZSArIHF1ZXJ5ICsgaGFzaDtcbiAgfSxcbiAgcXM6IHFzXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVybDsiXX0=
