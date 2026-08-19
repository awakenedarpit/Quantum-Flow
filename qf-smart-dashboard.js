// Quantum Flow — Smart Daily Command Center
(() => {
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

  function getRows() {
    const wrap = document.querySelector('#app .wrap');
    if (!wrap || wrap.classList.contains('auth') || !wrap.querySelector('.qf-xp')) return null;
    return {wrap, habits:[...wrap.querySelectorAll('.list .item')].filter(x => x.querySelector('.check'))};
  }

  function render() {
    const data = getRows();
    const old = document.getElementById('qf-smart-command');
    if (!data) { old?.remove(); return; }
    if (old) old.remove();

    const habits = data.habits.slice(0, 8);
    const done = habits.filter(x => x.querySelector('.check.done')).length;
    const total = habits.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const next = habits.find(x => !x.querySelector('.check.done'));
    const nextName = next?.querySelector('.grow b')?.textContent?.trim() || 'Add your first habit';

    const card = document.createElement('section');
    card.id = 'qf-smart-command';
    card.className = 'qf-smart-command';
    card.innerHTML = `
      <div class="qf-command-top">
        <div><span class="qf-kicker">QUANTUM FLOW • TODAY</span><h2>Daily Command Center</h2><p>Turn today's small actions into meaningful progress.</p></div>
        <div class="qf-command-ring" style="--qf-p:${pct * 3.6}deg"><b>${pct}%</b><small>flow</small></div>
      </div>
      <div class="qf-command-grid">
        <div class="qf-command-stat"><span>🌱</span><div><b>${done}/${total}</b><small>Habits completed</small></div></div>
        <div class="qf-command-stat"><span>🎯</span><div><b>${total ? total-done : 0}</b><small>Next actions</small></div></div>
        <div class="qf-command-next"><span class="qf-next-icon">⚡</span><div><small>NEXT BEST ACTION</small><b>${esc(nextName)}</b><p>${next ? 'Complete this habit to keep your flow moving.' : 'Create a habit to start building your flow.'}</p></div></div>
      </div>`;
    data.wrap.insertBefore(card, data.wrap.firstChild?.nextSibling || data.wrap.firstChild);
  }

  ready(() => {
    let queued = false;
    const schedule = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued=false; render(); }); };
    schedule();
    const app = document.getElementById('app');
    if (app) new MutationObserver(schedule).observe(app, {childList:true, subtree:true});
  });
})();
