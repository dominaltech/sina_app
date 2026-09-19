// SINA App - Instant Zero-Flicker Multilingual Translation Engine
// Supports: English (EN), Hindi / हिन्दी (HI), Marathi / मराठी (MR)
(function() {
  const STORAGE_KEY = 'sina_app_language';
  const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', short: 'EN' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', short: 'HI' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', short: 'MR' }
  ];

  // Comprehensive UI Dictionaries for 100% Instant, Zero-Latency Translation
  const DICTIONARY = {
    hi: {
      // Header, Navigation & Drawer
      'SINA App': 'SINA ऐप',
      'Dashboard & Summary': 'डैशबोर्ड और सारांश',
      'New Procurement Entry': 'नई खरीद प्रविष्टि',
      'New Procurement': 'नई खरीद',
      'New Entry': 'नई प्रविष्टि',
      'Orders & Firms Directory': 'ऑर्डर और फर्म डायरेक्टरी',
      'Commodities & Products': 'जिंस और उत्पाद सूची',
      'Commodities': 'जिंस सूची',
      'Products': 'उत्पाद',
      'Catalog': 'उत्पाद सूची',
      'Cash Given & Expenses': 'नकद और खर्चे',
      'Install SINA App': 'SINA ऐप इंस्टॉल करें',
      'Sign Out': 'साइन आउट',
      'Live': 'लाइव',
      'Offline': 'ऑफलाइन',
      'Select Language': 'भाषा चुनें',
      'Field Representative': 'फील्ड प्रतिनिधि',
      'Super Admin': 'सुपर एडमिन',

      // Dashboard & KPI Cards
      'Today': 'आज',
      'Visits': 'दौरे',
      'Procured': 'कुल खरीद',
      'Total Bought': 'कुल खरीदे गए माल',
      'Daily Expenses': 'दैनिक खर्चे',
      'Daily Expenses:': 'दैनिक खर्चे:',
      'Cash in Hand': 'हाथ में नकद',
      "Today's Cash Summary": 'आज का नकद सारांश',
      "Today's Cash Ledger": 'आज का नकद सारांश',
      "Today's Cash Balance Summary": 'आज का नकद संतुलन सारांश',
      'Morning Cash Float:': 'सुबह दिए गए नकद:',
      'Morning Cash Given:': 'सुबह दिए गए नकद:',
      'Morning Cash Given': 'सुबह दिए गए नकद',
      'Cash Collected in Field:': 'फील्ड से एकत्र नकद:',
      'Cash Collected in Field': 'फील्ड से एकत्र नकद',
      'Daily Expenses Spent:': 'किए गए दैनिक खर्चे:',
      'Daily Expenses Spent': 'किए गए दैनिक खर्चे',
      'Remaining Cash in Hand:': 'हाथ में शेष नकद:',
      'Remaining Cash in Hand': 'हाथ में शेष नकद',
      "Today's Visits": 'आज के दौरे',
      'View All': 'सभी देखें',
      'Expense': 'खर्चा',
      'Log Expense': 'खर्चा दर्ज करें',
      'Log Daily Expense': 'दैनिक खर्चा दर्ज करें',
      'Real-Time': 'रियल-टाइम',
      'Calculating live cash balance...': 'नकद संतुलन की गणना हो रही है...',

      // Procurement Entry Form
      'Purchase Entry / Goods Bought': 'खरीद प्रविष्टि / खरीदा गया माल',
      'Goods Purchase Form': 'माल खरीद फॉर्म',
      'Save Purchase Entry': 'खरीद प्रविष्टि सुरक्षित करें',
      '+ Add New Commodity / Product': '+ नया माल / उत्पाद जोड़ें',
      '+ Add New Product': '+ नया उत्पाद जोड़ें',
      '1. Firm & Shopkeeper Details': '१. फर्म और दुकानदार का विवरण',
      'Firm / Shop Name': 'फर्म / दुकान का नाम',
      'Firm Name': 'फर्म का नाम',
      'Firm Name *': 'फर्म का नाम *',
      'Contact Person': 'संपर्क व्यक्ति',
      'Contact Person *': 'संपर्क व्यक्ति *',
      'Mobile Number': 'मोबाइल नंबर',
      'Mobile Number *': 'मोबाइल नंबर *',
      'Shop / Mandi Address': 'दुकान / मंडी का पता',
      'Address / Mandi Location *': 'पता / मंडी स्थान *',
      '2. Goods & Quantity Details': '२. माल और मात्रा का विवरण',
      '2. Product & Rate Details': '२. उत्पाद और दर विवरण',
      'Category': 'श्रेणी',
      'Category *': 'श्रेणी *',
      'Type / Item': 'प्रकार / वस्तु',
      'Product / Commodity Name *': 'वस्तु / उत्पाद का नाम *',
      'Type / Variety / Grade': 'प्रकार / किस्म / ग्रेड',
      'Quantity': 'मात्रा',
      'Quantity *': 'मात्रा *',
      'Rate Unit': 'दर इकाई',
      'Unit *': 'इकाई *',
      'Unit of Measure *': 'माप की इकाई *',
      'Rate (₹) *': 'दर (₹) *',
      'Rate / Amount (₹) *': 'दर / राशि (₹) *',
      'Total Amount (₹) *': 'कुल राशि (₹) *',
      'Per Kg': 'प्रति किलो',
      'Per Piece': 'प्रति नग',
      'Per Bag': 'प्रति बोरी',
      'Calculated Line Total:': 'कुल गणना राशि:',
      '3. Mode of Payment': '३. भुगतान का माध्यम',
      'Payment Mode': 'भुगतान का माध्यम',
      'Payment Mode *': 'भुगतान का माध्यम *',
      '1. Cash': '१. नकद',
      '2. UPI': '२. यूपीआई',
      '3. Bank Transfer': '३. बैंक ट्रांसफर',
      'Cash Amount Received (₹)': 'प्राप्त नकद राशि (₹)',
      'UPI Number / UPI ID': 'यूपीआई नंबर / आईडी',
      'UPI ID': 'यूपीआई आईडी',
      'UTR / Transaction Reference': 'यूटीआर / संदर्भ संख्या',
      'UPI UTR / Reference': 'यूपीआई यूटीआर / संदर्भ',
      'Upload Cheque / Passbook Photos': 'चेक / पासबुक फोटो अपलोड करें',
      'Save Procurement Entry': 'खरीद प्रविष्टि सुरक्षित करें',
      'Take Photo': 'फोटो खींचें',
      'Choose File': 'फाइल चुनें',

      // Products & Catalog
      'Field procurement master catalog': 'फील्ड खरीद मास्टर कैटलॉग',
      '+ Add Product': '+ उत्पाद जोड़ें',
      '+ Add New Commodity': '+ नया माल जोड़ें',
      'Search commodity, variety, or type...': 'जिंस, किस्म या प्रकार खोजें...',
      'All Items': 'सभी वस्तुएं',
      'Benchmark Rate': 'मानक मंडी दर',
      'Use in Entry →': 'प्रविष्टि में उपयोग करें →',
      'Use in Entry': 'प्रविष्टि में उपयोग',
      'Use': 'उपयोग करें',
      'Edit': 'संपादित करें',
      'Edit Commodity / Product': 'वस्तु / उत्पाद संपादित करें',
      'Save Changes': 'परिवर्तन सुरक्षित करें',
      'No commodities found': 'कोई वस्तु नहीं मिली',
      'Try searching for a different item or add a new commodity.': 'किसी अन्य वस्तु को खोजें या नया उत्पाद जोड़ें।',

      // Purchase Records & Directory
      'Field Purchase Log': 'फील्ड खरीद लॉग',
      'Real-time record of all mandi visits and goods purchases': 'सभी मंडी दौरों और खरीद का रीयल-टाइम रिकॉर्ड',
      'Search firm, item, mobile, or address...': 'फर्म, वस्तु, मोबाइल या पता खोजें...',
      'All Modes': 'सभी माध्यम',
      '1. Cash Only': '१. केवल नकद',
      '2. UPI Only': '२. केवल यूपीआई',
      '3. Bank Transfer Only': '३. केवल बैंक ट्रांसफर',
      'Recent Field Purchases': 'हाल की खरीद प्रविष्टियां',
      'Firm Visits Directory': 'फर्म दौरा डायरेक्टरी',
      'Visit Log': 'दौरा लॉग',
      'Firms': 'फर्म्स',
      'Edit Entry': 'प्रविष्टि संपादित करें',
      'Edit Purchase Entry': 'खरीद प्रविष्टि संपादित करें',
      'Shop & Firm Details': 'दुकान और फर्म का विवरण',
      'Save Changes to Supabase': 'परिवर्तन सुरक्षित करें',
      'Passbook / Cheque Proofs': 'पासबुक / चेक प्रमाण',
      'Uploaded Passbook / Cheque Proofs:': 'अपलोड किए गए पासबुक / चेक फोटो:',
      'No purchase records found': 'कोई खरीद प्रविष्टि नहीं मिली',
      'No firms found matching your search.': 'खोज से मेल खाती कोई फर्म नहीं मिली।',
      'Quantity:': 'मात्रा:',
      'Rate:': 'दर:',
      'Contact:': 'संपर्क:',
      'Payment:': 'भुगतान:',

      // Expenses & Profile
      'Daily Cash Given History': 'दैनिक दिए गए नकद का इतिहास',
      'Date-by-date record of morning cash given to you': 'दैनिक दिए गए नकद का तारीखवार रिकॉर्ड',
      'Expense Category': 'खर्चे की श्रेणी',
      'Amount (₹) *': 'राशि (₹) *',
      'Purpose / Notes *': 'कारण / विवरण *',
      'Travel & Fuel': 'यात्रा और ईंधन',
      'Food & Refreshment': 'भोजन और नाश्ता',
      'Market / Mandi Fee': 'मंडी / बाजार शुल्क',
      'Emergency / Other': 'अन्य / आपातकालीन',
      'Save Expense': 'खर्चा सुरक्षित करें',

      // Common Actions
      'Save': 'सुरक्षित करें',
      'Cancel': 'रद्द करें',
      'Close': 'बंद करें',
      'Delete': 'हटाएं'
    },

    mr: {
      // Header, Navigation & Drawer
      'SINA App': 'SINA ॲप',
      'Dashboard & Summary': 'डॅशबोर्ड आणि सारांश',
      'New Procurement Entry': 'नवीन खरेदी नोंद',
      'New Procurement': 'नवीन खरेदी',
      'New Entry': 'नवीन नोंद',
      'Orders & Firms Directory': 'ऑर्डर्स आणि फर्म निर्देशिका',
      'Commodities & Products': 'माल आणि उत्पादने',
      'Commodities': 'माल सूची',
      'Products': 'उत्पादने',
      'Catalog': 'उत्पादन सूची',
      'Cash Given & Expenses': 'दिलेली रोख आणि खर्च',
      'Install SINA App': 'SINA ॲप स्थापित करा',
      'Sign Out': 'बाहेर पडा (Sign Out)',
      'Live': 'थेट चालू',
      'Offline': 'ऑफलाइन',
      'Select Language': 'भाषा निवडा',
      'Field Representative': 'फील्ड प्रतिनिधी',
      'Super Admin': 'सुपर ॲडमिन',

      // Dashboard & KPI Cards
      'Today': 'आज',
      'Visits': 'भेटी',
      'Procured': 'एकूण खरेदी',
      'Total Bought': 'एकूण खरेदी केलेला माल',
      'Daily Expenses': 'दररोजचा खर्च',
      'Daily Expenses:': 'दररोजचा खर्च:',
      'Cash in Hand': 'हातातील रोख',
      "Today's Cash Summary": 'आजचा रोख सारांश',
      "Today's Cash Ledger": 'आजचा रोख सारांश',
      "Today's Cash Balance Summary": 'आजचा रोख शिल्लक सारांश',
      'Morning Cash Float:': 'सकाळी दिलेली रोख:',
      'Morning Cash Given:': 'सकाळी दिलेली रोख:',
      'Morning Cash Given': 'सकाळी दिलेली रोख',
      'Cash Collected in Field:': 'फील्डमधून जमा झालेली रोख:',
      'Cash Collected in Field': 'फील्डमधून जमा झालेली रोख',
      'Daily Expenses Spent:': 'केलेला दररोजचा खर्च:',
      'Daily Expenses Spent': 'केलेला दररोजचा खर्च',
      'Remaining Cash in Hand:': 'हातातील शिल्लक रोख:',
      'Remaining Cash in Hand': 'हातातील शिल्लक रोख',
      "Today's Visits": 'आजच्या भेटी',
      'View All': 'सर्व पहा',
      'Expense': 'खर्च',
      'Log Expense': 'खर्च नोंदवा',
      'Log Daily Expense': 'दररोजचा खर्च नोंदवा',
      'Real-Time': 'रिअल-टाइम',
      'Calculating live cash balance...': 'रोख शिल्लक मोजली जात आहे...',

      // Procurement Entry Form
      'Purchase Entry / Goods Bought': 'खरेदी नोंद / खरेदी केलेला माल',
      'Goods Purchase Form': 'माल खरेदी फॉर्म',
      'Save Purchase Entry': 'खरेदी नोंद सेव्ह करा',
      '+ Add New Commodity / Product': '+ नवीन माल / उत्पादन जोडा',
      '+ Add New Product': '+ नवीन उत्पादन जोडा',
      '1. Firm & Shopkeeper Details': '१. फर्म आणि दुकानदाराचा तपशील',
      'Firm / Shop Name': 'फर्म / दुकानाचे नाव',
      'Firm Name': 'फर्मचे नाव',
      'Firm Name *': 'फर्मचे नाव *',
      'Contact Person': 'संपर्क व्यक्ती',
      'Contact Person *': 'संपर्क व्यक्ती *',
      'Mobile Number': 'मोबाईल नंबर',
      'Mobile Number *': 'मोबाईल नंबर *',
      'Shop / Mandi Address': 'दुकान / मार्केट पत्ता',
      'Address / Mandi Location *': 'पत्ता / मंडी ठिकाण *',
      '2. Goods & Quantity Details': '२. माल आणि प्रमाण तपशील',
      '2. Product & Rate Details': '२. माल आणि दर तपशील',
      'Category': 'वर्गवारी',
      'Category *': 'वर्गवारी *',
      'Type / Item': 'प्रकार / वस्तू',
      'Product / Commodity Name *': 'माल / उत्पादनाचे नाव *',
      'Type / Variety / Grade': 'प्रकार / जात / प्रत',
      'Quantity': 'प्रमाण (Quantity)',
      'Quantity *': 'प्रमाण *',
      'Rate Unit': 'दर एकक',
      'Unit *': 'एकक *',
      'Unit of Measure *': 'मापनाचे एकक *',
      'Rate (₹) *': 'दर (₹) *',
      'Rate / Amount (₹) *': 'दर / रक्कम (₹) *',
      'Total Amount (₹) *': 'एकूण रक्कम (₹) *',
      'Per Kg': 'प्रति किलो',
      'Per Piece': 'प्रति नग',
      'Per Bag': 'प्रति पोते/बॅग',
      'Calculated Line Total:': 'एकूण हिशोब रक्कम:',
      '3. Mode of Payment': '३. पेमेंटचा प्रकार',
      'Payment Mode': 'पेमेंटचा प्रकार',
      'Payment Mode *': 'पेमेंटचा प्रकार *',
      '1. Cash': '१. रोख (Cash)',
      '2. UPI': '२. यूपीआय (UPI)',
      '3. Bank Transfer': '३. बँक ट्रान्सफर',
      'Cash Amount Received (₹)': 'स्वीकारलेली रोख रक्कम (₹)',
      'UPI Number / UPI ID': 'यूपीआई क्रमांक / आयडी',
      'UPI ID': 'यूपीआई आयडी',
      'UTR / Transaction Reference': 'यूटीआर / संदर्भ क्रमांक',
      'UPI UTR / Reference': 'यूपीआई यूटीआर / संदर्भ',
      'Upload Cheque / Passbook Photos': 'चेक / पासबुक फोटो अपलोड करा',
      'Save Procurement Entry': 'खरेदी नोंद सेव्ह करा',
      'Take Photo': 'फोटो काढा',
      'Choose File': 'फाइल निवडा',

      // Products & Catalog
      'Field procurement master catalog': 'फील्ड खरेदी मुख्य सूची',
      '+ Add Product': '+ उत्पादन जोडा',
      '+ Add New Commodity': '+ नवीन माल जोडा',
      'Search commodity, variety, or type...': 'माल, जात किंवा प्रकार शोधा...',
      'All Items': 'सर्व वस्तू',
      'Benchmark Rate': 'प्रमाणित बाजार दर',
      'Use in Entry →': 'नोंदवहीत वापरा →',
      'Use in Entry': 'नोंदवहीत वापरा',
      'Use': 'वापरा',
      'Edit': 'संपादित करा',
      'Edit Commodity / Product': 'माल / उत्पादन संपादित करा',
      'Save Changes': 'बदल सेव्ह करा',
      'No commodities found': 'कोणताही माल आढळला नाही',
      'Try searching for a different item or add a new commodity.': 'दुसऱ्या वस्तूचा शोध घ्या किंवा नवीन माल जोडा.',

      // Purchase Records & Directory
      'Field Purchase Log': 'फील्ड खरेदी नोंदवही',
      'Real-time record of all mandi visits and goods purchases': 'सर्व मार्केट भेटी आणि माल खरेदीची थेट नोंद',
      'Search firm, item, mobile, or address...': 'फर्म, माल, मोबाईल किंवा पत्ता शोधा...',
      'All Modes': 'सर्व प्रकार',
      '1. Cash Only': '१. फक्त रोख',
      '2. UPI Only': '२. फक्त यूपीआय',
      '3. Bank Transfer Only': '३. फक्त बँक ट्रान्सफर',
      'Recent Field Purchases': 'अलीकडील खरेदी नोंदी',
      'Firm Visits Directory': 'फर्म भेटी निर्देशिका',
      'Visit Log': 'भेट नोंद',
      'Firms': 'फर्म्स',
      'Edit Entry': 'नोंद संपादित करा',
      'Edit Purchase Entry': 'खरेदी नोंद संपादित करा',
      'Shop & Firm Details': 'दुकान आणि फर्मचा तपशील',
      'Save Changes to Supabase': 'बदल सेव्ह करा',
      'Passbook / Cheque Proofs': 'पासबुक / चेक पुरावा',
      'Uploaded Passbook / Cheque Proofs:': 'अपलोड केलेले पासबुक / चेक फोटो:',
      'No purchase records found': 'कोणतीही खरेदी नोंद आढळली नाही',
      'No firms found matching your search.': 'शोधाशी जुळणारी कोणतीही फर्म आढळली नाही.',
      'Quantity:': 'प्रमाण:',
      'Rate:': 'दर:',
      'Contact:': 'संपर्क:',
      'Payment:': 'पेमेंट:',

      // Expenses & Profile
      'Daily Cash Given History': 'दररोज दिलेल्या रोखेचा इतिहास',
      'Date-by-date record of morning cash given to you': 'सकाळी दिलेल्या रोखेची दिनांकनिहाय नोंद',
      'Expense Category': 'खर्चाचा प्रकार',
      'Amount (₹) *': 'रक्कम (₹) *',
      'Purpose / Notes *': 'कारण / टीप *',
      'Travel & Fuel': 'प्रवास आणि इंधन',
      'Food & Refreshment': 'अन्न आणि नाश्ता',
      'Market / Mandi Fee': 'मार्केट / मंडी फी',
      'Emergency / Other': 'इतर / आपत्कालीन',
      'Save Expense': 'खर्च सेव्ह करा',

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
      this.observer = null;
      this.isTranslating = false;

      // Anti-flicker pre-hide if non-English is chosen
      this.initAntiFlicker();

      // Pre-warm Google cookie
      this.initCookie();

      // Initialize MutationObserver to catch dynamic element injections (products, records, etc.)
      this.setupMutationObserver();

      // Initial execution
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.applyInstantTranslation(document.body, this.currentLang);
          this.revealPage();
          this.initGoogleTranslate();
          this.updateUI();
        });
      } else {
        this.applyInstantTranslation(document.body, this.currentLang);
        this.revealPage();
        this.initGoogleTranslate();
        this.updateUI();
      }

      // Listen for cross-tab or cross-window language changes
      if (window.BroadcastChannel) {
        try {
          this.broadcastChannel = new BroadcastChannel('sina_operations_channel');
          this.broadcastChannel.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'LANGUAGE_CHANGED' && event.data.lang) {
              if (event.data.lang !== this.currentLang) {
                this.setLanguage(event.data.lang, false);
              }
            }
          });
        } catch (e) {}
      }
    }

    initAntiFlicker() {
      if (this.currentLang !== 'en') {
        document.documentElement.classList.add('sina-lang-active');
        if (!document.getElementById('sina-anti-flicker-style')) {
          const style = document.createElement('style');
          style.id = 'sina-anti-flicker-style';
          style.textContent = `
            html.sina-lang-active body {
              opacity: 0 !important;
              pointer-events: none !important;
            }
            body {
              transition: opacity 0.1s ease-in !important;
            }
          `;
          (document.head || document.documentElement).appendChild(style);
        }

        // Failsafe: Never keep page hidden for more than 120ms even if something hangs
        setTimeout(() => this.revealPage(), 120);
      }
    }

    revealPage() {
      document.documentElement.classList.remove('sina-lang-active');
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

    setupMutationObserver() {
      if (this.observer) this.observer.disconnect();

      this.observer = new MutationObserver((mutations) => {
        if (this.currentLang === 'en' || this.isTranslating) return;

        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Ignore Google Translate container itself
                if (node.id === 'google_translate_element' || node.classList?.contains('goog-te-combo')) continue;
                this.translateSubtree(node, this.currentLang);
              } else if (node.nodeType === Node.TEXT_NODE) {
                this.translateSingleTextNode(node, this.currentLang);
              }
            }
          }
        }
      });

      this.observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    translateSubtree(rootElement, langCode) {
      if (!rootElement || langCode === 'en') return;
      const dict = DICTIONARY[langCode];
      if (!dict) return;

      this.isTranslating = true;
      try {
        const walker = document.createTreeWalker(
          rootElement,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const p = node.parentElement;
              if (!p) return NodeFilter.FILTER_REJECT;
              const tag = p.tagName.toLowerCase();
              if (['script', 'style', 'noscript', 'svg', 'path'].includes(tag)) {
                return NodeFilter.FILTER_REJECT;
              }
              if (p.closest('#google_translate_element') || p.closest('.lang-selector-wrap')) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        let n;
        while ((n = walker.nextNode())) {
          this.translateSingleTextNode(n, langCode);
        }

        // Translate placeholders
        rootElement.querySelectorAll?.('input[placeholder], textarea[placeholder]').forEach(el => {
          const ph = el.getAttribute('placeholder');
          if (ph && dict[ph]) el.setAttribute('placeholder', dict[ph]);
        });

        // Translate select options
        rootElement.querySelectorAll?.('option').forEach(opt => {
          const text = opt.textContent.trim();
          if (text && dict[text]) opt.textContent = dict[text];
        });
      } finally {
        this.isTranslating = false;
      }
    }

    translateSingleTextNode(node, langCode) {
      if (!node || !node.nodeValue) return;
      const dict = DICTIONARY[langCode];
      if (!dict) return;

      const raw = node.nodeValue.trim();
      if (!raw) return;

      if (dict[raw]) {
        node.nodeValue = node.nodeValue.replace(raw, dict[raw]);
        return;
      }

      // Check partial exact phrase matches
      for (const [enKey, trVal] of Object.entries(dict)) {
        if (enKey.length >= 4 && raw.includes(enKey)) {
          node.nodeValue = node.nodeValue.replace(enKey, trVal);
        }
      }
    }

    applyInstantTranslation(rootNode = document.body, langCode = this.currentLang) {
      if (!rootNode || langCode === 'en') {
        this.revealPage();
        return;
      }
      this.translateSubtree(rootNode, langCode);
      this.revealPage();
    }

    initGoogleTranslate() {
      // Create hidden container if needed
      if (!document.getElementById('google_translate_element')) {
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none';
        document.body.appendChild(div);
      }

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
          }, 300);
        } catch (e) {
          console.warn('Google Translate initialization:', e);
        }
      };

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
      if (select && select.value !== targetLang) {
        select.value = targetLang;
        select.dispatchEvent(new Event('change'));
      }
    }

    async setLanguage(langCode, broadcast = true) {
      if (!LANGUAGES.some(l => l.code === langCode)) return;

      const previousLang = this.currentLang;
      this.currentLang = langCode;
      localStorage.setItem(STORAGE_KEY, langCode);
      sessionStorage.setItem(STORAGE_KEY, langCode);

      // Set cookie for instant load on subsequent pages
      this.setGoogleCookie(langCode);

      if (broadcast && this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: 'LANGUAGE_CHANGED', lang: langCode });
        } catch (e) {}
      }

      // If switching back to English, reload page for perfectly clean native English
      if (langCode === 'en' && previousLang !== 'en') {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
          select.value = 'en';
          select.dispatchEvent(new Event('change'));
        }
        window.location.reload();
        return;
      }

      // Instant translate current page DOM
      this.applyInstantTranslation(document.body, langCode);

      // Sync Google translate combo if available
      this.syncGoogleTranslateSelect(langCode);

      // Update UI components
      this.updateUI();
    }

    updateUI() {
      const activeLangObj = LANGUAGES.find(l => l.code === this.currentLang) || LANGUAGES[0];

      // Update main pill button label
      const labelEl = document.getElementById('current-lang-label');
      if (labelEl) {
        labelEl.textContent = activeLangObj.short;
      }

      // Update header dropdown active options
      document.querySelectorAll('.lang-option').forEach(opt => {
        const code = opt.getAttribute('data-lang');
        if (code === this.currentLang) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });

      // Update drawer language buttons
      document.querySelectorAll('.drawer-lang-btn').forEach(btn => {
        const code = btn.getAttribute('data-drawer-lang');
        if (code === this.currentLang) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  // Instantiate globally immediately
  window.sinaTranslate = new SinaTranslator();
})();
