'use strict';
var _ = require('lodash');
var hogan = require('hogan.js');
var Promise = require('promise');
var express = require('express');
var compress = require('compression');
var Suggesters = require('./suggester.js');
var Connections = require('./connections.js');
var reportRouter = express.Router();
var connectionHandlersByType = {};
var logger = require('../common/logger');
var formatters = require('./formatter.js');
var json2csv = require('json2csv');
var filterService = require('../common/filter_service');

function key(obj) {
    return Object.keys(obj)[0];
}

/**
 * Represents a report.
 * @constructor
 * @param {string} name - The name of the report (identifier for later use, avoid spaces).
 * @param {object} properties - properties of report, defines columns .
 *      @property {object} columns
 * @param {function} beforeQuery - function to run before querying the DB.
 * @param {function} afterQuery - function to run after querying the DB.
 */
function Report(name, properties, beforeQuery, afterQuery) {
    var self = this;

    _.extend(self, properties);
    self.name = name;
    self.beforeQuery = beforeQuery;
    self.afterQuery = afterQuery;

    self.loadAdapter();

    self.suggesters = {};
    _.each(self.columns, function (col, key) {
        var suggesterName = col.suggester || key;
        if (Suggesters.getSuggester(suggesterName)) {
            self.suggesters[key] = Suggesters.getSuggester(suggesterName);
        }
    });

    if(typeof self.timezone === 'number') {
        //WARNING: formatters is not instantiated for each report. meaning that defining multiple reports
        //with different timezones for each will overwrite one another timezone!
        formatters.setTimezone(self.timezone);
    }
}

Report.prototype.createAuditRecord = function (clientExecutionParams, context) {
    var record = {
        report: this.name,
        executionTime: {
            start: context.datetime,
            end: undefined,
            duration: undefined
        },
        params: clientExecutionParams
    };

    if (context.user) {
        record.user = {
            name: context.user.name,
            id: context.user.id,
            floor: context.user.floor
        };
    }

    return record;
};

Report.prototype.audit = function (auditRecord) {
    logger.info('Audit', JSON.stringify(auditRecord));
};

Report.prototype.loadAdapter = function () {
    this.dataAdapter = Object.create(require('./adapters/' + this.source.adapter));
    this.dataAdapter.init(this);
};

Report.prototype.execute = function (clientExecutionParams, context, middlewareAfterQuery) {

    var executor = Object.create(this.dataAdapter),
        executionParams = {},
        self = this,
        auditRecord,
        error;

    executor.prepare();

    //prevent UI from overriding max rows configuration of report
    delete clientExecutionParams.maxRows;

    // add defaults if not provided
    _.defaults(clientExecutionParams, this.executionParams.defaults);

    auditRecord = self.createAuditRecord(clientExecutionParams, context);

    _.extend(executionParams, clientExecutionParams);

    executionParams = this.extendExecutionParams(executionParams, context);

    try {
        executor.executionParams = _.extend(_.extend({}, executionParams), {rows: Number(executionParams.rows) + 1});
    } catch (e) {
        //logger.error(e);
        error = e;
    }

    var writeAudit = function () {
        auditRecord.executionTime.end = new Date();
        auditRecord.executionTime.duration = auditRecord.executionTime.end - auditRecord.executionTime.start;
        self.audit(auditRecord);
    };

    return new Promise(function (resolve, reject) {

        if (error) {
            reject(error);
            return;
        }

        if (context.stream && executor.stream) { //if streaming requested and adapter supports streaming
            //do async work
            executor.stream(function (err, stream) {
                if (err || error) {
                    reject(err || error);
                } else {
                    var streamErrorFound = false;
                    var onError = function (streamError) {
                        streamErrorFound = true;
                        reject(streamError);

                        writeAudit();
                    };

                    var firstCall = true;
                    var options = {
                        firstCall: true
                    };
                    stream.on('data', function (data) {
                        options.fields = self.formatStreamResponse(data, clientExecutionParams, context.httpResponse, options, function (formatError, streamResult) {
                            if (formatError) {
                                onError(formatError);
                            } else {
                                context.httpResponse.write(streamResult, {
                                    encoding: 'utf8'
                                });
                            }
                        });

                        options.firstCall = false;
                    });

                    stream.on('error', onError);

                    stream.on('end', function () {
                        if (!streamErrorFound) {
                            resolve({});

                            writeAudit();
                        }
                    });
                }
            });
        } else {
            //do async work
            executor.execute(function (err, results) {
                if (err || error) {
                    reject(err || error);
                } else {
                    if (clientExecutionParams.additionalFilter && Object.keys(clientExecutionParams.additionalFilter).length && results) {
                        results = filterService.filterRecords(clientExecutionParams.additionalFilter, results);
                    }

                    if(middlewareAfterQuery) {
                        results = middlewareAfterQuery(results, clientExecutionParams);
                    }

                    self.formatResponse(results, clientExecutionParams, context.httpResponse, function (error, response) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(response);
                        }
                    });
                }

                writeAudit();
            });
        }
    });
};

Report.prototype.formatCSV = function (columns, data, callback) {
    var fields;
    if (!Array.isArray(columns)) {
        fields = Object.keys(columns);
        var index;
        var fieldNames = [];
        for (index = 0; index < fields.length; index++) {
            fieldNames.push(columns[fields[index]].label);
        }

        json2csv({
            data: data,
            hasCSVColumnTitle: true,
            fields: fields,
            fieldNames: fieldNames
        }, callback);
    } else {
        fields = columns;

        json2csv({
            data: data,
            hasCSVColumnTitle: false,
            fields: fields
        }, callback);
    }

    return fields;
};

Report.prototype.formatStreamResponse = function (results, executionParams, httpResponse, options, callback) {
    var self = this;

    if (options.firstCall) {
        if (executionParams.meta !== false) {
            options.columns = {};

            _.each(self.columns, function (col, key) {
                if (!col.hidden) {
                    options.columns[key] = _.pick(col, 'label', 'sort', 'filterable', 'type');
                }
            });
        }

        if (executionParams.outputFile) {
            httpResponse.attachment(executionParams.outputFile);
        }
    }

    var state;
    if (executionParams.outputFormat) {
        switch (executionParams.outputFormat) {
            case 'csv':
                if (options.firstCall) {
                    httpResponse.set('Content-Type', 'text/csv');
                }

                state = self.formatCSV(options.fields || options.columns, results, callback);
                break;
        }
    }

    return state;
};

Report.prototype.formatResponse = function (results, executionParams, httpResponse, callback) {
    var self = this;

    var response = {data: results},
        rowsSelected = results ? results.length : 0;

    if (results && results.length && results[0].scn_id) {
        response.scnId = results[0].scn_id;
    }

    _.each(response.data, function (record) {
        delete record.scn_id;
    });

    response.requestParams = executionParams;
    if (rowsSelected > executionParams.rows) {
        response.hasNext = true;
        response.rows = executionParams.rows;
        response.data.splice(rowsSelected - 1, 1);
    } else {
        response.hasNext = false;
        response.rows = rowsSelected;
    }

    //set to GMT 0;
    response.executionTime = Date.now();

    if (executionParams.meta !== false) {
        response.columns = {};

        _.each(this.columns, function (col, key) {
            if(!col.hidden && key.indexOf('_displayValue') === -1) {
                response.columns[key] = _.pick(col, 'label', 'sort', 'filterable', 'type');
            }
        });
    }

    var runCallback = true;

    if (executionParams.outputFile) {
        httpResponse.attachment(executionParams.outputFile);
    }

    if (executionParams.outputFormat) {
        switch (executionParams.outputFormat) {
            case 'csv':
                runCallback = false;
                self.formatCSV(response.columns, response.data, callback);
                break;
        }
    }

    if (runCallback) {
        callback(null, response);
    }
};

Report.prototype.evaluateFilter = function (filter, context) {
    var filterString = JSON.stringify(filter);

    var _template = _.template(filterString, {
        interpolate: /\$\{\{(.+?)\}\}/g
    });


    return JSON.parse(_template(context));
};

Report.prototype.interpolateFilter = function (filter, context) {

    var filterString = JSON.stringify(filter),
        template = hogan.compile(filterString);

    return JSON.parse(template.render(context));
};

Report.prototype.extendExecutionParams = function (executionParams, context) {
    var filter;


    if (this.executionParams && this.executionParams.extend) {

        if (this.executionParams.extend.filter) {
            if (executionParams.filter) {
                filter = this.interpolateFilter(executionParams.filter, context || {});
            }
            executionParams.filter = this.extendFilter(filter, this.evaluateFilter(this.executionParams.extend.filter, context || {}));
        }

        if (this.executionParams.extend.sortBy) {
            executionParams.sortBy = this.extendSortBy(executionParams.sortBy, this.executionParams.extend.sortBy);
        }


    }

    return executionParams;
};

Report.prototype.extendFilter = function (base, extention) {

    var operator;

    if (!base) {
        return extention;
    }

    operator = key(base);

    if (operator === 'AND') {
        base[operator].push(extention);
    } else {
        base = {'AND': [base, extention]};
    }

    return base;
};

Report.prototype.extendSortBy = function (base, extention) {
    var i = 0, found = false, name;

    if (!base) {
        return extention;
    }

    while (extention.length) {
        found = false;
        name = _.keys(extention[0])[0];
        for (i = 0; i < base.length && !found; i++) {
            if (base[i][name]) {
                found = true;
                base[i][name] = extention[0][name];
            }
        }

        if (found) {
            base.push(extention[0]);
        }

        extention.pop();
    }

    return base;
};

Report.prototype.suggest = function (text, user, alreadySelectedColumns, callback) {
    var self = this,
        alreadySelectedColumnsArr = alreadySelectedColumns && alreadySelectedColumns.length > 0 ? alreadySelectedColumns.split(',') : [],
        waiting = _.keys(self.suggesters).length - alreadySelectedColumnsArr.length,
        suggestions = {};

    return new Promise(function (resolve, reject) {
        if (text && text.length > 0 && waiting) {
            _.each(self.suggesters, function (suggester, columnName) {
                //skip already selected columns
                if (alreadySelectedColumnsArr.indexOf(columnName) === -1) {
                    if (suggester.minLength <= text.length) {
                        suggester.suggest(text, function (err, results) {
                            if (results && results.length > 0) {
                                results = results.length < 20 ? results : results.slice(0, 19);
                                suggestions[columnName] = {
                                    results: results,
                                    label: self.columns[columnName].label
                                };
                            }
                            waiting --;
                        }, user);
                    } else {
                        waiting --;
                    }
                    if (waiting <= 0) {
                        resolve(suggestions);
                    }
                }
            });
        } else {
            resolve(suggestions);
        }
    });
};

/**
 * handle routings
 */
let _reports = {};
let getByName = function getByName(name) {
    if (_reports[name]) {
        return Object.create(_reports[name]);
    }
    return null;
};

let onReportRequest = function (req, res) {
    let report;
    if (req.params.reportName) {
        report = getByName(req.params.reportName); //gets a duplicate
    }
    if (!report) {
        res.status(404).end();
        return;
    }

    var execute;

    logger.info('GET report', report.name);
    var executionParams = {}, context = {};

    if (req.query.columns) {
        executionParams.columns = typeof req.query.columns === 'object' ? req.query.columns : JSON.parse(req.query.columns);
    }

    if (req.query.sortBy) {
        executionParams.sortBy = typeof req.query.sortBy === 'object' ? req.query.sortBy : JSON.parse(req.query.sortBy);
    }

    if (req.query.filter) {
        executionParams.filter = typeof req.query.filter === 'object' ? req.query.filter : JSON.parse(req.query.filter);
        logger.info(JSON.stringify(executionParams.filter, 4, 4));
    }

    if (req.query.scnId) {
        executionParams.scnId = parseInt(req.query.scnId, 10);
    }

    if (req.query.fromRow) {
        executionParams.fromRow = parseInt(req.query.fromRow, 10);
    }

    if (req.query.rows) {
        executionParams.rows = parseInt(req.query.rows, 10);
    }

    if (req.query.scn) {
        executionParams.scnId = parseInt(req.query.scn, 10);
    }

    if (req.query.meta) {
        executionParams.meta = JSON.parse(req.query.meta);
    }

    if (req.query.clientParams) {
        executionParams.clientParams = typeof req.query.clientParams === 'object' ? req.query.clientParams : JSON.parse(req.query.clientParams);
    }

    executionParams.outputFormat = 'json';
    if (req.query.outputFormat) {
        executionParams.outputFormat = req.query.outputFormat;
    }

    context.stream = false;
    if (req.query.outputFile) {
        executionParams.outputFile = req.query.outputFile;
        context.stream = true;
    }

    if(report.afterQuery) {
        context.stream = false;
    }

    context.datetime = new Date();
    context.httpResponse = res;

    execute = function executeReport(params, context) {
        report.execute(params || executionParams, context, report.afterQuery).then(function (results){
            if (context.stream) {
                res.end();
            } else {
                res.send(results);
            }
        }, function (error) {
            logger.error(error, error.stack);
            res.status(500).send(error.message ? error.message : error);
        });
    };

    if (report.beforeQuery) {
        report.beforeQuery.call(report, req, res, executionParams, context, execute);
    } else {
        execute(executionParams, context);
    }
};
let onReportSuggestionRequest = function (req, res) {
    let report;
    if (req.params.reportName) {
        report = getByName(req.params.reportName); //gets a duplicate
    }
    if (!report) {
        res.status(404).end();
        return;
    }

    report.suggest(req.query.query, req.user, req.query.alreadySelectedColumns).then(function (suggestions) {
        res.send(suggestions);
    });
};

reportRouter.use(compress());
reportRouter.get('/:reportName', onReportRequest);
reportRouter.get('/:reportName/suggest', onReportSuggestionRequest);

Connections.setAcquireConnectionCallback(function (give, type) {
    if (connectionHandlersByType[type]) {
        connectionHandlersByType[type].acquire(give);
    }
});

Connections.setReleaseConnectionCallback(function (connection, type) {
    if (connectionHandlersByType[type]) {
        connectionHandlersByType[type].release(connection);
    }
});

module.exports = {
    init: function(lomSource){
        Suggesters.init(lomSource);
    },
    getByName: getByName,
    defineSuggester: function (name, properties) {
        Suggesters.define(name, properties);
    },
    defineFormatter: function (name, formatter) {
        formatters.define(name, formatter);
    },
    getRouter: function () {
        return reportRouter;
    },
    define: function (name, properties, middlewareBeforeQuery, middlewareAfterQuery) {
        _reports[name] = new Report(name, properties, middlewareBeforeQuery, middlewareAfterQuery);
        return this.getByName(name); //returns a clone
    },
    configureConnectionHandlers: function (handlers) {
        _.extend(connectionHandlersByType, handlers);
    },
    onReportRequest: onReportRequest,
    onReportSuggestionRequest: onReportSuggestionRequest,
    formatters: formatters,
    suggesters: Suggesters,
    logger: logger
};
