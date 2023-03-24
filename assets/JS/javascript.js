let playerOne = "X";
let playerTwo = "O";
let gameOver = false;
let turn = 1;

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

let tabl = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
]

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
    // Vérification des lignes
    for (let i = 0; i < tabl.length; i++) {
        if (tabl[i][0] === playerOne && tabl[i][1] === playerOne && tabl[i][2] === playerOne) {
            document.querySelector(".result").innerHTML = playerOne + " a gagné";
            gameOver = true;
        } else if (tabl[i][0] === playerTwo && tabl[i][1] === playerTwo && tabl[i][2] === playerTwo) {
            document.querySelector(".result").innerHTML = playerTwo + " a gagné";
            gameOver = true;
        }
    }

    // Vérification des colonnes
    for (let i = 0; i < tabl.length; i++) {
        if (tabl[0][i] === playerOne && tabl[1][i] === playerOne && tabl[2][i] === playerOne) {
            document.querySelector(".result").innerHTML = playerOne + " a gagné";
            gameOver = true;
        } else if (tabl[0][i] === playerTwo && tabl[1][i] === playerTwo && tabl[2][i] === playerTwo) {
            document.querySelector(".result").innerHTML = playerTwo + " a gagné";
            gameOver = true;
        }
    }

    // Vérification de la diagonale haut-gauche vers bas-droite
    if (tabl[0][0] === playerOne && tabl[1][1] === playerOne && tabl[2][2] === playerOne) {
        document.querySelector(".result").innerHTML = playerOne + " a gagné";
        gameOver = true;
    } else if (tabl[0][0] === playerTwo && tabl[1][1] === playerTwo && tabl[2][2] === playerTwo) {
        document.querySelector(".result").innerHTML = playerTwo + " a gagné";
        gameOver = true;
    }

    // Vérification de la diagonale haut-droite vers bas-gauche
    if (tabl[0][2] === playerOne && tabl[1][1] === playerOne && tabl[2][0] === playerOne) {
        document.querySelector(".result").innerHTML = playerOne + " a gagné";
        gameOver = true;
    } else if (tabl[0][2] === playerTwo && tabl[1][1] === playerTwo && tabl[2][0] === playerTwo) {
        document.querySelector(".result").innerHTML = playerTwo + " a gagné";
        gameOver = true;
    }

    // Vérification si égalité
    if (turn == 9 && gameOver == false) {
        document.querySelector(".result").innerHTML = "Égalité";
        gameOver = true;
    }

}
