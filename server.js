var express = require('express');
var bodyparser = require('body-parser');
var session = require("express-session");
var mongostore = require("connect-mongodb-session")(session);

const util = require('util')
const assert = require('assert');

var signinRouter = require("./routes/signinRoutes.js");
var adminRouter = require("./routes/adminRoutes.js");
var clientRouter = require("./routes/clientRoutes.js");
var transporteurRouter = require("./routes/transporteurRoutes.js");

var port = process.env.PORT || 8080;
var app = express();

var store = new mongostore({
  uri: "mongodb://admin:DXHZWYEWIEVJCYJT@sl-eu-lon-2-portal.0.dblayer.com:18713,sl-eu-lon-2-portal.4.dblayer.com:18713/admin?ssl=true",
  collection: "session"
});

store.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
});

app.set('view engine', 'ejs');

app.use(session({
  secret : "supplychain",
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week 
  },
  store : store,
  resave : true,
  saveUninitialized : true
}));

app.use(bodyparser.json({     
  limit: '20mb'
}));       

app.use(bodyparser.urlencoded({     
  extended: true, 
  limit: '20mb'
}));

app.use(express.static('public'));

app.use(signinRouter);
app.use(adminRouter);
app.use(clientRouter);
app.use(transporteurRouter);

app.listen(port, function() {
  console.log('Node app is running on port', port);
  require("cf-deployment-tracker-client").track();
});
