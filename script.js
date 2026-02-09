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
let jihum = { x: 5, y: 5 };
let jaehwan = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let timeSurvived = 0;
let score = 0;
let highScore = localStorage.getItem('escapeHighScore') || 0;
let gameLoop;
let isPaused = true;
let enemyMoveCounter = 0;
let enemyMoveFrequency = 3; // Jaehwan moves every 3 ticks

// Initialize
highScoreElement.textContent = formatTime(highScore);

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function initGame() {
    const size = canvas.parentElement.clientWidth;
    canvas.width = size;
    canvas.height = size;
    TILE_COUNT = Math.floor(size / GRID_SIZE);

    jihum = { x: Math.floor(TILE_COUNT / 4), y: Math.floor(TILE_COUNT / 4) };
    jaehwan = { x: Math.floor(TILE_COUNT * 3 / 4), y: Math.floor(TILE_COUNT * 3 / 4) };

    dx = 0;
    dy = 0;
    nextDx = 0;
    nextDy = 0;
    score = 0;
    timeSurvived = 0;
    scoreElement.textContent = '00:00';
    enemyMoveCounter = 0;
    enemyMoveFrequency = 3;
}

function update() {
    if (isPaused) return;

    // Update Jihum's direction
    dx = nextDx;
    dy = nextDy;

    // Move Jihum
    jihum.x += dx;
    jihum.y += dy;

    // Wall collision for Jihum (Keep him inside or wrap around? Let's stop at walls)
    if (jihum.x < 0) jihum.x = 0;
    if (jihum.x >= TILE_COUNT) jihum.x = TILE_COUNT - 1;
    if (jihum.y < 0) jihum.y = 0;
    if (jihum.y >= TILE_COUNT) jihum.y = TILE_COUNT - 1;

    // Move Jaehwan (AI)
    enemyMoveCounter++;
    if (enemyMoveCounter >= enemyMoveFrequency) {
        enemyMoveCounter = 0;

        // Simple Chase AI
        if (jaehwan.x < jihum.x) jaehwan.x++;
        else if (jaehwan.x > jihum.x) jaehwan.x--;

        if (jaehwan.y < jihum.y) jaehwan.y++;
        else if (jaehwan.y > jihum.y) jaehwan.y--;
    }

    // Capture Check
    if (jaehwan.x === jihum.x && jaehwan.y === jihum.y) {
        gameOver();
        return;
    }

    // Update Score (Survival Time)
    score++;
    if (score % 10 === 0) { // Every second (assuming 100ms speed)
        timeSurvived = Math.floor(score / 10);
        scoreElement.textContent = formatTime(timeSurvived);

        // Difficulty increase: Jaehwan gets faster over time
        if (timeSurvived > 0 && timeSurvived % 10 === 0 && enemyMoveFrequency > 1) {
            // Every 10 seconds, potentially increase speed (handled carefully)
        }
    }

    if (timeSurvived > highScore) {
        highScore = timeSurvived;
        highScoreElement.textContent = formatTime(highScore);
        localStorage.setItem('escapeHighScore', highScore);
    }
}

function draw() {
    update();
    if (isPaused) return;

    // Clear canvas
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
    }

    // Draw Jaehwan (Enemy)
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff0055';
    ctx.drawImage(jaehwanImg, jaehwan.x * GRID_SIZE, jaehwan.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    // Draw Jihum (Player)
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff88';
    ctx.drawImage(jihumImg, jihum.x * GRID_SIZE, jihum.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
}

function gameOver() {
    isPaused = true;
    clearInterval(gameLoop);
    finalScoreElement.textContent = formatTime(timeSurvived);
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
        case 'arrowup': case 'w': nextDx = 0; nextDy = -1; break;
        case 'arrowdown': case 's': nextDx = 0; nextDy = 1; break;
        case 'arrowleft': case 'a': nextDx = -1; nextDy = 0; break;
        case 'arrowright': case 'd': nextDx = 1; nextDy = 0; break;
    }
});

// Mobile Controls
ctrlUp.addEventListener('click', () => { nextDx = 0; nextDy = -1; });
ctrlDown.addEventListener('click', () => { nextDx = 0; nextDy = 1; });
ctrlLeft.addEventListener('click', () => { nextDx = -1; nextDy = 0; });
ctrlRight.addEventListener('click', () => { nextDx = 1; nextDy = 0; });

canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

window.addEventListener('resize', () => {
    const size = canvas.parentElement.clientWidth;
    canvas.width = size;
    canvas.height = size;
    TILE_COUNT = Math.floor(size / GRID_SIZE);
});

initGame();
isPaused = false;
draw();
isPaused = true;
