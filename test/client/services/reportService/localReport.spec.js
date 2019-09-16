'use strict';

describe('service: local-report-srv', function () {
	var mockData = readJSON('test/mock/localReportMock.json');

	beforeEach(angular.mock.module('lightReport'));

	describe('LocalReportService.setData', function () {

		it('receive only array', inject(function (LocalReportService) {
			var service = new LocalReportService();
			service.data = null;
			assert.equal(service.data.length, 0);
			service.data = 'test';
			assert.equal(service.data.length, 0);
			service.data = {};
			assert.equal(service.data.length, 0);

			var newData = [{myCol:'new value'}];
			service.data = newData;
			assert.equal(service.data.length, 1);
			assert.deepEqual(service.data, newData);
		}));

		it('update data map on set data', inject(function (LocalReportService) {
			var service = new LocalReportService();
			service.columns = mockData.columns;
			service.data = mockData.data;

			assert.deepEqual(service.dataMap.volume.map['2125'], { value: '2125', count: 1 });
			assert.deepEqual(service.dataMap.volume.map['2126'], { value: '2126', count: 1 });
			assert.deepEqual(service.dataMap.instrument.map['AUD/USD'], { value: 'AUD/USD', count: 2 });
		}));

		it('notify data handlers on data update', inject(function (LocalReportService) {
			var service = new LocalReportService();
			var newData = [{myCol:'new value'}];
			var notifiedData = null;
			service.onData(function (result) {
				notifiedData = result.data;
			});
			service.data = newData;

			assert.deepEqual(notifiedData, newData);
		}));
	});

	describe('LocalReportService.getSuggestions', function () {
		it('no suggest result', inject(function (LocalReportService) {
			var service = new LocalReportService();
			service.columns = mockData.columns;
			service.data = mockData.data;
			var suggestionsResult = null;

			var callBack = function (result) {
				suggestionsResult = result;
			};

			service.getSuggestions('KGB', [], callBack);
			assert.equal(suggestionsResult.length, 0);
		}));

		it('single suggest result', inject(function (LocalReportService) {
			var service = new LocalReportService();
			service.columns = mockData.columns;
			service.data = mockData.data;
			var suggestionsResult = null;

			var callBack = function (result) {
				suggestionsResult = result;
			};

			service.getSuggestions('usd', [], callBack);

			assert.equal(suggestionsResult[0].field, 'instrument');
			assert.equal(suggestionsResult[0].label, 'Pair');
			assert.deepEqual(suggestionsResult[0].items[0], {label:'AUD/USD', value:'AUD/USD'});
		}));

		it('multiple suggest results, single column', inject(function (LocalReportService) {
			var service = new LocalReportService();
			service.columns = mockData.columns;
			service.data = mockData.data;
			var suggestionsResult = null;

			var callBack = function (result) {
				suggestionsResult = result;
			};

			service.getSuggestions('212', [], callBack);

			assert.equal(suggestionsResult.length, 1);
			assert.equal(suggestionsResult[0].field, 'volume');
			assert.equal(suggestionsResult[0].label, 'Volume');
			assert.deepEqual(suggestionsResult[0].items, [{label:'2125', value:'2125'}, {label:'2126', value:'2126'}]);
		}));

		it('multiple suggest results, multiple columns', inject(function (LocalReportService) {
			var service = new LocalReportService();
			service.columns = mockData.columns;
			service.data = mockData.data;
			var suggestionsResult = null;

			var callBack = function (result) {
				suggestionsResult = result;
			};

			service.getSuggestions('21', [], callBack);

			assert.equal(suggestionsResult.length, 2);

			//volume
			assert.equal(suggestionsResult[0].field, 'volume');
			assert.equal(suggestionsResult[0].label, 'Volume');
			assert.deepEqual(suggestionsResult[0].items, [{label:'2125', value:'2125'}, {label:'2126', value:'2126'}]);

			//price
			assert.equal(suggestionsResult[1].field, 'price');
			assert.equal(suggestionsResult[1].label, 'Price');
			assert.deepEqual(suggestionsResult[1].items, [{label:'21.07', value:'21.07'}, {label:'21.08', value:'21.08'}]);
		}));
	});
});
