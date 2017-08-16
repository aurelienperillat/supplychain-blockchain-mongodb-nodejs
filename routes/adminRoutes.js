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

router.get("/command", function(req, res){
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
            mongodb.collection("command").find({}).toArray(function(err, docs){
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

router.get("/adminCommand", function(req, res){
    res.render("admin.ejs", {user : req.session.user, url : URL.url});
});

router.get("/fournisseurCatalogue", function(req, res){
    res.render("fournisseur-catalogue.ejs", {user : req.session.user, url : URL.url});
});

router.get("/fournisseurCommand", function(req, res){
    res.render("fournisseur-command.ejs", {user : req.session.user, url : URL.url});
});

router.get("/product", function(req, res){
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
            mongodb.collection("product").find({}).toArray(function(err, docs){
                if(err) {
                    res.send(false);
                    console.log(err);
                }
                else if(docs.length == 0) res.send("none");
                else res.send(docs);
            });
        }
        else {
            res.send(false);
            console.log(err);
        }
        mongodb.close();
        db.close();
    });
});

router.post("/newProduct", function(req, res){
    console.log(req.body.descriptif);
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
            mongodb.collection("product").insertOne({
               descriptif : req.body.descriptif,
               ref : req.body.ref,
               price : parseInt(req.body.price, 10),
               quantity : parseInt(req.body.stock, 10),
               criticalpoint : parseInt(req.body.critical, 10),
               provision : 0
            },
            function(err, result){
                if(err == null) res.send(true);
                else res.send(false)
            });
        }
        else res.send(false);
        mongodb.close();
        db.close();
    });
});

router.post("/modifyProduct", function(req, res){
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
            mongodb.collection("product").updateOne(
            {
                ref : req.body.curentref
            }, 
            {$set : {
               descriptif : req.body.descriptif,
               ref : req.body.ref,
               price : parseInt(req.body.price, 10),
               quantity : parseInt(req.body.stock, 10),
               criticalpoint : parseInt(req.body.critical, 10)
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

router.post("/addRule", function(req, res){
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
            mongodb.collection("product").updateOne(
            {
                ref : req.body.product.ref
            }, 
            {$set : {
               provision : parseInt(req.body.provision, 10)
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

router.post("/denyOrder", function(req, res){
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
                statut : -1
            }},
            function(err, result){
                if(err) {
                    res.send(false);
                    console.log(err);
                }
                else {
                    res.send(true)
                    mongodb.close();
                    db.close();
                }
            });
        }
        else {
            res.send(false);
            console.log(err);
        }
    });
});

router.post("/archivOrder", function(req, res){
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
                statut : 5
            }},
            function(err, result){
                if(err) {
                    res.send(false);
                    console.log(err);
                }
                else {
                    res.send(true)
                    mongodb.close();
                    db.close();
                }
            });
        }
        else {
            res.send(false);
            console.log(err);
        }
    });
});

router.get("/validOrder/:id", function(req, res){
    var i;
    var command;
    var product;
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
                _id : new ObjectId(req.params.id)
            }).toArray(function(err, docs){
                if(err) {
                    res.send(false);
                    console.log(err);
                }
                else if(docs.length == 0) res.send(false);
                else {
                    command = docs[0];
                    for(i=0; i<command.products.refs.length; i++){
                        findProductAndDecrease(req, res, db, mongodb, command, i, command.products.refs.length);
                    }
                }
            });
        }
        else {
            res.send(false);
            console.log(err);
        }
    });
});

findProductAndDecrease = function(req, res, db, mongodb, command, i, length) {
    mongodb.collection("product").find({
        ref : command.products.refs[i]
    }).toArray(function(err, docs){
        if(err) {
            res.send(false);
            console.log(err);    
        }
        else if(docs.length == 0) res.send(false);
        else{
            product = docs[0];
            if(product.quantity < command.products.quantities[i]) res.send(false);
            else {
                var newQuantity = product.quantity - command.products.quantities[i];
                console.log("originalquantity : " +product.quantity);
                console.log("index : " +i);
                console.log("command : ");
                console.log(command.products.quantities);
                console.log("newquantity : " +newQuantity);
                mongodb.collection("product").updateOne(
                {
                    ref : product.ref
                }, 
                {$set : {
                    quantity : newQuantity
                }},
                function(err, result){
                    if(err) {
                        res.send(false);
                        console.log(err);
                    }
                    else {
                        mongodb.collection("command").updateOne(
                        {
                            _id : new ObjectId(req.params.id)
                        }, 
                        {$set : {
                            statut : 2
                        }},
                        function(err, result){
                            if(err) {
                                res.send(false);
                                console.log(err);
                            }
                            else {
                                if(i == length -1){
                                    res.send(true)
                                    mongodb.close();
                                    db.close();
                                }
                            }
                        });
                    }
                });    
            }
        }                            
    });
}

router.post("/askTransport", function(req, res){
    console.log(req.body.poids);
    console.log(req.body.dimension);
    console.log(req.body.id);
    var transporteurID;
    var collis = {poids : parseInt(req.body.poids, 10), dimension : parseInt(req.body.dimension, 10)}
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
            mongodb.collection("user").find({
                type : "3"
            }).toArray(function(err, docs){
                console.log(docs);
                if(err) {
                    res.send(false);
                    console.log(err);
                }
                else if(docs.length == 0) res.send("none");
                else {
                    transporteurID = docs[0]._id
                    console.log(transporteurID);
                    mongodb.collection("command").updateOne(
                        {
                            _id : new ObjectId(req.body.id)
                        }, 
                        {$set : {
                            transporteurID :transporteurID,
                            collis : collis
                        }},
                        function(err, result){
                            if(err) {
                                res.send(false);
                                console.log(err);
                            }
                            else {
                                res.send(true)
                                mongodb.close();
                                db.close();
                        }
                    });
                }
            });
        }
        else {
            res.send(false);
            console.log(err);
            mongodb.close();
            db.close();
        }
    });
});

module.exports = router;