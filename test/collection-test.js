// collection-test.js
//
// Test the collection module
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

var suite = vows.describe('collection module interface');

var testSchema = {
    pkey: "id",
    fields: ['author',
             'displayName',
             'image',
             'objectTypes',
             'published',
             'summary',
             'updated',
             'url']
};

var testData = {
    'create': {
        displayName: "Vacation 2011",
        url: "http://example.com/collection/photos/vacation-2011",
        image: {
            url: "http://example.com/images/collections/vacation-2011.jpg",
            height: 140,
            width: 140
        },
        objectTypes: ["image", "video"]
    },
    'update': {
        displayName: "Vacation Summer 2011"
    }
};

suite.addBatch(modelBatch('collection', 'Collection', testSchema, testData));

suite.export(module);