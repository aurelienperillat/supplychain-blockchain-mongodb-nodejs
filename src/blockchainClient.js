var Promise = require('bluebird');
var log4js = require('log4js');
var config = require('config');

var blockchainNetwork = require('./src/blockchain/blockchain_network.js');
var datastore = require('./src/database/datastore.js');
var logHelper = require('./src/logging/logging.js');

var constants = require('./src/constants/constants.js');
var util = require('./src/utils/util.js');
var validate = require('./src/utils/validation_helper.js');
var CloudantKeyValueStore = require('./src/database/model/kv_store_model.js');
var bcSdk = require('./src/blockchain/blockchain_sdk.js');

var cloudantKvStore;
var logger;

function setup(){
    return new Promise(function(resolve, reject){
        try{
            logHelper.logMethodEntry(logger,"setup");

            //Fetch IBM Bluemix Cloudant and Blockchain service instance configuration
            var cloudantConfig = config.VCAP_SERVICES[constants.VCAP_SERVICES_CLOUDANT][0];
            var blockchainConfig = config.VCAP_SERVICES[constants.VCAP_SERVICES_BLOCKCHAIN][0];
            
            //Setup datastore
            var result = datastore.initSync(cloudantConfig);
            if(result.statusCode != constants.SUCCESS){
                logHelper.logError(logger,'Could not initialize datastore', result);
                return reject({statusCode: 500, body: ''});
            }

            //Setup Cloudant based KeyValueStore
            var cloudantSetupDone = false;
            getCloudantKeyValStore(datastore, config.databases[constants.APP_MASTER_DB])
            .then(function(resp){
                cloudantKvStore = resp.body;
                cloudantSetupDone = true;
                return blockchainNetwork.setupBlockchain({blockchainConfig: blockchainConfig, ccName: constants['BLOCKCHAIN_CHAINCODE_NAME'] , kvStore: cloudantKvStore })
            })
            .then(function(resp){
                return resolve({statusCode: 200, body: ''});
            })
            .catch(function(err){
                if(cloudantSetupDone != true){
                    logHelper.logError(logger,'Could not initialize CloudantKeyValueStore', err);
                }
                else{
                    logHelper.logError(logger,'Blockchain setup failed. exiting...',err);
                }
                return reject(err);
            });
            
            
        }
        catch(err){
            logHelper.logError(logger,'Could not complete setup', err);
            throw reject({statusCode: 500, body: err});
        }
    })
    
}

/**
Instantiates CloudantKeyValueStoreModel object with dbName and corresponding dbInstance
**/
function getCloudantKeyValStore(datastore, dbName){
	return new Promise(function(resolve, reject){
		logHelper.logEntryAndInput(logger, 'getCloudantKeyValStore', dbName);

		if(!validate.isValid(datastore)){
			logHelper.logError(logger, 'getCloudantKeyValStore', 'datastore is invalid');
			return reject({statusCode: constants.INVALID_INPUT, body: null});
		}

		if(!validate.isValidString(dbName)){
			logHelper.logError(logger, 'getCloudantKeyValStore', 'dbName is invalid');
			return reject({statusCode: constants.INVALID_INPUT, body: null});
		}

		datastore.getDbInstance(dbName)
		.then(function(resp){
			var dbInstance = resp.body;
			var model = new CloudantKeyValueStore(dbName, dbInstance);
			return resolve({statusCode: constants.SUCCESS, body: model});
		})
		.catch(function(err){
			logHelper.logError(logger, 'getCloudantKeyValStore', 'Could not initialize model for '+dbName, err);
			return reject(err);

		});
	});
}

function addUser(params) {
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'addUser', params);

            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'addUser', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add user. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'addUser', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add user. Invalid user' })
            }

            var affiliation = params.affiliation;
            if(!validate.isValidString(affiliation)){
                logHelper.logError(logger, 'addUser', 'Invalid affiliation');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add user. Invalid affiliation' })
            }

            var hash = params.hash;
            if(!validate.isValidString(hash)){
                logHelper.logError(logger, 'addUser', 'Invalid hash');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add user. Invalid hash' })
            }

            var reqSpec = bcSdk.getRequestSpec({functionName: 'addUser', args: [user, affiliation, userHash]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user})
            .then(function(resp){
                logHelper.logMessage(logger, 'addUser', 'Successfully add user', resp.body);
                return resolve({statusCode: constants.SUCCESS, body: mortgageApplication});
            })
            .catch(function(err){   
                logHelper.logError(logger, 'addUser', 'Successfully add user', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add user' });

            });

        }
        catch(err){
            logHelper.logError(logger, 'add user', 'Could not create add user on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add user' });
        }
    });
}


module.exports = {
    setup: setup
}
