'use strict';

angular.module('lightReport')

	.factory('ReportFilterEvaluatorService', function () {
		var ReportFilterEvaluatorService = function () {};

		ReportFilterEvaluatorService.prototype = {
			evaluate: function evaluate(filter, record) {
				var operator = Object.keys(filter)[0];
				return this[operator](filter[operator], record);
			},
			'OR': function (nodes, record) {
				var operator;
				for (var idx = 0; idx < nodes.length; idx++) {
					operator = Object.keys(nodes[idx])[0];
					if (this[operator](nodes[idx][operator], record)) {
						return true;
					}
				}
				return false;
			},
			'AND': function (nodes, record) {
				var operator;
				for (var idx = 0; idx < nodes.length; idx++) {
					operator = Object.keys(nodes[idx])[0];
					if (!this[operator](nodes[idx][operator], record)) {
						return false;
					}
				}
				return true;
			},
			'IN': function (nodes, record) {
				var key = nodes[0];
				var val = nodes[1];
				var recordVal = record[key];

				for (var idx = 0; idx < val.length; idx++) {
					//use loose equality in case the value\record aren't both numbers or strings but has same meaning.
					if (val[idx] == recordVal) {
						return true;
					}
				}
				return false;
			},
			'=': function (nodes, record) {
				var key = nodes[0];
				var val = nodes[1];
				var recordVal = record[key];

				return recordVal == val;
			},
			'>=': function (nodes, record) {
				var key = nodes[0];
				var val = nodes[1];
				var recordVal = record[key];

				if (isNaN(val)) {
					throw val + ' is not a number'
				}
				if (isNaN(recordVal)) {
					throw recordVal + ' is not a number';
				}

				return recordVal >= val;
			},
			'<=': function (nodes, record) {
				var key = nodes[0];
				var val = nodes[1];
				var recordVal = record[key];

				if (isNaN(val)) {
					throw val + ' is not a number';
				}
				if (isNaN(recordVal)) {
					throw recordVal + ' is not a number';
				}

				return recordVal <= val;
			},
			'>': function (nodes, record) {
				var key = nodes[0];
				var val = nodes[1];
				var recordVal = record[key];

				if (isNaN(val)) {
					throw val + ' is not a number';
				}
				if (isNaN(recordVal)) {
					throw recordVal + ' is not a number';
				}

				return recordVal > val;
			},
			'<': function (nodes, record) {
				var key = nodes[0];
				var val = nodes[1];
				var recordVal = record[key];

				if (isNaN(val)) {
					throw val + ' is not a number';
				}
				if (isNaN(recordVal)) {
					throw recordVal + ' is not a number';
				}

				return recordVal < val;
			}
		};

		return ReportFilterEvaluatorService;
	});
