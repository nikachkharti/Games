/* Game Constants */
const BOARD_SIZE = 10;
const SHIP_TYPES = [
    { name: 'Carrier', length: 5 },
    { name: 'Battleship', length: 4 },
    { name: 'Cruiser', length: 3 },
    { name: 'Submarine', length: 3 },
    { name: 'Destroyer', length: 2 }
];

/* Classes */
class Ship {
    constructor(name, length) {
        this.name = name;
        this.length = length;
        this.hits = 0;
        this.sunk = false;
    }

    hit() {
        this.hits++;
        this.isSunk();
    }

    isSunk() {
        if (this.hits >= this.length) {
            this.sunk = true;
            return true;
        }
        return false;
    }
}

class Gameboard {
    constructor() {
        this.grid = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        this.ships = [];
        this.missedAttacks = [];
    }

    placeShip(ship, x, y, isVertical) {
        if (!this.isValidPlacement(ship.length, x, y, isVertical)) return false;

        for (let i = 0; i < ship.length; i++) {
            if (isVertical) {
                this.grid[y + i][x] = { ship, index: i };
            } else {
                this.grid[y][x + i] = { ship, index: i };
            }
        }
        this.ships.push(ship);
        return true;
    }

    isValidPlacement(length, x, y, isVertical) {
        if (isVertical) {
            if (y + length > BOARD_SIZE) return false;
            for (let i = 0; i < length; i++) {
                if (this.grid[y + i][x] !== null) return false;
            }
        } else {
            if (x + length > BOARD_SIZE) return false;
            for (let i = 0; i < length; i++) {
                if (this.grid[y][x + i] !== null) return false;
            }
        }
        return true;
    }

    receiveAttack(x, y) {
        const target = this.grid[y][x];

        // Check if already hit
        if (target === 'miss' || (target && typeof target === 'object' && target.hit)) {
            return 'duplicate';
        }

        if (target === null) {
            this.grid[y][x] = 'miss';
            this.missedAttacks.push({ x, y });
            return 'miss';
        } else {
            target.ship.hit();
            // Mark the cell as hit in a way we can track visually but keep ship ref
            target.hit = true;
            return target.ship.sunk ? 'sunk' : 'hit';
        }
    }

    allShipsSunk() {
        return this.ships.every(ship => ship.sunk);
    }
}

class Player {
    constructor(type) {
        this.type = type; // 'human' or 'computer'
        this.gameboard = new Gameboard();
    }
}

/* UI Controller */
const UI = (() => {
    const playerBoardEl = document.getElementById('player-board');
    const computerBoardEl = document.getElementById('computer-board');
    const shipsDockEl = document.getElementById('ships-dock');
    const statusEl = document.getElementById('game-status');
    const startBtn = document.getElementById('start-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const randomizeBtn = document.getElementById('randomize-btn');

    let isVertical = false;
    let draggedShipLength = 0;
    let draggedShipName = '';

    const init = () => {
        renderGrid(playerBoardEl, 'player');
        renderGrid(computerBoardEl, 'computer');
        renderShipsDock();
        setupEventListeners();
    };

    const renderGrid = (element, owner) => {
        element.innerHTML = '';
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.dataset.owner = owner;
                element.appendChild(cell);
            }
        }
    };

    const renderShipsDock = () => {
        shipsDockEl.innerHTML = '';
        SHIP_TYPES.forEach(ship => {
            const shipDiv = document.createElement('div');
            shipDiv.classList.add('ship-preview');
            shipDiv.draggable = true;
            shipDiv.dataset.length = ship.length;
            shipDiv.dataset.name = ship.name;

            for (let i = 0; i < ship.length; i++) {
                const block = document.createElement('div');
                block.classList.add('ship-block');
                shipDiv.appendChild(block);
            }

            shipDiv.addEventListener('dragstart', dragStart);
            shipDiv.addEventListener('dragend', dragEnd);
            shipsDockEl.appendChild(shipDiv);
        });
    };

    const updateBoard = (board, owner) => {
        const element = owner === 'player' ? playerBoardEl : computerBoardEl;
        const cells = element.querySelectorAll('.cell');

        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const cellData = board.grid[y][x];

            cell.className = 'cell'; // Reset classes

            if (cellData === 'miss') {
                cell.classList.add('miss');
            } else if (cellData && cellData.hit) {
                cell.classList.add('hit');
                if (cellData.ship.sunk) cell.classList.add('sunk');
            } else if (cellData && owner === 'player') {
                cell.classList.add('ship');
            }
        });
    };

    const setStatus = (msg) => {
        statusEl.textContent = msg;
    };

    /* Drag and Drop Logic */
    function dragStart(e) {
        draggedShipLength = parseInt(e.target.dataset.length);
        draggedShipName = e.target.dataset.name;
        e.target.classList.add('dragging');

        // Visual hack for vertical drag ghost if needed, 
        // but browser handling of drag ghost is limited.
    }

    function dragEnd(e) {
        e.target.classList.remove('dragging');
    }

    const toggleRotation = () => {
        isVertical = !isVertical;
        rotateBtn.textContent = isVertical ? 'AXIS: Y (VERTICAL)' : 'AXIS: X (HORIZONTAL)';
        // Update dock previews
        document.querySelectorAll('.ship-preview').forEach(el => {
            if (isVertical) el.classList.add('vertical');
            else el.classList.remove('vertical');
        });
    };

    const setupEventListeners = () => {
        rotateBtn.addEventListener('click', toggleRotation);

        // Keyboard shortcut for rotation
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r' && !Game.isGameActive()) {
                toggleRotation();
            }
        });

        // Player Board Drag Over
        playerBoardEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.cell');
            if (!cell) return;

            // Highlight potential placement
            // This would require complex logic to highlight multiple cells
            // For MVP, we just allow drop
        });

        playerBoardEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.cell');
            if (!cell) return;

            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);

            Game.handleShipDrop(draggedShipName, draggedShipLength, x, y, isVertical);

            const draggedEl = document.querySelector('.dragging');
            if (draggedEl) draggedEl.classList.remove('dragging');
        });

        startBtn.addEventListener('click', Game.startGame);
        resetBtn.addEventListener('click', Game.resetGame);
        randomizeBtn.addEventListener('click', Game.randomizePlayerShips);

        // Attack clicks
        computerBoardEl.addEventListener('click', (e) => {
            if (!Game.isGameActive()) return;
            const cell = e.target.closest('.cell');
            if (!cell) return;

            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);

            Game.handleAttack(x, y);
        });
    };

    const removeShipFromDock = (shipName) => {
        const shipEl = shipsDockEl.querySelector(`[data-name="${shipName}"]`);
        if (shipEl) shipEl.remove();

        if (shipsDockEl.children.length === 0) {
            startBtn.disabled = false;
            setStatus('FLEET DEPLOYED. READY TO ENGAGE.');
        }
    };

    const resetDock = () => {
        renderShipsDock();
        startBtn.disabled = true;
        isVertical = false;
        rotateBtn.textContent = 'ROTATE AXIS [R]';
    };

    return {
        init,
        updateBoard,
        setStatus,
        removeShipFromDock,
        resetDock
    };
})();

/* Game Logic */
const Game = (() => {
    let player;
    let computer;
    let gameActive = false;
    let playerTurn = true;

    const init = () => {
        player = new Player('human');
        computer = new Player('computer');
        UI.init();
    };

    const handleShipDrop = (name, length, x, y, isVertical) => {
        const ship = new Ship(name, length);
        if (player.gameboard.placeShip(ship, x, y, isVertical)) {
            UI.updateBoard(player.gameboard, 'player');
            UI.removeShipFromDock(name);
        } else {
            UI.setStatus('INVALID COORDINATES. RE-ALIGN.');
            setTimeout(() => UI.setStatus('SYSTEM READY. AWAITING ORDERS.'), 2000);
        }
    };

    const randomizePlayerShips = () => {
        player.gameboard = new Gameboard(); // Reset board
        UI.resetDock(); // Reset dock to clear it visually first

        // Clear dock manually since we are auto-placing
        document.getElementById('ships-dock').innerHTML = '';

        SHIP_TYPES.forEach(shipType => {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * BOARD_SIZE);
                const y = Math.floor(Math.random() * BOARD_SIZE);
                const vert = Math.random() < 0.5;
                const ship = new Ship(shipType.name, shipType.length);

                if (player.gameboard.placeShip(ship, x, y, vert)) {
                    placed = true;
                }
            }
        });

        UI.updateBoard(player.gameboard, 'player');
        document.getElementById('start-btn').disabled = false;
        UI.setStatus('FLEET AUTO-DEPLOYED. READY.');
    };

    const placeComputerShips = () => {
        SHIP_TYPES.forEach(shipType => {
            let placed = false;
            while (!placed) {
                const x = Math.floor(Math.random() * BOARD_SIZE);
                const y = Math.floor(Math.random() * BOARD_SIZE);
                const vert = Math.random() < 0.5;
                const ship = new Ship(shipType.name, shipType.length);

                if (computer.gameboard.placeShip(ship, x, y, vert)) {
                    placed = true;
                }
            }
        });
        UI.updateBoard(computer.gameboard, 'computer');
    };

    const startGame = () => {
        placeComputerShips();
        gameActive = true;
        playerTurn = true;
        document.getElementById('ship-selector').style.display = 'none';
        UI.setStatus('COMBAT STARTED. SELECT TARGET COORDINATES.');
    };

    const handleAttack = (x, y) => {
        if (!playerTurn) return;

        const result = computer.gameboard.receiveAttack(x, y);

        if (result === 'duplicate') return;

        UI.updateBoard(computer.gameboard, 'computer');

        if (result === 'sunk') {
            UI.setStatus('ENEMY SHIP DESTROYED!');
            if (checkWin(computer.gameboard)) {
                endGame('VICTORY! ENEMY FLEET ELIMINATED.');
                return;
            }
        } else if (result === 'hit') {
            UI.setStatus('DIRECT HIT!');
        } else {
            UI.setStatus('MISSED TARGET.');
        }

        playerTurn = false;
        setTimeout(computerTurn, 1000);
    };

    const computerTurn = () => {
        if (!gameActive) return;

        UI.setStatus('ENEMY TARGETING...');

        setTimeout(() => {
            let validMove = false;
            let x, y;

            // Simple AI: Random valid move
            // TODO: Improve to hunt adjacent cells if hit
            while (!validMove) {
                x = Math.floor(Math.random() * BOARD_SIZE);
                y = Math.floor(Math.random() * BOARD_SIZE);
                const cell = player.gameboard.grid[y][x];
                if (cell !== 'miss' && !(cell && cell.hit)) {
                    validMove = true;
                }
            }

            const result = player.gameboard.receiveAttack(x, y);
            UI.updateBoard(player.gameboard, 'player');

            if (result === 'sunk') {
                UI.setStatus('WARNING: FRIENDLY SHIP LOST!');
                if (checkWin(player.gameboard)) {
                    endGame('DEFEAT! FLEET DESTROYED.');
                    return;
                }
            } else if (result === 'hit') {
                UI.setStatus('WARNING: WE HAVE BEEN HIT!');
            } else {
                UI.setStatus('ENEMY MISSED.');
            }

            playerTurn = true;
        }, 1000);
    };

    const checkWin = (board) => {
        return board.allShipsSunk();
    };

    const endGame = (msg) => {
        gameActive = false;
        UI.setStatus(msg);
    };

    const resetGame = () => {
        gameActive = false;
        player = new Player('human');
        computer = new Player('computer');
        document.getElementById('ship-selector').style.display = 'flex';
        UI.resetDock();
        UI.updateBoard(player.gameboard, 'player');
        UI.updateBoard(computer.gameboard, 'computer');
        UI.setStatus('SYSTEM RESET. AWAITING ORDERS.');
    };

    const isGameActive = () => gameActive;

    return {
        init,
        handleShipDrop,
        startGame,
        handleAttack,
        isGameActive,
        resetGame,
        randomizePlayerShips
    };
})();

// Initialize Game
document.addEventListener('DOMContentLoaded', Game.init);
