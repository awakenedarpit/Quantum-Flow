// QuantumFlow auth UI — reference-inspired robot login/create-account experience.
(() => {
  const WAIT_MS = 65000;
  let lockedUntil = 0;
  let mode = 'signin';
  let lastRoot = null;

  const icon = (name) => {
    const icons = {
      user: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
      mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
      lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
      eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>'
    };
    return icons[name] || '';
  };

  function robotMarkup() {
    return `<div class="qf-auth-robot" data-qf-auth-robot aria-hidden="true">
      <div class="qf-auth-bubble">This is my favorite part.</div>
      <div class="qf-robot-wrap">
        <span class="qf-robot-arm qf-arm-left"></span><span class="qf-robot-arm qf-arm-right"></span>
        <div class="qf-robot-head"><div class="qf-robot-face"><i></i><i></i><b></b><em></em><em></em></div></div>
        <div class="qf-robot-hands"><span></span><span></span></div>
      </div>
    </div>`;
  }

  function field(id, type, placeholder, autocomplete, fieldIcon, extra = '') {
    return `<label class="qf-auth-field" for="${id}"><span class="qf-field-icon">${icon(fieldIcon)}</span><input id="${id}" class="input" type="${type}" autocomplete="${autocomplete}" placeholder="${placeholder}" ${extra}>${id === 'password' ? `<button class="qf-password-toggle" type="button" aria-label="Show password" onclick="window.qfTogglePassword()">${icon('eye')}</button>` : ''}</label>`;
  }

  function build(root) {
    const card = root.querySelector('.card.hero');
    if (!card) return;
    card.classList.add('qf-auth-card');
    card.innerHTML = `${robotMarkup()}
      <div class="qf-auth-panel">
        <div class="qf-auth-title">Beep boop. ${mode === 'signup' ? 'New human detected!' : 'Who goes there?'}</div>
        <div class="qf-auth-subtitle">${mode === 'signup' ? 'Create your QuantumFlow account and start building better days.' : 'Log in and keep your momentum going.'}</div>
        <form id="qfAuthForm" class="qf-auth-form" novalidate>
          ${mode === 'signup' ? field('displayName', 'text', 'Your name', 'name', 'user', 'required') : ''}
          ${field('email', 'email', 'Your email', 'email', 'mail', 'required')}
          ${field('password', 'password', 'Super secret password', 'current-password', 'lock', 'required minlength="6"')}
          <button id="qfAuthSubmit" class="qf-auth-submit" type="submit"><span>⚡</span>${mode === 'signup' ? 'CREATE ACCOUNT' : 'LOG ME IN'}</button>
        </form>
        <p id="authStatus" class="qf-auth-status" aria-live="polite"></p>
        <div class="qf-auth-switch">${mode === 'signup' ? 'Already have an account?' : "Don't have an account?"} <button id="qfAuthSwitch" type="button">${mode === 'signup' ? 'Sign in' : 'Create account'}</button></div>
        <p class="qf-auth-note">Your account is secured with Supabase authentication.</p>
      </div>`;

    const form = card.querySelector('#qfAuthForm');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (mode === 'signup') window.signUp(); else window.signIn();
    });
    card.querySelector('#qfAuthSwitch').addEventListener('click', () => {
      mode = mode === 'signup' ? 'signin' : 'signup';
      renderAuth();
    });
  }

  function renderAuth() {
    const root = document.querySelector('#app .auth');
    if (!root) return;
    if (root !== lastRoot || !root.querySelector('.qf-auth-card')) {
      lastRoot = root;
      build(root);
    }
  }

  window.qfTogglePassword = function () {
    const input = document.getElementById('password');
    const button = document.querySelector('.qf-password-toggle');
    if (!input || !button) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    button.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password');
  };

  window.signUp = async function () {
    const now = Date.now();
    if (now < lockedUntil) return toast(`Please wait ${Math.ceil((lockedUntil - now) / 1000)}s before trying again.`);
    const name = document.getElementById('displayName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim().toLowerCase() || '';
    const password = document.getElementById('password')?.value || '';
    const status = document.getElementById('authStatus');
    if (!name) return toast('Enter your name');
    if (!email || !email.includes('@')) return toast('Enter a valid email ID');
    if (password.length < 6) return toast('Password must be at least 6 characters');
    lockedUntil = now + WAIT_MS;
    if (status) status.textContent = 'Creating your account…';
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: location.origin + location.pathname,
          data: { display_name: name, full_name: name, name }
        }
      });
      if (error) {
        lockedUntil = 0;
        const message = String(error.message || '').toLowerCase();
        const msg = error.status === 429 || message.includes('rate limit') || message.includes('rate_limit')
          ? 'Email sending limit reached. Please wait and try again.'
          : error.message;
        if (status) status.textContent = msg;
        return toast(msg);
      }
      if (data?.session) {
        lockedUntil = 0;
        return bootstrap();
      }
      if (status) status.textContent = 'Account created. Check your email ID to confirm your account.';
      toast('Account created ✓ Check your email');
    } catch (error) {
      lockedUntil = 0;
      toast(error?.message || 'Could not create the account.');
    }
  };

  const observer = new MutationObserver(renderAuth);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(renderAuth, 0);
})();
