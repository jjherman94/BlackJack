// Players class
exports.Player = function( username, chips )
{
  this.name = username;
  this.chips = chips;
  this.hand = Array();
  this.bet = 0;
  this.game = null;
  this.winnings = 0;
};

exports.Player.prototype.betChips = function( chipsBet )
{
//  if( chipsBet <= this.chips )
//  {
    if(!this.game.started)
    {
      this.bet = chipsBet;
    }
    return this.game.checkReady();
//  }
//  return false;
};

exports.Player.prototype.stand = function()
{
  this.game.nextPlayer();
};

exports.Player.prototype.hit = function()
{
  // Not allowed to hit if already at a blackjack
  if(this.getHandValue() === 21)
  {
    this.stand();
    return;
  }
  this.hand.push( this.game.deck.getCard() );
  // If the value is zero that means they went over 21
  if(this.getHandValue() === 0 || this.getHandValue() === 21)
  {
    this.stand();
  }
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
  if(val > 21)
  {
    val = 0;
  }
  return val;
};
