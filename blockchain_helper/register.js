'use strict';

var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');
var path = require('path');
var util = require('util');
var os = require('os');
var config = require("../config.js");
var promise = require("promise");

var register = function(keyValueStore, cryptoSuite, name, registrar) {
    return new Promise(function(resolve, reject) {
        var fabric_ca_client  = new Fabric_CA_Client(config.ca.url, config.ca.tlsOptions , config.ca.name, cryptoSuite);
        
        var fabric_client = new Fabric_Client();

        fabric_client.setStateStore(keyValueStore);
        fabric_client.setCryptoSuite(cryptoSuite);

        fabric_ca_client.register({
            enrollmentID: name, 
            affiliation: config.affiliation,
        }, 
        registrar).then(function(secret) {
            console.log('Successfully registered ' + name + ' - secret: ' + secret);
            return fabric_ca_client.enroll({
                enrollmentID: name, 
                enrollmentSecret: secret
            });
        }).then(function(enrollment){
            console.log('Successfully enrolled member user ' + name);
            return fabric_client.createUser({
                username: name,
                mspid: config.ca.admin.mspid,
                cryptoContent: { 
                    privateKeyPEM: enrollment.key.toBytes(), 
                    signedCertPEM: enrollment.certificate 
                }
            });
        }).then(function(user){
            console.log(user);
            return fabric_client.setUserContext(user);
        }).then(function(){
            console.log(name + ' was successfully registered and enrolled and is ready to intreact with the fabric network');
            resolve({
                code : 200,
                message : name + ' was successfully registered and enrolled and is ready to intreact with the fabric network'
            });
        }).catch(function(err){
            console.log(err);
            reject({
                code : 500,
                message : err
            });
        });
    });
}

module.exports = {
    register : register
}