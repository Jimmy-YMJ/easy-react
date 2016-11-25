const express = require('express');
const reactApp = require('./build/app');

const app = express();

app.use(express.static('build'));

app.get('/', function (req, res) {
  var page = reactApp.getView(req.path, true);
  res.send(getPage(page));
});

app.get('/users/:userId', function (req, res) {
  var page = reactApp.getView(req.path, true);
  res.send(page);
});

app.listen(5000, function () {
  console.log('Example app listening on port 5000!');
});

function getPage(page) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        <div id="root">${page}</div>
        <script src="/client.js"></script>
      </body>
    </html>
    `
}