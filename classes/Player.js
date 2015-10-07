// Players class
var Player = function( username, chips, seat )
{
  this.username = username;
  this.chips = chips;
  this.seat = seat;
  this.hand = [];  
};


Player.prototype.bet = function( chipsBet )
{
  this.chips = this.chips - chipsBet;
};

Player.prototype.stand = function()
{

};

Player.prototype.hit = function()
{

};

Player.prototype.split = function()
{

};

Player.prototype.login = function()
{

};

Player.prototype.logout = function()
{

};

Player.prototype.getHandValue = function()
{
  var val = 0;
  this.hand.forEach( function( card )
  {
    val += card.valueOf();
  } );
  return val;
};