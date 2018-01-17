var express = require('express');
var mongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var URL = require("../url.json");


var Fabric_Client = require('fabric-client');
var config = require("../config.js");
var queryHelper = require("../blockchain_helper/query.js");
var invokeHelper = require("../blockchain_helper/invoke.js");

var cryptoKeyStore = Fabric_Client.newCryptoKeyStore({path: config.hfc_store_path});

var cryptoSuite = Fabric_Client.newCryptoSuite();
cryptoSuite.setCryptoKeyStore(cryptoKeyStore);

var keyValueStore = null; 
Fabric_Client.newDefaultKeyValueStore({ 
    path: config.hfc_store_path
}).then(function(state_store) {
   keyValueStore = state_store; 
});

var router = express.Router();

var mongodb;

router.get("/command-transporteur", function(req, res){
    console.log(req.session.user._id);
    mongoClient.connect(config.mongo_path
    , function(err, db){
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
    const request = {
        chaincodeId : config.chaincodeId,
        fcn : "setTrackingID",
        args : [req.body.trackingID, req.body.id],
        chainId : config.channel,
        txId : null
    }
    
    invokeHelper.invoke(keyValueStore, cryptoSuite, req.session.user.address, request
    ).then(function(resp){
        console.log(resp);
        mongoClient.connect(config.mongo_path
        , function(err, db){
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
            else {
                res.send(false);
                mongodb.close();
                db.close();
            }
        });
    }).catch(function(err){
        console.log(err);
        res.send(false);
    })
});

router.get("/validDelivery/:id", function(req, res){
    const request = {
        chaincodeId : config.chaincodeId,
        fcn : "setState",
        args : ["4", req.params.id],
        chainId : config.channel,
        txId : null
    }
    
    invokeHelper.invoke(keyValueStore, cryptoSuite, req.session.user.address, request
    ).then(function(resp){
        console.log(resp);
        mongoClient.connect(config.mongo_path
        , function(err, db){
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
            else {
                res.send(false);
                mongodb.close();
                db.close();
            }
        });

    })
    .catch(function(err){
        console.log(err);
        res.send(false);
    })
});

module.exports = router;