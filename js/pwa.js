// SINA App - PWA Installation & Apple iOS Safari Guide Controller
(function() {
  let deferredPrompt = null;

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SINA App Service Worker registered:', reg.scope))
        .catch(err => console.warn('SW registration error:', err));
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('beforeinstallprompt captured');

    // Auto-show install pop-up on first visit if not standalone
    if (!isStandalone() && !sessionStorage.getItem('sina_install_dismissed')) {
      setTimeout(() => {
        showPwaModal('android');
      }, 1500);
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('SINA App installed successfully');
    closePwaModal();
  });

  window.triggerPWAInstall = function() {
    if (isStandalone()) {
      alert('SINA App is already installed and running in standalone mode.');
      return;
    }

    if (isIOS()) {
      showPwaModal('ios');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted install prompt');
        }
        deferredPrompt = null;
      });
    } else {
      // Show Android / General manual install modal
      showPwaModal('android_manual');
    }
  };

  function showPwaModal(type = 'android') {
    let modal = document.getElementById('sina-pwa-install-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sina-pwa-install-modal';
      modal.className = 'sina-modal-backdrop';
      document.body.appendChild(modal);
    }

    let contentHtml = '';
    const shareIcon = window.SINA_ICONS ? window.SINA_ICONS.get('share', { size: 22 }) : '';
    const plusIcon = window.SINA_ICONS ? window.SINA_ICONS.get('plus', { size: 22 }) : '';
    const downloadIcon = window.SINA_ICONS ? window.SINA_ICONS.get('download', { size: 22 }) : '';
    const closeIcon = window.SINA_ICONS ? window.SINA_ICONS.get('close', { size: 20 }) : '';

    if (type === 'ios') {
      contentHtml = `
        <div class="sina-modal-card pwa-guide-card">
          <div class="pwa-modal-header">
            <div class="pwa-brand-tag">
              <span class="pwa-badge-purple">iOS Safari Installation</span>
            </div>
            <button class="icon-btn close-modal-btn" onclick="closePwaModal()">${closeIcon}</button>
          </div>
          <div class="pwa-modal-body">
            <h3 class="pwa-title">Install SINA App on iPhone</h3>
            <p class="pwa-subtitle">Install this Progressive Web App on your home screen for quick offline access during field operations.</p>
            <div class="ios-steps-list">
              <div class="ios-step-item">
                <div class="step-badge">1</div>
                <div class="step-content">
                  <div class="step-title">Tap the <strong>Share</strong> button</div>
                  <div class="step-desc">Located in the bottom navigation bar of Safari browser.</div>
                  <div class="step-icon-preview">${shareIcon}</div>
                </div>
              </div>
              <div class="ios-step-item">
                <div class="step-badge">2</div>
                <div class="step-content">
                  <div class="step-title">Select <strong>"Add to Home Screen"</strong></div>
                  <div class="step-desc">Scroll down the share sheet until you see the action.</div>
                  <div class="step-icon-preview">${plusIcon}</div>
                </div>
              </div>
              <div class="ios-step-item">
                <div class="step-badge">3</div>
                <div class="step-content">
                  <div class="step-title">Tap <strong>"Add"</strong> in the top right</div>
                  <div class="step-desc">SINA App icon will appear on your home screen!</div>
                </div>
              </div>
            </div>
          </div>
          <div class="pwa-modal-footer">
            <button class="btn btn-primary btn-block" onclick="closePwaModal()">Got it!</button>
          </div>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="sina-modal-card pwa-guide-card">
          <div class="pwa-modal-header">
            <div class="pwa-brand-tag">
              <span class="pwa-badge-purple">PWA Ready</span>
            </div>
            <button class="icon-btn close-modal-btn" onclick="closePwaModal()">${closeIcon}</button>
          </div>
          <div class="pwa-modal-body text-center">
            <div class="pwa-app-logo-badge">
              <span class="pwa-logo-text">SINA</span>
            </div>
            <h3 class="pwa-title">Install SINA App</h3>
            <p class="pwa-subtitle">Install as a standalone app on your mobile device or desktop for fast, offline field procurement entry.</p>
          </div>
          <div class="pwa-modal-footer dual-btn-row">
            <button class="btn btn-secondary" onclick="dismissPwaModal()">Later</button>
            <button class="btn btn-primary" onclick="proceedInstall()">${downloadIcon} Install App</button>
          </div>
        </div>
      `;
    }

    modal.innerHTML = contentHtml;
    modal.classList.add('active');
  }

  window.closePwaModal = function() {
    const modal = document.getElementById('sina-pwa-install-modal');
    if (modal) modal.classList.remove('active');
  };

  window.dismissPwaModal = function() {
    sessionStorage.setItem('sina_install_dismissed', 'true');
    closePwaModal();
  };

  window.proceedInstall = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        closePwaModal();
      });
    } else {
      alert('To install on this browser: Tap your browser menu (⋮) and select "Install app" or "Add to Home Screen".');
      closePwaModal();
    }
  };
})();
