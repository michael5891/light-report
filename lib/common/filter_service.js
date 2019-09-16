'use strict';

function key(obj) {
    return Object.keys(obj)[0];
}

var evaluators = {
    _parseStatementValues: function (filterNodes, record) {
        var statement = filterNodes[0];
        return {
            recordValue: record[statement.c],
            filterValue: statement.v
        };
    },
    "OR": function (nodes, record) {
        var i, operator;
        for (i = 0; i < nodes.length; i++) {
            operator = key(nodes[i]);
            if (evaluators[operator](nodes[i][operator], record)) {
                return true;
            }
        }

        return false;
    },
    "AND": function (nodes, record) {
        var i, operator;
        for (i = 0; i < nodes.length; i++) {
            operator = key(nodes[i]);
            if (!evaluators[operator](nodes[i][operator], record)) {
                return false;
            }
        }

        return true;
    },
    "IN": function (nodes, record) {
        var i,
            key = nodes[0],
            val = nodes[1],
            recordVal = record[key];

        for (i = 0; i < val.length; i++) {
            if (val[i] === recordVal) {
                return true;
            }
        }

        return false;
    },
    "=": function (nodes, record) {
        var key = nodes[0],
            val = nodes[1],
            recordVal = record[key];

        return recordVal === val;
    },
    ">=": function (nodes, record) {
        var key = nodes[0],
            val = nodes[1],
            recordVal = record[key];

        if (isNaN(val)) { throw val + " is not a number"}
        if (isNaN(recordVal)) { throw recordVal + " is not a number"}

        return recordVal >= val;
    },
    "<=": function (nodes, record) {
        var key = nodes[0],
            val = nodes[1],
            recordVal = record[key];

        if (isNaN(val)) { throw val + " is not a number"}
        if (isNaN(recordVal)) { throw recordVal + " is not a number"}

        return recordVal <= val;
    },
    ">": function (nodes, record) {
        var key = nodes[0],
            val = nodes[1],
            recordVal = record[key];

        if (isNaN(val)) { throw val + " is not a number"}
        if (isNaN(recordVal)) { throw recordVal + " is not a number"}

        return recordVal > val;
    },
    "<": function (nodes, record) {
        var key = nodes[0],
            val = nodes[1],
            recordVal = record[key];

        if (isNaN(val)) { throw val + " is not a number"}
        if (isNaN(recordVal)) { throw recordVal + " is not a number"}

        return recordVal < val;
    }
};

var FilterService = {

    createFilterFromSearchMap: function(map) {
        var hasProps = false;
        for (var bar in map) {
            if (map.hasOwnProperty(bar)) {
                hasProps = true;
                break;
            }
        }

        if(!hasProps)
            return undefined;

        var values = [],
            i, columns = Object.keys(map);

        for (i = 0; i < columns.length; i++) {
            values.push(this.createStatementFromMapValues(columns[i], map[columns[i]]));
        }

        if (columns.length === 1) {
            return values[0];
        } else {
            return {"AND": values};
        }
    },

    createStatementFromMapValues: function (columnName, values) {
        var isInStatement = values.length > 1,
            operator = isInStatement ? "IN" : "=",
            statement = {};

        statement[operator] = [columnName, (isInStatement ? values : values[0])];
        return statement;
    },

    createSearchMapFromFilter: function(filter) {
        var map = {}, statement, i, operator = key(filter);

        if (operator === "AND") {
            for (i = 0; i < filter[operator].length; i++) {
                statement = filter[operator][i];
                map[key(statement)] = statement[key(statement)];
            }
        } else {
            map[filter[operator][0]] = Array.isArray(filter[operator][0]) ? filter[operator][1] : [filter[operator][1]];
        }

        return map;
    },

    getSearchMapValue: function (searchMap) {
        var value = 0, i,
            keys = Object.keys(searchMap);

        value = keys.length;
        for (i = 0; i < keys.length; i++) {
            value -= searchMap[key].length;
        }

        return value;
    },

    suggest: function (text, records) {
        var i = 0, keys = [], keyIndex, found = {};

        text = text.toLowerCase();

        if (records[0]) {
            keys = Object.keys(records[0]);

            for (keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                found[keys[keyIndex]] = {};
            }
        }

        for (i = 0; i < records.length; i++) {
            for (keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                if (records[i].toLowerCase()) {

                }
            }
        }
    },

    evaluate: function (filter, record) {
        var operator = key(filter);
        return evaluators[operator](filter[operator], record);
    },

    filterRecords: function(filter, records) {
        var i, filtered = [];

        if (!Array.isArray(records)) {
            throw "records must be an Array";
        }

        for (i = 0; i < records.length; i++) {
            if (this.evaluate(filter, records[i])) {
                filtered.push(records[i]);
            }
        }

        return filtered;
    }
};

module.exports = FilterService;

//if (window) {
//    window.FilterService = FilterService;
//}
