// activity-test.js
//
// Test the activity module
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
    schema = require('../lib/schema').schema,
    modelBatch = require('./lib/model').modelBatch,
    Databank = databank.Databank,
    DatabankObject = databank.DatabankObject;

var suite = vows.describe('activity module interface');

var testSchema = {
    pkey: 'id', 
    fields: ['actor',
             'content',
             'generator',
             'icon',
             'id',
             'object',
             'published',
             'provider',
             'target',
             'title',
             'url',
             'uuid',
             'updated',
             'verb'],
    indices: ['actor.id', 'object.id', 'uuid']
};

var testData = {
    'create': {
        actor: {
            id: "urn:uuid:8f64087d-fffc-4fe0-9848-c18ae611cafd",
            displayName: "Delbert Fnorgledap",
            objectType: "person"
        },
        verb: "post",
        object: {
            objectType: "note",
            content: "Feeling groovy."
        }
    },
    'update': {
        mood: {
            displayName: "groovy"
        }
    }
};

var testVerbs = ['add',
                 'cancel',
                 'checkin',
                 'delete',
                 'favorite',
                 'follow',
                 'give',
                 'ignore',
                 'invite',
                 'join',
                 'leave',
                 'like',
                 'make-friend',
                 'play',
                 'post',
                 'receive',
                 'remove',
                 'remove-friend',
                 'request-friend',
                 'rsvp-maybe',
                 'rsvp-no',
                 'rsvp-yes',
                 'save',
                 'share',
                 'stop-following',
                 'tag',
                 'unfavorite',
                 'unlike',
                 'unsave',
                 'update'];

var mb = modelBatch('activity', 'Activity', testSchema, testData);

mb['When we require the activity module']
['and we get its Activity class export']
['and we create an activity instance']
['auto-generated fields are there'] = function(err, created) {
    assert.isString(created.id);
    assert.isString(created.uuid);
    assert.isString(created.published);
    assert.isString(created.updated);
};

suite.addBatch(mb);

suite.addBatch({
    'When we get the Activity class': {
        topic: function() {
            var cb = this.callback;
            // Need this to make IDs

            URLMaker.hostname = "example.net";

            // Dummy databank

            var params = {schema: schema};

            var db = Databank.get('memory', params);

            db.connect({}, function(err) {

                var mod;

                if (err) {
                    cb(err, null);
                    return;
                }

                DatabankObject.bank = db;
                
                mod = require('../lib/model/activity');

                if (!mod) {
                    cb(new Error("No module"), null);
                    return;
                }

                cb(null, mod.Activity);
            });
        },
        'it works': function(err, Activity) {
            assert.ifError(err);
            assert.isFunction(Activity);
        },
        'it has the right verbs': function(err, Activity) {
            var i;
            assert.isArray(Activity.verbs);
            for (i = 0; i < testVerbs.length; i++) {
                assert.includes(Activity.verbs, testVerbs[i]);
            }
            for (i = 0; i < Activity.verbs.length; i++) {
                assert.includes(testVerbs, Activity.verbs[i]);
            }
        },
        'it has a const-like member for each verb': function(err, Activity) {
            assert.equal(Activity.ADD, 'add');
            assert.equal(Activity.CANCEL, 'cancel');
            assert.equal(Activity.CHECKIN, 'checkin');
            assert.equal(Activity.DELETE, 'delete');
            assert.equal(Activity.FAVORITE, 'favorite');
            assert.equal(Activity.FOLLOW, 'follow');
            assert.equal(Activity.GIVE, 'give');
            assert.equal(Activity.IGNORE, 'ignore');
            assert.equal(Activity.INVITE, 'invite');
            assert.equal(Activity.JOIN, 'join');
            assert.equal(Activity.LEAVE, 'leave');
            assert.equal(Activity.LIKE, 'like');
            assert.equal(Activity.MAKE_FRIEND, 'make-friend');
            assert.equal(Activity.PLAY, 'play');
            assert.equal(Activity.POST, 'post');
            assert.equal(Activity.RECEIVE, 'receive');
            assert.equal(Activity.REMOVE, 'remove');
            assert.equal(Activity.REMOVE_FRIEND, 'remove-friend');
            assert.equal(Activity.REQUEST_FRIEND, 'request-friend');
            assert.equal(Activity.RSVP_MAYBE, 'rsvp-maybe');
            assert.equal(Activity.RSVP_NO, 'rsvp-no');
            assert.equal(Activity.RSVP_YES, 'rsvp-yes');
            assert.equal(Activity.SAVE, 'save');
            assert.equal(Activity.SHARE, 'share');
            assert.equal(Activity.STOP_FOLLOWING, 'stop-following');
            assert.equal(Activity.TAG, 'tag');
            assert.equal(Activity.UNFAVORITE, 'unfavorite');
            assert.equal(Activity.UNLIKE, 'unlike');
            assert.equal(Activity.UNSAVE, 'unsave');
            assert.equal(Activity.UPDATE, 'update');
        }
    }
});

suite.export(module);
