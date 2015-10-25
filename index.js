var express = require('express');
var app = express();
var fs = require('fs');
var https = require('https');
var sqlite3 = require('sqlite3');
var crypto = require('crypto');
var password = require('password-hash-and-salt');
var sanitizer = require('sanitizer');
var session = require('express-session');
var genuuid = require('uuid');
var ios = require('socket.io-express-session');

var HTTPS_PORT = 3300;
var HTTP_PORT = 3000;

//must set up server before Socket.IO
var credentials = {key: fs.readFileSync('sslcert/server.key', 'utf8'),
                   cert: fs.readFileSync('sslcert/server.crt', 'utf8'),
                   requestCert: true};
                 
var httpsServer = https.createServer(credentials, app);

var io = require('socket.io')(httpsServer);

function getTime() {
    var d = new Date(),
        h = (d.getHours()<10?'0':'') + d.getHours(),
        m = (d.getMinutes()<10?'0':'') + d.getMinutes(),
        s = (d.getSeconds()<10?'0':'') + d.getSeconds();
    return "["+h+":"+m+":"+s+"] ";
}

httpsServer.listen(HTTPS_PORT, function(){
    console.log(getTime() + 'https listening on port ' + HTTPS_PORT);
    console.log(getTime() + 'http listening on port ' + HTTP_PORT);
});

var Room = function(name, owner) {
    this.name = name;
    this.owner = owner;
};

var mySession = session({secret: 'glarble marble barble',
                         resave: true,
                         saveUninitialized: true,
                         cookieName: 'session'});

//set up sessions
app.use(mySession);

//List of all users in the lobby
var usersInLobby = [];

//special static chat-file
app.get('/', function(req,res){
    //don't allow the user to log-in multiple times
    /*
    TODO: Make this not buggy
    if(usersInLobby.indexOf(req.session.userName) > -1) {
        res.sendFile(__dirname + '/alreadyjoined.html');
    } else {
        res.sendFile(__dirname + '/index.html');
    }
    */
    res.sendFile(__dirname + '/index.html');
});

//general static files
app.use('/', express.static(__dirname + '/static'));

var db = new sqlite3.Database('users.sql3');

var people = {};
var rooms = {};

io.use(ios(mySession, {autoSave:true}));

io.on('connection', function(socket) {
    function add_user() {
        people[socket.id] = {"name": socket.handshake.session.userName, "room": null};
        socket.emit("update", "Hello, " + socket.handshake.session.userName + ". Please create or join a room.");
        usersInLobby.push(socket.handshake.session.userName);
    }
    //if already signed in, send a login success
    if(socket.handshake.session.userName) {
        socket.emit("loginGood");
        add_user();
    }
    
    socket.on("getRooms", function() {
        //socket.emit("update", socket.handshake.session.userName);
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
            //delete the list of users in the lobby
            usersInLobby.splice(usersInLobby.indexOf(user.name), 1);
            if(user.room) {
                io.to(user.room).emit('chat message', user.name + ' disconnected.');
            }
            console.log(getTime() + user.name + ' disconnected.');
            delete people[socket.id];
        }
    });
    
    socket.on('login', function(data) {
        //don't allow people to login multiple times
        if(socket.handshake.session.userName) {
            socket.emit("loginBad");
        }
        //first try to find the user (there will only be one result)
        var clean_user = sanitizer.sanitize(data.username);
        db.all("SELECT * FROM users WHERE username='" + clean_user + "'", function(err, rows){
            if(rows.length > 0) {
                row = rows[0];
                //now test the password
                password(data.password).verifyAgainst(row.password, function(error, verified){
                    if(verified){
                        console.log(getTime() + "User " + clean_user + " logged on");
                        socket.handshake.session.userName = clean_user;
                        socket.handshake.session.uid = genuuid();
                        add_user();
                        socket.emit("loginGood");
                    } else {
                        console.log(getTime() + "Password verification failed for user " + clean_user);
                        socket.emit("loginBad");
                    }
                });
            } else {
                console.log(getTime() + "User " + clean_user + " not found.");
                socket.emit("loginBad");
            }
        });
    });
    
    socket.on('create', function(data) {
        //make sure the creation is okay
        var clean_user = sanitizer.sanitize(data.username);
        if(clean_user == "") {
            socket.emit("createBad", {'reason': 'Empty user names are not allowed.'});
        }
        db.all('SELECT 1 FROM users WHERE username="' + clean_user + '"', function(err, rows) {
            if(rows.length > 0) {
                console.log(getTime() + "User " + clean_user + " creation attempted again.");
                socket.emit("createBad", {'reason': 'Username already taken.'});
            } else {
                password(data.password).hash(function(error, hash){
                    var shasum = crypto.createHash('sha1');
                    shasum.update(data.password);
                    db.run("INSERT INTO users VALUES ('" + clean_user
                            + "', '" + hash + "')");
                    console.log(getTime() + "Added user " + clean_user);
                    socket.handshake.session.userName = clean_user;
                    socket.handshake.session.uid = genuuid();
                    add_user();
                    socket.emit("loginGood");
                });
            }
        });
    });
});

//Redirect any http requests to https
var http = require('http');
var httpApp = express();
httpApp.get('*', function(req, res) {
    var split_loc = req.headers['host'].indexOf(':');
    var new_host = req.headers['host'].substring(0, split_loc);
    if(split_loc == -1) {
        new_host = req.headers['host'];
    }
    res.redirect('https://' + new_host + ':' + HTTPS_PORT + req.url );
});
var httpServer = http.createServer(httpApp);
httpServer.listen(HTTP_PORT);
