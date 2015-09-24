var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

function getTime() {
    var d = new Date(),
        h = (d.getHours()<10?'0':'') + d.getHours(),
        m = (d.getMinutes()<10?'0':'') + d.getMinutes(),
        s = (d.getSeconds()<10?'0':'') + d.getSeconds();
    return "["+h+":"+m+":"+s+"] ";
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log(getTime() + "Connection from " + socket.origin);
    var name = false;
    
    socket.on('chat message', function(msg){
        if ( name === false ){
            name = msg.replace(/ /g, "_");
            io.emit('chat message', name + ' connected.');
            console.log(getTime() + socket.origin + ' identified as ' + name);
        } else {
            io.emit('chat message', name + ': ' + msg);
            console.log(getTime() + name + "sent: " + msg);
        }
    });
    
    socket.on('disconnect', function() {
        if (name !== false) {
            io.emit('chat message', name + ' disconnected.');
            console.log(getTime() + name + ' connected.');
        }
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});