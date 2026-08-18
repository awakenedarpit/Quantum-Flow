// QuantumFlow enhancement layer: dependency-free productivity UX.
(() => {
  let deferredInstall=null;
  const ready=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const client=()=>window.qfSupabaseClient;
  let cache={uid:null,profile:null,habits:[],study:[],goals:[]};

  function status(){
    if(document.querySelector('.qf-status'))return;
    const el=document.createElement('div');el.className='qf-status '+(navigator.onLine?'online':'offline');el.textContent=navigator.onLine?'● Online':'● Offline mode';document.body.appendChild(el);
    const update=()=>{el.className='qf-status '+(navigator.onLine?'online':'offline');el.textContent=navigator.onLine?'● Online':'● Offline mode'};addEventListener('online',update);addEventListener('offline',update);
  }
  function installPrompt(){
    addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(localStorage.getItem('qf-install-dismissed')==='1'||document.querySelector('.qf-install'))return;const bar=document.createElement('div');bar.className='qf-install';bar.innerHTML='<div class="grow"><b>⚛️ Install QuantumFlow</b><div class="muted">Add it to your home screen for a faster app-like experience.</div></div><button class="btn" id="qfInstallBtn">Install</button><button class="btn secondary" id="qfInstallClose">×</button>';document.body.appendChild(bar);document.getElementById('qfInstallClose')?.addEventListener('click',()=>{localStorage.setItem('qf-install-dismissed','1');bar.remove()});document.getElementById('qfInstallBtn')?.addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice.catch(()=>null);deferredInstall=null;bar.remove()})});
  }
  function shortcuts(){addEventListener('keydown',e=>{if(/input|textarea|select/i.test(e.target?.tagName||''))return;const map={'1':'home','2':'habits','3':'study','4':'progress','5':'goals','6':'leaderboard','7':'profile'};if(map[e.key]&&typeof window.openTab==='function'){e.preventDefault();window.openTab(map[e.key])}})}
  function clickFeedback(){document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;b.classList.remove('qf-click');void b.offsetWidth;b.classList.add('qf-click')},{passive:true})}

  async function loadStats(){
    const c=client();if(!c)return false;const {data:{session}}=await c.auth.getSession();if(!session){cache={uid:null,profile:null,habits:[],study:[],goals:[]};return false}
    if(cache.uid===session.user.id)return true;cache.uid=session.user.id;
    const uid=session.user.id;
    const [p,h,s,g]=await Promise.all([
      c.from('profiles').select('display_name,xp,role').eq('id',uid).maybeSingle(),
      c.from('habits').select('id,name').eq('user_id',uid).eq('is_active',true),
      c.from('study_sessions').select('duration_minutes,completed').eq('user_id',uid).order('started_at',{ascending:false}).limit(100),
      c.from('goals').select('id,title,progress,completed').eq('user_id',uid).limit(100)
    ]);cache.profile=p.data||{xp:0};cache.habits=h.data||[];cache.study=s.data||[];cache.goals=g.data||[];return true;
  }

  function momentum(){
    const app=document.getElementById('app');if(!app||!window.qfEnhanceReady||!cache.uid||!window.location.pathname.includes('Quantum-Flow')||document.getElementById('qfMomentum'))return;
    const doneStudy=cache.study.filter(x=>x.completed).length,studyCount=cache.study.length,doneGoals=cache.goals.filter(x=>x.completed).length,goalCount=cache.goals.length;
    const xp=Number(cache.profile?.xp)||0,level=Math.max(1,Math.floor(xp/250)+1);const score=Math.min(100,Math.round((doneStudy?35:0)+(doneGoals?25:0)+(cache.habits.length?20:0)+(Math.min(20,xp/2500*20))));
    const card=document.createElement('section');card.id='qfMomentum';card.className='card qf-momentum';card.innerHTML=`<div class="qf-section-head"><div><span class="qf-kicker">TODAY • MOMENTUM</span><h2>Keep the flow going</h2></div><span class="qf-score">${score}%</span></div><div class="qf-momentum-grid"><div><b>${cache.habits.length}</b><span>active habits</span></div><div><b>${doneStudy}</b><span>study sessions</span></div><div><b>${doneGoals}/${goalCount}</b><span>goals complete</span></div><div><b>Lv ${level}</b><span>${xp.toLocaleString()} XP</span></div></div><div class="qf-progress"><i style="width:${score}%"></i></div><p class="muted small">${score>=80?'Excellent momentum. Protect it.':score>=40?'Nice start. One more win can change the day.':'Start with one small win — momentum follows action.'}</p>`;
    const anchor=app.querySelector('.card');if(anchor?.parentNode)anchor.parentNode.insertBefore(card,anchor.nextSibling);else app.appendChild(card);
  }
  function achievements(){
    const app=document.getElementById('app');if(!app||!cache.uid||document.getElementById('qfAchievements')||!document.body.innerText.includes('Profile'))return;
    const xp=Number(cache.profile?.xp)||0,studyDone=cache.study.filter(x=>x.completed).length,goalDone=cache.goals.filter(x=>x.completed).length;
    const a=[['🌱','First Step','Create your first habit',cache.habits.length>=1],['📚','Study Starter','Complete a study session',studyDone>=1],['🎯','Goal Crusher','Complete a goal',goalDone>=1],['⚡','1K Club','Earn 1,000 XP',xp>=1000],['🚀','Deep Focus','Complete 10 study sessions',studyDone>=10]];
    const card=document.createElement('section');card.id='qfAchievements';card.className='card qf-achievements';card.innerHTML=`<div class="qf-section-head"><div><span class="qf-kicker">MILESTONES</span><h2>Achievements</h2></div><span class="badge">${a.filter(x=>x[3]).length}/${a.length}</span></div><div class="qf-ach-grid">${a.map(x=>`<div class="qf-ach ${x[3]?'unlocked':''}"><span class="qf-ach-icon">${x[0]}</span><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div><em>${x[3]?'✓':'•'}</em></div>`).join('')}</div>`;app.appendChild(card);
  }
  async function enhance(){
    try{window.qfEnhanceReady=await loadStats();if(!window.qfEnhanceReady)return;const tabText=document.querySelector('#app')?.innerText||'';if(/Today's quote|TODAY'S QUOTE/i.test(tabText))momentum();if(/Profile|profile/i.test(tabText))achievements()}catch(e){console.debug('QuantumFlow enhancement:',e)}
  }
  ready(()=>{status();installPrompt();shortcuts();clickFeedback();setTimeout(enhance,700);new MutationObserver(()=>setTimeout(enhance,250)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true})});
})();
