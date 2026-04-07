let decks = JSON.parse(localStorage.getItem('decks')) || [];
let stats = JSON.parse(localStorage.getItem('stats')) || { learned: 0 };
let currentCards = [];
let currentIndex = 0;
let score = 0;
let tempCards = [];
let currentDeckIndex = -1;
let timerInterval = null;
let timerSeconds = 0;
let isLight = false;

function saveDecks() {
  localStorage.setItem('decks', JSON.stringify(decks));
  localStorage.setItem('stats', JSON.stringify(stats));
}

// ── SCREENS ──────────────────────────────────────
function showHome() {
  hideAll();
  clearTimer();
  document.getElementById('home-screen').classList.remove('hidden');
  renderDecks();
  updateStats();
}

function showCreate() {
  hideAll();
  document.getElementById('create-screen').classList.remove('hidden');
  document.getElementById('deck-name').value = '';
  document.getElementById('card-front').value = '';
  document.getElementById('card-back').value = '';
  document.getElementById('card-hint').value = '';
  document.getElementById('card-preview').innerHTML = '';
  document.getElementById('deck-category').value = '';
  tempCards = [];
}

function hideAll() {
  ['home-screen','create-screen','study-screen','result-screen']
    .forEach(id => document.getElementById(id).classList.add('hidden'));
}

// ── STATS ─────────────────────────────────────────
function updateStats() {
  document.getElementById('total-decks').textContent = decks.length;
  document.getElementById('total-cards').textContent = decks.reduce((a, d) => a + d.cards.length, 0);
  document.getElementById('total-learned').textContent = stats.learned;
}

// ── THEME ─────────────────────────────────────────
function toggleTheme() {
  isLight = !isLight;
  document.body.classList.toggle('light', isLight);
  document.querySelector('.theme-toggle').textContent = isLight ? '🌙 Dark' : '☀️ Light';
}

// ── CREATE DECK ───────────────────────────────────
function addCard() {
  const front = document.getElementById('card-front').value.trim();
  const back = document.getElementById('card-back').value.trim();
  const hint = document.getElementById('card-hint').value.trim();
  if (!front || !back) return showToast('Please fill question and answer!', 'error');
  tempCards.push({ front, back, hint });
  document.getElementById('card-front').value = '';
  document.getElementById('card-back').value = '';
  document.getElementById('card-hint').value = '';
  renderPreview();
}

function renderPreview() {
  const preview = document.getElementById('card-preview');
  preview.innerHTML = tempCards.map((c, i) => `
    <div class="preview-card">
      <span>Q: ${c.front} → A: ${c.back}${c.hint ? ` 💡 ${c.hint}` : ''}</span>
      <button onclick="removeCard(${i})">✕</button>
    </div>
  `).join('');
}

function removeCard(i) {
  tempCards.splice(i, 1);
  renderPreview();
}

function saveDeck() {
  const name = document.getElementById('deck-name').value.trim();
  const category = document.getElementById('deck-category').value;
  if (!name) return showToast('Please enter a deck name!', 'error');
  if (tempCards.length === 0) return showToast('Add at least one card!', 'error');
  decks.push({ name, category, cards: tempCards, created: Date.now() });
  saveDecks();
  showToast('Deck saved! 🎉');
  showHome();
}

// ── DECK LIST ─────────────────────────────────────
function renderDecks() {
  const list = document.getElementById('deck-list');
  if (decks.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;color:var(--subtext);margin-top:30px">
        <p style="font-size:3rem">📭</p>
        <p>No decks yet. Create one to get started!</p>
      </div>`;
    return;
  }
  list.innerHTML = decks.map((deck, i) => `
    <div class="deck-card">
      <div class="deck-info">
        <span>${deck.category || '📚'} ${deck.name}</span>
        <small>${deck.cards.length} cards${deck.lastScore !== undefined ? ` • Last score: ${deck.lastScore}%` : ''}</small>
      </div>
      <div class="deck-actions">
        <button onclick="startStudy(${i})">▶ Study</button>
        <button class="delete-btn" onclick="deleteDeck(${i})">🗑</button>
      </div>
    </div>
  `).join('');
}

function deleteDeck(i) {
  if (!confirm(`Delete "${decks[i].name}"?`)) return;
  decks.splice(i, 1);
  saveDecks();
  renderDecks();
  updateStats();
  showToast('Deck deleted');
}

// ── STUDY ─────────────────────────────────────────
function startStudy(index) {
  currentDeckIndex = index;
  const deck = decks[index];
  currentCards = [...deck.cards];
  if (document.getElementById('random-order').checked) {
    currentCards.sort(() => Math.random() - 0.5);
  }
  currentIndex = 0;
  score = 0;
  hideAll();
  document.getElementById('study-screen').classList.remove('hidden');
  document.getElementById('study-deck-name').textContent = deck.name;
  if (document.getElementById('show-timer').checked) startTimer();
  showCard();
}

function showCard() {
  const card = currentCards[currentIndex];
  document.getElementById('card-front-text').textContent = card.front;
  document.getElementById('card-back-text').textContent = card.back;
  const hintEl = document.getElementById('hint-text');
  hintEl.textContent = card.hint ? `💡 Hint: ${card.hint}` : '';
  document.getElementById('flashcard').classList.remove('flipped');
  document.getElementById('answer-buttons').classList.add('hidden');
  updateProgress();
}

function flipCard() {
  document.getElementById('flashcard').classList.toggle('flipped');
  document.getElementById('answer-buttons').classList.remove('hidden');
}

function answer(knew) {
  if (knew) { score++; stats.learned++; }
  currentIndex++;
  if (currentIndex >= currentCards.length) {
    saveDecks();
    showResult();
  } else {
    showCard();
  }
}

function updateProgress() {
  const pct = (currentIndex / currentCards.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent =
    `Card ${currentIndex + 1} of ${currentCards.length}`;
}

// ── TIMER ─────────────────────────────────────────
function startTimer() {
  timerSeconds = 0;
  document.getElementById('timer-display').classList.remove('hidden');
  timerInterval = setInterval(() => {
    timerSeconds++;
    document.getElementById('timer-count').textContent = timerSeconds;
  }, 1000);
}

function clearTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('timer-display')?.classList.add('hidden');
}

// ── RESULT ────────────────────────────────────────
function showResult() {
  clearTimer();
  hideAll();
  document.getElementById('result-screen').classList.remove('hidden');
  const pct = Math.round((score / currentCards.length) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 70 ? '🎯' : pct >= 40 ? '💪' : '📖';
  decks[currentDeckIndex].lastScore = pct;
  saveDecks();
  document.getElementById('result-text').textContent =
    `${emoji} ${score} / ${currentCards.length} correct! (${pct}%)`;
  document.getElementById('result-breakdown').innerHTML = `
    <span>✅ Knew: ${score}</span>
    <span>❌ Missed: ${currentCards.length - score}</span>
    ${timerSeconds ? `<span>⏱️ Time: ${timerSeconds}s</span>` : ''}
  `;
}

function restartDeck() {
  startStudy(currentDeckIndex);
}

// ── HELP ──────────────────────────────────────────
function showHelp() { document.getElementById('help-modal').classList.remove('hidden'); }
function closeHelp() { document.getElementById('help-modal').classList.add('hidden'); }

// ── TOAST ─────────────────────────────────────────
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? '#e74c3c' : '#2ecc71';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── KEYBOARD ──────────────────────────────────────
document.addEventListener('keydown', e => {
  const studyVisible = !document.getElementById('study-screen').classList.contains('hidden');
  if (!studyVisible) return;
  const flipped = document.getElementById('flashcard').classList.contains('flipped');
  if (e.code === 'Space') { e.preventDefault(); flipCard(); }
  if (flipped) {
    if (e.key === 'ArrowRight') answer(true);
    if (e.key === 'ArrowLeft') answer(false);
  }
});

// ── INIT ──────────────────────────────────────────
showHome();