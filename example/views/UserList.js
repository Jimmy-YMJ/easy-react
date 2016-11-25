import React, { Component, PropTypes } from 'react';

class UserList extends Component{
  render(){
    let Link = this.context.Link;
    return (
      <ul>
        {(() => {
          return this.props.users.map(function (user, index) {
            return (
              <li key={index}>
                <Link href={`/users/${user.id}`}>{user.name}</Link>
              </li>
            );
          });
        })()}
      </ul>
    );
  }
}

UserList.propTypes = {
  users: PropTypes.array.isRequired
};

UserList.contextTypes = {
  Link: PropTypes.func.isRequired
};

export default UserList;