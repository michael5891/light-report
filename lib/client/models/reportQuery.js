'use strict';

angular.module('lightReport')

	.factory('ReportQueryModel', ['ReportFilterModel', function (ReportFilterModel) {
		/**
		 * Report query state model for filters and data invocation state as page and from\to row.
		 * @class ReportQueryModel
		 * @public
		 */
		var ReportQueryModel = function () {
			this.params = {
				clientParams: { seqId: 1 },
				fromRow: 0,
				rows: 150,
				scnId: -1,
				sortBy: []
			};
			this.$page = 0;
			this.hasNext = 0; // don't forget to remove this from 'queryToUrlString'
			this.filterModel = new ReportFilterModel();

			Object.defineProperty(this, 'page', {
				get: function () {
					return this.$page;
				},
				set: function (value) {
					if (angular.isNumber(value)) {
						this.$page = value;
						this.params.fromRow = this.params.rows * this.$page;
					}
				}
			});
		};

		/**
		 * @memberof! ReportQueryModel
		 * @public
		 * @description
		 * Report query available sorting directions.
		 * @type {{ASC: string, DESC: string}}
		 */
		ReportQueryModel.SortDirection = {ASC:'asc', DESC:'desc'};

		/**
		 * Field + Direction  --> add sort
		 * Field + null\undefined -->  remove sort by field
		 * @function
		 * @memberof! ReportQueryModel
		 * @public
		 * @param {String} [field] - filed name
		 * @param {'ASC'|'DESC'} [direction] - asc\desc
		 */
		ReportQueryModel.prototype.sort = function sort(field, direction) {
			//check input validity.
			if (typeof (field) !== 'string' || (direction && ReportQueryModel.SortDirection[direction.toUpperCase()] === undefined)) {
				return;
			}

			if (direction) {
				var val = {field: field, direction: direction.toLowerCase()};
				var itemIdx = -1;
				for (var idx = 0; idx < this.params.sortBy.length; idx++) {
					if (this.params.sortBy[idx].field === field) {
						itemIdx = idx;
						break;
					}
				}
				//Update existing item or add new.
				if (itemIdx > -1) {
					this.params.sortBy[itemIdx] = val;
				} else {
					this.params.sortBy.push(val);
				}
			} else if (itemIdx > -1) {
				this.params.sortBy.splice(itemIdx, 1);
			}
		};

		/**
		 * Remove all sort fields
		 * @function
		 * @memberof! ReportQueryModel
		 * @public
		 */
		ReportQueryModel.prototype.clearSort = function clearSort() {
			this.params.sortBy = [];
		};

		/**
		 * Parse ReportQuery to url query string.
		 * @param manualParams
		 * @function
		 * @memberof! ReportQueryModel
		 * @public
		 */
		ReportQueryModel.prototype.queryToUrlString = function queryToUrlString(manualParams) {
			var filterNodes;
			var query;
			var backups = {};
			var tmpSortBy;

			if (manualParams) { // use manually entered parameters for this query only (not permanent)
				for (var key in manualParams) {
					if (manualParams.hasOwnProperty(key) && this.params.hasOwnProperty(key)) {
						backups[key] = this.params[key];
						if (typeof manualParams[key] === 'undefined' || manualParams[key] === null) {
							delete this.params[key];
						} else {
							this.params[key] = manualParams[key];
						}
					}
				}
			}

			//combine all filters
			filterNodes = this.filterModel.compileFilter();
			this.params.filter = JSON.stringify(filterNodes); // build this only for the sake of the query creation

			tmpSortBy = this.params.sortBy;
			if (this.params.sortBy && this.params.sortBy.length > 0) {
				this.params.sortBy = [];
				for (var idx = 0; idx < tmpSortBy.length; idx++) {
					var sortItem = tmpSortBy[idx];
					var val = {};
					val[sortItem.field] = sortItem.direction;
					this.params.sortBy.push(val);
				}
				this.params.sortBy = JSON.stringify(this.params.sortBy);
			} else {
				delete this.params.sortBy;
			}

			query = $.param(this.params);

			delete this.params.filter;
			this.params.sortBy = tmpSortBy;

			if(backups) { // return to original parameters
				for(key in backups) {
					if(backups.hasOwnProperty(key) && this.params.hasOwnProperty(key)) {
						this.params[key] = backups[key];
					}
				}
			}

			return query;
		};

		/**
		 * @function
		 * @memberof! ReportQueryModel
		 * @public
		 * @description
		 * filterRecords
		 * @param records
		 * @returns {*|Array}
		 */
		ReportQueryModel.prototype.filterRecords = function filterRecords(records) {
			return this.filterModel.filterRecords(records);
		};

		/**
		 * Adds filter by type and relevant arguments.
		 * Existing range\range-date filters(from-to fields) will be merged.
		 * @function
		 * @memberof! ReportQueryModel
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
		ReportQueryModel.prototype.addFilter = function addFilter(key, options) {
			return this.filterModel.addFilter(key, options);
		};

		/**
		 * @function
		 * @memberof! ReportQueryModel
		 * @public
		 * @param key
		 */
		ReportQueryModel.prototype.removeFilter = function removeFilter(key) {
			this.filterModel.removeFilter(key);
		};

		return ReportQueryModel;
	}]);
