'use strict';

var timezone = 0;

var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var Formatter = function Formatter() {};
Formatter.prototype.getTimezone = function () { return timezone; };
Formatter.prototype.viewToSource = function (viewValue) { return viewValue; };
Formatter.prototype.sourceToView = function (sourceValue) { return sourceValue; };
Formatter.prototype.wrapWithFunction = function (variableKey, params) {
	var functionName, args;

	if (typeof params === 'string') {
		functionName = params;
	} else if (Array.isArray(params)) {
		functionName = params.shift();
		if (params.length > 0) {
			args = params;
		}
	} else {
		throw new Error('Invalid params supplied for wrapping function. expected a function name or an array');
	}

	if (args) {
		return functionName + '(' + variableKey + ',' + args.join(',') + ')';
	}

	return functionName + '(' + variableKey + ')';
};

var OracleDateFormatter = new Formatter();

OracleDateFormatter.viewToSource = function (viewValue) {
	var date = new Date(Number(viewValue));
	//trick the 'toISOString()' to create a string for the timezone date instead of a UTC date
	date.setTime(date.getTime() + timezone*3600*1000);

    var dateString = date.toISOString();
    dateString = dateString.replace('Z', '');
    dateString = dateString.replace('T', ' ');
    return dateString;
};

OracleDateFormatter.sourceToView = function (sourceValue) {
	var toNum;
	if (typeof sourceValue !== 'number') {
		toNum = Number(sourceValue);
	}
	if (!toNum) {
		return '';
	}
	return new Date(toNum);
};

//first item in array is functions name and all others are arguments.
//notice the quotes inside the argument which is meant to stay as string
OracleDateFormatter.wrappingFunction = ['TO_TIMESTAMP', '"YYYY-MM-DD HH24:MI:SS.FF"'];

/**
 * OracleLongDateFormatter
 * @type {Formatter}
 */
var OracleLongDateFormatter = new Formatter();

OracleLongDateFormatter.viewToSource = function (viewValue) {
    //return parseInt(new Date(Number(viewValue)).getTime()); //WHAT WHAT WHAT??????

    var timestamp = Number(viewValue);
    if (isNaN(timestamp)) {
        //parse format (day month year hours:minutes:seconds)
        var parts = viewValue.split(' ');
        var date;
        var year = parseInt(parts[2], 10);
        if (year < 100) { //2k bug :)
            year = year + 2000;
        }

        if (parts[3]) {
            var timeParts = parts[3].split(':');

            date = new Date(year, monthNames.indexOf(parts[1]), parseInt(parts[0], 10), parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), parseInt(timeParts[2], 10), 0);
        } else {
            date = new Date(year, monthNames.indexOf(parts[1]), parseInt(parts[0], 10), 0, 0, 0, 0);
        }

        timestamp = date.getTime();
    }

    return timestamp;
};

/**
 * add extra 0 digit to time elements in case only one digit exists
 * @param element
 * @returns {*}
 */
OracleLongDateFormatter.formatElement = function (element) {
    if (typeof element !== 'string') {
        element = element.toString();
    }
    return element.length === 2 ? element : '0' + element
};

OracleLongDateFormatter.sourceToView = function (sourceValue) {
    if (!sourceValue) {
    	return '';
	}

    var dateObj = new Date(Number(sourceValue));
	//trick for getting timezone related times/dates regardless of the machine's timezone
	dateObj.setTime(dateObj.getTime() + timezone*3600*1000);

	var date    = OracleLongDateFormatter.formatElement(dateObj.getUTCDate()),
        month   = monthNames[dateObj.getUTCMonth()],
        year    = dateObj.getUTCFullYear().toString().substring(2, 4);

    return date + " " + month + " " + year;
};

/**
 * OracleLongDateTimeFormatter
 * @type {Formatter}
 */
var OracleLongDateTimeFormatter = Object.create(OracleLongDateFormatter);

OracleLongDateTimeFormatter.sourceToView = function (sourceValue) {
    if (!sourceValue) {
    	return '';
	}

    var dateObj = new Date(Number(sourceValue));
	//trick for getting timezone related times/dates regardless of the machine's timezone
	dateObj.setTime(dateObj.getTime() + timezone*3600*1000);

    var hours   = OracleLongDateFormatter.formatElement(dateObj.getUTCHours()),
        minutes = OracleLongDateFormatter.formatElement(dateObj.getUTCMinutes()),
        seconds = OracleLongDateFormatter.formatElement(dateObj.getUTCSeconds());

    return OracleLongDateFormatter.sourceToView(sourceValue) + " " + hours + ":" + minutes + ":" + seconds;
};

var EnumFormatter = new Formatter();
EnumFormatter.sourceToView = function (sourceValue, record , config) {
    var values =  config && config.values ? config.values : this.values;
    if (!isNaN(sourceValue) && sourceValue >=  values.length) return '';
    return values[sourceValue];
};

EnumFormatter.viewToSource = function (viewValue, config) {
    var values =  config && config.values ? config.values : this.values;
    return values.indexOf(viewValue);
};

module.exports = {
    _formatters: {
        'default': new Formatter(),
        'oracle_date': OracleDateFormatter,
        'oracle_long_date': OracleLongDateFormatter,
        'oracle_long_datetime': OracleLongDateTimeFormatter
    },
    define: function (name, formatter) {
        if (!Formatter.prototype.isPrototypeOf(formatter)) {
            throw new Error('formatter must be a type of Formatter');
        }
        this._formatters[name] = formatter;
    },
    get: function (name) {
		 if (typeof name === 'object') {
            name = name.name;
        }
        return this._formatters[name];
    },
	setTimezone: function(newTimezone) {
    	timezone = newTimezone;
	},
    BaseFormatter: new Formatter(),
    EnumFormatter: EnumFormatter,
    OracleDateFormatter:OracleDateFormatter,
    OracleLongDateFormatter:OracleLongDateFormatter,
    OracleLongDateTimeFormatter: OracleLongDateTimeFormatter
};
