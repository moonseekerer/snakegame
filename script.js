const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Mobile control elements
const ctrlUp = document.getElementById('ctrl-up');
const ctrlDown = document.getElementById('ctrl-down');
const ctrlLeft = document.getElementById('ctrl-left');
const ctrlRight = document.getElementById('ctrl-right');

// Asset loading
const jaehwanImg = new Image();
jaehwanImg.src = 'jaehwan.png';
const jihumImg = new Image();
jihumImg.src = 'jihum.png';

// Game constants
const GRID_SIZE = 20;
let TILE_COUNT;
let GAME_SPEED = 100;

// Game state
let snake = [];
let food = { x: 5, y: 5 };
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let isPaused = true;

// Initialize
highScoreElement.textContent = highScore.toString().padStart(3, '0');

function initGame() {
    // Set canvas size based on container
    const size = canvas.parentElement.clientWidth;
    canvas.width = size;
    canvas.height = size;
    TILE_COUNT = Math.floor(size / GRID_SIZE);

    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];

    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;
    score = 0;
    scoreElement.textContent = '000';
    GAME_SPEED = 100;

    createFood();
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };

    // Check if food is on snake
    snake.forEach(segment => {
        if (segment.x === food.x && segment.y === food.y) {
            createFood();
        }
    });
}

function update() {
    if (isPaused) return;

    // Update direction
    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }

    // Self collision
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score.toString().padStart(3, '0');
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore.toString().padStart(3, '0');
            localStorage.setItem('snakeHighScore', highScore);
        }
        createFood();
        // Slightly increase speed
        if (GAME_SPEED > 50) {
            clearInterval(gameLoop);
            GAME_SPEED -= 1;
            gameLoop = setInterval(draw, GAME_SPEED);
        }
    } else {
        snake.pop();
    }
}

function draw() {
    update();
    if (isPaused) return;

    // Clear canvas
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw Ryu Jihum (Food)
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffaa00';
    ctx.drawImage(
        jihumImg,
        food.x * GRID_SIZE,
        food.y * GRID_SIZE,
        GRID_SIZE,
        GRID_SIZE
    );

    // Draw Lee Jaehwan (Snake)
    snake.forEach((segment, index) => {
        const isHead = index === 0;

        if (isHead) {
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ff88';
            ctx.drawImage(
                jaehwanImg,
                segment.x * GRID_SIZE,
                segment.y * GRID_SIZE,
                GRID_SIZE,
                GRID_SIZE
            );
        } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
            ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
            const size = GRID_SIZE - 4;
            const offset = (GRID_SIZE - size) / 2;
            ctx.beginPath();
            ctx.roundRect(
                segment.x * GRID_SIZE + offset,
                segment.y * GRID_SIZE + offset,
                size,
                size,
                4
            );
            ctx.fill();
        }
    });

    ctx.shadowBlur = 0; // Reset shadow for next draw
}

function gameOver() {
    isPaused = true;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function startGame() {
    initGame();
    isPaused = false;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, GAME_SPEED);
}

// Controls
window.addEventListener('keydown', e => {
    switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case 'arrowdown':
        case 's':
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case 'arrowleft':
        case 'a':
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case 'arrowright':
        case 'd':
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
    }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Mobile Button Listeners
ctrlUp.addEventListener('click', () => { if (dy !== 1) { nextDx = 0; nextDy = -1; } });
ctrlDown.addEventListener('click', () => { if (dy !== -1) { nextDx = 0; nextDy = 1; } });
ctrlLeft.addEventListener('click', () => { if (dx !== 1) { nextDx = -1; nextDy = 0; } });
ctrlRight.addEventListener('click', () => { if (dx !== -1) { nextDx = 1; nextDy = 0; } });

// Touch event support to prevent scrolling while playing on mobile
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Initial size adjustment
window.addEventListener('resize', () => {
    const size = canvas.parentElement.clientWidth;
    canvas.width = size;
    canvas.height = size;
    TILE_COUNT = Math.floor(size / GRID_SIZE);
});

// Start by initializing UI but don't start loop
initGame();
// Draw one frame to show background/food on start screen
isPaused = false;
draw();
isPaused = true;
