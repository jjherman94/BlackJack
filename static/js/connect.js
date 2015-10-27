function getTime() {
    var d = new Date(),
        h = (d.getHours()<10?'0':'') + d.getHours(),
        m = (d.getMinutes()<10?'0':'') + d.getMinutes(),
        s = (d.getSeconds()<10?'0':'') + d.getSeconds();
    return "["+h+":"+m+":"+s+"] ";
}

$(window).resize(function(){
    $('#messages').height( $('#sidebar-wrapper').height() - $('#input').height() );
});

$(document).ready(function(){

var socket = io.connect(document.location.origin, {secure: true});

$('#messages').height( $('#sidebar-wrapper').height() - $('#input').height() );

$('#joinRoom').submit(function() {
    socket.emit("joinRoom", $('#joinName').val());
    $('#joinName').val('');
    return false;
});

$('#createRoom').submit(function() {
    socket.emit("createRoom", $('#createName').val());
    $('#createName').val('');
    return false;
});

$('#getRooms').click(function() {
    socket.emit("getRooms");
    console.log("Requesting roomlist");
});

$('#message').submit(function(){
    var msg = $.trim( $('#m').val() );

    if( msg!==null && msg!=="" ) {
        socket.emit('chat message', msg);
    }
    $('#m').val('');
    return false;
});

var roomLink = function(name) {
    var l =$("<li><a href='#'>" + name + "</a></li>").click(function() {
        socket.emit("joinRoom", name);
    });

    return l;
};

socket.on("roomList", function(rooms) {
    console.log("Received roomlist");
    $("#rooms").empty();
    for(var room in rooms) {
      console.log(rooms[room]);
      $("#rooms").append( new roomLink(rooms[room].name) );
    }
}); 

socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(getTime() + msg));
    $('#messages').scrollTop( $("#messages")[0].scrollHeight );
});

socket.on('update', function(msg) {
    $('#messages').append($('<li style=\"color:#ddd;background-color:rgba(0,0,0,.5);\">').text(getTime() + msg));
    $('#messages').scrollTop( $("#messages")[0].scrollHeight );
});

socket.on('loginGood', function() {
    //tried to do this with the following code:
    //  $('#loginModal').hide();
    //  $('.modal-backdrop').hide();
    //and
    //  $('#loginModal').modal('hide');
    //but neither was working, so I did this, which works.
    document.getElementById('loginModal').style.visibility = 'hidden';
});

socket.on('loginBad', function() {
    //TODO: Make function make an error appear
    console.log("bad login");
});

socket.on('createBad', function(data) {
    //ToDO: Make function make an error appear
    console.log("Bad create: " + data.reason());
});

function send_login_() {
    //Get attributes from login form
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    //Send it over to the server
    socket.emit("login", {"username":username, "password":password});
}

function send_create_() {
    //Get attributes from login form
    var username = document.getElementById('create_username').value;
    var password = document.getElementById('create_password').value;
    var password2 = document.getElementById('create_password2').value;
    if(password !== password2) {
       //TODO: Make a failure message about passwords not matching
       return;
    }
    socket.emit("create", {"username":username, "password":password});
}

function send_hit_() {
    socket.emit("hit");
}

function send_stay_() {
    socket.emit("stand");
}

function send_create_game_() {
    socket.emit("createGame");
}

//make a global versions (by excluding var)
send_login = send_login_;
send_create = send_create_;
send_hit = send_hit_;
send_stay = send_stay_;
send_create_game = send_create_game_;

});
