'use strict';

var path = require("path");
var express = require('express');
var logger = require('morgan');
var allowCrossDomain = require('./allow_cross_domain_middleware');

var oracledb = require('oracledb');
var SimpleOracleDB = require('simple-oracledb');
SimpleOracleDB.extend(oracledb);

var Report = require('../');
var oracleConfig = require('./db_connections.json').oracle;
var reportsConfig = require("./reports_config.json");

var suggesters = require("./conf/suggesters.js");
var formatters = require("./conf/formatters.js");

var app = express();
app.use(logger());

// Serve client static code
app.use(allowCrossDomain('http://localhost:4000'));
app.use('/bower_components/', express.static(__dirname + '/../bower_components/'));
app.use('/lib/client/', express.static(path.join(__dirname, '../lib/client')));
app.use('/dist/client/', express.static(path.join(__dirname, '../dist/client')));
app.use('/client/', express.static(path.join(__dirname, '/client/')));
app.use('/demos/', express.static(path.join(__dirname, '/client/demos/')));
app.use('/reports_config.json', express.static(path.join(__dirname, '/reports_config.json')));

// get reports router (contains request handlers for all defined reports)
app.use("/reports", Report.getRouter());

app.get('/', function (req, res) {
	res.sendfile('./demo/client/index.html');
});

oracledb.createPool(
	oracleConfig,
	function (err, pool) {

		// this is used to acquire connections for database the report service might need
		Report.configureConnectionHandlers({
			'oracle': {
				acquire: function (callback) {
					pool.getConnection(callback);
				},
				release: function (connection) {
					connection.release(function (err) {
						if (err) {
							console.error(err.message);
						}
					});
				}
			}
		});
	}
);

var formatterName;
for (formatterName in formatters) {
	Report.defineFormatter(formatterName, formatters[formatterName]);
}

var allSuggestersNames = '';
for (var suggesterName in suggesters) {
	if(allSuggestersNames !== '') {
		allSuggestersNames += ', ';
	}
	allSuggestersNames += suggesterName;

	Report.defineSuggester(suggesterName , suggesters[suggesterName]);
}
if(allSuggestersNames !== '') {
	console.log("defined suggesters: " + allSuggestersNames);
} else {
	console.log("no suggesters were defined");
}

// defining reports manually (easier code to read and search for)
console.log("defining report deals");
Report.define('deals', reportsConfig.deals);
// bad practice. this way the reports are un-searchable
/*for (var reportName in reportsConfig) {
	console.log("defining report", reportName);
	Report.define(reportName, reportsConfig[reportName]);
}*/

app.listen(4000, function () {
	console.log("listening on port 4000");
});
