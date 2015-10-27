var card_ = require('./classes/Card');
var dealer_ = require('./classes/Dealer');
var deck_ = require('./classes/Deck');
var game_ = require('./classes/Game');
var player_ = require('./classes/Player');

exports.createGame = function() {
    return new game_.Game();
}

exports.createPlayer = function(username, chips) {
    return new player_.Player(username, chips);
}
