// post-note-api-test.js
//
// Test posting a note
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

var assert = require('assert'),
    vows = require('vows'),
    Step = require('step'),
    _ = require('underscore'),
    querystring = require('querystring'),
    http = require('http'),
    OAuth = require('oauth').OAuth,
    Browser = require('zombie'),
    httputil = require('./lib/http'),
    oauthutil = require('./lib/oauth'),
    setupApp = oauthutil.setupApp,
    register = oauthutil.register,
    accessToken = oauthutil.accessToken,
    newCredentials = oauthutil.newCredentials,
    newClient = oauthutil.newClient;

var ignore = function(err) {};

var suite = vows.describe('Post note API test');

// A batch for testing the read access to the API

suite.addBatch({
    'When we set up the app': {
        topic: function() {
            setupApp(this.callback);
        },
        teardown: function(app) {
            if (app && app.close) {
                app.close();
            }
        },
        'it works': function(err, app) {
            assert.ifError(err);
        },
        'and we get a new client': {
            topic: function() {
                var cb = this.callback;
                newClient(function(err, cl) {
                    cb(err, cl);
                });
            },
            'it works': function(err, cl) {
                assert.ifError(err);
                assert.isObject(cl);
            },
            'and we make a new user': {
                topic: function(cl) {
                    var cb = this.callback;
                    register(cl, "frodo", "iheartsam", function(err, user) {
                        cb(err, user);
                    });
                },
                'it works': function(err, user) {
                    assert.ifError(err);
                    assert.isObject(user);
                },
                'and we get a new access token': {
                    topic: function(user, cl) {
                        var cb = this.callback;
                        accessToken(cl, {nickname: "frodo", password: "iheartsam"}, function(err, pair) {
                            cb(err, pair);
                        });
                    },
                    'it works': function(err, pair) {
                        assert.ifError(err);
                        assert.isObject(pair);
                    },
                    'and we post a note': {
                        topic: function(pair, user, cl) {
                            var cb = this.callback,
                                act = {
                                    verb: 'post',
                                    object: {
                                        objectType: 'note',
                                        content: "I'm so scared!"
                                    }
                                },
                                cred = {
                                    consumer_key: cl.client_id,
                                    consumer_secret: cl.client_secret,
                                    token: pair.token,
                                    secret: pair.secret
                                };

                            httputil.postJSON('http://localhost:4815/api/user/frodo/feed', cred, act, function(err, act, result) {
                                cb(err, act);
                            });
                        },
                        'it works': function(err, act) {
                            assert.ifError(err);
                        },
                        'results look right': function(err, act) {
                            assert.isObject(act);
                            assert.include(act, 'id');
                            assert.isString(act.id);
                            assert.include(act, 'actor');
                            assert.isObject(act.actor);
                            assert.include(act.actor, 'id');
                            assert.isString(act.actor.id);
                            assert.include(act, 'verb');
                            assert.isString(act.verb);
                            assert.include(act, 'object');
                            assert.isObject(act.object);
                            assert.include(act.object, 'id');
                            assert.isString(act.object.id);
                            assert.include(act, 'published');
                            assert.isString(act.published);
                            assert.include(act, 'updated');
                            assert.isString(act.updated);
                        },
                        'results are what we posted': function(err, act) {
                            assert.equal(act.verb, 'post');
                            assert.equal(act.object.content, "I'm so scared!");
                            assert.equal(act.object.objectType, "note");
                        },
                        'and we check the actor': {
                            topic: function(act, pair, user, cl) {
                                return {act: act, user: user};
                            },
                            'it matches our user': function(res) {
                                var act = res.act, user = res.user;
                                assert.equal(act.actor.id, user.profile.id);
                            }
                        },
                        'and we fetch the posted note': {
                            topic: function(act, pair, user, cl) {
                                var cb = this.callback,
                                    cred = {
                                        consumer_key: cl.client_id,
                                        consumer_secret: cl.client_secret,
                                        token: pair.token,
                                        secret: pair.secret
                                    };
                                // ID == JSON representation URL
                                httputil.getJSON(act.object.id, cred, function(err, note) {
                                    cb(err, note, act);
                                });
                            },
                            'it works': function(err, note, act) {
                                assert.ifError(err);
                                assert.isObject(note);
                            },
                            'results look right': function(err, note, act) {
                                assert.ifError(err);
                                assert.isObject(note);
                                assert.include(note, 'id');
                                assert.isString(note.id);
                                assert.include(note, 'published');
                                assert.isString(note.published);
                                assert.include(note, 'updated');
                                assert.isString(note.updated);
                                assert.include(note, 'author');
                                assert.isObject(note.author);
                                assert.include(note.author, 'id');
                                assert.isString(note.author.id);
                                assert.include(note.author, 'displayName');
                                assert.isString(note.author.displayName);
                                assert.include(note.author, 'objectType');
                                assert.isString(note.author.objectType);
                            },
                            'results are what we posted': function(err, note, act) {
                                assert.equal(note.content, "I'm so scared!");
                                assert.equal(note.objectType, "note");
                                assert.equal(note.id, act.object.id);
                                assert.equal(note.published, act.object.published);
                                assert.equal(note.updated, act.object.updated);
                                assert.equal(note.author.id, act.actor.id);
                                assert.equal(note.author.displayName, act.actor.displayName);
                                assert.equal(note.author.objectType, act.actor.objectType);
                            }
                        }
                    }
                }
            }
        }
    }
});

suite['export'](module);
