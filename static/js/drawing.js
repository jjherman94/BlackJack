function offsetByCard(card) {
  if(!card) {
    return {x: 5 * 72, y: 100 * 4};
  }
  //Suit enums: 
  //{"Spade": 0, "Club": 1, "Diamond": 2, "Heart": 3};
  //var suits = ["Heart","Diamond","Club","Spade"];
  var suits = [3, 2, 1, 0];
  var ranks = ["Ace", '2', '3', '4', '5', '6', '7', '8', '9', '10', "Jack", "Queen", "King"];
  var y = 100 * suits.indexOf(card.suit);
  var x = 72 * ranks.indexOf(card.rank);
  return {x: x, y: y};
}

function drawCards(gameStatus) {
  var c = document.getElementById("blackjackBoard");
  var ctx = c.getContext("2d");
  var cards = document.getElementById("cards");
  ctx.clearRect(0, 0, c.width, c.height);
  //draw hidden card
  var hiddenOffsets = offsetByCard(gameStatus.dealer.hiddenCard);
  ctx.drawImage(cards, hiddenOffsets.x, hiddenOffsets.y, 72, 100, 0, 0, 72, 100);
  var x = 15;
  var y = 0;
  //draw card function
  function drawCard(card) {
    var offsets = offsetByCard(card);
    ctx.drawImage(cards, offsets.x, offsets.y, 72, 100, x, y, 72, 100);
    x += 15;
  }
  gameStatus.dealer.hand.forEach(drawCard);
  gameStatus.players.forEach(function(player) {
    x = 0;
    y += 120;
    player.hand.forEach(drawCard);
  });
}   
