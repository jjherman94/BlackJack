// Deck class
var card = require('./Card');
exports.Deck = function()
{
  this.cards = Array();
  // Spades
  this.cards.push( new card.Card( card.SuitsEnum.Spade, "Ace", 11 ) );
  for( var i = 1; i < 10; i++ )
  {
    this.cards.push( new card.Card( card.SuitsEnum.Spade, (i + 1).toString(),
      i + 1 ) );
  }
  this.cards.push( new card.Card( card.SuitsEnum.Spade, "Jack", 10 ) );
  this.cards.push( new card.Card( card.SuitsEnum.Spade, "Queen", 10 ) );
  this.cards.push( new card.Card( card.SuitsEnum.Spade, "King", 10 ) );

  // Clubs
  this.cards.push( new card.Card( card.SuitsEnum.Club, "Ace", 11 ) );
  for( var i = 1; i < 10; i++ )
  {
    this.cards.push( new card.Card( card.SuitsEnum.Club, (i + 1).toString(),
      i + 1 ) );
  }
  this.cards.push( new card.Card( card.SuitsEnum.Club, "Jack", 10 ) );
  this.cards.push( new card.Card( card.SuitsEnum.Club, "Queen", 10 ) );
  this.cards.push( new card.Card( card.SuitsEnum.Club, "King", 10 ) );

  // Diamonds
  this.cards.push( new card.Card( card.SuitsEnum.Diamond, "Ace", 11 ) );
  for( var i = 1; i < 10; i++ )
  {
    this.cards.push( new card.Card( card.SuitsEnum.Diamond, (
      i + 1).toString(),
      i + 1 ) );
  }
  this.cards.push( new card.Card( card.SuitsEnum.Diamond, "Jack", 10 ) );
  this.cards.push( new card.Card( card.SuitsEnum.Diamond, "Queen", 10 ) );
  this.cards.push( new card.Card( card.SuitsEnum.Diamond, "King", 10 ) );

  // Hearts
  this.cards.push( new card.Card( card.SuitsEnum.Heart, "Ace", 11 ) );
  for( var i = 1; i < 10; i++ )
  {
    this.cards.push( new card.Card( card.SuitsEnum.Heart, (
      i + 1).toString(),
      i + 1 ) );
  }
  this.cards.push( new card.Card( card.SuitsEnum.Heart, "Jack", 10 ) );
  this.cards.push( new card.Card( card.SuitsEnum.Heart, "Queen", 10 ) );
  this.cards.push( new card.Card( card.SuitsEnum.Heart, "King", 10 ) );
  
  this.shuffleDeck();
};

exports.Deck.prototype.shuffleDeck = function()
{
  var m = this.cards.length, t, i;
  // While there remains elements to shuffle…
  while( m )
  {
    // Pick a remaining element…
    i = Math.floor( Math.random() * m-- );
    // And swap it with the current element.
    t = this.cards[m];
    this.cards[m] = this.cards[i];
    this.cards[i] = t;
  }
};

exports.Deck.prototype.getCard = function()
{
  return this.cards.pop();
};