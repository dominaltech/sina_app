// SINA App - Records / Orders History Controller
(function() {
  let allEntries = [];

  document.addEventListener('DOMContentLoaded', async () => {
    const rep = window.sinaAuth.requireAuth();
    if (!rep) return;

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
    renderEntries();
  }

  function setupSearch() {
    const searchInput = document.getElementById('records-search-input');
    const modeFilter = document.getElementById('records-mode-filter');

    if (searchInput) {
      searchInput.addEventListener('input', renderEntries);
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
      const hasImages = entry.images && entry.images.length > 0;
      const items = entry.items && entry.items.length > 0 ? entry.items : null;

      let paymentBadge = '';
      if (entry.payment_mode === 'cash') {
        paymentBadge = '<span class="badge badge-success">Cash Paid</span>';
      } else if (entry.payment_mode === 'upi') {
        if (entry.status === 'verified' || entry.upi_utr) {
          paymentBadge = `<span class="badge badge-success">UPI Paid &bull; UTR: ${escapeHtml(entry.upi_utr || 'Settled')}</span>`;
        } else {
          paymentBadge = '<span class="badge" style="background: #FEF3C7; color: #B45309; font-weight: 700;">Awaiting Admin UPI Payment</span>';
        }
      } else {
        paymentBadge = `<span class="badge ${entry.status === 'verified' ? 'badge-success' : 'badge-purple'}">${entry.status === 'verified' ? 'Bank Verified' : 'Bank Transfer Pending'}</span>`;
      }

      html += `
        <div class="card record-item-card">
          <div class="record-header">
            <div>
              <h3 class="record-firm-title">${escapeHtml(entry.firm_name)}</h3>
              <div class="record-date text-muted">${dateStr}</div>
            </div>
            <div class="record-amount-col">
              <span class="record-total">₹${parseFloat(entry.total_amount || 0).toLocaleString('en-IN')}</span>
              <div style="margin-top: 4px;">${paymentBadge}</div>
            </div>
          </div>

          <!-- Items Breakdown -->
          ${items ? `
            <div style="background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 8px 10px; margin-bottom: 10px; font-size: 0.82rem;">
              <div style="font-weight: 700; color: var(--purple-primary); margin-bottom: 6px;">Items Purchased (${items.length}):</div>
              ${items.map(item => `
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding: 4px 0;">
                  <span><strong>${escapeHtml(item.product_name || item.type || 'Item')}</strong> (${item.quantity} ${item.unit?.replace('per_', '')} @ ₹${item.rate})</span>
                  <span style="font-weight: 700;">₹${parseFloat(item.line_total || 0).toLocaleString('en-IN')}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="record-details-grid">
              <div class="record-meta-line">
                <span class="meta-lbl">Item:</span>
                <span class="meta-val">${escapeHtml(entry.type || entry.product_name || entry.category_name || 'Goods')}</span>
              </div>
              <div class="record-meta-line">
                <span class="meta-lbl">Quantity:</span>
                <span class="meta-val">${entry.quantity || 1} (${entry.unit?.replace('per_', '')})</span>
              </div>
              <div class="record-meta-line">
                <span class="meta-lbl">Rate:</span>
                <span class="meta-val">₹${entry.rate || 0} / ${entry.unit?.replace('per_', '')}</span>
              </div>
              <div class="record-meta-line">
                <span class="meta-lbl">Line Total:</span>
                <span class="meta-val">₹${parseFloat(entry.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          `}

          <div style="margin-top: 8px; font-size: 0.82rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--text-secondary);">Contact: <strong>${escapeHtml(entry.contact_person)}</strong> (<a href="tel:${entry.mobile}" class="text-purple">${entry.mobile}</a>)</span>
          </div>

          ${entry.payment_mode === 'upi' && entry.upi_id ? `
            <div class="payment-ref-badge" style="margin-top: 8px;">
              <span>Firm UPI: <strong>${escapeHtml(entry.upi_id)}</strong></span>
              ${entry.upi_utr ? `<span>UTR: <strong>${escapeHtml(entry.upi_utr)}</strong></span>` : '<span style="color: #D97706;">Admin Payment In-Progress</span>'}
            </div>
          ` : ''}

          ${hasImages ? `
            <div class="attachment-preview-row">
              <span class="meta-lbl">Proofs & Attachments (${entry.images.length}):</span>
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
    if (window.sinaTranslate) {
      window.sinaTranslate.applyInstantTranslation(container);
    }
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
