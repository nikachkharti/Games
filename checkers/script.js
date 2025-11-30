document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const turnIndicator = document.getElementById('turn-indicator');
    const redScoreEl = document.getElementById('red-score');
    const blueScoreEl = document.getElementById('blue-score');
    const player1Card = document.getElementById('player1-card');
    const player2Card = document.getElementById('player2-card');
    const resetBtn = document.getElementById('reset-btn');

    const BOARD_SIZE = 8;
    let board = [];
    let turn = 'red'; // 'red' or 'blue'
    let selectedPiece = null;
    let validMoves = [];
    let redPieces = 12;
    let bluePieces = 12;

    // Initialize Game
    function initGame() {
        board = createBoard();
        turn = 'red';
        redPieces = 12;
        bluePieces = 12;
        selectedPiece = null;
        validMoves = [];
        validMoves = [];
        boardElement.classList.remove('rotated');
        updateUI();
        renderBoard();
    }

    function createBoard() {
        const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if ((row + col) % 2 === 1) {
                    if (row < 3) newBoard[row][col] = { player: 'blue', isKing: false };
                    else if (row > 4) newBoard[row][col] = { player: 'red', isKing: false };
                }
            }
        }
        return newBoard;
    }

    function renderBoard() {
        boardElement.innerHTML = '';
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                square.classList.add((row + col) % 2 === 1 ? 'dark' : 'light');
                square.dataset.row = row;
                square.dataset.col = col;

                // Check if this square is a valid move
                const isValid = validMoves.some(m => m.row === row && m.col === col);
                if (isValid) {
                    square.classList.add('valid-move');
                    square.addEventListener('click', () => executeMove(row, col));
                }

                const piece = board[row][col];
                if (piece) {
                    const pieceEl = document.createElement('div');
                    pieceEl.classList.add('piece', piece.player);
                    if (piece.isKing) pieceEl.classList.add('king');

                    if (piece.player === turn) {
                        pieceEl.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent triggering square click
                            selectPiece(row, col);
                        });
                    }

                    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                        pieceEl.classList.add('selected');
                    }

                    square.appendChild(pieceEl);
                }

                boardElement.appendChild(square);
            }
        }
    }

    function selectPiece(row, col) {
        if (board[row][col].player !== turn) return;

        // Toggle selection if clicking same piece
        if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
            selectedPiece = null;
            validMoves = [];
        } else {
            selectedPiece = { row, col };
            validMoves = getValidMoves(row, col, board[row][col]);
        }
        renderBoard();
    }

    function getValidMoves(row, col, piece) {
        const moves = [];
        const directions = [];

        if (piece.player === 'red' || piece.isKing) {
            directions.push({ r: -1, c: -1 }, { r: -1, c: 1 }); // Move Up
        }
        if (piece.player === 'blue' || piece.isKing) {
            directions.push({ r: 1, c: -1 }, { r: 1, c: 1 }); // Move Down
        }

        directions.forEach(dir => {
            const newRow = row + dir.r;
            const newCol = col + dir.c;

            if (isValidPos(newRow, newCol)) {
                // Normal Move
                if (!board[newRow][newCol]) {
                    moves.push({ row: newRow, col: newCol, isJump: false });
                }
                // Jump Move
                else if (board[newRow][newCol].player !== piece.player) {
                    const jumpRow = newRow + dir.r;
                    const jumpCol = newCol + dir.c;
                    if (isValidPos(jumpRow, jumpCol) && !board[jumpRow][jumpCol]) {
                        moves.push({
                            row: jumpRow,
                            col: jumpCol,
                            isJump: true,
                            capturedRow: newRow,
                            capturedCol: newCol
                        });
                    }
                }
            }
        });

        return moves;
    }

    function isValidPos(row, col) {
        return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
    }

    function executeMove(targetRow, targetCol) {
        const move = validMoves.find(m => m.row === targetRow && m.col === targetCol);
        if (!move) return;

        const piece = board[selectedPiece.row][selectedPiece.col];

        // Move piece
        board[targetRow][targetCol] = piece;
        board[selectedPiece.row][selectedPiece.col] = null;

        // Handle Capture
        if (move.isJump) {
            board[move.capturedRow][move.capturedCol] = null;
            if (turn === 'red') bluePieces--;
            else redPieces--;
        }

        // King Promotion
        if (piece.player === 'red' && targetRow === 0) piece.isKing = true;
        if (piece.player === 'blue' && targetRow === BOARD_SIZE - 1) piece.isKing = true;

        // End Turn or Continue Jump (Multi-jump logic could be added here, keeping simple for now)
        // For simple version: always end turn after move
        switchTurn();

        selectedPiece = null;
        validMoves = [];
        updateUI();
        renderBoard();
        checkWin();
    }

    function switchTurn() {
        turn = turn === 'red' ? 'blue' : 'red';
        if (turn === 'blue') {
            boardElement.classList.add('rotated');
        } else {
            boardElement.classList.remove('rotated');
        }
    }

    function updateUI() {
        turnIndicator.textContent = turn === 'red' ? "Red's Turn" : "Blue's Turn";
        turnIndicator.style.color = turn === 'red' ? "var(--accent-red)" : "var(--accent-blue)";

        redScoreEl.textContent = `${redPieces} Pieces`;
        blueScoreEl.textContent = `${bluePieces} Pieces`;

        if (turn === 'red') {
            player1Card.classList.add('active');
            player2Card.classList.remove('active');
        } else {
            player1Card.classList.remove('active');
            player2Card.classList.add('active');
        }
    }

    const modal = document.getElementById('game-over-modal');
    const winnerText = document.getElementById('winner-text');
    const playAgainBtn = document.getElementById('play-again-btn');

    function checkWin() {
        if (redPieces === 0) showGameOver('Blue');
        else if (bluePieces === 0) showGameOver('Red');
    }

    function showGameOver(winner) {
        winnerText.textContent = `${winner} Wins!`;
        winnerText.style.backgroundImage = winner === 'Red'
            ? 'linear-gradient(to right, #ff7e94, #f43f5e)'
            : 'linear-gradient(to right, #93c5fd, #3b82f6)';
        modal.classList.remove('hidden');
    }

    function hideModal() {
        modal.classList.add('hidden');
    }

    resetBtn.addEventListener('click', () => {
        initGame();
        hideModal();
    });

    playAgainBtn.addEventListener('click', () => {
        initGame();
        hideModal();
    });

    // Start
    initGame();
});
