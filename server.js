var config        = require('./config.js'),
    socketServer  = require('./vws.socket.js').server;

var redis = require('redis');
var client = redis.createClient(); //creates a new client


client.on('connect', function() {
    console.log('connected');
});

socketServer( 'example', function ( connection, server ) {

  connection.on('open', function ( id ) {
    console.log('[open]');
  });

  connection.on('message', function ( msg ) {
    console.log('[message]');
    console.log(msg);

    // Store Data in redis
    var msgData = JSON.parse(msg.utf8Data);

    var channel = msgData.action.data[0].channel;

    client.hmset(channel, msgData, function(err, result){
      if(!err)
        connection.send( msg.utf8Data );  
    });

    
  });

  connection.on('error', function ( err ) {
    console.log(err);
  });

  connection.on('close', function(){
    // console.log('[close]');
  });


}).config( config );