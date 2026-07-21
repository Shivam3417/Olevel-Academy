/* ==================== STATE / STORAGE ==================== */
const Store = {
  key: 'olp_state_v2',
  load(){
    try{ const s = JSON.parse(localStorage.getItem(this.key)); return s ? {...this.default(), ...s} : this.default(); }
    catch(e){ return this.default(); }
  },
  default(){
    return {
      name:'', theme:'dark', examDate:'',
      moduleXp:{}, attempts:[], bookmarks:[], flashcardsReviewed:0,
      streak:0, lastActiveDate:'', chatHistory:[]
    };
  },
  save(state){ localStorage.setItem(this.key, JSON.stringify(state)); }
};
let state = Store.load();
applyTheme(state.theme);
updateStreak();

function updateStreak(){
  const today = new Date().toDateString();
  if(state.lastActiveDate === today) return;
  const last = state.lastActiveDate ? new Date(state.lastActiveDate) : null;
  const diffDays = last ? Math.round((new Date(today)-last)/86400000) : null;
  if(diffDays === 1) state.streak += 1;
  else if(diffDays === null) state.streak = 1;
  else if(diffDays > 1) state.streak = 1;
  state.lastActiveDate = today;
  Store.save(state);
}

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
}

/* ==================== ROUTER ==================== */
function navigate(route){ location.hash = route; window.scrollTo(0,0); }
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);

const NAV_ROUTES = ['dashboard','study','playground','assistant','profile'];

function render(){
  const hash = location.hash.slice(1) || 'dashboard';
  const [route, ...params] = hash.split('/');
  const app = document.getElementById('app');
  const bottomnav = document.getElementById('bottomnav');

  if(!state.name && route !== 'onboarding'){
    bottomnav.style.display='none';
    return renderOnboarding(app);
  }

  bottomnav.style.display='flex';
  const activeTab = NAV_ROUTES.includes(route) ? route :
    (['module','quiz','result','mocktest','bookmarks'].includes(route) ? 'dashboard' :
     (['notes','flashcards'].includes(route) ? 'study' : 'dashboard'));
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.nav===activeTab));

  const routes = {
    module: ()=>renderModuleDetail(app, params[0]),
    quiz: ()=>renderQuiz(app, params[0], decodeURIComponent(params[1]||'')),
    mocktest: ()=>renderMockTestSetup(app),
    result: ()=>renderResult(app),
    study: ()=>renderStudyHub(app),
    notes: ()=>renderNotes(app, params[0]),
    flashcards: ()=>renderFlashcards(app, params[0]),
    bookmarks: ()=>renderBookmarks(app),
    playground: ()=>renderPlayground(app),
    assistant: ()=>renderAssistant(app),
    profile: ()=>renderProfile(app),
    settings: ()=>renderSettings(app),
  };
  (routes[route] || (()=>renderDashboard(app)))();
}

document.getElementById('bottomnav').addEventListener('click', (e)=>{
  const btn = e.target.closest('.navbtn'); if(!btn) return;
  navigate(btn.dataset.nav);
});

/* ==================== ONBOARDING ==================== */
function renderOnboarding(app){
  app.innerHTML = `
    <div class="container" style="padding-top:60px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div class="brand-icon" style="width:56px;height:56px;font-size:26px;margin:0 auto 14px;">🧠</div>
        <h1 style="font-size:26px;margin:0 0 6px;">O Level Prep</h1>
        <div class="muted">NIELIT O Level exam companion</div>
      </div>
      <div class="glass">
        <div style="font-weight:600;margin-bottom:12px;">Apna naam batayein</div>
        <input id="nameInput" class="input" placeholder="Aapka naam" />
        <div style="font-weight:600;margin:4px 0 8px;">Exam ki date (optional)</div>
        <input id="examInput" type="date" class="input" />
        <button class="btn btn-primary" id="startBtn">Shuru Karein</button>
      </div>
      <div class="tiny" style="text-align:center;margin-top:16px;">Sab data isi device par store hota hai — offline kaam karta hai.</div>
    </div>`;
  document.getElementById('startBtn').onclick = ()=>{
    const v = document.getElementById('nameInput').value.trim();
    if(!v){ document.getElementById('nameInput').focus(); return; }
    state.name = v;
    state.examDate = document.getElementById('examInput').value || '';
    Store.save(state); navigate('dashboard');
  };
}

/* ==================== DASHBOARD ==================== */
function examCountdownHtml(){
  if(!state.examDate) return '';
  const days = Math.ceil((new Date(state.examDate) - new Date())/86400000);
  if(days < 0) return '';
  return `<div class="glass" style="margin-bottom:16px;display:flex;align-items:center;gap:12px;background:rgba(255,196,107,0.08);border-color:rgba(255,196,107,0.3);">
    <span style="font-size:22px;">⏳</span>
    <div><div style="font-weight:700;">${days} din baaki</div><div class="tiny">Exam tak — abhi practice shuru karein</div></div>
  </div>`;
}

function renderDashboard(app){
  const firstName = state.name.split(' ')[0];
  app.innerHTML = `
    <div class="topbar">
      <div>
        <h2 style="margin:0;font-size:20px;">Namaste, ${firstName} 👋</h2>
        <div class="muted">Apna O Level syllabus yahin se cover karein</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="iconbtn" id="streakBtn">🔥 ${state.streak}</button>
        <button class="iconbtn" onclick="navigate('settings')">⚙️</button>
      </div>
    </div>
    <div class="container">
      ${examCountdownHtml()}
      <div class="search-box glass">
        <span>🔍</span><input id="searchInput" placeholder="Topics, notes ya questions search karein..." />
      </div>
      <div id="searchResults"></div>
      <div class="glass" id="mockCard" style="margin:16px 0;background:linear-gradient(135deg, rgba(100,255,218,0.1), rgba(157,123,255,0.08));cursor:pointer;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:26px;">🏁</span>
          <div style="flex:1;">
            <div style="font-weight:700;">Full Syllabus Mock Test</div>
            <div class="tiny">Sabhi modules se mixed questions, timed test</div>
          </div>
          <span style="color:var(--cyan);">›</span>
        </div>
      </div>
      <div id="moduleList"></div>
    </div>`;
  document.getElementById('mockCard').onclick = ()=>navigate('mocktest');
  document.getElementById('streakBtn').onclick = ()=>navigate('profile');

  const list = document.getElementById('moduleList');
  SYLLABUS.forEach(m=>{
    const xp = state.moduleXp[m.code] || 0;
    const pct = Math.min(100, Math.round((xp/500)*100));
    const div = document.createElement('div');
    div.className = 'glass module-card';
    div.style.borderColor = 'transparent';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="badge" style="background:${m.color}22;color:${m.color};">${m.code}</span>
        <span class="tiny">${m.topics.length} topics</span>
      </div>
      <h3 style="margin:12px 0 4px;font-size:17px;">${m.title}</h3>
      <div class="muted" style="font-size:13px;line-height:1.4;">${m.desc}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${m.color};"></div></div>
      <div class="tiny" style="margin-top:6px;">${xp} XP earned</div>`;
    div.onclick = ()=>navigate('module/'+m.code);
    list.appendChild(div);
  });

  const searchInput = document.getElementById('searchInput');
  searchInput.oninput = ()=>doSearch(searchInput.value.trim());
}

function doSearch(q){
  const box = document.getElementById('searchResults');
  if(!q){ box.innerHTML=''; return; }
  const ql = q.toLowerCase();
  const results = [];
  SYLLABUS.forEach(m=> m.topics.forEach(t=>{
    if(t.title.toLowerCase().includes(ql) || t.sub.some(s=>s.toLowerCase().includes(ql)) || (NOTES[t.title]||'').toLowerCase().includes(ql)){
      results.push({type:'topic', module:m.code, title:t.title});
    }
  }));
  QUESTIONS.forEach(qq=>{ if(qq.text.toLowerCase().includes(ql)) results.push({type:'question', module:qq.module, title:qq.text, topic:qq.topic}); });

  if(results.length===0){ box.innerHTML = `<div class="tiny" style="padding:10px 0;">Kuch nahi mila.</div>`; return; }
  box.innerHTML = results.slice(0,8).map(r=>`
    <div class="glass topic-row" style="margin-bottom:8px;" onclick="navigate('notes/${encodeURIComponent(r.type==='topic'?r.title:r.topic)}')">
      <div>
        <div style="font-weight:600;font-size:13px;">${r.type==='topic'?'📖 ':'❓ '}${r.title.length>60?r.title.slice(0,60)+'…':r.title}</div>
        <div class="tiny">${r.module}</div>
      </div>
      <span style="color:var(--text-muted);">›</span>
    </div>`).join('');
}

/* ==================== MODULE DETAIL ==================== */
function renderModuleDetail(app, code){
  const m = SYLLABUS.find(x=>x.code===code);
  if(!m) return navigate('dashboard');
  app.innerHTML = `
    <div class="topbar"><button class="backlink" onclick="navigate('dashboard')">← Back</button></div>
    <div class="container">
      <span class="badge" style="background:${m.color}22;color:${m.color};">${m.code}</span>
      <h2 style="margin:12px 0 4px;">${m.title}</h2>
      <div class="muted" style="margin-bottom:18px;">${m.desc}</div>
      <div class="glass" style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:20px;">⚡</span>
          <div style="font-weight:600;">Poora module quiz (mixed topics)</div>
        </div>
        <button class="btn btn-primary" onclick="navigate('quiz/${m.code}/')">Start Full Module Quiz</button>
      </div>
      <h3 style="margin-bottom:10px;">Topics</h3>
      <div class="glass" id="topicList"></div>
    </div>`;
  const box = document.getElementById('topicList');
  m.topics.forEach(t=>{
    const row = document.createElement('div');
    row.className='topic-row';
    row.innerHTML = `<div><div style="font-weight:600;font-size:14px;">${t.title}</div>
      <div class="tiny">${t.sub.join(' • ')}</div></div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button class="chip" data-notes>Notes</button>
        <button class="chip chip-accent" data-quiz>Quiz</button>
      </div>`;
    row.querySelector('[data-notes]').onclick = (e)=>{ e.stopPropagation(); navigate('notes/'+encodeURIComponent(t.title)); };
    row.querySelector('[data-quiz]').onclick = (e)=>{ e.stopPropagation(); navigate('quiz/'+m.code+'/'+encodeURIComponent(t.title)); };
    box.appendChild(row);
  });
}

/* ==================== NOTES ==================== */
function renderNotes(app, topic){
  const t = decodeURIComponent(topic);
  const note = NOTES[t] || 'Iss topic ke liye notes jald hi add honge.';
  const mod = SYLLABUS.find(m=>m.topics.some(x=>x.title===t));
  app.innerHTML = `
    <div class="topbar"><button class="backlink" onclick="history.back()">← Back</button></div>
    <div class="container">
      <span class="badge">${mod?mod.code:''}</span>
      <h2 style="margin:12px 0 16px;">${t}</h2>
      <div class="glass" style="line-height:1.7;font-size:15px;">${note}</div>
      <button class="btn btn-outline" style="margin-top:16px;" onclick="navigate('quiz/${mod?mod.code:''}/${encodeURIComponent(t)}')">Practice Quiz on ${t}</button>
    </div>`;
}

/* ==================== STUDY HUB ==================== */
function renderStudyHub(app){
  app.innerHTML = `
    <div class="topbar"><h2 style="margin:0;">Study</h2></div>
    <div class="container">
      <div class="glass topic-row" onclick="navigate('flashcards/all')"><div><div style="font-weight:600;">🗂️ Flashcards</div><div class="tiny">Quick revision cards, all modules</div></div><span>›</span></div>
      <div class="glass topic-row" onclick="navigate('bookmarks')"><div><div style="font-weight:600;">🔖 Bookmarked Questions</div><div class="tiny">${state.bookmarks.length} saved</div></div><span>›</span></div>
      <h3 style="margin:20px 0 10px;">Quick Notes by Module</h3>
      ${SYLLABUS.map(m=>`
        <div class="glass" style="margin-bottom:12px;">
          <span class="badge" style="background:${m.color}22;color:${m.color};margin-bottom:8px;display:inline-block;">${m.code}</span>
          ${m.topics.map(t=>`<div class="topic-row" onclick="navigate('notes/${encodeURIComponent(t.title)}')"><div style="font-size:14px;">${t.title}</div><span style="color:var(--text-muted);">›</span></div>`).join('')}
        </div>`).join('')}
    </div>`;
}

/* ==================== FLASHCARDS ==================== */
let fcState = { list:[], index:0, flipped:false };
function renderFlashcards(app, moduleFilter){
  fcState.list = moduleFilter==='all' ? FLASHCARDS : FLASHCARDS.filter(f=>f.module===moduleFilter);
  fcState.index = 0; fcState.flipped = false;
  drawFlashcard(app);
}
function drawFlashcard(app){
  const card = fcState.list[fcState.index];
  app.innerHTML = `
    <div class="topbar"><button class="backlink" onclick="navigate('study')">← Back</button><div class="tiny">${fcState.index+1}/${fcState.list.length}</div></div>
    <div class="container">
      <div class="flip-card" id="flipCard">
        <div class="flip-inner ${fcState.flipped?'flipped':''}">
          <div class="flip-front glass"><span class="badge">${card.module}</span><div class="flip-text">${card.front}</div><div class="tiny" style="margin-top:14px;">Tap to flip</div></div>
          <div class="flip-back glass"><div class="flip-text" style="font-size:15px;line-height:1.6;">${card.back}</div></div>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button class="btn btn-outline" id="prevFc">Previous</button>
        <button class="btn btn-primary" id="nextFc">Next</button>
      </div>
    </div>`;
  document.getElementById('flipCard').onclick = ()=>{ fcState.flipped=!fcState.flipped; drawFlashcard(app); };
  document.getElementById('prevFc').onclick = (e)=>{ e.stopPropagation(); fcState.index=(fcState.index-1+fcState.list.length)%fcState.list.length; fcState.flipped=false; drawFlashcard(app); };
  document.getElementById('nextFc').onclick = (e)=>{ e.stopPropagation(); fcState.index=(fcState.index+1)%fcState.list.length; fcState.flipped=false;
    state.flashcardsReviewed=(state.flashcardsReviewed||0)+1; Store.save(state); drawFlashcard(app); };
}

/* ==================== BOOKMARKS ==================== */
function renderBookmarks(app){
  const list = QUESTIONS.filter(q=>state.bookmarks.includes(q.id));
  app.innerHTML = `
    <div class="topbar"><button class="backlink" onclick="navigate('study')">← Back</button></div>
    <div class="container">
      <h2>Bookmarked Questions</h2>
      <div id="bmList"></div>
    </div>`;
  const box = document.getElementById('bmList');
  if(list.length===0){ box.innerHTML = `<div class="glass tiny">Koi bookmark nahi hai. Quiz ke dauran ⭐ icon se questions save karein.</div>`; return; }
  list.forEach(q=>{
    const div = document.createElement('div');
    div.className='glass'; div.style.marginBottom='12px';
    div.innerHTML = `<span class="badge">${q.module}</span>
      <div style="margin:10px 0;font-weight:600;">${q.text}</div>
      <div class="tiny">Answer: ${q.options[q.correct]}</div>
      ${q.exp?`<div class="tiny" style="margin-top:6px;color:var(--text-secondary);">${q.exp}</div>`:''}`;
    box.appendChild(div);
  });
}

/* ==================== QUIZ ==================== */
let quizState = null;
function renderQuiz(app, moduleCode, topic){
  if(!quizState || quizState.moduleCode!==moduleCode || quizState.topic!==topic || quizState.fresh){
    const qs = QUESTIONS.filter(q=>q.module===moduleCode && (!topic || q.topic===topic));
    quizState = { moduleCode, topic, questions:qs, index:0, answers:{}, startedAt:Date.now(), fresh:false, mock:false };
  }
  drawQuizQuestion(app);
}

function drawQuizQuestion(app){
  const { moduleCode, topic } = quizState;
  if(quizState.questions.length===0){
    app.innerHTML = `<div class="container" style="padding-top:40px;text-align:center;">
      <div class="glass">Iss topic ke liye abhi questions add nahi hue.</div>
      <button class="btn btn-outline" style="margin-top:16px;" onclick="navigate('module/${moduleCode}')">Wapas jayein</button>
    </div>`;
    return;
  }
  const q = quizState.questions[quizState.index];
  const total = quizState.questions.length;
  const progressPct = Math.round(((quizState.index+1)/total)*100);
  const isLast = quizState.index === total-1;
  const bookmarked = state.bookmarks.includes(q.id);

  app.innerHTML = `
    <div class="topbar">
      <div style="font-weight:600;">${quizState.mock?'Mock Test':moduleCode+' Quiz'}</div>
      ${quizState.mock?`<div class="tiny" id="mockTimer" style="color:var(--amber);font-weight:700;"></div>`:''}
    </div>
    <div class="container">
      <div class="progress-track"><div class="progress-fill" style="width:${progressPct}%"></div></div>
      <div class="tiny" style="margin:8px 0 16px;">Question ${quizState.index+1} of ${total}</div>
      <div class="glass">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <span style="color:var(--cyan);font-size:12px;font-weight:600;">${q.topic}</span>
          <button class="chip-star ${bookmarked?'active':''}" id="bmBtn">${bookmarked?'⭐':'☆'}</button>
        </div>
        <div style="font-size:16px;font-weight:600;margin-bottom:18px;">${q.text}</div>
        <div id="optionsBox"></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;">
        ${quizState.index>0 ? `<button class="btn btn-outline" id="backBtn">Back</button>` : ''}
        <button class="btn btn-primary" id="nextBtn">${isLast?'Submit':'Next'}</button>
      </div>
    </div>`;

  const optionsBox = document.getElementById('optionsBox');
  q.options.forEach((opt,i)=>{
    const div = document.createElement('div');
    div.className = 'option' + (quizState.answers[q.id]===i ? ' selected':'');
    div.innerHTML = `<span class="radio"></span><span>${opt}</span>`;
    div.onclick = ()=>{ quizState.answers[q.id]=i; drawQuizQuestion(app); };
    optionsBox.appendChild(div);
  });

  document.getElementById('bmBtn').onclick = ()=>{
    const idx = state.bookmarks.indexOf(q.id);
    if(idx>-1) state.bookmarks.splice(idx,1); else state.bookmarks.push(q.id);
    Store.save(state); drawQuizQuestion(app);
  };
  if(quizState.index>0) document.getElementById('backBtn').onclick = ()=>{ quizState.index--; drawQuizQuestion(app); };
  document.getElementById('nextBtn').onclick = ()=>{
    if(isLast){ finishQuiz(); } else { quizState.index++; drawQuizQuestion(app); }
  };

  if(quizState.mock) startMockTimer(app);
}

function startMockTimer(app){
  if(quizState.timerInterval) clearInterval(quizState.timerInterval);
  quizState.timerInterval = setInterval(()=>{
    const remaining = quizState.deadline - Date.now();
    const el = document.getElementById('mockTimer');
    if(remaining<=0){ clearInterval(quizState.timerInterval); finishQuiz(); return; }
    if(el){ const m=Math.floor(remaining/60000), s=Math.floor((remaining%60000)/1000); el.textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`; }
  }, 1000);
}

function finishQuiz(){
  if(quizState.timerInterval) clearInterval(quizState.timerInterval);
  const total = quizState.questions.length;
  let correct = 0;
  quizState.questions.forEach(q=>{ if(quizState.answers[q.id]===q.correct) correct++; });
  const timeTaken = Math.round((Date.now()-quizState.startedAt)/1000);
  const xpGain = correct*10;
  const moduleCode = quizState.mock ? 'MOCK' : quizState.moduleCode;

  if(!quizState.mock){
    state.moduleXp[moduleCode] = (state.moduleXp[moduleCode]||0) + xpGain;
  }
  state.attempts.unshift({ moduleCode, topic:quizState.topic, total, correct, timeTaken, xpGain, at:Date.now(), mock:quizState.mock });
  state.attempts = state.attempts.slice(0,50);
  Store.save(state);

  quizState.result = { total, correct, timeTaken, xpGain, moduleCode, mock:quizState.mock };
  quizState.fresh = true;
  checkAchievements();
  navigate('result');
}

/* ==================== MOCK TEST SETUP ==================== */
function renderMockTestSetup(app){
  app.innerHTML = `
    <div class="topbar"><button class="backlink" onclick="navigate('dashboard')">← Back</button></div>
    <div class="container">
      <h2>Full Syllabus Mock Test</h2>
      <div class="muted" style="margin-bottom:20px;">Sabhi 4 modules se random questions, real exam jaisa timed experience.</div>
      <div class="glass" style="margin-bottom:16px;">
        <div class="topic-row"><span>Questions</span><b>30</b></div>
        <div class="topic-row"><span>Time limit</span><b>20 minutes</b></div>
        <div class="topic-row"><span>Passing</span><b>33%</b></div>
      </div>
      <button class="btn btn-primary" id="beginMock">Mock Test Shuru Karein</button>
    </div>`;
  document.getElementById('beginMock').onclick = ()=>{
    const pool = [...QUESTIONS].sort(()=>Math.random()-0.5).slice(0,30);
    quizState = { moduleCode:'MOCK', topic:null, questions:pool, index:0, answers:{}, startedAt:Date.now(), fresh:false, mock:true, deadline: Date.now()+20*60*1000 };
    navigate('quiz/MOCK/');
  };
}

/* ==================== RESULT (with review) ==================== */
function renderResult(app){
  if(!quizState || !quizState.result) return navigate('dashboard');
  const { total, correct, timeTaken, xpGain, moduleCode, mock } = quizState.result;
  const pct = Math.round((correct/total)*100);
  const passed = pct >= 33;
  app.innerHTML = `
    <div class="container" style="padding-top:24px;">
      <h2 style="text-align:center;">${mock?'Mock Test Result':'Quiz Complete'}</h2>
      <div class="glass" style="text-align:center;margin:20px 0;">
        <div class="score-ring"><canvas id="resultChart"></canvas>
          <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <div style="font-size:28px;font-weight:700;">${pct}%</div>
            <div class="tiny">${correct}/${total} correct</div>
          </div>
        </div>
        <div style="margin-top:14px;">
          <span class="badge" style="background:${passed?'rgba(74,222,128,0.15)':'rgba(255,107,107,0.15)'};color:${passed?'var(--success)':'var(--error)'};">
            ${passed?'PASS':'NEEDS PRACTICE'}
          </span>
        </div>
      </div>
      <div class="glass stat-row">
        <div><div style="font-weight:700;">${timeTaken}s</div><div class="tiny">Time taken</div></div>
        <div><div style="font-weight:700;">${moduleCode}</div><div class="tiny">Module</div></div>
        <div><div style="font-weight:700;color:var(--cyan);">+${xpGain}</div><div class="tiny">XP earned</div></div>
      </div>
      <button class="btn btn-outline" style="margin-top:16px;" id="reviewBtn">Answers Review Karein</button>
      <button class="btn btn-primary" style="margin-top:12px;" onclick="navigate('dashboard')">Back to Dashboard</button>
      <div id="reviewBox"></div>
    </div>`;

  new Chart(document.getElementById('resultChart'), {
    type:'doughnut',
    data:{ datasets:[{ data:[correct, total-correct], backgroundColor:['#64FFDA','rgba(128,128,128,0.2)'], borderWidth:0 }]},
    options:{ cutout:'72%', plugins:{legend:{display:false}, tooltip:{enabled:false}} }
  });

  document.getElementById('reviewBtn').onclick = (e)=>{
    const box = document.getElementById('reviewBox');
    if(box.dataset.open==='1'){ box.innerHTML=''; box.dataset.open='0'; e.target.textContent='Answers Review Karein'; return; }
    box.dataset.open='1'; e.target.textContent='Review Band Karein';
    box.innerHTML = quizState.questions.map(q=>{
      const userAns = quizState.answers[q.id];
      const isCorrect = userAns===q.correct;
      return `<div class="glass" style="margin-top:14px;">
        <div style="font-size:12px;color:var(--cyan);font-weight:600;margin-bottom:6px;">${q.topic}</div>
        <div style="font-weight:600;margin-bottom:10px;">${q.text}</div>
        ${q.options.map((opt,i)=>{
          let cls='option';
          if(i===q.correct) cls+=' correct';
          else if(i===userAns && !isCorrect) cls+=' wrong';
          return `<div class="${cls}" style="cursor:default;"><span class="radio"></span><span>${opt}</span></div>`;
        }).join('')}
        ${q.exp?`<div class="tiny" style="margin-top:8px;">${q.exp}</div>`:''}
      </div>`;
    }).join('');
  };
}

/* ==================== ACHIEVEMENTS ==================== */
function checkAchievements(){
  ACHIEVEMENTS.forEach(a=>{
    if(a.check(state) && !state[`ach_${a.id}`]){
      state[`ach_${a.id}`] = true;
    }
  });
  Store.save(state);
}

/* ==================== PROFILE ==================== */
function renderProfile(app){
  const unlocked = ACHIEVEMENTS.filter(a=>state[`ach_${a.id}`]);
  app.innerHTML = `
    <div class="topbar"><h2 style="margin:0;">Progress</h2></div>
    <div class="container">
      <div class="glass" style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
        <div class="brand-icon">👤</div>
        <div><div style="font-weight:600;">${state.name}</div><div class="tiny">${state.attempts.length} quizzes · 🔥 ${state.streak} day streak</div></div>
      </div>
      <div class="glass" style="margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:12px;">Module-wise XP</div>
        <canvas id="xpChart" height="180"></canvas>
      </div>
      <div class="glass" style="margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:10px;">Achievements (${unlocked.length}/${ACHIEVEMENTS.length})</div>
        <div class="ach-grid">
          ${ACHIEVEMENTS.map(a=>`<div class="ach-item ${state[`ach_${a.id}`]?'unlocked':''}">
            <div style="font-size:22px;">${a.icon}</div>
            <div style="font-size:11px;font-weight:600;margin-top:4px;">${a.title}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="glass" style="margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:8px;">Recent Attempts</div>
        <div id="attemptsList"></div>
      </div>
    </div>`;

  new Chart(document.getElementById('xpChart'), {
    type:'bar',
    data:{ labels: SYLLABUS.map(m=>m.code.replace('-R5','')),
      datasets:[{ data: SYLLABUS.map(m=>state.moduleXp[m.code]||0), backgroundColor: SYLLABUS.map(m=>m.color), borderRadius:6 }] },
    options:{ plugins:{legend:{display:false}}, scales:{
      y:{ ticks:{color:'#8B96A8'}, grid:{color:'rgba(128,128,128,0.1)'} },
      x:{ ticks:{color:'#8B96A8'}, grid:{display:false} } } }
  });

  const list = document.getElementById('attemptsList');
  if(state.attempts.length===0){ list.innerHTML = `<div class="tiny">Abhi tak koi quiz attempt nahi hua.</div>`; }
  else state.attempts.slice(0,8).forEach(a=>{
    const row = document.createElement('div');
    row.className='topic-row';
    const pct = Math.round((a.correct/a.total)*100);
    row.innerHTML = `<div><div style="font-weight:600;font-size:14px;">${a.mock?'Mock Test':a.moduleCode}${a.topic?' · '+a.topic:''}</div>
      <div class="tiny">${new Date(a.at).toLocaleDateString()}</div></div>
      <span style="color:${pct>=33?'var(--success)':'var(--error)'};font-weight:700;">${pct}%</span>`;
    list.appendChild(row);
  });
}

/* ==================== SETTINGS ==================== */
function renderSettings(app){
  app.innerHTML = `
    <div class="topbar"><button class="backlink" onclick="navigate('dashboard')">← Back</button></div>
    <div class="container">
      <h2>Settings</h2>
      <div class="glass" style="margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:10px;">Theme</div>
        <div style="display:flex;gap:10px;">
          <button class="chip ${state.theme==='dark'?'chip-accent':''}" id="darkBtn">🌙 Dark</button>
          <button class="chip ${state.theme==='light'?'chip-accent':''}" id="lightBtn">☀️ Light</button>
        </div>
      </div>
      <div class="glass" style="margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:8px;">Exam Date</div>
        <input type="date" class="input" id="examInput" value="${state.examDate}" />
        <button class="btn btn-outline" id="saveExam">Save</button>
      </div>
      <div class="glass" style="margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:8px;">Backup & Restore</div>
        <div class="tiny" style="margin-bottom:10px;">Progress ka JSON backup download karein, ya kisi purani backup file se restore karein.</div>
        <button class="btn btn-outline" id="exportBtn" style="margin-bottom:10px;">Export Backup</button>
        <input type="file" id="importFile" accept=".json" style="display:none;" />
        <button class="btn btn-outline" id="importBtn">Import Backup</button>
      </div>
      <div class="glass" style="margin-bottom:16px;">
        <div style="font-weight:600;margin-bottom:8px;color:var(--error);">Danger Zone</div>
        <button class="btn btn-outline" id="resetBtn" style="border-color:var(--error);color:var(--error);">Sab Data Reset Karein</button>
      </div>
      <div class="tiny" style="text-align:center;">O Level Prep v2.0 — 100% offline, no ads, no tracking.</div>
    </div>`;

  document.getElementById('darkBtn').onclick = ()=>{ state.theme='dark'; applyTheme('dark'); Store.save(state); renderSettings(app); };
  document.getElementById('lightBtn').onclick = ()=>{ state.theme='light'; applyTheme('light'); Store.save(state); renderSettings(app); };
  document.getElementById('saveExam').onclick = ()=>{ state.examDate = document.getElementById('examInput').value; Store.save(state); alert('Saved!'); };

  document.getElementById('exportBtn').onclick = ()=>{
    const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `olevel-prep-backup-${Date.now()}.json`; a.click();
  };
  document.getElementById('importBtn').onclick = ()=>document.getElementById('importFile').click();
  document.getElementById('importFile').onchange = (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{ try{ state = {...Store.default(), ...JSON.parse(reader.result)}; Store.save(state); applyTheme(state.theme); alert('Restore ho gaya!'); navigate('dashboard'); } catch(err){ alert('Invalid backup file.'); } };
    reader.readAsText(file);
  };
  document.getElementById('resetBtn').onclick = ()=>{
    if(confirm('Pura progress reset ho jayega. Confirm karein?')){
      state = Store.default(); Store.save(state); location.reload();
    }
  };
}

/* ==================== CODE PLAYGROUND ==================== */
function renderPlayground(app){
  app.innerHTML = `
    <div class="topbar"><h2 style="margin:0;">Code Playground</h2></div>
    <div class="container">
      <div style="display:flex;gap:10px;margin-bottom:14px;">
        <button class="chip chip-accent" id="tabWeb">Web (HTML/CSS/JS)</button>
        <button class="chip" id="tabPy">Python</button>
      </div>
      <div id="playgroundBox"></div>
    </div>`;
  document.getElementById('tabWeb').onclick = ()=>drawWebPlayground();
  document.getElementById('tabPy').onclick = ()=>drawPyPlayground();
  drawWebPlayground();

  function setActiveTab(id){
    document.getElementById('tabWeb').className = id==='web'?'chip chip-accent':'chip';
    document.getElementById('tabPy').className = id==='py'?'chip chip-accent':'chip';
  }

  function drawWebPlayground(){
    setActiveTab('web');
    const box = document.getElementById('playgroundBox');
    box.innerHTML = `
      <textarea id="webCode" class="code-editor" spellcheck="false">&lt;h2 style="color:#64FFDA;font-family:sans-serif;"&gt;Hello O Level!&lt;/h2&gt;
&lt;p&gt;Yahan apna HTML, CSS (&lt;style&gt;) aur JS (&lt;script&gt;) likhein.&lt;/p&gt;
&lt;button onclick="alert('Chala!')"&gt;Click Me&lt;/button&gt;</textarea>
      <button class="btn btn-primary" style="margin:12px 0;" id="runWeb">▶ Run</button>
      <iframe id="webOutput" class="code-output"></iframe>`;
    document.getElementById('runWeb').onclick = ()=>{
      const code = document.getElementById('webCode').value;
      const frame = document.getElementById('webOutput');
      frame.srcdoc = code;
    };
    document.getElementById('runWeb').click();
  }

  let pyodideInstance = null;
  async function drawPyPlayground(){
    setActiveTab('py');
    const box = document.getElementById('playgroundBox');
    box.innerHTML = `
      <textarea id="pyCode" class="code-editor" spellcheck="false">name = "O Level Student"
for i in range(1, 4):
    print(f"Hello {name}, attempt {i}")</textarea>
      <button class="btn btn-primary" style="margin:12px 0;" id="runPy">▶ Run</button>
      <div class="tiny" id="pyStatus">Python engine load ho raha hai (pehli baar ~10-15 sec lagenge, phir fast)...</div>
      <pre class="code-output" id="pyOutput" style="padding:14px;overflow:auto;"></pre>`;
    const statusEl = document.getElementById('pyStatus');
    try{
      if(!pyodideInstance){
        pyodideInstance = await loadPyodide();
      }
      statusEl.textContent = 'Ready ✓';
    }catch(e){ statusEl.textContent = 'Python engine load nahi ho paya — internet check karein.'; }

    document.getElementById('runPy').onclick = async ()=>{
      const out = document.getElementById('pyOutput');
      out.textContent = 'Running...';
      try{
        if(!pyodideInstance){ pyodideInstance = await loadPyodide(); }
        let logs = '';
        pyodideInstance.setStdout({ batched:(s)=> logs += s + '\\n' });
        await pyodideInstance.runPythonAsync(document.getElementById('pyCode').value);
        out.textContent = logs || '(no output)';
      }catch(err){ out.textContent = 'Error: ' + err.message; }
    };
  }
}

/* ==================== AI DOUBT ASSISTANT ==================== */
function renderAssistant(app){
  app.innerHTML = `
    <div class="topbar"><h2 style="margin:0;">AI Doubt Assistant</h2></div>
    <div class="container">
      <div class="chat-box" id="chatBox"></div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <input class="input" id="chatInput" placeholder="Apna doubt likhein..." style="margin-bottom:0;flex:1;" />
        <button class="btn btn-primary" style="width:auto;padding:0 20px;" id="sendBtn">➤</button>
      </div>
      <div class="tiny" id="assistantNote" style="margin-top:10px;text-align:center;"></div>
    </div>`;

  const chatBox = document.getElementById('chatBox');
  function drawChat(){
    chatBox.innerHTML = state.chatHistory.map(m=>`
      <div class="chat-msg ${m.role}"><div class="chat-bubble">${m.text}</div></div>
    `).join('') || `<div class="tiny" style="text-align:center;padding:30px 0;">O Level syllabus se related koi bhi sawal poochein — Python, Web Design, IT Tools, IoT, kuch bhi.</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  drawChat();

  async function send(){
    const input = document.getElementById('chatInput');
    const text = input.value.trim(); if(!text) return;
    state.chatHistory.push({role:'user', text}); input.value=''; Store.save(state); drawChat();
    state.chatHistory.push({role:'assistant', text:'…'}); drawChat();
    const noteEl = document.getElementById('assistantNote'); noteEl.textContent='';

    try{
      const resp = await fetch('/.netlify/functions/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: text })
      });
      const data = await resp.json();
      if(data.error){
        state.chatHistory[state.chatHistory.length-1] = {role:'assistant', text:'Assistant abhi available nahi hai.'};
        noteEl.textContent = 'Ye feature sirf Netlify par deploy karne ke baad kaam karta hai (local test mein nahi) — README dekhein.';
      } else {
        state.chatHistory[state.chatHistory.length-1] = {role:'assistant', text:data.reply};
      }
    }catch(e){
      state.chatHistory[state.chatHistory.length-1] = {role:'assistant', text:'Assistant abhi available nahi hai.'};
      noteEl.textContent = 'Ye feature sirf Netlify par deploy karne ke baad kaam karta hai (local test mein nahi) — README dekhein.';
    }
    Store.save(state); drawChat();
  }
  document.getElementById('sendBtn').onclick = send;
  document.getElementById('chatInput').onkeydown = (e)=>{ if(e.key==='Enter') send(); };
}

/* ==================== CIRCUIT BACKGROUND ==================== */
(function circuitBg(){
  const canvas = document.getElementById('circuit-bg');
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; draw(); }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = 'rgba(100,255,218,0.06)';
    ctx.fillStyle = 'rgba(100,255,218,0.1)';
    ctx.lineWidth = 1;
    const step = 64;
    for(let x=0;x<canvas.width;x+=step){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height*0.12); ctx.lineTo(x+step/2, canvas.height*0.12+step/2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, canvas.height*0.12, 2, 0, Math.PI*2); ctx.fill();
    }
  }
  window.addEventListener('resize', resize);
  resize();
})();

/* ==================== PWA INSTALL PROMPT ==================== */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault(); deferredPrompt = e;
  document.getElementById('installBanner').classList.add('show');
});
document.getElementById('installBtn').onclick = async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installBanner').classList.remove('show');
};

/* ==================== SERVICE WORKER ==================== */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
