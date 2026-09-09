/**
 * Satvik Swaad — Internationalization (i18n) Engine & Translations
 * Supports English (default) and Hindi with persistent user selection across all pages.
 */

export const STORAGE_KEY_LANG = 'satvik_lang';

export const TRANSLATIONS = {
  en: {
    langToggleText: "हिन्दी",
    langToggleAria: "Switch to Hindi",
    brandSub: "Pure Traditional Taste",

    // Announcement Ticker
    ticker: [
      "✨ 100% HOMEMADE PICKLES & PRESERVES",
      "☀️ SUN-CURED IN PURE COLD-PRESSED MUSTARD OIL",
      "👵 ANCESTRAL FAMILY RECIPES",
      "🌿 ZERO ARTIFICIAL PRESERVATIVES",
      "🪔 PURE TRADITIONAL DESI TASTE",
      "📦 FRESH BATCHES PREPARED WEEKLY"
    ],

    // Header & Navigation
    nav: {
      home: "Home",
      products: "Shop",
      whyUs: "Health & Purity",
      ourStory: "Our Story",
      reviews: "Reviews",
      faq: "FAQ",
      contact: "Contact",
      comparison: "Comparison",
      profile: "Profile",
      cart: "Cart",
      menu: "Menu"
    },

    // Mobile Bottom Nav
    bottomNav: {
      home: "Home",
      products: "Products",
      cart: "Cart",
      profile: "Profile"
    },

    // Trust Badges
    trust: {
      sunCuredTitle: "Sun-Cured",
      sunCuredDesc: "Natural sunlight",
      oilTitle: "Cold-Pressed",
      oilDesc: "Kachi Ghani oil",
      pureTitle: "Zero Chemicals",
      pureDesc: "No preservatives",
      recipeTitle: "Ancestral Recipes",
      recipeDesc: "Authentic spices"
    },

    // Reorder section
    reorder: {
      title: "Buy Again / Quick Reorder",
      subtitle: "Reorder your household favorites in one click with fast dispatch.",
      btnReorder: "Reorder"
    },

    // Catalog & Products
    catalog: {
      heading: "All 15 Handcrafted Products",
      badge: "Pure Taste of Tradition",
      searchPlaceholder: "Search for pickles, sweets...",
      sortDefault: "Newest First",
      sortPriceAsc: "Price: Low to High",
      sortPriceDesc: "Price: High to Low",
      sortNameAsc: "Name: A to Z",
      tabs: {
        all: "All Products",
        achar: "Pickles (12)",
        murabba: "Murabba (2)",
        sweets: "Sweets (8)",
        health: "Health Products (6)"
      },
      bestseller: "Bestseller",
      healthyChoice: "Healthy Choice",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      save: "Save",
      availablePacks: "Available Packs:",
      btnViewDetails: "View Details 👁️",
      btnAddCart: "Add to Cart",
      btnAdded: "Added! ✓",
      verifiedReviews: "verified reviews"
    },

    // Product Details Page
    productDetails: {
      breadcrumbHome: "Home",
      breadcrumbProducts: "Products",
      selectPack: "Select Pack Size:",
      quantity: "Quantity:",
      btnAddToCart: "Add to Cart 🛒",
      btnBuyNow: "Buy Now ⚡",
      tabIngredients: "Ingredients & Purity",
      tabHealth: "Health Benefits",
      tabStorage: "Storage & Shelf Life",
      tabReviews: "Customer Reviews",
      shelfLifeLabel: "Shelf Life:",
      storageLabel: "Storage:",
      allergensLabel: "Allergens:",
      packagingLabel: "Packaging:"
    },

    // Cart Drawer
    cart: {
      title: "Your Cart",
      freeDeliveryNote: "🚚 Free Delivery on all orders above ₹499",
      emptyMsg: "Your cart is currently empty. Add artisanal pickles to get started!",
      continueShopping: "Explore Products",
      subtotal: "Subtotal:",
      btnCheckout: "Proceed to Checkout 💳",
      toastAdded: "Added to cart! 🛒",
      toastRemoved: "Item removed from cart.",
      toastMax: "Maximum available stock reached."
    },

    // Quick Checkout Modal
    checkout: {
      title: "Quick Checkout",
      subtitle: "Fast 1-minute ordering with Cash on Delivery or UPI",
      nameLabel: "Full Name *",
      namePlaceholder: "e.g. Ramesh Kumar",
      phoneLabel: "Mobile Number (10 digits) *",
      phonePlaceholder: "e.g. 9876543210",
      addressLabel: "Delivery Address *",
      addressPlaceholder: "House no., street, landmark...",
      cityLabel: "City / Town *",
      cityPlaceholder: "e.g. Varanasi",
      stateLabel: "State *",
      statePlaceholder: "e.g. Uttar Pradesh",
      pincodeLabel: "Pincode *",
      pincodePlaceholder: "e.g. 221001",
      paymentTitle: "Select Payment Method",
      paymentCod: "Cash on Delivery (COD)",
      paymentCodSub: "Pay when you receive fresh pickles at your doorstep",
      paymentOnline: "UPI / Online Payment",
      paymentOnlineSub: "Google Pay, PhonePe, Paytm, Cards & Netbanking",
      btnPlaceOrder: "Confirm & Place Order 📦",
      btnPlacing: "Placing Order..."
    },

    // Global Footer
    footer: {
      brandDesc: "Handcrafted authentic Indian pickles, murabba, and traditional sweets made with pure cold-pressed mustard oil and ancestral recipes.",
      quickLinks: "Quick Links",
      policies: "Policies",
      customerCare: "Customer Support",
      phone: "Phone / WhatsApp: +91 92365 87600",
      email: "Email: satvikswaad.care@gmail.com",
      address: "Address: Varanasi, Uttar Pradesh, India",
      copyright: "© 2026 Satvik Swaad. All rights reserved."
    },

    // Floating Support Assistant
    assistant: {
      title: "Satvik Assistant",
      status: "Online | Handcrafted Support",
      welcome: "Namaste! 🙏 Welcome to Satvik Swaad. How may I help you with our artisanal pickles and traditional treats today?",
      chipTrack: "📦 Track My Order",
      chipWa: "💬 WhatsApp Support",
      chipPurity: "🌿 Purity & Mustard Oil",
      chipBestsellers: "🍯 Top Bestsellers",
      placeholder: "Ask about purity, orders, or recipes...",
      send: "Send"
    }
  },

  hi: {
    langToggleText: "English",
    langToggleAria: "अंग्रेजी में बदलें",
    brandSub: "शुद्ध पारंपरिक स्वाद",

    // Announcement Ticker
    ticker: [
      "✨ 100% माँ के हाथों से बने असली देसी अचार",
      "☀️ शुद्ध कच्ची घानी सरसों के तेल में 14 दिन धूप में पके",
      "👵 नानी-दादी की पुरानी पारंपरिक विधियां",
      "🌿 बिना किसी केमिकल व मिलावट के 100% शुद्ध",
      "🪔 असली गाँव का स्वाद व सोंधी खुशबू",
      "📦 हर हफ्ते ताजा और शुद्ध पैकिंग"
    ],

    // Header & Navigation
    nav: {
      home: "होम",
      products: "उत्पाद",
      whyUs: "हमारी खासियत",
      ourStory: "हमारी कहानी",
      reviews: "समीक्षाएं",
      faq: "FAQ",
      contact: "संपर्क",
      comparison: "तुलना",
      profile: "प्रोफ़ाइल",
      cart: "कार्ट",
      menu: "मेनू"
    },

    // Mobile Bottom Nav
    bottomNav: {
      home: "होम",
      products: "उत्पाद",
      cart: "कार्ट",
      profile: "प्रोफाइल"
    },

    // Trust Badges
    trust: {
      sunCuredTitle: "14 दिन धूप में पके",
      sunCuredDesc: "प्राकृतिक धूप की गर्माहट",
      oilTitle: "कच्ची घानी तेल",
      oilDesc: "शुद्ध सरसों का तेल",
      pureTitle: "100% केमिकल-मुक्त",
      pureDesc: "कोई प्रिज़र्वेटिव नहीं",
      recipeTitle: "पारंपरिक व्यंजन",
      recipeDesc: "असली खड़े मसाले"
    },

    // Reorder section
    reorder: {
      title: "पुनः ऑर्डर करें / दोबारा खरीदें",
      subtitle: "अपने पसंदीदा देसी स्वाद को एक क्लिक में दोबारा मंगाएं।",
      btnReorder: "ऑर्डर करें"
    },

    // Catalog & Products
    catalog: {
      heading: "हमारे सभी 15 पारंपरिक उत्पाद",
      badge: "गाँव की मिट्टी और धूप का असली स्वाद",
      searchPlaceholder: "🔍 आम, आंवला, मिर्च, मुरब्बा, लड्डू खोजें...",
      sortDefault: "नवीनतम पहले",
      sortPriceAsc: "कीमत: कम से ज्यादा",
      sortPriceDesc: "कीमत: ज्यादा से कम",
      sortNameAsc: "नाम: A से Z",
      tabs: {
        all: "सभी उत्पाद",
        achar: "पारंपरिक अचार (12)",
        murabba: "मुरब्बा (2)",
        sweets: "पारंपरिक मिठाइयां (8)",
        health: "स्वास्थ्यवर्धक उत्पाद (6)"
      },
      bestseller: "बेस्टसेलर",
      healthyChoice: "स्वास्थ्यवर्धक",
      inStock: "उपलब्ध है",
      outOfStock: "स्टॉक समाप्त",
      save: "बचत",
      availablePacks: "उपलब्ध पैक:",
      btnViewDetails: "विवरण देखें 👁️",
      btnAddCart: "कार्ट में जोड़ें 🛒",
      btnAdded: "जोड़ा गया! ✓",
      verifiedReviews: "सत्यापित ग्राहक समीक्षाएं"
    },

    // Product Details Page
    productDetails: {
      breadcrumbHome: "होम",
      breadcrumbProducts: "उत्पाद",
      selectPack: "पैक का आकार चुनें:",
      quantity: "मात्रा:",
      btnAddToCart: "कार्ट में जोड़ें 🛒",
      btnBuyNow: "अभी खरीदें ⚡",
      tabIngredients: "सामग्री व शुद्धता",
      tabHealth: "स्वास्थ्य लाभ",
      tabStorage: "रखरखाव व शेल्फ लाइफ",
      tabReviews: "ग्राहक समीक्षाएं",
      shelfLifeLabel: "शेल्फ लाइफ:",
      storageLabel: "रखरखाव:",
      allergensLabel: "एलर्जेंस:",
      packagingLabel: "पैकेजिंग:"
    },

    // Cart Drawer
    cart: {
      title: "आपकी कार्ट",
      freeDeliveryNote: "🚚 ₹499 से अधिक के ऑर्डर पर मुफ्त होम डिलीवरी",
      emptyMsg: "आपकी कार्ट अभी खाली है। पारंपरिक अचार और मुरब्बा जोड़ें!",
      continueShopping: "उत्पाद देखें",
      subtotal: "कुल योग:",
      btnCheckout: "चेकआउट करें 💳",
      toastAdded: "कार्ट में जोड़ दिया गया! 🛒",
      toastRemoved: "सामान कार्ट से हटा दिया गया।",
      toastMax: "उपलब्ध अधिकतम स्टॉक सीमा समाप्त।"
    },

    // Quick Checkout Modal
    checkout: {
      title: "आसान चेकआउट",
      subtitle: "1 मिनट में कैश ऑन डिलीवरी या UPI से सीधा ऑर्डर करें",
      nameLabel: "पूरा नाम *",
      namePlaceholder: "उदा. रमेश कुमार",
      phoneLabel: "मोबाइल नंबर (10 अंक) *",
      phonePlaceholder: "उदा. 9876543210",
      addressLabel: "डिलीवरी का पता *",
      addressPlaceholder: "मकान नं., गली, लैंडमार्क...",
      cityLabel: "शहर / कस्बा *",
      cityPlaceholder: "उदा. वाराणसी",
      stateLabel: "राज्य *",
      statePlaceholder: "उदा. उत्तर प्रदेश",
      pincodeLabel: "पिनकोड *",
      pincodePlaceholder: "उदा. 221001",
      paymentTitle: "भुगतान का तरीका चुनें",
      paymentCod: "कैश ऑन डिलीवरी (COD)",
      paymentCodSub: "जब शुद्ध अचार घर पहुंचे, तब भुगतान करें",
      paymentOnline: "ऑनलाइन भुगतान (UPI / कार्ड)",
      paymentOnlineSub: "Google Pay, PhonePe, Paytm, कार्ड व नेटबैंकिंग",
      btnPlaceOrder: "ऑर्डर कन्फर्म करें 📦",
      btnPlacing: "ऑर्डर दर्ज हो रहा है..."
    },

    // Global Footer
    footer: {
      brandDesc: "गाँव की खुशबू और माँ के हाथों का असली पारंपरिक स्वाद — शुद्ध कच्ची घानी सरसों के तेल व पारंपरिक विधियों से तैयार देसी अचार और मुरब्बे।",
      quickLinks: "जरूरी लिंक",
      policies: "हमारी नीतियां",
      customerCare: "ग्राहक सहायता",
      phone: "फोन / व्हाट्सएप: +91 92365 87600",
      email: "ईमेल: satvikswaad.care@gmail.com",
      address: "पता: वाराणसी, उत्तर प्रदेश, भारत",
      copyright: "© 2026 सात्विक स्वाद। सर्वाधिकार सुरक्षित।"
    },

    // Floating Support Assistant
    assistant: {
      title: "सात्विक सहायक",
      status: "ऑनलाइन | पारंपरिक सहायता",
      welcome: "नमस्ते! 🙏 सात्विक स्वाद में आपका स्वागत है। हमारे पारंपरिक अचार और मुरब्बों के बारे में आज हम आपकी क्या मदद कर सकते हैं?",
      chipTrack: "📦 मेरा ऑर्डर ट्रैक करें",
      chipWa: "💬 व्हाट्सएप सहायता",
      chipPurity: "🌿 शुद्धता व तेल",
      chipBestsellers: "🍯 लोकप्रिय उत्पाद",
      placeholder: "शुद्धता, ऑर्डर या रेसिपी के बारे में पूछें...",
      send: "भेजें"
    }
  }
};

/**
 * Get the currently active language ('en' | 'hi').
 * Defaults to 'en' (English).
 */
export function getCurrentLanguage() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_LANG);
      if (stored === 'hi' || stored === 'en') {
        return stored;
      }
    }
  } catch (e) {
    console.warn('localStorage read error:', e);
  }
  return 'en'; // Default English as requested
}

/**
 * Set the language ('en' | 'hi'), persist in localStorage, and apply to DOM.
 */
export function setLanguage(lang) {
  const target = (lang === 'hi') ? 'hi' : 'en';
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LANG, target);
    }
  } catch (e) {
    console.warn('localStorage save error:', e);
  }
  applyTranslations(target);
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = target;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: target } }));
  }
}

/**
 * Helper to fetch a nested string using dot-notation: t('nav.home')
 */
export function t(path, lang = null) {
  const currentLang = lang || getCurrentLanguage();
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const parts = path.split('.');
  let current = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English
      let fallback = TRANSLATIONS.en;
      for (const fpart of parts) {
        if (fallback && typeof fallback === 'object' && fpart in fallback) {
          fallback = fallback[fpart];
        } else {
          return path;
        }
      }
      return fallback;
    }
  }
  return current;
}

/**
 * Apply translations to all DOM elements across the page.
 */
export function applyTranslations(lang = null) {
  const activeLang = lang || getCurrentLanguage();
  const dict = TRANSLATIONS[activeLang];

  // 1. Update Language Toggle Button text
  const toggleBtns = document.querySelectorAll('.btn-lang-toggle, #btn-lang-toggle, #mobile-lang-toggle, .mobile-lang-toggle');
  toggleBtns.forEach(btn => {
    if (activeLang === 'en') {
      btn.innerHTML = `<span class="lang-icon">🌐</span> <span class="lang-toggle-text">हिन्दी</span>`;
      btn.setAttribute('aria-label', 'Switch to Hindi');
      btn.title = 'Switch to Hindi';
    } else {
      btn.innerHTML = `<span class="lang-icon">🌐</span> <span class="lang-toggle-text">English</span>`;
      btn.setAttribute('aria-label', 'Switch to English');
      btn.title = 'Switch to English';
    }
  });

  // 2. Brand sub text
  const brandSub = document.querySelector('.brand-sub');
  if (brandSub) brandSub.textContent = dict.brandSub;

  // 3. Main Navigation
  const navLinks = document.querySelectorAll('.main-nav .nav-link, .header-dropdown-menu .dropdown-nav-link, .mobile-nav-drawer .mobile-nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.includes('#hero') || href === 'index.html' || href === '/' || href.endsWith('/index.html')) {
      link.textContent = dict.nav.home;
    } else if (href.includes('products.html')) {
      link.textContent = dict.nav.products;
    } else if (href.includes('comparison')) {
      link.textContent = dict.nav.comparison;
    } else if (href.includes('why-us.html')) {
      link.textContent = dict.nav.whyUs;
    } else if (href.includes('our-story.html')) {
      link.textContent = dict.nav.ourStory;
    } else if (href.includes('reviews.html')) {
      link.textContent = dict.nav.reviews;
    } else if (href.includes('faq.html')) {
      link.textContent = dict.nav.faq;
    } else if (href.includes('contact.html')) {
      link.textContent = dict.nav.contact;
    }
  });

  // 4. Header Actions
  const btnProfile = document.getElementById('btn-open-profile');
  if (btnProfile) {
    const span = btnProfile.querySelector('span');
    if (span) span.textContent = `👤 ${dict.nav.profile}`;
  }

  const btnCart = document.getElementById('btn-open-cart');
  if (btnCart) {
    const span = btnCart.querySelector('span:first-child');
    if (span) span.textContent = `🛒 ${dict.nav.cart}`;
  }

  // 5. Mobile Bottom Nav
  const bNavHome = document.querySelector('#bottom-nav-home .bottom-nav-label');
  if (bNavHome) bNavHome.textContent = dict.bottomNav.home;
  const bNavProd = document.querySelector('#bottom-nav-products .bottom-nav-label');
  if (bNavProd) bNavProd.textContent = dict.bottomNav.products;
  const bNavCart = document.querySelector('#bottom-nav-cart .bottom-nav-label');
  if (bNavCart) bNavCart.textContent = dict.bottomNav.cart;
  const bNavProf = document.querySelector('#bottom-nav-profile .bottom-nav-label');
  if (bNavProf) bNavProf.textContent = dict.bottomNav.profile;

  // 6. Announcement Ticker
  const tickerGroups = document.querySelectorAll('.announcement-group');
  tickerGroups.forEach(grp => {
    const spans = grp.querySelectorAll('span');
    if (spans.length >= 6 && dict.ticker) {
      spans.forEach((s, idx) => {
        if (dict.ticker[idx]) s.textContent = dict.ticker[idx];
      });
    }
  });

  // 7. Trust Badges
  const trustCards = document.querySelectorAll('.trust-card');
  if (trustCards.length >= 4) {
    const items = [
      { t: dict.trust.sunCuredTitle, d: dict.trust.sunCuredDesc },
      { t: dict.trust.oilTitle, d: dict.trust.oilDesc },
      { t: dict.trust.pureTitle, d: dict.trust.pureDesc },
      { t: dict.trust.recipeTitle, d: dict.trust.recipeDesc }
    ];
    trustCards.forEach((card, idx) => {
      if (items[idx]) {
        const title = card.querySelector('.trust-title');
        const desc = card.querySelector('.trust-desc');
        if (title) title.textContent = items[idx].t;
        if (desc) desc.textContent = items[idx].d;
      }
    });
  }

  // 8. Reorder Section
  const reorderTitle = document.querySelector('.reorder-section .section-title');
  if (reorderTitle) reorderTitle.textContent = dict.reorder.title;
  const reorderSub = document.querySelector('.reorder-section .section-subtitle');
  if (reorderSub) reorderSub.textContent = dict.reorder.subtitle;
  const reorderBtns = document.querySelectorAll('.btn-reorder-add');
  reorderBtns.forEach(btn => {
    btn.textContent = `${dict.reorder.btnReorder} 🛒`;
  });

  // 9. Catalog Controls (Products page & Home section)
  const catHeading = document.querySelector('.products-section .section-title, #catalog .section-title');
  if (catHeading) catHeading.textContent = dict.catalog.heading;
  const catBadge = document.querySelector('.products-section .section-badge, #catalog .section-badge');
  if (catBadge) catBadge.textContent = dict.catalog.badge;

  const searchInputs = document.querySelectorAll('#search-input, .search-input');
  searchInputs.forEach(input => {
    input.placeholder = dict.catalog.searchPlaceholder;
  });

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect && sortSelect.options.length >= 4) {
    sortSelect.options[0].text = dict.catalog.sortDefault;
    sortSelect.options[1].text = dict.catalog.sortPriceAsc;
    sortSelect.options[2].text = dict.catalog.sortPriceDesc;
    sortSelect.options[3].text = dict.catalog.sortNameAsc;
  }

  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    const cat = tab.getAttribute('data-category');
    if (cat && dict.catalog.tabs[cat]) {
      const span = tab.querySelector('span');
      if (span) {
        span.textContent = dict.catalog.tabs[cat];
      } else {
        tab.textContent = dict.catalog.tabs[cat];
      }
    }
  });

  // 10. Product Cards (Dynamic titles, badges, and buttons)
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const pId = card.getAttribute('data-product-id');
    const badge = card.querySelector('.product-badge');
    const stock = card.querySelector('.stock-status-badge');
    const viewBtn = card.querySelector('.btn-view-details');
    const addBtn = card.querySelector('.btn-add-cart');

    if (badge) {
      if (badge.textContent.includes('Bestseller') || badge.textContent.includes('बेस्टसेलर')) {
        badge.textContent = dict.catalog.bestseller;
      } else if (badge.textContent.includes('Healthy') || badge.textContent.includes('स्वास्थ्य')) {
        badge.textContent = dict.catalog.healthyChoice;
      }
    }

    if (stock) {
      if (stock.textContent.includes('In Stock') || stock.textContent.includes('उपलब्ध')) {
        stock.textContent = dict.catalog.inStock;
      } else if (stock.textContent.includes('Out') || stock.textContent.includes('समाप्त')) {
        stock.textContent = dict.catalog.outOfStock;
      }
    }

    if (viewBtn) viewBtn.textContent = dict.catalog.btnViewDetails;
    if (addBtn && !addBtn.classList.contains('added')) {
      const span = addBtn.querySelector('span');
      if (span) {
        span.textContent = dict.catalog.btnAddCart;
      } else {
        addBtn.textContent = dict.catalog.btnAddCart;
      }
    }
  });

  // 11. Cart Drawer Static Labels
  const cartDrawerTitle = document.querySelector('#cart-drawer .cart-drawer-title');
  if (cartDrawerTitle) cartDrawerTitle.textContent = dict.cart.title;
  const cartFreeDeliv = document.querySelector('#cart-drawer .free-shipping-text');
  if (cartFreeDeliv) cartFreeDeliv.textContent = dict.cart.freeDeliveryNote;
  const cartSubtotalLabel = document.querySelector('#cart-drawer .cart-subtotal-label');
  if (cartSubtotalLabel) cartSubtotalLabel.textContent = dict.cart.subtotal;
  const cartCheckoutBtn = document.getElementById('btn-checkout');
  if (cartCheckoutBtn) cartCheckoutBtn.textContent = dict.cart.btnCheckout;

  // 12. Checkout Modal Labels
  const chkTitle = document.querySelector('#checkout-modal .modal-title');
  if (chkTitle) chkTitle.textContent = dict.checkout.title;
  const chkSub = document.querySelector('#checkout-modal .modal-subtitle');
  if (chkSub) chkSub.textContent = dict.checkout.subtitle;
  const chkBtn = document.getElementById('btn-place-order');
  if (chkBtn) chkBtn.textContent = dict.checkout.btnPlaceOrder;

  // 13. Global Footer
  const footerBrandDesc = document.querySelector('.footer-brand-desc');
  if (footerBrandDesc) footerBrandDesc.textContent = dict.footer.brandDesc;
  const footerHeadings = document.querySelectorAll('.footer-col-title');
  if (footerHeadings.length >= 3) {
    footerHeadings[0].textContent = dict.footer.quickLinks;
    footerHeadings[1].textContent = dict.footer.policies;
    footerHeadings[2].textContent = dict.footer.customerCare;
  }
  const footerCopy = document.querySelector('.footer-copyright');
  if (footerCopy) footerCopy.textContent = dict.footer.copyright;

  // 14. Floating Support Assistant
  const agentTitle = document.querySelector('.agent-header-name');
  if (agentTitle) agentTitle.textContent = dict.assistant.title;
  const agentStatus = document.querySelector('.agent-header-status');
  if (agentStatus) agentStatus.innerHTML = `<span class="agent-online-dot" aria-hidden="true"></span> ${dict.assistant.status}`;
  const agentWelcome = document.querySelector('.agent-msg-bot p');
  if (agentWelcome) agentWelcome.textContent = dict.assistant.welcome;
  const agentChips = document.querySelectorAll('.agent-chip');
  if (agentChips.length >= 4) {
    agentChips[0].textContent = dict.assistant.chipTrack;
    agentChips[1].textContent = dict.assistant.chipWa;
    agentChips[2].textContent = dict.assistant.chipPurity;
    agentChips[3].textContent = dict.assistant.chipBestsellers;
  }
  const agentInput = document.getElementById('agent-input');
  if (agentInput) agentInput.placeholder = dict.assistant.placeholder;

  // 15. Dynamic data-i18n attributes for custom tags
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translation = t(key, activeLang);
      if (translation && translation !== key) {
        el.textContent = translation;
      }
    }
  });

  // 16. Subpage Breadcrumbs & Headings
  const breadcrumbLinks = document.querySelectorAll('.breadcrumbs a, .breadcrumb-inner a');
  breadcrumbLinks.forEach(a => {
    const txt = a.textContent.trim().toLowerCase();
    if (a.getAttribute('href') === 'index.html' || txt === 'home' || txt === 'होम') {
      a.textContent = dict.nav.home;
    } else if (a.getAttribute('href') === 'products.html' || txt === 'products' || txt === 'उत्पाद') {
      a.textContent = dict.nav.products;
    }
  });

  const breadcrumbStrong = document.querySelector('.breadcrumbs strong, .breadcrumb-inner .current:not(#pd-breadcrumb-title)');
  if (breadcrumbStrong) {
    const text = breadcrumbStrong.textContent.trim().toLowerCase();
    if (text.includes('why') || text.includes('खासियत')) breadcrumbStrong.textContent = dict.nav.whyUs;
    else if (text.includes('story') || text.includes('कहानी')) breadcrumbStrong.textContent = dict.nav.ourStory;
    else if (text.includes('review') || text.includes('समीक्षा')) breadcrumbStrong.textContent = dict.nav.reviews;
    else if (text.includes('faq')) breadcrumbStrong.textContent = dict.nav.faq;
    else if (text.includes('contact') || text.includes('संपर्क')) breadcrumbStrong.textContent = dict.nav.contact;
    else if (text.includes('product') || text.includes('उत्पाद')) breadcrumbStrong.textContent = dict.nav.products;
    else if (text.includes('profile') || text.includes('प्रोफाइल')) breadcrumbStrong.textContent = dict.nav.profile;
  }
}

