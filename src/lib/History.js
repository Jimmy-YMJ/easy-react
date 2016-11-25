const urlParser = require('simple-url');
const historyTypes = {
  'h5': 'h5',
  'hash': 'hash'
};

function History(options){
  this.historyType = historyTypes[options.historyType] || this._detectHistoryType();
  this.onHistoryChange = typeof options.onHistoryChange === 'function' ? options.onHistoryChange : function () {};
  this._init();
}

History.prototype = {
  updateUrl: function (url) {
    url = this._formatUrl(url, true);
    if(this.historyType === 'h5'){
      window.history.pushState({}, '', url);
      this.onHistoryChange(this._formatUrl(url, true));
    }else if(this.historyType === 'hash'){
      window.location.hash = url;
    }
  },
  getCurrentUrl: function (pathOnly) {
    return this._formatUrl(window.location.href, pathOnly);
  },
  _detectHistoryType: function () {
    return typeof window.history.pushState === 'function' ? 'h5' : 'hash';
  },
  _isHashUrl: function (hash) {
    return hash.charAt(0) === '/';
  },
  _formatUrl: function(url, pathOnly){
    let urlObj = urlParser.parse(url, false);
    if(this._isHashUrl(urlObj.hash)){
      urlObj = urlParser.parse(urlObj.hash, false);
    }
    return pathOnly === true ? urlParser.createPath(urlObj.pathname, urlObj.query, urlObj.hash) : urlParser.create(urlObj);
  },
  _init: function () {
    if(this.historyType === 'h5'){
      window.addEventListener("popstate", function () {
        this.onHistoryChange(this.getCurrentUrl(true))
      }.bind(this));
    }else if(this.historyType === 'hash'){
      let location = window.location;
      if(location.pathname.length > 1){
        window.location.href = `/#${location.pathname}${location.search}${location.hash}`;
        return void 0;
      }
      window.addEventListener("hashchange", function () {
        this.onHistoryChange(this.getCurrentUrl(true));
      }.bind(this));
    }
  }
};

module.exports = History;
