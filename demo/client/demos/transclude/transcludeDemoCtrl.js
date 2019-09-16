'use strict';

angular.module('demoApp')

.controller('TranscludeDemoCtrl', ['$scope',
	function ($scope) {
		$scope.myTitle = "Go to Rest Demo";
		$scope.myText = "Some bla bla text...";
		$scope.myLink = "#restDemo";
	}
]);
