'use strict';
var _ = require("lodash");

var DataAdapter = {
    init: function (report) {
        this.report = report;
        this.type = report.source.adapter;
    },
    prepare: function () {
		return;
    },
    execute: function (callback) {
        callback(new Error("execute not implemented"), null);
    },

    configureFilter: function (filter) {
        //implement this method to prepare the where clause when it changes etc..
		return filter;
    },

    configureColumns: function (columns) {
        //implement this method to prepare the columns to select it changes etc..
		return columns;
    },

    configureSorting: function (sorting) {
        //implement this method to prepare the columns to select it changes etc..
		return sorting;
    }
};

Object.defineProperties(DataAdapter, {
    "filter": {
        set: function (filter) {

            if (filter !== this._filter || !_.isEqual(filter, this._filter)) {
                this._filter = filter;
                this.configureFilter(this._filter);
            }

        },
        get: function () {
            return this._filter;
        }
    },
    "columns": {
        set: function (columns) {
            if (columns !== this._filter || !_.isEqual(columns, this._columns)) {
                this._columns = columns;
                this.configureColumns(this._columns);
            }
        },
        get: function () {
            return this._columns;
        }
    },
    "sorting": {
        set: function (sorting) {
            if (sorting !== this._sorting || !_.isEqual(sorting, this._sorting)) {
                this._sorting = sorting;
                this.configureSorting(this._sorting);
            }
        },
        get: function () {
            return this._sorting;
        }
    },
    "executionParams" : {
        set: function (executionParams) {
            this._executionParams = executionParams;

            //if (executionParams.columns) {
                this.columns = executionParams.columns;
            //}

            //if (executionParams.filter) {
                this.filter = executionParams.filter;
            //}

            //if (executionParams.sortBy) {
                this.sorting = executionParams.sortBy;
            //}

            //if (executionParams.fromRow) {
                this.fromRow = executionParams.fromRow;
            //}

            //if (executionParams.rows) {
                this.rows = executionParams.rows;
            //}

            this.maxRows = executionParams.maxRows || 300;
        },
        get: function () {
            return this._executionParams || {};
        }
    }
});

module.exports = DataAdapter;
