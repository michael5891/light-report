'use strict';

angular.module('lightReport')
	.factory('ReportFilterModel', ['ReportFilterService', 'ReportFilterEvaluatorService', function (ReportFilterService, ReportFilterEvaluatorService) {
		var validOperations = ['>', '>=', '<', '<=', '!=', '<>'];

		function ReportFilterModel() {
			this.filters = {};
		}

		ReportFilterModel.prototype = {
			/**
			 * @function
			 * @memberof! ReportQueryModel
			 * @public
			 * @description
			 * Build collection of filters bound by AND condition
			 * from an object properties.
			 * @returns {object} - single field filter: {'=':[...]}, multiple fields filter: {'AND': [...]}.
			 */
			compileFilter: function compileFilter() {
				return ReportFilterService.createFilterFromObject(this.filters);
			},

			/**
			 * Adds filter by type and relevant arguments.
			 * Existing range\range-date filters(from-to fields) will be merged.
			 * @function
			 * @memberof! ReportFilterModel
			 * @public
			 * @param {string} key - filter key
			 * @param {object} options
			 * @param {string} options.type [ReportFilterService]
			 * @param {string} [options.field]
			 * @param {string} [options.data]
			 * @param {(number|date)} [options.from] - Range input from
			 * @param {(number|date)} [options.to] - Range input to
			 * @returns {AddFilterResult} new filter elements.
			 */
			addFilter: function addFilter(key, originalOptions) {
				//If range filter exist merge it... else update\add new.
				var isPartial = false;
				var filter = this.filters[key];

				//don't alter user's original object
				var options = angular.copy(originalOptions);

				//fix from/to if needed. this is for backward compatibility.
				//if user gave us the data straight, instead of the object we expect for from/to, then we will convert it
				if(typeof options.from !== 'undefined' && (typeof options.from !== 'object' || options.from instanceof Date)) {
					options.from = { data: options.from };
				}
				if(typeof options.to !== 'undefined' && (typeof options.to !== 'object' || options.to instanceof Date)) {
					options.to = { data: options.to };
				}

				if(!filter) { //filter doesn't already exist so add it
					filter = options;
					this.filters[key] = filter;
				}

				filter.field = options.field;
				filter.type = options.type;
				if(filter.type === ReportFilterService.RANGE || filter.type === ReportFilterService.DATE_RANGE) {
					if(options.from) {
						filter.from = options.from;

						if(validOperations.indexOf(options.from.operation) === -1) {
							filter.from.operation = '>=';
						}
					}
					if(options.to) {
						filter.to = options.to;

						if(validOperations.indexOf(options.to.operation) === -1) {
							filter.to.operation = '<=';
						}
					}

					//if range filter verify both from\to exist
					isPartial = !(filter.from && filter.to);
				}
				else { //normal filter. not range
					filter.data = options.data;
					filter.operation = validOperations.indexOf(options.operation) === -1 ? '=' : options.operation;
				}

				return {filter: filter, isPartial: isPartial};
			},

			/**
			 * @function
			 * @memberof! ReportQueryModel
			 * @public
			 * @param key
			 */
			removeFilter: function (key) {
				delete this.filters[key];
			},

			/**
			 * @function
			 * @memberof! ReportFilterModel
			 * @public
			 * @description
			 * Evaluates filter query with the given records.
			 * @param {ReportFilter} filter - compiled filter.
			 * @param {array} records - data to be filtered.
			 * @returns {Array} new collection of filtered records.
			 */
			filterRecords: function filterRecords(records) {
				if (!Array.isArray(records)) {
					throw new TypeError('filterRecords: records must be an Array');
				}

				var filtered = [];
				//clone records collection
				var recordsCopy = records.slice(0);
				if (Object.keys(this.filters).length) {
					var filter = this.compileFilter();
					var evaluator = new ReportFilterEvaluatorService();
					for (var idx = 0; idx < recordsCopy.length; idx++) {
						if (evaluator.evaluate(filter, recordsCopy[idx])) {
							filtered.push(recordsCopy[idx]);
						}
					}
				} else {
					filtered = recordsCopy;
				}

				return filtered;
			}
		};

		return ReportFilterModel;
	}]);
