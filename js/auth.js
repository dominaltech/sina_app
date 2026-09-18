// SINA App - Representative Authentication & Session Management
(function() {
  const DEFAULT_REPRESENTATIVE = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Rahul Sharma',
    phone: '9811223344',
    role: 'representative',
    assigned_route: 'North Wholesale Market',
    status: 'active'
  };

  class SINA_Auth {
    constructor() {
      this.initProfiles();
    }

    initProfiles() {
      if (!localStorage.getItem('sina_profiles')) {
        const initialProfiles = [
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Rahul Sharma',
            phone: '9811223344',
            password_hash: 'rep123',
            role: 'representative',
            assigned_route: 'North Wholesale Market',
            status: 'active'
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Suresh Kumar',
            phone: '9822334455',
            password_hash: 'rep123',
            role: 'representative',
            assigned_route: 'South Industrial Zone',
            status: 'active'
          },
          {
            id: '44444444-4444-4444-4444-444444444444',
            name: 'Amit Patel',
            phone: '9833445566',
            password_hash: 'rep123',
            role: 'representative',
            assigned_route: 'East Rural Mandi',
            status: 'active'
          }
        ];
        localStorage.setItem('sina_profiles', JSON.stringify(initialProfiles));
      }
    }

    getCurrentUser() {
      const stored = localStorage.getItem('sina_current_rep');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return DEFAULT_REPRESENTATIVE;
        }
      }
      return null;
    }

    requireAuth() {
      const user = this.getCurrentUser();
      const isLoginPage = window.location.pathname.endsWith('login.html');
      if (!user && !isLoginPage) {
        window.location.href = 'login.html';
      }
      return user;
    }

    async login(phone, password) {
      const cleanPhone = phone.trim();
      const cleanPass = password.trim();

      // Check local profiles (which Admin can manage)
      const profiles = JSON.parse(localStorage.getItem('sina_profiles') || '[]');
      const user = profiles.find(p => p.phone === cleanPhone && p.password_hash === cleanPass);

      if (user) {
        if (user.status !== 'active') {
          throw new Error('This representative account has been deactivated by Admin.');
        }
        localStorage.setItem('sina_current_rep', JSON.stringify(user));
        return user;
      }

      // If hardcoded demo credentials match
      if (cleanPhone === '9811223344' && cleanPass === 'rep123') {
        localStorage.setItem('sina_current_rep', JSON.stringify(DEFAULT_REPRESENTATIVE));
        return DEFAULT_REPRESENTATIVE;
      }

      throw new Error('Invalid mobile number or password. Check with Admin.');
    }

    logout() {
      localStorage.removeItem('sina_current_rep');
      window.location.href = 'login.html';
    }
  }

  window.sinaAuth = new SINA_Auth();
})();
