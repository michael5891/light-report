'use strict';

angular.module('lightReport')

	.factory('ReportModel', [function () {

		/**
		 * 'SortComparator' callback.
		 *  triggered with 2 values to be compared, result of which must be
		 *  1 if value A is greater than value B
		 *  -1 if value B is greater than value A
		 *  0 if equal
		 * @callback SortComparator
		 * @memberof! ReportColumn
		 *
		 * @param {object}  valueA
		 * @param {object}  valueB
		 */

		/**
		 * Used to override default suggestions for the column
		 * @param columnMap
		 * @param queryString
		 *
		 * @name getSuggestions
		 * @function
		 * @memberof! ReportColumn
		 * @public
		 */

		/**
		 * @public
		 * @typedef ReportColumn
		 * @type {Object}
		 * @memberof! ReportModel
		 *
		 * @property {string} field                     - data property field name
		 * @property {string} label                     - column label
		 * @property {string} [type]                    - field type as string|number|date or custom
		 * @property {boolean} [isDisplayed]            - default true
		 * @property {boolean} [isPinned]               - default false
		 * @property {boolean|SortComparator} [sort]    - is field sortable, can receive custom sort function.
		 * @property {getSuggestions} [getSuggestions]  - custom get suggestions logic
		 *
		 */

		/**
		 * Report model used to accumulate and manage report data, query and columns.
		 * @class ReportModel
		 * @public
		 */
		function ReportModel() {
			this.$data = [];
			this.$columns = [];
		}

		ReportModel.prototype = {

			/**
			 * Report data
			 * @returns {Array}
			 * @public
			 * @memberof! ReportModel
			 * @member {Array} data
			 */
			get data() {
				return this.$data;
			},
			/**
			 * Report data
			 * @public
			 * @memberof! ReportModel
			 * @param {Array} value
			 */
			set data(value) {
				if (value instanceof Array) {
					this.$data = value;
				}
			},
			/**
			 * @description
			 * Report displayedColumns, returns array of displayed columns.
			 * @returns {Array}
			 * @public
			 * @memberof! ReportModel
			 * @member {Array} columns
			 */
			get displayedColumns() {
				var ret = [];
				angular.forEach(this.$columns, function (value) {
					if (value.isDisplayed) {
						ret.push(value);
					}
				});
				return ret;
			},
			/**
			 * Report columns
			 * @returns {Array}
			 * @public
			 * @memberof! ReportModel
			 * @member {Array} columns
			 */
			get columns() {
				return this.$columns;
			},
			/**
			 * Report columns
			 * @public
			 * @memberof! ReportModel
			 * @description
			 * setting newColumns should be formated as:
			 * unified object where its properties serve as columns keys
			 * newColumns = {[key]:ReportColumn}
			 * or array of formatted columns(use create column).
			 * newColumns = [ReportColumn]
			 * @param {ReportColumn|ReportColumn[]} newColumns
			 */
			set columns(newColumns) {
				if (angular.isObject(newColumns)) {
					var self = this;
					var column;
					var columnsArr = [];
					var isArray = Array.isArray(newColumns);
					angular.forEach(newColumns, function (value, key) {
						if (!isArray && !value.hasOwnProperty('field')) {
							value.field = key;
						}
						column = self.createColumn(value);
						columnsArr.push(column);
					});

					this.$columns = columnsArr;
				}
			},

			/**
			 * @public
			 * @memberof! ReportModel
			 * @description
			 * Find column by field\value.
			 *
			 * @param {string} field
			 * @param {object} value
			 *
			 * @returns {ReportColumn}
			 */
			getColumnByField: function getColumnByProp(field, value) {
				var comparator = function comparator(column) {
					return column[field] === value;
				};
				return this.$columns.find(comparator);
			},

			/**
			 * @public
			 * @memberof! ReportModel
			 * @description
			 * Creates column object with the required\default fields.
			 *
			 * @param {ReportColumn} [settings]
			 *
			 * @returns {ReportColumn}
			 */
			createColumn: function createColumn(settings) {
				var retVal = {
					field: 'FIELD_EMPTY',
					label: 'LABEL_EMPTY',
					type: 'string',
					sort: true,
					sortable: true,
					isDisplayed: true,
					isPinned: false,
					getSuggestions: null
				};

				for (var prop in settings) {
					retVal[prop] = settings[prop];
				}

				if (retVal.field.indexOf('_displayValue') !== -1) {
					//the _displayValue data are not columns in the grid. they are just properties holding data values
					retVal.isDisplayed = false;
				}

				//if user disabled sorting then also disable sortable in grid
				if (settings.sort === false) {
					retVal.sortable = false;
				}

				return retVal;
			}
		};

		return ReportModel;
	}]);
