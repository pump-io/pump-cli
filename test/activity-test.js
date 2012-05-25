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
    Step = require('step'),
    _ = require('underscore'),
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

// Since actor, object will have some auto-created stuff, we only
// check that their attributes match

mb['When we require the activity module']
['and we get its Activity class export']
['and we create an activity instance']
['passed-in fields are there'] = function(err, created) {
    var prop, orig = testData.create, child, cprop;
    for (prop in _(orig).keys()) {
        if (_.isObject(orig[prop])) {
            assert.include(created, prop);
            child = orig[prop];
            for (cprop in _(child).keys()) {
                assert.include(created[prop], cprop);
                assert.equal(created[prop][cprop], child[cprop]);
            }
        } else {
            assert.equal(created[prop], orig[prop]);
        }
    }
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
        },
        'and we create an instance': {
            topic: function(Activity) {
                return new Activity({});
            },
            'it has the expand() method': function(activity) {
                assert.isFunction(activity.expand);
            },
            'it has the expandActor() method': function(activity) {
                assert.isFunction(activity.expandActor);
            },
            'it has the expandObject() method': function(activity) {
                assert.isFunction(activity.expandObject);
            }
        },
        'and we apply() a new post activity': {
            topic: function(Activity) {
                var cb = this.callback,
                    act = new Activity({
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
                    });
                
                act.apply(null, function(err) {
                    if (err) {
                        cb(err, null);
                    } else {
                        cb(null, act);
                    }
                });
            },
            'it works': function(err, activity) {
                assert.ifError(err);
                assert.isObject(activity);
            },
            'and we fetch its object': {
                topic: function(activity) {
                    var Note = require('../lib/model/note').Note;
                    Note.get(activity.object.id, this.callback);
                },
                'it exists': function(err, note) {
                    assert.ifError(err);
                    assert.isObject(note);
                },
                'it has the right author': function(err, note) {
                    assert.equal(note.author.id, "urn:uuid:8f64087d-fffc-4fe0-9848-c18ae611cafd");
                }
            },
            'and we save() the activity': {
                topic: function(activity) {
                    var cb = this.callback;
                    activity.save(function(err) {
                        if (err) {
                            cb(err, null);
                        } else {
                            cb(null, activity);
                        }
                    });
                },
                'it works': function(err, activity) {
                    assert.ifError(err);
                    assert.isObject(activity);
                    assert.instanceOf(activity,
                                      require('../lib/model/activity').Activity);
                },
                'its object properties have ids': function(err, activity) {
                    assert.isString(activity.actor.id);
                    assert.isString(activity.object.id);
                },
                'its object properties are objects': function(err, activity) {
                    assert.isObject(activity.actor);
                    assert.instanceOf(activity.actor, require('../lib/model/person').Person);
                    assert.isObject(activity.object);
                    assert.instanceOf(activity.object, require('../lib/model/note').Note);
                },
                'its object properties are expanded': function(err, activity) {
                    assert.isString(activity.actor.displayName);
                    assert.isString(activity.object.content);
                },
                'and we get the stored activity': {
                    topic: function(saved, activity, Activity) {
                        Activity.get(activity.id, this.callback);
                    },
                    'it works': function(err, copy) {
                        assert.ifError(err);
                        assert.isObject(copy);
                    },
                    'its object properties are expanded': function(err, activity) {
                        assert.isString(activity.actor.displayName);
                        assert.isString(activity.object.content);
                    },
                    'its object properties are objects': function(err, activity) {
                        assert.isObject(activity.actor);
                        assert.instanceOf(activity.actor, require('../lib/model/person').Person);
                        assert.isObject(activity.object);
                        assert.instanceOf(activity.object, require('../lib/model/note').Note);
                    }
                }
            }
        },
        'and we apply() a new follow activity': {
            topic: function(Activity) {
                var User = require('../lib/model/user').User,
                    users = {},
                    cb = this.callback;

                Step(
                    function() {
                        User.create({nickname: "alice", password: "monkey"}, this);
                    },
                    function(err, alice) {
                        if (err) throw err;
                        users.alice = alice;
                        User.create({nickname: "bob", password: "bob123"}, this);
                    },
                    function(err, bob) {
                        if (err) throw err;
                        users.bob = bob;
                        var act = new Activity({actor: users.alice.profile,
                                                verb: "follow",
                                                object: users.bob.profile});
                        act.apply(users.alice.profile, this);
                    },
                    function(err) {
                        if (err) {
                            cb(err, null);
                        } else {
                            cb(null, users);
                        }
                    }
                );
            },
            teardown: function(users) {
                Step(
                    function() {
                        users.alice.del(this.parallel());
                        users.bob.del(this.parallel());
                    },
                    function(err) {
                        // ignore
                    }
                );
            },
            'it works': function(err, users) {
                assert.ifError(err);
                assert.isObject(users);
                assert.isObject(users.alice);
                assert.isObject(users.bob);
            },
            'and we search for a resulting edge': {
                topic: function(users) {
                    var Edge = require('../lib/model/edge').Edge;
                    Edge.search({"from.id": users.alice.profile.id,
                                 "to.id": users.bob.profile.id},
                                this.callback);
                },
                'it exists': function(err, edges) {
                    assert.ifError(err);
                    assert.isArray(edges);
                    assert.lengthOf(edges, 1);
                },
                'and we apply() a stop-following activity': {
                    topic: function(edges, users, Activity) {
                        var act = new Activity({actor: users.alice.profile,
                                                verb: "stop-following",
                                                object: users.bob.profile});
                        act.apply(users.alice.profile, this.callback);
                    },
                    'it works': function(err) {
                        assert.ifError(err);
                    },
                    'and we check for the resulting edge again': {
                        topic: function(edges, users, Activity) {
                            var Edge = require('../lib/model/edge').Edge;
                            Edge.search({"from.id": users.alice.profile.id,
                                         "to.id": users.bob.profile.id},
                                        this.callback);
                        },
                        'it does not exist': function(err, edges) {
                            assert.ifError(err);
                            assert.isArray(edges);
                            assert.lengthOf(edges, 0);
                        }
                    }
                }
            }
        }
    }
});

suite['export'](module);
