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
    setupEditEntryModal();
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

          <div style="display: flex; justify-content: flex-end; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
            <button type="button" class="btn btn-outline-purple btn-sm" onclick="openEditEntryModal('${entry.id}')" style="padding: 5px 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit Entry
            </button>
          </div>
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

  window.openEditEntryModal = function(entryId) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;

    const modal = document.getElementById('edit-entry-modal');
    if (!modal) return;

    document.getElementById('edit_entry_id').value = entry.id;
    document.getElementById('edit_entry_firm_name').value = entry.firm_name || '';
    document.getElementById('edit_entry_contact').value = entry.contact_person || '';
    document.getElementById('edit_entry_mobile').value = entry.mobile || '';
    document.getElementById('edit_entry_address').value = entry.address || '';
    document.getElementById('edit_entry_product').value = entry.type || entry.product_name || 'Goods';
    document.getElementById('edit_entry_qty').value = entry.quantity || 1;
    document.getElementById('edit_entry_unit').value = entry.unit || 'per_kg';
    document.getElementById('edit_entry_rate').value = entry.rate || 0;
    document.getElementById('edit_entry_total').value = entry.total_amount || 0;
    
    const modeSelect = document.getElementById('edit_entry_mode');
    if (modeSelect) {
      modeSelect.value = entry.payment_mode || 'cash';
    }

    const upiFields = document.getElementById('edit_upi_fields');
    if (upiFields) {
      upiFields.style.display = entry.payment_mode === 'upi' ? 'block' : 'none';
      document.getElementById('edit_entry_upi_id').value = entry.upi_id || '';
      document.getElementById('edit_entry_upi_utr').value = entry.upi_utr || '';
    }

    modal.classList.add('active');
  };

  function setupEditEntryModal() {
    const modal = document.getElementById('edit-entry-modal');
    const closeBtn = document.getElementById('btn-close-edit-entry');
    const form = document.getElementById('edit-entry-form');
    const modeSelect = document.getElementById('edit_entry_mode');
    const upiFields = document.getElementById('edit_upi_fields');
    const qtyInput = document.getElementById('edit_entry_qty');
    const rateInput = document.getElementById('edit_entry_rate');
    const totalInput = document.getElementById('edit_entry_total');

    if (!modal) return;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (modeSelect && upiFields) {
      modeSelect.addEventListener('change', () => {
        upiFields.style.display = modeSelect.value === 'upi' ? 'block' : 'none';
      });
    }

    function recalcTotal() {
      const q = parseFloat(qtyInput?.value) || 0;
      const r = parseFloat(rateInput?.value) || 0;
      if (totalInput) {
        totalInput.value = (q * r).toFixed(2);
      }
    }

    if (qtyInput) qtyInput.addEventListener('input', recalcTotal);
    if (rateInput) rateInput.addEventListener('input', recalcTotal);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving Changes...';
        }

        try {
          const entryId = document.getElementById('edit_entry_id').value;
          const firmName = document.getElementById('edit_entry_firm_name').value.trim();
          const contact = document.getElementById('edit_entry_contact').value.trim();
          const mobile = document.getElementById('edit_entry_mobile').value.trim();
          const address = document.getElementById('edit_entry_address').value.trim();
          const product = document.getElementById('edit_entry_product').value.trim();
          const quantity = parseFloat(document.getElementById('edit_entry_qty').value) || 0;
          const unit = document.getElementById('edit_entry_unit').value;
          const rate = parseFloat(document.getElementById('edit_entry_rate').value) || 0;
          const totalAmount = parseFloat(document.getElementById('edit_entry_total').value) || (quantity * rate);
          const paymentMode = document.getElementById('edit_entry_mode').value;
          const upiId = document.getElementById('edit_entry_upi_id')?.value.trim();
          const upiUtr = document.getElementById('edit_entry_upi_utr')?.value.trim();

          await window.sinaDB.updateProcurementEntry(entryId, {
            firm_name: firmName,
            contact_person: contact,
            mobile: mobile,
            address: address,
            type: product,
            product_name: product,
            quantity: quantity,
            unit: unit,
            rate: rate,
            total_amount: totalAmount,
            payment_mode: paymentMode,
            upi_id: upiId,
            upi_utr: upiUtr
          });

          modal.classList.remove('active');
          await loadData();
          alert(`Success! Purchase entry for "${firmName}" has been updated.`);
        } catch (err) {
          console.error(err);
          alert('Error updating entry: ' + err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes to Supabase';
          }
        }
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
