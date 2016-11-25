import React, { Component, PropTypes } from 'react';

class User extends Component{
  render(){
    let user = this.props.user;
    return (
      <div>
        <h1>{user.name}</h1>
        <p>{user.abstract}</p>
      </div>
    );
  }
}

User.propTypes = {
  user: PropTypes.object.isRequired
};

export default User;