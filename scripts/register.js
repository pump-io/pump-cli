// register.js
//
// Register a new user with the activity pump
//
// Copyright 2011, StatusNet Inc.
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

var postActivity = require('./common').postActivity;

var nickname = process.argv[2],
    password = process.argv[3];

var activity = {'nickname': nickname,
		'password': password};

postActivity('http://localhost:8001/users', activity, function(err, results) {
    if (err) {
	console.error(err);
    } else {
	console.log(results);
    }
});

