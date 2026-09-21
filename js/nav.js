// SINA App - Navigation Shell (Top Bar with Refresh Button, Drawer, Fixed Bottom 4-Tab Bar)
(function() {
  function renderNavigation() {
    const user = window.sinaAuth ? window.sinaAuth.getCurrentUser() : null;
    const isLoginPage = window.location.pathname.endsWith('login.html');
    if (isLoginPage) return;

    const currentPath = window.location.pathname;
    const isHome = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('SINA%20App/') || currentPath.endsWith('SINA App/');
    const isEntry = currentPath.endsWith('entry.html');
    const isRecords = currentPath.endsWith('records.html');
    const isExpenses = currentPath.endsWith('expenses.html');
    const isProfile = currentPath.endsWith('profile.html');

    const icons = window.SINA_ICONS;
    if (!icons) return;

    // 1. TOP HEADER
    let topHeader = document.getElementById('sina-top-header');
    if (!topHeader) {
      topHeader = document.createElement('header');
      topHeader.id = 'sina-top-header';
      topHeader.className = 'sina-top-bar';
      document.body.prepend(topHeader);
    }

    topHeader.innerHTML = `
      <div class="top-bar-left">
        <button id="drawer-toggle-btn" class="icon-btn" aria-label="Open menu">
          ${icons.get('menu', { size: 22 })}
        </button>
        <div class="app-branding">
          <span class="brand-name">SINA</span>
          <span class="brand-tag">APP</span>
        </div>
      </div>
      <div class="top-bar-right">
        <!-- Language Selector (English, Hindi, Marathi) -->
        <div class="lang-selector-wrap" id="lang-selector-container">
          <button type="button" id="lang-menu-btn" class="lang-pill-btn" aria-label="Select Language">
            ${icons.get('globe', { size: 14 })}
            <span id="current-lang-label">EN</span>
            ${icons.get('chevronDown', { size: 12 })}
          </button>
          <div class="lang-dropdown-menu" id="lang-dropdown-menu">
            <div class="lang-option" data-lang="en">
              <span class="lang-name">English</span>
              <span class="lang-code">EN</span>
            </div>
            <div class="lang-option" data-lang="hi">
              <span class="lang-name">हिन्दी (Hindi)</span>
              <span class="lang-code">HI</span>
            </div>
            <div class="lang-option" data-lang="mr">
              <span class="lang-name">मराठी (Marathi)</span>
              <span class="lang-code">MR</span>
            </div>
          </div>
        </div>

        <div class="network-badge ${navigator.onLine ? 'online' : 'offline'}" id="network-status-indicator">
          <span class="dot"></span>
          <span class="status-label">${navigator.onLine ? 'Live' : 'Offline'}</span>
        </div>
        <button id="global-refresh-btn" class="icon-btn refresh-btn" title="Refresh Live Data" aria-label="Refresh">
          ${icons.get('refresh', { size: 20 })}
        </button>
      </div>
    `;

    // 2. SLIDE DRAWER
    let drawer = document.getElementById('sina-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'sina-drawer';
      drawer.className = 'sina-drawer';
      document.body.appendChild(drawer);
    }

    const repName = user ? user.name : 'Field Representative';
    const repPhone = user ? user.phone : 'Not Logged In';
    const repRoute = user ? user.assigned_route || 'Field Route' : 'Zone';

    drawer.innerHTML = `
      <div class="drawer-backdrop" id="drawer-backdrop"></div>
      <div class="drawer-panel">
        <div class="drawer-header">
          <div class="rep-avatar-box">
            ${icons.get('user', { size: 26, stroke: '#FFFFFF' })}
          </div>
          <div class="rep-info">
            <h4 class="rep-name">${repName}</h4>
            <span class="rep-phone">${repPhone}</span>
            <span class="rep-route-pill">${repRoute}</span>
          </div>
          <button class="icon-btn close-drawer-btn" id="close-drawer-btn">
            ${icons.get('close', { size: 20 })}
          </button>
        </div>

        <nav class="drawer-nav">
          <a href="index.html" class="drawer-link ${isHome ? 'active' : ''}">
            <span class="nav-icon">${icons.get('home', { size: 20 })}</span>
            <span class="nav-label">Dashboard & Summary</span>
          </a>
          <a href="entry.html" class="drawer-link ${isEntry ? 'active' : ''}">
            <span class="nav-icon">${icons.get('plus', { size: 20 })}</span>
            <span class="nav-label">New Purchase Entry</span>
          </a>
          <a href="records.html" class="drawer-link ${isRecords ? 'active' : ''}">
            <span class="nav-icon">${icons.get('records', { size: 20 })}</span>
            <span class="nav-label">Orders History</span>
          </a>
          <a href="expenses.html" class="drawer-link ${isExpenses ? 'active' : ''}">
            <span class="nav-icon">${icons.get('cash', { size: 20 })}</span>
            <span class="nav-label">Field Expenses</span>
          </a>
          <a href="profile.html" class="drawer-link ${isProfile ? 'active' : ''}">
            <span class="nav-icon">${icons.get('user', { size: 20 })}</span>
            <span class="nav-label">Cash Given & Summary</span>
          </a>
        </nav>

        <div class="drawer-footer">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 8px 4px; border-bottom: 1px solid var(--border-color);">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
              ${icons.get('globe', { size: 16 })} Language / भाषा
            </span>
            <div style="display: flex; gap: 5px;">
              <button type="button" class="drawer-lang-btn" data-drawer-lang="en">EN</button>
              <button type="button" class="drawer-lang-btn" data-drawer-lang="hi">हिन्दी</button>
              <button type="button" class="drawer-lang-btn" data-drawer-lang="mr">मराठी</button>
            </div>
          </div>
          <button class="btn btn-outline-purple btn-block install-drawer-btn" onclick="triggerPWAInstall()">
            ${icons.get('download', { size: 18 })} Install SINA App
          </button>
          <button class="btn btn-logout btn-block" onclick="window.sinaAuth.logout()">
            ${icons.get('logout', { size: 18 })} Logout
          </button>
        </div>
      </div>
    `;

    // 3. FIXED BOTTOM NAVIGATION BAR (4 Main Tabs)
    let bottomNav = document.getElementById('sina-bottom-nav');
    if (!bottomNav) {
      bottomNav = document.createElement('nav');
      bottomNav.id = 'sina-bottom-nav';
      bottomNav.className = 'sina-bottom-nav';
      document.body.appendChild(bottomNav);
    }

    bottomNav.innerHTML = `
      <a href="index.html" class="bottom-nav-item ${isHome ? 'active' : ''}">
        <span class="b-icon">${icons.get('home', { size: 22 })}</span>
        <span class="b-label">Home</span>
      </a>
      <a href="entry.html" class="bottom-nav-item ${isEntry ? 'active' : ''}">
        <span class="b-icon plus-circle">${icons.get('plus', { size: 24 })}</span>
        <span class="b-label">New Entry</span>
      </a>
      <a href="records.html" class="bottom-nav-item ${isRecords ? 'active' : ''}">
        <span class="b-icon">${icons.get('records', { size: 22 })}</span>
        <span class="b-label">Records</span>
      </a>
      <a href="profile.html" class="bottom-nav-item ${isProfile ? 'active' : ''}">
        <span class="b-icon">${icons.get('user', { size: 22 })}</span>
        <span class="b-label">Cash & Exp</span>
      </a>
    `;

    // Attach Event Listeners
    const drawerBtn = document.getElementById('drawer-toggle-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const backdrop = document.getElementById('drawer-backdrop');

    function toggleDrawer(open) {
      if (open) {
        drawer.classList.add('open');
      } else {
        drawer.classList.remove('open');
      }
    }

    if (drawerBtn) drawerBtn.addEventListener('click', () => toggleDrawer(true));
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
    if (backdrop) backdrop.addEventListener('click', () => toggleDrawer(false));

    // REFRESH BUTTON WITH SPIN ANIMATION & REALTIME FETCH
    const refreshBtn = document.getElementById('global-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('spinning');
        try {
          if (window.refreshCurrentPageData) {
            await window.refreshCurrentPageData();
          } else {
            // Default reload after short spin
            await new Promise(r => setTimeout(r, 600));
            window.location.reload();
          }
        } finally {
          setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
        }
      });
    }

    // Network status updates
    window.addEventListener('online', () => updateNetworkStatus(true));
    window.addEventListener('offline', () => updateNetworkStatus(false));

    // LANGUAGE SELECTOR LOGIC
    setupLanguageEvents();
  }

  function setupLanguageEvents() {
    const langBtn = document.getElementById('lang-menu-btn');
    const langMenu = document.getElementById('lang-dropdown-menu');

    if (langBtn && langMenu) {
      langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langMenu.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!langMenu.contains(e.target) && !langBtn.contains(e.target)) {
          langMenu.classList.remove('active');
        }
      });

      langMenu.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
          const lang = opt.getAttribute('data-lang');
          if (window.sinaTranslate) {
            window.sinaTranslate.setLanguage(lang);
          }
          langMenu.classList.remove('active');
          syncLanguageUI(lang);
        });
      });
    }

    document.querySelectorAll('.drawer-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-drawer-lang');
        if (window.sinaTranslate) {
          window.sinaTranslate.setLanguage(lang);
        }
        syncLanguageUI(lang);
      });
    });

    // Initial language UI sync
    const currentLang = localStorage.getItem('sina_app_language') || 'en';
    syncLanguageUI(currentLang);
  }

  function syncLanguageUI(lang) {
    const label = document.getElementById('current-lang-label');
    if (label) {
      label.textContent = lang.toUpperCase();
    }

    const menu = document.getElementById('lang-dropdown-menu');
    if (menu) {
      menu.querySelectorAll('.lang-option').forEach(opt => {
        if (opt.getAttribute('data-lang') === lang) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
    }

    document.querySelectorAll('.drawer-lang-btn').forEach(btn => {
      if (btn.getAttribute('data-drawer-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function updateNetworkStatus(online) {
    const el = document.getElementById('network-status-indicator');
    if (el) {
      el.className = `network-badge ${online ? 'online' : 'offline'}`;
      el.querySelector('.status-label').textContent = online ? 'Live' : 'Offline';
    }
  }

  window.initNavigation = renderNavigation;
  document.addEventListener('DOMContentLoaded', renderNavigation);
})();
