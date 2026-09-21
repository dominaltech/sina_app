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
    const expensesCountEl = document.getElementById('kpi-expenses-count');
    const cashInHandEl = document.getElementById('kpi-cash-in-hand');
    const floatAmountEl = document.getElementById('float-initial-amount');
    const cashSpentEl = document.getElementById('float-cash-spent');
    const totalExpensesEl = document.getElementById('float-total-expenses');

    if (visitsCountEl) visitsCountEl.textContent = summary.visitsCount;
    if (totalProcurementEl) totalProcurementEl.textContent = '₹' + summary.totalProcurementAmount.toLocaleString('en-IN');
    if (expensesCountEl) expensesCountEl.textContent = '₹' + summary.totalExpenses.toLocaleString('en-IN');
    if (cashInHandEl) cashInHandEl.textContent = '₹' + summary.cashInHand.toLocaleString('en-IN');
    const cashInHand2El = document.getElementById('kpi-cash-in-hand-2');
    if (cashInHand2El) cashInHand2El.textContent = '₹' + summary.cashInHand.toLocaleString('en-IN');

    if (floatAmountEl) floatAmountEl.textContent = '₹' + summary.float.toLocaleString('en-IN');
    if (cashSpentEl) cashSpentEl.textContent = '- ₹' + summary.cashSpent.toLocaleString('en-IN');
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
            <span class="visit-contact" style="display: flex; align-items: center; gap: 4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${escapeHtml(entry.contact_person)} (${escapeHtml(entry.mobile)})
            </span>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;
    if (window.sinaTranslate) {
      window.sinaTranslate.applyInstantTranslation(listEl);
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
