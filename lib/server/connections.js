'use strict';

var logger = require('../common/logger');

var connections = {
    _connectionCallback: function (connectionCallback, type) {
        logger.error("Connection handler is not defined for report service");
		return {connectionCallback:connectionCallback, type:type};
    },

    _releaseConnectionCallback: function (connection, type) {
        logger.error("release connection handler is not defined for report service");
		return {connection:connection, type:type};
    },

    setAcquireConnectionCallback: function (connectionCallback) {
        connections._connectionCallback = connectionCallback;
    },

    setReleaseConnectionCallback: function (releaseCallback) {
        connections._releaseConnectionCallback = releaseCallback;
    },
    acquireConnectionByType: function (type, callback) {
        connections._connectionCallback(callback, type);
    },
    releaseConnectionByType: function (connection, type) {
        connections._releaseConnectionCallback(connection, type);
    }
};

module.exports = connections;
