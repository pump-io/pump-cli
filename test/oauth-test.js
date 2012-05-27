// oauth-test.js
//
// Test the client registration API
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
    httputil = require('./lib/http');

var suite = vows.describe('user API');

var requestToken = function(cl, cb) {
    var oa;
    oa = new OAuth('http://localhost:4815/oauth/request_token',
                   'http://localhost:4815/oauth/access_token',
                   cl.client_id,
                   cl.client_secret,
                   "1.0",
                   "oob",
                   "HMAC-SHA1",
                   null, // nonce size; use default
                   {"User-Agent": "activitypump-test/0.1.0"});
    
    oa.getOAuthRequestToken(function(err, token, secret) {
        if (err) {
            cb(new Error(err.data), null);
        } else {
            cb(null, {token: token, token_secret: secret});
        }
    });

};

suite.addBatch({
    'When we set up the app': {
        topic: function() {
            var cb = this.callback,
                config = {port: 4815,
                          hostname: 'localhost',
                          driver: 'memory',
                          params: {},
                          nologger: true
                         },
                makeApp = require('../lib/app').makeApp;

            process.env.NODE_ENV = 'test';

            makeApp(config, function(err, app) {
                if (err) {
                    cb(err, null);
                } else {
                    app.run(function(err) {
                        if (err) {
                            cb(err, null);
                        } else {
                            cb(null, app);
                        }
                    });
                }
            });
        },
        teardown: function(app) {
            app.close();
        },
        'it works': function(err, app) {
            assert.ifError(err);
        },
        'and we request a token with no Authorization': {
            topic: function() {
                var cb = this.callback;
                httputil.post('localhost', 4815, '/oauth/request_token', {}, function(err, res, body) {
                    if (err) {
                        cb(err);
                    } else if (res.statusCode === 400) {
                        cb(null);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            'it fails correctly': function(err, cred) {
                assert.ifError(err);
            }
        },
        'and we request a token with an invalid client_id': {
            topic: function() {
                var cb = this.callback,
                    badcl = {client_id: "NOTACLIENTID",
                             client_secret: "NOTTHERIGHTSECRET"};

                requestToken(badcl, function(err, rt) {
                    if (err) {
                        cb(null);
                    } else {
                        cb(new Error("Unexpected success"));
                    }
                });
            },
            'it fails correctly': function(err, cred) {
                assert.ifError(err);
            }
        },
        'and we create a client using the api': {
            topic: function() {
                var cb = this.callback;
                httputil.post('localhost', 4815, '/api/client/register', {type: 'client_associate'}, function(err, res, body) {
                    var cl;
                    if (err) {
                        cb(err, null);
                    } else {
                        try {
                            cl = JSON.parse(body);
                            cb(null, cl);
                        } catch (err) {
                            cb(err, null);
                        }
                    }
                });
            },
            'it works': function(err, cl) {
                assert.ifError(err);
                assert.isObject(cl);
                assert.isString(cl.client_id);
                assert.isString(cl.client_secret);
            },
            'and we request a token with a valid client_id and invalid client_secret': {
                topic: function(cl) {
                    var cb = this.callback,
                        badcl = {client_id: cl.client_id,
                                 client_secret: "NOTTHERIGHTSECRET"};

                    requestToken(badcl, function(err, rt) {
                        if (err) {
                            cb(null);
                        } else {
                            cb(new Error("Unexpected success"));
                        }
                    });
                },
                'it fails correctly': function(err, cred) {
                    assert.ifError(err);
                }
            },
            'and we request a request token with valid client_id and client_secret': {
                topic: function(cl) {
                    requestToken(cl, this.callback);
                },
                'it works': function(err, cred) {
                    assert.ifError(err);
                    assert.isObject(cred);
                },
                'it has the right results': function(err, cred) {
                    assert.include(cred, 'token');
                    assert.isString(cred.token);
                    assert.include(cred, 'token_secret');
                    assert.isString(cred.token_secret);
                },
                'and we use that token to get the authorization form': {
                    topic: function(rt, cl) {
                        var cb = this.callback;
                        http.get("http://localhost:4815/oauth/authorize?oauth_token=" + rt.token, function(res) {
                            if (res.statusCode === 200) {
                                cb(null);
                            } else {
                                cb(new Error("Incorrect status code"));
                            }
                        }).on('error', function(err) {
                            cb(err);
                        });
                    },
                    'it works': function(err) {
                        assert.ifError(err);
                    }
                }
            }
        }
    }
});

suite['export'](module);