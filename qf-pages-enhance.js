/* Quantum Flow page UX + functional leaderboard/profile/goals layer. */
(function(){
  const wait=()=>{
    if(!window.state || !window.currentUser || !window.supabaseClient || typeof window.render!=='function' || !window.shell){
      setTimeout(wait,120); return;
    }
    if(window.__qfPagesEnhanceLoaded) return;
    window.__qfPagesEnhanceLoaded=true;
    const baseRender=window.render;
    const esc=window.esc||((s)=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m])));
    const toast=(m)=>window.toast?window.toast(m):window.showToast?window.showToast(m):alert(m);

    function nav(){
      const el=document.getElementById('nav'); if(!el) return;
      const tabs=[['home','⌂','Home'],['habits','✓','Habits'],['study','▣','Study'],['progress','◒','Progress'],['goals','🎯','Goals'],['groups','👥','Groups'],['leaderboard','🏆','Rank'],['profile','●','Profile']];
      if(window.state?.profile?.role==='admin') tabs.push(['admin','🛡','Admin']);
      el.className='nav';
      el.innerHTML=tabs.map(([id,icon,label])=>`<button class="${window.state.tab===id?'active':''}" onclick="openTab('${id}')"><b>${icon}</b><span>${label}</span></button>`).join('');
    }

    function profilePage(){
      const p=window.state.profile||{}; const name=String(p.display_name||window.currentUser?.user_metadata?.display_name||window.currentUser?.email?.split('@')[0]||'Quantum User');
      const initial=esc(name.trim().charAt(0).toUpperCase()||'Q');
      return window.shell(`<div class="qf-page qf-profile-page">
        <div class="qf-page-hero qf-profile-hero"><div class="qf-profile-avatar-xl">${initial}</div><div class="grow"><span class="qf-eyebrow">✨ YOUR PROFILE</span><h1>${esc(name)}</h1><p class="muted">${esc(window.currentUser?.email||'')}</p><p class="qf-page-subtitle">Your identity, progress and leaderboard preferences — all in one place.</p></div><button class="btn qf-primary-action" onclick="qfOpenProfileEditor()">✏️ Update profile</button></div>
        <div class="qf-stat-grid"><div class="card qf-stat-card"><span>⚡ XP</span><strong>${Number(window.xp?.()||p.xp||0).toLocaleString()}</strong><small>Lifetime experience</small></div><div class="card qf-stat-card"><span>🌟 Level</span><strong>${window.level?.()||1}</strong><small>Keep building momentum</small></div><div class="card qf-stat-card"><span>🌱 Habits</span><strong>${window.state.habits.length}</strong><small>Active habits</small></div><div class="card qf-stat-card"><span>🎯 Goals</span><strong>${window.state.goals.length}</strong><small>Goals in progress</small></div></div>
        <div class="card qf-profile-settings-card"><div><span class="qf-eyebrow">🌐 PRIVACY</span><h3>Leaderboard visibility</h3><p class="muted">Choose whether your display name and XP can appear on the public ranking.</p></div><button class="btn ${p.leaderboard_visible===false?'secondary':''}" onclick="toggleLeaderboardVisibility()">${p.leaderboard_visible===false?'🙈 Hidden':'👀 Visible'}</button></div>
        <div class="card qf-profile-tip"><span class="qf-tip-icon">💡</span><div><b>Tip</b><p class="muted">Use a display name instead of your email. Your login email remains private.</p></div></div>
      </div>`,'Profile');
    }

    function goalsPage(){
      const goals=window.state.goals||[]; const avg=goals.length?Math.round(goals.reduce((a,g)=>a+Number(g.progress||0),0)/goals.length):0; const done=goals.filter(g=>Number(g.progress||0)>=100).length;
      return window.shell(`<div class="qf-page qf-goals-page">
        <div class="qf-page-hero qf-goals-hero"><div><span class="qf-eyebrow">🎯 YOUR DIRECTION</span><h1>Goals</h1><p class="qf-page-subtitle">Turn big ambitions into small, visible wins.</p></div><button class="btn qf-primary-action" onclick="addGoal()">＋ Create goal</button></div>
        <div class="qf-stat-grid qf-goal-stats"><div class="card qf-stat-card"><span>🎯 Active</span><strong>${Math.max(0,goals.length-done)}</strong><small>Goals still moving</small></div><div class="card qf-stat-card"><span>📈 Average</span><strong>${avg}%</strong><small>Overall progress</small></div><div class="card qf-stat-card"><span>🏆 Completed</span><strong>${done}</strong><small>Finished goals</small></div></div>
        ${goals.length?`<div class="qf-goals-grid">${goals.map((g,i)=>{const pct=Math.max(0,Math.min(100,Number(g.progress||0)));const ms=g.milestones||[];return `<article class="card qf-goal-card ${pct>=100?'is-complete':''}"><div class="qf-goal-card-top"><div class="qf-goal-icon">${pct>=100?'🏆':['🚀','🌱','🧠','💪','📚','✨'][i%6]}</div><div class="grow"><span class="qf-eyebrow">GOAL ${i+1}</span><h3>${esc(g.name||g.title||'Untitled goal')}</h3></div><strong class="qf-goal-percent">${pct}%</strong></div><div class="qf-goal-progress"><div class="qf-goal-progress-track"><i style="width:${pct}%"></i></div><div class="qf-goal-progress-meta"><span>${pct>=100?'Completed':'In progress'}</span><span>${ms.length} milestone${ms.length===1?'':'s'}</span></div></div>${ms.length?`<div class="qf-milestones">${ms.slice(0,4).map((m,mi)=>`<div class="qf-milestone"><span class="qf-milestone-dot ${mi<Math.ceil(ms.length*pct/100)?'done':''}">${mi<Math.ceil(ms.length*pct/100)?'✓':''}</span><span>${esc(m.title||`Milestone ${mi+1}`)}</span></div>`).join('')}</div>`:''}<div class="qf-goal-actions"><button class="btn secondary" ${pct>=100?'disabled':''} onclick="advanceGoal('${g.id}',${pct})">${pct>=100?'✓ Completed':'＋ Add 10%'}</button></div></article>`;}).join('')}</div>`:`<div class="card qf-empty-state"><div class="qf-empty-icon">🎯</div><h3>Your next win starts here</h3><p class="muted">Create a goal and move it forward by 10% at a time.</p><button class="btn" onclick="addGoal()">Create your first goal</button></div>`}
      </div>`,'Goals');
    }

    async function loadLeaderboard(){
      const results=await Promise.allSettled([
        window.supabaseClient.rpc('leaderboard_top',{p_limit:50}),
        window.supabaseClient.rpc('leaderboard',{limit_count:50})
      ]);
      const top=results[0].status==='fulfilled'&&results[0].value?.data||[];
      const detailed=results[1].status==='fulfilled'&&results[1].value?.data||[];
      const topErr=results[0].status==='fulfilled'?results[0].value?.error:null;
      const detailErr=results[1].status==='fulfilled'?results[1].value?.error:null;
      if(!top.length && !detailed.length && (topErr||detailErr)) throw new Error(topErr?.message||detailErr?.message||'Leaderboard could not be loaded.');
      const streakByName=new Map(detailed.map(r=>[String(r.display_name||'').toLowerCase(),Number(r.streak_days||0)]));
      const rows=top.length?top.map(r=>({...r,streak_days:streakByName.get(String(r.display_name||'').toLowerCase())||0})):detailed.map(r=>({rank:r.rank,display_name:r.display_name,xp:r.xp,streak_days:r.streak_days,user_id:null}));
      return rows;
    }

    async function leaderboardPage(){
      let rows=[];
      try{rows=await loadLeaderboard();window.state.leaderboard=rows;}catch(e){return window.shell(`<div class="qf-page qf-error-page"><div class="card qf-empty-state"><div class="qf-empty-icon">⚠️</div><h2>Leaderboard is temporarily unavailable</h2><p class="muted">${esc(e.message||'Could not load the ranking.')}</p><button class="btn" onclick="window.state.leaderboard=[];render()">↻ Try again</button></div></div>`,'Rank');}
      const mine=rows.find(r=>r.user_id===window.currentUser.id); const myRank=mine?.rank||null; const top3=rows.slice(0,3);
      return window.shell(`<div class="qf-page qf-rank-page">
        <div class="qf-page-hero qf-rank-hero"><div><span class="qf-eyebrow">🏆 QUANTUM RANK</span><h1>Leaderboard</h1><p class="qf-page-subtitle">Compete through consistency. Celebrate progress.</p></div><button class="btn secondary" onclick="window.state.leaderboard=[];render()">↻ Refresh</button></div>
        <div class="qf-rank-summary"><div class="qf-my-rank"><span>YOUR RANK</span><strong>${myRank?`#${myRank}`:'—'}</strong><small>${mine?`${Number(mine.xp||0).toLocaleString()} XP`:(window.state.profile?.leaderboard_visible===false?'Hidden from public ranking':'Not ranked yet')}</small></div><div><span>PUBLIC PLAYERS</span><strong>${rows.length}</strong><small>Showing up to 50</small></div><div><span>TOP XP</span><strong>${rows[0]?Number(rows[0].xp||0).toLocaleString():'0'}</strong><small>Current leader</small></div></div>
        ${top3.length?`<div class="qf-podium">${top3.map((r,i)=>`<div class="qf-podium-card p${i+1}"><div class="qf-medal">${['🥇','🥈','🥉'][i]}</div><div class="qf-podium-rank">#${r.rank}</div><div class="qf-podium-name">${esc(r.display_name||'Quantum User')}</div><div class="qf-podium-xp">⚡ ${Number(r.xp||0).toLocaleString()} XP</div><small>🔥 ${Number(r.streak_days||0)} day streak</small></div>`).join('')}</div>`:''}
        <div class="card qf-ranking-card"><div class="qf-ranking-head"><div><span class="qf-eyebrow">GLOBAL RANKING</span><h2>Top Quantum Flow users</h2></div><span class="badge">🔒 Emails stay private</span></div><div class="qf-ranking-list">${rows.length?rows.map(r=>`<div class="qf-ranking-row ${r.user_id===window.currentUser.id?'mine':''}"><span class="qf-rank-number">${r.rank<=3?['🥇','🥈','🥉'][r.rank-1]:'#'+r.rank}</span><div class="qf-ranking-avatar">${esc(String(r.display_name||'Q').trim().charAt(0).toUpperCase())}</div><div class="grow"><b>${esc(r.display_name||'Quantum User')} ${r.user_id===window.currentUser.id?'<span class="qf-you-badge">YOU</span>':''}</b><div class="muted">🔥 ${Number(r.streak_days||0)} day streak</div></div><strong>⚡ ${Number(r.xp||0).toLocaleString()}</strong></div>`).join(''):'<div class="qf-empty-state"><div class="qf-empty-icon">🏆</div><h3>No public players yet</h3><p class="muted">Be the first to appear here.</p></div>'}</div></div>
      </div>`,'Rank');
    }

    window.qfRenderEnhancedPages=async function(){
      const tab=window.state.tab;
      if(tab==='profile') return profilePage();
      if(tab==='goals') return goalsPage();
      if(tab==='leaderboard') return leaderboardPage();
      return null;
    };

    window.render=async function(){
      const custom=await window.qfRenderEnhancedPages();
      if(custom!==null){const app=document.getElementById('app');if(app)app.innerHTML=custom;nav();return;}
      const result=baseRender();
      if(result && typeof result.then==='function') await result;
      nav();
    };
    nav();
  };
  wait();
})();
