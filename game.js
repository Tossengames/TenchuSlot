// ============================================
// TENCHU: SHADOW MISSION
// ============================================

// --- GAME CONFIG ---
const SYMBOLS = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
const SYMBOL_NAMES = ['Ninja', 'Sword', 'Lantern', 'Oni', 'Scroll', 'Castle'];

// Character database with authentic Tenchu lore
const CHARACTERS = {
    rikimaru: {
        name: "RIKIMARU",
        emoji: "🥷",
        color: "#3366cc",
        messages: [
            "The Azuma clan needs supplies. Our missions require new tools.",
            "Azuma village must not starve. The people protect our secret.",
            "Strange ronin gather at the pass. They seek Lord Gohda's head."
        ],
        successMessages: [
            "The Azuma clan thanks you. Our missions continue.",
            "Azuma village survives. The people remember.",
            "The ronin threat is gone. Lord Gohda sleeps safely."
        ],
        failureMessages: [
            "The Azuma clan struggles. Our tools fail us.",
            "Azuma village suffers. The people who shelter us go hungry.",
            "The ronin grow bold. Lord Gohda's life is in danger."
        ]
    },
    ayame: {
        name: "AYAME",
        emoji: "⚔️",
        color: "#cc3366",
        messages: [
            "The Azuma sisters need medicine. Our wounded wait.",
            "Princess Kiku needs protection. Strange men watch the castle.",
            "Lord Mei-Oh's servants poison the land. We need sacred charms."
        ],
        successMessages: [
            "Our sisters heal. The Azuma clan stands together.",
            "Princess Kiku is safe. The girl sleeps without fear.",
            "Lord Mei-Oh's influence fades. The land breathes."
        ],
        failureMessages: [
            "Our sisters suffer. The Azuma clan weeps.",
            "Princess Kiku fears the shadows. We failed her.",
            "Lord Mei-Oh's corruption spreads. Darkness wins."
        ]
    },
    tatsumaru: {
        name: "TATSUMARU",
        emoji: "👺",
        color: "#33cc66",
        messages: [
            "The Azuma clan needs gold for情报. Lord Gohda's enemies plot.",
            "My brothers need weapons. The clan must be ready.",
            "The people cry for protection. We must answer."
        ],
        successMessages: [
            "情报 flows freely. We see the enemy's moves.",
            "My brothers are armed. The Azuma clan stands ready.",
            "The people find peace. They sleep knowing we watch."
        ],
        failureMessages: [
            "情报 runs dry. The enemy strikes from shadows.",
            "My brothers fight with dull blades. The clan bleeds.",
            "The people lose hope. They curse our name."
        ]
    }
};

// Ranking System
const RANKS = [
    { name: "INITIATE", minPoints: 0, color: "#666666", level: 1 },
    { name: "SHINOBI", minPoints: 50, color: "#3366cc", level: 2 },
    { name: "ASSASSIN", minPoints: 150, color: "#cc3366", level: 3 },
    { name: "SHADOW MASTER", minPoints: 300, color: "#9933cc", level: 4 },
    { name: "GRAND MASTER", minPoints: 500, color: "#ffcc00", level: 5 }
];

// --- GAME STATE ---
let coins = 0;
let collectedGold = 0;
let points = 0;
let totalPoints = 0;
let currentRank = 0;
let oldRank = 0;
let currentCharacter = null;
let currentGoal = 0;
let missionStarted = false;
let isSpinning = [false, false, false];
let grid = [[], [], []];
let busy = false;
let soundEnabled = true;
let lastWinAmount = 0;
let bgMusic = null;

// --- UTILITY FUNCTIONS ---
function showMessage(text, type = 'info', duration = 3000) {
    const toast = document.getElementById('message-toast');
    const feedbackPanel = document.getElementById('feedback-panel');
    const feedbackText = document.getElementById('feedback-text');
    
    // Update toast
    toast.textContent = text;
    toast.className = '';
    toast.style.color = type === 'success' ? '#00cc66' : 
                       type === 'error' ? '#ff3333' : '#ffcc00';
    toast.classList.remove('hidden');
    
    // Update feedback panel
    if (feedbackPanel && feedbackText) {
        feedbackText.textContent = text;
        feedbackPanel.className = 'feedback-panel ' + type;
        feedbackPanel.classList.remove('hidden');
        
        // Auto-hide feedback after duration
        setTimeout(() => {
            feedbackPanel.classList.add('hidden');
        }, duration);
    }
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// --- SOUND SYSTEM ---
function initAudio() {
    // Create background music
    bgMusic = new Audio(`sounds/bg-music.mp3`);
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    
    // Try to autoplay
    if (soundEnabled) {
        try {
            bgMusic.play().catch(() => {});
        } catch(e) {}
    }
}

function playSound(id) {
    if (!soundEnabled) return;
    
    try {
        const audio = new Audio(`sounds/${id}.mp3`);
        audio.volume = 0.5;
        audio.play().catch(() => {});
    } catch(e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const globalIcon = document.getElementById('global-sound-icon');
    
    if (soundEnabled) {
        if (globalIcon) globalIcon.className = 'fas fa-volume-up';
        playSound('click');
        
        // Start background music if not playing
        if (bgMusic && bgMusic.paused) {
            bgMusic.play().catch(() => {});
        }
    } else {
        if (globalIcon) globalIcon.className = 'fas fa-volume-mute';
        
        // Pause all audio
        if (bgMusic) bgMusic.pause();
    }
    
    showMessage(`Sound ${soundEnabled ? 'Enabled' : 'Disabled'}`, 'info', 1500);
}

// --- SAVE/LOAD SYSTEM ---
function saveGame() {
    const gameData = {
        points: points,
        totalPoints: totalPoints,
        timestamp: Date.now()
    };
    localStorage.setItem('tenchu_save', JSON.stringify(gameData));
    updateRankDisplay();
}

function loadGame() {
    const saved = localStorage.getItem('tenchu_save');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            points = data.points || 0;
            totalPoints = data.totalPoints || 0;
            updateRank();
            updateRankProgress();
            updateUI();
        } catch(e) {
            resetGame();
        }
    } else {
        resetGame();
    }
}

function resetGame() {
    points = 0;
    totalPoints = 0;
    updateRank();
    updateRankProgress();
    updateUI();
}

// --- RANK SYSTEM ---
function updateRank() {
    oldRank = currentRank;
    
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (points >= RANKS[i].minPoints) {
            currentRank = i;
            break;
        }
    }
    
    if (oldRank !== currentRank) {
        if (currentRank > oldRank) {
            showMessage(`RANK UP! ${RANKS[oldRank].name} → ${RANKS[currentRank].name}`, 'success');
            playSound('rank-up');
        }
    }
}

function updateRankDisplay() {
    const rankElement = document.getElementById('current-rank');
    const pointsElement = document.getElementById('total-points');
    
    if (rankElement) {
        rankElement.textContent = RANKS[currentRank].name;
        rankElement.style.color = RANKS[currentRank].color;
    }
    
    if (pointsElement) pointsElement.textContent = points;
}

function updateRankProgress() {
    const currentRankPoints = RANKS[currentRank].minPoints;
    const nextRankPoints = currentRank < RANKS.length - 1 ? RANKS[currentRank + 1].minPoints : RANKS[currentRank].minPoints * 2;
    const progress = ((points - currentRankPoints) / (nextRankPoints - currentRankPoints)) * 100;
    
    const progressFill = document.getElementById('rank-progress');
    const rankLevel = document.getElementById('rank-level');
    const nextPoints = document.getElementById('next-rank-points');
    
    if (progressFill) progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    if (rankLevel) rankLevel.textContent = RANKS[currentRank].level;
    if (nextPoints) nextPoints.textContent = nextRankPoints;
}

// --- RESET MISSION STATE ---
function resetMissionState() {
    coins = 0;
    collectedGold = 0;
    currentGoal = 0;
    missionStarted = false;
    busy = false;
    isSpinning = [false, false, false];
    grid = [[], [], []];
    
    // Reset all reels
    for (let i = 0; i < 3; i++) {
        const strip = document.getElementById(`strip-${i}`);
        if (strip) {
            strip.classList.remove('spinning');
            strip.innerHTML = '';
        }
    }
    
    // Reset UI elements
    const resultPanel = document.getElementById('result-panel');
    if (resultPanel) {
        resultPanel.classList.add('hidden');
        resultPanel.style.display = 'none';
    }
    
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        spinBtn.style.display = 'flex';
        spinBtn.disabled = false;
    }
    
    // Remove winning highlights
    document.querySelectorAll('.symbol').forEach(s => s.classList.remove('winning-symbol'));
    
    updateUI();
}

// --- MISSION SYSTEM ---
function startMission() {
    playSound('click');
    resetMissionState();
    
    // Random character
    const chars = Object.keys(CHARACTERS);
    currentCharacter = chars[Math.floor(Math.random() * chars.length)];
    const char = CHARACTERS[currentCharacter];
    
    // Update character display - NO IMAGE, just name
    document.getElementById('character-name').textContent = char.name;
    document.getElementById('character-portrait').innerHTML = char.emoji;
    document.getElementById('character-portrait').style.background = `linear-gradient(135deg, ${char.color}, #000)`;
    
    // Random message
    const randomMessage = char.messages[Math.floor(Math.random() * char.messages.length)];
    document.getElementById('character-message').textContent = `"${randomMessage}"`;
    
    // Random starting gold
    const startOptions = [15, 20, 25, 30];
    coins = startOptions[Math.floor(Math.random() * startOptions.length)];
    collectedGold = 0;
    
    // Random goal
    const goalOptions = [30, 40, 50, 60, 70];
    currentGoal = goalOptions[Math.floor(Math.random() * goalOptions.length)];
    
    // Update briefing
    document.getElementById('character-goal').textContent = `Collect ${currentGoal} more gold`;
    document.getElementById('starting-gold').textContent = `${coins} gold available`;
    
    // Show briefing
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('mission-complete-panel').classList.add('hidden');
    document.getElementById('mission-failed-panel').classList.add('hidden');
    document.getElementById('mission-briefing').classList.remove('hidden');
    
    updateUI();
}

function startGame() {
    playSound('mission-start');
    missionStarted = true;
    document.getElementById('mission-briefing').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    
    updateStats();
    updateMissionProgress();
    initMachine();
}

function showInstructions() {
    playSound('click');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('info-screen').classList.remove('hidden');
}

function goToMainMenu() {
    playSound('click');
    resetMissionState();
    
    const currentScreen = document.querySelector('.screen:not(.hidden)');
    if (currentScreen) currentScreen.classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    updateRankDisplay();
    updateRankProgress();
    saveGame();
}

function returnToBase() {
    playSound('click');
    
    if (!missionStarted) {
        goToMainMenu();
        return;
    }
    
    // Calculate points lost
    const pointsLost = Math.min(15, Math.max(5, Math.floor(collectedGold / 5)));
    const oldPoints = points;
    points = Math.max(0, points - pointsLost);
    totalPoints = Math.max(0, totalPoints - pointsLost);
    
    updateRank();
    updateRankProgress();
    saveGame();
    
    // Show mission failed panel
    const char = CHARACTERS[currentCharacter];
    const randomFailure = char.failureMessages[Math.floor(Math.random() * char.failureMessages.length)];
    
    document.getElementById('mission-failed-title').textContent = "MISSION ABANDONED";
    document.getElementById('mission-failed-message').textContent = 
        `${char.emoji} ${char.name}: "${randomFailure}"`;
    document.getElementById('mission-failed-details').textContent = 
        `Collected: ${collectedGold} gold | Needed: ${currentGoal} gold`;
    
    const rankChangeElement = document.getElementById('failed-rank-change');
    rankChangeElement.textContent = `-${pointsLost} POINTS`;
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-failed-panel').classList.remove('hidden');
    
    playSound('mission-fail');
}

function completeMission() {
    if (!missionStarted || collectedGold < currentGoal) return;
    
    missionStarted = false;
    
    // Calculate points earned
    const pointsEarned = Math.min(25, Math.max(10, Math.floor(currentGoal / 3)));
    const oldPoints = points;
    points += pointsEarned;
    totalPoints += pointsEarned;
    
    updateRank();
    updateRankProgress();
    saveGame();
    
    // Show mission complete panel
    const char = CHARACTERS[currentCharacter];
    const randomSuccess = char.successMessages[Math.floor(Math.random() * char.successMessages.length)];
    
    document.getElementById('mission-complete-title').textContent = "MISSION COMPLETE";
    document.getElementById('mission-character-message').textContent = 
        `${char.emoji} ${char.name}: "${randomSuccess}"`;
    document.getElementById('mission-complete-message').textContent = 
        `Collected: ${collectedGold} gold | Goal: ${currentGoal} gold`;
    document.getElementById('mission-reward').textContent = `+${pointsEarned} POINTS`;
    
    const rankChangeContainer = document.getElementById('rank-change-container');
    const rankChangeTitle = document.getElementById('rank-change-title');
    const rankChange = document.getElementById('rank-change');
    
    if (currentRank > oldRank) {
        rankChangeTitle.textContent = "RANK UP ACHIEVED!";
        rankChange.textContent = `${RANKS[oldRank].name} → ${RANKS[currentRank].name}`;
        rankChangeContainer.style.display = 'flex';
        playSound('rank-up');
    } else {
        rankChangeContainer.style.display = 'none';
    }
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-complete-panel').classList.remove('hidden');
    
    playSound('mission-complete');
}

// --- UI FUNCTIONS ---
function updateStats() {
    // Update two-line stats display
    const goldElement = document.getElementById('stats-gold');
    const goalElement = document.getElementById('stats-goal');
    const collectedElement = document.getElementById('stats-collected');
    
    if (goldElement) goldElement.textContent = coins;
    if (goalElement) goalElement.textContent = currentGoal;
    if (collectedElement) collectedElement.textContent = collectedGold;
}

function updateMissionProgress() {
    const progressFill = document.getElementById('mission-progress');
    const progressText = document.getElementById('mission-progress-text');
    const progress = Math.min(100, (collectedGold / currentGoal) * 100);
    
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
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
        grid[i].forEach(id => strip.appendChild(createSymbol(id)));
    }
    updateUI();
}

function createSymbol(id) {
    const d = document.createElement('div');
    d.className = 'symbol';
    d.setAttribute('data-value', id);
    
    // Try to load image first
    const img = document.createElement('img');
    img.className = 'symbol-img';
    img.src = `images/${id}.png`;
    img.alt = SYMBOL_NAMES[id - 1] || 'Symbol';
    
    // Create emoji fallback
    const emoji = document.createElement('div');
    emoji.className = 'symbol-emoji';
    emoji.textContent = EMOJIS[id - 1] || '❓';
    
    // Handle image load error
    img.onerror = function() {
        this.style.display = 'none';
        emoji.style.display = 'block';
    };
    
    img.onload = function() {
        this.style.display = 'block';
        emoji.style.display = 'none';
    };
    
    d.appendChild(img);
    d.appendChild(emoji);
    return d;
}

// --- SPIN SYSTEM ---
function startSpin() {
    if (coins < 5 || busy || !missionStarted) return;
    
    busy = true;
    
    // Hide spin button immediately
    const spinBtn = document.getElementById('spin-btn');
    spinBtn.style.display = 'none';
    
    // Hide result panel if visible
    const resultPanel = document.getElementById('result-panel');
    resultPanel.classList.add('hidden');
    resultPanel.style.display = 'none';
    
    // Reset UI
    document.querySelectorAll('.symbol').forEach(s => s.classList.remove('winning-symbol'));
    
    // Deduct spin cost
    coins -= 5;
    updateUI();
    playSound('spin');
    
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
    
    playSound('click');
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
    grid[i].forEach(id => strip.appendChild(createSymbol(id)));
    
    // Check if all reels stopped
    if (!isSpinning.includes(true)) {
        setTimeout(() => {
            checkResult();
        }, 300);
    }
}

// --- WIN DETECTION (ALL POSSIBLE MATCHES) ---
function checkResult() {
    let lines = [];
    const g = grid;
    
    // Check ALL horizontal lines (3 rows)
    for (let row = 0; row < 3; row++) {
        if (g[0][row] === g[1][row] && g[1][row] === g[2][row]) {
            lines.push({type: 'h', row: row, symbol: g[0][row]});
        }
    }
    
    // Check ALL vertical lines (3 columns)
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
        }
    }
}

function finalize(lines) {
    const panel = document.getElementById('result-panel');
    const type = document.getElementById('res-type');
    const cash = document.getElementById('res-coins');
    const effect = document.getElementById('result-effect');
    
    // Show result panel OVER the spin button
    panel.style.display = 'flex';
    panel.classList.remove('hidden');
    
    if (lines.length > 0) {
        let totalGold = 0;
        let winType = 'normal';
        
        // Calculate rewards
        lines.forEach(line => {
            let goldReward = 0;
            
            switch(line.symbol) {
                case 1: goldReward = 30; break; // Ninja
                case 2: goldReward = 25; break; // Sword
                case 3: goldReward = 20; break; // Oni
                case 4: goldReward = 10; break; // Lantern
                case 5: goldReward = 15; break; // Scroll
                case 6: goldReward = 35; break; // Castle
                default: goldReward = 10;
            }
            
            totalGold += goldReward;
            highlightLine(line);
        });
        
        // Multi-line bonus
        if (lines.length > 1) {
            type.textContent = "ULTRA WIN!";
            totalGold = Math.floor(totalGold * 1.5);
            winType = 'ultra';
            playSound('big-win');
        } else {
            type.textContent = "VICTORY!";
            winType = 'normal';
            playSound('win');
        }
        
        // Round gold to nearest 5
        const finalGold = Math.round(totalGold / 5) * 5;
        lastWinAmount = finalGold;
        cash.textContent = `+${finalGold} GOLD`;
        
        // Set effect text
        if (winType === 'ultra') {
            effect.textContent = "Multi-line Bonus!";
            effect.style.color = '#ffcc00';
        } else {
            effect.textContent = "Great Success!";
            effect.style.color = '#00cc66';
        }
        
        // Add gold
        coins += finalGold;
        collectedGold += finalGold;
        
        updateUI();
        updateStats();
        updateMissionProgress();
        
        // Check if goal reached
        if (collectedGold >= currentGoal) {
            setTimeout(() => {
                completeMission();
            }, 2000);
            return;
        }
        
    } else {
        type.textContent = "MISSED";
        cash.textContent = "0 GOLD";
        effect.textContent = "Better luck next time!";
        effect.style.color = '#ff6666';
        
        playSound('lose');
        
        // Check if out of coins
        if (coins < 5) {
            setTimeout(() => {
                missionFailed();
            }, 2000);
            return;
        }
    }
    
    // Hide result panel after 2 seconds and show spin button
    setTimeout(() => {
        panel.classList.add('hidden');
        panel.style.display = 'none';
        
        // Reset busy state and show spin button
        busy = false;
        const spinBtn = document.getElementById('spin-btn');
        if (coins >= 5 && missionStarted) {
            spinBtn.style.display = 'flex';
            spinBtn.disabled = false; // IMPORTANT: Make sure button is clickable
        }
        updateUI(); // Update button state
    }, 2000);
}

function missionFailed() {
    // Calculate points lost
    const pointsLost = Math.min(20, Math.max(10, Math.floor(currentGoal / 5)));
    const oldPoints = points;
    points = Math.max(0, points - pointsLost);
    totalPoints = Math.max(0, totalPoints - pointsLost);
    
    updateRank();
    updateRankProgress();
    saveGame();
    
    // Show mission failed panel
    const char = CHARACTERS[currentCharacter];
    const randomFailure = char.failureMessages[Math.floor(Math.random() * char.failureMessages.length)];
    
    document.getElementById('mission-failed-title').textContent = "MISSION FAILED";
    document.getElementById('mission-failed-message').textContent = 
        `${char.emoji} ${char.name}: "${randomFailure}"`;
    document.getElementById('mission-failed-details').textContent = 
        `Collected: ${collectedGold} gold | Needed: ${currentGoal} gold`;
    
    const rankChangeElement = document.getElementById('failed-rank-change');
    rankChangeElement.textContent = `-${pointsLost} POINTS`;
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-failed-panel').classList.remove('hidden');
    
    playSound('mission-fail');
}

// --- UI UPDATES ---
function updateUI() {
    // Update stats
    updateStats();
    
    // Update spin button state
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        if (coins < 5 || !missionStarted || busy) {
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
    loadGame();
    updateRankDisplay();
    updateRankProgress();
    
    soundEnabled = true;
    initAudio();
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'h' || e.key === 'H') {
            showQuickGuide();
        }
    });
    
    setInterval(saveGame, 30000);
    showMessage('Welcome to TENCHU: Shadow Mission!', 'info', 2000);
};

// --- QUICK GUIDE ---
function showQuickGuide() {
    const guide = document.getElementById('quick-guide');
    if (guide) {
        guide.classList.remove('hidden');
        playSound('click');
    }
}

function hideQuickGuide() {
    const guide = document.getElementById('quick-guide');
    if (guide) {
        guide.classList.add('hidden');
        playSound('click');
    }
}

// --- KEYBOARD CONTROLS ---
document.addEventListener('keydown', function(e) {
    const gameView = document.getElementById('game-view');
    if (!gameView || gameView.classList.contains('hidden') || !missionStarted) return;
    
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
        case 'h':
        case 'H':
            showQuickGuide();
            break;
    }
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('selectstart', function(e) {
    e.preventDefault();
});