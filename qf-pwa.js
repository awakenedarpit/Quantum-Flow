(() => {
  'use strict';

  const installButton = document.createElement('button');
  installButton.id = 'qf-pwa-install';
  installButton.type = 'button';
  installButton.setAttribute('aria-label', 'Install Quantum Flow');
  installButton.innerHTML = '<span class="qf-pwa-icon">📲</span><span class="qf-pwa-install-label">Install Quantum Flow</span>';
  document.body.appendChild(installButton);

  const offline = document.createElement('div');
  offline.id = 'qf-pwa-offline';
  offline.setAttribute('role', 'status');
  offline.textContent = 'Offline mode • your local app shell is still available';
  document.body.appendChild(offline);

  const updateBar = document.createElement('div');
  updateBar.id = 'qf-pwa-update';
  updateBar.innerHTML = '<span>✨ A new Quantum Flow version is ready.</span><button type="button">Update</button>';
  document.body.appendChild(updateBar);

  let deferredPrompt = null;
  let registration = null;

  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (!isStandalone()) installButton.classList.add('show');
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      if (isIOS && !isStandalone()) {
        alert('To install Quantum Flow on iPhone/iPad: tap Share, then choose “Add to Home Screen”.');
      }
      return;
    }
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) {}
    deferredPrompt = null;
    installButton.classList.remove('show');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installButton.classList.remove('show');
  });

  const setOfflineState = () => offline.classList.toggle('show', !navigator.onLine);
  window.addEventListener('online', setOfflineState);
  window.addEventListener('offline', setOfflineState);
  setOfflineState();

  const showUpdate = () => updateBar.classList.add('show');
  updateBar.querySelector('button').addEventListener('click', () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        registration = await navigator.serviceWorker.register('./sw.js?v=26', { scope: './' });
        if (registration.waiting) showUpdate();
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
          });
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (window.__qfSwReloaded) return;
          window.__qfSwReloaded = true;
          window.location.reload();
        });
      } catch (error) {
        console.warn('Quantum Flow PWA service worker unavailable:', error);
      }
    });
  }
})();
