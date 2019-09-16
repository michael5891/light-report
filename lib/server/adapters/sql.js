'use strict';

var DataAdapter = require('./data_source_adapter');
var _ = require('lodash');
var SqlAdapter = Object.create(DataAdapter);
var Formatter = require('../formatter');
var logger = require('../../common/logger');

function key(obj) {
    return Object.keys(obj)[0];
}

var validOperators = {
    "AND": "AND",
    "OR": "OR",
    "=": "=",
    "<": "<",
    ">": ">",
    ">=": ">=",
    "<=": "<=",
    "IN": "IN",
    "LIKE": "AND",
    "!=": "<>",
    "<>": "<>"
};

var validOrderBy = {
    "asc": "ASC",
    "desc": "DESC",
    "DESC": "DESC",
    "ASC": "ASC"
};

SqlAdapter.init = function (report) {

    DataAdapter.init.call(this, report);

    var self = this;
    self.columnName = {
        tableToReport: {},
        reportToTable: {}
    };

    self.columnFormatter = {};

    _.each(self.report.columns, function (col, fieldName) {
        self.columnName.reportToTable[fieldName] = col.column;
        self.columnName.tableToReport[col.column] = fieldName;

        var formatterName;

        if (typeof col.formatter === 'object') {
			formatterName = col.formatter.name;

			if (col.formatter.displayFormatter) {
				self.columnFormatter[fieldName + '_display'] = Formatter.get(col.formatter.displayFormatter);
			}
		} else {
			formatterName = col.formatter || fieldName;
		}

        if (Formatter.get(formatterName)) {
            self.columnFormatter[fieldName] = Formatter.get(formatterName);
        } else {
            self.columnFormatter[fieldName] = Formatter.get('default');
        }
    });
};

SqlAdapter.prepare = function () {
    this.sqlColumns = "";
    this.whereClause = "";
    this.sqlSorting = "";
    this.bindVariables = [];
};

SqlAdapter.execute = function () {
    if (!this.columns || this.columns.length === 0) {
        // select all columns if no columns are set for execution
        this.columns = _.keys(this.report.columns);
    }

    var sql = "SELECT " + this.sqlColumns + " FROM " + this.report.source.name + this.whereClause + this.sqlSorting;

    logger.info(sql, this.bindVariables);
};


SqlAdapter.configureFilter = function (filter) {
    this.whereClause = filter ? " WHERE " : "";
    this.bindVariables = [];
    this.whereClause += this.convertFilterToSQL(filter);
};

SqlAdapter.convertFilterToSQL = function (filter) {
    var i, sql = "", statements = [], colName, inVals, sqlOperator,
		filterOperator, val, formatter, reportKey,
		formattedValue, varKey, formatterConfig;

    filterOperator = key(filter);
    sqlOperator = validOperators[filterOperator];
    if (!sqlOperator) {
        throw new Error(filterOperator + " is not a valid sql operator");
    }

    // nested
    if (filterOperator === "AND" || filterOperator === "OR") {
        sql = "(";
        for (i = 0; i < filter[filterOperator].length; i++) {
            statements.push(this.convertFilterToSQL(filter[filterOperator][i]));
        }

        sql += statements.join(" " + sqlOperator + " ");

        sql += ")";
    } else {
        reportKey = filter[filterOperator][0];

        if (!this.report.columns[reportKey]) {
            throw new Error("Filter column " + reportKey + " Does not exists in report definition");
        }

        if (this.report.columns[reportKey].queryColumn) {
            colName = this.report.columns[reportKey].queryColumn;
        } else {
            colName = this.columnName.reportToTable[reportKey];
        }

        if (this.columnFormatter[filter[filterOperator][0] + '_display']) {
			formatter = this.columnFormatter[filter[filterOperator][0] + '_display'];

            if (typeof this.report.dataAdapter.report.columns[reportKey].formatter  === 'object' &&
                typeof this.report.dataAdapter.report.columns[reportKey].formatter.displayFormatter  === 'object') {
                formatterConfig = this.report.dataAdapter.report.columns[reportKey].formatter.displayFormatter;
            }
		} else {
			formatter = this.columnFormatter[filter[filterOperator][0]];

            if (typeof this.report.dataAdapter.report.columns[reportKey].formatter  === 'object'){
                formatterConfig = this.report.dataAdapter.report.columns[reportKey].formatter;
            }
		}

        if (!colName) {
            throw new Error(filter[filterOperator][0] + " column does not exists in report");
        }

        sql += colName + " " + sqlOperator + " ";

        if (filterOperator === "IN") {
            inVals = [];
            for (i = 0; i < filter[filterOperator][1].length; i++) {
                val = filter[filterOperator][1][i];
				formattedValue = formatter.viewToSource(val, formatterConfig);
				varKey = this.addVariable(formattedValue);

				if (formatter.wrappingFunction) {
					varKey = formatter.wrapWithFunction(varKey, formatter.wrappingFunction);
				} else if (this.report.columns[reportKey].function) {
					varKey = formatter.wrapWithFunction(varKey, this.report.columns[reportKey].function);
				}

                inVals.push(varKey);
            }

            sql += "(" + inVals.join(",") + ")";
        } else {
            val = filter[filterOperator][1];
			formattedValue = formatter.viewToSource(val, formatterConfig);
			varKey = this.addVariable(formattedValue);

			if (formatter.wrappingFunction) {
				varKey = formatter.wrapWithFunction(varKey, formatter.wrappingFunction);
			} else if (this.report.columns[reportKey].function) {
				varKey = formatter.wrapWithFunction(varKey, this.report.columns[reportKey].function);
			}

            sql += varKey;
        }
    }
    return sql;
};

SqlAdapter.addVariable = function (value) {
    var varName = ":" + this.bindVariables.length;
    this.bindVariables.push(value);
    return varName;
    //return ":" + (this.bindVariables.length-1).toString();
};

SqlAdapter.configureColumns = function (columns) {
    var self = this, tableColumns, reportColumns = [];

    tableColumns = _.map(columns, function (col) {

        var tableName = self.columnName.reportToTable[col];
        if (!tableName) {
            throw new Error(col + " column does not exists in report");
        }
        reportColumns.push("\"" + col + "\"");
        return tableName + " as \"" + col + "\"";
    });

    this.sqlReportColumNames = reportColumns.join(", ");
    this.sqlColumns = tableColumns.join(", ");
};

SqlAdapter.createSorting = function (sorting) {
    var self = this, sortingColumns = [];

    if (sorting) {
        _.each(sorting, function (col) {

            if (typeof col !== 'object') {
                throw new Error("invalid sort by object type");
            }

            var reportKey = _.keys(col)[0],
                tableName;

            //check if has alternative queryColumn
            if (self.report.columns[reportKey] && self.report.columns[reportKey].queryColumn) {
                tableName = self.report.columns[reportKey].queryColumn;
            } else {
                tableName = self.columnName.reportToTable[reportKey];
            }

            if (!tableName) {
                throw new Error(" sort column " + col + " does not exists in report");
            }

            if (!validOrderBy[col[reportKey]]) {
                throw new Error(col[reportKey] + " is not a valid SQL order by type");
            }

            sortingColumns.push(tableName + " " + validOrderBy[col[reportKey]]);
        });
    }

    var output = '';
    if (sortingColumns.length) {
        output = ' ORDER BY ' + sortingColumns.join(', ');
    }

    return output;
};

SqlAdapter.configureSorting = function (sorting) {
    this.sqlSorting = this.createSorting(sorting);
};

SqlAdapter.formatResults = function formatResults(error, results, callback) {
    var self = this, i;
    if (results) {
        var resultsRaw = _.cloneDeep(results);

        for (i = 0; i < results.length; i++) {
            _.each(results[i], function (fieldValue, fieldName) {
				var formatter, formatterConfig;
                //make sure the field is not hidden
                //first condition needed since scn_id is in the results but not the report meta data
                if (self.report.columns[fieldName]) {
                    if(!self.report.columns[fieldName].hidden) {
                        /** check for regular formatter */
						formatter = self.report.dataAdapter.columnFormatter[fieldName];
                        if (formatter) {
							if( typeof self.report.dataAdapter.report.columns[fieldName].formatter  === 'object') {
                                formatterConfig = self.report.dataAdapter.report.columns[fieldName].formatter;
                            }
                            // some fields are based on another fields. so in order to create consistency the formatter will always get
                            // the raw results from the DB so it will always use the same data.
                            // for example "product: (3) -> formats to -> (SW). then nearTenor and farTenor also use 'product' to determine
                            // their value, so they can't get sometimes '3' and sometimes 'SW', they will always get the raw '3'
                            results[i][fieldName] = formatter.sourceToView(fieldValue, resultsRaw[i], formatterConfig);
                        }

                        /** check for display-only formatter */
						formatter = self.report.dataAdapter.columnFormatter[fieldName + '_display'];
						if (formatter) {
                            if (typeof self.report.dataAdapter.report.columns[fieldName].formatter  === 'object' &&
                                typeof self.report.dataAdapter.report.columns[fieldName].formatter.displayFormatter  === 'object') {
                                formatterConfig = self.report.dataAdapter.report.columns[fieldName].formatter.displayFormatter;
                            } else {
                                formatterConfig = undefined;
                            }
							results[i][fieldName + '_displayValue'] = formatter.sourceToView(fieldValue, resultsRaw[i], formatterConfig);
						}
                    } else {
                        delete results[i][fieldName];
                    }
                }
            });
        }
    }
    callback(error, results);
};

module.exports = SqlAdapter;
