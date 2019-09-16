'use strict';

describe('model: report-model', function () {
	beforeEach(angular.mock.module('lightReport'));

	describe('ReportModel', function () {
		it('set data receive only array', inject(function (ReportModel) {
			var reportModel = new ReportModel();
			reportModel.data = null;
			assert.equal(reportModel.data.length, 0);
			reportModel.data = {};
			assert.equal(reportModel.data.length, 0);
			reportModel.data = 'test';
			assert.equal(reportModel.data.length, 0);
		}));


		it('get/set columns', inject(function (ReportModel) {
			var reportModel = new ReportModel();
			var newColumns = {
				colA:{type:'type', label:'label'}
			};
			reportModel.columns = newColumns;
			assert.equal(reportModel.columns[0].field, 'colA');
			assert.equal(reportModel.columns[0].label, 'label');
			assert.equal(reportModel.columns[0].type, 'type');
			assert.equal(reportModel.columns[0].isDisplayed, true);
			assert.equal(reportModel.columns[0].isPinned, false);
			assert.equal(reportModel.columns[0].sort, true);
		}));

		it('get only visible columns', inject(function (ReportModel) {
			var reportModel = new ReportModel();
			var newColumns = {
				colC:{type:'type', label:'col C', isDisplayed:false},
				colB:{type:'type', label:'col B'}
			};
			reportModel.columns = newColumns;
			assert.equal(reportModel.displayedColumns.length, 1);
			assert.equal(reportModel.displayedColumns[0].field, 'colB');
			assert.equal(reportModel.displayedColumns[0].label, 'col B');
			assert.equal(reportModel.displayedColumns[0].type, 'type');
			assert.equal(reportModel.displayedColumns[0].isDisplayed, true);
			assert.equal(reportModel.displayedColumns[0].isPinned, false);
			assert.equal(reportModel.displayedColumns[0].sort, true);
		}));
	});
});

