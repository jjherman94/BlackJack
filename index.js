var express = require('express');
var app = express();
var fs = require('fs');
var https = require('https');
var sqlite3 = require('sqlite3');
var crypto = require('crypto');
var password = require('password-hash-and-salt');

//must set up server before Socket.IO
var credentials = {key: fs.readFileSync('sslcert/server.key', 'utf8'),
                   cert: fs.readFileSync('sslcert/server.crt', 'utf8'),
                   requestCert: true};
                 
var httpsServer = https.createServer(credentials, app);

httpsServer.listen(3300, function(){
    console.log('https listening on *:3300');
});

var io = require('socket.io')(httpsServer);
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

//something simple for posting right now (memory database only)
var db = new sqlite3.Database(':memory:');

db.run("CREATE TABLE users (username TEXT, password TEXT)");

app.use(bodyParser.urlencoded({extended: true}));
app.post('/submit.html', function(request, response)
{
    password(request.body.password).hash(function(error, hash){
    
        var shasum = crypto.createHash('sha1');
        shasum.update(request.body.password);
        db.run("INSERT INTO users VALUES ('" + request.body.username 
              + "', '" + hash + "')");
        console.log("Current Database: ");
        db.each("SELECT rowid AS id, username, password FROM users", function(err, row){
            console.log(row.id + ": Username=" + row.username + "; Password=" + row.password);
        });
    });
    response.end("submitted");
});

var people = {};
var rooms = {};

var socket_function = function(socket){
    socket.on("join", function(name) {
        console.log(getTime() + name + " connected.");
        people[socket.id] = {"name": name, "room": null};
        socket.emit("update", "Hello, " + name + ". Please create or join a room.");
    });
    
    socket.on("getRooms", function() {
        socket.emit("roomList", rooms );
        console.log(getTime() + "sending rooms to " + people[socket.id].name);
    });
    
    socket.on("createRoom", function(name) {
        if( !rooms[name] ) {
            var room = new Room(name, socket.id);
            var user = people[socket.id];
            
            rooms[name] = room;
            socket.join(name);
            user.room = name;
            socket.emit("update", "You created: " + user.room);
            console.log(getTime() + user.name + " created room " + user.room);
        } else {
            socket.emit("update", "That room name is already taken.");
        }
    });
    
    socket.on("joinRoom", function(name) {
      var user = people[socket.id];
      if(user && rooms[name]) {
        user.room = name;
        socket.join(name);
        io.to(user.room).emit("update", user.name + " has joined: " + user.room);        
      }
    });
    
    socket.on("leaveRoom", function(name) {
      var user = people[socket.id];
      if(user && user.room) {
          user.room = null;
          socket.leave(name);
          io.to(name).emit(user.name + "has left.");
      }
    });
    
    socket.on('chat message', function(msg){
        var user = people[socket.id];
        if( user && user.room ) {
          io.to(user.room).emit('chat message', user.name + ': ' + msg);
        }
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
};

io.on('connect', socket_function);
