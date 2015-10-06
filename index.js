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

var Room = function(name, owner) {
    this.name = name;
    this.owner = owner;
};

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

var people = {};
var rooms = {};

io.on('connection', function(socket){
    socket.on("join", function(name) {
        console.log(getTime() + name + " connected.");
        people[socket.id] = {"name": name, "room": null};
        socket.emit("update", "Hello, " + name + ". Please create or join a room.");
        socket.emit("roomList", rooms);
    });
    
    socket.on("refreshRooms", function() {
        socket.emit("roomList", rooms);
    });
    
    socket.on("createRoom", function(name) {
        if( !rooms[name] ) {
            var room = new Room(name, socket.id);
            rooms[name] = room;
            socket.join(name);
            people[socket.id].room = name
        } else {
            socket.emit("update", "That room name is already taken.");
        }
    });
    
    socket.on('chat message', function(msg){
        var user = people[socket.id];
        io.to(user.room).emit('chat message', user.name + ': ' + msg);
    });
    
    socket.on('disconnect', function() {
        var user = people[socket.id];
        if(user) {
            if(user.room) {
                io.to(user.room).emit('chat message', user.name + ' disconnected.');
            }
            console.log(getTime() + user.name + ' disconnected.');
            delete people[socket.id];
        }
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});