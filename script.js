/* ══════════════════════════════════════════
   MEMORA — Enhanced Flashcard App Logic
   Features: AI generation, Spaced Repetition (SM-2),
   Multiple study modes, Analytics, Confetti, QR, Import/Export
══════════════════════════════════════════ */

/* ── STATE ── */
let decks = JSON.parse(localStorage.getItem('decks')) || [];
let stats = JSON.parse(localStorage.getItem('stats')) || { learned: 0, sessions: 0, totalCorrect: 0, totalAnswered: 0 };
let activityLog = JSON.parse(localStorage.getItem('activityLog')) || {};
let cardHistory = JSON.parse(localStorage.getItem('cardHistory')) || {};

let currentCards = [];
let currentIndex = 0;
let sessionCorrect = 0;
let sessionTotal = 0;
let tempCards = [];
let currentDeckIndex = -1;
let editingDeckIndex = -1;
let timerInterval = null;
let timerSeconds = 0;
let isLight = false;
let currentMode = 'flip';
let selectedColor = '#e94560';
let currentIODeckIndex = -1;
let dueCardDeckIndex = -1;

/* ── PERSIST ── */
function saveAll() {
  localStorage.setItem('decks', JSON.stringify(decks));
  localStorage.setItem('stats', JSON.stringify(stats));
  localStorage.setItem('activityLog', JSON.stringify(activityLog));
  localStorage.setItem('cardHistory', JSON.stringify(cardHistory));
}

/* ══════════════════════════════════════
   NAVIGATION
══════════════════════════════════════ */
function navTo(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.screen === screen);
  });
  clearTimer();

  if (screen === 'home') {
    document.getElementById('home-screen').classList.add('active');
    renderDecks();
    updateStats();
    renderDueBanner();
  } else if (screen === 'create') {
    document.getElementById('create-screen').classList.add('active');
    if (editingDeckIndex === -1) resetCreateForm();
  } else if (screen === 'analytics') {
    document.getElementById('analytics-screen').classList.add('active');
    renderAnalytics();
  }
}

/* ══════════════════════════════════════
   STATS & HOME
══════════════════════════════════════ */
function updateStats() {
  document.getElementById('total-decks').textContent = decks.length;
  document.getElementById('total-cards').textContent = decks.reduce((a, d) => a + d.cards.length, 0);
  document.getElementById('total-learned').textContent = stats.learned;
  document.getElementById('streak-count').textContent = getStreak();
}

function getStreak() {
  let streak = 0;
  const today = todayKey();
  let d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (activityLog[key]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function todayKey() { return new Date().toISOString().slice(0, 10); }

function logActivity() {
  activityLog[todayKey()] = (activityLog[todayKey()] || 0) + 1;
  saveAll();
}

/* ── DUE TODAY BANNER (Spaced Repetition) ── */
function renderDueBanner() {
  let total = 0;
  decks.forEach(deck => {
    deck.cards.forEach(card => {
      if (isDueToday(card)) total++;
    });
  });
  const banner = document.getElementById('due-today-banner');
  if (total > 0) {
    document.getElementById('due-count').textContent = total;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function isDueToday(card) {
  if (!card.nextReview) return false;
  return new Date(card.nextReview) <= new Date();
}

function studyDueCards() {
  // Find first deck with due cards
  for (let i = 0; i < decks.length; i++) {
    const hasDue = decks[i].cards.some(c => isDueToday(c));
    if (hasDue) {
      dueCardDeckIndex = i;
      startStudy(i, true);
      return;
    }
  }
}

/* ══════════════════════════════════════
   THEME
══════════════════════════════════════ */
function toggleTheme() {
  isLight = !isLight;
  document.body.classList.toggle('light', isLight);
  document.getElementById('theme-label').textContent = isLight ? 'Light Mode' : 'Dark Mode';
  const icon = document.getElementById('theme-icon');
  icon.innerHTML = isLight
    ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
    : '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
}

/* ══════════════════════════════════════
   COLOR PICKER
══════════════════════════════════════ */
document.getElementById('color-picker').addEventListener('click', e => {
  const dot = e.target.closest('.color-dot');
  if (!dot) return;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
  dot.classList.add('selected');
  selectedColor = dot.dataset.color;
});

/* ══════════════════════════════════════
   CREATE / EDIT DECK
══════════════════════════════════════ */
function resetCreateForm() {
  editingDeckIndex = -1;
  tempCards = [];
  selectedColor = '#e94560';
  document.getElementById('create-title').textContent = 'Create Deck';
  document.getElementById('deck-name').value = '';
  document.getElementById('deck-category').value = '';
  document.getElementById('card-front').value = '';
  document.getElementById('card-back').value = '';
  document.getElementById('card-hint').value = '';
  document.getElementById('card-preview').innerHTML = '';
  document.querySelectorAll('.color-dot').forEach((d, i) => d.classList.toggle('selected', i === 0));
  cancelEditCard();
}

function addCard() {
  const front = document.getElementById('card-front').value.trim();
  const back = document.getElementById('card-back').value.trim();
  const hint = document.getElementById('card-hint').value.trim();
  if (!front || !back) return showToast('Please fill question and answer!', 'error');

  const editIdx = parseInt(document.getElementById('edit-card-index').value);

  if (editIdx >= 0) {
    tempCards[editIdx] = { ...tempCards[editIdx], front, back, hint };
    cancelEditCard();
    showToast('Card updated ✓');
  } else {
    tempCards.push({ front, back, hint, ease: 2.5, interval: 0, repetitions: 0, nextReview: null });
    showToast('Card added ✓');
  }

  document.getElementById('card-front').value = '';
  document.getElementById('card-back').value = '';
  document.getElementById('card-hint').value = '';
  renderPreview();
}

function editCard(i) {
  const card = tempCards[i];
  document.getElementById('card-front').value = card.front;
  document.getElementById('card-back').value = card.back;
  document.getElementById('card-hint').value = card.hint || '';
  document.getElementById('edit-card-index').value = i;
  document.getElementById('card-form-heading').textContent = 'Edit Card';
  document.getElementById('add-card-btn').textContent = '✏️ Update Card';
  document.getElementById('cancel-edit-btn').classList.remove('hidden');
  document.getElementById('card-front').focus();
}

function cancelEditCard() {
  document.getElementById('edit-card-index').value = -1;
  document.getElementById('card-form-heading').textContent = 'Add Card';
  document.getElementById('add-card-btn').textContent = '➕ Add Card';
  document.getElementById('cancel-edit-btn').classList.add('hidden');
  document.getElementById('card-front').value = '';
  document.getElementById('card-back').value = '';
  document.getElementById('card-hint').value = '';
}

function removeCard(i) {
  tempCards.splice(i, 1);
  renderPreview();
}

function renderPreview() {
  const preview = document.getElementById('card-preview');
  if (!tempCards.length) { preview.innerHTML = ''; return; }
  preview.innerHTML = `
    <div style="margin-bottom:8px;font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;">${tempCards.length} card${tempCards.length !== 1 ? 's' : ''}</div>
    ${tempCards.map((c, i) => `
      <div class="preview-card">
        <div class="preview-text">
          <span class="preview-q">${escHtml(c.front)}</span>
          <span style="color:var(--text-3);margin:0 6px">→</span>
          ${escHtml(c.back)}
          ${c.hint ? `<span style="color:var(--text-3);margin-left:6px">💡 ${escHtml(c.hint)}</span>` : ''}
        </div>
        <div class="preview-card-actions">
          <button class="btn-ghost" onclick="editCard(${i})">✏️</button>
          <button class="btn-delete" onclick="removeCard(${i})">✕</button>
        </div>
      </div>
    `).join('')}
  `;
}

function saveDeck() {
  const name = document.getElementById('deck-name').value.trim();
  const category = document.getElementById('deck-category').value;
  if (!name) return showToast('Please enter a deck name!', 'error');
  if (!tempCards.length) return showToast('Add at least one card!', 'error');

  const deckObj = { name, category, color: selectedColor, cards: tempCards, created: Date.now() };

  if (editingDeckIndex >= 0) {
    deckObj.lastScore = decks[editingDeckIndex].lastScore;
    deckObj.sessionHistory = decks[editingDeckIndex].sessionHistory || [];
    decks[editingDeckIndex] = deckObj;
    showToast('Deck updated! 🎉');
  } else {
    deckObj.sessionHistory = [];
    decks.push(deckObj);
    showToast('Deck saved! 🎉');
  }

  saveAll();
  editingDeckIndex = -1;
  navTo('home');
}

function openEditDeck(i) {
  editingDeckIndex = i;
  const deck = decks[i];
  tempCards = deck.cards.map(c => ({ ...c }));
  selectedColor = deck.color || '#e94560';
  document.getElementById('create-title').textContent = 'Edit Deck';
  document.getElementById('deck-name').value = deck.name;
  document.getElementById('deck-category').value = deck.category || '';
  document.querySelectorAll('.color-dot').forEach(d => {
    d.classList.toggle('selected', d.dataset.color === selectedColor);
  });
  renderPreview();
  document.getElementById('create-screen').classList.add('active');
  document.getElementById('home-screen').classList.remove('active');
}

/* ══════════════════════════════════════
   AI CARD GENERATION
══════════════════════════════════════ */
async function generateCards() {
  const topic = document.getElementById('ai-topic').value.trim();
  const count = document.getElementById('ai-count').value;
  if (!topic) return showToast('Enter a topic first!', 'error');

  const btn = document.getElementById('ai-btn');
  const status = document.getElementById('ai-status');
  btn.disabled = true;
  btn.textContent = '⏳ Generating…';
  status.classList.remove('hidden');
  status.textContent = `✨ Generating ${count} cards about "${topic}"…`;

  const prompt = `Generate exactly ${count} flashcards about: "${topic}".
Return ONLY a valid JSON array, no markdown, no explanation.
Each object: {"front": "question", "back": "answer", "hint": "short hint or empty string"}
Keep answers concise (under 15 words). Questions should be specific and testable.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error('API error ' + response.status);

    const data = await response.json();
    let text = data.content.map(b => b.text || '').join('');
    text = text.replace(/```json|```/g, '').trim();
    const cards = JSON.parse(text);

    if (!Array.isArray(cards)) throw new Error('Invalid response format');

    cards.forEach(c => {
      if (c.front && c.back) {
        tempCards.push({
          front: c.front.trim(),
          back: c.back.trim(),
          hint: (c.hint || '').trim(),
          ease: 2.5, interval: 0, repetitions: 0, nextReview: null
        });
      }
    });

    renderPreview();
    status.textContent = `✅ Added ${cards.length} cards! Review and save your deck.`;
    if (!document.getElementById('deck-name').value) {
      document.getElementById('deck-name').value = topic;
    }
    showToast(`${cards.length} cards generated! ✨`);
  } catch (err) {
    console.error(err);
    status.textContent = '❌ Generation failed. Check your connection and try again.';
    showToast('AI generation failed', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg> Generate';
  }
}

/* ══════════════════════════════════════
   DECK LIST
══════════════════════════════════════ */
function renderDecks(filterText = '', filterCat = '') {
  const list = document.getElementById('deck-list');
  let filtered = decks.filter((d, i) => {
    const matchText = !filterText || d.name.toLowerCase().includes(filterText.toLowerCase());
    const matchCat = !filterCat || d.category === filterCat;
    return matchText && matchCat;
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>${decks.length === 0 ? 'No decks yet' : 'No results'}</h3>
      <p>${decks.length === 0 ? 'Create your first deck to get started!' : 'Try a different search term.'}</p>
    </div>`;
    return;
  }

  list.innerHTML = `<div class="deck-grid">${filtered.map((deck) => {
    const realIdx = decks.indexOf(deck);
    const dueCount = deck.cards.filter(c => isDueToday(c)).length;
    return `
      <div class="deck-card" style="--deck-color:${deck.color || '#e94560'}">
        <div class="deck-icon" style="background:${deck.color || '#e94560'};opacity:0.18;"></div>
        <div class="deck-info">
          <div class="deck-name">${escHtml(deck.category ? deck.category + ' ' : '')}${escHtml(deck.name)}</div>
          <div class="deck-meta">
            <span>${deck.cards.length} cards</span>
            ${deck.lastScore !== undefined ? `<span class="deck-score">${deck.lastScore}%</span>` : ''}
            ${dueCount > 0 ? `<span style="color:var(--accent);font-weight:500">📅 ${dueCount} due</span>` : ''}
          </div>
        </div>
        <div class="deck-actions">
          <button class="btn-study" onclick="startStudy(${realIdx})">▶ Study</button>
          <button class="btn-edit" onclick="openEditDeck(${realIdx})">✏️</button>
          <button class="btn-io" onclick="openIOModal(${realIdx})">⇅</button>
          <button class="btn-delete" onclick="deleteDeck(${realIdx})">🗑</button>
        </div>
      </div>`;
  }).join('')}</div>`;
}

function filterDecks() {
  const text = document.getElementById('search-input').value;
  const cat = document.getElementById('filter-category').value;
  renderDecks(text, cat);
}

function deleteDeck(i) {
  if (!confirm(`Delete "${decks[i].name}"?`)) return;
  decks.splice(i, 1);
  saveAll();
  renderDecks();
  updateStats();
  showToast('Deck deleted');
}

/* ══════════════════════════════════════
   STUDY SESSION
══════════════════════════════════════ */
function startStudy(index, dueOnly = false) {
  currentDeckIndex = index;
  const deck = decks[index];

  currentCards = dueOnly
    ? deck.cards.filter(c => isDueToday(c)).map((c, i) => ({ ...c, _origIdx: deck.cards.indexOf(c) }))
    : deck.cards.map((c, i) => ({ ...c, _origIdx: i }));

  if (!currentCards.length) return showToast('No cards to study!', 'error');

  if (document.getElementById('random-order').checked) {
    currentCards.sort(() => Math.random() - 0.5);
  }

  currentIndex = 0;
  sessionCorrect = 0;
  sessionTotal = 0;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('study-screen').classList.add('active');
  document.getElementById('study-deck-name').textContent = deck.name;

  if (document.getElementById('show-timer').checked) startTimer();
  setMode(currentMode, true);
  showCard();
}

function setMode(mode, silent = false) {
  currentMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  document.getElementById('mode-flip').classList.toggle('hidden', mode !== 'flip');
  document.getElementById('mode-quiz').classList.toggle('hidden', mode !== 'quiz');
  document.getElementById('mode-type').classList.toggle('hidden', mode !== 'type');
  if (!silent && currentCards.length) showCard();
}

function showCard() {
  updateProgress();
  const card = currentCards[currentIndex];

  if (currentMode === 'flip') {
    document.getElementById('card-front-text').textContent = card.front;
    document.getElementById('card-back-text').textContent = card.back;
    document.getElementById('hint-text').textContent = card.hint ? `💡 ${card.hint}` : '';
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('answer-buttons').classList.add('hidden');

  } else if (currentMode === 'quiz') {
    document.getElementById('quiz-question').textContent = card.front;
    const choices = buildChoices(card);
    document.getElementById('quiz-choices').innerHTML = choices.map(ch => `
      <button class="quiz-choice" onclick="quizAnswer(this, '${escHtml(ch)}', '${escHtml(card.back)}')">${escHtml(ch)}</button>
    `).join('');

  } else if (currentMode === 'type') {
    document.getElementById('type-question').textContent = card.front;
    document.getElementById('type-answer-input').value = '';
    document.getElementById('type-feedback').classList.add('hidden');
    document.getElementById('type-feedback').className = 'type-feedback hidden';
    setTimeout(() => document.getElementById('type-answer-input').focus(), 100);
  }
}

function buildChoices(card) {
  const wrong = currentCards
    .filter(c => c.back !== card.back)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => c.back);
  const all = [...wrong, card.back].sort(() => Math.random() - 0.5);
  return all;
}

function flipCard() {
  document.getElementById('flashcard').classList.toggle('flipped');
  document.getElementById('answer-buttons').classList.remove('hidden');
}

/* answer: quality 0=miss, 1=vague, 2=know */
function answer(quality) {
  sessionTotal++;
  if (quality >= 1) sessionCorrect++;
  if (quality === 2) stats.learned++;

  // SM-2 spaced repetition
  const card = currentCards[currentIndex];
  const origIdx = card._origIdx;
  if (origIdx !== undefined) {
    applySpacedRepetition(decks[currentDeckIndex].cards[origIdx], quality);
  }

  trackCardHistory(currentDeckIndex, currentIndex, quality >= 1);
  logActivity();
  advance();
}

function applySpacedRepetition(card, quality) {
  // SM-2 algorithm
  card.repetitions = card.repetitions || 0;
  card.ease = card.ease || 2.5;
  card.interval = card.interval || 0;

  if (quality < 1) {
    card.repetitions = 0;
    card.interval = 1;
  } else {
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.ease);
    card.repetitions++;
  }

  card.ease = Math.max(1.3, card.ease + 0.1 - (2 - quality) * (0.08 + (2 - quality) * 0.02));

  const next = new Date();
  next.setDate(next.getDate() + card.interval);
  card.nextReview = next.toISOString();
}

function trackCardHistory(deckIdx, cardIdx, correct) {
  const key = `${deckIdx}-${cardIdx}`;
  if (!cardHistory[key]) cardHistory[key] = { correct: 0, total: 0, front: currentCards[cardIdx]?.front || '' };
  cardHistory[key].total++;
  if (correct) cardHistory[key].correct++;
  cardHistory[key].front = currentCards[cardIdx]?.front || '';
}

function advance() {
  currentIndex++;
  if (currentIndex >= currentCards.length) {
    stats.sessions = (stats.sessions || 0) + 1;
    stats.totalCorrect = (stats.totalCorrect || 0) + sessionCorrect;
    stats.totalAnswered = (stats.totalAnswered || 0) + sessionTotal;
    const pct = Math.round((sessionCorrect / sessionTotal) * 100);
    decks[currentDeckIndex].lastScore = pct;
    decks[currentDeckIndex].sessionHistory = decks[currentDeckIndex].sessionHistory || [];
    decks[currentDeckIndex].sessionHistory.push({ pct, date: todayKey() });
    saveAll();
    showResult();
  } else {
    showCard();
  }
}

/* ── QUIZ ANSWER ── */
function quizAnswer(btn, chosen, correct) {
  const btns = document.querySelectorAll('.quiz-choice');
  btns.forEach(b => b.disabled = true);
  const isCorrect = chosen === correct;
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    btns.forEach(b => { if (b.textContent === correct) b.classList.add('correct'); });
  }
  sessionTotal++;
  if (isCorrect) { sessionCorrect++; stats.learned++; }
  trackCardHistory(currentDeckIndex, currentIndex, isCorrect);
  logActivity();
  setTimeout(() => advance(), 900);
}

/* ── TYPE ANSWER ── */
function checkTypeAnswer() {
  const input = document.getElementById('type-answer-input').value.trim().toLowerCase();
  const correct = currentCards[currentIndex].back.trim().toLowerCase();
  const isCorrect = input === correct || levenshtein(input, correct) <= 2;

  const fb = document.getElementById('type-feedback');
  fb.classList.remove('hidden', 'correct', 'wrong');
  fb.classList.add(isCorrect ? 'correct' : 'wrong');
  fb.textContent = isCorrect
    ? '✓ Correct!'
    : `✕ Answer: ${currentCards[currentIndex].back}`;

  sessionTotal++;
  if (isCorrect) { sessionCorrect++; stats.learned++; }
  trackCardHistory(currentDeckIndex, currentIndex, isCorrect);
  logActivity();
  setTimeout(() => advance(), 1200);
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

function updateProgress() {
  const pct = (currentIndex / currentCards.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${currentIndex + 1} / ${currentCards.length}`;
}

/* ══════════════════════════════════════
   TIMER
══════════════════════════════════════ */
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
  const el = document.getElementById('timer-display');
  if (el) el.classList.add('hidden');
}

/* ══════════════════════════════════════
   RESULT SCREEN
══════════════════════════════════════ */
function showResult() {
  clearTimer();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('result-screen').classList.add('active');

  const pct = Math.round((sessionCorrect / sessionTotal) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🎯' : pct >= 60 ? '💪' : pct >= 40 ? '📖' : '🔁';

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-headline').textContent =
    pct === 100 ? 'Perfect Score!' : pct >= 80 ? 'Great Job!' : pct >= 50 ? 'Keep Going!' : 'Keep Practicing!';
  document.getElementById('result-text').textContent = `${sessionCorrect} / ${sessionTotal} correct — ${pct}%`;

  document.getElementById('result-breakdown').innerHTML = `
    <div class="result-stat"><span class="result-stat-val" style="color:var(--know)">${sessionCorrect}</span><span class="result-stat-lbl">Correct</span></div>
    <div class="result-stat"><span class="result-stat-val" style="color:var(--miss)">${sessionTotal - sessionCorrect}</span><span class="result-stat-lbl">Missed</span></div>
    <div class="result-stat"><span class="result-stat-val">${pct}%</span><span class="result-stat-lbl">Score</span></div>
    ${timerSeconds ? `<div class="result-stat"><span class="result-stat-val">${timerSeconds}s</span><span class="result-stat-lbl">Time</span></div>` : ''}
  `;

  if (pct === 100) spawnConfetti();
}

function restartDeck() { startStudy(currentDeckIndex); }

/* ══════════════════════════════════════
   CONFETTI
══════════════════════════════════════ */
function spawnConfetti() {
  const colors = ['#e94560','#a855f7','#3b82f6','#10b981','#f59e0b','#ec4899'];
  const container = document.getElementById('confetti-container');
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.8}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

/* ══════════════════════════════════════
   ANALYTICS
══════════════════════════════════════ */
function renderAnalytics() {
  const streak = getStreak();
  const totalAnswered = stats.totalAnswered || 0;
  const accuracy = totalAnswered > 0 ? Math.round((stats.totalCorrect / totalAnswered) * 100) : 0;

  document.getElementById('a-sessions').textContent = stats.sessions || 0;
  document.getElementById('a-accuracy').textContent = accuracy + '%';
  document.getElementById('a-streak').textContent = streak;
  document.getElementById('a-mastered').textContent = stats.learned || 0;

  renderHeatmap();
  renderDeckPerformance();
  renderWeakCards();
}

function renderHeatmap() {
  const container = document.getElementById('heatmap');
  const cells = [];
  const today = new Date();
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = activityLog[key] || 0;
    const level = count === 0 ? 0 : count < 3 ? 1 : count < 7 ? 2 : count < 15 ? 3 : 4;
    cells.push(`<div class="heat-cell heat-${level}" title="${key}: ${count} answers"></div>`);
  }
  container.innerHTML = cells.join('');
}

function renderDeckPerformance() {
  const container = document.getElementById('deck-performance');
  if (!decks.length) { container.innerHTML = '<p style="color:var(--text-3);font-size:14px">No decks yet.</p>'; return; }
  container.innerHTML = decks.map(deck => {
    const pct = deck.lastScore !== undefined ? deck.lastScore : 0;
    return `
      <div class="deck-perf-row">
        <span class="deck-perf-name">${escHtml(deck.name)}</span>
        <div class="deck-perf-bar-wrap">
          <div class="deck-perf-bar-bg">
            <div class="deck-perf-bar-fill" style="width:${pct}%;background:${deck.color || 'var(--accent)'}"></div>
          </div>
        </div>
        <span class="deck-perf-pct">${deck.lastScore !== undefined ? pct + '%' : '—'}</span>
      </div>`;
  }).join('');
}

function renderWeakCards() {
  const container = document.getElementById('weak-cards');
  const weak = Object.values(cardHistory)
    .filter(c => c.total >= 2)
    .map(c => ({ ...c, rate: Math.round((c.correct / c.total) * 100) }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 8);

  if (!weak.length) { container.innerHTML = '<p style="color:var(--text-3);font-size:14px">Study more cards to see weak areas.</p>'; return; }
  container.innerHTML = weak.map(c => `
    <div class="weak-card-item">
      <span class="weak-card-q">${escHtml(c.front)}</span>
      <span class="weak-card-rate">${c.rate}%</span>
    </div>
  `).join('');
}

function exportStats() {
  let csv = 'Deck,Last Score,Cards\n';
  decks.forEach(d => {
    csv += `"${d.name}",${d.lastScore ?? ''},"${d.cards.length}"\n`;
  });
  csv += `\nTotal Sessions,${stats.sessions || 0}\n`;
  csv += `Mastered Cards,${stats.learned || 0}\n`;
  csv += `Accuracy,${stats.totalAnswered ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0}%\n`;
  downloadText(csv, 'memora-stats.csv', 'text/csv');
  showToast('Stats exported ✓');
}

/* ══════════════════════════════════════
   IMPORT / EXPORT / SHARE
══════════════════════════════════════ */
function openIOModal(deckIdx) {
  currentIODeckIndex = deckIdx;
  document.getElementById('qr-container').classList.add('hidden');
  document.getElementById('qr-container').innerHTML = '';
  document.getElementById('io-modal').classList.remove('hidden');
}

function closeIOModal() { document.getElementById('io-modal').classList.add('hidden'); }

function exportDeck() {
  const deck = decks[currentIODeckIndex];
  downloadText(JSON.stringify(deck, null, 2), `${deck.name}.json`, 'application/json');
  showToast('Deck exported ✓');
}

function importDeck(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const deck = JSON.parse(e.target.result);
      if (!deck.name || !Array.isArray(deck.cards)) throw new Error('Invalid');
      deck.created = Date.now();
      decks.push(deck);
      saveAll();
      renderDecks();
      updateStats();
      closeIOModal();
      showToast('Deck imported! 🎉');
    } catch {
      showToast('Invalid deck file', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function shareDeck() {
  const deck = decks[currentIODeckIndex];
  const data = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(deck)))));
  const url = `${location.origin}${location.pathname}?deck=${data}`;
  navigator.clipboard.writeText(url).then(() => showToast('Link copied! 📋'));
}

function showQR() {
  const deck = decks[currentIODeckIndex];
  const data = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(deck)))));
  const url = `${location.origin}${location.pathname}?deck=${data}`;
  const container = document.getElementById('qr-container');
  container.classList.remove('hidden');
  container.innerHTML = '';
  new QRCode(container, { text: url, width: 160, height: 160 });
}

function checkImportFromURL() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('deck');
  if (!raw) return;
  try {
    const deck = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw)))));
    if (deck.name && deck.cards) {
      deck.created = Date.now();
      decks.push(deck);
      saveAll();
      showToast(`Imported "${deck.name}" 🎉`);
      history.replaceState({}, '', location.pathname);
    }
  } catch (e) { console.warn('URL import failed', e); }
}

function downloadText(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ══════════════════════════════════════
   HELP MODAL
══════════════════════════════════════ */
function showHelp() { document.getElementById('help-modal').classList.remove('hidden'); }
function closeHelp() { document.getElementById('help-modal').classList.add('hidden'); }

/* ══════════════════════════════════════
   TOAST
══════════════════════════════════════ */
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ══════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  const studyActive = document.getElementById('study-screen').classList.contains('active');
  if (!studyActive) return;

  if (currentMode === 'flip') {
    const flipped = document.getElementById('flashcard').classList.contains('flipped');
    if (e.code === 'Space') { e.preventDefault(); flipCard(); }
    if (flipped) {
      if (e.key === 'ArrowRight') answer(2);
      if (e.key === 'ArrowLeft') answer(0);
      if (e.key === 'ArrowDown') answer(1);
    }
  } else if (currentMode === 'type') {
    if (e.key === 'Enter') checkTypeAnswer();
  }
});

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
checkImportFromURL();
navTo('home');