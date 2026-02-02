// --- CONFIGURATION ---
const SYMBOLS = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];

let coins = 10;
let highScore = 0;
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

function shareGame() {
    const shareText = `I have ${coins} gold in SHINOBI STRIKE! Can you beat my score?`;
    if (navigator.share) {
        navigator.share({
            title: 'SHINOBI STRIKE',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Score copied to clipboard!');
    }
}

// --- COIN SAVING SYSTEM ---
function saveCoins() {
    localStorage.setItem('shinobiStrike_coins', coins);
    localStorage.setItem('shinobiStrike_highScore', Math.max(highScore, coins));
}

function loadCoins() {
    const saved = localStorage.getItem('shinobiStrike_coins');
    const savedHigh = localStorage.getItem('shinobiStrike_highScore');
    if (saved) {
        coins = parseInt(saved);
        highScore = savedHigh ? parseInt(savedHigh) : coins;
    }
    updateUI();
}

// --- PARTICLE EFFECTS ---
function createParticles(count, element) {
    const particles = document.getElementById('particles');
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = (rect.left + rect.width/2) + 'px';
        particle.style.top = (rect.top + rect.height/2) + 'px';
        particle.style.backgroundColor = ['#ffcc00', '#ff9900', '#ff6600'][Math.floor(Math.random() * 3)];
        
        particles.appendChild(particle);
        
        // Animate particle
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const duration = 0.5 + Math.random() * 0.5;
        
        particle.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * speed * 100}px, ${Math.sin(angle) * speed * 100}px) scale(0)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
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

// --- SPIN SYSTEM ---
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
        
        // Staggered stop timing
        setTimeout(() => {
            stopReel(i);
        }, 1000 + (i * 600)); 
    }
}

function stopReel(i) {
    if (!isSpinning[i]) return;
    playSnd('stop');
    isSpinning[i] = false;
    
    const reel = document.getElementById(`reel-${i}`);
    const strip = document.getElementById(`strip-${i}`);
    
    // Visual feedback
    reel.style.transform = 'scale(0.95)';
    setTimeout(() => {
        reel.style.transform = 'scale(1)';
    }, 100);
    
    strip.classList.remove('spinning');
    
    // Independent Random Generation for each column
    grid[i] = [
        Math.floor(Math.random() * SYMBOLS) + 1,
        Math.floor(Math.random() * SYMBOLS) + 1,
        Math.floor(Math.random() * SYMBOLS) + 1
    ];

    strip.innerHTML = '';
    grid[i].forEach(id => strip.appendChild(createSym(id)));

    // Check results once the LAST reel has stopped
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

function highlight(l) {
    for (let i = 0; i < 3; i++) {
        let target;
        if (l.type === 'h') target = document.getElementById(`strip-${i}`).children[l.v];
        if (l.type === 'v') target = document.getElementById(`strip-${l.v}`).children[i];
        if (l.type === 'd') {
            let row = (l.v === 0 ? i : 2 - i);
            target = document.getElementById(`strip-${i}`).children[row];
        }
        if (target) {
            target.classList.add('winning-symbol');
            createParticles(3, target);
        }
    }
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
            // Reduced rewards
            let pay = (l.id === 6) ? 100 : (l.id > 3 ? 40 : 15);
            total += pay;
            highlight(l);
        });

        if (lines.length > 1) {
            type.innerText = "MULTI-KILL!";
            total = Math.floor(total * 1.3); // Reduced multiplier
        } else {
            type.innerText = "TARGET ELIMINATED!";
        }
        
        const finalReward = Math.floor(total);
        cash.innerText = `+${finalReward} GOLD`;
        
        // Screen shake for big wins
        if (finalReward > 50) {
            document.getElementById('game-view').classList.add('screen-shake');
            setTimeout(() => {
                document.getElementById('game-view').classList.remove('screen-shake');
            }, 500);
        }
        
        animateCoins(finalReward);
        playSnd('win');
    } else {
        type.innerText = "MISSED!";
        cash.innerText = "No bounty earned.";
        playSnd('lose');
    }

    if (coins < 5 && lines.length === 0) {
        setTimeout(() => {
            type.innerText = "MISSION FAILED";
            cash.innerText = "Out of gold.";
        }, 1000);
    }

    setTimeout(() => {
        busy = false;
        if (coins >= 5) {
            document.getElementById('spin-btn').classList.remove('hidden-btn');
        }
        panel.classList.add('hidden');
    }, 2000);
}

// --- COIN ANIMATION (FAST) ---
function animateCoins(amount) {
    const steps = Math.min(10, Math.ceil(amount / 50));
    const stepValue = Math.ceil(amount / steps);
    let count = 0;
    
    let timer = setInterval(() => {
        if (count >= amount) {
            clearInterval(timer);
            saveCoins();
            return;
        }
        coins += stepValue;
        count += stepValue;
        if (count > amount) {
            coins -= (count - amount);
            count = amount;
        }
        updateUI();
        
        // Coin bounce effect
        document.getElementById('coins').classList.add('coin-bounce');
        setTimeout(() => {
            document.getElementById('coins').classList.remove('coin-bounce');
        }, 300);
        
    }, 80); // Fast interval
}

// --- UI MANAGEMENT ---
function updateSpinButton() {
    const spinBtn = document.getElementById('spin-btn');
    if (coins < 5) {
        spinBtn.style.opacity = '0.5';
        spinBtn.style.cursor = 'not-allowed';
        spinBtn.title = 'Need 5 gold to spin';
    } else {
        spinBtn.style.opacity = '1';
        spinBtn.style.cursor = 'pointer';
        spinBtn.title = 'Spin the reels (5 gold)';
    }
}

function updateUI() { 
    const el = document.getElementById('coins');
    if (el) el.innerText = coins; 
    updateSpinButton();
}

// --- INITIALIZATION ---
window.onload = () => {
    loadCoins();
    
    const btn = document.getElementById('spin-btn');
    if(btn) btn.onclick = startSpin;
    
    // Auto-save every 30 seconds
    setInterval(saveCoins, 30000);
};