'use strict';

angular.module('lightReport')

	.service('BaseReportService', ['ReportModel', 'ReportQueryModel', function (ReportModel, ReportQueryModel) {
		var BaseReportService = function () {
			this.reportModel = new ReportModel();
			this.queryModel = new ReportQueryModel();
			this.isInProgress = false;

			this.onDataHandlers = [];
			this.applyQueryThrottleLatency = 0;
			this.$appendDataThrottleLatency = 0;

			this.applyQueryTimeout = undefined;

			//define as enumerable to be accessible for hasOwnProperty check.
			Object.defineProperty(this, 'appendDataThrottleLatency', {
				enumerable: true,
				/**
				 * appendDataThrottle Latency
				 * @returns {int}
				 * @public
				 * @memberof! BaseReportService
				 * @member {int} appendDataThrottleLatency
				 */
				get: function () {
					return this.$appendDataThrottleLatency;
				},
				/**
				 * appendDataThrottle Latency
				 * @public
				 * @memberof! BaseReportService
				 * @member {int} appendDataThrottleLatency
				 * @description
				 * Set aggregate data appendDataThrottle latency, (overrides default appendData behvaior)
				 * Executing report refresh on first entry and after the appendDataThrottle latency.
				 */
				set: function (value) {
					if (angular.isNumber(value)) {
						this.$appendDataThrottleLatency = value;
						if (value > 0) {
							this.appendData = this.appendDataThrottle();
						} else {
							this.appendData = this.$appendData;
						}
					}
				}
			});
		};

		BaseReportService.prototype = {

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * get Data
			 * @member data
			 */
			get data() {
				return this.reportModel.data;
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * set Data
			 * @param {Array} value
			 */
			set data(value) {
				this.setData(value);
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * getColumns
			 * @member {Object} columns
			 */
			get columns() {
				return this.reportModel.columns;
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * setColumns
			 * @param {Object} columns
			 */
			set columns(columns) {
				this.reportModel.columns = columns;
			},

			/**
			 * Current page number
			 * @returns {number}
			 * @public
			 * @memberof! BaseReportService
			 * @member {number} page
			 */
			get page() {
				return this.queryModel.page;
			},

			/**
			 * Current page number
			 * @public
			 * @memberof! BaseReportService
			 * @param {number} page
			 */
			set page(value) {
				this.queryModel.page = value;
			},

			/**
			 * Has more data
			 * @returns {boolean}
			 * @public
			 * @memberof! BaseReportService
			 * @member {boolean} hasNext
			 */
			get hasNext() {
				return this.queryModel.hasNext;
			},

			/**
			 * Has more data
			 * @public
			 * @memberof! BaseReportService
			 * @member {boolean} value
			 */
			set hasNext(value) {
				if (typeof (value) === 'boolean') {
					this.queryModel.hasNext = value;
				}
			},

			setData: function setData(value) {
				if (value instanceof Array) {
					this.reportModel.data = value;
					this.updateDataHandlers({data: this.reportModel.data, queryModel: this.queryModel}, false);
				} else {
					console.warn("BaseReportService.setData: value must be an Array");
				}
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * updateDataHandlers
			 * @param {Object<data, queryModel, ispag>} value
			 * @param {boolean} isAppended - indicate whether the data is fully replaced or updated(as in case of sort).
			 */
			updateDataHandlers: function updateDataHandlers(value, isAppended) {
				//Call registered on data handlers.
				for (var idx = 0; idx < this.onDataHandlers.length; idx++) {
					this.onDataHandlers[idx](value, isAppended);
				}
			},

			hasColumns: function hasColumns() {
				return (this.reportModel.columns.length > 0);
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * applyQuery executes calls based on user filter and record state(page, sort, query parameters)
			 * if applyQueryThrottleLatency set, apply query will be delayed by timeout(no query delta caching).
			 * @param isPaging
			 */
			applyQuery: function applyQuery(isPaging) {
				var self = this;
				self.isInProgress = true;
				if (self.applyQueryThrottleLatency && self.applyQueryThrottleLatency > 0) {
					if (!self.applyQueryTimeout) {
						self.applyQueryTimeout = setTimeout(function () {
							self.$applyQuery(isPaging);
							clearTimeout(self.applyQueryTimeout);
							self.applyQueryTimeout = undefined;
						}, self.applyQueryThrottleLatency);
					}
				} else {
					self.$applyQuery(isPaging);
				}
			},

			$applyQuery: function $applyQuery(isPagging) {
				//Override this!
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * onData
			 * @param handler
			 */
			onData: function onData(handler) {
				this.onDataHandlers.push(handler);
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * offData
			 * @param handler
			 */
			offData: function offData(handler) {
				var itemIdx = this.onDataHandlers.indexOf(handler);
				if (itemIdx >= 0) {
					this.onDataHandlers.splice(itemIdx, 1);
				}
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 *
			 * @description
			 * Adds filter by type and relevant arguments.
			 * Existing range\range-date filters(from-to fields) will be merged.
			 *
			 * @param {string} key - filter key
			 * @param {object} options
			 * @param {string} options.type [ReportFilterService]
			 * @param {string} [options.field]
			 * @param {string} [options.data]
			 * @param {(number|date)} [options.from] - Range input from
			 * @param {(number|date)} [options.to] - Range input to
			 *
			 * @returns {AddFilterResult} new filter elements.
			 */
			addFilter: function addFilter(key, options) {
				return this.queryModel.filterModel.addFilter(key, options);
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * Remove filter by key
			 * @param key
			 */
			removeFilter: function removeFilter(key) {
				this.queryModel.filterModel.removeFilter(key);
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * getSuggestions
			 * @param {string} queryString
			 * @param {function}callback
			 */
			getSuggestions: function getSuggestions(queryString, callback) {
				callback([]);
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * Sort report data by field & direction.
			 *
			 * @param {string} field - field name by which to sort
			 * @param {'asc'|'desc'} direction - sort direction
			 * @return {boolean} is sorted locally
			 */
			sort: function sort(field, direction) {
				//TODO: export to worker
				//Supports only single column sort, no secondary sorting.
				this.queryModel.clearSort();
				this.queryModel.sort(field, direction);

				// use custom sort comparator if defined, use default otherwise.
				var column = this.reportModel.getColumnByField('field', field);
				var comparator = this.defaultComparator;
				if (column && typeof (column.sort) === 'function') {
					comparator = column.sort;
				}
				this.reportModel.data.sort(this.compareFields(field, direction, comparator));
				return true;
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * compareFields
			 * @param {string} field - field name by which to sort
			 * @param {'asc'|'desc'} direction - sort direction
			 * @param {Function} [comparator]
			 * @returns {Function|defaultComparator}
			 */
			compareFields: function compareFields(field, direction, comparator) {
				if (!comparator) {
					comparator = this.defaultComparator;
				}
				//Use numericDirection to invert direction.
				var numericDirection = -1;
				if (direction === 'asc') {
					numericDirection = 1;
				}
				return function (objA, objB) {
					return comparator(objA, objB, field) * numericDirection;
				};
			},

			defaultComparator: function comparator(valueA, valueB, field) {
				var left = String(valueA[field]).split(',').join('');
				var right = String(valueB[field]).split(',').join('');
				//"kn"+numeric_true used to properly handle a mixed text with numbers
				return left.localeCompare(right, "kn",{numeric:true});
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * Add data to report.
			 * @param records - either one record or an array of records
			 * @param prepend - should prepend instead of appending
			 */
			appendData: function appendData(records, prepend) {
				//default appendData execution, can be override on appendDataThrottleLatency setter.
				this.$appendData(records, prepend);
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * Add data to report.
			 * @param records - either one record or an array of records
			 */
			prependData: function prependData(records) {
				//default appendData execution, can be override on appendDataThrottleLatency setter.
				this.$prependData(records);
			},

			/**
			 * @private
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * Add data to report. to be override.
			 * @param records
			 * @param prepend
			 */
			$appendData: function $appendData(records, prepend) {
				//override this!
				throw new Error("$appendData: Not supported");
			},

			/**
			 * @private
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * Add data to report. to be override.
			 * @param records
			 */
			$prependData: function $prependData(records) {
				//override this!
				throw new Error("$prependData: Not supported");
			},

			/**
			 * @public
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * Remove data from report.
			 * @param records - either one record or an array of records
			 */
			/*removeData: function removeData(records) {
				//override this!
				throw new Error("removeData: Not implemented");
			},*/

			/**
			 * @private
			 * @function
			 * @memberof! BaseReportService
			 * @description
			 * Throttle data append, aggregates data updates at defined appendDataThrottleLatency.
			 * Executing report refresh on first entry and after the appendDataThrottle latency.
			 * @returns {Function}
			 */
			appendDataThrottle: function appendDataThrottle() {
				var timer = null;
				var pendingData = [];
				var self = this;

				return function (value) {
					//aggregate pending data
					if (Array.isArray(value)) {
						Array.prototype.push.apply(pendingData, value);
					} else {
						pendingData.push(value);
					}
					//if no pending timer, create one
					if (timer === null) {
						//execute leading request
						self.$appendData(pendingData);
						pendingData = [];
						//accumulate future requests for tail request(if such would be).
						timer = setTimeout(
							function throttled() {
								clearTimeout(timer);
								timer = null;
								if (pendingData.length > 0) {
									self.$appendData(pendingData);
									pendingData = [];
								}
							},
							this.$appendDataThrottleLatency
						);
					}
				};
			}

		};

		return BaseReportService;
	}]);
