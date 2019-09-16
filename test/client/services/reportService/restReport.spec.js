'use strict';

describe('service: rest-report-srv', function () {
	var mockDeals = readJSON('test/mock/responseMock.json');

	beforeEach(angular.mock.module('lightReport'));

	describe('applyQuery', function () {
		var service;

		beforeEach(inject(function (RestReportService) {
			service = new RestReportService('reports/deals');
		}));

		it('No filters, no paging', inject(function ($httpBackend, RestReportService) {
			$httpBackend.expectGET(/.*reports\/deals\/\?.*/)
				.respond(function (method, url, data, headers, params) {
						//test query params are set.
						expect(params.filter).to.exist;
						expect(params.fromRow).to.exist;
						expect(params.rows).to.exist;

						//not exist
						expect(params.sortBy).to.not.exist;
						expect(params.scnId).to.not.exist;

						return [200, mockDeals, {}];
					}
				);

			service.applyQuery(false);

			$httpBackend.flush();
			assert.equal(service.data.length, mockDeals.data.length);
		}));

		it('onData: No filters, no paging', inject(function ($httpBackend, RestReportService) {
			$httpBackend.expectGET(/.*reports\/deals\/\?.*/)
				.respond(function (method, url, data, headers, params) {
						//test query params are set.
						expect(params.filter).to.exist;
						expect(params.fromRow).to.exist;
						expect(params.rows).to.exist;

						//not exist
						expect(params.sortBy).to.not.exist;
						expect(params.scnId).to.not.exist;

						return [200, mockDeals, {}];
					}
				);

			service.onData(function (result) {
				assert.equal(result.data.length, mockDeals.data.length);
			});
			service.applyQuery(false);

			$httpBackend.flush();
		}));

		it('No filters, with paging', inject(function ($httpBackend, RestReportService) {
			$httpBackend.expectGET(/.*reports\/deals\/\?.*/)
				.respond(function (method, url, data, headers, params) {
						//test query params are set.
						expect(params.filter).to.exist;
						expect(params.fromRow).to.exist;
						expect(params.rows).to.exist;
						expect(params.scnId).to.exist; //paging: scn exist

						return [200, mockDeals, {}];
					}
				);

			service.applyQuery(true);

			$httpBackend.flush();
			assert.equal(service.data.length, mockDeals.data.length);
		}));

		it('Single filter', inject(function ($httpBackend, RestReportService, ReportModel, ReportQueryModel, ReportFilterService) {
			$httpBackend.expectGET(/.*reports\/deals\/\?.*/)
				.respond(
					function (method, url, data, headers, params) {
						//test query params are set.
						expect(params.scnId).to.exist;
						expect(params.fromRow).to.exist;
						expect(params.rows).to.exist;
						expect(params.filter).to.exist;

						assert.equal(params.filter, '{"=":["tenor",1]}');
						return [200, mockDeals, {}];
					}
				);

			//tenor=TOD=1
			service.queryModel.filterModel.addFilter('tenorFilter', {
				type: ReportFilterService.FIELD,
				field: 'tenor',
				data: 1
			});
			service.applyQuery(true);

			$httpBackend.flush();
			assert.equal(service.data.length, mockDeals.data.length);
		}));

		it('Multi filter', inject(function ($httpBackend, RestReportService, ReportModel, ReportQueryModel, ReportFilterService) {
			var dateFrom = new Date();
			var dateTo = new Date();

			$httpBackend.expectGET(/.*reports\/deals\/\?.*/)
				.respond(
					function (method, url, data, headers, params) {
						//test query params are set.
						expect(params.scnId).to.exist;
						expect(params.fromRow).to.exist;
						expect(params.rows).to.exist;
						expect(params.filter).to.exist;

						assert.deepEqual(params.filter, '{"AND":[{"=":["tenor",1]},{"AND":[{">=":["dealDate",' + dateFrom.getTime() + ']},{"<=":["dealDate",' + dateTo.getTime() + ']}]}]}');
						return [200, mockDeals, {}];
					}
				);

			//tenor=TOD=1
			var filterOptions = {type: ReportFilterService.FIELD, field: 'tenor', data: 1};
			service.queryModel.filterModel.addFilter('tenorFilter', filterOptions);
			//date filter, test date or numeric input.
			filterOptions = {type: 'DATE_RANGE', field: 'dealDate', from: dateFrom, to: dateTo.getTime()};
			service.queryModel.filterModel.addFilter('dealDateFilter', filterOptions);
			service.applyQuery(true);

			$httpBackend.flush();
			assert.equal(service.data.length, mockDeals.data.length);
		}));

		it('Single sort by', inject(function ($httpBackend, RestReportService) {
			$httpBackend.expectGET(/.*reports\/deals\/\?.*/)
				.respond(
					function (method, url, data, headers, params) {
						//test query params are set.
						expect(params.scnId).to.exist;
						expect(params.fromRow).to.exist;
						expect(params.rows).to.exist;
						expect(params.sortBy).to.exist;
						expect(params.filter).to.exist;

						assert.equal(params.sortBy, '[{"instrument":"asc"}]');
						return [200, mockDeals, {}];
					}
				);

			service.queryModel.sort('instrument', 'asc');
			service.applyQuery(true);

			$httpBackend.flush();
			assert.equal(service.data.length, mockDeals.data.length);
		}));

		it('Multi sort by', inject(function ($httpBackend, RestReportService, ReportQueryModel) {
			$httpBackend.expectGET(/.*reports\/deals\/\?.*/)
				.respond(
					function (method, url, data, headers, params) {
						//test query params are set.
						expect(params.scnId).to.exist;
						expect(params.fromRow).to.exist;
						expect(params.rows).to.exist;
						expect(params.filter).to.exist;

						assert.equal(params.sortBy, '[{"instrument":"asc"},{"tenor":"desc"}]');
						return [200, mockDeals, {}];
					}
				);

			service.queryModel.sort('instrument', ReportQueryModel.SortDirection.ASC);
			service.queryModel.sort('tenor', ReportQueryModel.SortDirection.DESC);
			service.applyQuery(true);

			$httpBackend.flush();
			assert.equal(service.data.length, mockDeals.data.length);
		}));

		// it('syncColumns never', inject(function ($rootScope, $httpBackend) {
		// 	$httpBackend.expectGET(/.*reports\/deals\/\?.*/)
		// 		.respond(
		// 			function (method, url, data, headers, params) {
		// 				//test query params are set.
		// 				expect(params.scnId).to.exist;
		// 				expect(params.fromRow).to.exist;
		// 				expect(params.rows).to.exist;
		// 				expect(params.filter).to.exist;
		//
		// 				assert.equal(params.sortBy, '[{"instrument":"asc"},{"tenor":"desc"}]');
		// 				return [200, mockDeals, {}];
		// 			}
		// 		);
		//
		// 	service.syncColumns = service.SYNC_COLUMNS.ALWAYS;
		// 	service.applyQuery(false);
		// 	$rootScope.$apply(function() {
		// 		assert.equal(service.columns.length, 0);
		// 	});
		// }));
		//
		// it('syncColumns once', inject(function (BaseReportService, ReportModel) {
		// 	var service = new BaseReportService();
		// 	service.reportModel.syncColumns = ReportModel.SyncColumns.ONCE;
		//
		// 	var newColA = {colA:{type:'typeA', sort:false, label:'displayNameA'}};
		// 	service.columns = newColA;
		// 	assert.equal(service.columns.length, 1);
		// 	var newColB = {colB:{type:'typeB', sort:false, label:'displayNameB'}};
		// 	service.columns = newColB;
		// 	assert.equal(service.columns.length, 1);
		// 	assert.equal(service.columns[0].field, 'colA');
		// }));
		//
		// it('syncColumns always', inject(function (BaseReportService, ReportModel) {
		// 	var service = new BaseReportService();
		// 	service.reportModel.syncColumns = ReportModel.SyncColumns.ALWAYS;
		//
		// 	var newColA = {colA:{type:'typeA', sort:true, label:'displayNameA'}};
		// 	service.columns = newColA;
		// 	assert.equal(service.columns.length, 1);
		// 	var newColB = {colB:{type:'typeB', sort:true, label:'displayNameB'}};
		// 	service.columns = newColB;
		// 	assert.equal(service.columns.length, 1);
		// 	assert.equal(service.columns[0].field, 'colB');
		// }));
	});
});

