'use strict';
var _ = require('lodash');
var Connections = require('./connections');
var logger = require('../common/logger');

var Suggester = {
    init: function (name, properties) {
        this.name = name;
        _.extend(this, properties);
    },
    suggest: function (text, callback, user) {
        if (this.dataSource && this.dataSource.regex) {
            if (this.dataSource.regex.test(text)) {
                callback([text]);
            }
        } else {
            callback(null);
        }
    },
    minLength: 2
};

var StaticSuggester = Object.create(Suggester);

StaticSuggester.suggest = function (text, callback) {
    var results = [], i = 0, keys;
    if (!this.data) {
        this.data = this.dataSource;
    }

    text = text.toLowerCase();
    results = Array.isArray(this.data) ? [] : {};
    keys = _.keys(this.data);

    for (i = 0; i < this.data.length; i++) {
        if (this.data[i].toLowerCase().indexOf(text) > -1) {
            results.push(this.data[i]);
        }
    }

    if (results.length) {
        callback(null, results);
    } else {
        callback();
    }
};

var StaticShortSuggester = Object.create(StaticSuggester, { minLength:  { writable: false,  configurable: true, value: '1' }});

var RegexpSuggester = Object.create(Suggester);

RegexpSuggester.init = function (name, properties) {
    var regexp, self = this;
    StaticSuggester.init.apply(self, arguments);

    regexp = properties && properties.regexp ? properties.regexp : this.regex;
    if (regexp) {
        this.regexp = new RegExp(regexp);
    }
};

RegexpSuggester.suggest = function (text, callback) {
    if (this.regexp.test(text)) {
        callback(null, [this.formatSuggestion(text)]);
    } else {
        callback();
    }
};

/***
 * override this in case you'd like to format the returned suggestion string
 * @param text
 * @returns {*}
 */
RegexpSuggester.formatSuggestion = function (text) {
    return text;
};


var LomSuggester = Object.create(Suggester);
LomSuggester.lomSource = {};

//LomSuggester.init = function () {
//    var self = this;
//    StaticSuggester.init.apply(self, arguments);
//    self.data = [];
//
//    lom.at(self.dataSource.subscriptionPath).subscribe("all", function (data, info) {
//        self.data = data;
//    });
//};


var OracleSuggester = Object.create(Suggester);

OracleSuggester.suggest = function (text, callback) {
    var self = this,
        where,  sql, vars = [], suggestions = null;

    if (self.dataSource.allowCache && self.data) {
        StaticSuggester.suggest.apply(self, arguments);
    } else {
        where = "";

        if (!self.dataSource.allowCache) {
            where = " WHERE " + self.dataSource.valuesColumn + " LIKE :0";
            vars = ["%" + text + "%"];
        }

        sql = "SELECT DISTINCT " + self.dataSource.valuesColumn + " FROM " + self.dataSource.table +  where;

        Connections.acquireConnectionByType('oracle', function (err, connection) {
            if (err) {
                // handle error - this is generally the err from your
                // facdecimalPointPositiontory.create function
                logger.error("Couldn't connect to oracle", err);
            } else {
                logger.info("Selecting", sql, vars);
                connection.execute(sql, vars, function (err, results) {

                    if (err) {
                        logger.error("oracle error", err);
                    } else {
                        if (results && results.length > 0) {
                            suggestions = _.map(results, function (record) {return record[self.dataSource.valuesColumn]; });
                        }
                    }

                    if (self.dataSource.allowCache && suggestions && suggestions.length) {
                        self.data = suggestions;
                        StaticSuggester.suggest.call(self, text, callback);
                    } else {
                        callback(err, suggestions);
                    }

                    // return object back to pool
                    Connections.releaseConnectionByType(connection, 'type');
                });
            }
        });
    }
};

module.exports = {
    sources: {},
    suggesters: {},
    lomSource: {},
    suggestersByType :{
        'basic': Suggester,
        'static': StaticSuggester,
        'staticShort': StaticShortSuggester,
        'lom': LomSuggester,
        'oracle': OracleSuggester,
        'regexp': RegexpSuggester
    },
    init: function(lomSource){
        this.lomSource = lomSource;
    },
    define: function (name, properties) {
        this.sources[name] = properties;
    },
    createSuggester: function (name) {
        var filterSource = this.sources[name],
            suggester;

        if (!this.suggestersByType[filterSource.type]) {
            suggester = this.sources[name];
            suggester.init(name);
        } else {
            suggester = Object.create(this.suggestersByType[filterSource.type]);
            suggester.init(name, filterSource);
        }

        if ('lomSource' in suggester) {
            suggester.lomSource = this.lomSource;
        }

        return suggester;
    },

    getSuggester: function (name) {
        if (!this.sources[name]) {
            return null;
        }

        if (!this.suggesters[name]) {
            this.suggesters[name] = this.createSuggester(name);
        }

        return this.suggesters[name];
    }
};
