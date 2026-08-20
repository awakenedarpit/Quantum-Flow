/* Quantum Flow — Leaderboard reliability fix */
(function(){
  const escSafe = window.esc || (s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])));
  const timed = (promise, ms=8000) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Leaderboard request timed out.')), ms))
  ]);

  window.leaderboard = async function(){
    if (!window.currentUser) return '<div class="wrap"><div class="card"><h2>🏆 Leaderboard</h2><p class="muted">Please sign in to view the leaderboard.</p></div></div>';

    try {
      let rows = [];
      let rpcError = null;

      try {
        const result = await timed(window.supabaseClient.rpc('leaderboard_top', {p_limit:50}));
        rpcError = result.error;
        if (!rpcError && Array.isArray(result.data)) rows = result.data;
      } catch (e) {
        rpcError = e;
      }

      /* Fallback: the RPC may be healthy in PostgreSQL while the browser's
         PostgREST schema cache/session cannot call it. Build the same ranking
         directly from public leaderboard-visible profiles. */
      if (rpcError || !rows.length) {
        const result = await timed(
          window.supabaseClient
            .from('profiles')
            .select('id,display_name,xp,leaderboard_visible,created_at')
            .eq('leaderboard_visible', true)
            .order('xp', {ascending:false})
            .order('created_at', {ascending:true})
            .limit(100)
        );
        if (result.error) throw result.error;
        rows = (result.data || []).map((p, i) => ({
          rank: i + 1,
          user_id: p.id,
          display_name: p.display_name || 'Quantum User',
          xp: Number(p.xp || 0),
          leaderboard_visible: true
        }));
      }

      window.state.leaderboard = rows;
      const mine = rows.find(x => x.user_id === window.currentUser.id);
      return window.shell(`<div class="top"><div><h2>🏆 Leaderboard</h2><div class="muted">Consistency matters more than perfection.</div></div><span class="badge">${mine ? `Your rank #${mine.rank} • ⚡ ${Number(mine.xp||0).toLocaleString()} XP` : 'Not publicly ranked'}</span></div><div class="card"><div class="list">${rows.length ? rows.map(r => `<div class="item" style="${r.user_id===window.currentUser.id?'background:color-mix(in srgb,var(--primary) 12%,transparent);border-radius:12px':''}"><strong style="min-width:42px">${r.rank<=3?['🥇','🥈','🥉'][r.rank-1]:'#'+r.rank}</strong><div class="grow"><b>${escSafe(r.display_name)}</b><div class="muted">Productive progress</div></div><b>⚡ ${Number(r.xp||0).toLocaleString()}</b></div>`).join('') : '<p class="muted">No public leaderboard users yet.</p>'}</div></div><p class="muted small">Only users who choose to appear are shown. Emails are never displayed.</p>`);
    } catch (error) {
      console.error('Leaderboard failed:', error);
      return window.shell(`<div class="card"><h2>🏆 Leaderboard</h2><p class="muted">Leaderboard could not load right now.</p><div class="actions"><button class="btn" onclick="openTab('leaderboard')">Retry</button></div></div>`);
    }
  };

  /* Prevent a stale leaderboard result from leaving the page stuck on the
     generic loading screen when users switch tabs quickly. */
  const originalOpenTab = window.openTab;
  window.openTab = function(tab){
    if (tab === 'leaderboard' && window.state) window.state.leaderboard = [];
    return originalOpenTab ? originalOpenTab(tab) : undefined;
  };
})();
