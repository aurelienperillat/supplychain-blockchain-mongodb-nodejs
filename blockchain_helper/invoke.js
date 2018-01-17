'use strict';

var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');
var config = require("../config.js");
var promise = require("promise");

var invoke = function(keyValueStore, cryptoSuite, userName, request) {
	return new Promise(function(resolve, reject){
		var fabric_client = new Fabric_Client();
		
		var channel = fabric_client.newChannel(config.channel);
		var peer = fabric_client.newPeer(config.peer.apiUrl);
		channel.addPeer(peer);
		
		var order = fabric_client.newOrderer(config.orderer.url);
		channel.addOrderer(order);

		fabric_client.setStateStore(keyValueStore);
		fabric_client.setCryptoSuite(cryptoSuite);
		
		var tx_id = null;
		
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
		
			tx_id = fabric_client.newTransactionID();
			request.txId = tx_id;
			console.log("Assigning transaction_id: ", tx_id._transaction_id);
				
			return channel.sendTransactionProposal(request);
		}).then(function(results) {
			var proposalResponses = results[0];
			var proposal = results[1];
			let isProposalGood = false;
			if (proposalResponses && proposalResponses[0].response &&
				proposalResponses[0].response.status === 200) {
					isProposalGood = true;
					console.log('Transaction proposal was good');
				} else {
					console.error('Transaction proposal was bad');
					reject({
						code : 400,
						message : 'Transaction proposal was bad'
					});
				}
			if (isProposalGood) {
				console.log(util.format(
					'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
					proposalResponses[0].response.status, proposalResponses[0].response.message));
		
				request = {
					proposalResponses: proposalResponses,
					proposal: proposal
				};
		
				var transaction_id_string = tx_id.getTransactionID();
				var promises = [];
		
				var sendPromise = channel.sendTransaction(request);
				promises.push(sendPromise); 

				let event_hub = fabric_client.newEventHub();
				event_hub.setPeerAddr(config.peer.eventUrl);
		
				let txPromise = new Promise(function(resolve, reject) {
					let handle = setTimeout(function() {
						event_hub.disconnect();
						reject({
							code : 504,
							message : 'Transaction did not complete within 30 sec'
						});
					}, 3000);

					event_hub.connect();
					event_hub.registerTxEvent(transaction_id_string, function(tx, code) {
						clearTimeout(handle);
						event_hub.unregisterTxEvent(transaction_id_string);
						event_hub.disconnect();
		
						var return_status = {event_status : code, tx_id : transaction_id_string};
						if (code !== 'VALID') {
							console.error('The transaction was invalid, code = ' + code);
							reject({
								code : 500,
								message : 'Problem with the tranaction, event status ::'+code
							});
						} else {
							console.log('The transaction has been committed on peer ' + event_hub._ep._endpoint.addr);
							resolve({
								code : 200,
								message : return_status
							});
						}
					}, function(err) {
						console.log('There was a problem with the eventhub ::'+err);
						reject({
							code : 500,
							message : 'There was a problem with the eventhub ::'+err
						});
					});
				});
				promises.push(txPromise);
		
				return Promise.all(promises);
			} 
			else {
				console.log('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
				reject({
					code : 500,
					message : 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'
				});
			}
		}).then(function(results) {
			console.log('Send transaction promise and event listener promise have completed');
			resolve({
				code : 200,
				message : results
			});
		}).catch(function(err) {
			console.error('Failed to invoke successfully :: ' + err);
			reject({
				code : 500,
				message : err
			});
		});
	});
}

module.exports = {
	invoke : invoke
}

