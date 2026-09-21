// SINA App - Field Expenses Controller
(function() {
  let uploadedReceiptBase64 = null;
  let isReceiptMandatory = false;
  let todayExpenses = [];

  const CATEGORY_NAMES = {
    fuel: 'Petrol / Diesel / Fuel',
    vehicle_repair: 'Vehicle Repair & Puncture',
    bus: 'Bus & Public Transport',
    travel: 'Auto, Toll & Parking',
    food: 'Food & Refreshment',
    toll_market: 'Mandi / Market Fees',
    misc: 'Miscellaneous / Other'
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const rep = window.sinaAuth.requireAuth();
    if (!rep) return;

    await checkReceiptPolicy();
    setupReceiptUploader();
    setupExpenseForm();
    await loadExpenses();
  });

  window.refreshCurrentPageData = async function() {
    await checkReceiptPolicy();
    await loadExpenses();
  };

  async function checkReceiptPolicy() {
    try {
      isReceiptMandatory = await window.sinaDB.isExpenseReceiptRequired();
      const policyNotice = document.getElementById('receipt-policy-notice');
      const policyText = document.getElementById('receipt-policy-text');
      const star = document.getElementById('receipt-required-star');

      if (isReceiptMandatory) {
        if (policyNotice) {
          policyNotice.style.background = '#FEF3C7';
          policyNotice.style.borderColor = '#F59E0B';
          policyNotice.style.color = '#B45309';
        }
        if (policyText) policyText.textContent = 'Admin Policy: Receipt Photo is Compulsory for all field expenses';
        if (star) star.style.display = 'inline';
      } else {
        if (policyNotice) {
          policyNotice.style.background = 'var(--purple-tint)';
          policyNotice.style.borderColor = 'var(--purple-border)';
          policyNotice.style.color = 'var(--purple-primary)';
        }
        if (policyText) policyText.textContent = 'Receipt Photo is Optional (Upload if available)';
        if (star) star.style.display = 'none';
      }
    } catch (err) {
      console.warn('Could not check receipt policy:', err);
    }
  }

  function setupReceiptUploader() {
    const fileInput = document.getElementById('expense_receipt_file');
    const dropBox = document.getElementById('receipt-drop-box');
    const previewContainer = document.getElementById('receipt-preview-container');
    const previewImg = document.getElementById('receipt-preview-img');
    const removeBtn = document.getElementById('btn-remove-receipt');

    if (!fileInput || !dropBox) return;

    dropBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        uploadedReceiptBase64 = evt.target.result;
        if (previewImg) previewImg.src = uploadedReceiptBase64;
        if (previewContainer) previewContainer.style.display = 'inline-block';
        dropBox.style.display = 'none';
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        uploadedReceiptBase64 = null;
        if (previewContainer) previewContainer.style.display = 'none';
        dropBox.style.display = 'block';
      });
    }
  }

  function setupExpenseForm() {
    const form = document.getElementById('field-expense-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rep = window.sinaAuth.getCurrentUser();
      const amount = parseFloat(document.getElementById('expense_amount')?.value) || 0;
      const category = document.getElementById('expense_category')?.value || 'fuel';
      const notes = document.getElementById('expense_notes')?.value.trim() || '';

      if (amount <= 0) {
        alert('Please enter a valid expense amount.');
        return;
      }

      // Mandatory receipt validation check
      if (isReceiptMandatory && !uploadedReceiptBase64) {
        alert('Admin policy requires a receipt or bill photo before saving this expense. Please snap or upload the receipt photo.');
        return;
      }

      const submitBtn = document.getElementById('btn-save-expense');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Saving Expense...';
      }

      try {
        await window.sinaDB.saveExpense({
          representative_id: rep.id,
          rep_name: rep.name,
          amount,
          category,
          notes,
          receipt_url: uploadedReceiptBase64
        });

        alert(`Expense of ₹${amount.toLocaleString('en-IN')} saved successfully!`);

        form.reset();
        uploadedReceiptBase64 = null;
        const previewContainer = document.getElementById('receipt-preview-container');
        const dropBox = document.getElementById('receipt-drop-box');
        if (previewContainer) previewContainer.style.display = 'none';
        if (dropBox) dropBox.style.display = 'block';

        await loadExpenses();
      } catch (err) {
        console.error(err);
        alert('Error saving expense: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Save Expense';
        }
      }
    });
  }

  async function loadExpenses() {
    const rep = window.sinaAuth.getCurrentUser();
    if (!rep) return;

    const allExp = await window.sinaDB.getExpenses(rep.id);
    const todayStr = new Date().toISOString().split('T')[0];
    todayExpenses = allExp.filter(e => (e.created_at && e.created_at.startsWith(todayStr)) || (e.date && e.date === todayStr));

    const totalToday = todayExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalDisplay = document.getElementById('today-total-expenses-display');
    if (totalDisplay) {
      totalDisplay.textContent = '₹' + totalToday.toLocaleString('en-IN');
    }

    renderExpensesList();
  }

  function renderExpensesList() {
    const container = document.getElementById('expenses-list-container');
    if (!container) return;

    if (todayExpenses.length === 0) {
      container.innerHTML = `
        <div class="card text-center text-muted" style="padding: 24px;">
          No expenses recorded yet today.
        </div>
      `;
      return;
    }

    let html = '';
    todayExpenses.forEach(exp => {
      const timeStr = exp.created_at ? new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const catLabel = CATEGORY_NAMES[exp.category] || exp.category.toUpperCase();
      const hasReceipt = exp.receipt_url && exp.receipt_url.length > 10;

      html += `
        <div class="expense-history-card">
          <div>
            <span class="expense-cat-badge">${escapeHtml(catLabel)}</span>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
              ${escapeHtml(exp.notes || catLabel)}
            </div>
            <div class="text-muted" style="font-size: 0.75rem; margin-top: 2px;">
              ${timeStr}
            </div>
          </div>
          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
            <span style="font-size: 1.1rem; font-weight: 800; color: var(--danger-color);">₹${parseFloat(exp.amount || 0).toLocaleString('en-IN')}</span>
            ${hasReceipt ? `
              <button type="button" class="btn btn-outline-purple btn-sm" onclick="openReceiptViewer('${exp.receipt_url}')" style="padding: 3px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View Bill
              </button>
            ` : '<span style="font-size: 0.72rem; color: var(--text-muted);">No Bill Photo</span>'}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  window.openReceiptViewer = function(imgUrl) {
    const modal = document.getElementById('receipt-modal');
    const img = document.getElementById('receipt-full-img');
    if (modal && img) {
      img.src = imgUrl;
      modal.classList.add('active');
    }
  };

  window.closeReceiptViewer = function() {
    const modal = document.getElementById('receipt-modal');
    if (modal) modal.classList.remove('active');
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
