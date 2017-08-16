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

router.get("/", function(req, res){
    res.render('login.ejs', {url : URL.url});    
});

router.post("/login", function(req, res){
    var addressVal = req.body.address;
    var passwordVal = req.body.password;
    var typeVal = req.body.type;

    console.log("address: " + addressVal);
    console.log("password: " + passwordVal);
    
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
                type:typeVal,
                address:addressVal, 
                password:passwordVal
            }).toArray(function(err, docs){
                console.log(docs);
                if(err != null){
                    console.log(err);
                    res.send(false);
                } 
                else if(docs.length == 0) res.send(false);
                else {
                    req.session.user = docs[0];
                    req.session.panier = [];
                    req.session.panierPrice = 0;
                    console.log(req.session.user);
                    res.send(true);
                }
            });
        }
        else{
            res.send(false);
            console.log(err);
        } 
        mongodb.close();
        db.close();
    });    
});

router.get("/signin", function(req, res){
    res.render('signin.ejs', {url : URL.url});    
});

router.get("/logout", function(req, res){
    req.session.destroy(function(err){
        if(err != null){
            console.log(err);
            res.send(false);
        }
        else {
            res.redirect("/");
        }
    });
});

router.post("/signin", function(req, res){
    var typeVal = req.body.type;
    var addressVal = req.body.address;
    var nameVal = req.body.name;
    var lastNameVal = req.body.lastname;
    var passwordVal = req.body.password;
    var deliveryAddressVal = req.body.deliveryaddress;
    var companyVal = req.body.company;

    console.log("type:" + typeVal);
    console.log("address:" + addressVal);
    console.log("password:" + passwordVal);
    console.log("name:" + nameVal);
    console.log("lastname" + lastNameVal);
    console.log("deliveryadress" + deliveryAddressVal);
    console.log("company: " + companyVal);

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
            mongodb.collection("user").insertOne({
                type: typeVal,
                address: addressVal,
                password: passwordVal,
                name: nameVal,
                lastname: lastNameVal,
                deliveryaddress: deliveryAddressVal,
                company : companyVal
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

router.get("/home/:type", function(req, res){
    var typeVal = req.params.type;

    if(typeVal == "1")
        res.render('admin-catalogue.ejs', {user : req.session.user, url : URL.url});
    if(typeVal == "2")
        res.render('client-catalogue.ejs', {user : req.session.user, url : URL.url});
    if(typeVal == "3")
        res.render('transporteur.ejs', {user : req.session.user, url : URL.url});
});

module.exports = router;