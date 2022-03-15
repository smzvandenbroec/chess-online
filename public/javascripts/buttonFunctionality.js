const muteButton = document.getElementById("muteButton");
const helpButton = document.getElementById("helpButton");
const backgroundAudio = new Audio("./Sounds/Background.mp3");
const clickAudio = new Audio('./Sounds/Button.wav');
backgroundAudio.volume = 0.3;

/*Shows a new screen with a description*/
helpButton.onclick = function() {
    clickAudio.play();
    window.alert("This is a classic variant of the popular game Chess. To play the game you select a piece and then a valid spot will show on the board to click on. The last move will be highlighted and mentioned on the bottom right. The gamestatus can be found above the gameboard. There is also a timer for both game time and turn time. The most important thing is to enjoy! :)");
}

/*Mutes/unmutes the game when the mute button gets clicked*/
muteButton.onclick = function() {
    
    clickAudio.play();
   /* if inner HTML is mute this means that mute button is pressed, so the audio is paused*/
    if (muteButton.innerHTML === "Mute") {
        muteButton.innerHTML = "Unmute";
        backgroundAudio.pause();
        backgroundAudio.currentTime = 0;
    }
    else {
    /* in the else case, the player presses the unmute button and the audio continues to play*/
        muteButton.innerHTML = "Mute";
        backgroundAudio.play();
    }
}

/* when the audio ends, it starts again and loops*/
window.onload = function() { 
    backgroundAudio.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
}
