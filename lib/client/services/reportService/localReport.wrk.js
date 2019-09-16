'use strict';

angular.module('lightReport')

	.service('LocalReportWorker', [function () {
		var workerContent = function () {
			function appendSort(destData, newData, field, direction) {
				for (var newIdx = 0; newIdx < newData.length; newIdx++) {
					var right = newData[newIdx];
					var compareFunc = compareFields(field, direction);
					//Find destination index.
					var destIdx = 0;
					for (destIdx = 0; destIdx < destData.length; destIdx++) {
						if (compareFunc(newData[newIdx], destData[destIdx]) >= 0) {
							break;
						}
					}
					destData.splice(destIdx, 0, right);
				}
			}

			function compareFields(field, direction) {
				if (direction === "asc") {
					direction = -1;
				} else {
					direction = 1;
				}
				return function (a, b) {
					var left = String(a[field]).split(',').join('');
					var right = String(b[field]).split(',').join('');

					//"kn"+numeric_true used to properly handle a mixed text with numbers
					var retVal = left.localeCompare(right, "kn",{numeric:true}) * direction;
					return retVal;
				};
			}

			self.addEventListener('message', function (event) {
				reportLog("worker: appendSort");
				appendSort(event.data.destData, event.data.newData, event.data.field, event.data.direction);
				postMessage(event.data.destData);
			});
		};

		var LocalReportWorker = function () {
			//Build a worker from a function body
			var blob = new Blob(['(', workerContent.toString(),'())'], {type: 'text/javascript'});
			this.blobURL = window.URL.createObjectURL(blob);
			this.worker = null;
		};

		LocalReportWorker.prototype.create = function create() {
			this.worker = new Worker(this.blobURL);
		};

		LocalReportWorker.prototype.destroy = function destroy() {
			this.worker.removeEventListener('message', resultListener);
			this.worker.terminate();
			this.worker = null;
			window.URL.revokeObjectURL(this.blobURL);
		};

		//destData, newData, field, direction,
		var workerMessageHandler = false;
		LocalReportWorker.prototype.appendSort = function appendSort(sortArgs, callback) {
			var self = this;
			var resultListener = function (event) {
				// self.worker.removeEventListener('message', resultListener);
				reportLog("LocalReportWorker: callback");
				callback(event.data);
			};
			if(!workerMessageHandler) {
				workerMessageHandler = true;
				this.worker.addEventListener('message', resultListener, false);
			}

			this.worker.postMessage(sortArgs);
		};

		return LocalReportWorker;
	}])
;
