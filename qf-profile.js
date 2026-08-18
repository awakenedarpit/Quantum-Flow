(() => {
  const getDisplayName = () => String(state?.profile?.display_name || currentUser?.user_metadata?.display_name || currentUser?.email?.split('@')[0] || 'Quantum User').trim() || 'Quantum User';
  const validName = (value) => {
    const name = String(value || '').trim().replace(/\s+/g, ' ');
    if (!name) return 'Please enter a display name.';
    if (name.length < 2) return 'Display name must be at least 2 characters.';
    if (name.length > 40) return 'Display name must be 40 characters or less.';
    if (/[<>]/.test(name)) return 'Please choose a valid display name.';
    return '';
  };

  window.qfSaveDisplayName = async () => {
    const input = document.getElementById('qfDisplayName');
    const button = document.getElementById('qfSaveDisplayName');
    const status = document.getElementById('qfDisplayNameStatus');
    const name = String(input?.value || '').trim().replace(/\s+/g, ' ');
    const validation = validName(name);
    if (validation) return toast(validation);
    if (!currentUser) return toast('Please sign in again.');
    if (button) { button.disabled = true; button.textContent = 'Saving…'; }
    if (status) status.textContent = 'Saving your display name…';
    try {
      const authResult = await supabaseClient.auth.updateUser({ data: { display_name: name } });
      if (authResult.error) throw authResult.error;

      const profileResult = await supabaseClient
        .from('profiles')
        .update({ display_name: name })
        .eq('id', currentUser.id)
        .select('display_name,xp,leaderboard_visible,role')
        .maybeSingle();

      if (profileResult.error) throw profileResult.error;
      if (!profileResult.data) {
        const upsert = await supabaseClient
          .from('profiles')
          .upsert({ id: currentUser.id, display_name: name }, { onConflict: 'id' })
          .select('display_name,xp,leaderboard_visible,role')
          .single();
        if (upsert.error) throw upsert.error;
        state.profile = { ...(state.profile || {}), ...(upsert.data || {}) };
      } else {
        state.profile = { ...(state.profile || {}), ...profileResult.data };
      }

      if (status) status.textContent = 'Display name updated successfully.';
      toast('Display name updated ✓');
      render();
    } catch (error) {
      console.error('Display name update failed', error);
      if (status) status.textContent = '';
      toast(error?.message || 'Could not update your display name.');
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Save name'; }
    }
  };

  window.qfResetDisplayName = () => {
    const input = document.getElementById('qfDisplayName');
    if (input) input.value = getDisplayName();
    const status = document.getElementById('qfDisplayNameStatus');
    if (status) status.textContent = '';
  };

  const originalProfile = window.profile;
  window.profile = function qfEnhancedProfile() {
    const name = getDisplayName();
    const original = originalProfile ? originalProfile() : '';
    const editor = `<div class="card qf-profile-editor">
      <div class="qf-profile-editor-head">
        <div>
          <div class="qf-profile-kicker">✨ PERSONAL DETAILS</div>
          <h3>Display name</h3>
          <p class="muted">This is the name shown around Quantum Flow and on the leaderboard.</p>
        </div>
        <div class="qf-profile-avatar" aria-hidden="true">${esc(name.charAt(0).toUpperCase())}</div>
      </div>
      <label class="qf-profile-label" for="qfDisplayName">Your name</label>
      <div class="qf-profile-name-row">
        <input id="qfDisplayName" class="input" type="text" maxlength="40" autocomplete="name" value="${esc(name)}" placeholder="Enter your display name" onkeydown="if(event.key==='Enter'){event.preventDefault();qfSaveDisplayName()}" />
        <button id="qfSaveDisplayName" class="btn" type="button" onclick="qfSaveDisplayName()">Save name</button>
        <button class="btn secondary" type="button" onclick="qfResetDisplayName()">Reset</button>
      </div>
      <p id="qfDisplayNameStatus" class="muted small" aria-live="polite"></p>
    </div>`;
    return editor + original;
  };

  const originalShell = window.shell;
  if (originalShell) {
    window.shell = function qfNamedShell(content, title) {
      const result = originalShell(content, title);
      const name = getDisplayName();
      const greeting = `<div class="qf-shell-greeting"><span class="qf-shell-wave">👋</span><span>Hi, <strong>${esc(name)}</strong></span></div>`;
      return result.replace('<div class="top">', `<div class="top"><div class="qf-shell-greeting-wrap">${greeting}</div>`);
    };
  }

  const originalHome = window.home;
  if (originalHome) {
    window.home = function qfNamedHome() {
      const result = originalHome();
      const name = getDisplayName();
      const greeting = `<div class="qf-home-greeting"><span>Welcome back,</span> <strong>${esc(name)}</strong> <span>✨</span></div>`;
      return result.replace('<div class="card hero">', `<div class="card qf-home-name-card">${greeting}</div><div class="card hero">`);
    };
  }
})();
