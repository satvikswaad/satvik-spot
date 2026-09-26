/**
 * Satvik Swaad — Tri-Lingual Internationalization (i18n) Engine & Translations
 * Supports English (en), Hindi (hi), and Urdu (ur) with persistent user selection across all pages.
 * Includes Proxy Translation Engine, RTL/LTR direction controller, and dropdown language selector.
 */

import { PRODUCTS_CATALOGUE } from './productsData.js';

export const STORAGE_KEY_LANG = 'app_language';
export const LEGACY_STORAGE_KEY_LANG = 'satvik_lang';

export const LANG_LABELS = {
  en: 'English',
  hi: 'हिन्दी',
  ur: 'اردو'
};

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
      heading: "All 17 Handcrafted Products",
      badge: "Pure Taste of Tradition",
      searchPlaceholder: "Search for pickles, sweets...",
      sortDefault: "Newest First",
      sortPriceAsc: "Price: Low to High",
      sortPriceDesc: "Price: High to Low",
      sortNameAsc: "Name: A to Z",
      sortRating: "Top Rated",
      tabs: {
        all: "All Products (17)",
        achar: "Pickles (9)",
        murabba: "Murabba (2)",
        sweets: "Sweets (3)",
        health: "Health Products (3)"
      },
      bestseller: "Bestseller",
      healthyChoice: "Healthy Choice",
      newBadge: "New",
      traditionalRecipe: "Traditional Recipe",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      save: "Save",
      saveTag: "Save",
      availablePacks: "Available Packs:",
      btnViewDetails: "View Details 👁️",
      btnAddCart: "Add to Cart",
      btnAdded: "Added! ✓",
      verifiedReviews: "verified reviews",
      catAcharTitle: "Pickles & Achar",
      catAcharCount: "9 Authentic Recipes",
      catSweetsTitle: "Sweets & Murabba",
      catSweetsCount: "5 Heritage Delicacies",
      catHealthTitle: "Health & Purity",
      catHealthCount: "3 Ayurvedic Preserves",
      catAllTitle: "All Products",
      catAllCount: "17 Handcrafted Items",
      villageCategoriesBadge: "Handmade in Nizamabad",
      villageCategoriesTitle: "Explore Village Categories",
      filterBy: "Filter by",
      price: "Price",
      sortBy: "Sort by",
      showingProducts: "Showing all handcrafted products",
      pickYourFavourite: "Pick Your Favourite",
      under200: "Under ₹200",
      price200_400: "₹200 – ₹400",
      price401_600: "₹401 – ₹600",
      above600: "Above ₹600",
      availability: "Availability",
      reviewsCount: "reviews",
      offTag: "OFF"
    },

    // Product Details Page
    productDetails: {
      breadcrumbHome: "Home",
      breadcrumbProducts: "Products",
      selectPack: "Select Pack Size / Weight:",
      quantity: "Quantity:",
      btnAddToCart: "Add to Cart 🛒",
      btnBuyNow: "Instant Checkout (Buy Now) ⚡",
      tabIngredients: "Ingredients & Purity",
      tabHealth: "Health Benefits",
      tabStorage: "Storage & Shelf Life",
      tabReviews: "Customer Reviews",
      shelfLifeLabel: "Verified Shelf Life:",
      storageLabel: "Storage Instructions:",
      allergensLabel: "Allergen Notice:",
      packagingLabel: "Packaging Quality:",
      specsTitle: "Authentic Product Specifications & Quality Assurances",
      heritageDescTitle: "Traditional Heritage & Full Description",
      ingredientsTitle: "Pure & Authentic Ingredients",
      storageTitle: "Storage Instructions & Natural Shelf Life",
      allergenTitle: "Allergen & Packaging Safeguards",
      verifiedReviews: "Verified Customer Reviews",
      reviewsSub: "Authentic feedback from homes that cherish generational taste.",
      allReviewsBtn: "All Reviews →",
      writeReview: "Write a Review",
      addReviewTitle: "Add Your Review",
      namePlaceholder: "Your Name",
      reviewPlaceholder: "Share your experience with this preserve...",
      btnSubmitReview: "Submit Review ⭐",
      ratingBreakdown: "Rating Breakdown",
      relatedTitle: "You Might Also Cherish",
      relatedSub: "Complementary homemade pickles and festive preserves handcrafted with the same devotion.",
      inStock: "● In Stock",
      outOfStock: "● Out of Stock",
      onlyLeft: "● Only {count} left — Hurry!",
      inclusiveTaxes: "Inclusive of all taxes",
      skuLabel: "SKU:",
      freeTransit: "Free Transit Replacement",
      freshBatches: "Fresh Batches Made Weekly",
      perkDispatch: "Dispatched within 24–48 hours across 19,000+ pincodes",
      perkPayment: "Safe & Encrypted Online Payment (UPI, Cards, NetBanking) & COD",
      perkReplacement: "100% Free Replacement for any transit breakage or leakage"
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
      brandDesc: "At Satvik Swaad, we craft authentic, homemade pickles and traditional delicacies that bring the sacred essence of generational purity to your everyday life.",
      quickLinks: "QUICK LINKS",
      contactHeading: "CONTACT",
      callSupport: "CALL SUPPORT",
      messageUs: "MESSAGE US",
      emailResponse: "EMAIL RESPONSE IN 24H",
      phone: "Phone / WhatsApp: +91 92365 87600",
      email: "Email: satvikswaad.care@gmail.com",
      address: "Address: Varanasi, Uttar Pradesh, India",
      links: {
        ourCollection: "Our Collection",
        picklesAchar: "Pickles & Achar",
        sweetsMurabba: "Sweets & Murabba",
        ourHeritageStory: "Our Heritage Story",
        healthPurityPromise: "Health & Purity Promise",
        faqs: "FAQs",
        returnRefundPolicy: "Return & Refund Policy",
        shippingPolicy: "Shipping Policy",
        privacyPolicy: "Privacy Policy",
        cookiesPolicy: "Cookies Policy",
        termsOfService: "Terms of Service"
      },
      newsletter: {
        title: "Stay in the loop",
        desc: "Get fresh updates on seasonal achar, homemade amla murabba, traditional laddus & festive treats.",
        placeholder: "Enter your email address",
        subscribeBtn: "Subscribe",
        footnote: "100% Homemade & Pure • Unsubscribe anytime."
      },
      copyright: "© 2026 Satvik Swaad. All rights reserved.",
      tagline: "Crafted with ❤️ in India | Pure Taste of Tradition"
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
    },

    // Homepage Structured Sections
    home: {
      hero: {
        tagline: "Achaar jo dil se bana, maa ke haathon ka asli swaad ❤️",
        subTagline: "maa ke swaad ki virasat, beti ke sapno ki pehchaan",
        slide1Alt: "Satvik Swaad Authentic Indian Homemade Pickles - Achaar jo dil se bana, maa ke haathon ka asli swaad",
        slide2Alt: "Satvik Swaad 14-Day Sun-Cured Pickles in Kachi Ghani Mustard Oil",
        slide3Alt: "Satvik Swaad Farm Fresh Ingredients - Maa ke swaad ki virasat, beti ke sapno ki pehchaan",
        captions: [
          "Handcrafted in Nizamabad with Ancestral Love",
          "14-Day Sun-Cured in Pure Mustard Oil",
          "Farm Fresh Ingredients & Pure Generational Taste"
        ],
        ctaShop: "Shop Now",
        ctaStory: "Our Story",
        ctaExplore: "Explore Pure Preserves"
      },
      villageCategories: {
        eyebrow: "Handmade in Nizamabad",
        title: "Explore Village Categories",
        acharTitle: "Pickles & Achar",
        acharBadge: "9 Authentic Recipes",
        sweetsTitle: "Sweets & Murabba",
        sweetsBadge: "5 Heritage Delicacies",
        healthTitle: "Health & Purity",
        healthBadge: "3 Ayurvedic Preserves",
        allTitle: "All Products",
        allBadge: "15 Handcrafted Items"
      },
      whyChoose: {
        eyebrow: "Authentic Quality Pillars",
        titlePrefix: "Why Choose",
        titleHighlight: "Satvik Swaad",
        desc: "We take immense pride in crafting authentic Indian pickles, murabbas, and traditional sweets without compromising on purity, ancestral recipes, or natural aging techniques.",
        doodlePure: "Pure",
        doodleDesi: "Desi",
        doodleHealthy: "Healthy",
        paperNote: "Pure Traditional Goodness"
      },
      qualityPillars: {
        p1Title: "Sun-Cured Maturity",
        p1Desc: "Naturally sun-cured for rich flavour, natural probiotic balance and authentic generational taste.",
        p2Title: "Cold-Pressed Mustard Oil",
        p2Desc: "Rich in authentic pungency and natural antioxidants, free from chemical refinement or adulteration.",
        p3Title: "Zero Chemical Preservatives",
        p3Desc: "Free from Sodium Benzoate, synthetic vinegar, artificial food colors and industrial additives.",
        p4Title: "Ancestral Family Recipes",
        p4Desc: "Passed down through maternal generations in Nizamabad, crafted with sacred patience and handmade care."
      },
      comparison: {
        subtitle: "Artisanal Purity vs. Mass-Market Industrial Methods",
        title: "Satvik Swaad vs. Typical Market Products",
        colDim: "Evaluation Dimension",
        colSatvikTitle: "Satvik Swaad",
        colSatvikSub: "Artisanal Home-Style Methods",
        colMarketTitle: "Typical Mass-Market Products",
        colMarketSub: "Standard Commercial Alternatives",
        rows: [
          {
            dim: "Oil Base",
            satvikTag: "100% Cold-Pressed",
            satvikText: "100% Cold-Pressed Kachi Ghani Mustard Oil. Retains natural antioxidants, authentic pungency, and vital fatty acids without chemical refinement.",
            marketTag: "Refined Blends",
            marketText: "Refined Palm / Cottonseed Oil blends & chemical antioxidants (TBHQ). Extracted using high-heat industrial solvent processes."
          },
          {
            dim: "Preservation Method",
            satvikTag: "Sun-Cured & Rock Salt",
            satvikText: "Traditional rock salt (Sendha Namak), turmeric, cold-pressed oil seal & multi-day sun-curing. Relies on natural osmotic pressure and bio-active preservation.",
            marketTag: "Synthetic Preservatives",
            marketText: "Synthetic chemical preservatives (Sodium Benzoate INS 211, Potassium Metabisulphite INS 224). Added to extend warehouse shelf stability."
          },
          {
            dim: "Acidity & Souring",
            satvikTag: "Natural Raw Fruit Acids",
            satvikText: "Natural sun-dried raw mango (Amchur), whole fresh lime juice & natural fermentation. Organic fruit acids mature gradually under ambient sunlight.",
            marketTag: "Synthetic Acidulants",
            marketText: "Industrial Glacial Acetic Acid (Synthetic Vinegar INS 260). Concentrated chemical acidulants added for instant artificial tartness."
          },
          {
            dim: "Processing & Batching",
            satvikTag: "Glass-Jar Micro-Batches",
            satvikText: "Micro-batches (< 50kg) sun-cured naturally in glass jars. Allows individual monitoring, gentle stirring, and unhurried natural curing.",
            marketTag: "Mechanized High-Heat",
            marketText: "Continuous high-heat industrial kettle cooking & rapid mechanized packing. High-speed automated manufacturing lines to maximize unit throughput."
          },
          {
            dim: "Sweetener Base (Murabbas & Sweets)",
            satvikTag: "Desi Khand & A2 Ghee",
            satvikText: "Traditional Desi Khand / Organic Jaggery / Pure A2 Cow Ghee. Rich in natural minerals, prepared without chemical bleaching or industrial hydrogenation.",
            marketTag: "Refined Sugars & Fats",
            marketText: "Commercial refined white sugar, high-fructose corn syrup & hydrogenated vegetable fats (Vanaspati). Chemically bleached sucrose and trans-fat shortenings."
          },
          {
            dim: "Spices & Aromatics",
            satvikTag: "Stone-Ground Whole Spices",
            satvikText: "Hand-cleaned, stone-ground whole roasted spices (Saunf, Kalonji, Rai, Methi, Hing). Retains natural volatile essential oils and fresh pungent aromas.",
            marketTag: "Extracts & Oleoresins",
            marketText: "Solvent-extracted spice powders, oleoresins & artificial essence blends. De-oiled spent powders supplemented with synthetic flavoring agents."
          },
          {
            dim: "Regulatory & Lab Verification",
            satvikTag: "Third-Party Panel Testing",
            satvikText: "NABL-accredited laboratory panel testing (heavy metals, microbial limits, pesticide residue) & FSSAI standards. Validated safety and quality parameters.",
            marketTag: "Baseline Statutory",
            marketText: "Standard commercial compliance. Baseline statutory minimum compliance without specialized small-batch purity audits."
          }
        ],
        noticeTitle: "Pre-Launch Lab Audit Notice",
        noticeDesc: "All batch-specific microbiological parameters, shelf-life evaluations, and nutritional claims will be validated by NABL-accredited third-party laboratories/test certificates and archived under our FSSAI compliance record prior to commercial retail dispatch.",
        disclaimer: "Disclaimer: Comparison is based on customary manufacturing practices of mass-market commercial condiments versus artisanal home-style preparation methods. It does not target, disparage, or reference any specific manufacturer or trademarked brand.",
        complianceTitle: "Transparent Compliance & Licensing Status",
        complianceSub: "At Satvik Swaad, transparency with our customers is paramount:",
        fssaiLabel: "FSSAI Registration / License:",
        fssaiStatus: "Currently PENDING Approval.",
        gstinLabel: "GSTIN Registration:",
        gstinStatus: "Currently PENDING Issuance.",
        pkgLabel: "Packaging Standards:",
        pkgStatus: "Food-grade glass & BPA-free airtight jars.",
        btnExplore: "Explore 15 Products →",
        btnStory: "Read Our Brand Story →"
      },
      reorder: {
        subtitle: "Quick & Easy",
        title: "🔄 Buy Again & Quick Reorder",
        lead: "Reorder your handcrafted traditional favorites in a single tap.",
        btnReorder: "Reorder"
      },
      about: {
        subtitle: "Our Heritage & Promise",
        title: "The Satvik Swaad Story",
        desc: "Every jar of Satvik Swaad pickle, murabba, laddu, and chyawanprash is prepared in small artisanal batches following time-tested family recipes passed down through generations. We use zero artificial preservatives, synthetic colors, or refined oils.",
        cta: "Read Full Brand Story & Values →"
      },
      complianceNote: "Real Ingredients. Real Trust."
    },

    // Our Story Page Structured Sections
    ourStory: {
      hero: {
        title: "Our Journey: A Legacy of Purity, Taste & Tradition",
        subtitle: "Handcrafted with maternal devotion in Nizamabad"
      },
      origin: {
        doodleLove: "Same Love Since Generations ↴ ♡",
        polaroidCaption: "Maa ke swaad ki virasat ♡",
        journeyTitle: "Our Journey",
        journeySubtitle: "A legacy of purity, taste and tradition"
      },
      grandmaLegacy: {
        p1: "At Satvik Swaad, our journey began with a simple belief — that real food has the power to bring people together."
      },
      womenArtisans: {
        p2: "Rooted in our ancestral home in Nizamabad, we cherish the sacred recipes passed down by our grandmothers. Handcrafted by local women artisans, every jar is slowly matured in traditional earthen barnis under the golden sun."
      },
      traditionalProcess: {
        p3: "We refuse shortcuts. Using only first-press mustard oil, whole hand-ground spices, and unrefined sweeteners, we preserve the true heirloom flavors of India with love, integrity, and sacred care."
      },
      heritageValues: {
        learnMore: "Learn More →",
        badge1Title: "Pure Ingredients",
        badge1Desc: "Only the best, nothing artificial.",
        badge2Title: "Traditional Recipes",
        badge2Desc: "Timeless taste, passed down for generations.",
        badge3Title: "No Synthetic Additives",
        badge3Desc: "Just natural goodness & pure care.",
        badge4Title: "Made in India",
        badge4Desc: "Supporting local, celebrating our heritage."
      }
    },

    // Why Us / Health & Purity Structured Sections
    whyUs: {
      hero: {
        title: "Health & Purity: The Satvik Standard",
        subtitle: "Ancestral wisdom backed by modern food safety"
      },
      manifesto: {
        heading: "Our Purity Manifesto",
        text: "We believe food should nourish the body and soul. In an era of mass-produced chemical condiments, Satvik Swaad returns to the sacred roots of Indian culinary preservation — where pure cold-pressed mustard oil, natural sunlight, and ancient rock salt create preserves that live, breathe, and heal."
      },
      oilPurity: {
        title: "Cold-Pressed Mustard Oil",
        desc: "Rich in MUFA, Omega-3 & natural antioxidants. Fights bad cholesterol and stimulates natural digestion without hexane solvents."
      },
      sunCuring: {
        title: "14-Day Solar Maturity",
        desc: "Slow solar exposure in traditional glass barnis naturally eliminates moisture, concentrates spice pungency, and cures fruits gently."
      },
      noChemicals: {
        title: "Zero Chemical Preservatives",
        desc: "Free from Sodium Benzoate, Potassium Metabisulphite, synthetic vinegar, artificial colorings, and trans-fats."
      },
      rockSalt: {
        title: "Himalayan Pink Rock Salt",
        desc: "Unrefined pink rock salt containing 84+ essential trace minerals, aiding alkalinity and avoiding chemical anti-caking agents."
      },
      labTesting: {
        title: "Rigorous Lab Certification",
        desc: "Microbial purity, zero pesticide residues, and heavy metal limits verified by NABL-accredited test standards."
      },
      trustBadge: {
        title: "100% Satvik Purity Guarantee",
        desc: "Handmade in sacred cleanliness, zero onion, zero garlic, generational authenticity."
      }
    },
    contact: {
      "heading": "Contact Satvik Swaad",
      "heroTop": "Get in",
      "heroScript": "Touch",
      "heroSubtitle": "We'd Love to Hear from You",
      "note": "Your Feedback Matters",
      "doodle": "Pure Desi Goodness",
      "breadcrumb": "Contact Us",
      "formTitle": "Send Us a Message",
      "formSubtitle": "We are here to help! Fill out the form below and we'll get back to you soon.",
      "labels": {
            "name": "Name *",
            "email": "Email *",
            "phone": "Phone *",
            "subject": "Subject *",
            "orderId": "Order ID (Optional)",
            "message": "Message *"
      },
      "placeholders": {
            "name": "Your name",
            "email": "your@email.com",
            "phone": "Your phone number",
            "orderId": "e.g. SS-2026-1042",
            "message": "Type your message here..."
      },
      "subjectOptions": {
            "default": "Select a subject",
            "general": "General Enquiry",
            "order": "Order Support",
            "bulk": "Bulk / Gifting Order",
            "feedback": "Feedback",
            "partnership": "Partnership"
      },
      "btnSubmit": "Send Message",
      "successMsg": "✅ Thank you! Your message has been sent.",
      "info": {
            "kitchenTitle": "Our Heritage Kitchen",
            "kitchenUnit": "Satvik Swaad Traditional Preserves Unit",
            "kitchenAddress": "Village & Post – Kothapalli, Dist. – Nizamabad, 503001",
            "fssai": "FSSAI Reg. No.: 22724113000000",
            "phoneTitle": "Phone & Direct WhatsApp",
            "phoneHours": "(Mon – Sat: 9:00 AM – 6:00 PM IST)",
            "emailTitle": "Direct Care Email",
            "grievanceTitle": "Order Assistance & Grievance",
            "grievanceOfficer": "Nodal Officer: Customer Grievance Desk",
            "grievanceResolution": "Resolution Window: 24–48 Business Hours"
      },
      "merchant": {
            "title": "Merchant Identification Card",
            "legalLabel": "Legal Operating Entity",
            "legalValue": "Satvik Swaad Traditional Preserves",
            "addressLabel": "Registered Business Address",
            "addressValue": "Village & Post Kothapalli, Nizamabad, Telangana – 503001, India",
            "fssaiLabel": "Food Safety Standard",
            "fssaiValue": "FSSAI Registration No. 22724113000000",
            "helplineLabel": "Official Helpline",
            "emailLabel": "Email",
            "gatewayLabel": "Authorized Payment Gateway",
            "gatewayValue": "PayU Payments Private Limited (Cards, UPI, Net Banking)",
            "redressalLabel": "Consumer Grievance Redressal",
            "redressalValue": "Dedicated officer responds within 24h"
      },
      "guarantee": {
            "title": "Direct & Secure Communication Guarantee",
            "spamPolicyLabel": "Zero Spam Policy",
            "spamPolicyText": "Satvik Swaad does not send or provide third-party message or promotional mail services. All order updates and conversations are conducted 100% privately and securely via our verified WhatsApp (+91 92365 87600) and official care inbox (satvikswaad.care@gmail.com)."
      },
      "villageKitchen": {
            "badge": "Fresh Batch",
            "title": "📍 Village Kitchen Direct",
            "desc": "Handcrafted fresh batches prepared weekly by our village mothers in Nizamabad.",
            "waBtn": "Chat on WhatsApp: +91 92365 87600"
      },
      "polaroidCaption": "Maa ke swaad ki virasat",
      "doodleLines": [
            "Same",
            "Love",
            "Since",
            "Generations"
      ]
},

    faq: {
      "heroTop": "Frequently Asked",
      "heroScript": "Questions",
      "heroSubtitle": "We're here to help!",
      "note": "Got Questions? We've Got Answers!",
      "doodle": "Pure Desi Goodness",
      "breadcrumb": "Frequently Asked Questions",
      "sectionTitle": "Common Questions",
      "sectionSubtitle": "Find quick answers to your most asked questions.",
      "searchPlaceholder": "🔍 Search questions...",
      "categories": {
            "general": "General",
            "orders": "Orders & Shipping",
            "products": "Products & Ingredients",
            "payments": "Payments & Refunds",
            "account": "Account & Profile",
            "others": "Others"
      },
      "guaranteeTitle": "Direct Communication Guarantee",
      "guaranteeText": "Satvik Swaad does not send or provide third-party message or promotional mail services. All order updates and customer conversations are conducted 100% privately and securely via our verified WhatsApp (+91 92365 87600) and official care email (satvikswaad.care@gmail.com). We will never spam you or share your details with marketing agencies.",
      "items": {
            "general": [
                  {
                        "q": "Are your products 100% natural?",
                        "a": "Yes. Every Satvik Swaad product is made with pure, natural ingredients — no synthetic colours, flavours or preservatives, ever."
                  },
                  {
                        "q": "How long does delivery take?",
                        "a": "Orders are typically dispatched within 24–48 hours and delivered within 3–7 business days depending on your location."
                  },
                  {
                        "q": "Can I track my order?",
                        "a": "Absolutely. Once your order ships, your tracking link and live courier updates are sent directly and privately via verified WhatsApp (+91 92365 87600) and your official email."
                  },
                  {
                        "q": "What is your Direct Communication Guarantee? Will I receive marketing spam?",
                        "a": "Satvik Swaad does not send or provide third-party message or promotional mail services. All order updates and customer conversations are conducted 100% privately and securely via our verified WhatsApp (+91 92365 87600) and official care email (satvikswaad.care@gmail.com). We will never spam you or share your details with marketing agencies."
                  },
                  {
                        "q": "Will I receive promotional messages, marketing emails, or spam?",
                        "a": "No, never. Satvik Swaad maintains a strict zero-spam guarantee. We do not operate bulk marketing broadcasts, promotional email newsletters, or automated SMS campaigns. All communications are direct, private, and 100% secured."
                  },
                  {
                        "q": "What is your return and refund policy?",
                        "a": "Because our products are consumable homemade food items sealed in glass jars, we do not accept returns once delivered. However, we provide a 100% Free Replacement Guarantee for any jars damaged or leaking in transit (report within 24–48h with photos), and full refunds for pre-dispatch cancellations within 2 hours."
                  },
                  {
                        "q": "Do you offer COD (Cash on Delivery)?",
                        "a": "Yes, Cash on Delivery is available across most serviceable pin codes in India at checkout."
                  },
                  {
                        "q": "Are your products safe for children?",
                        "a": "Our sweets and health products are family-friendly. Pickles are spiced traditionally, so we recommend mild options for young children."
                  }
            ],
            "orders": [
                  {
                        "q": "Do you ship across India?",
                        "a": "Yes, we ship to serviceable pin codes across India. International shipping is coming soon."
                  },
                  {
                        "q": "What are the shipping charges?",
                        "a": "Shipping is free on orders above ₹499. A small flat fee applies to smaller orders."
                  },
                  {
                        "q": "Can I change my delivery address?",
                        "a": "You can update your address from your profile before the order is dispatched."
                  }
            ],
            "products": [
                  {
                        "q": "What oil do you use in pickles?",
                        "a": "We use pure cold-pressed mustard oil, rich in flavour and free from harmful chemicals."
                  },
                  {
                        "q": "How should I store the pickles?",
                        "a": "Store in a cool, dry place away from direct sunlight and always use a clean, dry spoon."
                  },
                  {
                        "q": "What is the shelf life?",
                        "a": "Pickles stay fresh for up to 12 months; sweets are best enjoyed within 15–30 days."
                  }
            ],
            "payments": [
                  {
                        "q": "Which payment methods do you accept?",
                        "a": "UPI, all major cards, net banking, popular wallets, and Cash on Delivery."
                  },
                  {
                        "q": "How long do refunds take?",
                        "a": "Approved refunds are processed within 5–7 business days to your original payment method."
                  }
            ],
            "account": [
                  {
                        "q": "How do I create an account?",
                        "a": "You can sign up with your email or continue with your Google account in seconds."
                  },
                  {
                        "q": "Can I save multiple addresses?",
                        "a": "Yes, add and manage multiple delivery addresses from your profile."
                  }
            ],
            "others": [
                  {
                        "q": "Do you take bulk / gifting orders?",
                        "a": "Yes! Reach out via our Contact page for bulk, corporate and festive gifting orders."
                  },
                  {
                        "q": "How can I partner with Satvik Swaad?",
                        "a": "We love collaborations. Drop us a message through the Contact page and our team will connect with you."
                  }
            ]
      }
},

    reviews: {
      "heroTop": "What Our",
      "heroScript": "Customers Say",
      "heroSubtitle": "Real People • Real Experiences • Real Flavours",
      "doodleGoodness": "Natural Goodness Always",
      "breadcrumb": "Customer Reviews",
      "sectionTitle": "Customer Reviews",
      "sectionSubtitle": "What our happy customers say about us",
      "marginDoodle": [
            "Real",
            "Reviews",
            "Real People"
      ],
      "trustNote": "Your Trust Matters",
      "summary": {
            "rating": "4.8",
            "max": "5",
            "countText": "based on 500+ verified customer reviews",
            "starsBreakdown": {
                  "star5": "5 Star (88%)",
                  "star4": "4 Star (9%)",
                  "star3": "3 Star (2%)",
                  "star2": "2 Star (1%)",
                  "star1": "1 Star (0%)"
            }
      },
      "filterTabs": {
            "all": "All Reviews",
            "achar": "Pickles & Achar",
            "sweets": "Traditional Sweets",
            "murabba": "Murabba"
      },
      "btnWriteReview": "✍️ Write a Customer Review",
      "form": {
            "title": "Write a Review",
            "subtitle": "Share your authentic experience with Satvik Swaad",
            "nameLabel": "Your Name *",
            "namePlaceholder": "e.g. Ananya Roy",
            "productLabel": "Product Purchased *",
            "productPlaceholder": "Select a Product",
            "ratingLabel": "Rating *",
            "commentLabel": "Your Review *",
            "commentPlaceholder": "Tell us about the aroma, mustard oil purity, crunch, and authentic home taste...",
            "btnSubmit": "Submit Review",
            "successMsg": "✅ Thank you! Your review has been submitted for verification."
      },
      "staticCards": [
            {
                  "name": "Priya Sharma",
                  "quote": "\"The taste is absolutely authentic! You can really feel the traditional flavours in every bite. My family loves it!\"",
                  "product": "Hara Mirch Pickle",
                  "verified": "✅ Verified Purchase"
            },
            {
                  "name": "Rohit Verma",
                  "quote": "\"Great quality and pure ingredients. The packaging is also very good. Will definitely order again!\"",
                  "product": "Amla Powder",
                  "verified": "✅ Verified Purchase"
            },
            {
                  "name": "Neha Gupta",
                  "quote": "\"I tried the sweets and pickles both. Everything is so fresh, tasty and homemade. Highly recommended!\"",
                  "product": "Besan Barfi",
                  "verified": "✅ Verified Purchase"
            },
            {
                  "name": "Amit Singh",
                  "quote": "\"Finally found a brand that keeps tradition alive. The quality, taste and purity are simply outstanding.\"",
                  "product": "Mix Veg Pickle",
                  "verified": "✅ Verified Purchase"
            }
      ],
      "btnViewMore": "View More Reviews →",
      "loadingText": "⏳ Loading more verified reviews from secure server..."
},

    cartPage: {
      "title": "Shopping Cart",
      "backToShop": "← Back to Shop",
      "itemCountSingular": "item",
      "itemCountPlural": "items",
      "clearBtn": "Clear Cart",
      "purityNotice": "100% Satvik Purity Guarantee • Sun-Cured in Kachi Ghani Mustard Oil • Zero Onion, Garlic or Chemicals",
      "tableHeaders": {
            "product": "Product",
            "pack": "Pack",
            "price": "Price",
            "quantity": "Quantity",
            "subtotal": "Subtotal",
            "remove": "Remove"
      },
      "eachLabel": "each",
      "removeAria": "Remove item",
      "emptyTitle": "Your Cart is Empty",
      "emptyDesc": "You haven't added any artisanal pickles or sweet treats to your cart yet. Explore our handcrafted batches!",
      "exploreBtn": "Explore Products Catalogue →",
      "coupon": {
            "placeholder": "Enter Coupon Code (e.g. SATVIK10)",
            "applyBtn": "Apply",
            "appliedMsg": "Coupon SATVIK10 applied! (10% OFF)"
      },
      "summaryTitle": "Order Summary",
      "subtotalLabel": "Items Subtotal:",
      "deliveryLabel": "Delivery Fee:",
      "freeDeliveryText": "FREE (Inaugural Offer)",
      "couponDiscountLabel": "Coupon Discount:",
      "totalPayableLabel": "Total Payable:",
      "checkoutBtn": "Proceed to Checkout",
      "confirmClear": "Are you sure you want to clear your cart?"
},

    profile: {
      "sidebar": {
            "myProfile": "My Profile",
            "myOrders": "My Orders",
            "myAddresses": "My Addresses",
            "wishlist": "Wishlist",
            "settings": "Settings",
            "signIn": "Sign In",
            "signOut": "Logout",
            "googleAccount": "Google Account",
            "doodleText": "Healthy Choices Happy You ↴ ♡"
      },
      "personalInfo": {
            "title": "Personal Information",
            "editBtn": "✏ Edit Profile",
            "closeEditBtn": "✕ Close Edit",
            "nameLabel": "Name",
            "emailLabel": "Email Address",
            "phoneLabel": "Phone Number",
            "joinedLabel": "Joined On",
            "fullNameLabel": "Full Name",
            "placeholders": {
                  "name": "Enter your full name",
                  "email": "name@example.com",
                  "phone": "10-digit mobile number"
            },
            "cancelBtn": "Cancel",
            "saveBtn": "💾 Save Changes",
            "doodleText": "Good Food Good Mood ♡"
      },
      "addresses": {
            "summaryTitle": "Saved Addresses",
            "addBtn": "+ Add New Address",
            "emptySummary": "No saved address yet.",
            "fullTitle": "My Delivery Addresses",
            "fullSubtitle": "Manage and add delivery locations for 1-click checkout",
            "emptyFullTitle": "No Saved Addresses",
            "emptyFullDesc": "Add your home or office address for fast, 1-click checkout.",
            "types": {
                  "home": "🏠 Home",
                  "work": "🏢 Work",
                  "other": "📍 Other"
            },
            "defaultBadge": "Default",
            "setDefaultBtn": "Set Default",
            "editTitle": "Edit Address",
            "deleteTitle": "Delete Address",
            "confirmDelete": "Are you sure you want to remove this delivery address?",
            "toastSaved": "📍 Address saved successfully!",
            "toastDeleted": "🗑 Address deleted",
            "toastDefault": "⭐ Default address updated!"
      },
      "orders": {
            "summaryTitle": "Order History",
            "viewAllBtn": "View All Orders →",
            "emptySummaryTitle": "No past orders yet",
            "emptySummaryDesc": "Experience our authentic handcrafted pickles and traditional sweets.",
            "exploreBtn": "Explore Products →",
            "fullTitle": "My Orders & Delivery History",
            "fullSubtitle": "Track active shipments and reorder your kitchen staples",
            "countBadge": "Total: {n}",
            "filters": {
                  "all": "All Orders",
                  "delivered": "Delivered",
                  "transit": "In Transit",
                  "processing": "Processing"
            },
            "status": {
                  "delivered": "Delivered",
                  "transit": "In Transit",
                  "processing": "Processing"
            },
            "emptyOrdersTitle": "No Orders Found",
            "emptyOrdersDesc": "You don't have any orders under this filter.",
            "browseBtn": "Browse Catalogue",
            "orderNum": "Order #",
            "placedOn": "Placed on",
            "viewDetailsBtn": "View Details",
            "reorderBtn": "🔄 Reorder",
            "toastReordered": "🛒 Items added to your cart!"
      },
      "wishlist": {
            "title": "My Wishlist",
            "subtitle": "Homemade treasures you've saved for your kitchen",
            "addAllBtn": "🛒 Add All to Cart",
            "emptyTitle": "Your Wishlist is Empty",
            "emptyDesc": "Explore our authentic sun-cured pickles and pure sweets made with traditional love!",
            "browseBtn": "🛍 Browse Catalogue"
      },
      "settings": {
            "title": "Account & Preferences",
            "subtitle": "Control your notification channels, language, and delivery preferences",
            "notifyTitle": "🔔 Notifications",
            "waTitle": "WhatsApp Order & Delivery Updates",
            "waDesc": "Receive real-time tracking links, invoice, and delivery OTP on WhatsApp.",
            "smsTitle": "SMS Dispatch Alerts",
            "smsDesc": "Receive instant text message when courier is out for delivery.",
            "emailTitle": "Seasonal Pickles & Festive Offers Email",
            "emailDesc": "Be the first to taste limited seasonal harvest batches (Amla, Kathal, Aam).",
            "langRegTitle": "🌐 Language & Regional",
            "interfaceLangLabel": "Interface Language",
            "currencyLabel": "Currency Display",
            "deliveryNoteTitle": "🚚 Default Delivery Note",
            "specialInstructionsLabel": "Special Delivery Instructions",
            "deliveryPlaceholder": "e.g. Ring doorbell, leave at front porch or with security guard",
            "dataBackupTitle": "🔒 Data & Cloud Backup",
            "cacheTitle": "Local Browser Cache",
            "cacheDesc": "Reset local cart, addresses, and form storage if encountering cached data issues.",
            "clearCacheBtn": "🧹 Clear Cache",
            "savePrefsBtn": "💾 Save Preferences",
            "toastSavedPrefs": "✅ Preferences saved successfully!"
      },
      "addressModal": {
            "addTitle": "Add New Delivery Address",
            "editTitle": "Edit Delivery Address",
            "recipientLabel": "Recipient Name",
            "phoneLabel": "Mobile Number",
            "houseLabel": "Flat / House No. / Building",
            "streetLabel": "Street / Area / Locality",
            "cityLabel": "City",
            "stateLabel": "State",
            "pincodeLabel": "Pincode",
            "defaultCheck": "Set as Default Address",
            "cancelBtn": "Cancel",
            "saveBtn": "Save Address"
      },
      "orderModal": {
            "title": "Order Details",
            "orderPlaced": "Order Placed:",
            "paymentMethod": "Payment Method:",
            "deliveryAddress": "Delivery Address:",
            "itemsTitle": "Items in this Order",
            "qty": "Qty:",
            "subtotal": "Items Subtotal",
            "delivery": "Delivery Charges",
            "totalPaid": "Total Paid",
            "free": "FREE"
      }
},

    policies: {
      "navTabs": {
            "privacy": "🔒 Privacy Policy",
            "terms": "📜 Terms & Conditions",
            "shipping": "🚚 Shipping & Delivery",
            "refund": "🔄 Cancellation & Refund",
            "cookies": "🍪 Cookies Policy",
            "contact": "📞 Contact Support"
      },
      "cancellationRefund": {
            "badge": "🛡️ Artisanal Food & Glass-Jar Safety Policy",
            "title": "Cancellation & Refund Policy",
            "subtitle": "Clear, transparent guidelines on order cancellations, glass-jar transit protection, and consumable food safety for Satvik Swaad.",
            "meta": {
                  "effectiveDate": "Effective Date: August 1, 2026",
                  "lastUpdated": "Last Updated: September 10, 2026",
                  "scope": "Scope: Online Storefront & WhatsApp Commerce"
            },
            "highlight1Title": "100% Free Replacement Guarantee",
            "highlight1Desc": "If a glass jar arrives cracked, leaking, or damaged in courier transit, we dispatch an immediate 100% free replacement upon receiving photo/video proof within 24–48h.",
            "highlight2Title": "Pre-Dispatch Easy Cancellations",
            "highlight2Desc": "Orders can be cancelled free of charge within 2 hours of ordering or anytime before courier dispatch, with 100% full money-back reversal.",
            "highlight3Title": "Consumable Food Hygiene Protocol",
            "highlight3Desc": "To protect the purity and health of every family, consumable homemade food items sealed in glass jars cannot be returned or restocked once delivered.",
            "tocTitle": "Policy Clauses",
            "tocCount": "6 Clauses"
      },
      "shippingDelivery": {
            "badge": "🚚 Pan-India Artisanal Delivery Guide",
            "title": "Shipping & Delivery Policy",
            "subtitle": "Fresh weekly batch dispatch, 5-layer shatterproof glass-jar transit safety, and direct, private WhatsApp tracking across India.",
            "meta": {
                  "effectiveDate": "Effective Date: September 10, 2026",
                  "dispatchWindow": "Dispatch Window: 24–48 Business Hours",
                  "coverage": "Coverage: 19,000+ PIN Codes"
            },
            "highlight1Title": "24–48h Fresh Dispatch",
            "highlight1Desc": "Orders packed fresh from weekly cured batches. Handed over to premier express couriers within 24–48 business hours.",
            "highlight2Title": "5-Layer Glass Protection",
            "highlight2Desc": "Induction leakproof seals, bubble cushions, and high-burst corrugated cartons. 100% Free Replacement for transit damage.",
            "highlight3Title": "Private WhatsApp Tracking",
            "highlight3Desc": "Live dispatch updates and tracking links sent directly via verified WhatsApp (+91 92365 87600). Strictly zero promotional spam."
      },
      "privacyPolicy": {
            "badge": "🔒 Transparent Purity Commitment",
            "title": "Privacy Policy",
            "subtitle": "Simple, honest, and transparent privacy commitments. How we handle your order details, ensure payment security, and protect your personal data with generational integrity.",
            "meta": {
                  "effectiveDate": "Effective Date: September 10, 2026",
                  "scope": "Scope: Customer Orders & Storefront",
                  "dataSelling": "Data Selling: Strictly Prohibited (0%)"
            },
            "pillars": {
                  "zeroSellingTitle": "Zero Data Selling",
                  "zeroSellingDesc": "Never rented, sold, or shared with advertisers",
                  "sslTitle": "256-Bit SSL Payments",
                  "sslDesc": "RBI-compliant gateways; zero card data saved",
                  "minimalDataTitle": "Minimal Order Data",
                  "minimalDataDesc": "Only what is needed to deliver your jars",
                  "rightsTitle": "Total Account Rights",
                  "rightsDesc": "Instant data view, update & deletion rights",
                  "directCommTitle": "Direct Communication",
                  "directCommDesc": "Zero 3rd-party message or mail services"
            },
            "guaranteeTitle": "Direct & Secure Communication Guarantee",
            "guaranteeText": "Satvik Swaad does not send or provide third-party message or promotional mail services. All order updates and customer conversations are conducted 100% privately and securely via our verified WhatsApp (+91 92365 87600) and official care email (satvikswaad.care@gmail.com). We will never spam you or share your details with marketing agencies."
      },
      "termsConditions": {
            "badge": "🌿 Warm Artisanal Food Agreement",
            "title": "Terms & Conditions",
            "subtitle": "Welcome to Satvik Swaad. We have replaced tedious legal jargon with a clean, warm, 5-point agreement rooted in honesty, Maa ke swaad ki virasat, and your complete peace of mind.",
            "meta": {
                  "effectiveDate": "Effective Date: September 10, 2026",
                  "kitchen": "Artisanal Kitchen: Handcrafted Micro-Batches",
                  "transparency": "Transparency: 100% Desi Trust"
            },
            "highlight1Title": "Artisanal Heritage",
            "highlight1Desc": "100% pure cold-pressed Kachi Ghani mustard oil, A2 cow ghee, and ancestral family recipes. Zero artificial preservatives or chemical shortcuts.",
            "highlight2Title": "Fresh Small Batches",
            "highlight2Desc": "Sun-cured in micro-batches and bottled weekly. Dispatched freshly within 24–48 business hours with complete Indian Rupee (₹) price transparency.",
            "highlight3Title": "Safe Glass Delivery & Care",
            "highlight3Desc": "100% food-grade glass jars with Pan-India transit shock protection. Free replacement if courier transit damage occurs, backed by direct WhatsApp support."
      },
      "cookiesPolicy": {
            "badge": "🍪 Privacy-First Storage Policy",
            "title": "Cookies & Local Storage Policy",
            "subtitle": "At Satvik Swaad, we believe in pure taste and pure privacy. We use only minimal, essential browser cookies to ensure your cart persists and your login is safe — with zero third-party advertising trackers.",
            "meta": {
                  "effectiveDate": "Effective Date: September 10, 2026",
                  "trackers": "Ad Trackers: Exactly 0 (None)",
                  "promise": "Brand Promise: 100% Privacy Respecting"
            },
            "highlight1Title": "Essential Functions Only",
            "highlight1Desc": "We only store data strictly necessary for your visit: saving pickles in your shopping cart, preserving your secure login, and remembering your language preference.",
            "highlight2Title": "Zero Third-Party Ad Trackers",
            "highlight2Desc": "No Meta pixel, no Google AdSense, no behavioral retargeting. We are an artisanal kitchen, not an advertising broker. We never sell or share your activity."
      }
},

    orderSuccess: {
      "title": "Thank You! Your Order is Placed",
      "subtitle": "Your order is confirmed and will be lovingly packed using our pure, chemical-free traditional standards. A confirmation receipt has been generated below.",
      "meta": {
            "orderNumber": "Order Number",
            "orderDate": "Order Date",
            "paymentMode": "Payment Mode",
            "totalAmount": "Total Amount"
      },
      "stepperHeading": "🚚 Order Status & Fulfillment",
      "stepper": {
            "placedTitle": "Order Placed",
            "placedSub": "Confirmed",
            "prepTitle": "Preparing",
            "prepSub": "Fresh Batch",
            "packTitle": "Packed",
            "packSub": "Quality Checked",
            "dispTitle": "Dispatched",
            "dispSub": "Express Courier",
            "delivTitle": "Delivered",
            "delivSub": "At Doorstep"
      },
      "receiptHeading": "📦 Itemized Order Summary",
      "subtotalLabel": "Items Subtotal:",
      "deliveryLabel": "Delivery & Shipping:",
      "freeDeliveryText": "FREE (🎉 Inaugural Offer)",
      "totalPayableLabel": "Total Payable:",
      "addressLabel": "📍 Shipping Address:",
      "buttons": {
            "waNotify": "💬 Get Live Updates on WhatsApp",
            "printReceipt": "🖨️ Print Order Receipt",
            "viewOrders": "👤 View in Order History",
            "continueShopping": "🛍️ Continue Shopping"
      }
},

    paymentFailed: {
      "statusPill": "Payment Incomplete",
      "title": "Payment Could Not Be Completed",
      "safeTitle": "Your money is completely safe!",
      "safeDesc": "If any money was debited from your account, your bank will automatically reverse it within 3-5 business days. Your cart has been safely preserved so you don't have to choose your items again.",
      "meta": {
            "orderIdLabel": "Reference Order ID",
            "orderAmountLabel": "Order Amount",
            "reasonLabel": "Reported Reason",
            "defaultReason": "Transaction was cancelled or declined by your payment provider."
      },
      "buttons": {
            "retry": "🔄 Retry Online Payment",
            "cod": "📦 Switch to Cash on Delivery (Pay at Doorstep)",
            "waHelp": "💬 Need Help? Chat with Support on WhatsApp",
            "backShop": "🛍️ Return to Shop & Cart"
      },
      "faq": {
            "title": "❓ Common Questions",
            "q1": "Why did my transaction fail?",
            "a1": "Transactions can fail due to bank server timeouts, incorrect OTP, temporary card limits, or cancelled authorization requests.",
            "q2": "Can I pay using Cash on Delivery instead?",
            "a2": "Yes! Simply click the \"Switch to Cash on Delivery\" button above. We will confirm your address and dispatch your order without requiring any prepayment."
      }
},

    notFound: {
      "badge": "Lost on the Flavorsome Trail!",
      "title": "Page Not Found",
      "desc": "The link you followed might be broken, or the recipe page has moved to our fresh pantry. Don't worry, delicious authentic tastes are always waiting for you!",
      "searchPlaceholder": "Search pickles, murabbas, sweets...",
      "searchBtn": "Search 🔍",
      "buttons": {
            "explore": "🛍️ Explore All 15 Products",
            "home": "🏠 Return to Home",
            "wa": "💬 Chat on WhatsApp"
      },
      "popularHeading": "✨ Most Popular Bestsellers"
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
      heading: "हमारे सभी 17 पारंपरिक उत्पाद",
      badge: "गाँव की मिट्टी और धूप का असली स्वाद",
      searchPlaceholder: "🔍 आम, आंवला, मिर्च, मुरब्बा, लड्डू खोजें...",
      sortDefault: "नवीनतम पहले",
      sortPriceAsc: "कीमत: कम से ज्यादा",
      sortPriceDesc: "कीमत: ज्यादा से कम",
      sortNameAsc: "नाम: A से Z",
      sortRating: "शीर्ष रेटेड",
      tabs: {
        all: "सभी उत्पाद (17)",
        achar: "पारंपरिक अचार (9)",
        murabba: "मुरब्बा (2)",
        sweets: "देसी मिठाइयां (3)",
        health: "स्वास्थ्यवर्धक उत्पाद (3)"
      },
      bestseller: "बेस्टसेलर",
      healthyChoice: "स्वास्थ्यवर्धक",
      newBadge: "नया",
      traditionalRecipe: "पारंपरिक रेसिपी",
      inStock: "उपलब्ध है",
      outOfStock: "स्टॉक समाप्त",
      save: "बचत",
      saveTag: "बचत",
      availablePacks: "उपलब्ध पैक:",
      btnViewDetails: "विवरण देखें 👁️",
      btnAddCart: "कार्ट में जोड़ें 🛒",
      btnAdded: "जोड़ा गया! ✓",
      verifiedReviews: "सत्यापित ग्राहक समीक्षाएं",
      catAcharTitle: "पारंपरिक अचार",
      catAcharCount: "9 पारंपरिक रेसिपीज",
      catSweetsTitle: "देसी मिठाइयां व मुरब्बा",
      catSweetsCount: "5 पारंपरिक मिष्ठान्न",
      catHealthTitle: "स्वास्थ्य व शुद्धता",
      catHealthCount: "3 आयुर्वेदिक औषधियां",
      catAllTitle: "सभी उत्पाद",
      catAllCount: "17 हस्तनिर्मित उत्पाद",
      villageCategoriesBadge: "निज़ामाबाद के गाँव से",
      villageCategoriesTitle: "गाँव की पारंपरिक श्रेणियां देखें",
      filterBy: "फ़िल्टर करें",
      price: "मूल्य / कीमत",
      sortBy: "क्रमबद्ध करें",
      showingProducts: "सभी हस्तनिर्मित उत्पाद दिखाए जा रहे हैं",
      pickYourFavourite: "अपनी पसंद चुनें",
      under200: "₹200 से कम",
      price200_400: "₹200 – ₹400",
      price401_600: "₹401 – ₹600",
      above600: "₹600 से अधिक",
      availability: "उपलब्धता",
      reviewsCount: "समीक्षाएं",
      offTag: "छूट"
    },

    // Product Details Page
    productDetails: {
      breadcrumbHome: "होम",
      breadcrumbProducts: "उत्पाद",
      selectPack: "पैक का आकार / वजन चुनें:",
      quantity: "मात्रा:",
      btnAddToCart: "कार्ट में जोड़ें 🛒",
      btnBuyNow: "तुरंत खरीदें (बाय नाउ) ⚡",
      tabIngredients: "सामग्री व शुद्धता",
      tabHealth: "स्वास्थ्य लाभ",
      tabStorage: "रखरखाव व शेल्फ लाइफ",
      tabReviews: "ग्राहक समीक्षाएं",
      shelfLifeLabel: "सत्यापित शेल्फ लाइफ:",
      storageLabel: "रखरखाव निर्देश:",
      allergensLabel: "एलर्जन सूचना:",
      packagingLabel: "पैकेजिंग गुणवत्ता:",
      specsTitle: "प्रामाणिक उत्पाद विवरण व गुणवत्ता आश्वासन",
      heritageDescTitle: "पारंपरिक विरासत व संपूर्ण विवरण",
      ingredientsTitle: "शुद्ध व पारंपरिक सामग्री",
      storageTitle: "रखरखाव निर्देश व प्राकृतिक शेल्फ लाइफ",
      allergenTitle: "एलर्जन व पैकेजिंग सुरक्षा",
      verifiedReviews: "सत्यापित ग्राहक समीक्षाएं",
      reviewsSub: "उन परिवारों की सच्ची राय जो पीढ़ियों पुराने स्वाद को संजोते हैं।",
      allReviewsBtn: "सभी समीक्षाएं →",
      writeReview: "अपनी समीक्षा लिखें",
      addReviewTitle: "अपनी समीक्षा जोड़ें",
      namePlaceholder: "आपका नाम",
      reviewPlaceholder: "इस पारंपरिक स्वाद के साथ अपना अनुभव साझा करें...",
      btnSubmitReview: "समीक्षा भेजें ⭐",
      ratingBreakdown: "रेटिंग विवरण",
      relatedTitle: "आपको यह भी पसंद आएगा",
      relatedSub: "उसी निष्ठा से हाथ से बनाए गए पारंपरिक अचार और देसी मिष्ठान्न।",
      inStock: "● उपलब्ध है",
      outOfStock: "● स्टॉक समाप्त",
      onlyLeft: "● केवल {count} शेष — जल्दी करें!",
      inclusiveTaxes: "सभी कर सम्मिलित",
      skuLabel: "एसकेयू:",
      freeTransit: "परिवहन में क्षति होने पर मुफ़्त प्रतिस्थापन",
      freshBatches: "हर हफ़्ते ताज़ा बैच तैयार",
      perkDispatch: "24-48 घंटों के भीतर 19,000+ पिनकोड पर प्रेषित",
      perkPayment: "सुरक्षित ऑनलाइन भुगतान (UPI, कार्ड, नेटबैंकिंग) व कैश ऑन डिलीवरी",
      perkReplacement: "परिवहन में टूटने या रिसाव पर 100% मुफ़्त प्रतिस्थापन"
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
      brandDesc: "सात्विक स्वाद में हम शुद्ध, घर के बने पारंपरिक देसी अचार, मुरब्बे और मिठाइयां तैयार करते हैं, जो पीढ़ियों पुरानी पवित्रता और सोंधा स्वाद आपके दैनिक जीवन में लाते हैं।",
      quickLinks: "जरूरी लिंक्स",
      contactHeading: "संपर्क करें",
      callSupport: "कॉल सहायता",
      messageUs: "मैसेज भेजें",
      emailResponse: "24 घंटे में ईमेल उत्तर",
      phone: "फोन / व्हाट्सएप: +91 92365 87600",
      email: "ईमेल: satvikswaad.care@gmail.com",
      address: "पता: वाराणसी, उत्तर प्रदेश, भारत",
      links: {
        ourCollection: "हमारा संग्रह",
        picklesAchar: "पारंपरिक अचार",
        sweetsMurabba: "मिठाइयां व मुरब्बा",
        ourHeritageStory: "हमारी विरासत की कहानी",
        healthPurityPromise: "स्वास्थ्य व शुद्धता का वादा",
        faqs: "अक्सर पूछे जाने वाले सवाल",
        returnRefundPolicy: "वापसी व धनवापसी नीति",
        shippingPolicy: "शिपिंग व डिलीवरी नीति",
        privacyPolicy: "गोपनीयता नीति",
        cookiesPolicy: "कुकीज़ नीति",
        termsOfService: "सेवा की शर्तें"
      },
      newsletter: {
        title: "जुड़े रहें, ताज़ा स्वाद पाएं",
        desc: "मौसमी अचार, घर के बने आंवला मुरब्बा, पारंपरिक लड्डू और त्योहारी उपहारों के ताज़ा अपडेट पाएं।",
        placeholder: "अपना ईमेल पता दर्ज करें",
        subscribeBtn: "सब्सक्राइब करें",
        footnote: "100% शुद्ध व घर का बना • कभी भी अनसब्सक्राइब करें।"
      },
      copyright: "© 2026 सात्विक स्वाद। सर्वाधिकार सुरक्षित।",
      tagline: "भारत में ❤️ से निर्मित | परंपरा का शुद्ध स्वाद"
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
    },

    // Homepage Structured Sections
    home: {
      hero: {
        tagline: "अचार जो दिल से बना, माँ के हाथों का असली स्वाद ❤️",
        subTagline: "माँ के स्वाद की विरासत, बेटी के सपनों की पहचान",
        slide1Alt: "सात्विक स्वाद असली देसी अचार - अचार जो दिल से बना, माँ के हाथों का असली स्वाद",
        slide2Alt: "सात्विक स्वाद 14 दिन धूप में पके अचार शुद्ध कच्ची घानी सरसों के तेल में",
        slide3Alt: "सात्विक स्वाद खेत से ताज़ा सामग्री - माँ के स्वाद की विरासत, बेटी के सपनों की पहचान",
        captions: [
          "निज़ामाबाद में माँ-बेटी के प्यार और दादी-नानी की विधियों से तैयार",
          "14 दिनों तक शुद्ध कच्ची घानी सरसों तेल में धूप में पके पारंपरिक अचार",
          "खेत से ताज़ा सामग्री और पीढ़ियों पुरानी पारंपरिक धरोहर"
        ],
        ctaShop: "अभी खरीदें",
        ctaStory: "हमारी कहानी",
        ctaExplore: "शुद्ध उत्पाद देखें"
      },
      villageCategories: {
        eyebrow: "निज़ामाबाद में हस्तनिर्मित",
        title: "गाँव की पारंपरिक श्रेणियां",
        acharTitle: "अचार और चटपटे प्रिजर्व",
        acharBadge: "9 प्रामाणिक विधियां",
        sweetsTitle: "मिठाइयां और मुरब्बा",
        sweetsBadge: "5 पुश्तैनी मिष्ठान",
        healthTitle: "स्वास्थ्य और शुद्धता",
        healthBadge: "3 आयुर्वेदिक उत्पाद",
        allTitle: "सभी उत्पाद",
        allBadge: "15 हस्तनिर्मित उत्पाद"
      },
      whyChoose: {
        eyebrow: "शुद्धता के चार आधार स्तंभ",
        titlePrefix: "सात्विक स्वाद ही",
        titleHighlight: "क्यों चुनें?",
        desc: "हमें बिना किसी मिलावट, दादी-नानी की पुरानी विधियों और 14 दिनों तक धूप में पकाने की पारंपरिक कला से तैयार देसी अचार और मिठाइयों पर सच्चा गर्व है।",
        doodlePure: "शुद्ध",
        doodleDesi: "देसी",
        doodleHealthy: "स्वास्थ्यवर्धक",
        paperNote: "शुद्ध पारंपरिक स्वाद"
      },
      qualityPillars: {
        p1Title: "14 दिन प्राकृतिक धूप में पके",
        p1Desc: "14 दिनों तक प्राकृतिक सूर्य की रोशनी में पके ताकि मसालों का सोंधापन और पाचक गुण निखर सकें।",
        p2Title: "100% शुद्ध कच्ची घानी सरसों तेल",
        p2Desc: "प्रथम निष्कर्षण का शुद्ध सरसों तेल, बिना किसी केमिकल रिफाइनिंग या मिलावट के पूर्णतः प्राकृतिक।",
        p3Title: "शून्य रासायनिक प्रिजर्वेटिव (केमिकल-मुक्त)",
        p3Desc: "बिना सोडियम बेंजोएट, कृत्रिम सिरका या सिंथेटिक रंगों के; सिर्फ प्राकृतिक सेंधा नमक और मसालों से सुरक्षित।",
        p4Title: "पीढ़ियों पुरानी नानी-दादी की विधियां",
        p4Desc: "निज़ामाबाद के आँगन में नानी-दादी की अनमोल रसोई परंपरा, जो आज भी उसी पवित्रता से बनाई जाती है।"
      },
      comparison: {
        subtitle: "शिल्पकार शुद्धता बनाम बड़े पैमाने के औद्योगिक तरीके",
        title: "सात्विक स्वाद बनाम बाजार के सामान्य उत्पाद",
        colDim: "मूल्यांकन का पैमाना",
        colSatvikTitle: "सात्विक स्वाद",
        colSatvikSub: "पारंपरिक घरेलू विधियां",
        colMarketTitle: "बाजार के सामान्य उत्पाद",
        colMarketSub: "सामान्य व्यावसायिक विकल्प",
        rows: [
          {
            dim: "तेल का प्रकार",
            satvikTag: "100% कच्ची घानी",
            satvikText: "100% शुद्ध कच्ची घानी सरसों का तेल। बिना किसी रिफाइनिंग के प्राकृतिक एंटीऑक्सीडेंट्स, तीखापन और पौष्टिकता बरकरार।",
            marketTag: "रिफाइंड मिश्रण",
            marketText: "रिफाइंड पाम / बिनौला तेल का मिश्रण और कृत्रिम एंटीऑक्सीडेंट (TBHQ)। अत्यधिक ताप पर सॉल्वेंट निष्कर्षण।"
          },
          {
            dim: "संरक्षण विधि",
            satvikTag: "धूप में पके व सेंधा नमक",
            satvikText: "पारंपरिक सेंधा नमक, हल्दी, सरसों तेल की परत और 14 दिनों तक प्राकृतिक धूप। किसी कृत्रिम केमिकल की जरूरत नहीं।",
            marketTag: "रासायनिक प्रिजर्वेटिव",
            marketText: "कृत्रिम रासायनिक प्रिजर्वेटिव (सोडियम बेंजोएट INS 211, पोटैशियम मेटाबाइसल्फाइट INS 224)।"
          },
          {
            dim: "खटास का स्रोत",
            satvikTag: "प्राकृतिक फलों का खट्टापन",
            satvikText: "प्राकृतिक धूप में सूखा आमचूर, ताजे नींबू का रस और प्राकृतिक किण्वन। धूप में धीरे-धीरे पकने वाली जैविक खटास।",
            marketTag: "सिंथेटिक एसिड",
            marketText: "औद्योगिक ग्लेशियल एसिटिक एसिड (सिंथेटिक सिरका INS 260)। त्वरित कृत्रिम खटास के लिए प्रयुक्त।"
          },
          {
            dim: "प्रसंस्करण व बैचिंग",
            satvikTag: "कांच की बरनियों में छोटे बैच",
            satvikText: "कांच की बरनियों में 50 किलो से कम के छोटे बैच। प्राकृतिक धूप में धीरे-धीरे पकने की निरंतर निगरानी।",
            marketTag: "मशीनी व अत्यधिक ताप",
            marketText: "तेज आंच पर बड़ी मशीनों में पकाना और तेज गति से ऑटोमैटिक पैकिंग। व्यावसायिक गति को प्राथमिकता।"
          },
          {
            dim: "मिठास का आधार (मुरब्बा व मिठाई)",
            satvikTag: "देसी खांड व शुद्ध A2 घी",
            satvikText: "पारंपरिक देसी खांड, जैविक गुड़ और शुद्ध A2 गाय का घी। बिना सल्फर या ब्लीचिंग के तैयार।",
            marketTag: "सफेद चीनी व वनस्पति तेल",
            marketText: "सफेद रिफाइंड चीनी, कॉर्न सिरप और हाइड्रोजनीकृत वनस्पति वसा (डालडा)।"
          },
          {
            dim: "मसाले व सुगंध",
            satvikTag: "सिलबट्टे पर पिसे खड़े मसाले",
            satvikText: "हाथ से साफ किए और धीमी गति से पिसे खड़े भुने मसाले (सौंफ, कलौंजी, राई, मेथी, हींग)। प्राकृतिक तेल सुरक्षित।",
            marketTag: "मसालों का सत्व व कृत्रिम सुगंध",
            marketText: "तेल निकले हुए सूखे मसालों का चूरा और सिंथेटिक एसेंस।"
          },
          {
            dim: "मानक व लैब परीक्षण",
            satvikTag: "स्वतंत्र लैब परीक्षण",
            satvikText: "NABL-मान्यता प्राप्त प्रयोगशालाओं द्वारा भारी धातु, कीटनाशक और स्वच्छता मानकों की जांच।",
            marketTag: "न्यूनतम कानूनी औपचारिकता",
            marketText: "केवल न्यूनतम कानूनी औपचारिकता, बिना किसी व्यक्तिगत बैच शुद्धता जांच के।"
          }
        ],
        noticeTitle: "उत्पाद लॉन्च पूर्व लैब ऑडिट सूचना",
        noticeDesc: "सभी बैच-विशिष्ट सूक्ष्मजैविक पैरामीटर, शेल्फ-लाइफ मूल्यांकन और पोषण संबंधी दावों को NABL-मान्यता प्राप्त प्रयोगशालाओं द्वारा सत्यापित किया जाएगा और खुदरा प्रेषण से पहले हमारे FSSAI अनुपालन रिकॉर्ड में संग्रहीत किया जाएगा।",
        disclaimer: "अस्वीकरण: यह तुलना बाजार में बिकने वाले आम वाणिज्यिक उत्पादों और हमारे पारंपरिक घरेलू हस्तनिर्मित तरीकों के सामान्य अंतर पर आधारित है। इसका उद्देश्य किसी विशिष्ट ब्रांड को लक्षित या अपमानित करना नहीं है।",
        complianceTitle: "पारदर्शी अनुपालन एवं लाइसेंस स्थिति",
        complianceSub: "सात्विक स्वाद में हमारे ग्राहकों के साथ पारदर्शिता सर्वोपरि है:",
        fssaiLabel: "FSSAI पंजीकरण / लाइसेंस:",
        fssaiStatus: "वर्तमान में स्वीकृति प्रक्रियाधीन।",
        gstinLabel: "GSTIN पंजीकरण:",
        gstinStatus: "वर्तमान में जारी होने की प्रक्रिया में।",
        pkgLabel: "पैकेजिंग मानक:",
        pkgStatus: "फूड-ग्रेड कांच और बीपीए-मुक्त एयरटाइट बरनियां।",
        btnExplore: "सभी 15 उत्पाद देखें →",
        btnStory: "हमारी कहानी पढ़ें →"
      },
      reorder: {
        subtitle: "आसान और त्वरित",
        title: "🔄 दोबारा खरीदें और तुरंत ऑर्डर करें",
        lead: "अपने पसंदीदा देसी अचार और मिठाइयों को सिर्फ एक क्लिक में दोबारा मंगाएं।",
        btnReorder: "दोबारा ऑर्डर करें"
      },
      about: {
        subtitle: "हमारी विरासत और संकल्प",
        title: "सात्विक स्वाद की कहानी",
        desc: "सात्विक स्वाद के अचार, मुरब्बे, लड्डू और च्यवनप्राश का प्रत्येक जार पीढ़ियों पुरानी पारिवारिक विधियों से छोटे-छोटे बैचों में तैयार किया जाता है। हम किसी भी कृत्रिम प्रिजर्वेटिव, सिंथेटिक रंग या रिफाइंड तेल का उपयोग नहीं करते।",
        cta: "पूरी कहानी और हमारे मूल्य पढ़ें →"
      },
      complianceNote: "असली सामग्री। सच्चा विश्वास।"
    },

    // Our Story Page Structured Sections
    ourStory: {
      hero: {
        title: "हमारी यात्रा: शुद्धता, स्वाद और परंपरा की अनमोल विरासत",
        subtitle: "निज़ामाबाद में मातृप्रेम और पवित्रता से निर्मित"
      },
      origin: {
        doodleLove: "पीढ़ियों से वही सच्चा प्यार ↴ ♡",
        polaroidCaption: "माँ के स्वाद की विरासत ♡",
        journeyTitle: "हमारी यात्रा",
        journeySubtitle: "शुद्धता, स्वाद और परंपरा की समृद्ध विरासत"
      },
      grandmaLegacy: {
        p1: "सात्विक स्वाद की शुरुआत एक सरल विश्वास के साथ हुई — असली और शुद्ध भोजन दिलों को जोड़ने की ताकत रखता है।"
      },
      womenArtisans: {
        p2: "निज़ामाबाद गाँव की मिट्टी से जुड़ी हमारी जड़ें नानी-दादी की सदियों पुरानी विधियों को संजोती हैं। स्थानीय महिला कारीगरों के हाथों से तैयार, हर अचार पारंपरिक मिट्टी की बरनियों में धूप की सुनहरी किरणों में धीरे-धीरे पकता है।"
      },
      traditionalProcess: {
        p3: "हम किसी शॉर्टकट में विश्वास नहीं रखते। केवल शुद्ध कच्ची घानी सरसों तेल, खड़े पिसे मसाले और प्राकृतिक गुड़-खांड के साथ हम भारत के असली पारंपरिक स्वाद को पूरी निष्ठा से आप तक पहुंचाते हैं।"
      },
      heritageValues: {
        learnMore: "और जानें →",
        badge1Title: "100% शुद्ध सामग्री",
        badge1Desc: "सिर्फ श्रेष्ठ प्राकृतिक तत्व, कोई मिलावट नहीं।",
        badge2Title: "पुश्तैनी पारिवारिक विधियां",
        badge2Desc: "नानी-दादी के हाथों का अमर स्वाद।",
        badge3Title: "शून्य सिंथेटिक केमिकल",
        badge3Desc: "सिर्फ प्रकृति का वरदान और सच्चा समर्पण।",
        badge4Title: "आत्मनिर्भर भारत की पहचान",
        badge4Desc: "निज़ामाबाद की ग्रामीण महिला कारीगरों का सशक्तिकरण।"
      }
    },

    // Why Us / Health & Purity Structured Sections
    whyUs: {
      hero: {
        title: "स्वास्थ्य एवं शुद्धता: सात्विक का सर्वोच्च मानक",
        subtitle: "आधुनिक खाद्य सुरक्षा के साथ पारंपरिक ज्ञान"
      },
      manifesto: {
        heading: "हमारा शुद्धता घोषणापत्र",
        text: "हमारा अटूट विश्वास है कि भोजन शरीर और आत्मा दोनों को पोषण दे। औद्योगिक रसायनों के इस दौर में, सात्विक स्वाद भारतीय पाक परंपरा की पवित्र जड़ों की ओर लौटता है — जहाँ कच्ची घानी सरसों तेल, प्राकृतिक धूप और सेंधा नमक ऐसे अचार बनाते हैं जो स्वास्थ्यवर्धक और पाचक हैं।"
      },
      oilPurity: {
        title: "कच्ची घानी सरसों तेल के लाभ",
        desc: "ओमेगा-3 और प्राकृतिक एंटीऑक्सीडेंट्स से भरपूर। पाचन शक्ति बढ़ाता है और कोलेस्ट्रॉल नियंत्रित रखने में सहायक।"
      },
      sunCuring: {
        title: "14 दिनों की सौर परिपक्वता",
        desc: "कांच की बरनियों में धूप की धीमी तपिश से नमी दूर होती है और मसालों का सोंधापन गहराई से रचाया जाता है।"
      },
      noChemicals: {
        title: "शून्य केमिकल व प्रिजर्वेटिव",
        desc: "सोडियम बेंजोएट, कृत्रिम सिरके और सिंथेटिक रंगों से 100% मुक्त। पूर्णतः सात्विक एवं सुरक्षित।"
      },
      rockSalt: {
        title: "प्राकृतिक सेंधा नमक",
        desc: "84 से अधिक प्राकृतिक खनिजों से युक्त सेंधा नमक। कृत्रिम आयोडीन और एंटी-केकिंग रसायनों से रहित।"
      },
      labTesting: {
        title: "सख्त प्रयोगशाला परीक्षण",
        desc: "NABL-मान्यता प्राप्त प्रयोगशालाओं द्वारा भारी धातुओं, कीटनाशकों और सूक्ष्मजीवों की शुद्धता का परीक्षण।"
      },
      trustBadge: {
        title: "100% सात्विक शुद्धता गारंटी",
        desc: "पवित्र स्वच्छता में निर्मित, बिना लहसुन-प्याज, पीढ़ियों की सच्ची विरासत।"
      }
    },
    contact: {
      "heading": "सात्विक स्वाद से संपर्क करें",
      "heroTop": "सात्विक स्वाद से",
      "heroScript": "संपर्क करें",
      "heroSubtitle": "हम आपसे बात करना पसंद करेंगे",
      "note": "आपकी राय हमारे लिए अनमोल है",
      "doodle": "असली देसी स्वाद",
      "breadcrumb": "संपर्क करें",
      "formTitle": "हमें संदेश भेजें",
      "formSubtitle": "हम आपकी सहायता के लिए सदैव उपलब्ध हैं! नीचे दिया गया फ़ॉर्म भरें और हम शीघ्र ही आपसे संपर्क करेंगे।",
      "labels": {
            "name": "पूरा नाम *",
            "email": "ईमेल पता *",
            "phone": "फोन नंबर *",
            "subject": "विषय *",
            "orderId": "ऑर्डर आईडी (वैकल्पिक)",
            "message": "संदेश *"
      },
      "placeholders": {
            "name": "अपना नाम दर्ज करें",
            "email": "apna@email.com",
            "phone": "10 अंकों का मोबाइल नंबर",
            "orderId": "उदा. SS-2026-1042",
            "message": "अपना संदेश यहाँ लिखें..."
      },
      "subjectOptions": {
            "default": "विषय चुनें",
            "general": "सामान्य पूछताछ",
            "order": "ऑर्डर सहायता",
            "bulk": "थोक व उपहार ऑर्डर",
            "feedback": "प्रतिक्रिया व सुझाव",
            "partnership": "व्यापारिक साझेदारी"
      },
      "btnSubmit": "संदेश भेजें",
      "successMsg": "✅ धन्यवाद! आपका संदेश सफलतापूर्वक भेज दिया गया है।",
      "info": {
            "kitchenTitle": "हमारी पारंपरिक रसोई",
            "kitchenUnit": "सात्विक स्वाद पारंपरिक प्रिजर्व्स यूनिट",
            "kitchenAddress": "ग्राम व पोस्ट – कोठापल्ली, जिला – निजामाबाद, 503001",
            "fssai": "एफएसएसएआई पंजी. सं.: 22724113000000",
            "phoneTitle": "फोन व सीधा व्हाट्सएप",
            "phoneHours": "(सोम – शनि: सुबह 9:00 से शाम 6:00 बजे तक)",
            "emailTitle": "सीधा ग्राहक सेवा ईमेल",
            "grievanceTitle": "ऑर्डर सहायता व शिकायत निवारण",
            "grievanceOfficer": "नोडल अधिकारी: ग्राहक शिकायत डेस्क",
            "grievanceResolution": "निवारण समय सीमा: 24–48 कार्य घंटे"
      },
      "merchant": {
            "title": "व्यापारी पहचान पत्र (मर्चेंट विवरण)",
            "legalLabel": "कानूनी ऑपरेटिंग इकाई",
            "legalValue": "सात्विक स्वाद ट्रेडिशनल प्रिजर्व्स",
            "addressLabel": "पंजीकृत व्यावसायिक पता",
            "addressValue": "ग्राम व पोस्ट कोठापल्ली, निजामाबाद, तेलंगाना – 503001, भारत",
            "fssaiLabel": "खाद्य सुरक्षा मानक",
            "fssaiValue": "एफएसएसएआई पंजीकरण सं. 22724113000000",
            "helplineLabel": "आधिकारिक हेल्पलाइन",
            "emailLabel": "ईमेल",
            "gatewayLabel": "अधिकृत भुगतान गेटवे",
            "gatewayValue": "PayU पेमेंट्स प्राइवेट लिमिटेड (कार्ड, UPI, नेट बैंकिंग)",
            "redressalLabel": "उपभोक्ता शिकायत निवारण",
            "redressalValue": "समर्पित अधिकारी 24 घंटे में उत्तर देते हैं"
      },
      "guarantee": {
            "title": "प्रत्यक्ष व सुरक्षित संचार गारंटी",
            "spamPolicyLabel": "जीरो स्पैम नीति",
            "spamPolicyText": "सात्विक स्वाद किसी भी तीसरे पक्ष की प्रचारक संदेश या मार्केटिंग ईमेल सेवा का उपयोग नहीं करता है। सभी ऑर्डर अपडेट व बातचीत हमारे सत्यापित व्हाट्सएप (+91 92365 87600) और आधिकारिक ईमेल (satvikswaad.care@gmail.com) पर 100% निजी व सुरक्षित रूप से की जाती है।"
      },
      "villageKitchen": {
            "badge": "ताजा बैच",
            "title": "📍 गाँव की रसोई से सीधा",
            "desc": "निजामाबाद में हमारे गाँव की माताओं द्वारा हर हफ्ते हाथ से बनाए गए ताजा बैच।",
            "waBtn": "व्हाट्सएप पर बात करें: +91 92365 87600"
      },
      "polaroidCaption": "माँ के स्वाद की विरासत",
      "doodleLines": [
            "पीढ़ियों",
            "से",
            "वही",
            "प्यार"
      ]
},

    faq: {
      "heroTop": "अक्सर पूछे जाने वाले",
      "heroScript": "सवाल (FAQ)",
      "heroSubtitle": "हम आपकी सहायता के लिए यहाँ हैं!",
      "note": "कोई प्रश्न है? हमारे पास उत्तर हैं!",
      "doodle": "असली देसी स्वाद",
      "breadcrumb": "अक्सर पूछे जाने वाले प्रश्न",
      "sectionTitle": "सामान्य प्रश्न",
      "sectionSubtitle": "अपने सामान्य प्रश्नों के त्वरित उत्तर पाएं।",
      "searchPlaceholder": "🔍 सवाल खोजें...",
      "categories": {
            "general": "सामान्य",
            "orders": "ऑर्डर व शिपिंग",
            "products": "उत्पाद व सामग्रियां",
            "payments": "भुगतान व रिफंड",
            "account": "खाता व प्रोफाइल",
            "others": "अन्य"
      },
      "guaranteeTitle": "प्रत्यक्ष संचार गारंटी",
      "guaranteeText": "सात्विक स्वाद किसी भी तीसरे पक्ष की प्रचारक संदेश या मार्केटिंग ईमेल सेवा का उपयोग नहीं करता है। सभी ऑर्डर अपडेट व बातचीत हमारे सत्यापित व्हाट्सएप (+91 92365 87600) और आधिकारिक ईमेल (satvikswaad.care@gmail.com) पर 100% निजी व सुरक्षित रूप से की जाती है। हम कभी भी विपणन एजेंसियों के साथ आपके विवरण साझा नहीं करेंगे।",
      "items": {
            "general": [
                  {
                        "q": "क्या आपके उत्पाद 100% प्राकृतिक हैं?",
                        "a": "हाँ। प्रत्येक सात्विक स्वाद उत्पाद शुद्ध, प्राकृतिक सामग्रियों से बनाया गया है — बिना किसी कृत्रिम रंग, स्वाद या रासायनिक परिरक्षक के।"
                  },
                  {
                        "q": "डिलीवरी में कितना समय लगता है?",
                        "a": "ऑर्डर आमतौर पर 24–48 घंटों में भेजे जाते हैं और आपके स्थान के आधार पर 3–7 कार्य दिवसों में डिलीवर होते हैं।"
                  },
                  {
                        "q": "क्या मैं अपना ऑर्डर ट्रैक कर सकता हूँ?",
                        "a": "बिल्कुल। प्रेषण के तुरंत बाद ट्रैकिंग लिंक और लाइव कूरियर अपडेट आपके सत्यापित व्हाट्सएप (+91 92365 87600) और ईमेल पर भेजे जाते हैं।"
                  },
                  {
                        "q": "आपकी प्रत्यक्ष संचार गारंटी क्या है? क्या मुझे स्पैम मिलेगा?",
                        "a": "सात्विक स्वाद किसी भी तीसरे पक्ष की प्रचारक संदेश या मार्केटिंग ईमेल सेवा का उपयोग नहीं करता है। सभी बातचीत सत्यापित व्हाट्सएप (+91 92365 87600) और ईमेल (satvikswaad.care@gmail.com) पर 100% सुरक्षित रूप से की जाती है।"
                  },
                  {
                        "q": "क्या मुझे प्रचारक संदेश, मार्केटिंग ईमेल या स्पैम प्राप्त होंगे?",
                        "a": "नहीं, कभी नहीं। सात्विक स्वाद पूर्णतः स्पैम-मुक्त नीति का पालन करता है। हम कोई बल्क मार्केटिंग या अवांछित एसएमएस नहीं भेजते।"
                  },
                  {
                        "q": "आपकी वापसी और रिफंड नीति क्या है?",
                        "a": "क्योंकि हमारे उत्पाद कांच की बरनियों में सील किए गए खाद्य उत्पाद हैं, इसलिए डिलीवरी के बाद रिटर्न स्वीकार नहीं किया जाता। हालांकि, रास्ते में टूटने या लीक होने पर 100% मुफ्त प्रतिस्थापन और प्रेषण से पहले रद्द करने पर पूरा रिफंड दिया जाता है।"
                  },
                  {
                        "q": "क्या आप कैश ऑन डिलीवरी (COD) प्रदान करते हैं?",
                        "a": "हाँ, चेकआउट के समय भारत के अधिकांश पिन कोड्स पर कैश ऑन डिलीवरी उपलब्ध है।"
                  },
                  {
                        "q": "क्या आपके उत्पाद बच्चों के लिए सुरक्षित हैं?",
                        "a": "हमारी पारंपरिक मिठाइयाँ और स्वास्थ्य उत्पाद पूरे परिवार के लिए उपयुक्त हैं। अचार पारंपरिक मसालों से युक्त होते हैं, इसलिए छोटे बच्चों के लिए हल्के विकल्प चुनें।"
                  }
            ],
            "orders": [
                  {
                        "q": "क्या आप पूरे भारत में शिपिंग करते हैं?",
                        "a": "हाँ, हम भारत के सभी सेवा योग्य पिन कोडों पर डिलीवरी करते हैं। अंतर्राष्ट्रीय शिपिंग शीघ्र प्रारंभ होगी।"
                  },
                  {
                        "q": "शिपिंग शुल्क कितना है?",
                        "a": "₹499 से अधिक के सभी ऑर्डर पर शिपिंग बिल्कुल मुफ्त है। छोटे ऑर्डरों पर मात्र ₹50 का सामान्य शुल्क लागू होता है।"
                  },
                  {
                        "q": "क्या मैं अपना डिलीवरी पता बदल सकता हूँ?",
                        "a": "ऑर्डर प्रेषित होने से पहले आप अपनी प्रोफाइल से डिलीवरी पता आसानी से अपडेट कर सकते हैं।"
                  }
            ],
            "products": [
                  {
                        "q": "अचार में आप कौन सा तेल उपयोग करते हैं?",
                        "a": "हम 100% शुद्ध कोल्ड-प्रेस्ड कच्ची घानी सरसों के तेल का उपयोग करते हैं, जो स्वास्थ्यवर्धक और रसायनों से सर्वथा मुक्त है।"
                  },
                  {
                        "q": "अचार को कैसे संग्रहित करना चाहिए?",
                        "a": "सीधी धूप से दूर ठंडी, सूखी जगह पर रखें और निकालते समय हमेशा साफ, सूखे चम्मच का प्रयोग करें।"
                  },
                  {
                        "q": "उत्पादों की शेल्फ लाइफ क्या है?",
                        "a": "अचार 12 महीने तक ताजे रहते हैं; मिठाइयों का आनंद 15–30 दिनों के भीतर लेना सर्वोत्तम है।"
                  }
            ],
            "payments": [
                  {
                        "q": "आप भुगतान के कौन से तरीके स्वीकार करते हैं?",
                        "a": "यूपीआई (UPI), सभी प्रमुख डेबिट/क्रेडिट कार्ड, नेट बैंकिंग, वॉलेट और कैश ऑन डिलीवरी।"
                  },
                  {
                        "q": "रिफंड में कितना समय लगता है?",
                        "a": "स्वीकृत रिफंड 5–7 कार्य दिवसों में आपके मूल भुगतान माध्यम में वापस जमा कर दिए जाते हैं।"
                  }
            ],
            "account": [
                  {
                        "q": "मैं खाता कैसे बना सकता हूँ?",
                        "a": "आप अपने ईमेल पते या गूगल खाते के माध्यम से कुछ ही सेकंड में आसानी से साइन अप कर सकते हैं।"
                  },
                  {
                        "q": "क्या मैं एक से अधिक पते सहेज सकता हूँ?",
                        "a": "हाँ, आप अपनी प्रोफाइल से घर, कार्यालय आदि के कई पते सहेज और प्रबंधित कर सकते हैं।"
                  }
            ],
            "others": [
                  {
                        "q": "क्या आप थोक या उपहार ऑर्डर लेते हैं?",
                        "a": "हाँ! कॉर्पोरेट, उत्सव और थोक उपहार ऑर्डरों के लिए हमारे संपर्क पृष्ठ के माध्यम से हमसे संपर्क करें।"
                  },
                  {
                        "q": "मैं सात्विक स्वाद के साथ साझेदारी कैसे कर सकता हूँ?",
                        "a": "हम नई साझेदारियों का स्वागत करते हैं। संपर्क पृष्ठ से संदेश भेजें, हमारी टीम शीघ्र ही आपसे जुड़ेगी।"
                  }
            ]
      }
},

    reviews: {
      "heroTop": "हमारे ग्राहक",
      "heroScript": "क्या कहते हैं",
      "heroSubtitle": "सच्चे लोग • असली अनुभव • पारंपरिक स्वाद",
      "doodleGoodness": "सदा प्राकृतिक शुद्धता",
      "breadcrumb": "ग्राहक समीक्षाएं",
      "sectionTitle": "ग्राहक समीक्षाएं",
      "sectionSubtitle": "हमारे संतुष्ट ग्राहक हमारे बारे में क्या कहते हैं",
      "marginDoodle": [
            "सच्ची",
            "समीक्षाएं",
            "असली लोग"
      ],
      "trustNote": "आपका विश्वास अनमोल है",
      "summary": {
            "rating": "4.8",
            "max": "5",
            "countText": "500+ सत्यापित ग्राहक समीक्षाओं पर आधारित",
            "starsBreakdown": {
                  "star5": "5 स्टार (88%)",
                  "star4": "4 स्टार (9%)",
                  "star3": "3 स्टार (2%)",
                  "star2": "2 स्टार (1%)",
                  "star1": "1 स्टार (0%)"
            }
      },
      "filterTabs": {
            "all": "सभी समीक्षाएं",
            "achar": "अचार व प्रिजर्व्स",
            "sweets": "पारंपरिक मिठाइयाँ",
            "murabba": "मुरब्बा"
      },
      "btnWriteReview": "✍️ अपनी समीक्षा लिखें",
      "form": {
            "title": "समीक्षा लिखें",
            "subtitle": "सात्विक स्वाद के साथ अपना वास्तविक अनुभव साझा करें",
            "nameLabel": "आपका नाम *",
            "namePlaceholder": "उदा. अनन्या रॉय",
            "productLabel": "खरीदा गया उत्पाद *",
            "productPlaceholder": "उत्पाद चुनें",
            "ratingLabel": "रेटिंग *",
            "commentLabel": "आपकी समीक्षा *",
            "commentPlaceholder": "खुशबू, सरसों के तेल की शुद्धता, कुरकुरापन और घर जैसे स्वाद के बारे में बताएं...",
            "btnSubmit": "समीक्षा सबमिट करें",
            "successMsg": "✅ धन्यवाद! आपकी समीक्षा सत्यापन के लिए जमा कर दी गई है।"
      },
      "staticCards": [
            {
                  "name": "प्रिया शर्मा",
                  "quote": "\"स्वाद बिल्कुल प्रामाणिक और घर जैसा है! हर निवाले में पारंपरिक विधियों का स्वाद महसूस होता है। मेरा पूरा परिवार इसे पसंद करता है!\"",
                  "product": "हरी मिर्च का अचार",
                  "verified": "✅ सत्यापित खरीद"
            },
            {
                  "name": "रोहित वर्मा",
                  "quote": "\"उत्कृष्ट गुणवत्ता और शुद्ध सामग्रियां। कांच की बरनी की पैकेजिंग भी बहुत सुरक्षित है। निश्चित रूप से दोबारा ऑर्डर करूंगा!\"",
                  "product": "आंवला पाउडर",
                  "verified": "✅ सत्यापित खरीद"
            },
            {
                  "name": "नेहा गुप्ता",
                  "quote": "\"मैंने मिठाइयाँ और अचार दोनों आजमाए। सब कुछ बेहद ताजा, स्वादिष्ट और घर का बना है। अत्यधिक अनुशंसित!\"",
                  "product": "बेसन बर्फी",
                  "verified": "✅ सत्यापित खरीद"
            },
            {
                  "name": "अमित सिंह",
                  "quote": "\"आखिरकार एक ऐसा ब्रांड मिला जो परंपरा को जीवित रखता है। गुणवत्ता, स्वाद और शुद्धता वाकई लाजवाब है।\"",
                  "product": "मिक्स वेज अचार",
                  "verified": "✅ सत्यापित खरीद"
            }
      ],
      "btnViewMore": "और समीक्षाएं देखें →",
      "loadingText": "⏳ सुरक्षित सर्वर से और सत्यापित समीक्षाएं लोड हो रही हैं..."
},

    cartPage: {
      "title": "शॉपिंग कार्ट",
      "backToShop": "← वापस दुकान पर जाएं",
      "itemCountSingular": "आइटम",
      "itemCountPlural": "आइटम",
      "clearBtn": "कार्ट खाली करें",
      "purityNotice": "100% सात्विक शुद्धता गारंटी • कच्ची घानी सरसों के तेल में धूप में पका • बिना लहसुन, प्याज व केमिकल",
      "tableHeaders": {
            "product": "उत्पाद",
            "pack": "पैक",
            "price": "मूल्य",
            "quantity": "मात्रा",
            "subtotal": "उप-योग",
            "remove": "हटाएं"
      },
      "eachLabel": "प्रति नग",
      "removeAria": "आइटम हटाएं",
      "emptyTitle": "आपकी कार्ट खाली है",
      "emptyDesc": "आपने अभी तक अपनी कार्ट में कोई पारंपरिक अचार या मिठाई नहीं जोड़ी है। हमारे ताजा बैच देखें!",
      "exploreBtn": "उत्पाद कैटलॉग देखें →",
      "coupon": {
            "placeholder": "कूपन कोड दर्ज करें (उदा. SATVIK10)",
            "applyBtn": "लागू करें",
            "appliedMsg": "कूपन SATVIK10 लागू हुआ! (10% छूट)"
      },
      "summaryTitle": "ऑर्डर सारांश",
      "subtotalLabel": "आइटम उप-योग:",
      "deliveryLabel": "डिलीवरी शुल्क:",
      "freeDeliveryText": "मुफ़्त (उद्घाटन ऑफर)",
      "couponDiscountLabel": "कूपन छूट:",
      "totalPayableLabel": "कुल देय राशि:",
      "checkoutBtn": "चेकआउट के लिए आगे बढ़ें",
      "confirmClear": "क्या आप वाकई अपनी कार्ट खाली करना चाहते हैं?"
},

    profile: {
      "sidebar": {
            "myProfile": "मेरी प्रोफाइल",
            "myOrders": "मेरे ऑर्डर",
            "myAddresses": "मेरे पते",
            "wishlist": "विशलिस्ट",
            "settings": "सेटिंग्स",
            "signIn": "साइन इन",
            "signOut": "लॉगआउट",
            "googleAccount": "गूगल खाता",
            "doodleText": "स्वस्थ पसंद, खुशहाल आप ↴ ♡"
      },
      "personalInfo": {
            "title": "व्यक्तिगत जानकारी",
            "editBtn": "✏ प्रोफाइल संपादित करें",
            "closeEditBtn": "✕ बंद करें",
            "nameLabel": "नाम",
            "emailLabel": "ईमेल पता",
            "phoneLabel": "फोन नंबर",
            "joinedLabel": "जुड़ने की तिथि",
            "fullNameLabel": "पूरा नाम",
            "placeholders": {
                  "name": "अपना पूरा नाम दर्ज करें",
                  "email": "naam@example.com",
                  "phone": "10 अंकों का मोबाइल नंबर"
            },
            "cancelBtn": "रद्द करें",
            "saveBtn": "💾 बदलाव सहेजें",
            "doodleText": "उत्तम भोजन, उत्तम मन ♡"
      },
      "addresses": {
            "summaryTitle": "सहेजे गए पते",
            "addBtn": "+ नया पता जोड़ें",
            "emptySummary": "अभी तक कोई पता सहेजा नहीं गया है।",
            "fullTitle": "मेरे डिलीवरी पते",
            "fullSubtitle": "1-क्लिक चेकआउट के लिए डिलीवरी पते प्रबंधित करें",
            "emptyFullTitle": "कोई सहेजा गया पता नहीं",
            "emptyFullDesc": "तेज़ 1-क्लिक चेकआउट के लिए अपना घर या कार्यालय का पता जोड़ें।",
            "types": {
                  "home": "🏠 घर",
                  "work": "🏢 कार्यालय",
                  "other": "📍 अन्य"
            },
            "defaultBadge": "डिफ़ॉल्ट",
            "setDefaultBtn": "डिफ़ॉल्ट बनाएं",
            "editTitle": "पता संपादित करें",
            "deleteTitle": "पता हटाएं",
            "confirmDelete": "क्या आप वाकई इस डिलीवरी पते को हटाना चाहते हैं?",
            "toastSaved": "📍 पता सफलतापूर्वक सहेजा गया!",
            "toastDeleted": "🗑 पता हटा दिया गया",
            "toastDefault": "⭐ डिफ़ॉल्ट पता अपडेट किया गया!"
      },
      "orders": {
            "summaryTitle": "ऑर्डर इतिहास",
            "viewAllBtn": "सभी ऑर्डर देखें →",
            "emptySummaryTitle": "अभी तक कोई पिछला ऑर्डर नहीं है",
            "emptySummaryDesc": "हमारे प्रामाणिक हस्तनिर्मित अचार और पारंपरिक मिठाइयों का आनंद लें।",
            "exploreBtn": "उत्पाद देखें →",
            "fullTitle": "मेरे ऑर्डर व डिलीवरी इतिहास",
            "fullSubtitle": "सक्रिय शिपमेंट ट्रैक करें और पसंदीदा वस्तुएं दोबारा ऑर्डर करें",
            "countBadge": "कुल: {n}",
            "filters": {
                  "all": "सभी ऑर्डर",
                  "delivered": "डिलीवर हुआ",
                  "transit": "रास्ते में",
                  "processing": "तैयार हो रहा है"
            },
            "status": {
                  "delivered": "डिलीवर हुआ",
                  "transit": "रास्ते में",
                  "processing": "तैयार हो रहा है"
            },
            "emptyOrdersTitle": "कोई ऑर्डर नहीं मिला",
            "emptyOrdersDesc": "इस फ़िल्टर के अंतर्गत आपका कोई ऑर्डर नहीं है।",
            "browseBtn": "कैटलॉग देखें",
            "orderNum": "ऑर्डर सं.",
            "placedOn": "ऑर्डर तिथि",
            "viewDetailsBtn": "विवरण देखें",
            "reorderBtn": "🔄 दोबारा ऑर्डर करें",
            "toastReordered": "🛒 आइटम आपकी कार्ट में जोड़े गए!"
      },
      "wishlist": {
            "title": "मेरी विशलिस्ट",
            "subtitle": "आपकी रसोई के लिए सहेजे गए अनमोल पारंपरिक उत्पाद",
            "addAllBtn": "🛒 सभी को कार्ट में जोड़ें",
            "emptyTitle": "आपकी विशलिस्ट खाली है",
            "emptyDesc": "पारंपरिक प्रेम से बने हमारे शुद्ध धूप में पके अचार और मिठाइयाँ देखें!",
            "browseBtn": "🛍 कैटलॉग देखें"
      },
      "settings": {
            "title": "खाता व प्राथमिकताएं",
            "subtitle": "अपने नोटिफिकेशन चैनल, भाषा और डिलीवरी प्राथमिकताओं को नियंत्रित करें",
            "notifyTitle": "🔔 सूचनाएं (Notifications)",
            "waTitle": "व्हाट्सएप ऑर्डर व डिलीवरी अपडेट",
            "waDesc": "व्हाट्सएप पर रियल-टाइम ट्रैकिंग लिंक, इनवॉइस और डिलीवरी ओटीपी प्राप्त करें।",
            "smsTitle": "एसएमएस प्रेषण अलर्ट",
            "smsDesc": "कूरियर डिलीवरी के लिए निकलने पर तुरंत एसएमएस प्राप्त करें।",
            "emailTitle": "मौसमी अचार व त्यौहारी ऑफर ईमेल",
            "emailDesc": "सीमित मौसमी फसल बैचों (आंवला, कटहल, आम) का स्वाद सबसे पहले चखें।",
            "langRegTitle": "🌐 भाषा व क्षेत्र",
            "interfaceLangLabel": "इंटरफ़ेस भाषा",
            "currencyLabel": "मुद्रा प्रदर्शन",
            "deliveryNoteTitle": "🚚 डिफ़ॉल्ट डिलीवरी निर्देश",
            "specialInstructionsLabel": "विशेष डिलीवरी निर्देश",
            "deliveryPlaceholder": "उदा. घंटी बजाएं, बरामदे में या सुरक्षा गार्ड के पास छोड़ दें",
            "dataBackupTitle": "🔒 डेटा व क्लाउड बैकअप",
            "cacheTitle": "लोकल ब्राउज़र कैश",
            "cacheDesc": "यदि डेटा संबंधी समस्या आ रही हो तो कार्ट, पते और फ़ॉर्म स्टोरेज को रीसेट करें।",
            "clearCacheBtn": "🧹 कैश साफ़ करें",
            "savePrefsBtn": "💾 प्राथमिकताएं सहेजें",
            "toastSavedPrefs": "✅ प्राथमिकताएं सफलतापूर्वक सहेजी गईं!"
      },
      "addressModal": {
            "addTitle": "नया डिलीवरी पता जोड़ें",
            "editTitle": "डिलीवरी पता संपादित करें",
            "recipientLabel": "प्राप्तकर्ता का नाम",
            "phoneLabel": "मोबाइल नंबर",
            "houseLabel": "फ्लैट / मकान सं. / भवन",
            "streetLabel": "सड़क / क्षेत्र / इलाका",
            "cityLabel": "शहर",
            "stateLabel": "राज्य",
            "pincodeLabel": "पिनकोड",
            "defaultCheck": "डिफ़ॉल्ट पते के रूप में सेट करें",
            "cancelBtn": "रद्द करें",
            "saveBtn": "पता सहेजें"
      },
      "orderModal": {
            "title": "ऑर्डर विवरण",
            "orderPlaced": "ऑर्डर तिथि:",
            "paymentMethod": "भुगतान विधि:",
            "deliveryAddress": "डिलीवरी का पता:",
            "itemsTitle": "इस ऑर्डर के उत्पाद",
            "qty": "मात्रा:",
            "subtotal": "आइटम उप-योग",
            "delivery": "डिलीवरी शुल्क",
            "totalPaid": "कुल भुगतान",
            "free": "मुफ़्त"
      }
},

    policies: {
      "navTabs": {
            "privacy": "🔒 गोपनीयता नीति",
            "terms": "📜 नियम व शर्तें",
            "shipping": "🚚 शिपिंग व डिलीवरी",
            "refund": "🔄 रद्दीकरण व रिफंड",
            "cookies": "🍪 कुकीज नीति",
            "contact": "📞 सहायता संपर्क"
      },
      "cancellationRefund": {
            "badge": "🛡️ पारंपरिक खाद्य व कांच की बरनी सुरक्षा नीति",
            "title": "रद्दीकरण एवं रिफंड नीति",
            "subtitle": "सात्विक स्वाद के ऑर्डर रद्दीकरण, पारगमन में कांच की सुरक्षा और खाद्य स्वच्छता पर स्पष्ट, पारदर्शी दिशा-निर्देश।",
            "meta": {
                  "effectiveDate": "प्रभावी तिथि: 1 अगस्त, 2026",
                  "lastUpdated": "अंतिम अपडेट: 10 सितंबर, 2026",
                  "scope": "दायरा: ऑनलाइन स्टोर व व्हाट्सएप कॉमर्स"
            },
            "highlight1Title": "100% निःशुल्क प्रतिस्थापन (Free Replacement) गारंटी",
            "highlight1Desc": "यदि पारगमन में कांच की बरनी टूटती या लीक होती है, तो 24-48 घंटों के भीतर फोटो/वीडियो प्रमाण मिलते ही हम तुरंत 100% निःशुल्क नई बरनी भेजते हैं।",
            "highlight2Title": "प्रेषण-पूर्व आसान रद्दीकरण",
            "highlight2Desc": "ऑर्डर देने के 2 घंटे के भीतर या कूरियर प्रेषण से पहले 100% पूरे रिफंड के साथ बिना किसी शुल्क के ऑर्डर रद्द किया जा सकता है।",
            "highlight3Title": "उपभोज्य खाद्य स्वच्छता प्रोटोकॉल",
            "highlight3Desc": "प्रत्येक परिवार के स्वास्थ्य और पवित्रता की रक्षा हेतु, कांच की बरनियों में सील किए गए खाद्य उत्पादों को डिलीवरी के बाद वापस नहीं लिया जाता।",
            "tocTitle": "नीति की धाराएं",
            "tocCount": "6 धाराएं"
      },
      "shippingDelivery": {
            "badge": "🚚 अखिल भारतीय पारंपरिक डिलीवरी गाइड",
            "title": "शिपिंग एवं डिलीवरी नीति",
            "subtitle": "साप्ताहिक ताजा बैच प्रेषण, 5-स्तरीय अटूट कांच-जार पारगमन सुरक्षा, और पूरे भारत में सीधा, निजी व्हाट्सएप ट्रैकिंग।",
            "meta": {
                  "effectiveDate": "प्रभावी तिथि: 10 सितंबर, 2026",
                  "dispatchWindow": "प्रेषण अवधि: 24–48 कार्य घंटे",
                  "coverage": "कवरेज: 19,000+ पिन कोड"
            },
            "highlight1Title": "24–48 घंटे में ताजा प्रेषण",
            "highlight1Desc": "साप्ताहिक पके बैचों से ताजा पैक किया जाता है। 24-48 कार्य घंटों के भीतर प्रमुख एक्सप्रेस कूरियर को सौंपा जाता है।",
            "highlight2Title": "5-स्तरीय कांच सुरक्षा",
            "highlight2Desc": "इंडक्शन लीकप्रूफ सील, बबल कुशन और मजबूत कार्टन। पारगमन में क्षति होने पर 100% मुफ्त प्रतिस्थापन।",
            "highlight3Title": "निजी व्हाट्सएप ट्रैकिंग",
            "highlight3Desc": "लाइव डिस्पैच अपडेट और ट्रैकिंग लिंक सीधे सत्यापित व्हाट्सएप (+91 92365 87600) पर भेजे जाते हैं। बिल्कुल कोई प्रचारक स्पैम नहीं।"
      },
      "privacyPolicy": {
            "badge": "🔒 पारदर्शी शुद्धता वचनबद्धता",
            "title": "गोपनीयता नीति",
            "subtitle": "सरल, ईमानदार और पारदर्शी गोपनीयता वचन। हम आपके ऑर्डर विवरण, भुगतान सुरक्षा और व्यक्तिगत डेटा की सुरक्षा पीढ़ियों की सत्यनिष्ठा के साथ कैसे करते हैं।",
            "meta": {
                  "effectiveDate": "प्रभावी तिथि: 10 सितंबर, 2026",
                  "scope": "दायरा: ग्राहक ऑर्डर व स्टोरफ्रंट",
                  "dataSelling": "डेटा बिक्री: पूर्णतः प्रतिबंधित (0%)"
            },
            "pillars": {
                  "zeroSellingTitle": "शून्य डेटा बिक्री (0%)",
                  "zeroSellingDesc": "विज्ञापनदाताओं को कभी किराए पर, बेचा या साझा नहीं किया जाता",
                  "sslTitle": "256-बिट एसएसएल भुगतान",
                  "sslDesc": "आरबीआई-अनुपालन गेटवे; कोई कार्ड विवरण सहेजा नहीं जाता",
                  "minimalDataTitle": "न्यूनतम ऑर्डर डेटा",
                  "minimalDataDesc": "केवल वही जो आपकी बरनियों को डिलीवर करने के लिए आवश्यक है",
                  "rightsTitle": "पूर्ण खाता अधिकार",
                  "rightsDesc": "त्वरित डेटा देखने, अपडेट करने और हटाने का अधिकार",
                  "directCommTitle": "प्रत्यक्ष संवाद",
                  "directCommDesc": "शून्य तृतीय-पक्ष संदेश या मेल सेवाएं"
            },
            "guaranteeTitle": "प्रत्यक्ष व सुरक्षित संचार गारंटी",
            "guaranteeText": "सात्विक स्वाद किसी भी तीसरे पक्ष की प्रचारक संदेश या मार्केटिंग ईमेल सेवा का उपयोग नहीं करता है। सभी ऑर्डर अपडेट व बातचीत हमारे सत्यापित व्हाट्सएप (+91 92365 87600) और आधिकारिक ईमेल (satvikswaad.care@gmail.com) पर 100% निजी व सुरक्षित रूप से की जाती है। हम कभी भी आपका विवरण किसी विपणन एजेंसी को नहीं देंगे।"
      },
      "termsConditions": {
            "badge": "🌿 आत्मीय पारंपरिक खाद्य समझौता",
            "title": "नियम एवं शर्तें",
            "subtitle": "सात्विक स्वाद में आपका स्वागत है। हमने कानूनी जटिलताओं को ईमानदारी, माँ के स्वाद की विरासत और आपके मानसिक सुकून से भरे 5-सूत्रीय समझौते से बदल दिया है।",
            "meta": {
                  "effectiveDate": "प्रभावी तिथि: 10 सितंबर, 2026",
                  "kitchen": "पारंपरिक रसोई: हाथ से बने लघु बैच",
                  "transparency": "पारदर्शिता: 100% देसी विश्वास"
            },
            "highlight1Title": "पारंपरिक विरासत",
            "highlight1Desc": "100% शुद्ध कच्ची घानी सरसों का तेल, A2 गाय का घी और पारंपरिक पारिवारिक विधियाँ। कृत्रिम परिरक्षकों या रासायनिक शॉर्टकट से सर्वथा मुक्त।",
            "highlight2Title": "ताजा लघु बैच",
            "highlight2Desc": "धूप में पके लघु बैच और साप्ताहिक बॉटलिंग। 24-48 कार्य घंटों में ताजा प्रेषण और भारतीय रुपये (₹) में पूर्ण मूल्य पारदर्शिता।",
            "highlight3Title": "सुरक्षित कांच डिलीवरी व देखभाल",
            "highlight3Desc": "अखिल भारतीय शॉक सुरक्षा के साथ 100% फ़ूड-ग्रेड कांच की बरनियाँ। पारगमन क्षति होने पर सीधा व्हाट्सएप सहायता से मुफ्त प्रतिस्थापन।"
      },
      "cookiesPolicy": {
            "badge": "🍪 गोपनीयता-प्रथम स्टोरेज नीति",
            "title": "कुकीज एवं लोकल स्टोरेज नीति",
            "subtitle": "सात्विक स्वाद में हम शुद्ध स्वाद और पूर्ण गोपनीयता पर विश्वास करते हैं। हम केवल न्यूनतम आवश्यक ब्राउज़र कुकीज का उपयोग करते हैं जिससे आपकी कार्ट सुरक्षित रहे — विज्ञापन ट्रैकर्स से सर्वथा मुक्त।",
            "meta": {
                  "effectiveDate": "प्रभावी तिथि: 10 सितंबर, 2026",
                  "trackers": "विज्ञापन ट्रैकर्स: बिल्कुल 0 (कोई नहीं)",
                  "promise": "ब्रांड वचन: 100% गोपनीयता सम्मान"
            },
            "highlight1Title": "केवल अनिवार्य कार्य",
            "highlight1Desc": "हम केवल आपकी यात्रा के लिए अत्यंत आवश्यक डेटा संग्रहीत करते हैं: कार्ट में अचार सहेजना, सुरक्षित लॉगिन और आपकी भाषा प्राथमिकता याद रखना।",
            "highlight2Title": "शून्य तृतीय-पक्ष विज्ञापन ट्रैकर्स",
            "highlight2Desc": "कोई मेटा पिक्सेल नहीं, कोई गूगल एडसेंस नहीं। हम एक पारंपरिक रसोई हैं, कोई विज्ञापन दलाल नहीं। हम आपकी गतिविधि कभी नहीं बेचते।"
      }
},

    orderSuccess: {
      "title": "धन्यवाद! आपका ऑर्डर प्राप्त हो गया है",
      "subtitle": "आपका ऑर्डर कन्फर्म हो गया है और हमारी शुद्ध, पारंपरिक पद्धति से प्यार से पैक किया जाएगा। नीचे रसीद दी गई है।",
      "meta": {
            "orderNumber": "ऑर्डर संख्या",
            "orderDate": "ऑर्डर तिथि",
            "paymentMode": "भुगतान विधि",
            "totalAmount": "कुल राशि"
      },
      "stepperHeading": "🚚 ऑर्डर स्थिति व पूर्ति",
      "stepper": {
            "placedTitle": "ऑर्डर प्राप्त",
            "placedSub": "पुष्ट",
            "prepTitle": "तैयारी",
            "prepSub": "ताजा बैच",
            "packTitle": "पैक हुआ",
            "packSub": "गुणवत्ता जांची गई",
            "dispTitle": "भेज दिया गया",
            "dispSub": "एक्सप्रेस कूरियर",
            "delivTitle": "डिलीवर हुआ",
            "delivSub": "आपके द्वार पर"
      },
      "receiptHeading": "📦 विस्तृत ऑर्डर सारांश",
      "subtotalLabel": "आइटम उप-योग:",
      "deliveryLabel": "डिलीवरी व शिपिंग:",
      "freeDeliveryText": "मुफ़्त (🎉 उद्घाटन ऑफर)",
      "totalPayableLabel": "कुल देय राशि:",
      "addressLabel": "📍 डिलीवरी का पता:",
      "buttons": {
            "waNotify": "💬 व्हाट्सएप पर लाइव अपडेट पाएं",
            "printReceipt": "🖨️ ऑर्डर रसीद प्रिंट करें",
            "viewOrders": "👤 ऑर्डर इतिहास में देखें",
            "continueShopping": "🛍️ खरीदारी जारी रखें"
      }
},

    paymentFailed: {
      "statusPill": "भुगतान अधूरा रहा",
      "title": "भुगतान पूरा नहीं हो सका",
      "safeTitle": "आपके पैसे पूरी तरह सुरक्षित हैं!",
      "safeDesc": "यदि आपके खाते से कोई राशि कटी है, तो आपका बैंक 3-5 कार्य दिवसों में उसे स्वचालित रूप से वापस कर देगा। आपकी कार्ट सुरक्षित है ताकि आपको दोबारा सामान न चुनना पड़े।",
      "meta": {
            "orderIdLabel": "संदर्भ ऑर्डर आईडी",
            "orderAmountLabel": "ऑर्डर राशि",
            "reasonLabel": "विफलता का कारण",
            "defaultReason": "लेन-देन रद्द कर दिया गया या आपके बैंक द्वारा अस्वीकार कर दिया गया।"
      },
      "buttons": {
            "retry": "🔄 ऑनलाइन भुगतान पुनः प्रयास करें",
            "cod": "📦 कैश ऑन डिलीवरी में बदलें (द्वार पर भुगतान करें)",
            "waHelp": "💬 सहायता चाहिए? व्हाट्सएप पर बात करें",
            "backShop": "🛍️ दुकान व कार्ट पर वापस जाएं"
      },
      "faq": {
            "title": "❓ सामान्य प्रश्न",
            "q1": "मेरा लेन-देन असफल क्यों हुआ?",
            "a1": "बैंक सर्वर टाइमआउट, गलत ओटीपी, अस्थायी कार्ड सीमा या रद्द किए गए अनुरोध के कारण ऐसा हो सकता है।",
            "q2": "क्या मैं कैश ऑन डिलीवरी से भुगतान कर सकता हूँ?",
            "a2": "हाँ! बस ऊपर दिए गए \"कैश ऑन डिलीवरी में बदलें\" बटन पर क्लिक करें। हम आपके पते की पुष्टि करेंगे और बिना किसी अग्रिम भुगतान के ऑर्डर भेज देंगे।"
      }
},

    notFound: {
      "badge": "स्वाद की राह में भटक गए!",
      "title": "पृष्ठ नहीं मिला (404)",
      "desc": "जिस लिंक पर आप आए हैं वह टूट गया हो सकता है, या यह पृष्ठ नई जगह चला गया है। चिंता न करें, असली स्वाद आपका हमेशा इंतजार कर रहे हैं!",
      "searchPlaceholder": "अचार, मुरब्बा, मिठाइयाँ खोजें...",
      "searchBtn": "खोजें 🔍",
      "buttons": {
            "explore": "🛍️ सभी 15 उत्पाद देखें",
            "home": "🏠 मुख्य पृष्ठ पर वापस जाएं",
            "wa": "💬 व्हाट्सएप पर बात करें"
      },
      "popularHeading": "✨ सर्वाधिक लोकप्रिय उत्पाद"
}
  },

  ur: {
    langToggleText: "اردو",
    langToggleAria: "اردو زبان میں تبدیل کریں",
    brandSub: "خالص روایتی ذائقہ",

    // Announcement Ticker
    ticker: [
      "✨ 100% گھر کے بنے اصلی روایتی اچار",
      "☀️ کولڈ پریسڈ سرسوں کے تیل میں دھوپ میں تیار",
      "👵 بزرگوں کے نایاب خاندانی نسخے",
      "🌿 بنا کسی کیمیکل و ملاوٹ کے 100% خالص",
      "🪔 اصلی دیہاتی ذائقہ اور سوندھی خوشبو",
      "📦 ہر ہفتے تازہ اور خالص پیکنگ"
    ],

    // Header & Navigation
    nav: {
      home: "ہوم",
      products: "دکان",
      whyUs: "صحت و پاکیزگی",
      ourStory: "ہماری کہانی",
      reviews: "صارفین کی رائے",
      faq: "عمومی سوالات",
      contact: "رابطہ",
      comparison: "موازنہ",
      profile: "پروفائل",
      cart: "ٹوکری",
      menu: "مینو"
    },

    // Mobile Bottom Nav
    bottomNav: {
      home: "ہوم",
      products: "مصنوعات",
      cart: "ٹوکری",
      profile: "پروفائل"
    },

    // Trust Badges
    trust: {
      sunCuredTitle: "دھوپ میں تیار",
      sunCuredDesc: "قدرتی دھوپ میں پکا",
      oilTitle: "کچی گھانی تیل",
      oilDesc: "خالص سرسوں کا تیل",
      pureTitle: "کیمیکل سے پاک",
      pureDesc: "کوئی مصنوعی مواد نہیں",
      recipeTitle: "روایتی نسخے",
      recipeDesc: "خالص روایتی مصالحے"
    },

    // Reorder section
    reorder: {
      title: "دوبارہ آرڈر کریں",
      subtitle: "اپنے پسندیدہ ذائقے ایک کلک میں دوبارہ حاصل کریں۔",
      btnReorder: "آرڈر کریں"
    },

    // Catalog & Products
    catalog: {
      heading: "ہماری تمام 17 روایتی مصنوعات",
      badge: "روایت اور خالص پن کا اصلی ذائقہ",
      searchPlaceholder: "🔍 اچار، مربہ، مٹھائیاں تلاش کریں...",
      sortDefault: "تازہ ترین پہلے",
      sortPriceAsc: "قیمت: کم سے زیادہ",
      sortPriceDesc: "قیمت: زیادہ سے کم",
      sortNameAsc: "نام: الف سے ے",
      sortRating: "بہترین ریٹنگ",
      tabs: {
        all: "تمام مصنوعات (17)",
        achar: "روایتی اچار (9)",
        murabba: "مربہ (2)",
        sweets: "روایتی مٹھائیاں (3)",
        health: "صحت بخش مصنوعات (3)"
      },
      bestseller: "بہترین انتخاب",
      healthyChoice: "صحت بخش",
      newBadge: "نیا",
      traditionalRecipe: "روایتی ترکیب",
      inStock: "دستیاب ہے",
      outOfStock: "ختم ہو چکا ہے",
      save: "بچت",
      saveTag: "بچت",
      availablePacks: "دستیاب پیک:",
      btnViewDetails: "تفصیلات دیکھیں 👁️",
      btnAddCart: "ٹوکری میں شامل کریں 🛒",
      btnAdded: "شامل ہو گیا! ✓",
      verifiedReviews: "تصدیق شدہ جائزے",
      catAcharTitle: "روایتی اچار",
      catAcharCount: "9 اصلی روایتی نسخے",
      catSweetsTitle: "دیسی مٹھائیاں اور مربہ",
      catSweetsCount: "5 روایتی پکوان",
      catHealthTitle: "صحت و پاکیزگی",
      catHealthCount: "3 روایتی قدرتی نسخے",
      catAllTitle: "تمام مصنوعات",
      catAllCount: "17 ہاتھ سے بنی مصنوعات",
      villageCategoriesBadge: "نظام آباد گاؤں کی سوغات",
      villageCategoriesTitle: "دیہاتی روایتی اقسام دیکھیں",
      filterBy: "فلٹر کریں",
      price: "قیمت",
      sortBy: "ترتیب دیں",
      showingProducts: "تمام ہاتھ سے بنی مصنوعات دکھائی جا رہی ہیں",
      pickYourFavourite: "اپنی پسند منتخب کریں",
      under200: "200 روپے سے کم",
      price200_400: "200 – 400 روپے",
      price401_600: "401 – 600 روپے",
      above600: "600 روپے سے زیادہ",
      availability: "دستیابی",
      reviewsCount: "جائزے",
      offTag: "چھوٹ"
    },

    // Product Details Page
    productDetails: {
      breadcrumbHome: "ہوم",
      breadcrumbProducts: "مصنوعات",
      selectPack: "پیک کا سائز / وزن منتخب کریں:",
      quantity: "مقدار:",
      btnAddToCart: "ٹوکری میں شامل کریں 🛒",
      btnBuyNow: "فوری خریداری (ابھی خریدیں) ⚡",
      tabIngredients: "اجزاء اور پاکیزگی",
      tabHealth: "صحت کے فوائد",
      tabStorage: "استعمال اور میعاد",
      tabReviews: "صارفین کی رائے",
      shelfLifeLabel: "تصدیق شدہ میعاد:",
      storageLabel: "حفاظتی ہدایات:",
      allergensLabel: "الرجی الرٹ:",
      packagingLabel: "پیکجنگ کا معیار:",
      specsTitle: "اصلی مصنوعات کی تفصیلات اور معیار کی ضمانت",
      heritageDescTitle: "روایتی ورثہ اور مکمل تفصیل",
      ingredientsTitle: "خالص اور روایتی اجزاء",
      storageTitle: "حفاظتی ہدایات اور قدرتی میعاد",
      allergenTitle: "الرجی اور پیکجنگ کا تحفظ",
      verifiedReviews: "تصدیق شدہ صارفین کے جائزے",
      reviewsSub: "ان گھرانوں کے سچے تاثرات جو نسل در نسل روایتی ذائقے کو پسند کرتے ہیں۔",
      allReviewsBtn: "تمام جائزے ←",
      writeReview: "اپنی رائے لکھیں",
      addReviewTitle: "اپنی رائے درج کریں",
      namePlaceholder: "آپ کا نام",
      reviewPlaceholder: "اس سوغات کے بارے میں اپنا تجربہ بیان کریں...",
      btnSubmitReview: "رائے ارسال کریں ⭐",
      ratingBreakdown: "ریٹنگ کی تفصیل",
      relatedTitle: "آپ کو یہ بھی پسند آ سکتا ہے",
      relatedSub: "اسی لگن اور خلوص سے تیار کردہ دیگر روایتی اچار اور سوغاتیں۔",
      inStock: "● دستیاب ہے",
      outOfStock: "● ختم ہو چکا ہے",
      onlyLeft: "● صرف {count} باقی ہیں — جلدی کریں!",
      inclusiveTaxes: "تمام ٹیکس شامل ہیں",
      skuLabel: "ایس کے یو:",
      freeTransit: "راستے میں نقصان کی صورت میں مفت متبادل",
      freshBatches: "ہر ہفتے تازہ تیار کردہ",
      perkDispatch: "24 سے 48 گھنٹوں کے اندر ترسیل",
      perkPayment: "محفوظ آن لائن ادائیگی اور کیش آن ڈیلیوری",
      perkReplacement: "ٹوٹ پھوٹ یا لیکیج پر 100% مفت متبادل"
    },

    // Cart Drawer
    cart: {
      title: "آپ کی ٹوکری",
      freeDeliveryNote: "🚚 ₹499 سے زائد کے تمام آرڈرز پر مفت ڈیلیوری",
      emptyMsg: "آپ کی ٹوکری خالی ہے۔ روایتی اچار اور مربے شامل کریں!",
      continueShopping: "مصنوعات دیکھیں",
      subtotal: "کل رقم:",
      btnCheckout: "ادائیگی کے لیے آگے بڑھیں 💳",
      toastAdded: "ٹوکری میں شامل کر دیا گیا! 🛒",
      toastRemoved: "آئٹم ہٹا دیا گیا ہے۔",
      toastMax: "دستیاب اسٹاک کی حد ختم۔"
    },

    // Quick Checkout Modal
    checkout: {
      title: "فوری چیک آؤٹ",
      subtitle: "ایک منٹ میں کیش آن ڈیلیوری یا UPI کے ذریعے آرڈر کریں",
      nameLabel: "پورا نام *",
      namePlaceholder: "مثلاً محمد علی",
      phoneLabel: "موبائل نمبر *",
      phonePlaceholder: "مثلاً 9876543210",
      addressLabel: "ڈیلیوری کا پتہ *",
      addressPlaceholder: "مکان نمبر، گلی، علاقہ، قریبی نشانی...",
      cityLabel: "شہر / قصبہ *",
      cityPlaceholder: "مثلاً وارانسی",
      stateLabel: "صوبہ / ریاست *",
      statePlaceholder: "مثلاً اتر پردیش",
      pincodeLabel: "پن کوڈ *",
      pincodePlaceholder: "مثلاً 221001",
      paymentTitle: "طریقہ کار منتخب کریں",
      paymentCod: "کیش آن ڈیلیوری (COD)",
      paymentCodSub: "جب تازہ اچار آپ کی دہلیز پر پہنچیں تب ادائیگی کریں",
      paymentOnline: "آن لائن ادائیگی (UPI / کارڈ)",
      paymentOnlineSub: "گوگل پے، فون پے، پے ٹی ایم، کارڈز اور نیٹ بینکنگ",
      btnPlaceOrder: "آرڈر کنفرم کریں 📦",
      btnPlacing: "آرڈر بھیجا جا رہا ہے..."
    },

    // Global Footer
    footer: {
      brandDesc: "ساٹوک سواد میں ہم خالص، گھر کے بنے روایتی اچار اور دیسی پکوان تیار کرتے ہیں جو نسلوں پرانی پاکیزگی اور سوندھا ذائقہ آپ کی روزمرہ زندگی کا حصہ بناتے ہیں۔",
      quickLinks: "اہم لنکس",
      contactHeading: "رابطہ کریں",
      callSupport: "کال سپورٹ",
      messageUs: "میسج کریں",
      emailResponse: "24 گھنٹوں میں ای میل جواب",
      phone: "فون / واٹس ایپ: 87600 92365 91+",
      email: "ای میل: satvikswaad.care@gmail.com",
      address: "پتہ: وارانسی، اتر پردیش، بھارت",
      links: {
        ourCollection: "ہمارا مجموعہ",
        picklesAchar: "روایتی اچار",
        sweetsMurabba: "مٹھائیاں اور مربہ",
        ourHeritageStory: "ہماری وراثت کی کہانی",
        healthPurityPromise: "صحت و پاکیزگی کا وعدہ",
        faqs: "اکثر پوچھے گئے سوالات",
        returnRefundPolicy: "منسوخی اور ریفنڈ پالیسی",
        shippingPolicy: "شپنگ اور ڈیلیوری پالیسی",
        privacyPolicy: "پرائیویسی پالیسی",
        cookiesPolicy: "کوکیز پالیسی",
        termsOfService: "شرائط و ضوابط"
      },
      newsletter: {
        title: "ہم سے جڑے رہیں",
        desc: "موسمی اچار، گھر کے بنے آملہ مربہ، روایتی لڈو اور تہواروں کے تحائف پر تازہ ترین معلومات حاصل کریں۔",
        placeholder: "اپنا ای میل درج کریں",
        subscribeBtn: "سبسکرائب کریں",
        footnote: "100% گھر کا بنا اور خالص • کبھی بھی ان سبسکرائب کریں۔"
      },
      copyright: "© 2026 ساٹوک سواد۔ جملہ حقوق محفوظ ہیں۔",
      tagline: "بھارت میں ❤️ سے تیار | خالص روایتی ذائقہ"
    },

    // Floating Support Assistant
    assistant: {
      title: "ساٹوک معاون",
      status: "آن لائن | روایتی مدد",
      welcome: "خوش آمدید! 🙏 ساٹوک سواد میں خوش آمدید۔ آج ہم آپ کی کیا مدد کر سکتے ہیں؟",
      chipTrack: "📦 میرا آرڈر ٹریک کریں",
      chipWa: "💬 واٹس ایپ سپورٹ",
      chipPurity: "🌿 پاکیزگی و تیل",
      chipBestsellers: "🍯 بہترین مصنوعات",
      placeholder: "پاکیزگی، آرڈر یا نسخوں کے بارے میں پوچھیں...",
      send: "ارسال کریں"
    },

    // Homepage Structured Sections
    home: {
      hero: {
        tagline: "اچار جو دل سے بنا، ماں کے ہاتھوں کا اصلی ذائقہ ❤️",
        subTagline: "ماں کے ذائقے کی وراثت، بیٹی کے خوابوں کی پہچان",
        slide1Alt: "ساٹوک سواد اصلی دیسی اچار - اچار جو دل سے بنا، ماں کے ہاتھوں کا اصلی ذائقہ",
        slide2Alt: "ساٹوک سواد 14 دن دھوپ میں پکا اچار خالص کچی گھانی سرسوں کے تیل میں",
        slide3Alt: "ساٹوک سواد کھیت کے تازہ اجزاء - ماں کے ذائقے کی وراثت، بیٹی کے خوابوں کی پہچان",
        captions: [
          "نظام آباد میں ماؤں کی محبت اور بزرگوں کی ترکیبوں سے تیار",
          "14 دن خالص کچی گھانی سرسوں کے تیل میں دھوپ میں تیار شدہ",
          "کھیتوں سے تازہ اجزاء اور نسل در نسل پاکیزہ ذائقہ"
        ],
        ctaShop: "ابھی خریدیں",
        ctaStory: "ہماری کہانی",
        ctaExplore: "خالص مصنوعات دیکھیں"
      },
      villageCategories: {
        eyebrow: "نظام آباد میں دستکاری سے تیار",
        title: "روایتی دیہی کیٹیگریز",
        acharTitle: "اچار اور چٹپٹے ذائقے",
        acharBadge: "9 روایتی ریسیپیز",
        sweetsTitle: "مٹھائیاں اور مربے",
        sweetsBadge: "5 خاندانی سوغاتیں",
        healthTitle: "صحت اور پاکیزگی",
        healthBadge: "3 قدرتی اور آیورویدک غذائیں",
        allTitle: "تمام مصنوعات",
        allBadge: "15 خالص مصنوعات"
      },
      whyChoose: {
        eyebrow: "خالص روایتی معیار کے چار ستون",
        titlePrefix: "ساٹوک سواد ہی",
        titleHighlight: "کیوں منتخب کریں؟",
        desc: "ہمیں بغیر کسی کیمیکل، بزرگوں کے نایاب نسخوں اور 14 دن تک دھوپ میں پکانے کی روایتی تکنیک سے تیار کردہ اچار اور مٹھائیوں پر فخر ہے۔",
        doodlePure: "خالص",
        doodleDesi: "دیسی",
        doodleHealthy: "صحت بخش",
        paperNote: "خالص روایتی غذائیت"
      },
      qualityPillars: {
        p1Title: "14 دن قدرتی دھوپ میں پکا",
        p1Desc: "14 دن قدرتی دھوپ میں پکایا گیا تاکہ روایتی ذائقہ اور قدرتی ہاضمہ برقرار رہے۔",
        p2Title: "100% خالص کچی گھانی سرسوں کا تیل",
        p2Desc: "بغیر کسی کیمیکل صفائی کے خالص سرسوں کا تیل، جو قدرتی خوشبو اور غذائیت سے بھرپور ہے۔",
        p3Title: "زیرو کیمیکل و بنا کسی مصنوعی مصالحے",
        p3Desc: "سوڈیم بینزویٹ اور مصنوعی سرکے سے بالکل پاک؛ صرف قدرتی سیندھا نمک اور مصالحوں کی حفاظت۔",
        p4Title: "نسلوں پرانے خاندانی روایتی نسخے",
        p4Desc: "نظام آباد کے گھرانوں کی بزرگ خواتین کے آزمودہ نسخے، جو اسی سچی لگن اور محبت سے تیار ہوتے ہیں۔"
      },
      comparison: {
        subtitle: "روایتی پاکیزگی بنام صنعتی اور کمرشل طریقے",
        title: "ساٹوک سواد بنام بازاری مصنوعات",
        colDim: "معیار جانچ",
        colSatvikTitle: "ساٹوک سواد",
        colSatvikSub: "خاندانی روایتی گھریلو طریقہ",
        colMarketTitle: "عام بازاری مصنوعات",
        colMarketSub: "معمول کے کمرشل متبادل",
        rows: [
          {
            dim: "تیل کی قسم",
            satvikTag: "100% کچی گھانی",
            satvikText: "100% خالص کچی گھانی سرسوں کا تیل۔ بنا کسی کیمیکل صفائی کے قدرتی اجزاء اور بھرپور ذائقہ برقرار۔",
            marketTag: "ریفائنڈ بلینڈز",
            marketText: "ریفائنڈ پام اور روئی کے بیجوں کا تیل مع کیمیائی پریزرویٹوز (TBHQ)۔ تیز آنچ پر تیار کردہ۔"
          },
          {
            dim: "محفوظ رکھنے کا طریقہ",
            satvikTag: "دھوپ میں پکا اور سیندھا نمک",
            satvikText: "روایتی سیندھا نمک، ہلدی، خالص سرسوں کے تیل کا تحفظ اور کئی دن کی دھوپ۔ قدرتی تحفظ بنا کیمیکل۔",
            marketTag: "مصنوعی کیمیکل",
            marketText: "مصنوعی کیمیائی پریزرویٹوز (سوڈیم بینزویٹ، پوٹاشیم میٹا بائیسلفائٹ)۔"
          },
          {
            dim: "کھٹاس کا ذریعہ",
            satvikTag: "قدرتی پھلوں کی کھٹاس",
            satvikText: "قدرتی دھوپ میں سوکھا آمچور، لیموں کا رس اور قدرتی طور پر تیار کھٹاس۔",
            marketTag: "مصنوعی تیزابیت",
            marketText: "صنعتی گلیشیل ایسیٹک ایسڈ (مصنوعی سرکہ INS 260) برائے مصنوعی کھٹاس۔"
          },
          {
            dim: "تیاری اور بیچ سائز",
            satvikTag: "شیشے کے برتن اور چھوٹے بیچ",
            satvikText: "50 کلو سے کم کے چھوٹے بیچ جو شیشے کے جار میں دھوپ میں تیار ہوتے ہیں۔",
            marketTag: "مشینی اور تیز آنچ",
            marketText: "صنعتی کڑاہوں میں تیز آنچ پر جلدی پکانا اور تیز رفتار مشینی پیکنگ۔"
          },
          {
            dim: "مٹھاس کی بنیاد (مربے اور مٹھائیاں)",
            satvikTag: "دیسی کھانڈ اور خالص گھی",
            satvikText: "روایتی دیسی کھانڈ، قدرتی گڑ اور خالص A2 گائے کا گھی۔ معدنیات سے بھرپور۔",
            marketTag: "سفید چینی اور ڈالڈا",
            marketText: "کمرشل سفید چینی، کارن سیرپ اور ڈالڈا گھی (ٹرانس فیٹ)۔"
          },
          {
            dim: "مصالحے اور خوشبو",
            satvikTag: "ہاتھ سے پسے ہوئے ثابت مصالحے",
            satvikText: "ہاتھ سے صاف کیے گئے ثابت مصالحے (سونف، کلونجی، رائی، میتھی، ہینگ)۔ قدرتی تیل برقرار۔",
            marketTag: "مصنوعی خوشبو اور عرق",
            marketText: "تیل نکالے ہوئے مصالحوں کا پاؤڈر اور مصنوعی خوشبو۔"
          },
          {
            dim: "کوالٹی چیک اور لیب ٹیسٹنگ",
            satvikTag: "تھرڈ پارٹی لیب ٹیسٹنگ",
            satvikText: "NABL سے تسلیم شدہ لیبارٹریوں سے تمام اجزاء اور پاکیزگی کی مکمل تصدیق۔",
            marketTag: "صرف بنیادی کاغذی کارروائی",
            marketText: "بغیر کسی خاص کوالٹی چیک کے صرف بنیادی کمرشل قانونی ضوابط۔"
          }
        ],
        noticeTitle: "پری لانچ لیب آڈٹ نوٹس",
        noticeDesc: "تمام مائیکرو بایولوجیکل پیرامیٹرز اور غذائی اجزاء کی تصدیق NABL سے منظور شدہ لیب ٹیسٹ سرٹیفکیٹ کے تحت کی جائے گی اور تجارتی ترسیل سے قبل ہمارے FSSAI ریکارڈ میں درج ہوگی۔",
        disclaimer: "وضاحت: یہ موازنہ عام تجارتی طریقوں اور ہمارے روایتی گھریلو طریقوں کے عمومی فرق پر مبنی ہے۔ اس کا مقصد کسی خاص برانڈ کو نشانہ بنانا نہیں ہے۔",
        complianceTitle: "شفاف قانونی و لائسنس کی حیثیت",
        complianceSub: "ساٹوک سواد میں صارفین کے ساتھ مکمل شفافیت ہماری پہلی ترجیح ہے:",
        fssaiLabel: "FSSAI رجسٹریشن / لائسنس:",
        fssaiStatus: "فی الحال منظوری کے مراحل میں ہے۔",
        gstinLabel: "GSTIN رجسٹریشن:",
        gstinStatus: "فی الحال جاری ہونے کے مراحل میں ہے۔",
        pkgLabel: "پیکجنگ کا معیار:",
        pkgStatus: "فوڈ گریڈ شیشہ اور محفوظ بی پی اے فری جار۔",
        btnExplore: "تمام 15 مصنوعات دیکھیں ←",
        btnStory: "ہماری کہانی پڑھیں ←"
      },
      reorder: {
        subtitle: "آسان اور تیز",
        title: "🔄 دوبارہ خریدیں اور فوری آرڈر کریں",
        lead: "اپنے پسندیدہ روایتی اور خالص ذائقے ایک کلک میں دوبارہ منگوائیں۔",
        btnReorder: "دوبارہ آرڈر کریں"
      },
      about: {
        subtitle: "ہماری وراثت اور عہد",
        title: "ساٹوک سواد کی کہانی",
        desc: "ساٹوک سواد کا ہر اچار، مربہ، لڈو اور چیاون پرَاش نسلوں پرانے خاندانی طریقوں سے چھوٹے بیچوں میں تیار کیا جاتا ہے۔ ہم کسی بھی مصنوعی کیمیکل، رنگ یا ریفائنڈ تیل کا استعمال نہیں کرتے۔",
        cta: "مکمل کہانی اور اقدار پڑھیں ←"
      },
      complianceNote: "خالص اجزاء۔ سچا اعتماد۔"
    },

    // Our Story Page Structured Sections
    ourStory: {
      hero: {
        title: "ہمارا سفر: پاکیزگی، ذائقے اور خاندانی روایات کی وراثت",
        subtitle: "نظام آباد میں ماؤں کی سچی محبت اور خلوص سے تیار کردہ"
      },
      origin: {
        doodleLove: "نسلوں سے وہی سچی محبت ↴ ♡",
        polaroidCaption: "ماں کے ذائقے کی وراثت ♡",
        journeyTitle: "ہماری کہانی",
        journeySubtitle: "پاکیزگی، ذائقے اور روایات کا ایک سچا سفر"
      },
      grandmaLegacy: {
        p1: "ساٹوک سواد کا آغاز ایک سادہ سے یقین کے ساتھ ہوا — کہ خالص کھانا دلوں کو جوڑنے کی طاقت رکھتا ہے۔"
      },
      womenArtisans: {
        p2: "نظام آباد کے دیہی ماحول اور دادی-نانی کے سینہ بہ سینہ نایاب نسخوں سے جڑی ہماری بنیاد ہے۔ مقامی باہنر خواتین کے ہاتھوں تیار کردہ یہ اچار مٹی کے برتنوں اور سنہری دھوپ میں پکائے جاتے ہیں۔"
      },
      traditionalProcess: {
        p3: "ہم کسی شارٹ کٹ پر یقین نہیں رکھتے۔ صرف کچی گھانی سرسوں کا تیل، ہاتھ کے پسے مصالحے اور قدرتی مٹھاس کے ساتھ ہم روایتی دیسی ذائقوں کو محبت اور دیانت کے ساتھ پیش کرتے ہیں۔"
      },
      heritageValues: {
        learnMore: "مزید جانیں ←",
        badge1Title: "خالص قدرتی اجزاء",
        badge1Desc: "صرف بہترین قدرتی اجزاء، بغیر کسی ملاوٹ کے۔",
        badge2Title: "خاندانی روایتی نسخے",
        badge2Desc: "نسلوں سے چلا آ رہا لازوال ذائقہ۔",
        badge3Title: "کیمیکل سے مکمل پاک",
        badge3Desc: "صرف قدرتی غذائیت اور سچی دیکھ بھال۔",
        badge4Title: "ہمارے دیس کی محنت",
        badge4Desc: "نظام آباد کی دیہی خواتین کاریگروں کی محنت کا ثمر۔"
      }
    },

    // Why Us / Health & Purity Structured Sections
    whyUs: {
      hero: {
        title: "صحت اور پاکیزگی: ساٹوک کا اعلیٰ معیار",
        subtitle: "جدید فوڈ سیفٹی کے ساتھ روایتی دانشمندی"
      },
      manifesto: {
        heading: "ہمارا منشور پاکیزگی",
        text: "ہمارا پختہ یقین ہے کہ غذا جسم اور روح دونوں کے لیے باعث شفا ہو۔ کیمیکلز سے بھری مصنوعات کے اس دور میں، ساٹوک سواد دیسی روایات کی طرف لوٹتا ہے — جہاں کچی گھانی سرسوں کا تیل، قدرتی دھوپ اور سیندھا نمک وہ ذائقے بناتے ہیں جو صحت بخش اور لذیذ ہیں۔"
      },
      oilPurity: {
        title: "کچی گھانی سرسوں کے تیل کے فوائد",
        desc: "اومیگا 3 اور قدرتی اجزاء سے مالا مال۔ ہاضمہ بہتر بنائے اور دل کی صحت کا محافظ۔"
      },
      sunCuring: {
        title: "14 دن کی قدرتی شمسی پختگی",
        desc: "دھوپ کی ہلکی آنچ میں مصالحے اچھی طرح رچ بس جاتے ہیں اور قدرتی طور پر نمی ختم ہوتی ہے۔"
      },
      noChemicals: {
        title: "کیمیکل اور پریزرویٹو سے پاک",
        desc: "سوڈیم بینزویٹ، مصنوعی سرکے اور نقصان دہ رنگوں سے بالکل پاک۔ 100% خالص اور محفوظ۔"
      },
      rockSalt: {
        title: "قدرتی سیندھا نمک",
        desc: "84 سے زائد قدرتی معدنیات پر مشتمل سیندھا نمک جو ہاضمے کے لیے بہترین اور تیزابیت سے محفوظ ہے۔"
      },
      labTesting: {
        title: "سخت لیبارٹری ٹیسٹنگ",
        desc: "NABL لیبارٹریز سے تصدیق شدہ جہاں کیڑے مار ادویات اور زہریلے مادوں سے مکمل حفاظت کو یقینی بنایا جاتا ہے۔"
      },
      trustBadge: {
        title: "100% ساٹوک پاکیزگی کی ضمانت",
        desc: "انتہائی پاکیزہ ماحول میں تیار، پیاز اور لہسن کے بغیر، نسلوں کی سچی وراثت۔"
      }
    },
    contact: {
      "heading": "ساٹوک سواد سے رابطہ کریں",
      "heroTop": "ساٹوک سواد سے",
      "heroScript": "رابطہ کریں",
      "heroSubtitle": "ہم آپ سے بات کرنا پسند کریں گے",
      "note": "آپ کی رائے ہمارے لیے قیمتی ہے",
      "doodle": "خالص روایتی ذائقہ",
      "breadcrumb": "ہم سے رابطہ کریں",
      "formTitle": "ہمیں پیغام بھیجیں",
      "formSubtitle": "ہم آپ کی مدد کے لیے ہمیشہ تیار ہیں! نیچے دیا گیا فارم پُر کریں اور ہم جلد آپ سے رابطہ کریں گے۔",
      "labels": {
            "name": "پورا نام *",
            "email": "ای میل پتہ *",
            "phone": "فون نمبر *",
            "subject": "موضوع *",
            "orderId": "آرڈر آئی ڈی (اختیاری)",
            "message": "پیغام *"
      },
      "placeholders": {
            "name": "اپنا نام درج کریں",
            "email": "apna@email.com",
            "phone": "10 ہندسوں کا موبائل نمبر",
            "orderId": "مثلاً SS-2026-1042",
            "message": "اپنا پیغام یہاں لکھیں..."
      },
      "subjectOptions": {
            "default": "موضوع منتخب کریں",
            "general": "عام معلومات",
            "order": "آرڈر سپورٹ",
            "bulk": "تھوک اور تحفے کے آرڈرز",
            "feedback": "رائے اور تجاویز",
            "partnership": "تجارتی شراکت داری"
      },
      "btnSubmit": "پیغام ارسال کریں",
      "successMsg": "✅ شکریہ! آپ کا پیغام کامیابی کے ساتھ بھیج دیا گیا ہے۔",
      "info": {
            "kitchenTitle": "ہمارا روایتی کچن",
            "kitchenUnit": "ساٹوک سواد روایتی پریزروس یونٹ",
            "kitchenAddress": "گاؤں و پوسٹ – کوتھاپلی، ضلع – نظام آباد، 503001",
            "fssai": "ایف ایس ایس اے آئی رجسٹریشن نمبر: 22724113000000",
            "phoneTitle": "فون اور براہِ راست واٹس ایپ",
            "phoneHours": "(پیر تا ہفتہ: صبح 9:00 تا شام 6:00 بجے)",
            "emailTitle": "براہِ راست کسٹمر کیئر ای میل",
            "grievanceTitle": "آرڈر سپورٹ اور شکایات کا ازالہ",
            "grievanceOfficer": "نوڈل آفیسر: کسٹمر کمپلینٹ ڈیسک",
            "grievanceResolution": "حل کی مدت: 24 تا 48 کاروباری گھنٹے"
      },
      "merchant": {
            "title": "تجارتی شناختی کارڈ",
            "legalLabel": "قانونی آپریٹنگ ادارہ",
            "legalValue": "ساٹوک سواد ٹریڈیشنل پریزروس",
            "addressLabel": "رجسٹرڈ کاروباری پتہ",
            "addressValue": "گاؤں و پوسٹ کوتھاپلی، نظام آباد، تلنگانہ – 503001، بھارت",
            "fssaiLabel": "فوڈ سیفٹی معیار",
            "fssaiValue": "ایف ایس ایس اے آئی رجسٹریشن نمبر 22724113000000",
            "helplineLabel": "سرکاری ہیلپ لائن",
            "emailLabel": "ای میل",
            "gatewayLabel": "مجاز پیمنٹ گیٹ وے",
            "gatewayValue": "PayU پیمنٹس پرائیویٹ لمیٹڈ (کارڈز، UPI، نیٹ بینکنگ)",
            "redressalLabel": "صارفین کی شکایات کا ازالہ",
            "redressalValue": "نامزد افسر 24 گھنٹے میں جواب دیتے ہیں"
      },
      "guarantee": {
            "title": "براہِ راست اور محفوظ مواصلات کی ضمانت",
            "spamPolicyLabel": "زیرو اسپام پالیسی",
            "spamPolicyText": "ساٹوک سواد کسی بھی تیسرے فریق کے تشہیری پیغامات یا مارکیٹنگ ای میلز فراہم نہیں کرتا۔ تمام آرڈر اپڈیٹس اور گفتگو 100% نجی و محفوظ طریقے سے ہمارے تصدیق شدہ واٹس ایپ (87600 92365 91+) اور سرکاری ای میل (satvikswaad.care@gmail.com) کے ذریعے کی جاتی ہے۔"
      },
      "villageKitchen": {
            "badge": "تازہ بیج",
            "title": "📍 دیہاتی کچن سے براہِ راست",
            "desc": "نظام آباد میں ہماری دیہاتی ماؤں کے ہاتھوں سے ہر ہفتے تیار کردہ تازہ بیجز۔",
            "waBtn": "واٹس ایپ پر رابطہ کریں: 87600 92365 91+"
      },
      "polaroidCaption": "ماں کے ذائقے کی وراثت",
      "doodleLines": [
            "نسلوں",
            "سے",
            "وہی",
            "محبت"
      ]
},

    faq: {
      "heroTop": "اکثر پوچھے جانے والے",
      "heroScript": "سوالات (FAQ)",
      "heroSubtitle": "ہم آپ کی مدد کے لیے حاضر ہیں!",
      "note": "کوئی سوال ہے؟ ہمارے پاس جوابات ہیں!",
      "doodle": "خالص روایتی ذائقہ",
      "breadcrumb": "اکثر پوچھے گئے سوالات",
      "sectionTitle": "عام سوالات",
      "sectionSubtitle": "اپنے عام سوالات کے فوری جوابات حاصل کریں۔",
      "searchPlaceholder": "🔍 سوالات تلاش کریں...",
      "categories": {
            "general": "عام",
            "orders": "آرڈرز اور شپنگ",
            "products": "پروڈکٹس اور اجزاء",
            "payments": "ادائیگی اور ریفنڈ",
            "account": "اکاؤنٹ اور پروفائل",
            "others": "دیگر"
      },
      "guaranteeTitle": "براہِ راست مواصلات کی ضمانت",
      "guaranteeText": "ساٹوک سواد کسی بھی تیسرے فریق کے تشہیری پیغامات یا مارکیٹنگ ای میلز فراہم نہیں کرتا۔ تمام آرڈر اپڈیٹس اور گفتگو 100% نجی و محفوظ طریقے سے ہمارے تصدیق شدہ واٹس ایپ (87600 92365 91+) اور سرکاری ای میل (satvikswaad.care@gmail.com) کے ذریعے کی جاتی ہے۔ ہم آپ کا ڈیٹا کسی اشتہاری کمپنی کو نہیں دیتے۔",
      "items": {
            "general": [
                  {
                        "q": "کیا آپ کی مصنوعات 100% قدرتی ہیں؟",
                        "a": "جی ہاں۔ ساٹوک سواد کی ہر پروڈکٹ خالص قدرتی اجزاء سے تیار کی جاتی ہے — بغیر کسی مصنوعی رنگ، ذائقے یا کیمیائی پرزرویٹوز کے۔"
                  },
                  {
                        "q": "ڈیلیوری میں کتنا وقت لگتا ہے؟",
                        "a": "آرڈرز عام طور پر 24 تا 48 گھنٹوں میں روانہ کیے جاتے ہیں اور آپ کے علاقے کی بنیاد پر 3 تا 7 کاروباری دنوں میں پہنچتے ہیں۔"
                  },
                  {
                        "q": "کیا میں اپنا آرڈر ٹریک کر سکتا ہوں؟",
                        "a": "بالکل۔ آرڈر روانہ ہوتے ہی لائیو ٹریکنگ لنک اور کوریئر اپڈیٹس براہِ راست آپ کے تصدیق شدہ واٹس ایپ (87600 92365 91+) اور ای میل پر بھیجی جاتی ہیں۔"
                  },
                  {
                        "q": "آپ کی براہِ راست مواصلات کی ضمانت کیا ہے؟ کیا مجھے اسپام ملے گا؟",
                        "a": "ساٹوک سواد کسی بھی تیسرے فریق کی مارکیٹنگ سروس استعمال نہیں کرتا۔ تمام رابطے صرف ہمارے تصدیق شدہ واٹس ایپ اور سرکاری ای میل کے ذریعے 100% محفوظ انداز میں ہوتے ہیں۔"
                  },
                  {
                        "q": "کیا مجھے پروموشنل میسجز یا اسپام ای میلز موصول ہوں گی؟",
                        "a": "نہیں، کبھی نہیں۔ ساٹوک سواد مکمل زیرو اسپام پالیسی پر عمل پیرا ہے۔ ہم بلک پروموشنل پیغامات یا خودکار اشتہارات نہیں بھیجتے۔"
                  },
                  {
                        "q": "آپ کی واپسی اور ریفنڈ پالیسی کیا ہے؟",
                        "a": "چونکہ ہماری مصنوعات شیشے کے جار میں بند گھریلو کھانے پینے کی اشیاء ہیں، اس لیے ڈیلیوری کے بعد واپسی قبول نہیں کی جاتی۔ تاہم، دورانِ سفر نقصان پر 100% مفت نیا جار اور ڈسپیچ سے قبل منسوخی پر مکمل ریفنڈ دیا جاتا ہے۔"
                  },
                  {
                        "q": "کیا آپ کیش آن ڈیلیوری (COD) پیش کرتے ہیں؟",
                        "a": "جی ہاں، چیک آؤٹ پر بھارت کے اکثر پن کوڈز کے لیے کیش آن ڈیلیوری کی سہولت دستیاب ہے۔"
                  },
                  {
                        "q": "کیا آپ کی مصنوعات بچوں کے لیے محفوظ ہیں؟",
                        "a": "ہماری روایتی مٹھائیاں اور صحت بخش مصنوعات پورے خاندان کے لیے بہترین ہیں۔ اچار میں روایتی مصالحے ہوتے ہیں، اس لیے چھوٹے بچوں کے لیے ہلکے مصالحے والے اچار تجویز کیے جاتے ہیں۔"
                  }
            ],
            "orders": [
                  {
                        "q": "کیا آپ پورے بھارت میں ڈیلیوری کرتے ہیں؟",
                        "a": "جی ہاں، ہم بھارت کے تمام فعال پن کوڈز پر ترسیل کرتے ہیں۔ بین الاقوامی ترسیل بھی جلد شروع کی جائے گی۔"
                  },
                  {
                        "q": "شپنگ چارجز کتنے ہیں؟",
                        "a": "499 روپے سے زیادہ کے تمام آرڈرز پر شپنگ بالکل مفت ہے۔ اس سے کم کے آرڈرز پر صرف 50 روپے فلیٹ فیس لاگو ہوتی ہے۔"
                  },
                  {
                        "q": "کیا میں اپنا ڈیلیوری کا پتہ تبدیل کر سکتا ہوں؟",
                        "a": "آرڈر روانہ ہونے سے پہلے آپ اپنی پروفائل سے ڈیلیوری کا پتہ باآسانی تبدیل کر سکتے ہیں۔"
                  }
            ],
            "products": [
                  {
                        "q": "اچار میں کون سا تیل استعمال ہوتا ہے؟",
                        "a": "ہم 100% خالص کولڈ پریسڈ کچی گھانی سرسوں کا تیل استعمال کرتے ہیں، جو خوشبودار اور کیمیکلز سے بالکل پاک ہے۔"
                  },
                  {
                        "q": "اچار کو کس طرح محفوظ رکھنا چاہیے؟",
                        "a": "براہِ راست دھوپ سے دور ٹھنڈی اور خشک جگہ پر رکھیں اور نکالتے وقت ہمیشہ صاف اور خشک چمچ کا استعمال کریں۔"
                  },
                  {
                        "q": "مصنوعات کی میعاد (شیلف لائف) کیا ہے؟",
                        "a": "اچار 12 ماہ تک تازہ رہتے ہیں؛ جبکہ روایتی مٹھائیوں کو 15 تا 30 دنوں کے اندر نوش فرمانا بہترین ہے۔"
                  }
            ],
            "payments": [
                  {
                        "q": "ادائیگی کے کون سے طریقے قبول کیے جاتے ہیں؟",
                        "a": "یو پی آئی (UPI)، تمام کارڈز، نیٹ بینکنگ، مقبول والٹس اور کیش آن ڈیلیوری۔"
                  },
                  {
                        "q": "ریفنڈ میں کتنا وقت لگتا ہے؟",
                        "a": "منظور شدہ ریفنڈز 5 تا 7 کاروباری دنوں کے اندر آپ کے اصل ادائیگی کے طریقے پر واپس بھیج دیے جاتے ہیں۔"
                  }
            ],
            "account": [
                  {
                        "q": "میں اکاؤنٹ کیسے بنا سکتا ہوں؟",
                        "a": "آپ اپنے ای میل پتے یا گوگل اکاؤنٹ کے ذریعے چند سیکنڈز میں اکاؤنٹ بنا سکتے ہیں۔"
                  },
                  {
                        "q": "کیا میں ایک سے زیادہ پتے محفوظ کر سکتا ہوں؟",
                        "a": "جی ہاں، آپ اپنی پروفائل میں گھر اور دفتر کے متعدد ڈیلیوری پتے شامل اور سنبھال سکتے ہیں۔"
                  }
            ],
            "others": [
                  {
                        "q": "کیا آپ تھوک یا تحفے کے آرڈرز قبول کرتے ہیں؟",
                        "a": "جی ہاں! کارپوریٹ، تہواروں اور تھوک تحائف کے آرڈرز کے لیے ہمارے رابطہ صفحے کے ذریعے ہم سے رابطہ کریں۔"
                  },
                  {
                        "q": "میں ساٹوک سواد کے ساتھ تجارتی شراکت داری کیسے کر سکتا ہوں؟",
                        "a": "ہم تعاون کا خیرمقدم کرتے ہیں۔ رابطہ صفحے پر اپنا پیغام ارسال کریں، ہماری ٹیم آپ سے جلد رابطہ کرے گی۔"
                  }
            ]
      }
},

    reviews: {
      "heroTop": "ہمارے صارفین",
      "heroScript": "کیا کہتے ہیں",
      "heroSubtitle": "سچے لوگ • حقیقی تجربات • اصلی ذائقے",
      "doodleGoodness": "ہمیشہ قدرتی پاکیزگی",
      "breadcrumb": "صارفین کے تاثرات",
      "sectionTitle": "صارفین کے تاثرات",
      "sectionSubtitle": "ہمارے مطمئن صارفین ہمارے بارے میں کیا کہتے ہیں",
      "marginDoodle": [
            "سچی",
            "رائے",
            "اصلی لوگ"
      ],
      "trustNote": "آپ کا اعتماد قیمتی ہے",
      "summary": {
            "rating": "4.8",
            "max": "5",
            "countText": "500 سے زائد تصدیق شدہ صارفین کے تاثرات پر مبنی",
            "starsBreakdown": {
                  "star5": "5 اسٹار (88%)",
                  "star4": "4 اسٹار (9%)",
                  "star3": "3 اسٹار (2%)",
                  "star2": "2 اسٹار (1%)",
                  "star1": "1 اسٹار (0%)"
            }
      },
      "filterTabs": {
            "all": "تمام تاثرات",
            "achar": "اچار اور پریزروس",
            "sweets": "روایتی مٹھائیاں",
            "murabba": "مربہ"
      },
      "btnWriteReview": "✍️ اپنا تاثر قلمبند کریں",
      "form": {
            "title": "تاثر لکھیں",
            "subtitle": "ساٹوک سواد کے ساتھ اپنا سچا تجربہ شیئر کریں",
            "nameLabel": "آپ کا نام *",
            "namePlaceholder": "مثلاً اننیا رائے",
            "productLabel": "خریدی گئی پروڈکٹ *",
            "productPlaceholder": "پروڈکٹ منتخب کریں",
            "ratingLabel": "ریٹنگ *",
            "commentLabel": "آپ کا تفصیلی تاثر *",
            "commentPlaceholder": "خوشبو، سرسوں کے تیل کی پاکیزگی اور گھریلو روایتی ذائقے کے بارے میں بتائیں...",
            "btnSubmit": "تاثر جمع کرائیں",
            "successMsg": "✅ شکریہ! آپ کا تاثر تصدیق کے لیے جمع کر لیا گیا ہے۔"
      },
      "staticCards": [
            {
                  "name": "پریا شرما",
                  "quote": "\"ذائقہ بالکل سچا اور روایتی ہے! ہر لقمے میں پرانے خاندانی طریقوں کی خوشبو محسوس ہوتی ہے۔ میرا پورا خاندان اسے بے حد پسند کرتا ہے!\"",
                  "product": "ہری مرچ کا اچار",
                  "verified": "✅ تصدیق شدہ خریداری"
            },
            {
                  "name": "روہت ورما",
                  "quote": "\"بہترین معیار اور خالص قدرتی اجزاء۔ شیشے کے جار کی پیکنگ بھی انتہائی محفوظ تھی۔ میں دوبارہ ضرور آرڈر کروں گا!\"",
                  "product": "آنولہ پاؤڈر",
                  "verified": "✅ تصدیق شدہ خریداری"
            },
            {
                  "name": "نیہا گپتا",
                  "quote": "\"میں نے مٹھائیاں اور اچار دونوں آزمائے۔ ہر چیز بے حد تازہ، مزیدار اور خالص گھر کی بنی ہوئی تھی۔ انتہائی تجویز کردہ!\"",
                  "product": "بیسن برفی",
                  "verified": "✅ تصدیق شدہ خریداری"
            },
            {
                  "name": "امت سنگھ",
                  "quote": "\"بالآخر ایک ایسا برانڈ مل ہی گیا جو روایات کو زندہ رکھے ہوئے ہے۔ معیار، ذائقہ اور پاکیزگی واقعی لاجواب ہے۔\"",
                  "product": "مکس ویج اچار",
                  "verified": "✅ تصدیق شدہ خریداری"
            }
      ],
      "btnViewMore": "مزید تاثرات دیکھیں ←",
      "loadingText": "⏳ محفوظ سرور سے مزید تصدیق شدہ تاثرات لوڈ کیے جا رہے ہیں..."
},

    cartPage: {
      "title": "شاپنگ کارٹ",
      "backToShop": "← واپس شاپ پر جائیں",
      "itemCountSingular": "آئٹم",
      "itemCountPlural": "آئٹمز",
      "clearBtn": "کارٹ خالی کریں",
      "purityNotice": "100% ساٹوک پاکیزگی کی ضمانت • کولڈ پریسڈ سرسوں کے تیل میں تیار • پیاز، لہسن اور کیمیکلز کے بغیر",
      "tableHeaders": {
            "product": "پروڈکٹ",
            "pack": "پیک",
            "price": "قیمت",
            "quantity": "تعداد",
            "subtotal": "میزان",
            "remove": "حذف کریں"
      },
      "eachLabel": "فی عدد",
      "removeAria": "آئٹم ہٹائیں",
      "emptyTitle": "آپ کی کارٹ خالی ہے",
      "emptyDesc": "آپ نے ابھی تک اپنی کارٹ میں کوئی روایتی اچار یا مٹھائی شامل نہیں کی ہے۔ ہمارے دستکاری بیجز دیکھیں!",
      "exploreBtn": "پروڈکٹس کیٹلاگ دیکھیں ←",
      "coupon": {
            "placeholder": "کوپن کوڈ درج کریں (مثلاً SATVIK10)",
            "applyBtn": "لاگو کریں",
            "appliedMsg": "کوپن SATVIK10 لاگو ہو گیا! (10% رعایت)"
      },
      "summaryTitle": "آرڈر کا خلاصہ",
      "subtotalLabel": "اشیاء کا میزان:",
      "deliveryLabel": "ڈیلیوری فیس:",
      "freeDeliveryText": "مفت (افتتاحی پیشکش)",
      "couponDiscountLabel": "کوپن ڈسکاؤنٹ:",
      "totalPayableLabel": "کل واجب الادا رقم:",
      "checkoutBtn": "چیک آؤٹ کے لیے آگے بڑھیں",
      "confirmClear": "کیا آپ واقعی اپنی کارٹ خالی کرنا چاہتے ہیں؟"
},

    profile: {
      "sidebar": {
            "myProfile": "میری پروفائل",
            "myOrders": "میرے آرڈرز",
            "myAddresses": "میرے پتے",
            "wishlist": "پسندیدہ اشیاء",
            "settings": "سیٹنگز",
            "signIn": "سائن ان",
            "signOut": "لاگ آؤٹ",
            "googleAccount": "گوگل اکاؤنٹ",
            "doodleText": "صحت مند انتخاب، خوشگوار زندگی ↴ ♡"
      },
      "personalInfo": {
            "title": "ذاتی معلومات",
            "editBtn": "✏ پروفائل تبدیل کریں",
            "closeEditBtn": "✕ بند کریں",
            "nameLabel": "نام",
            "emailLabel": "ای میل پتہ",
            "phoneLabel": "فون نمبر",
            "joinedLabel": "شمولیت کی تاریخ",
            "fullNameLabel": "پورا نام",
            "placeholders": {
                  "name": "اپنا پورا نام درج کریں",
                  "email": "naam@example.com",
                  "phone": "10 ہندسوں کا موبائل نمبر"
            },
            "cancelBtn": "منسوخ کریں",
            "saveBtn": "💾 تبدیلیاں محفوظ کریں",
            "doodleText": "عمدہ کھانا، خوشگوار موڈ ♡"
      },
      "addresses": {
            "summaryTitle": "محفوظ کردہ پتے",
            "addBtn": "+ نیا پتہ شامل کریں",
            "emptySummary": "ابھی تک کوئی پتہ محفوظ نہیں ہے۔",
            "fullTitle": "میرے ڈیلیوری پتے",
            "fullSubtitle": "ایک کلک چیک آؤٹ کے لیے پتے سنبھالیں",
            "emptyFullTitle": "کوئی محفوظ پتہ نہیں",
            "emptyFullDesc": "تیز رفتار چیک آؤٹ کے لیے اپنے گھر یا دفتر کا پتہ شامل کریں۔",
            "types": {
                  "home": "🏠 گھر",
                  "work": "🏢 دفتر",
                  "other": "📍 دیگر"
            },
            "defaultBadge": "بنیادی",
            "setDefaultBtn": "بنیادی بنائیں",
            "editTitle": "پتہ تبدیل کریں",
            "deleteTitle": "پتہ حذف کریں",
            "confirmDelete": "کیا آپ واقعی یہ ڈیلیوری پتہ حذف کرنا چاہتے ہیں؟",
            "toastSaved": "📍 پتہ کامیابی سے محفوظ ہو گیا!",
            "toastDeleted": "🗑 پتہ حذف کر دیا گیا",
            "toastDefault": "⭐ بنیادی پتہ تبدیل ہو گیا!"
      },
      "orders": {
            "summaryTitle": "آرڈر کی تاریخ",
            "viewAllBtn": "تمام آرڈرز دیکھیں ←",
            "emptySummaryTitle": "ابھی تک کوئی سابقہ آرڈر نہیں ہے",
            "emptySummaryDesc": "ہمارے روایتی ہاتھ کے بنے اچار اور مٹھائیوں کا لطف اٹھائیں۔",
            "exploreBtn": "پروڈکٹس دیکھیں ←",
            "fullTitle": "میرے آرڈرز اور ڈیلیوری ہسٹری",
            "fullSubtitle": "آرڈرز ٹریک کریں اور دوبارہ آرڈر کریں",
            "countBadge": "کل: {n}",
            "filters": {
                  "all": "تمام آرڈرز",
                  "delivered": "ڈیلیور شدہ",
                  "transit": "راستے میں",
                  "processing": "پروسیسنگ"
            },
            "status": {
                  "delivered": "ڈیلیور شدہ",
                  "transit": "راستے میں",
                  "processing": "پروسیسنگ"
            },
            "emptyOrdersTitle": "کوئی آرڈر نہیں ملا",
            "emptyOrdersDesc": "اس فلٹر کے تحت آپ کا کوئی آرڈر نہیں ہے۔",
            "browseBtn": "کیٹلاگ دیکھیں",
            "orderNum": "آرڈر نمبر",
            "placedOn": "تاریخِ آرڈر",
            "viewDetailsBtn": "تفصیلات دیکھیں",
            "reorderBtn": "🔄 دوبارہ آرڈر کریں",
            "toastReordered": "🛒 اشیاء آپ کی کارٹ میں شامل کر دی گئیں!"
      },
      "wishlist": {
            "title": "میری پسندیدہ اشیاء",
            "subtitle": "آپ کے کچن کے لیے محفوظ کردہ روایتی سوغاتیں",
            "addAllBtn": "🛒 تمام اشیاء کارٹ میں شامل کریں",
            "emptyTitle": "آپ کی پسندیدہ لسٹ خالی ہے",
            "emptyDesc": "روایتی محبت سے تیار کردہ دھوپ میں پکے اچار اور مٹھائیاں دیکھئے!",
            "browseBtn": "🛍 کیٹلاگ دیکھیں"
      },
      "settings": {
            "title": "اکاؤنٹ اور ترجیحات",
            "subtitle": "نوٹیفکیشن، زبان اور ڈیلیوری ترجیحات کا انتخاب کریں",
            "notifyTitle": "🔔 اطلاعات (Notifications)",
            "waTitle": "واٹس ایپ آرڈر اور ڈیلیوری اپڈیٹس",
            "waDesc": "واٹس ایپ پر فوری ٹریکنگ لنک، رسید اور او ٹی پی حاصل کریں۔",
            "smsTitle": "ایس ایم ایس ڈسپیچ الرٹس",
            "smsDesc": "جب کورئیر ڈیلیوری کے لیے نکلے تو فوری میسج حاصل کریں۔",
            "emailTitle": "موسمی اچار اور تیوہاروں کی خصوصی ای میل",
            "emailDesc": "محدود موسمی بیجز (آنولہ، کٹہل، آم) کا ذائقہ سب سے پہلے چکھیں۔",
            "langRegTitle": "🌐 زبان اور علاقائی ترجیحات",
            "interfaceLangLabel": "انٹرفیس کی زبان",
            "currencyLabel": "کرنسی ڈسپلے",
            "deliveryNoteTitle": "🚚 بنیادی ڈیلیوری ہدایات",
            "specialInstructionsLabel": "خصوصی ڈیلیوری ہدایات",
            "deliveryPlaceholder": "مثلاً گھنٹی بجائیں، برآمدے میں یا سیکیورٹی گارڈ کے پاس چھوڑ دیں",
            "dataBackupTitle": "🔒 ڈیٹا اور کلاؤڈ بیک اپ",
            "cacheTitle": "مقامی براؤزر کیش",
            "cacheDesc": "کارٹ، پتے اور فارم ڈیٹا کو دوبارہ ترتیب دیں۔",
            "clearCacheBtn": "🧹 کیش صاف کریں",
            "savePrefsBtn": "💾 ترجیحات محفوظ کریں",
            "toastSavedPrefs": "✅ ترجیحات کامیابی سے محفوظ ہو گئیں!"
      },
      "addressModal": {
            "addTitle": "نیا ڈیلیوری پتہ شامل کریں",
            "editTitle": "ڈیلیوری پتہ تبدیل کریں",
            "recipientLabel": "وصول کنندہ کا نام",
            "phoneLabel": "موبائل نمبر",
            "houseLabel": "فلیٹ / مکان نمبر / عمارت",
            "streetLabel": "گلی / علاقہ / محلہ",
            "cityLabel": "شہر",
            "stateLabel": "ریاست",
            "pincodeLabel": "پن کوڈ",
            "defaultCheck": "بنیادی پتہ کے طور پر منتخب کریں",
            "cancelBtn": "منسوخ کریں",
            "saveBtn": "پتہ محفوظ کریں"
      },
      "orderModal": {
            "title": "آرڈر کی تفصیلات",
            "orderPlaced": "تاریخِ آرڈر:",
            "paymentMethod": "ادائیگی کا طریقہ:",
            "deliveryAddress": "ڈیلیوری کا پتہ:",
            "itemsTitle": "اس آرڈر کی اشیاء",
            "qty": "تعداد:",
            "subtotal": "اشیاء کا میزان",
            "delivery": "ڈیلیوری فیس",
            "totalPaid": "کل ادا شدہ",
            "free": "مفت"
      }
},

    policies: {
      "navTabs": {
            "privacy": "🔒 پرائیویسی پالیسی",
            "terms": "📜 شرائط و ضوابط",
            "shipping": "🚚 شپنگ اور ڈیلیوری",
            "refund": "🔄 منسوخی اور ریفنڈ",
            "cookies": "🍪 کوکیز پالیسی",
            "contact": "📞 کسٹمر سپورٹ"
      },
      "cancellationRefund": {
            "badge": "🛡️ روایتی غذا اور شیشے کے جار کی حفاظت کی پالیسی",
            "title": "منسوخی اور ریفنڈ پالیسی",
            "subtitle": "ساٹوک سواد کے آرڈر کی منسوخی، شیشے کے جار کی حفاظت اور غذائی پاکیزگی سے متعلق واضح اور شفاف رہنمائی۔",
            "meta": {
                  "effectiveDate": "نافذ العمل تاریخ: 1 اگست، 2026",
                  "lastUpdated": "آخری تجدید: 10 ستمبر، 2026",
                  "scope": "دائرہ کار: آن لائن اسٹور اور واٹس ایپ کامرس"
            },
            "highlight1Title": "100% مفت تبدیلی کی ضمانت",
            "highlight1Desc": "اگر کوریئر کے دوران شیشے کا جار ٹوٹ جائے یا رس جائے، تو 24 تا 48 گھنٹوں میں تصویری ثبوت موصول ہونے پر ہم فوری طور پر 100% مفت نیا جار روانہ کرتے ہیں۔",
            "highlight2Title": "ڈسپیچ سے قبل آسان منسوخی",
            "highlight2Desc": "آرڈر دینے کے 2 گھنٹے کے اندر یا کوریئر روانگی سے قبل بغیر کسی کٹوتی کے 100% مکمل رقم کی واپسی کے ساتھ آرڈر منسوخ کیا جا سکتا ہے۔",
            "highlight3Title": "غذائی پاکیزگی کا پروٹوکول",
            "highlight3Desc": "ہر خاندان کی صحت اور پاکیزگی کے تحفظ کے لیے، شیشے کے جار میں بند گھریلو غذائی اشیاء ڈیلیوری کے بعد واپس نہیں لی جاتیں۔",
            "tocTitle": "پالیسی کی دفعات",
            "tocCount": "6 دفعات"
      },
      "shippingDelivery": {
            "badge": "🚚 پورے بھارت میں روایتی ترسیل کا رہنما",
            "title": "شپنگ اور ڈیلیوری پالیسی",
            "subtitle": "ہفتہ وار تازہ بیج کی ترسیل، 5 تہوں والی محفوظ شیشے کی پیکنگ، اور پورے بھارت میں براہِ راست واٹس ایپ ٹریکنگ۔",
            "meta": {
                  "effectiveDate": "نافذ العمل تاریخ: 10 ستمبر، 2026",
                  "dispatchWindow": "روانگی کا وقت: 24 تا 48 کاروباری گھنٹے",
                  "coverage": "دائرہ کار: 19,000+ پن کوڈز"
            },
            "highlight1Title": "24 تا 48 گھنٹوں میں تازہ ترسیل",
            "highlight1Desc": "ہفتہ وار تیار بیجز سے تازہ پیک کر کے 24 تا 48 کاروباری گھنٹوں میں تیز رفتار کوریئر کے حوالے کیا جاتا ہے۔",
            "highlight2Title": "5 تہوں والی شیشے کی حفاظت",
            "highlight2Desc": "انڈکشن لِیک پروف سیل، کشن اور مضبوط کارٹن۔ دورانِ سفر نقصان پر 100% مفت تبدیلی۔",
            "highlight3Title": "ذاتی واٹس ایپ ٹریکنگ",
            "highlight3Desc": "لائیو ٹریکنگ لنکس براہِ راست تصدیق شدہ واٹس ایپ (87600 92365 91+) پر۔ قطعی کوئی غیر ضروری تشہیر نہیں۔"
      },
      "privacyPolicy": {
            "badge": "🔒 شفاف پاکیزگی کا عزم",
            "title": "پرائیویسی پالیسی",
            "subtitle": "سادہ، سچی اور شفاف پرائیویسی کی ضمانت۔ ہم آپ کے آرڈر، ادائیگی کی حفاظت اور ذاتی معلومات کا تحفظ نسل در نسل امانت داری کے ساتھ کرتے ہیں۔",
            "meta": {
                  "effectiveDate": "نافذ العمل تاریخ: 10 ستمبر، 2026",
                  "scope": "دائرہ کار: کسٹمر آرڈرز اور اسٹور فرنٹ",
                  "dataSelling": "ڈیٹا فروخت: قطعی ممنوع (0%)"
            },
            "pillars": {
                  "zeroSellingTitle": "ڈیٹا فروخت صفر (0%)",
                  "zeroSellingDesc": "کبھی کسی اشتہاری کمپنی کو کرائے پر یا فروخت نہیں کیا جاتا",
                  "sslTitle": "256-بٹ SSL ادائیگیاں",
                  "sslDesc": "RBI کے مطابق گیٹ وے؛ کارڈ کی کوئی معلومات محفوظ نہیں ہوتیں",
                  "minimalDataTitle": "کم سے کم آرڈر ڈیٹا",
                  "minimalDataDesc": "صرف وہی معلومات جو آپ کے جار پہنچانے کے لیے ضروری ہیں",
                  "rightsTitle": "اکاؤنٹ کے مکمل اختیارات",
                  "rightsDesc": "فوری ڈیٹا دیکھنے، تبدیل کرنے اور حذف کرنے کا حق",
                  "directCommTitle": "براہِ راست مواصلات",
                  "directCommDesc": "تیسرے فریق کی تشہیری سروسز کا صفر استعمال"
            },
            "guaranteeTitle": "براہِ راست اور محفوظ مواصلات کی ضمانت",
            "guaranteeText": "ساٹوک سواد کسی بھی تیسرے فریق کے تشہیری پیغامات یا مارکیٹنگ ای میلز فراہم نہیں کرتا۔ تمام آرڈر اپڈیٹس اور گفتگو 100% نجی و محفوظ طریقے سے ہمارے تصدیق شدہ واٹس ایپ (87600 92365 91+) اور سرکاری ای میل (satvikswaad.care@gmail.com) کے ذریعے کی جاتی ہے۔ ہم آپ کی معلومات کا مکمل احترام کرتے ہیں۔"
      },
      "termsConditions": {
            "badge": "🌿 روایتی غذائی باہمی معاہدہ",
            "title": "شرائط و ضوابط",
            "subtitle": "ساٹوک سواد میں خوش آمدید۔ ہم نے پیچیدہ قانونی اصطلاحات کو سچائی، ماں کے ذائقے کی وراثت اور آپ کے مکمل اطمینان پر مبنی 5 نکاتی معاہدے سے بدل دیا ہے۔",
            "meta": {
                  "effectiveDate": "نافذ العمل تاریخ: 10 ستمبر، 2026",
                  "kitchen": "روایتی کچن: ہاتھ سے بنے چھوٹے بیجز",
                  "transparency": "شفافیت: 100% روایتی اعتماد"
            },
            "highlight1Title": "روایتی وراثت",
            "highlight1Desc": "100% خالص کولڈ پریسڈ سرسوں کا تیل، A2 گائے کا گھی اور نایاب خاندانی نسخے۔ کیمیکلز اور مصنوعی اجزاء سے مکمل پاک۔",
            "highlight2Title": "تازہ چھوٹے بیجز",
            "highlight2Desc": "دھوپ میں تیار چھوٹے بیجز اور ہفتہ وار پیکنگ۔ 24 تا 48 گھنٹوں میں تازہ روانگی اور مکمل شفاف قیمت۔",
            "highlight3Title": "شیشے کی محفوظ ترسیل اور دیکھ بھال",
            "highlight3Desc": "شیشے کے فوڈ گریڈ جار اور پورے بھارت میں محفوظ سفر۔ کسی بھی نقصان کی صورت میں براہِ راست واٹس ایپ سے مفت نیا جار۔"
      },
      "cookiesPolicy": {
            "badge": "🍪 پرائیویسی دوست اسٹوریج پالیسی",
            "title": "کوکیز اور لوکل اسٹوریج پالیسی",
            "subtitle": "ساٹوک سواد میں ہمارا ایمان خالص ذائقے اور مکمل پرائیویسی پر ہے۔ ہم صرف اتنی بنیادی کوکیز استعمال کرتے ہیں جن سے آپ کی کارٹ محفوظ رہے — بغیر کسی اشتہاری ٹریکر کے۔",
            "meta": {
                  "effectiveDate": "نافذ العمل تاریخ: 10 ستمبر، 2026",
                  "trackers": "اشتہاری ٹریکرز: بالکل 0 (کوئی نہیں)",
                  "promise": "ہمارا وعدہ: 100% پرائیویسی کا احترام"
            },
            "highlight1Title": "صرف لازمی ضروریات",
            "highlight1Desc": "ہم صرف وہی ضروری ڈیٹا محفوظ کرتے ہیں جس سے کارٹ محفوظ رہے، لاگ ان قائم رہے اور آپ کی منتخب کردہ زبان یاد رکھی جا سکے۔",
            "highlight2Title": "تیسرے فریق کے ٹریکرز صفر",
            "highlight2Desc": "نہ میٹا پکسل، نہ گوگل ایڈسینس۔ ہم ایک روایتی باورچی خانہ ہیں، کوئی اشتہاری ایجنسی نہیں۔ ہم آپ کا ڈیٹا کبھی فروخت نہیں کرتے۔"
      }
},

    orderSuccess: {
      "title": "شکریہ! آپ کا آرڈر موصول ہو گیا ہے",
      "subtitle": "آپ کا آرڈر تصدیق ہو چکا ہے اور ہماری روایتی پاکیزگی کے ساتھ تیار کر کے روانہ کیا جائے گا۔ نیچے رسید موجود ہے۔",
      "meta": {
            "orderNumber": "آرڈر نمبر",
            "orderDate": "تاریخِ آرڈر",
            "paymentMode": "ادائیگی کا طریقہ",
            "totalAmount": "کل رقم"
      },
      "stepperHeading": "🚚 آرڈر کی صورتحال اور ترسیل",
      "stepper": {
            "placedTitle": "آرڈر موصول",
            "placedSub": "تصدیق شدہ",
            "prepTitle": "تیاری جاری",
            "prepSub": "تازہ بیج",
            "packTitle": "پیک شدہ",
            "packSub": "معیار کی جانچ",
            "dispTitle": "روانہ کر دیا گیا",
            "dispSub": "ایکسپریس کوریئر",
            "delivTitle": "پہنچ گیا",
            "delivSub": "آپ کے دروازے پر"
      },
      "receiptHeading": "📦 آرڈر کی تفصیلی تفصیل",
      "subtotalLabel": "اشیاء کا میزان:",
      "deliveryLabel": "ڈیلیوری اور ترسیل:",
      "freeDeliveryText": "مفت (🎉 افتتاحی پیشکش)",
      "totalPayableLabel": "کل واجب الادا رقم:",
      "addressLabel": "📍 ڈیلیوری کا پتہ:",
      "buttons": {
            "waNotify": "💬 واٹس ایپ پر لائیو اپڈیٹس حاصل کریں",
            "printReceipt": "🖨️ آرڈر کی رسید پرنٹ کریں",
            "viewOrders": "👤 آرڈر ہسٹری میں دیکھیں",
            "continueShopping": "🛍️ خریداری جاری رکھیں"
      }
},

    paymentFailed: {
      "statusPill": "ادائیگی نامکمل رہی",
      "title": "ادائیگی مکمل نہیں ہو سکی",
      "safeTitle": "آپ کے پیسے بالکل محفوظ ہیں!",
      "safeDesc": "اگر آپ کے اکاؤنٹ سے رقم کٹی ہے، تو آپ کا بینک 3 تا 5 کاروباری دنوں میں خود بخود واپس کر دے گا۔ آپ کی کارٹ بالکل محفوظ ہے۔",
      "meta": {
            "orderIdLabel": "ریفرنس آرڈر آئی ڈی",
            "orderAmountLabel": "آرڈر کی رقم",
            "reasonLabel": "ناکامی کی وجہ",
            "defaultReason": "ٹرانزیکشن منسوخ کر دی گئی یا ادائیگی کے ادارے نے مسترد کر دی۔"
      },
      "buttons": {
            "retry": "🔄 آن لائن ادائیگی دوبارہ کریں",
            "cod": "📦 کیش آن ڈیلیوری میں تبدیل کریں (دروازے پر ادائیگی)",
            "waHelp": "💬 مدد درکار ہے؟ واٹس ایپ سپورٹ سے رابطہ کریں",
            "backShop": "🛍️ شاپ اور کارٹ پر واپس جائیں"
      },
      "faq": {
            "title": "❓ عام سوالات",
            "q1": "میری ٹرانزیکشن کیوں ناکام ہوئی؟",
            "a1": "بینک سرور ٹائم آؤٹ، غلط او ٹی پی یا کارڈ لمٹ کی وجہ سے ٹرانزیکشن ناکام ہو سکتی ہے۔",
            "q2": "کیا میں کیش آن ڈیلیوری منتخب کر سکتا ہوں؟",
            "a2": "جی ہاں! اوپر دیے گئے \"کیش آن ڈیلیوری میں تبدیل کریں\" بٹن پر کلک کریں۔ ہم پیشگی رقم کے بغیر آرڈر روانہ کر دیں گے۔"
      }
},

    notFound: {
      "badge": "ذائقوں کے راستے پر بھٹک گئے!",
      "title": "صفحہ نہیں ملا (404)",
      "desc": "شاید یہ لنک ٹوٹ چکا ہے یا صفحہ تبدیل ہو گیا ہے۔ پریشان نہ ہوں، لذیذ اور روایتی ذائقے ہمیشہ آپ کے منتظر ہیں!",
      "searchPlaceholder": "اچار، مربہ، مٹھائیاں تلاش کریں...",
      "searchBtn": "تلاش کریں 🔍",
      "buttons": {
            "explore": "🛍️ تمام 15 پروڈکٹس دیکھیں",
            "home": "🏠 ہوم پیج پر واپس جائیں",
            "wa": "💬 واٹس ایپ پر رابطہ کریں"
      },
      "popularHeading": "✨ سب سے زیادہ مقبول پروڈکٹس"
}
  }
};

/**
 * Recursive Proxy Dictionary implementation with fallback to English
 */
export function createProxyDictionary(dict, fallback) {
  return new Proxy(dict || {}, {
    get(target, prop) {
      if (typeof prop === 'symbol') return target[prop];
      const val = target[prop];
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && !Array.isArray(val)) {
          return createProxyDictionary(val, fallback ? fallback[prop] : {});
        }
        return val;
      }
      if (fallback && fallback[prop] !== undefined) {
        return fallback[prop];
      }
      return prop.toString();
    }
  });
}

/**
 * Translation Hook / Accessor returning a safe proxy dictionary
 */
export const useTranslation = (lang) => {
  const activeLang = lang || getCurrentLanguage();
  const selected = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
  return createProxyDictionary(selected, TRANSLATIONS.en);
};

/**
 * Get the currently active language ('en' | 'hi' | 'ur').
 * Checks primary 'app_language' with fallback to legacy 'satvik_lang'.
 * Defaults to 'en' (English).
 */
export function getCurrentLanguage() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('app_language') || localStorage.getItem('satvik_lang');
      if (stored === 'ur' || stored === 'hi' || stored === 'en') {
        return stored;
      }
    }
  } catch (e) {
    console.warn('localStorage read error:', e);
  }
  return 'en';
}

/**
 * Set the language ('en' | 'hi' | 'ur'), persist in storage keys,
 * update document lang and dir (RTL for Urdu, LTR for others), apply translations,
 * and dispatch both 'languagechange' and 'languageChanged' events.
 */
export function setLanguage(lang) {
  const target = (lang === 'ur' || lang === 'hi') ? lang : 'en';
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_language', target);
      localStorage.setItem('satvik_lang', target);
    }
  } catch (e) {
    console.warn('localStorage save error:', e);
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = target;
    document.documentElement.dir = (target === 'ur') ? 'rtl' : 'ltr';
  }

  applyTranslations(target);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: target } }));
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: target } }));
  }
}

/**
 * Synchronize the language selector UI labels (#active-lang-label) and active option states (.lang-opt)
 */
export function updateLanguageSelectorUI(lang) {
  if (typeof document === 'undefined') return;
  const currentLang = lang || getCurrentLanguage();
  const label = LANG_LABELS[currentLang] || LANG_LABELS.en;

  // 1. Update text of #active-lang-label
  const activeLabels = document.querySelectorAll('#active-lang-label, .active-lang-label');
  activeLabels.forEach(el => {
    el.textContent = label;
  });

  // 2. Update .lang-opt active class
  const langOpts = document.querySelectorAll('.lang-opt, [data-lang]');
  langOpts.forEach(opt => {
    const optLang = opt.getAttribute('data-lang');
    if (optLang === currentLang) {
      opt.classList.add('active');
      opt.setAttribute('aria-selected', 'true');
    } else if (optLang) {
      opt.classList.remove('active');
      opt.setAttribute('aria-selected', 'false');
    }
  });
}

/**
 * Initialize event listeners for the tri-lingual selector (#btn-lang-select, .lang-opt, outside clicks)
 */
export function initLanguageSelector() {
  if (typeof document === 'undefined') return;

  // Initial sync of UI labels
  updateLanguageSelectorUI(getCurrentLanguage());

  // Prevent multiple bindings
  if (window.__satvik_lang_selector_init) return;
  window.__satvik_lang_selector_init = true;

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#btn-lang-select, .btn-lang-select');
    const option = e.target.closest('.lang-opt, [data-lang]');

    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      const parent = trigger.closest('.lang-selector-dropdown, .lang-selector-wrapper, #lang-selector-wrap') || trigger.parentElement;
      const targetMenu = parent ? parent.querySelector('.lang-dropdown-menu, .lang-dropdown, .lang-select-menu') : document.querySelector('#lang-dropdown-menu, .lang-dropdown-menu');
      
      const isOpen = parent ? parent.classList.toggle('is-open') : false;
      if (targetMenu) {
        targetMenu.classList.toggle('open', isOpen);
        targetMenu.classList.toggle('show', isOpen);
      }
      trigger.setAttribute('aria-expanded', String(isOpen));
      return;
    }

    if (option) {
      const selectedLang = option.getAttribute('data-lang');
      if (selectedLang && (selectedLang === 'en' || selectedLang === 'hi' || selectedLang === 'ur')) {
        e.preventDefault();
        setLanguage(selectedLang);
      }
      // Close all dropdown menus
      document.querySelectorAll('.lang-selector-dropdown, .lang-selector-wrapper, #lang-selector-wrap').forEach(w => {
        w.classList.remove('is-open', 'open');
      });
      document.querySelectorAll('.lang-dropdown-menu, .lang-dropdown, .lang-select-menu').forEach(menu => {
        menu.classList.remove('open', 'show');
      });
      document.querySelectorAll('#btn-lang-select, .btn-lang-select').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
      });
      return;
    }

    // Outside click - close open dropdowns
    if (!e.target.closest('#btn-lang-select, .btn-lang-select, #lang-dropdown-menu, .lang-dropdown-menu, .lang-selector-dropdown, #lang-selector-wrap')) {
      document.querySelectorAll('.lang-selector-dropdown, .lang-selector-wrapper, #lang-selector-wrap').forEach(w => {
        w.classList.remove('is-open', 'open');
      });
      document.querySelectorAll('.lang-dropdown-menu, .lang-dropdown, .lang-select-menu').forEach(menu => {
        menu.classList.remove('open', 'show');
      });
      document.querySelectorAll('#btn-lang-select, .btn-lang-select').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initLanguageSelector());
  } else {
    initLanguageSelector();
  }
}

/**
 * Helper to fetch a nested string using dot-notation: t('nav.home')
 */
export function t(path, lang = null) {
  if (!path || typeof path !== 'string') return '';
  const currentLang = lang || getCurrentLanguage();
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const parts = path.split('.');
  let current = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current && current[part] !== undefined && current[part] !== null) {
      current = current[part];
    } else {
      // Fallback to English
      let fallback = TRANSLATIONS.en;
      for (const fpart of parts) {
        if (fallback && typeof fallback === 'object' && fpart in fallback && fallback[fpart] !== undefined && fallback[fpart] !== null) {
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
  if (typeof document === 'undefined') return;

  const activeLang = lang || getCurrentLanguage();
  const dict = TRANSLATIONS[activeLang] || TRANSLATIONS.en;

  // 0. Update HTML Document Language & Text Direction
  if (document.documentElement) {
    document.documentElement.lang = activeLang;
    document.documentElement.dir = (activeLang === 'ur') ? 'rtl' : 'ltr';
  }

  // 1. Synchronize tri-lingual selector UI
  updateLanguageSelectorUI(activeLang);

  // 2. Update Legacy Toggle Buttons (if present)
  const toggleBtns = document.querySelectorAll('.btn-lang-toggle, #btn-lang-toggle, #mobile-lang-toggle, .mobile-lang-toggle');
  toggleBtns.forEach(btn => {
    const textSpan = btn.querySelector('.lang-toggle-text');
    if (textSpan) {
      textSpan.textContent = dict.langToggleText;
    } else {
      btn.innerHTML = `<span class="lang-icon">🌐</span> <span class="lang-toggle-text">${dict.langToggleText}</span>`;
    }
    btn.setAttribute('aria-label', dict.langToggleAria || `Switch Language`);
    btn.title = dict.langToggleAria || `Switch Language`;
  });

  // 3. Brand sub text
  const brandSub = document.querySelector('.brand-sub');
  if (brandSub) brandSub.textContent = dict.brandSub;

  // 4. Main Navigation
  const navLinks = document.querySelectorAll('.main-nav .nav-link, .header-dropdown-menu .dropdown-nav-link, .mobile-nav-drawer .mobile-nav-link');
  navLinks.forEach(link => {
    if (link.classList.contains('btn-lang-toggle') || link.classList.contains('mobile-lang-toggle') || link.id === 'mobile-lang-toggle' || link.id === 'btn-lang-toggle') {
      return;
    }
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

  // 5. Header Actions
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

  // 6. Mobile Bottom Nav
  const bNavHome = document.querySelector('#bottom-nav-home .bottom-nav-label');
  if (bNavHome) bNavHome.textContent = dict.bottomNav.home;
  const bNavProd = document.querySelector('#bottom-nav-products .bottom-nav-label');
  if (bNavProd) bNavProd.textContent = dict.bottomNav.products;
  const bNavCart = document.querySelector('#bottom-nav-cart .bottom-nav-label');
  if (bNavCart) bNavCart.textContent = dict.bottomNav.cart;
  const bNavProf = document.querySelector('#bottom-nav-profile .bottom-nav-label');
  if (bNavProf) bNavProf.textContent = dict.bottomNav.profile;

  // 7. Announcement Ticker
  const tickerGroups = document.querySelectorAll('.announcement-group');
  tickerGroups.forEach(grp => {
    const spans = grp.querySelectorAll('span');
    if (spans.length >= 6 && dict.ticker) {
      spans.forEach((s, idx) => {
        if (dict.ticker[idx]) s.textContent = dict.ticker[idx];
      });
    }
  });

  // 8. Trust Badges
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

  // 9. Reorder Section
  const reorderTitle = document.querySelector('.reorder-section .section-title');
  if (reorderTitle) reorderTitle.textContent = dict.reorder.title;
  const reorderSub = document.querySelector('.reorder-section .section-subtitle');
  if (reorderSub) reorderSub.textContent = dict.reorder.subtitle;
  const reorderBtns = document.querySelectorAll('.btn-reorder-add');
  reorderBtns.forEach(btn => {
    btn.textContent = `${dict.reorder.btnReorder} 🛒`;
  });

  // 10. Catalog Controls (Products page & Home section)
  const catHeading = document.querySelector('.products-section .section-title, #catalog .section-title');
  if (catHeading) catHeading.textContent = dict.catalog.heading;
  const catBadge = document.querySelector('.products-section .section-badge, #catalog .section-badge');
  if (catBadge) catBadge.textContent = dict.catalog.badge;

  const searchInputs = document.querySelectorAll('#search-input, .search-input, .ref-search-input');
  searchInputs.forEach(input => {
    input.placeholder = dict.catalog.searchPlaceholder;
  });

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    const optNew = sortSelect.querySelector('option[value="newest"]') || sortSelect.options[0];
    if (optNew) optNew.text = dict.catalog.sortDefault;
    const optAsc = sortSelect.querySelector('option[value="price-asc"]') || sortSelect.options[1];
    if (optAsc) optAsc.text = dict.catalog.sortPriceAsc;
    const optDesc = sortSelect.querySelector('option[value="price-desc"]') || sortSelect.options[2];
    if (optDesc) optDesc.text = dict.catalog.sortPriceDesc;
    const optRate = sortSelect.querySelector('option[value="rating"]') || sortSelect.options[3];
    if (optRate) optRate.text = dict.catalog.sortRating || (sortSelect.options[3] ? dict.catalog.sortNameAsc : 'Top Rated');
  }

  // Category Tabs (Home & products.html)
  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    const cat = tab.getAttribute('data-category');
    if (cat && dict.catalog.tabs && dict.catalog.tabs[cat]) {
      const span = tab.querySelector('span');
      if (span) {
        span.textContent = dict.catalog.tabs[cat];
      } else {
        tab.textContent = dict.catalog.tabs[cat];
      }
    }
  });

  // Sidebar Filter Labels on products.html
  const filterHeadSpan = document.querySelector('.ref-filter-heading span');
  if (filterHeadSpan) filterHeadSpan.textContent = dict.catalog.filterBy;

  const filterSubheads = document.querySelectorAll('.ref-filter-subheading');
  filterSubheads.forEach(sh => {
    const text = sh.textContent.trim().toLowerCase();
    if (text.includes('price') || text.includes('कीमत') || text.includes('मूल्य') || text.includes('قیمت')) {
      sh.textContent = dict.catalog.price;
    } else if (text.includes('avail') || text.includes('उपलब्ध') || text.includes('دستیاب')) {
      sh.textContent = dict.catalog.availability;
    }
  });

  const cbUnder200 = document.querySelector('input[data-price="under-200"]');
  if (cbUnder200 && cbUnder200.parentElement) {
    const sp = cbUnder200.parentElement.querySelector('span');
    if (sp) sp.textContent = dict.catalog.under200;
  }
  const cb200_400 = document.querySelector('input[data-price="200-400"]');
  if (cb200_400 && cb200_400.parentElement) {
    const sp = cb200_400.parentElement.querySelector('span');
    if (sp) sp.textContent = dict.catalog.price200_400;
  }
  const cb401_600 = document.querySelector('input[data-price="401-600"]');
  if (cb401_600 && cb401_600.parentElement) {
    const sp = cb401_600.parentElement.querySelector('span');
    if (sp) sp.textContent = dict.catalog.price401_600;
  }
  const cbAbove600 = document.querySelector('input[data-price="above-600"]');
  if (cbAbove600 && cbAbove600.parentElement) {
    const sp = cbAbove600.parentElement.querySelector('span');
    if (sp) sp.textContent = dict.catalog.above600;
  }

  const cbInStock = document.getElementById('filter-instock');
  if (cbInStock && cbInStock.parentElement) {
    const sp = cbInStock.parentElement.querySelector('span');
    if (sp) sp.textContent = dict.catalog.inStock;
  }
  const cbOutOfStock = document.getElementById('filter-outofstock');
  if (cbOutOfStock && cbOutOfStock.parentElement) {
    const sp = cbOutOfStock.parentElement.querySelector('span');
    if (sp) sp.textContent = dict.catalog.outOfStock;
  }

  const sortLabel = document.querySelector('.ref-sort-label');
  if (sortLabel) sortLabel.textContent = `${dict.catalog.sortBy}:`;

  const pickFavImg = document.querySelector('.ref-shop-pick-favourite img, .ref-favourite-doodle-img');
  if (pickFavImg) pickFavImg.alt = dict.catalog.pickYourFavourite;

  const refSecTitle = document.querySelector('.ref-section-title');
  if (refSecTitle) {
    const activeTab = document.querySelector('.category-tab.active');
    const cat = activeTab ? activeTab.getAttribute('data-category') : 'all';
    if (cat === 'achar') refSecTitle.textContent = dict.catalog.catAcharTitle;
    else if (cat === 'sweets') refSecTitle.textContent = dict.catalog.catSweetsTitle;
    else if (cat === 'health') refSecTitle.textContent = dict.catalog.catHealthTitle;
    else refSecTitle.textContent = dict.catalog.catAllTitle;
  }

  // 11. Product Cards (Dynamic titles, badges, descriptions, and buttons)
  const productCards = document.querySelectorAll('.product-card, .ref-product-card');
  productCards.forEach(card => {
    const pId = card.getAttribute('data-product-id');
    const prod = (typeof PRODUCTS_CATALOGUE !== 'undefined' && Array.isArray(PRODUCTS_CATALOGUE))
      ? PRODUCTS_CATALOGUE.find(p => p.id === pId)
      : null;

    const titleEl = card.querySelector('.product-title, .ref-card-title');
    const hindiTitleEl = card.querySelector('.product-hindi-title');
    if (titleEl && prod) {
      if (activeLang === 'ur') {
        titleEl.textContent = prod.urduName || prod.name;
      } else if (activeLang === 'hi') {
        titleEl.textContent = prod.hindiName || prod.name;
      } else {
        titleEl.textContent = prod.name;
      }
    }
    if (hindiTitleEl && prod) {
      hindiTitleEl.textContent = (activeLang === 'hi' || activeLang === 'ur') ? prod.name : (prod.hindiName || '');
    }

    const descEl = card.querySelector('.product-desc, .ref-card-desc');
    if (descEl && prod) {
      if (activeLang === 'ur') {
        descEl.textContent = prod.urduDesc || prod.shortDesc;
      } else if (activeLang === 'hi') {
        descEl.textContent = prod.hindiDesc || prod.shortDesc;
      } else {
        descEl.textContent = prod.shortDesc;
      }
    }

    const badge = card.querySelector('.product-badge, .ref-card-badge');
    if (badge && prod) {
      const orig = prod.badge || badge.textContent.trim();
      if (orig === 'Bestseller') {
        badge.textContent = dict.catalog.bestseller;
      } else if (orig === 'Healthy Choice') {
        badge.textContent = dict.catalog.healthyChoice;
      } else if (orig === 'New') {
        badge.textContent = dict.catalog.newBadge;
      } else if (orig === 'Traditional Recipe') {
        badge.textContent = dict.catalog.traditionalRecipe;
      } else if (orig === 'Banarasi Special') {
        badge.textContent = (activeLang === 'ur') ? 'بنارسی خاص' : (activeLang === 'hi' ? 'बनारसी स्पेशल' : 'Banarasi Special');
      } else if (orig === 'Tangy Special') {
        badge.textContent = (activeLang === 'ur') ? 'چٹپٹا خاص' : (activeLang === 'hi' ? 'चटपटा स्पेशल' : 'Tangy Special');
      } else if (orig === 'Spicy Favorite') {
        badge.textContent = (activeLang === 'ur') ? 'چٹپٹا پسندیدہ' : (activeLang === 'hi' ? 'तीखा पसंदीदा' : 'Spicy Favorite');
      } else if (orig === 'Digestive Remedy') {
        badge.textContent = (activeLang === 'ur') ? 'ہاضم نسخہ' : (activeLang === 'hi' ? 'पाचक औषधि' : 'Digestive Remedy');
      } else if (orig === 'Heart Healthy') {
        badge.textContent = (activeLang === 'ur') ? 'صحتِ قلب کے لیے مفید' : (activeLang === 'hi' ? 'हृदय के लिए लाभकारी' : 'Heart Healthy');
      } else if (orig === 'Winter Classic' || orig === 'Winter Special') {
        badge.textContent = (activeLang === 'ur') ? 'موسم سرما کی سوغات' : (activeLang === 'hi' ? 'सर्दियों का खास' : 'Winter Classic');
      } else if (orig === 'Rasayana Classic') {
        badge.textContent = (activeLang === 'ur') ? 'طبیعت بخش نسخہ' : (activeLang === 'hi' ? 'आयुर्वेदिक रसायन' : 'Rasayana Classic');
      } else if (orig === 'Premium Preserve') {
        badge.textContent = (activeLang === 'ur') ? 'اعلیٰ روایتی سوغات' : (activeLang === 'hi' ? 'प्रीमियम मुरब्बा' : 'Premium Preserve');
      } else if (orig === 'Festive Favorite') {
        badge.textContent = (activeLang === 'ur') ? 'تہواروں کی پسند' : (activeLang === 'hi' ? 'त्योहारी मिष्ठान्न' : 'Festive Favorite');
      } else if (orig === '100% Pure') {
        badge.textContent = (activeLang === 'ur') ? '100% خالص' : (activeLang === 'hi' ? '100% शुद्ध' : '100% Pure');
      } else if (orig === 'Ayurvedic Elixir') {
        badge.textContent = (activeLang === 'ur') ? 'طبی امرت' : (activeLang === 'hi' ? 'आयुर्वेदिक अमृत' : 'Ayurvedic Elixir');
      }
    }

    const stock = card.querySelector('.stock-status-badge');
    if (stock) {
      const sText = stock.textContent.toLowerCase();
      if (sText.includes('in stock') || sText.includes('उपलब्ध') || sText.includes('دستیاب')) {
        stock.textContent = dict.catalog.inStock;
      } else if (sText.includes('out') || sText.includes('समाप्त') || sText.includes('ختم')) {
        stock.textContent = dict.catalog.outOfStock;
      }
    }

    const viewBtn = card.querySelector('.btn-view-details');
    if (viewBtn) viewBtn.textContent = dict.catalog.btnViewDetails;

    const addBtn = card.querySelector('.btn-add-cart');
    if (addBtn && !addBtn.classList.contains('added')) {
      const span = addBtn.querySelector ? addBtn.querySelector('span') : null;
      if (span) span.textContent = dict.catalog.btnAddCart;
      else addBtn.textContent = dict.catalog.btnAddCart;
    } else if (addBtn && addBtn.classList.contains('added')) {
      const span = addBtn.querySelector ? addBtn.querySelector('span') : null;
      if (span) span.textContent = dict.catalog.btnAdded;
      else addBtn.textContent = dict.catalog.btnAdded;
    }

    // Savings / Discount tag on cards
    const cardDisc = card.querySelector('.ref-card-discount, .savings-tag');
    if (cardDisc) {
      const match = cardDisc.textContent.match(/(\d+%\s*OFF|\d+%)/i);
      if (match) {
        if (activeLang === 'ur') cardDisc.textContent = `${match[1].replace('OFF','').trim()} بچت`;
        else if (activeLang === 'hi') cardDisc.textContent = `${match[1].replace('OFF','').trim()} छूट`;
        else cardDisc.textContent = `${dict.catalog.saveTag} ${match[1].replace('OFF','').trim()}`;
      }
    }
  });

  // 12. Product Details Page Specific Elements
  const pdPackLabel = document.querySelector('#pd-pack-label, .pd-pack-label, .pd-variant-label');
  if (pdPackLabel) pdPackLabel.textContent = `⚖️ ${dict.productDetails.selectPack}`;
  const pdQtyLabel = document.querySelector('#pd-qty-label, .pd-qty-label');
  if (pdQtyLabel) pdQtyLabel.textContent = dict.productDetails.quantity;

  const pdAddCart = document.getElementById('pd-btn-add-cart');
  if (pdAddCart && !pdAddCart.disabled) {
    const span = pdAddCart.querySelector('span');
    if (span) span.textContent = dict.productDetails.btnAddToCart;
    else pdAddCart.textContent = dict.productDetails.btnAddToCart;
  }

  const pdBuyNow = document.getElementById('pd-btn-buy-now');
  if (pdBuyNow) {
    const span = pdBuyNow.querySelector('span');
    if (span) span.textContent = dict.productDetails.btnBuyNow;
    else pdBuyNow.textContent = dict.productDetails.btnBuyNow;
  }

  const tabIng = document.getElementById('tab-btn-ingredients');
  if (tabIng) tabIng.textContent = dict.productDetails.tabIngredients;
  const tabHlt = document.getElementById('tab-btn-health');
  if (tabHlt) tabHlt.textContent = dict.productDetails.tabHealth;
  const tabStr = document.getElementById('tab-btn-storage');
  if (tabStr) tabStr.textContent = dict.productDetails.tabStorage;
  const tabRev = document.getElementById('tab-btn-reviews');
  if (tabRev) tabRev.textContent = dict.productDetails.tabReviews;

  // Specs Titles and Content
  const specsTitle = document.querySelector('.pd-specs-title');
  if (specsTitle) specsTitle.textContent = dict.productDetails.specsTitle;

  const specSubheads = document.querySelectorAll('.pd-spec-subhead');
  specSubheads.forEach(sh => {
    const t = sh.textContent.toLowerCase();
    if (t.includes('heritage') || t.includes('विरासत') || t.includes('ورثہ') || t.includes('description')) {
      sh.textContent = `📋 ${dict.productDetails.heritageDescTitle}`;
    } else if (t.includes('ingredient') || t.includes('सामग्री') || t.includes('اجزاء')) {
      sh.textContent = `🌿 ${dict.productDetails.ingredientsTitle}`;
    } else if (t.includes('storage') || t.includes('रखरखाव') || t.includes('حفاظت') || t.includes('shelf life')) {
      sh.textContent = `🪔 ${dict.productDetails.storageTitle}`;
    } else if (t.includes('allergen') || t.includes('एलर्जन') || t.includes('الرجی') || t.includes('packaging')) {
      sh.textContent = `⚠️ ${dict.productDetails.allergenTitle}`;
    }
  });

  const specTexts = document.querySelectorAll('.pd-spec-text strong');
  specTexts.forEach(st => {
    const t = st.textContent.toLowerCase();
    if (t.includes('shelf life') || t.includes('शेल्फ') || t.includes('میعاد')) {
      st.textContent = dict.productDetails.shelfLifeLabel;
    } else if (t.includes('allergen') || t.includes('एलर्जन') || t.includes('الرجی')) {
      st.textContent = dict.productDetails.allergensLabel;
    } else if (t.includes('packaging') || t.includes('पैकेजिंग') || t.includes('پیکجنگ')) {
      st.textContent = dict.productDetails.packagingLabel;
    }
  });

  // Current product info on product details page
  try {
    const urlParams = (typeof window !== 'undefined' && window.location) ? new URLSearchParams(window.location.search) : null;
    const pId = urlParams ? (urlParams.get('id') || urlParams.get('productId') || urlParams.get('slug')) : null;
    if (pId && typeof PRODUCTS_CATALOGUE !== 'undefined' && Array.isArray(PRODUCTS_CATALOGUE)) {
      const prod = PRODUCTS_CATALOGUE.find(p => p.id === pId || p.productId === pId || p.slug === pId) || PRODUCTS_CATALOGUE[0];
      if (prod) {
        const primaryTitle = (activeLang === 'ur') ? (prod.urduName || prod.name) : (activeLang === 'hi' ? (prod.hindiName || prod.name) : prod.name);
        const secondaryTitle = (activeLang === 'hi' || activeLang === 'ur') ? prod.name : (prod.hindiName || '');

        const pdTitle = document.getElementById('pd-title');
        if (pdTitle) pdTitle.textContent = primaryTitle;
        const pdHindiTitle = document.getElementById('pd-hindi-title');
        if (pdHindiTitle) pdHindiTitle.textContent = secondaryTitle;
        const pdBreadcrumb = document.getElementById('pd-breadcrumb-title');
        if (pdBreadcrumb) pdBreadcrumb.textContent = primaryTitle;

        const pdShortDesc = document.getElementById('pd-short-desc');
        if (pdShortDesc) {
          pdShortDesc.textContent = (activeLang === 'ur') ? (prod.urduDesc || prod.shortDesc) : (activeLang === 'hi' ? (prod.hindiDesc || prod.shortDesc) : prod.shortDesc);
        }
        const pdFullDesc = document.getElementById('pd-full-desc');
        if (pdFullDesc) {
          pdFullDesc.textContent = (activeLang === 'ur') ? (prod.urduFullDesc || prod.fullDesc) : (activeLang === 'hi' ? (prod.hindiFullDesc || prod.fullDesc) : prod.fullDesc);
        }
        const pdIng = document.getElementById('pd-ingredients') || document.getElementById('pd-spec-ingredients');
        if (pdIng) {
          pdIng.textContent = (activeLang === 'ur') ? (prod.urduIngredients || prod.ingredients) : (activeLang === 'hi' ? (prod.hindiIngredients || prod.ingredients) : prod.ingredients);
        }
        const pdStorage = document.getElementById('pd-storage-info') || document.getElementById('pd-spec-storage');
        if (pdStorage) {
          pdStorage.textContent = (activeLang === 'ur') ? (prod.urduStorage || prod.storageInfo) : (activeLang === 'hi' ? (prod.hindiStorage || prod.storageInfo) : prod.storageInfo);
        }
        const pdShelf = document.getElementById('pd-shelf-life') || document.getElementById('pd-spec-shelflife');
        if (pdShelf) {
          pdShelf.textContent = (activeLang === 'ur') ? (prod.urduShelfLife || prod.shelfLife) : (activeLang === 'hi' ? (prod.hindiShelfLife || prod.shelfLife) : prod.shelfLife);
        }
        const pdAllergens = document.getElementById('pd-allergens') || document.getElementById('pd-spec-allergens');
        if (pdAllergens) {
          pdAllergens.textContent = (activeLang === 'ur') ? (prod.urduAllergens || prod.allergens) : (activeLang === 'hi' ? (prod.hindiAllergens || prod.allergens) : prod.allergens);
        }
        const pdPack = document.getElementById('pd-packaging') || document.getElementById('pd-spec-packaging');
        if (pdPack) {
          pdPack.textContent = (activeLang === 'ur') ? (prod.urduPackaging || prod.packaging) : (activeLang === 'hi' ? (prod.hindiPackaging || prod.packaging) : prod.packaging);
        }
      }
    }
  } catch (_) {}

  // Reviews section on product details
  const revHeading = document.querySelector('.pd-reviews-card h2');
  if (revHeading) revHeading.textContent = `✦ ${dict.productDetails.verifiedReviews}`;
  const revSub = document.querySelector('.pd-reviews-card p');
  if (revSub) revSub.textContent = dict.productDetails.reviewsSub;
  const revAllBtn = document.querySelector('.pd-reviews-card .btn-secondary');
  if (revAllBtn) revAllBtn.textContent = dict.productDetails.allReviewsBtn;

  // Related products section on product details
  const relHeading = document.querySelector('.pd-related-section h2');
  if (relHeading) relHeading.textContent = `✦ ${dict.productDetails.relatedTitle}`;
  const relSub = document.querySelector('.pd-related-section p');
  if (relSub) relSub.textContent = dict.productDetails.relatedSub;

  const taxNote = document.querySelector('.pd-tax-note');
  if (taxNote) taxNote.textContent = dict.productDetails.inclusiveTaxes;

  // 13. Cart Drawer Static Labels
  const cartDrawerTitle = document.querySelector('#cart-drawer .cart-drawer-title');
  if (cartDrawerTitle) cartDrawerTitle.textContent = dict.cart.title;
  const cartFreeDeliv = document.querySelector('#cart-drawer .free-shipping-text');
  if (cartFreeDeliv) cartFreeDeliv.textContent = dict.cart.freeDeliveryNote;
  const cartEmptyMsg = document.querySelector('.empty-cart-msg, .cart-empty p');
  if (cartEmptyMsg) cartEmptyMsg.textContent = dict.cart.emptyMsg;
  const cartContinue = document.querySelector('.btn-continue-shopping');
  if (cartContinue) cartContinue.textContent = dict.cart.continueShopping;
  const cartSubtotalLabel = document.querySelector('#cart-drawer .cart-subtotal-label');
  if (cartSubtotalLabel) cartSubtotalLabel.textContent = dict.cart.subtotal;
  const cartCheckoutBtn = document.getElementById('btn-checkout');
  if (cartCheckoutBtn) cartCheckoutBtn.textContent = dict.cart.btnCheckout;

  // 14. Quick Checkout Modal Labels
  const chkTitle = document.querySelector('#checkout-modal .modal-title');
  if (chkTitle) chkTitle.textContent = dict.checkout.title;
  const chkSub = document.querySelector('#checkout-modal .modal-subtitle');
  if (chkSub) chkSub.textContent = dict.checkout.subtitle;

  const labelName = document.querySelector('#checkout-form label[for="checkout-name"], label.field-label-name');
  if (labelName) labelName.textContent = dict.checkout.nameLabel;
  const labelPhone = document.querySelector('#checkout-form label[for="checkout-phone"], label.field-label-phone');
  if (labelPhone) labelPhone.textContent = dict.checkout.phoneLabel;
  const labelAddr = document.querySelector('#checkout-form label[for="checkout-address"], label.field-label-address');
  if (labelAddr) labelAddr.textContent = dict.checkout.addressLabel;
  const labelCity = document.querySelector('#checkout-form label[for="checkout-city"], label.field-label-city');
  if (labelCity) labelCity.textContent = dict.checkout.cityLabel;
  const labelState = document.querySelector('#checkout-form label[for="checkout-state"], label.field-label-state');
  if (labelState) labelState.textContent = dict.checkout.stateLabel;
  const labelPin = document.querySelector('#checkout-form label[for="checkout-pincode"], label.field-label-pincode');
  if (labelPin) labelPin.textContent = dict.checkout.pincodeLabel;

  const inputName = document.getElementById('checkout-name');
  if (inputName) inputName.placeholder = dict.checkout.namePlaceholder;
  const inputPhone = document.getElementById('checkout-phone');
  if (inputPhone) inputPhone.placeholder = dict.checkout.phonePlaceholder;
  const inputAddr = document.getElementById('checkout-address');
  if (inputAddr) inputAddr.placeholder = dict.checkout.addressPlaceholder;
  const inputCity = document.getElementById('checkout-city');
  if (inputCity) inputCity.placeholder = dict.checkout.cityPlaceholder;
  const inputState = document.getElementById('checkout-state');
  if (inputState) inputState.placeholder = dict.checkout.statePlaceholder;
  const inputPin = document.getElementById('checkout-pincode');
  if (inputPin) inputPin.placeholder = dict.checkout.pincodePlaceholder;

  const payTitle = document.querySelector('.payment-methods-title, #payment-methods-title');
  if (payTitle) payTitle.textContent = dict.checkout.paymentTitle;
  const codTitle = document.querySelector('.payment-option-cod .payment-title, label[for="pay-cod"] .payment-title');
  if (codTitle) codTitle.textContent = dict.checkout.paymentCod;
  const codSub = document.querySelector('.payment-option-cod .payment-desc, label[for="pay-cod"] .payment-desc');
  if (codSub) codSub.textContent = dict.checkout.paymentCodSub;
  const onlineTitle = document.querySelector('.payment-option-online .payment-title, label[for="pay-online"] .payment-title');
  if (onlineTitle) onlineTitle.textContent = dict.checkout.paymentOnline;
  const onlineSub = document.querySelector('.payment-option-online .payment-desc, label[for="pay-online"] .payment-desc');
  if (onlineSub) onlineSub.textContent = dict.checkout.paymentOnlineSub;

  const chkBtn = document.getElementById('btn-place-order');
  if (chkBtn && !chkBtn.disabled) chkBtn.textContent = dict.checkout.btnPlaceOrder;

  // 15. Global Footer
  try {
    translateGlobalFooter(dict, activeLang);
  } catch (err) {
    console.warn('translateGlobalFooter error:', err);
  }

  // 16. Floating Support Assistant
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
  const agentSendBtn = document.getElementById('agent-send-btn');
  if (agentSendBtn) {
    agentSendBtn.setAttribute('title', dict.assistant.send);
    agentSendBtn.setAttribute('aria-label', dict.assistant.send);
  }

  // 17. Dynamic data-i18n attributes for custom tags
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translation = t(key, activeLang);
      if (translation && translation !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.getAttribute('data-i18n-attr') === 'placeholder' || !el.value) {
            el.placeholder = translation;
          }
        } else {
          el.textContent = translation;
        }
      }
    }
  });

  // 18. Subpage Breadcrumbs & Headings
  const breadcrumbLinks = document.querySelectorAll('.breadcrumbs a, .breadcrumb-inner a');
  breadcrumbLinks.forEach(a => {
    const txt = a.textContent.trim().toLowerCase();
    if (a.getAttribute('href') === 'index.html' || txt === 'home' || txt === 'होम' || txt === 'ہوم') {
      a.textContent = dict.nav.home;
    } else if (a.getAttribute('href') === 'products.html' || txt === 'products' || txt === 'shop' || txt === 'उत्पाद' || txt === 'دکان' || txt === 'مصنوعات') {
      a.textContent = dict.nav.products;
    }
  });

  const breadcrumbStrong = document.querySelector('.breadcrumbs strong, .breadcrumb-inner .current:not(#pd-breadcrumb-title)');
  if (breadcrumbStrong) {
    const text = breadcrumbStrong.textContent.trim().toLowerCase();
    if (text.includes('why') || text.includes('खासियत') || text.includes('صحت')) breadcrumbStrong.textContent = dict.nav.whyUs;
    else if (text.includes('story') || text.includes('कहानी') || text.includes('ہماری کہانی')) breadcrumbStrong.textContent = dict.nav.ourStory;
    else if (text.includes('review') || text.includes('समीक्षा') || text.includes('رائے')) breadcrumbStrong.textContent = dict.nav.reviews;
    else if (text.includes('faq') || text.includes('سوالات')) breadcrumbStrong.textContent = dict.nav.faq;
    else if (text.includes('contact') || text.includes('संपर्क') || text.includes('رابطہ')) breadcrumbStrong.textContent = dict.nav.contact;
    else if (text.includes('product') || text.includes('उत्पाद') || text.includes('مصنوعات')) breadcrumbStrong.textContent = dict.nav.products;
    else if (text.includes('profile') || text.includes('प्रोफाइल') || text.includes('پروفائل')) breadcrumbStrong.textContent = dict.nav.profile;
  }

  // 19. Homepage Hero Slider & Banner Captions / CTAs
  const heroTitles = document.querySelectorAll('.hero-title');
  heroTitles.forEach(el => {
    el.textContent = dict.home?.hero?.tagline || el.textContent;
  });

  const heroSubtitles = document.querySelectorAll('.hero-subtitle');
  heroSubtitles.forEach(el => {
    el.textContent = dict.home?.hero?.subTagline || el.textContent;
  });

  const sliderCaptions = document.querySelectorAll('.slider-caption');
  sliderCaptions.forEach((cap, idx) => {
    if (dict.home?.hero?.captions && dict.home.hero.captions[idx]) {
      cap.textContent = dict.home.hero.captions[idx];
    }
  });

  const heroCtas = document.querySelectorAll('.btn-hero-cta');
  heroCtas.forEach(cta => {
    const text = cta.textContent.toLowerCase();
    if (text.includes('shop') || text.includes('खरीदें') || text.includes('خریدیں')) {
      cta.textContent = dict.home?.hero?.ctaShop || "Shop Now";
    } else if (text.includes('story') || text.includes('कहानी')) {
      cta.textContent = dict.home?.hero?.ctaStory || "Our Story";
    } else if (text.includes('explore') || text.includes('उत्पाद') || text.includes('مصنوعات')) {
      cta.textContent = dict.home?.hero?.ctaExplore || "Explore Pure Preserves";
    }
  });

  // Hero Slide Alt and Aria-Label updates
  const heroSlideImgs = document.querySelectorAll('.hero-slide-img');
  if (heroSlideImgs.length >= 3 && dict.home?.hero) {
    if (heroSlideImgs[0]) heroSlideImgs[0].alt = dict.home.hero.slide1Alt;
    if (heroSlideImgs[1]) heroSlideImgs[1].alt = dict.home.hero.slide2Alt;
    if (heroSlideImgs[2]) heroSlideImgs[2].alt = dict.home.hero.slide3Alt;
  }
  const heroSlides = document.querySelectorAll('.hero-slide');
  if (heroSlides.length >= 3 && dict.home?.hero) {
    if (heroSlides[0]) heroSlides[0].setAttribute('aria-label', `1 of 3: ${dict.home.hero.tagline}`);
    if (heroSlides[1]) heroSlides[1].setAttribute('aria-label', `2 of 3: ${dict.home.qualityPillars?.p1Title || "14-Day Sun Cured"}`);
    if (heroSlides[2]) heroSlides[2].setAttribute('aria-label', `3 of 3: ${dict.home.hero.subTagline}`);
  }

  // 20. Explore Village Categories (index.html)
  const catEyebrow = document.querySelector('.category-circles-eyebrow');
  if (catEyebrow && dict.home?.villageCategories) catEyebrow.textContent = dict.home.villageCategories.eyebrow;

  const catMainTitle = document.querySelector('.category-circles-main-title');
  if (catMainTitle && dict.home?.villageCategories) catMainTitle.textContent = dict.home.villageCategories.title;

  const circleItems = document.querySelectorAll('.category-circle-item');
  circleItems.forEach(item => {
    const href = item.getAttribute('href') || '';
    const titleEl = item.querySelector('.category-circle-title');
    const badgeEl = item.querySelector('.category-circle-badge');
    if (!dict.home?.villageCategories) return;

    if (href.includes('achar')) {
      if (titleEl) titleEl.textContent = dict.home.villageCategories.acharTitle;
      if (badgeEl) badgeEl.textContent = dict.home.villageCategories.acharBadge;
      item.setAttribute('aria-label', `${dict.home.villageCategories.acharTitle} - ${dict.home.villageCategories.acharBadge}`);
    } else if (href.includes('sweets')) {
      if (titleEl) titleEl.textContent = dict.home.villageCategories.sweetsTitle;
      if (badgeEl) badgeEl.textContent = dict.home.villageCategories.sweetsBadge;
      item.setAttribute('aria-label', `${dict.home.villageCategories.sweetsTitle} - ${dict.home.villageCategories.sweetsBadge}`);
    } else if (href.includes('health')) {
      if (titleEl) titleEl.textContent = dict.home.villageCategories.healthTitle;
      if (badgeEl) badgeEl.textContent = dict.home.villageCategories.healthBadge;
      item.setAttribute('aria-label', `${dict.home.villageCategories.healthTitle} - ${dict.home.villageCategories.healthBadge}`);
    } else if (href === 'products.html' || href.endsWith('/products.html')) {
      if (titleEl) titleEl.textContent = dict.home.villageCategories.allTitle;
      if (badgeEl) badgeEl.textContent = dict.home.villageCategories.allBadge;
      item.setAttribute('aria-label', `${dict.home.villageCategories.allTitle} - ${dict.home.villageCategories.allBadge}`);
    }
  });

  // 21. "Why Choose Satvik Swaad" Section (index.html)
  if (dict.home?.whyChoose) {
    const wcContentDoodle = document.querySelector('.why-choose-content .doodle');
    if (wcContentDoodle) wcContentDoodle.textContent = dict.home.whyChoose.eyebrow;

    const wcTitle = document.querySelector('.why-choose-title');
    if (wcTitle) {
      wcTitle.innerHTML = `${dict.home.whyChoose.titlePrefix}<br/><span class="brush-underline">${dict.home.whyChoose.titleHighlight}</span> <svg class="heart-doodle" viewBox="0 0 32 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27C16 27 3 19 3 10.5C3 6 6.5 3 10.5 3C13 3 15 4.5 16 6.5C17 4.5 19 3 21.5 3C25.5 3 29 6 29 10.5C29 19 16 27 16 27Z" /></svg>`;
    }

    const wcDesc = document.querySelector('.why-choose-desc');
    if (wcDesc) wcDesc.textContent = dict.home.whyChoose.desc;

    const rightDoodles = document.querySelectorAll('.why-choose-right-doodles .doodle');
    if (rightDoodles.length >= 3) {
      rightDoodles[0].textContent = dict.home.whyChoose.doodlePure;
      rightDoodles[1].textContent = dict.home.whyChoose.doodleDesi;
      rightDoodles[2].textContent = dict.home.whyChoose.doodleHealthy;
    }

    const leftNoteText = document.querySelector('.why-choose-left-note .paper-note-text');
    if (leftNoteText) leftNoteText.textContent = dict.home.whyChoose.paperNote;
  }

  // Generic .doodle query
  document.querySelectorAll('.why-choose-hero .doodle:not(.why-choose-content .doodle)').forEach(d => {
    const txt = d.textContent.trim().toLowerCase();
    if (txt.includes('pure') || txt.includes('शुद्ध') || txt.includes('خالص')) d.textContent = dict.home?.whyChoose?.doodlePure || "Pure";
    else if (txt.includes('desi') || txt.includes('देसी') || txt.includes('دیسی')) d.textContent = dict.home?.whyChoose?.doodleDesi || "Desi";
    else if (txt.includes('healthy') || txt.includes('स्वास्थ्य') || txt.includes('صحت')) d.textContent = dict.home?.whyChoose?.doodleHealthy || "Healthy";
  });

  // 22. Quality Pillars Section (index.html)
  if (dict.home?.qualityPillars) {
    const pillarCards = document.querySelectorAll('.quality-pillars-section .pillar-card');
    const pItems = [
      { t: dict.home.qualityPillars.p1Title, d: dict.home.qualityPillars.p1Desc },
      { t: dict.home.qualityPillars.p2Title, d: dict.home.qualityPillars.p2Desc },
      { t: dict.home.qualityPillars.p3Title, d: dict.home.qualityPillars.p3Desc },
      { t: dict.home.qualityPillars.p4Title, d: dict.home.qualityPillars.p4Desc }
    ];
    pillarCards.forEach((card, idx) => {
      if (pItems[idx]) {
        const titleEl = card.querySelector('.pillar-title');
        const descEl = card.querySelector('.pillar-desc');
        if (titleEl) titleEl.textContent = pItems[idx].t;
        if (descEl) descEl.textContent = pItems[idx].d;
      }
    });

    // Also support generic .pillar-title and .pillar-desc
    const allPillarTitles = document.querySelectorAll('.pillar-title');
    allPillarTitles.forEach((pt, idx) => {
      if (pItems[idx % 4] && !pt.closest('.quality-pillars-section')) {
        pt.textContent = pItems[idx % 4].t;
      }
    });
    const allPillarDescs = document.querySelectorAll('.pillar-desc');
    allPillarDescs.forEach((pd, idx) => {
      if (pItems[idx % 4] && !pd.closest('.quality-pillars-section')) {
        pd.textContent = pItems[idx % 4].d;
      }
    });
  }

  // 23. Transparent Compliance Section (index.html)
  if (dict.home?.comparison) {
    const compNote = document.querySelector('.compliance-section .paper-note-text');
    if (compNote) compNote.innerHTML = (activeLang === 'hi') ? "असली सामग्री।<br/>सच्चा विश्वास।" : (activeLang === 'ur' ? "خالص اجزاء۔<br/>سچا اعتماد۔" : "Real Ingredients.<br/>Real Trust.");

    const complianceHeading = document.querySelector('.compliance-section h2 .brush-underline');
    if (complianceHeading) complianceHeading.textContent = dict.home.comparison.complianceTitle;

    const complianceItems = document.querySelectorAll('.compliance-section .comp-item');
    if (complianceItems.length >= 3) {
      const fssaiTitle = complianceItems[0].querySelector('.comp-item-title');
      const fssaiStatus = complianceItems[0].querySelector('.comp-item-status');
      if (fssaiTitle) fssaiTitle.textContent = dict.home.comparison.fssaiLabel;
      if (fssaiStatus) fssaiStatus.textContent = dict.home.comparison.fssaiStatus;

      const gstinTitle = complianceItems[1].querySelector('.comp-item-title');
      const gstinStatus = complianceItems[1].querySelector('.comp-item-status');
      if (gstinTitle) gstinTitle.textContent = dict.home.comparison.gstinLabel;
      if (gstinStatus) gstinStatus.textContent = dict.home.comparison.gstinStatus;

      const pkgTitle = complianceItems[2].querySelector('.comp-item-title');
      const pkgStatus = complianceItems[2].querySelector('.comp-item-status');
      if (pkgTitle) pkgTitle.textContent = dict.home.comparison.pkgLabel;
      if (pkgStatus) pkgStatus.textContent = dict.home.comparison.pkgStatus;
    }

    const compActionBtn = document.querySelector('.compliance-actions a');
    if (compActionBtn) compActionBtn.textContent = dict.home.comparison.btnStory;
  }

  // 24. About Section & Reorder Lead (index.html)
  if (dict.home?.reorder) {
    const rLead = document.querySelector('#reorder-section .section-lead');
    if (rLead) rLead.textContent = dict.home.reorder.lead;
    const rTitle = document.querySelector('#reorder-title');
    if (rTitle) rTitle.textContent = dict.home.reorder.title;
    const rSub = document.querySelector('#reorder-section .section-subtitle');
    if (rSub) rSub.textContent = dict.home.reorder.subtitle;
  }

  if (dict.home?.about) {
    const aboutSub = document.querySelector('#about .section-subtitle');
    if (aboutSub) aboutSub.textContent = dict.home.about.subtitle;
    const aboutTitle = document.querySelector('#about .section-title');
    if (aboutTitle) aboutTitle.textContent = dict.home.about.title;
    const aboutDesc = document.querySelector('#about p');
    if (aboutDesc) aboutDesc.textContent = dict.home.about.desc;
    const aboutLink = document.querySelector('#about a');
    if (aboutLink) aboutLink.textContent = dict.home.about.cta;
  }

  // 25. Our Story Page Narrative, Badges & Doodles (our-story.html)
  if (dict.ourStory) {
    const storyHeroImg = document.querySelector('.ref-shop-hero-section img.ref-hero-banner-img');
    if (storyHeroImg && window.location.pathname.includes('our-story')) {
      storyHeroImg.alt = dict.ourStory.hero.title;
    }

    const storyHeroTitle = document.querySelector('.story-page .hero-title, .ref-story-page-main .hero-title');
    if (storyHeroTitle) storyHeroTitle.textContent = dict.ourStory.hero.title;
    const storyHeroSub = document.querySelector('.story-page .hero-subtitle, .ref-story-page-main .hero-subtitle');
    if (storyHeroSub) storyHeroSub.textContent = dict.ourStory.hero.subtitle;

    const storyDoodle = document.querySelector('.ref-story-doodle-img');
    if (storyDoodle) storyDoodle.alt = dict.ourStory.origin.doodleLove;

    const storyPolaroid = document.querySelector('.ref-story-polaroid-direct-img');
    if (storyPolaroid) storyPolaroid.alt = dict.ourStory.origin.polaroidCaption;

    const storyTitles = document.querySelectorAll('.ref-story-title, .story-section-title');
    storyTitles.forEach(t => {
      t.textContent = dict.ourStory.origin.journeyTitle;
    });

    const storySubtitles = document.querySelectorAll('.ref-story-subtitle');
    storySubtitles.forEach(s => {
      s.textContent = dict.ourStory.origin.journeySubtitle;
    });

    const storyNarratives = document.querySelectorAll('.ref-story-narrative p, .story-p');
    if (storyNarratives.length >= 3) {
      if (storyNarratives[0]) storyNarratives[0].textContent = dict.ourStory.grandmaLegacy.p1;
      if (storyNarratives[1]) storyNarratives[1].textContent = dict.ourStory.womenArtisans.p2;
      if (storyNarratives[2]) storyNarratives[2].textContent = dict.ourStory.traditionalProcess.p3;
    }

    const storyQuotes = document.querySelectorAll('.story-quote');
    storyQuotes.forEach(q => {
      q.textContent = dict.ourStory.origin.polaroidCaption;
    });

    const storyLearnBtn = document.querySelector('.ref-story-learn-more-btn');
    if (storyLearnBtn) {
      storyLearnBtn.innerHTML = `${dict.ourStory.heritageValues.learnMore} <span class="ref-btn-arrow">${activeLang === 'ur' ? '←' : '→'}</span>`;
    }

    const storyBadges = document.querySelectorAll('.ref-story-badge-item');
    const sBadgeData = [
      { t: dict.ourStory.heritageValues.badge1Title, d: dict.ourStory.heritageValues.badge1Desc },
      { t: dict.ourStory.heritageValues.badge2Title, d: dict.ourStory.heritageValues.badge2Desc },
      { t: dict.ourStory.heritageValues.badge3Title, d: dict.ourStory.heritageValues.badge3Desc },
      { t: dict.ourStory.heritageValues.badge4Title, d: dict.ourStory.heritageValues.badge4Desc }
    ];
    storyBadges.forEach((b, idx) => {
      if (sBadgeData[idx]) {
        const bTitle = b.querySelector('.ref-badge-title');
        const bDesc = b.querySelector('.ref-badge-desc');
        if (bTitle) bTitle.textContent = sBadgeData[idx].t;
        if (bDesc) bDesc.textContent = sBadgeData[idx].d;
      }
    });
  }

  // 26. Why Us / Health & Purity Page (why-us.html)
  if (dict.whyUs) {
    const whyUsHeroImg = document.querySelector('.ref-shop-hero-section img.ref-hero-banner-img');
    if (whyUsHeroImg && window.location.pathname.includes('why-us')) {
      whyUsHeroImg.alt = dict.whyUs.hero.title;
    }

    const whyUsHeroTitle = document.querySelector('.hp-page .hero-title, .why-us-page .hero-title');
    if (whyUsHeroTitle) whyUsHeroTitle.textContent = dict.whyUs.hero.title;
    const whyUsHeroSub = document.querySelector('.hp-page .hero-subtitle, .why-us-page .hero-subtitle');
    if (whyUsHeroSub) whyUsHeroSub.textContent = dict.whyUs.hero.subtitle;

    // Manifesto
    const manifestoHeadings = document.querySelectorAll('.manifesto-heading');
    manifestoHeadings.forEach(h => {
      h.textContent = dict.whyUs.manifesto.heading;
    });
    const manifestoTexts = document.querySelectorAll('.manifesto-text');
    manifestoTexts.forEach(t => {
      t.textContent = dict.whyUs.manifesto.text;
    });

    // Purity Cards
    const pCardTitles = document.querySelectorAll('.purity-card-title');
    const pCardDescs = document.querySelectorAll('.purity-card-desc');
    const pCardData = [
      { t: dict.whyUs.oilPurity.title, d: dict.whyUs.oilPurity.desc },
      { t: dict.whyUs.sunCuring.title, d: dict.whyUs.sunCuring.desc },
      { t: dict.whyUs.noChemicals.title, d: dict.whyUs.noChemicals.desc },
      { t: dict.whyUs.rockSalt.title, d: dict.whyUs.rockSalt.desc },
      { t: dict.whyUs.labTesting.title, d: dict.whyUs.labTesting.desc },
      { t: dict.whyUs.trustBadge.title, d: dict.whyUs.trustBadge.desc }
    ];
    pCardTitles.forEach((titleEl, idx) => {
      if (pCardData[idx]) titleEl.textContent = pCardData[idx].t;
    });
    pCardDescs.forEach((descEl, idx) => {
      if (pCardData[idx]) descEl.textContent = pCardData[idx].d;
    });
  }

  // 27. Detailed Comparison Section & Table (why-us.html & index.html)
  if (dict.home?.comparison) {
    const compSubtitle = document.querySelector('.hp-section-subtitle');
    if (compSubtitle) compSubtitle.textContent = dict.home.comparison.subtitle;

    const compHeading = document.querySelector('#comparison-heading, .hp-section-title');
    if (compHeading) compHeading.textContent = dict.home.comparison.title;

    // Table Headers
    const thDim = document.querySelector('.hp-th-dim');
    if (thDim) thDim.textContent = dict.home.comparison.colDim;

    const thBrandTitle = document.querySelector('.hp-th-brand-title');
    if (thBrandTitle) {
      thBrandTitle.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 21C7 15 13 9 21 6C19 14 13 19 7 21L5 21Z" fill="#A5D6A7"/></svg> ${dict.home.comparison.colSatvikTitle}`;
    }
    const thBrandSub = document.querySelector('.hp-th-brand-sub');
    if (thBrandSub) thBrandSub.textContent = dict.home.comparison.colSatvikSub;

    const thMarketTitle = document.querySelector('.hp-th-market-title');
    if (thMarketTitle) {
      thMarketTitle.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 20h20"/><path d="M6 20V10l6 4V8l6 4V4h2v16"/></svg> ${dict.home.comparison.colMarketTitle}`;
    }
    const thMarketSub = document.querySelector('.hp-th-market-sub');
    if (thMarketSub) thMarketSub.textContent = dict.home.comparison.colMarketSub;

    // Generic .comparison-table th
    const genericThs = document.querySelectorAll('.comparison-table th');
    if (genericThs.length >= 3) {
      if (genericThs[0].classList.contains('hp-th-dim') || !genericThs[0].textContent.includes('Satvik')) genericThs[0].textContent = dict.home.comparison.colDim;
      if (genericThs[1]) {
        const sub = genericThs[1].querySelector('.hp-th-brand-sub');
        if (sub) sub.textContent = dict.home.comparison.colSatvikSub;
      }
      if (genericThs[2]) {
        const sub = genericThs[2].querySelector('.hp-th-market-sub');
        if (sub) sub.textContent = dict.home.comparison.colMarketSub;
      }
    }

    // Table Rows (7 Rows)
    const compRows = document.querySelectorAll('.hp-comp-row');
    const rowData = dict.home.comparison.rows;
    compRows.forEach((row, idx) => {
      if (rowData && rowData[idx]) {
        const d = rowData[idx];
        const dimTitle = row.querySelector('.hp-dim-title');
        if (dimTitle) {
          if (idx === 4) {
            dimTitle.innerHTML = `${d.dim}<br/><small style="font-weight: 500; font-size: 11.5px; color: #64748B;">${activeLang === 'hi' ? '(मुरब्बा व मिठाई)' : (activeLang === 'ur' ? '(مربے اور مٹھائیاں)' : '(Murabbas & Sweets)')}</small>`;
          } else if (idx === 6) {
            dimTitle.innerHTML = `${d.dim}<br/><small style="font-weight: 500; font-size: 11.5px; color: #64748B;">${activeLang === 'hi' ? 'परीक्षण' : (activeLang === 'ur' ? 'ویریفکیشن' : 'Verification')}</small>`;
          } else {
            dimTitle.textContent = d.dim;
          }
        }

        const tagSatvik = row.querySelector('.hp-tag-satvik');
        if (tagSatvik) tagSatvik.textContent = d.satvikTag;
        const textSatvik = row.querySelector('.hp-content-text');
        if (textSatvik) textSatvik.innerHTML = `<strong>${d.satvikTag}.</strong> ${d.satvikText}`;

        const tagMarket = row.querySelector('.hp-tag-market');
        if (tagMarket) tagMarket.textContent = d.marketTag;
        const textMarket = row.querySelector('.hp-market-text');
        if (textMarket) textMarket.innerHTML = `<strong>${d.marketTag}.</strong> ${d.marketText}`;
      }
    });

    // Generic .comparison-table td
    const genericTds = document.querySelectorAll('.comparison-table td');
    genericTds.forEach(td => {
      const tag = td.querySelector('.hp-tag-satvik, .hp-tag-market');
      const text = td.querySelector('.hp-content-text, .hp-market-text');
    });

    // Pre-Launch Lab Audit Notice Card
    const noticeTitle = document.querySelector('.hp-notice-title');
    if (noticeTitle) noticeTitle.textContent = dict.home.comparison.noticeTitle;
    const noticeDesc = document.querySelector('.hp-notice-desc');
    if (noticeDesc) noticeDesc.textContent = dict.home.comparison.noticeDesc;

    // Disclaimer
    const disclaimerEm = document.querySelector('.hp-disclaimer em');
    if (disclaimerEm) disclaimerEm.textContent = dict.home.comparison.disclaimer;
    const disclaimerP = document.querySelector('.hp-disclaimer:not(:has(em))');
    if (disclaimerP) disclaimerP.textContent = dict.home.comparison.disclaimer;

    // Transparent Compliance & Licensing Status Card (why-us.html)
    const hpCompTitle = document.querySelector('.hp-compliance-title');
    if (hpCompTitle) hpCompTitle.textContent = dict.home.comparison.complianceTitle;
    const hpCompSub = document.querySelector('.hp-compliance-sub');
    if (hpCompSub) hpCompSub.textContent = dict.home.comparison.complianceSub;

    const hpCompItems = document.querySelectorAll('.hp-compliance-list .hp-compliance-item');
    if (hpCompItems.length >= 3) {
      hpCompItems[0].innerHTML = `• <strong>${dict.home.comparison.fssaiLabel}</strong> <span class="hp-status-pending">${dict.home.comparison.fssaiStatus}</span>`;
      hpCompItems[1].innerHTML = `• <strong>${dict.home.comparison.gstinLabel}</strong> <span class="hp-status-pending">${dict.home.comparison.gstinStatus}</span>`;
      hpCompItems[2].innerHTML = `• <strong>${dict.home.comparison.pkgLabel}</strong> ${dict.home.comparison.pkgStatus}`;
    }

    // Action Buttons
    const hpBtnExplore = document.querySelector('.hp-btn-explore');
    if (hpBtnExplore) hpBtnExplore.textContent = dict.home.comparison.btnExplore;
    const hpBtnStory = document.querySelector('.hp-btn-story');
    if (hpBtnStory) {
      hpBtnStory.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 21C7 15 13 9 21 6C19 14 13 19 7 21L5 21Z" fill="#2E7D32"/></svg> ${dict.home.comparison.btnStory}`;
    }

    // Purity trust badge in checkout modal notice
    const checkoutNoticeText = document.querySelector('#checkout-notice span:last-child');
    if (checkoutNoticeText && dict.whyUs?.trustBadge) {
      checkoutNoticeText.textContent = `${dict.whyUs.trustBadge.title} • ${dict.whyUs.trustBadge.desc}`;
    }
  }

  // =========================================================================
  // 28. Subagent 3: Commerce, Policies & Engagement Pages
  // =========================================================================
  try { translateContactPage(dict, activeLang); } catch (e) { console.warn('translateContactPage error:', e); }
  try { translateFaqPage(dict, activeLang); } catch (e) { console.warn('translateFaqPage error:', e); }
  try { translateReviewsPage(dict, activeLang); } catch (e) { console.warn('translateReviewsPage error:', e); }
  try { translateCartPage(dict, activeLang); } catch (e) { console.warn('translateCartPage error:', e); }
  try { translateProfilePage(dict, activeLang); } catch (e) { console.warn('translateProfilePage error:', e); }
  try { translatePolicyPages(dict, activeLang); } catch (e) { console.warn('translatePolicyPages error:', e); }
  try { translateOrderSuccessPage(dict, activeLang); } catch (e) { console.warn('translateOrderSuccessPage error:', e); }
  try { translatePaymentFailedPage(dict, activeLang); } catch (e) { console.warn('translatePaymentFailedPage error:', e); }
  try { translateNotFoundPage(dict, activeLang); } catch (e) { console.warn('translateNotFoundPage error:', e); }
}

// =========================================================================
// SUBAGENT 3: DOM TRANSLATION HANDLERS FOR COMMERCE, POLICIES & ENGAGEMENT
// =========================================================================

export function translateContactPage(dict, activeLang) {
  if (!dict.contact) return;
  const c = dict.contact;

  const titleTop = document.querySelector('.hero-banner-section .hero-title .title-top');
  if (titleTop && (window.location.pathname.includes('contact') || document.querySelector('.contact-layout'))) {
    titleTop.textContent = c.heroTop;
  }
  const titleScript = document.querySelector('.hero-banner-section .hero-title .title-script-wrapper .brush-underline');
  if (titleScript && (window.location.pathname.includes('contact') || document.querySelector('.contact-layout'))) {
    titleScript.textContent = c.heroScript;
  }
  const heroSub = document.querySelector('.hero-banner-section .hero-subtitle .brush-underline');
  if (heroSub && (window.location.pathname.includes('contact') || document.querySelector('.contact-layout'))) {
    heroSub.textContent = c.heroSubtitle;
  }
  const heroNote = document.querySelector('.hero-banner-section .hero-paper-note p');
  if (heroNote && (window.location.pathname.includes('contact') || document.querySelector('.contact-layout'))) {
    heroNote.textContent = c.note;
  }

  const doodleSpans = document.querySelectorAll('.hero-banner-section .hero-right-doodle .doodle-text');
  if (doodleSpans.length >= 3 && Array.isArray(c.doodleLines)) {
    doodleSpans.forEach((s, idx) => {
      if (c.doodleLines[idx]) s.textContent = c.doodleLines[idx];
    });
  }

  const breadcrumbCurrent = document.querySelector('.breadcrumb-inner .current');
  if (breadcrumbCurrent && (window.location.pathname.includes('contact') || document.querySelector('.contact-layout'))) {
    breadcrumbCurrent.textContent = c.breadcrumb;
  }

  const infoItems = document.querySelectorAll('.contact-info-card .info-item');
  if (infoItems.length >= 4) {
    const t0 = infoItems[0].querySelector('.info-title');
    if (t0) t0.textContent = c.info.kitchenTitle;
    const lines0 = infoItems[0].querySelectorAll('.info-line');
    if (lines0[0]) lines0[0].textContent = c.info.kitchenUnit;
    if (lines0[1]) lines0[1].textContent = c.info.kitchenAddress;
    if (lines0[2]) lines0[2].textContent = c.info.fssai;

    const t1 = infoItems[1].querySelector('.info-title');
    if (t1) t1.textContent = c.info.phoneTitle;
    const lines1 = infoItems[1].querySelectorAll('.info-line');
    if (lines1[1]) lines1[1].textContent = c.info.phoneHours;

    const t2 = infoItems[2].querySelector('.info-title');
    if (t2) t2.textContent = c.info.emailTitle;

    const t3 = infoItems[3].querySelector('.info-title');
    if (t3) t3.textContent = c.info.grievanceTitle;
    const lines3 = infoItems[3].querySelectorAll('.info-line');
    if (lines3[0]) lines3[0].textContent = c.info.grievanceOfficer;
    if (lines3[1]) lines3[1].textContent = c.info.grievanceResolution;
  }

  const merchantCard = document.querySelector('.merchant-id-card');
  if (merchantCard && c.merchant) {
    const mTitle = merchantCard.querySelector('h4');
    if (mTitle) mTitle.textContent = c.merchant.title;
    const mDivs = merchantCard.querySelectorAll('div > div');
    if (mDivs.length >= 6) {
      mDivs[0].innerHTML = `<strong>${c.merchant.legalLabel}:</strong> ${c.merchant.legalValue}`;
      mDivs[1].innerHTML = `<strong>${c.merchant.addressLabel}:</strong> ${c.merchant.addressValue}`;
      mDivs[2].innerHTML = `<strong>${c.merchant.fssaiLabel}:</strong> ${c.merchant.fssaiValue}`;
      mDivs[3].innerHTML = `<strong>${c.merchant.helplineLabel}:</strong> +91 92365 87600 | <strong>${c.merchant.emailLabel}:</strong> satvikswaad.care@gmail.com`;
      mDivs[4].innerHTML = `<strong>${c.merchant.gatewayLabel}:</strong> ${c.merchant.gatewayValue}`;
      mDivs[5].innerHTML = `<strong>${c.merchant.redressalLabel}:</strong> ${c.merchant.redressalValue}`;
    }
  }

  const securityCard = document.querySelector('.pd-security-notice-card');
  if (securityCard && c.guarantee) {
    const sTitle = securityCard.querySelector('h4');
    if (sTitle) sTitle.textContent = c.guarantee.title;
    const sDesc = securityCard.querySelector('p');
    if (sDesc) sDesc.innerHTML = `<strong>${c.guarantee.spamPolicyLabel}:</strong> ${c.guarantee.spamPolicyText}`;
  }

  const formTitle = document.querySelector('.contact-form-area .script-title');
  if (formTitle) formTitle.textContent = c.formTitle;
  const formSub = document.querySelector('.contact-subtitle');
  if (formSub) formSub.textContent = c.formSubtitle;

  const formFields = document.querySelectorAll('.contact-form-block .form-field');
  formFields.forEach(field => {
    const input = field.querySelector('input, select, textarea');
    const label = field.querySelector('.field-label');
    if (!input || !label) return;

    if (input.id === 'contact-name') {
      label.innerHTML = `${c.labels.name} <span class="required">*</span>`;
      input.placeholder = c.placeholders.name;
    } else if (input.id === 'contact-email') {
      label.innerHTML = `${c.labels.email} <span class="required">*</span>`;
      input.placeholder = c.placeholders.email;
    } else if (input.id === 'contact-phone') {
      label.innerHTML = `${c.labels.phone} <span class="required">*</span>`;
      input.placeholder = c.placeholders.phone;
    } else if (input.id === 'contact-order-id') {
      label.innerHTML = `${c.labels.orderId}`;
      input.placeholder = c.placeholders.orderId;
    } else if (input.id === 'contact-subject') {
      label.innerHTML = `${c.labels.subject} <span class="required">*</span>`;
      const opts = input.querySelectorAll('option');
      if (opts.length >= 6) {
        opts[0].textContent = c.subjectOptions.default;
        opts[1].textContent = c.subjectOptions.general;
        opts[2].textContent = c.subjectOptions.order;
        opts[3].textContent = c.subjectOptions.bulk;
        opts[4].textContent = c.subjectOptions.feedback;
        opts[5].textContent = c.subjectOptions.partnership;
      }
    } else if (input.id === 'contact-message') {
      label.innerHTML = `${c.labels.message} <span class="required">*</span>`;
      input.placeholder = c.placeholders.message;
    }
  });

  const btnSubmit = document.getElementById('btn-submit-contact');
  if (btnSubmit) {
    const svg = btnSubmit.querySelector('svg');
    btnSubmit.innerHTML = '';
    if (svg) btnSubmit.appendChild(svg);
    btnSubmit.appendChild(document.createTextNode(' ' + c.btnSubmit));
  }

  const successMsg = document.getElementById('contact-success-msg');
  if (successMsg) successMsg.textContent = c.successMsg;

  const polaroidCap = document.querySelector('.polaroid-card .polaroid-caption .brush-underline');
  if (polaroidCap) polaroidCap.textContent = c.polaroidCaption;

  const doodleLines = document.querySelectorAll('.polaroid-column .doodle-text-lines .doodle-text');
  if (doodleLines.length >= 4 && Array.isArray(c.doodleLines)) {
    doodleLines.forEach((s, idx) => {
      if (c.doodleLines[idx]) s.textContent = c.doodleLines[idx];
    });
  }

  const vkBadge = document.querySelector('.village-kitchen-badge');
  if (vkBadge) vkBadge.textContent = c.villageKitchen.badge;
  const vkTitle = document.querySelector('.village-kitchen-title');
  if (vkTitle) vkTitle.textContent = c.villageKitchen.title;
  const vkText = document.querySelector('.village-kitchen-text');
  if (vkText) vkText.textContent = c.villageKitchen.desc;
  const vkWa = document.querySelector('.village-kitchen-wa-btn span:last-child');
  if (vkWa) vkWa.textContent = c.villageKitchen.waBtn;
}

export function translateFaqPage(dict, activeLang) {
  if (!dict.faq) return;
  const f = dict.faq;

  const titleTop = document.querySelector('.hero-banner-section .hero-title .title-top');
  if (titleTop && (window.location.pathname.includes('faq') || document.querySelector('.faq-layout'))) {
    titleTop.textContent = f.heroTop;
  }
  const titleScript = document.querySelector('.hero-banner-section .hero-title .title-script-wrapper .brush-underline');
  if (titleScript && (window.location.pathname.includes('faq') || document.querySelector('.faq-layout'))) {
    titleScript.textContent = f.heroScript;
  }
  const heroSub = document.querySelector('.hero-banner-section .hero-subtitle .brush-underline');
  if (heroSub && (window.location.pathname.includes('faq') || document.querySelector('.faq-layout'))) {
    heroSub.textContent = f.heroSubtitle;
  }
  const heroNote = document.querySelector('.hero-banner-section .hero-paper-note p');
  if (heroNote && (window.location.pathname.includes('faq') || document.querySelector('.faq-layout'))) {
    heroNote.textContent = f.note;
  }

  const breadcrumbCurrent = document.querySelector('.breadcrumb-inner .current');
  if (breadcrumbCurrent && (window.location.pathname.includes('faq') || document.querySelector('.faq-layout'))) {
    breadcrumbCurrent.textContent = f.breadcrumb;
  }

  const catBtns = document.querySelectorAll('.faq-sidebar .category-btn');
  catBtns.forEach(btn => {
    const target = btn.getAttribute('data-target') || '';
    const label = btn.querySelector('.cat-label');
    if (!label) return;
    if (target.includes('general')) label.textContent = f.categories.general;
    else if (target.includes('orders')) label.textContent = f.categories.orders;
    else if (target.includes('products')) label.textContent = f.categories.products;
    else if (target.includes('payments')) label.textContent = f.categories.payments;
    else if (target.includes('account')) label.textContent = f.categories.account;
    else if (target.includes('others')) label.textContent = f.categories.others;
  });

  const sidebarGuarantee = document.querySelector('.faq-sidebar-guarantee');
  if (sidebarGuarantee) {
    const sTitle = sidebarGuarantee.querySelector('strong');
    if (sTitle) sTitle.textContent = f.guaranteeTitle;
    const sText = sidebarGuarantee.querySelector('p');
    if (sText) sText.innerHTML = `<strong>${f.guaranteeTitle}:</strong> ${f.guaranteeText}`;
  }

  const accTitle = document.querySelector('.faq-accordion-area .script-title');
  if (accTitle) accTitle.textContent = f.sectionTitle;
  const accSub = document.querySelector('.faq-accordion-subtitle');
  if (accSub) accSub.textContent = f.sectionSubtitle;

  const searchInput = document.getElementById('faq-search-input');
  if (searchInput) searchInput.placeholder = f.searchPlaceholder;

  if (f.items) {
    const catKeys = ['general', 'orders', 'products', 'payments', 'account', 'others'];
    catKeys.forEach(cat => {
      const container = document.getElementById(`cat-${cat}`);
      if (!container || !f.items[cat]) return;
      const faqItems = container.querySelectorAll('.faq-item');
      faqItems.forEach((item, idx) => {
        const data = f.items[cat][idx];
        if (!data) return;
        const summary = item.querySelector('.faq-summary');
        const content = item.querySelector('.faq-content');
        if (summary) {
          const chevron = summary.querySelector('.chevron');
          summary.innerHTML = '';
          summary.appendChild(document.createTextNode(data.q + ' '));
          if (chevron) summary.appendChild(chevron);
        }
        if (content) {
          content.innerHTML = data.a;
        }
      });
    });
  }

  const polaroidCap = document.querySelector('.faq-layout .polaroid-card .polaroid-caption .brush-underline');
  if (polaroidCap) polaroidCap.textContent = dict.contact?.polaroidCaption || "Maa ke swaad ki virasat";
}

export function translateReviewsPage(dict, activeLang) {
  if (!dict.reviews) return;
  const r = dict.reviews;

  const heroTop = document.querySelector('.hero-title-top');
  if (heroTop && (window.location.pathname.includes('reviews') || document.querySelector('.reviews-content-section'))) {
    heroTop.textContent = r.heroTop;
  }
  const heroScript = document.querySelector('.hero-title-script .brush-underline');
  if (heroScript && (window.location.pathname.includes('reviews') || document.querySelector('.reviews-content-section'))) {
    heroScript.textContent = r.heroScript;
  }
  const heroSub = document.querySelector('.hero-banner-section .hero-subtitle .brush-underline');
  if (heroSub && (window.location.pathname.includes('reviews') || document.querySelector('.reviews-content-section'))) {
    heroSub.textContent = r.heroSubtitle;
  }

  const heroDoodle = document.querySelectorAll('.hero-right-doodle span.block');
  if (heroDoodle.length >= 3) {
    const parts = r.doodleGoodness.split(' ');
    heroDoodle.forEach((s, idx) => {
      if (parts[idx]) s.textContent = parts[idx];
    });
  }

  const breadcrumbCurrent = document.querySelector('.breadcrumb-inner .current');
  if (breadcrumbCurrent && (window.location.pathname.includes('reviews') || document.querySelector('.reviews-content-section'))) {
    breadcrumbCurrent.textContent = r.breadcrumb;
  }

  const secTitle = document.querySelector('.reviews-content-section .script-title-wrapper h2');
  if (secTitle) secTitle.textContent = r.sectionTitle;
  const secSub = document.querySelector('.reviews-content-section .text-center > p');
  if (secSub) secSub.textContent = r.sectionSubtitle;

  const marginDoodles = document.querySelectorAll('.reviews-content-section .pointer-events-none .text-handwrite');
  if (marginDoodles.length >= 3 && Array.isArray(r.marginDoodle)) {
    marginDoodles.forEach((el, idx) => {
      if (r.marginDoodle[idx]) el.textContent = r.marginDoodle[idx];
    });
  }
  const paperNote = document.querySelector('.reviews-content-section .paper-note-text');
  if (paperNote) paperNote.textContent = r.trustNote;

  const sumRating = document.querySelector('.reviews-summary-score');
  if (sumRating) sumRating.textContent = r.summary.rating;
  const sumCount = document.querySelector('.reviews-summary-count');
  if (sumCount) sumCount.textContent = r.summary.countText;

  const starLabels = document.querySelectorAll('.review-star-bar-label');
  if (starLabels.length >= 5) {
    starLabels[0].textContent = r.summary.starsBreakdown.star5;
    starLabels[1].textContent = r.summary.starsBreakdown.star4;
    starLabels[2].textContent = r.summary.starsBreakdown.star3;
    starLabels[3].textContent = r.summary.starsBreakdown.star2;
    starLabels[4].textContent = r.summary.starsBreakdown.star1;
  }

  const reviewFilterTabs = document.querySelectorAll('.review-filter-btn');
  reviewFilterTabs.forEach(tab => {
    const filter = tab.getAttribute('data-filter') || '';
    if (filter === 'all') tab.textContent = r.filterTabs.all;
    else if (filter === 'achar') tab.textContent = r.filterTabs.achar;
    else if (filter === 'sweets') tab.textContent = r.filterTabs.sweets;
    else if (filter === 'murabba') tab.textContent = r.filterTabs.murabba;
  });

  const btnWrite = document.querySelector('.btn-write-review-toggle');
  if (btnWrite) btnWrite.textContent = r.btnWriteReview;

  const formBox = document.querySelector('.write-review-box');
  if (formBox && r.form) {
    const fTitle = formBox.querySelector('.form-title');
    if (fTitle) fTitle.textContent = r.form.title;
    const fSub = formBox.querySelector('.form-subtitle');
    if (fSub) fSub.textContent = r.form.subtitle;

    const nameLbl = formBox.querySelector('label[for="rev-name"]');
    if (nameLbl) nameLbl.textContent = r.form.nameLabel;
    const nameInp = formBox.querySelector('#rev-name');
    if (nameInp) nameInp.placeholder = r.form.namePlaceholder;

    const prodLbl = formBox.querySelector('label[for="rev-prod"]');
    if (prodLbl) prodLbl.textContent = r.form.productLabel;

    const rateLbl = formBox.querySelector('.form-rating-label');
    if (rateLbl) rateLbl.textContent = r.form.ratingLabel;

    const commentLbl = formBox.querySelector('label[for="rev-comment"]');
    if (commentLbl) commentLbl.textContent = r.form.commentLabel;
    const commentInp = formBox.querySelector('#rev-comment');
    if (commentInp) commentInp.placeholder = r.form.commentPlaceholder;

    const btnSubRev = formBox.querySelector('.btn-submit-review');
    if (btnSubRev) btnSubRev.textContent = r.form.btnSubmit;
  }

  const cards = document.querySelectorAll('.reviews-grid .review-card');
  cards.forEach((card, idx) => {
    const data = r.staticCards[idx];
    if (!data) return;
    const quote = card.querySelector('p.italic, p.font-script');
    if (quote) quote.textContent = data.quote;
    const author = card.querySelector('.font-bold.text-brand-green-text, .review-author-name');
    if (author) author.textContent = data.name;
    const prod = card.querySelector('.text-sm.font-semibold.text-brand-ink');
    if (prod) prod.textContent = data.product;
    const badge = card.querySelector('.text-brand-green, .verified-badge');
    if (badge) badge.textContent = data.verified;
  });

  const btnMore = document.querySelector('.reviews-content-section .brand-button.gold');
  if (btnMore) {
    btnMore.innerHTML = `${r.btnViewMore} <span class="arrow ml-2">→</span>`;
  }

  const loadingP = document.querySelector('#public-reviews-container p');
  if (loadingP) loadingP.textContent = r.loadingText;
}

export function translateCartPage(dict, activeLang) {
  if (!dict.cartPage) return;
  const cp = dict.cartPage;

  const headerTitle = document.querySelector('.cart-header-title, .cart-title, .cart-view-header h1, .cart-page-header h1, #main-content h1 span:first-child');
  if (headerTitle) headerTitle.textContent = cp.title;

  const backBtn = document.querySelector('#cart-back-shop, .cart-back-btn, #main-content a[href="products.html"], #main-content a[href*="products.html"]');
  if (backBtn) backBtn.textContent = cp.backToShop.startsWith('←') ? cp.backToShop : `← ${cp.backToShop}`;

  const clearBtn = document.getElementById('btn-clear-cart-all');
  if (clearBtn) clearBtn.textContent = cp.clearBtn;

  const purityNotice = document.querySelector('.cart-purity-notice span:last-child, #main-content div[style*="#F4F8F3"] span:last-child');
  if (purityNotice) purityNotice.textContent = cp.purityNotice;

  if (typeof window !== 'undefined' && typeof window.renderCartPage === 'function') {
    window.renderCartPage();
  }
}

export function translateProfilePage(dict, activeLang) {
  if (!dict.profile) return;
  const p = dict.profile;

  const navProfile = document.querySelector('#nav-btn-profile span:last-child');
  if (navProfile) navProfile.textContent = p.sidebar.myProfile;

  const navOrders = document.querySelector('#nav-btn-orders > span:nth-child(2)');
  if (navOrders) navOrders.textContent = p.sidebar.myOrders;

  const navAddresses = document.querySelector('#nav-btn-addresses span:last-child');
  if (navAddresses) navAddresses.textContent = p.sidebar.myAddresses;

  const navWishlist = document.querySelector('#nav-btn-wishlist > span:nth-child(2)');
  if (navWishlist) navWishlist.textContent = p.sidebar.wishlist;

  const navSettings = document.querySelector('#nav-btn-settings span:last-child');
  if (navSettings) navSettings.textContent = p.sidebar.settings;

  const btnSignIn = document.querySelector('#btn-google-signin span:last-child');
  if (btnSignIn) btnSignIn.textContent = p.sidebar.signIn;

  const btnSignOut = document.querySelector('#btn-google-signout span:last-child');
  if (btnSignOut) btnSignOut.textContent = p.sidebar.signOut;

  const googleBadge = document.getElementById('google-badge-text');
  if (googleBadge) googleBadge.textContent = p.sidebar.googleAccount;

  const sidebarDoodle = document.querySelector('.profile-sidebar-doodle-text');
  if (sidebarDoodle) sidebarDoodle.innerHTML = p.sidebar.doodleText.replace(' ↴ ♡', '<br><span>Happy You ↴ ♡</span>');

  const profCardTitle = document.querySelector('#tab-panel-profile .profile-card:first-child .profile-card-title');
  if (profCardTitle) profCardTitle.textContent = `🌿 ${p.personalInfo.title}`;

  const btnEditText = document.getElementById('btn-edit-text');
  if (btnEditText) btnEditText.textContent = p.personalInfo.editBtn;

  const viewLabels = document.querySelectorAll('#profile-info-view .profile-info-label');
  if (viewLabels.length >= 4) {
    viewLabels[0].textContent = p.personalInfo.nameLabel;
    viewLabels[1].textContent = p.personalInfo.emailLabel;
    viewLabels[2].textContent = p.personalInfo.phoneLabel;
    viewLabels[3].textContent = p.personalInfo.joinedLabel;
  }

  const formLabels = document.querySelectorAll('#form-profile-details .profile-input-label');
  if (formLabels.length >= 4) {
    formLabels[0].textContent = p.personalInfo.fullNameLabel;
    formLabels[1].textContent = p.personalInfo.emailLabel;
    formLabels[2].textContent = p.personalInfo.phoneLabel;
    formLabels[3].textContent = p.personalInfo.joinedLabel;
  }

  const inpName = document.getElementById('prof-name');
  if (inpName) inpName.placeholder = p.personalInfo.placeholders.name;
  const inpEmail = document.getElementById('prof-email');
  if (inpEmail) inpEmail.placeholder = p.personalInfo.placeholders.email;
  const inpPhone = document.getElementById('prof-phone');
  if (inpPhone) inpPhone.placeholder = p.personalInfo.placeholders.phone;

  const btnCancelEdit = document.getElementById('btn-cancel-edit-profile');
  if (btnCancelEdit) btnCancelEdit.textContent = p.personalInfo.cancelBtn;

  const btnSaveEdit = document.querySelector('#form-profile-details button[type="submit"]');
  if (btnSaveEdit) btnSaveEdit.textContent = p.personalInfo.saveBtn;

  const infoDoodle = document.querySelector('.profile-info-doodle-text');
  if (infoDoodle) infoDoodle.textContent = p.personalInfo.doodleText;

  const addrSumTitle = document.querySelector('#tab-panel-profile .profile-card:nth-child(2) .profile-card-title');
  if (addrSumTitle) addrSumTitle.textContent = `📍 ${p.addresses.summaryTitle}`;

  const btnAddAddrSum = document.getElementById('btn-add-address-profile');
  if (btnAddAddrSum) btnAddAddrSum.textContent = p.addresses.addBtn;

  const orderSumTitle = document.querySelector('#tab-panel-profile .profile-card:nth-child(3) .profile-card-title');
  if (orderSumTitle) orderSumTitle.textContent = `📦 ${p.orders.summaryTitle}`;

  const btnViewAllOrders = document.getElementById('link-view-all-orders');
  if (btnViewAllOrders) btnViewAllOrders.textContent = p.orders.viewAllBtn;

  const ordersFullTitle = document.querySelector('#tab-panel-orders .profile-card-title');
  if (ordersFullTitle) ordersFullTitle.textContent = `📦 ${p.orders.fullTitle}`;
  const ordersFullSub = document.querySelector('#tab-panel-orders .profile-card-header p');
  if (ordersFullSub) ordersFullSub.textContent = p.orders.fullSubtitle;

  const filterPills = document.querySelectorAll('.orders-filter-bar .filter-pill-btn');
  filterPills.forEach(pill => {
    const f = pill.getAttribute('data-order-filter');
    if (f === 'all') pill.textContent = p.orders.filters.all;
    else if (f === 'delivered') pill.textContent = p.orders.filters.delivered;
    else if (f === 'transit') pill.textContent = p.orders.filters.transit;
    else if (f === 'processing') pill.textContent = p.orders.filters.processing;
  });

  const addrFullTitle = document.querySelector('#tab-panel-addresses .profile-card-title');
  if (addrFullTitle) addrFullTitle.textContent = `📍 ${p.addresses.fullTitle}`;
  const addrFullSub = document.querySelector('#tab-panel-addresses .profile-card-header p');
  if (addrFullSub) addrFullSub.textContent = p.addresses.fullSubtitle;
  const btnAddAddrFull = document.getElementById('btn-add-address-full');
  if (btnAddAddrFull) btnAddAddrFull.textContent = p.addresses.addBtn;

  const wishTitle = document.querySelector('#tab-panel-wishlist .profile-card-title');
  if (wishTitle) wishTitle.textContent = `♥ ${p.wishlist.title}`;
  const wishSub = document.querySelector('#tab-panel-wishlist .profile-card-header p');
  if (wishSub) wishSub.textContent = p.wishlist.subtitle;
  const btnMoveAll = document.getElementById('btn-move-all-cart');
  if (btnMoveAll) btnMoveAll.textContent = p.wishlist.addAllBtn;

  const wishEmptyTitle = document.querySelector('#wishlist-empty-state .profile-empty-title');
  if (wishEmptyTitle) wishEmptyTitle.textContent = p.wishlist.emptyTitle;
  const wishEmptyDesc = document.querySelector('#wishlist-empty-state .profile-empty-desc');
  if (wishEmptyDesc) wishEmptyDesc.textContent = p.wishlist.emptyDesc;
  const wishEmptyBrowse = document.querySelector('#wishlist-empty-state a.btn-profile-primary');
  if (wishEmptyBrowse) wishEmptyBrowse.textContent = p.wishlist.browseBtn;

  const setCardTitle = document.querySelector('#tab-panel-settings .profile-card-title');
  if (setCardTitle) setCardTitle.textContent = `⚙ ${p.settings.title}`;
  const setCardSub = document.querySelector('#tab-panel-settings .profile-card-header p');
  if (setCardSub) setCardSub.textContent = p.settings.subtitle;

  const setHeadings = document.querySelectorAll('#form-user-settings h3');
  if (setHeadings.length >= 4) {
    setHeadings[0].textContent = p.settings.notifyTitle;
    setHeadings[1].textContent = p.settings.langRegTitle;
    setHeadings[2].textContent = p.settings.deliveryNoteTitle;
    setHeadings[3].textContent = p.settings.dataBackupTitle;
  }

  const setTitles = document.querySelectorAll('#form-user-settings .settings-toggle-title');
  const setDescs = document.querySelectorAll('#form-user-settings .settings-toggle-desc');
  if (setTitles.length >= 4 && setDescs.length >= 4) {
    setTitles[0].textContent = p.settings.waTitle;
    setDescs[0].textContent = p.settings.waDesc;

    setTitles[1].textContent = p.settings.smsTitle;
    setDescs[1].textContent = p.settings.smsDesc;

    setTitles[2].textContent = p.settings.emailTitle;
    setDescs[2].textContent = p.settings.emailDesc;

    setTitles[3].textContent = p.settings.cacheTitle;
    setDescs[3].textContent = p.settings.cacheDesc;
  }

  const lblLang = document.querySelector('label[for="setting-language"]');
  if (lblLang) lblLang.textContent = p.settings.interfaceLangLabel;
  const lblCurr = document.querySelector('label[for="setting-currency"]');
  if (lblCurr) lblCurr.textContent = p.settings.currencyLabel;
  const lblDelivNote = document.querySelector('label[for="setting-delivery-note"]');
  if (lblDelivNote) lblDelivNote.textContent = p.settings.specialInstructionsLabel;
  const inpDelivNote = document.getElementById('setting-delivery-note');
  if (inpDelivNote) inpDelivNote.placeholder = p.settings.deliveryPlaceholder;

  const btnClearCache = document.getElementById('btn-clear-cache');
  if (btnClearCache) btnClearCache.textContent = p.settings.clearCacheBtn;
  const btnSavePrefs = document.querySelector('#form-user-settings button[type="submit"]');
  if (btnSavePrefs) btnSavePrefs.textContent = p.settings.savePrefsBtn;

  const selectLang = document.getElementById('setting-language');
  if (selectLang) {
    selectLang.value = activeLang;
  }

  const modalOrderTitle = document.getElementById('modal-order-title');
  if (modalOrderTitle) modalOrderTitle.textContent = p.orderModal.title;
}

export function translatePolicyPages(dict, activeLang) {
  if (!dict.policies) return;
  const pol = dict.policies;

  const navTabs = document.querySelectorAll('.policy-nav-tabs-wrapper .policy-nav-tab');
  navTabs.forEach(tab => {
    const href = tab.getAttribute('href') || '';
    if (href.includes('privacy')) tab.textContent = pol.navTabs.privacy;
    else if (href.includes('terms')) tab.textContent = pol.navTabs.terms;
    else if (href.includes('shipping')) tab.textContent = pol.navTabs.shipping;
    else if (href.includes('cancellation')) tab.textContent = pol.navTabs.refund;
    else if (href.includes('cookies')) tab.textContent = pol.navTabs.cookies;
    else if (href.includes('contact')) tab.textContent = pol.navTabs.contact;
  });

  const path = typeof window !== 'undefined' ? (window.location.pathname || '').toLowerCase() : '';

  // Breadcrumbs
  const breadcrumbCurrent = document.querySelector('.breadcrumb-inner .current');
  if (breadcrumbCurrent) {
    if (path.includes('cancellation-refund') || breadcrumbCurrent.textContent.includes('Cancellation') || breadcrumbCurrent.textContent.includes('रद्दीकरण') || breadcrumbCurrent.textContent.includes('منسوخی')) {
      breadcrumbCurrent.textContent = pol.cancellationRefund.title;
    } else if (path.includes('shipping-delivery') || breadcrumbCurrent.textContent.includes('Shipping') || breadcrumbCurrent.textContent.includes('शिपिंग') || breadcrumbCurrent.textContent.includes('شپنگ')) {
      breadcrumbCurrent.textContent = pol.shippingDelivery.title;
    } else if (path.includes('privacy-policy') || breadcrumbCurrent.textContent.includes('Privacy') || breadcrumbCurrent.textContent.includes('गोपनीयता') || breadcrumbCurrent.textContent.includes('پرائیویسی')) {
      breadcrumbCurrent.textContent = pol.privacyPolicy.title;
    } else if (path.includes('terms-and-conditions') || breadcrumbCurrent.textContent.includes('Terms') || breadcrumbCurrent.textContent.includes('नियम') || breadcrumbCurrent.textContent.includes('شرائط')) {
      breadcrumbCurrent.textContent = pol.termsConditions.title;
    } else if (path.includes('cookies-policy') || breadcrumbCurrent.textContent.includes('Cookies') || breadcrumbCurrent.textContent.includes('कुकीज') || breadcrumbCurrent.textContent.includes('کوکیز')) {
      breadcrumbCurrent.textContent = pol.cookiesPolicy.title;
    }
  }

  // Sidebar WhatsApp help card
  const helpTitle = document.querySelector('.policy-toc-help-title');
  if (helpTitle) helpTitle.textContent = (activeLang === 'hi') ? 'तुरंत सहायता चाहिए?' : (activeLang === 'ur') ? 'فوری مدد کی ضرورت ہے؟' : 'Need Immediate Help?';
  const helpDesc = document.querySelector('.policy-toc-help-desc');
  if (helpDesc) helpDesc.textContent = (activeLang === 'hi') ? 'त्वरित समाधान के लिए सीधे व्हाट्सएप पर हमारी टीम से संपर्क करें।' : (activeLang === 'ur') ? 'فوری حل کے لیے واٹس ایپ پر ہماری فیملی ٹیم سے رابطہ کریں۔' : 'Connect directly with our family team on WhatsApp for quick resolutions.';
  const helpBtn = document.querySelector('.policy-btn-whatsapp span');
  if (helpBtn) helpBtn.textContent = (activeLang === 'hi') ? '💬 व्हाट्सएप पर चैट करें' : (activeLang === 'ur') ? '💬 واٹس ایپ پر چیٹ کریں' : '💬 Chat on WhatsApp';

  // Sidebar Zero Spam / Guarantee Box
  const zeroSpamBoxes = document.querySelectorAll('aside div[style*="#F0FDF4"], div[style*="#F0FDF4"], .privacy-guarantee-card, .pd-security-notice-card');
  zeroSpamBoxes.forEach(box => {
    const titleEl = box.querySelector('p strong, h3, h4');
    if (titleEl && (titleEl.textContent.includes('Zero-Spam') || titleEl.textContent.includes('Direct & Secure') || titleEl.textContent.includes('Communication Guarantee') || titleEl.textContent.includes('शून्य-स्पैम') || titleEl.textContent.includes('प्रत्यक्ष व सुरक्षित'))) {
      if (box.querySelector('h3, h4')) {
        box.querySelector('h3, h4').textContent = (activeLang === 'hi') ? 'प्रत्यक्ष व सुरक्षित संवाद गारंटी' : (activeLang === 'ur') ? 'براہ راست اور محفوظ مواصلاتی گارنٹی' : 'Direct & Secure Communication Guarantee';
      }
    }
  });

  // CANCELLATION & REFUND POLICY
  if (path.includes('cancellation-refund') || document.querySelector('.policy-page-title')?.textContent.includes('Cancellation') || document.querySelector('.policy-page-title')?.textContent.includes('रद्दीकरण') || document.querySelector('.policy-page-title')?.textContent.includes('منسوخی')) {
    const cr = pol.cancellationRefund;
    const badge = document.querySelector('.policy-badge-pill span');
    if (badge) badge.textContent = cr.badge;
    const title = document.querySelector('.policy-page-title');
    if (title) title.textContent = cr.title;
    const sub = document.querySelector('.policy-page-subtitle');
    if (sub) sub.textContent = cr.subtitle;

    const metaSpans = document.querySelectorAll('.policy-meta-row span');
    if (metaSpans.length >= 5) {
      metaSpans[0].innerHTML = `<strong>${cr.meta.effectiveDate.split(':')[0]}:</strong> ${cr.meta.effectiveDate.split(':')[1]}`;
      metaSpans[2].innerHTML = `<strong>${cr.meta.lastUpdated.split(':')[0]}:</strong> ${cr.meta.lastUpdated.split(':')[1]}`;
      metaSpans[4].innerHTML = `<strong>${cr.meta.scope.split(':')[0]}:</strong> ${cr.meta.scope.split(':')[1]}`;
    }

    const hlCards = document.querySelectorAll('.policy-highlights-grid .policy-highlight-card');
    if (hlCards.length >= 3) {
      const h0 = hlCards[0].querySelector('.policy-highlight-title');
      if (h0) h0.textContent = cr.highlight1Title;
      const d0 = hlCards[0].querySelector('.policy-highlight-desc');
      if (d0) d0.innerHTML = cr.highlight1Desc;

      const h1 = hlCards[1].querySelector('.policy-highlight-title');
      if (h1) h1.textContent = cr.highlight2Title;
      const d1 = hlCards[1].querySelector('.policy-highlight-desc');
      if (d1) d1.innerHTML = cr.highlight2Desc;

      const h2 = hlCards[2].querySelector('.policy-highlight-title');
      if (h2) h2.textContent = cr.highlight3Title;
      const d2 = hlCards[2].querySelector('.policy-highlight-desc');
      if (d2) d2.innerHTML = cr.highlight3Desc;
    }

    const tocTitle = document.querySelector('.policy-toc-title');
    if (tocTitle) tocTitle.textContent = cr.tocTitle;
    const tocCount = document.querySelector('.policy-toc-badge, .policy-toc-count');
    if (tocCount) tocCount.textContent = cr.tocCount;

    // TOC Links
    const tocLinks = document.querySelectorAll('.policy-toc-nav .policy-toc-link span:last-child');
    const tocLinkTexts = (activeLang === 'hi') ? [
      "100% निःशुल्क प्रतिस्थापन",
      "डिस्पैच से पूर्व रद्दीकरण",
      "खाद्य सुरक्षा व गैर-वापसी",
      "गलत / छूटे हुए जार",
      "भुगतान सुरक्षा व रिफंड",
      "प्रत्यक्ष ग्राहक सहायता"
    ] : (activeLang === 'ur') ? [
      "100% مفت تبدیلی",
      "ڈسپیچ سے پہلے منسوخی",
      "خوراک کی حفاظت اور عدم واپسی",
      "غلط یا گمشدہ جار",
      "ادائیگی کی حفاظت اور ریفنڈ",
      "کسٹمر سپورٹ"
    ] : [
      "100% Free Replacement",
      "Pre-Dispatch Cancellation",
      "Food Safety & Non-Return",
      "Incorrect / Missing Jars",
      "Payment Security & Reversals",
      "Direct Customer Care"
    ];
    tocLinks.forEach((l, idx) => {
      if (tocLinkTexts[idx]) l.textContent = tocLinkTexts[idx];
    });

    // Clause Titles
    const clauseTitles = document.querySelectorAll('.policy-clause .policy-clause-title');
    const clauseTexts = (activeLang === 'hi') ? [
      "कांच के जार के पारगमन नुकसान के लिए 100% निःशुल्क प्रतिस्थापन गारंटी",
      "डिस्पैच से पूर्व ऑर्डर रद्दीकरण व पूर्ण रिफंड",
      "उपभोज्य खाद्य स्वच्छता व गैर-वापसी नीति",
      "गलत, छूटे हुए या सीलबंद पैकेजिंग विसंगतियां",
      "पेमेंट गेटवे सुरक्षा व रिफंड समय-सीमा",
      "प्रत्यक्ष शिकायत निवारण व ग्राहक सेवा"
    ] : (activeLang === 'ur') ? [
      "شیشے کے جار کے ٹرانزٹ نقصان کے لیے 100% مفت تبدیلی کی گارنٹی",
      "ڈسپیچ سے پہلے آرڈر کی منسوخی اور مکمل رقم کی واپسی",
      "کھانے پینے کی اشیاء کی حفظان صحت اور غیر واپسی کی پالیسی",
      "غلط، گمشدہ یا سیل بند پیکیجنگ کا فرق",
      "ادائیگی کے گیٹ وے کی حفاظت اور ریفنڈ کا وقت",
      "براہ راست شکایات کا ازالہ اور کسٹمر کیئر"
    ] : [
      "100% Free Replacement Guarantee for Glass-Jar Transit Damage",
      "Pre-Dispatch Order Cancellations & Full Refund",
      "Consumable Homemade Food Hygiene & Non-Return Policy",
      "Incorrect, Missing, or Sealed Packaging Discrepancies",
      "Payment Gateway Security & Reversal Timelines",
      "Direct Grievance Redressal & Customer Care"
    ];
    clauseTitles.forEach((t, idx) => {
      if (clauseTexts[idx]) t.textContent = clauseTexts[idx];
    });
  }

  // SHIPPING & DELIVERY POLICY
  if (path.includes('shipping-delivery') || document.querySelector('.policy-page-title')?.textContent.includes('Shipping') || document.querySelector('.policy-page-title')?.textContent.includes('शिपिंग') || document.querySelector('.policy-page-title')?.textContent.includes('شپنگ')) {
    const sd = pol.shippingDelivery;
    const badge = document.querySelector('.policy-badge-pill span');
    if (badge) badge.textContent = sd.badge;
    const title = document.querySelector('.policy-page-title');
    if (title) title.textContent = sd.title;
    const sub = document.querySelector('.policy-page-subtitle');
    if (sub) sub.textContent = sd.subtitle;

    const metaSpans = document.querySelectorAll('.policy-meta-row span');
    if (metaSpans.length >= 5) {
      metaSpans[0].innerHTML = `<strong>${sd.meta.effectiveDate.split(':')[0]}:</strong> ${sd.meta.effectiveDate.split(':')[1]}`;
      metaSpans[2].innerHTML = `<strong>${sd.meta.dispatchWindow.split(':')[0]}:</strong> ${sd.meta.dispatchWindow.split(':')[1]}`;
      metaSpans[4].innerHTML = `<strong>${sd.meta.coverage.split(':')[0]}:</strong> ${sd.meta.coverage.split(':')[1]}`;
    }

    const hlCards = document.querySelectorAll('.policy-highlights-grid .policy-highlight-card');
    if (hlCards.length >= 3) {
      const h0 = hlCards[0].querySelector('.policy-highlight-title');
      if (h0) h0.textContent = sd.highlight1Title;
      const d0 = hlCards[0].querySelector('.policy-highlight-desc');
      if (d0) d0.innerHTML = sd.highlight1Desc;

      const h1 = hlCards[1].querySelector('.policy-highlight-title');
      if (h1) h1.textContent = sd.highlight2Title;
      const d1 = hlCards[1].querySelector('.policy-highlight-desc');
      if (d1) d1.innerHTML = sd.highlight2Desc;

      const h2 = hlCards[2].querySelector('.policy-highlight-title');
      if (h2) h2.textContent = sd.highlight3Title;
      const d2 = hlCards[2].querySelector('.policy-highlight-desc');
      if (d2) d2.innerHTML = sd.highlight3Desc;
    }

    const clauseTitles = document.querySelectorAll('.policy-clause .policy-clause-title');
    const clauseTexts = (activeLang === 'hi') ? [
      "ताजा छोटे बैच का डिस्पैच व अखिल भारतीय समय-सीमा",
      "100% निःशुल्क शिपिंग व पारदर्शी दरें",
      "5-स्तरीय कांच सुरक्षा व सुरक्षित आगमन गारंटी",
      "प्रत्यक्ष, निजी व्हाट्सएप डिलीवरी अपडेट (शून्य स्पैम)",
      "पते के दिशानिर्देश व असफल डिलीवरी सुरक्षा"
    ] : (activeLang === 'ur') ? [
      "تازہ چھوٹے بیچ کی ترسیل اور پورے بھارت کا ٹائم فریم",
      "100% مفت شپنگ اور شفاف قیمتیں",
      "5 تہوں پر مشتمل شیشے کی حفاظت اور محفوظ پہنچنے کی ضمانت",
      "براہ راست اور نجی واٹس ایپ ترسیلی اطلاعات (بغیر کسی اسپام)",
      "پتے کی ہدایات اور عدم ترسیل سے حفاظت"
    ] : [
      "Fresh Small-Batch Dispatch & Pan-India Timelines",
      "100% Free Shipping & Transparent Rates",
      "5-Layer Glass Protection & Safe Arrival Guarantee",
      "Direct, Private WhatsApp Delivery Updates (Zero Spam)",
      "Address Guidelines & Failed Delivery Protection"
    ];
    clauseTitles.forEach((t, idx) => {
      if (clauseTexts[idx]) t.textContent = clauseTexts[idx];
    });
  }

  // PRIVACY POLICY
  if (path.includes('privacy-policy') || document.querySelector('.policy-page-title')?.textContent.includes('Privacy') || document.querySelector('.policy-page-title')?.textContent.includes('गोपनीयता') || document.querySelector('.policy-page-title')?.textContent.includes('پرائیویسی')) {
    const pp = pol.privacyPolicy;
    const badge = document.querySelector('.policy-badge-pill span');
    if (badge) badge.textContent = pp.badge;
    const title = document.querySelector('.policy-page-title');
    if (title) title.textContent = pp.title;
    const sub = document.querySelector('.policy-page-subtitle');
    if (sub) sub.textContent = pp.subtitle;

    const metaSpans = document.querySelectorAll('.policy-meta-row span');
    if (metaSpans.length >= 5) {
      metaSpans[0].innerHTML = `<strong>${pp.meta.effectiveDate.split(':')[0]}:</strong> ${pp.meta.effectiveDate.split(':')[1]}`;
      metaSpans[2].innerHTML = `<strong>${pp.meta.scope.split(':')[0]}:</strong> ${pp.meta.scope.split(':')[1]}`;
      metaSpans[4].innerHTML = `<strong>${pp.meta.dataSelling.split(':')[0]}:</strong> ${pp.meta.dataSelling.split(':')[1]}`;
    }

    const pillarCards = document.querySelectorAll('.privacy-pillars-grid .pillar-card, .policy-highlights-grid .policy-highlight-card, div[style*="repeat(auto-fit, minmax(180px, 1fr))"] > div');
    if (pillarCards.length >= 5 && pp.pillars) {
      const pItems = [
        { t: pp.pillars.zeroSellingTitle, d: pp.pillars.zeroSellingDesc },
        { t: pp.pillars.sslTitle, d: pp.pillars.sslDesc },
        { t: pp.pillars.minimalDataTitle, d: pp.pillars.minimalDataDesc },
        { t: pp.pillars.rightsTitle, d: pp.pillars.rightsDesc },
        { t: pp.pillars.directCommTitle, d: pp.pillars.directCommDesc }
      ];
      pillarCards.forEach((c, idx) => {
        if (pItems[idx]) {
          const t = c.querySelector('.pillar-title, .policy-highlight-title') || c.querySelectorAll('div')[1];
          if (t) t.textContent = pItems[idx].t;
          const d = c.querySelector('.pillar-desc, .policy-highlight-desc') || c.querySelectorAll('div')[2];
          if (d) d.textContent = pItems[idx].d;
        }
      });
    }

    const guarCard = document.querySelector('.privacy-guarantee-card, .pd-security-notice-card, div[style*="#F0FDF4"]');
    if (guarCard) {
      const gt = guarCard.querySelector('h3, h4');
      if (gt) gt.textContent = pp.guaranteeTitle;
      const gp = guarCard.querySelector('p');
      if (gp) gp.textContent = pp.guaranteeText;
    }

    const clauseTitles = document.querySelectorAll('.policy-clause .policy-clause-title');
    const clauseTexts = (activeLang === 'hi') ? [
      "ऑर्डर विवरण व जानकारी जो हम एकत्र करते हैं",
      "हम आपके ऑर्डर डेटा का उपयोग कैसे करते हैं",
      "शून्य तृतीय-पक्ष डेटा बिक्री गारंटी",
      "भुगतान सुरक्षा व आरबीआई अनुपालन",
      "आपके खाता अधिकार व तत्काल डेटा विलोपन"
    ] : (activeLang === 'ur') ? [
      "آرڈر کی تفصیلات اور معلومات جو ہم جمع کرتے ہیں",
      "ہم آپ کے آرڈر کے ڈیٹا کو کیسے استعمال کرتے ہیں",
      "ڈیٹا تیسرے فریق کو نہ بیچنے کی ضمانت",
      "ادائیگی کی سیکیورٹی اور آر بی آئی کی تعمیل",
      "آپ کے اکاؤنٹ کے حقوق اور فوری ڈیٹا ڈیلیٹ کرنے کی سہولت"
    ] : [
      "Order Details & Information We Collect",
      "How We Use Your Order Data",
      "Zero Third-Party Data Selling Guarantee",
      "Payment Security & RBI Compliance",
      "Your Account Rights & Instant Data Deletion"
    ];
    clauseTitles.forEach((t, idx) => {
      if (clauseTexts[idx]) t.textContent = clauseTexts[idx];
    });
  }

  // TERMS & CONDITIONS
  if (path.includes('terms-and-conditions') || document.querySelector('.policy-page-title')?.textContent.includes('Terms') || document.querySelector('.policy-page-title')?.textContent.includes('नियम') || document.querySelector('.policy-page-title')?.textContent.includes('شرائط')) {
    const tc = pol.termsConditions;
    const badge = document.querySelector('.policy-badge-pill span');
    if (badge) badge.textContent = tc.badge;
    const title = document.querySelector('.policy-page-title');
    if (title) title.textContent = tc.title;
    const sub = document.querySelector('.policy-page-subtitle');
    if (sub) sub.textContent = tc.subtitle;

    const metaSpans = document.querySelectorAll('.policy-meta-row span');
    if (metaSpans.length >= 5) {
      metaSpans[0].innerHTML = `<strong>${tc.meta.effectiveDate.split(':')[0]}:</strong> ${tc.meta.effectiveDate.split(':')[1]}`;
      metaSpans[2].innerHTML = `<strong>${tc.meta.kitchen.split(':')[0]}:</strong> ${tc.meta.kitchen.split(':')[1]}`;
      metaSpans[4].innerHTML = `<strong>${tc.meta.transparency.split(':')[0]}:</strong> ${tc.meta.transparency.split(':')[1]}`;
    }

    const hlCards = document.querySelectorAll('.policy-highlights-grid .policy-highlight-card');
    if (hlCards.length >= 3) {
      const h0 = hlCards[0].querySelector('.policy-highlight-title');
      if (h0) h0.textContent = tc.highlight1Title;
      const d0 = hlCards[0].querySelector('.policy-highlight-desc');
      if (d0) d0.innerHTML = tc.highlight1Desc;

      const h1 = hlCards[1].querySelector('.policy-highlight-title');
      if (h1) h1.textContent = tc.highlight2Title;
      const d1 = hlCards[1].querySelector('.policy-highlight-desc');
      if (d1) d1.innerHTML = tc.highlight2Desc;

      const h2 = hlCards[2].querySelector('.policy-highlight-title');
      if (h2) h2.textContent = tc.highlight3Title;
      const d2 = hlCards[2].querySelector('.policy-highlight-desc');
      if (d2) d2.innerHTML = tc.highlight3Desc;
    }

    const pointTitles = document.querySelectorAll('.terms-point-title, .policy-clause-title');
    const pointTexts = (activeLang === 'hi') ? [
      "स्वागत व पारंपरिक खाद्य विरासत (माँ के स्वाद की विरासत)",
      "ऑर्डर, पारदर्शी मूल्य निर्धारण व माइक्रो-बैच उपलब्धता",
      "सुरक्षित कांच डिलीवरी व निःशुल्क प्रतिस्थापन वादा",
      "उचित उपयोग, सम्मानजनक संवाद व प्लेटफ़ॉर्म सत्यनिष्ठा",
      "सौहार्दपूर्ण विवाद समाधान, लागू कानून व क्षेत्राधिकार"
    ] : (activeLang === 'ur') ? [
      "خوش آمدید اور روایتی کھانوں کا ورثہ (ماں کے ہاتھ کا ذائقہ)",
      "آرڈرز، شفاف قیمتیں اور مائیکرو بیچ کی دستیابی",
      "شیشے کی محفوظ ترسیل اور مفت تبدیلی کا وعدہ",
      "منصفانہ استعمال، باہمی احترام اور پلیٹ فارم کی حفاظت",
      "دوستانہ حل، متعلقہ قانون اور دائرہ اختیار"
    ] : [
      "Welcome & Artisanal Food Heritage (Maa ke swaad ki virasat)",
      "Orders, Transparent Pricing & Micro-Batch Availability",
      "Safe Glass Delivery & Free Replacement Transit Promise",
      "Fair Usage, Respectful Communication & Platform Integrity",
      "Friendly Dispute Resolution, Governing Law & Jurisdiction"
    ];
    pointTitles.forEach((t, idx) => {
      if (pointTexts[idx]) t.textContent = pointTexts[idx];
    });
  }

  // COOKIES POLICY
  if (path.includes('cookies-policy') || document.querySelector('.policy-page-title')?.textContent.includes('Cookies') || document.querySelector('.policy-page-title')?.textContent.includes('कुकीज') || document.querySelector('.policy-page-title')?.textContent.includes('کوکیز')) {
    const ck = pol.cookiesPolicy;
    const badge = document.querySelector('.policy-badge-pill span');
    if (badge) badge.textContent = ck.badge;
    const title = document.querySelector('.policy-page-title');
    if (title) title.textContent = ck.title;
    const sub = document.querySelector('.policy-page-subtitle');
    if (sub) sub.textContent = ck.subtitle;

    const metaSpans = document.querySelectorAll('.policy-meta-row span');
    if (metaSpans.length >= 5) {
      metaSpans[0].innerHTML = `<strong>${ck.meta.effectiveDate.split(':')[0]}:</strong> ${ck.meta.effectiveDate.split(':')[1]}`;
      metaSpans[2].innerHTML = `<strong>${ck.meta.trackers.split(':')[0]}:</strong> ${ck.meta.trackers.split(':')[1]}`;
      metaSpans[4].innerHTML = `<strong>${ck.meta.promise.split(':')[0]}:</strong> ${ck.meta.promise.split(':')[1]}`;
    }

    const hlCards = document.querySelectorAll('.policy-highlights-grid .policy-highlight-card');
    if (hlCards.length >= 2) {
      const h0 = hlCards[0].querySelector('.policy-highlight-title');
      if (h0) h0.textContent = ck.highlight1Title;
      const d0 = hlCards[0].querySelector('.policy-highlight-desc');
      if (d0) d0.innerHTML = ck.highlight1Desc;

      const h1 = hlCards[1].querySelector('.policy-highlight-title');
      if (h1) h1.textContent = ck.highlight2Title;
      const d1 = hlCards[1].querySelector('.policy-highlight-desc');
      if (d1) d1.innerHTML = ck.highlight2Desc;

      if (hlCards.length >= 3) {
        const h2 = hlCards[2].querySelector('.policy-highlight-title');
        if (h2) h2.textContent = (activeLang === 'hi') ? 'पूर्ण ग्राहक नियंत्रण' : (activeLang === 'ur') ? 'کسٹمر کا مکمل کنٹرول' : 'Full Customer Control';
        const d2 = hlCards[2].querySelector('.policy-highlight-desc');
        if (d2) d2.textContent = (activeLang === 'hi') ? 'आप अपनी ब्राउज़र सेटिंग्स के माध्यम से किसी भी समय कुकीज देख, साफ़ या ब्लॉक कर सकते हैं।' : (activeLang === 'ur') ? 'آپ اپنے براؤزر کی سیٹنگز کے ذریعے کسی بھی وقت کوکیز دیکھ، صاف یا بلاک کر سکتے ہیں۔' : 'You can view, clear, or block cookies anytime via your browser settings.';
      }
    }

    const clauseTitles = document.querySelectorAll('.policy-clause .policy-clause-title');
    const clauseTexts = (activeLang === 'hi') ? [
      "कुकीज व लोकल स्टोरेज क्या हैं?",
      "आवश्यक स्टोरेज जिसका हम उपयोग करते हैं (कार्ट, लॉगिन व भाषा)",
      "शून्य तृतीय-पक्ष विज्ञापन ट्रैकर्स",
      "ब्राउज़र स्टोरेज को साफ़ या प्रबंधित कैसे करें"
    ] : (activeLang === 'ur') ? [
      "کوکیز اور لوکل اسٹوریج کیا ہیں؟",
      "لازمی اسٹوریج جو ہم استعمال کرتے ہیں (کارٹ، لاگ ان اور زبان)",
      "تیسرے فریق کے اشتہاری ٹریکرز کا مکمل خاتمہ",
      "براؤزر اسٹوریج کو کیسے صاف یا منظم کریں"
    ] : [
      "What Are Cookies and Local Storage?",
      "The Essential Cookies & Storage We Use",
      "Zero Third-Party Advertising Tracking",
      "How to Clear or Manage Browser Storage"
    ];
    clauseTitles.forEach((t, idx) => {
      if (clauseTexts[idx]) t.textContent = clauseTexts[idx];
    });
  }
}

export function translateOrderSuccessPage(dict, activeLang) {
  if (!dict.orderSuccess) return;
  const s = dict.orderSuccess;

  const pill = document.querySelector('.success-status-pill');
  if (pill && s.statusPill) pill.textContent = s.statusPill;

  const title = document.querySelector('.success-title');
  if (title) title.textContent = s.title;
  const sub = document.querySelector('.success-subtitle');
  if (sub) sub.textContent = s.subtitle;

  const metaLabels = document.querySelectorAll('.order-meta-box .meta-item .meta-label');
  if (metaLabels.length >= 4) {
    metaLabels[0].textContent = s.meta.orderNumber;
    metaLabels[1].textContent = s.meta.orderDate;
    metaLabels[2].textContent = s.meta.paymentMode;
    metaLabels[3].textContent = s.meta.totalAmount;
  }

  const stepperHeading = document.querySelector('.stepper-heading');
  if (stepperHeading) stepperHeading.textContent = s.stepperHeading;

  const steps = document.querySelectorAll('.fulfillment-stepper .f-step');
  if (steps.length >= 5 && s.stepper) {
    const titles = [s.stepper.placedTitle, s.stepper.prepTitle, s.stepper.packTitle, s.stepper.dispTitle, s.stepper.delivTitle];
    const subs = [s.stepper.placedSub, s.stepper.prepSub, s.stepper.packSub, s.stepper.dispSub, s.stepper.delivSub];
    steps.forEach((st, idx) => {
      const t = st.querySelector('.f-step-title');
      if (t && titles[idx]) t.textContent = titles[idx];
      const sb = st.querySelector('.f-step-sub');
      if (sb && subs[idx]) sb.textContent = subs[idx];
    });
  }

  const receiptHeading = document.querySelector('.receipt-heading');
  if (receiptHeading) receiptHeading.textContent = s.receiptHeading;

  const totalsRows = document.querySelectorAll('.receipt-totals-table .totals-row');
  if (totalsRows.length >= 3) {
    const l0 = totalsRows[0].querySelector('span:first-child');
    if (l0) l0.textContent = s.subtotalLabel;

    const l1 = totalsRows[1].querySelector('span:first-child');
    if (l1) l1.textContent = s.deliveryLabel;
    const v1 = totalsRows[1].querySelector('span:last-child');
    if (v1 && v1.textContent.includes('FREE')) v1.textContent = s.freeDeliveryText;

    const l2 = totalsRows[2].querySelector('span:first-child');
    if (l2) l2.textContent = s.totalPayableLabel;
  }

  const addrLabel = document.querySelector('.receipt-address-card .addr-label');
  if (addrLabel) addrLabel.textContent = s.addressLabel;

  const btnWa = document.querySelector('#btn-wa-notify span');
  if (btnWa) btnWa.textContent = s.buttons.waNotify;
  const btnPrint = document.querySelector('.btn-print-action span');
  if (btnPrint) btnPrint.textContent = s.buttons.printReceipt;
  const btnOrders = document.querySelector('.btn-orders-action span');
  if (btnOrders) btnOrders.textContent = s.buttons.viewOrders;
  const btnShop = document.querySelector('.btn-shop-more-action span');
  if (btnShop) btnShop.textContent = s.buttons.continueShopping;
}

export function translatePaymentFailedPage(dict, activeLang) {
  if (!dict.paymentFailed) return;
  const pf = dict.paymentFailed;

  const pill = document.querySelector('.failed-status-pill');
  if (pill) pill.textContent = pf.statusPill;
  const title = document.querySelector('.failed-title');
  if (title) title.textContent = pf.title;

  const safeTitle = document.querySelector('.failed-safe-banner strong');
  if (safeTitle) safeTitle.textContent = pf.safeTitle;
  const safeDesc = document.querySelector('.failed-safe-banner p');
  if (safeDesc) safeDesc.textContent = pf.safeDesc;

  const metaLabels = document.querySelectorAll('.failed-details-box .meta-item .meta-label');
  if (metaLabels.length >= 3) {
    metaLabels[0].textContent = pf.meta.orderIdLabel;
    metaLabels[1].textContent = pf.meta.orderAmountLabel;
    metaLabels[2].textContent = pf.meta.reasonLabel;
  }

  const btnRetry = document.querySelector('#btn-retry-payment span');
  if (btnRetry) btnRetry.textContent = pf.buttons.retry;
  const btnCod = document.querySelector('#btn-convert-cod span');
  if (btnCod) btnCod.textContent = pf.buttons.cod;
  const btnWa = document.querySelector('#btn-fail-wa-help span');
  if (btnWa) btnWa.textContent = pf.buttons.waHelp;
  const btnBack = document.querySelector('.btn-back-shop span');
  if (btnBack) btnBack.textContent = pf.buttons.backShop;

  const faqTitle = document.querySelector('.failed-faq-title');
  if (faqTitle) faqTitle.textContent = pf.faq.title;
  const faqItems = document.querySelectorAll('.failed-faq-item');
  if (faqItems.length >= 2) {
    const q1 = faqItems[0].querySelector('strong');
    if (q1) q1.textContent = pf.faq.q1;
    const a1 = faqItems[0].querySelector('p');
    if (a1) a1.textContent = pf.faq.a1;

    const q2 = faqItems[1].querySelector('strong');
    if (q2) q2.textContent = pf.faq.q2;
    const a2 = faqItems[1].querySelector('p');
    if (a2) a2.textContent = pf.faq.a2;
  }
}

export function translateNotFoundPage(dict, activeLang) {
  if (!dict.notFound) return;
  const nf = dict.notFound;

  const badge = document.querySelector('.error-badge, .error-badge-pill');
  if (badge) badge.textContent = nf.badge;
  const title = document.querySelector('.error-title');
  if (title) title.textContent = nf.title;
  const desc = document.querySelector('.error-desc');
  if (desc) desc.textContent = nf.desc;

  const searchInp = document.querySelector('.error-search-input');
  if (searchInp) searchInp.placeholder = nf.searchPlaceholder;
  const searchBtn = document.querySelector('.error-search-btn');
  if (searchBtn) searchBtn.textContent = nf.searchBtn;

  const btnExp = document.querySelector('.btn-primary-error');
  if (btnExp) btnExp.textContent = nf.buttons.explore;
  const btnHome = document.querySelector('.btn-secondary-error');
  if (btnHome) btnHome.textContent = nf.buttons.home;
  const btnWa = document.querySelector('.btn-wa-error');
  if (btnWa) btnWa.textContent = nf.buttons.wa;

  const popHeading = document.querySelector('.error-popular-heading');
  if (popHeading) popHeading.textContent = nf.popularHeading;
}

export function translateGlobalFooter(dict, activeLang) {
  if (!dict || !dict.footer) return;
  const f = dict.footer;

  // 1. Brand name and description
  const brandName = document.querySelector('.footer-brand-header .footer-brand-name');
  if (brandName) {
    if (activeLang === 'hi') brandName.textContent = 'सात्विक स्वाद';
    else if (activeLang === 'ur') brandName.textContent = 'ساٹوک سواد';
    else brandName.textContent = 'Satvik Swaad';
  }

  const brandDesc = document.querySelector('.site-footer .footer-desc, .footer-brand-desc');
  if (brandDesc && f.brandDesc) brandDesc.textContent = f.brandDesc;

  // 2. Headings (Quick Links & Contact)
  const qlHeading = document.querySelector('.footer-col-links .footer-heading-text, .footer-col-links .footer-col-title');
  if (qlHeading && f.quickLinks) qlHeading.textContent = f.quickLinks;

  const contactHeading = document.querySelector('.footer-col-contact .footer-heading-text, .footer-col-contact .footer-col-title');
  if (contactHeading && f.contactHeading) contactHeading.textContent = f.contactHeading;

  // 3. Navigation Links
  if (f.links) {
    const navLinks = document.querySelectorAll('.footer-nav-list a');
    navLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      if ((href === 'products.html' || href.endsWith('/products.html')) && f.links.ourCollection) {
        a.textContent = f.links.ourCollection;
      } else if (href.includes('category=achar') && f.links.picklesAchar) {
        a.textContent = f.links.picklesAchar;
      } else if (href.includes('category=sweets') && f.links.sweetsMurabba) {
        a.textContent = f.links.sweetsMurabba;
      } else if (href.includes('our-story.html') && f.links.ourHeritageStory) {
        a.textContent = f.links.ourHeritageStory;
      } else if (href.includes('why-us.html') && f.links.healthPurityPromise) {
        a.textContent = f.links.healthPurityPromise;
      } else if (href.includes('faq.html') && f.links.faqs) {
        a.textContent = f.links.faqs;
      } else if (href.includes('cancellation-refund-policy.html') && f.links.returnRefundPolicy) {
        a.textContent = f.links.returnRefundPolicy;
      } else if (href.includes('shipping-delivery-policy.html') && f.links.shippingPolicy) {
        a.textContent = f.links.shippingPolicy;
      } else if (href.includes('privacy-policy.html') && f.links.privacyPolicy) {
        a.textContent = f.links.privacyPolicy;
      } else if (href.includes('cookies-policy.html') && f.links.cookiesPolicy) {
        a.textContent = f.links.cookiesPolicy;
      } else if (href.includes('terms-and-conditions.html') && f.links.termsOfService) {
        a.textContent = f.links.termsOfService;
      }
    });
  }

  // 4. Contact action labels
  const contactLabels = document.querySelectorAll('.footer-contact-info .footer-contact-label');
  if (contactLabels.length >= 1 && f.callSupport) contactLabels[0].textContent = f.callSupport;
  if (contactLabels.length >= 2 && f.messageUs) contactLabels[1].textContent = f.messageUs;
  if (contactLabels.length >= 3 && f.emailResponse) contactLabels[2].textContent = f.emailResponse;

  // 5. Newsletter card / Direct Communication card
  const nlTitle = document.querySelector('.footer-newsletter-title');
  const nlDesc = document.querySelector('.footer-newsletter-desc');
  const nlFoot = document.querySelector('.footer-newsletter-footnote');
  const nlInput = document.querySelector('.footer-newsletter-input');
  const nlBtn = document.querySelector('.footer-newsletter-btn');

  if (nlInput && f.newsletter) {
    if (nlTitle && f.newsletter.title) nlTitle.textContent = f.newsletter.title;
    if (nlDesc && f.newsletter.desc) nlDesc.textContent = f.newsletter.desc;
    if (nlInput && f.newsletter.placeholder) {
      nlInput.placeholder = f.newsletter.placeholder;
      nlInput.setAttribute('aria-label', f.newsletter.placeholder);
    }
    if (nlBtn && f.newsletter.subscribeBtn) nlBtn.textContent = f.newsletter.subscribeBtn;
    if (nlFoot && f.newsletter.footnote) nlFoot.textContent = f.newsletter.footnote;
  } else if (nlTitle && nlDesc) {
    // Direct care guarantee box (e.g. cart.html)
    if (activeLang === 'hi') {
      nlTitle.textContent = '🛡️ सुरक्षित व सीधा संपर्क';
      nlDesc.innerHTML = '<strong>शून्य स्पैम गारंटी:</strong> सात्विक स्वाद किसी भी तीसरे पक्ष की प्रचार सामग्री या मैसेज सेवा का उपयोग नहीं करता है। सभी बातचीत हमारे सत्यापित व्हाट्सएप (+91 92365 87600) और आधिकारिक ईमेल (satvikswaad.care@gmail.com) पर सीधे और 100% सुरक्षित रूप से होती है।';
      if (nlFoot) nlFoot.textContent = '100% सीधा संपर्क • शून्य अनचाहे संदेश';
    } else if (activeLang === 'ur') {
      nlTitle.textContent = '🛡️ محفوظ براہ راست رابطہ';
      nlDesc.innerHTML = '<strong>زیرو اسپام گارنٹی:</strong> ساٹوک سواد کسی بھی تھرڈ پارٹی میسج یا پروموشنل ای میل سروسز کا استعمال نہیں کرتا۔ تمام بات چیت ہمارے تصدیق شدہ واٹس ایپ (+91 92365 87600) اور آفیشل ای میل (satvikswaad.care@gmail.com) کے ذریعے براہ راست اور محفوظ طریقے سے ہوتی ہے۔';
      if (nlFoot) nlFoot.textContent = '100% براہ راست • بلا ملاوٹ و اسپام';
    } else {
      nlTitle.textContent = '🛡️ Secure Direct Care';
      nlDesc.innerHTML = '<strong>Zero Spam Guarantee:</strong> Satvik Swaad does not send or provide third-party message or promotional mail services. All communication is 100% direct and secured via our verified WhatsApp (+91 92365 87600) and official care inbox (satvikswaad.care@gmail.com).';
      if (nlFoot) nlFoot.textContent = '100% Direct • Zero Marketing Blasts';
    }
  }

  // 6. Bottom copyright and tagline
  const bottomCopy = document.querySelector('.footer-bottom-copy, .footer-copyright');
  if (bottomCopy && f.copyright) bottomCopy.textContent = f.copyright;

  const bottomTag = document.querySelector('.footer-bottom-tagline');
  if (bottomTag && f.tagline) bottomTag.textContent = f.tagline;
}

// Global browser window attachment
if (typeof window !== 'undefined') {
  window.TRANSLATIONS = TRANSLATIONS;
  window.t = t;
  window.applyTranslations = applyTranslations;
  window.getCurrentLanguage = getCurrentLanguage;
  window.setLanguage = setLanguage;
  window.translateGlobalFooter = translateGlobalFooter;
}
