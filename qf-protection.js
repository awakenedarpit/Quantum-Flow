/* Quantum Flow — browser-side protection layer.
 * This is a deterrent only. Never rely on client-side checks for authorization.
 */
(() => {
  'use strict';

  const isEditable = (target) => {
    if (!target) return false;
    const el = target.closest?.('input, textarea, select, [contenteditable="true"], button, a');
    return !!el;
  };

  // Discourage casual copying/dragging of the app shell while keeping forms usable.
  document.addEventListener('dragstart', (event) => {
    if (event.target?.closest?.('img, svg')) event.preventDefault();
  }, { capture: true });

  document.addEventListener('selectstart', (event) => {
    if (!isEditable(event.target)) event.preventDefault();
  }, { capture: true });

  // Keep the context menu disabled across dynamically rendered pages.
  document.addEventListener('contextmenu', (event) => event.preventDefault(), { capture: true });

  // Block the most common accidental developer/source shortcuts. Inputs are excluded.
  document.addEventListener('keydown', (event) => {
    if (isEditable(event.target)) return;

    const key = String(event.key || '').toLowerCase();
    const blocked =
      key === 'f12' ||
      (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
      (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key)) ||
      (event.ctrlKey && ['u', 's'].includes(key)) ||
      (event.metaKey && ['u', 's'].includes(key));

    if (blocked) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true });
})();
