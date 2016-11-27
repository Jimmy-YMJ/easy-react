import React from 'react';
import EasyReact from 'easy-react';
import Provider from 'easy-react/Provider';
import initialStore from './initialStore';

import User from '../views/User';
import UserList from '../views/UserList';

const app = new EasyReact({
  store: initialStore,
  viewContainer: '#root'
});

app.createRoute('/', function (request, state) {
  const users = state.userList.map(id => state.userStore[id]);
  return (
    <Provider app={app}>
      <UserList users={users}/>
    </Provider>
  );
});

app.createRoute('/users/:userId', function(request, state){
  const user = state.userStore[request.params.userId];
  return (
    <Provider app={app}>
      <User user={user}/>
    </Provider>
  );
});

module.exports = app;
