const joinButton = document.getElementById("joinButton");
const nameBox = document.getElementById("playerName");
let submitError = false;

//TODO
/* Extract information from form */
joinButton.onclick = function() {

    if(nameBox.value == "Enter name here" || nameBox.value == "" || nameBox.value == "Please enter a name") {
        nameBox.value = "Please enter a name";
        nameBox.style.borderColor="red";
        nameBox.style.color="Red";
        submitError = true;
    }
    else {
        window.location.href = "http://chess-on.herokuapp.com/play?name=" + nameBox.value;
    }
    
}

/* Empties box to write */
nameBox.onclick = function() {

    if (submitError) {
        nameBox.style.borderColor="black";
        nameBox.style.color="black";
    }

    if (nameBox.value === "Enter name here" || nameBox.value == "Please enter a name") {
        nameBox.value = "";
    }
}

