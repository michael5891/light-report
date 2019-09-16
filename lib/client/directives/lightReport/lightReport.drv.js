'use strict';

var reportLog = function custom_console_log(message) {
	var now = new Date();
	var hours = now.getHours();
	var minutes = now.getMinutes();
	var seconds = now.getSeconds();
	var milliseconds = now.getMilliseconds();
	if(hours < 10) { hours = '0' + '' + hours; }
	if(minutes < 10) { minutes = '0' + '' + minutes; }
	if(seconds < 10) { seconds = '0' + '' + seconds; }
	if(milliseconds < 10) { milliseconds = '0' + '' + milliseconds; }
	if(milliseconds < 100) { milliseconds = '0' + '' + milliseconds; }
	var timeStr = hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
	console.log('[' + timeStr + ']' + message);
};

angular.module('lightReport')
	.directive('lightReport', ['lightReportEvents', 'BaseReportService',

		/**
		 * @class lightReport
		 * @public
		 *
		 * @description
		 * Light report component main entry directive.
		 * End to end(server<-->client) reports components, used as rest on demand or local self contained
		 * data presentation report.
		 *
		 * - If you don't use the AutoApplyQuery but rather wish to use the form manual submit mode
		 *   make sure to sign any buttons(if any) with type='button' other wise it will trigger the submit.
		 *
		 * @prop {BaseReportService}[lightReport]                 - Light report service instance. you may use lightReportFactory to init such instance.
		 * @prop {gridSettings}     [gridSettings]
		 * @prop {string}           [reportAutoQuery=true]      - Auto submit the query on filter change.
		 * @prop {string}           [reportSubmitLabel=Submit]  - The submit button label.
		 * @prop {string}           [sortDirections]            - The possible states of sorting
		 *
		 * @prop {OnLoadedCallback}         [onLoaded]          - onLoaded allows you to specify custom behavior when an element is loaded.
		 * @prop {OnSelectCallback}         [onSelect]          - onSelect allows you to specify custom behavior when an element is selected.
		 * @prop {OnDoubleSelectCallback}   [onDoubleSelect]    - onDoubleSelect allows you to specify custom behavior when an element is double selected.
		 * @prop {OnClickCallback}          [onClick]           - onClick allows you to specify custom behavior when an element is fully clicked.
		 * @prop {OnSortCallback}           [onSort]            - onSort allows you to specify custom behavior when an element is sorted, return true\false in order to execute internal sort after override.
		 * @prop {OnColumnResizeCallback}   [onColumnResize]    - onColumnResize allows you to specify custom behavior when an column resize.
		 *
		 *
		 * @example
		 * ```
		 *      <div    light-report="lightReportFactory"
		 *              data-report-auto-apply-query="true"
		 *              data-report-submit-label="Submit">
		 *
		 *               Select Tenor:
		 *				 <select id="tenorSelect"
		 *						 ng-model="selectedTenor"
		 *						 ng-options="tenor.label for tenor in tenors track by tenor.value"
		 *						 report-filter="tenorFilter"
		 *						 data-filter-value="selectedTenor.value"
		 *						 data-filter-field="tenor"
		 *						 data-filter-type="reportFilterService.FIELD">
		 *				 </select>
		 *       </div>
		 * ```
		 */
			function (lightReportEvents, BaseReportService) {
			return {
				restrict: 'A',
				scope: {
					reportService: '=lightReport',
					gridSettings: '=?',
					reportAutoQuery: '@?',
					reportSubmitLabel: '@?',
					sortDirections: '=?',

					onLoaded: '=?',
					onSelect: '=?',
					onDoubleSelect: '=?',
					onClick: '=?',
					onSort: '=?',
					onColumnResize: '=?'
				},
				transclude: true,
				templateUrl: '../lib/client/directives/lightReport/lightReport.tpl.html',
				controller: ['$scope', function ($scope) {
					$scope.$id = $scope.$id + '_lightReport';

					$scope.reportGridApi = null;

					//Check service support valid BaseReportService api.
					if (!($scope.reportService instanceof BaseReportService)) {
						throw "lightReport.drv: reportService should be extended instance of BaseReportService.";
					}

					if (!$scope.gridSettings || typeof $scope.gridSettings !== 'object') {
						$scope.gridSettings = {};
					}

					if(!$scope.sortDirections) { //user defined possible sorting directions
						$scope.sortDirections = { asc: true, desc: true, none: true }; //user didn't define anything so enable all by default
					}

					/**
					 *
					 * @param event
					 * @param message
					 *
					 * @function
					 * @memberof! lightReport
					 * @private
					 */
					$scope.applyQueryHandler = function applyQueryHandler(event, message) {
						$scope.reportService.applyQuery(message.isPaging);
					};

					//=========================
					//EVENT Handlers
					//=========================

					$scope.onGridLoadedHandler = function onGridLoadedHandler(event) {
						$scope.reportGridApi = event;

						if ($scope.onLoaded) {
							$scope.onLoaded(event);
						}
					};

					$scope.onGridSortHandler = function onGridSortHandler(field) {
						var column = $scope.reportService.reportModel.getColumnByField('field', field);
						if (column.sort !== false) {
							//If sortBy for current field exist get the direction and invert it.
							var direction = null;
							var sortBy = $scope.reportService.queryModel.params.sortBy;
							if (sortBy.length > 0) {
								$scope.reportGridApi.removeColumnClass(sortBy[0].field, 'sorted_' + sortBy[0].direction, true);
								if (sortBy[0].field === field) {
									direction = sortBy[0].direction;
								}
							}

							switch (direction) {
								case 'asc':
									if ($scope.sortDirections.desc) { direction = 'desc'; }
									else if ($scope.sortDirections.none) { direction = null; }
									break;
								case 'desc':
									if ($scope.sortDirections.none) { direction = null; }
									else if ($scope.sortDirections.asc) { direction = 'asc'; }
									break;
								case null:
									if ($scope.sortDirections.asc) { direction = 'asc'; }
									else if ($scope.sortDirections.desc) { direction = 'desc'; }
									break;
							}

							//user may override the default sort behavior
							var isOverriden = false;
							if ($scope.onSort) {
								isOverriden = $scope.onSort(field, direction);
							}

							if (isOverriden !== true) {
								//if sorted locally, refresh grid(otherwise will refresh onData receive).
								if ($scope.reportService.sort(field, direction)) {
									if (direction) {
										$scope.reportGridApi.addColumnClass(field, 'sorted_' + direction, true);
									}
									$scope.reportGridApi.refresh();
								}
							}
						}
					};

					/**
					 *
					 * @param result
					 * @param isAppended
					 * @function
					 * @memberof! lightReport
					 * @private
					 */
					$scope.onDataHandler = function (result, isAppended) {
						//if data update(not replace) refresh the grid, otherwise the data
						//change is internal process as apply on suggestions change in local mode
						//result of which no digest will follow...
						//so we trigger it manually.
						//replace data managed by ngModel binding on the reportGrid directive.
						if (isAppended) {
							$scope.reportGridApi.refresh();
						} else {
							$scope.reportGridApi.scrollTop();
							if (!$scope.$root.$$phase) {
								$scope.$digest();
							}
						}

						//set sorting column class, if there is such.
						var sortBy = $scope.reportService.queryModel.params.sortBy;
						if (sortBy.length > 0) {
							$scope.reportGridApi.addColumnClass(sortBy[0].field, 'sorted_' + sortBy[0].direction, true);
						}
					};

					$scope.onScrollHitBottom = function onScrollHitBottom(event) {
						//Stork grid dispatches multiple scroll events, we should handle one.
						if (!$scope.reportService.isInProgress && $scope.reportService.queryModel.hasNext) {
							reportLog('lightReport.drv: onScrollHitBottom');
							$scope.reportService.queryModel.page++;
							$scope.reportService.applyQuery(true);
						}
					};

					$scope.reportService.onData($scope.onDataHandler);
					$scope.applyQueryUnbind = $scope.$on(lightReportEvents.APPLY_QUERY, $scope.applyQueryHandler);
				}],
				link: function ($scope, element) {
					//Update grid columns, pass only displayed columns.
					$scope.$watch(
						function () {
							return $scope.reportService.columns;
						},
						function () {
							$scope.gridSettings.columns = $scope.reportService.reportModel.displayedColumns;
						}
					);

					element.on('$destroy', function () {
						$scope.reportService.offData($scope.onDataHandler);
						$scope.applyQueryUnbind();
					});
				}
			};
		}
	]);
