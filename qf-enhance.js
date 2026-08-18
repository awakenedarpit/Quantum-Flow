// QuantumFlow enhancement layer: dependency-free productivity UX.
(() => {
  let deferredInstall = null;
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once:true }) : fn();
  const esc = (s) => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

  function status() {
    if (document.querySelector('.qf-status')) return;
    const el = document.createElement('div');
    el.className = 'qf-status ' + (navigator.onLine ? 'online' : 'offline');
    el.textContent = navigator.onLine ? '● Online' : '● Offline mode';
    document.body.appendChild(el);
    const update = () => { el.className = 'qf-status ' + (navigator.onLine ? 'online' : 'offline'); el.textContent = navigator.onLine ? '● Online' : '● Offline mode'; };
    addEventListener('online', update); addEventListener('offline', update);
  }

  function installPrompt() {
    addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); deferredInstall = e;
      if (localStorage.getItem('qf-install-dismissed') === '1' || document.querySelector('.qf-install')) return;
      const bar = document.createElement('div');
      bar.className = 'qf-install';
      bar.innerHTML = '<div class="grow"><b>⚛️ Install QuantumFlow</b><div class="muted">Add it to your home screen for a faster app-like experience.</div></div><button class="btn" id="qfInstallBtn">Install</button><button class="btn secondary" id="qfInstallClose" aria-label="Dismiss">×</button>';
      document.body.appendChild(bar);
      document.getElementById('qfInstallClose')?.addEventListener('click', () => { localStorage.setItem('qf-install-dismissed','1'); bar.remove(); });
      document.getElementById('qfInstallBtn')?.addEventListener('click', async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice.catch(()=>null); deferredInstall=null; bar.remove(); });
    });
  }

  function shortcuts() {
    addEventListener('keydown', (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const map = {'1':'home','2':'habits','3':'study','4':'progress','5':'goals','6':'leaderboard','7':'profile'};
      if (map[e.key] && typeof window.openTab === 'function') { e.preventDefault(); window.openTab(map[e.key]); }
    });
  }

  function clickFeedback() {
    document.addEventListener('click', (e) => { const b=e.target.closest('button'); if(!b||b.disabled)return; b.classList.remove('qf-click'); void b.offsetWidth; b.classList.add('qf-click'); }, {passive:true});
  }

  function momentum() {
    const app=document.getElementById('app');
    if(!app || !window.state || state.tab!=='home' || !window.currentUser) return;
    if(document.getElementById('qfMomentum')) return;
    const habits=Array.isArray(state.habits)?state.habits:[], goals=Array.isArray(state.goals)?state.goals:[], study=Array.isArray(state.study)?state.study:[];
    const doneHabits=habits.filter(h=>h.completed_today||h.done_today||h.completed).length;
    const totalHabits=habits.length;
    const doneGoals=goals.filter(g=>g.completed||g.done).length;
    const plannedStudy=study.filter(s=>s.planned_date===new Date().toISOString().slice(0,10));
    const doneStudy=plannedStudy.filter(s=>s.completed).length;
    const habitPct=totalHabits?Math.round(doneHabits/totalHabits*100):0;
    const score=Math.min(100, Math.round((habitPct*.55)+(doneGoals?25:0)+(doneStudy?20:0)));
    const level=Math.max(1,Math.floor((Number(state.profile?.xp)||0)/100)+1);
    const card=document.createElement('section'); card.id='qfMomentum'; card.className='card qf-momentum';
    card.innerHTML=`<div class="qf-section-head"><div><span class="qf-kicker">TODAY • MOMENTUM</span><h2>Keep the flow going</h2></div><span class="qf-score">${score}%</span></div><div class="qf-momentum-grid"><div><b>${doneHabits}/${totalHabits}</b><span>habits today</span></div><div><b>${doneStudy}/${plannedStudy.length}</b><span>study plans</span></div><div><b>${doneGoals}</b><span>goals completed</span></div><div><b>Lv ${level}</b><span>current level</span></div></div><div class="qf-progress"><i style="width:${score}%"></i></div><p class="muted small">${score>=80?'Excellent momentum. Protect it.':score>=40?'Nice start. One more win can change the day.':'Start with one small win — momentum follows action.'}</p>`;
    const anchor=app.querySelector('.card')||app.firstElementChild; if(anchor?.parentNode) anchor.parentNode.insertBefore(card,anchor.nextSibling); else app.appendChild(card);
  }

  function achievements() {
    const app=document.getElementById('app'); if(!app||!window.state||!window.currentUser||state.tab!=='profile')return;
    if(document.getElementById('qfAchievements'))return;
    const xp=Number(state.profile?.xp)||0, habits=Array.isArray(state.habits)?state.habits:[], study=Array.isArray(state.study)?state.study:[], goals=Array.isArray(state.goals)?state.goals:[];
    const unlocked=[
      ['🌱','First Step','Create your first habit',habits.length>=1],
      ['📚','Study Starter','Complete a study plan',study.some(s=>s.completed)],
      ['🎯','Goal Crusher','Complete a goal',goals.some(g=>g.completed||g.done)],
      ['⚡','1K Club','Earn 1,000 XP',xp>=1000],
      ['💎','Consistency','Complete 10 habits',habits.filter(h=>h.completed).length>=10]
    ];
    const card=document.createElement('section'); card.id='qfAchievements'; card.className='card qf-achievements';
    card.innerHTML=`<div class="qf-section-head"><div><span class="qf-kicker">MILESTONES</span><h2>Achievements</h2></div><span class="badge">${unlocked.filter(x=>x[3]).length}/${unlocked.length}</span></div><div class="qf-ach-grid">${unlocked.map(a=>`<div class="qf-ach ${a[3]?'unlocked':''}"><span class="qf-ach-icon">${a[0]}</span><div><b>${esc(a[1])}</b><small>${esc(a[2])}</small></div>${a[3]?'<em>✓</em>':'<em>•</em>'}</div>`).join('')}</div>`;
    app.appendChild(card);
  }

  function enhanceView(){ setTimeout(()=>{ momentum(); achievements(); },120); }

  ready(() => {
    status(); installPrompt(); shortcuts(); clickFeedback();
    const observer=new MutationObserver(enhanceView); observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    enhanceView();
  });
})();
