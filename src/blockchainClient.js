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

module.exports = {
    setup: setup
}
