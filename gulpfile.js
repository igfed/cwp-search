var gulp = require('gulp');
var sass = require('gulp-sass');

var paths = {
	sass: [
		'./scssNew/*.scss',
		'./scssNew/foundation/**/*.scss',
		'./serp-advisors/css/*.scss'
	],
	css: './css'
};

var sassOptions = {
	//outputStyle: 'compressed',
	precision: 5,
	errLogToConsole: true
};

gulp.task('sass', function () {
	gulp.src(paths.sass)
		.pipe(sass(sassOptions))
		.pipe(gulp.dest(paths.css));
});

gulp.task('watch', function() {
	gulp.watch(paths.sass, ['sass']);
});

gulp.task('default', ['sass', 'watch']);