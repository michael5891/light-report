'use strict';

angular.module('demoApp')

	.directive('kodi', function () {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: '/client/demos/transclude/kodi.tpl.html',
			scope: {
				title: '@?',
				link: '@?',
				footer: '@?'
			},
			link: function ($scope) {
				if (!$scope.title) {
					$scope.title = "default title";
				}
				if (!$scope.link) {
					$scope.link = "#localDemo";
				}
				if (!$scope.footer) {
					$scope.footer = "default footer";
				}
			}
		};
	});

