// activity-test.js
//
// Test the AS2 conversion module
//
// Copyright 2017 AJ Jordan <alex@strugee.net>
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

"use strict";

var assert = require("assert"),
    vows = require("vows"),
    databank = require("databank"),
    Step = require("step"),
    _ = require("lodash"),
    fs = require("fs"),
    path = require("path"),
    URLMaker = require("../lib/urlmaker").URLMaker,
    schema = require("../lib/schema").schema,
    modelBatch = require("./lib/model").modelBatch,
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;

var suite = vows.describe("AS2 conversion module interface");

suite.addBatch({
    "When we get the AS2 conversion module": {
        topic: function() {
            return require("../lib/as2");
        },
        "it works": function(err, as2) {
            assert.ifError(err);
            assert.isFunction(as2);
        },
        "and we try to convert a post of a note to AS2": {
            topic: function(as2) {
                var act = {
                    id: "urn:uuid:77451568-ce6a-42eb-8a9f-60ece187725f",
                    actor: "acct:tim@w3.example",
                    verb: "post",
                    title: "I am a title!",
                    upstreamDuplicates: [],
                    downstreamDuplicates: [],
                    to: [{objectType: "collection",
                          id: "http://w3.example/socialwg"}],
                    object: {
                        id: "urn:uuid:33166eb9-2567-477c-ad90-9352dd904712",
                        objectType: "note"
                    },
                    displayName: "A note"
                };

                return as2(act);
            },
            "id is renamed to @id": function(act) {
                assert.isFalse(act.hasOwnProperty("id"));
                assert.equal(act["@id"], "urn:uuid:77451568-ce6a-42eb-8a9f-60ece187725f");
            },
            "the `post` verb is converted specially to Create in @type": function(act) {
                assert.isFalse(act.hasOwnProperty("verb"));
                assert.equal(act["@type"], "Create");
            },
            "the object's objectType is renamed to @type": function(act) {
                assert.isFalse(act.object.hasOwnProperty("objectType"));
                assert.equal(act.object["@type"], "note");
            },
            "the `to` field's collection's objectType is renamed to @type": function(act) {
                assert.isFalse(act.to[0].hasOwnProperty("objectType"));
                assert.equal(act.to[0]["@type"], "collection");
            },
            // XXX should we test for all objectType renames? E.g. in the `to` field?
            "displayName is renamed to name": function(act) {
                assert.isFalse(act.hasOwnProperty("displayName"));
                assert.equal(act.name, "A note");
            },
            "title is dropped": function(act) {
                assert.isFalse(act.hasOwnProperty("title"));
            },
            "upstreamDuplicates is dropped": function(act) {
                assert.isFalse(act.hasOwnProperty("upstreamDuplicates"));
            },
            "downstreamDuplicates is dropped": function(act) {
                assert.isFalse(act.hasOwnProperty("downstreamDuplicates"));
            }
        },
        "and we try to convert a post of a note to a collection to AS2": {
            topic: function(as2) {
                var act = {
                    id: "urn:uuid:3738fceb-9705-4fa8-a0d3-59852770dc4d",
                    actor: "acct:chris@w3.example",
                    verb: "post",
                    title: "A rando note I want to categorize",
                    to: [{objectType: "collection",
                          id: "http://w3.example/socialwg"}],
                    object: {
                        id: "urn:uuid:33166eb9-2567-477c-ad90-9352dd904712",
                        objectType: "note"
                    },
                    target: {
                        id: "http://w3.example/chris/a-collection",
                        objectType: "collection"
                    }
                };

                return as2(act);
            },
            "the `post` verb is converted specially to Add in @type": function(act) {
                assert.isFalse(act.hasOwnProperty("verb"));
                assert.equal(act["@type"], "Add");
            }
        },
        "and we try to convert a like of a note to AS2": {
            topic: function(as2) {
                var act = {
                    id: "urn:uuid:db8b4174-a321-430f-bbbe-e11c65dd48ee",
                    actor: "acct:aj@w3.example",
                    verb: "like",
                    to: [{objectType: "collection",
                          id: "http://w3.example/socialwg"}],
                    // TODO check that this syntax is correct
                    target: {
                        id: "urn:uuid:77451568-ce6a-42eb-8a9f-60ece187725f",
                        objectType: "note"
                    }
                };

                return as2(act);
            },
            "verb is renamed to @type": function(act) {
                assert.isFalse(act.hasOwnProperty("verb"));
                assert.equal(act["@type"], "like");
            },
            "the target's objectType is renamed to @type": function(act) {
                assert.isFalse(act.target.hasOwnProperty("objectType"));
                assert.equal(act.target["@type"], "note");
            }
        }
    }
});

suite["export"](module);
