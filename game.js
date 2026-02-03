// ============================================
// TENCHU: SHADOW MISSION - COMPLETE GAME SCRIPT
// ============================================

// --- GAME CONFIGURATION ---
const SYMBOLS = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
const SYMBOL_NAMES = ['Rikimaru', 'Kodachi', 'Lantern', 'Oni Guard', 'Secret Scroll', 'Castle Lord'];

// Character Missions Database
const MISSIONS = {
    rikimaru: {
        name: "Rikimaru",
        color: "#3366cc",
        emoji: "🥷",
        quote: "The Azure Dragon seeks justice in the shadows of Lord Mei-Oh's tyranny.",
        objectives: [
            { target: 100, text: "Gather 100 gold to fund Lord Gohda's resistance against the corrupt shogunate.", reward: 30 },
            { target: 200, text: "Secure 200 gold to purchase intelligence on Lord Mei-Oh's hidden fortress.", reward: 50 },
            { target: 300, text: "Amass 300 gold to rebuild Azuma village and shelter the displaced villagers.", reward: 80 }
        ]
    },
    ayame: {
        name: "Ayame",
        color: "#cc3366",
        emoji: "⚔️",
        quote: "The Crimson Lily blooms where shadows fall, seeking vengeance for fallen comrades.",
        objectives: [
            { target: 80, text: "Collect 80 gold for medicine to heal wounded kunoichi from the last battle.", reward: 25 },
            { target: 150, text: "Gather 150 gold to purchase rare poison ingredients from the black market.", reward: 40 },
            { target: 250, text: "Secure 250 gold to fund the rescue of captured sisters from the Oni fortress.", reward: 65 }
        ]
    },
    tatsumaru: {
        name: "Tatsumaru",
        color: "#33cc66",
        emoji: "👺",
        quote: "The Green Viper strikes unseen, gathering resources to overthrow the corrupt lords.",
        objectives: [
            { target: 120, text: "Acquire 120 gold to bribe castle guards and gain access to restricted areas.", reward: 35 },
            { target: 180, text: "Secure 180 gold for stealth gear, grappling hooks, and smoke bombs.", reward: 55 },
            { target: 280, text: "Gather 280 gold to fund the rebellion and arm the peasant militia.", reward: 75 }
        ]
    }
};

// Ranking System
const RANKS = [
    { name: "Initiate", minHonor: 0, color: "#666666", next: 100 },
    { name: "Shinobi", minHonor: 100, color: "#3366cc", next: 300 },
    { name: "Assassin", minHonor: 300, color: "#cc3366", next: 600 },
    { name: "Shadow Master", minHonor: 600, color: "#9933cc", next: 1000 },
    { name: "Grand Master", minHonor: 1000, color: "#ffcc00", next: 1500 }
];

// --- GAME STATE ---
let coins = 50;
let honor = 0;
let totalHonor = 0;
let currentRank = 0;
let currentCharacter = 'rikimaru';
let currentMission = null;
let currentObjective = 0;
let missionsCompleted = 0;
let totalMissions = 0;
let isSpinning = [false, false, false];
let grid = [[], [], []];
let busy = false;
let gameActive = false;

// --- SOUND SYSTEM ---
function playSnd(id) {
    // Create audio context for web audio
    try {
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const audioContext = new (AudioContext || webkitAudioContext)();
            
            // Different sounds for different actions
            switch(id) {
                case 'click':
                    playBeep(800, 0.1);
                    break;
                case 'spin-start':
                    playBeep(400, 0.2);
                    break;
                case 'stop':
                    playBeep(600, 0.1);
                    break;
                case 'win':
                    playWinSound();
                    break;
                case 'lose':
                    playLoseSound();
                    break;
            }
        }
    } catch(e) {
        console.log('Audio not supported');
    }
}

function playBeep(frequency, duration) {
    try {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch(e) {}
}

function playWinSound() {
    try {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch(e) {}
}

function playLoseSound() {
    try {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
        oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.1); // F4
        oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime + 0.2); // D4
        
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch(e) {}
}

// --- SAVE/LOAD SYSTEM ---
function saveGame() {
    const gameData = {
        coins: coins,
        honor: honor,
        totalHonor: totalHonor,
        currentCharacter: currentCharacter,
        currentObjective: currentObjective,
        missionsCompleted: missionsCompleted,
        totalMissions: totalMissions,
        timestamp: Date.now()
    };
    
    localStorage.setItem('tenchu_game_data', JSON.stringify(gameData));
    showMessage('Mission log saved!', 'success');
}

function loadGame() {
    const saved = localStorage.getItem('tenchu_game_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            coins = data.coins || 50;
            honor = data.honor || 0;
            totalHonor = data.totalHonor || 0;
            currentCharacter = data.currentCharacter || 'rikimaru';
            currentObjective = data.currentObjective || 0;
            missionsCompleted = data.missionsCompleted || 0;
            totalMissions = data.totalMissions || 0;
            
            currentMission = MISSIONS[currentCharacter];
            updateRank();
            updateUI();
            updateMissionIndicator();
            
            console.log('Game loaded successfully');
        } catch(e) {
            console.log('Error loading game:', e);
            resetGame();
        }
    } else {
        resetGame();
    }
}

function resetGame() {
    coins = 50;
    honor = 0;
    totalHonor = 0;
    currentCharacter = 'rikimaru';
    currentObjective = 0;
    missionsCompleted = 0;
    totalMissions = 0;
    currentMission = MISSIONS[currentCharacter];
    updateRank();
    updateUI();
}

// --- RANK SYSTEM ---
function updateRank() {
    // Find current rank
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (honor >= RANKS[i].minHonor) {
            currentRank = i;
            break;
        }
    }
    
    // Update UI
    const rankElement = document.getElementById('current-rank');
    const progressBar = document.getElementById('rank-progress-bar');
    const totalHonorElement = document.getElementById('total-honor');
    
    if (rankElement) {
        rankElement.textContent = RANKS[currentRank].name;
        rankElement.style.color = RANKS[currentRank].color;
    }
    
    if (progressBar) {
        const currentRankHonor = RANKS[currentRank].minHonor;
        const nextRankHonor = RANKS[currentRank].next;
        const progress = ((honor - currentRankHonor) / (nextRankHonor - currentRankHonor)) * 100;
        progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }
    
    if (totalHonorElement) {
        totalHonorElement.textContent = totalHonor;
    }
}

// --- NAVIGATION ---
function showMissionSelect() {
    playSnd('click');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('mission-select').classList.remove('hidden');
}

function selectCharacter(char) {
    playSnd('click');
    currentCharacter = char;
    currentMission = MISSIONS[char];
    currentObjective = 0;
    showMissionBriefing();
}

function showMissionBriefing() {
    if (!currentMission) return;
    
    playSnd('click');
    document.getElementById('mission-select').classList.add('hidden');
    const briefing = document.getElementById('mission-briefing');
    briefing.classList.remove('hidden');
    
    // Update character info
    document.getElementById('character-name').textContent = currentMission.name;
    document.getElementById('character-quote').textContent = currentMission.quote;
    document.getElementById('character-portrait').textContent = currentMission.emoji;
    document.getElementById('character-portrait').className = `character-portrait ${currentCharacter}-color`;
    
    // Update mission objective
    const objective = currentMission.objectives[currentObjective];
    document.getElementById('mission-text').textContent = objective.text;
    document.getElementById('reward-gold').textContent = `${objective.target} GOLD`;
    document.getElementById('reward-honor').textContent = `${objective.reward} HONOR`;
    
    // Update next rank
    const nextRank = currentRank < RANKS.length - 1 ? RANKS[currentRank + 1].name : "MAX RANK";
    document.getElementById('next-rank').textContent = nextRank;
}

function startMission() {
    playSnd('click');
    if (!currentCharacter) {
        currentCharacter = 'rikimaru';
        currentMission = MISSIONS[currentCharacter];
    }
    
    document.getElementById('mission-briefing').classList.add('hidden');
    document.getElementById('mission-select').classList.add('hidden');
    startGame();
}

function startGame() {
    playSnd('click');
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    gameActive = true;
    
    updateMissionIndicator();
    initMachine();
}

function showInstructions() {
    playSnd('click');
    const currentScreen = document.querySelector('.screen:not(.hidden)');
    if (currentScreen) {
        currentScreen.classList.add('hidden');
    }
    document.getElementById('info-screen').classList.remove('hidden');
}

function goToMainMenu() {
    playSnd('click');
    const currentScreen = document.querySelector('.screen:not(.hidden)');
    if (currentScreen) {
        currentScreen.classList.add('hidden');
    }
    document.getElementById('main-menu').classList.remove('hidden');
}

function goToMissionSelect() {
    playSnd('click');
    document.getElementById('mission-briefing').classList.add('hidden');
    document.getElementById('mission-select').classList.remove('hidden');
}

function returnToBase() {
    playSnd('click');
    if (gameActive) {
        saveGame();
    }
    
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('mission-complete').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    gameActive = false;
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
    if (!currentMission) return;
    const indicator = document.getElementById('mission-indicator');
    const objective = currentMission.objectives[currentObjective];
    const progress = Math.min(coins, objective.target);
    indicator.textContent = `${currentMission.name}: ${progress}/${objective.target}`;
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
    playSnd('spin-start');
    
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
    
    playSnd('stop');
    isSpinning[i] = false;
    
    const strip = document.getElementById(`strip-${i}`);
    strip.classList.remove('spinning');
    
    // Generate new symbols for this reel
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
    
    // Horizontal lines (rows)
    for (let row = 0; row < 3; row++) {
        if (g[0][row] === g[1][row] && g[1][row] === g[2][row]) {
            lines.push({type: 'h', row: row, symbol: g[0][row]});
        }
    }
    
    // Vertical lines (columns)
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
            createBloodParticles(3, target);
        }
    }
}

function finalize(lines) {
    const panel = document.getElementById('result-panel');
    const type = document.getElementById('res-type');
    const cash = document.getElementById('res-coins');
    const missionUpdate = document.getElementById('mission-update');
    
    panel.classList.remove('hidden');
    playSnd(lines.length > 0 ? 'win' : 'lose');
    
    if (lines.length > 0) {
        let total = 0;
        
        // Calculate rewards for each winning line
        lines.forEach(line => {
            let reward = 0;
            switch(line.symbol) {
                case 1: // Ninja
                    reward = 30;
                    break;
                case 4: // Oni
                    reward = 25;
                    break;
                case 6: // Castle (MAX)
                    reward = 50;
                    break;
                case 2: // Sword
                    reward = 15;
                    break;
                case 3: // Lantern
                    reward = 10;
                    break;
                case 5: // Scroll
                    reward = 8;
                    break;
                default:
                    reward = 10;
            }
            total += reward;
            highlightLine(line);
        });
        
        // Multi-line bonus
        if (lines.length > 1) {
            type.textContent = "MULTI-KILL!";
            type.style.color = "#ff0000";
            total = Math.floor(total * 1.3);
            createScreenShake();
        } else {
            type.textContent = "TARGET ELIMINATED!";
            type.style.color = "#ff3300";
        }
        
        // Cap at maximum
        const finalReward = Math.min(50, total);
        cash.textContent = `+${finalReward} RYŌ`;
        cash.style.color = "#ffcc00";
        
        // Add coins with animation
        const oldCoins = coins;
        animateCoins(finalReward, () => {
            // Check mission objective
            if (currentMission) {
                const objective = currentMission.objectives[currentObjective];
                
                // Check if objective completed
                if (oldCoins < objective.target && coins >= objective.target) {
                    completeObjective();
                } else {
                    missionUpdate.innerHTML = `<span style="color:#00ff00">Objective: ${coins}/${objective.target} Gold</span>`;
                }
            }
        });
        
        // Add honor for win
        const honorGain = Math.floor(finalReward / 5);
        honor += honorGain;
        totalHonor += honorGain;
        updateRank();
        
    } else {
        type.textContent = "MISSED!";
        type.style.color = "#666666";
        cash.textContent = "Target escaped...";
        cash.style.color = "#999999";
        missionUpdate.textContent = "";
        
        // Check if out of coins
        if (coins < 5) {
            setTimeout(() => {
                type.textContent = "MISSION FAILED";
                cash.textContent = "Out of resources...";
                missionUpdate.innerHTML = `<span style="color:#ff3300">Returning to base camp...</span>`;
                
                setTimeout(() => {
                    returnToBase();
                }, 2000);
            }, 1000);
        }
    }
    
    // Reset for next spin
    setTimeout(() => {
        busy = false;
        if (coins >= 5) {
            document.getElementById('spin-btn').classList.remove('hidden-btn');
        }
    }, 2000);
}

function completeObjective() {
    if (!currentMission) return;
    
    const objective = currentMission.objectives[currentObjective];
    const honorReward = objective.reward;
    
    // Award honor
    honor += honorReward;
    totalHonor += honorReward;
    missionsCompleted++;
    totalMissions++;
    
    // Save progress
    saveGame();
    updateRank();
    
    // Show mission complete screen
    const completeScreen = document.getElementById('mission-complete');
    const missionResult = document.getElementById('mission-result');
    const missionReward = document.getElementById('mission-reward');
    
    missionResult.innerHTML = `
        <div style="color: ${currentMission.color}; font-size: 2rem; margin-bottom: 10px;">
            ${currentMission.name}'s Mission Complete!
        </div>
        <div style="font-size: 1.2rem;">
            "${objective.text}"
        </div>
    `;
    
    missionReward.textContent = `+${honorReward} Honor Earned!`;
    
    completeScreen.classList.remove('hidden');
    
    // Check if there are more objectives
    if (currentObjective < currentMission.objectives.length - 1) {
        currentObjective++;
    } else {
        // All objectives completed for this character
        setTimeout(() => {
            missionResult.innerHTML += `<div style="color: #ffcc00; margin-top: 20px; font-size: 1.5rem;">
                All missions completed for ${currentMission.name}!
            </div>`;
        }, 1000);
    }
}

function continueMission() {
    playSnd('click');
    document.getElementById('mission-complete').classList.add('hidden');
    updateMissionIndicator();
}

// --- ANIMATIONS ---
function animateCoins(amount, callback) {
    const steps = 5;
    const stepValue = Math.ceil(amount / steps);
    let count = 0;
    
    const timer = setInterval(() => {
        if (count >= amount) {
            clearInterval(timer);
            if (callback) callback();
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
        
    }, 80);
}

function createBloodParticles(count, element) {
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

function createScreenShake() {
    const gameView = document.getElementById('game-view');
    gameView.classList.add('screen-shake');
    setTimeout(() => {
        gameView.classList.remove('screen-shake');
    }, 500);
}

// --- UI UPDATES ---
function updateUI() {
    // Update coin display
    const coinElement = document.getElementById('coins');
    const honorElement = document.getElementById('honor');
    
    if (coinElement) coinElement.textContent = coins;
    if (honorElement) honorElement.textContent = honor;
    
    // Update spin button state
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
        if (coins < 5) {
            spinBtn.disabled = true;
            spinBtn.style.opacity = '0.5';
            spinBtn.title = 'Need 5 ryō to infiltrate';
        } else {
            spinBtn.disabled = false;
            spinBtn.style.opacity = '1';
            spinBtn.title = 'Begin infiltration (5 ryō)';
        }
    }
    
    updateMissionIndicator();
}

// --- UTILITY FUNCTIONS ---
function shareGame() {
    playSnd('click');
    const shareText = `I have achieved the rank of ${RANKS[currentRank].name} with ${totalHonor} total honor in TENCHU: Shadow Mission! Can you surpass my shadow? 🥷`;
    
    if (navigator.share) {
        navigator.share({
            title: 'TENCHU: Shadow Mission',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText);
        showMessage('Honor record copied to scroll!', 'info');
    }
}

function donate() {
    playSnd('click');
    window.open('https://ko-fi.com', '_blank');
}

function showMessage(text, type) {
    // Create message element
    const message = document.createElement('div');
    message.textContent = text;
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.left = '50%';
    message.style.transform = 'translateX(-50%)';
    message.style.padding = '10px 20px';
    message.style.background = type === 'success' ? 'rgba(0, 153, 0, 0.9)' : 'rgba(153, 0, 0, 0.9)';
    message.style.color = 'white';
    message.style.borderRadius = '5px';
    message.style.zIndex = '1000';
    message.style.fontFamily = 'Georgia, serif';
    message.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(message);
        }, 500);
    }, 3000);
}

// --- INITIALIZATION ---
window.onload = function() {
    // Load saved game
    loadGame();
    
    // Set up auto-save
    setInterval(saveGame, 30000); // Save every 30 seconds
    
    // Show welcome message
    setTimeout(() => {
        if (!localStorage.getItem('tenchu_game_data')) {
            showMessage('Welcome to TENCHU: Shadow Mission! Your progress is saved automatically.', 'info');
        }
    }, 1000);
};

// --- KEYBOARD CONTROLS ---
document.addEventListener('keydown', function(e) {
    if (!gameActive) return;
    
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

// Prevent right-click context menu
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Prevent text selection
document.addEventListener('selectstart', function(e) {
    e.preventDefault();
});