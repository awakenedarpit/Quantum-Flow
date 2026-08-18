// Legacy auth compatibility shim. The active implementation lives in auth-current.js.
// Kept intentionally free of name fields/validation so stale cached pages cannot show "Enter your name".
(() => {
  const bind = () => {
    if (typeof window.qfCreateAccount === 'function') window.signUp = window.qfCreateAccount;
    if (typeof window.qfLogin === 'function') window.signIn = window.qfLogin;
  };
  bind();
  setTimeout(bind, 100);
  setTimeout(bind, 500);
})();
