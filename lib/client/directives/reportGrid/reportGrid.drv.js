'use strict';

/**
 * 'onLoaded' callback.
 *
 * @callback OnLoadedCallback
 * @param {grid}        grid       - The grid component
 * @param {function}    setColumns - Replace existing grid columns.
 * @param {function}    setData    - Replace grid data.
 * @param {function}    refresh    - Refresh grid display.
 */

/**
 * 'onSelect' callback.
 *
 * @callback OnSelectCallback
 * @param {int}     dataIndex  -   Selected record index.
 * @param {object}  rowData    -   Selected row record.
 * @param {String}  column     -   Selected record column.
 * @param {boolean} isSelect   -   Is record selected.
 */

/**
 * 'onDoubleSelect' callback.
 *
 * @callback OnDoubleSelectCallback
 * @param {int}     dataIndex  -   Selected record index.
 * @param {object}  rowData    -   Selected row record.
 * @param {String}  column     -   Selected record column.
 * @param {boolean} isSelect   -   Is record selected.
 */

/**
 * 'onClick' callback.
 *
 * @callback OnClickCallback
 * @param {int}     dataIndex  -   Selected record index.
 * @param {object}  rowData    -   Selected row record.
 * @param {String}  column     -   Selected record column.
 * @param {boolean} isSelect   -   Is record selected.
 */

/**
 * 'onSort' callback.
 *
 * @callback OnSortCallback
 * @param {string}  field               -   Selected record index.
 * @param {string}  direction=asc\desc  -   Selected row record.
 */

/**
 * 'onColumnResize' callback.
 *
 * @callback OnColumnResizeCallback
 * @param {string}  column -   Selected column.
 * @param {int}     index  -   Selected row record.
 * @param {int}     width  -   column width.
 */

/**
 * 'onScrollHitBottom' callback.
 *
 * @callback OnScrollHitBottomCallback
 * @param {string}  column -   Selected column.
 * @param {int}     index  -   Selected row record.
 * @param {int}     width  -   column width.
 */

/**
 * @class reportGrid
 * @public
 * @description
 * Report grid wraps the 3rd party grid components to normalize light reports required
 * functionality and behavior, dispatching proper grid load and events flow.
 *
 * @prop {gridSettings}             [gridSettings]
 *
 * @prop {OnLoadedCallback}         [onLoaded]          - report grid load complete.
 * @prop {OnSelectCallback}         [onSelect]          - element is selected.
 * @prop {OnDoubleSelectCallback}   [onDoubleSelect]    - element is double selected.
 * @prop {OnClickCallback}          [onClick]           - element is fully clicked.
 * @prop {OnSortCallback}           [onSort]            - column sort call back.
 * @prop {OnColumnResizeCallback}   [onColumnResize]    - column resize call back.
 * @prop {OnScrollHitBottomCallback}[onScrollHitBottom] - on scroll hit bottom defined by gridSettings.infiniteScrollTolerance.
 *
 * @example
 * ```
 *	 <div class="lightReportGrid"
 *	     ng-model="reportService.reportModel.data"
 *
 *	     report-grid
 *	     data-grid-settings="gridSettings"
 *
 *	     data-on-loaded="onGridLoadedHandler"
 *	     data-on-sort="onGridSortHandler"
 *	     data-on-select="onSelect"
 *	     data-on-double-select="onDoubleSelect"
 *	     data-on-click="onClick"
 *	     data-on-column-resize="onColumnResize"
 *	     data-on-scroll-hit-bottom="onScrollHitBottom">
 *	 </div>
 * ```
 */
angular.module('lightReport')

	.directive('reportGrid', [function () {
		return {
			restrict: 'A',
			require: '^ngModel',
			scope: {
				gridSettings: '=?',

				onLoaded: '=?',
				onSelect: '=?',
				onDoubleSelect: '=?',
				onClick: '=?',
				onSort: '=?',
				onColumnResize: '=?',
				onScrollHitBottom: '=?'
			},
			controller: ['$scope', function ($scope) {
				$scope.$id = $scope.$id + 'reportGrid';

				var defaultGridSettings = {
					columns: null,
					element: null,
					rowHeight: 24,
					headerHeight: 28,
					selection: {
						multi: true,
						type: 'row'
					},
					minColumnWidth: 40,
					resizableColumns: true,
					enableInfiniteScroll: false,
					infiniteScrollTolerance: 50,
					trackBy: ''
				};

				//Marge user grid settings with default settings
				if (!$scope.gridSettings) {
					$scope.gridSettings = {};
				}
				for (var key in defaultGridSettings) {
					if (defaultGridSettings.hasOwnProperty(key) && !$scope.gridSettings.hasOwnProperty(key)) {
						if (!$scope.gridSettings[key]) {
							$scope.gridSettings[key] = defaultGridSettings[key];
						}
					}
				}

				$scope.$watch('gridSettings.columns', function (newValue) {
						if (Array.isArray(newValue) && newValue.length > 0) {
							//Parse column pinned to stork grid api of 'fixed'
							for (var idx = 0; idx < newValue.length; idx++) {
								newValue[idx].fixed = newValue[idx].isPinned;
							}
							$scope.setColumns(newValue);
						}
					}
				);

				$scope.setColumns = function setColumns(newColumns) {
					$scope.gridSettings.columns = newColumns;
					//if not set yet, it will be set in the link process later.
					if ($scope.grid) {
						$scope.grid.setColumns(newColumns);
					}
				};

				/**
				 * handler for on-resize
				 */
				$scope.resizeGrid = (function () {
					var resizeTO;
					return function (event) {
						clearTimeout(resizeTO);
						resizeTO = setTimeout(function () {
							$scope.grid.resize();
						}, 90);
					};
				})();

				//=========================
				//EVENT Handlers
				//=========================

				/**
				 * Grid sort event handler, triggers bound onSort call back with
				 * field and direction parameters.
				 * Direction values: asc, desc or null for no direction.
				 * @param event
				 *
				 * @function
				 * @memberof! reportGrid
				 * @public
				 */
				$scope.onGridSortHandler = function onGridSortHandler(event) {
					//trigger callbacks
					$scope.onSort(event.detail.column);
				};

				$scope.onGridSelectHandler = function onGridSelectHandler(event) {
					// normalize storkGrid's event to an lightReport object
					var eventDataObj = {
						dataIndex: event.detail.dataIndex,
						rowData: event.detail.rowData,
						column: event.detail.column,
						isSelect: event.detail.isSelect
					};

					//trigger callbacks
					$scope.onSelect(eventDataObj);
				};

				$scope.onGridDoubleSelectHandler = function onGridDoubleSelectHandler(event) {
					//trigger callbacks
					$scope.onDoubleSelect(event.detail, event);
				};

				$scope.onGridClickHandler = function onGridClickHandler(event) {
					//trigger callbacks
					$scope.onClick(event.detail, event);
				};

				$scope.onGridResizeColumnHandler = function onGridResizeColumnHandler(event) {
					// normalize storkGrid's event to an lightReport object
					var eventDataObj = {
						columnField: event.detail.columnField,
						columnIndex: event.detail.columnIndex,
						width: event.detail.width
					};

					//trigger callbacks
					$scope.onColumnResize(eventDataObj);
				};

				$scope.onGridLoadedHandler = function onGridLoadedHandler() {
					//trigger callbacks
					var reportGridApi = {
						grid: $scope.grid,
						setColumns: function setColumns(value) {
							$scope.setColumns(value);
						},
						setData: function setData(value) {
							$scope.grid.setData(value);
						},
						scrollTop: function scrollTop() {
							$scope.grid.scrollY = 0;
						},
						addColumnClass: function addColumnClass(field, className, alsoForDataCells) {
							$scope.grid.addColumnClass(field, className, alsoForDataCells);
						},
						removeColumnClass: function removeColumnClass(field, className, alsoForDataCells) {
							$scope.grid.removeColumnClass(field, className, alsoForDataCells);
						},
						refresh: function refresh() {
							$scope.grid.refresh();
						}
					};
					$scope.onLoaded(reportGridApi);
				};

				$scope.onGridScrollHitBottomHandler = function onGridScrollHitBottomHandler(event) {
					//console.log("reportGrid.drv: onGridScrollHitBottomHandler");
					if ($scope.onScrollHitBottom) {
						$scope.onScrollHitBottom(event);
					}
				};
			}],
			link: function ($scope, element, attrs, ngModelCtrl) {
				//Override grid data on ngModel update
				ngModelCtrl.$render = function () {
					$scope.grid.setData(ngModelCtrl.$modelValue);
				};

				//init stork grid, bind dom element & service data.
				$scope.gridSettings.element = element[0];
				// if ($scope.onLoaded) {
				// 	$scope.gridSettings.onload = $scope.onGridLoadedHandler;
				// }
				$scope.grid = new StorkGrid($scope.gridSettings);
				$scope.eventListeners = [
					{key: 'onSort', 		eventName: 'column-click', 	handler: $scope.onGridSortHandler},
					{key: 'onClick', 		eventName: 'data-click', 	handler: $scope.onGridClickHandler},
					{key: 'onSelect', 		eventName: 'select',		handler: $scope.onGridSelectHandler},
					{key: 'onDoubleSelect', eventName: 'dblselect', 	handler: $scope.onGridDoubleSelectHandler},
					{key: 'onDoubleSelect', eventName: 'enter-select', 	handler: $scope.onGridDoubleSelectHandler},
					{key: 'onColumnResize', eventName: 'resize-column', handler: $scope.onGridResizeColumnHandler},
					{key: 'onColumnResize', eventName: 'resize-column', handler: $scope.onGridResizeColumnHandler}
				];

				//Bind grid events
				for(var idx=0; idx < $scope.eventListeners.length; idx++) {
					var listener = $scope.eventListeners[idx];
					if($scope[listener.key]) { //if user has set handler for the event... use it.
						$scope.grid.addEventListener(listener.eventName, listener.handler, false);
					}
				}

				if ($scope.onScrollHitBottom && $scope.gridSettings.enableInfiniteScroll) {
					$scope.grid.addScrollEvent('hitBottom', $scope.gridSettings.infiniteScrollTolerance);
					$scope.grid.addEventListener('hitBottom', $scope.onGridScrollHitBottomHandler, false);
				}

				window.addEventListener('resize', $scope.resizeGrid, false);

				if ($scope.onLoaded) {
					$scope.onGridLoadedHandler();
				}

				element.on('$destroy', function () {
					for(var idx=0; idx < $scope.eventListeners.length; idx++) {
						var listener = $scope.eventListeners[idx];
						$scope.grid.removeEventListener(listener.eventName, listener.handler, false);
					}
					if ($scope.onScrollHitBottom && $scope.gridSettings.enableInfiniteScroll) {
						$scope.grid.removeEventListener('hitBottom', $scope.onGridScrollHitBottomHandler, false);
					}
					window.removeEventListener('resize', $scope.resizeGrid, false);
					$scope.grid.destroy();
				});
			}
		};
	}]);
