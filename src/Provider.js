const EasyReact = require('./lib/EasyReact');
const React = require('react');
const Link = require('./lib/Link');

const Provider = React.createClass({
  getChildContext() {
    let app = this.props.app;
    return {
      update: app.update.bind(app),
      to: app.to.bind(app),
      Link: Link(app)
    };
  },
  render: function(){
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
