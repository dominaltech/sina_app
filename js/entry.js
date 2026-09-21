// SINA App - Multi-Product Dynamic Entry Controller
(function() {
  let allFirms = [];
  let allProducts = [];
  let selectedPaymentMode = 'cash';
  let uploadedImages = [];
  let productRows = [];
  let rowCounter = 0;

  document.addEventListener('DOMContentLoaded', async () => {
    const rep = window.sinaAuth.requireAuth();
    if (!rep) return;

    const repBadge = document.getElementById('form-rep-name');
    if (repBadge) repBadge.textContent = rep.name;

    await loadInitialData();
    setupFirmAutoSuggest();
    setupPaymentModeTabs();
    setupImageUploader();
    setupMultiProductManager();
    setupFormSubmission();
    checkUrlParams();
  });

  async function loadInitialData() {
    allFirms = await window.sinaDB.getFirms();
    allProducts = await window.sinaDB.getProducts();
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product_id');
    if (productId && productRows.length > 0) {
      const prod = allProducts.find(p => p.id === productId);
      if (prod) {
        const firstRow = productRows[0];
        const rowEl = document.getElementById(`prod-row-${firstRow.id}`);
        if (rowEl) {
          const nameInput = rowEl.querySelector('.prod-name-input');
          const rateInput = rowEl.querySelector('.prod-rate-input');
          if (nameInput) nameInput.value = prod.name;
          if (rateInput && prod.default_rate) rateInput.value = prod.default_rate;
          firstRow.productName = prod.name;
          firstRow.unit = prod.default_unit || 'per_kg';
          firstRow.rate = parseFloat(prod.default_rate) || 0;
          updateRowUnitUI(rowEl, firstRow.unit);
          recalculateRowTotal(firstRow.id);
        }
      }
    }
  }

  // 1. FIRM AUTO-SUGGEST
  function setupFirmAutoSuggest() {
    const firmInput = document.getElementById('firm_name');
    const dropdown = document.getElementById('firm-autosuggest-dropdown');
    const contactInput = document.getElementById('contact_person');
    const mobileInput = document.getElementById('mobile');
    const addressInput = document.getElementById('address');

    if (!firmInput || !dropdown) return;

    firmInput.addEventListener('input', () => {
      const query = firmInput.value.trim().toLowerCase();
      if (query.length === 0) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      const matches = allFirms.filter(f => 
        (f.firm_name && f.firm_name.toLowerCase().includes(query)) || 
        (f.contact_person && f.contact_person.toLowerCase().includes(query))
      );

      let html = '';
      matches.forEach(firm => {
        html += `
          <div class="suggest-item" data-id="${firm.id}">
            <div class="suggest-firm-name">${escapeHtml(firm.firm_name)}</div>
            <div class="suggest-firm-meta">
              <span>${escapeHtml(firm.contact_person)} &bull; ${escapeHtml(firm.mobile)}</span>
              <span>${escapeHtml(firm.address)}</span>
            </div>
          </div>
        `;
      });

      if (query.length > 0) {
        const exact = allFirms.some(f => f.firm_name.toLowerCase() === query);
        if (!exact) {
          html += `
            <div class="add-new-firm-item" id="btn-add-new-firm" style="padding: 10px 14px; cursor: pointer; color: var(--purple-primary); font-weight: 600; font-size: 0.88rem; background: var(--purple-tint);">
              <span>+ Add "${escapeHtml(firmInput.value.trim())}" as new firm</span>
            </div>
          `;
        }
      }

      dropdown.innerHTML = html;
      dropdown.classList.add('active');

      dropdown.querySelectorAll('.suggest-item').forEach(item => {
        item.addEventListener('click', () => {
          const firmId = item.getAttribute('data-id');
          const firm = allFirms.find(f => f.id === firmId);
          if (firm) {
            firmInput.value = firm.firm_name;
            if (contactInput) contactInput.value = firm.contact_person;
            if (mobileInput) mobileInput.value = firm.mobile;
            if (addressInput) addressInput.value = firm.address;
          }
          dropdown.classList.remove('active');
        });
      });

      const addBtn = document.getElementById('btn-add-new-firm');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          dropdown.classList.remove('active');
          if (contactInput && !contactInput.value) contactInput.focus();
        });
      }
    });

    document.addEventListener('click', (e) => {
      if (!firmInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  // 2. DYNAMIC MULTI-PRODUCT MANAGER
  function setupMultiProductManager() {
    const addBtn = document.getElementById('btn-add-product-row');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addProductRow();
      });
    }

    // Initialize with row #1
    addProductRow();
  }

  function addProductRow(initialData = null) {
    rowCounter++;
    const rowId = 'row_' + rowCounter;
    const container = document.getElementById('product-rows-container');
    if (!container) return;

    const rowObj = {
      id: rowId,
      productName: initialData?.name || '',
      categoryName: initialData?.category || 'General',
      quantity: initialData?.quantity || 1,
      unit: initialData?.unit || 'per_kg',
      rate: initialData?.rate || 0,
      lineTotal: (initialData?.quantity || 1) * (initialData?.rate || 0)
    };
    productRows.push(rowObj);

    const card = document.createElement('div');
    card.id = `prod-row-${rowId}`;
    card.className = 'product-row-card';

    renderRowContent(card, rowObj);
    container.appendChild(card);

    attachRowListeners(card, rowObj);
    updateRowHeaders();
    recalculateRowTotal(rowId);
  }

  function renderRowContent(card, rowObj) {
    card.innerHTML = `
      <div class="product-row-header">
        <span class="product-row-num">Item #<span class="row-num-text">1</span></span>
        <button type="button" class="btn-remove-row" data-row-id="${rowObj.id}" style="${productRows.length > 1 ? '' : 'display: none;'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Remove
        </button>
      </div>

      <!-- Product Name with Autocomplete / Free-typing -->
      <div class="form-group autosuggest-wrapper" style="margin-bottom: 10px;">
        <label class="form-label">Product / Item Name <span class="required-star">*</span></label>
        <input type="text" class="form-input prod-name-input" placeholder="Type commodity name (e.g. Basmati Rice, Mustard)" value="${escapeHtml(rowObj.productName)}" required autocomplete="off">
        <div class="autosuggest-dropdown prod-autosuggest-dropdown"></div>
      </div>

      <!-- Quantity & Rate Row -->
      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; margin-bottom: 10px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Quantity <span class="required-star">*</span></label>
          <input type="number" class="form-input prod-qty-input" placeholder="Qty" min="0.01" step="any" value="${rowObj.quantity}" required>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Rate (₹) <span class="required-star">*</span></label>
          <input type="number" class="form-input prod-rate-input" placeholder="Rate ₹" min="0.01" step="any" value="${rowObj.rate || ''}" required>
        </div>
      </div>

      <!-- Unit Selector -->
      <div class="form-group" style="margin-bottom: 10px;">
        <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">Unit of Measurement</label>
        <div class="unit-toggle-row">
          <button type="button" class="unit-btn ${rowObj.unit === 'per_kg' ? 'active' : ''}" data-unit="per_kg">Per Kg</button>
          <button type="button" class="unit-btn ${rowObj.unit === 'per_piece' ? 'active' : ''}" data-unit="per_piece">Per Piece</button>
          <button type="button" class="unit-btn ${rowObj.unit === 'per_bag' ? 'active' : ''}" data-unit="per_bag">Per Bag</button>
        </div>
      </div>

      <!-- Line Total Output -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 0.85rem;">
        <span style="color: var(--text-secondary); font-weight: 600;">Line Total:</span>
        <span class="prod-line-total-display" style="font-weight: 800; color: var(--purple-dark); font-size: 0.95rem;">₹ 0.00</span>
      </div>
    `;
  }

  function attachRowListeners(card, rowObj) {
    const nameInput = card.querySelector('.prod-name-input');
    const dropdown = card.querySelector('.prod-autosuggest-dropdown');
    const qtyInput = card.querySelector('.prod-qty-input');
    const rateInput = card.querySelector('.prod-rate-input');
    const unitBtns = card.querySelectorAll('.unit-btn');
    const removeBtn = card.querySelector('.btn-remove-row');

    // Autocomplete & Free typing
    if (nameInput && dropdown) {
      function showProductSuggestions() {
        const query = nameInput.value.trim().toLowerCase();
        let matches = query.length === 0
          ? allProducts.slice(0, 8)
          : allProducts.filter(p => p.name.toLowerCase().includes(query) || (p.type && p.type.toLowerCase().includes(query)));

        let html = '';
        matches.forEach(p => {
          const unitLabel = p.default_unit === 'per_kg' ? 'Kg' : (p.default_unit === 'per_bag' ? 'Bag' : 'Piece');
          html += `
            <div class="suggest-item prod-suggest-item" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-rate="${p.default_rate}" data-unit="${p.default_unit}">
              <div class="suggest-firm-name">${escapeHtml(p.name)} <span style="font-size:0.75rem; color:var(--text-secondary);">(${escapeHtml(p.type || 'Standard')})</span></div>
              <div class="suggest-firm-meta">Rate: ₹${Number(p.default_rate || 0).toLocaleString('en-IN')} / ${unitLabel}</div>
            </div>
          `;
        });

        if (query.length > 0) {
          const exact = allProducts.some(p => p.name.toLowerCase() === query);
          if (!exact) {
            html += `
              <div class="suggest-item add-new-prod-opt" style="color: var(--purple-primary); font-weight: 700; background: var(--purple-tint);">
                + Use "${escapeHtml(nameInput.value.trim())}" (Auto-creates in Product Master)
              </div>
            `;
          }
        }

        dropdown.innerHTML = html;
        dropdown.classList.add('active');

        dropdown.querySelectorAll('.prod-suggest-item').forEach(item => {
          item.addEventListener('click', () => {
            const pName = item.getAttribute('data-name');
            const pRate = parseFloat(item.getAttribute('data-rate')) || 0;
            const pUnit = item.getAttribute('data-unit') || 'per_kg';

            nameInput.value = pName;
            rowObj.productName = pName;
            rowObj.unit = pUnit;
            if (pRate > 0) {
              rateInput.value = pRate;
              rowObj.rate = pRate;
            }
            updateRowUnitUI(card, pUnit);
            dropdown.classList.remove('active');
            recalculateRowTotal(rowObj.id);
          });
        });

        const addNewOpt = dropdown.querySelector('.add-new-prod-opt');
        if (addNewOpt) {
          addNewOpt.addEventListener('click', () => {
            rowObj.productName = nameInput.value.trim();
            dropdown.classList.remove('active');
            recalculateRowTotal(rowObj.id);
          });
        }
      }

      nameInput.addEventListener('focus', showProductSuggestions);
      nameInput.addEventListener('input', () => {
        rowObj.productName = nameInput.value.trim();
        showProductSuggestions();
        recalculateRowTotal(rowObj.id);
      });

      document.addEventListener('click', (e) => {
        if (!nameInput.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });
    }

    if (qtyInput) {
      qtyInput.addEventListener('input', () => {
        rowObj.quantity = parseFloat(qtyInput.value) || 0;
        recalculateRowTotal(rowObj.id);
      });
    }

    if (rateInput) {
      rateInput.addEventListener('input', () => {
        rowObj.rate = parseFloat(rateInput.value) || 0;
        recalculateRowTotal(rowObj.id);
      });
    }

    unitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.getAttribute('data-unit');
        rowObj.unit = u;
        updateRowUnitUI(card, u);
      });
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        removeProductRow(rowObj.id);
      });
    }
  }

  function updateRowUnitUI(card, unit) {
    card.querySelectorAll('.unit-btn').forEach(b => {
      if (b.getAttribute('data-unit') === unit) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  function removeProductRow(rowId) {
    if (productRows.length <= 1) return;
    productRows = productRows.filter(r => r.id !== rowId);
    const el = document.getElementById(`prod-row-${rowId}`);
    if (el) el.remove();
    updateRowHeaders();
    recalculateGrandTotal();
  }

  function updateRowHeaders() {
    const container = document.getElementById('product-rows-container');
    if (!container) return;
    const cards = container.querySelectorAll('.product-row-card');
    cards.forEach((card, idx) => {
      const numSpan = card.querySelector('.row-num-text');
      if (numSpan) numSpan.textContent = idx + 1;

      const removeBtn = card.querySelector('.btn-remove-row');
      if (removeBtn) {
        removeBtn.style.display = cards.length > 1 ? 'inline-flex' : 'none';
      }
    });
  }

  function recalculateRowTotal(rowId) {
    const row = productRows.find(r => r.id === rowId);
    if (!row) return;

    row.lineTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.rate) || 0);

    const card = document.getElementById(`prod-row-${rowId}`);
    if (card) {
      const lineTotalEl = card.querySelector('.prod-line-total-display');
      if (lineTotalEl) {
        lineTotalEl.textContent = '₹ ' + row.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }

    recalculateGrandTotal();
  }

  function recalculateGrandTotal() {
    const grandTotal = productRows.reduce((acc, r) => acc + (parseFloat(r.lineTotal) || 0), 0);
    const grandTotalDisplay = document.getElementById('calculated_total_display');
    if (grandTotalDisplay) {
      grandTotalDisplay.textContent = '₹ ' + grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const cashPaidDisplay = document.getElementById('cash-paid-display');
    if (cashPaidDisplay) {
      cashPaidDisplay.textContent = '₹ ' + grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  // 3. PAYMENT MODE TABS
  function setupPaymentModeTabs() {
    const tabs = document.querySelectorAll('.payment-mode-tab');
    const cashSection = document.getElementById('payment-cash-section');
    const upiSection = document.getElementById('payment-upi-section');
    const bankSection = document.getElementById('payment-bank-section');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        selectedPaymentMode = tab.getAttribute('data-mode');

        if (cashSection) cashSection.style.display = selectedPaymentMode === 'cash' ? 'block' : 'none';
        if (upiSection) upiSection.style.display = selectedPaymentMode === 'upi' ? 'block' : 'none';
        if (bankSection) bankSection.style.display = selectedPaymentMode === 'bank_transfer' ? 'block' : 'none';
      });
    });
  }

  // 4. MULTI-IMAGE UPLOADER
  function setupImageUploader() {
    const fileInput = document.getElementById('multi_image_file_input');
    const dropArea = document.getElementById('multi_upload_drop_area');
    const previewGrid = document.getElementById('image_preview_grid');

    if (!fileInput || !dropArea || !previewGrid) return;

    dropArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          uploadedImages.push(loadEvt.target.result);
          renderImagePreviews();
        };
        reader.readAsDataURL(file);
      });
      fileInput.value = '';
    });
  }

  function renderImagePreviews() {
    const previewGrid = document.getElementById('image_preview_grid');
    if (!previewGrid) return;

    previewGrid.innerHTML = '';
    uploadedImages.forEach((imgData, index) => {
      const box = document.createElement('div');
      box.className = 'preview-thumbnail-box';
      box.innerHTML = `
        <img src="${imgData}" alt="Uploaded proof ${index + 1}">
        <button type="button" class="remove-thumb-btn" data-index="${index}" title="Remove image">&times;</button>
      `;
      previewGrid.appendChild(box);
    });

    previewGrid.querySelectorAll('.remove-thumb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'));
        uploadedImages.splice(idx, 1);
        renderImagePreviews();
      });
    });
  }

  // 5. FORM SUBMISSION & AD-HOC PRODUCT AUTO-CREATION
  function setupFormSubmission() {
    const form = document.getElementById('sina-procurement-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const rep = window.sinaAuth.getCurrentUser();
      const firmName = document.getElementById('firm_name')?.value.trim();
      const contactPerson = document.getElementById('contact_person')?.value.trim();
      const mobile = document.getElementById('mobile')?.value.trim();
      const address = document.getElementById('address')?.value.trim();

      if (!firmName) {
        alert('Please enter or select a Firm Name.');
        return;
      }
      if (!contactPerson) {
        alert('Contact Person Name is compulsory.');
        return;
      }
      if (!mobile || mobile.length < 10) {
        alert('Please enter a valid 10-digit Mobile Number.');
        return;
      }
      if (!address) {
        alert('Shop / Mandi Address is compulsory.');
        return;
      }

      // Validate Product Rows
      if (productRows.length === 0) {
        alert('Please add at least one product.');
        return;
      }

      for (let i = 0; i < productRows.length; i++) {
        const row = productRows[i];
        if (!row.productName || !row.productName.trim()) {
          alert(`Please specify the product name for Item #${i + 1}.`);
          return;
        }
        if (row.quantity <= 0) {
          alert(`Please enter a valid quantity for Item #${i + 1}.`);
          return;
        }
        if (row.rate <= 0) {
          alert(`Please enter a valid rate for Item #${i + 1}.`);
          return;
        }
      }

      // Payment Mode Validation
      let upiId = null;
      if (selectedPaymentMode === 'upi') {
        upiId = document.getElementById('upi_id_input')?.value.trim();
        if (!upiId) {
          alert('Please enter the Firm UPI ID / Mobile for Admin payment execution.');
          return;
        }
      }

      const submitBtn = document.getElementById('save-entry-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Saving Entry...';
      }

      try {
        // Check for ad-hoc products typed by user; auto-add to Supabase master if new!
        for (const row of productRows) {
          const trimmedName = row.productName.trim();
          const exists = allProducts.some(p => p.name.toLowerCase() === trimmedName.toLowerCase());
          if (!exists) {
            try {
              const newProd = await window.sinaDB.createProduct({
                name: trimmedName,
                type: 'Field Added',
                default_unit: row.unit,
                default_rate: row.rate
              });
              allProducts.push(newProd);
            } catch (prodErr) {
              console.warn('Could not auto-add product to master:', prodErr);
            }
          }
        }

        const grandTotal = productRows.reduce((acc, r) => acc + (parseFloat(r.lineTotal) || 0), 0);

        const itemsPayload = productRows.map(r => ({
          product_name: r.productName.trim(),
          category_name: r.categoryName || 'General',
          unit: r.unit,
          quantity: parseFloat(r.quantity) || 0,
          rate: parseFloat(r.rate) || 0,
          line_total: parseFloat(r.lineTotal) || 0
        }));

        await window.sinaDB.saveProcurementEntry({
          representative_id: rep.id,
          rep_name: rep.name,
          firm_name: firmName,
          contact_person: contactPerson,
          mobile,
          address,
          total_amount: grandTotal,
          payment_mode: selectedPaymentMode,
          upi_id: upiId,
          images: uploadedImages,
          items: itemsPayload
        });

        alert(selectedPaymentMode === 'upi'
          ? `Entry saved! UPI payment request of ₹${grandTotal.toLocaleString('en-IN')} sent to Admin for PhonePe approval.`
          : `Purchase entry of ₹${grandTotal.toLocaleString('en-IN')} saved successfully!`);

        window.location.href = 'records.html';
      } catch (err) {
        console.error(err);
        alert('Error saving entry: ' + err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Save Purchase Entry';
        }
      }
    });
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
