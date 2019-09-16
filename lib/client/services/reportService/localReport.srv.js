'use strict';

angular.module('lightReport')

	.service('LocalReportService', ['BaseReportService', function (BaseReportService) {
		/**
		 * LocalReportService
		 * @class LocalReportService
		 * @public
		 */

		/**
		 * @public
		 * @function
		 * @constructor
		 * @memberof! LocalReportService
		 * @description
		 * Accumulates the report data Model used by the data grid,
		 * query Model for filters sent to server or local handler and the data service for
		 * report data management and communication handling.
		 */
		var LocalReportService = function () {
			//Call super constructor.
			BaseReportService.call(this);

			this.dataMap = {};
			this.displayDataMap = {};
			this.rawData = [];
			this.maxRecords = 0;
		};

		//Extends BaseReportService
		LocalReportService.prototype = Object.create(BaseReportService.prototype);

		//Set the "constructor" property to refer to LocalReportService
		LocalReportService.prototype.constructor = LocalReportService;

		LocalReportService.prototype.setData = function setData(value) {
			//Build data map
			// reportLog("LocalReportService: Report dataMap");
			if (value instanceof Array) {
				if (this.maxRecords > 0 && (value.length > this.maxRecords)) {
					this.rawData = value.splice(0, this.maxRecords - 1);
				} else {
					this.rawData = value;
				}
				this.$applyQuery(false);
			}
		};

		/**
		 * @private
		 * @function
		 * @memberof! LocalReportService
		 * @description
		 * Appends data through process of sorting, building data map and refreshing the report.
		 * @param newRecords - the new data to append. expecting it to be in array form, but can handle a single data as an object
		 * @param prepend - should prepend instead of appending
		 */
		LocalReportService.prototype.$appendData = function $appendData(newRecords, prepend) {
			this.isInProgress = true;

			if (!Array.isArray(newRecords)) {
				//expected newRecords to always come in array form, else convert it.
				newRecords = [newRecords];
			}

			//limit new records to max input limit
			if (this.maxRecords > 0 && newRecords.length > this.maxRecords) {
				newRecords = newRecords.splice(0, this.maxRecords);
			}

			//add the records to raw data
			for (var idx = 0; idx < newRecords.length; idx++) {
				if (prepend === true) {
					this.rawData.push(newRecords[idx]);
				} else {
					this.rawData.unshift(newRecords[idx]);
				}
			}

			//remove old items that exceed max records limit
			if (this.maxRecords > 0 && (this.rawData.length > this.maxRecords)) {
				var removedRecords = this.rawData.splice(this.maxRecords);
				this.removeFromViewModel(removedRecords);
			}

			var filteredData = this.addToViewModel(newRecords);

			//Update data handlers
			this.lastResponse = {data: filteredData, queryModel: this.queryModel, isPaging: false};
			this.updateDataHandlers(this.lastResponse, true);

			this.isInProgress = false;
		};

		/**
		 * @private
		 * @function
		 * @memberof! LocalReportService
		 * @description
		 * Prepends data through process of sorting, building data map and refreshing the report.
		 * @param newRecords - the new data to prepend. expecting it to be in array form, but can handle a single data as an object
		 */
		LocalReportService.prototype.$prependData = function $prependData(newRecords) {
			this.$appendData(newRecords, true);
		};

		LocalReportService.prototype.addToViewModel = function addToViewModel(records) {
			//add new records to view only if they pass filtering
			var filteredData = this.queryModel.filterRecords(records);

			//Update data map
			if (filteredData.length > 0) {
				this.updateDataMap(this.dataMap, filteredData, this.reportModel.columns);
				if (this.queryModel.params.sortBy.length > 0) {
					//sort - update view data
					this.addDataWithSort(filteredData);
				} else {
					for (var idx = 0; idx < filteredData.length; idx++) {
						this.reportModel.data.push(filteredData[idx]);
					}
				}
			}

			return filteredData;
		};

		/**
		 * @private
		 * @function
		 * @memberof! LocalReportService
		 * @description
		 * remove a record from the viewable data
		 * @param records
		 * @param {boolean} force - if false then run only on filtered records, but if true then run on all records
		 */
		LocalReportService.prototype.removeFromViewModel = function removeFromViewModel(records, force) {
			force = force || false;
			var itemIdx;
			var filteredRecords;

			if (force) {
				filteredRecords = records; //run on all records
			} else {
				filteredRecords = this.queryModel.filterRecords(records); //filter records
			}
			//remove from view data. 'this.reportModel.data' is view data
			for (var idx = 0; idx < filteredRecords.length; idx++) {
				itemIdx = this.reportModel.data.indexOf(filteredRecords[idx]);
				if (itemIdx !== -1) {
					this.reportModel.data.splice(itemIdx, 1);
				}
			}
			this.updateDataMap(this.dataMap, records, this.reportModel.columns, true);
		};

		LocalReportService.prototype.updateData = function updateData(records) {
			if (!Array.isArray(records)) {
				records = [records];
			}

			this.removeFromViewModel(records, true);
			var filteredData = this.addToViewModel(records);

			//Update data handlers
			this.lastResponse = {data: filteredData, queryModel: this.queryModel, isPaging: false};
			this.updateDataHandlers(this.lastResponse, true);
		};

		/**
		 * @private
		 * @function
		 * @memberof! LocalReportService
		 * @description
		 * @param {Array} newData
		 */
		LocalReportService.prototype.addDataWithSort = function appendDataSort(newData) {
			var idx;
			var existingLength = this.reportModel.data.length;
			var newDataLegnth = newData.length;
			var sortField = this.queryModel.params.sortBy[0].field;
			var sortDirection = this.queryModel.params.sortBy[0].direction;

			//Use column custom sort field , if such exists
			var comparator = null;
			for (idx = 0; idx < this.reportModel.columns.length; idx++) {
				var column = this.reportModel.columns[idx];
				if (column.field === sortField && typeof column.sort === 'function') {
					comparator = column.sort;
					break;
				}
			}
			var compareFunc = this.compareFields(sortField, sortDirection, comparator);

			//Adding data and using internal JS sort for collection of new items is significantly
			//faster than finding the specific destination position. (tested)
			//if new data higher than 50% of the existing data length, do sort.
			if (existingLength && newDataLegnth &&
				(newDataLegnth > existingLength || newDataLegnth / existingLength > 0.5)) {
				for (idx = 0; idx < newData.length; idx++) {
					this.reportModel.data.push(newData[idx]);
				}
				this.reportModel.data.sort(compareFunc);
			} else {
				for (idx = 0; idx < newData.length; idx++) {
					var destIdx = 0;
					var value = newData[idx];
					if (this.queryModel.params.sortBy.length > 0) {
						//Find destination index.
						for (destIdx = 0; destIdx < this.reportModel.data.length; destIdx++) {
							if (compareFunc(this.reportModel.data[destIdx], value) >= 0) {
								break;
							}
						}
					}
					this.reportModel.data.splice(destIdx, 0, value);
				}
			}
		};

		/**
		 * @public
		 * @function
		 * @memberof! LocalReportService
		 * @description
		 * applyQuery
		 * @param isPaging
		 */
		LocalReportService.prototype.$applyQuery = function $applyQuery(isPaging) {
			this.isInProgress = true;

			//Filter records
			var filteredData = this.queryModel.filterRecords(this.rawData);

			//Build data map
			this.dataMap = this.buildDataMap(filteredData, this.reportModel.columns);

			//update view data
			this.reportModel.data = filteredData;

			//sort
			if (this.queryModel.params.sortBy.length > 0) {
				this.sort(this.queryModel.params.sortBy[0].field, this.queryModel.params.sortBy[0].direction);
			}

			//Update data handlers
			this.lastResponse = {data: filteredData, queryModel: this.queryModel, isPaging: isPaging};
			this.updateDataHandlers(this.lastResponse, false);

			this.isInProgress = false;
		};

		/**
		 * LocalReportService.getSuggestions callback handler
		 * @callback LocalReportService~SuggestionsCallback
		 * @param {Array<{id,items,label}>} suggestions
		 */

		/**
		 * @public
		 * @function
		 * @memberof! LocalReportService
		 * @description
		 * getSuggestions
		 * @param {string} queryString
		 * @param {array} existingTags
		 * @param {LocalReportService~SuggestionsCallback} callback
		 * @returns
		 * suggestions array
		 * @example
		 * ``` javascript
		 *
		 * getSuggestions("jpy", null, function(result) {
		 *  for(var idxGroups=0; idxGroups < result.length; idxGroups++){
		 *      console.log("Group Field: " + result[idxGroups].field);
		 *      console.log("Group Label: " + result[idxGroups].label);
		 *      for(var idxItem=0; idxItem < result[idxGroups].items.length; idxItem++){
		 *          console.log("Group Item: " + result[idxGroups].items[idxItem]);
		 *      }
		 *  }
		 * })
		 *
		 * ```
		 *
		 */
		LocalReportService.prototype.getSuggestions = function getSuggestions(queryString, existingTags, callback) {
			var self = this;
			var result = [];
			var existingGroups = [];

			if (angular.isString(queryString) && queryString.length > 0) {
				//escape regex special characters.
				queryString = queryString.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

				for (var idx = 0; idx < existingTags.length; idx++) {
					existingGroups.push(existingTags[idx].groupField);
				}

				angular.forEach(self.dataMap, function (group, key) {
					if (key.indexOf('_displayValue') !== -1) {
						return; //don't show the displayValues as group results
					}

					if (existingGroups.indexOf(key) === -1) {
						var groupItems = null;
						if (typeof (group.getSuggestions) === 'function') {
							//column has custom getSuggestions, use it.
							groupItems = group.getSuggestions(group.map, queryString);
						} else {
							groupItems = self.findMatches(group.map, queryString);
						}

						if (groupItems && groupItems.length > 0) {
							result.push({
								field: key,
								items: groupItems,
								label: group.label
							});
						}
					}
				});
			}
			callback(result);
		};

		/**
		 * @public
		 * @function
		 * @memberof! LocalReportService
		 *
		 * @description
		 * Build mapping of the data, provides map with counters of the encountered values for each column.
		 *
		 * @param {Array} data - report data
		 * @param {Array} columns - report columns {field, label}
		 *
		 * @example
		 * ```
		 *
		 *  var customGetSuggestions = function (columnMap, queryString) {
		 *      var result = [];
		 *      for (var key in columnMap) {
		 *		if (key.indexOf(queryString) > -1) {
		 *				results.push({value: key, label: key});
		 *			}
		 *		}
		 *      return result;
		 *  }
		 *
		 *  reportModel.columns = {
		 *      name:{label:'User Name'},
		 *      age:{label:'User Age'},
		 *      birthday: {label:'Birthday', getSuggestions: customGetSuggestions}
		 *  };
		 *
		 *  var data = [{name:'mike', age:30},{name:'noam', age:25},{name:'mike', age:35}];
		 *  var result = buildDataMap(data);
		 *  result:
		 *  {
		 *      'name':{
		 *          label:'User Name',
		 *          map:{
		 *              'mike':2,
		 *              'noam':1
		 *          }
		 *       },
		 *      'age':{
		 *          label:'User Age',
		 *          map:{
		 *              '30':1,
		 *              '25':1,
		 *              '35':1
		 *          }
		 *      }
		 * }
		 * ```
		 */
		LocalReportService.prototype.buildDataMap = function buildDataMap(data, columns) {
			//init\clear dataMap
			var retVal = {},
			idx, key, dataItem, displayKey, itemValue, displayValue;

			//Create the data map keys by report columns
			for (var idx = 0; idx < columns.length; idx++) {
				if (columns[idx].field.indexOf('_displayValue') !== -1) {
					continue;
				}

				retVal[columns[idx].field] = {
					label: columns[idx].label,
					map: {},
					getSuggestions: columns[idx].getSuggestions
				};
			}

			//Map available values count for each column.
			for (idx = 0; idx < data.length; idx++) {
				dataItem = data[idx];
				//register row data for the registered columns on the data map
				//(some might be filtered)
				for (key in retVal) {
					if (dataItem.hasOwnProperty(key + '_displayValue')) {
						displayKey = key + '_displayValue';
					} else {
						displayKey = key;
					}

					//does the column has value in this row?
					if (dataItem[displayKey] !== undefined) {
						//count value occurrences on this column.
						displayValue = dataItem[displayKey]; //the printable value
						itemValue = dataItem[key]; //the actual value (for logic etc.)

						if (!retVal[key].map.hasOwnProperty(displayValue)) {
							retVal[key].map[displayValue] = {value: itemValue, count: 0};
						}
						retVal[key].map[displayValue].count++;
					}
				}
			}

			return retVal;
		};

		LocalReportService.prototype.updateDataMap = function updateDataMap(dataMap, records, columns, isRemove) {
			var recordIdx, record, idx, fieldValue, displayValue, map, columnField;

			if(!Array.isArray(records)) {
				records = [records];
			}
			for(recordIdx = 0; recordIdx < records.length; recordIdx++) {
				record = records[recordIdx];
				for (idx = 0; idx < columns.length; idx++) {
					columnField = columns[idx].field;

					if (columnField.indexOf('_displayValue') !== -1) {
						continue;
					}

					if (!dataMap[columnField]) {
						dataMap[columnField] = {
							label: columns[idx].label,
							map: {}
						};
					}

					fieldValue = record[columnField];
					if (record.hasOwnProperty(columnField + '_displayValue') && record[columnField + '_displayValue'] !== undefined) {
						displayValue = record[columnField + '_displayValue'];
					} else {
						displayValue = fieldValue;
					}

					if (fieldValue) {
						map = dataMap[columnField].map;
						if (map[displayValue]) {
							if (isRemove) {
								map[displayValue].count--;
								if(map[displayValue].count === 0) {
									delete map[displayValue];
								}
							} else {
								map[displayValue].count++;
							}
						} else if(!isRemove){
							map[displayValue] = {value: fieldValue, count: 0};
						}
					}
				}
			}
		};

		/**
		 * @public
		 * @function
		 * @memberof! LocalReportService
		 *
		 * @param {Object} map
		 * @param {String} query
		 * @returns {Array}
		 */
		LocalReportService.prototype.findMatches = function findMatches(map, query) {
			var results = [];
			//search beginning of words or beginning of string
			//user can search for '-400' which will be good for both '-4005' and 'abc -4005'
			var regExp = new RegExp("[\\s.,+_\\-()\\[\\]{}'\"/]" + query + "|^" + query, 'gi');
			var passed;
			for (var key in map) {
				passed = regExp.test(key);
				if (!passed) {
					//try  testing without special characters
					var cleanKey = key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '');
					regExp.lastIndex = 0;
					passed = regExp.test(cleanKey);
				}
				if (passed) {
					results.push({value: map[key].value, label: key});
				}
				regExp.lastIndex = 0;
			}

			return results;
		};

		return LocalReportService;
	}])
;
