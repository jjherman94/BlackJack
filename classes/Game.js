var deck_ = require( './Deck' );
var dealer_ = require( './Dealer' );

// Game class
exports.Game = function()
{
  this.numSeats = 5;
  this.deck = new deck_.Deck();
  this.players = Array();
  this.dealer = new dealer_.Dealer();
  this.currentPlayerIndex = null;
};

exports.Game.prototype = {};

exports.Game.prototype.startRound = function()
{
  if(this.players.lenght > 0)
  {
    this.dealer.dealCards();
    this.currentPlayerIndex = 0;
  }
};

exports.Game.prototype.nextPlayer = function()
{
  this.dealer.dealCards();
  this.currentPlayerIndex++;
  if( this.currentPlayerIndex === this.players.length )
  {
    this.dealer.takeTurn();
//    this.awardWinners();
  }
};

exports.Game.prototype.addPlayer = function( player )
{
  this.players.append( player );
}

exports.Game.prototype.awardWinners = function()
{
  this.players.forEach( function( player )
  {
    if( player.getHandValue() > Game.dealer.getHandValue() )
    {
      player.chips += player.bet;
    }
    else if( player.getHandValue() < Game.dealer.getHandValue() )
    {
      player.chips -= player.bet;
    }
  } );
  this.deck = new deck_.Deck();
  this.startRound();
};

/*
 exports.Game.prototype.getPlayer = function( seat )
 {
 return Game.players[seat];
 };
 */
