// --- CONFIGURATION ---
const SYMBOLS = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];

let coins = 50;
let isSpinning = [false, false, false];
let grid = [[], [], []];
let busy = false;

// --- SOUND ENGINE ---
function playSnd(id) {
    const s = document.getElementById('snd-' + id);
    if (s) {
        s.currentTime = 0;
        s.play().catch(() => {});
    }
}

function stopLoopSnd(id) {
    const s = document.getElementById('snd-' + id);
    if (s) s.pause();
}

// --- NAVIGATION ---
function startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    initMachine();
}

function toggleInfo() {
    document.getElementById('info-screen').classList.toggle('hidden');
}

// --- CORE ENGINE ---
function initMachine() {
    for (let i = 0; i < 3; i++) {
        const strip = document.getElementById(`strip-${i}`);
        strip.innerHTML = '';
        grid[i] = [
            Math.floor(Math.random() * SYMBOLS) + 1,
            Math.floor(Math.random() * SYMBOLS) + 1,
            Math.floor(Math.random() * SYMBOLS) + 1
        ];
        grid[i].forEach(id => strip.appendChild(createSym(id)));
    }
    updateUI();
}

function createSym(id) {
    const d = document.createElement('div');
    d.className = 'symbol';
    const img = document.createElement('img');
    img.src = `images/${id}.png`;
    img.onerror = () => { 
        img.remove(); 
        d.innerText = EMOJIS[id - 1] || '🏮'; 
    };
    d.appendChild(img);
    return d;
}

function startSpin() {
    if (coins < 5 || busy) return;
    busy = true;
    
    // UI Reset
    document.getElementById('spin-btn').classList.add('hidden-btn');
    document.getElementById('result-panel').classList.add('hidden');
    document.querySelectorAll('.symbol').forEach(s => s.classList.remove('winning-symbol'));
    
    coins -= 5;
    updateUI();

    playSnd('spin-start');
    playSnd('spinning');

    // Start all spinning
    for (let i = 0; i < 3; i++) {
        isSpinning[i] = true;
        document.getElementById(`strip-${i}`).classList.add('spinning');
        
        // --- THE FIX: STAGGERED STOP ---
        // We set a unique timeout for each reel (1s, 1.6s, 2.2s)
        setTimeout(() => {
            stopReel(i);
        }, 1000 + (i * 600)); 
    }
}

function stopReel(i) {
    if (!isSpinning[i]) return;
    playSnd('stop');
    isSpinning[i] = false;
    
    const strip = document.getElementById(`strip-${i}`);
    strip.classList.remove('spinning');
    
    // Independent Random Generation for each column
    grid[i] = [
        Math.floor(Math.random() * SYMBOLS) + 1,
        Math.floor(Math.random() * SYMBOLS) + 1,
        Math.floor(Math.random() * SYMBOLS) + 1
    ];

    strip.innerHTML = '';
    grid[i].forEach(id => strip.appendChild(createSym(id)));

    // Only check results once the LAST reel (index 2) has stopped
    if (!isSpinning.includes(true)) {
        stopLoopSnd('spinning');
        checkResult();
    }
}

// --- WIN LOGIC ---
function checkResult() {
    let lines = [];
    const g = grid; 

    // Horizontal Lines
    for (let r = 0; r < 3; r++) {
        if (g[0][r] === g[1][r] && g[1][r] === g[2][r]) lines.push({type:'h', v:r, id:g[0][r]});
    }

    // Vertical Lines
    for (let c = 0; c < 3; c++) {
        if (g[c][0] === g[c][1] && g[c][1] === g[c][2]) lines.push({type:'v', v:c, id:g[c][0]});
    }

    // Diagonal Lines
    if (g[0][0] === g[1][1] && g[1][1] === g[2][2]) lines.push({type:'d', v:0, id:g[1][1]});
    if (g[0][2] === g[1][1] && g[1][1] === g[2][0]) lines.push({type:'d', v:1, id:g[1][1]});

    setTimeout(() => finalize(lines), 500);
}

function finalize(lines) {
    const panel = document.getElementById('result-panel');
    const type = document.getElementById('res-type');
    const cash = document.getElementById('res-coins');
    panel.classList.remove('hidden');
    playSnd('feedback');

    if (lines.length > 0) {
        let total = 0;
        lines.forEach(l => {
            let pay = (l.id === 6) ? 500 : (l.id > 3 ? 150 : 50);
            total += pay;
            highlight(l);
        });

        if (lines.length > 1) {
            type.innerText = "ULTIMATE MULTI-KILL!";
            total *= 1.5; 
        } else {
            type.innerText = "SLAIN!";
        }
        
        const finalReward = Math.floor(total);
        cash.innerText = `+${finalReward} GOLD`;
        animateCoins(finalReward);
        playSnd('win');
    } else {
        type.innerText = "FAILED";
        cash.innerText = "Honor lost.";
        playSnd('lose');
    }

    if (coins < 5 && lines.length === 0) {
        setTimeout(() => {
            type.innerText = "TOTAL DEFEAT";
            cash.innerText = "Mission Failed.";
        }, 1000);
    }

    setTimeout(() => {
        busy = false;
        if (coins >= 5) {
            document.getElementById('spin-btn').classList.remove('hidden-btn');
        }
    }, 2500);
}

function highlight(l) {
    for (let i = 0; i < 3; i++) {
        let target;
        if (l.type === 'h') target = document.getElementById(`strip-${i}`).children[l.v];
        if (l.type === 'v') target = document.getElementById(`strip-${l.v}`).children[i];
        if (l.type === 'd') {
            let row = (l.v === 0 ? i : 2 - i);
            target = document.getElementById(`strip-${i}`).children[row];
        }
        if (target) target.classList.add('winning-symbol');
    }
}

function animateCoins(amount) {
    let count = 0;
    let timer = setInterval(() => {
        if (count >= amount) {
            clearInterval(timer);
            return;
        }
        coins++;
        count++;
        updateUI();
    }, 30);
}

function updateUI() { 
    const el = document.getElementById('coins');
    if (el) el.innerText = coins; 
}

window.onload = () => {
    // Buttons are usually hooked in HTML, but good to have a backup
    const btn = document.getElementById('spin-btn');
    if(btn) btn.onclick = startSpin;
};
