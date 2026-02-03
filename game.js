// ============================================
// TENCHU: SHADOW MISSION - SIMPLIFIED VERSION
// ============================================

// --- GAME CONFIGURATION ---
const SYMBOLS = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
const SYMBOL_NAMES = ['Ninja', 'Sword', 'Lantern', 'Oni', 'Scroll', 'Castle'];

// Character database
const CHARACTERS = {
    rikimaru: {
        name: "Rikimaru",
        emoji: "🥷",
        color: "#3366cc",
        messages: [
            "Lord Gohda needs funds for the resistance.",
            "The Azure Dragon requires resources.",
            "Azuma village needs gold to rebuild."
        ],
        goals: ["Get 50 gold", "Earn 80 gold", "Collect 100 gold"]
    },
    ayame: {
        name: "Ayame",
        emoji: "⚔️",
        color: "#cc3366",
        messages: [
            "The Crimson Lily seeks resources for healing.",
            "Wounded kunoichi need medicine.",
            "Poison ingredients must be purchased."
        ],
        goals: ["Get 40 gold", "Earn 70 gold", "Collect 90 gold"]
    },
    tatsumaru: {
        name: "Tatsumaru",
        emoji: "👺",
        color: "#33cc66",
        messages: [
            "The Green Viper needs funds for the rebellion.",
            "Bribes are needed for castle access.",
            "Stealth gear must be acquired."
        ],
        goals: ["Get 60 gold", "Earn 90 gold", "Collect 120 gold"]
    }
};

// Ranking System
const RANKS = [
    { name: "INITIATE", minHonor: 0, color: "#666666" },
    { name: "SHINOBI", minHonor: 100, color: "#3366cc" },
    { name: "ASSASSIN", minHonor: 300, color: "#cc3366" },
    { name: "SHADOW MASTER", minHonor: 600, color: "#9933cc" },
    { name: "GRAND MASTER", minHonor: 1000, color: "#ffcc00" }
];

// --- GAME STATE ---
let coins = 0;
let honor = 0;
let totalHonor = 0;
let currentRank = 0;
let currentCharacter = null;
let currentGoal = "";
let isSpinning = [false, false, false];
let grid = [[], [], []];
let busy = false;

// --- SOUND SYSTEM ---
function playSnd(id) {
    // Simple beep sounds
    try {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        let frequency = 800;
        let duration = 0.1;
        
        if (id === 'win') {
            frequency = 523.25; // C5
            duration = 0.3;
        } else if (id === 'lose') {
            frequency = 392; // G4
            duration = 0.3;
        } else if (id === 'spin') {
            frequency = 400;
            duration = 0.2;
        }
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch(e) {
        // Audio not supported
    }
}

// --- SAVE/LOAD SYSTEM ---
function saveGame() {
    const gameData = {
        coins: coins,
        honor: honor,
        totalHonor: totalHonor,
        timestamp: Date.now()
    };
    
    localStorage.setItem('tenchu_simple_save', JSON.stringify(gameData));
    updateRankDisplay();
}

function loadGame() {
    const saved = localStorage.getItem('tenchu_simple_save');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            coins = data.coins || 0;
            honor = data.honor || 0;
            totalHonor = data.totalHonor || 0;
            updateRank();
            updateUI();
        } catch(e) {
            resetGame();
        }
    } else {
        resetGame();
    }
}

function resetGame() {
    coins = 0;
    honor = 0;
    totalHonor = 0;
    updateRank();
    updateUI();
}

// --- RANK SYSTEM ---
function updateRank() {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (honor >= RANKS[i].minHonor) {
            currentRank = i;
            break;
        }
    }
}

function updateRankDisplay() {
    const rankElement = document.getElementById('current-rank');
    const honorElement = document.getElementById('total-honor');
    const coinsElement = document.getElementById('saved-coins');
    
    if (rankElement) {
        rankElement.textContent = RANKS[currentRank].name;
        rankElement.style.color = RANKS[currentRank].color;
    }
    
    if (honorElement) honorElement.textContent = honor;
    if (coinsElement) coinsElement.textContent = coins;
}

// --- MISSION SYSTEM ---
function startMission() {
    playSnd('click');
    
    // Random character
    const chars = Object.keys(CHARACTERS);
    currentCharacter = chars[Math.floor(Math.random() * chars.length)];
    const char = CHARACTERS[currentCharacter];
    
    // Random message and goal
    const randomMessage = char.messages[Math.floor(Math.random() * char.messages.length)];
    const randomGoal = char.goals[Math.floor(Math.random() * char.goals.length)];
    currentGoal = randomGoal;
    
    // Random starting coins (15-30)
    coins = 15 + Math.floor(Math.random() * 16);
    
    // Update briefing
    document.getElementById('character-message').textContent = 
        `${char.emoji} ${char.name}: "${randomMessage}"`;
    document.getElementById('character-goal').textContent = 
        `Goal: ${randomGoal}`;
    
    // Show briefing
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('mission-briefing').classList.remove('hidden');
    
    // Update UI
    updateUI();
}

function startGame() {
    playSnd('click');
    document.getElementById('mission-briefing').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    
    updateMissionIndicator();
    initMachine();
    saveGame();
}

function showInstructions() {
    playSnd('click');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('info-screen').classList.remove('hidden');
}

function goToMainMenu() {
    playSnd('click');
    const currentScreen = document.querySelector('.screen:not(.hidden)');
    if (currentScreen) {
        currentScreen.classList.add('hidden');
    }
    document.getElementById('main-menu').classList.remove('hidden');
    updateRankDisplay();
}

function returnToBase() {
    playSnd('click');
    saveGame();
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    updateRankDisplay();
}

function donate() {
    playSnd('click');
    window.open('https://ko-fi.com', '_blank');
}

// --- GAME ENGINE ---
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
    d.textContent = EMOJIS[id - 1] || '❓';
    d.setAttribute('data-value', id);
    return d;
}

function updateMissionIndicator() {
    const indicator = document.getElementById('mission-indicator');
    if (currentCharacter && currentGoal) {
        indicator.textContent = `${CHARACTERS[currentCharacter].name}: ${currentGoal}`;
    }
}

// --- SPIN SYSTEM ---
function startSpin() {
    if (coins < 5 || busy) return;
    busy = true;
    
    // Reset UI
    document.getElementById('spin-btn').classList.add('hidden-btn');
    document.getElementById('result-panel').classList.add('hidden');
    document.querySelectorAll('.symbol').forEach(s => s.classList.remove('winning-symbol'));
    
    // Deduct spin cost
    coins -= 5;
    updateUI();
    playSnd('spin');
    
    // Start all reels spinning
    for (let i = 0; i < 3; i++) {
        isSpinning[i] = true;
        document.getElementById(`strip-${i}`).classList.add('spinning');
        
        // Staggered stop times
        setTimeout(() => {
            if (isSpinning[i]) {
                stopReel(i);
            }
        }, 1000 + (i * 600));
    }
}

function stopReel(i) {
    if (!isSpinning[i]) return;
    
    playSnd('click');
    isSpinning[i] = false;
    
    const strip = document.getElementById(`strip-${i}`);
    strip.classList.remove('spinning');
    
    // Generate new symbols
    grid[i] = [
        Math.floor(Math.random() * SYMBOLS) + 1,
        Math.floor(Math.random() * SYMBOLS) + 1,
        Math.floor(Math.random() * SYMBOLS) + 1
    ];
    
    // Update display
    strip.innerHTML = '';
    grid[i].forEach(id => strip.appendChild(createSym(id)));
    
    // Check if all reels stopped
    if (!isSpinning.includes(true)) {
        setTimeout(() => {
            checkResult();
        }, 300);
    }
}

// --- WIN DETECTION ---
function checkResult() {
    let lines = [];
    const g = grid;
    
    // Horizontal lines
    for (let row = 0; row < 3; row++) {
        if (g[0][row] === g[1][row] && g[1][row] === g[2][row]) {
            lines.push({type: 'h', row: row, symbol: g[0][row]});
        }
    }
    
    // Vertical lines
    for (let col = 0; col < 3; col++) {
        if (g[col][0] === g[col][1] && g[col][1] === g[col][2]) {
            lines.push({type: 'v', col: col, symbol: g[col][0]});
        }
    }
    
    // Diagonal lines
    if (g[0][0] === g[1][1] && g[1][1] === g[2][2]) {
        lines.push({type: 'd', dir: 'main', symbol: g[1][1]});
    }
    if (g[0][2] === g[1][1] && g[1][1] === g[2][0]) {
        lines.push({type: 'd', dir: 'anti', symbol: g[1][1]});
    }
    
    // Process results
    setTimeout(() => finalize(lines), 500);
}

function highlightLine(line) {
    for (let i = 0; i < 3; i++) {
        let target = null;
        
        if (line.type === 'h') {
            target = document.getElementById(`strip-${i}`).children[line.row];
        } else if (line.type === 'v') {
            target = document.getElementById(`strip-${line.col}`).children[i];
        } else if (line.type === 'd') {
            if (line.dir === 'main') {
                target = document.getElementById(`strip-${i}`).children[i];
            } else {
                target = document.getElementById(`strip-${i}`).children[2 - i];
            }
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
    
    if (lines.length > 0) {
        let total = 0;
        
        // Calculate rewards
        lines.forEach(line => {
            let reward = 0;
            // Character symbols (1, 2, 3) pay more
            switch(line.symbol) {
                case 1: // Ninja
                    reward = 30;
                    break;
                case 2: // Sword Master (character)
                    reward = 20;
                    break;
                case 3: // Oni (character)
                    reward = 25;
                    break;
                case 4: // Lantern (item)
                    reward = 10;
                    break;
                case 5: // Scroll (item)
                    reward = 8;
                    break;
                case 6: // Castle (special)
                    reward = 15;
                    break;
                default:
                    reward = 10;
            }
            total += reward;
            highlightLine(line);
        });
        
        // Multi-line bonus
        if (lines.length > 1) {
            type.textContent = "BIG WIN!";
            total = Math.floor(total * 1.3);
        } else {
            type.textContent = "WIN!";
        }
        
        // Cap at maximum
        const finalReward = Math.min(50, total);
        cash.textContent = `+${finalReward} GOLD`;
        
        // Add coins with animation
        animateCoins(finalReward);
        
        // Add honor for win
        const honorGain = Math.floor(finalReward / 5);
        honor += honorGain;
        totalHonor += honorGain;
        updateRank();
        
        playSnd('win');
        
    } else {
        type.textContent = "FAILED";
        cash.textContent = "No matches";
        playSnd('lose');
        
        // Check if out of coins
        if (coins < 5) {
            setTimeout(() => {
                type.textContent = "GAME OVER";
                cash.textContent = "No gold left";
            }, 1000);
        }
    }
    
    // Reset for next spin
    setTimeout(() => {
        busy = false;
        if (coins >= 5) {
            document.getElementById('spin-btn').classList.remove('hidden-btn');
        }
        saveGame();
    }, 2000);
}

// --- ANIMATIONS ---
function animateCoins(amount) {
    const steps = 3;
    const stepValue = Math.ceil(amount / steps);
    let count = 0;
    
    const timer = setInterval(() => {
        if (count >= amount) {
            clearInterval(timer);
            saveGame();
            return;
        }
        
        coins += stepValue;
        count += stepValue;
        
        if (count > amount) {
            coins -= (count - amount);
            count = amount;
        }
        
        updateUI();
        
        // Visual feedback
        const coinElement = document.getElementById('coins');
        coinElement.classList.add('coin-bounce');
        setTimeout(() => {
            coinElement.classList.remove('coin-bounce');
        }, 200);
        
    }, 100);
}

function createParticles(count, element) {
    const particles = document.getElementById('particles');
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = (rect.left + rect.width/2) + 'px';
        particle.style.top = (rect.top + rect.height/2) + 'px';
        particle.style.backgroundColor = ['#ff3300', '#990000', '#cc0000'][Math.floor(Math.random() * 3)];
        
        particles.appendChild(particle);
        
        // Animate particle
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        const duration = 0.3 + Math.random() * 0.3;
        
        particle.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * speed * 50}px, ${Math.sin(angle) * speed * 50}px) scale(0)`, opacity: 0 }
        ], {
            duration: duration * 1000,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

// --- UI UPDATES ---
function updateUI() {
    // Update displays
    document.getElementById('coins').textContent = coins;
    document.getElementById('honor').textContent = honor;
    
    // Update spin button state
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        if (coins < 5) {
            spinBtn.disabled = true;
            spinBtn.style.opacity = '0.5';
        } else {
            spinBtn.disabled = false;
            spinBtn.style.opacity = '1';
        }
    }
}

// --- INITIALIZATION ---
window.onload = function() {
    // Load saved game
    loadGame();
    updateRankDisplay();
    
    // Auto-save every minute
    setInterval(saveGame, 60000);
};

// --- KEYBOARD CONTROLS ---
document.addEventListener('keydown', function(e) {
    const gameView = document.getElementById('game-view');
    if (!gameView || gameView.classList.contains('hidden')) return;
    
    switch(e.key) {
        case ' ':
        case 'Enter':
            if (!busy && coins >= 5) {
                startSpin();
            }
            break;
        case '1':
        case '2':
        case '3':
            const reelIndex = parseInt(e.key) - 1;
            if (isSpinning[reelIndex]) {
                stopReel(reelIndex);
            }
            break;
        case 'Escape':
            returnToBase();
            break;
    }
});

// Prevent right-click
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});