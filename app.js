let express = require("express");
let http = require("http");
let websocket = require("ws");

// Set up ports and routing
let port = process.env.PORT || 3000;
let app = express();
let indexRouter = require("./routes/index");

app.use(express.static(__dirname + "/public"));

// Use ejs as view renderer
app.set('view engine', 'ejs')
app.get('/', function(req, res) {
  res.render('splash.ejs', {gamesInitialized: gameStatus.gamesInitialized,  playersConnected: gameStatus.playersConnected, playersWaiting: gameStatus.playersWaiting });
})
app.use('/', indexRouter);

let server = http.createServer(app);
const wss = new websocket.Server({ server });

// Import necessary game objects
let Game = require("./game").game;
let Move = require("./game").move;
let gameStatus = require("./gameStats");

let currentGame = new Game();

let games = new Map();

/**
 * Handle incoming connections
 */
wss.on("connection", function connection(ws) {

  gameStatus.playersConnected++;
  gameStatus.playersWaiting++;

  // Save player and player type
  let con = ws;
  let playerType = currentGame.addPlayer(con);

  games.set(con, currentGame);

  // Log player that joined the current game
  console.log(
    "Player %s placed in current game",
    playerType
  );

  // Two players have joined game 
  if (currentGame.gameState == 2) {
    // Tell clients game started
    con.send(JSON.stringify("STARTED"));
    currentGame.getOtherPlayer(con).send(JSON.stringify("STARTED"));
    
    // Start new game
    currentGame = new Game();
    gameStatus.gamesInitialized++;
    gameStatus.playersWaiting = gameStatus.playersWaiting-2; 
  }

  /**
   * Handle client to server messages
   */
  con.on("message", function incoming(message) {
    
    // Get message and game associated with client
    let oMsg = JSON.parse(message);
    let gameObj = games.get(con);

    // If no game exists for this client, game is aborted
    if (gameObj == null) {
      con.send(JSON.stringify("ABORT"));
      return;
    }

    // Set name on client side
    if (oMsg.type == "Name") {
      if (gameObj.gameState == 1) {
        gameObj.nameA = oMsg.data;
        let nameA = new playerName('A', gameObj.nameA);
        gameObj.playerA.send(JSON.stringify(nameA));
      }
      else {
        gameObj.nameB = oMsg.data;

        let nameA = new playerName('A', gameObj.nameA);
        let nameB = new playerName('B', gameObj.nameB);

        // gameObj.playerA.send(JSON.stringify(nameA));
        gameObj.playerA.send(JSON.stringify(nameB));
        gameObj.playerB.send(JSON.stringify(nameA));
        gameObj.playerB.send(JSON.stringify(nameB));
      }
      return;
    }

    // Check if game has started
    if (gameObj.gameState != 2) {
      return
    } 

    // Stop if player is not playing
    if (!gameObj.isPlaying(con)) {
      return;
    }

    // Log error when message is of undefined type
    if (typeof oMsg.type == "undefined") {
      console.log(oMsg);
      return;
    }
    // Player selected tile
    else if (oMsg.type = "Selected") {

      let board = gameObj.board;

      // Piece on board
      let piece = board.get(oMsg.data);

      let currentFrom = gameObj.currentMove.from;

      // Chooses empty tile
      if (piece == null) {

        // No piece has been selected yet
        if (currentFrom == null) {
          return;
        }
        // Try to execute move
        else {
          gameObj.currentMove.to = oMsg.data;

          // Null if not valid move, not null if valid
          let isValid =  board.move({from: gameObj.currentMove.from, to: gameObj.currentMove.to });
          
          //Move has been made
          if (isValid != null) {
            
            // Update player screens
            gameObj.playerA.send(JSON.stringify(gameObj.currentMove));
            gameObj.playerB.send(JSON.stringify(gameObj.currentMove));

            // Check if player has won by check-mate
            if (board.in_checkmate()) {
              gameObj.setWinner(con);
              con.send(JSON.stringify("WON"));
              gameObj.getOtherPlayer(con).send(JSON.stringify("LOST"));
              gameStatus.gamesInitialized--;
              return;
            }

            // Checks if game is draw
            if (board.in_draw() || board.in_stalemate()) {
              gameObj.setWinner(null);
              con.send(JSON.stringify("DRAW"));
              gameObj.getOtherPlayer(con).send(JSON.stringify("DRAW"));
              gameStatus.gamesInitialized--;
              return;
            }

            // Start next turn
            gameObj.nextTurn();
            con.send(JSON.stringify("TURN"));
            gameObj.getOtherPlayer(con).send(JSON.stringify("TURN"));
          }
          // Reset move
          gameObj.currentMove = new Move();
          return;
        }
      }
      // Selects own piece
      else if (piece.color == board.turn()) {
        // Update selected piece
        gameObj.currentMove.from = oMsg.data;

        // Show valid moves
        let moves = gameObj.board.moves({ square: oMsg.data, verbose:true });
        let validMoves = new Array();

        for (let i=0; i < moves.length; i++) {
          validMoves[i] = moves[i].to;
        }

        con.send(JSON.stringify({type: "validMoves", data: validMoves}));
      }
      // Selects other colour piece
      else {
        gameObj.currentMove.to = oMsg.data;

        // Null if not valid move, not null if valid
        let isValid =  board.move({from: gameObj.currentMove.from, to: gameObj.currentMove.to });

        // Move has been made
        if (isValid != null) {

          gameObj.playerA.send(JSON.stringify(gameObj.currentMove));
          gameObj.playerB.send(JSON.stringify(gameObj.currentMove));

          // Check if player has won by check-mate
          if (board.in_checkmate()) {
            gameObj.setWinner(con);
            con.send(JSON.stringify("WON"));
            gameObj.getOtherPlayer(con).send(JSON.stringify("LOST"));
            gameStatus.gamesInitialized--;
            return;
          }

          // Checks if game is draw
          if (board.in_draw() || board.in_stalemate()) {
            gameObj.setWinner(null);
            con.send(JSON.stringify("DRAW"));
            gameObj.getOtherPlayer(con).send(JSON.stringify("DRAW"));
            gameStatus.gamesInitialized--;
            return;
          }

          // Start next turn
          gameObj.nextTurn();
          con.send(JSON.stringify("TURN"));
          gameObj.getOtherPlayer(con).send(JSON.stringify("TURN"));

        }

        // Reset move
        gameObj.currentMove = new Move();
        return;
      }
    }

  });

  /**
   * Handles player leaving
   */
  con.on("close", function(code) {
    
    // Log disconnect of player DEBUG
    console.log("Player disconnected ...");

    // Update stats
    gameStatus.playersConnected--;
    
    // Handle client disconnection
    if (code == "1001") {
      
      let gameObj = games.get(con);
      
      // Game already aborted
      if (gameObj == null) return;

      // If game has started, abort
      if (gameObj.gameState == 2) {
        gameObj.abort();
        gameObj.playerA.send(JSON.stringify("ABORT"));
        gameObj.playerB.send(JSON.stringify("ABORT"));
        games.delete(gameObj.playerA);
        games.delete(gameObj.playerB);
        // gameStatus.playersConnected = gameStatus.playersConnected - 1;
        gameStatus.gamesInitialized--;
      }
      // Remove player from unstarted game
      else if(gameObj.gameState == 1) {
        gameObj.removePlayer(con);
        games.delete(con);
        gameStatus.playersWaiting--;
      }
      else {
        gameObj.removePlayer(con);
        games.delete(con);
      }
    }
  });
});

/**
 * Small wrapper for sending playerNames accross socket 
 */
let playerName = function(rank, name) {
  this.type = "playerName";
  this.rank = rank;
  this.name = name;
}


server.listen(port);
