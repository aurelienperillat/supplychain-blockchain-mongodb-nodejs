var path = require('path');

var config = {};

config.port = 8080;

config.mongo_path = "mongodb://127.0.0.1:27017";

config.hfc_store_path = path.join(__dirname, 'hfc-key-store');

config.ca = {
    name : "ca.example.com",
    url : "http://localhost:7054",
    tlsOptions : {
    	trustedRoots: [],
    	verify: false
    },
    admin : {
        enrollmentID : "admin",
        enrollmentSecret : "adminpw",
        mspid : "Org1MSP"
    }
}

config.orderer = {
    name : "orderer.example.com",
    url : "grpc://localhost:7050"
}

config.peer = {
    name : "peer0.org1.example.com",
    apiUrl : "grpc://localhost:7051",
    eventUrl : "grpc://localhost:7053"
}

config.channel = "mychannel";

config.chaincodeId = "supplychain";

config.affiliation = "org1.department1"

module.exports = config;