// Card class
var Card = function( suit, rank, value )
{
  this.suit = suit;
  this.rank = rank;
  this.value = value;
};

Card.prototype.valueOf = function()
{
  return this.value;
};

var SuitsEnum = {"Spade": 0, "Club": 1, "Diamond": 2, "Heart": 3};