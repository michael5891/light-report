'use strict';

describe('service: light-report-srv', function () {
	beforeEach(angular.mock.module('lightReport'));
	describe('create', function () {
		it('empty options', inject(function (LightReportFactory, LocalReportService, RestReportService) {
				assert.isDefined(LightReportFactory);
				assert.isFunction(LightReportFactory.create);

				var service = LightReportFactory.create();
				assert.instanceOf(service, LocalReportService);

				service = LightReportFactory.create(null);
				assert.instanceOf(service, LocalReportService);

				service = LightReportFactory.create('reports/deals');
				assert.instanceOf(service, RestReportService);

				var options = {};
				service = LightReportFactory.create(options);
				assert.instanceOf(service, LocalReportService);
			})
		);
		it('RestService api', inject(function (LightReportFactory, RestReportService, BaseReportService) {
				//Get service instance
				var service = LightReportFactory.create('reports/deals');
				assert.isNotNull(service);
				assert.instanceOf(service, RestReportService);
				assert.instanceOf(service, BaseReportService);

				//Test service interface api
				assert.isFunction(service.applyQuery);
				assert.isFunction(service.onData);
				assert.isFunction(service.offData);
				assert.isFunction(service.getSuggestions);
			})
		);
		it('LocalService api', inject(function (LightReportFactory, LocalReportService) {
				var service = LightReportFactory.create();
				assert.isNotNull(service);
				assert.instanceOf(service, LocalReportService);

				//Test service interface api
				assert.isFunction(service.applyQuery);
				assert.isFunction(service.onData);
				assert.isFunction(service.offData);
				assert.isFunction(service.getSuggestions);
			})
		);
	});
});
