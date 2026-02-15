// Disaster Preparedness Education System - MVP

// State management
const state = {
    modules: JSON.parse(localStorage.getItem('modules') || '{}'),
    drillsCompleted: parseInt(localStorage.getItem('drillsCompleted') || '0', 10),
    quiz: JSON.parse(localStorage.getItem('quiz') || JSON.stringify({ level: 1, scores: {} })),
    userProfile: JSON.parse(localStorage.getItem('userProfile') || JSON.stringify({ needs: 'none' })),
    currentModule: null,
    currentQuiz: null,
    currentLevel: 1,
    quizIndex: 0,
    score: 0,
    timer: null,
    timerStart: null,
};

function saveState() {
    localStorage.setItem('modules', JSON.stringify(state.modules));
    localStorage.setItem('drillsCompleted', String(state.drillsCompleted));
    localStorage.setItem('quiz', JSON.stringify(state.quiz));
    localStorage.setItem('userProfile', JSON.stringify(state.userProfile));
}

// Navigation
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        if (id === 'home') updateStats();
    }
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    updateModuleStatuses();
    updateStats();
    updateLevelButtons();
    
    // Load saved profile preference
    if (document.getElementById('mobility-status')) {
        document.getElementById('mobility-status').value = state.userProfile.needs;
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').replace('#', '');
            showSection(target);
        });
    });
});

/* =========================================
   NEW FEATURE: SOS & NEIGHBORHOOD ALERT
   ========================================= */

function openProfile() {
    const modal = document.getElementById('profile-modal');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeProfile() {
    const modal = document.getElementById('profile-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function saveProfile() {
    const status = document.getElementById('mobility-status').value;
    state.userProfile.needs = status;
    saveState();
    toast('Profile updated. Alerts will now reflect your needs.');
    closeProfile();
}

// Map disability codes to readable messages for neighbors
const NEEDS_MAPPING = {
    'none': 'General Assistance Needed',
    'wheelchair': 'Wheelchair Assistance Required (Ramp/Lift)',
    'visual': 'User is Visually Impaired - Voice guidance needed',
    'hearing': 'User is Hearing Impaired - Use Visual Signals',
    'elderly': 'Elderly User - Mobility Support Needed',
    'medical': 'Medical Emergency - Power/Oxygen Required'
};

function triggerSOS() {
    const modal = document.getElementById('sos-modal');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    
    const statusEl = document.getElementById('sos-status');
    const detailsEl = document.getElementById('sos-details');
    const neighborsContainer = document.getElementById('neighbors-found');
    const needsDisplay = document.getElementById('user-needs-display');
    
    // Reset UI
    statusEl.textContent = "Acquiring GPS Signal...";
    detailsEl.style.display = 'none';
    neighborsContainer.innerHTML = '';
    
    // Update Needs Text based on Profile
    const needText = NEEDS_MAPPING[state.userProfile.needs] || 'Help Needed';
    needsDisplay.textContent = needText;

    // Simulate Geolocation (In a real app, this sends data to backend)
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const long = position.coords.longitude.toFixed(4);
                statusEl.innerHTML = `Location Locked: <br>Lat: ${lat}, Long: ${long}<br>Scanning 50m radius...`;
                
                // Simulate finding neighbors after delay
                startNeighborScan();
            },
            (error) => {
                statusEl.textContent = "GPS Error. Broadcasting last known location...";
                startNeighborScan();
            }
        );
    } else {
        statusEl.textContent = "GPS Unavailable. Broadcasting manual alert...";
        startNeighborScan();
    }
}

function startNeighborScan() {
    setTimeout(() => {
        document.getElementById('sos-details').style.display = 'block';
        document.getElementById('sos-status').textContent = "Alert Sent! Waiting for response...";
        
        // Simulate neighbors responding
        addSimulatedNeighbor("Rahul (Volunteer)", "15m away", 1000);
        addSimulatedNeighbor("Sarah (Certified First Aid)", "32m away", 2500);
        addSimulatedNeighbor("Community Center", "48m away", 4000);
    }, 1500);
}

function addSimulatedNeighbor(name, distance, delay) {
    setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'neighbor-item';
        div.innerHTML = `<span class="neighbor-icon">🏃</span> <div><strong>${name}</strong><br><small>${distance} • Is coming to help</small></div>`;
        document.getElementById('neighbors-found').appendChild(div);
        toast(`${name} accepted your alert!`);
    }, delay);
}

function closeSOS() {
    const modal = document.getElementById('sos-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

/* =========================================
   EXISTING MODULES & QUIZ LOGIC
   ========================================= */

const MODULE_CONTENT = {
    earthquake: `<h2>Earthquake Safety</h2><p>Drop, Cover, and Hold On. Stay away from windows.</p><h3>Before</h3><ul><li>Secure furniture</li><li>Prepare kit</li></ul>`,
    flood: `<h2>Flood Response</h2><p>Move to higher ground. Do not drive through water.</p><h3>After</h3><ul><li>Avoid standing water</li><li>Boil water</li></ul>`,
    fire: `<h2>Fire Safety</h2><p>Stop, Drop, and Roll. Use stairs, not elevators.</p><h3>Prevention</h3><ul><li>Check alarms</li><li>Clear exits</li></ul>`,
};

function openModule(key) {
    state.currentModule = key;
    document.getElementById('module-content').innerHTML = MODULE_CONTENT[key];
    const modal = document.getElementById('module-viewer');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModule() {
    const modal = document.getElementById('module-viewer');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function completeModule() {
    if (state.currentModule) {
        state.modules[state.currentModule] = true;
        saveState();
        updateModuleStatuses();
        toast('Module Completed!');
        closeModule();
        updateStats();
    }
}

function updateModuleStatuses() {
    ['earthquake', 'flood', 'fire'].forEach(key => {
        const completed = state.modules[key];
        const el = document.getElementById(`${key}-status`);
        if (el) {
            el.textContent = completed ? 'Completed' : 'Not Started';
            if (completed) el.classList.add('completed');
        }
    });
}

function updateStats() {
    const completedCount = Object.values(state.modules).filter(Boolean).length;
    document.getElementById('modules-completed').textContent = String(completedCount);
    
    const scores = Object.values(state.quiz.scores);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    document.getElementById('quiz-score').textContent = `${avg}%`;
    document.getElementById('drills-completed').textContent = String(state.drillsCompleted);
}

// Quiz System
const QUIZ_BANK = {
    1: [
        { q: 'What to do during earthquake?', options: ['Run', 'Drop, Cover, Hold', 'Scream'], a: 1 },
        { q: 'Emergency number for Fire?', options: ['100', '108', '101'], a: 2 }
    ],
    2: [
        { q: 'If clothes catch fire?', options: ['Run', 'Stop, Drop, Roll', 'Jump'], a: 1 },
        { q: 'Flood water 15cm deep can?', options: ['Wash car', 'Knock you down', 'Nothing'], a: 1 }
    ],
    3: [
        { q: 'NDMA stands for?', options: ['National Disaster Management Authority', 'None'], a: 0 },
        { q: 'Post-earthquake priority?', options: ['Check injuries', 'Instagram'], a: 0 }
    ]
};

function selectLevel(level) {
    state.currentLevel = level;
    document.getElementById('current-level').textContent = String(level);
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`level-${level}`).classList.add('active');
    document.getElementById('quiz-intro').style.display = 'block';
    document.getElementById('quiz-questions').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'none';
}

function startQuiz() {
    state.currentQuiz = shuffle([...QUIZ_BANK[state.currentLevel] || QUIZ_BANK[1]]);
    state.quizIndex = 0;
    state.score = 0;
    document.getElementById('quiz-intro').style.display = 'none';
    document.getElementById('quiz-questions').style.display = 'block';
    renderQuestion();
}

function renderQuestion() {
    const q = state.currentQuiz[state.quizIndex];
    document.getElementById('question-number').textContent = state.quizIndex + 1;
    document.getElementById('question-text').textContent = q.q;
    const options = document.getElementById('answer-options');
    options.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'answer-option';
        btn.textContent = opt;
        btn.onclick = () => selectAnswer(btn, idx, q.a);
        options.appendChild(btn);
    });
    document.getElementById('next-btn').style.display = 'none';
}

function selectAnswer(btn, idx, correct) {
    document.querySelectorAll('.answer-option').forEach(b => b.onclick = null);
    if (idx === correct) {
        btn.classList.add('correct');
        state.score++;
    } else {
        btn.classList.add('incorrect');
    }
    document.getElementById('current-score').textContent = state.score;
    document.getElementById('next-btn').style.display = 'inline-block';
}

function nextQuestion() {
    if (state.quizIndex < state.currentQuiz.length - 1) {
        state.quizIndex++;
        renderQuestion();
    } else {
        const percent = Math.round((state.score / state.currentQuiz.length) * 100);
        document.getElementById('quiz-questions').style.display = 'none';
        document.getElementById('quiz-results').style.display = 'block';
        document.getElementById('final-score').textContent = `${percent}%`;
        document.getElementById('result-message').textContent = percent >= 70 ? 'Passed!' : 'Try Again';
        state.quiz.scores[state.currentLevel] = percent;
        if (percent >= 70 && state.currentLevel < 3) state.quiz.level = state.currentLevel + 1;
        saveState();
        updateLevelButtons();
        updateStats();
    }
}

function retryQuiz() { selectLevel(state.currentLevel); }
function nextLevel() { selectLevel(Math.min(3, state.currentLevel + 1)); }

function updateLevelButtons() {
    const unlocked = state.quiz.level || 1;
    [1, 2, 3].forEach(lvl => {
        const btn = document.getElementById(`level-${lvl}`);
        btn.disabled = lvl > unlocked;
        if (lvl <= unlocked) btn.classList.add('unlocked');
    });
}

function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

// Drill System
function startDrill(type) {
    const titles = { earthquake: 'Earthquake Drill', fire: 'Fire Drill', flood: 'Flood Drill' };
    document.getElementById('drill-title').textContent = titles[type];
    const modal = document.getElementById('drill-simulator');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    
    document.getElementById('drill-scenario').innerHTML = '<p>Complete the steps:</p>';
    const actions = document.getElementById('drill-actions');
    actions.innerHTML = '';
    ['Step 1: Action', 'Step 2: Check', 'Step 3: Safe'].forEach((step) => {
        const div = document.createElement('div');
        div.className = 'drill-action';
        div.textContent = step;
        div.onclick = function() { this.classList.toggle('completed'); };
        actions.appendChild(div);
    });
    
    startTimer();
}

function closeDrill() {
    stopTimer();
    const modal = document.getElementById('drill-simulator');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function completeDrill() {
    if (document.querySelectorAll('.drill-action.completed').length === 3) {
        state.drillsCompleted++;
        saveState();
        updateStats();
        closeDrill();
        toast('Drill Passed!');
    } else {
        toast('Complete all steps first!');
    }
}

function startTimer() {
    state.timerStart = Date.now();
    state.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.timerStart) / 1000);
        document.getElementById('timer-display').textContent = `00:${String(elapsed).padStart(2,'0')}`;
    }, 1000);
}

function stopTimer() { clearInterval(state.timer); }

// Emergency Helpers
function copyNumber(num) {
    navigator.clipboard.writeText(num).then(() => toast(`Copied ${num}`));
}

function updateRegionalInfo() {
    const mapping = {
        punjab: [{n:'Punjab SDMA', v:'0172-2740274'}],
        delhi: [{n:'Delhi SDMA', v:'1077'}],
        haryana: [{n:'Haryana SDMA', v:'1070'}],
        maharashtra: [{n:'Maharashtra SDMA', v:'022-22027990'}]
    };
    const region = document.getElementById('region-select').value;
    const list = mapping[region] || [];
    const container = document.getElementById('regional-contacts');
    container.innerHTML = list.length 
        ? list.map(i => `<div class="contact-row"><strong>${i.n}</strong> ${i.v} <button class="btn-call" onclick="copyNumber('${i.v}')">Copy</button></div>`).join('')
        : '<p>Select a state</p>';
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Global scope
window.showSection = showSection;
window.openModule = openModule;
window.closeModule = closeModule;
window.completeModule = completeModule;
window.triggerSOS = triggerSOS;
window.closeSOS = closeSOS;
window.openProfile = openProfile;
window.closeProfile = closeProfile;
window.saveProfile = saveProfile;
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.retryQuiz = retryQuiz;
window.nextLevel = nextLevel;
window.selectLevel = selectLevel;
window.startDrill = startDrill;
window.closeDrill = closeDrill;
window.completeDrill = completeDrill;
window.copyNumber = copyNumber;
window.updateRegionalInfo = updateRegionalInfo;