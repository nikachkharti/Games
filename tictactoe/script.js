const X_CLASS = 'x';
const O_CLASS = 'o';
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const cellElements = document.querySelectorAll('[data-cell]');
const board = document.getElementById('board');
const winningMessageElement = document.getElementById('winningMessage');
const winningModal = document.getElementById('winningModal');
const restartButton = document.getElementById('restartButton');
const modalRestartButton = document.getElementById('modalRestartButton');
const statusMessage = document.getElementById('statusMessage');
const turnXElement = document.getElementById('turn-x');
const turnOElement = document.getElementById('turn-o');

let circleTurn;

startGame();

restartButton.addEventListener('click', startGame);
modalRestartButton.addEventListener('click', startGame);

function startGame() {
    circleTurn = false;
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS);
        cell.classList.remove(O_CLASS);
        cell.classList.remove('winning');
        cell.innerText = '';
        cell.removeEventListener('click', handleClick);
        cell.addEventListener('click', handleClick, { once: true });
    });
    winningModal.classList.remove('show');
    updateTurnIndicator();
}

function handleClick(e) {
    const cell = e.target;
    const currentClass = circleTurn ? O_CLASS : X_CLASS;

    // Place Mark
    placeMark(cell, currentClass);

    // Check For Win
    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        // Swap Turns
        swapTurns();
        updateTurnIndicator();
    }
}

function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
    cell.innerText = circleTurn ? 'O' : 'X';
}

function swapTurns() {
    circleTurn = !circleTurn;
}

function updateTurnIndicator() {
    if (circleTurn) {
        turnXElement.classList.remove('active');
        turnOElement.classList.add('active');
        statusMessage.innerText = "Player O's Turn";
    } else {
        turnOElement.classList.remove('active');
        turnXElement.classList.add('active');
        statusMessage.innerText = "Player X's Turn";
    }
}

function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return cellElements[index].classList.contains(currentClass);
        });
    });
}

function isDraw() {
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS);
    });
}

function endGame(draw) {
    if (draw) {
        winningMessageElement.innerText = 'Draw!';
    } else {
        winningMessageElement.innerText = `${circleTurn ? "O" : "X"} Wins!`;
        highlightWinningCells();
    }
    winningModal.classList.add('show');
}

function highlightWinningCells() {
    const currentClass = circleTurn ? O_CLASS : X_CLASS;
    WINNING_COMBINATIONS.forEach(combination => {
        if (combination.every(index => cellElements[index].classList.contains(currentClass))) {
            combination.forEach(index => cellElements[index].classList.add('winning'));
        }
    });
}
