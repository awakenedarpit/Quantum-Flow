// QuantumFlow auth UI — reference-inspired robot login/create-account experience.
(() => {
  const WAIT_MS = 65000;
  let lockedUntil = 0;
  let mode = 'signin';
  let lastRoot = null;

  const icon = (name) => {
    const icons = {
      mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
      lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
      eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>'
    };
    return icons[name] || '';
  };

  function installAuthLayoutFix() {
    if (document.getElementById('qf-auth-layout-fix')) return;
    const style = document.createElement('style');
    style.id = 'qf-auth-layout-fix';
    style.textContent = `#app .auth .qf-auth-card{padding-top:82px}#app .auth .qf-welcome{font-size:14px;line-height:1.2;font-weight:900;letter-spacing:.02em;color:var(--primary);margin:0 0 8px}#app .auth .qf-auth-title{margin:0 0 7px}#app .auth .qf-auth-robot{top:-145px}#app .auth .qf-auth-panel{position:relative;z-index:3}#app .auth .qf-auth-bubble{z-index:7}@media(max-width:520px){#app .auth .qf-auth-card{padding-top:76px}#app .auth .qf-auth-robot{top:-136px}}`;
    document.head.appendChild(style);
  }

  function robotMarkup() { return `<div class="qf-auth-robot" data-qf-auth-robot aria-hidden="true"><div class="qf-auth-bubble">Quantum Flow</div><div class="qf-robot-wrap"><span class="qf-auth-robot-arm qf-arm-left"></span><span class="qf-auth-robot-arm qf-arm-right"></span><div class="qf-robot-head"><div class="qf-robot-face"><i></i><i></i><b></b><em></em><em></em></div></div><div class="qf-robot-hands"><span></span><span></span></div></div></div>`; }
  function field(id, type, placeholder, autocomplete, fieldIcon) { return `<label class="qf-auth-field" for="${id}"><span class="qf-field-icon">${icon(fieldIcon)}</span><input id="${id}" class="input" type="${type}" autocomplete="${autocomplete}" placeholder="${placeholder}">${id === 'password' ? `<button class="qf-password-toggle" type="button" aria-label="Show password" onclick="window.qfTogglePassword()">${icon('eye')}</button>` : ''}</label>`; }

  function build(root) {
    const card = root.querySelector('.card.hero');
    if (!card) return;
    installAuthLayoutFix();
    card.classList.add('qf-auth-card');
    card.innerHTML = `${robotMarkup()}<div class="qf-auth-panel">${mode === 'signin' ? '<div class="qf-welcome">Welcome to Quantum Flow</div>' : ''}<div class="qf-auth-title">Beep boop. ${mode === 'signup' ? 'New human detected!' : 'Who goes there?'}</div><div class="qf-auth-subtitle">${mode === 'signup' ? 'Create your QuantumFlow account and start building better days.' : 'Log in and keep your momentum going.'}</div><form id="qfAuthForm" class="qf-auth-form" novalidate>${field('email', 'email', 'Your email', 'email', 'mail')}${field('password', 'password', 'Super secret password', 'new-password', 'lock')}<button id="qfAuthSubmit" class="qf-auth-submit" type="submit"><span>⚡</span>${mode === 'signup' ? 'CREATE ACCOUNT' : 'LOG ME IN'}</button></form><p id="authStatus" class="qf-auth-status" aria-live="polite"></p><div class="qf-auth-switch">${mode === 'signup' ? 'Already have an account?' : "Don't have an account?"} <button id="qfAuthSwitch" type="button">${mode === 'signup' ? 'Sign in' : 'Create account'}</button></div><p class="qf-auth-note">Your account is secured with Supabase authentication.</p></div>`;
    card.querySelector('#qfAuthForm').addEventListener('submit', (event) => { event.preventDefault(); if (mode === 'signup') window.signUp(); else window.signIn(); });
    card.querySelector('#qfAuthSwitch').addEventListener('click', () => { mode = mode === 'signup' ? 'signin' : 'signup'; lastRoot = null; renderAuth(); });
  }

  function renderAuth() { const root = document.querySelector('#app .auth'); if (!root) return; if (root !== lastRoot || !root.querySelector('.qf-auth-card')) { lastRoot = root; build(root); } }
  window.qfTogglePassword = function () { const input = document.getElementById('password'); const button = document.querySelector('.qf-password-toggle'); if (!input || !button) return; input.type = input.type === 'password' ? 'text' : 'password'; button.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password'); };

  window.signUp = async function () {
    const now = Date.now();
    if (now < lockedUntil) return toast(`Please wait ${Math.ceil((lockedUntil - now) / 1000)}s before trying again.`);
    const email = String(document.getElementById('email')?.value || '').trim().toLowerCase();
    const password = document.getElementById('password')?.value || '';
    const status = document.getElementById('authStatus');
    if (!email || !email.includes('@')) return toast('Enter a valid email ID');
    if (password.length < 6) return toast('Password must be at least 6 characters');
    lockedUntil = now + WAIT_MS;
    if (status) status.textContent = 'Creating your account…';
    try {
      const request = supabaseClient.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
      const { data, error } = await Promise.race([request, new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out. Please check your internet connection.')), 10000))]);
      if (error) { lockedUntil = 0; const message = String(error.message || '').toLowerCase(); const msg = error.status === 429 || message.includes('rate limit') || message.includes('rate_limit') ? 'Email sending limit reached. Please wait and try again.' : error.message; if (status) status.textContent = msg; return toast(msg); }
      if (data?.session) { lockedUntil = 0; return bootstrap(); }
      if (status) status.textContent = 'Account created. Check your email ID to confirm your account.';
      toast('Account created ✓ Check your email');
    } catch (error) { lockedUntil = 0; const msg = error?.message || 'Could not create the account.'; if (status) status.textContent = msg; toast(msg); }
  };

  const observer = new MutationObserver(renderAuth);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(renderAuth, 0);
})();
