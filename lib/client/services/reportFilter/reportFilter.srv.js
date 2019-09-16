'use strict';

angular.module('lightReport')

	.service('ReportFilterService', ['ReportFilterEvaluatorService', function (ReportFilterEvaluatorService) {
		/**
		 * Query filters generator service,
		 * Functionality for creating filter in query language.
		 * Supported Filter types:
		 * <ul>
		 *    <li>FIELD</li>
		 *    <li>MAP</li>
		 *    <li>RANGE</li>
		 *    <li>DATE_RANGE</li>
		 * </ul>
		 * @class ReportFilterService
		 * @public
		 */
		var ReportFilterService = {

			/**
			 * Single field filter used as key:value match.
			 * @member {string} FIELD
			 * @alias ReportFilterService.DATE_RANGE
			 * @memberof! ReportFilterService
			 * @public
			 * @example
			 * ```javascript
			 *      var options={type:'FIELD', field:'name', data:'Lincoln'};
			 *      var filter=ReportFilterService.createFilter(options);
			 *      filter result: {'=': ['name', 'Lincoln']}
			 * ```
			 */
			FIELD: 'FIELD',
			/**
			 * Create filter from object properties as search map.
			 * @member {string} MAP
			 * @alias ReportFilterService.MAP
			 * @memberof! ReportFilterService
			 * @public
			 * @example
			 * ```javascript
			 *      var options={type:'MAP', 'dealtCcy':['EUR'],'floor':['LCR1']};
			 *      var filter=ReportFilterService.createFilter(options);
			 *      filter result: {'AND':[{'=':['dealtCcy','EUR']},{'=':['floor','LCR1']}]}
			 * ```
			 */
			MAP: 'MAP',
			/**
			 * Create filter range from-to
			 * @member {string}RANGE
			 * @alias ReportFilterService.RANGE
			 * @memberof! ReportFilterService
			 * @public
			 * @example
			 * ```javascript
			 *        var options={type:'RANGE', 'field':'abc','from':'A','to':'Z'};
			 *        var filter=ReportFilterService.createFilter(options);
			 *        filter result: {'AND':[{'>=':['abc','A']},{'<=':['abc','Z']}]}
			 * ```
			 */
			RANGE: 'RANGE',
			/**
			 * Create filter date range from-to, use date object for easy range access.
			 * @member {string}
			 * @alias ReportFilterService.DATE_RANGE
			 * @memberof! ReportFilterService
			 * @public
			 * @example
			 * ```javascript
			 *        var options={type:'DATE_RANGE', 'field':'dealDate','from':'2016-07-04T21:00:00.000Z','to':'2016-06-26T20:59:00.000Z'};
			 *        var filter=ReportFilterService.createFilter(options);
			 *        filter result: {'AND':[{'>=':['dealDate',1467666000000]},{'<=':['dealDate',1466974740000]}]}
			 * ```
			 */
			DATE_RANGE: 'DATE_RANGE',

			/**
			 * @typedef ReportFilter
			 * @type {Object}
			 * @memberof! ReportFilterService
			 * @property {json} filter - object with key value of the operand and the evaluate field, data values.
			 * @property {string} filter.[operand] - operand type.
			 * @public
			 */

			/**
			 * Create filter by type and relevant arguments.
			 * @param {object} options
			 * @param {string} options.type [ReportFilterService]
			 * @param {string} [options.field]
			 * @param {string} [options.data]
			 * @param {(number|date)} [options.from] - Range input from
			 * @param {(number|date)} [options.to] - Range input to
			 * @returns {JSON}
			 *
			 * @function
			 * @alias ReportFilterService.createFilter
			 * @memberof! ReportFilterService
			 * @public
			 */
			createFilter: function (options) {
				var retVal = null;

				switch (options.type) {
					case ReportFilterService.FIELD:
						retVal = {};
						retVal[options.operation] = [options.field, options.data];
						break;
					case ReportFilterService.MAP:
						retVal = ReportFilterService.createFilterFromSearchMap(options.data);
						break;
					case ReportFilterService.RANGE:
						retVal = ReportFilterService.createFilterInRange(options.field, options.from, options.to);
						break;
					case ReportFilterService.DATE_RANGE:
						retVal = ReportFilterService.createFilterDateInRange(options.field, options.from, options.to);
						break;
					default:
						console.warn("ReportFilterService.createFilter: no filter type specified.");
				}

				return retVal;
			},

			/**
			 * Generate filter string from object properties:
			 * @param map
			 * @returns {*}
			 *
			 * @function
			 * @alias ReportFilterService.createFilterFromSearchMap
			 * @memberof! ReportFilterService
			 * @public
			 * @example
			 * Object: {'paramA': ['A'], 'paramB': ['B']}
			 * Result: {AND: ['=':['paramA':'A'], '=':['paramB':'B']]}
			 * used explicitly by tag inputs.
			 */
			createFilterFromSearchMap: function (map) {
				var values = [];
				var columns = Object.keys(map);

				for (var idx = 0; idx < columns.length; idx++) {
					values.push(this.createStatementFromMapValues(columns[idx], map[columns[idx]]));
				}

				var retVal = values[0];
				if (columns.length > 1) {
					retVal = {'AND': values};
				}
				return retVal;
			},

			/**
			 *
			 * @param field
			 * @param from
			 * @param to
			 * @returns {object} - {{AND: *[]}}
			 *
			 * @function
			 * @alias ReportFilterService.createFilterInRange
			 * @memberof! ReportFilterService
			 * @public
			 */
			createFilterInRange: function (field, from, to) {
				var retVal = {'AND': [{}, {}]};
				retVal.AND[0][from.operation] = [field, from.data];
				retVal.AND[1][to.operation] = [field, to.data];
				//example: {'AND': [ {'>=': [field, from]}, {'<=': [field, to]} ]}
				return retVal;
			},

			/**
			 *
			 * @param field
			 * @param from
			 * @param to
			 * @returns {object} - {*|{AND}|{AND: *[]}}
			 *
			 * @function
			 * @alias ReportFilterService.createFilterInRange
			 * @memberof! ReportFilterService
			 * @public
			 */
			createFilterDateInRange: function (field, from, to) {
				//don't use Date.parse(), it cuts the milliseconds.
				var adjustedFrom = {
					data: new Date(from.data).getTime(),
					operation: from.operation
				};
				var adjustedTo = {
					data: new Date(to.data).getTime(),
					operation: to.operation
				};
				return this.createFilterInRange(field, adjustedFrom, adjustedTo);
			},

			/**
			 * @function
			 * @alias ReportFilterService.createFilterFromObject
			 * @memberof! ReportFilterService
			 * @public
			 * @description
			 * Build collection of filters bound by AND condition
			 * from an object properties.
			 * @param obj
			 * @returns {object} - single field filter: {'=':[...]}, multiple fields filter: {'AND': [...]}.
			 */
			createFilterFromObject: function (obj) {
				var filterNodes = {};
				var keys = Object.keys(obj);
				if (keys.length > 1) {
					filterNodes = {'AND': []};
					for (var key in obj) {
						var filter = this.createFilter(obj[key]);
						filterNodes.AND.push(filter);
					}
				} else if (keys.length !== 0) {
					filterNodes = this.createFilter(obj[keys[0]]);
				}

				return filterNodes;
			},

			createStatementFromMapValues: function createStatementFromMapValues(columnName, values) {
				var isInStatement = values.length > 1;
				var operator = isInStatement ? 'IN' : '=';
				var statement = {};

				statement[operator] = [columnName, (isInStatement ? values : values[0])];
				return statement;
			}
		};

		return ReportFilterService;
	}]);
