var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('Client connected.');
    var name = false;
    
    socket.on('chat message', function(msg){
        if ( name === false ){
            name = msg;
            io.emit('chat message', name + ' connected.');
        } else {
            io.emit('chat message', name + ': ' + msg);
        }
    });
    
    socket.on('disconnect', function() {
        io.emit('chat message', name + ' disconnected.');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});