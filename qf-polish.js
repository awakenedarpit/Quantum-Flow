// QuantumFlow UI polish: accessible contrast, friendly auth card and editable user profile.
(() => {
  const initials = (name) => (String(name || 'Q').trim().split(/\s+/).slice(0,2).map(x => x[0]).join('').toUpperCase() || 'Q');

  window.auth = function () {
    return `<div class="wrap auth"><div class="card hero">
      <div class="auth-bubble">✨ Welcome to QuantumFlow</div>
      <div class="auth-robot" aria-hidden="true">🤖</div>
      <h1 class="auth-title">Build better days.</h1>
      <p class="muted auth-sub">Track habits, study, goals and progress in one beautiful place.</p>
      <div class="auth-field"><span class="auth-icon">👤</span><input id="name" class="input" type="text" autocomplete="name" placeholder="Your name"></div>
      <div class="auth-field"><span class="auth-icon">✉️</span><input id="email" class="input" type="email" autocomplete="email" placeholder="Your email"></div>
      <div class="auth-field"><span class="auth-icon">🔒</span><input id="password" class="input" type="password" autocomplete="new-password" placeholder="Super secret password (6+ characters)"></div>
      <div class="actions"><button class="btn" onclick="signIn()">⚡ Log me in</button><button class="btn secondary" onclick="signUp()">Create my account</button></div>
      <p id="authStatus" class="muted small" aria-live="polite"></p>
      <p class="muted small">If email confirmation is enabled, check your inbox after creating your account.</p>
    </div></div>`;
  };

  window.signUp = async function () {
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim().toLowerCase();
    const password = document.getElementById('password')?.value || '';
    const status = document.getElementById('authStatus');
    if (!name || name.length < 2) return toast('Enter your name');
    if (!email || !email.includes('@')) return toast('Enter a valid email address');
    if (password.length < 6) return toast('Password must be at least 6 characters');
    if (status) status.textContent = 'Creating your account…';
    try {
      const { data, error } = await withTimeout(supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { display_name: name }, emailRedirectTo: window.location.origin + window.location.pathname }
      }));
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        const friendly = msg.includes('rate limit') || msg.includes('rate_limit') || error.status === 429
          ? 'Email sending limit reached. Please wait before requesting another verification email.'
          : msg.includes('already registered') || msg.includes('already exists')
            ? 'This email already has an account. Please use Log me in.'
            : error.message;
        if (status) status.textContent = friendly;
        return toast(friendly);
      }
      if (data?.session) {
        if (status) status.textContent = 'Account created! Welcome to QuantumFlow.';
        await bootstrap();
      } else {
        if (status) status.textContent = 'Account created. Check your email to confirm it, then log in.';
        toast('Account created ✓ Check your email');
      }
    } catch (e) {
      if (status) status.textContent = 'Could not create the account. Please try again.';
      toast('Could not create the account. Please try again.');
    }
  };

  window.profile = function () {
    const name = state.profile?.display_name || currentUser?.user_metadata?.display_name || currentUser?.email?.split('@')[0] || 'Quantum User';
    const visible = state.profile?.leaderboard_visible !== false;
    return shell(`<h2>Profile</h2><div class="muted">Personalize your QuantumFlow account.</div>
      <div class="card"><div class="row" style="gap:16px"><div class="profile-avatar">${esc(initials(name))}</div><div class="grow"><h3 style="margin-bottom:4px">${esc(name)}</h3><div class="muted">${esc(currentUser?.email || '')}</div><span class="badge">⚡ ${xp()} XP · Level ${level()}</span></div></div></div>
      <div class="card"><h3>Edit profile</h3><div class="profile-form"><label for="profileName">Display name</label><input id="profileName" class="input" maxlength="40" value="${esc(name)}" placeholder="Your name"><label for="profileVisible">Leaderboard visibility</label><select id="profileVisible"><option value="true" ${visible?'selected':''}>Show me on leaderboard</option><option value="false" ${!visible?'selected':''}>Hide me from leaderboard</option></select><button class="btn" onclick="saveProfile()">Save profile</button></div></div>
      <div class="card"><h3>Account</h3><p class="muted">Your email is managed securely by Supabase Authentication.</p><button class="btn secondary" onclick="signOut()">Sign out</button></div>`);
  };

  window.saveProfile = async function () {
    if (!currentUser) return toast('Please sign in first');
    const name = document.getElementById('profileName')?.value.trim();
    const visible = document.getElementById('profileVisible')?.value !== 'false';
    if (!name || name.length < 2) return toast('Name must be at least 2 characters');
    const { error } = await supabaseClient.from('profiles').update({ display_name: name, leaderboard_visible: visible }).eq('id', currentUser.id);
    if (error) return toast(error.message);
    await supabaseClient.auth.updateUser({ data: { display_name: name } });
    state.profile = { ...(state.profile || {}), display_name: name, leaderboard_visible: visible };
    toast('Profile updated ✓');
    render();
  };
})();
