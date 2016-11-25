const React = require('react');

module.exports = function (app) {
  return React.createClass({
    _onLinkClick: function(event){
      event.preventDefault();
      if(typeof this.props.onClick === 'function'){
        this.props.onClick(event);
      }
      app.to(event.target.href);
    },
    render: function(){
      return <a {...this.props} onClick={this._onLinkClick}>{this.props.children}</a>
    }
  });
};
