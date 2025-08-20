class Minesweeper {
    constructor(rows = 10, cols = 10, mines = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.grid = [];
        this.gameOver = false;
        this.mineCount = mines;
        this.init();
    }

    init() {
        for (let i = 0; i < this.rows; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.grid[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }

        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            if (!this.grid[row][col].isMine) {
                this.grid[row][col].isMine = true;
                minesPlaced++;
            }
        }

        this.calculateNeighborMines();
    }

    calculateNeighborMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.grid[i][j].isMine) {
                    let count = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                                if (this.grid[ni][nj].isMine) count++;
                            }
                        }
                    }
                    this.grid[i][j].neighborMines = count;
                }
            }
        }
    }

    reveal(row, col) {
        if (this.gameOver || this.grid[row][col].isRevealed || this.grid[row][col].isFlagged) {
            return;
        }

        this.grid[row][col].isRevealed = true;

        if (this.grid[row][col].isMine) {
            this.gameOver = true;
            this.revealAll();
            showGameOverMessage('游戏结束！', false);
            return;
        }

        if (this.grid[row][col].neighborMines === 0) {
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    const ni = row + di;
                    const nj = col + dj;
                    if (ni >= 0 && ni < this.rows && nj >= 0 && nj < this.cols) {
                        if (!this.grid[ni][nj].isRevealed) {
                            this.reveal(ni, nj);
                        }
                    }
                }
            }
        }

        if (this.checkWin()) {
            this.gameOver = true;
            showGameOverMessage('恭喜你赢了！', true);
        }
    }

    toggleFlag(row, col) {
        if (!this.grid[row][col].isRevealed) {
            this.grid[row][col].isFlagged = !this.grid[row][col].isFlagged;
            this.mineCount += this.grid[row][col].isFlagged ? -1 : 1;
            document.getElementById('mine-count').textContent = this.mineCount;
        }
    }

    revealAll() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.grid[i][j].isRevealed = true;
            }
        }
    }

    checkWin() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.grid[i][j].isMine && !this.grid[i][j].isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }
}

let game;
let flagMode = false; // 插旗模式开关
let timer = null;
let elapsedTime = 0;
let highScore = 0;

const flagModeBtn = document.getElementById('flag-mode-btn');
const mineField = document.getElementById('mine-field');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverMessage = document.getElementById('game-over-message');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsSave = document.getElementById('settings-save');
const settingsCancel = document.getElementById('settings-cancel');

function startTimer() {
    elapsedTime = 0;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        elapsedTime++;
    }, 1000);
}

function stopTimer() {
    if (timer) clearInterval(timer);
}

function renderGrid() {
    mineField.innerHTML = '';
    mineField.style.gridTemplateColumns = `repeat(${game.cols}, 30px)`;

    for (let i = 0; i < game.rows; i++) {
        for (let j = 0; j < game.cols; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            if (game.grid[i][j].isRevealed) {
                cell.classList.add('revealed');
                if (game.grid[i][j].isMine) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (game.grid[i][j].neighborMines > 0) {
                    cell.textContent = game.grid[i][j].neighborMines;
                    cell.classList.add(`num-${game.grid[i][j].neighborMines}`);
                }
            } else if (game.grid[i][j].isFlagged) {
                cell.textContent = '🚩';
            }

            cell.addEventListener('click', () => {
                if (game.gameOver) return;

                if (flagMode) {
                    game.toggleFlag(i, j);
                } else {
                    game.reveal(i, j);
                }
                renderGrid();
            });

            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (game.gameOver) return;
                game.toggleFlag(i, j);
                renderGrid();
            });

            mineField.appendChild(cell);
        }
    }
}

function showGameOverMessage(text, won = false) {
    gameOverMessage.textContent = text;
    gameOverOverlay.classList.remove('hidden');

    stopTimer();

    if (won) {
        const score = Math.max(0, Math.floor(game.rows * game.cols * game.mines / 10 - elapsedTime / 3));
        if (score > highScore) {
            highScore = score;
            document.getElementById('high-score').textContent = highScore;
        }
    }

    setTimeout(() => {
        gameOverOverlay.classList.add('hidden');
    }, 2000);
}

function startNewGame(rows = 10, cols = 10, mines = 10) {
    game = new Minesweeper(rows, cols, mines);
    flagMode = false;
    flagModeBtn.classList.add('inactive');
    flagModeBtn.textContent = '🚩';
    renderGrid();
    document.getElementById('mine-count').textContent = game.mines;
    document.getElementById('high-score').textContent = highScore;
    gameOverOverlay.classList.add('hidden');
    startTimer();
}

flagModeBtn.addEventListener('click', () => {
    if (game.gameOver) return;
    flagMode = !flagMode;
    if (flagMode) {
        flagModeBtn.classList.remove('inactive');
    } else {
        flagModeBtn.classList.add('inactive');
    }
});

document.getElementById('new-game').addEventListener('click', () => {
    startNewGame(game.rows, game.cols, game.mines);
});

settingsBtn.addEventListener('click', () => {
    document.getElementById('setting-rows').value = game.rows;
    document.getElementById('setting-cols').value = game.cols;
    document.getElementById('setting-mines').value = game.mines;
    settingsModal.classList.remove('hidden');
});

settingsCancel.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

settingsSave.addEventListener('click', () => {
    const rows = parseInt(document.getElementById('setting-rows').value);
    const cols = parseInt(document.getElementById('setting-cols').value);
    const mines = parseInt(document.getElementById('setting-mines').value);

    if (isNaN(rows) || rows < 5 || rows > 30) {
        alert('行数必须是5到30之间的整数');
        document.getElementById('setting-rows').value = game.rows;
        return;
    }
    if (isNaN(cols) || cols < 5 || cols > 30) {
        alert('列数必须是5到30之间的整数');
        document.getElementById('setting-cols').value = game.cols;
        return;
    }
    if (isNaN(mines) || mines < 1 || mines >= rows * cols) {
        alert('雷数必须是1到行数×列数-1之间的整数');
        document.getElementById('setting-mines').value = game.mines;
        return;
    }

    settingsModal.classList.add('hidden');
    startNewGame(rows, cols, mines);
});

// 初始化游戏
startNewGame();
