/*global module: false, require: false */

module.exports = function (grunt) {
	'use strict';

	require('jit-grunt')(grunt, {
		jsdoc2md: 'grunt-jsdoc-to-markdown'
	});

	require('time-grunt')(grunt);

	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.config.init({

		pkg: grunt.file.readJSON('package.json'),

		BuildConfig: {
			libDirectory: 'lib',
			libClientDir: 'lib/client',
			libServerDir: 'lib/server',
			testDirectory: 'test',
			distDirectory: 'dist',
			distClientDirectory: 'dist/client'
		},

		clean: {
			build: {
				dot: true,
				src: ['dist']
			},
			docs: {
				dot: true,
				src: ['docs']
			}
		},

		concat: {
			css: {
				//Concatenate all of the files in the cssResources configuration property
				src: [ '<%=BuildConfig.libClientDir%>/**.css' ],
				dest: '<%=BuildConfig.distClientDirectory%>/light-report.css'
			}
		},

		html2js: {
			options: {
				watch: true,
				module: 'lightReport',
				singleModule: true,
				existingModule:true
			},
			build: {
				src: ['<%=BuildConfig.libClientDir%>/**/*.html'],
				dest: 'temp/templates.js'
			}
		},

		uglify: {
			options: {
				mangle: false,
				screwIE8: true,
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */'
			},
			development: {
				options: {
					compress: false,
					beautify: {
						beautify: true,
						"indent_level": 4
					}
				},
				src: ['<%=BuildConfig.libClientDir%>/lightReport.js', '<%=BuildConfig.libClientDir%>/**/*.js', 'temp/templates.js'],
				dest: '<%=BuildConfig.distClientDirectory%>/light-report.js'

			},
			production: {
				options: {
					compress: true,
					sourceMap: true,
					sourceMapName: '<%=BuildConfig.distClientDirectory%>/light-report.min.js.map'
				},
				src: ['<%=BuildConfig.libClientDir%>/lightReport.js', '<%=BuildConfig.libClientDir%>/**/*.js', 'temp/templates.js'],
				dest: '<%=BuildConfig.distClientDirectory%>/light-report.min.js'
			}
		},

		watch: {
			build: {
				files: ['<%=BuildConfig.libClientDir%>/*.css', '<%=BuildConfig.libClientDir%>/*.js', '<%=BuildConfig.libClientDir%>/**/*.js', '<%=BuildConfig.libClientDir%>/**/*.html'],
				tasks: ['build']
			}
		},

		jshint: {
			full: {
				files: {
					src: [
						'*.js',
						'<%=BuildConfig.libDirectory%>/**/*.js'
					]
				}
			},
			options: {
				force: true,
				jshintrc: true,
				ignores: [
					'<%=BuildConfig.testDirectory%>/**/*.js'
				]
			}
		},

		eslint: {
			full: {
				options: {
					config: '.eslintrc'
				},
				src: [
					'*.js',
					'<%=BuildConfig.libDirectory%>/**/*.js'
				]
			}
		},

		jscs: {
			full: {
				options: {
					config: '.jscs.json'
				},
				files: {
					src: [
						'*.js',
						'<%=BuildConfig.libDirectory%>/**/*.js'
					]
				}
			}
		},

		karma: {
			full: {
				configFile: 'karma.conf.js',
				singleRun: true,
				browsers: ['PhantomJS']
			}
		},

		jsdoc2md: {
			apiServer: {
				options: {
					index: true,
					private: true
				},
				files: [
					{
						src: '<%=BuildConfig.libServerDir%>/**/*.js',
						dest: 'docs/server-api.md'
					}
				]
			},
			apiClient: {
				options: {
					index: true,
					private: true,
					verbose: true
				},
				files: [
					{
						src: '<%=BuildConfig.libClientDir%>/directives/**/*.js',
						dest: 'docs/directive-api.md'
					},
					{
						src: '<%=BuildConfig.libClientDir%>/models/*.js',
						dest: 'docs/models-api.md'
					},
					{
						src: ['<%=BuildConfig.libClientDir%>/lightReport.js', '<%=BuildConfig.libClientDir%>/services/*.js'],
						dest: 'docs/services-api.md'
					}
				]
			}
		},

		execute: {
			target: {
				src: ['demo/app.js']
			}
		}
	});

	grunt.registerTask('watch-build', ['watch']);

	grunt.registerTask('build', 'Clean dist, generate templates to js, package all client source & templates(uglify), copy css files', [
		'clean:build',
		'html2js:build',
		'uglify',
		'concat:css'
	]);

	grunt.registerTask('lint', 'lintify', ['jshint:full', 'eslint:full', 'jscs:full']);

	grunt.registerTask('docs', 'Generate docs', ['clean:docs', 'jsdoc2md']);

	grunt.registerTask('test', 'Run all module tests cases.', ['karma']);

	grunt.registerTask('serve', 'Run demo server.', ['execute']);
};
