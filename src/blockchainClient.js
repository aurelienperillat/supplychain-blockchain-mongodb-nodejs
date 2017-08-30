var Promise = require('bluebird');
var log4js = require('log4js');
var config = require('config');

var blockchainNetwork = require('./blockchain/blockchain_network.js');
var datastore = require('./database/datastore.js');
var logHelper = require('./logging/logging.js');

var constants = require('./constants/constants.js');
var util = require('./utils/util.js');
var validate = require('./utils/validation_helper.js');
var CloudantKeyValueStore = require('./database/model/kv_store_model.js');
var bcSdk = require('./blockchain/blockchain_sdk.js');

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
                console.log("chainclient setup succeed");
                return resolve({statusCode: 200, body: ''});
            })
            .catch(function(err){
                console.log("chainclient setup failed");
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

function signin(params) {
    console.log("entering signin");
    console.log(params);
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'signin', params);

            if(!validate.isValidJson(params)){
                console.log("invalid params");
                logHelper.logError(logger, 'signin', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not sign in. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                console.log("invalid user");
                logHelper.logError(logger, 'signin', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not sign in. Invalid user' })
            }

            var affiliation = params.affiliation;
            if(!validate.isValidString(affiliation)){
                console.log("invalid affiliation");
                logHelper.logError(logger, 'signin', 'Invalid affiliation');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not sign in. Invalid affiliation' })
            }

            bcSdk.recursiveRegister({username: user, affiliation: affiliation})
            .then(function(resp){
                console.log("Successfully register user");
                logHelper.logMessage(logger, 'signin', 'Successfully register user', resp.body);
                return bcSdk.recursiveLogin({username: user, password: resp['body']['password'] })
            })
            .then(function(resp){
                console.log("Successfully enroll user");
                logHelper.logMessage(logger, 'signin', 'Successfully enroll user', resp.body);
                return resolve({statusCode: constants.SUCCESS, body: resp.body});
            })
            .catch(function(err){
                console.log("Could not signin");
                console.log(err)
                logHelper.logError(logger, 'sign in', 'could not sign in', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add user' });
            });
        }
        catch(err){
            console.log("Could not signin");
            console.log(err)
            logHelper.logError(logger, 'add user', 'Could not sign in on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not sign in' });
        }
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

            var reqSpec = bcSdk.getRequestSpec({functionName: 'addUser', args: [user, affiliation, hash]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user})
            .then(function(resp){
                logHelper.logMessage(logger, 'addUser', 'Successfully add user', resp.body);
                return resolve({statusCode: constants.SUCCESS, body: resp.body});
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

function addProduct(params) {
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'addProduct', params);

            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'addProduct', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Product. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'addProduct', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Product. Invalid user' })
            }

            var ref = params.ref;
            if(!validate.isValidString(ref)){
                logHelper.logError(logger, 'addProduct', 'Invalid Ref');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Product. Invalid Ref' })
            }

            var description = params.description;
            if(!validate.isValidString(description)){
                logHelper.logError(logger, 'addProduct', 'Invalid Description');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Product. Invalid Description' })
            }
            
            var price = params.price;
            if(!validate.isValidString(price)){
                logHelper.logError(logger, 'addProduct', 'Invalid Price');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Product. Invalid Price' })
            }
            
            var quantity = params.quantity;
            if(!validate.isValidString(quantity)){
                logHelper.logError(logger, 'addProduct', 'Invalid Quantity');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Product. Invalid Quantity' })
            }
            
            var critical = params.critical;
            if(!validate.isValidString(critical)){
                logHelper.logError(logger, 'addProduct', 'Invalid critical');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Product. Invalid critical' })
            }

            var reqSpec = bcSdk.getRequestSpec({functionName: 'addProduct', args: [ref, description, price, quantity, critical]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user})
            .then(function(resp){
                logHelper.logMessage(logger, 'addProduct', 'Successfully add Product', resp.body);
                return resolve({statusCode: constants.SUCCESS, body:resp.body});
            })
            .catch(function(err){   
                logHelper.logError(logger, 'addProduct', 'Successfully add Product', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add Product' });

            });
        }
        catch(err){
            logHelper.logError(logger, 'add Product', 'Could not create add Product on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add Product' });
        }
    });
}

function addOrder(params) {
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'addOrder', params);

            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'addOrder', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Order. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidJson(user)){
                logHelper.logError(logger, 'addOrder', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Order. Invalid user' })
            }

            var products = params.products;
            if(!validate.isValidJson(products)){
                logHelper.logError(logger, 'addOrder', 'Invalid Products');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Order. Invalid Products' })
            }

            var quantities = params.quantities;
            if(!validate.isValidJson(quantities)){
                logHelper.logError(logger, 'addOrder', 'Invalid Quantities');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Order. Invalid Quantities' })
            }
            
            var totalprice = params.totalprice;
            if(!validate.isValidString(totalprice)){
                logHelper.logError(logger, 'addOrder', 'Invalid TotalPrice');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Order. Invalid TotalPrice' })
            }
            
            var ref = params.ref;
            if(!validate.isValidString(ref)){
                logHelper.logError(logger, 'addOrder', 'Invalid Ref');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Order. Invalid Ref' })
            }
        
            var reqSpec = bcSdk.getRequestSpec({functionName: 'addOrder', args: [user.address+"@"+user.type, JSON.stringify(products), JSON.stringify(quantities), totalprice, ref]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user.address})
            .then(function(resp){
                logHelper.logMessage(logger, 'addOrder', 'Successfully add Order', resp.body);
                return resolve({statusCode: constants.SUCCESS, body:resp.body});
            })
            .catch(function(err){   
                logHelper.logError(logger, 'addOrder', 'Successfully add Order', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add Order' });

            });

        }
        catch(err){
            logHelper.logError(logger, 'add Order', 'Could not create add Order on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add Order' });
        }
    });
}

function setProvision(params) {
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'setProvision', params);

            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'setProvision', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Provision. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'setProvision', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Provision. Invalid user' })
            }

            var Ref = params.Ref;
            if(!validate.isValidString(Ref)){
                logHelper.logError(logger, 'setProvision', 'Invalid Ref');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Provision. Invalid Ref' })
            }

            var Provision = params.Provision;
            if(!validate.isValidString(Provision)){
                logHelper.logError(logger, 'setProvision', 'Invalid Provision');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add Provision. Invalid Provision' })
            }

           

            var reqSpec = bcSdk.getRequestSpec({functionName: 'setProvision', args: [user, Ref,Provision]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user})
            .then(function(resp){
                logHelper.logMessage(logger, 'setProvision', 'Successfully add Provision', resp.body);
                return resolve({statusCode: constants.SUCCESS, body:resp.body});
            })
            .catch(function(err){   
                logHelper.logError(logger, 'setProvision', 'Successfully add Provision', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add Provision' });

            });

        }
        catch(err){
            logHelper.logError(logger, 'add Provision', 'Could not create add Provision on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add Provision' });
        }
    });
}

function setTrakingID(params) {
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'setTrakingID', params);

            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'setTrakingID', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add ID. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'setTrakingID', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add ID. Invalid user' })
            }

            var ref = params.ref;
            if(!validate.isValidString(ref)){
                logHelper.logError(logger, 'setTrakingID', 'Invalid ref');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add ID. Invalid Ref' })
            }

            var trackingID = params.trackingID;
            if(!validate.isValidString(trackinID)){
                logHelper.logError(logger, 'setTrakingID', 'Invalid ID');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add ID. Invalid ID' })
            }

            var reqSpec = bcSdk.getRequestSpec({functionName: 'setTrakingID', args: [trackingID, ref]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user})
            .then(function(resp){
                logHelper.logMessage(logger, 'setTrakingID', 'Successfully add ID', resp.body);
                return resolve({statusCode: constants.SUCCESS, body:resp.body});
            })
            .catch(function(err){   
                logHelper.logError(logger, 'setTrakingID', 'Successfully add ID', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add ID' });

            });
        }
        catch(err){
            logHelper.logError(logger, 'add ID', 'Could not create add ID on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add ID' });
        }
    });
}

function setTransport(params) {
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'setTransport', params);

            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'setTransport', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add carrier. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'setTransport', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add carrier. Invalid user' })
            }

            var colis = params.colis;
            if(!validate.isValidJson(colis)){
                logHelper.logError(logger, 'setTransport', 'Invalid colis');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add carrier. Invalid colis' })
            }

            var ref = params.ref;
            if(!validate.isValidString(ref)){
                logHelper.logError(logger, 'setTransport', 'Invalid ref');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add carrier. Invalid carrier' })
            }
             
            var key = params.key;
            if(!validate.isValidString(key)){
                logHelper.logError(logger, 'setTransport', 'Invalid key');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add carrier. Invalid carrier' })
            }

            var reqSpec = bcSdk.getRequestSpec({functionName: 'setTransport', args: [Json.stringify(colis), ref, key]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user})
            .then(function(resp){
                logHelper.logMessage(logger, 'setTransport', 'Successfully add carrier', resp.body);
                return resolve({statusCode: constants.SUCCESS, body:resp.body});
            })
            .catch(function(err){   
                logHelper.logError(logger, 'setTransport', 'Successfully add carrier', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add carrier' });

            });

        }
        catch(err){
            logHelper.logError(logger, 'add carrier', 'Could not create add carrier on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add carrier' });
        }
    });
}

function setState(params) {
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'setState', params);

            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'setState', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add States. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'setState', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add States. Invalid user' })
            }

            var ref = params.ref;
            if(!validate.isValidString(ref)){
                logHelper.logError(logger, 'setState', 'Invalid Ref');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add States. Invalid Ref' })
            }

            var state = params.state;
            if(!validate.isValidString(state)){
                logHelper.logError(logger, 'setState', 'Invalid States');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not add States. Invalid States' })
            }

            var reqSpec = bcSdk.getRequestSpec({functionName: 'setState', args: [state, ref]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user})
            .then(function(resp){
                logHelper.logMessage(logger, 'setState', 'Successfully add States', resp.body);
                return resolve({statusCode: constants.SUCCESS, body:resp.body});
            })
            .catch(function(err){   
                logHelper.logError(logger, 'setState', 'Successfully add States', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add States' });

            });

        }
        catch(err){
            logHelper.logError(logger, 'add States', 'Could not create add States on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not add States' });
        }
    });
}

function majProduct(params) {
    return new Promise(function(resolve, reject){
        try{
            logHelper.logEntryAndInput(logger, 'majProduct', params);

            if(!validate.isValidJson(params)){
                logHelper.logError(logger, 'majProduct', 'Invalid params');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not update product. Invalid params' })
            }

            var user = params.user;
            if(!validate.isValidString(user)){
                logHelper.logError(logger, 'majProduct', 'Invalid user');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not update product. Invalid user' })
            }

            var refs = params.refs;
            if(!validate.isValidJson(refs)){
                logHelper.logError(logger, 'majProduct', 'Invalid products');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not update product. Invalid products' })
            }

            var ref = params.ref;
            if(!validate.isValidString(ref)){
                logHelper.logError(logger, 'majProduct', 'Invalid ref');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not update product. Invalid ref' })
            }
            
            
            var quantities = params.quantities;
            if(!validate.isValidJson(quantities)){
                logHelper.logError(logger, 'majProduct', 'Invalid quantities');
                return reject({statusCode: constants.INVALID_INPUT, body: 'Could not update product. Invalid quantities' })
            }

            var reqSpec = bcSdk.getRequestSpec({functionName: 'majProduct', args: [Json.stringify(refs), Json.stringify(quantities), ref]});
            bcSdk.recursiveInvoke({requestSpec: reqSpec, user: user})
            .then(function(resp){
                logHelper.logMessage(logger, 'majProduct', 'Successfully update product', resp.body);
                return resolve({statusCode: constants.SUCCESS, body:resp.body});
            })
            .catch(function(err){   
                logHelper.logError(logger, 'majProduct', 'Successfully update product', err);
                return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not update product' });

            });
        }
        catch(err){
            logHelper.logError(logger, 'update product', 'Could not create update product on blockchain ledger: ', err);
            return reject({statusCode: constants.INTERNAL_SERVER_ERROR, body: 'Could not update product' });
        }
    });
}

module.exports = {
    setup: setup,
    signin: signin,
    addUser: addUser,
    addOrder: addOrder,
    addProduct: addProduct,
    majProduct: majProduct,
    setProvision: setProvision,
    setTrackingID: setTrakingID,
    setTransport: setTransport,
    setState: setState
}
