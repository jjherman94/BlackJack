var deck_ = require( './Deck' );
var dealer_ = require( './Dealer' );

// Game class
exports.Game = function()
{
  this.numSeats = 5;
  this.deck = null;
  this.players = Array();
  this.dealer = new dealer_.Dealer(this);
  this.currentPlayerIndex = null;
  this.started = false;
  this.finished = false;
  this.waitingForBets = false;
  this.playerQueue = Array();
};

exports.Game.prototype = {};

exports.Game.prototype.getStatus = function()
{
  toReturn = {};
  toReturn.players = [];
  for(playerIndex in this.players)
  {
    var player = this.players[playerIndex];
    toReturn.players.push({name:player.name, hand:player.hand});
  }
  toReturn.dealer = {hand: this.dealer.visibleHand};
  if(this.currentPlayer())
  {
    toReturn.currentName = this.currentPlayer().name;
  }
  //Add winners if needed
  if(this.finished) 
  {
    //reveal the hidden card
    toReturn.dealer.hiddenCard = this.dealer.hiddenCard;
    for(var i = 0; i < this.players.length; i++) 
    {
       toReturn.players[i].winnings = this.players[i].winnings;
    }
  }
  return toReturn;
};

exports.Game.prototype.startRound = function()
{
  if(this.players.length > 0 && !this.started)
  {
    this.deck = new deck_.Deck();
    this.started = true;
    this.finished = false;
    this.waitingForBets = true;
    this.dealer.dealCards();
    this.currentPlayerIndex = 0;
    return true;
  }
  return false;
};

exports.Game.prototype.checkReady = function()
{
  //if all player bets are > 0 then the game is ready to start
  for(var playerIndex in this.players)
  {
    if(this.players[playerIndex].bet === 0)
    {
      return false;
    }
  }
  return true;
}

exports.Game.prototype.nextPlayer = function()
{
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
  this.finished = true;
  this.players.forEach( function( player )
  {
    if( player.getHandValue() > player.game.dealer.getHandValue() )
    {
      player.chips += player.bet;
      player.winnings = player.bet;
    }
    else if( player.getHandValue() < player.game.dealer.getHandValue() )
    {
      player.chips -= player.bet;
      player.winnings = -player.bet;
    }
    else
    {
      player.winnings = 0;
    }
    player.bet = 0;
  } );
  var this_ = this;
  this.playerQueue.forEach( function( player )
  {
    this_.addPlayer(player);
  });
  this.playerQueue = Array();
};

exports.Game.prototype.removePlayer = function( player )
{
  //TODO: Program this
};

exports.Game.prototype.currentPlayer = function()
{
  return this.players[this.currentPlayerIndex];
};
