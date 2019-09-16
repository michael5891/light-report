module.exports = function(grunt) {
	require('jit-grunt')(grunt);

	grunt.initConfig({
		watch: {
			styles: {
				files: ['client/*.less'], // which files to watch
				tasks: ['less'],
				options: {
					nospawn: true
				}
			}
		},
		less: {
			development: {
				options: {
					compress: false,
					yuicompress: false,
					optimization: 2
				},
				files: {
					"client/demoApp.css": "client/demoApp.less" // destination file and source file
				}
			}
		}
	});

	grunt.registerTask('watch-less', ['watch']);
};