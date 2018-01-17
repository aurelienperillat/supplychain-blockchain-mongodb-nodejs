'use strict';

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var promise = require("promise");
var config = require("../config.js");


var query = function(keyValueStore, cryptoSuite, userName, request) {
	return new Promise(function(resolve, reject){
		var fabric_client = new Fabric_Client();
		
		var channel = fabric_client.newChannel(config.channel);
		var peer = fabric_client.newPeer(config.peer.apiUrl);
		channel.addPeer(peer);
		
		fabric_client.setStateStore(keyValueStore);
		fabric_client.setCryptoSuite(cryptoSuite);
			
		fabric_client.getUserContext(userName, true
		).then(function(user_from_store) {
			if (user_from_store && user_from_store.isEnrolled()) {
				console.log('Successfully loaded ' + userName + ' from persistence');
			} else {
				reject({
					code : 403,
					message : 'Failed to retrieve ' + userName + " from persistence"
				});
			}

			return channel.queryByChaincode(request);
		}).then(function(query_responses) {
			console.log("Query has completed, checking results");
			if (query_responses && query_responses.length == 1) {
				if (query_responses[0] instanceof Error) {
					console.log("error from query = ", query_responses[0]);
					reject({
						code : 500,
						message : "error from query = " + query_responses[0].toString()
					});
				} else {
					console.log("Response is ", query_responses[0].toString());
					resolve({
						code : 200,
						message : query_responses[0].toString()
					});
				}
			} else {
				console.log("No payloads were returned from query");
				rejct({
					code : 500,
					message : "No payloads were returned from query"
				});
			}
		}).catch((err) => {
			console.error('Failed to query successfully :: ' + err);
			reject({
				code : 500,
				message : 'Failed to query successfully :: ' + err
			});
		});
	});
}

module.exports = {
	query : query
}