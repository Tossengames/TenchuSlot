const SYMBOL_TYPES = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
let coins = 100;
let isSpinning = [false, false, false];
let gridResult = [[], [], []];
let isProcessing = false;

function init() {
    for (let i = 0; i < 3; i++) randomizeReel(i);
    updateUI();
}

function updateUI() {
    document.getElementById('coins').innerText = coins;
}

function createSymbol(id) {
    const div = document.createElement('div');
    div.className = 'symbol';
    const img = document.createElement('img');
    img.src = `images/${id}.png`;
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
        strip.appendChild(createSymbol(Math.floor(Math.random() * SYMBOL_TYPES) + 1));
    }
}

function startSpin() {
    if (coins < 5 || isProcessing) return;

    // Reset Visuals
    isProcessing = true;
    document.getElementById('result-overlay').classList.add('hidden');
    document.getElementById('spin-btn').classList.add('hidden-btn'); 
    document.getElementById('machine-frame').classList.remove('shake');
    
    // Clear old winning highlights
    document.querySelectorAll('.symbol').forEach(s => s.classList.remove('winning-symbol'));

    coins -= 5;
    updateUI();

    for (let i = 0; i < 3; i++) {
        isSpinning[i] = true;
        document.getElementById(`strip-${i}`).classList.add('spinning');
    }
}

function stopReel(i) {
    if (!isSpinning[i]) return;
    
    const strip = document.getElementById(`strip-${i}`);
    strip.classList.remove('spinning');
    isSpinning[i] = false;

    // Generate column results
    gridResult[i] = [
        Math.floor(Math.random() * SYMBOL_TYPES) + 1,
        Math.floor(Math.random() * SYMBOL_TYPES) + 1,
        Math.floor(Math.random() * SYMBOL_TYPES) + 1
    ];

    strip.innerHTML = '';
    gridResult[i].forEach(id => strip.appendChild(createSymbol(id)));

    // Weight/Shake effect when reel stops
    document.getElementById(`reel-${i}`).classList.add('shake');
    setTimeout(() => document.getElementById(`reel-${i}`).classList.remove('shake'), 300);

    if (!isSpinning.includes(true)) {
        setTimeout(evaluateGame, 500);
    }
}

function evaluateGame() {
    let wins = [];
    const g = gridResult;

    // Row Checks
    for (let r = 0; r < 3; r++) {
        if (g[0][r] === g[1][r] && g[1][r] === g[2][r]) wins.push({type: 'row', idx: r});
    }
    // Diagonal Checks
    if (g[0][0] === g[1][1] && g[1][1] === g[2][2]) wins.push({type: 'diag', idx: 0});
    if (g[0][2] === g[1][1] && g[1][1] === g[2][0]) wins.push({type: 'diag', idx: 1});

    showResult(wins);
}

function showResult(wins) {
    const overlay = document.getElementById('result-overlay');
    const title = document.getElementById('result-title');
    overlay.classList.remove('hidden');

    if (wins.length > 0) {
        coins += (wins.length * 50);
        title.innerText = "SLAIN";
        title.style.color = "var(--gold)";
        highlightWins(wins);
        spawnBlood(40); // Explosive blood
    } else {
        title.innerText = "EXECUTED";
        title.style.color = "var(--blood)";
        spawnBlood(10); // Minimal blood
    }

    updateUI();

    setTimeout(() => {
        isProcessing = false;
        overlay.classList.add('hidden');
        document.getElementById('spin-btn').classList.remove('hidden-btn');
    }, 2000);
}

function highlightWins(wins) {
    wins.forEach(w => {
        for (let reel = 0; reel < 3; reel++) {
            let row = (w.type === 'row') ? w.idx : (w.idx === 0 ? reel : 2 - reel);
            document.getElementById(`strip-${reel}`).children[row].classList.add('winning-symbol');
        }
    });
}

function spawnBlood(count) {
    for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = 'blood-drop';
        drop.style.left = Math.random() * 100 + 'vw';
        drop.style.top = '-20px';
        document.body.appendChild(drop);

        drop.animate([
            { transform: 'translateY(0)', opacity: 1 },
            { transform: `translateY(100vh)`, opacity: 0 }
        ], { duration: 1000 + Math.random() * 2000 }).onfinish = () => drop.remove();
    }
}

window.onload = init;
