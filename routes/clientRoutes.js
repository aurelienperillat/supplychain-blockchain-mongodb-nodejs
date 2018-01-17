var express = require('express');
var mongoClient = require('mongodb').MongoClient;
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

var mongodb;

var router = express.Router();

router.get("/command-client", function(req, res){
    console.log(req.session.user.address);
    mongoClient.connect(config.mongo_path
    , function(err, db){
        if(err == null){
            mongodb = db.db("supply-chain");
            mongodb.collection("command").find({
                clientAddress : req.session.user.address
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

router.get("/myCommand", function(req, res){
    res.render("client.ejs", {user : req.session.user, url : URL.url});
});

router.post("/addProduct", function(req, res){
    var item = {
        product : req.body.product,
        quantity : req.body.quantity
    }

    req.session.panier.push(item);
    console.log(req.session.panier);

    var panierPrice = 0;
    for(var i=0; i<req.session.panier.length; i++)
        panierPrice += (req.session.panier[i].product.price*req.session.panier[i].quantity);
    req.session.panierPrice = panierPrice;
    console.log(req.session.panierPrice);

    res.send(true);
});

router.get("/panier", function(req, res){
    console.log(req.session.panier);
    console.log(req.session.panierPrice);
    var item = {
        panier : req.session.panier,
        panierPrice : req.session.panierPrice
    }
    res.send(item);
});


router.post("/panier", function(req, res){
    var panier = req.session.panier;
    var panierPrice = req.session.panierPrice;
    var user = req.session.user;
    var refs = [];
    var quantities = [];
    var prices = [];
    var descriptifs = [];
    var products = [];
    var date = new Date();

    for(var i=0; i<panier.length; i++) {
        products.push(panier[i].product)
        refs.push(panier[i].product.ref);
        quantities.push(panier[i].quantity.toString());
        prices.push(panier[i].product.price);
        descriptifs.push(panier[i].product.description);
    }

    mongoClient.connect(config.mongo_path
    , function(err, db){
        if(err == null){
            mongodb = db.db("supply-chain");
            mongodb.collection("command").insertOne({
               date : date,
               clientname : user.name,
               clientlastname : user.lastname,
               clientAddress : user.address,
               clientDeliveryAddress : user.deliveryaddress,
               clientcompany : user.company,
               products : {
                    refs : refs,
                    quantities : quantities,
                    prices : prices,
                    descriptifs : descriptifs    
               },
               collis : {
                   poids : 0,
                   dimension : 0
               },
               transporteurID : "",
               trackingID : "",
               totalprice : panierPrice,
               statut : 1
            },
            function(err, result){
                if(err == null) {
                    mongodb.collection("command").find({
                        date : date
                    }).toArray(function(err, docs){
                        if(err) {
                            res.send(false);
                            console.log(err);
                            mongodb.close();
                             db.close();
                        }
                        else if(docs.length == 0) {
                            mongodb.close();
                            db.close();
                            res.send("none"); 
                        } 
                        else {
                            const request = {
                                chaincodeId : config.chaincodeId,
                                fcn : "addOrder",
                                args : [req.session.user.address + "@" + req.session.user.password, JSON.stringify(products), JSON.stringify(quantities), panierPrice.toString(), docs[0]._id.toString()],
                                chainId : config.channel,
                                txId : null
                            }
                        
                            invokeHelper.invoke(keyValueStore, cryptoSuite, req.session.user.address, request
                            ).then(function(resp){
                              console.log(resp);  
                              req.session.panier = [];
                              req.session.panierPrice = 0;
                              res.send(true);
                              mongodb.close();
                              db.close();  
                            })
                            .catch(function(err){
                                console.log(err);
                                req.session.panier = [];
                                req.session.panierPrice = 0;
                                res.send(false);
                                mongodb.close();
                                db.close();
                            })
                        }
                    })
                } else {
                    mongodb.close();
                    db.close();
                    res.send(false);
                }  
            });
        }
        else {
            res.send(false);
            mongodb.close();
            db.close();
        }
    });
});

router.get("/getUser", function(req, res) {
    res.send(req.session.user);
});

module.exports = router;
