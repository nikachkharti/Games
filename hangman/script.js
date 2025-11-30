const words = {
    easy: ['APPLE', 'BALL', 'CAT', 'DOG', 'EGG', 'FISH', 'GOAT', 'HAT', 'ICE', 'JUMP', 'KITE', 'LION', 'MOON', 'NEST', 'OWL', 'PIG', 'QUEEN', 'RAIN', 'SUN', 'TREE'],
    medium: ['BANANA', 'BRIDGE', 'CAMERA', 'DOCTOR', 'ELEPHANT', 'FOREST', 'GARDEN', 'HUNGRY', 'ISLAND', 'JUNGLE', 'KITCHEN', 'LEMON', 'MONKEY', 'NATURE', 'ORANGE', 'PIRATE', 'QUIET', 'RIVER', 'SUMMER', 'TIGER'],
    hard: ['ADVENTURE', 'BEAUTIFUL', 'CHOCOLATE', 'DANGEROUS', 'EVERYTHING', 'FANTASTIC', 'GENERATION', 'HAPPINESS', 'IMPORTANT', 'JOURNALIST', 'KNOWLEDGE', 'LANDSCAPE', 'MOUNTAIN', 'NECESSARY', 'ORCHESTRA', 'PHILOSOPHY', 'QUESTION', 'REVOLUTION', 'SCIENTIST', 'TECHNOLOGY']
};

let currentWord = '';
let guessedLetters = [];
let lives = 6;
let currentLevel = 'easy';

// DOM Elements
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const backBtn = document.getElementById('back-btn');
const wordDisplay = document.getElementById('word-display');
const keyboard = document.getElementById('keyboard');
const livesDisplay = document.getElementById('lives-display');
const currentLevelDisplay = document.getElementById('current-level-display');
const statusMessage = document.getElementById('status-message');
const bodyParts = document.querySelectorAll('.body-part');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalWord = document.getElementById('modal-word');
const playAgainBtn = document.getElementById('play-again-btn');
const modalMenuBtn = document.getElementById('modal-menu-btn');

// Event Listeners
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const level = btn.getAttribute('data-level');
        startGame(level);
    });
});

backBtn.addEventListener('click', showMenu);
playAgainBtn.addEventListener('click', () => startGame(currentLevel));
modalMenuBtn.addEventListener('click', () => {
    closeModal();
    showMenu();
});

function showMenu() {
    gameScreen.classList.add('hidden');
    gameScreen.classList.remove('active');
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
        menuScreen.classList.add('active');
    }, 400);
}

function startGame(level) {
    currentLevel = level;
    currentLevelDisplay.textContent = level.charAt(0).toUpperCase() + level.slice(1);

    // Select random word
    const wordList = words[level];
    currentWord = wordList[Math.floor(Math.random() * wordList.length)];

    // Reset state
    guessedLetters = [];
    lives = 6;
    livesDisplay.textContent = lives;
    statusMessage.classList.remove('visible');

    // Reset UI
    bodyParts.forEach(part => part.style.display = 'none');
    renderWord();
    renderKeyboard();
    closeModal();

    // Switch screens
    menuScreen.classList.add('hidden');
    menuScreen.classList.remove('active');
    setTimeout(() => {
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('active');
    }, 400);
}

function renderWord() {
    wordDisplay.innerHTML = '';
    currentWord.split('').forEach(letter => {
        const slot = document.createElement('div');
        slot.classList.add('letter-slot');
        if (guessedLetters.includes(letter)) {
            slot.textContent = letter;
            slot.classList.add('revealed');
        } else {
            slot.textContent = '';
        }
        wordDisplay.appendChild(slot);
    });
}

function renderKeyboard() {
    keyboard.innerHTML = '';
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const btn = document.createElement('button');
        btn.textContent = letter;
        btn.classList.add('key-btn');
        btn.addEventListener('click', () => handleGuess(letter, btn));
        keyboard.appendChild(btn);
    }
}

function handleGuess(letter, btn) {
    btn.disabled = true;
    guessedLetters.push(letter);

    if (currentWord.includes(letter)) {
        btn.classList.add('correct');
        renderWord();
        checkWin();
    } else {
        btn.classList.add('wrong');
        lives--;
        livesDisplay.textContent = lives;
        updateHangman();
        checkLoss();
    }
}

function updateHangman() {
    // Lives go from 6 down to 0.
    // Parts are indexed 0 to 5.
    // If lives = 5, show part 0.
    // If lives = 4, show part 1.
    const partIndex = 5 - lives;
    if (partIndex >= 0 && partIndex < bodyParts.length) {
        bodyParts[partIndex].style.display = 'block';
    }
}

function checkWin() {
    const isWon = currentWord.split('').every(letter => guessedLetters.includes(letter));
    if (isWon) {
        endGame(true);
    }
}

function checkLoss() {
    if (lives === 0) {
        endGame(false);
    }
}

function endGame(isWin) {
    setTimeout(() => {
        modalOverlay.classList.add('visible');
        if (isWin) {
            modalTitle.textContent = 'You Won!';
            modalTitle.style.color = 'var(--success-color)';
            modalMessage.innerHTML = `Great job! The word was: <span id="modal-word">${currentWord}</span>`;
        } else {
            modalTitle.textContent = 'Game Over';
            modalTitle.style.color = 'var(--danger-color)';
            modalMessage.innerHTML = `Better luck next time! The word was: <span id="modal-word">${currentWord}</span>`;
        }
    }, 500);
}

function closeModal() {
    modalOverlay.classList.remove('visible');
}
