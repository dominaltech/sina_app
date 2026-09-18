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
            <a href="entry.html?product_id=${prod.id}" class="btn-use-entry">
              Use in Entry &rarr;
            </a>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
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
