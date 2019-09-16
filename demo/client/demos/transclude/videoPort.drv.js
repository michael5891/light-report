'use strict';

angular.module('demoApp')

	.directive('videoPort', function () {
		return {
			restrict: 'E',
			transclude: {
				'title': '?videoTitle',
				'body': 'videoBody',
				'footer': '?videoFooter'
			},
			templateUrl: '/client/demos/transclude/videoPort.tpl.html',
			scope: true,
			controller: ['$scope', function ($scope) {
				$scope.time = new Date().toDateString();
			}]
		};
	});
