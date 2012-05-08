// question-test.js
//
// Test the question module
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

// Need this to make IDs

URLMaker.hostname = "example.net";

// Dummy databank

DatabankObject.bank = Databank.get('memory', {});

var suite = vows.describe('question module interface');

var testSchema = {
    pkey: "id",
    fields: ['author',
             'content',
             'displayName',
             'options',
             'published',
             'updated',
             'url']
};

var testData = {
    'create': {
        displayName: "What's the greatest programming editor?",
        content: "What do you think is the greatest programming editor?",
        url: "http://example.com/questions/greatest-programming-editor"
    },
    'update': {
        displayName: "What is the greatest programming editor?"
    }
};

suite.addBatch(modelBatch('question', 'Question', testSchema, testData));

suite.export(module);
