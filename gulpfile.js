var gulp       = require('gulp'),
    livereload = require('gulp-livereload'),
    server     = require('./server.js');

// gulp.task('css', function(){
//   gulp.src('css/*.css').pipe(livereload());
// });
function notifyLiveReload(event) {
  var fileName = require('path').relative(__dirname, event.path);

  tinylr.changed({
    body: {
      files: [fileName]
    }
  });
}

gulp.task('watch', function(){
  gulp.watch('app/*.html', notifyLiveReload);
  gulp.watch('app/**/*.js', notifyLiveReload);
  gulp.watch('assets/css/*.css', notifyLiveReload);
});

var tinylr;
gulp.task('livereload', function() {
  tinylr = require('tiny-lr')();
    tinylr.listen(35729);
});

gulp.task('default', ['express', 'livereload', 'watch']);
