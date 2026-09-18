// SINA App - Procurement Form Controller (Matching Sketch & Voice Notes)
(function() {
  let allFirms = [];
  let allCategories = [];
  let allProducts = [];
  let selectedUnit = 'per_kg';
  let selectedPaymentMode = 'cash';
  let uploadedImages = []; // Array of base64 image strings

  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Auth
    const rep = window.sinaAuth.requireAuth();
    if (!rep) return;

    // Display rep name if element exists
    const repBadge = document.getElementById('form-rep-name');
    if (repBadge) repBadge.textContent = rep.name;

    // 2. Load Data
    await loadInitialData();

    // 3. Setup Event Listeners
    setupFirmAutoSuggest();
    setupCategoryAutoSuggest();
    setupProductAutoSuggest();
    setupProductCalculations();
    setupPaymentModeTabs();
    setupImageUploader();
    setupFormSubmission();
    setupQuickAddProduct();
    checkUrlParams();
  });

  async function loadInitialData() {
    allFirms = await window.sinaDB.getFirms();
    allCategories = await window.sinaDB.getCategories();
    allProducts = await window.sinaDB.getProducts();
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product_id');
    if (!productId) return;

    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    const catInput = document.getElementById('category_input');
    const catHidden = document.getElementById('category_id_hidden');
    const prodInput = document.getElementById('product_input');
    const prodHidden = document.getElementById('product_id_hidden');
    const rateInput = document.getElementById('rate');

    const cat = allCategories.find(c => c.id === prod.category_id);
    if (catInput && cat) {
      catInput.value = cat.name;
      if (catHidden) catHidden.value = cat.id;
    }

    if (prodInput) {
      prodInput.value = prod.name + (prod.type && prod.type !== 'Standard' ? ` (${prod.type})` : '');
      if (prodHidden) prodHidden.value = prod.id;
    }

    if (rateInput && prod.default_rate) {
      rateInput.value = prod.default_rate;
    }
    if (prod.default_unit) {
      setUnit(prod.default_unit);
    }
    recalculateTotal();
  }

  // FIRM AUTO-SUGGEST
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

      // Matched existing firms
      matches.forEach(firm => {
        html += `
          <div class="suggest-item" data-firm-id="${firm.id}">
            <div class="suggest-firm-name">${escapeHtml(firm.firm_name)}</div>
            <div class="suggest-firm-meta">
              <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-1px;margin-right:2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${escapeHtml(firm.contact_person || '')}</span>
              <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:-1px;margin-right:2px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${escapeHtml(firm.mobile || '')}</span>
            </div>
          </div>
        `;
      });

      // Option to add new firm
      const exactMatch = allFirms.some(f => f.firm_name && f.firm_name.toLowerCase() === query);
      if (!exactMatch) {
        html += `
          <div class="add-new-firm-item" id="btn-add-new-firm" style="padding: 10px 14px; cursor: pointer; color: var(--purple-primary); font-weight: 600; font-size: 0.88rem; background: var(--purple-tint);">
            <span>+ Add "${escapeHtml(firmInput.value.trim())}" as new firm</span>
          </div>
        `;
      }

      dropdown.innerHTML = html;
      dropdown.classList.add('active');

      // Click on existing firm
      dropdown.querySelectorAll('.suggest-item').forEach(item => {
        item.addEventListener('click', () => {
          const firmId = item.getAttribute('data-firm-id');
          const firm = allFirms.find(f => f.id === firmId);
          if (firm) {
            firmInput.value = firm.firm_name;
            contactInput.value = firm.contact_person || '';
            mobileInput.value = firm.mobile || '';
            addressInput.value = firm.address || '';
            firmInput.setAttribute('data-selected-firm-id', firm.id);
          }
          dropdown.classList.remove('active');
        });
      });

      // Click on Add New Firm
      const addNewBtn = document.getElementById('btn-add-new-firm');
      if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
          dropdown.classList.remove('active');
          firmInput.removeAttribute('data-selected-firm-id');
          contactInput.focus();
        });
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!firmInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  // CATEGORY AUTO-SUGGEST
  function setupCategoryAutoSuggest() {
    const catInput = document.getElementById('category_input');
    const dropdown = document.getElementById('category-autosuggest-dropdown');
    const hiddenId = document.getElementById('category_id_hidden');

    if (!catInput || !dropdown) return;

    function renderCategoryMatches() {
      const query = catInput.value.trim().toLowerCase();
      const matches = query.length === 0 
        ? allCategories 
        : allCategories.filter(c => c.name && c.name.toLowerCase().includes(query));

      let html = '';
      matches.forEach(c => {
        html += `
          <div class="suggest-item cat-suggest-item" data-id="${c.id}" data-name="${escapeHtml(c.name)}">
            <div class="suggest-firm-name">${escapeHtml(c.name)}</div>
          </div>
        `;
      });

      if (query.length > 0) {
        const exact = allCategories.some(c => c.name && c.name.toLowerCase() === query);
        if (!exact) {
          html += `
            <div class="add-new-firm-item" id="btn-add-new-cat" style="padding: 10px 14px; cursor: pointer; color: var(--purple-primary); font-weight: 600; font-size: 0.88rem; background: var(--purple-tint);">
              <span>+ Add "${escapeHtml(catInput.value.trim())}" as new category</span>
            </div>
          `;
        }
      }

      dropdown.innerHTML = html;
      dropdown.classList.add('active');

      dropdown.querySelectorAll('.cat-suggest-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          const name = item.getAttribute('data-name');
          catInput.value = name;
          if (hiddenId) hiddenId.value = id;
          dropdown.classList.remove('active');
        });
      });

      const addBtn = document.getElementById('btn-add-new-cat');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          if (hiddenId) hiddenId.value = '';
          dropdown.classList.remove('active');
        });
      }
    }

    catInput.addEventListener('focus', renderCategoryMatches);
    catInput.addEventListener('input', () => {
      if (hiddenId) hiddenId.value = '';
      renderCategoryMatches();
    });

    document.addEventListener('click', (e) => {
      if (!catInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  // PRODUCT AUTO-SUGGEST
  function setupProductAutoSuggest() {
    const prodInput = document.getElementById('product_input');
    const dropdown = document.getElementById('product-autosuggest-dropdown');
    const hiddenId = document.getElementById('product_id_hidden');
    const catInput = document.getElementById('category_input');
    const catHidden = document.getElementById('category_id_hidden');
    const rateInput = document.getElementById('rate');

    if (!prodInput || !dropdown) return;

    function renderProductMatches() {
      const query = prodInput.value.trim().toLowerCase();
      const currentCatId = catHidden ? catHidden.value : '';
      const currentCatName = catInput ? catInput.value.trim().toLowerCase() : '';

      // Filter products: prefer matching current category if selected
      let pool = allProducts;
      if (currentCatId) {
        const catProds = allProducts.filter(p => p.category_id === currentCatId);
        if (catProds.length > 0) pool = catProds;
      } else if (currentCatName) {
        const cat = allCategories.find(c => c.name && c.name.toLowerCase() === currentCatName);
        if (cat) {
          const catProds = allProducts.filter(p => p.category_id === cat.id);
          if (catProds.length > 0) pool = catProds;
        }
      }

      const matches = query.length === 0 
        ? pool 
        : pool.filter(p => 
            (p.name && p.name.toLowerCase().includes(query)) || 
            (p.type && p.type.toLowerCase().includes(query))
          );

      let html = '';
      matches.forEach(p => {
        const unitLabel = p.default_unit === 'per_kg' ? 'Kg' : (p.default_unit === 'per_bag' ? 'Bag' : 'Piece');
        html += `
          <div class="suggest-item prod-suggest-item" data-id="${p.id}">
            <div class="suggest-firm-name">${escapeHtml(p.name)} <span style="font-size:0.8rem;color:var(--text-secondary);font-weight:normal;">(${escapeHtml(p.type || 'Standard')})</span></div>
            <div class="suggest-firm-meta">
              <span>Rate: ₹${Number(p.default_rate || 0).toLocaleString('en-IN')} / ${unitLabel}</span>
            </div>
          </div>
        `;
      });

      if (query.length > 0) {
        const exact = pool.some(p => p.name && p.name.toLowerCase() === query);
        if (!exact) {
          html += `
            <div class="add-new-firm-item" id="btn-add-new-prod-inline" style="padding: 10px 14px; cursor: pointer; color: var(--purple-primary); font-weight: 600; font-size: 0.88rem; background: var(--purple-tint);">
              <span>+ Add "${escapeHtml(prodInput.value.trim())}" as new product</span>
            </div>
          `;
        }
      }

      dropdown.innerHTML = html;
      dropdown.classList.add('active');

      dropdown.querySelectorAll('.prod-suggest-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          const p = allProducts.find(x => x.id === id);
          if (p) {
            prodInput.value = p.name;
            if (hiddenId) hiddenId.value = p.id;
            
            // Auto-fill category if needed
            if (p.category_id) {
              const cat = allCategories.find(c => c.id === p.category_id);
              if (cat && catInput) {
                catInput.value = cat.name;
                if (catHidden) catHidden.value = cat.id;
              }
            }

            // Auto-fill rate and unit
            if (rateInput && p.default_rate) {
              rateInput.value = p.default_rate;
            }
            if (p.default_unit) {
              setUnit(p.default_unit);
            }
            recalculateTotal();
          }
          dropdown.classList.remove('active');
        });
      });

      const addBtn = document.getElementById('btn-add-new-prod-inline');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          dropdown.classList.remove('active');
          const modal = document.getElementById('add-product-modal');
          if (modal) {
            populateModalCategories();
            const modalProdName = document.getElementById('modal_prod_name');
            if (modalProdName) modalProdName.value = prodInput.value.trim();
            const modalCatSelect = document.getElementById('modal_prod_category');
            if (modalCatSelect && catHidden && catHidden.value) {
              modalCatSelect.value = catHidden.value;
            }
            modal.classList.add('active');
          }
        });
      }
    }

    prodInput.addEventListener('focus', renderProductMatches);
    prodInput.addEventListener('input', () => {
      if (hiddenId) hiddenId.value = '';
      renderProductMatches();
    });

    document.addEventListener('click', (e) => {
      if (!prodInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  function setupQuickAddProduct() {
    const modal = document.getElementById('add-product-modal');
    const openBtn = document.getElementById('btn-quick-add-product');
    const closeBtn = document.getElementById('btn-close-product-modal');
    const form = document.getElementById('quick-add-product-form');
    const catSelect = document.getElementById('modal_prod_category');
    const newCatGroup = document.getElementById('modal_new_cat_group');
    const newCatInput = document.getElementById('modal_new_cat_name');

    if (!modal) return;

    function openModal() {
      populateModalCategories();
      const currentCatId = document.getElementById('category_id_hidden')?.value;
      if (currentCatId && catSelect) {
        catSelect.value = currentCatId;
      }
      modal.classList.add('active');
    }

    function closeModal() {
      modal.classList.remove('active');
      if (form) form.reset();
      if (newCatGroup) newCatGroup.style.display = 'none';
      if (newCatInput) newCatInput.required = false;
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (catSelect) {
      catSelect.addEventListener('change', () => {
        if (catSelect.value === '__new__') {
          newCatGroup.style.display = 'block';
          newCatInput.required = true;
          newCatInput.focus();
        } else {
          newCatGroup.style.display = 'none';
          newCatInput.required = false;
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Adding Product...';
        }

        try {
          const categoryVal = catSelect.value;
          let categoryId = categoryVal;
          let categoryName = null;
          if (categoryVal === '__new__') {
            categoryName = newCatInput.value.trim();
            if (!categoryName) {
              alert('Please specify a category name.');
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Product & Select';
              }
              return;
            }
            categoryId = null;
          }

          const name = document.getElementById('modal_prod_name').value.trim();
          const type = document.getElementById('modal_prod_type').value.trim() || 'Standard';
          const unit = document.getElementById('modal_prod_unit').value;
          const rate = parseFloat(document.getElementById('modal_prod_rate').value) || 0;

          const newProd = await window.sinaDB.addProduct({
            category_id: categoryId,
            category_name: categoryName,
            name,
            type,
            default_unit: unit,
            default_rate: rate
          });

          // Refresh categories and products
          allCategories = await window.sinaDB.getCategories();
          allProducts = await window.sinaDB.getProducts();

          // Fill inputs
          const catInput = document.getElementById('category_input');
          const catHidden = document.getElementById('category_id_hidden');
          const prodInput = document.getElementById('product_input');
          const prodHidden = document.getElementById('product_id_hidden');
          const rateInput = document.getElementById('rate');

          const cat = allCategories.find(c => c.id === newProd.category_id);
          if (cat && catInput) {
            catInput.value = cat.name;
            if (catHidden) catHidden.value = cat.id;
          }

          if (prodInput) {
            prodInput.value = newProd.name;
            if (prodHidden) prodHidden.value = newProd.id;
          }

          if (rateInput) rateInput.value = rate;
          setUnit(unit);
          recalculateTotal();

          closeModal();
        } catch (err) {
          console.error(err);
          alert('Error adding product: ' + err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Product & Select';
          }
        }
      });
    }
  }

  function populateModalCategories() {
    const catSelect = document.getElementById('modal_prod_category');
    if (!catSelect) return;
    let html = '<option value="">-- Choose Category --</option>';
    allCategories.forEach(c => {
      html += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });
    html += '<option value="__new__">+ Add New Category...</option>';
    catSelect.innerHTML = html;
  }

  // QUANTITY, RATE & UNIT CALCULATIONS
  function setupProductCalculations() {
    const qtyInput = document.getElementById('quantity');
    const rateInput = document.getElementById('rate');

    if (qtyInput) qtyInput.addEventListener('input', recalculateTotal);
    if (rateInput) rateInput.addEventListener('input', recalculateTotal);

    // Unit toggle buttons (Per kg, Per piece, Per bag)
    document.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const unit = btn.getAttribute('data-unit');
        setUnit(unit);
      });
    });
  }

  function setUnit(unit) {
    selectedUnit = unit;
    document.querySelectorAll('.unit-btn').forEach(b => {
      if (b.getAttribute('data-unit') === unit) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  function recalculateTotal() {
    const qty = parseFloat(document.getElementById('quantity')?.value) || 0;
    const rate = parseFloat(document.getElementById('rate')?.value) || 0;
    const total = qty * rate;

    const totalDisplay = document.getElementById('calculated_total_display');
    if (totalDisplay) {
      totalDisplay.textContent = '₹ ' + total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Also update cash amount placeholder / default if Cash mode is active
    const cashInput = document.getElementById('cash_amount_input');
    if (cashInput && selectedPaymentMode === 'cash' && (!cashInput.value || parseFloat(cashInput.value) === 0)) {
      cashInput.value = total > 0 ? total : '';
    }
  }

  // PAYMENT MODE TABS (Cash, UPI, Bank Transfer)
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

        if (selectedPaymentMode === 'cash') {
          const qty = parseFloat(document.getElementById('quantity')?.value) || 0;
          const rate = parseFloat(document.getElementById('rate')?.value) || 0;
          const total = qty * rate;
          const cashInput = document.getElementById('cash_amount_input');
          if (cashInput && !cashInput.value) cashInput.value = total;
        }
      });
    });
  }

  // MULTI-IMAGE UPLOADER (Passbook, Cheque, Receipt)
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
          const base64 = loadEvt.target.result;
          uploadedImages.push(base64);
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
        <img src="${imgData}" alt="Uploaded image ${index + 1}">
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

  // FORM SUBMISSION
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

      const categoryName = document.getElementById('category_input')?.value.trim();
      const productName = document.getElementById('product_input')?.value.trim();

      const quantity = parseFloat(document.getElementById('quantity')?.value) || 0;
      const rate = parseFloat(document.getElementById('rate')?.value) || 0;
      const totalAmount = quantity * rate;

      // VALIDATIONS (Compulsory fields specified in sketch)
      if (!firmName) {
        alert('Please enter or select a Firm Name.');
        return;
      }
      if (!contactPerson) {
        alert('Contact Person Name is compulsory (*).');
        return;
      }
      if (!mobile || mobile.length < 10) {
        alert('Please enter a valid 10-digit Mobile Number.');
        return;
      }
      if (!address) {
        alert('Address is compulsory (*).');
        return;
      }
      if (!categoryName) {
        alert('Please enter or select a Category (*).');
        return;
      }
      if (!productName) {
        alert('Please enter or select a Product / Item (*).');
        return;
      }
      if (quantity <= 0) {
        alert('Please enter a valid Quantity.');
        return;
      }
      if (rate <= 0) {
        alert('Please enter a valid Rate.');
        return;
      }

      // Check if firm is new, save to firm directory
      const firmInput = document.getElementById('firm_name');
      const isExistingFirm = firmInput.getAttribute('data-selected-firm-id');
      if (!isExistingFirm) {
        await window.sinaDB.addFirm({
          firm_name: firmName,
          contact_person: contactPerson,
          mobile: mobile,
          address: address
        });
        allFirms = await window.sinaDB.getFirms();
      }

      // Check if category or product is new, auto-persist to catalog
      let existingCat = allCategories.find(c => c.name && c.name.toLowerCase() === categoryName.toLowerCase());
      if (!existingCat) {
        existingCat = await window.sinaDB.addCategory(categoryName);
        allCategories = await window.sinaDB.getCategories();
      }

      let existingProd = allProducts.find(p => p.name && p.name.toLowerCase() === productName.toLowerCase());
      if (!existingProd) {
        await window.sinaDB.addProduct({
          category_id: existingCat ? existingCat.id : null,
          category_name: categoryName,
          name: productName,
          type: 'Standard',
          default_unit: selectedUnit,
          default_rate: rate
        });
        allProducts = await window.sinaDB.getProducts();
      }

      // PAYMENT DETAILS
      let cashAmount = 0;
      let upiId = '';
      let upiUtr = '';

      if (selectedPaymentMode === 'cash') {
        cashAmount = parseFloat(document.getElementById('cash_amount_input')?.value) || totalAmount;
      } else if (selectedPaymentMode === 'upi') {
        upiId = document.getElementById('upi_id_input')?.value.trim() || '';
        upiUtr = document.getElementById('upi_utr_input')?.value.trim() || '';
        if (!upiId && !upiUtr) {
          alert('Please enter UPI Number / UPI ID or UTR Reference.');
          return;
        }
      } else if (selectedPaymentMode === 'bank_transfer') {
        if (uploadedImages.length === 0) {
          if (!confirm('No Passbook / Cheque photos uploaded. Do you want to submit anyway?')) {
            return;
          }
        }
      }

      const entryPayload = {
        representative_id: rep ? rep.id : null,
        rep_name: rep ? rep.name : 'Rahul Sharma',
        firm_name: firmName,
        contact_person: contactPerson,
        mobile: mobile,
        address: address,
        category_name: categoryName,
        type: productName,
        quantity: quantity,
        unit: selectedUnit,
        rate: rate,
        total_amount: totalAmount,
        payment_mode: selectedPaymentMode,
        cash_amount: cashAmount,
        upi_id: upiId,
        upi_utr: upiUtr,
        images: uploadedImages
      };

      const submitBtn = document.getElementById('save-entry-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Saving Entry...';
      }

      try {
        await window.sinaDB.saveProcurementEntry(entryPayload);

        // Show Success Feedback
        alert(`Success! Purchase entry for ${firmName} saved.\nTotal Amount: ₹${totalAmount.toLocaleString('en-IN')}\nPayment Mode: ${selectedPaymentMode.toUpperCase()}`);

        // Redirect to records
        window.location.href = 'records.html';
      } catch (err) {
        alert('Error saving entry: ' + err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Save Purchase Entry';
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
