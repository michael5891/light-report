'use strict';

describe('service: base-report-srv', function () {
	beforeEach(angular.mock.module('lightReport'));

	describe('BaseReportService', function () {
		it('get/set data', inject(function (BaseReportService) {
			var service = new BaseReportService();
			var newDate = ['test']
			service.data = newDate;
			assert.equal(service.data, newDate);
			assert.equal(service.data, service.reportModel.data);
		}));

		it('set data receive only array', inject(function (BaseReportService) {
			var service = new BaseReportService();
			service.data = null;
			assert.equal(service.data.length, 0);
			service.data = {};
			assert.equal(service.data.length, 0);
			service.data = 'test';
			assert.equal(service.data.length, 0);
		}));

		it('get/set columns', inject(function (BaseReportService) {
			var service = new BaseReportService();
			var newCol = {colA:{type:'type', label:'displayName'}};
			service.columns = newCol;
			assert.equal(service.columns[0].field, 'colA');
			assert.equal(service.columns[0].label, 'displayName');
			assert.equal(service.columns[0].type, 'type');
			assert.equal(service.columns[0].isDisplayed, true);
			assert.equal(service.columns[0].isPinned, false);
			assert.equal(service.columns[0].sort, true);
		}));

		it('set columns, change default sort', inject(function (BaseReportService) {
			var service = new BaseReportService();
			var newCol = {colA:{sort: false}};
			service.columns = newCol;
			assert.equal(service.columns[0].sort, false);

			assert.deepEqual(service.columns, service.reportModel.columns);
		}));

		it('set columns receive only object or array', inject(function (BaseReportService) {
			var service = new BaseReportService();
			service.columns = null;
			assert.equal(service.columns.length, 0);
			service.columns = 'test';
			assert.equal(service.columns.length, 0);
			service.columns = {colA:{}};
			assert.equal(service.columns.length, 1);
			service.columns = [{colA:{}}];
			assert.equal(service.columns.length, 1);
		}));

		it('get columns returns array', inject(function (BaseReportService) {
			var service = new BaseReportService();
			var newCol = {colA:{type:'type', sort:true, label:'displayName'}};
			service.columns = newCol;
			assert.typeOf(service.columns, 'array');
		}));

		it('get/set page', inject(function (BaseReportService) {
			var service = new BaseReportService();
			service.page = 5;
			assert.equal(service.queryModel.page, 5);
		}));

		it('set page receive only number', inject(function (BaseReportService) {
			var service = new BaseReportService();
			service.page = null;
			assert.equal(service.page, 0);
			service.page = 'test';
			assert.equal(service.page, 0);
			service.page = {};
			assert.equal(service.page, 0);
			service.page = 1;
			assert.equal(service.page, 1);
		}));

		it('get/set hasNext', inject(function (BaseReportService) {
			var service = new BaseReportService();
			service.hasNext = true;
			assert.equal(service.hasNext, true);
			assert.equal(service.hasNext, service.queryModel.hasNext);
		}));

		it('set hasNext receive only number', inject(function (BaseReportService) {
			var service = new BaseReportService();
			service.page = null;
			assert.equal(service.page, 0);
			service.page = 'test';
			assert.equal(service.page, 0);
			service.page = {};
			assert.equal(service.page, 0);
			service.page = 1;
			assert.equal(service.page, 1);
		}));

		it('onData', inject(function (BaseReportService) {
			var service = new BaseReportService();
			var newData = ['test'];
			var notifiedData = null;
			service.onData(function(result){
				notifiedData = result.data;
			});
			service.data = newData;
			assert.equal(notifiedData, newData);
		}));

		it('offData', inject(function (BaseReportService) {
			var newData = ['testA'];
			var service = new BaseReportService();
			var onDataHandler = function onDataHandler(result){
				newData = null;
			};
			service.onData(onDataHandler);
			service.offData(onDataHandler);
			service.data = newData;
			assert.deepEqual(newData, ['testA']);
		}));

		it('addFilter FIELD', inject(function (BaseReportService, ReportFilterService) {
			var service = new BaseReportService();
			var filterKey = 'testFilter';
			var filterOptions = {
				type: ReportFilterService.FIELD,
				field: 'name',
				data: 'mike',
				operation: '='
			};

			service.addFilter(filterKey, filterOptions);
			assert.deepEqual(service.queryModel.filterModel.filters[filterKey], filterOptions);
		}));

		it('addFilter RANGE', inject(function (BaseReportService, ReportFilterService) {
			var service = new BaseReportService();
			var filterKey = 'testFilter';
			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: {data: 2, operation: '>'},
				to: {data: 5, operation: '<'}
			};

			var filter = service.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, false, 'is not partial');
			assert.deepEqual(service.queryModel.filterModel.filters[filterKey], filterOptions);
		}));

		it('addFilter RANGE partial from-to', inject(function (BaseReportService, ReportFilterService) {
			var service = new BaseReportService();
			var filterKey = 'testFilter';

			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: {data: 2, operation: '>'}
			};

			var filter = service.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, true, 'is partial');
			assert.deepEqual(service.queryModel.filterModel.filters[filterKey], filterOptions);

			filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				to: {data: 5, operation: '<'}
			};
			filter = service.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, false, 'is not partial');

			var finalOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: {data: 2, operation: '>'},
				to: {data: 5, operation: '<'}
			};
			assert.deepEqual(service.queryModel.filterModel.filters[filterKey], finalOptions);
		}));

		it('addFilter RANGE partial to-from', inject(function (BaseReportService, ReportFilterService) {
			var service = new BaseReportService();
			var filterKey = 'testFilter';

			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				to: {data: 5, operation: '<'}
			};

			var filter = service.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, true, 'is partial');
			assert.deepEqual(service.queryModel.filterModel.filters[filterKey], filterOptions);

			filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: {data: 2, operation: '>'}
			};
			filter = service.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, false, 'is not partial');

			var finalOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: {data: 2, operation: '>'},
				to: {data: 5, operation: '<'}
			};
			assert.deepEqual(service.queryModel.filterModel.filters[filterKey], finalOptions);
		}));

		it('addFilter DATE_RANGE', inject(function (BaseReportService, ReportFilterService) {
			var service = new BaseReportService();
			var filterKey = 'testFilter';

			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'dealDate',
				from: {data: new Date('2016-05-12'), operation: '>'},
				to: {data: new Date('2016-05-13'), operation: '<'}
			};

			var filter = service.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, false);
			assert.deepEqual(service.queryModel.filterModel.filters[filterKey], filterOptions);
		}));

		it('removeFilter', inject(function (BaseReportService, ReportFilterService) {
			var service = new BaseReportService();
			var filterKey = 'testFilter';

			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'dealDate',
				from: {data: new Date('2016-05-12'), operation: '>'},
				to: {data: new Date('2016-05-13'), operation: '<'}
			};

			var filter = service.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, false);
			assert.deepEqual(service.queryModel.filterModel.filters[filterKey], filterOptions);

			service.removeFilter(filterKey, filterOptions);
			assert.equal(service.queryModel.filterModel.filters[filterKey], undefined);
		}));
	});
});

