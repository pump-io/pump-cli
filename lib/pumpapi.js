// pumpapi.js
//
// The beating heart of a pumpin' good time
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
    PumpApp = require('./pumpapp').PumpApp,
    connect = require('connect'),
    User = require('./model/user').User,
    Edge = require('./model/edge').Edge,
    databank = require('databank'),
    _ = require('../public/javascript/underscore.js'),
    Step = require('step'),
    NoSuchThingError = databank.NoSuchThingError;

// Application controller

var PumpAPI = _.extend(_.clone(PumpApp), {
    
    bank: null,
    DEFAULT_USERS: 20,
    DEFAULT_ACTIVITIES: 20,

    initApp: function(app) {

        var i = 0, url, type;

        // Users
        app.get('/api/user/:nickname', this.reqUser, this.getUser);
        app.put('/api/user/:nickname', this.userAuth, this.reqUser, this.sameUser, this.putUser);
        app.del('/api/user/:nickname', this.userAuth, this.reqUser, this.sameUser, this.delUser);

        // Feeds

        app.post('/api/user/:nickname/feed', this.userAuth, this.reqUser, this.sameUser, this.postActivity);
        app.get('/api/user/:nickname/feed', this.reqUser, this.userStream); // XXX: privileged access when authenticated

        // Inboxen

        app.get('/api/user/:nickname/inbox', this.reqUser, this.userInbox);
        app.post('/api/user/:nickname/inbox', this.notYetImplemented);

        for (i = 0; i < Activity.objectTypes.length; i++) {

            type = Activity.objectTypes[i];

            url = '/api/' + type + '/' + ':uuid';

            // person

            app.get(url, this.requester(type), this.getter(type));
            app.put(url, this.userAuth, this.requester(type), this.authorOnly(type), this.putter(type));
            app.del(url, this.userAuth, this.requester(type), this.authorOnly(type), this.deleter(type));
        }
        
        // Activities

        app.get('/api/activity/:uuid', this.requester('activity'), this.getter('activity'));
        app.put('/api/activity/:uuid', this.userAuth, this.requester('activity'), this.actorOnly, this.putter('activity'));
        app.del('/api/activity/:uuid', this.userAuth, this.requester('activity'), this.actorOnly, this.deleter('activity'));

        // Global user list

        app.get('/api/users', this.listUsers);
        app.post('/api/users', this.createUser);

    },

    requester: function(type) {

        var Cls = Activity.toClass(type),
            pump = this;

        return function(req, res, next) {
            Cls.search({'uuid': req.params.uuid}, function(err, results) {
                if (err instanceof NoSuchThingError) {
                    pump.showError(res, err, 404);
                } else if (err) {
                    pump.showError(res, err);
                } else if (results.length === 0) {
                    pump.showError(res, new Error("Can't find a " + type + " with ID = " + req.params.uuid), 404);
                } else if (results.length > 1) {
                    pump.showError(res, new Error("Too many " + type + " objects with ID = " + req.params.uuid), 500);
                } else {
                    req[type] = results[0];
                    next();
                }
            });
        };
    },

    authorOnly: function(type) {
        var pump = this;
        return function(req, res, next) {
            var obj = req[type];

            if (obj && obj.author && obj.author.id == req.remoteUser.profile.id) {
                next();
            } else {
                pump.showError(res, new Error("Only the author can modify this object."), 403);
            }
        };
    },

    actorOnly: function(req, res, next) {
        var act = req.activity;

        if (act && act.actor && act.actor.id == req.remoteUser.profile.id) {
            next();
        } else {
            this.showError(res, new Error("Only the actor can modify this object."), 403);
        }
    },

    getter: function(type) {
        var pump = this;
        return function(req, res, next) {
            pump.showData(res, req[type]);
        };
    },

    putter: function(type) {
        var pump = this;
        return function(req, res, next) {
            var obj = req[type];
            obj.update(req.body, function(err, result) {
                if (err) {
                    pump.showError(res, err);
                } else {
                    pump.showData(res, result);
                }
            });
        };
    },

    deleter: function(type) {
        var pump = this;
        return function(req, res, next) {
            var obj = req[type];
            obj.del(function(err) {
                if (err) {
                    pump.showError(res, err);
                } else {
                    pump.showData(res, "Deleted");
                }
            });
        };
    },

    getUser: function(req, res) {
        this.showData(res, req.user);
    },

    putUser: function(req, res, next) {

        var newUser = req.body;

        req.user.update(newUser, function(err, saved) {
            if (err) {
                this.showError(res, err);
            } else {
                saved.sanitize();
                this.showData(res, saved);
            }
        });
    },

    delUser: function(req, res, next) {
        req.user.del(function(err) {
            if (err instanceof NoSuchThingError) { // unusual
                this.showError(res, err, 404);
            } else if (err) {
                this.showError(res, err);
            } else {
                this.bank.decr('usercount', 0, function(err, value) {
                    if (err) {
                        this.showError(res, err);
                    } else {
                        this.showData(res, "Deleted");
                    }
                });
            }
        });
    },

    createUser: function (req, res, next) {
        var user, pump = PumpAPI;

        Step(
            function () {
                User.create(req.body, this);
            },
            function (err, value) {
                if (err) throw err;
                user = value;
                pump.bank.prepend('userlist', 0, user.nickname, this);
            },
            function (err, userList) {
                if (err) throw err;
                pump.bank.incr('usercount', 0, this);
            },
            function (err, userCount) {
                if (err) {
                    pump.showError(res, err);
                } else {
                    // Hide the password for output
                    user.sanitize();
                    pump.showData(res, user);
                }
            }
        );
    },

    listUsers: function(req, res, next) {
        var bank = this.bank,
            start, cnt, end,
            pump = this;

        var collection = {
            displayName: "Users of this service",
            id: this.makeURL("api/users"),
            objectTypes: ["user"]
        };

        start = (req.query.offset) ? parseInt(req.query.offset, 10) : 0;
        cnt = (req.query.cnt) ? parseInt(req.query.cnt, 10) : this.DEFAULT_USERS;
        end = start + cnt;

        Step(
            function () {
                bank.read('usercount', 0, this);
            },
            function(err, totalUsers) {
                if (err) throw err;
                collection.totalCount = totalUsers;
                bank.slice('userlist', 0, start, end, this);
            },
            function(err, userIds) {
                if (err) {
                    if (err instanceof NoSuchThingError) {
                        collection.items = [];
                        pump.showData(res, collection);
                    } else {
                        throw err;
                    }
                } else if (userIds.length === 0) {
                    collection.items = [];
                    pump.showData(res, collection);
                } else {
                    bank.readAll('user', userIds, this);
                }
            },
            function(err, userMap) {
                var users = [], id, user;
                if (err) throw err;

                for (id in userMap) {
                    user = new User(userMap[id]);
                    user.sanitize();
                    users.push(user);
                }
                users.sort(function(a, b) {  
                    if (a.published > b.published) {
                        return -1;  
                    } else if (a.published < b.published) {
                        return 1;  
                    } else {
                        return 0;  
                    }
                });
                collection.items = users;
                pump.showData(res, collection);
            }
        );
    },

    postActivity: function(req, res, next) {

        var activity = new Activity(req.body), pump = PumpAPI;

        Step(
            function() {
                // First, apply the activity
                activity.apply(req.user.profile, this);
            },
            function(err) {
                if (err) throw err;
                // ...then persist...
                activity.save(this);
            },
            function(err, saved) {
                if (err) throw err;
                activity = saved;
                pump.addToOutbox(activity, req.user.profile, this);
            },
            function(err) {
                if (err) {
                    pump.showError(res, err);
                } else {
                    // ...then show (possibly modified) results.
                    pump.showData(res, activity);
                    // ...then distribute.
                    process.nextTick(function() {
                        pump.distribute(activity, function(err) {});
                    });
                }
            }
        );
    },

    addToOutbox: function(activity, person, next) {
        var bank = this.bank;

        Step(
            function() {
                bank.prepend('outbox', person.id, activity.id, this);
            },
            function(err, value) {
                if (err) throw err;
                bank.incr('outboxcount', person.id, this);
            },
            function(err, value) {
                if (err) {
                    next(err);
                } else {
                    next(null);
                }
            }
        );
    },

    userStream: function(req, res, next) {

        var collection = {
            author: req.user.profile,
            displayName: "Activities by " + (req.user.profile.displayName || req.user.nickname),
            id: this.makeURL("api/user/" + req.user.nickname + "/feed"),
            objectTypes: ["activity"],
            items: []
        };

        var start, cnt, end, pump = PumpAPI, bank = this.bank;

        start = (req.query.offset) ? parseInt(req.query.offset, 10) : 0;
        cnt = (req.query.cnt) ? parseInt(req.query.cnt, 10) : pump.DEFAULT_ACTIVITIES;
        end = start + cnt;

        Step(
            function() {
                bank.read('outboxcount', req.user.profile.id, this);
            },
            function(err, totalOutbox) {
                if (err) {
                    if (err instanceof NoSuchThingError) {
                        pump.showData(res, collection);
                    } else {
                        throw err;
                    }
                } else {
                    req.user.getStream(start, end, this);
                }
            },
            function(err, activities) {
                if (err) {
                    pump.showError(res, err);
                } else {
                    activities.forEach(function(el, i, arr) {
                        // remove internal uuid info, if any
                        delete el.actor;
                        delete el.uuid;
                    });

                    collection.items = activities;

                    pump.showData(res, collection);
                }
            }
        );
    },

    userInbox: function(req, res, next) {

        var collection = {
            author: req.user.profile,
            displayName: "Activities for " + (req.user.profile.displayName || req.user.nickname),
            id: this.makeURL("api/user/" + req.user.nickname + "/inbox"),
            objectTypes: ["activity"],
            items: []
        };
        var start, cnt, end, pump = PumpAPI, bank = this.bank;

        start = (req.query.offset) ? parseInt(req.query.offset, 10) : 0;
        cnt = (req.query.cnt) ? parseInt(req.query.cnt, 10) : this.DEFAULT_ACTIVITIES;
        end = start + cnt;

        Step(
            function() {
                bank.read('inboxcount', req.user.profile.id, this);
            },
            function(err, inboxCount) {
                if (err) {
                    if (err instanceof NoSuchThingError) {
                        pump.showData(res, collection);
                    } else {
                        throw err;
                    }
                } else {
                    collection.totalCount = inboxCount;
                    req.user.getInbox(start, end, this);
                }
            },
            function(err, activities) {
                if (err) {
                    pump.showError(res, err);
                } else {
                    collection.items = activities;
                    pump.showData(res, collection);
                }
            }
        );
    },

    notYetImplemented: function(req, res, next) {
        PumpAPI.showError(res, new Error("Not yet implemented"));
    },

    port: null,
    hostname: null,

    makeURL: function(relative) {
        if (this.port != 80) {
            return 'http://'+this.hostname+':'+this.port+'/'+relative;
        } else {
            return 'http://'+this.hostname+'/'+relative;
        }
    },

    getSchema: function() {

        var i, type, Cls, schema = {};

        schema.activity = Activity.schema;
        schema.user = User.schema;
        schema.edge = Edge.schema;
        schema.inbox = {'pkey': 'id'};
        schema.inboxcount = {'pkey': 'id'};
        schema.outbox = {'pkey': 'id'};
        schema.outboxcount = {'pkey': 'id'};
        schema.userlist = {'pkey': 'id'};
        schema.usercount = {'pkey': 'id'};
        schema.feedcount = {'pkey': 'id'};

        for (i = 0; i < Activity.objectTypes.length; i++) {
            type = Activity.objectTypes[i];
            Cls = Activity.toClass(type);
            if (Cls.schema) {
                schema[type] = Cls.schema;
            } else {
                schema[type] = {'pkey': 'id',
                                'fields': ['updated', 'published', 'displayName', 'url'],
                                'indices': ['uuid', 'author.id']};
            }
        }

        return schema;
    },
    
    distribute: function(activity, callback) {
        var bank = this.bank;

        Step(
            function() {
                Edge.search({'to.id': activity.actor.id}, this);
            },
            function(err, follows) {
                if (err) throw err;
                var i, id, group = this.group();
                for (i = 0; i < follows.length; i++) {
                    id = follows[i].from.id;
                    // FIXME: check for local/remote distribution
                    // FIXME: trim long inboxen
                    bank.prepend('inbox', id, activity.id, group());
                    bank.incr('inboxcount', id, group());
                }
            },
            function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            }
        );
    }
});

PumpAPI.userAuth = connect.basicAuth(PumpApp.checkCredentials);

// Make this more useful

_.bindAll(PumpAPI);

exports.PumpAPI = PumpAPI;
