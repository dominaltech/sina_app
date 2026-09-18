// SINA App - Representative Dashboard Controller
(function() {
  document.addEventListener('DOMContentLoaded', async () => {
    const rep = window.sinaAuth.requireAuth();
    if (!rep) return;

    // Set greeting and rep details
    const repNameEl = document.getElementById('dash-rep-name');
    const repRouteEl = document.getElementById('dash-rep-route');
    const todayDateEl = document.getElementById('dash-today-date');

    if (repNameEl) repNameEl.textContent = rep.name;
    if (repRouteEl) repRouteEl.textContent = rep.assigned_route || 'All Market Routes';
    if (todayDateEl) {
      const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      todayDateEl.textContent = new Date().toLocaleDateString('en-IN', options);
    }

    await loadDashboardStats();
    setupExpenseModal();
  });

  window.refreshCurrentPageData = async function() {
    await loadDashboardStats();
  };

  async function loadDashboardStats() {
    const rep = window.sinaAuth.getCurrentUser();
    if (!rep) return;

    const summary = await window.sinaDB.getRepTodaySummary(rep.id);

    // Update KPI cards
    const visitsCountEl = document.getElementById('kpi-visits-count');
    const totalProcurementEl = document.getElementById('kpi-total-procurement');
    const cashInHandEl = document.getElementById('kpi-cash-in-hand');
    const floatAmountEl = document.getElementById('float-initial-amount');
    const cashCollectedEl = document.getElementById('float-cash-collected');
    const totalExpensesEl = document.getElementById('float-total-expenses');

    if (visitsCountEl) visitsCountEl.textContent = summary.visitsCount;
    if (totalProcurementEl) totalProcurementEl.textContent = '₹' + summary.totalProcurementAmount.toLocaleString('en-IN');
    if (cashInHandEl) cashInHandEl.textContent = '₹' + summary.cashInHand.toLocaleString('en-IN');
    const cashInHand2El = document.getElementById('kpi-cash-in-hand-2');
    if (cashInHand2El) cashInHand2El.textContent = '₹' + summary.cashInHand.toLocaleString('en-IN');

    if (floatAmountEl) floatAmountEl.textContent = '₹' + summary.float.toLocaleString('en-IN');
    if (cashCollectedEl) cashCollectedEl.textContent = '+ ₹' + summary.cashCollected.toLocaleString('en-IN');
    if (totalExpensesEl) totalExpensesEl.textContent = '- ₹' + summary.totalExpenses.toLocaleString('en-IN');

    renderRecentVisits(summary.todayEntries);
  }

  function renderRecentVisits(entries) {
    const listEl = document.getElementById('recent-visits-list');
    if (!listEl) return;

    if (!entries || entries.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state-card text-center">
          <p class="text-muted">No visits recorded yet today.</p>
          <a href="entry.html" class="btn btn-primary" style="margin-top: 12px;">+ Start First Visit</a>
        </div>
      `;
      return;
    }

    let html = '';
    entries.slice(0, 5).forEach(entry => {
      const modeLabel = entry.payment_mode === 'cash' ? 'Cash' : (entry.payment_mode === 'upi' ? 'UPI' : 'Bank Transfer');
      const timeStr = new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="card visit-card">
          <div class="visit-top-row">
            <div>
              <h4 class="visit-firm-name">${escapeHtml(entry.firm_name)}</h4>
              <span class="visit-time text-muted">${timeStr} &bull; ${escapeHtml(entry.type || 'Goods')}</span>
            </div>
            <div class="visit-amount-box">
              <span class="visit-amount">₹${entry.total_amount.toLocaleString('en-IN')}</span>
              <span class="badge ${entry.payment_mode === 'cash' ? 'badge-success' : 'badge-purple'}">${modeLabel}</span>
            </div>
          </div>
          <div class="visit-bottom-row">
            <span class="visit-contact">👤 ${escapeHtml(entry.contact_person)} (${escapeHtml(entry.mobile)})</span>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
  }

  // EXPENSE MODAL CONTROLLER
  function setupExpenseModal() {
    const openBtn = document.getElementById('btn-open-expense-modal');
    const modal = document.getElementById('expense-modal');
    const closeBtn = document.getElementById('btn-close-expense-modal');
    const form = document.getElementById('expense-form');

    if (!openBtn || !modal) return;

    openBtn.addEventListener('click', () => modal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rep = window.sinaAuth.getCurrentUser();
        const amount = parseFloat(document.getElementById('expense_amount')?.value) || 0;
        const category = document.getElementById('expense_category')?.value || 'fuel';
        const notes = document.getElementById('expense_notes')?.value.trim();

        if (amount <= 0) {
          alert('Please enter a valid expense amount.');
          return;
        }

        await window.sinaDB.saveExpense({
          representative_id: rep.id,
          rep_name: rep.name,
          amount,
          category,
          notes
        });

        alert(`Expense of ₹${amount} logged successfully.`);
        modal.classList.remove('active');
        form.reset();
        await loadDashboardStats();
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
