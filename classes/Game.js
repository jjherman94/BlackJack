var deck_ = require( './Deck' );
var dealer_ = require( './Dealer' );

// Game class
exports.Game = function()
{
  this.numSeats = 5;
  this.deck = new deck_.Deck();
  this.players = Array();
  this.dealer = new dealer_.Dealer(this);
  this.currentPlayerIndex = null;
  this.started = false;
  this.playerQueue = Array();
};

exports.Game.prototype = {};

exports.Game.prototype.startRound = function()
{
  if(this.players.length > 0 && !this.started)
  {
    this.started = true;
    this.dealer.dealCards();
    this.currentPlayerIndex = 0;
    return true;
  }
  return false;
};

exports.Game.prototype.nextPlayer = function()
{
  this.dealer.dealCards();
  this.currentPlayerIndex++;
  if( this.currentPlayerIndex === this.players.length )
  {
    //no longer started
    this.dealer.takeTurn();
    this.started = false;
    this.awardWinners();
  }
};

exports.Game.prototype.addPlayer = function( player )
{
  player.game = this;
  if(!this.started) 
  {
    this.players.push( player );
  } 
  else 
  {
    this.playerQueue.push( player );
  }
}

exports.Game.prototype.awardWinners = function()
{
  this.players.forEach( function( player )
  {
    if( player.getHandValue() > player.game.dealer.getHandValue() )
    {
      player.chips += player.bet;
    }
    else if( player.getHandValue() < player.game.dealer.getHandValue() )
    {
      player.chips -= player.bet;
    }
  } );
  this.deck = new deck_.Deck();
  var me = this;
  this.playerQueue.forEach( function( player )
  {
    me.addPlayer(player);
  });
  this.playerQueue = Array();
  //TODO: Make this "wait" for bets to be placed first
  this.startRound();
};

exports.Game.prototype.removePlayer = function( player )
{
  //TODO: Program this
};

exports.Game.prototype.currentPlayer = function()
{
  return this.players[this.currentPlayerIndex];
};
