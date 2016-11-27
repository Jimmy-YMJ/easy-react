import React, { Component, PropTypes } from 'react';
import saveAbstract from '../actions/saveAbstract';

class User extends Component{
  constructor(){
    super();
    this.state = {
      showEditor: false
    };
  }
  _onGoToIndex(){
    this.context.to('/');
  }
  _openEditor(){
    this.editor.value = this.props.user.abstract;
    this.setState({showEditor: true});
  }
  _closeEditor(){
    this.setState({showEditor: false});
  }
  _saveAbstract(){
    if(this.state.showEditor){
      this.context.update(saveAbstract, this.props.user.id, this.editor.value);
      this.setState({showEditor: false});
    }
  }
  render(){
    let user = this.props.user,
      editorStyle = this.state.showEditor ? {width: '500px', height: '150px'} : {display: 'none'};
    return (
      <div>
        <h1>{user.name}<button onClick={this._onGoToIndex.bind(this)}><strong>Go to index page.</strong></button></h1>
        <p>{user.abstract}<button onClick={this._openEditor.bind(this)}><strong>Edit abstract.</strong></button></p>
        <textarea ref={(textarea) => {this.editor = textarea}} style={editorStyle}/>
        <p>
          <button onClick={this._saveAbstract.bind(this)}><strong>Save abstract.</strong></button>
          <button onClick={this._closeEditor.bind(this)}><strong>Close editor.</strong></button>
        </p>
      </div>
    );
  }
}

User.propTypes = {
  user: PropTypes.object.isRequired
};

User.contextTypes = {
  to: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired
};

export default User;