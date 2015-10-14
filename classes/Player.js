// Players class
var Player = function( username, chips, seat )
{
  this.username = username;
  this.chips = chips;
  this.seat = seat;
  this.hand = [];
  this.bet = 0;
};


Player.prototype.betChips = function( chipsBet )
{
  if( chipsBet <= this.chips )
    this.bet = chipsBet;
};

Player.prototype.stand = function()
{

};

Player.prototype.hit = function()
{
  this.hand.push( getGame().deck.getCard() );
};

Player.prototype.split = function()
{
  // Do we want this functionality?
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