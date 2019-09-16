'use strict';

angular.module('demoApp')

	.controller('LocalDemoCtrl', ['$scope', '$http', 'LightReportFactory', 'ReportFilterService', 'ReportQueryModel',
		function ($scope, $http, LightReportFactory, ReportFilterService, ReportQueryModel) {
			$scope.$id = $scope.$id + "LocalDemoCtrl";

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

			$scope.fromDate = new Date('2016-05-05');
			$scope.fromDate.setHours(0, 0, 0, 0);
			$scope.toDate = new Date();
			$scope.toDate.setHours(23, 59, 0, 0);

			$scope.gridSettings = {
				minColumnWidth: 100,
				enableInfiniteScroll: true
			};

			$scope.manualData = {};

			$scope.mockDataVolumes = [1, 10, 100, 200, 300, 400, 500, 1000, 10000];
			$scope.selectedMockDataVolume = $scope.mockDataVolumes[0];

			$scope.tagsFilterSettings = {
				placeholder: "mish"
			};

			$scope.selectedTags = [
				// {"value":0,"label":"0","groupField":"bs","groupLabel":"B/S","elm":{}}
				];
			$scope.reportService = LightReportFactory.create({appendDataThrottleLatency:50});

			$scope.restQueryModel = new ReportQueryModel();

			$scope.reportFilterService = ReportFilterService;

			$scope.queryFilter = function () {
				return $scope.reportService.queryModel.filterModel.compileFilter();
			};

			//Attend onData response for restHistory
			$scope.idx = 0;
			$scope.restHistory = [];
			$scope.reportService.onData(function (response) {
				$scope.restHistory.push($scope.idx + ') ' + JSON.stringify(response.queryModel));
				$scope.idx++;
			});

			$scope.configureColumns = function configureColumns(newColumns) {
				//Manual columns settings(user preferences as width\height...)
				var columnKeys = Object.keys(newColumns),
					idx, column;
				for (idx = 0; idx < columnKeys.length; idx++) {
					column = newColumns[columnKeys[idx]];
					column.minWidth = 80;
					column.width = Math.ceil(80 + Math.random() * 70);
					column.fixed = (["dealDate","instrument"].indexOf(column.field) > -1);
					if (columnKeys[idx] !== 'dealDate') {
						column.render = function (tdDiv, value) {
							tdDiv.innerHTML = value + ' :)';
						};
					}

					switch(columnKeys[idx]) {
						case 'contraCcy':
							column.sort = false;
							break;
						case 'dealtCcy':
							column.getSuggestions = function (columnMap, queryString) {
								var result = [];
								for (var key in columnMap) {
									result.push({value: key, label: key});
								}
								return result;
							};
							break;
						case 'bs':
							column.sort = function (A, B, direction) {
								return A > B ? 1 : -1;
							};
							break;
					}
				}
			};

			$scope.getSuggestions = function getSuggestions(queryString, existingTags, callback) {
				console.log("localDemoCtrl.getSuggestions");
				$scope.reportService.getSuggestions(queryString, existingTags, callback);
			};

			$scope.getColumnsManually = function () {
				$http.get('reports_config.json').success(
					function(response) {
						$scope.handleReportsResponse({scnId: null, hasNext: false, columns: response.deals.columns, data:[]});
					}
				);
			};

			$scope.clearDataHandler = function clearDataHandler() {
				$scope.reportService.data = [];
			};

			var appendTimer = null;
			$scope.appendTimerLatency = 100;
			$scope.playAppendDataHandler = function timeAppendDataHandler () {

				appendTimer = setInterval(function () {
					$scope.appendDataHandler();
				},$scope.appendTimerLatency);
			};
			$scope.stopAppendDataHandler = function timeAppendDataHandler () {
				if(appendTimer) {
					clearInterval(appendTimer);
					appendTimer = null;
				}
			};

			$scope.appendDataHandler = function appendDataHandler() {
				var startTime = new Date();
				console.log("appendDataHandler: start");
				for (var count=0; count < $scope.selectedMockDataVolume; count++) {
					var newData = angular.copy($scope.manualData);
					for (var idx = 0; idx < $scope.reportService.columns.length; idx++) {
						var column = $scope.reportService.columns[idx];
						if (!newData[column.field.toString()]) {
							if (column.type === "string") {
								newData[column.field.toString()] = "dummy_str_" + $scope.getRandomInt(1,100000) + "_" + idx;
							} else {
								newData[column.field.toString()] = idx;
							}
						}
					}
					$scope.reportService.appendData(newData);
				}
				var endTime = new Date();
				console.log("appendDataHandler: end, delta: " + (endTime.getTime() - startTime.getTime()));
			};

			$scope.getRandomInt = function getRandomInt(min, max) {
				return Math.floor(Math.random() * (max - min + 1)) + min;
			};

			$scope.applyQueryHandler = function applyQueryHandler() {
				console.log('APPLY_QUERY');
				$scope.isInProgress = true;
				delete $scope.restQueryModel.params.scnId;

				$http.get('reports/deals/?' + $scope.restQueryModel.queryToUrlString()).success(
					$scope.handleReportsResponse
				);
			};

			$scope.handleReportsResponse = function (response) {
				$scope.reportService.queryModel.params.scnId = response.scnId;
				$scope.reportService.hasNext = response.hasNext;

				$scope.configureColumns(response.columns);
				$scope.reportService.columns = response.columns;

				//setting the data will trigger updates chain...
				$scope.reportService.data = response.data;

				$scope.isInProgress = false;
			};

			$scope.exportToCSV = function exportToCSV() {
				// request csv from server with blotter identifying parameter.
				if ($scope.reportService.data.length > 0) {
					var queryObj = {
						fromRow: 0,
						rows: $scope.reportService.rawData.length,
						clientParams: {seqId: 1},
						filter: {}
					};
					var queryString = $.param(queryObj);

					$('#downloadIFrame')[0].src = '/reports/deals/?' + queryString + '&outputFormat=csv&outputFile=deals_.csv';
				}
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
				// $scope.reportModel.page++;
				$scope.reportService.applyQuery(true);
			};

			$scope.on_loaded = function on_loaded(event) {
				console.log('directives loaded: ', event);
			};
		}
	]);
