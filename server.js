var config        = require('./config.js'),
    socketServer  = require('./vws.socket.js').server;

var redis = require('redis'),
    jsonify = require('redis-jsonify'),
    client = jsonify(redis.createClient()); //creates a new client


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

    var msgData = JSON.parse(msg.utf8Data);
    var channel = msgData.action.data[0].channel;

    if(msgData.action.command === 'Top10Msg'){

      //Fetch Top 10 messages from a channel, based on 'Top10Msg' command
      client.lrange(channel, -10, -1, function(err, reply) {
        if(reply && reply.length > 0 ){

          reply.forEach(function(data){
            var data = JSON.parse(data);
            data.id = connection.id;
            connection.sendUTF( JSON.stringify(data) );
          })

        }
      });

    } else {

      console.log(Object.keys(server.connections)); // All connected client ids
      console.log(connection.id); // current connected browser client id

      // Store Data in redis agianst channel as uniq key
      client.rpush([channel, msgData], function(err, result){
        if(!err){
          var keys = Object.keys(server.connections);
          for (var j=0; j<keys.length; j++) {

            var key = keys[j];
            var value = server.connections[key];

            msgData.id = key;
            value.send( JSON.stringify(msgData) );
          } 
        }

        // If there are no more messages in the channel, then after 24hrs from the last send message in that channel
        // All messages in that channel along with complete channel will be delted
        client.expireat(key, parseInt((+new Date)/1000) + 86400);
      });

    }

  });

  connection.on('error', function ( err ) {
    console.log(err);
  });

  connection.on('close', function(){
    //console.log('[close]');
  });


}).config( config );
