'use strict';

angular.module('lightReport')
	/**
	 * @ngdoc service
	 * @name RestReportService
	 *
	 * @param {string} url
	 * @description
	 * Provides rest api for search and suggestions over provided url.<br>
	 *
	 * @class RestReportService
	 * @public
	 */
	.service('RestReportService', ['$http', 'BaseReportService', '$q', function ($http, BaseReportService, $q) {
		/**
		 * RestReportService
		 * @param {string} url - report service base url path
		 * @constructor
		 * @memberof! RestReportService
		 * @public
		 * @example
		 * var service = new RestReportService('reports/deals');
		 */
		var RestReportService = function (url) {
			//Call super constructor.
			BaseReportService.call(this);

			if (!url) {
				console.warn('lightReport.RestReportService: Must specify service url.');
			}
			this.url = url;

			this.lastResponse = {
				data: [],
				query: {},
				isPaging: false
			};

            this.queryCanceller = null;

			this.SYNC_COLUMNS = {NEVER:0, ONCE:1, ALWAYS:2};

			//initiate column syncing
			this.syncColumns = this.SYNC_COLUMNS.ONCE;
		};

		//Extends BaseReportService
		RestReportService.prototype = Object.create(BaseReportService.prototype);

		/**
		 * Perform http.GET request with the report filters composed as url query.
		 * The response is set into the report data model.
		 *
		 * - To handle received data use the promise .success().
		 * - To handle error use the promise .error().
		 *
		 * @param {boolean} isPaging
		 *
		 * @function
		 * @memberof! RestReportService
		 * @public
		 */
		RestReportService.prototype.$applyQuery = function $applyQuery(isPaging) {
			var self = this;

			this.isInProgress = true;
			if (isPaging) {
				if (this.queryModel.hasNext === false) {
					this.isInProgress = false;
					return;
				}
			} else {
				delete this.queryModel.params.scnId;
				this.queryModel.page = 0;
			}

			if (this.queryCanceller) {
                this.queryCanceller.resolve();
            }
            this.queryCanceller = $q.defer(); //a new promise

			var queryClone = angular.copy(this.queryModel);
			var url = this.url + '/?' + this.queryModel.queryToUrlString();
			var promise = $http.get(url, {
                timeout: this.queryCanceller.promise
			});
			promise.success(function (response) {
				self.queryModel.params.scnId = response.scnId;
				self.queryModel.hasNext = response.hasNext;

				//assign everything to the last response model
				self.lastResponse.data = response.data;
				self.lastResponse.executionTime = response.executionTime;
				self.lastResponse.queryModel = queryClone;
				self.lastResponse.isPaging = isPaging;
				if (isPaging) {
					//paging - need to add new data to existing data
					Array.prototype.push.apply(self.reportModel.data, response.data);
				} else {
					self.reportModel.data = response.data;
					if (self.syncColumns !== self.SYNC_COLUMNS.NEVER) {
						if (self.syncColumns === self.SYNC_COLUMNS.ONCE) {
							self.syncColumns = self.SYNC_COLUMNS.NEVER;
						}
						self.columns = response.columns;
					}
				}
				self.updateDataHandlers(self.lastResponse, isPaging);
			}).finally(function () {
				self.isInProgress = false;
			});
		};

		/**
		 *
		 * @param queryString
		 * @param existingTags
		 * @param callback
		 * @function
		 * @memberof! RestReportService
		 * @public
		 */
		RestReportService.prototype.getSuggestions = function getSuggestions(queryString, existingTags, callback) {
			var url = this.url + '/suggest/?query=' + encodeURIComponent(queryString);

			if (existingTags.length > 0) {
				url += '&alreadySelectedColumns=' + existingTags[0].groupField;
				//loop from second item
				for (var idx = 1; idx < existingTags.length; idx++) {
					url += ',' + existingTags[idx].groupField;
				}
			}

			var self = this;
			$http.get(url).success(function (data) {
				var parsedSuggestions = self.parseSuggestions(data);
				callback(parsedSuggestions);
			});
		};

		/**
		 * @public
		 * @function
		 * @memberof! RestReportService
		 * @description
		 * parseSuggestions
		 * @param {Object} data
		 * @returns {Array}
		 */
		RestReportService.prototype.parseSuggestions = function parseSuggestions(data) {
			//TODO: consider moving to base class
			var suggestions = [];
			for (var key in data) {
				var tmpObj = {
					field: key,
					label: data[key].label,
					items: []
				};
				for (var idx = 0; idx < data[key].results.length; idx++) {
					tmpObj.items.push({
						value: data[key].results[idx],
						label: data[key].results[idx]
					});
				}
				suggestions.push(tmpObj);
			}
			return suggestions;
		};

		/**
		 * @public
		 * @function
		 * @memberof! BaseReportService
		 * @description
		 * Sort report data by field & direction.
		 *
		 * @param {string} field - field name by which to sort
		 * @param {'asc'|'desc'} direction - sort direction
		 */
		RestReportService.prototype.sort = function sort(field, direction) {
			//Supports only single column sort, no secondary sorting.
			this.queryModel.clearSort();
			this.queryModel.sort(field, direction);
			//Pass false to keep the scnId for the sort to keep on same page.
			this.$applyQuery(false);
		};

		return RestReportService;
	}]);
