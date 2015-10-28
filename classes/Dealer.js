// Dealer Class
var player = require('./Player');
var card = require('./Card');

exports.Dealer = function(game)
{
  this.hiddenCard = new card.Card();
  this.visibleHand = [];
  this.game = game;
};

exports.Dealer.prototype.dealCards = function()
{
  var game = this.game;
  game.players.forEach( function( player )
  {
    player.hand = Array();
    player.hand.push( game.deck.getCard() );
  } );
  this.hiddenCard = game.deck.getCard();
  this.game.players.forEach( function( player )
  {
    player.hand.push( game.deck.getCard() );
  } );  
  this.visibleHand.push( game.deck.getCard() );
};

exports.Dealer.prototype.takeTurn = function()
{
  var standValue = 17;
  while( this.getHandValue() < standValue )
  {
    this.visibleHand.push( this.game.deck.getCard() );
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
