// server.js
//
// main function for activity pump application
//
// Copyright 2011-2012, StatusNet Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var connect = require('connect'),
    bcrypt  = require('bcrypt'),
    databank = require('databank'),
    express = require('express'),
    _ = require('underscore'),
    api = require('./routes/api'),
    web = require('./routes/web'),
    schema = require('./lib/schema'),
    config = require('./config'),
    params,
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject,
    db,
    app,
    port,
    hostname;

port = config.port || process.env.PORT || 8001,
hostname = config.hostname || process.env.HOSTNAME || 'localhost';

// Initiate the DB

if (_(config).has('params')) {
    params = config.params;
} else {
    params = {};
}

if (_(params).has('schema')) {
    _.extend(params.schema, schema);
} else {
    params.schema = schema;
}

db = Databank.get(config.driver, params);

// Connect...

db.connect({}, function(err) {

    var server;
    var app = module.exports = express.createServer();

    if (err) {
        console.log("Couldn't connect to JSON store: " + err.message);
	process.exit(1);
    }

    // Configuration

    app.configure(function() {

	// Templates are in public
	app.set('views', __dirname + '/public/template');
	app.set('view engine', 'utml');
	app.use(express.logger());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.query());
	app.use(express.methodOverride());
	app.use(express.favicon());
	app.use(express.session({secret: (config.secret || "activitypump")}));

        app.use(function(req, res, next) { 
            res.local('site', (config.site) ? config.site : "ActivityPump");
            res.local('owner', (config.owner) ? config.owner : "Anonymous");
            res.local('ownerurl', (config.ownerURL) ? config.ownerURL : false);
            next();
        });
	app.use(app.router);

	app.use(express.static(__dirname + '/public'));

    });

    app.configure('development', function() {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function() {
	app.use(express.errorHandler());
    });

    // Routes

    api.addRoutes(app);

    // Use "noweb" to disable Web site (API engine only)

    if (!_(config).has('noweb') || !config.noweb) {
	web.addRoutes(app);
    }

    api.setBank(db);

    app.listen(port);
});
