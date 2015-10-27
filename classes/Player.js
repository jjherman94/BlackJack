// Players class
exports.Player = function( username, chips, id, game )
{
  this.username = username;
  this.chips = chips;
  this.id = id;
  this.hand = [];
  this.bet = 0;
  this.game = game;
};

exports.Player.prototype = {};

exports.Player.prototype.betChips = function( chipsBet )
{
  if( chipsBet <= this.chips )
    this.bet = chipsBet;
};

exports.Player.prototype.stand = function()
{

};

exports.Player.prototype.hit = function()
{
  this.hand.push( this.game.deck.getCard() );
};

exports.Player.prototype.split = function()
{
  // Do we want this functionality?
};

/*
Player.prototype.login = function()
{

};

Player.prototype.logout = function()
{

};
*/

exports.Player.prototype.getHandValue = function()
{
  var val = 0;
  var numAces = 0;
  this.hand.forEach( function( card )
  {
    val += card.valueOf();
    if( card.rank === "Ace" )
    {
      numAces++;
    }
  } );
  while( numAces > 0 && val > 21 )
  {
    val = val - 10;
    numAces--;
  }
  return val;
};
