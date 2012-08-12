// bcc-api-test.js
//
// Test visibility of bcc and bto
//
// Copyright 2012, StatusNet Inc.
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

var assert = require("assert"),
    vows = require("vows"),
    Step = require("step"),
    _ = require("underscore"),
    OAuth = require("oauth").OAuth,
    httputil = require("./lib/http"),
    oauthutil = require("./lib/oauth"),
    setupApp = oauthutil.setupApp,
    register = oauthutil.register,
    accessToken = oauthutil.accessToken,
    newCredentials = oauthutil.newCredentials,
    newPair = oauthutil.newPair,
    newClient = oauthutil.newClient;

var ignore = function(err) {};

var suite = vows.describe("Post note API test");

var makeCred = function(cl, pair) {
    return {
        consumer_key: cl.client_id,
        consumer_secret: cl.client_secret,
        token: pair.token,
        token_secret: pair.token_secret
    };
};

// A batch for testing the visibility of bcc and bto addressing

suite.addBatch({
    "When we set up the app": {
        topic: function() {
            setupApp(this.callback);
        },
        teardown: function(app) {
            if (app && app.close) {
                app.close();
            }
        },
        "it works": function(err, app) {
            assert.ifError(err);
        },
        "and we register a client": {
            topic: function() {
                newClient(this.callback);
            },
            "it works": function(err, cl) {
                assert.ifError(err);
                assert.isObject(cl);
            },
            "and a user posts an activity with bcc": {
                topic: function(cl) {
                    var cb = this.callback,
                        users = {gilligan: {}, skipper: {}, professor: {}};

                    Step(
                        function() {
                            register(cl, "gilligan", "sailorhat", this.parallel());
                            register(cl, "skipper", "coconuts", this.parallel());
                            register(cl, "professor", "radio", this.parallel());
                        },
                        function(err, user1, user2, user3) {
                            if (err) throw err;
                            users.gilligan.profile = user1.profile;
                            users.skipper.profile   = user2.profile;
                            users.professor.profile = user3.profile;
                            accessToken(cl, {nickname: "gilligan", password: "sailorhat"}, this.parallel());
                            accessToken(cl, {nickname: "skipper", password: "coconuts"}, this.parallel());
                            accessToken(cl, {nickname: "professor", password: "radio"}, this.parallel());
                        },
                        function(err, pair1, pair2, pair3) {
                            var url, cred, act;
                            if (err) throw err;
                            users.gilligan.pair = pair1;
                            users.skipper.pair = pair2;
                            users.professor.pair = pair3;
                            cred = makeCred(cl, pair1);
                            act = {
                                verb: "post",
                                bcc: {
                                    id: users.skipper.profile.id,
                                    objectType: "person"
                                },
                                object: {
                                    objectType: "note",
                                    content: "Sorry!"
                                }
                            };
                            url = "http://localhost:4815/api/user/gilligan/feed";
                            httputil.postJSON(url, cred, act, this);
                        },
                        function(err, doc, response) {
                            if (err) {
                                cb(err, null, null);
                            } else {
                                cb(null, doc, users);
                            }
                        }
                    );
                },
                "it works": function(err, doc, users) {
                    assert.ifError(err);
                },
                "and another user views the activity": {
                    topic: function(doc, users, cl) {
                        var cred = makeCred(cl, users.professor.pair),
                            callback = this.callback,
                            url = doc.id;
                        
                        httputil.getJSON(url, cred, function(err, act, resp) {
                            callback(err, act);
                        });
                    },
                    "it works": function(err, act) {
                        assert.ifError(err);
                    },
                    "they can't see the bcc": function(err, act) {
                        assert.ifError(err);
                        assert.isObject(act);
                        assert.isFalse(act.hasOwnProperty("bcc"));
                    }
                },
                "and the author views the activity": {
                    topic: function(doc, users, cl) {
                        var cred = makeCred(cl, users.gilligan.pair),
                            callback = this.callback,
                            url = doc.id;
                        
                        httputil.getJSON(url, cred, function(err, act, resp) {
                            callback(err, act);
                        });
                    },
                    "it works": function(err, act) {
                        assert.ifError(err);
                    },
                    "they can see the bcc": function(err, act) {
                        assert.ifError(err);
                        assert.isObject(act);
                        assert.isTrue(act.hasOwnProperty("bcc"));
                    }
                }
            },
            "and a user posts an activity with bto": {
                topic: function(cl) {
                    var cb = this.callback,
                        users = {maryanne: {}, ginger: {}, mrhowell: {}};

                    Step(
                        function() {
                            register(cl, "maryanne", "gingham", this.parallel());
                            register(cl, "ginger", "glamour", this.parallel());
                            register(cl, "mrhowell", "wealth", this.parallel());
                        },
                        function(err, user1, user2, user3) {
                            if (err) throw err;
                            users.maryanne.profile = user1.profile;
                            users.ginger.profile   = user2.profile;
                            users.mrhowell.profile = user3.profile;
                            accessToken(cl, {nickname: "maryanne", password: "gingham"}, this.parallel());
                            accessToken(cl, {nickname: "ginger", password: "glamour"}, this.parallel());
                            accessToken(cl, {nickname: "mrhowell", password: "wealth"}, this.parallel());
                        },
                        function(err, pair1, pair2, pair3) {
                            var url, cred, act;
                            if (err) throw err;
                            users.maryanne.pair = pair1;
                            users.ginger.pair = pair2;
                            users.mrhowell.pair = pair3;
                            cred = makeCred(cl, pair1);
                            act = {
                                verb: "post",
                                bto: {
                                    id: users.ginger.profile.id,
                                    objectType: "person"
                                },
                                object: {
                                    objectType: "note",
                                    content: "Dinner's ready!"
                                }
                            };
                            url = "http://localhost:4815/api/user/maryanne/feed";
                            httputil.postJSON(url, cred, act, this);
                        },
                        function(err, doc, response) {
                            if (err) {
                                cb(err, null, null);
                            } else {
                                cb(null, doc, users);
                            }
                        }
                    );
                },
                "it works": function(err, doc, users) {
                    assert.ifError(err);
                },
                "and another user views the activity": {
                    topic: function(doc, users, cl) {
                        var cred = makeCred(cl, users.mrhowell.pair),
                            callback = this.callback,
                            url = doc.id;
                        
                        httputil.getJSON(url, cred, function(err, act, resp) {
                            callback(err, act);
                        });
                    },
                    "it works": function(err, act) {
                        assert.ifError(err);
                    },
                    "they can't see the bto": function(err, act) {
                        assert.ifError(err);
                        assert.isObject(act);
                        assert.isFalse(act.hasOwnProperty("bto"));
                    }
                },
                "and the author views the activity": {
                    topic: function(doc, users, cl) {
                        var cred = makeCred(cl, users.maryanne.pair),
                            callback = this.callback,
                            url = doc.id;
                        
                        httputil.getJSON(url, cred, function(err, act, resp) {
                            callback(err, act);
                        });
                    },
                    "it works": function(err, act) {
                        assert.ifError(err);
                    },
                    "they can see the bto": function(err, act) {
                        assert.ifError(err);
                        assert.isObject(act);
                        assert.isTrue(act.hasOwnProperty("bto"));
                    }
                }
            }
        }
    }
});

suite["export"](module);
