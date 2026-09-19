// SINA App - Commodities & Products Catalog Controller
(function() {
  let allCategories = [];
  let allProducts = [];
  let selectedCategoryId = '';
  let searchQuery = '';

  document.addEventListener('DOMContentLoaded', async () => {
    const user = window.sinaAuth.requireAuth();
    if (!user) return;

    await loadCatalogData();
    setupFilters();
    setupAddProductModal();
    setupEditProductModal();
    setupInlineAddProduct();
  });

  // Global refresh hook for real-time updates
  window.refreshCurrentPageData = async function() {
    await loadCatalogData();
  };

  async function loadCatalogData() {
    allCategories = await window.sinaDB.getCategories();
    allProducts = await window.sinaDB.getProducts();

    renderCategoryPills();
    renderProductsList();
    populateModalCategories();
  }

  function renderCategoryPills() {
    const container = document.getElementById('category-pills-container');
    if (!container) return;

    let html = `<button type="button" class="cat-pill ${selectedCategoryId === '' ? 'active' : ''}" data-category-id="">All Items (${allProducts.length})</button>`;

    allCategories.forEach(cat => {
      const count = allProducts.filter(p => p.category_id === cat.id).length;
      html += `
        <button type="button" class="cat-pill ${selectedCategoryId === cat.id ? 'active' : ''}" data-category-id="${cat.id}">
          ${escapeHtml(cat.name)} (${count})
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        selectedCategoryId = pill.getAttribute('data-category-id') || '';
        container.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderProductsList();
      });
    });
  }

  function renderProductsList() {
    const container = document.getElementById('products-list-container');
    if (!container) return;

    let filtered = allProducts;

    if (selectedCategoryId) {
      filtered = filtered.filter(p => p.category_id === selectedCategoryId);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.type && p.type.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 36px 16px; margin-top: 10px;">
          <div style="font-weight: 700; color: var(--text-primary); font-size: 1rem; margin-bottom: 6px;">No commodities found</div>
          <div class="text-muted" style="font-size: 0.85rem; margin-bottom: 14px;">Try searching for a different item or add a new commodity.</div>
          <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('btn-open-add-product').click()">
            + Add New Commodity
          </button>
        </div>
      `;
      return;
    }

    const icons = window.SINA_ICONS;

    let html = '';
    filtered.forEach(prod => {
      const cat = allCategories.find(c => c.id === prod.category_id);
      const unitLabel = prod.default_unit === 'per_kg' ? 'Per Kg' : (prod.default_unit === 'per_piece' ? 'Per Piece' : 'Per Bag');
      const rateNum = parseFloat(prod.default_rate || 0);

      html += `
        <div class="product-card">
          <div class="product-info-col">
            <div class="prod-main-name">${escapeHtml(prod.name)}</div>
            <div class="prod-meta-tags">
              <span class="prod-type-tag">${escapeHtml(prod.type || 'Standard')}</span>
              <span class="prod-category-tag">${escapeHtml(cat ? cat.name : 'General')}</span>
            </div>
          </div>
          <div class="product-rate-col">
            <div class="rate-amount">₹ ${rateNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="rate-unit">${unitLabel}</div>
            <div style="display: flex; gap: 6px; align-items: center; margin-top: 6px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditProductModal('${prod.id}')" style="padding: 4px 10px; font-size: 0.75rem;">
                Edit
              </button>
              <a href="entry.html?product_id=${prod.id}" class="btn-use-entry" style="margin-top: 0; padding: 4px 10px; font-size: 0.75rem;">
                Use &rarr;
              </a>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.sinaTranslate) {
      window.sinaTranslate.applyInstantTranslation(container);
    }
  }

  function setupFilters() {
    const searchInput = document.getElementById('product-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderProductsList();
      });
    }
  }

  function setupAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    const openBtn = document.getElementById('btn-open-add-product');
    const closeBtn = document.getElementById('btn-close-product-modal');
    const form = document.getElementById('add-product-form');
    const catSelect = document.getElementById('modal_prod_category');
    const newCatGroup = document.getElementById('modal_new_cat_group');
    const newCatInput = document.getElementById('modal_new_cat_name');

    if (!modal) return;

    function openModal() {
      populateModalCategories();
      if (selectedCategoryId && catSelect) {
        catSelect.value = selectedCategoryId;
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
          submitBtn.textContent = 'Saving to Catalog...';
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
                submitBtn.textContent = 'Save to Catalog';
              }
              return;
            }
            categoryId = null;
          }

          const name = document.getElementById('modal_prod_name').value.trim();
          const type = document.getElementById('modal_prod_type').value.trim() || 'Standard';
          const unit = document.getElementById('modal_prod_unit').value;
          const rate = parseFloat(document.getElementById('modal_prod_rate').value) || 0;

          await window.sinaDB.addProduct({
            category_id: categoryId,
            category_name: categoryName,
            name,
            type,
            default_unit: unit,
            default_rate: rate
          });

          await loadCatalogData();
          closeModal();
        } catch (err) {
          console.error(err);
          alert('Error adding commodity: ' + err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save to Catalog';
          }
        }
      });
    }
  }

  window.openEditProductModal = function(productId) {
    const prod = allProducts.find(p => p.id === productId);
    if (!prod) return;

    const modal = document.getElementById('edit-product-modal');
    const catSelect = document.getElementById('edit_prod_category');
    if (!modal || !catSelect) return;

    let catHtml = '';
    allCategories.forEach(c => {
      const isSelected = c.id === prod.category_id;
      catHtml += `<option value="${c.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(c.name)}</option>`;
    });
    catSelect.innerHTML = catHtml;

    document.getElementById('edit_prod_id').value = prod.id;
    document.getElementById('edit_prod_name').value = prod.name;
    document.getElementById('edit_prod_type').value = prod.type || '';
    document.getElementById('edit_prod_unit').value = prod.default_unit || 'per_kg';
    document.getElementById('edit_prod_rate').value = parseFloat(prod.default_rate || 0);

    modal.classList.add('active');
  };

  function setupEditProductModal() {
    const modal = document.getElementById('edit-product-modal');
    const closeBtn = document.getElementById('btn-close-edit-prod-modal');
    const form = document.getElementById('edit-product-form');

    if (!modal) return;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving Changes...';
        }

        try {
          const productId = document.getElementById('edit_prod_id').value;
          const categoryId = document.getElementById('edit_prod_category').value;
          const name = document.getElementById('edit_prod_name').value.trim();
          const type = document.getElementById('edit_prod_type').value.trim() || 'Standard';
          const unit = document.getElementById('edit_prod_unit').value;
          const rate = parseFloat(document.getElementById('edit_prod_rate').value) || 0;

          await window.sinaDB.updateProduct(productId, {
            category_id: categoryId,
            name,
            type,
            default_unit: unit,
            default_rate: rate
          });

          modal.classList.remove('active');
          await loadCatalogData();
          alert(`Success! "${name}" has been updated.`);
        } catch (err) {
          alert('Error updating product: ' + err.message);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
          }
        }
      });
    }
  }

  function setupInlineAddProduct() {
    const toggleHeader = document.getElementById('toggle-inline-add-prod');
    const toggleBtn = document.getElementById('btn-toggle-add-inline');
    const form = document.getElementById('inline-add-product-form');
    const cancelBtn = document.getElementById('btn-cancel-inline-add');

    if (!form) return;

    function toggleForm() {
      const isHidden = form.style.display === 'none' || !form.style.display;
      form.style.display = isHidden ? 'block' : 'none';
      if (toggleBtn) {
        toggleBtn.textContent = isHidden ? 'Close Form' : 'Open Form';
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleForm();
      });
    }

    if (toggleHeader) {
      toggleHeader.addEventListener('click', () => {
        toggleForm();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        form.reset();
        form.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = 'Open Form';
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }

      try {
        const catName = document.getElementById('inline_prod_category').value.trim();
        const prodName = document.getElementById('inline_prod_name').value.trim();
        const prodType = document.getElementById('inline_prod_type').value.trim() || 'Standard';
        const prodUnit = document.getElementById('inline_prod_unit').value;
        const prodRate = parseFloat(document.getElementById('inline_prod_rate').value) || 0;

        await window.sinaDB.addProduct({
          category_name: catName,
          name: prodName,
          type: prodType,
          default_unit: prodUnit,
          default_rate: prodRate
        });

        form.reset();
        form.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = 'Open Form';

        await loadCatalogData();
        alert(`Success! "${prodName}" has been added to catalog.`);
      } catch (err) {
        alert('Error adding product: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save to Catalog';
        }
      }
    });
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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
