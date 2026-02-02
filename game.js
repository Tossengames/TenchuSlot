// --- TENCHU CONFIGURATION ---
const SYMBOLS = 6;
const EMOJIS = ['🥷', '🗡️', '🏮', '👺', '📜', '🏯'];
const SYMBOL_NAMES = ['Rikimaru', 'Kodachi', 'Lantern', 'Oni Guard', 'Secret Scroll', 'Castle Lord'];

// Character mission
const MISSIONS = {
    rikimaru: {
        name: "Rikimaru",
        color: "#3366cc",
        quote: "The Azure Dragon seeks justice in the shadows...",
        objectives: [
            { target: 100, text: "Gather 100 gold for Lord Gohda's war chest.", reward: 50 },
            { target: 200, text: "Secure 200 gold to fund the resistance against Lord Mei-Oh.", reward: 100 },
            { target: 300, text: "Amass 300 gold to rebuild the Azuma village.", reward: 150 }
        ]
    },
    ayame: {
        name: "Ayame",
        color: "#cc3366",
        quote: "The Crimson Lily blooms where shadows fall...",
        objectives: [
            { target: 80, text: "Collect 80 gold for medicine to heal wounded shinobi.", reward: 40 },
            { target: 150, text: "Gather 150 gold to purchase rare poison ingredients.", reward: 80 },
            { target: 250, text: "Secure 250 gold to fund the rescue of captured kunoichi.", reward: 120 }
        ]
    },
    tatsumaru: {
        name: "Tatsumaru",
        color: "#33cc66",
        quote: "The Green Viper strikes where least expected...",
        objectives: [
            { target: 120, text: "Acquire 120 gold to bribe castle guards.", reward: 60 },
            { target: 180, text: "Secure 180 gold for stealth gear and grappling hooks.", reward: 90 },
            { target: 280, text: "Gather 280 gold to fund the rebellion against corrupt lords.", reward: 140 }
        ]
    }
};

// Ranks system
const RANKS = [
    { name: "Initiate", minHonor: 0, color: "#666666" },
    { name: "Shinobi", minHonor: 100, color: "#3366cc" },
    { name: "Assassin", minHonor: 300, color: "#cc3366" },
    { name: "Shadow Master", minHonor: 600, color: "#9933cc" },
    { name: "Grand Master", minHonor: 1000, color: "#ffcc00" }
];

let coins = 50;
let honor = 0;
let currentRank = 0;
let currentMission = null;
let currentCharacter = null;
let currentObjective = 0;
let missionsCompleted = 0;
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

// --- SAVE/LOAD SYSTEM ---
function saveGame() {
    localStorage.setItem('tenchu_coins', coins);
    localStorage.setItem('tenchu_honor', honor);
    localStorage.setItem('tenchu_missions', missionsCompleted);
    localStorage.setItem('tenchu_character', currentCharacter || 'rikimaru');
    localStorage.setItem('tenchu_objective', currentObjective);
    updateRank();
}

function loadGame() {
    const savedCoins = localStorage.getItem('tenchu_coins');
    const savedHonor = localStorage.getItem('tenchu_honor');
    const savedMissions = localStorage.getItem('tenchu_missions');
    const savedChar = localStorage.getItem('tenchu_character');
    const savedObj = localStorage.getItem('tenchu_objective');
    
    if (savedCoins) coins = parseInt(savedCoins);
    if (savedHonor) honor = parseInt(savedHonor);
    if (savedMissions) missionsCompleted = parseInt(savedMissions);
    if (savedChar) currentCharacter = savedChar;
    if (savedObj) currentObjective = parseInt(savedObj);
    
    if (currentCharacter) {
        currentMission = MISSIONS[currentCharacter];
    }
    
    updateRank();
    updateUI();
}

function updateRank() {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (honor >= RANKS[i].minHonor) {
            currentRank = i;
            break;
        }
    }
    
    const rankElement = document.getElementById('current-rank');
    const progressBar = document.getElementById('rank-progress-bar');
    
    if (rankElement) {
        rankElement.textContent = RANKS[currentRank].name;
        rankElement.style.color = RANKS[currentRank].color;
    }
    
    if (progressBar) {
        const currentRankHonor = RANKS[currentRank].minHonor;
        const nextRankHonor = currentRank < RANKS.length - 1 ? RANKS[currentRank + 1].minHonor : RANKS[currentRank].minHonor + 100;
        const progress = ((honor - currentRankHonor) / (nextRankHonor - currentRankHonor)) * 100;
        progressBar.style.width = Math.min(100, progress) + '%';
    }
}

// --- NAVIGATION ---
function showMissionSelect() {
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
    
    document.getElementById('mission-select').classList.add('hidden');
    const briefing = document.getElementById('mission-briefing');
    briefing.classList.remove('hidden');
    
    document.getElementById('character-name').textContent = currentMission.name;
    document.getElementById('character-quote').textContent = currentMission.quote;
    document.getElementById('character-portrait').style.background = currentMission.color;
    
    const objective = currentMission.objectives[currentObjective];
    document.getElementById('mission-text').textContent = objective.text;
    document.getElementById('reward-gold').textContent = objective.target + " GOLD";
    document.getElementById('reward-honor').textContent = objective.reward + " HONOR";
    
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
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-view').classList.remove('hidden');
    updateMissionIndicator();
    initMachine();
}

function showInstructions() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('info-screen').classList.remove('hidden');
}

function toggleInfo() {
    document.getElementById('info-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}

function returnToBase() {
    playSnd('click');
    if (coins < 5) {
        // No gold left, return to menu
        document.getElementById('game-view').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        saveGame();
    } else {
        // Continue mission
        document.getElementById('result-panel').classList.add('hidden');
    }
}

function shareGame() {
    const shareText = `I have achieved the rank of ${RANKS[currentRank].name} with ${honor} Honor in TENCHU: Shadow Mission! Can you surpass my shadow?`;
    if (navigator.share) {
        navigator.share({
            title: 'TENCHU: Shadow Mission',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Honor record copied to scroll!');
    }
}

// --- PARTICLE EFFECTS ---
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
    d.setAttribute('data-symbol', SYMBOL_NAMES[id - 1]);
    
    const img = document.createElement('img');
    img.src = `images/${id}.png`;
    img.onerror = () => { 
        img.remove(); 
        d.innerText = EMOJIS[id - 1] || '🏮'; 
        d.style.fontSize = '2.8rem';
    };
    d.appendChild(img);
    return d;
}

function updateMissionIndicator() {
    if (!currentMission) return;
    const indicator = document.getElementById('mission-indicator');
    const objective = currentMission.objectives[currentObjective];
    indicator.textContent = `${currentMission.name}: ${coins}/${objective.target} GOLD`;
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
    
    grid[i] = [
        Math.floor(Math.random() * SYMBOLS) + 1,
        Math.floor(Math.random() * SYMBOLS) + 1,
        Math.floor(Math.random() * SYMBOLS) + 1
    ];

    strip.innerHTML = '';
    grid[i].forEach(id => strip.appendChild(createSym(id)));

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
            createBloodParticles(5, target);
        }
    }
}

function finalize(lines) {
    const panel = document.getElementById('result-panel');
    const type = document.getElementById('res-type');
    const cash = document.getElementById('res-coins');
    const missionUpdate = document.getElementById('mission-update');
    panel.classList.remove('hidden');
    playSnd('feedback');

    if (lines.length > 0) {
        let total = 0;
        lines.forEach(l => {
            // TENCHU-THEMED REWARDS (MAX 50)
            let pay = 0;
            switch(l.id) {
                case 1: // Ninja (Rikimaru) - Character
                    pay = 30;
                    break;
                case 4: // Oni - Character
                    pay = 25;
                    break;
                case 6: // Castle Lord - Character (Elite)
                    pay = 50;
                    break;
                case 2: // Kodachi - Item
                    pay = 15;
                    break;
                case 3: // Lantern - Item
                    pay = 10;
                    break;
                case 5: // Scroll - Item
                    pay = 8;
                    break;
                default:
                    pay = 10;
            }
            total += pay;
            highlight(l);
        });

        if (lines.length > 1) {
            type.innerText = "MULTIPLE ASSASSINATIONS!";
            total = Math.floor(total * 1.3);
            type.style.color = "#ff0000";
        } else {
            type.innerText = "TARGET ELIMINATED!";
            type.style.color = "#ff3300";
        }
        
        const finalReward = Math.min(50, Math.floor(total)); // Cap at 50
        cash.innerText = `+${finalReward} RYŌ`;
        cash.style.color = "#ffcc00";
        
        // Check mission objective
        missionUpdate.textContent = "";
        if (currentMission) {
            const objective = currentMission.objectives[currentObjective];
            const oldCoins = coins;
            animateCoins(finalReward, () => {
                // Check if objective completed
                if (coins >= objective.target && oldCoins < objective.target) {
                    missionUpdate.innerHTML = `<span style="color:#00ff00">✓ MISSION COMPLETE!</span><br>${objective.reward} Honor earned!`;
                    honor += objective.reward;
                    missionsCompleted++;
                    
                    // Move to next objective or complete mission
                    if (currentObjective < currentMission.objectives.length - 1) {
                        currentObjective++;
                        setTimeout(() => {
                            missionUpdate.innerHTML += `<br><span style="color:#ffcc00">New objective available!</span>`;
                        }, 1000);
                    } else {
                        setTimeout(() => {
                            missionUpdate.innerHTML += `<br><span style="color:#ffcc00">${currentMission.name}'s mission fully completed!</span>`;
                        }, 1000);
                    }
                    
                    updateRank();
                    saveGame();
                }
                updateMissionIndicator();
            });
        } else {
            animateCoins(finalReward);
        }
        
        if (finalReward >= 40) {
            document.getElementById('game-view').classList.add('screen-shake');
            setTimeout(() => {
                document.getElementById('game-view').classList.remove('screen-shake');
            }, 500);
        }
        
        playSnd('win');
    } else {
        type.innerText = "TARGET ESCAPED!";
        type.style.color = "#666666";
        cash.textContent = "The shadow retreats...";
        cash.style.color = "#999999";
        missionUpdate.textContent = "";
        playSnd('lose');
        
        // Check if out of gold
        if (coins < 5) {
            setTimeout(() => {
                type.innerText = "MISSION FAILED";
                cash.textContent = "Out of resources...";
                missionUpdate.innerHTML = `<span style="color:#ff3300">Returning to base camp...</span>`;
                
                setTimeout(() => {
                    returnToBase();
                }, 2000);
            }, 1000);
        }
    }

    setTimeout(() => {
        busy = false;
        if (coins >= 5) {
            document.getElementById('spin-btn').classList.remove('hidden-btn');
        } else {
            // Auto-return to base when out of gold
            setTimeout(() => {
                returnToBase();
            }, 1000);
        }
    }, 2500);
}

// --- FAST COIN ANIMATION ---
function animateCoins(amount, callback) {
    const steps = Math.min(5, Math.ceil(amount / 20));
    const stepValue = Math.ceil(amount / steps);
    let count = 0;
    
    let timer = setInterval(() => {
        if (count >= amount) {
            clearInterval(timer);
            saveGame();
            if (callback) callback();
            return;
        }
        coins += stepValue;
        count += stepValue;
        if (count > amount) {
            coins -= (count - amount);
            count = amount;
        }
        updateUI();
        
        document.getElementById('coins').classList.add('coin-bounce');
        setTimeout(() => {
            document.getElementById('coins').classList.remove('coin-bounce');
        }, 200);
        
    }, 60);
}

// --- UI MANAGEMENT ---
function updateUI() { 
    const coinEl = document.getElementById('coins');
    const honorEl = document.getElementById('honor');
    if (coinEl) coinEl.textContent = coins; 
    if (honorEl) honorEl.textContent = honor;
    updateSpinButton();
}

function updateSpinButton() {
    const spinBtn = document.getElementById('spin-btn');
    if (coins < 5) {
        spinBtn.style.opacity = '0.5';
        spinBtn.style.cursor = 'not-allowed';
        spinBtn.title = 'Insufficient ryō for infiltration';
        spinBtn.textContent = 'NEED 5 RYŌ';
    } else {
        spinBtn.style.opacity = '1';
        spinBtn.style.cursor = 'pointer';
        spinBtn.title = 'Begin infiltration (5 ryō)';
        spinBtn.textContent = 'SPIN (5 RYŌ)';
    }
}

// --- INITIALIZATION ---
window.onload = () => {
    loadGame();
    
    // Auto-save every 30 seconds
    setInterval(saveGame, 30000);
    
    // Update rank display
    updateRank();
};