var express = require('express');
var common = require('./routes/common');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var githubAuth = require('./index');
var githubRequest = require( 'github-request' ).request;

// Gets the Environment-specific properties
var config = common.config();

// APP CONFIGURATION
var clientId = config.githubClientId;
var clientSecret = config.githubClientSecret;
var callbackUrl = 'http://localhost:5000';
var port = 5000;


// APP LOGIC
var app = express();
app.use( cookieParser() );
app.use( cookieSession({
  secret: 'your secret goes here'
}));

var gha = githubAuth.createClient({
  id: clientId,
  secret: clientSecret
});

gha.success = function( request, response, data ) {
  githubRequest({
    path: '/user?access_token=' + data.accessToken
  }, function( error, user ) {
    if ( error ) {
      return response.send( 500 );
    }

    user.accessToken = data.accessToken;
    gha.users[ request.sessionID ] = user;
    response.redirect( data.originalUrl );
  });
};

app.get( callbackUrl, gha.handshake );

app.get( '/', function( request, response ) {
  response.send( "Welcome! Would you like to view a page with " + 
    "<a href='/required'>required authorization</a> or " + 
    "<a href='/optional'>optional authorization</a>?" );
});

app.get( '/required', gha.authorize, function( request, response ) {
  var accessToken = gha.users[ request.sessionID ].accessToken;
  response.send( "Welcome,  " + gha.users[ request.sessionID ].name );
});

app.get('/optional', function( request, response ) {
  gha.isAuthorized( request, function( error, isAuthorized ) {
    if ( error ) {
      response.send( 500 );
    }

    var name = isAuthorized ?
      gha.users[ request.sessionID ].accessToken : 
      "anonymous";

    response.send( "Hello, " + name );
  });
});

app.listen( port );

// app.get('/', function (req, res) {
//   res.send('Hello World!')
// })

// var server = app.listen(3000, function () {

//   var host = server.address().address
//   var port = server.address().port

//   console.log('Example app listening at http://%s:%s', host, port)

// })