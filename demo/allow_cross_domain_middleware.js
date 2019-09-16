'use strict';
module.exports = function (address) {
    return function(req, res, next) {
        res.header('Access-Control-Allow-Origin', address || '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
        res.header('Access-Control-Allow-Credentials', true);
        next();
    };
};