/* Quantum Flow — checkbox DOM hardening */
(() => {
  const clean = () => {
    document.querySelectorAll('.item').forEach(row => {
      const check = row.querySelector(':scope > .check');
      const grow = row.querySelector(':scope > .grow');
      if (!check || !grow) return;
      row.classList.add('qf-habit-row');

      /* Remove accidental standalone text/label nodes between the control and content.
         Never touch the habit name/content inside .grow. */
      [...row.childNodes].forEach(node => {
        if (node === check || node === grow || node.nodeType === Node.COMMENT_NODE) return;
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim().toLowerCase();
          if (text === 'check' || text === 'checked') node.remove();
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE && !node.matches('.pill')) {
          const text = node.textContent.trim().toLowerCase();
          if (text === 'check' || text === 'checked') node.remove();
        }
      });

      check.setAttribute('aria-label', check.classList.contains('done') ? 'Mark habit incomplete' : 'Mark habit complete');
      check.setAttribute('type', 'button');
    });
  };

  const start = () => {
    clean();
    const app = document.getElementById('app');
    if (!app || window.qfCheckboxObserver) return;
    window.qfCheckboxObserver = new MutationObserver(clean);
    window.qfCheckboxObserver.observe(app, {childList:true, subtree:true});
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
