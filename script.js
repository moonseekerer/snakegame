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
const speedImg = new Image();
speedImg.src = 'speed.png';
const freezeImg = new Image();
freezeImg.src = 'freeze.png';

// Game constants
const GRID_SIZE = 20;
let TILE_COUNT;
let GAME_SPEED = 100;

// Game state
let jihum = { x: 5, y: 5 };
let enemies = [];
let items = [];
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let timeSurvived = 0;
let score = 0;
let highScore = localStorage.getItem('escapeHighScore') || 0;
let gameLoop;
let isPaused = true;
let frameCount = 0;

// Power-up states
let speedBoostActive = false;
let freezeActive = false;
let powerUpTimer = 0;

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

    jihum = { x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 2) };
    enemies = [
        { x: 2, y: 2, moveFrequency: 3, moveCounter: 0 }
    ];
    items = [];

    dx = 0;
    dy = 0;
    nextDx = 0;
    nextDy = 0;
    score = 0;
    timeSurvived = 0;
    scoreElement.textContent = '00:00';
    frameCount = 0;
    speedBoostActive = false;
    freezeActive = false;
    powerUpTimer = 0;
}

function spawnItem() {
    const type = Math.random() > 0.5 ? 'speed' : 'freeze';
    const newItem = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT),
        type: type
    };
    items.push(newItem);
}

function spawnEnemy() {
    // Spawn at a corner furthest from Jihum
    const corners = [
        { x: 0, y: 0 },
        { x: TILE_COUNT - 1, y: 0 },
        { x: 0, y: TILE_COUNT - 1 },
        { x: TILE_COUNT - 1, y: TILE_COUNT - 1 }
    ];

    // Pick the corner with max distance
    let bestCorner = corners[0];
    let maxDist = -1;

    corners.forEach(c => {
        const d = Math.abs(c.x - jihum.x) + Math.abs(c.y - jihum.y);
        if (d > maxDist) {
            maxDist = d;
            bestCorner = c;
        }
    });

    enemies.push({
        x: bestCorner.x,
        y: bestCorner.y,
        moveFrequency: Math.max(2, 4 - Math.floor(timeSurvived / 30)),
        moveCounter: 0
    });
}

function update() {
    if (isPaused) return;
    frameCount++;

    // Update Player Movement
    dx = nextDx;
    dy = nextDy;

    // If speed boost, move twice potentially, but let's just make it simpler: skip every other move normally, or move every turn when speedboost
    let playerMove = true;
    if (!speedBoostActive && frameCount % 2 === 0) {
        // Player moves slightly slower than 100% speed to make it challenging
        // playerMove = false; 
    }

    if (playerMove) {
        jihum.x += dx;
        jihum.y += dy;
        // Wall boundaries
        jihum.x = Math.max(0, Math.min(TILE_COUNT - 1, jihum.x));
        jihum.y = Math.max(0, Math.min(TILE_COUNT - 1, jihum.y));
    }

    // Power-up depletion
    if (powerUpTimer > 0) {
        powerUpTimer--;
        if (powerUpTimer === 0) {
            speedBoostActive = false;
            freezeActive = false;
        }
    }

    // Item Collision
    items = items.filter(item => {
        if (item.x === jihum.x && item.y === jihum.y) {
            if (item.type === 'speed') {
                speedBoostActive = true;
                freezeActive = false;
                powerUpTimer = 50; // 5 seconds
            } else {
                freezeActive = true;
                speedBoostActive = false;
                powerUpTimer = 30; // 3 seconds
            }
            return false;
        }
        return true;
    });

    // Enemy AI & Collision
    if (!freezeActive) {
        enemies.forEach(enemy => {
            enemy.moveCounter++;
            if (enemy.moveCounter >= enemy.moveFrequency) {
                enemy.moveCounter = 0;
                if (enemy.x < jihum.x) enemy.x++;
                else if (enemy.x > jihum.x) enemy.x--;

                if (enemy.y < jihum.y) enemy.y++;
                else if (enemy.y > jihum.y) enemy.y--;
            }
        });
    }

    // Capture Check
    enemies.forEach(enemy => {
        if (enemy.x === jihum.x && enemy.y === jihum.y) {
            gameOver();
        }
    });

    // Incremental Difficulty & Spawning (Every 1 second)
    if (frameCount % 10 === 0) {
        timeSurvived++;
        scoreElement.textContent = formatTime(timeSurvived);

        // Spawn new Jaehwan every 15 seconds
        if (timeSurvived > 0 && timeSurvived % 15 === 0 && enemies.length < 5) {
            spawnEnemy();
        }

        // Spawn items every 8 seconds if sparse
        if (timeSurvived % 8 === 0 && items.length < 2) {
            spawnItem();
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

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath(); ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
    }

    // Draw Items
    items.forEach(item => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = item.type === 'speed' ? '#00ffff' : '#00aaff';
        ctx.drawImage(item.type === 'speed' ? speedImg : freezeImg, item.x * GRID_SIZE, item.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });

    // Draw Enemies (Jaehwans)
    enemies.forEach(enemy => {
        ctx.shadowBlur = freezeActive ? 5 : 25;
        ctx.shadowColor = freezeActive ? '#00aaff' : '#ff0055';
        if (freezeActive) ctx.globalAlpha = 0.6;
        ctx.drawImage(jaehwanImg, enemy.x * GRID_SIZE, enemy.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        ctx.globalAlpha = 1.0;
    });

    // Draw Player (Jihum)
    ctx.shadowBlur = speedBoostActive ? 35 : 20;
    ctx.shadowColor = speedBoostActive ? '#ffff00' : '#00ff88';
    ctx.drawImage(jihumImg, jihum.x * GRID_SIZE, jihum.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

    // Power-up visual indicator
    if (powerUpTimer > 0) {
        ctx.strokeStyle = speedBoostActive ? '#ffff00' : '#00aaff';
        ctx.lineWidth = 2;
        ctx.strokeRect(jihum.x * GRID_SIZE - 2, jihum.y * GRID_SIZE - 2, GRID_SIZE + 4, GRID_SIZE + 4);
    }
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

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Patch Note Modal Logic
const patchNoteBtn = document.getElementById('patch-note-btn');
const patchModal = document.getElementById('patch-modal');
const closeModal = document.getElementById('close-modal');

patchNoteBtn.addEventListener('click', () => {
    patchModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    patchModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === patchModal) {
        patchModal.classList.add('hidden');
    }
});

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
