// middleware-test.js
//
// Test the middleware module
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
    databank = require('databank'),
    Step = require('step'),
    schema = require('../lib/schema'),
    URLMaker = require('../lib/urlmaker').URLMaker,
    randomString = require('../lib/randomstring').randomString,
    Client = require('../lib/model/client').Client,
    RequestToken = require('../lib/model/requesttoken').RequestToken,
    AccessToken = require('../lib/model/accesstoken').AccessToken,
    User = require('../lib/model/user').User,
    methodContext = require('./lib/methods').methodContext,
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;

vows.describe('middleware module interface').addBatch({

    'When we load the module': {

        topic: function() { 

            var cb = this.callback;
            // Need this to make IDs

            URLMaker.hostname = "example.net";

            // Dummy databank

            var params = {schema: schema};

            var db = Databank.get('memory', params);

            db.connect({}, function(err) {
                var mod;

                DatabankObject.bank = db;

                mod = require('../lib/middleware');
                cb(null, mod);
            });
        },
        'there is one': function(mod) {
            assert.isObject(mod);
        },
        'and we check its methods': methodContext(['maybeAuth',
                                                   'reqUser',
                                                   'mustAuth',
                                                   'sameUser',
                                                   'noUser',
                                                   'checkCredentials',
                                                   'getCurrentUser',
                                                   'getSessionUser'])
    }
}).export(module);

