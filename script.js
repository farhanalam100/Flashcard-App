/* ══════════════════════════════════════════
   FLASHCARDS — Complete App Logic
   Features: AI generation, Spaced Repetition (SM-2),
   Multiple study modes, Analytics, Confetti, QR,
   Import/Export, Pomodoro, Achievements, Sounds,
   CSV Import, Theme Picker
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
let currentMode = 'flip';
let selectedColor = '#2563eb';
let currentIODeckIndex = -1;
let dueCardDeckIndex = -1;
let manageMode = false;
let selectedDeckIndices = new Set();
let lastRenderedDeckIndices = [];

/* ── PERSIST ── */
function saveAll() {
  localStorage.setItem('decks', JSON.stringify(decks));
  localStorage.setItem('stats', JSON.stringify(stats));
  localStorage.setItem('activityLog', JSON.stringify(activityLog));
  localStorage.setItem('cardHistory', JSON.stringify(cardHistory));
}

function normalizeDeck(deck) {
  const s = { ...deck };
  s.id = s.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  s.name = String(s.name||'').trim();
  s.category = s.category||'';
  s.tags = Array.isArray(s.tags) ? Array.from(new Set(s.tags.map(t=>String(t||'').trim()).filter(Boolean))).slice(0,12) : [];
  s.color = s.color||'#2563eb';
  s.created = s.created||Date.now();
  s.sessionHistory = Array.isArray(s.sessionHistory)?s.sessionHistory:[];
  s.cards = Array.isArray(s.cards)?s.cards.map(c=>({
    front:String(c.front||'').trim(), back:String(c.back||'').trim(), hint:String(c.hint||'').trim(),
    ease:typeof c.ease==='number'?c.ease:2.5, interval:typeof c.interval==='number'?c.interval:0,
    repetitions:typeof c.repetitions==='number'?c.repetitions:0, nextReview:c.nextReview||null
  })).filter(c=>c.front&&c.back):[];
  return s;
}

/* ══════════════════════════════════════
   THEME SYSTEM
══════════════════════════════════════ */
const THEMES = [
  { id: 'default', name: 'Midnight Navy', desc: 'Default dark', dark: true, bg: '#0f172a', accent: '#2563eb', surface: '#111b2e', dots: ['#2563eb','#111b2e','#94a3b8'] },
  { id: 'black',   name: 'Pure Black',    desc: 'OLED friendly', dark: true, bg: '#0d0d0d', accent: '#a855f7', surface: '#161616', dots: ['#a855f7','#1a1a1a','#888'] },
  { id: 'forest',  name: 'Forest Night',  desc: 'Deep teal dark', dark: true, bg: '#0a1f1a', accent: '#10b981', surface: '#0f2920', dots: ['#10b981','#162535','#6ee7b7'] },
  { id: 'purple',  name: 'Deep Purple',   desc: 'Rich violet dark', dark: true, bg: '#0f0a1e', accent: '#a855f7', surface: '#160f2c', dots: ['#a855f7','#2d1b4e','#c4b5fd'] },
  { id: 'ember',   name: 'Ember',         desc: 'Warm amber dark', dark: true, bg: '#1a0a00', accent: '#f59e0b', surface: '#261200', dots: ['#f59e0b','#2d1a00','#fcd34d'] },
  { id: 'cosmos',  name: 'Cosmos',        desc: 'Blue-black space', dark: true, bg: '#060912', accent: '#60a5fa', surface: '#0b1020', dots: ['#60a5fa','#111827','#93c5fd'] },
  { id: 'paper',    name: 'Warm Paper',   desc: 'Cream notebook', dark: false, bg: '#fffbf5', accent: '#b45309', surface: '#fff8f0', dots: ['#b45309','#f5ede0','#78583a'], textDark: true },
  { id: 'arctic',   name: 'Arctic White', desc: 'Clean cool white', dark: false, bg: '#f8faff', accent: '#2563eb', surface: '#ffffff', dots: ['#2563eb','#eff6ff','#64748b'], textDark: true },
  { id: 'sage',     name: 'Sage Garden',  desc: 'Soft green light', dark: false, bg: '#f0fdf6', accent: '#16a34a', surface: '#ffffff', dots: ['#16a34a','#dcfce7','#4ade80'], textDark: true },
  { id: 'lavender', name: 'Lavender',     desc: 'Soft purple light', dark: false, bg: '#fdf4ff', accent: '#9333ea', surface: '#ffffff', dots: ['#9333ea','#f3e8ff','#c084fc'], textDark: true },
  { id: 'sunrise',  name: 'Sunrise',      desc: 'Warm orange light', dark: false, bg: '#fff7ed', accent: '#ea580c', surface: '#ffffff', dots: ['#ea580c','#ffedd5','#fb923c'], textDark: true },
  { id: 'ocean',    name: 'Ocean Mist',   desc: 'Sky blue light', dark: false, bg: '#f0f9ff', accent: '#0284c7', surface: '#ffffff', dots: ['#0284c7','#e0f2fe','#38bdf8'], textDark: true },
];

let currentTheme = localStorage.getItem('flashcards_theme') || 'default';

function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  document.body.className = document.body.className
    .split(' ')
    .filter(c => !c.startsWith('theme-'))
    .join(' ')
    .trim();
  if (themeId !== 'default') {
    document.body.classList.add(`theme-${themeId}`);
  }
  currentTheme = themeId;
  localStorage.setItem('flashcards_theme', themeId);
}

function openThemePicker() {
  document.getElementById('theme-modal').classList.remove('hidden');
  renderThemePicker();
}

function closeThemePicker() {
  document.getElementById('theme-modal').classList.add('hidden');
}

function renderThemePicker() {
  const darkContainer = document.getElementById('dark-themes');
  const lightContainer = document.getElementById('light-themes');
  const darkThemes = THEMES.filter(t => t.dark);
  const lightThemes = THEMES.filter(t => !t.dark);

  darkContainer.innerHTML = darkThemes.map(t => {
    const isActive = currentTheme === t.id;
    return `
      <button class="theme-card-btn ${isActive ? 'active-theme' : ''}"
        style="background:${t.bg};color:${t.textDark?'#1c1917':'#e2e8f0'};border-color:${isActive?'rgba(255,255,255,0.7)':'transparent'}"
        onclick="selectTheme('${t.id}')">
        ${isActive ? `<div class="tc-check" style="background:rgba(255,255,255,0.4)">✓</div>` : ''}
        <div class="tc-name" style="color:${t.textDark?'#1c1917':'#f1f5f9'}">${t.name}</div>
        <div class="tc-desc" style="color:${t.textDark?'#44403c':'#94a3b8'}">${t.desc}</div>
        <div class="tc-dots">
          ${t.dots.map(d => `<div class="tc-dot" style="background:${d}"></div>`).join('')}
        </div>
      </button>
    `;
  }).join('');

  lightContainer.innerHTML = lightThemes.map(t => {
    const isActive = currentTheme === t.id;
    return `
      <button class="theme-card-btn ${isActive ? 'active-theme-light' : ''}"
        style="background:${t.bg};color:#1c1917;border-color:${isActive?'rgba(0,0,0,0.4)':'rgba(0,0,0,0.12)'}"
        onclick="selectTheme('${t.id}')">
        ${isActive ? `<div class="tc-check" style="background:rgba(0,0,0,0.15);color:#333">✓</div>` : ''}
        <div class="tc-name" style="color:#1c1917">${t.name}</div>
        <div class="tc-desc" style="color:#78716c">${t.desc}</div>
        <div class="tc-dots">
          ${t.dots.map(d => `<div class="tc-dot" style="background:${d};border:1px solid rgba(0,0,0,0.1)"></div>`).join('')}
        </div>
      </button>
    `;
  }).join('');
}

function selectTheme(themeId) {
  applyTheme(themeId);
  renderThemePicker();
  showToast('Theme applied! 🎨');
}

/* ══════════════════════════════════════
   NAVIGATION
══════════════════════════════════════ */
function navTo(screen) {
  if (screen === 'pomodoro') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item, .top-nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === screen));
    document.getElementById('pomodoro-screen').classList.add('active');
    setPomoMode('focus');
    return;
  }
  if (screen === 'achievements') {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item, .top-nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === screen));
    document.getElementById('achievements-screen').classList.add('active');
    renderAchievements();
    return;
  }
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item, .top-nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === screen));
  clearTimer();
  if (screen !== 'home') { manageMode = false; selectedDeckIndices.clear(); updateBulkUI(); }
  if (screen === 'home') {
    document.getElementById('home-screen').classList.add('active');
    renderDecks(); updateStats(); renderDueBanner();
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
  document.getElementById('total-cards').textContent = decks.reduce((a,d)=>a+d.cards.length,0);
  document.getElementById('total-learned').textContent = stats.learned;
  document.getElementById('streak-count').textContent = getStreak();
  refreshTagFilterOptions(); updateBulkUI();
}
function getStreak() {
  let streak=0,d=new Date();
  while(true){const key=d.toISOString().slice(0,10);if(activityLog[key]){streak++;d.setDate(d.getDate()-1)}else break;}
  return streak;
}
function todayKey(){return new Date().toISOString().slice(0,10)}
function logActivity(){activityLog[todayKey()]=(activityLog[todayKey()]||0)+1;saveAll()}
function renderDueBanner(){
  let total=0;decks.forEach(deck=>deck.cards.forEach(card=>{if(isDueToday(card))total++}));
  const banner=document.getElementById('due-today-banner');
  if(total>0){document.getElementById('due-count').textContent=total;banner.classList.remove('hidden')}
  else banner.classList.add('hidden');
}
function isDueToday(card){if(!card.nextReview)return false;return new Date(card.nextReview)<=new Date()}
function studyDueCards(){for(let i=0;i<decks.length;i++){if(decks[i].cards.some(c=>isDueToday(c))){startStudy(i,true);return}}}

/* ══════════════════════════════════════
   COLOR PICKER
══════════════════════════════════════ */
document.getElementById('color-picker').addEventListener('click',e=>{
  const dot=e.target.closest('.color-dot');if(!dot)return;
  document.querySelectorAll('.color-dot').forEach(d=>d.classList.remove('selected'));
  dot.classList.add('selected');selectedColor=dot.dataset.color;
});

/* ══════════════════════════════════════
   CREATE / EDIT DECK
══════════════════════════════════════ */
function resetCreateForm(){
  editingDeckIndex=-1;tempCards=[];selectedColor='#2563eb';
  document.getElementById('create-title').textContent='Create Deck';
  document.getElementById('deck-name').value='';
  document.getElementById('deck-category').value='';
  document.getElementById('deck-tags').value='';
  document.getElementById('card-front').value='';
  document.getElementById('card-back').value='';
  document.getElementById('card-hint').value='';
  document.getElementById('card-preview').innerHTML='';
  document.querySelectorAll('.color-dot').forEach((d,i)=>d.classList.toggle('selected',i===0));
  cancelEditCard();
}
function addCard(){
  const front=document.getElementById('card-front').value.trim();
  const back=document.getElementById('card-back').value.trim();
  const hint=document.getElementById('card-hint').value.trim();
  if(!front||!back)return showToast('Please fill question and answer!','error');
  const editIdx=parseInt(document.getElementById('edit-card-index').value);
  if(editIdx>=0){tempCards[editIdx]={...tempCards[editIdx],front,back,hint};cancelEditCard();showToast('Card updated ✓')}
  else{tempCards.push({front,back,hint,ease:2.5,interval:0,repetitions:0,nextReview:null});showToast('Card added ✓');playSound('click')}
  document.getElementById('card-front').value='';
  document.getElementById('card-back').value='';
  document.getElementById('card-hint').value='';
  renderPreview();
}
function editCard(i){
  const card=tempCards[i];
  document.getElementById('card-front').value=card.front;
  document.getElementById('card-back').value=card.back;
  document.getElementById('card-hint').value=card.hint||'';
  document.getElementById('edit-card-index').value=i;
  document.getElementById('card-form-heading').textContent='Edit Card';
  document.getElementById('add-card-btn').textContent='✏️ Update Card';
  document.getElementById('cancel-edit-btn').classList.remove('hidden');
  document.getElementById('card-front').focus();
}
function cancelEditCard(){
  document.getElementById('edit-card-index').value=-1;
  document.getElementById('card-form-heading').textContent='Add Card';
  document.getElementById('add-card-btn').textContent='➕ Add Card';
  document.getElementById('cancel-edit-btn').classList.add('hidden');
  document.getElementById('card-front').value='';
  document.getElementById('card-back').value='';
  document.getElementById('card-hint').value='';
}
function removeCard(i){tempCards.splice(i,1);renderPreview()}
function renderPreview(){
  const preview=document.getElementById('card-preview');
  if(!tempCards.length){preview.innerHTML='';return}
  preview.innerHTML=`<div style="margin-bottom:8px;font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em">${tempCards.length} card${tempCards.length!==1?'s':''}</div>
  ${tempCards.map((c,i)=>`<div class="preview-card"><div class="preview-text"><span class="preview-q">${escHtml(c.front)}</span><span style="color:var(--text-3);margin:0 6px">→</span>${escHtml(c.back)}${c.hint?`<span style="color:var(--text-3);margin-left:6px">💡 ${escHtml(c.hint)}</span>`:''}</div><div class="preview-card-actions"><button class="btn-ghost" onclick="editCard(${i})">✏️</button><button class="btn-delete" onclick="removeCard(${i})">✕</button></div></div>`).join('')}`;
}
function saveDeck(){
  const name=document.getElementById('deck-name').value.trim();
  const category=document.getElementById('deck-category').value;
  const tagsRaw=(document.getElementById('deck-tags')?.value||'').trim();
  if(!name)return showToast('Please enter a deck name!','error');
  if(!tempCards.length)return showToast('Add at least one card!','error');
  const tags=tagsRaw?Array.from(new Set(tagsRaw.split(',').map(t=>t.trim()).filter(Boolean))).slice(0,12):[];
  const deckObj={name,category,tags,color:selectedColor,cards:tempCards.map(c=>({...c})),created:Date.now()};
  if(editingDeckIndex>=0){
    deckObj.id=decks[editingDeckIndex].id;deckObj.created=decks[editingDeckIndex].created||deckObj.created;
    deckObj.lastScore=decks[editingDeckIndex].lastScore;deckObj.sessionHistory=decks[editingDeckIndex].sessionHistory||[];
    decks[editingDeckIndex]=deckObj;showToast('Deck updated! 🎉');
  }else{deckObj.sessionHistory=[];decks.push(deckObj);showToast('Deck saved! 🎉');playSound('levelup')}
  saveAll();editingDeckIndex=-1;checkAchievements();navTo('home');
}
function openEditDeck(i){
  editingDeckIndex=i;const deck=decks[i];tempCards=deck.cards.map(c=>({...c}));selectedColor=deck.color||'#2563eb';
  document.getElementById('create-title').textContent='Edit Deck';
  document.getElementById('deck-name').value=deck.name;
  document.getElementById('deck-category').value=deck.category||'';
  document.getElementById('deck-tags').value=Array.isArray(deck.tags)?deck.tags.join(', '):'';
  document.querySelectorAll('.color-dot').forEach(d=>d.classList.toggle('selected',d.dataset.color===selectedColor));
  renderPreview();
  document.getElementById('create-screen').classList.add('active');
  document.getElementById('home-screen').classList.remove('active');
}

/* ══════════════════════════════════════
   AI CARD GENERATION
══════════════════════════════════════ */
async function generateCards(){
  const topic=document.getElementById('ai-topic').value.trim();
  const count=parseInt(document.getElementById('ai-count').value,10);
  if(!topic)return showToast('Enter a topic first!','error');
  const btn=document.getElementById('ai-btn');const status=document.getElementById('ai-status');
  btn.disabled=true;btn.textContent='⏳ Generating…';
  status.classList.remove('hidden');status.textContent=`✨ Generating ${count} cards about "${topic}"…`;
  const prompt=`Generate exactly ${count} flashcards about: "${topic}". Return ONLY a valid JSON array, no markdown. Each object: {"front":"question","back":"answer","hint":"short hint or empty string"} Keep answers concise (under 15 words).`;
  try{
    const apiKey=localStorage.getItem('flashcards_ai_key');let cards=[];
    if(apiKey){
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-3-5-sonnet-20241022',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
      if(!r.ok)throw new Error('API error');
      const data=await r.json();let text=(data.content||[]).map(b=>b.text||'').join('');
      text=text.replace(/```json|```/g,'').trim();cards=parseCardsJSON(text);
      if(!Array.isArray(cards))throw new Error('Invalid format');
    }else{cards=buildSmartCards(topic,count);status.textContent=`✨ Created ${cards.length} cards with Smart Generator.`}
    cards.forEach(c=>{if(c.front&&c.back)tempCards.push({front:c.front.trim(),back:c.back.trim(),hint:(c.hint||'').trim(),ease:2.5,interval:0,repetitions:0,nextReview:null})});
    renderPreview();status.textContent=`✅ Added ${cards.length} cards!`;
    if(!document.getElementById('deck-name').value)document.getElementById('deck-name').value=topic;
    showToast(`${cards.length} cards generated! ✨`);
    stats.aiGenerations=(stats.aiGenerations||0)+1;saveAll();checkAchievements();
  }catch(err){
    const fallback=buildSmartCards(topic,count);
    fallback.forEach(c=>tempCards.push({front:c.front.trim(),back:c.back.trim(),hint:(c.hint||'').trim(),ease:2.5,interval:0,repetitions:0,nextReview:null}));
    renderPreview();status.textContent=`⚠ Used Smart Generator. Added ${fallback.length} cards.`;showToast('Using Smart Generator fallback');
  }finally{
    btn.disabled=false;btn.innerHTML='<svg viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg> Generate';
  }
}
function buildSmartCards(topic,count){
  const cap=topic.trim().charAt(0).toUpperCase()+topic.trim().slice(1);const n=Math.max(1,Math.min(25,count||10));
  const templates=[
    {front:`What is ${cap}?`,back:`${cap} is a key concept to study.`,hint:'Define in one sentence'},
    {front:`Why is ${cap} important?`,back:`It has major impact in its field.`,hint:'Think impact'},
    {front:`Name one core idea in ${cap}.`,back:`A core idea involves its main principles.`,hint:'Focus on fundamentals'},
    {front:`Give an example of ${cap}.`,back:`Use a real-world scenario to explain it.`,hint:'Concrete example'},
    {front:`What is a common mistake about ${cap}?`,back:`Confusing related terms or skipping key details.`,hint:'Think misconceptions'},
    {front:`How would you explain ${cap} to a beginner?`,back:`Use simple language and one analogy.`,hint:'Keep it simple'},
    {front:`Which term is associated with ${cap}?`,back:`A central keyword that appears often in this topic.`,hint:'Recall vocabulary'},
    {front:`What are two subtopics of ${cap}?`,back:`Break it into two smaller parts.`,hint:'Split into components'},
    {front:`How can you test understanding of ${cap}?`,back:`Answer practice questions and explain from memory.`,hint:'Active recall'},
    {front:`Summarize ${cap} in one line.`,back:`Core principles + practical application + examples.`,hint:'One-line summary'}
  ];
  return Array.from({length:n},(_,i)=>templates[i%templates.length]);
}
function parseCardsJSON(text){
  try{return JSON.parse(text)}catch{const s=text.indexOf('[');const e=text.lastIndexOf(']');if(s>=0&&e>s)return JSON.parse(text.slice(s,e+1));throw new Error('Cannot parse JSON')}
}

/* ══════════════════════════════════════
   DECK LIST
══════════════════════════════════════ */
function renderDecks(filterText='',filterCat='',filterTag=''){
  const list=document.getElementById('deck-list');
  const q=filterText.trim().toLowerCase();const tagQ=filterTag.trim().toLowerCase();
  const entries=decks.map((deck,idx)=>({deck,idx})).filter(({deck})=>{
    const mT=!q||deck.name.toLowerCase().includes(q);
    const mC=!filterCat||deck.category===filterCat;
    const mTg=!tagQ||(Array.isArray(deck.tags)&&deck.tags.some(t=>t.toLowerCase()===tagQ));
    return mT&&mC&&mTg;
  });
  lastRenderedDeckIndices=entries.map(({idx})=>idx);
  if(!entries.length){
    list.innerHTML=`<div class="empty-state"><div class="empty-icon">📭</div><h3>${decks.length===0?'No decks yet':'No results'}</h3><p>${decks.length===0?'Create your first deck to get started!':'Try a different search term.'}</p></div>`;
    return;
  }
  list.innerHTML=`<div class="deck-grid">${entries.map(({deck,idx:ri})=>{
    const due=deck.cards.filter(c=>isDueToday(c)).length;const isSel=selectedDeckIndices.has(ri);
    return `<div class="deck-card ${isSel?'selected':''}" style="--deck-color:${deck.color||'#2563eb'}" onclick="handleDeckCardClick(${ri},event)">
      ${manageMode?`<button class="deck-select" onclick="toggleDeckSelect(${ri},event)"><span class="deck-select-box">${isSel?'✓':''}</span></button>`:''}
      <div class="deck-icon" style="background:${deck.color||'#2563eb'};opacity:0.18"></div>
      <div class="deck-info">
        <div class="deck-name">${escHtml(deck.category?deck.category+' ':'')}${escHtml(deck.name)}</div>
        ${Array.isArray(deck.tags)&&deck.tags.length?`<div class="tag-row">${deck.tags.slice(0,4).map(t=>`<span class="tag-chip">${escHtml(t)}</span>`).join('')}${deck.tags.length>4?`<span class="tag-more">+${deck.tags.length-4}</span>`:''}</div>`:''}
        <div class="deck-meta"><span>${deck.cards.length} cards</span>${deck.lastScore!==undefined?`<span class="deck-score">${deck.lastScore}%</span>`:''}${due>0?`<span style="color:var(--accent);font-weight:500">📅 ${due} due</span>`:''}</div>
      </div>
      <div class="deck-actions">
        <button class="btn-study" onclick="startStudy(${ri})">▶ Study</button>
        <button class="btn-edit" onclick="openEditDeck(${ri})">✏️</button>
        <button class="btn-io" onclick="openIOModal(${ri})">⇅</button>
        <button class="btn-delete" onclick="deleteDeck(${ri})">🗑</button>
      </div>
    </div>`;
  }).join('')}</div>`;
  updateBulkUI();
}
function filterDecks(){const t=document.getElementById('search-input').value;const c=document.getElementById('filter-category').value;const tg=document.getElementById('filter-tag')?.value||'';renderDecks(t,c,tg)}
function toggleManageMode(){manageMode=!manageMode;if(!manageMode)selectedDeckIndices.clear();updateBulkUI();filterDecks()}
function updateBulkUI(){
  const bb=document.getElementById('bulk-bar');const mb=document.getElementById('manage-btn');const ct=document.getElementById('bulk-count');
  if(!bb||!mb||!ct)return;
  bb.classList.toggle('hidden',!manageMode);mb.textContent=manageMode?'Done':'Select';ct.textContent=`${selectedDeckIndices.size} selected`;
  document.body.classList.toggle('manage-mode',manageMode);
}
function handleDeckCardClick(idx,event){if(!manageMode)return;event.preventDefault();toggleDeckSelect(idx,event)}
function toggleDeckSelect(idx,event){if(event)event.stopPropagation();if(!manageMode)return;if(selectedDeckIndices.has(idx))selectedDeckIndices.delete(idx);else selectedDeckIndices.add(idx);updateBulkUI();filterDecks()}
function clearSelection(){selectedDeckIndices.clear();updateBulkUI();filterDecks()}
function selectAllVisible(){if(!manageMode)return;lastRenderedDeckIndices.forEach(i=>selectedDeckIndices.add(i));updateBulkUI();filterDecks()}
function applyTagToSelected(){
  if(!manageMode)return;const input=document.getElementById('bulk-tag-input');const raw=(input?.value||'').trim();
  if(!raw)return showToast('Enter a tag first','error');
  const tag=raw.replace(/\s+/g,' ').slice(0,24);let changed=0;
  selectedDeckIndices.forEach(i=>{const d=decks[i];if(!d)return;if(!Array.isArray(d.tags))d.tags=[];if(!d.tags.some(t=>t.toLowerCase()===tag.toLowerCase())){d.tags.push(tag);changed++}});
  if(changed){saveAll();refreshTagFilterOptions();showToast(`Added tag "${tag}" to ${changed} deck${changed!==1?'s':''} ✓`)}else showToast('Tag already present','error');
  if(input)input.value='';filterDecks();
}
function removeTagFromSelected(){
  if(!manageMode)return;const input=document.getElementById('bulk-tag-input');const raw=(input?.value||'').trim();
  if(!raw)return showToast('Enter a tag to remove','error');
  const tag=raw.replace(/\s+/g,' ').slice(0,24);let changed=0;
  selectedDeckIndices.forEach(i=>{const d=decks[i];if(!d||!Array.isArray(d.tags))return;const before=d.tags.length;d.tags=d.tags.filter(t=>t.toLowerCase()!==tag.toLowerCase());if(d.tags.length!==before)changed++});
  if(changed){saveAll();refreshTagFilterOptions();showToast(`Removed tag "${tag}" from ${changed} deck${changed!==1?'s':''} ✓`)}else showToast('Tag not found','error');
  if(input)input.value='';filterDecks();
}
function refreshTagFilterOptions(){
  const sel=document.getElementById('filter-tag');if(!sel)return;
  const cur=sel.value;
  const tags=Array.from(new Set(decks.flatMap(d=>Array.isArray(d.tags)?d.tags:[]).map(t=>(t||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  sel.innerHTML=['<option value="">All tags</option>'].concat(tags.map(t=>`<option value="${escHtml(t)}">${escHtml(t)}</option>`)).join('');
  if(tags.includes(cur))sel.value=cur;
}
function deleteDeck(i){
  if(!confirm(`Delete "${decks[i].name}"?`))return;
  const del=decks[i];decks.splice(i,1);
  selectedDeckIndices=new Set(Array.from(selectedDeckIndices).filter(idx=>idx!==i).map(idx=>idx>i?idx-1:idx));
  if(del?.id)Object.keys(cardHistory).forEach(k=>{if(k.startsWith(`${del.id}-`))delete cardHistory[k]});
  saveAll();renderDecks();updateStats();showToast('Deck deleted');
}

/* ══════════════════════════════════════
   STUDY SESSION
══════════════════════════════════════ */
function startStudy(index,dueOnly=false){
  currentDeckIndex=index;const deck=decks[index];
  currentCards=dueOnly?deck.cards.filter(c=>isDueToday(c)).map(c=>({...c,_origIdx:deck.cards.indexOf(c)})):deck.cards.map((c,i)=>({...c,_origIdx:i}));
  if(!currentCards.length)return showToast('No cards to study!','error');
  if(document.getElementById('random-order').checked)currentCards.sort(()=>Math.random()-0.5);
  currentIndex=0;sessionCorrect=0;sessionTotal=0;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('study-screen').classList.add('active');
  document.getElementById('study-deck-name').textContent=deck.name;
  if(document.getElementById('show-timer').checked)startTimer();
  setMode(currentMode,true);showCard();
}
function setMode(mode,silent=false){
  currentMode=mode;
  document.querySelectorAll('.mode-tab').forEach(t=>t.classList.toggle('active',t.dataset.mode===mode));
  document.getElementById('mode-flip').classList.toggle('hidden',mode!=='flip');
  document.getElementById('mode-quiz').classList.toggle('hidden',mode!=='quiz');
  document.getElementById('mode-type').classList.toggle('hidden',mode!=='type');
  if(!silent&&currentCards.length)showCard();
}
function showCard(){
  updateProgress();const card=currentCards[currentIndex];
  if(currentMode==='flip'){
    document.getElementById('card-front-text').textContent=card.front;
    document.getElementById('card-back-text').textContent=card.back;
    document.getElementById('hint-text').textContent=card.hint?`💡 ${card.hint}`:'';
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('answer-buttons').classList.add('hidden');
  }else if(currentMode==='quiz'){
    document.getElementById('quiz-question').textContent=card.front;
    const choices=buildChoices(card);
    document.getElementById('quiz-choices').innerHTML=choices.map(ch=>`<button class="quiz-choice" onclick="quizAnswer(this,'${escHtml(ch)}','${escHtml(card.back)}')">${escHtml(ch)}</button>`).join('');
  }else if(currentMode==='type'){
    document.getElementById('type-question').textContent=card.front;
    document.getElementById('type-answer-input').value='';
    document.getElementById('type-feedback').classList.add('hidden');
    document.getElementById('type-feedback').className='type-feedback hidden';
    setTimeout(()=>document.getElementById('type-answer-input').focus(),100);
  }
}
function buildChoices(card){
  const wrong=currentCards.filter(c=>c.back!==card.back).sort(()=>Math.random()-0.5).slice(0,3).map(c=>c.back);
  return [...wrong,card.back].sort(()=>Math.random()-0.5);
}
function flipCard(){document.getElementById('flashcard').classList.toggle('flipped');document.getElementById('answer-buttons').classList.remove('hidden');playSound('flip')}
function answer(quality){
  sessionTotal++;if(quality>=1)sessionCorrect++;
  if(quality===2){stats.learned++;playSound('correct')}else if(quality===0)playSound('wrong');
  const card=currentCards[currentIndex];const origIdx=card._origIdx;
  if(origIdx!==undefined){applySpacedRepetition(decks[currentDeckIndex].cards[origIdx],quality);trackCardHistory(currentDeckIndex,origIdx,card.front,quality>=1)}
  logActivity();advance();
}
function applySpacedRepetition(card,quality){
  card.repetitions=card.repetitions||0;card.ease=card.ease||2.5;card.interval=card.interval||0;
  if(quality<1){card.repetitions=0;card.interval=1}
  else{if(card.repetitions===0)card.interval=1;else if(card.repetitions===1)card.interval=6;else card.interval=Math.round(card.interval*card.ease);card.repetitions++}
  card.ease=Math.max(1.3,card.ease+0.1-(2-quality)*(0.08+(2-quality)*0.02));
  const next=new Date();next.setDate(next.getDate()+card.interval);card.nextReview=next.toISOString();
}
function trackCardHistory(deckIdx,origIdx,front,correct){
  const deck=decks[deckIdx];if(!deck||origIdx===undefined)return;
  const key=`${deck.id}-${origIdx}`;
  if(!cardHistory[key])cardHistory[key]={correct:0,total:0,front:front||''};
  cardHistory[key].total++;if(correct)cardHistory[key].correct++;
  cardHistory[key].front=front||cardHistory[key].front||'';
}
function advance(){
  currentIndex++;
  if(currentIndex>=currentCards.length){
    stats.sessions=(stats.sessions||0)+1;stats.totalCorrect=(stats.totalCorrect||0)+sessionCorrect;stats.totalAnswered=(stats.totalAnswered||0)+sessionTotal;
    const pct=Math.round((sessionCorrect/sessionTotal)*100);
    if(timerSeconds>0&&timerSeconds<60)stats.fastSession=true;
    decks[currentDeckIndex].lastScore=pct;
    decks[currentDeckIndex].sessionHistory=decks[currentDeckIndex].sessionHistory||[];
    decks[currentDeckIndex].sessionHistory.push({pct,date:todayKey()});
    saveAll();checkAchievements();showResult();
  }else showCard();
}
function quizAnswer(btn,chosen,correct){
  const btns=document.querySelectorAll('.quiz-choice');btns.forEach(b=>b.disabled=true);
  const isCorrect=chosen===correct;btn.classList.add(isCorrect?'correct':'wrong');
  if(!isCorrect)btns.forEach(b=>{if(b.textContent===correct)b.classList.add('correct')});
  isCorrect?playSound('correct'):playSound('wrong');
  sessionTotal++;if(isCorrect){sessionCorrect++;stats.learned++}
  const card=currentCards[currentIndex];
  if(card&&card._origIdx!==undefined){applySpacedRepetition(decks[currentDeckIndex].cards[card._origIdx],isCorrect?2:0);trackCardHistory(currentDeckIndex,card._origIdx,card.front,isCorrect)}
  logActivity();setTimeout(()=>advance(),900);
}
function checkTypeAnswer(){
  const input=document.getElementById('type-answer-input').value.trim().toLowerCase();
  const correct=currentCards[currentIndex].back.trim().toLowerCase();
  const isCorrect=input===correct||levenshtein(input,correct)<=2;
  const fb=document.getElementById('type-feedback');fb.classList.remove('hidden','correct','wrong');fb.classList.add(isCorrect?'correct':'wrong');
  fb.textContent=isCorrect?'✓ Correct!':`✕ Answer: ${currentCards[currentIndex].back}`;
  isCorrect?playSound('correct'):playSound('wrong');
  sessionTotal++;if(isCorrect){sessionCorrect++;stats.learned++}
  const card=currentCards[currentIndex];
  if(card&&card._origIdx!==undefined){applySpacedRepetition(decks[currentDeckIndex].cards[card._origIdx],isCorrect?2:0);trackCardHistory(currentDeckIndex,card._origIdx,card.front,isCorrect)}
  logActivity();setTimeout(()=>advance(),1200);
}
function levenshtein(a,b){
  const dp=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[a.length][b.length];
}
function updateProgress(){
  const pct=(currentIndex/currentCards.length)*100;
  document.getElementById('progress-fill').style.width=pct+'%';
  document.getElementById('progress-text').textContent=`${currentIndex+1} / ${currentCards.length}`;
}

/* ── TIMER ── */
function startTimer(){timerSeconds=0;document.getElementById('timer-display').classList.remove('hidden');timerInterval=setInterval(()=>{timerSeconds++;document.getElementById('timer-count').textContent=timerSeconds},1000)}
function clearTimer(){clearInterval(timerInterval);timerInterval=null;const el=document.getElementById('timer-display');if(el)el.classList.add('hidden')}

/* ── RESULT ── */
function showResult(){
  clearTimer();document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById('result-screen').classList.add('active');
  const pct=Math.round((sessionCorrect/sessionTotal)*100);
  const emoji=pct===100?'🏆':pct>=80?'🎯':pct>=60?'💪':pct>=40?'📖':'🔁';
  document.getElementById('result-emoji').textContent=emoji;
  document.getElementById('result-headline').textContent=pct===100?'Perfect Score!':pct>=80?'Great Job!':pct>=50?'Keep Going!':'Keep Practicing!';
  document.getElementById('result-text').textContent=`${sessionCorrect} / ${sessionTotal} correct — ${pct}%`;
  document.getElementById('result-breakdown').innerHTML=`
    <div class="result-stat"><span class="result-stat-val" style="color:var(--know)">${sessionCorrect}</span><span class="result-stat-lbl">Correct</span></div>
    <div class="result-stat"><span class="result-stat-val" style="color:var(--miss)">${sessionTotal-sessionCorrect}</span><span class="result-stat-lbl">Missed</span></div>
    <div class="result-stat"><span class="result-stat-val">${pct}%</span><span class="result-stat-lbl">Score</span></div>
    ${timerSeconds?`<div class="result-stat"><span class="result-stat-val">${timerSeconds}s</span><span class="result-stat-lbl">Time</span></div>`:''}
  `;
  if(pct===100){spawnConfetti();playSound('levelup')}
}
function restartDeck(){startStudy(currentDeckIndex)}

/* ── CONFETTI ── */
function spawnConfetti(){
  const colors=['#e94560','#a855f7','#3b82f6','#10b981','#f59e0b','#ec4899'];
  for(let i=0;i<80;i++){
    const p=document.createElement('div');p.className='confetti-piece';
    p.style.cssText=`left:${Math.random()*100}vw;background:${colors[Math.floor(Math.random()*colors.length)]};width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;animation-duration:${1.5+Math.random()*2}s;animation-delay:${Math.random()*0.8}s;border-radius:${Math.random()>0.5?'50%':'2px'}`;
    document.body.appendChild(p);setTimeout(()=>p.remove(),3500);
  }
}

/* ── ANALYTICS ── */
function renderAnalytics(){
  const streak=getStreak();const totalAnswered=stats.totalAnswered||0;const accuracy=totalAnswered>0?Math.round((stats.totalCorrect/totalAnswered)*100):0;
  document.getElementById('a-sessions').textContent=stats.sessions||0;document.getElementById('a-accuracy').textContent=accuracy+'%';document.getElementById('a-streak').textContent=streak;document.getElementById('a-mastered').textContent=stats.learned||0;
  renderHeatmap();renderDeckPerformance();renderWeakCards();
}
function renderHeatmap(){
  const c=document.getElementById('heatmap');const cells=[];const today=new Date();
  for(let i=90;i>=0;i--){const d=new Date(today);d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);const count=activityLog[key]||0;const level=count===0?0:count<3?1:count<7?2:count<15?3:4;cells.push(`<div class="heat-cell heat-${level}" title="${key}: ${count} answers"></div>`)}
  c.innerHTML=cells.join('');
}
function renderDeckPerformance(){
  const c=document.getElementById('deck-performance');
  if(!decks.length){c.innerHTML='<p style="color:var(--text-3);font-size:14px">No decks yet.</p>';return}
  c.innerHTML=decks.map(deck=>{const pct=deck.lastScore!==undefined?deck.lastScore:0;return`<div class="deck-perf-row"><span class="deck-perf-name">${escHtml(deck.name)}</span><div class="deck-perf-bar-wrap"><div class="deck-perf-bar-bg"><div class="deck-perf-bar-fill" style="width:${pct}%;background:${deck.color||'var(--accent)'}"></div></div></div><span class="deck-perf-pct">${deck.lastScore!==undefined?pct+'%':'—'}</span></div>`}).join('');
}
function renderWeakCards(){
  const c=document.getElementById('weak-cards');
  const weak=Object.values(cardHistory).filter(c=>c.total>=2).map(c=>({...c,rate:Math.round((c.correct/c.total)*100)})).sort((a,b)=>a.rate-b.rate).slice(0,8);
  if(!weak.length){c.innerHTML='<p style="color:var(--text-3);font-size:14px">Study more cards to see weak areas.</p>';return}
  c.innerHTML=weak.map(c=>`<div class="weak-card-item"><span class="weak-card-q">${escHtml(c.front)}</span><span class="weak-card-rate">${c.rate}%</span></div>`).join('');
}
function exportStats(){
  let csv='Deck,Last Score,Cards\n';decks.forEach(d=>{csv+=`"${d.name}",${d.lastScore??''},"${d.cards.length}"\n`});
  csv+=`\nTotal Sessions,${stats.sessions||0}\nMastered Cards,${stats.learned||0}\nAccuracy,${stats.totalAnswered?Math.round((stats.totalCorrect/stats.totalAnswered)*100):0}%\n`;
  downloadText(csv,'flashcards-stats.csv','text/csv');showToast('Stats exported ✓');
}

/* ── IMPORT/EXPORT/SHARE ── */
function openIOModal(idx){currentIODeckIndex=idx;document.getElementById('qr-container').classList.add('hidden');document.getElementById('qr-container').innerHTML='';document.getElementById('io-modal').classList.remove('hidden')}
function closeIOModal(){document.getElementById('io-modal').classList.add('hidden')}
function exportDeck(){const deck=decks[currentIODeckIndex];downloadText(JSON.stringify(deck,null,2),`${deck.name}.json`,'application/json');showToast('Deck exported ✓')}
function importDeck(event){
  const file=event.target.files[0];if(!file)return;const reader=new FileReader();
  reader.onload=e=>{try{const rawDeck=JSON.parse(e.target.result);const deck=normalizeDeck(rawDeck);if(!deck.name||!deck.cards.length)throw new Error('Invalid');decks.push(deck);saveAll();renderDecks();updateStats();closeIOModal();showToast('Deck imported! 🎉')}catch{showToast('Invalid deck file','error')}};
  reader.readAsText(file);event.target.value='';
}
function shareDeck(){const deck=decks[currentIODeckIndex];const data=encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(deck)))));const url=`${location.origin}${location.pathname}?deck=${data}`;navigator.clipboard.writeText(url).then(()=>showToast('Link copied! 📋'))}
function showQR(){
  const deck=decks[currentIODeckIndex];const data=encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(deck)))));const url=`${location.origin}${location.pathname}?deck=${data}`;
  const c=document.getElementById('qr-container');c.classList.remove('hidden');c.innerHTML='';new QRCode(c,{text:url,width:160,height:160});
}
function checkImportFromURL(){
  const params=new URLSearchParams(location.search);const raw=params.get('deck');if(!raw)return;
  try{const rawDeck=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw)))));const deck=normalizeDeck(rawDeck);if(deck.name&&deck.cards.length){decks.push(deck);saveAll();showToast(`Imported "${deck.name}" 🎉`);history.replaceState({},'',location.pathname)}}catch(e){console.warn('URL import failed',e)}
}
function downloadText(content,filename,type){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();URL.revokeObjectURL(a.href)}

/* ── CSV IMPORT ── */
function openCSVModal(){document.getElementById('csv-modal').classList.remove('hidden');document.getElementById('csv-input').value='';document.getElementById('csv-status').classList.add('hidden')}
function closeCSVModal(){document.getElementById('csv-modal').classList.add('hidden')}
function parseCSVText(text){
  const lines=text.trim().split('\n').filter(l=>l.trim());const cards=[];
  lines.forEach(line=>{const parts=line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)||[];const cleaned=parts.map(p=>p.replace(/^"|"$/g,'').trim());if(cleaned.length>=2&&cleaned[0]&&cleaned[1])cards.push({front:cleaned[0],back:cleaned[1],hint:cleaned[2]||'',ease:2.5,interval:0,repetitions:0,nextReview:null})});
  return cards;
}
function importFromCSV(){
  const text=document.getElementById('csv-input').value.trim();if(!text)return showToast('Please paste some CSV data first!','error');
  const cards=parseCSVText(text);if(!cards.length)return showToast('No valid cards found. Check your format!','error');
  tempCards.push(...cards);renderPreview();
  const status=document.getElementById('csv-status');status.classList.remove('hidden');status.textContent=`✅ Added ${cards.length} cards!`;
  stats.csvImports=(stats.csvImports||0)+1;saveAll();checkAchievements();
  showToast(`${cards.length} cards imported! ✓`);
  setTimeout(()=>{closeCSVModal();navTo('create')},1500);
}
function importCSVFile(event){const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{document.getElementById('csv-input').value=e.target.result;showToast('File loaded! Click Import.')};reader.readAsText(file);event.target.value=''}

/* ── SOUNDS ── */
let audioCtx=null,soundEnabled=true;
function getAudioCtx(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx}
function playSound(type){
  if(!soundEnabled)return;
  try{
    const ctx=getAudioCtx();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);
    if(type==='flip'){osc.type='sine';osc.frequency.setValueAtTime(440,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.1);gain.gain.setValueAtTime(0.15,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.15)}
    else if(type==='correct'){osc.type='triangle';osc.frequency.setValueAtTime(523,ctx.currentTime);osc.frequency.setValueAtTime(659,ctx.currentTime+0.1);osc.frequency.setValueAtTime(784,ctx.currentTime+0.2);gain.gain.setValueAtTime(0.2,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.35)}
    else if(type==='wrong'){osc.type='sawtooth';osc.frequency.setValueAtTime(300,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(150,ctx.currentTime+0.2);gain.gain.setValueAtTime(0.15,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.25);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.25)}
    else if(type==='levelup'){const notes=[523,659,784,1047];notes.forEach((freq,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='triangle';o.frequency.setValueAtTime(freq,ctx.currentTime+i*0.12);g.gain.setValueAtTime(0.2,ctx.currentTime+i*0.12);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.12+0.15);o.start(ctx.currentTime+i*0.12);o.stop(ctx.currentTime+i*0.12+0.15)})}
    else if(type==='click'){osc.type='sine';osc.frequency.setValueAtTime(800,ctx.currentTime);gain.gain.setValueAtTime(0.08,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.05);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.05)}
  }catch(e){}
}
function toggleSound(){soundEnabled=!soundEnabled;document.getElementById('sound-btn').textContent=soundEnabled?'🔊':'🔇';showToast(soundEnabled?'Sound on 🔊':'Sound off 🔇')}

/* ── ACHIEVEMENTS ── */
const ACHIEVEMENTS=[
  {id:'first_deck',icon:'📚',name:'Deck Builder',desc:'Create your first deck',check:()=>decks.length>=1},
  {id:'five_decks',icon:'🗂️',name:'Librarian',desc:'Create 5 decks',check:()=>decks.length>=5},
  {id:'first_study',icon:'🎯',name:'First Steps',desc:'Complete your first study session',check:()=>(stats.sessions||0)>=1},
  {id:'ten_sessions',icon:'💪',name:'Dedicated',desc:'Complete 10 study sessions',check:()=>(stats.sessions||0)>=10},
  {id:'fifty_sessions',icon:'🔥',name:'On Fire',desc:'Complete 50 study sessions',check:()=>(stats.sessions||0)>=50},
  {id:'perfect_score',icon:'🏆',name:'Perfectionist',desc:'Get a perfect score on any deck',check:()=>decks.some(d=>d.lastScore===100)},
  {id:'three_streak',icon:'📅',name:'Consistent',desc:'3-day study streak',check:()=>getStreak()>=3},
  {id:'seven_streak',icon:'🌟',name:'Week Warrior',desc:'7-day study streak',check:()=>getStreak()>=7},
  {id:'thirty_streak',icon:'💎',name:'Diamond Mind',desc:'30-day study streak',check:()=>getStreak()>=30},
  {id:'hundred_cards',icon:'🃏',name:'Card Collector',desc:'Study 100 cards total',check:()=>(stats.totalAnswered||0)>=100},
  {id:'thousand_cards',icon:'🎖️',name:'Master Scholar',desc:'Study 1000 cards total',check:()=>(stats.totalAnswered||0)>=1000},
  {id:'ai_user',icon:'✨',name:'AI Pioneer',desc:'Generate cards with AI',check:()=>(stats.aiGenerations||0)>=1},
  {id:'csv_import',icon:'📊',name:'Data Wizard',desc:'Import cards from CSV',check:()=>(stats.csvImports||0)>=1},
  {id:'pomodoro_complete',icon:'🍅',name:'Tomato Timer',desc:'Complete a Pomodoro session',check:()=>(stats.pomodorosCompleted||0)>=1},
  {id:'ten_pomodoros',icon:'⏰',name:'Focus Master',desc:'Complete 10 Pomodoro sessions',check:()=>(stats.pomodorosCompleted||0)>=10},
  {id:'night_owl',icon:'🦉',name:'Night Owl',desc:'Study after midnight',check:()=>(stats.nightStudy||false)},
  {id:'speed_demon',icon:'⚡',name:'Speed Demon',desc:'Complete a deck in under 60 seconds',check:()=>(stats.fastSession||false)},
  {id:'accuracy_90',icon:'🎯',name:'Sharp Mind',desc:'Achieve 90%+ average accuracy',check:()=>(stats.totalAnswered||0)>20&&Math.round(((stats.totalCorrect||0)/(stats.totalAnswered||1))*100)>=90},
  {id:'theme_changer',icon:'🎨',name:'Style Icon',desc:'Change your app theme',check:()=>(stats.themeChanged||false)},
];
let unlockedAchievements=JSON.parse(localStorage.getItem('achievements'))||[];
function checkAchievements(){
  const hour=new Date().getHours();if(hour>=0&&hour<5)stats.nightStudy=true;
  ACHIEVEMENTS.forEach(ach=>{if(!unlockedAchievements.includes(ach.id)&&ach.check()){unlockedAchievements.push(ach.id);localStorage.setItem('achievements',JSON.stringify(unlockedAchievements));showAchievementToast(ach);playSound('levelup')}});
}
function showAchievementToast(ach){
  const toast=document.getElementById('achievement-toast');document.getElementById('achievement-toast-icon').textContent=ach.icon;document.getElementById('achievement-toast-name').textContent=ach.name+' — '+ach.desc;
  toast.classList.remove('hidden');setTimeout(()=>toast.classList.add('hidden'),4000);
}
function renderAchievements(){
  const list=document.getElementById('achievements-list');const unlocked=unlockedAchievements.length;const total=ACHIEVEMENTS.length;
  list.innerHTML=`<div class="ach-progress-bar-wrap"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:14px;font-weight:600">${unlocked} / ${total} Unlocked</span><span style="font-size:13px;color:var(--text-3)">${Math.round((unlocked/total)*100)}%</span></div><div class="progress-bar" style="height:8px;margin-bottom:0"><div style="width:${Math.round((unlocked/total)*100)}%;height:100%;background:var(--accent);border-radius:20px;transition:width 0.4s"></div></div></div>
  <div class="achievements-grid-inner">${ACHIEVEMENTS.map(ach=>{const earned=unlockedAchievements.includes(ach.id);return`<div class="ach-card ${earned?'earned':'locked'}"><div class="ach-icon">${earned?ach.icon:'🔒'}</div><div class="ach-info"><div class="ach-name">${earned?ach.name:'???'}</div><div class="ach-desc">${earned?ach.desc:'Keep studying to unlock'}</div></div>${earned?'<span class="ach-badge">✓</span>':''}</div>`}).join('')}</div>`;
}

/* ── POMODORO ── */
const POMO_MODES={focus:{label:'Focus Time',duration:25*60,color:'#ef4444'},short:{label:'Short Break',duration:5*60,color:'#22c55e'},long:{label:'Long Break',duration:15*60,color:'#3b82f6'}};
let pomoMode='focus',pomoRunning=false,pomoInterval=null,pomoRemaining=25*60,pomoSessionNum=1,pomoGoal=4,pomoTotalFocusSeconds=0,pomosCompletedToday=0;
function setPomoMode(mode){
  pomoMode=mode;pomoRunning=false;clearInterval(pomoInterval);pomoRemaining=POMO_MODES[mode].duration;
  document.querySelectorAll('.pomo-tab').forEach(t=>t.classList.remove('active'));document.getElementById(`tab-${mode}`).classList.add('active');
  document.getElementById('pomo-label').textContent=POMO_MODES[mode].label;document.getElementById('pomo-btn').textContent='▶ Start';
  document.querySelector('.pomo-ring-fill').style.stroke=POMO_MODES[mode].color;updatePomoDisplay();
}
function togglePomo(){
  if(pomoRunning){pomoRunning=false;clearInterval(pomoInterval);document.getElementById('pomo-btn').textContent='▶ Resume';playSound('click')}
  else{pomoRunning=true;document.getElementById('pomo-btn').textContent='⏸ Pause';playSound('click');
    pomoInterval=setInterval(()=>{pomoRemaining--;if(pomoMode==='focus')pomoTotalFocusSeconds++;updatePomoDisplay();if(pomoRemaining<=0){clearInterval(pomoInterval);pomoRunning=false;onPomoComplete()}},1000)}
}
function onPomoComplete(){
  playSound('levelup');
  if(pomoMode==='focus'){
    pomosCompletedToday++;stats.pomodorosCompleted=(stats.pomodorosCompleted||0)+1;saveAll();checkAchievements();
    document.getElementById('pomo-completed').textContent=pomosCompletedToday;
    if('Notification'in window&&Notification.permission==='granted')new Notification('🍅 Pomodoro Complete!',{body:'Time for a break!'});
    else if('Notification'in window&&Notification.permission!=='denied')Notification.requestPermission();
    if(pomosCompletedToday%4===0)setPomoMode('long');else setPomoMode('short');
  }else{pomoSessionNum++;setPomoMode('focus');document.getElementById('pomo-session').textContent=`Session ${pomoSessionNum} of ${pomoGoal}`}
}
function resetPomo(){pomoRunning=false;clearInterval(pomoInterval);pomoRemaining=POMO_MODES[pomoMode].duration;document.getElementById('pomo-btn').textContent='▶ Start';updatePomoDisplay();playSound('click')}
function skipPomo(){clearInterval(pomoInterval);pomoRunning=false;onPomoComplete()}
function updatePomoDisplay(){
  const mins=String(Math.floor(pomoRemaining/60)).padStart(2,'0');const secs=String(pomoRemaining%60).padStart(2,'0');
  document.getElementById('pomo-time').textContent=`${mins}:${secs}`;
  document.getElementById('pomo-ring-fill').style.strokeDashoffset=603*(1-pomoRemaining/POMO_MODES[pomoMode].duration);
  document.getElementById('pomo-total-time').textContent=Math.floor(pomoTotalFocusSeconds/60)+'m';
}
function updatePomoGoal(val){pomoGoal=parseInt(val);document.getElementById('pomo-goal').textContent=val}

/* ── HELP ── */
function showHelp(){document.getElementById('help-modal').classList.remove('hidden')}
function closeHelp(){document.getElementById('help-modal').classList.add('hidden')}

/* ── TOAST ── */
function showToast(msg,type='success'){
  let toast=document.getElementById('toast');
  if(!toast){toast=document.createElement('div');toast.id='toast';toast.className='toast';document.body.appendChild(toast)}
  toast.textContent=msg;toast.className=`toast ${type}`;toast.classList.add('show');
  clearTimeout(toast._timeout);toast._timeout=setTimeout(()=>toast.classList.remove('show'),2600);
}

/* ── KEYBOARD ── */
document.addEventListener('keydown',e=>{
  const studyActive=document.getElementById('study-screen').classList.contains('active');if(!studyActive)return;
  if(currentMode==='flip'){const flipped=document.getElementById('flashcard').classList.contains('flipped');if(e.code==='Space'){e.preventDefault();flipCard()}if(flipped){if(e.key==='ArrowRight')answer(2);if(e.key==='ArrowLeft')answer(0);if(e.key==='ArrowDown')answer(1)}}
  else if(currentMode==='type'){if(e.key==='Enter')checkTypeAnswer()}
});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;closeHelp();closeIOModal();closeCSVModal();closeThemePicker()});

/* ── UTILS ── */
function escHtml(str){if(!str)return'';return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

/* ── INIT ── */
checkImportFromURL();
decks=decks.map(normalizeDeck).filter(d=>d.name&&d.cards.length);
saveAll();
applyTheme(currentTheme);
checkAchievements();
navTo('home');
 