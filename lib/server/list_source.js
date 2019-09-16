'use strict';

var ListSource = {};
ListSource.getValueByKey = function (key) {

};

ListSource.getKeyByValue = function (value) {

};

ListSource.populate = function (params, callback) {
    this._data = {};
    callback(null, this._data);
};

ListSource.getData = function (params, callback) {
    if (!this._data) {
        this.populate(params, callback);
    } else {

    }

};


module.exports = ListSource;