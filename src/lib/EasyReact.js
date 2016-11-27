const ReactDOMServer = require('react-dom/server');
const ReactDOM = require('react-dom');
const Router = require('mini-routerjs');
const JSONStore = require('jsonstore-js');
const History = require('./History');

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

  if(this.isBrowserContext){
    this.history = new History({
      onHistoryChange: this._onHistoryChange.bind(this),
      historyType: options.historyType
    });
    this.viewContainer = window.document.querySelector(options.viewContainer);
  }
}

EasyReact.prototype = {
  _mountView: function (view) {
    ReactDOM.render(view, this.viewContainer);
  },
  _onHistoryChange: function (path) {
    this.router.match(path);
    this._mountView(this.getView(path));
  },
  createRoute: function (route, callback) {
    this.router.create(route, function (request) {
      this.view = callback(request, this.store.get());
      if(this.reInitStore){
        this.store.reInit();
      }
    }.bind(this));
  },
  createMismatch: function (callback) {
    this.router.createMismatch(function () {
      this.view = callback(this.store.get()) || null;
    }.bind(this));
  },
  getView: function (path, stringify, staticMarkup) {
    this.router.match(path);
    return stringify === true ? (staticMarkup === true ? ReactDOMServer.renderToStaticMarkup(this.view) : ReactDOMServer.renderToString(this.view)) : this.view;
  },
  updateStore: function (name, action, a, b, c, d, e, f) {
    return this.store.do(name, action, a, b, c, d, e, f);
  },
  to: function (url, action, a, b, c, d, e, f) {
    let result = {};
    if(typeof action === 'function'){
      result = this.store.do(action, a, b, c, d, e, f);
    }
    this.history.updateUrl(url);
    return result;
  },
  update: function (name, action, a, b, c, d, e, f) {
    let result = {};
    if(typeof name === 'function' || typeof action === 'function'){
      result = this.store.do(name, action, a, b, c, d, e, f);
    }
    let view = this.getView(this.history.getCurrentUrl(true));
    this._mountView(view);
    return result;
  },
  get: function(path, copy){
    return this.store.get(path, copy);
  }
};

module.exports = EasyReact;
