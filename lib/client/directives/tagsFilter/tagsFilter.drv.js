'use strict';

angular.module('lightReport')

	/**
	 * @name suggestionsHandler
	 * @memberof! tagsFilter
	 * @function
	 * @description
	 * function to be delivered by user for suggestions on user input change.
	 * @param {String} queryString  - user input
	 * @param {Array} existingTags  - existing tags
	 * @param {Function} callback   - results ready callback
	 */

	/**
	 * @public
	 * @typedef tagsFilterSettings
	 * @type {Object}
	 * @memberof! tagsFilter
	 *
	 * @property {suggestionsHandler} [suggestionsHandler]  - operand type.
	 * @property {HTMLElement} [element=hosting element]    - html container element.
	 * @property storkTagsInput
	 * @property {String} [placeholder='']                  - placeholder text for the input field.
	 * @property {Boolean} [rechooseRemove=true]
	 * @property {number} [inputMinWidth=110]
	 */

	/**
	 * @public
	 * @class tagsFilter
	 * @classdesc
	 * An angular wrapper for Stork-Tags input component, handles component events of Added\Removed
	 * and executes call for suggestions on demand.
	 *
	 * @prop {Function} getSuggestions - function executed to with current queryString, existingTags and callback for results.
	 *                                   function getSuggestions(queryString, existingTags, callback)
	 *
	 * @prop {string} placeholder - placeholder for the input field.
	 *
	 * @prop {tagsFilterSettings} settings
	 *
	 * @example
	 * ```
	 *      <div tags-filter
	 *           ng-model="selectedTags"
	 *           data-get-suggestions="mySuggetionsHandler"></div>
	 * ```
	 */
	.directive('tagsFilter', ['lightReportEvents', 'ReportFilterService', function (lightReportEvents, ReportFilterService) {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			getSuggestions: '=',
			placeholder: '@',
			settings: '='
		},
		controller: ['$scope', function ($scope) {
			$scope.$id = $scope.$id + 'tagsFilter';
			$scope.placeholder = $scope.placeholder || '';
		}],
		link: function ($scope, element, attrs, ngModelCtrl) {
			var isUpdateInProgress = false;
			var defaultSettings = {
				element: element[0],
				suggestionsHandler: $scope.getSuggestions,
				storkTagsInput: null,
				placeholder: $scope.placeholder,
				rechooseRemove: true,
				inputMinWidth: 110
			};

			//if settings were set, override defaults.
			if ($scope.settings) {
				for (var prop in $scope.settings) {
					defaultSettings[prop] = $scope.settings[prop];
				}
			}

			var tagsObj = new StorkTagsInput(defaultSettings);

			var commitTagsQuery = function commitTagsQuery(tags) {
				var message = {
					key: 'tagsKey',
					type: ReportFilterService.MAP,
					data: {}
				};
				for (var idx = 0; idx < tags.length; idx++) {
					var groupField = tags[idx].groupField;
					if (!message.data[groupField]) {
						message.data[groupField] = [];
					}
					message.data[groupField].push(tags[idx].value);
				}
				$scope.$emit(lightReportEvents.FILTER_CHANGED, message);
			};

			var tagsUpdatedHandler = function tagsUpdatedHandler(event) {
				if (!isUpdateInProgress) {
					isUpdateInProgress = true;
					ngModelCtrl.$setViewValue(tagsObj.chosenTags);
					commitTagsQuery(tagsObj.chosenTags);
					isUpdateInProgress = false;
				}
			};

			tagsObj.addEventListener('tag-added', tagsUpdatedHandler, false);
			tagsObj.addEventListener('tag-removed', tagsUpdatedHandler, false);
			tagsObj.addEventListener('all-tags-removed', tagsUpdatedHandler, false);

			$scope.$watchCollection(
				function () {
					return ngModelCtrl.$modelValue;
				},
				function handleModelChanged(newValue) {
					if (!isUpdateInProgress) {
						isUpdateInProgress = true;
						tagsObj.removeAllTags();
						for (var idx = 0; idx < newValue.length; idx++) {
							tagsObj.addTag(newValue[idx]);
						}
						commitTagsQuery(tagsObj.chosenTags);
						isUpdateInProgress = false;
					}
				}
			);

			element.on('$destroy', function () {

				tagsObj.removeEventListener('tag-added', tagsUpdatedHandler, false);
				tagsObj.removeEventListener('tag-removed', tagsUpdatedHandler, false);
				tagsObj.removeEventListener('all-tags-removed', tagsUpdatedHandler, false);

				tagsObj.destroy();
			});
		}
	};
}]);
