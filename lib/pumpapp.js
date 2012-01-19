// pumpweb.js
//
// Spurtin' out pumpy goodness all over your browser window
//
// Copyright 2011, StatusNet Inc.
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

var Activity = require('./model/activity').Activity,
    User = require('./model/user').User,
    databank = require('databank'),
    Step = require('step'),
    _ = require('../public/javascript/underscore.js'),
    bcrypt  = require('bcrypt'),
    fs = require('fs'),
    NoSuchThingError = databank.NoSuchThingError;

var PumpApp = {

    reqUser: function(req, res, next) {
        var pump = this;
        Step(
            function() {
                User.get(req.params.nickname, this);
            },
            function(err, user) {
                if (err) throw err;
                user.sanitize();
                req.user = user;
                user.expand(this);
            },
            function(err, user) {
                if (err instanceof NoSuchThingError) {
                    pump.showError(res, err, 404);
                } else if (err) {
                    pump.showError(res, err);
                } else {
                    req.person = user.person;
                    next();
                }
            }
        );
    },

    sameUser: function(req, res, next) {
        if (!req.remoteUser ||
            !req.user ||
            req.remoteUser.nickname != req.user.nickname) {
            this.showError(res, new Error("Not authorized"), 403);
        } else {
            next();
        }
    },

    showError: function(res, err, code) {
        if (!code) {
            code = 500;
        }
        console.error(err.message);
        console.error(err.stack);
        res.writeHead(code, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(err.message));
    },

    showData: function(res, data) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
    },

    maybeAuth: function(req, res, next) {

        var pump = this;

        Step(
            function() {
                pump.getCurrentUser(req, res, this);
            },
            function(err, user) {
                if (err) {
                    pump.showError(res, err);
                } else {
                    req.remoteUser = user;
                    next();
                }
            }
        );

    },

    mustAuth: function(req, res, next) {
        var pump = this;

        Step(
            function() {
                pump.getCurrentUser(req, res, this);
            },
            function(err, user) {
                if (err) {
                    pump.showError(res, err);
                } else if (!user) {
                    pump.showError(res, new Error("No logged-in user."), 403);
                } else {
                    req.remoteUser = user;
                    next();
                }
            }
        );
    },

    noUser: function(req, res, next) {

        var pump = this;

        Step(
            function() {
                pump.getCurrentUser(req, res, this);
            },
            function(err, user) {
                if (err) {
                    pump.showError(res, err);
                } else if (user) {
                    pump.showError(res, new Error("Already logged in."), 403);
                } else {
                    req.remoteUser = null;
                    next();
                }
            }
        );
    },

    getCurrentUser: function(req, res, callback) {
        
        var pump = this;

        if (req.session.nickname) {
            pump.getSessionUser(req, res, callback);
        } else {
            callback(null, null);
        }
    },

    getSessionUser: function(req, res, callback) {
        Step(
            function() {
                User.get(req.session.nickname, this);
            },
            function(err, user) {
                if (err) {
                    callback(err, null);
                } else {
                    user.sanitize();
                    callback(null, user);
                }
            }
        );
    },

    checkCredentials: function(nickname, password, callback) {
	var user = null;

        Step(
            function() {
                User.get(nickname, this);
            },
            function(err, result) {
                if (err) throw err;
                user = result;
                bcrypt.compare(password, user.passwordHash, this);
            },
            function(err, res) {
                if (err) {
                    callback(err, null);
                } else if (!res) {
                    callback(null, null);
                } else {
                    // Don't percolate that hash around
                    user.sanitize();
                    callback(null, user);
                }
            }
	);
    }
};

exports.PumpApp = PumpApp;
