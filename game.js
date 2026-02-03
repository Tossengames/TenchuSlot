// ============================================
// TENCHU: SHADOW MISSION - FIXED VERSION
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
        name: "Ayame",
        emoji: "⚔️",
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
        name: "Tatsumaru",
        emoji: "👺",
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

// Ranking System - Points based
const RANKS = [
    { name: "INITIATE", minPoints: 0, color: "#666666" },
    { name: "SHINOBI", minPoints: 50, color: "#3366cc" },
    { name: "ASSASSIN", minPoints: 150, color: "#cc3366" },
    { name: "SHADOW MASTER", minPoints: 300, color: "#9933cc" },
    { name: "GRAND MASTER", minPoints: 500, color: "#ffcc00" }
];

// --- GAME STATE ---
let coins = 0;                // Current total gold
let collectedGold = 0;        // Gold collected during this mission (wins only)
let points = 0;
let totalPoints = 0;
let currentRank = 0;
let oldRank = 0;
let currentCharacter = null;
let currentGoal = 0;          // Goal for collected gold (not total gold)
let missionStarted = false;
let isSpinning = [false, false, false];
let grid = [[], [], []];
let busy = false;

// --- UTILITY FUNCTIONS ---
function showMessage(text, type = 'info') {
    const toast = document.getElementById('message-toast');
    toast.textContent = text;
    toast.className = '';
    
    if (type === 'success') {
        toast.style.color = '#33cc33';
        toast.style.borderColor = '#33cc33';
    } else if (type === 'warning') {
        toast.style.color = '#ffcc00';
        toast.style.borderColor = '#ffcc00';
    } else if (type === 'error') {
        toast.style.color = '#ff3333';
        toast.style.borderColor = '#ff3333';
    } else {
        toast.style.color = '#ffcc00';
        toast.style.borderColor = '#ff3300';
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// --- SOUND SYSTEM ---
function playSound(id) {
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
        }
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch(e) {}
}

// --- SAVE/LOAD SYSTEM ---
function saveGame() {
    const gameData = {
        points: points,
        totalPoints: totalPoints,
        timestamp: Date.now()
    };
    
    localStorage.setItem('tenchu_final_save', JSON.stringify(gameData));
    updateRankDisplay();
}

function loadGame() {
    const saved = localStorage.getItem('tenchu_final_save');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            points = data.points || 0;
            totalPoints = data.totalPoints || 0;
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
    points = 0;
    totalPoints = 0;
    updateRank();
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
            showMessage(`RANK UP! ${RANKS[oldRank].name} → ${RANKS[currentRank].name}`, 'success');
        } else if (currentRank < oldRank) {
            showMessage(`RANK DOWN! ${RANKS[oldRank].name} → ${RANKS[currentRank].name}`, 'error');
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
    playSound('click');
    
    // Reset game state completely for new mission
    resetMissionState();
    
    // Random character
    const chars = Object.keys(CHARACTERS);
    currentCharacter = chars[Math.floor(Math.random() * chars.length)];
    const char = CHARACTERS[currentCharacter];
    
    // Random message
    const randomMessage = char.messages[Math.floor(Math.random() * char.messages.length)];
    
    // Random starting gold (15, 20, 25, or 30 only)
    const startOptions = [15, 20, 25, 30];
    coins = startOptions[Math.floor(Math.random() * startOptions.length)];
    collectedGold = 0; // Start with 0 collected gold
    
    // Random goal for collected gold (30, 40, 50, 60, or 70 only)
    const goalOptions = [30, 40, 50, 60, 70];
    currentGoal = goalOptions[Math.floor(Math.random() * goalOptions.length)];
    
    // Update briefing - Show starting gold but goal is for collected gold
    document.getElementById('character-message').textContent = 
        `${char.emoji} ${char.name}: "${randomMessage}"`;
    document.getElementById('character-goal').textContent = 
        `Goal: Collect ${currentGoal} more gold (You have ${coins} gold to start)`;
    
    // Show briefing
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('mission-complete-panel').classList.add('hidden');
    document.getElementById('mission-failed-panel').classList.add('hidden');
    document.getElementById('mission-briefing').classList.remove('hidden');
    
    // Update UI
    updateUI();
    updateMissionIndicator();
}

function startGame() {
    playSound('click');
    missionStarted = true;
    document.getElementById('mission-briefing').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    
    updateMissionIndicator();
    initMachine();
}

function showInstructions() {
    playSound('click');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('info-screen').classList.remove('hidden');
}

function goToMainMenu() {
    playSound('click');
    
    // Reset mission state when returning to menu
    resetMissionState();
    
    const currentScreen = document.querySelector('.screen:not(.hidden)');
    if (currentScreen) {
        currentScreen.classList.add('hidden');
    }
    document.getElementById('main-menu').classList.remove('hidden');
    updateRankDisplay();
    saveGame();
}

function returnToBase() {
    playSound('click');
    
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
    saveGame();
    
    // Show mission failed panel
    const char = CHARACTERS[currentCharacter];
    const randomFailure = char.failureMessages[Math.floor(Math.random() * char.failureMessages.length)];
    
    document.getElementById('mission-failed-title').textContent = "MISSION ABANDONED";
    document.getElementById('mission-failed-message').textContent = 
        `${char.emoji} ${char.name}: "${randomFailure}"`;
    document.getElementById('mission-failed-details').textContent = 
        `You left with ${coins} total gold (collected ${collectedGold} gold, needed ${currentGoal}).`;
    
    const rankChangeElement = document.getElementById('failed-rank-change');
    rankChangeElement.textContent = `-${pointsLost} POINTS`;
    rankChangeElement.className = 'rank-change down';
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-failed-panel').classList.remove('hidden');
}

function donate() {
    playSound('click');
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
    saveGame();
    
    // Show mission complete panel
    const char = CHARACTERS[currentCharacter];
    const randomSuccess = char.successMessages[Math.floor(Math.random() * char.successMessages.length)];
    
    document.getElementById('mission-complete-title').textContent = "MISSION COMPLETE";
    document.getElementById('mission-character-message').textContent = 
        `${char.emoji} ${char.name}: "${randomSuccess}"`;
    document.getElementById('mission-complete-message').textContent = 
        `You collected ${collectedGold} gold (goal was ${currentGoal}). Total gold: ${coins}`;
    document.getElementById('mission-reward').textContent = `+${pointsEarned} POINTS`;
    
    const rankChangeElement = document.getElementById('rank-change');
    if (currentRank > oldRank) {
        rankChangeElement.textContent = `RANK UP: ${RANKS[oldRank].name} → ${RANKS[currentRank].name}`;
        rankChangeElement.className = 'rank-change';
    } else {
        rankChangeElement.textContent = '';
    }
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-complete-panel').classList.remove('hidden');
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
        let totalGold = 0;
        
        // Calculate rewards - ROUNDED TO MULTIPLES OF 5
        lines.forEach(line => {
            let goldReward = 0;
            
            // Character symbols (1, 2, 3) give more
            switch(line.symbol) {
                case 1: // Ninja (character)
                    goldReward = 30;
                    break;
                case 2: // Sword (character)
                    goldReward = 25;
                    break;
                case 3: // Oni (character)
                    goldReward = 20;
                    break;
                case 4: // Lantern (item)
                    goldReward = 10;
                    break;
                case 5: // Scroll (item)
                    goldReward = 15;
                    break;
                case 6: // Castle (special)
                    goldReward = 35;
                    break;
                default:
                    goldReward = 10;
            }
            totalGold += goldReward;
            highlightLine(line);
        });
        
        // Multi-line bonus
        if (lines.length > 1) {
            type.textContent = "BIG WIN!";
            totalGold = Math.floor(totalGold * 1.3);
        } else {
            type.textContent = "WIN!";
        }
        
        // Round gold to nearest 5
        const finalGold = Math.round(totalGold / 5) * 5;
        cash.textContent = `+${finalGold} GOLD`;
        
        // Add to both coins (for playing) and collectedGold (for goal)
        coins += finalGold;
        collectedGold += finalGold;
        
        updateUI();
        updateMissionIndicator();
        
        playSound('win');
        
        // Check if goal reached (based on collectedGold only)
        if (collectedGold >= currentGoal) {
            setTimeout(() => {
                completeMission();
            }, 1500);
            return;
        }
        
    } else {
        type.textContent = "FAILED";
        cash.textContent = "No matches";
        
        playSound('lose');
        
        // Check if out of coins
        if (coins < 5) {
            setTimeout(() => {
                // Calculate points lost for failure (10-20 points)
                const pointsLost = Math.min(20, Math.max(10, Math.floor(currentGoal / 5)));
                const oldPoints = points;
                points = Math.max(0, points - pointsLost);
                totalPoints = Math.max(0, totalPoints - pointsLost);
                
                updateRank();
                saveGame();
                
                // Show mission failed panel
                const char = CHARACTERS[currentCharacter];
                const randomFailure = char.failureMessages[Math.floor(Math.random() * char.failureMessages.length)];
                
                document.getElementById('mission-failed-title').textContent = "MISSION FAILED";
                document.getElementById('mission-failed-message').textContent = 
                    `${char.emoji} ${char.name}: "${randomFailure}"`;
                document.getElementById('mission-failed-details').textContent = 
                    `You ran out of gold! Collected ${collectedGold} gold (needed ${currentGoal}). Total: ${coins} gold`;
                
                const rankChangeElement = document.getElementById('failed-rank-change');
                rankChangeElement.textContent = `-${pointsLost} POINTS`;
                rankChangeElement.className = 'rank-change down';
                
                document.getElementById('game-view').classList.add('hidden');
                document.getElementById('mission-failed-panel').classList.remove('hidden');
            }, 1500);
            return;
        }
    }
    
    // Reset for next spin
    setTimeout(() => {
        busy = false;
        if (coins >= 5 && missionStarted) {
            document.getElementById('spin-btn').classList.remove('hidden-btn');
        }
    }, 2000);
}

// --- ANIMATIONS ---
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
    
    // Reset mission state on load
    resetMissionState();
    
    // Auto-save every minute
    setInterval(saveGame, 60000);
};

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