const { Chess } = require("chess.js");

let game = function() {
  this.playerA = null;
  this.playerB = null;
  this.nameA = null;
  this.nameB = null;
  this.gameState = "0"; //"A" means A won, "B" means B won, "ABORTED" means the game was aborted, 0 1 2 means amount of players, "AB" means draw
  this.lastMove = null;
  this.board = new Chess();
  this.currentMove = new move();
  this.turn = "A"; //A is turn for A, B is turn for B
};

/**
 * Gets other player in game
 */
game.prototype.getOtherPlayer = function(player) {
  if (this.playerA == player) {
    return this.playerB;
  }
  else {
    return this.playerA;
  }
}

/**
 * Sets the winner of the game
 */
game.prototype.setWinner = function(player) {
  if (this.playerA == player) {
    this.gameState = "A";
  }
  else if(player == null) {
    this.gameState = "AB";
  }
  else {
    this.gameState = "B";
  }
}

/**
 * Checks whos turn it is
 */
game.prototype.isPlaying = function(player) {
  if (this.playerA == player) {
    return this.turn == "A";
  }
  else if (this.playerB == player) {
    return this.turn == "B";
  }
}

/**
 * Sets the turn to the next turn
 */
game.prototype.nextTurn = function() {
  if (this.turn == "A") {
    this.turn = "B";
  }
  else {
    this.turn = "A";
  }
};

/**
 * Adds a player to the game and returns "A" or "B"
 */
game.prototype.addPlayer = function(player) {
  if (this.playerA == null) {
    this.playerA = player;
    this.gameState = 1;
    return "A";
  }
  else if (this.playerB == null) {
    this.playerB = player;
    this.gameState = 2;
    return "B";
  }
};

/**
 * Aborts the game
 */
game.prototype.abort = function() {
  this.board = null;
  this.gameState = "ABORTED";
}


/**
 * Removes a player from the game and alters the game state
 */
game.prototype.removePlayer = function(player) {
  if (this.playerA == player) {
    this.playerA = this.playerB;
    this.playerB = null;
    if (this.playerA == null) {
      this.gameState = 0;
    }
    else {
      this.gameState = 1;
    }
  }
  if (this.playerB = player) {
    this.playerB = null;
    this.gameState = "ABORTED";
  }
}

/**
 * Object to store a move in
 */
let move = function() {
  this.type = "move";
  this.from = null;
  this.to = null;
};

/**
 * Exports modules
 */
module.exports = {
  game,
  move,
};
 
