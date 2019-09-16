'use strict';

describe('model: report-filter-model', function () {
	beforeEach(angular.mock.module('lightReport'));

	describe('ReportFilterModel', function () {
		it('addFilter FIELD', inject(function (ReportFilterModel, ReportFilterService) {
			var filterModel = new ReportFilterModel();
			var filterKey = 'testFilter';
			var filterOptions = {
				type: ReportFilterService.FIELD,
				field: 'name',
				data: 'mike'
			};

			filterModel.addFilter(filterKey, filterOptions); //add (and parse) the filter

			filterOptions.operation = '='; //the addFilter adds this property

			assert.deepEqual(filterModel.filters[filterKey], filterOptions, 'filter is added and parsed correctly');
		}));

		it('addFilter RANGE', inject(function (ReportFilterModel, ReportFilterService) {
			var filterModel = new ReportFilterModel();
			var filterKey = 'testFilter';
			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: 2,
				to: 5
			};

			var added = filterModel.addFilter(filterKey, filterOptions);
			assert.equal(added.isPartial, false, 'is not partial');

			filterOptions.from = {data: 2, operation: '>='};
			filterOptions.to = {data: 5, operation: '<='};
			assert.deepEqual(filterModel.filters[filterKey], filterOptions, 'filter with from and to is added and parsed correctly');
		}));

		it('addFilter RANGE partial from-to', inject(function (ReportFilterModel, ReportFilterService) {
			var filterModel = new ReportFilterModel();
			var filterKey = 'testFilter';

			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: 2
			};

			var added = filterModel.addFilter(filterKey, filterOptions);
			assert.equal(added.isPartial, true, 'is partial');

			filterOptions.from = {data: 2, operation: '>='};
			assert.deepEqual(filterModel.filters[filterKey], filterOptions, 'filter with from is added and parsed correctly');

			filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				to: 5
			};
			added = filterModel.addFilter(filterKey, filterOptions);
			assert.equal(added.isPartial, false, 'is not partial');

			var finalFilter = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: {data: 2, operation: '>='},
				to: {data: 5, operation: '<='}
			};
			assert.deepEqual(filterModel.filters[filterKey], finalFilter, 'filter with from&to is added and parsed correctly');
		}));

		it('addFilter RANGE partial to-from', inject(function (ReportFilterModel, ReportFilterService) {
			var filterModel = new ReportFilterModel();
			var filterKey = 'testFilter';

			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				to: 5
			};

			var added = filterModel.addFilter(filterKey, filterOptions);
			assert.equal(added.isPartial, true, 'is partial');

			filterOptions.to = {data: 5, operation: '<='};
			assert.deepEqual(filterModel.filters[filterKey], filterOptions, 'filter with to is added and parsed correctly');

			filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: 2
			};
			added = filterModel.addFilter(filterKey, filterOptions);
			assert.equal(added.isPartial, false, 'is not partial');

			var finalFilter = {
				type: ReportFilterService.RANGE,
				field: 'size',
				from: {data: 2, operation: '>='},
				to: {data: 5, operation: '<='}
			};
			assert.deepEqual(filterModel.filters[filterKey], finalFilter, 'filter with from&to is added and parsed correctly');
		}));

		it('addFilter DATE_RANGE', inject(function (ReportFilterModel, ReportFilterService) {
			var filterModel = new ReportFilterModel();
			var filterKey = 'testFilter';

			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'dealDate',
				from: { data: new Date('2016-05-12'), operation: '>=' },
				to: { data: new Date('2016-05-13'), operation: '<=' }
			};

			var filter = filterModel.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, false, 'is not partial');
			assert.deepEqual(filterModel.filters[filterKey], filterOptions, 'filter with date_range is added and parsed correctly');
		}));

		it('removeFilter', inject(function (ReportFilterModel, ReportFilterService) {
			var filterModel = new ReportFilterModel();
			var filterKey = 'testFilter';

			var filterOptions = {
				type: ReportFilterService.RANGE,
				field: 'dealDate',
				from: { data: new Date('2016-05-12'), operation: '>=' },
				to: { data: new Date('2016-05-13'), operation: '>=' }
			};

			var filter = filterModel.addFilter(filterKey, filterOptions);
			assert.equal(filter.isPartial, false);
			assert.deepEqual(filterModel.filters[filterKey], filterOptions);

			filterModel.removeFilter(filterKey, filterOptions);
			assert.equal(filterModel.filters[filterKey], undefined);
		}));

		it('compileFilter, single filed filter', inject(function (ReportFilterModel, ReportFilterService) {
			var filterModel = new ReportFilterModel();
			var filterKey = 'testFilter';
			var filterOptions = {
				type: ReportFilterService.FIELD,
				field: 'name',
				data: 'mike'
			};

			filterModel.addFilter(filterKey, filterOptions);
			var result = filterModel.compileFilter();
			var expected = {};
			expected['='] = ['name', 'mike'];
			assert.deepEqual(result, expected);
		}));

		it('compileFilter, multiple fileds filter', inject(function (ReportFilterModel, ReportFilterService) {
			var filterModel = new ReportFilterModel();
			var filterOptions = {
				type: ReportFilterService.FIELD,
				field: 'name',
				data: 'mike'
			};

			filterModel.addFilter('testFilter1', filterOptions);
			filterModel.addFilter('testFilter2', filterOptions);
			var result = filterModel.compileFilter();
			var tempItem = {};
			tempItem['='] = ['name', 'mike'];
			var expected = {};
			expected.AND = [tempItem, tempItem];
			assert.deepEqual(result, expected);
		}));
	});
});

