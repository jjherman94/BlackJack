// Game class
var Game = function()
{
  this.numSeats = 5;
  this.deck = new Deck();
  this.players = [];
  this.dealer = new Dealer();
};

Game.prototype.cycleThroughPlayers = function()
{

};

Game.prototype.awardWinners = function()
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

var getGame = function()
{
  return Game;
};

Game.prototype.getPlayer = function( seat )
{
  return Game.players[seat];
};