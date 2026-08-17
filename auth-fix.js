// QuantumFlow Auth UX safeguards.
// The actual email quota is enforced by Supabase; this prevents accidental repeat sends
// and gives users a useful message instead of a confusing raw error.
(() => {
  const WAIT_MS = 65_000;
  let lockedUntil = 0;
  const originalSignUp = window.signUp;

  window.signUp = async function () {
    const now = Date.now();
    if (now < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - now) / 1000);
      return toast(`Please wait ${remaining}s before trying again.`);
    }

    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const email = emailEl?.value.trim();
    const password = passwordEl?.value || '';
    if (!email || !password) return toast('Enter email and password');
    if (password.length < 6) return toast('Password must be at least 6 characters');

    lockedUntil = Date.now() + WAIT_MS;
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + window.location.pathname }
      });
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (error.status === 429 || msg.includes('rate limit') || msg.includes('rate_limit')) {
          return toast('Email limit reached. Please wait or use the new email service setup.');
        }
        lockedUntil = 0;
        return toast(error.message);
      }
      if (data?.session) {
        lockedUntil = 0;
        return bootstrap();
      }
      toast('Account created. Check your email to confirm your account.');
    } catch (err) {
      lockedUntil = 0;
      toast('Could not create the account. Please try again.');
    }
  };
})();
