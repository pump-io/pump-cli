// person-test.js
//
// Test the person module
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
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;

var suite = vows.describe('person module interface');

var testSchema = {
    pkey: "id",
    fields: ['displayName',
             'image',
             'published',
             'updated',
             'url']
};

var testData = {
    'create': {
        displayName: "George Washington",
        image: {
            url: "http://www.georgewashington.si.edu/portrait/images/face.jpg",
            width: 83,
            height: 120
        }
    },
    'update': {
        displayName: "President George Washington"
    }
};

suite.addBatch(modelBatch('person', 'Person', testSchema, testData));

suite.export(module);

