// Dealer Class
var Dealer = new Player();
Dealer.prototype.constructor = function()
{
  this.hiddenCard = new Card();
  this.visibleHand = [];
};

var standValue = 17;

Dealer.prototype.dealCards = function()
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

Dealer.prototype.takeTurn = function()
{
  while( this.getHandValue() < standValue )
  {
    this.visibleHand.push( getGame().deck.getCard() );
  }
};

Dealer.prototype.getHandValue = function()
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