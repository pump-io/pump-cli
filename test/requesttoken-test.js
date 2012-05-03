// requesttoken-test.js
//
// Test the requesttoken module
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
    vows = require('vows');

vows.describe('requesttoken module interface').addBatch({
    'When we check for a test suite': {
        topic: function() { 
            return false;
        },
        'there is one': function(tsExists) {
            assert.isTrue(tsExists);
        }
    }
}).export(module);

