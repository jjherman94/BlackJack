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
var blackJack = require('./blackjack');

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
    this.people_in = 1;
    this.max_people = 5;
    this.game = blackJack.createGame();
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

//ensure that no users are logged in when the server starts
db.run("UPDATE users SET loggedin=0");

var people = {};
var rooms = {};

io.use(ios(mySession, {autoSave:true}));

io.on('connection', function(socket) {
  
    function checkConnected( ) {
      if(!people[socket.id]){
        console.log("Invalid user");
        return false;
      }
      else {
        return true;
      }
    }
  
    function sendRooms() {
        if(!checkConnected()){
          return;
        }
        //extract out the names to fix a crash
        var tempRooms = Array();
        for(var key in rooms){
          tempRooms.push(rooms[key].name);
        }
        socket.emit("roomList", tempRooms );
        console.log(getTime() + "sending rooms to " + people[socket.id].name);
    }
    function add_user() {
        var toAdd = blackJack.createPlayer(socket.handshake.session.userName,
                                           socket.handshake.session.chips);
        toAdd.databaseName = socket.handshake.session.databaseName;
        people[socket.id] = toAdd;
        sendRooms();
        socket.emit("update", "Yoooo, " + socket.handshake.session.userName + ". Please create or join a room.");
        usersInLobby.push(socket.handshake.session.userName);
    }
    function sendGameState(room) {
        if(!checkConnected()) {
          return;
        }
        io.to(room.name).emit('hands', room.game.getStatus());
    }
    
    //if already signed in, send a login success
    if(socket.handshake.session.userName) {
        socket.emit("loginGood");
        add_user();
    }
    
    socket.on("getRooms", function() {
        if(!checkConnected()) {
          return;
        }
        //socket.emit("update", socket.handshake.session.userName);
        sendRooms();
    });
    
    //leave room function; leave room when disconnecting
    function leaveRoom(room, user) {
        if(!checkConnected()) {
          return;
        }
        user.room = null;
        socket.leave(room.name);
        //need to tell the game that the player left
        room.game.removePlayer(user);
        socket.emit("update", "You left: "+room.name);
        room.people_in--;
        io.to(room.name).emit(user.name + " has left.");
        //destroy the room if empty
        if(room.people_in === 0) {
            delete rooms[room.name];
        }
        else {
          sendGameState(room);
        }
    }
    
    socket.on("createRoom", function(roomName) {
        if(!checkConnected()) {
          return;
        }
        var name = roomName.trim();
        // Don't allow empty names
        if(!name) {
            socket.emit("update", "Must name rooms!");
        } else if( !rooms[name] ) {
            var room = new Room(name, socket.id);
            var user = people[socket.id];
            
            rooms[name] = room;
            socket.join(name);
            //leave old room if needed
            var oldRoom = user.room;
            //make sure the user doesn't recieve the leaving message
            user.room = null;
            if(oldRoom) {
                leaveRoom(oldRoom, user);
            }
            //now re-assign the room
            user.room = room;
            socket.emit("update", "You created and joined: " + name);
            console.log(getTime() + user.name + " created: " + name);
            socket.join(room.name);
            //make the user join the game now
            room.game.addPlayer(user);
            sendGameState(room);
        } else {
            socket.emit("update", "That room name is already taken.");
        }
    });
    
    socket.on("joinRoom", function(name) {
      if(!checkConnected()) {
        return;
      }
      var user = people[socket.id];
      
      if(user && rooms[name]) {
          if(rooms[name].people_in >= rooms[name].max_people) {
              socket.emit("update", "Sorry, that room is full.");
              return;
          }
          //leave the old room if present
          if(user.room) {
              //ignore requests to join rooms that they are already in
              if(user.room.name === name) {
                  socket.emit("update", "You are already in that room.");
                  return;
              }
              leaveRoom(user.room, user);
          }
          user.room = rooms[name];
          user.room.people_in++;
          socket.join(name);
          io.to(user.room.name).emit("update", user.name + " has joined: " + user.room.name);        
          //make the user join the game now
          user.room.game.addPlayer(user);
          sendGameState(user.room);
      } else {
          socket.emit("update", "That room name does not exist.");
      }
    });
    
    socket.on("leaveRoom", function(name) {
        if(!checkConnected()) {
          return;
        }
        var user = people[socket.id];
        if(user && user.room) {
            leaveRoom(user.room, user);
        }
    });
    
    socket.on('chat message', function(msg){
        if(!checkConnected()) {
          return;
        }
        var user = people[socket.id];
        if( user && user.room ) {
          io.to(user.room.name).emit('chat message', user.name + ': ' + msg);
        }
    });
    
    socket.on('disconnect', function() {
        if(!checkConnected()) {
          return;
        }
        var user = people[socket.id];
        if(user) {
            //delete the list of users in the lobby
            usersInLobby.splice(usersInLobby.indexOf(user.name), 1);
            if(user.room) {
                io.to(user.room.name).emit('chat message', user.name + ' disconnected.');
                leaveRoom(user.room, user);
            }
            console.log(getTime() + user.name + ' disconnected [' + user.chips + ' chips]');
            //update chip amounts
            db.run("UPDATE users SET chips=" + user.chips + ", loggedin=0 WHERE username='" + user.databaseName + "'");
            delete people[socket.id];
        }
    });
    
    socket.on('login', function(data) {
        //don't allow people to login multiple times (doesn't work?)
        if(socket.handshake.session.userName) {
            socket.emit("loginBad");
        }
        //first try to find the user (there will only be one result)
        var clean_user = sanitizer.sanitize(data.username);
        //remove '
        clean_user = clean_user.replace(/'/g, "''");
        db.all("SELECT * FROM users WHERE username='" + clean_user + "'", function(err, rows){
            if(rows.length > 0) {
                row = rows[0];
                //now test the password
                password(data.password).verifyAgainst(row.password, function(error, verified){
                    if(verified){
                        //make sure the user isn't already logged in
                        if(row.loggedin) {
                           socket.emit("loginBad");
                           console.log(getTime() + "User " + clean_user + " attempted to log in twice.");
                           return;
                        }
                        //mark user as logged in
                        db.run("UPDATE users SET loggedin=1 WHERE username='" + clean_user + "'");
                        console.log(getTime() + "User " + clean_user + " logged on [" + row.chips + " chips]");
                        socket.handshake.session.userName = clean_user.replace(/''/g, "'");
                        socket.handshake.session.databaseName = clean_user;
                        socket.handshake.session.uid = genuuid();
                        socket.handshake.session.chips = row.chips;
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
    
    socket.on('hit', function() {
        if(!checkConnected()) {
          return;
        }
        var user = people[socket.id];
        //only do something if the person is in a room
        if(user.room && user.game) {
            if(user.game.currentPlayer() === user) {
                user.hit();
                sendGameState(user.room);
            }
        }
    });
    
    socket.on('stand', function() {
        if(!checkConnected()) {
          return;
        }
        var user = people[socket.id];
        if(user.room && user.game) {
            if(user.game.currentPlayer() === user) {
                user.stand();
                sendGameState(user.room);
            }
        }
    });
    
    /*
    socket.on('createGame', function() {
        var user = people[socket.id];
        if(user.room && user.room.owner === socket.id) {
            if(user.room.game.startRound()) {
                console.log(getTime() + "Game started in room " + user.room.name);
                io.to(user.room.name).emit('hands',user.room.game.getStatus());
            }
        }
    });
    */
    
    socket.on('bet', function(amount) {
        if(!checkConnected()) {
          return;
        }
        var user = people[socket.id];
        if(user.room && user.game) {
            var readyToStart = user.betChips(amount);
            if(readyToStart) {
                user.room.game.startRound();
            }
            sendGameState(user.room);
        }
    });
        
    
    socket.on('create', function(data) {
        //make sure the creation is okay
        var clean_user = sanitizer.sanitize(data.username.trim());
        if(clean_user == "") {
            socket.emit("createBad", {'reason': 'Empty user names are not allowed.'});
            return;
        }
        //Also get rid of '
        clean_user = clean_user.replace(/'/g, "''");
        db.all('SELECT 1 FROM users WHERE username="' + clean_user + '"', function(err, rows) {
            if(rows.length > 0) {
                console.log(getTime() + "User " + clean_user + " creation attempted again.");
                socket.emit("createBad", {'reason': 'Username already taken.'});
            } else {
                password(data.password).hash(function(error, hash){
                    var shasum = crypto.createHash('sha1');
                    shasum.update(data.password);
                    db.run("INSERT INTO users VALUES ('" + clean_user
                            + "', '" + hash + "', 500, 1)");
                    console.log(getTime() + "Added user " + clean_user);
                    socket.handshake.session.userName = clean_user;
                    socket.handshake.session.uid = genuuid();
                    //default of 500 chips
                    socket.handshake.session.chips = 500;
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
