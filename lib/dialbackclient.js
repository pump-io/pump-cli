// Dialback HTTP calls
//
// Copyright 2012 StatusNet Inc.
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

var _ = require("underscore"),
    urlparse = require("url").parse,
    http = require("http"),
    https = require("https");

var DialbackClient = {

    requests: {},

    post: function(endpoint, id, requestBody, contentType, callback) {

        var reqOpts = urlparse(endpoint),
            auth,
            token,
            ts;

        token = DialbackClient.newToken();
        ts    = Date.now();

        reqOpts.method = "POST";
        reqOpts.headers = {
            "Content-Type": contentType,
            "Content-Length": requestBody.length,
            "User-Agent": "activitypump-test/0.1.0dev"
        };

        if (id.indexOf("@") === -1) {
            auth = "Dialback host=\"" + id + "\", token=\""+token+"\"";
        } else {
            auth = "Dialback webfinger=\"" + id + "\", token=\""+token+"\"";
        }

        reqOpts.headers["Authorization"] = auth;
        reqOpts.headers["Date"] = (new Date(ts)).toUTCString();

        DialbackClient.remember(endpoint, id, token, ts);

        var req = http.request(reqOpts, function(res) {
            var body = "";
            res.setEncoding("utf8");
            res.on("data", function(chunk) {
                body = body + chunk;
            });
            res.on("error", function(err) {
                callback(err, null, null);
            });
            res.on("end", function() {
                callback(null, res, body);
            });
        });

        req.on("error", function(err) {
            callback(err, null, null);
        });

        req.write(requestBody);

        req.end();

        return true;
    },

    remember: function(endpoint, id, token, ts) {
        var requests = DialbackClient.requests;
        if (!_(requests).has(id)) {
            requests[id] = {};
        }
        if (!_(requests[id]).has(endpoint)) {
            requests[id][endpoint] = {};
        }
        if (!_(requests[id][endpoint]).has(ts)) {
            requests[id][endpoint][ts] = [];
        }
        requests[id][endpoint][ts].push(token);
        return true;
    },

    isRemembered: function(endpoint, id, token, ts) {
        var requests = DialbackClient.requests;
        return (_(requests).has(id) &&
                _(requests[id]).has(endpoint) &&
                _(requests[id][endpoint]).has(ts) &&
                requests[id][endpoint][ts].indexOf(token) !== -1);
    }
};

module.exports = DialbackClient;
