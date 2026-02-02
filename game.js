const SYMBOL_TYPES = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
let coins = 100; // Lower starting money
let isSpinning = [false, false, false];
let gridResult = [[], [], []];
let isProcessing = false;

function init() {
    for (let i = 0; i < 3; i++) randomizeReel(i);
    updateUI();
}

function createSymbol(id, isWinning = false) {
    const div = document.createElement('div');
    div.className = `symbol ${isWinning ? 'winning-symbol' : ''}`;
    const img = document.createElement('img');
    img.src = `images/${id}.png`;
    img.onerror = () => { img.remove(); div.innerText = EMOJIS[id - 1]; };
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
    
    // Reset visuals
    document.getElementById('result-overlay').classList.add('hidden');
    document.getElementById('machine-frame').classList.remove('shake');

    coins -= 5; // Cheaper bet
    updateUI();
    isProcessing = true;
    document.getElementById('spin-btn').disabled = true;

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

    gridResult[i] = [
        Math.floor(Math.random() * SYMBOL_TYPES) + 1,
        Math.floor(Math.random() * SYMBOL_TYPES) + 1,
        Math.floor(Math.random() * SYMBOL_TYPES) + 1
    ];

    strip.innerHTML = '';
    gridResult[i].forEach(id => strip.appendChild(createSymbol(id)));

    if (!isSpinning.includes(true)) evaluateGame();
}

function evaluateGame() {
    let winningLines = [];
    const g = gridResult;

    // Check Rows
    for (let r = 0; r < 3; r++) {
        if (g[0][r] === g[1][r] && g[1][r] === g[2][r]) winningLines.push({type: 'row', index: r});
    }
    // Check Diagonals
    if (g[0][0] === g[1][1] && g[1][1] === g[2][2]) winningLines.push({type: 'diag', index: 0});
    if (g[0][2] === g[1][1] && g[1][1] === g[2][0]) winningLines.push({type: 'diag', index: 1});

    setTimeout(() => {
        showFeedback(winningLines);
    }, 300);
}

function showFeedback(lines) {
    const overlay = document.getElementById('result-overlay');
    const title = document.getElementById('result-title');
    overlay.classList.remove('hidden');

    if (lines.length > 0) {
        let winTotal = lines.length * 25;
        coins += winTotal;
        title.innerText = "VICTORY";
        title.style.color = "var(--gold)";
        spawnParticles("var(--gold)");
        highlightWins(lines);
    } else {
        title.innerText = "DEFEAT";
        title.style.color = "var(--blood-red)";
        document.getElementById('machine-frame').classList.add('shake');
        spawnParticles("#444");
    }

    updateUI();

    // Lockdown: Wait 2 seconds before allowing next spin
    setTimeout(() => {
        isProcessing = false;
        document.getElementById('spin-btn').disabled = false;
        document.getElementById('message').innerText = "READY FOR NEXT MISSION";
    }, 2000);
}

function highlightWins(lines) {
    lines.forEach(line => {
        for (let reel = 0; reel < 3; reel++) {
            let row;
            if (line.type === 'row') row = line.index;
            else if (line.type === 'diag') row = (line.index === 0) ? reel : 2 - reel;
            
            const symbol = document.getElementById(`strip-${reel}`).children[row];
            symbol.classList.add('winning-symbol');
        }
    });
}

function spawnParticles(color) {
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color;
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = '100vh';
        document.body.appendChild(p);
        
        const anim = p.animate([
            { transform: `translate(0, 0)`, opacity: 1 },
            { transform: `translate(${(Math.random()-0.5)*200}px, -100vh)`, opacity: 0 }
        ], { duration: 1000 + Math.random() * 1000 });
        
        anim.onfinish = () => p.remove();
    }
}

function updateUI() {
    document.getElementById('coins').innerText = coins;
}

window.onload = init;
