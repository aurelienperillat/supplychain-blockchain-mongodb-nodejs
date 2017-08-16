var express = require('express');
var cfenv = require('cfenv');
var mongoClient = require('mongodb').MongoClient;

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

router.get("/command-client", function(req, res){
    console.log(req.session.user.address);
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
    var descriptifs = []

    for(var i=0; i<panier.length; i++) {
        refs.push(panier[i].product.ref);
        quantities.push(panier[i].quantity);
        prices.push(panier[i].product.price);
        descriptifs.push(panier[i].product.descriptif);
    }


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
            mongodb.collection("command").insertOne({
               date : new Date(),
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
                if(err == null) res.send(true);
                else res.send(false)
            });
        }
        else res.send(false);
        mongodb.close();
        db.close();
    });

    req.session.panier = [];
    req.session.panierPrice = 0;
});

router.get("/getUser", function(req, res) {
    res.send(req.session.user);
});

module.exports = router;
