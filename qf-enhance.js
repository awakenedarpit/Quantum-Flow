// QuantumFlow enhancement layer: small, dependency-free UX improvements.
(() => {
  let deferredInstall = null;
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once:true }) : fn();

  function status() {
    if (document.querySelector('.qf-status')) return;
    const el = document.createElement('div');
    el.className = 'qf-status ' + (navigator.onLine ? 'online' : 'offline');
    el.textContent = navigator.onLine ? 'Online' : 'Offline mode';
    document.body.appendChild(el);
    const update = () => {
      el.className = 'qf-status ' + (navigator.onLine ? 'online' : 'offline');
      el.textContent = navigator.onLine ? 'Online' : 'Offline mode';
    };
    addEventListener('online', update); addEventListener('offline', update);
  }

  function installPrompt() {
    addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); deferredInstall = e;
      if (localStorage.getItem('qf-install-dismissed') === '1') return;
      if (document.querySelector('.qf-install')) return;
      const bar = document.createElement('div');
      bar.className = 'qf-install';
      bar.innerHTML = '<div class="grow"><b>⚛️ Install QuantumFlow</b><div class="muted">Add it to your home screen for a faster app-like experience.</div></div><button class="btn" id="qfInstallBtn">Install</button><button class="btn secondary" id="qfInstallClose" aria-label="Dismiss">×</button>';
      document.body.appendChild(bar);
      document.getElementById('qfInstallClose')?.addEventListener('click', () => { localStorage.setItem('qf-install-dismissed','1'); bar.remove(); });
      document.getElementById('qfInstallBtn')?.addEventListener('click', async () => {
        if (!deferredInstall) return;
        deferredInstall.prompt();
        await deferredInstall.userChoice.catch(()=>null);
        deferredInstall = null; bar.remove();
      });
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
    document.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      b.classList.remove('qf-click'); void b.offsetWidth; b.classList.add('qf-click');
    }, { passive:true });
  }

  ready(() => { status(); installPrompt(); shortcuts(); clickFeedback(); });
})();
