// SINA App - Multilingual Language Controller (Google Translate Engine + Instant Native Fallback)
// Supports: English (EN), Hindi / हिन्दी (HI), Marathi / मराठी (MR)
(function() {
  const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', short: 'EN' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', short: 'HI' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', short: 'MR' }
  ];

  const STORAGE_KEY = 'sina_app_language';

  // Core UI dictionaries for instantaneous zero-latency translations
  const DICTIONARY = {
    hi: {
      // Header & Navigation
      'Dashboard & Summary': 'डैशबोर्ड और सारांश',
      'New Procurement Entry': 'नई खरीद प्रविष्टि',
      'New Procurement': 'नई खरीद',
      'New Entry': 'नई प्रविष्टि',
      'Orders & Firms Directory': 'ऑर्डर और फर्म डायरेक्टरी',
      'Commodities & Products': 'जिंस और उत्पाद सूची',
      'Commodities': 'जिंस सूची',
      'Catalog': 'उत्पाद सूची',
      'Cash Float & Expenses': 'दैनिक फ्लोट और खर्चे',
      'Install SINA App': 'SINA ऐप इंस्टॉल करें',
      'Sign Out': 'साइन आउट',
      'Live': 'लाइव',
      'Offline': 'ऑफलाइन',
      
      // Dashboard & KPI
      'Visits': 'दौरे',
      'Procured': 'कुल खरीद',
      'Cash in Hand': 'हाथ में नकद',
      "Today's Cash Ledger": 'आज का नकद खाता',
      'Morning Cash Float:': 'सुबह का नकद फ्लोट:',
      'Cash Collected:': 'नकद संग्रह:',
      'Field Expenses:': 'दौरे के खर्चे:',
      'Net Cash in Hand:': 'कुल शुद्ध नकद:',
      "Today's Visits": 'आज के दौरे',
      'View All': 'सभी देखें',
      'Log Expense': 'खर्चा दर्ज करें',
      'Expense': 'खर्चा',
      
      // Entry Form
      '1. Firm & Shopkeeper Details': '१. फर्म और दुकानदार का विवरण',
      'Firm / Shop Name': 'फर्म / दुकान का नाम',
      'Contact Person': 'संपर्क व्यक्ति',
      'Mobile Number': 'मोबाइल नंबर',
      'Shop / Mandi Address': 'दुकान / मंडी का पता',
      '2. Goods & Quantity Details': '२. माल और मात्रा का विवरण',
      'Category': 'श्रेणी',
      'Type / Item': 'प्रकार / वस्तु',
      '+ Add New Product': '+ नया उत्पाद जोड़ें',
      'Quantity': 'मात्रा',
      'Rate Unit': 'दर इकाई',
      'Per Kg': 'प्रति किलो',
      'Per Piece': 'प्रति नग',
      'Per Bag': 'प्रति बोरी',
      'Calculated Line Total:': 'कुल गणना राशि:',
      '3. Mode of Payment': '३. भुगतान का माध्यम',
      '1. Cash': '१. नकद',
      '2. UPI': '२. यूपीआई',
      '3. Bank Transfer': '३. बैंक ट्रांसफर',
      'Cash Amount Received (₹)': 'प्राप्त नकद राशि (₹)',
      'UPI Number / UPI ID': 'यूपीआई नंबर / आईडी',
      'UTR / Transaction Reference': 'यूटीआर / संदर्भ संख्या',
      'Upload Cheque / Passbook Photos': 'चेक / पासबुक फोटो अपलोड करें',
      'Save Procurement Entry': 'खरीद प्रविष्टि सुरक्षित करें',
      
      // Products
      'Field procurement master catalog': 'फील्ड खरीद मास्टर कैटलॉग',
      '+ Add Product': '+ उत्पाद जोड़ें',
      'Search commodity, variety, or type...': 'जिंस, किस्म या प्रकार खोजें...',
      'All Items': 'सभी वस्तुएं',
      'Benchmark Rate': 'मानक मंडी दर',
      'Use in Entry →': 'प्रविष्टि में उपयोग करें →',
      'Use in Entry': 'प्रविष्टि में उपयोग',
      
      // Common Actions
      'Save': 'सुरक्षित करें',
      'Cancel': 'रद्द करें',
      'Close': 'बंद करें',
      'Delete': 'हटाएं'
    },
    mr: {
      // Header & Navigation
      'Dashboard & Summary': 'डॅशबोर्ड आणि सारांश',
      'New Procurement Entry': 'नवीन खरेदी नोंद',
      'New Procurement': 'नवीन खरेदी',
      'New Entry': 'नवीन नोंद',
      'Orders & Firms Directory': 'ऑर्डर्स आणि फर्म निर्देशिका',
      'Commodities & Products': 'माल आणि उत्पादने',
      'Commodities': 'माल सूची',
      'Catalog': 'उत्पादन सूची',
      'Cash Float & Expenses': 'दैनिक शिल्लक आणि खर्च',
      'Install SINA App': 'SINA ॲप स्थापित करा',
      'Sign Out': 'बाहेर पडा (Sign Out)',
      'Live': 'थेट चालू',
      'Offline': 'ऑफलाइन',
      
      // Dashboard & KPI
      'Visits': 'भेटी',
      'Procured': 'एकूण खरेदी',
      'Cash in Hand': 'हातातील रोख',
      "Today's Cash Ledger": 'आजचे रोख खातेवही',
      'Morning Cash Float:': 'सकाळचे रोख फ्लोट:',
      'Cash Collected:': 'जमा झालेली रोख:',
      'Field Expenses:': 'दौऱ्यातील खर्च:',
      'Net Cash in Hand:': 'एकूण शिल्लक रोख:',
      "Today's Visits": 'आजच्या भेटी',
      'View All': 'सर्व पहा',
      'Log Expense': 'खर्च नोंदवा',
      'Expense': 'खर्च',
      
      // Entry Form
      '1. Firm & Shopkeeper Details': '१. फर्म आणि दुकानदाराचा तपशील',
      'Firm / Shop Name': 'फर्म / दुकानाचे नाव',
      'Contact Person': 'संपर्क व्यक्ती',
      'Mobile Number': 'मोबाईल नंबर',
      'Shop / Mandi Address': 'दुकान / मार्केट पत्ता',
      '2. Goods & Quantity Details': '२. माल आणि प्रमाण तपशील',
      'Category': 'वर्गवारी',
      'Type / Item': 'प्रकार / वस्तू',
      '+ Add New Product': '+ नवीन उत्पादन जोडा',
      'Quantity': 'प्रमाण (Quantity)',
      'Rate Unit': 'दर एकक',
      'Per Kg': 'प्रति किलो',
      'Per Piece': 'प्रति नग',
      'Per Bag': 'प्रति पोते/बॅग',
      'Calculated Line Total:': 'एकूण हिशोब रक्कम:',
      '3. Mode of Payment': '३. पेमेंटचा प्रकार',
      '1. Cash': '१. रोख (Cash)',
      '2. UPI': '२. यूपीआय (UPI)',
      '3. Bank Transfer': '३. बँक ट्रान्सफर',
      'Cash Amount Received (₹)': 'स्वीकारलेली रोख रक्कम (₹)',
      'UPI Number / UPI ID': 'यूपीआई क्रमांक / आयडी',
      'UTR / Transaction Reference': 'यूटीआर / संदर्भ क्रमांक',
      'Upload Cheque / Passbook Photos': 'चेक / पासबुक फोटो अपलोड करा',
      'Save Procurement Entry': 'खरेदी नोंद सेव्ह करा',
      
      // Products
      'Field procurement master catalog': 'फील्ड खरेदी मुख्य सूची',
      '+ Add Product': '+ उत्पादन जोडा',
      'Search commodity, variety, or type...': 'माल, जात किंवा प्रकार शोधा...',
      'All Items': 'सर्व वस्तू',
      'Benchmark Rate': 'प्रमाणित बाजार दर',
      'Use in Entry →': 'नोंदवहीत वापरा →',
      'Use in Entry': 'नोंदवहीत वापरा',
      
      // Common Actions
      'Save': 'जतन करा',
      'Cancel': 'रद्द करा',
      'Close': 'बंद करा',
      'Delete': 'हटवा'
    }
  };

  class SinaTranslator {
    constructor() {
      this.currentLang = localStorage.getItem(STORAGE_KEY) || 'en';
      this.initCookie();
      this.initGoogleTranslate();
      this.applyInstantTranslation(this.currentLang);
    }

    getCurrentLanguage() {
      return this.currentLang;
    }

    getLanguages() {
      return LANGUAGES;
    }

    initCookie() {
      if (this.currentLang && this.currentLang !== 'en') {
        this.setGoogleCookie(this.currentLang);
      }
    }

    setGoogleCookie(lang) {
      const val = `/en/${lang}`;
      const expires = 'expires=Fri, 31 Dec 9999 23:59:59 GMT';
      document.cookie = `googtrans=${val}; ${expires}; path=/;`;
      if (window.location.hostname && window.location.hostname !== 'localhost') {
        document.cookie = `googtrans=${val}; ${expires}; domain=${window.location.hostname}; path=/;`;
        document.cookie = `googtrans=${val}; ${expires}; domain=.${window.location.hostname}; path=/;`;
      }
    }

    initGoogleTranslate() {
      // Ensure target element exists
      if (!document.getElementById('google_translate_element')) {
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none';
        document.body.appendChild(div);
      }

      // Define callback
      window.googleTranslateElementInit = () => {
        try {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,hi,mr',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          }, 'google_translate_element');

          setTimeout(() => {
            this.syncGoogleTranslateSelect(this.currentLang);
          }, 400);
        } catch (e) {
          console.warn('Google Translate initialization:', e);
        }
      };

      // Inject Google Translate script if not already present
      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.type = 'text/javascript';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.head.appendChild(script);
      }
    }

    syncGoogleTranslateSelect(targetLang) {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        if (select.value !== targetLang) {
          select.value = targetLang;
          select.dispatchEvent(new Event('change'));
        }
      }
    }

    async setLanguage(langCode) {
      if (!LANGUAGES.some(l => l.code === langCode)) return;

      this.currentLang = langCode;
      localStorage.setItem(STORAGE_KEY, langCode);

      // 1. Instant client-side text translation
      this.applyInstantTranslation(langCode);

      // 2. Set Google Translate cookie
      this.setGoogleCookie(langCode);

      // 3. Trigger Google Translate combo element
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
      } else {
        // If Google combo is not yet loaded, reload so cookie auto-translates
        window.location.reload();
      }

      // 4. Update all language switcher UI widgets on the page
      this.updateUI();
    }

    applyInstantTranslation(langCode) {
      if (langCode === 'en') {
        // Default text - if user switched back to English, reload or let Google revert
        return;
      }

      const dict = DICTIONARY[langCode];
      if (!dict) return;

      // Recursive DOM text-node replacement for instant speed
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'svg', 'path'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest('#google_translate_element') || parent.closest('.lang-selector-wrap')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      while ((node = walker.nextNode())) {
        const raw = node.nodeValue.trim();
        if (raw && dict[raw]) {
          node.nodeValue = node.nodeValue.replace(raw, dict[raw]);
        }
      }

      // Also translate placeholders
      document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
        const ph = el.getAttribute('placeholder');
        if (ph && dict[ph]) {
          el.setAttribute('placeholder', dict[ph]);
        }
      });
    }

    updateUI() {
      const activeLangObj = LANGUAGES.find(l => l.code === this.currentLang) || LANGUAGES[0];

      // Update button label
      const labelEl = document.getElementById('current-lang-label');
      if (labelEl) {
        labelEl.textContent = activeLangObj.short;
      }

      // Update dropdown option states
      document.querySelectorAll('.lang-option').forEach(opt => {
        const code = opt.getAttribute('data-lang');
        if (code === this.currentLang) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
    }
  }

  // Initialize and expose globally
  window.sinaTranslate = new SinaTranslator();
})();
