'use strict';

var ReportLib = require('../../index.js'),
	BaseFormatter = ReportLib.formatters.BaseFormatter,
	EnumFormatter = ReportLib.formatters.EnumFormatter;

var AmountFormatter = Object.create(BaseFormatter, {exponentField: {value: 'dealtAmountExp', writable: true}});
AmountFormatter.sourceToView = function (sourceValue, record, config) {
	//get the relevant exponent field
	var calculated, calculatedStr, decimalPointPosition, exponent = record[this.exponentField];

	if (!sourceValue || isNaN(sourceValue)) {
		return '';
	}

	if (exponent === undefined) {
		calculated = sourceValue;
	} else {
		if (!record) {
			return '';
		}
		calculated = sourceValue * Math.pow(10, exponent);
	}
	calculatedStr = calculated.toString();
	decimalPointPosition = calculatedStr.indexOf('.');
	if (decimalPointPosition > -1) {
		if (calculatedStr.length > decimalPointPosition + 3) { // trim two digits after decimal point
			calculatedStr = calculatedStr.slice(0, decimalPointPosition + 3);
		}
		else if (calculatedStr.length - 1 - decimalPointPosition < 2) { // add zeros if less than 2 digits after decimal point
			calculatedStr += '0'.repeat(2 - (calculatedStr.length - 1 - decimalPointPosition));
		}
	} else {
		calculatedStr += '.00';
	}
	return calculatedStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

AmountFormatter.viewToSource = function (viewValue, config) {
	var ret = -1;
	if (viewValue && viewValue.length) {
		viewValue = viewValue.replace(/,/g, '');
		ret = parseFloat(viewValue);
		if (isNaN(ret)) {
			ret = 0;
		}
	}
	return ret;
};

// ID Formatter
var IdFormatter = Object.create(BaseFormatter);
IdFormatter.viewToSource = function (viewValue) {
	if (viewValue) {
		viewValue = viewValue.toUpperCase();
	}
	return viewValue;
};

let formatters = {
	amount: AmountFormatter,
	cpty: IdFormatter, /* just for upper-casing */
};

module.exports = formatters;
