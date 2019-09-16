'use strict'; 

var logger = console;

var wrapper = {
    setImpl: function (impl) {
        logger = impl;
    }
};

['info', 'warn', 'error'].forEach(function create(name) {
    wrapper[name] = function () {
        logger[name].apply(logger, arguments);
    };
});

module.exports = wrapper;
