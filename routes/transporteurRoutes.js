var express = require('express');
var cfenv = require('cfenv');
var mongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

const util = require('util')
const assert = require('assert');

var URL = require("../url.json");

var router = express.Router();

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

router.get("/command-transporteur", function(req, res){
    console.log(req.session.user._id);
    mongoClient.connect(credentials.uri, {
        mongos: {
            ssl: true,
            sslValidate: true,
            sslCA: ca,
            poolSize: 1,
            reconnectTries: 1
        }
    }, function(err, db){
        if(err == null){
            mongodb = db.db("supply-chain");
            mongodb.collection("command").find({
                transporteurID : req.session.user._id
            }).toArray(function(err, docs){
                if(err) {
                    res.send(false);
                    console.log(err);
                }
                else if(docs.length == 0) res.send("none");
                else res.send(docs);
            })
        }
        else {
            res.send(false);
            console.log(err);
        }
        mongodb.close();
        db.close();
    });
});

router.post("/validTransport", function(req, res){
    mongoClient.connect(credentials.uri, {
        mongos: {
            ssl: true,
            sslValidate: true,
            sslCA: ca,
            poolSize: 1,
            reconnectTries: 1
        }
    }, function(err, db){
        if(err == null){
            mongodb = db.db("supply-chain");
            mongodb.collection("command").updateOne(
            {
                _id : new ObjectId(req.body.id)
            }, 
            {$set : {
               trackingID : req.body.trackingID, 
               statut : 3
            }},
            function(err, result){
                if(err) {
                    res.send(false);
                    console.log(err);
                }
                else res.send(true)
            });
        }
        else res.send(false);
        mongodb.close();
        db.close();
    });
});

router.get("/validDelivery/:id", function(req, res){
    mongoClient.connect(credentials.uri, {
        mongos: {
            ssl: true,
            sslValidate: true,
            sslCA: ca,
            poolSize: 1,
            reconnectTries: 1
        }
    }, function(err, db){
        if(err == null){
            mongodb = db.db("supply-chain");
            mongodb.collection("command").updateOne(
            {
                _id : new ObjectId(req.params.id)
            }, 
            {$set : {
               statut : 4
            }},
            function(err, result){
                if(err) {
                    res.send(false);
                    console.log(err);
                }
                else res.send(true)
            });
        }
        else res.send(false);
        mongodb.close();
        db.close();
    });
});

module.exports = router;