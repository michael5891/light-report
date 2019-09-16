'use strict';

/**
 *
 * Report Filter
 *
 * Supports light report query input fields for data filtering.
 * Adding the report filter to any of the trunscluded query elements will
 * bind the ngModel to the ReportModel query filters.
 * @param {string} [reportFilter] - populates bound object with api property.
 * @param {bool} [filterKey] - key in case of multiple filter elements as in case of IN range filter,
 *                             if not set will use FilterField + 'Filter' as key.
 * @param {string} filterField - the field\column name to be filtered.
 * @param {string|number|bool} [filterValue] - used in case ngModel is not authentic as direct field value.
 * @param {string} [filterType] - (ReportFilterService.FIELD | ReportFilterService.MAP | ReportFilterService.RANGE | ReportFilterService.DATE_RANGE)
 * @param {bool} [filterFrom] - used in range\date_range filter, marks the field as the start element in the range of from -> to.
 * @param {bool} [filterTo] - used in range\date_range filter, marks the field as the end element in the range of from -> to
 *
 * @class reportFilter
 * @public
 *
 * @example
 * ```
 *     Field Filter:
 *	   <select   ng-model="selectedName"
 *				 ng-options="name in names"
 *
 *				 report-filter="name"
 *				 data-filter-value="selectedTenor.value"
 *				 data-filter-field="tenor"
 *				 data-filter-type="reportFilterService.FIELD">
 *	    </select>
 *
 *      Range Filter:
 *      <input filter='key' filterFrom/>
 *      <input filter='key' filterTo/>
 *
 * ```
 */
angular.module('lightReport')

	.directive('reportFilter', ['lightReportEvents', 'ReportFilterService', function (lightReportEvents, ReportFilterService) {
		return {
			restrict: 'A',
			require: '^ngModel',
			scope: {
				reportFilterApi: '=reportFilter',
				filterKey: '=?',
				filterField: '@',
				filterValue: '=',
				filterType: '@',
				filterFrom: '=',
				filterTo: '=',
				filterOperation: '@'
			},
			controller: ['$scope', function ($scope) {
				$scope.$id = $scope.$id + 'reportFilter';
			}],
			link: function ($scope, element, attrs, ngModelCtrl) {
				/**
				 * Executed on bound ngModel value change to emit FILTER_CHANGE.
				 * in case of filter type MAP\FIELD, message with new value.
				 * in case of filter type RANGE\RANGE_DATE, message with new from\to value.
				 * @param newValue
				 *
				 * @example
				 * {
				 *  key: 'myFilter',
				 *  field: 'myColumn',
				 *  type: 'RANGE',
				 *  to or from: '0'
				 * }
				 * - Note there is no complete from\to range(it should be complete by additional element).
				 */
				function handleModelChanged(newValue) {
					var message = {
						key: $scope.filterKey,
						field: $scope.filterField,
						type: $scope.filterType
					};
					switch ($scope.filterType) {
						case ReportFilterService.MAP:
						case ReportFilterService.FIELD:
							message.data = newValue;
							message.operation = $scope.filterOperation;
							break;
						case ReportFilterService.RANGE:
						case ReportFilterService.DATE_RANGE:
							var side = 'from'; //side of 'from' or 'to'. if not defined then defaults to 'from'
							if (attrs.filterFrom === undefined && attrs.filterTo !== undefined) {
								side = 'to';
							}
							message[side] = {
								data: newValue,
								operation: $scope.filterOperation
							};
							break;
					}
					$scope.$emit(lightReportEvents.FILTER_CHANGED, message);
				}

				$scope.getModelValue = function getModelValue() {
					//Filter value used in case ngModel is not authentic as direct field value.
					var retVal = $scope.filterValue;
					if (!retVal && ngModelCtrl) {
						retVal = ngModelCtrl.$modelValue;
					}
					return retVal;
				};

				$scope.$watchGroup(['getModelValue()', 'filterField', 'filterType'],
					function (newValues) {
						var modelValue = newValues[0];
						//Set filter key
						if (!$scope.filterKey || $scope.filterKey.length === 0 &&
							$scope.filterField && $scope.filterField.length > 0) {
							$scope.filterKey = $scope.filterField + 'Filter';
						}
						handleModelChanged(modelValue);
					}
				);

				/**
				 * Populates bound reportFilter with api property, if such binding exist(must be an object).
				 * Filter directive exist inside a trunscluded content, thus it can't directly
				 * inject bound content. it will result with duplicated property on the current child scope
				 * rather than updating the parent scope on the existing property.
				 *
				 * In order to workaround this trusclude consept, we need the binding to be an object with
				 * inner property to be updated.
				 *
				 * @example
				 * Parent scope:
				 * FilterBind : {name:'myFilter', api:null}
				 * FilterBind.api will be populated.
				 *
				 * @type {{remove: $scope.reportFilterApi.remove}}
				 */
				if ($scope.reportFilterApi) {
					$scope.reportFilterApi.api = {
						/**
						 * Emits FILTER_REMOVED message
						 */
						remove: function () {
							var message = {
								key: $scope.filterKey,
								field: $scope.filterField,
								type: $scope.filterType
							};
							$scope.$emit(lightReportEvents.FILTER_REMOVED, message);
						}
					};
				}
			}
		};
	}]);
