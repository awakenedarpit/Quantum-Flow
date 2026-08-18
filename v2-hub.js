/* QuantumFlow V2 Hub: keeps the existing SPA intact while making every V2 feature reachable from the main webpage. */
(function(){
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  let lastUser=null,profile=null;
  async function loadProfile(){
    if(!window.supabaseClient||!window.currentUser)return;
    if(lastUser===window.currentUser.id&&profile)return;
    lastUser=window.currentUser.id;
    const {data}=await window.supabaseClient.from('profiles').select('display_name,xp,leaderboard_visible').eq('id',lastUser).maybeSingle();
    profile=data||{display_name:'Quantum User',xp:0,leaderboard_visible:true};
  }
  function panel(){
    if(!window.currentUser||!document.querySelector('#app .wrap'))return;
    const old=document.getElementById('qf-v2-hub');if(old)old.remove();
    const el=document.createElement('section');el.id='qf-v2-hub';el.className='card qf-hub';
    const xp=Number(profile?.xp||0);const level=Math.max(1,Math.floor(xp/250)+1);const next=level*250;const pct=Math.min(100,Math.round((xp-(level-1)*250)/250*100));
    el.innerHTML=`<div class="qf-hub-head"><div><div class="qf-kicker">QUANTUMFLOW V2</div><h2>Your command center</h2><p class="muted">Everything you've built so far, in one place.</p></div><button class="theme-toggle" id="qf-theme-toggle">${document.documentElement.dataset.theme==='light'?'☀️':'🌙'}</button></div><div class="qf-xp"><div><span class="muted">⚡ XP</span><strong>${xp.toLocaleString()}</strong><span class="badge">Level ${level}</span></div><div class="qf-xpbar"><i style="width:${pct}%"></i></div><small class="muted">${Math.max(0,next-xp)} XP to next level</small></div><div class="qf-feature-grid"><a href="study.html" class="qf-feature"><b>📚 Study Planner</b><span>Plans + custom focus timer</span></a><a href="progress.html" class="qf-feature"><b>📊 Progress</b><span>Heatmap + streak statistics</span></a><a href="leaderboard-v2.html" class="qf-feature"><b>🏆 Leaderboard</b><span>Real XP rankings</span></a><a href="admin.html" class="qf-feature"><b>🛡️ Admin</b><span>Private analytics dashboard</span></a></div><div class="qf-hub-foot"><span class="muted">🔒 Leaderboard visibility: ${profile?.leaderboard_visible===false?'Off':'On'}</span><a href="leaderboard-v2.html">Manage community view →</a></div>`;
    const wrap=document.querySelector('#app .wrap');wrap.appendChild(el);
    document.getElementById('qf-theme-toggle').onclick=()=>{const n=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=n;localStorage.setItem('qf-theme',n);document.getElementById('qf-theme-toggle').textContent=n==='light'?'☀️':'🌙';};
  }
  async function sync(){if(!window.currentUser){const o=document.getElementById('qf-v2-hub');if(o)o.remove();return}await loadProfile();panel()}
  const observer=new MutationObserver(()=>{if(window.currentUser)sync()});
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  setInterval(()=>{if(window.currentUser)sync()},15000);
  window.addEventListener('load',()=>setTimeout(sync,300));
})();