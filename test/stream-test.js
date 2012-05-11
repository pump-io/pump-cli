// stream-test.js
//
// Test the stream module
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
    URLMaker = require('../lib/urlmaker').URLMaker,
    modelBatch = require('./lib/model').modelBatch,
    schema = require('../lib/schema').schema,
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;

var suite = vows.describe('stream interface');

// XXX: check other types

var testSchema = {
    pkey: "name"
};

var testData = {
    create: {
        name: "evan-inbox"
    },
    update: {
        something: "value" // Not clear what we update here
    }
};

// XXX: hack hack hack
// modelBatch hard-codes ActivityObject-style

var mb = modelBatch('stream', 'Stream', testSchema, testData);

// This class has a weird schema format

mb['When we require the stream module']
  ['and we get its Stream class export']
  ['and we get its schema']
  ['topic'] = function(Stream) {
          return Stream.schema.stream || null;
      };

mb['When we require the stream module']
  ['and we get its Stream class export']
  ['and we create a stream instance']
  ['auto-generated fields are there'] = function(err, created) {
      // No auto-gen fields, so...
      assert.isTrue(true);
  };

mb['When we require the stream module']
  ['and we get its Stream class export']
  ['and we create a stream instance']
  ['and we modify it']
  ['it is modified'] = function(err, updated) {
      assert.ifError(err);
  };

suite.addBatch(mb);

suite.addBatch({
    'When we create a new stream': {
        topic: function() {
            var cb = this.callback;
            // Need this to make IDs

            URLMaker.hostname = "example.net";

            // Dummy databank

            var params = {schema: schema};

            var db = Databank.get('memory', params);

            db.connect({}, function(err) {

                var Stream, mod;

                if (err) {
                    cb(err, null);
                    return;
                }

                DatabankObject.bank = db;
                
                mod = require('../lib/model/stream');

                if (!mod) {
                    cb(new Error("No module"), null);
                    return;
                }

                Stream = mod.Stream;

                if (!Stream) {
                    cb(new Error("No class"), null);
                    return;
                }

                Stream.create({name: 'test'}, cb);
            });
        },
        'it works': function(err, stream) {
            assert.ifError(err);
            assert.isObject(stream);
        },
        'it has a deliver() method': function(err, stream) {
            assert.isFunction(stream.deliver);
        },
        'it has a getActivities() method': function(err, stream) {
            assert.isFunction(stream.getActivities);
        }
    }
});

suite.export(module);

