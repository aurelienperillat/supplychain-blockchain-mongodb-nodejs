/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 // First add the obligatory web framework
var express = require('express');
var bodyparser = require('body-parser');
var session = require("express-session");
var mongostore = require("connect-mongodb-session")(session);

// Util is handy to have around, so thats why that's here.
const util = require('util')
// and so is assert
const assert = require('assert');

var signinRouter = require("./routes/signinRoutes.js");
var adminRouter = require("./routes/adminRoutes.js");
var clientRouter = require("./routes/clientRoutes.js");

// We want to extract the port to publish our app on
var port = process.env.PORT || 8080;
var app = express();

var store = new mongostore({
  uri: "mongodb://admin:DXHZWYEWIEVJCYJT@sl-eu-lon-2-portal.0.dblayer.com:18713,sl-eu-lon-2-portal.4.dblayer.com:18713/admin?ssl=true",
  collection: "session"
});

store.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
});

app.set('view engine', 'ejs');

app.use(session({
  secret : "supplychain",
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week 
  },
  store : store,
  resave : true,
  saveUninitialized : true
}));

app.use(bodyparser.json({     
  limit: '20mb'
}));       

app.use(bodyparser.urlencoded({     
  extended: true, 
  limit: '20mb'
}));

app.use(express.static('public'));

app.use(signinRouter);
app.use(adminRouter);
app.use(clientRouter);

// Then we'll pull in the database client library
/*var MongoClient = require("mongodb").MongoClient;

// Now lets ask cfenv to parse the environment variable
var appenv = cfenv.getAppEnv();

// Within the application environment (appenv) there's a services object
var services = appenv.services;

// The services object is a map named by service so we extract the one for MongoDB
var mongodb_services = services["compose-for-mongodb"];

// This check ensures there is a services for MongoDB databases
assert(!util.isUndefined(mongodb_services), "Must be bound to compose-for-mongodb services");

// We now take the first bound MongoDB service and extract it's credentials object
var credentials = mongodb_services[0].credentials;

// Within the credentials, an entry ca_certificate_base64 contains the SSL pinning key
// We convert that from a string into a Buffer entry in an array which we use when
// connecting.
var ca = [new Buffer(credentials.ca_certificate_base64, 'base64')];

// This is a global variable we'll use for handing the MongoDB client around
var mongodb;

// This is the MongoDB connection. From the application environment, we got the
// credentials and the credentials contain a URI for the database. Here, we
// connect to that URI, and also pass a number of SSL settings to the
// call. Among those SSL settings is the SSL CA, into which we pass the array
// wrapped and now decoded ca_certificate_base64,
MongoClient.connect(credentials.uri, {
        mongos: {
            ssl: true,
            sslValidate: true,
            sslCA: ca,
            poolSize: 1,
            reconnectTries: 1
        }
    },
    function(err, db) {
        // Here we handle the async response. This is a simple example and
        // we're not going to inject the database connection into the
        // middleware, just save it in a global variable, as long as there
        // isn't an error.
        if (err) {
            console.log(err);
        } else {
            // Although we have a connection, it's to the "admin" database
            // of MongoDB deployment. In this example, we want the
            // "examples" database so what we do here is create that
            // connection using the current connection.
            mongodb = db.db("examples");
        }
    }
);

// With the database going to be open as some point in the future, we can
// now set up our web server. First up we set it to server static pages
//app.use(express.static(__dirname + '/public'));

// Add words to the database
app.put("/words", function(request, response) {
  mongodb.collection("words").insertOne( {
    word: request.body.word, definition: request.body.definition}, function(error, result) {
      if (error) {
        response.status(500).send(error);
      } else {
        response.send(result);
      }
    });
});

// Then we create a route to handle our example database call
app.get("/words", function(request, response) {
  // and we call on the connection to return us all the documents in the
  // words collection.
  mongodb.collection("words").find().toArray(function(err, words) {
    if (err) {
     response.status(500).send(err);
    } else {
     response.send(words);
    }
  });
});*/

// Now we go and listen for a connection.
app.listen(port, function() {
  console.log('Node app is running on port', port);
  require("cf-deployment-tracker-client").track();
});
