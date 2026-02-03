// ============================================
// TENCHU: SHADOW MISSION - MODERN ENHANCED VERSION
// ============================================

// --- MODERN CONFIGURATION ---
const SYMBOLS = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
const SYMBOL_NAMES = ['Ninja', 'Sword', 'Lantern', 'Oni', 'Scroll', 'Castle'];

// Enhanced Character database with images
const CHARACTERS = {
    rikimaru: {
        name: "RIKIMARU",
        emoji: "🥷",
        color: "#3366cc",
        messages: [
            "The Azure Dragon needs your help.",
            "Lord Gohda requires your service.",
            "Azuma village is counting on you."
        ],
        successMessages: [
            "Excellent work. The Azure Dragon is pleased.",
            "Your service honors Lord Gohda.",
            "Azuma village will remember your contribution."
        ],
        failureMessages: [
            "You have dishonored the Azure Dragon.",
            "Lord Gohda will hear of this failure.",
            "Azuma village suffers because of you."
        ]
    },
    ayame: {
        name: "AYAME",
        emoji: "⚔️",
        color: "#cc3366",
        messages: [
            "The Crimson Lily needs assistance.",
            "Our sisters require your aid.",
            "Help us gather what we need."
        ],
        successMessages: [
            "The Crimson Lily thanks you for your service.",
            "Our sisters are grateful for your help.",
            "You have served the kunoichi well."
        ],
        failureMessages: [
            "You have failed the Crimson Lily.",
            "Our sisters are disappointed.",
            "You bring shame to our order."
        ]
    },
    tatsumaru: {
        name: "TATSUMARU",
        emoji: "👺",
        color: "#33cc66",
        messages: [
            "The Green Viper seeks your help.",
            "Join our cause, shinobi.",
            "We need resources for the rebellion."
        ],
        successMessages: [
            "The Green Viper is pleased with your work.",
            "You serve the rebellion well.",
            "Your contribution will be remembered."
        ],
        failureMessages: [
            "You have failed the Green Viper.",
            "The rebellion suffers because of you.",
            "You are not worthy of our cause."
        ]
    }
};

// Enhanced Ranking System with levels
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

// --- UTILITY FUNCTIONS ---
function showEnhancedMessage(text, type = 'info', duration = 3000) {
    const toast = document.getElementById('message-toast');
    toast.textContent = text;
    toast.className = '';
    
    // Set styles based on type
    switch(type) {
        case 'success':
            toast.style.color = '#00cc66';
            toast.style.borderColor = '#00cc66';
            toast.style.boxShadow = '0 0 30px rgba(0, 204, 102, 0.5)';
            break;
        case 'warning':
            toast.style.color = '#ff9900';
            toast.style.borderColor = '#ff9900';
            toast.style.boxShadow = '0 0 30px rgba(255, 153, 0, 0.5)';
            break;
        case 'error':
            toast.style.color = '#ff3333';
            toast.style.borderColor = '#ff3333';
            toast.style.boxShadow = '0 0 30px rgba(255, 51, 51, 0.5)';
            break;
        default:
            toast.style.color = '#ffcc00';
            toast.style.borderColor = '#ff3300';
            toast.style.boxShadow = '0 0 30px rgba(255, 51, 0, 0.5)';
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// --- ENHANCED SOUND SYSTEM ---
function playEnhancedSound(id) {
    if (!soundEnabled) return;
    
    try {
        const audio = new Audio(`sounds/${id}.mp3`);
        audio.volume = 0.5;
        audio.play().catch(() => {
            playBeep(id);
        });
    } catch(e) {
        playBeep(id);
    }
}

function playBeep(id) {
    try {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        let frequency = 800;
        let duration = 0.1;
        
        if (id === 'win') {
            frequency = 523.25;
            duration = 0.3;
        } else if (id === 'lose') {
            frequency = 392;
            duration = 0.3;
        } else if (id === 'spin') {
            frequency = 400;
            duration = 0.2;
        } else if (id === 'mission-start') {
            frequency = 659.25; // E5
            duration = 0.5;
        } else if (id === 'mission-complete') {
            frequency = 880; // A5
            duration = 0.8;
        } else if (id === 'mission-fail') {
            frequency = 293.66; // D4
            duration = 0.6;
        } else if (id === 'rank-up') {
            frequency = 1046.50; // C6
            duration = 1.0;
        }
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch(e) {}
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('sound-icon');
    const globalIcon = document.getElementById('global-sound-icon');
    
    if (soundEnabled) {
        if (icon) icon.className = 'fas fa-volume-up';
        if (globalIcon) globalIcon.className = 'fas fa-volume-up';
        playEnhancedSound('click');
    } else {
        if (icon) icon.className = 'fas fa-volume-mute';
        if (globalIcon) globalIcon.className = 'fas fa-volume-mute';
    }
    
    showEnhancedMessage(`Sound ${soundEnabled ? 'Enabled' : 'Disabled'}`, 'info', 1500);
}

// --- SAVE/LOAD SYSTEM ---
function saveGame() {
    const gameData = {
        points: points,
        totalPoints: totalPoints,
        timestamp: Date.now()
    };
    
    localStorage.setItem('tenchu_modern_save', JSON.stringify(gameData));
    updateRankDisplay();
}

function loadGame() {
    const saved = localStorage.getItem('tenchu_modern_save');
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
    
    // Show rank change message
    if (oldRank !== currentRank) {
        if (currentRank > oldRank) {
            showEnhancedMessage(`RANK UP! ${RANKS[oldRank].name} → ${RANKS[currentRank].name}`, 'success');
            playEnhancedSound('rank-up');
        } else if (currentRank < oldRank) {
            showEnhancedMessage(`RANK DOWN! ${RANKS[oldRank].name} → ${RANKS[currentRank].name}`, 'error');
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
    
    if (progressFill) {
        progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    
    if (rankLevel) {
        rankLevel.textContent = RANKS[currentRank].level;
    }
    
    if (nextPoints) {
        nextPoints.textContent = nextRankPoints;
    }
}

// --- RESET GAME STATE FOR NEW MISSION ---
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
    if (resultPanel) resultPanel.classList.add('hidden');
    
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) spinBtn.classList.remove('hidden-btn');
    
    // Remove winning highlights
    document.querySelectorAll('.symbol').forEach(s => s.classList.remove('winning-symbol'));
    
    updateUI();
}

// --- MISSION SYSTEM ---
function startMission() {
    playEnhancedSound('click');
    
    // Reset game state completely for new mission
    resetMissionState();
    
    // Random character
    const chars = Object.keys(CHARACTERS);
    currentCharacter = chars[Math.floor(Math.random() * chars.length)];
    const char = CHARACTERS[currentCharacter];
    
    // Update character display
    document.getElementById('character-name').textContent = char.name;
    document.getElementById('character-portrait').textContent = char.emoji;
    document.getElementById('character-portrait').style.background = `linear-gradient(135deg, ${char.color}, #000)`;
    
    // Random message
    const randomMessage = char.messages[Math.floor(Math.random() * char.messages.length)];
    document.getElementById('character-message').textContent = `"${randomMessage}"`;
    
    // Random starting gold (15, 20, 25, or 30 only)
    const startOptions = [15, 20, 25, 30];
    coins = startOptions[Math.floor(Math.random() * startOptions.length)];
    collectedGold = 0;
    
    // Random goal for collected gold (30, 40, 50, 60, or 70 only)
    const goalOptions = [30, 40, 50, 60, 70];
    currentGoal = goalOptions[Math.floor(Math.random() * goalOptions.length)];
    
    // Update briefing displays
    document.getElementById('character-goal').textContent = `Collect ${currentGoal} more gold`;
    document.getElementById('starting-gold').textContent = `${coins} gold available`;
    
    // Show briefing
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('mission-complete-panel').classList.add('hidden');
    document.getElementById('mission-failed-panel').classList.add('hidden');
    document.getElementById('mission-briefing').classList.remove('hidden');
    
    // Update UI
    updateUI();
}

function startGame() {
    playEnhancedSound('mission-start');
    missionStarted = true;
    document.getElementById('mission-briefing').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    
    updateMissionIndicator();
    updateMissionProgress();
    updateCollectedGoldDisplay();
    initMachine();
}

function showInstructions() {
    playEnhancedSound('click');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('info-screen').classList.remove('hidden');
}

function goToMainMenu() {
    playEnhancedSound('click');
    
    // Reset mission state when returning to menu
    resetMissionState();
    
    const currentScreen = document.querySelector('.screen:not(.hidden)');
    if (currentScreen) {
        currentScreen.classList.add('hidden');
    }
    document.getElementById('main-menu').classList.remove('hidden');
    updateRankDisplay();
    updateRankProgress();
    saveGame();
}

function returnToBase() {
    playEnhancedSound('click');
    
    if (!missionStarted) {
        goToMainMenu();
        return;
    }
    
    // Calculate points lost for quitting (5-15 points based on gold collected)
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
        `Collected: ${collectedGold} gold | Needed: ${currentGoal} gold | Total: ${coins} gold`;
    
    const rankChangeElement = document.getElementById('failed-rank-change');
    rankChangeElement.textContent = `-${pointsLost} POINTS`;
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-failed-panel').classList.remove('hidden');
    
    playEnhancedSound('mission-fail');
}

function donate() {
    playEnhancedSound('click');
    window.open('https://ko-fi.com', '_blank');
}

function completeMission() {
    if (!missionStarted || collectedGold < currentGoal) return;
    
    missionStarted = false;
    
    // Calculate points earned (10-25 points based on goal)
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
        `Collected: ${collectedGold} gold | Goal: ${currentGoal} gold | Total: ${coins} gold`;
    document.getElementById('mission-reward').textContent = `+${pointsEarned} POINTS`;
    
    const rankChangeContainer = document.getElementById('rank-change-container');
    const rankChangeTitle = document.getElementById('rank-change-title');
    const rankChange = document.getElementById('rank-change');
    
    if (currentRank > oldRank) {
        rankChangeTitle.textContent = "RANK UP ACHIEVED!";
        rankChange.textContent = `${RANKS[oldRank].name} → ${RANKS[currentRank].name}`;
        rankChangeContainer.style.display = 'flex';
        playEnhancedSound('rank-up');
    } else {
        rankChangeContainer.style.display = 'none';
    }
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-complete-panel').classList.remove('hidden');
    
    playEnhancedSound('mission-complete');
}

// --- ENHANCED UI FUNCTIONS ---
function updateMissionProgress() {
    const progressFill = document.getElementById('mission-progress');
    const progressText = document.getElementById('mission-progress-text');
    const progress = Math.min(100, (collectedGold / currentGoal) * 100);
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${Math.round(progress)}%`;
    }
}

function updateCollectedGoldDisplay() {
    const collectedElement = document.getElementById('collected-gold');
    if (collectedElement) {
        collectedElement.textContent = collectedGold;
        
        // Add bounce animation
        collectedElement.classList.add('coin-bounce');
        setTimeout(() => {
            collectedElement.classList.remove('coin-bounce');
        }, 500);
    }
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

function updateMissionIndicator() {
    const indicator = document.getElementById('mission-indicator');
    if (currentCharacter && currentGoal > 0) {
        indicator.textContent = `${CHARACTERS[currentCharacter].name}: ${collectedGold}/${currentGoal} GOLD`;
    } else if (currentCharacter) {
        indicator.textContent = `${CHARACTERS[currentCharacter].name}`;
    }
}

// --- SPIN SYSTEM ---
function startSpin() {
    if (coins < 5 || busy || !missionStarted) return;
    busy = true;
    
    // Reset UI
    document.getElementById('spin-btn').classList.add('hidden-btn');
    document.getElementById('result-panel').classList.add('hidden');
    document.querySelectorAll('.symbol').forEach(s => s.classList.remove('winning-symbol'));
    
    // Deduct spin cost from coins
    coins -= 5;
    updateUI();
    playEnhancedSound('spin');
    
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
    
    playEnhancedSound('click');
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

// --- ENHANCED WIN DETECTION ---
function checkResult() {
    let lines = [];
    const g = grid;
    
    // Horizontal lines (middle row is payline)
    if (g[0][1] === g[1][1] && g[1][1] === g[2][1]) {
        lines.push({type: 'h', row: 1, symbol: g[0][1]});
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
            createEnhancedParticles(5, target, '#ff0033');
        }
    }
}

function finalize(lines) {
    const panel = document.getElementById('result-panel');
    const type = document.getElementById('res-type');
    const cash = document.getElementById('res-coins');
    const effect = document.getElementById('result-effect');
    
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
            playEnhancedSound('big-win');
        } else {
            type.textContent = "VICTORY!";
            winType = 'normal';
            playEnhancedSound('win');
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
        updateMissionIndicator();
        updateMissionProgress();
        updateCollectedGoldDisplay();
        
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
        
        playEnhancedSound('lose');
        
        // Check if out of coins
        if (coins < 5) {
            setTimeout(() => {
                missionFailed();
            }, 2000);
            return;
        }
    }
    
    // Reset for next spin
    setTimeout(() => {
        busy = false;
        if (coins >= 5 && missionStarted) {
            document.getElementById('spin-btn').classList.remove('hidden-btn');
        }
    }, 2500);
}

function missionFailed() {
    // Calculate points lost for failure (10-20 points)
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
        `Collected: ${collectedGold} gold | Needed: ${currentGoal} gold | Total: ${coins} gold`;
    
    const rankChangeElement = document.getElementById('failed-rank-change');
    rankChangeElement.textContent = `-${pointsLost} POINTS`;
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-failed-panel').classList.remove('hidden');
    
    playEnhancedSound('mission-fail');
}

// --- ENHANCED PARTICLE SYSTEM ---
function createEnhancedParticles(count, element, color = '#ff0033') {
    const particles = document.querySelector('.floating-particles');
    if (!particles) return;
    
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = (rect.left + rect.width/2) + 'px';
        particle.style.top = (rect.top + rect.height/2) + 'px';
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 10px ${color}`;
        
        particles.appendChild(particle);
        
        // Enhanced particle animation
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const size = 3 + Math.random() * 4;
        const duration = 0.5 + Math.random() * 0.5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.animate([
            { 
                transform: 'translate(0,0) scale(1) rotate(0deg)', 
                opacity: 1 
            },
            { 
                transform: `translate(${Math.cos(angle) * speed * 100}px, ${Math.sin(angle) * speed * 100}px) scale(0) rotate(${360}deg)`, 
                opacity: 0 
            }
        ], {
            duration: duration * 1000,
            easing: 'cubic-bezier(0.2, 0, 0.8, 1)'
        }).onfinish = () => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        };
    }
}

// --- UI UPDATES ---
function updateUI() {
    // Update displays
    document.getElementById('coins').textContent = coins;
    
    // Add bounce animation to coins if they changed
    const coinsElement = document.getElementById('coins');
    coinsElement.classList.add('coin-bounce');
    setTimeout(() => {
        coinsElement.classList.remove('coin-bounce');
    }, 500);
    
    // Update spin button state
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        if (coins < 5 || !missionStarted) {
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
    updateRankProgress();
    
    // Initialize audio
    soundEnabled = true;
    
    // Add keyboard help
    document.addEventListener('keydown', function(e) {
        if (e.key === 'h' || e.key === 'H') {
            showQuickGuide();
        }
    });
    
    // Auto-save every 30 seconds
    setInterval(saveGame, 30000);
    
    showEnhancedMessage('Welcome to TENCHU: Shadow Mission!', 'info', 2000);
};

// --- QUICK GUIDE ---
function showQuickGuide() {
    const guide = document.getElementById('quick-guide');
    if (guide) {
        guide.classList.remove('hidden');
        playEnhancedSound('click');
    }
}

function hideQuickGuide() {
    const guide = document.getElementById('quick-guide');
    if (guide) {
        guide.classList.add('hidden');
        playEnhancedSound('click');
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

// Prevent right-click
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Prevent text selection
document.addEventListener('selectstart', function(e) {
    e.preventDefault();
});