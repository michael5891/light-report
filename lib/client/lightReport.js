'use strict';

angular.module('lightReport', [])

	.constant('lightReportEvents',
		{
			APPLY_QUERY: 'APPLY_QUERY',
			ON_DATA: 'ON_DATA',
			FILTER_CHANGED: 'FILTER_CHANGED',
			FILTER_REMOVED: 'FILTER_REMOVED'
		})

	/**
	 * @author Michael Yakubov
	 * @class LightReportFactory
	 * @public
	 * @description
	 * Report communication services factory.
	 * Factory provider for light report locale, rest or socket services.
	 */
	.factory('LightReportFactory', ['RestReportService', 'LocalReportService', function (RestReportService, LocalReportService) {
			return {
				/**
				 * Factory provider for light report rest or socket services.
				 * @function
				 * @memberof! LightReportFactory
				 * @public
				 * @param {null|string|object} options
				 * @returns {LocalReportService|RestReportService}
				 *
				 * @example
				 * ```
				 * Local:
				 * var liveService = LightReportFactory.create();
				 *
				 * Rest:
				 * var url = "reports/deals";
				 * var restService = LightReportFactory.create(url);
				 * ```
				 */
				create: function (options) {
					var retVal = null;

					if (!options) {
						retVal = new LocalReportService();
					}
					else if (typeof (options) === 'string' && options.length > 0) {
						retVal = new RestReportService(options);
					}
					else if (typeof (options) === 'object') {
						if (options.hasOwnProperty('url')) {
							retVal = new RestReportService(options);
						} else {
							retVal = new LocalReportService();
						}

						//apply (set) options on the newly created instance
						for (var prop in options) {
							if (retVal.hasOwnProperty(prop)) {
								retVal[prop] = options[prop];
							}
						}
					} else {
						console.warn('LightReportFactory: unsupported connection type:', options);
					}
					return retVal;
				}
			};
		}
	]);
