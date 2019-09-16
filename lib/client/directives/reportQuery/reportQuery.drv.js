'use strict';

/**
 *
 * Report Query
 *
 * Emits lightReportEvents.APPLY_QUERY event if reportAutoQuery property is true.
 *
 * @param {ReportQueryModel} queryModel - used in range\date_range filter, marks the field as the end element in the range of from -> to
 * @param {reportAutoQuery}
 * @class reportQuery
 * @public
 *
 */
angular.module('lightReport')

	.directive('reportQuery', ['lightReportEvents', 'ReportFilterService', function (lightReportEvents, ReportFilterService) {
		return {
			restrict: 'A',
			scope: {
				queryModel: '=reportQuery',
				reportAutoQuery: '@',
				reportSubmitLabel: '@',
				reportOnApplyQuery: '=?'
			},
			templateUrl: '../lib/client/directives/reportQuery/reportQuery.tpl.html',
			transclude: true,
			controller: ['$scope', function ($scope) {
				$scope.$id = $scope.$id + '_reportQuery';
				$scope.filters = {};

				//autoApplyQuery defaults
				$scope.autoApplyQuery = $scope.reportAutoQuery;
				if ($scope.autoApplyQuery === undefined) {
					$scope.autoApplyQuery = 'true';
				}
				$scope.autoApplyQuery = $scope.autoApplyQuery !== 'false';

				//submitLabel defaults
				$scope.submitLabel = $scope.reportSubmitLabel;
				if (!$scope.autoApplyQuery && !$scope.submitLabel) {
					$scope.submitLabel = 'Submit';
				}

				$scope.applyQuery = function applyQuery(isPaging) {
					$scope.$emit(lightReportEvents.APPLY_QUERY, {isPaging: isPaging});
					if ($scope.reportOnApplyQuery) {
						$scope.reportOnApplyQuery({isPaging: isPaging});
					}
				};

				/**
				 * Filter change handler, if reportAutoQuery is active non partial filters will trigger.
				 * expected message fields:
				 *
				 * @param {object} event
				 * @param {object} message
				 * @param {string} message.key - filter key
				 * @param {string} message.type [ReportFilterService]
				 * @param {string} [message.field]
				 * @param {string} [message.data]
				 * @param {(number|date)} [message.from] - Range input from
				 * @param {(number|date)} [message.to] - Range input to
				 * @returns {JSON} - filter result
				 *
				 * @function
				 * @memberof! reportQuery
				 * @private
				 */
				$scope.filterChangedHandler = function filterChangedHandler(event, message) {
					event.stopPropagation();

					//Map filter must have data, if not remove it.
					if (message.type === ReportFilterService.MAP) {
						var hasData = false;
						for (var prop in message.data) {
							if (message.data.hasOwnProperty(prop)) {
								hasData = true;
								break;
							}
						}
						if (!hasData) {
							$scope.filterRemovedHandler(event, message);
							return {};
						}
					}

					var filter = $scope.queryModel.addFilter(message.key, message);
					if ($scope.autoApplyQuery && !filter.isPartial) {
						$scope.applyQuery(false);
					}
				};

				/**
				 * Filter remove handler.
				 * expected message fields:
				 * @param {string} key - filter key
				 *
				 * @function
				 * @memberof! reportQuery
				 * @private
				 */
				$scope.filterRemovedHandler = function filterRemovedHandler(event, message) {
					event.stopPropagation();

					$scope.queryModel.removeFilter(message.key);
					if ($scope.autoApplyQuery) {
						$scope.applyQuery(false);
					}
				};

				/**
				 *
				 * @function
				 * @memberof! reportQuery
				 * @private
				 */
				$scope.submitEventHandler = function () {
					$scope.applyQuery(false);
				};

				$scope.offFilterChanged = $scope.$on(lightReportEvents.FILTER_CHANGED, $scope.filterChangedHandler);
				$scope.offFilterRemoved = $scope.$on(lightReportEvents.FILTER_REMOVED, $scope.filterRemovedHandler);
			}],
			link: function ($scope, element, attrs) {
				//check if has query elements for transclude.
				var transcludeContent = element[0].querySelector('.lightReportQueryContent').children;
				$scope.hasTranscludeContent = transcludeContent.length > 0;

				//Bind form submit event if not in auto mode
				if (!$scope.autoApplyQuery && $scope.hasTranscludeContent) {
					$scope.formElement = element[0].querySelector('.lightReportQueryForm');
					$scope.formElement.addEventListener('submit', $scope.submitEventHandler);
				} else {
					//remove the submit input so it won't trigger the form.
					element[0].querySelector('.lightReportQueryFormSubmit').remove();
				}

				element.on('$destroy', function () {
					$scope.offFilterChanged();
					$scope.offFilterRemoved();
					if ($scope.formElement) {
						$scope.formElement.removeEventListener('submit', $scope.submitEventHandler);
					}
				});
			}
		};
	}]);
