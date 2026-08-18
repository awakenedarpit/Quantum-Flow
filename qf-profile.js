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

  const closeProfileEditor = () => {
    document.getElementById('qfProfileModal')?.remove();
  };

  window.qfSaveDisplayName = async (sourceInput, sourceButton, sourceStatus) => {
    const input = sourceInput || document.getElementById('qfDisplayName');
    const button = sourceButton || document.getElementById('qfSaveDisplayName');
    const status = sourceStatus || document.getElementById('qfDisplayNameStatus');
    const name = String(input?.value || '').trim().replace(/\s+/g, ' ');
    const validation = validName(name);
    if (validation) return toast(validation);
    if (!currentUser) return toast('Please sign in again.');
    if (button) { button.disabled = true; button.textContent = 'Saving…'; }
    if (status) status.textContent = 'Saving your profile…';
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

      if (status) status.textContent = 'Profile updated successfully.';
      toast('Profile updated ✓');
      render();
      setTimeout(closeProfileEditor, 350);
    } catch (error) {
      console.error('Profile update failed', error);
      if (status) status.textContent = '';
      toast(error?.message || 'Could not update your profile.');
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Update profile'; }
    }
  };

  window.qfResetDisplayName = () => {
    const input = document.getElementById('qfDisplayName');
    if (input) input.value = getDisplayName();
    const status = document.getElementById('qfDisplayNameStatus');
    if (status) status.textContent = '';
  };

  window.qfOpenProfileEditor = () => {
    closeProfileEditor();
    if (!currentUser) return toast('Please sign in again.');
    const name = getDisplayName();
    const email = String(currentUser.email || '');
    const modal = document.createElement('div');
    modal.id = 'qfProfileModal';
    modal.className = 'qf-profile-modal-backdrop';
    modal.innerHTML = `<section class="qf-profile-modal" role="dialog" aria-modal="true" aria-labelledby="qfProfileModalTitle">
      <button class="qf-profile-modal-close" type="button" aria-label="Close" onclick="qfCloseProfileEditor()">×</button>
      <div class="qf-profile-avatar qf-profile-modal-avatar" aria-hidden="true">${esc(name.charAt(0).toUpperCase())}</div>
      <div class="qf-profile-kicker">✨ YOUR PROFILE</div>
      <h2 id="qfProfileModalTitle">Update profile</h2>
      <p class="muted">Change how you appear across Quantum Flow.</p>
      <label class="qf-profile-label" for="qfDisplayName">Display name</label>
      <input id="qfDisplayName" class="input" type="text" maxlength="40" autocomplete="name" value="${esc(name)}" placeholder="Enter your display name" />
      <label class="qf-profile-label" for="qfProfileEmail">Email</label>
      <input id="qfProfileEmail" class="input" type="email" value="${esc(email)}" readonly aria-readonly="true" />
      <p class="qf-profile-readonly">Your login email is managed by Supabase authentication and is not changed here.</p>
      <p id="qfDisplayNameStatus" class="muted small" aria-live="polite"></p>
      <div class="qf-profile-modal-actions">
        <button class="btn secondary" type="button" onclick="qfCloseProfileEditor()">Cancel</button>
        <button id="qfSaveDisplayName" class="btn" type="button" onclick="qfSaveDisplayName()">Update profile</button>
      </div>
    </section>`;
    modal.addEventListener('click', event => { if (event.target === modal) closeProfileEditor(); });
    document.body.appendChild(modal);
    const input = modal.querySelector('#qfDisplayName');
    input?.focus();
    input?.select();
    input?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); window.qfSaveDisplayName(); } if (event.key === 'Escape') closeProfileEditor(); });
  };

  window.qfCloseProfileEditor = closeProfileEditor;

  const originalProfile = window.profile;
  window.profile = function qfEnhancedProfile() {
    const name = getDisplayName();
    const email = String(currentUser?.email || '');
    const original = originalProfile ? originalProfile() : '';
    const editor = `<div class="card qf-profile-editor">
      <div class="qf-profile-editor-head">
        <div>
          <div class="qf-profile-kicker">✨ PERSONAL DETAILS</div>
          <h3>Your profile</h3>
          <p class="muted">Keep your Quantum Flow identity up to date.</p>
        </div>
        <div class="qf-profile-avatar" aria-hidden="true">${esc(name.charAt(0).toUpperCase())}</div>
      </div>
      <div class="qf-profile-summary">
        <div><span class="muted">Display name</span><strong>${esc(name)}</strong></div>
        <div><span class="muted">Email</span><strong>${esc(email || 'Not available')}</strong></div>
      </div>
      <button class="btn qf-update-profile-btn" type="button" onclick="qfOpenProfileEditor()">✏️ Update profile</button>
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
