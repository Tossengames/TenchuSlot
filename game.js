const SYMBOL_TYPES = 6; 
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
let coins = 500;
let isSpinning = [false, false, false];
let gridResult = [[0,0,0], [0,0,0], [0,0,0]]; // Stores results for 3 reels

// 1. Initialize symbols on load
function init() {
    for (let i = 0; i < 3; i++) {
        randomizeReel(i);
    }
}

function createSymbol(id) {
    const div = document.createElement('div');
    div.className = 'symbol';
    const img = document.createElement('img');
    img.src = `images/${id}.png`;
    
    // Use Emoji if .png is missing
    img.onerror = () => {
        img.remove();
        div.innerText = EMOJIS[id - 1] || '🧧';
    };
    
    div.appendChild(img);
    return div;
}

function randomizeReel(reelIdx) {
    const strip = document.getElementById(`strip-${reelIdx}`);
    strip.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const id = Math.floor(Math.random() * SYMBOL_TYPES) + 1;
        strip.appendChild(createSymbol(id));
    }
}

// 2. Start Spinning
function startSpin() {
    if (coins < 10) return alert("Insufficient Gold!");
    if (isSpinning.includes(true)) return;

    coins -= 10;
    updateUI();
    
    document.getElementById('spin-btn').disabled = true;
    document.getElementById('message').innerText = "TAP TO STRIKE!";

    for (let i = 0; i < 3; i++) {
        isSpinning[i] = true;
        document.getElementById(`strip-${i}`).classList.add('spinning');
    }
}

// 3. Stop Individual Reel
function stopReel(i) {
    if (!isSpinning[i]) return;

    const strip = document.getElementById(`strip-${i}`);
    strip.classList.remove('spinning');
    isSpinning[i] = false;

    // Generate 3 final symbols for this column
    const results = [
        Math.floor(Math.random() * SYMBOL_TYPES) + 1,
        Math.floor(Math.random() * SYMBOL_TYPES) + 1,
        Math.floor(Math.random() * SYMBOL_TYPES) + 1
    ];
    gridResult[i] = results;

    // Show them on the strip
    strip.innerHTML = '';
    results.forEach(id => strip.appendChild(createSymbol(id)));

    // If all 3 stopped, check win
    if (!isSpinning.includes(true)) {
        evaluateGame();
    }
}

// 4. Win Logic for 3x3
function evaluateGame() {
    let win = 0;
    const g = gridResult; // g[reel][row]

    // Rows
    for (let r = 0; r < 3; r++) {
        if (g[0][r] === g[1][r] && g[1][r] === g[2][r]) win += 50;
    }
    // Diagonals
    if (g[0][0] === g[1][1] && g[1][1] === g[2][2]) win += 100;
    if (g[0][2] === g[1][1] && g[1][1] === g[2][0]) win += 100;

    if (win > 0) {
        coins += win;
        document.getElementById('message').innerText = `STRIKE! +${win} COINS`;
    } else {
        document.getElementById('message').innerText = "FAILED... TRY AGAIN";
    }

    updateUI();
    document.getElementById('spin-btn').disabled = false;
}

function updateUI() {
    document.getElementById('coins').innerText = coins;
    if (coins > 1000) document.getElementById('rank').innerText = "CHUNIN";
    if (coins > 2500) document.getElementById('rank').innerText = "JONIN";
}

window.onload = init;
