var gulp = require('gulp'),
		sass = require('gulp-sass')(require('sass')),
		pug = require('gulp-pug'),
		browserSync = require('browser-sync'),
		cleancss = require('gulp-clean-css'),
		rename = require('gulp-rename'),
		del = require('del'),
		plumber = require('gulp-plumber'),
		stylelint = require('gulp-stylelint'),
		groupMedia = require('gulp-group-css-media-queries'),
		tabify = require('gulp-tabify'),
		sourcemaps = require('gulp-sourcemaps'),
		fileSize = require('gulp-size'),
		shell = require('gulp-shell'),
		ftp = require('vinyl-ftp'),
		autoprefixer = require('gulp-autoprefixer');

var dirs = {
	test: 'test/',
	docs: 'docs/',
	libs: 'test/libs/',
	ftp: ''
};

var path = {
	src: 'src/',
	build: 'dist/',
	test: {
		css: dirs.test + 'css/',
		sass: dirs.test + 'sass/',
		pug: dirs.test + 'pug/'
	}
};

var files = {
	styles: '**/*.{scss,css}',
	js: '**/*.js',
	pug: '**/*.pug',
	html: '**/*.html',
	all: '**/*'
};

path = Object.assign({
	watch: {
		styles: [
			dirs.libs + files.styles,
			path.src + files.styles,
			path.test.sass + files.styles,
		],
		pug: dirs.test + files.pug,
		html: dirs.test + files.html,
		docs: [
			dirs.docs + 'examples/' + files.html,
			dirs.docs + 'examples/**/*.hbs',
			dirs.docs + '*.md',
			path.test.css + 'test.css',
		],
	}
}, path);

var servConfig = {
		server: {
			baseDir: 'test'
		},
		notify: false,
		open: false
},
sizeConfig = {
	gzip: true,
	pretty: false,
	showFiles: true
},
ftpConfig = {
	host: '',
	user: '',
	password: '',
	parallel: 10
};

gulp.task('css-lint', function(){
	return gulp.src([
		path.src + files.styles,
		`!${path.src}tools/mixins/base/_mk-ar.scss`,
	])
		.pipe(stylelint({
			reporters:[
				{formatter: 'string', console: true}
			]
		}));
});

gulp.task('sass-test', shell.task(
	`node_modules/.bin/mocha ${path.test.sass}index.js`,
	{ignoreErrors: process.env.NODE_ENV !== 'production'}
));

gulp.task('style', gulp.series('css-lint', function(){
	return gulp.src(path.src + '*.scss')
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(sass({
			indentType: 'tab',
			includePaths: [
				'node_modules',
				path.src,
			],
			outputStyle: 'expanded',
			indentWidth: 1
		}))
		.pipe(groupMedia())
		.pipe(autoprefixer({
			cascade: false,
			flexbox: false
		}))
		.pipe(tabify(2, false))
		.pipe(gulp.dest(path.test.css))
		.pipe(cleancss({
			level: 2,
			compatibility: 'ie8'
		}))
		.pipe(rename(function(path) {
			if(path.basename === 'index') path.basename = 'mlut';
			path.basename += '.min';
		}))
		.pipe(fileSize(sizeConfig))
		.pipe(gulp.dest(path.build))
		.pipe(gulp.dest(dirs.docs + 'styleguide/kss-assets/'))
		.pipe(sourcemaps.write(''))
		.pipe(gulp.dest(path.test.css))
		.pipe(browserSync.stream());
}));

gulp.task('pug', function(){
	return gulp.src(path.test.pug + '*.pug', {allowEmpty: true})
		.pipe(plumber())
		.pipe(pug({'pretty': '\t'}))
		.pipe(gulp.dest(dirs.test));
});

gulp.task('server', function(){
	browserSync(servConfig);
});

gulp.task('html', function(){
	return gulp.src(dirs.test + files.html, {allowEmpty: true})
		.pipe(fileSize(sizeConfig))
		.pipe(browserSync.stream());
});

gulp.task('kss', shell.task([
	'node_modules/.bin/kss --config ' + dirs.docs + 'kss-config.json',
	'cp ' + path.test.css + 'test.css ' + dirs.docs + 'styleguide/kss-assets'
]));

gulp.task('default', gulp.parallel('server', 'kss', 'style', 'pug', function(){
	gulp.watch(path.watch.styles, gulp.series('kss', 'style'));
	gulp.watch(path.watch.pug, gulp.series('pug'));
	gulp.watch(path.watch.html, gulp.series('html'));
	gulp.watch(path.watch.docs, gulp.series('kss'));
}));

gulp.task('watch-test', gulp.parallel('sass-test', 'kss', function(){
	gulp.watch(path.watch.styles, gulp.series('kss', 'sass-test'));
}));

gulp.task('ftp', function(){
	var conn = ftp.create(ftpConfig);
	return gulp.src(dirs.test + files.all, {buffer: false})
		.pipe(conn.newer(dirs.ftp))
		.pipe(conn.dest(dirs.ftp));
});

gulp.task('clear', function(cb){
	del.sync(path.build);
	cb();
});

gulp.task('build', gulp.series('clear', 'style', 'sass-test', 'pug', 'kss'));
