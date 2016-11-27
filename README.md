# easy-react

The **easy-react** is a framework that solves the store and router problems of react app, it is composed of three independent libraries:
[mini-routerjs](https://github.com/Jimmy-YMJ/mini-routerjs) as router, [jsonstore-js](https://github.com/Jimmy-YMJ/jsonstore-js) as store and
[History](https://github.com/Jimmy-YMJ/easy-react/blob/master/src/lib/History.js) for browser history management.

It is also light weight, the minified [bundle]() is about 25k,

## Write your first isomorphic react application using **easy-react**
Now we are going to write an application displaying users information, it contains two pages: **user list page** and **user detail page**.
Here is a complete [example](), read the [instruction]() and run it;

Let's walk through the steps of creating [example]() react app:

### 1. Creating two react class `User` and `UserList` as pages. The following is a common example of an **easy react** react class:
```javascript
import React, { Component, PropTypes } from 'react';

class Example extends Component{
  _onClick(){
    var action = function(store, data){
      store.set('data', data);
    };
    this.context.update(action, this.props.data); // This operation will change the app store and update the current page.

    this.context.to('/'); // This operation will navigate route to '/'.
  }
  render(){
    var Link = this.context.Link;
    return (
      <p>
        <button onClick={this._onClick.bind(this)}>
          {this.props.data}
        </button>
        <Link href="/">Index page</Link>
      </p>
    );
  }
}

Example.propTypes = {
  data: PropTypes.string.isRequired
};

Example.contextTypes = {
  to: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired,
  Link: PropTypes.func.isRequired // It's a react component whose type is function.
};

export default Example;
```
The special things of this `Example` are the contexts it uses: `to`, `update` and `Link`. These contexts are provided by `Provider`(It will be introduced later) of **easy-react**.
About the react context, please see [Context](https://facebook.github.io/react/docs/context.html) or google it if the link is invalid.

Use `update` if you want to update the store and then update the page, about the params please see [do](https://github.com/Jimmy-YMJ/jsonstore-js/blob/master/docs/DO.md).
Use `to` if you want the app navigate to another page.
Use `Link` if you want the app navigate to another page when the **a** tag is clicked.

### 2. Mapping route `/` to `UserList` and `/users/:userId` to 'UserList'. The following is a common example of **easy react** router registration:
```javascript
import React from 'react';
import EasyReact from 'easy-react';
import Provider from 'easy-react/Provider';

const app = new EasyReact({
  store: yourStore,
  viewContainer: '#root'
});

app.createRoute('/foo/:bar', function (request, state) {
  return (
    <Provider app={app}>
      <Example data={state}/>
    </Provider>
  );
});
```
As the example shows, we instantiated an app first and then register a route with the path `/foo/:bar`, the route callback returns a react component which will be used as view.

The `Provider` component provides `to`, `update` and `Link` contexts to it's children, it requires an instance of `EasyReact` as its app property.

The router callback will be passed two parameters: `request` and `state`. The `state` is a copy of current store and the `request` is an object parsed by [simple-url](https://github.com/Jimmy-YMJ/simple-url).


### 3. Do some further processing to make the app work.
App created by **easy-react** is **url drived**.

At server side, we use `app.getView(url, true)` to get rendered markup as []() does.
Before rendering the view, we perhaps need to update the store using data that comes from database or other server. To do this, use the `app.updateStore(action, data)` method.

In browser context, there are tree different ways to drive the app: `app.to(url)`, `app.update([action][,data])` and `Link`.
The `to(url)` method navigate the app to display a page routed by url parameter.
The `update([action][,data])` method will do an action to update the store(if it's provided) and then get the `window.location.href` to update the current page.
The `Link` component will navigate the app to display a page routed by its href property.
Also, the app will listen the history change and use `to` to drive itself. So, to make the app work in browser we need do a `update()` when the bundled script is loaded as []() does.

That all, a basic application is completed.

## Constructor and methods

### EasyReact(options)

| **Option** | **Description** | **type** | **default** |
| --- | --- | --- | --- |
| store | The initial store used by app which will be hold by []() | Any safe type | `{}` |
| strict | Whether using strict mode to match the path, see []() |`Boolean` | `false` |
| historyType | The browser history type to use, `'h5'` or `'hash'` | `String` | It will be detected by [History]() automatically and `'h5'` is preferred. |
| viewContainer | The selector of dom element to hold the react root component, the app will use `window.document.querySelector` to get that element. | `String`| `Undefined` |

### EasyReact.createRoute(route, callback)

| **Params** | **Description** | **type** | **default** |
| --- | --- | --- | --- |
| route | The route pattern to use to register the callback, see [simple-url](https://github.com/Jimmy-YMJ/mini-routerjs#routercreateroute-callback-strict) | `String` | `undefined` |
| callback | This callback is expected to return a react component. | `Function` | `undefined` |


### EasyReact.createMismatch(callback)

| **Params** | **Description** | **type** | **default** |
| --- | --- | --- | --- |
| callback | When a route mismatch happens, this callback will be used to return a react component. | `Function` | `undefined` |


### EasyReact.getView(path, stringify, staticMarkup)

| **Params** | **Description** | **type** | **default** |
| --- | --- | --- | --- |
| path | The url or path used to match a router. | `String` | `undefined` |
| stringify | Whether render the matched react component to string, [ReactDOMServer.renderToString](https://facebook.github.io/react/docs/react-dom-server.html#rendertostring) will be used if it's `true`. | `Boolean` | `false` |
| staticMarkup | Whether render the matched react component to static markup, [ReactDOMServer.renderToStaticMarkup](https://facebook.github.io/react/docs/react-dom-server.html#rendertostaticmarkup) will be used if both **stringify** and **staticMarkup** are `true`. | `Boolean` | `false` |


### EasyReact.updateStore(name, action, a, b, c, d, e, f)
This method is used to update the app's store, its usage is equal to [jsonsotre-js.do](https://github.com/Jimmy-YMJ/jsonstore-js/blob/master/docs/DO.md).


### EasyReact.to(url, action, a, b, c, d, e, f)
This method is used to navigate the app to a page whose url matches the **url** parameter.
If parameters following the url is provided, the app's store will be updated first.
The usage of action is equal to [jsonsotre-js.do](https://github.com/Jimmy-YMJ/jsonstore-js/blob/master/docs/DO.md).

### EasyReact.update(name, action, a, b, c, d, e, f)
This method is used to update the current page whose url matches the `window.location.href`.
If parameter **action** is provided, the app's store will be updated first.
The usage of action is equal to [jsonsotre-js.do](https://github.com/Jimmy-YMJ/jsonstore-js/blob/master/docs/DO.md).

### EasyReact.get(path, copy)
This method is used to get some dada of the app's store, its usage is equal to [jsonstore-js.get](https://github.com/Jimmy-YMJ/jsonstore-js/blob/master/docs/GET.md).

## License
MIT
