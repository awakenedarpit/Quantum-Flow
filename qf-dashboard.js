// Quantum Flow dashboard composition layer — visual layout only.
(() => {
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn();
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

  function parseMetric(label) {
    const cards = [...document.querySelectorAll('#app .metric')];
    const card = cards.find(c => (c.innerText || '').toLowerCase().includes(label.toLowerCase()));
    return card?.querySelector('strong')?.textContent?.trim() || '—';
  }

  function buildHomeAside(wrap) {
    if (!wrap || document.getElementById('qfDashboardAside')) return;
    if (!wrap.querySelector('.qf-xp') || !/Today's Habits/i.test(wrap.innerText || '')) return;

    const rows = [...wrap.querySelectorAll('.list .item')].slice(0, 5);
    const focus = rows.length ? rows.map((row, i) => {
      const name = row.querySelector('.grow b')?.textContent?.trim() || `Habit ${i + 1}`;
      const done = row.querySelector('.check.done');
      const icon = ['🌱','📚','🏋️','🧠','🎯'][i] || '✨';
      return `<div class="qf-focus-item"><span class="qf-focus-check ${done ? 'done' : ''}">${done ? '✓' : icon}</span><div><b>${esc(name)}</b><small>${done ? 'Completed today' : 'Ready for today'}</small></div><span class="qf-focus-arrow">›</span></div>`;
    }).join('') : '<div class="qf-empty">Add a habit and it will appear here.</div>';

    const aside = document.createElement('aside');
    aside.id = 'qfDashboardAside';
    aside.className = 'qf-dashboard-aside';
    aside.innerHTML = `
      <section class="qf-side-card qf-focus-card">
        <div class="qf-side-head"><div><span class="qf-kicker">TODAY • FOCUS</span><h3>Today's Focus</h3></div><span class="qf-side-count">${rows.filter(r=>r.querySelector('.check.done')).length}/${rows.length || 0}</span></div>
        <div class="qf-focus-list">${focus}</div>
      </section>
      <section class="qf-side-card qf-flow-card">
        <div class="qf-side-head"><div><span class="qf-kicker">YOUR FLOW</span><h3>Keep going ✨</h3></div><span class="qf-flow-dot"></span></div>
        <div class="qf-flow-stats"><div><b>${esc(parseMetric("Today's score"))}</b><small>Today's score</small></div><div><b>${esc(parseMetric('Study time'))}</b><small>Study time</small></div></div>
        <div class="qf-mini-progress"><i></i></div>
        <p>Small wins compound. Complete one more habit to move your flow forward.</p>
      </section>
      <section class="qf-side-card qf-robot-card">
        <div class="qf-robot-orbit"><img src="icon.svg" alt="Quantum Flow robot"></div>
        <div><b>Stay in the flow</b><p>Build habits. Master focus. Become your best self.</p></div>
      </section>`;
    wrap.appendChild(aside);
  }

  function decorate() {
    const app = document.getElementById('app');
    if (!app) return;
    const wrap = app.querySelector('.wrap');
    if (!wrap || wrap.classList.contains('auth')) return;
    buildHomeAside(wrap);
    document.body.classList.toggle('qf-home-active', !!wrap.querySelector('.qf-xp'));
  }

  ready(() => {
    decorate();
    new MutationObserver(() => requestAnimationFrame(decorate)).observe(document.getElementById('app') || document.body, {childList:true, subtree:true});
  });
})();
