function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let playerOne = "x"
let playerTwo = "o";
let gameOver = false;
let turn = 1;
let scoreX = 0;
let scoreO = 0;
let soloGame = false;
let tabl = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
]

function play(elem) {
    if (gameOver == false && elem.innerHTML == "") {
        if (turn % 2 != 0) {
            elem.innerHTML = playerOne;
        } else if (soloGame == false && turn % 2 == 0) {
            elem.innerHTML = playerTwo;
        }
        updateGrid();
        checkWinner()
        if (soloGame == true && turn % 2 == 0 && gameOver == false) {
            versusCpu();
        }
    }
}

function updateGrid() {
    let index = 0;
    for (let i = 0; i < tabl.length; i++) {
        for (let j = 0; j < tabl[i].length; j++) {
            tabl[i][j] = document.querySelectorAll(".case")[index].innerHTML;
            index++;
        }
    }
    turn++;
}


function checkWinner() {
    let winner = 0;
    // Vérification des lignes
    for (let i = 0; i < tabl.length; i++) {
        if (tabl[i][0] === playerOne && tabl[i][1] === playerOne && tabl[i][2] === playerOne) {
            document.querySelector(".result").innerHTML = playerOne + " a gagné";
            gameOver = true;
            winner = playerOne;
        } else if (tabl[i][0] === playerTwo && tabl[i][1] === playerTwo && tabl[i][2] === playerTwo) {
            document.querySelector(".result").innerHTML = playerTwo + " a gagné";
            gameOver = true;
            winner = playerTwo;
        }
    }

    // Vérification des colonnes
    for (let i = 0; i < tabl.length; i++) {
        if (tabl[0][i] === playerOne && tabl[1][i] === playerOne && tabl[2][i] === playerOne) {
            document.querySelector(".result").innerHTML = playerOne + " a gagné";
            gameOver = true;
            winner = playerOne;
        } else if (tabl[0][i] === playerTwo && tabl[1][i] === playerTwo && tabl[2][i] === playerTwo) {
            document.querySelector(".result").innerHTML = playerTwo + " a gagné";
            gameOver = true;
            winner = playerTwo;
        }
    }

    // Vérification de la diagonale haut-gauche vers bas-droite
    if (tabl[0][0] === playerOne && tabl[1][1] === playerOne && tabl[2][2] === playerOne) {
        document.querySelector(".result").innerHTML = playerOne + " a gagné";
        gameOver = true;
        winner = playerOne;
    } else if (tabl[0][0] === playerTwo && tabl[1][1] === playerTwo && tabl[2][2] === playerTwo) {
        document.querySelector(".result").innerHTML = playerTwo + " a gagné";
        gameOver = true;
        winner = playerTwo;
    }

    // Vérification de la diagonale haut-droite vers bas-gauche
    if (tabl[0][2] === playerOne && tabl[1][1] === playerOne && tabl[2][0] === playerOne) {
        document.querySelector(".result").innerHTML = playerOne + " a gagné";
        gameOver = true;
        winner = playerOne;
    } else if (tabl[0][2] === playerTwo && tabl[1][1] === playerTwo && tabl[2][0] === playerTwo) {
        document.querySelector(".result").innerHTML = playerTwo + " a gagné";
        gameOver = true;
        winner = playerTwo;
    }

    // Vérification si égalité
    if (turn == 10 && gameOver == false) {
        document.querySelector(".result").innerHTML = "Égalité";
        gameOver = true;
    }

    if (gameOver == true) {
        incrementScore(winner);
    }
}

function playAgain() {
    turn = 1;
    // Réinitialiser le jeu en supprimant le contenu de chaque case de la grille
    let cases = document.querySelectorAll(".case");
    cases.forEach(function (caseElem) {
        caseElem.textContent = "";
    });

    // Réinitialiser le message de résultat
    let resultElem = document.querySelector(".result");
    resultElem.textContent = "";

    gameOver = false;
}

// Attacher l'événement de clic au bouton "Rejouer"
let retryButton = document.querySelector(".retry button");
retryButton.addEventListener("click", playAgain);

// Choix Croix ou Rond par le premier joueur
function choice(elem) {
    document.getElementsByName("shape").forEach((elem) => {
        if (elem.checked) {
            playerOne = elem.value;
            if (elem.value == "x") {
                document.querySelector('.croix-label').classList.add('croix-label-active');
                document.querySelector('.circle-label').classList.remove('circle-label-active');
            } else {
                document.querySelector('.croix-label').classList.remove('croix-label-active');
                document.querySelector('.circle-label').classList.add('circle-label-active');
            }
        }
        if (!elem.checked) {
            playerTwo = elem.value;
        }
    })
    playAgain();
}

choice();

function incrementScore(winner) {
    if (winner === "x") {
        scoreX++;
        console.log(scoreX);
        document.querySelector("#score-x").innerHTML = scoreX;
    } else if (winner === "o") {
        scoreO++;
        console.log(scoreO);
        document.querySelector("#score-o").innerHTML = scoreO;
    }
}

function chooseMode() {
    soloGame = true;
}

function versusCpu() {
    let randomIndex = random(0, 8);
    let morpion = document.querySelectorAll(".case");
    while (morpion[randomIndex].innerHTML != "") {
        randomIndex = random(0, 8);
    }
    if (playerOne == "x") {
        morpion[randomIndex].innerHTML = "o";
    } else if (playerOne == "o") {
        morpion[randomIndex].innerHTML = "x";
    }
    updateGrid();
    checkWinner();
}
