const SYMBOLS = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
let coins = 50;
let isSpinning = [false, false, false];
let grid = [[], [], []];
let busy = false;

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

function startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    initMachine();
}

function toggleInfo() {
    document.getElementById('info-screen').classList.toggle('hidden');
}

function initMachine() {
    for (let i = 0; i < 3; i++) {
        const strip = document.getElementById(`strip-${i}`);
        strip.innerHTML = '';
        for (let j = 0; j < 10; j++) strip.appendChild(createSym(Math.floor(Math.random()*SYMBOLS)+1));
    }
}

function createSym(id) {
    const d = document.createElement('div');
    d.className = 'symbol';
    const img = document.createElement('img');
    img.src = `images/${id}.png`;
    img.onerror = () => { img.remove(); d.innerText = EMOJIS[id-1]; };
    d.appendChild(img);
    return d;
}

function startSpin() {
    if (coins < 5 || busy) return;
    busy = true;
    coins -= 5;
    updateUI();
    
    document.getElementById('spin-btn').classList.add('hidden-btn'); // Hide spin button
    document.getElementById('result-panel').classList.add('hidden');
    document.querySelectorAll('.symbol').forEach(s => s.classList.remove('winning-symbol'));

    playSnd('spin-start');
    playSnd('spinning');

    for (let i = 0; i < 3; i++) {
        isSpinning[i] = true;
        document.getElementById(`strip-${i}`).classList.add('spinning');
    }
}

function stopReel(i) {
    if (!isSpinning[i]) return;
    playSnd('stop');
    isSpinning[i] = false;
    const strip = document.getElementById(`strip-${i}`);
    strip.classList.remove('spinning');
    
    grid[i] = [Math.floor(Math.random()*SYMBOLS)+1, Math.floor(Math.random()*SYMBOLS)+1, Math.floor(Math.random()*SYMBOLS)+1];
    strip.innerHTML = '';
    grid[i].forEach(id => strip.appendChild(createSym(id)));

    if (!isSpinning.includes(true)) {
        stopLoopSnd('spinning');
        checkResult();
    }
}

function checkResult() {
    let lines = [];
    const g = grid; // g[reel][row]

    // 1. Check Horizontal Rows
    for (let r = 0; r < 3; r++) {
        if (g[0][r] === g[1][r] && g[1][r] === g[2][r]) {
            lines.push({type:'h', v:r, id:g[0][r]});
        }
    }

    // 2. Check Vertical Columns
    for (let c = 0; c < 3; c++) {
        if (g[c][0] === g[c][1] && g[c][1] === g[c][2]) {
            lines.push({type:'v', v:c, id:g[c][0]});
        }
    }

    // 3. Check Diagonals
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
        
        cash.innerText = `+${Math.floor(total)} GOLD`;
        animateCoins(Math.floor(total));
        playSnd('win');
    } else {
        type.innerText = "FAILED";
        cash.innerText = "Honor lost.";
        playSnd('lose');
    }

    if (coins < 5 && lines.length === 0) {
        type.innerText = "GAME OVER";
        cash.innerText = "No gold remains.";
    }

    setTimeout(() => {
        busy = false;
        if (coins >= 5) document.getElementById('spin-btn').classList.remove('hidden-btn');
    }, 2000);
}

function highlight(l) {
    for (let i = 0; i < 3; i++) {
        let el;
        if (l.type === 'h') el = document.getElementById(`strip-${i}`).children[l.v];
        if (l.type === 'v') el = document.getElementById(`strip-${l.v}`).children[i];
        if (l.type === 'd') {
            let r = (l.v === 0 ? i : 2 - i);
            el = document.getElementById(`strip-${i}`).children[r];
        }
        if (el) el.classList.add('winning-symbol');
    }
}

function animateCoins(amount) {
    let count = 0;
    let timer = setInterval(() => {
        coins++;
        count++;
        updateUI();
        if (count >= amount) clearInterval(timer);
    }, 30);
}

function updateUI() { document.getElementById('coins').innerText = coins; }

function shareGame() {
    const text = `I have ${coins} gold in Shinobi Strike!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
}
