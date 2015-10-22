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
      console.log(rooms[room].name);
      $("#rooms").append( new roomLink(rooms[room].name) );
    }
}); 

socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(getTime() + msg));
    $('#messages').scrollTop( $("#messages")[0].scrollHeight );
});

socket.on('update', function(msg) {
    $('#messages').append($('<li style=\"color:#39F;\">').text(getTime() + msg));
    $('#messages').scrollTop( $("#messages")[0].scrollHeight );
});

});