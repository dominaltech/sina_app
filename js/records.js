// SINA App - Records & Firms Directory Controller
(function() {
  let allEntries = [];
  let allFirms = [];
  let activeTab = 'entries'; // 'entries' | 'firms'

  document.addEventListener('DOMContentLoaded', async () => {
    const rep = window.sinaAuth.requireAuth();
    if (!rep) return;

    setupTabs();
    setupSearch();
    await loadData();
  });

  window.refreshCurrentPageData = async function() {
    await loadData();
  };

  async function loadData() {
    const rep = window.sinaAuth.getCurrentUser();
    allEntries = await window.sinaDB.getEntries(rep ? rep.id : null);
    allFirms = await window.sinaDB.getFirms();

    renderEntries();
    renderFirms();
  }

  function setupTabs() {
    const tabEntries = document.getElementById('tab-btn-entries');
    const tabFirms = document.getElementById('tab-btn-firms');
    const viewEntries = document.getElementById('view-entries');
    const viewFirms = document.getElementById('view-firms');

    if (!tabEntries || !tabFirms) return;

    tabEntries.addEventListener('click', () => {
      activeTab = 'entries';
      tabEntries.classList.add('active');
      tabFirms.classList.remove('active');
      viewEntries.style.display = 'block';
      viewFirms.style.display = 'none';
    });

    tabFirms.addEventListener('click', () => {
      activeTab = 'firms';
      tabFirms.classList.add('active');
      tabEntries.classList.remove('active');
      viewFirms.style.display = 'block';
      viewEntries.style.display = 'none';
    });
  }

  function setupSearch() {
    const searchInput = document.getElementById('records-search-input');
    const modeFilter = document.getElementById('records-mode-filter');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        if (activeTab === 'entries') renderEntries();
        else renderFirms();
      });
    }

    if (modeFilter) {
      modeFilter.addEventListener('change', renderEntries);
    }
  }

  function renderEntries() {
    const container = document.getElementById('entries-list-container');
    if (!container) return;

    const query = document.getElementById('records-search-input')?.value.trim().toLowerCase() || '';
    const mode = document.getElementById('records-mode-filter')?.value || '';

    let filtered = allEntries.filter(e => {
      const matchSearch = !query || 
        e.firm_name.toLowerCase().includes(query) || 
        e.contact_person.toLowerCase().includes(query) || 
        (e.mobile && e.mobile.includes(query));
      const matchMode = !mode || e.payment_mode === mode;
      return matchSearch && matchMode;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 30px 16px;">
          <p class="text-muted">No purchase records found.</p>
          <a href="entry.html" class="btn btn-primary" style="margin-top: 12px;">+ Create New Entry</a>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(entry => {
      const dateStr = new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const modeLabel = entry.payment_mode === 'cash' ? 'Cash' : (entry.payment_mode === 'upi' ? 'UPI' : 'Bank Transfer');
      const hasImages = entry.images && entry.images.length > 0;

      html += `
        <div class="card record-item-card">
          <div class="record-header">
            <div>
              <h3 class="record-firm-title">${escapeHtml(entry.firm_name)}</h3>
              <div class="record-date text-muted">${dateStr}</div>
            </div>
            <div class="record-amount-col">
              <span class="record-total">₹${parseFloat(entry.total_amount || 0).toLocaleString('en-IN')}</span>
              <span class="badge ${entry.payment_mode === 'cash' ? 'badge-success' : 'badge-purple'}">${modeLabel}</span>
            </div>
          </div>

          <div class="record-details-grid">
            <div class="record-meta-line">
              <span class="meta-lbl">Item:</span>
              <span class="meta-val">${escapeHtml(entry.type || entry.category_name || 'Goods')}</span>
            </div>
            <div class="record-meta-line">
              <span class="meta-lbl">Quantity:</span>
              <span class="meta-val">${entry.quantity} (${entry.unit?.replace('per_', '')})</span>
            </div>
            <div class="record-meta-line">
              <span class="meta-lbl">Rate:</span>
              <span class="meta-val">₹${entry.rate} / ${entry.unit?.replace('per_', '')}</span>
            </div>
            <div class="record-meta-line">
              <span class="meta-lbl">Contact:</span>
              <span class="meta-val">${escapeHtml(entry.contact_person)} (<a href="tel:${entry.mobile}" class="text-purple">${entry.mobile}</a>)</span>
            </div>
          </div>

          ${entry.payment_mode === 'upi' && entry.upi_id ? `
            <div class="payment-ref-badge">
              <span>UPI: ${escapeHtml(entry.upi_id)}</span>
              ${entry.upi_utr ? `<span>UTR: ${escapeHtml(entry.upi_utr)}</span>` : ''}
            </div>
          ` : ''}

          ${hasImages ? `
            <div class="attachment-preview-row">
              <span class="meta-lbl">Passbook / Cheque Proofs (${entry.images.length}):</span>
              <div class="thumb-strip">
                ${entry.images.map((img, i) => `
                  <img src="${img}" class="strip-thumb" onclick="openImageViewer('${img}')" alt="Attachment ${i+1}">
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderFirms() {
    const container = document.getElementById('firms-list-container');
    if (!container) return;

    const query = document.getElementById('records-search-input')?.value.trim().toLowerCase() || '';

    let filtered = allFirms.filter(f => 
      !query || 
      f.firm_name.toLowerCase().includes(query) || 
      f.contact_person.toLowerCase().includes(query) || 
      f.address.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      container.innerHTML = `<div class="card text-center text-muted" style="padding: 24px;">No firms found matching your search.</div>`;
      return;
    }

    let html = '';
    filtered.forEach(f => {
      html += `
        <div class="card firm-directory-card">
          <div class="firm-card-top">
            <h4 class="firm-name-txt">${escapeHtml(f.firm_name)}</h4>
            <a href="tel:${f.mobile}" class="btn-call-firm" title="Call">${f.mobile}</a>
          </div>
          <div class="firm-contact-txt"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-1px;margin-right:4px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${escapeHtml(f.contact_person)}</div>
          <div class="firm-address-txt"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-1px;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${escapeHtml(f.address)}</div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  window.openImageViewer = function(imgSrc) {
    const viewer = document.getElementById('full-image-modal');
    const imgEl = document.getElementById('full-modal-img');
    if (viewer && imgEl) {
      imgEl.src = imgSrc;
      viewer.classList.add('active');
    }
  };

  window.closeImageViewer = function() {
    const viewer = document.getElementById('full-image-modal');
    if (viewer) viewer.classList.remove('active');
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
