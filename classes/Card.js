// Card class
exports.Card = function( suit, rank, value )
{
  this.suit = suit;
  this.rank = rank;
  this.value = value;
};

exports.Card.prototype.valueOf = function()
{
  return this.value;
};

exports.SuitsEnum = {"Spade": 0, "Club": 1, "Diamond": 2, "Heart": 3};