// SINA App - Data Layer & Supabase Real-Time Client with Offline Fallback
(function() {
  const SEED_DATA = {
    firms: [
      { id: 'f1', firm_name: 'Kishan Trading Co.', contact_person: 'Ramesh Kishan', mobile: '9876501234', address: 'Plot 42, APMC Mandi, Sector 19' },
      { id: 'f2', firm_name: 'Mahadev Agro Agency', contact_person: 'Mahesh Bhai', mobile: '9876502345', address: '12/A Grain Merchant Lane, Old City' },
      { id: 'f3', firm_name: 'Shree Balaji Enterprises', contact_person: 'Gopal Sharma', mobile: '9876503456', address: 'Shop 7, Main Wholesale Market' },
      { id: 'f4', firm_name: 'Om Sai Agro Foods', contact_person: 'Sunil Patil', mobile: '9876504567', address: 'Highway Bypass Mandi, Gate 2' },
      { id: 'f5', firm_name: 'Annapurna Grain Stores', contact_person: 'Dinesh Agarwal', mobile: '9876505678', address: 'Station Road, Near Central Warehouse' }
    ],
    categories: [
      { id: 'c1', name: 'Grains & Pulses' },
      { id: 'c2', name: 'Spices & Condiments' },
      { id: 'c3', name: 'Oils & Packaging' },
      { id: 'c4', name: 'Raw Agricultural Produce' }
    ],
    products: [
      { id: 'p1', category_id: 'c1', name: 'Wheat (Grade A)', type: 'Sharbati', default_unit: 'per_kg', default_rate: 38.50 },
      { id: 'p2', category_id: 'c1', name: 'Basmati Rice (50kg Bag)', type: 'Super 1121', default_unit: 'per_bag', default_rate: 3200.00 },
      { id: 'p3', category_id: 'c1', name: 'Toor Dal (Premium)', type: 'Desi Polished', default_unit: 'per_kg', default_rate: 145.00 },
      { id: 'p4', category_id: 'c2', name: 'Red Chilli Powder', type: 'Stemless Guntur', default_unit: 'per_kg', default_rate: 240.00 },
      { id: 'p5', category_id: 'c2', name: 'Turmeric Whole', type: 'Salem Finger', default_unit: 'per_kg', default_rate: 180.00 },
      { id: 'p6', category_id: 'c3', name: 'Mustard Oil Tin (15L)', type: 'Cold Pressed', default_unit: 'per_piece', default_rate: 1950.00 },
      { id: 'p7', category_id: 'c3', name: 'Jute Gunny Bags (50kg)', type: 'Standard Heavy', default_unit: 'per_piece', default_rate: 48.00 },
      { id: 'p8', category_id: 'c4', name: 'Dry Onion Bales (50kg)', type: 'Nashik Red', default_unit: 'per_bag', default_rate: 1400.00 }
    ],
    daily_floats: [
      { id: 'df1', representative_id: '22222222-2222-2222-2222-222222222222', date: new Date().toISOString().split('T')[0], float_amount: 15000.00, notes: 'Morning procurement cash float' }
    ]
  };

  class SINA_DB {
    constructor() {
      this.channel = null;
      this.initBroadcast();
      this.initStorage();
    }

    initBroadcast() {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(window.SINA_CONFIG.BROADCAST_CHANNEL);
        this.channel.onmessage = (event) => {
          if (event.data) {
            if (event.data.type === 'SYSTEM_RESET') {
              this.handleSystemReset();
            } else if (event.data.type === 'FLOAT_UPDATED') {
              this.handleFloatUpdated(event.data.payload);
            } else if (event.data.type === 'PRODUCT_ADDED') {
              this.handleProductAdded(event.data.payload);
            } else if (event.data.type === 'PRODUCT_DELETED') {
              this.handleProductDeleted(event.data.payload);
            } else if (event.data.type === 'CATEGORY_ADDED') {
              this.handleCategoryAdded(event.data.payload);
            }
          }
        };
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'sina_last_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            if (data.type === 'SYSTEM_RESET') {
              this.handleSystemReset();
            } else if (data.type === 'FLOAT_UPDATED') {
              this.handleFloatUpdated(data.payload);
            } else if (data.type === 'PRODUCT_ADDED') {
              this.handleProductAdded(data.payload);
            } else if (data.type === 'PRODUCT_DELETED') {
              this.handleProductDeleted(data.payload);
            } else if (data.type === 'CATEGORY_ADDED') {
              this.handleCategoryAdded(data.payload);
            }
          } catch (err) {}
        }
      });
    }

    handleSystemReset() {
      if (window.refreshCurrentPageData) {
        window.refreshCurrentPageData();
      } else {
        window.location.reload();
      }
    }

    handleFloatUpdated(payload) {
      if (window.refreshCurrentPageData) {
        window.refreshCurrentPageData();
      }
    }

    handleProductAdded(payload) {
      if (payload && payload.id) {
        const products = JSON.parse(localStorage.getItem('sina_products') || '[]');
        if (!products.some(p => p.id === payload.id)) {
          products.push(payload);
          localStorage.setItem('sina_products', JSON.stringify(products));
        }
      }
      if (window.refreshCurrentPageData) {
        window.refreshCurrentPageData();
      }
    }

    handleProductDeleted(payload) {
      if (payload && payload.id) {
        let products = JSON.parse(localStorage.getItem('sina_products') || '[]');
        products = products.filter(p => p.id !== payload.id);
        localStorage.setItem('sina_products', JSON.stringify(products));
      }
      if (window.refreshCurrentPageData) {
        window.refreshCurrentPageData();
      }
    }

    handleCategoryAdded(payload) {
      if (payload && payload.name) {
        const categories = JSON.parse(localStorage.getItem('sina_categories') || '[]');
        if (!categories.some(c => c.id === payload.id || c.name.toLowerCase() === payload.name.toLowerCase())) {
          categories.push(payload);
          localStorage.setItem('sina_categories', JSON.stringify(categories));
        }
      }
      if (window.refreshCurrentPageData) {
        window.refreshCurrentPageData();
      }
    }

    broadcast(type, payload) {
      if (this.channel) {
        try {
          this.channel.postMessage({ type, payload, timestamp: Date.now() });
        } catch (e) {
          console.warn('Broadcast error:', e);
        }
      }
      // Also trigger a storage event for cross-origin / cross-window fallbacks
      localStorage.setItem('sina_last_event', JSON.stringify({ type, payload, timestamp: Date.now() }));
    }

    initStorage() {
      if (!localStorage.getItem('sina_firms')) {
        localStorage.setItem('sina_firms', JSON.stringify(SEED_DATA.firms));
      }
      if (!localStorage.getItem('sina_categories')) {
        localStorage.setItem('sina_categories', JSON.stringify(SEED_DATA.categories));
      }
      if (!localStorage.getItem('sina_products')) {
        localStorage.setItem('sina_products', JSON.stringify(SEED_DATA.products));
      }
      if (!localStorage.getItem('sina_entries')) {
        localStorage.setItem('sina_entries', JSON.stringify([]));
      }
      if (!localStorage.getItem('sina_expenses')) {
        localStorage.setItem('sina_expenses', JSON.stringify([]));
      }
      if (!localStorage.getItem('sina_floats')) {
        localStorage.setItem('sina_floats', JSON.stringify(SEED_DATA.daily_floats));
      }
    }

    // Helper: Supabase Fetch
    async supabaseRequest(endpoint, options = {}) {
      try {
        const url = `${window.SINA_CONFIG.SUPABASE_URL}/rest/v1/${endpoint}`;
        const headers = {
          'apikey': window.SINA_CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${window.SINA_CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': options.prefer || 'return=representation',
          ...options.headers
        };
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
          throw new Error(`Supabase error ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        // Fallback silently to local cache if network/table error
        console.warn('Supabase fetch failed, operating in offline/local mode:', err.message);
        return null;
      }
    }

    // 1. FIRMS (Auto-suggest & Add)
    async getFirms() {
      const remote = await this.supabaseRequest('firms?select=*&order=firm_name.asc');
      if (remote && Array.isArray(remote) && remote.length > 0) {
        localStorage.setItem('sina_firms', JSON.stringify(remote));
        return remote;
      }
      return JSON.parse(localStorage.getItem('sina_firms') || '[]');
    }

    async addFirm(firmData) {
      const firms = JSON.parse(localStorage.getItem('sina_firms') || '[]');
      const newFirm = {
        id: 'firm_' + Date.now(),
        firm_name: firmData.firm_name.trim(),
        contact_person: firmData.contact_person.trim(),
        mobile: firmData.mobile.trim(),
        address: firmData.address.trim(),
        created_at: new Date().toISOString()
      };
      firms.push(newFirm);
      localStorage.setItem('sina_firms', JSON.stringify(firms));

      // Attempt Supabase insert asynchronously
      this.supabaseRequest('firms', {
        method: 'POST',
        body: JSON.stringify({
          firm_name: newFirm.firm_name,
          contact_person: newFirm.contact_person,
          mobile: newFirm.mobile,
          address: newFirm.address
        })
      });

      this.broadcast('FIRM_ADDED', newFirm);
      return newFirm;
    }

    // 2. CATEGORIES & PRODUCTS
    async getCategories() {
      const remote = await this.supabaseRequest('categories?select=*&order=name.asc');
      if (remote && Array.isArray(remote) && remote.length > 0) {
        localStorage.setItem('sina_categories', JSON.stringify(remote));
        return remote;
      }
      return JSON.parse(localStorage.getItem('sina_categories') || '[]');
    }

    async addCategory(name) {
      const clean = name.trim();
      const categories = await this.getCategories();
      const existing = categories.find(c => c.name.toLowerCase() === clean.toLowerCase());
      if (existing) return existing;

      const remote = await this.supabaseRequest('categories', {
        method: 'POST',
        body: JSON.stringify({ name: clean })
      });

      const newCat = (remote && Array.isArray(remote) && remote[0]) ? remote[0] : {
        id: 'c_' + Date.now(),
        name: clean
      };

      categories.push(newCat);
      localStorage.setItem('sina_categories', JSON.stringify(categories));

      this.broadcast('CATEGORY_ADDED', newCat);
      return newCat;
    }

    async getProducts(categoryId = null) {
      let query = 'products?select=*&is_active=eq.true&order=name.asc';
      if (categoryId) query += `&category_id=eq.${categoryId}`;
      const remote = await this.supabaseRequest(query);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        return remote;
      }
      const local = JSON.parse(localStorage.getItem('sina_products') || '[]');
      if (categoryId) {
        return local.filter(p => p.category_id === categoryId);
      }
      return local;
    }

    async addProduct(product) {
      let categoryId = product.category_id;
      if (!categoryId && product.category_name) {
        const cat = await this.addCategory(product.category_name);
        categoryId = cat.id;
      }

      const payload = {
        category_id: (categoryId && categoryId.length === 36) ? categoryId : null,
        name: product.name.trim(),
        type: product.type ? product.type.trim() : 'Standard',
        default_unit: product.default_unit || 'per_kg',
        default_rate: parseFloat(product.default_rate) || 0
      };

      const remote = await this.supabaseRequest('products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newProd = (remote && Array.isArray(remote) && remote[0]) ? remote[0] : {
        id: 'p_' + Date.now(),
        category_id: categoryId || 'c1',
        ...payload
      };

      const products = JSON.parse(localStorage.getItem('sina_products') || '[]');
      products.push(newProd);
      localStorage.setItem('sina_products', JSON.stringify(products));

      this.broadcast('PRODUCT_ADDED', newProd);
      return newProd;
    }

    normalizeEntry(row) {
      const firstItem = (row.procurement_items && row.procurement_items.length > 0) ? row.procurement_items[0] : null;
      const images = (row.payment_attachments && Array.isArray(row.payment_attachments))
        ? row.payment_attachments.map(att => att.file_url)
        : (Array.isArray(row.images) ? row.images : []);

      return {
        id: row.id,
        representative_id: row.representative_id,
        rep_name: row.rep_name || (row.profiles ? row.profiles.name : 'Rahul Sharma'),
        firm_id: row.firm_id,
        firm_name: row.firm_name,
        contact_person: row.contact_person,
        mobile: row.mobile,
        address: row.address,
        category_name: firstItem ? firstItem.category_name : (row.category_name || ''),
        type: firstItem ? (firstItem.product_name || firstItem.type) : (row.type || ''),
        quantity: firstItem ? parseFloat(firstItem.quantity) : (parseFloat(row.quantity) || 0),
        unit: firstItem ? firstItem.unit : (row.unit || 'per_kg'),
        rate: firstItem ? parseFloat(firstItem.rate) : (parseFloat(row.rate) || 0),
        total_amount: parseFloat(row.total_amount) || 0,
        payment_mode: row.payment_mode,
        cash_amount: parseFloat(row.cash_amount) || 0,
        upi_id: row.upi_id || '',
        upi_utr: row.upi_utr || '',
        images: images,
        status: row.status,
        created_at: row.created_at,
        items: row.procurement_items || []
      };
    }

    // 3. PROCUREMENT ENTRIES (Form submission matching sketch)
    async saveProcurementEntry(entry) {
      const isCash = entry.payment_mode === 'cash';
      // In Supabase schema, status IN ('pending', 'completed', 'verified', 'rejected')
      const entryStatus = isCash ? 'completed' : 'pending';

      const headerPayload = {
        representative_id: entry.representative_id || '22222222-2222-2222-2222-222222222222',
        firm_name: entry.firm_name,
        contact_person: entry.contact_person,
        mobile: entry.mobile,
        address: entry.address,
        total_amount: parseFloat(entry.total_amount) || 0,
        payment_mode: entry.payment_mode,
        cash_amount: parseFloat(entry.cash_amount) || 0,
        upi_id: entry.upi_id || null,
        upi_utr: entry.upi_utr || null,
        status: entryStatus
      };

      // 1. Post entry header to Supabase
      const remote = await this.supabaseRequest('procurement_entries', {
        method: 'POST',
        body: JSON.stringify(headerPayload)
      });

      const createdId = (remote && Array.isArray(remote) && remote[0]) ? remote[0].id : ('entry_' + Date.now());

      // 2. Post line item to procurement_items
      if (remote && Array.isArray(remote) && remote[0]) {
        await this.supabaseRequest('procurement_items', {
          method: 'POST',
          body: JSON.stringify({
            entry_id: createdId,
            category_name: entry.category_name || 'General',
            product_name: entry.type || entry.product_name || entry.category_name || 'Goods',
            unit: entry.unit || 'per_kg',
            quantity: parseFloat(entry.quantity) || 0,
            rate: parseFloat(entry.rate) || 0,
            line_total: parseFloat(entry.total_amount) || 0
          })
        });

        // 3. Post attachments to payment_attachments
        if (Array.isArray(entry.images) && entry.images.length > 0) {
          for (const imgUrl of entry.images) {
            await this.supabaseRequest('payment_attachments', {
              method: 'POST',
              body: JSON.stringify({
                entry_id: createdId,
                file_type: isCash ? 'receipt' : 'passbook',
                file_url: imgUrl,
                file_name: 'receipt_' + Date.now()
              })
            });
          }
        }

        // 4. Post alert notification for Admin
        this.supabaseRequest('notifications', {
          method: 'POST',
          body: JSON.stringify({
            representative_id: headerPayload.representative_id,
            title: 'New Procurement Entry',
            message: `${entry.rep_name || 'Representative'} logged ${entry.firm_name} (₹${headerPayload.total_amount})`,
            type: 'procurement',
            reference_id: createdId
          })
        });
      }

      // Build normalized entry object
      const newEntry = {
        id: createdId,
        representative_id: headerPayload.representative_id,
        rep_name: entry.rep_name || 'Rahul Sharma',
        firm_id: entry.firm_id || null,
        firm_name: entry.firm_name,
        contact_person: entry.contact_person,
        mobile: entry.mobile,
        address: entry.address,
        category_name: entry.category_name,
        type: entry.type,
        quantity: parseFloat(entry.quantity) || 0,
        unit: entry.unit || 'per_kg',
        rate: parseFloat(entry.rate) || 0,
        total_amount: headerPayload.total_amount,
        payment_mode: entry.payment_mode,
        cash_amount: headerPayload.cash_amount,
        upi_id: entry.upi_id || '',
        upi_utr: entry.upi_utr || '',
        images: entry.images || [],
        status: entryStatus,
        created_at: (remote && remote[0]?.created_at) ? remote[0].created_at : new Date().toISOString()
      };

      const entries = JSON.parse(localStorage.getItem('sina_entries') || '[]');
      entries.unshift(newEntry);
      localStorage.setItem('sina_entries', JSON.stringify(entries));

      // Broadcast instant notification to Admin app / windows
      this.broadcast('NEW_PROCUREMENT_ENTRY', newEntry);
      return newEntry;
    }

    async getEntries(repId = null) {
      let query = 'procurement_entries?select=*,procurement_items(*),payment_attachments(*)&order=created_at.desc';
      if (repId) {
        query += `&representative_id=eq.${repId}`;
      }
      const remote = await this.supabaseRequest(query);
      if (remote && Array.isArray(remote)) {
        const normalized = remote.map(row => this.normalizeEntry(row));
        if (!repId) {
          localStorage.setItem('sina_entries', JSON.stringify(normalized));
        } else {
          // Merge with cached entries from other representatives
          const local = JSON.parse(localStorage.getItem('sina_entries') || '[]');
          const other = local.filter(e => e.representative_id !== repId);
          localStorage.setItem('sina_entries', JSON.stringify([...normalized, ...other]));
        }
        return normalized;
      }
      // Offline fallback
      const local = JSON.parse(localStorage.getItem('sina_entries') || '[]');
      if (repId) {
        return local.filter(e => e.representative_id === repId);
      }
      return local;
    }

    // 4. DAILY CASH GIVEN & EXPENSES
    async getDailyFloat(repId, date = null) {
      const targetDate = date ? String(date).trim() : new Date().toISOString().split('T')[0];
      const remote = await this.supabaseRequest(`daily_floats?representative_id=eq.${repId}&date=eq.${targetDate}&limit=1`);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        const rf = remote[0];
        const floats = JSON.parse(localStorage.getItem('sina_floats') || '[]');
        const idx = floats.findIndex(f => f.representative_id === repId && f.date === rf.date);
        if (idx !== -1) floats[idx] = rf; else floats.unshift(rf);
        localStorage.setItem('sina_floats', JSON.stringify(floats));
        return parseFloat(rf.float_amount) || 0;
      }

      // Check offline cache for this date
      const floats = JSON.parse(localStorage.getItem('sina_floats') || '[]');
      let found = floats.find(f => String(f.representative_id) === String(repId) && f.date === targetDate);
      if (!found && !date) {
        // Fallback to latest float if looking for current float
        const repFloats = floats.filter(f => String(f.representative_id) === String(repId));
        if (repFloats.length > 0) {
          found = repFloats[0];
        }
      }
      if (found) {
        return parseFloat(found.float_amount) || 0;
      }
      return repId === '22222222-2222-2222-2222-222222222222' ? 15000.00 : 0;
    }

    async getDailyCashHistory(repId) {
      const remote = await this.supabaseRequest(`daily_floats?representative_id=eq.${repId}&order=date.desc`);
      if (remote && Array.isArray(remote)) {
        localStorage.setItem('sina_floats', JSON.stringify(remote));
        return remote;
      }
      const floats = JSON.parse(localStorage.getItem('sina_floats') || '[]');
      return floats.filter(f => f.representative_id === repId).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async saveExpense(expense) {
      const payload = {
        representative_id: expense.representative_id || '22222222-2222-2222-2222-222222222222',
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(expense.amount) || 0,
        category: expense.category || 'fuel',
        notes: expense.notes || ''
      };

      const remote = await this.supabaseRequest('expenses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const newExp = (remote && Array.isArray(remote) && remote[0]) ? remote[0] : {
        id: 'exp_' + Date.now(),
        ...payload,
        created_at: new Date().toISOString()
      };
      newExp.rep_name = expense.rep_name || 'Rahul Sharma';

      const expenses = JSON.parse(localStorage.getItem('sina_expenses') || '[]');
      expenses.unshift(newExp);
      localStorage.setItem('sina_expenses', JSON.stringify(expenses));

      if (remote && Array.isArray(remote) && remote[0]) {
        this.supabaseRequest('notifications', {
          method: 'POST',
          body: JSON.stringify({
            representative_id: payload.representative_id,
            title: 'New Field Expense Logged',
            message: `${newExp.rep_name} logged ₹${payload.amount} for ${payload.category}`,
            type: 'expense',
            reference_id: newExp.id
          })
        });
      }

      this.broadcast('NEW_EXPENSE', newExp);
      return newExp;
    }

    async getExpenses(repId = null) {
      let query = 'expenses?select=*&order=created_at.desc';
      if (repId) query += `&representative_id=eq.${repId}`;
      const remote = await this.supabaseRequest(query);
      if (remote && Array.isArray(remote)) {
        if (!repId) {
          localStorage.setItem('sina_expenses', JSON.stringify(remote));
        }
        return remote;
      }
      const expenses = JSON.parse(localStorage.getItem('sina_expenses') || '[]');
      if (repId) {
        return expenses.filter(e => e.representative_id === repId);
      }
      return expenses;
    }

    // 5. TODAY RECONCILIATION FOR REP
    async getRepTodaySummary(repId) {
      const float = await this.getDailyFloat(repId);
      const entries = await this.getEntries(repId);
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = entries.filter(e => e.created_at.startsWith(today));
      const todayExpenses = (await this.getExpenses(repId)).filter(e => e.created_at.startsWith(today));

      const totalProcurementAmount = todayEntries.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
      const cashCollected = todayEntries.reduce((acc, curr) => acc + (parseFloat(curr.cash_amount) || 0), 0);
      const upiCollected = todayEntries.filter(e => e.payment_mode === 'upi').reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
      const bankTransferCollected = todayEntries.filter(e => e.payment_mode === 'bank_transfer').reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
      const totalExpenses = todayExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

      // Cash in hand = Starting Cash Float + Cash Collected - Field Expenses
      const cashInHand = float + cashCollected - totalExpenses;

      return {
        float,
        visitsCount: todayEntries.length,
        totalProcurementAmount,
        cashCollected,
        upiCollected,
        bankTransferCollected,
        totalExpenses,
        cashInHand,
        todayEntries,
        todayExpenses
      };
    }
  }

  window.sinaDB = new SINA_DB();
})();
