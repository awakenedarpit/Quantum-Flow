/* QuantumFlow SPA community/profile integration. */
(function(){
  const wait=()=>{
    if(!window.state||typeof window.render!=='function'||!window.supabaseClient){setTimeout(wait,100);return;}
    const oldRender=window.render;
    const views={};
    views.leaderboard=async function(){
      const wrap=window.shell||((x)=>x);
      let html='<div class="top"><div><h2>🏆 Leaderboard</h2><div class="muted">Consistency-powered community rankings.</div></div></div><div class="card" id="qf-board"><p class="muted">Loading leaderboard…</p></div>';
      setTimeout(async()=>{
        const el=document.getElementById('qf-board');if(!el)return;
        const {data,error}=await window.supabaseClient.rpc('leaderboard_top',{p_limit:50});
        if(error){el.innerHTML='<p class="muted">'+window.esc(error.message)+'</p>';return;}
        const rows=data||[], mine=rows.find(x=>x.user_id===window.currentUser?.id);
        el.innerHTML=(mine?'<div class="badge">YOUR RANK #'+mine.rank+' • ⚡ '+mine.xp+' XP</div>':'<div class="badge">You are not currently visible on the leaderboard.</div>')+
          '<div style="margin-top:14px">'+(rows.length?rows.map(r=>'<div class="item" style="border-bottom:1px solid var(--border);padding:13px 8px"><strong style="width:45px">'+(r.rank<=3?['🥇','🥈','🥉'][r.rank-1]:'#'+r.rank)+'</strong><div class="grow"><b>'+window.esc(r.display_name)+'</b><div class="muted">Consistency matters more than perfection.</div></div><b class="color-goal">⚡ '+r.xp+'</b></div>').join(''):'<div class="empty">No public leaderboard users yet.</div>')+'</div><p class="muted small" style="margin-top:12px">Only users who choose leaderboard visibility appear here. Emails are never shown.</p>';
      },0);
      return wrap(html,'Leaderboard');
    };
    views.profile=function(){
      const u=window.currentUser||{};const name=u.user_metadata?.display_name||u.email?.split('@')[0]||'QuantumFlow User';
      return window.shell(`<div class="top"><div><h2>👤 Profile</h2><div class="muted">Your QuantumFlow account.</div></div></div><div class="card hero"><div class="badge">QUANTUMFLOW MEMBER</div><h2>${window.esc(name)}</h2><p class="muted">${window.esc(u.email||'')}</p><div class="grid" style="margin-top:14px"><div class="card metric"><div class="muted">Account</div><strong>✓</strong><span class="muted">Verified session</span></div><div class="card metric"><div class="muted">Leaderboard</div><strong>🏆</strong><span class="muted">Privacy controlled</span></div></div></div><div class="card"><h3>Preferences</h3><p class="muted">Your theme is saved locally on this device. Leaderboard visibility is controlled by your profile settings.</p><button class="btn secondary" onclick="signOut()">Sign out</button></div>`,'Profile');
    };
    const originalViews={};
    const baseRender=oldRender;
    window.render=function(){
      if(window.state?.tab==='leaderboard'||window.state?.tab==='profile'){
        const app=document.getElementById('app');
        if(app){const fn=views[window.state.tab];app.innerHTML=fn();const nav=document.getElementById('nav');if(nav)nav.className='nav';if(nav)nav.innerHTML=[['home','⌂','Home'],['habits','✓','Habits'],['study','▣','Study'],['progress','◒','Progress'],['goals','◆','Goals'],['leaderboard','🏆','Rank'],['profile','●','Profile']].map(x=>`<button class="${window.state.tab===x[0]?'active':''}" onclick="state.tab='${x[0]}';render()"><b>${x[1]}</b>${x[2]}</button>`).join('');return;}
      }
      baseRender();
      const nav=document.getElementById('nav');
      if(nav&&window.currentUser)nav.innerHTML=[['home','⌂','Home'],['habits','✓','Habits'],['study','▣','Study'],['progress','◒','Progress'],['goals','◆','Goals'],['leaderboard','🏆','Rank'],['profile','●','Profile']].map(x=>`<button class="${window.state.tab===x[0]?'active':''}" onclick="state.tab='${x[0]}';render()"><b>${x[1]}</b>${x[2]}</button>`).join('');
    };
  };wait();
})();