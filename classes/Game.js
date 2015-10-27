var deck = require('./Deck');
var dealer = require('./Dealer');

// Game class
exports.Game = function()
{
  this.numSeats = 5;
  this.deck = new deck.Deck();
  this.players = Array();
  this.dealer = new dealer.Dealer();
};

exports.Game.prototype = {};

exports.Game.prototype.cycleThroughPlayers = function()
{

};

exports.Game.prototype.addPlayer = function(player) {
    this.players.append(player);
}

exports.Game.prototype.awardWinners = function()
{
  this.players.forEach( function( player )
  {
    if(player.getHandValue() > Game.dealer.getHandValue())
    {
      player.chips += player.bet;
    }
    else if(player.getHandValue() < Game.dealer.getHandValue())
    {
      player.chips -= player.bet;
    }
  } );
  this.deck = new Deck();
};

/*
exports.Game.prototype.getPlayer = function( seat )
{
  return Game.players[seat];
};
*/
