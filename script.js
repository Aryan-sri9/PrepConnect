// Disaster Preparedness Education System - Smart AI Edition

/* =========================================
   USER CONFIGURATION
   ========================================= */
const GEMINI_API_KEY = ""; 

// State management
const state = {
    modules: JSON.parse(localStorage.getItem('modules') || '{}'),
    drillsCompleted: parseInt(localStorage.getItem('drillsCompleted') || '0', 10),
    quiz: JSON.parse(localStorage.getItem('quiz') || JSON.stringify({ level: 1, scores: {} })),
    userProfile: JSON.parse(localStorage.getItem('userProfile') || JSON.stringify({ needs: 'none' })),
    chatOpen: false,
    chatLang: 'en',
    currentModule: null,
    currentQuiz: null, // Added missing state
    currentLevel: 1,   // Added missing state
    quizIndex: 0,      // Added missing state
    score: 0           // Added missing state
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
    if (document.getElementById('mobility-status')) {
        document.getElementById('mobility-status').value = state.userProfile.needs;
    }
    // Initialize Chat
    addChatMessage('bot', getBotGreeting());

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').replace('#', '');
            showSection(target);
        });
    });
});

/* =========================================
   SMART AI CHATBOT LOGIC
   ========================================= */

const localKnowledgeBase = {
    "earthquake": { text: "For Earthquakes: Drop, Cover, and Hold On. Stay away from windows. If outside, find an open area.", action: "Start Drill", link: "earthquake" },
    "flood": { text: "For Floods: Move to higher ground immediately. Do not walk or drive through floodwaters.", action: "Learn More", link: "flood" },
    "fire": { text: "For Fire: Stop, Drop, and Roll if on fire. Use stairs, never elevators. Stay low to avoid smoke.", action: "Fire Drill", link: "fire" },
    "police": { text: "Police Emergency: Dial 100.", action: "Call 100", link: "100" },
    "ambulance": { text: "Medical Emergency: Dial 108.", action: "Call 108", link: "108" },
    "doctor": { text: "For medical help, dial 108 for an ambulance or visit the nearest hospital." },
    "tsunami": { text: "If you feel a strong quake near the coast, move to high ground immediately. Do not wait for a warning." },
    "cyclone": { text: "Secure your home, close windows, and stay indoors. Listen to the radio for updates." },
    "kit": { text: "Emergency Kit Checklist: Water, non-perishable food, flashlight, first aid kit, batteries, and important documents." },
    "cpr": { text: "CPR Basics: Push hard and fast in the center of the chest. 100-120 compressions per minute." },
    "burn": { text: "For minor burns, run cool tap water over it for 10-20 minutes. Do not use ice or butter." },
    "bleeding": { text: "Apply direct pressure to the wound with a clean cloth until bleeding stops." },
    "snake": { text: "Keep the person calm and still. Do not suck out venom. Transport to hospital immediately." },
    "fracture": { text: "Immobilize the injured area. Do not try to realign the bone. Apply ice packs." },
    "hello": { text: "Hello! I am PrepBot. How can I assist you with safety today?" },
    //"hi": { text: "Hi there! Stay safe. What do you need help with?" },
    "thank": { text: "You're welcome! Stay safe." },
    "bye": { text: "Goodbye! Stay prepared." },
    "delhi" : { text: "The emergency contact of Delhi SDMA is 1077.", action: "Call 1077", link: "1077"},
    "karnataka" : { text: "The emergency contact of Karnataka SDMA is 080-22340676",  action: "Call 080-22340676", link: "080-22340676"},
    "haryana" : { text: "The emergency contact of Haryana SDMA is 1070.",  action: "Call 1070", link: "1070"},
    "maharashtra" : { text: "The emergency contact of Delhi SDMA is 1916."},
};

const greetings = {
    en: "Hello! I am PrepBot AI. Ask me about disasters, first aid, or emergency contacts.",
    hi: "नमस्ते! मैं प्रेपबॉट एआई हूं। मुझसे आपदाओं या आपातकालीन संपर्कों के बारे में पूछें।",
    pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਪ੍ਰੈਪਬੋਟ ਹਾਂ। ਆਫ਼ਤਾਂ ਜਾਂ ਐਮਰਜੈਂਸੀ ਸੰਪਰਕਾਂ ਬਾਰੇ ਮੈਨੂੰ ਪੁੱਛੋ।"
};

function toggleChat() {
    const chat = document.getElementById('chat-widget');
    state.chatOpen = !state.chatOpen;
    chat.style.display = state.chatOpen ? 'flex' : 'none';
    if(state.chatOpen) document.getElementById('chat-input').focus();
}

function changeChatLanguage() {
    state.chatLang = document.getElementById('chat-lang').value;
    const msgContainer = document.getElementById('chat-messages');
    msgContainer.innerHTML = ''; 
    addChatMessage('bot', getBotGreeting());
}

function getBotGreeting() { return greetings[state.chatLang]; }

function handleChatKey(e) { if (e.key === 'Enter') sendChatMessage(); }

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    addChatMessage('user', text);
    input.value = '';
    
    document.getElementById('typing-indicator').style.display = 'block';
    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    if (GEMINI_API_KEY) {
        await callGeminiAI(text);
    } else {
        setTimeout(() => handleLocalResponse(text.toLowerCase()), 1000);
    }
}

async function callGeminiAI(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ parts: [{ text: "You are a helpful disaster management assistant. Answer briefly: " + prompt }] }] };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        const reply = data.candidates[0].content.parts[0].text;
        
        document.getElementById('typing-indicator').style.display = 'none';
        addChatMessage('bot', reply);
    } catch (error) {
        document.getElementById('typing-indicator').style.display = 'none';
        addChatMessage('bot', "I'm having trouble connecting to the AI cloud. Switching to offline mode.");
        handleLocalResponse(prompt.toLowerCase());
    }
}

function handleLocalResponse(text) {
    document.getElementById('typing-indicator').style.display = 'none';
    let bestMatch = null;

    for (const key in localKnowledgeBase) {
        if (text.includes(key)) {
            bestMatch = localKnowledgeBase[key];
            break;
        }
    }

    if (bestMatch) {
        addChatMessage('bot', bestMatch.text, bestMatch.action, bestMatch.link);
    } else {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
        addChatMessage('bot', "I am currently trained for disaster topics, but I can help you find that on Google.", "Search Google", searchUrl);
    }
}

function addChatMessage(sender, text, actionLabel, actionLink) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = sender === 'bot' ? 'msg-bot' : 'msg-user';
    div.textContent = text;

    if (actionLabel && actionLink) {
        const btn = document.createElement('button');
        btn.className = 'msg-action-btn';
        btn.textContent = actionLabel;
        
        if (actionLink.startsWith('http')) {
            btn.onclick = () => window.open(actionLink, '_blank');
        } else {
            btn.onclick = () => handleChatAction(actionLink);
        }
        
        div.appendChild(document.createElement('br'));
        div.appendChild(btn);
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function handleChatAction(link) {
    if (!isNaN(link)) {
        copyNumber(link);
    } else if (link === 'drills') {
        showSection('drills');
        if (window.innerWidth < 768) toggleChat();
    } else {
        showSection('modules');
        openModule(link);
        if (window.innerWidth < 768) toggleChat();
    }
}

/* =========================================
   SOS & NEIGHBORHOOD ALERT
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
    state.userProfile.needs = document.getElementById('mobility-status').value;
    saveState();
    toast('Profile updated.');
    closeProfile();
}

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
    
    document.getElementById('sos-status').textContent = "Acquiring GPS Signal...";
    document.getElementById('sos-details').style.display = 'none';
    document.getElementById('neighbors-found').innerHTML = '';
    document.getElementById('user-needs-display').textContent = NEEDS_MAPPING[state.userProfile.needs] || 'Help Needed';

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toFixed(4);
                const long = pos.coords.longitude.toFixed(4);
                document.getElementById('sos-status').innerHTML = `Location Locked: <br>Lat: ${lat}, Long: ${long}<br>Scanning 50m radius...`;
                startNeighborScan();
            },
            () => {
                document.getElementById('sos-status').textContent = "GPS Error. Broadcasting last known location...";
                startNeighborScan();
            }
        );
    } else {
        document.getElementById('sos-status').textContent = "GPS Unavailable. Broadcasting manual alert...";
        startNeighborScan();
    }
}

function startNeighborScan() {
    setTimeout(() => {
        document.getElementById('sos-details').style.display = 'block';
        document.getElementById('sos-status').textContent = "Alert Sent! Waiting for response...";
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
   STANDARD MODULES
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

/* =========================================
   FULL QUIZ SYSTEM
   ========================================= */

const QUIZ_BANK = {
    1: [
        { q: 'What should you do during an earthquake?', options: ['Run outside', 'Drop, Cover, and Hold On', 'Stand near windows', 'Scream'], a: 1 },
        { q: 'The emergency number for fire service in India is:', options: ['102', '108', '101', '112'], a: 2 },
        { q: 'In a flood, you should:', options: ['Drive through water', 'Swim', 'Move to higher ground', 'Ignore alerts'], a: 2 },
        { q: 'For small burns, first:', options: ['Apply ice', 'Cool with running water', 'Pop blisters', 'Apply butter'], a: 1 },
        { q: 'Best place during earthquake indoors:', options: ['Under sturdy table', 'Doorway', 'Balcony', 'Near glass'], a: 0 },
    ],
    2: [
        { q: 'If clothes catch fire, you should:', options: ['Run fast', 'Stop, Drop, and Roll', 'Jump into bed', 'Wave arms'], a: 1 },
        { q: 'Emergency kit should include:', options: ['Food only', 'Water, torch, first aid', 'Games', 'Only documents'], a: 1 },
        { q: 'During earthquake at school, first action is to:', options: ['Run home', 'Call parents', 'Drop, Cover, Hold', 'Go to roof'], a: 2 },
        { q: 'In floods, electricals should be:', options: ['Ignored', 'Elevated/disconnected', 'Submerged', 'Touched wet'], a: 1 },
        { q: 'Smoke in corridor, you should:', options: ['Crawl low', 'Walk upright', 'Use lift', 'Hide'], a: 0 },
    ],
    3: [
        { q: 'Post-earthquake, priority is:', options: ['Selfies', 'Check injuries/hazards', 'Sleep', 'Looting'], a: 1 },
        { q: 'If trapped under debris:', options: ['Shout continuously', 'Kick dust', 'Tap on pipe/wall', 'Light match'], a: 2 },
        { q: 'NDMA stands for:', options: ['National Disaster Management Authority', 'New Delhi Medical Agency', 'None', 'National Department'], a: 0 },
        { q: 'Flood water 15 cm deep can:', options: ['Be safe', 'Sweep you off feet', 'Clean roads', 'None'], a: 1 },
        { q: 'Fire assembly area should be:', options: ['Lobby', 'Open, upwind area', 'Basement', 'Roof'], a: 1 },
    ],
};

function selectLevel(level) {
    state.currentLevel = level;
    // Update UI text
    if(document.getElementById('current-level')) 
        document.getElementById('current-level').textContent = String(level);
    
    // Highlight button
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`level-${level}`);
    if(btn) btn.classList.add('active');

    // Show Intro, Hide Questions/Results
    document.getElementById('quiz-intro').style.display = 'block';
    document.getElementById('quiz-questions').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'none';
}

function startQuiz() {
    // Shuffle and pick questions for current level
    const questions = QUIZ_BANK[state.currentLevel] || QUIZ_BANK[1];
    state.currentQuiz = questions.sort(() => Math.random() - 0.5);
    state.quizIndex = 0;
    state.score = 0;

    // Switch Views
    document.getElementById('quiz-intro').style.display = 'none';
    document.getElementById('quiz-questions').style.display = 'block';
    document.getElementById('quiz-results').style.display = 'none';
    
    renderQuestion();
}

function renderQuestion() {
    const q = state.currentQuiz[state.quizIndex];
    
    document.getElementById('question-number').textContent = state.quizIndex + 1;
    document.getElementById('current-score').textContent = state.score;
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
    // Disable all buttons
    document.querySelectorAll('.answer-option').forEach(b => {
        b.onclick = null;
        b.style.cursor = 'default';
    });

    if (idx === correct) {
        btn.classList.add('correct');
        state.score++;
    } else {
        btn.classList.add('incorrect');
        // Highlight the correct one too
        const allBtns = document.querySelectorAll('.answer-option');
        if(allBtns[correct]) allBtns[correct].classList.add('correct');
    }
    
    document.getElementById('current-score').textContent = state.score;
    document.getElementById('next-btn').style.display = 'inline-block';
}

function nextQuestion() {
    if (state.quizIndex < state.currentQuiz.length - 1) {
        state.quizIndex++;
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    const percent = Math.round((state.score / state.currentQuiz.length) * 100);
    
    document.getElementById('quiz-questions').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'block';
    
    document.getElementById('final-score').textContent = `${percent}%`;
    
    const passed = percent >= 70;
    document.getElementById('result-message').textContent = passed 
        ? 'Great job! You passed this level.' 
        : 'Keep practicing. Try again!';

    // Save Score
    state.quiz.scores[state.currentLevel] = percent;
    
    // Unlock next level if passed
    if (passed && state.currentLevel < 3) {
        state.quiz.level = Math.max(state.quiz.level || 1, state.currentLevel + 1);
    }
    
    saveState();
    updateLevelButtons();
    updateStats();
}

function retryQuiz() { 
    selectLevel(state.currentLevel); 
}

function nextLevel() { 
    const next = Math.min(3, state.currentLevel + 1);
    selectLevel(next); 
}

function updateLevelButtons() {
    const unlocked = state.quiz.level || 1;
    [1, 2, 3].forEach(lvl => {
        const btn = document.getElementById(`level-${lvl}`);
        if(btn) {
            btn.disabled = lvl > unlocked;
            if (lvl <= unlocked) btn.classList.add('unlocked');
            else btn.classList.remove('unlocked');
        }
    });
}

/* =========================================
   FULL DRILL SYSTEM
   ========================================= */

function startDrill(type) {
    const titles = { 
        earthquake: 'Earthquake Drill', 
        fire: 'Fire Evacuation Drill', 
        flood: 'Flood Response Drill' 
    };
    
    const steps = {
        earthquake: [
            'Drop under a sturdy desk',
            'Cover your head and neck',
            'Hold on until shaking stops',
            'Evacuate calmly when instructed',
        ],
        fire: [
            'Raise the alarm and alert others',
            'Use stairs, avoid elevators',
            'Stay low to avoid smoke',
            'Assemble at the designated area',
        ],
        flood: [
            'Move to higher ground',
            'Turn off electricity if safe',
            'Avoid walking/driving through water',
            'Listen to official updates',
        ],
    };

    // Set Title
    document.getElementById('drill-title').textContent = titles[type];
    
    // Set Instructions
    const scenario = document.getElementById('drill-scenario');
    scenario.innerHTML = `<p>Click each step below as you "perform" it:</p>`;

    // Build Checklist
    const actions = document.getElementById('drill-actions');
    actions.innerHTML = '';
    
    if (steps[type]) {
        steps[type].forEach((step, idx) => {
            const div = document.createElement('div');
            div.className = 'drill-action';
            div.textContent = `${idx + 1}. ${step}`;
            div.onclick = function() { this.classList.toggle('completed'); };
            actions.appendChild(div);
        });
    }

    // Show Modal
    const modal = document.getElementById('drill-simulator');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);

    // Start Timer
    startTimer();
}

function closeDrill() {
    stopTimer();
    const modal = document.getElementById('drill-simulator');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function completeDrill() {
    // Validation: Check if all steps are completed
    const actions = document.querySelectorAll('.drill-action');
    const completed = document.querySelectorAll('.drill-action.completed');
    
    if (completed.length < actions.length) {
        toast(`Please complete all ${actions.length} steps first!`);
        return;
    }

    stopTimer();
    state.drillsCompleted += 1;
    saveState();
    updateStats();
    closeDrill();
    toast('Drill Passed Successfully!');
}

function startTimer() {
    // Reset if running
    stopTimer();
    
    state.timerStart = Date.now();
    const el = document.getElementById('timer-display');
    
    state.timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.timerStart) / 1000);
        const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const ss = String(elapsed % 60).padStart(2, '0');
        if(el) el.textContent = `${mm}:${ss}`;
    }, 1000);
}

function stopTimer() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
    state.timerStart = null;
    const el = document.getElementById('timer-display');
    if(el) el.textContent = '00:00';
}

function copyNumber(num) {
    navigator.clipboard.writeText(num).then(() => toast(`Copied ${num}`));
}

function updateRegionalInfo() {
    const mapping = {
        punjab: [
            { name: 'Punjab SDMA', number: '0172-2740274' },
            { name: 'Punjab Police Helpline', number: '112' },
        ],
        delhi: [
            { name: 'Delhi SDMA', number: '1077' },
            { name: 'Delhi Police', number: '112' },
        ],
        maharashtra: [
            { name: 'Maharashtra SDMA', number: '022-22027990' },
            { name: 'Mumbai Disaster Control', number: '1916' },
        ],
        gujarat: [
            { name: 'Gujarat SDMA', number: '079-23259224' },
            { name: 'Ahmedabad Control Room', number: '079-26424000' },
        ],
        karnataka: [
            { name: 'Karnataka SDMA', number: '080-22340676' },
            { name: 'Bengaluru Control Room', number: '080-22943225' },
        ],
        haryana: [
            { name: 'Haryana SDMA', number: '0172-2740397' },
            { name: 'State Control Room', number: '1070' },
        ]
    };

    const selector = document.getElementById('region-select');
    const region = selector.value.toLowerCase(); // Ensure case insensitivity
    const list = mapping[region] || [];
    const container = document.getElementById('regional-contacts');
    
    // Clear previous results
    container.innerHTML = '';

    if (!list.length) {
        container.innerHTML = '<p>Select your state to view contacts.</p>';
        return;
    }
    
    // Create new elements safely
    const fragment = document.createDocumentFragment();
    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'contact-row';
        div.style.marginBottom = '10px';
        div.innerHTML = `<strong>${item.name}:</strong> ${item.number} <button class="btn-call" style="margin-left:10px; padding:2px 8px;" onclick="copyNumber('${item.number}')">Copy</button>`;
        fragment.appendChild(div);
    });
    container.appendChild(fragment);
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Global scope exports
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
window.startDrill = startDrill;
window.copyNumber = copyNumber;
window.updateRegionalInfo = updateRegionalInfo;
window.toggleChat = toggleChat;
window.changeChatLanguage = changeChatLanguage;
window.sendChatMessage = sendChatMessage;
window.handleChatKey = handleChatKey;
window.completeDrill = completeDrill;
window.closeDrill = closeDrill;
window.retryQuiz = retryQuiz;
window.nextLevel = nextLevel;
window.nextQuestion = nextQuestion;
window.selectLevel = selectLevel;
