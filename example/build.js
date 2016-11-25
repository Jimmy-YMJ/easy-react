const fs = require("fs");
const browserify = require("browserify");

function bundle(entry, output, standalone) {
  const opts = {
    entries: entry
  };
  if(standalone && typeof standalone === 'string'){
    opts.standalone = standalone;
  }
  browserify(opts)
    .transform("babelify", {presets: ["es2015", "react"]})
    .bundle()
    .pipe(fs.createWriteStream(output));
}

bundle('./app/app.js', './build/app.js', 'easyReactApp');

bundle('./app/client.js', './build/client.js');