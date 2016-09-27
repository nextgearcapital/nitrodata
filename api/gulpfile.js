var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'); // jshint ignore:line


gulp.task('default', ['test', 'lint', 'develop']);

gulp.task('test', function () {
    return gulp.src('./test/*.js', {read: false})
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha({reporter: 'spec'}))
        .once('end', function () {
           process.exit();
        });
});

gulp.task('lint', function () {
  return gulp.src(['./*.js', './lib/*.js', './test/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('develop', function () {
  return nodemon({
    script: 'app.js',
    ext: 'js html swig',
    tasks: []
  });
});

gulp.task('debug', function () {
  return nodemon({
    script: 'app.js',
    ext: 'js',
    tasks: ['lint'],
    debugBrk: 5858,
    nolazy: true
  });
});

