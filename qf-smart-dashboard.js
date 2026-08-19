// Quantum Flow — Smart Daily Command Center
(() => {
  const ready = fn => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();
  const esc = s => String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  let lastSignature = '';

  function model() {
    const wrap = document.querySelector('#app .wrap');
    if (!wrap || wrap.classList.contains('auth') || !window.state || state.tab !== 'home') return null;
    const habits = Array.isArray(state.habits) ? state.habits : [];
    const goals = Array.isArray(state.goals) ? state.goals : [];
    const study = Array.isArray(state.study) ? state.study : [];
    const doneHabits = habits.filter(h => Array.isArray(h.days) && h.days.includes(today()));
    const nextHabit = habits.find(h => !doneHabits.includes(h));
    const activeGoals = goals.filter(g => Number(g.progress || 0) < 100 && !g.is_completed);
    const todayStudy = study.filter(s => s.started_at && new Date(s.started_at).toISOString().slice(0, 10) === today());
    const todayStudyMinutes = todayStudy.reduce((n, s) => n + (Number(s.duration_minutes) || 0), 0);
    const totalStudyMinutes = study.reduce((n, s) => n + (Number(s.duration_minutes) || 0), 0);
    const score = habits.length ? Math.round(doneHabits.length / habits.length * 100) : 0;
    return {wrap, habits, goals, study, doneHabits, nextHabit, activeGoals, todayStudyMinutes, totalStudyMinutes, score};
  }

  function signature(m) {
    return JSON.stringify({
      tab: state.tab,
      habits: m.habits.map(h => [h.id, h.name, h.days?.includes(today())]),
      goals: m.goals.map(g => [g.id, g.title || g.name, g.progress, g.is_completed]),
      study: m.study.slice(0, 20).map(s => [s.id, s.duration_minutes, s.completed, s.started_at])
    });
  }

  function action(m) {
    if (m.nextHabit) return `<button class="qf-command-action" onclick="toggleHabit('${esc(m.nextHabit.id)}')">Complete “${esc(m.nextHabit.name)}” <span>→</span></button>`;
    if (!m.habits.length) return '<button class="qf-command-action" onclick="addHabit()">Create your first habit <span>→</span></button>';
    return '<button class="qf-command-action" onclick="focusTimer()">Start a focus session <span>→</span></button>';
  }

  function render() {
    const m = model();
    const old = document.getElementById('qf-smart-command');
    if (!m) { old?.remove(); lastSignature = ''; return; }
    const sig = signature(m);
    if (sig === lastSignature && old) return;
    lastSignature = sig;
    old?.remove();

    const total = m.habits.length;
    const goalProgress = m.goals.length ? Math.round(m.goals.reduce((n, g) => n + Number(g.progress || 0), 0) / m.goals.length) : 0;
    const pct = Math.max(0, Math.min(100, m.score));
    const nextGoal = m.activeGoals[0];
    const goalLabel = nextGoal ? `${esc(nextGoal.title || nextGoal.name || 'Your next goal')} · ${Number(nextGoal.progress || 0)}%` : (m.goals.length ? 'All goals are complete' : 'Add a goal to track long-term progress');

    const card = document.createElement('section');
    card.id = 'qf-smart-command';
    card.className = 'qf-smart-command';
    card.innerHTML = `
      <div class="qf-command-glow"></div>
      <div class="qf-command-top"><div class="qf-command-copy"><span class="qf-kicker">QUANTUM FLOW · TODAY</span><h2>Daily Command Center</h2><p>One calm view of the actions that move your day forward.</p></div><div class="qf-command-ring" style="--qf-p:${pct * 3.6}deg"><b>${pct}%</b><small>today</small></div></div>
      <div class="qf-command-grid">
        <div class="qf-command-stat"><span>🌱</span><div><b>${m.doneHabits.length}/${total}</b><small>Habits complete</small></div></div>
        <div class="qf-command-stat"><span>📚</span><div><b>${Math.round(m.todayStudyMinutes)}m</b><small>Studied today</small></div></div>
        <div class="qf-command-stat"><span>🎯</span><div><b>${goalProgress}%</b><small>Goal progress</small></div></div>
        <div class="qf-command-next"><span class="qf-next-icon">⚡</span><div><small>NEXT BEST ACTION</small><b>${m.nextHabit ? esc(m.nextHabit.name) : (m.habits.length ? 'Your habits are done' : 'Start your flow')}</b><p>${m.nextHabit ? 'A small win now keeps your momentum alive.' : goalLabel}</p></div></div>
      </div>
      <div class="qf-command-footer"><div class="qf-command-progress"><span style="width:${pct}%"></span></div><div class="qf-command-meta"><span>${m.activeGoals.length} active goal${m.activeGoals.length === 1 ? '' : 's'}</span><span>${Math.round(m.totalStudyMinutes)}m total study</span></div>${action(m)}</div>`;

    const top = m.wrap.querySelector('.top');
    if (top) top.insertAdjacentElement('afterend', card); else m.wrap.insertBefore(card, m.wrap.firstChild);
  }

  ready(() => {
    const app = document.getElementById('app');
    if (!app) return;
    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; render(); });
    };
    schedule();
    new MutationObserver(schedule).observe(app, {childList: true, subtree: true});
  });
})();
