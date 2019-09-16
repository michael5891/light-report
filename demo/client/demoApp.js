'use strict';

var app = angular.module('demoApp', ['lightReport', 'ui.router']);

app.config(function ($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise("/restDemo");

	$stateProvider
		.state('restDemo', {
			url: "/restDemo",
			templateUrl: "/demos/rest/restDemo.html",
			controller: "RestDemoCtrl"
		})
		.state('localDemo', {
			url: "/localDemo",
			templateUrl: "/demos/local/localDemo.html",
			controller: "LocalDemoCtrl"
		})
		.state('transcludeDemo', {
			url: "/transcludeDemo",
			templateUrl: "/demos/transclude/transcludeDemo.html",
			controller: "TranscludeDemoCtrl"
		});
});

app.controller('demoCtrl', ['$scope', '$http', 'LightReportFactory',
	function ($scope, $http, LightReportFactory) {
		$scope.$id = $scope.$id + "demoCtrl";
	}
]);
