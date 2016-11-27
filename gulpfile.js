"use strict";

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const UglifyJS = require('uglify-js');
const babel = require('gulp-babel');
const del = require('del');
const browserify = require('browserify');
const derequire = require('derequire');
const fs = require('fs');
const spawn = require('child_process').spawn;

function minify(src) {
  return UglifyJS.minify(src, {fromString: true}).code;
}

function bundleMin(file, standalone, outputFile, done) {
  let b = browserify({
    entries: file,
    standalone: standalone,
    debug: false,
    transform: ["browserify-shim"]
  });
  b.bundle(function (err, buf) {
    let code = derequire(buf.toString(), '_dereq_', 'require');
    fs.writeFileSync(outputFile, minify(code));
    done();
  });
}

function bundle(file, standalone, outputFile, done) {
  let b = browserify({
    entries: file,
    standalone: standalone,
    debug: true,
    transform: ["browserify-shim"]
  });
  b.bundle(function (err, buf) {
    let code = derequire(buf.toString(), '_dereq_', 'require');
    fs.writeFileSync(outputFile, code);
    done();
  });
}

gulp.task('clean', function () {
  return del('./build/**');
});

gulp.task('eslint', function () {
  return gulp.src('./src/**').pipe(eslint());
});

gulp.task('lib', ['clean', 'eslint'], function () {
  return gulp.src('./src/**')
    .pipe(babel())
    .pipe(gulp.dest('./build/modules'));
});

gulp.task('bundle', ['lib'], function (cb) {
  bundle('./build/modules/easy-react.js', 'easyReact', './build/easy-react.js', cb);
});

gulp.task('bundle-min', ['lib'], function (cb) {
  bundleMin('./build/modules/easy-react.js', 'easyReact', './build/easy-react.min.js', cb);
});

gulp.task('release', ['package-copy'], function () {
  var pkg = fs.readFileSync('./package/package.json').toString(),
    version = require('./package.json').version;
  fs.writeFileSync('./build/package/package.json', pkg.replace(/("version":\s*)(?:.*?),/, `$1"${version}",`));
});

gulp.task('package-copy', ['bundle', 'bundle-min'], function () {
  return gulp.src([
    './build/modules/**',
    '!./build/modules/easy-react.js',
    './README.md',
    './LICENSE'])
    .pipe(gulp.dest('./build/package'));
});


gulp.task('publish', function (cb) {
  const publish = spawn('npm', ['publish'], {cwd: './build/package', stdio: 'inherit'});
  publish.on('close', () => { cb(); });
  publish.on('error', (err) => { cb(err) });
});

gulp.task('default', ['bundle', 'bundle-min']);
