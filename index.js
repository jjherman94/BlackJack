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
var bodyParser = require('body-parser');

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
                         resave: false,
                         saveUninitialized: true,
                         cookieName: 'session'});

//set up sessions
app.use(mySession);

//redirect to main page if the user is already logged in
app.get('/login.html', function(req, res) {
    if(!req.session.userName) {
        res.sendFile(__dirname + '/static/login.html');
    } else {
        res.redirect("/");
    }
});

//List of all users in the lobby
var usersInLobby = [];

//special static chat-file
app.get('/', function(req,res){
    if(!req.session.userName) {
        res.sendFile(__dirname + '/prompt.html');
    } else {
        //don't allow the user to log-in multiple times
        if(usersInLobby.indexOf(req.session.userName) > -1) {
            res.sendFile(__dirname + '/alreadyjoined.html');
        } else {
            res.sendFile(__dirname + '/index.html');
        }
    }
});

//general static files
app.use('/', express.static(__dirname + '/static'));

var db = new sqlite3.Database('users.sql3');

app.use(bodyParser.urlencoded({extended: true}));
app.post('/create.html', function(request, response)
{
    //make sure that there isn't already a user with that name
    var clean_user = sanitizer.sanitize(request.body.username);
    if(clean_user === "") {
        response.end("No empty names allowed.");
    }
    db.each('SELECT 1 FROM users WHERE username="' + clean_user + '"', function(err, row){
        //nothing here
    },
    function(err, rows){
        if(rows != 0) {
            console.log(getTime() + "User " + clean_user + " creation attempted again.");
            response.sendFile(__dirname + '/submiterror.html');
        } else {
            password(request.body.password).hash(function(error, hash){
    
            var shasum = crypto.createHash('sha1');
            shasum.update(request.body.password);
            db.run("INSERT INTO users VALUES ('" + clean_user
                    + "', '" + hash + "')");
            console.log(getTime() + "Added user " + clean_user);
            //console.log("Current Database: ");
            //db.each("SELECT rowid AS id, username, password FROM users", function(err, row){
            //    console.log(row.id + ": Username=" + row.username + "; Password=" + row.password);
            //});
            response.sendFile(__dirname + '/submitconfirmation.html');
            });
        }
    });
});

app.post('/login.html', function(request, response)
{
    //first try to find the user (there will only be one result)
    var clean_user = sanitizer.sanitize(request.body.username);
    db.each("SELECT * FROM users WHERE username='" + clean_user + "'", function(err, row){
        //now test the password
        password(request.body.password).verifyAgainst(row.password, function(error, verified){
            if(verified){
                console.log(getTime() + "User " + clean_user + " logged on");
                request.session.userName = clean_user;
                request.session.uid = genuuid();
                response.redirect("/");
            } else {
                console.log(getTime() + "Password verification failed for user " + clean_user);
                response.sendFile(__dirname + '/loginfail.html');
            }
        });
    },
    function(err, rows) {
        if(rows == 0) {
            console.log(getTime() + "User " + clean_user + " not found.");
            response.sendFile(__dirname + '/loginfail.html');
        }
    });
});

var people = {};
var rooms = {};

io.use(ios(mySession));

io.on('connection', function(socket) {
    people[socket.id] = {"name": socket.handshake.session.userName, "room": null};
    socket.emit("update", "Hello, " + socket.handshake.session.userName + ". Please create or join a room.");
    usersInLobby.push(socket.handshake.session.userName);
    
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
});

//Redirect any http requests to https
var http = require('http');
var httpApp = express();
httpApp.get('*', function(req, res) {
    var new_host = req.headers['host'].substring(0, req.headers['host'].indexOf(':'));
    res.redirect('https://' + new_host + ':' + HTTPS_PORT + req.url );
});
var httpServer = http.createServer(httpApp);
httpServer.listen(HTTP_PORT);
