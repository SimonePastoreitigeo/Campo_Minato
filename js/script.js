const gameBoard = document.getElementById('game-board');
const gameStats = document.getElementById('game-stats');
const resetButton = document.getElementById('reset-button');
const timerElement = document.getElementById('time-remaining');

const difficulty = document.getElementById('difficulty');
const btnFacile = document.getElementById('btnFacile');
const btnMedio = document.getElementById('btnMedio');
const btnDifficile = document.getElementById('btnDifficile');

let difficolta = "Facile";
let flagsPlaced = 0;
let flagsCorrect = 0;
let boardSize = 10;
let mineCount = 10;
let remainingCells = boardSize * boardSize - mineCount;
let board = [];
let minePositions = [];
let playing = false;
let gameOver = false;
let timer;
let timeRemaining = 60;

// Aggiorna la visualizzazione dei conteggi
function updateCounters() {
    gameStats.textContent = `Mine rimaste: ${mineCount - flagsPlaced}, Campi rimasti: ${remainingCells}`;
}

// Crea la griglia di gioco
function createBoard() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 30px)`;
    gameBoard.style.gridTemplateRows = `repeat(${boardSize}, 30px)`;
    board = [];
    for (let i = 0; i < boardSize; i++) {
        const row = [];
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.addEventListener('click', () => handleCellClick(i, j));
            cell.addEventListener('contextmenu', (e) => handleCellRightClick(e, i, j));
            gameBoard.appendChild(cell);
            row.push({ element: cell, mine: false, revealed: false, flagged: false, adjacentMines: 0 });
        }
        board.push(row);
    }
    updateCounters();
}

// Piazzare le mine
function placeMines() {
    minePositions = [];
    let minesToPlace = mineCount;

    while (minesToPlace > 0) {
        const x = Math.floor(Math.random() * boardSize);
        const y = Math.floor(Math.random() * boardSize);

        if (!board[x][y].mine) {
            board[x][y].mine = true;
            minePositions.push({ x, y });
            minesToPlace--;
        }
    }
}

// Calcolare le mine adiacenti
function calculateAdjacentMines() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j].mine) continue;
            let mineCount = 0;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = i + dx;
                    const ny = j + dy;
                    if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && board[nx][ny].mine) {
                        mineCount++;
                    }
                }
            }
            board[i][j].adjacentMines = mineCount;
        }
    }
}

// Gestione del click su una cella
function handleCellClick(x, y) {
    if (gameOver || board[x][y].revealed || board[x][y].flagged || !playing) return;
    board[x][y].revealed = true;
    remainingCells--;
    updateCounters();
    const cell = board[x][y].element;
    cell.classList.add('revealed');
    if (board[x][y].mine) {
        cell.classList.add('mine');
        revealAllMines(x, y);
        highlightCorrectFlags();
        removeWrongFlags();
        gameStats.textContent = "Hai perso: " + flagsCorrect + " / " + mineCount + " Trovate";
        playing = false;
        gameOver = true;
    } else {
        const adjacentMines = board[x][y].adjacentMines;
        if (adjacentMines > 0) {
            cell.textContent = adjacentMines;
            cell.classList.add(`number-${adjacentMines}`);
        }
        if (adjacentMines === 0) {
            revealAdjacentCells(x, y);
        }
        checkWin();
    }
}

// Gestione del click destro su una cella
function handleCellRightClick(e, x, y) {
    e.preventDefault();
    if (gameOver || board[x][y].revealed || !playing) return;

    const cell = board[x][y].element;
    if (!board[x][y].flagged && flagsPlaced < mineCount) {
        cell.classList.add('flag');
        board[x][y].flagged = true;
        flagsPlaced++;
    } else if (board[x][y].flagged) {
        cell.classList.remove('flag');
        board[x][y].flagged = false;
        flagsPlaced--;
    }

    updateCounters();
    checkWin();
}

// Rivela tutte le mine tranne quella cliccata
function revealAllMines(x1, y1) {
    minePositions.forEach(({ x, y }) => {
        if (x !== x1 || y !== y1) {
            board[x][y].element.classList.add('revealed-mine');
        }
    });
}

// Rivela tutte le bandiere sulle mine
function revealAllFlags() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j].mine && !board[i][j].flagged) {
                board[i][j].flagged = true;
                board[i][j].element.classList.add('correct-flag');
            }
        }
    }
}

// Evidenzia le bandierine corrette
function highlightCorrectFlags() {
    minePositions.forEach(({ x, y }) => {
        if (board[x][y].flagged) {
            board[x][y].element.classList.add('correct-flag');
            flagsCorrect++;
        }
    });
}

// Rimuove le bandierine sbagliate
function removeWrongFlags() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j].flagged && !board[i][j].mine) {
                board[i][j].element.classList.add('wrong-flag');
            }
        }
    }
}

// Rivela le celle adiacenti
function revealAdjacentCells(x, y) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize && !board[nx][ny].revealed) {
                handleCellClick(nx, ny);
            }
        }
    }
}

// Rivela tutte le celle
function revealAllCells() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (!board[i][j].revealed) {
                board[i][j].revealed = true;
                const cell = board[i][j].element;
                cell.classList.add('revealed');
                if (board[i][j].mine) {
                    cell.classList.add('mine');
                } else {
                    const adjacentMines = board[i][j].adjacentMines;
                    if (adjacentMines > 0) {
                        cell.textContent = adjacentMines;
                        cell.classList.add(`number-${adjacentMines}`);
                    }
                }
            }
        }
    }
}

// Verifica la vittoria
function checkWin() {
    if (!playing) return;

    let revealedCount = 0;
    let correctlyFlaggedCount = 0;

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j].revealed) {
                revealedCount++;
            }
            if (board[i][j].flagged && board[i][j].mine) {
                correctlyFlaggedCount++;
            }
        }
    }

    if (revealedCount === boardSize * boardSize - mineCount || correctlyFlaggedCount === mineCount) {
        highlightCorrectFlags();
        removeWrongFlags();
        revealAllFlags();
        revealAllCells();
        clearInterval(timer);
        gameStats.textContent = "Hai vinto! Hai impiegato " + ((difficolta == "Facile" ? 60 : difficolta == "Medio" ? 120 : 180) - timeRemaining) + " secondi.";
        gameOver = true;
        playing = false;
    }
}

// Reset del gioco
function resetGame() {
    gameStats.textContent = "";
    playing = false;
    gameOver = false;
    flagsPlaced = 0;
    flagsCorrect = 0;
    remainingCells = boardSize * boardSize - mineCount;
    timeRemaining = difficolta == "Facile" ? 60 : difficolta == "Medio" ? 120 : 180;
    timerElement.textContent = timeRemaining;
    clearInterval(timer);
    createBoard();
    placeMines();
    calculateAdjacentMines();
    playing = true;
}

// Inizia il gioco in modalità a tempo
function startTimedGame() {
    resetGame();
    playing = true;
    startTimer();
}

// Avvia il timer
function startTimer() {
    timer = setInterval(() => {
        timeRemaining--;
        timerElement.textContent = timeRemaining;

        if (timeRemaining <= 0) {
            clearInterval(timer);
            playing = false;
            gameOver = true;
            revealAllMines(-1, -1);
            highlightCorrectFlags();
            removeWrongFlags();
            gameStats.textContent = "Tempo scaduto! Hai perso!";
        }
    }, 1000);
}

function changeDifficulty(e){
    if (e.srcElement == btnFacile) {
        boardSize = 10;
        mineCount = 10;
        timeRemaining = 60;
        difficolta = "Facile";
        startTimedGame();
        difficulty.textContent = "Difficoltà: Facile";
    } else if (e.srcElement == btnMedio) {
        boardSize = 15;
        mineCount = 20;
        timeRemaining = 120;
        difficolta = "Medio";
        startTimedGame();
        difficulty.textContent = "Difficoltà: Medio";
    } else if (e.srcElement == btnDifficile) {
        boardSize = 20;
        mineCount = 35;
        timeRemaining = 180;
        difficolta = "Difficile";
        startTimedGame();
        difficulty.textContent = "Difficoltà: Difficile";
    }
}

// Inizializzazione del gioco
document.addEventListener("contextmenu", (e) => {e.preventDefault()});
btnFacile.addEventListener('click', changeDifficulty);
btnMedio.addEventListener('click', changeDifficulty);
btnDifficile.addEventListener('click', changeDifficulty);
resetButton.addEventListener('click', startTimedGame);
startTimedGame();