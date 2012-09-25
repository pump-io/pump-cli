# ActivityPump

Version 0.1.0

This is the ActivityPump. It's social infrastructure that models most
of what people want to do with social networks: the social graph,
activity streams, and so on.

[![Build Status](https://secure.travis-ci.org/e14n/activitypump.png)](http://travis-ci.org/e14n/activitypump)

## License

Copyright 2011-2012, StatusNet Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## What's it for?

I post something and my followers see it. That's the rough idea behind
the pump.

There's an API defined in the API.md file. It uses activitystrea.ms
JSON as the main data and command format.

You can post almost anything that can be represented with activity
streams -- short or long text, bookmarks, images, video, audio,
events, geo checkins. You can follow friends, create lists of people,
and so on.

The software is useful for at least these scenarios:

* Mobile-first social networking
* Activity stream functionality for an existing app
* Experimenting with social software

Version 0.2.0 will have a Web UI, which will probably make the whole
thing much more enjoyable.

## Installation

You'll need three things to get started:

* node.js 0.8.0 or higher
* npm 1.1.0 or higher
* A database server (see below)

To install the software, you can clone the git repository, so:

    git clone https://github.com/e14n/activitypump.git
    
You can then install the dependencies using `npm`:

    cd activitypump
    npm install

To test the install, run:

    npm test
    
### Database setup

ActivityPump uses [databank](https://github.com/evanp/databank)
package to abstract out the data storage for the system. Any databank
driver should work. Couchbase, MongoDB and Redis are probably the best
bets for production servers, but the `disk` or even `memory` drivers
can work for testing.

If you're confused, just use the MongoDB one.

You can find other drivers like so:

    npm search databank

One tricky bit is that the driver you use has to be available to the
`databank` package. There are two ways to make that work.

First, you can install globally. For example:

    npm install -g databank-mongodb
   
Second, you can install in the `databank` directory.

    cd activitypump/node_modules/databank
    npm install databank-mongodb

Note that you also need to install and configure your database server.

### Configuration

The ActivityPump uses a single `config.js` file in the main directory
for configuration options. You can look at `config.js.sample` for some
details.

The file is require()'d by code, so it needs to look like this:

    module.exports = {
        key1: "value1",
        key2: "value2",
        // ...
    };

..or like this:

    exports.key1 = "value1";
    exports.key2 = "value2";

It's a JavaScript file, so you can put practically anything in there.

Here are the main configuration keys.

* *driver* The databank driver you're using. Defaults to "disk", which
  is probably going to be terrible.
* *params* Databank driver params; see the databank driver README for
   details on what to put here.
* *hostname* The hostname of the server. Defaults to "localhost" which
   doesn't do much for you.
* *port* Port to listen on. Defaults to 31337, which is no good. You
   should listen on 80 or 443 if you're going to have anyone use this.
* *secret* A session-generating secret, server-wide password.
* *noweb* Hide the Web interface. Since it's disabled for this release,
  this shouldn't cause you any problems.
* *site* Name of the server, like "My great social service".
* *owner* Name of owning entity, if you want to link to it.
* *ownerURL* URL of owning entity, if you want to link to it.
* *nologger* If you're debugging or whatever, turn off
  logging. Defaults to false (leave logging on).
* *serverUser* If you're listening on a port lower than 1024, you need
  to be root. Set this to the name of a user to change to after the
  server is listening. `daemon` or `nobody` are good choices, or you
  can create a user like `pump` and use that.
* *key* If you're using SSL, the path to the server key, like
   "/etc/ssl/private/myserver.key".
* *cert* If you're using SSL, the path to the server cert, like
   "/etc/ssl/private/myserver.crt".

## Bugs

If you find bugs, you can report them here:

https://github.com/e14n/activitypump/issues

You can also email me at evan@e14n.com.

