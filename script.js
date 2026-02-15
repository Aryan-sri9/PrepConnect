// Disaster Preparedness Education System - MVP
// Handles navigation, modules, quiz with levels, drills, and emergency helpers

// State management using localStorage for simple persistence
const state = {
  modules: JSON.parse(localStorage.getItem('modules') || '{}'),
  drillsCompleted: parseInt(localStorage.getItem('drillsCompleted') || '0', 10),
  quiz: JSON.parse(localStorage.getItem('quiz') || JSON.stringify({ level: 1, scores: {} })),
  currentModule: null,
  currentQuiz: null,
  currentLevel: 1,
  quizIndex: 0,
  score: 0,
  selectedAnswer: null,
  timer: null,
  timerStart: null,
};

function saveState() {
  localStorage.setItem('modules', JSON.stringify(state.modules));
  localStorage.setItem('drillsCompleted', String(state.drillsCompleted));
  localStorage.setItem('quiz', JSON.stringify(state.quiz));
}

// Navigation between sections
function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'home') updateStats();
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  // Update UI from saved state
  updateModuleStatuses();
  updateStats();
  updateLevelButtons();

  // Smooth anchor navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').replace('#', '');
      showSection(target);
    });
  });
});

// Content for modules (concise MVP content)
const MODULE_CONTENT = {
  earthquake: `
    <h2>Earthquake Safety</h2>
    <p>During an earthquake: Drop, Cover, and Hold On. Stay away from windows and heavy objects. If outdoors, move to an open area away from buildings and power lines.</p>
    <h3>Before</h3>
    <ul>
      <li>Secure heavy furniture.</li>
      <li>Prepare an emergency kit.</li>
      <li>Know evacuation routes.</li>
    </ul>
    <h3>After</h3>
    <ul>
      <li>Check for injuries and provide first aid.</li>
      <li>Avoid damaged buildings and gas leaks.</li>
      <li>Listen to official guidance.</li>
    </ul>
  `,
  flood: `
    <h2>Flood Response</h2>
    <p>Do not walk or drive through floodwaters. Move to higher ground. Keep emergency supplies and important documents in waterproof containers.</p>
    <h3>Before</h3>
    <ul>
      <li>Know local flood risk and alerts.</li>
      <li>Elevate electrical items.</li>
      <li>Plan evacuation routes.</li>
    </ul>
    <h3>After</h3>
    <ul>
      <li>Avoid standing water and downed power lines.</li>
      <li>Boil water until safe to drink.</li>
      <li>Document damage for insurance.</li>
    </ul>
  `,
  fire: `
    <h2>Fire Safety</h2>
    <p>If there is a fire: Raise the alarm, evacuate using stairs, not elevators. Stay low to avoid smoke. If clothing catches fire, Stop, Drop, and Roll.</p>
    <h3>Prevention</h3>
    <ul>
      <li>Keep exits clear.</li>
      <li>Do not overload sockets.</li>
      <li>Conduct regular drills.</li>
    </ul>
    <h3>After</h3>
    <ul>
      <li>Do not re-enter until declared safe.</li>
      <li>Treat burns with cool water.</li>
      <li>Report hazards.</li>
    </ul>
  `,
};

function openModule(key) {
  state.currentModule = key;
  const container = document.getElementById('module-content');
  container.innerHTML = MODULE_CONTENT[key];
  document.getElementById('module-viewer').classList.add('show');
}

function closeModule() {
  document.getElementById('module-viewer').classList.remove('show');
}

function completeModule() {
  if (!state.currentModule) return;
  state.modules[state.currentModule] = true;
  saveState();
  updateModuleStatuses();
  toast('Module marked as complete');
  closeModule();
  updateStats();
}

function updateModuleStatuses() {
  ['earthquake', 'flood', 'fire'].forEach(key => {
    const completed = !!state.modules[key];
    const el = document.getElementById(`${key}-status`);
    if (el) {
      el.textContent = completed ? 'Completed' : 'Not Started';
      el.classList.toggle('completed', completed);
    }
  });
}

function updateStats() {
  const completedCount = Object.values(state.modules).filter(Boolean).length;
  document.getElementById('modules-completed').textContent = String(completedCount);

  const scores = state.quiz.scores || {};
  const values = Object.values(scores);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  document.getElementById('quiz-score').textContent = `${avg}%`;

  document.getElementById('drills-completed').textContent = String(state.drillsCompleted);
}

// Quiz with 3 levels
const QUIZ_BANK = {
  1: [
    { q: 'What should you do during an earthquake?', options: ['Run outside immediately', 'Drop, Cover, and Hold On', 'Stand near windows', 'Use the elevator'], a: 1 },
    { q: 'The emergency number for fire service in India is:', options: ['102', '108', '101', '112'], a: 2 },
    { q: 'In a flood, you should:', options: ['Drive through water', 'Walk in moving water', 'Move to higher ground', 'Ignore alerts'], a: 2 },
    { q: 'For small burns, first:', options: ['Apply ice', 'Cool with running water', 'Pop blisters', 'Apply butter'], a: 1 },
    { q: 'Best place during earthquake indoors:', options: ['Under sturdy table', 'Doorway', 'Balcony', 'Near glass'], a: 0 },
  ],
  2: [
    { q: 'If clothes catch fire, you should:', options: ['Run fast', 'Stop, Drop, and Roll', 'Jump into bed', 'Wave arms'], a: 1 },
    { q: 'Emergency kit should include:', options: ['Perishable food only', 'Water, torch, first aid', 'Luxury items', 'Only documents'], a: 1 },
    { q: 'During earthquake at school, first action is to:', options: ['Evacuate immediately', 'Call parents', 'Drop, Cover, Hold', 'Run to the roof'], a: 2 },
    { q: 'In floods, electricals should be:', options: ['Ignored', 'Elevated/disconnected', 'Submerged', 'Touched with wet hands'], a: 1 },
    { q: 'Smoke in corridor, you should:', options: ['Crawl low', 'Walk upright', 'Use lift', 'Go back to room and sleep'], a: 0 },
  ],
  3: [
    { q: 'Post-earthquake, the highest priority is:', options: ['Selfie with damage', 'Check injuries and hazards', 'Light candles', 'Collect souvenirs'], a: 1 },
    { q: 'If trapped under debris:', options: ['Shout continuously', 'Kick dust up', 'Tap on pipe/wall to signal', 'Use lighter'], a: 2 },
    { q: 'NDMA stands for:', options: ['National Disaster Management Authority', 'New Delhi Medical Agency', 'National Department of Mutual Aid', 'None'], a: 0 },
    { q: 'Flood water depth of 15 cm can:', options: ['Be safe for cars', 'Sweep you off your feet', 'Cure drought', 'Clean roads'], a: 1 },
    { q: 'Fire assembly area should be:', options: ['Near building entrance', 'Clear, open, upwind, marked', 'Inside basement', 'On rooftop'], a: 1 },
  ],
};

function selectLevel(level) {
  state.currentLevel = level;
  document.getElementById('current-level').textContent = String(level);
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`level-${level}`).classList.add('active');
  // Reset view
  document.getElementById('quiz-intro').style.display = 'block';
  document.getElementById('quiz-questions').style.display = 'none';
  document.getElementById('quiz-results').style.display = 'none';
  document.querySelector('.level-description').textContent = levelDescriptions[level];
}

const levelDescriptions = {
  1: 'Level 1: Basic safety concepts and emergency procedures',
  2: 'Level 2: Intermediate scenarios and preparedness planning',
  3: 'Level 3: Advanced response and risk reduction strategies',
};

function startQuiz() {
  state.currentQuiz = shuffle([...QUIZ_BANK[state.currentLevel]]);
  state.quizIndex = 0;
  state.score = 0;
  document.getElementById('quiz-intro').style.display = 'none';
  document.getElementById('quiz-questions').style.display = 'block';
  document.getElementById('quiz-results').style.display = 'none';
  document.getElementById('total-questions').textContent = String(state.currentQuiz.length);
  document.getElementById('current-score').textContent = String(state.score);
  renderQuestion();
}

function renderQuestion() {
  const q = state.currentQuiz[state.quizIndex];
  document.getElementById('question-number').textContent = String(state.quizIndex + 1);
  document.getElementById('question-text').textContent = q.q;
  const options = document.getElementById('answer-options');
  options.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'answer-option';
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(idx);
    options.appendChild(btn);
  });
  document.getElementById('next-btn').style.display = 'none';
  state.selectedAnswer = null;
}

function selectAnswer(idx) {
  const q = state.currentQuiz[state.quizIndex];
  const options = Array.from(document.querySelectorAll('.answer-option'));
  options.forEach(o => o.classList.remove('selected'));
  options[idx].classList.add('selected');
  // Lock in answer immediately and show feedback
  options.forEach((o, i) => {
    o.onclick = null; // prevent changing after selection
    if (i === q.a) o.classList.add('correct');
    if (i !== q.a && i === idx) o.classList.add('incorrect');
  });
  if (idx === q.a) state.score += 1;
  document.getElementById('current-score').textContent = String(state.score);
  document.getElementById('next-btn').style.display = 'inline-block';
}

function nextQuestion() {
  if (state.quizIndex < state.currentQuiz.length - 1) {
    state.quizIndex += 1;
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
  const pass = percent >= 70;
  document.getElementById('result-message').textContent = pass
    ? 'Great job! You passed this level.'
    : 'Keep practicing. You can retake this level.';

  // Persist score and unlock next level
  state.quiz.scores[state.currentLevel] = percent;
  if (pass && state.currentLevel < 3) {
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
    btn.disabled = lvl > unlocked;
    btn.classList.toggle('unlocked', lvl <= unlocked && lvl !== 1);
    btn.title = lvl > unlocked ? 'Complete previous level to unlock' : '';
  });
  document.getElementById('current-level').textContent = String(state.currentLevel);
  document.querySelector('.level-description').textContent = levelDescriptions[state.currentLevel];
}

// Virtual Drills (simple interactive checklist + timer)
function startDrill(type) {
  const titles = { earthquake: 'Earthquake Drill', fire: 'Fire Evacuation Drill', flood: 'Flood Response Drill' };
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

  document.getElementById('drill-title').textContent = titles[type];
  const scenario = document.getElementById('drill-scenario');
  scenario.innerHTML = `<p>Follow the steps below to complete the ${titles[type].toLowerCase()}.</p>`;

  const actions = document.getElementById('drill-actions');
  actions.innerHTML = '';
  steps[type].forEach((step, idx) => {
    const div = document.createElement('div');
    div.className = 'drill-action';
    div.textContent = `${idx + 1}. ${step}`;
    div.onclick = () => div.classList.toggle('completed');
    actions.appendChild(div);
  });

  startTimer();
  document.getElementById('drill-simulator').classList.add('show');
}

function closeDrill() {
  stopTimer();
  document.getElementById('drill-simulator').classList.remove('show');
}

function completeDrill() {
  stopTimer();
  state.drillsCompleted += 1;
  saveState();
  toast('Drill completed!');
  updateStats();
  closeDrill();
}

function startTimer() {
  state.timerStart = Date.now();
  const el = document.getElementById('timer-display');
  state.timer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.timerStart) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    el.textContent = `${mm}:${ss}`;
  }, 500);
}

function stopTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
  state.timerStart = null;
}

// Emergency helpers
function copyNumber(num) {
  navigator.clipboard.writeText(num).then(() => {
    toast(`Number ${num} copied to clipboard`);
  });
}

function updateRegionalInfo() {
  const region = document.getElementById('region-select').value;
  const mapping = {
    punjab: [
      { name: 'Punjab State Disaster Management Authority', number: '0172-2740274' },
      { name: 'Punjab Police Helpline', number: '112' },
    ],
    delhi: [
      { name: 'Delhi Disaster Management Authority', number: '1077' },
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
  };

  const list = mapping[region] || [];
  const container = document.getElementById('regional-contacts');
  if (!list.length) {
    container.innerHTML = '<p>Select your state to view contacts.</p>';
    return;
  }
  container.innerHTML = list
    .map(item => `<div><strong>${item.name}:</strong> ${item.number} <button class="btn-call" onclick="copyNumber('${item.number}')">Copy</button></div>`) 
    .join('');
}

// Toast notification
function toast(message) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// Utility
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Expose functions to window for inline handlers
window.showSection = showSection;
window.openModule = openModule;
window.closeModule = closeModule;
window.completeModule = completeModule;
window.selectLevel = selectLevel;
window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.retryQuiz = retryQuiz;
window.nextLevel = nextLevel;
window.startDrill = startDrill;
window.closeDrill = closeDrill;
window.completeDrill = completeDrill;
window.copyNumber = copyNumber;
window.updateRegionalInfo = updateRegionalInfo;

