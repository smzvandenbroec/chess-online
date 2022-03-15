// const socket = new WebSocket("ws://localhost:3000");
const socket = new WebSocket("wss://chess-on.herokuapp.com/")
const sound = new Audio("./Sounds/Move.wav");
const victory = new Audio("./Sounds/Victory.wav");
victory.volume = 0.7;
let validMoves = null;
let lastMove = null;

/**
 * Update board after move
 */
function updateBoard(move) {
    clearValidMoves();
    // Play move sound
    sound.play();

    //Update move history
    document.getElementById("lastMove").innerHTML = "Last move: " + move.from + " to " + move.to + "<br>";

    // Update destination
    let to = document.getElementById(move.to);
    let from = document.getElementById(move.from);
    
    // Hightlight last move
    if (lastMove != null) {
        lastMove.style.border = '3px solid black';
    }

    to.style.border = "3px solid darkgray";
    lastMove = to;

    // Update destination
    let prevString = to.innerHTML;
    to.innerHTML = from.innerHTML;

    // Clear original tile
    from.innerHTML = "";

    if (prevString == "") {
        return;
    }

    // Add piece to captured pieces
    let containers = document.getElementsByClassName("captured");

    for (let i = 0; i < containers.length; i++) {
        if (containers[i].innerHTML == "") {
            containers[i].innerHTML = prevString;
            break;
        }
    }
}


/**
 * Send name to server on join
 */
socket.onopen = function () {
    const query = window.location.search;
    const param = new URLSearchParams(query);

    const name = new wrapper("Name", param.get("name"));

    sendMessage(name);
}

/**
 * Client to server communication
 */
function sendMessage(message) {
    socket.send(JSON.stringify(message));
}

/** 
 * Server to client communication 
 */
socket.onmessage = function(event) {
    let message = JSON.parse(event.data);
    
    if (typeof message.type == "undefined") {
        const status = document.getElementById("status");

        // Aborts game
        if (message == "ABORT") {
            victory.play();
            alert("Game has been aborted. This means you win!");
            status.innerHTML = "Game aborted. You win!";
            return;
        }
    
        // Shows lose message
        if (message == "LOST") {
            alert("You lost. Better luck next time!");
            status.innerHTML = "You lost. Better luck next time!";
            return;
        }
    
        // Shows won message
        if (message == "WON") {
            victory.play();
            alert("You have won!");
            status.innerHTML = "You have won! Well done!";
            return;
        }

        // Start timer and show message
        if (message == "STARTED") {
            setInterval(() => updateTimer(), 1000);

            status.innerHTML = "Game started. It's white's turn.";
        }
        
        // Change turn message
        if (message == "TURN") {
            turnMinutes = 0;
            turnSeconds = 0;
            if (status.innerHTML == "Game started. It's white's turn.") {
                status.innerHTML = "Game started. It's black's turn.";
            }
            else {
                status.innerHTML = "Game started. It's white's turn.";
            }
        }
    }
    else if (message.type == "move") {
        updateBoard(message);
        return;
    }
    else if (message.type == "playerName") {
        if (message.rank == "A") {
            document.getElementsByClassName("name 1")[0].innerHTML = message.name;
        }
        else {
            document.getElementsByClassName("name 2")[0].innerHTML = message.name;
        }
    }
    else if (message.type == "validMoves") {
        let moves = message.data;

        clearValidMoves();
        validMoves = moves;

        for(let i=0; i < moves.length; i++) {
            let temp = document.getElementById(moves[i]);
                temp.style.boxShadow = '10px 10px 10px rgba(0,0,0,0.5)';
                temp.style.zIndex = '+1';
                temp.style.transform= 'translate(7px, -7px)';
        }

    }
}

/**
 * Clears the valid moves shown on the board
 */
function clearValidMoves() {
    if (validMoves != null) {
        for (let i =0; i < validMoves.length; i++) {
            let temp = document.getElementById(validMoves[i]);

            temp.style = 'none';
        }
    }
}

/**
 * Keeps track of the time
 */
let gameSeconds = 0;
let gameMinutes = 0;
let turnSeconds = 0;
let turnMinutes = 0;

/**
 * Updates the timer
 */
function updateTimer() {

    const gameTimer = document.getElementById("gameTimer");
    const moveTimer = document.getElementById("moveTimer");

    gameSeconds++;
    turnSeconds++;

    gameMinutes = Math.floor(gameSeconds/60);
    turnMinutes = Math.floor(turnSeconds/60);
            
    gameTimer.innerText = gameMinutes + ':' + (gameSeconds - gameMinutes * 60);
    moveTimer.innerHTML = turnMinutes + ':' + (turnSeconds - turnMinutes * 60);
}


/** 
 * Triggers when tile is clicked
 */
function tileClick(tileElement) {
    let selected = function() {tile= tileElement};

    // Safety check, make sure that socket is connected
    if (socket.readyState === WebSocket.CONNECTING) return;

    let package = new wrapper("Selected", tileElement);

    sendMessage(package);
}

/**
 * Add click event to tiles (runs immediately)
 */
let tiles = document.getElementsByClassName("tile");

for (let i = 0; i < tiles.length; i++) {
    tiles[i].addEventListener('click', () => tileClick(tiles[i].id) );
};
