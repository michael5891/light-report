'use strict';

var DataAdapter = require('./data_source_adapter');
var _ = require('lodash');
var CsvAdapter = Object.create(DataAdapter);
var FilterService = require('../../common/filter_service');
//var csv = require('csv');

// function key(obj) {
//     return Object.keys(obj)[0];
// }
//
// var validOperators = {
//     "AND": "AND",
//     "OR": "OR",
//     "=": "=",
//     "<": "<",
//     ">": ">",
//     ">=": ">=",
//     "<=": "<=",
//     "IN": "IN",
//     "LIKE": "AND",
//     "!=": "<>",
//     "<>": "<>"
// };
//
// var validOrderBy = {
//     "asc": "ASC",
//     "desc": "DESC",
//     "DESC": "DESC",
//     "ASC": "ASC"
// };

CsvAdapter.init = function (report) {
    DataAdapter.init.call(this, report);
};

CsvAdapter.execute = function (finish) {
    var results = [], self = this;

	function end() {
		finish(null, results);
		self.csv.removeListener("end", end);
	}

    self.csv.on("end", end);

    self.csv.transform(function(row){
        var record = {};
        record = _.object(self.columnList, row);
        if (FilterService.evaluate(self.filter, record)) {
            results.push(record);
        }

        return null;
    });

};



CsvAdapter.configureColumns = function () {
	return;
};

/*
CsvAdapter.configureColumns = function (columns) {
    var self = this, tableColumns, reportColumns = [];

    tableColumns = _.map(columns, function (col) {

        var tableName = self.columnName.reportToTable[col];
        if (!tableName) { throw new Error(col + " column does not exists in report"); }
        reportColumns.push("\"" + col + "\"");
        return tableName + " as \"" + col + "\"";

    });

    this.sqlReportColumNames = reportColumns.join(", ");
    this.sqlColumns = tableColumns.join(", ");
};

CsvAdapter.configureSorting = function (sorting) {
    var self = this, sortingColumns = [];

    this.sqlSorting = "";
    if (sorting) {
        _.each(sorting, function (col) {

            if (typeof col !== 'object') {
                throw new Error("invalid sort by object type");
                return false;
            }

            var reportKey = _.keys(col)[0],
                tableName = self.columnName.reportToTable[reportKey];

            if (!tableName) { throw new Error(col + " column does not exists in report"); }

            if (!validOrderBy[col[reportKey]]) { throw new Error(col[reportKey] + " is not a valid SQL order by type"); }

            sortingColumns.push(tableName + " " + validOrderBy[col[reportKey]]);
        });
    }


    if (sortingColumns.length) {
        this.sqlSorting = " ORDER BY " + sortingColumns.join(", ");
    }

};
*/
module.exports = CsvAdapter;