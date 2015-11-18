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
  // If the game hasn't started yet mark it as special and send the info
  if(!this.started)
  {
    toReturn.betInfo = true;
  }
  // If no rounds have been played the deck only bet waiting matters, mark it as such
  if(!this.deck)
  {
    toReturn.isFirst = true;
  }
  for(playerIndex in this.players)
  {
    var player = this.players[playerIndex];
    toReturn.players.push({name:player.name, hand:player.hand, bet:player.bet, chips:player.chips});
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
  player.hand = Array();
  player.bet = 0;
  player.game = this;
  if(!this.started) 
  {
    this.currentPlayerIndex++;
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
  for(i = 0; i<this.players.length; i++)
  {
    if(this.players[i] === player)
    {
      this.players.splice(i,1);
      if(i < this.currentPlayerIndex)
      {
        this.currentPlayerIndex--;
      }
      else if(i === this.currentPlayerIndex)
      {
        this.currentPlayerIndex--;
        this.nextPlayer();
      }
      return;
    }
  }
  for(i = 0; i<this.playerQueue.length; i++)
  {
    if(this.playerQueue[i] === player)
    {
      this.playerQueue.splice(i,1);
      return;
    }
  }
};

exports.Game.prototype.currentPlayer = function()
{
  return this.players[this.currentPlayerIndex];
};
