// Dealer Class
var player = require('./Player');
var card = require('./Card');

//needs to be defined
exports.Dealer = function(){}

// Inheritance
exports.Dealer.prototype = Object.create(player.Player.prototype);

exports.Dealer.prototype.constructor = function()
{
  this.hiddenCard = new card.Card();
  this.visibleHand = [];
};

var standValue = 17;

exports.Dealer.prototype.dealCards = function()
{
  getGame().players.forEach( function( player )
  {
    player.hand.push( getGame().deck.getCard() );
  } );
  this.hiddenCard = getGame().deck.getCard();
  getGame().players.forEach( function( player )
  {
    player.hand.push( getGame().deck.getCard() );
  } );  
  this.visibleHand.push( getGame().deck.getCard() );
};

exports.Dealer.prototype.takeTurn = function()
{
  while( this.getHandValue() < standValue )
  {
    this.visibleHand.push( getGame().deck.getCard() );
  }
};

exports.Dealer.prototype.getHandValue = function()
{
  var val = 0;
  var numAces = 0;
  val = this.hiddenCard.valueOf();
  if( this.hiddenCard.rank === "Ace" )
  {
    numAces++;
  }
  this.visibleHand.forEach( function( card )
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
