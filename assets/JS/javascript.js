let playerOne = "×"
let playerTwo = "o";
let gameOver = false;
let turn = 1;
let scoreX = 0;
let scoreO = 0;
let tabl = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
]

function play(elem) {
    if (gameOver == false && elem.innerHTML == "") {
        if (turn % 2 != 0) {
            elem.innerHTML = playerOne;
        } else {
            elem.innerHTML = playerTwo;
        }
        updateGrid();
        turn++;
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
    checkWinner();
}


function checkWinner() {
    let winner;
    // Vérification des lignes
    for (let i = 0; i < tabl.length; i++) {
        if (tabl[i][0] === playerOne && tabl[i][1] === playerOne && tabl[i][2] === playerOne) {
            document.querySelector(".result").innerHTML = playerOne + " a gagné";
            gameOver = true;
            winner = "×"

        } else if (tabl[i][0] === playerTwo && tabl[i][1] === playerTwo && tabl[i][2] === playerTwo) {
            document.querySelector(".result").innerHTML = playerTwo + " a gagné";
            gameOver = true;
            winner = "o"

        }
    }

    // Vérification des colonnes
    for (let i = 0; i < tabl.length; i++) {
        if (tabl[0][i] === playerOne && tabl[1][i] === playerOne && tabl[2][i] === playerOne) {
            document.querySelector(".result").innerHTML = playerOne + " a gagné";
            gameOver = true;
            winner = "×"
        } else if (tabl[0][i] === playerTwo && tabl[1][i] === playerTwo && tabl[2][i] === playerTwo) {
            document.querySelector(".result").innerHTML = playerTwo + " a gagné";
            gameOver = true;
            winner = "o"
        }
    }

    // Vérification de la diagonale haut-gauche vers bas-droite
    if (tabl[0][0] === playerOne && tabl[1][1] === playerOne && tabl[2][2] === playerOne) {
        document.querySelector(".result").innerHTML = playerOne + " a gagné";
        gameOver = true;
        winner = "×"
    } else if (tabl[0][0] === playerTwo && tabl[1][1] === playerTwo && tabl[2][2] === playerTwo) {
        document.querySelector(".result").innerHTML = playerTwo + " a gagné";
        gameOver = true;
        winner = "o"
    }

    // Vérification de la diagonale haut-droite vers bas-gauche
    if (tabl[0][2] === playerOne && tabl[1][1] === playerOne && tabl[2][0] === playerOne) {
        document.querySelector(".result").innerHTML = playerOne + " a gagné";
        gameOver = true;
        winner = "×"
    } else if (tabl[0][2] === playerTwo && tabl[1][1] === playerTwo && tabl[2][0] === playerTwo) {
        document.querySelector(".result").innerHTML = playerTwo + " a gagné";
        gameOver = true;
        winner = "o"
    }

    // Vérification si égalité
    if (turn == 9 && gameOver == false) {
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

    // Réinitialiser la variable gameOver
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
    if (winner === "×") {
        scoreX++;
        document.querySelector("#score-x").innerHTML = scoreX;
    } else if (winner === "o") {
        scoreO++;
        document.querySelector("#score-o").innerHTML = scoreO;
    }
}


