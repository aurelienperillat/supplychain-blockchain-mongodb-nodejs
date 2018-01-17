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

router.get("/command", function(req, res){
    mongoClient.connect(config.mongo_path, {
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
    mongoClient.connect(config.mongo_path
    , function(err, db){
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
    
    const request = {
        chaincodeId : config.chaincodeId,
        fcn : "addProduct",
        args : [req.body.ref, req.body.descriptif, req.body.price, req.body.stock, req.body.critical],
        chainId : config.channel,
        txId : null
    }

    invokeHelper.invoke(keyValueStore, cryptoSuite, req.session.user.address, request
    ).then(function(resp){
        mongoClient.connect(config.mongo_path
        , function(err, db){
            if(err == null){
                mongodb = db.db("supply-chain");
                mongodb.collection("product").insertOne({
                description : req.body.descriptif,
                ref : req.body.ref,
                price : parseFloat(req.body.price),
                quantity : parseInt(req.body.stock, 10),
                critical : parseInt(req.body.critical, 10),
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
    })
    .catch(function(err){
        console.log(err)
        res.send(false);
    })    
});

router.post("/modifyProduct", function(req, res){
    mongoClient.connect(config.mongo_path
    , function(err, db){
        if(err == null){
            mongodb = db.db("supply-chain");
            mongodb.collection("product").updateOne(
            {
                ref : req.body.curentref
            }, 
            {$set : {
               description : req.body.descriptif,
               ref : req.body.ref,
               price : parseFloat(req.body.price),
               quantity : parseInt(req.body.stock, 10),
               critical : parseInt(req.body.critical, 10)
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
    const request = {
        chaincodeId : config.chaincodeId,
        fcn : "setProvision",
        args : [req.body.product.ref, req.body.provision],
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
    })
    .catch(function(err){
        console.log(err)
        res.send(false);
    })
});

router.post("/denyOrder", function(req, res){
    const request = {
        chaincodeId : config.chaincodeId,
        fcn : "setState",
        args : ["4", req.body.id],
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
                    statut : 4
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
                mongodb.close();
                db.close();
            }
        });
    })
    .catch(function(err){
        res.send(false);
        console.log(err);
    })
});

router.post("/archivOrder", function(req, res){
    const request = {
        chaincodeId : config.chaincodeId,
        fcn : "setState",
        args : ["5", req.body.id],
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
                mongodb.close();
                db.close();
            }
        });
    })
    .catch(function(err){
        res.send(false);
        console.log(err);
    })
});

router.get("/validOrder/:id", function(req, res){
    var i;
    var command;
    var product;
    mongoClient.connect(config.mongo_path
    , function(err, db){
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

                    const request = {
                        chaincodeId : config.chaincodeId,
                        fcn : "majProduct",
                        args : [command.products.refs, command.products.quantities, req.params.id],
                        chainId : config.channel,
                        txId : null
                    }
                    
                    invokeHelper.invoke(keyValueStore, cryptoSuite, req.session.user.address, request
                    ).then(function(resp){
                        for(i=0; i<command.products.refs.length; i++){
                            findProductAndDecrease(req, res, db, mongodb, command, i, command.products.refs.length);
                        }
                    })
                    .catch(function(err){
                        res.send(false);
                        console.log(err);
                        mongodb.close();
                        db.close();
                    })
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
    var collis = {poids : req.body.poids, dimension : req.body.dimension}
    mongoClient.connect(config.mongo_path
    , function(err, db){
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
                    const request = {
                        chaincodeId : config.chaincodeId,
                        fcn : "setTransport",
                        args : [JSON.stringify(collis), req.body.id, docs[0].address+"@"+docs[0].type],
                        chainId : config.channel,
                        txId : null
                    }
                    
                    invokeHelper.invoke(keyValueStore, cryptoSuite, req.session.user.address, request
                    ).then(function(resp){
                        console.log(resp);
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
                                    mongodb.close();
                                    db.close();
                                }
                                else {
                                    res.send(true)
                                    mongodb.close();
                                    db.close();
                            }
                        });
                    })
                    .catch(function(err){
                        res.send(false);
                        console.log(err);
                        mongodb.close();
                        db.close();
                    })
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