// Deck class
var Deck = function()
{
  this.cards = [];
  // Spades
  this.cards.push( new Card( this.cards.SuitsEnum.Spade, "Ace", 11 ) );
  for( var i = 1; i < 10; i++ )
  {
    this.cards.push( new Card( this.cards.SuitsEnum.Spade, (i + 1).toString(),
      i + 1 ) );
  }
  this.cards.push( new Card( this.cards.SuitsEnum.Spade, "Jack", 10 ) );
  this.cards.push( new Card( this.cards.SuitsEnum.Spade, "Queen", 10 ) );
  this.cards[12].push( Card( this.cards.SuitsEnum.Spade, "King", 10 ) );

  // Clubs
  this.cards.push( new Card( this.cards.SuitsEnum.Club, "Ace", 11 ) );
  for( var i = 1; i < 10; i++ )
  {
    this.cards.push( new Card( this.cards.SuitsEnum.Club, (i + 1).toString(),
      i + 1 ) );
  }
  this.cards.push( new Card( this.cards.SuitsEnum.Club, "Jack", 10 ) );
  this.cards.push( new Card( this.cards.SuitsEnum.Club, "Queen", 10 ) );
  this.cards.push( new Card( this.cards.SuitsEnum.Club, "King", 10 ) );

  // Diamonds
  this.cards.push( new Card( this.cards.SuitsEnum.Diamond, "Ace", 11 ) );
  for( var i = 1; i < 10; i++ )
  {
    this.cards.push( new Card( this.cards.SuitsEnum.Diamond, (
      i + 1).toString(),
      i + 1 ) );
  }
  this.cards.push( new Card( this.cards.SuitsEnum.Diamond, "Jack", 10 ) );
  this.cards.push( new Card( this.cards.SuitsEnum.Diamond, "Queen", 10 ) );
  this.cards.push( new Card( this.cards.SuitsEnum.Diamond, "King", 10 ) );

  // Hearts
  this.cards.push( new Card( this.cards.SuitsEnum.Heart, "Ace", 11 ) );
  for( var i = 1; i < 10; i++ )
  {
    this.push( new Card( this.cards.SuitsEnum.Heart, (
      i + 1).toString(),
      i + 1 ) );
  }
  this.cards.push( new Card( this.cards.SuitsEnum.Heart, "Jack", 10 ) );
  this.cards.push( new Card( this.cards.SuitsEnum.Heart, "Queen", 10 ) );
  this.cards.push( new Card( this.cards.SuitsEnum.Heart, "King", 10 ) );
};

Deck.prototype.shuffleDeck = function()
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

Deck.prototype.getCard = function()
{
  return this.cards.pop();
};