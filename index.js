var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

function getTime() {
    var d = new Date(),
        h = (d.getHours()<10?'0':'') + d.getHours(),
        m = (d.getMinutes()<10?'0':'') + d.getMinutes(),
        s = (d.getSeconds()<10?'0':'') + d.getSeconds();
    return "["+h+":"+m+":"+s+"] ";
}

//general static files
app.use('/', express.static(__dirname + '/static'));

//special static chat-file
app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html');
});

//something simple for posting right now
app.use(bodyParser.urlencoded({extended: true}));
app.post('/submit.html', function(request, response)
{
    console.log('Got username: ' + request.body.username);
    console.log('Got password: ' + request.body.password);
    response.end("submitted");
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