var express = require('express');
var sha256 = require('sha256');
var mongoClient = require('mongodb').MongoClient;
var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');
var registerHelper = require("../blockchain_helper/register.js");
var invokeHelper = require("../blockchain_helper/invoke.js");
var config = require("../config.js");
var URL = require("../url.json");

var cryptoKeyStore = Fabric_Client.newCryptoKeyStore({path: config.hfc_store_path});

var cryptoSuite = Fabric_Client.newCryptoSuite();
cryptoSuite.setCryptoKeyStore(cryptoKeyStore);

var keyValueStore = null;

var fabric_ca_client  = new Fabric_CA_Client(config.ca.url, config.ca.tlsOptions , config.ca.name, cryptoSuite);

var fabric_client = new Fabric_Client();

var admin_user = null;

var mongodb = null;

Fabric_Client.newDefaultKeyValueStore({ 
    path: config.hfc_store_path
}).then(function(state_store) {
    keyValueStore = state_store;
    fabric_client.setStateStore(state_store); 
    fabric_client.setCryptoSuite(cryptoSuite);
    return fabric_client.getUserContext(config.ca.admin.enrollmentID, true);
}).then(function(user_from_store) {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
        admin_user = user_from_store;
        return null;
    } 
    else {
        return fabric_ca_client.enroll({
                enrollmentID: config.ca.admin.enrollmentID,
                enrollmentSecret: config.ca.admin.enrollmentSecret
        }).then(function(enrollment) {
            console.log('Successfully enrolled admin user "admin"');
            return fabric_client.createUser({
                username: config.ca.admin.enrollmentID,
                mspid: config.ca.admin.mspid,
                cryptoContent: { 
                    privateKeyPEM: enrollment.key.toBytes(),
                    signedCertPEM: enrollment.certificate
                }
            });
        }).then(function(user) {
          admin_user = user;
          return fabric_client.setUserContext(admin_user);
        }).catch(function(err) {
          console.log('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
          throw new Error('Failed to enroll admin');
        });
    }
}).then(function() {
    console.log('Assigned the admin user to the fabric client ::' + admin_user.toString());
}).catch(function(err) {
    console.error('Failed to enroll admin: ' + err);
});

var router = express.Router();

router.get("/", function(req, res){
    res.render('login.ejs', {url : URL.url});    
});

router.post("/login", function(req, res){
    var addressVal = req.body.address;
    var passwordVal = req.body.password;
    var typeVal = req.body.type;

    console.log("address: " + addressVal);
    console.log("password: " + passwordVal);
    
    mongoClient.connect(config.mongo_path, {
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

    registerHelper.register(keyValueStore, cryptoSuite, addressVal, admin_user
    ).then(function(result) {
        console.log("Succesfully add user to blockchain state")
        const request = {
            chaincodeId : config.chaincodeId,
            fcn : "addUser",
            args : [addressVal, passwordVal, sha256(addressVal + "@" + passwordVal)],
            chainId : config.channel,
            txId : null
        }
    
        return invokeHelper.invoke(keyValueStore, cryptoSuite, addressVal, request);   
    }).then(function(resp){
        mongoClient.connect(config.mongo_path, {
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
    })
    .catch(function(err){
        console.log(err);
        res.send(false);
    })
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
