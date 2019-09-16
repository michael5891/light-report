'use strict';

var SQLAdapter = require('./sql');
var _ = require('lodash');
var Connections = require('../connections');
var logger = require('../../common/logger');
var EventEmitter = require('events').EventEmitter;

var OracleAdapter = Object.create(SQLAdapter);

OracleAdapter.executeImpl = function (stream, callback) {
    var sql, self = this, scn, fromRow, rows;

    if (!this.columns || this.columns.length === 0) {
        // select all columns if no columns are set for execution
        this.columns = _.keys(this.report.columns);
    }

    fromRow = this.fromRow || 0;
    rows = Math.min(this.maxRows || 300, this.rows || 100);

    //scn = self.executionParams.scnId && !isNaN(self.executionParams.scnId) ? " AS OF SCN " + self.addVariable(self.executionParams.scnId) : "";
    scn = self.executionParams.scnId && !isNaN(self.executionParams.scnId) ? " AS OF SCN " + self.executionParams.scnId : "";

    sql = "SELECT " + this.sqlColumns + ", dbms_flashback.get_system_change_number as \"scn_id\"" +
        " FROM " + this.report.source.name + scn;

    if (this.sqlSorting.length > 0) {
        sql += this.whereClause + this.sqlSorting;
    }
    else if (this.whereClause.length > 0) {
        sql += this.whereClause;
    }

    sql = "SELECT "  + this.sqlReportColumNames + ", \"scn_id\" FROM (SELECT rownum r, t.* from (" + sql + ") t WHERE rownum <= " + self.addVariable(fromRow + rows) + ") WHERE r > "  + self.addVariable(fromRow);

    Connections.acquireConnectionByType(self.type, function (err, connection) {
        if (err) {
            // handle error - this is generally the err from your
            // factory.create function
            logger.error("Couldn't connect to oracle", err);
        } else {
            var queryOptions = {
                maxRows: rows
            };

            var queryStream;
            if (stream) {
                queryStream = new EventEmitter();
                queryOptions.splitResults = true;

                callback(null, queryStream);
            }

            logger.info("Selecting", sql, self.bindVariables, queryOptions);
            connection.query(sql, self.bindVariables, queryOptions, function (queryError, results) {
                if (queryError) {
                    logger.error("[WebReports][Execute] error executing report select: ", {
                        SQL: sql,
                        VARS: self.bindVariables
                    });
                    logger.error("[WebReports][Execute] Oracle Error", queryError);

                    Connections.releaseConnectionByType(connection, self.type); // return object back to pool
                }
                else {
                    self.formatResults(queryError, results, function(formatError, formatResults) {
                        if ((!stream) || formatError || (formatResults.length === 0)) {
                            Connections.releaseConnectionByType(connection, self.type); // return object back to pool
                        }

                        if (queryStream) {
                            if (formatError) {
                            	queryStream.emit('error', formatError);
							} else if (formatResults.length) {
								queryStream.emit('data', formatResults);
							} else {
								queryStream.emit('end');
							}
                        } else {
                            callback(formatError, formatResults);
                        }
                    });
                }
            });
        }
    });

};

OracleAdapter.execute = function (callback) {
    this.executeImpl(false, callback);
};

OracleAdapter.stream = function (callback) {
    this.executeImpl(true, callback);
};

module.exports = OracleAdapter;
