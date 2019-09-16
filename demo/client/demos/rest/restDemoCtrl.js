'use strict';

angular.module('demoApp')

.controller('RestDemoCtrl', ['$scope', '$http', 'LightReportFactory', 'ReportFilterService',
	function ($scope, $http, LightReportFactory, ReportFilterService) {
		$scope.$id = $scope.$id + "restDemoCtrl";

		$scope.dateRanges = [
			{label: 'Custom', value: 'CUSTOM'},
			{label: 'Today', value: 'TODAY'},
			{label: 'Yesterday', value: 'YESTERDAY'},
			{label: 'Week To Date', value: 'WEEK_TO_DATE'},
			{label: '1 Week', value: 'LAST_WEEK'}
		];

		$scope.tenors = [
			{label: 'TOD', value: 1},
			{label: 'TOM', value: 2},
			{label: 'SPOT', value: 3},
			{label: '1Mth', value: 4},
			{label: '2Mth', value: 5},

			{label: '6', value: 6},
			{label: '7', value: 7},
			{label: '8', value: 8},
			{label: '9', value: 9},
			{label: '10', value: 10},
			{label: '11', value: 11},
			{label: '12', value: 12}
		];
		$scope.selectedTenor = $scope.tenors[0];
		$scope.tenorFilter = {};
		$scope.dealDateFilter = {};
		$scope.chosenFloor = "Y12A";

		$scope.fromDate = new Date('2016-05-05');
		$scope.fromDate.setHours(0, 0, 0, 0);
		$scope.toDate = new Date();
		$scope.toDate.setHours(23, 59, 0, 0);

		$scope.reportApi = {};

		$scope.gridSettings = {
			minColumnWidth: 100
		};

		$scope.reportUrl = "reports/deals";
		$scope.reportService = LightReportFactory.create({url: $scope.reportUrl, applyQueryThrottleLatency: 1000});
		$scope.reportService.queryModel.params.rows = 15;

		$scope.selectedTags = [];
		$scope.getSuggestions = function getSuggestions(queryString, existingTags, callback) {
			$scope.reportService.getSuggestions(queryString, existingTags, callback);
		};

		$scope.reportFilterService = ReportFilterService;

		$scope.queryFilter = function () {
			return $scope.reportService.queryModel.filterModel.compileFilter();
		};

		//Attach onData response for restHistory
		$scope.idx = 0;
		$scope.restHistory = [];
		$scope.reportService.onData(function (response) {
			$scope.restHistory.push($scope.idx + ') ' + JSON.stringify(response.queryModel));
			$scope.idx++;

			//Columns manual set for first time(not on each onData update...)
			if (!$scope.gridSettings.columns || $scope.gridSettings.columns.length === 0) {
				//Manual columns settings(user preferences as width\height...)
				var userColumns = [];
				for (var idx = 0; idx < $scope.reportService.columns.length; idx++) {
					var column = $scope.reportService.columns[idx];
					column.minWidth = 80;
					column.width = Math.ceil(80 + Math.random() * 70);
					column.fixed = column.field === 'traderId';
					column.render = function (tdDiv, value) {
						tdDiv.innerHTML = '-' + value + '-';
					};
					// userColumns.push({
					// 	field: column.field,
					// 	label: column.label,
					// 	minWidth: 80,
					// 	width: Math.ceil(80 + Math.random() * 70),
					// 	fixed: column.field === 'traderId',
					// 	render: function (tdDiv, value) {
					// 		tdDiv.innerHTML = '-' + value + '-';
					// 	}
					// });
				}
				$scope.reportService.columns[1].isDisplayed = false;
				// $scope.gridSettings.columns = userColumns;
			}
		});

		$scope.sortDirections = {
			asc: true,
			desc: true,
			none: false
		};

		/**
		 * TENORS FILTER
		 */
		$scope.removeTenorFilter = function () {
			$scope.tenorFilter.api.remove();
		};

		/**
		 * DATE FILTER
		 */
		$scope.removeDateFilter = function () {
			$scope.dealDateFilter.api.remove();
		};

		/**
		 * PAGING CONTROLS
		 */
		$scope.pageForward = function () {
			$scope.reportService.applyQuery(true);
		};

		$scope.onClick = function() {
			console.log(arguments);
		};

		$scope.alertLoaded = function alertLoaded() {
			reportLog('Report\'s DOM loaded');
		};
	}
]);
