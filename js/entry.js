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

    populateCategories();
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product_id');
    if (!productId) return;

    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    const catSelect = document.getElementById('category_select');
    if (catSelect && prod.category_id) {
      catSelect.value = prod.category_id;
      populateProducts(prod.category_id);
      const prodSelect = document.getElementById('product_select');
      if (prodSelect) {
        prodSelect.value = prod.id;
      }
      const rateInput = document.getElementById('rate');
      if (rateInput && prod.default_rate) {
        rateInput.value = prod.default_rate;
      }
      if (prod.default_unit) {
        setUnit(prod.default_unit);
      }
      recalculateTotal();
    }
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
        f.firm_name.toLowerCase().includes(query) || 
        (f.contact_person && f.contact_person.toLowerCase().includes(query))
      );

      let html = '';

      // Matched existing firms
      matches.forEach(firm => {
        html += `
          <div class="suggest-item" data-firm-id="${firm.id}">
            <div class="suggest-firm-name">${escapeHtml(firm.firm_name)}</div>
            <div class="suggest-firm-meta">
              <span>👤 ${escapeHtml(firm.contact_person || '')}</span>
              <span>📞 ${escapeHtml(firm.mobile || '')}</span>
            </div>
          </div>
        `;
      });

      // Option to add new firm
      const exactMatch = allFirms.some(f => f.firm_name.toLowerCase() === query);
      if (!exactMatch) {
        html += `
          <div class="add-new-firm-item" id="btn-add-new-firm">
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

  // CATEGORIES & PRODUCTS
  function populateCategories() {
    const catSelect = document.getElementById('category_select');
    if (!catSelect) return;

    catSelect.innerHTML = '<option value="">-- Select Category --</option>';
    allCategories.forEach(cat => {
      catSelect.innerHTML += `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
    });

    catSelect.addEventListener('change', () => {
      populateProducts(catSelect.value);
    });
  }

  function populateProducts(categoryId) {
    const prodSelect = document.getElementById('product_select');
    if (!prodSelect) return;

    const filtered = categoryId ? allProducts.filter(p => p.category_id === categoryId) : allProducts;
    prodSelect.innerHTML = '<option value="">-- Select Product / Type --</option>';
    filtered.forEach(p => {
      prodSelect.innerHTML += `<option value="${p.id}" data-unit="${p.default_unit}" data-rate="${p.default_rate}">${escapeHtml(p.name)} (${escapeHtml(p.type || 'Standard')})</option>`;
    });
    prodSelect.innerHTML += `<option value="__quick_add__" style="color: var(--purple-primary); font-weight: 700;">+ Add New Product / Commodity...</option>`;

    prodSelect.addEventListener('change', () => {
      const selected = prodSelect.options[prodSelect.selectedIndex];
      if (selected && selected.value === '__quick_add__') {
        const modal = document.getElementById('add-product-modal');
        if (modal) {
          populateModalCategories();
          const currentCatVal = document.getElementById('category_select')?.value;
          const catSelect = document.getElementById('modal_prod_category');
          if (currentCatVal && catSelect) catSelect.value = currentCatVal;
          modal.classList.add('active');
        }
        prodSelect.value = '';
        return;
      }

      if (selected && selected.value) {
        const rate = selected.getAttribute('data-rate');
        const unit = selected.getAttribute('data-unit');
        const rateInput = document.getElementById('rate');
        if (rateInput && rate) rateInput.value = rate;

        if (unit) {
          setUnit(unit);
        }
        recalculateTotal();
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
      const currentCatVal = document.getElementById('category_select')?.value;
      if (currentCatVal && catSelect) {
        catSelect.value = currentCatVal;
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

          // Refresh main select elements
          populateCategories();
          const mainCatSelect = document.getElementById('category_select');
          if (mainCatSelect) {
            mainCatSelect.value = newProd.category_id;
            populateProducts(newProd.category_id);
            const mainProdSelect = document.getElementById('product_select');
            if (mainProdSelect) {
              mainProdSelect.value = newProd.id;
            }
          }

          // Fill rate and unit in form
          const rateInput = document.getElementById('rate');
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

      const catSelect = document.getElementById('category_select');
      const categoryName = catSelect ? catSelect.options[catSelect.selectedIndex]?.text : '';

      const prodSelect = document.getElementById('product_select');
      const productName = prodSelect ? prodSelect.options[prodSelect.selectedIndex]?.text : '';

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
      const isExisting = firmInput.getAttribute('data-selected-firm-id');
      if (!isExisting) {
        await window.sinaDB.addFirm({
          firm_name: firmName,
          contact_person: contactPerson,
          mobile: mobile,
          address: address
        });
        allFirms = await window.sinaDB.getFirms();
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
        alert(`Success! Entry for ${firmName} saved.\nTotal Amount: ₹${totalAmount.toLocaleString('en-IN')}\nPayment Mode: ${selectedPaymentMode.toUpperCase()}`);

        // Redirect to records
        window.location.href = 'records.html';
      } catch (err) {
        alert('Error saving entry: ' + err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Save Procurement Entry';
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
