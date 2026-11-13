/**
 * Satvik Swaad — Admin Data Adapter & Storage Specialist Layer
 * File: /public/admin/adminDataAdapter.js
 * 
 * Features:
 * 1. Unified interface for Localhost Dev Mode (persistent getStorage()) and Cloud Firestore Mode.
 * 2. Pre-loaded with rich, realistic artisanal seed data:
 *    - 16+ Online Customer Orders across diverse dates and times (morning, afternoon, evening, night).
 *    - 11+ Offline POS Sales with customer names (e.g. Ramesh Gupta Store Pickup, Priya Sharma Phone Order, etc.).
 *    - Catalog Products with live stocks synced with PRODUCTS_CATALOGUE.
 *    - Offline Expenses Ledger (mustard oil, glass jars, spices, cartons, etc.).
 *    - Customer Reviews with sentiment metadata.
 * 3. Automatic inventory deduction when recording Offline Orders.
 * 4. Automatic stock restoration when an order is cancelled.
 * 5. Full event listener pub/sub mechanism for live reactive UI updates.
 * 6. Completely eliminates Firestore "Missing or insufficient permissions" on localhost.
 */

// Storage Keys for persistent Dev Mode
export const STORAGE_KEYS = {
    ORDERS: 'satvik_admin_dev_orders',
    PRODUCTS: 'satvik_admin_dev_products',
    EXPENSES: 'satvik_admin_dev_expenses',
    REVIEWS: 'satvik_admin_dev_reviews',
    FEATURED_REVIEWS: 'satvik_featured_reviews',
    SUBSCRIBERS: 'satvik_newsletter_subscribers',
    MODE: 'satvik_admin_mode',
    SEED_VERSION: 'satvik_admin_seed_version_v6'
};

// Lazy / Dynamic Firestore Module Loader (Enables offline dev mode and Node.js testing compatibility)
let _fsModule = null;
async function getFirestoreLib() {
    if (_fsModule) return _fsModule;
    if (typeof window !== 'undefined') {
        try {
            _fsModule = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            return _fsModule;
        } catch (e) {
            console.warn("[AdminDataAdapter] Firestore CDN module unavailable (dev fallback active):", e.message);
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. RICH SEED DATA DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const SEED_PRODUCTS = [
    {
        "id": "prod_aam_achar",
        "name": "Aam ka Achar",
        "hindiName": "पारंपरिक आम का अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Bestseller",
        "shortDesc": "Authentic raw mango pickle marinated in pure cold-pressed mustard oil, fennel, and fenugreek.",
        "price": 404,
        "mrp": 449,
        "stock": 85,
        "sku": "SAT-AAM-MASTER",
        "images": [
            "assets/mango500.jpeg",
            "assets/mango350.jpeg",
            "assets/mango500_2.jpeg",
            "assets/mangopickel500_3.jpeg"
        ],
        "image": "assets/mango500.jpeg",
        "img": "assets/mango500.jpeg",
        "available": true,
        "rating": 4.9,
        "reviewCount": 28,
        "shelfLife": "12 Months",
        "variants": [
            {
                "id": "var_350g",
                "label": "350 g",
                "weightGrams": 350,
                "price": 179,
                "mrp": 199,
                "sku": "SAT-AAM-350G",
                "stock": 50,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 404,
                "mrp": 449,
                "sku": "SAT-AAM-500G",
                "stock": 35,
                "active": true
            }
        ]
    },
    {
        "id": "prod_kareli_achar",
        "name": "Kareli ka Achar",
        "hindiName": "मसालेदार करेली का अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Healthy Choice",
        "shortDesc": "Sun-cured bitter gourd pickle seasoned with amchur, ajwain, and pure mustard oil.",
        "price": 269,
        "mrp": 299,
        "stock": 65,
        "sku": "SAT-KAR-MASTER",
        "images": [
            "assets/karelapickel500.jpeg",
            "assets/karela350.jpeg"
        ],
        "image": "assets/karelapickel500.jpeg",
        "img": "assets/karelapickel500.jpeg",
        "available": true,
        "rating": 4.7,
        "reviewCount": 16,
        "shelfLife": "9 Months",
        "variants": [
            {
                "id": "var_350g",
                "label": "350 g",
                "weightGrams": 350,
                "price": 197,
                "mrp": 219,
                "sku": "SAT-KAR-350G",
                "stock": 40,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 269,
                "mrp": 299,
                "sku": "SAT-KAR-500G",
                "stock": 25,
                "active": true
            }
        ]
    },
    {
        "id": "prod_amla_achar",
        "name": "Amla ka Achar",
        "hindiName": "चटपटा आंवला का अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Traditional Recipe",
        "shortDesc": "Spicy Indian gooseberry pickle rich in Vitamin C, preserved with roasted cumin and hing.",
        "price": 314,
        "mrp": 349,
        "stock": 75,
        "sku": "SAT-AML-MASTER",
        "images": [
            "assets/amlapickel500.jpeg"
        ],
        "image": "assets/amlapickel500.jpeg",
        "img": "assets/amlapickel500.jpeg",
        "available": true,
        "rating": 4.8,
        "reviewCount": 22,
        "shelfLife": "12 Months",
        "variants": [
            {
                "id": "var_350g",
                "label": "350 g",
                "weightGrams": 350,
                "price": 233,
                "mrp": 259,
                "sku": "SAT-AML-350G",
                "stock": 45,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 314,
                "mrp": 349,
                "sku": "SAT-AML-500G",
                "stock": 30,
                "active": true
            }
        ]
    },
    {
        "id": "prod_amla_chutney",
        "name": "Amla ki Chutney",
        "hindiName": "चटपटी आंवला चटनी",
        "category": "achar",
        "cat": "achar",
        "badge": "Tangy Special",
        "shortDesc": "Sweet & sour Indian gooseberry relish cooked with jaggery, black salt, and cumin notes.",
        "price": 314,
        "mrp": 349,
        "stock": 55,
        "sku": "SAT-ACH-MASTER",
        "images": [
            "assets/amlachuteny500.jpeg",
            "assets/amlachuteny350.jpeg"
        ],
        "image": "assets/amlachuteny500.jpeg",
        "img": "assets/amlachuteny500.jpeg",
        "available": true,
        "rating": 4.6,
        "reviewCount": 14,
        "shelfLife": "6 Months",
        "variants": [
            {
                "id": "var_350g",
                "label": "350 g",
                "weightGrams": 350,
                "price": 224,
                "mrp": 249,
                "sku": "SAT-ACH-350G",
                "stock": 35,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 314,
                "mrp": 349,
                "sku": "SAT-ACH-500G",
                "stock": 20,
                "active": true
            }
        ]
    },
    {
        "id": "prod_laal_mirch_achar",
        "name": "Laal Mirch ka Achar",
        "hindiName": "भरवां लाल मिर्च का अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Banarasi Special",
        "shortDesc": "Authentic Banarasi stuffed red chilli pickle filled with roasted aromatic spices.",
        "price": 494,
        "mrp": 549,
        "stock": 55,
        "sku": "SAT-LMC-MASTER",
        "images": [
            "assets/bharuapickle500.jpeg",
            "assets/bharwa350.jpeg"
        ],
        "image": "assets/bharuapickle500.jpeg",
        "img": "assets/bharuapickle500.jpeg",
        "available": true,
        "rating": 4.9,
        "reviewCount": 31,
        "shelfLife": "12 Months",
        "variants": [
            {
                "id": "var_350g",
                "label": "350 g",
                "weightGrams": 350,
                "price": 296,
                "mrp": 329,
                "sku": "SAT-LMC-350G",
                "stock": 30,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 494,
                "mrp": 549,
                "sku": "SAT-LMC-500G",
                "stock": 25,
                "active": true
            }
        ]
    },
    {
        "id": "prod_hari_mirch_achar",
        "name": "Hari Mirch ka Achar",
        "hindiName": "चटपटी हरी मिर्च का अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Spicy Favorite",
        "shortDesc": "Sliced green chillies tempered with lemon juice, mustard seeds, and turmeric in cold-pressed oil.",
        "price": 377,
        "mrp": 419,
        "stock": 65,
        "sku": "SAT-HMC-MASTER",
        "images": [
            "assets/greenchillipickel500.jpeg"
        ],
        "image": "assets/greenchillipickel500.jpeg",
        "img": "assets/greenchillipickel500.jpeg",
        "available": true,
        "rating": 4.7,
        "reviewCount": 19,
        "shelfLife": "6 Months",
        "variants": [
            {
                "id": "var_350g",
                "label": "350 g",
                "weightGrams": 350,
                "price": 287,
                "mrp": 319,
                "sku": "SAT-HMC-350G",
                "stock": 40,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 377,
                "mrp": 419,
                "sku": "SAT-HMC-500G",
                "stock": 25,
                "active": true
            }
        ]
    },
    {
        "id": "prod_nimbu_achar",
        "name": "Lemon & Green Chilli Pickle",
        "hindiName": "खट्टा मीठा नींबू हरी मिर्च अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Digestive Remedy",
        "shortDesc": "Oil-free sweet & sour lemon pickle aged with organic jaggery, ajwain, and black salt.",
        "price": 314,
        "mrp": 349,
        "stock": 75,
        "sku": "SAT-NIM-MASTER",
        "images": [
            "assets/lemon_and_chilllipickel500.jpeg",
            "assets/lemon_and_chilli350.jpeg"
        ],
        "image": "assets/lemon_and_chilllipickel500.jpeg",
        "img": "assets/lemon_and_chilllipickel500.jpeg",
        "available": true,
        "rating": 4.8,
        "reviewCount": 25,
        "shelfLife": "24 Months",
        "variants": [
            {
                "id": "var_350g",
                "label": "350 g",
                "weightGrams": 350,
                "price": 224,
                "mrp": 249,
                "sku": "SAT-NIM-350G",
                "stock": 45,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 314,
                "mrp": 349,
                "sku": "SAT-NIM-500G",
                "stock": 30,
                "active": true
            }
        ]
    },
    {
        "id": "prod_amda_achar",
        "name": "Amda Pickle",
        "hindiName": "पारंपरिक आमड़ा का अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Heritage Special",
        "shortDesc": "Traditional Indian hog plum (amda) pickle sun-cured with roasted Banarasi spices.",
        "price": 323,
        "mrp": 359,
        "stock": 60,
        "sku": "SAT-AMD-MASTER",
        "images": [
            "assets/amrapickel500.jpeg",
            "assets/amra350.jpeg"
        ],
        "image": "assets/amrapickel500.jpeg",
        "img": "assets/amrapickel500.jpeg",
        "available": true,
        "rating": 4.9,
        "reviewCount": 24,
        "shelfLife": "12 Months",
        "variants": [
            {
                "id": "var_350g",
                "label": "350 g",
                "weightGrams": 350,
                "price": 233,
                "mrp": 259,
                "sku": "SAT-AMD-350G",
                "stock": 35,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 323,
                "mrp": 359,
                "sku": "SAT-AMD-500G",
                "stock": 25,
                "active": true
            }
        ]
    },
    {
        "id": "prod_lhsun_achar",
        "name": "Lahsun ka Achar",
        "hindiName": "मसालेदार लहसुन का अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Heart Healthy",
        "shortDesc": "Peeled whole garlic cloves marinated in spicy mustard oil, methi, saunf, and amchur.",
        "price": 289,
        "mrp": 360,
        "stock": 55,
        "sku": "SAT-LHS-MASTER",
        "images": [
            "assets/amda-ka-achar.png?v=2"
        ],
        "image": "assets/amda-ka-achar.png?v=2",
        "img": "assets/amda-ka-achar.png?v=2",
        "available": true,
        "rating": 4.8,
        "reviewCount": 18,
        "shelfLife": "12 Months",
        "variants": [
            {
                "id": "var_250g",
                "label": "250 g",
                "weightGrams": 250,
                "price": 169,
                "mrp": 210,
                "sku": "SAT-LHS-250G",
                "stock": 35,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 289,
                "mrp": 360,
                "sku": "SAT-LHS-500G",
                "stock": 20,
                "active": true
            }
        ]
    },
    {
        "id": "prod_mix_veg_achar",
        "name": "Mix Veg Achar",
        "hindiName": "स्वादिष्ट मिक्स वेज अचार",
        "category": "achar",
        "cat": "achar",
        "badge": "Winter Classic",
        "shortDesc": "Crunchy carrot, turnip, cauliflower, and green chilli pickle in cold-pressed mustard oil.",
        "price": 249,
        "mrp": 320,
        "stock": 65,
        "sku": "SAT-MIX-MASTER",
        "images": [
            "assets/kathal-ka-achar.png?v=2"
        ],
        "image": "assets/kathal-ka-achar.png?v=2",
        "img": "assets/kathal-ka-achar.png?v=2",
        "available": true,
        "rating": 4.7,
        "reviewCount": 15,
        "shelfLife": "9 Months",
        "variants": [
            {
                "id": "var_250g",
                "label": "250 g",
                "weightGrams": 250,
                "price": 149,
                "mrp": 190,
                "sku": "SAT-MIX-250G",
                "stock": 40,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 249,
                "mrp": 320,
                "sku": "SAT-MIX-500G",
                "stock": 25,
                "active": true
            }
        ]
    },
    {
        "id": "prod_amla_murabba",
        "name": "Amla Murabba",
        "hindiName": "शाही आंवला मुरब्बा",
        "category": "murabba",
        "cat": "murabba",
        "badge": "Rasayana Classic",
        "shortDesc": "Whole green gooseberries simmered in cardamom & saffron infused syrup. Natural Vitamin C.",
        "price": 279,
        "mrp": 350,
        "stock": 50,
        "sku": "SAT-MUR-MASTER",
        "images": [
            "assets/amla-murabba-sugar.png?v=2"
        ],
        "image": "assets/amla-murabba-sugar.png?v=2",
        "img": "assets/amla-murabba-sugar.png?v=2",
        "available": true,
        "rating": 4.9,
        "reviewCount": 34,
        "shelfLife": "12 Months",
        "variants": [
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 279,
                "mrp": 350,
                "sku": "SAT-MUR-500G",
                "stock": 30,
                "active": true
            },
            {
                "id": "var_1kg",
                "label": "1 kg",
                "weightGrams": 1000,
                "price": 499,
                "mrp": 640,
                "sku": "SAT-MUR-1KG",
                "stock": 20,
                "active": true
            }
        ]
    },
    {
        "id": "prod_seb_murabba",
        "name": "Seb ka Murabba",
        "hindiName": "स्वादिष्ट सेब का मुरब्बा",
        "category": "murabba",
        "cat": "murabba",
        "badge": "Premium Preserve",
        "shortDesc": "Hand-picked Himalayan apples preserved in fragrant clove and cardamom syrup.",
        "price": 349,
        "mrp": 440,
        "stock": 40,
        "sku": "SAT-SEB-MASTER",
        "images": [
            "assets/amla-murabba-jaggery.png?v=2"
        ],
        "image": "assets/amla-murabba-jaggery.png?v=2",
        "img": "assets/amla-murabba-jaggery.png?v=2",
        "available": true,
        "rating": 4.8,
        "reviewCount": 12,
        "shelfLife": "12 Months",
        "variants": [
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 349,
                "mrp": 440,
                "sku": "SAT-SEB-500G",
                "stock": 25,
                "active": true
            },
            {
                "id": "var_1kg",
                "label": "1 kg",
                "weightGrams": 1000,
                "price": 649,
                "mrp": 800,
                "sku": "SAT-SEB-1KG",
                "stock": 15,
                "active": true
            }
        ]
    },
    {
        "id": "prod_diwali_laddu",
        "name": "Diwali Festive Laddu Collection (Amla • Ragi • Singhada)",
        "hindiName": "दिवाली उत्सव लड्डू संग्रह",
        "category": "sweets",
        "cat": "sweets",
        "badge": "Diwali Special",
        "highlighted": true,
        "shortDesc": "Exclusive handcrafted festive gift collection featuring artisanal Amla, wholesome Ragi, and fasting-special Singhada laddus bound in pure A2 cow ghee.",
        "price": 499,
        "mrp": 599,
        "stock": 100,
        "sku": "SAT-DIWALI-MASTER",
        "images": [
            "assets/diwali_festival_laddu.jpeg"
        ],
        "image": "assets/diwali_festival_laddu.jpeg",
        "img": "assets/diwali_festival_laddu.jpeg",
        "available": true,
        "rating": 5,
        "reviewCount": 48,
        "shelfLife": "30 Days",
        "variants": [
            {
                "id": "var_box",
                "label": "Festive Gift Box (9 pcs)",
                "weightGrams": 450,
                "price": 499,
                "mrp": 599,
                "sku": "SAT-DIWALI-BOX",
                "stock": 100,
                "active": true
            }
        ]
    },
    {
        "id": "prod_singhada_laddu",
        "name": "Singhada Laddu",
        "hindiName": "सिंघाड़ा लड्डू",
        "category": "sweets",
        "cat": "sweets",
        "badge": "Festive Special",
        "shortDesc": "Fasting-friendly (vrat-special) water caltrop flour laddus roasted slowly in fragrant A2 desi ghee with nuts.",
        "price": 349,
        "mrp": 399,
        "stock": 80,
        "sku": "SAT-SINGHADA-MASTER",
        "images": [
            "assets/singhadaladdu.jpeg"
        ],
        "image": "assets/singhadaladdu.jpeg",
        "img": "assets/singhadaladdu.jpeg",
        "available": true,
        "rating": 4.9,
        "reviewCount": 29,
        "shelfLife": "45 Days",
        "variants": [
            {
                "id": "var_box",
                "label": "Special Box (400g)",
                "weightGrams": 400,
                "price": 349,
                "mrp": 399,
                "sku": "SAT-SINGHADA-400G",
                "stock": 80,
                "active": true
            }
        ]
    },
    {
        "id": "prod_gond_laddu",
        "name": "Shuddh Desi Ghee Gond Laddu",
        "hindiName": "शुद्ध देसी घी गोंद के लड्डू",
        "category": "sweets",
        "cat": "sweets",
        "badge": "Winter Special",
        "shortDesc": "Edible gum, roasted whole wheat flour, almonds, cashew nuts, bound in pure A2 cow ghee.",
        "price": 499,
        "mrp": 620,
        "stock": 35,
        "sku": "SAT-GND-MASTER",
        "images": [
            "assets/amla-laddu-jaggery.png?v=2"
        ],
        "image": "assets/amla-laddu-jaggery.png?v=2",
        "img": "assets/amla-laddu-jaggery.png?v=2",
        "available": true,
        "rating": 5,
        "reviewCount": 42,
        "shelfLife": "3 Months",
        "variants": [
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 499,
                "mrp": 620,
                "sku": "SAT-GND-500G",
                "stock": 20,
                "active": true
            },
            {
                "id": "var_1kg",
                "label": "1 kg",
                "weightGrams": 1000,
                "price": 949,
                "mrp": 1200,
                "sku": "SAT-GND-1KG",
                "stock": 15,
                "active": true
            }
        ]
    },
    {
        "id": "prod_besan_laddu",
        "name": "Besan Dry Fruit Laddu",
        "hindiName": "बेसन ड्राई फ्रूट लड्डू",
        "category": "sweets",
        "cat": "sweets",
        "badge": "Festive Favorite",
        "shortDesc": "Slow-roasted coarse gram flour with crushed pistachios, almonds, and cardamom in pure ghee.",
        "price": 449,
        "mrp": 560,
        "stock": 40,
        "sku": "SAT-BSN-MASTER",
        "images": [
            "assets/amla-laddu-sugar.png?v=2"
        ],
        "image": "assets/amla-laddu-sugar.png?v=2",
        "img": "assets/amla-laddu-sugar.png?v=2",
        "available": true,
        "rating": 4.9,
        "reviewCount": 38,
        "shelfLife": "3 Months",
        "variants": [
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 449,
                "mrp": 560,
                "sku": "SAT-BSN-500G",
                "stock": 25,
                "active": true
            },
            {
                "id": "var_1kg",
                "label": "1 kg",
                "weightGrams": 1000,
                "price": 849,
                "mrp": 1080,
                "sku": "SAT-BSN-1KG",
                "stock": 15,
                "active": true
            }
        ]
    },
    {
        "id": "prod_besan_barfi",
        "name": "Besan Barfi",
        "hindiName": "शुद्ध देसी घी बेसन बर्फी",
        "category": "sweets",
        "cat": "sweets",
        "badge": "Bestseller",
        "shortDesc": "Melt-in-mouth traditional gram flour fudge roasted in pure A2 cow ghee with pistachios.",
        "price": 279,
        "mrp": 349,
        "stock": 45,
        "sku": "SAT-BRF-MASTER",
        "images": [
            "assets/product-besan-barfi.png"
        ],
        "image": "assets/product-besan-barfi.png",
        "img": "assets/product-besan-barfi.png",
        "available": true,
        "rating": 4.8,
        "reviewCount": 94,
        "shelfLife": "30 Days",
        "variants": [
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 279,
                "mrp": 349,
                "sku": "SAT-BRF-500G",
                "stock": 30,
                "active": true
            },
            {
                "id": "var_1kg",
                "label": "1 kg",
                "weightGrams": 1000,
                "price": 529,
                "mrp": 679,
                "sku": "SAT-BRF-1KG",
                "stock": 15,
                "active": true
            }
        ]
    },
    {
        "id": "prod_amla_juice",
        "name": "Sun-cured Amla Juice",
        "hindiName": "शुद्ध आंवला रस",
        "category": "health",
        "cat": "health",
        "badge": "100% Pure",
        "shortDesc": "Cold-extracted wild amla juice without added water, synthetic color, or artificial flavor.",
        "price": 199,
        "mrp": 250,
        "stock": 55,
        "sku": "SAT-JUC-MASTER",
        "images": [
            "assets/amla-juice.png?v=2"
        ],
        "image": "assets/amla-juice.png?v=2",
        "img": "assets/amla-juice.png?v=2",
        "available": true,
        "rating": 4.7,
        "reviewCount": 20,
        "shelfLife": "6 Months",
        "variants": [
            {
                "id": "var_500ml",
                "label": "500 ml",
                "weightGrams": 500,
                "price": 199,
                "mrp": 250,
                "sku": "SAT-JUC-500ML",
                "stock": 35,
                "active": true
            },
            {
                "id": "var_1l",
                "label": "1 L",
                "weightGrams": 1000,
                "price": 349,
                "mrp": 450,
                "sku": "SAT-JUC-1L",
                "stock": 20,
                "active": true
            }
        ]
    },
    {
        "id": "prod_chyawanprash",
        "name": "Ancestral Chyawanprash",
        "hindiName": "विशेष वैदिक च्यवनप्राश",
        "category": "health",
        "cat": "health",
        "badge": "Ayurvedic Elixir",
        "shortDesc": "Cooked slowly with fresh amla pulp, wild forest honey, A2 cow ghee, and 40+ wild herbs.",
        "price": 599,
        "mrp": 750,
        "stock": 40,
        "sku": "SAT-CHW-MASTER",
        "images": [
            "assets/chyawanprash.png?v=2"
        ],
        "image": "assets/chyawanprash.png?v=2",
        "img": "assets/chyawanprash.png?v=2",
        "available": true,
        "rating": 4.9,
        "reviewCount": 36,
        "shelfLife": "24 Months",
        "variants": [
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 599,
                "mrp": 750,
                "sku": "SAT-CHW-500G",
                "stock": 25,
                "active": true
            },
            {
                "id": "var_1kg",
                "label": "1 kg",
                "weightGrams": 1000,
                "price": 1099,
                "mrp": 1380,
                "sku": "SAT-CHW-1KG",
                "stock": 15,
                "active": true
            }
        ]
    },
    {
        "id": "prod_amla_powder",
        "name": "Amla Powder",
        "hindiName": "जैविक शुद्ध आंवला चूर्ण",
        "category": "health",
        "cat": "health",
        "badge": "New",
        "shortDesc": "100% shade-dried wild forest amla ground to fine organic powder, rich in Vitamin C.",
        "price": 199,
        "mrp": 259,
        "stock": 65,
        "sku": "SAT-AML-POW-MASTER",
        "images": [
            "assets/product-amla-powder.png"
        ],
        "image": "assets/product-amla-powder.png",
        "img": "assets/product-amla-powder.png",
        "available": true,
        "rating": 4.7,
        "reviewCount": 63,
        "shelfLife": "18 Months",
        "variants": [
            {
                "id": "var_250g",
                "label": "250 g",
                "weightGrams": 250,
                "price": 199,
                "mrp": 259,
                "sku": "SAT-AML-POW-250G",
                "stock": 40,
                "active": true
            },
            {
                "id": "var_500g",
                "label": "500 g",
                "weightGrams": 500,
                "price": 349,
                "mrp": 449,
                "sku": "SAT-AML-POW-500G",
                "stock": 25,
                "active": true
            }
        ]
    }
];

const SEED_ONLINE_ORDERS = [
    {
        id: "ORD-2026-8801",
        source: "online",
        name: "Ananya Deshmukh",
        customerName: "Ananya Deshmukh",
        email: "ananya.deshmukh@gmail.com",
        phone: "+91 98201 44820",
        customerPhone: "+91 98201 44820",
        address: "Flat 402, Nilgiri Heights, Shivaji Nagar, Pune - 411005",
        shippingAddress: { line1: "Flat 402, Nilgiri Heights", city: "Pune", state: "Maharashtra", pincode: "411005" },
        items: [
            { productId: "prod_aam_achar", name: "Aam ka Achar", variantId: "var_500g", variant: "500 g", qty: 1, price: 249, category: "achar" },
            { productId: "prod_gond_laddu", name: "Shuddh Desi Ghee Gond Laddu", variantId: "var_500g", variant: "500 g", qty: 1, price: 499, category: "sweets" }
        ],
        subtotal: 748,
        total: 748,
        finalAmount: 748,
        paymentMethod: "UPI (Google Pay)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "confirmed",
        createdAt: "2026-09-26T12:45:00+05:30",
        notes: "Please pack tightly with bubble wrap."
    },
    {
        id: "ORD-2026-8802",
        source: "online",
        name: "Vikramaditya Rathore",
        customerName: "Vikramaditya Rathore",
        email: "rathore.vikram@yahoo.co.in",
        phone: "+91 94140 88219",
        customerPhone: "+91 94140 88219",
        address: "Haveli 12, Civil Lines, Jaipur - 302006",
        shippingAddress: { line1: "Haveli 12, Civil Lines", city: "Jaipur", state: "Rajasthan", pincode: "302006" },
        items: [
            { productId: "prod_laal_mirch_achar", name: "Laal Mirch ka Achar", variantId: "var_500g", variant: "500 g", qty: 2, price: 299, category: "achar" },
            { productId: "prod_chyawanprash", name: "Ancestral Chyawanprash", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 1099, category: "health" }
        ],
        subtotal: 1697,
        total: 1697,
        finalAmount: 1697,
        paymentMethod: "Card (HDFC)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "processing",
        createdAt: "2026-09-26T09:15:00+05:30",
        notes: "Gift packaging requested."
    },
    {
        id: "ORD-2026-8803",
        source: "online",
        name: "Dr. Shalini Venkat",
        customerName: "Dr. Shalini Venkat",
        email: "dr.shalini.v@apollohospitals.org",
        phone: "+91 98401 22910",
        customerPhone: "+91 98401 22910",
        address: "No. 45, TTK Road, Alwarpet, Chennai - 600018",
        shippingAddress: { line1: "No. 45, TTK Road, Alwarpet", city: "Chennai", state: "Tamil Nadu", pincode: "600018" },
        items: [
            { productId: "prod_chyawanprash", name: "Ancestral Chyawanprash", variantId: "var_500g", variant: "500 g", qty: 2, price: 599, category: "health" },
            { productId: "prod_amla_juice", name: "Sun-cured Amla Juice", variantId: "var_1l", variant: "1 L", qty: 1, price: 349, category: "health" },
            { productId: "prod_amla_powder", name: "Amla Powder", variantId: "var_250g", variant: "250 g", qty: 1, price: 199, category: "health" }
        ],
        subtotal: 1746,
        total: 1746,
        finalAmount: 1746,
        paymentMethod: "UPI (PhonePe)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "shipped",
        courierPartner: "Delhivery Express",
        trackingNumber: "DEL-88291044",
        dispatchedAt: "2026-09-26T08:00:00+05:30",
        createdAt: "2026-09-25T21:40:00+05:30"
    },
    {
        id: "ORD-2026-8804",
        source: "online",
        name: "Sunil Joshi",
        customerName: "Sunil Joshi",
        email: "sunil.joshi@infosys.com",
        phone: "+91 98220 55193",
        customerPhone: "+91 98220 55193",
        address: "Plot 88, Electronic City Phase 1, Bengaluru - 560100",
        shippingAddress: { line1: "Plot 88, Electronic City Phase 1", city: "Bengaluru", state: "Karnataka", pincode: "560100" },
        items: [
            { productId: "prod_besan_laddu", name: "Besan Dry Fruit Laddu", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 849, category: "sweets" },
            { productId: "prod_nimbu_achar", name: "Khatta Meetha Nimbu Achar", variantId: "var_500g", variant: "500 g", qty: 1, price: 239, category: "achar" }
        ],
        subtotal: 1088,
        total: 1088,
        finalAmount: 1088,
        paymentMethod: "UPI (Paytm)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "BlueDart",
        trackingNumber: "BD-90281720",
        createdAt: "2026-09-25T16:20:00+05:30"
    },
    {
        id: "ORD-2026-8805",
        source: "online",
        name: "Meenakshi Sundaram",
        customerName: "Meenakshi Sundaram",
        email: "meenakshi.s@gmail.com",
        phone: "+91 98110 33812",
        customerPhone: "+91 98110 33812",
        address: "B-4/102, Safdarjung Enclave, New Delhi - 110029",
        shippingAddress: { line1: "B-4/102, Safdarjung Enclave", city: "New Delhi", state: "Delhi", pincode: "110029" },
        items: [
            { productId: "prod_hari_mirch_achar", name: "Hari Mirch ka Achar", variantId: "var_500g", variant: "500 g", qty: 1, price: 229, category: "achar" },
            { productId: "prod_aam_achar", name: "Aam ka Achar", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 450, category: "achar" },
            { productId: "prod_amla_murabba", name: "Amla Murabba", variantId: "var_500g", variant: "500 g", qty: 1, price: 279, category: "murabba" }
        ],
        subtotal: 958,
        total: 958,
        finalAmount: 958,
        paymentMethod: "NetBanking (ICICI)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "India Post Speed Post",
        trackingNumber: "EK9281039IN",
        createdAt: "2026-09-25T10:10:00+05:30"
    },
    {
        id: "ORD-2026-8806",
        source: "online",
        name: "Kavita Iyer",
        customerName: "Kavita Iyer",
        email: "kavita.iyer@tcs.com",
        phone: "+91 97690 12845",
        customerPhone: "+91 97690 12845",
        address: "Tower 3, Apt 1104, Hiranandani Estate, Thane West - 400607",
        shippingAddress: { line1: "Tower 3, Apt 1104, Hiranandani Estate", city: "Thane", state: "Maharashtra", pincode: "400607" },
        items: [
            { productId: "prod_besan_barfi", name: "Besan Barfi", variantId: "var_500g", variant: "500 g", qty: 2, price: 279, category: "sweets" },
            { productId: "prod_gond_laddu", name: "Shuddh Desi Ghee Gond Laddu", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 949, category: "sweets" }
        ],
        subtotal: 1507,
        total: 1507,
        finalAmount: 1507,
        paymentMethod: "Card (SBI)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "shipped",
        courierPartner: "Delhivery Express",
        trackingNumber: "DEL-77382901",
        createdAt: "2026-09-24T23:15:00+05:30"
    },
    {
        id: "ORD-2026-8807",
        source: "online",
        name: "Arun Khurana",
        customerName: "Arun Khurana",
        email: "arun.khurana@rediffmail.com",
        phone: "+91 98760 99421",
        customerPhone: "+91 98760 99421",
        address: "H.No 241, Sector 15-A, Chandigarh - 160015",
        shippingAddress: { line1: "H.No 241, Sector 15-A", city: "Chandigarh", state: "Punjab", pincode: "160015" },
        items: [
            { productId: "prod_aam_achar", name: "Aam ka Achar", variantId: "var_1kg", variant: "1 kg", qty: 2, price: 450, category: "achar" },
            { productId: "prod_kareli_achar", name: "Kareli ka Achar", variantId: "var_500g", variant: "500 g", qty: 1, price: 269, category: "achar" }
        ],
        subtotal: 1169,
        total: 1169,
        finalAmount: 1169,
        paymentMethod: "UPI (Google Pay)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "processing",
        createdAt: "2026-09-24T14:30:00+05:30"
    },
    {
        id: "ORD-2026-8808",
        source: "online",
        name: "Deepak Chawla",
        customerName: "Deepak Chawla",
        email: "deepak.c@outlook.com",
        phone: "+91 98990 41203",
        customerPhone: "+91 98990 41203",
        address: "C-12, Sector 44, Noida, UP - 201301",
        shippingAddress: { line1: "C-12, Sector 44", city: "Noida", state: "Uttar Pradesh", pincode: "201301" },
        items: [
            { productId: "prod_chyawanprash", name: "Ancestral Chyawanprash", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 1099, category: "health" },
            { productId: "prod_amla_murabba", name: "Amla Murabba", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 499, category: "murabba" }
        ],
        subtotal: 1598,
        total: 1598,
        finalAmount: 1598,
        paymentMethod: "Card (Axis)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "BlueDart",
        trackingNumber: "BD-88391029",
        createdAt: "2026-09-24T08:45:00+05:30"
    },
    {
        id: "ORD-2026-8809",
        source: "online",
        name: "Pooja Malhotra",
        customerName: "Pooja Malhotra",
        email: "pooja.malhotra88@gmail.com",
        phone: "+91 98102 77319",
        customerPhone: "+91 98102 77319",
        address: "House 55, Model Town, Jalandhar - 144003",
        shippingAddress: { line1: "House 55, Model Town", city: "Jalandhar", state: "Punjab", pincode: "144003" },
        items: [
            { productId: "prod_laal_mirch_achar", name: "Laal Mirch ka Achar", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 550, category: "achar" },
            { productId: "prod_hari_mirch_achar", name: "Hari Mirch ka Achar", variantId: "var_250g", variant: "250 g", qty: 1, price: 129, category: "achar" },
            { productId: "prod_nimbu_achar", name: "Khatta Meetha Nimbu Achar", variantId: "var_250g", variant: "250 g", qty: 1, price: 139, category: "achar" }
        ],
        subtotal: 818,
        total: 818,
        finalAmount: 818,
        paymentMethod: "UPI (PhonePe)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "Delhivery Express",
        trackingNumber: "DEL-66281902",
        createdAt: "2026-09-23T19:20:00+05:30"
    },
    {
        id: "ORD-2026-8810",
        source: "online",
        name: "Manish Tiwari",
        customerName: "Manish Tiwari",
        email: "tiwari.manish@bhu.ac.in",
        phone: "+91 94500 11928",
        customerPhone: "+91 94500 11928",
        address: "Professors Colony, Banaras Hindu University, Varanasi - 221005",
        shippingAddress: { line1: "Professors Colony, BHU", city: "Varanasi", state: "Uttar Pradesh", pincode: "221005" },
        items: [
            { productId: "prod_gond_laddu", name: "Shuddh Desi Ghee Gond Laddu", variantId: "var_500g", variant: "500 g", qty: 1, price: 499, category: "sweets" },
            { productId: "prod_besan_laddu", name: "Besan Dry Fruit Laddu", variantId: "var_500g", variant: "500 g", qty: 1, price: 449, category: "sweets" }
        ],
        subtotal: 948,
        total: 948,
        finalAmount: 948,
        paymentMethod: "COD",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        createdAt: "2026-09-23T11:05:00+05:30"
    },
    {
        id: "ORD-2026-8811",
        source: "online",
        name: "Radhika Sen",
        customerName: "Radhika Sen",
        email: "radhika.sen@calcutta-art.org",
        phone: "+91 98300 48291",
        customerPhone: "+91 98300 48291",
        address: "Flat 2A, Ballygunge Circular Road, Kolkata - 700019",
        shippingAddress: { line1: "Flat 2A, Ballygunge Circular Road", city: "Kolkata", state: "West Bengal", pincode: "700019" },
        items: [
            { productId: "prod_aam_achar", name: "Aam ka Achar", variantId: "var_500g", variant: "500 g", qty: 1, price: 249, category: "achar" },
            { productId: "prod_amla_chutney", name: "Amla ki Chutney", variantId: "var_500g", variant: "500 g", qty: 1, price: 239, category: "achar" },
            { productId: "prod_seb_murabba", name: "Seb ka Murabba", variantId: "var_500g", variant: "500 g", qty: 1, price: 349, category: "murabba" }
        ],
        subtotal: 837,
        total: 837,
        finalAmount: 837,
        paymentMethod: "UPI (Google Pay)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "India Post Speed Post",
        trackingNumber: "EK7738192IN",
        createdAt: "2026-09-22T22:30:00+05:30"
    },
    {
        id: "ORD-2026-8812",
        source: "online",
        name: "Sanjay Singhania",
        customerName: "Sanjay Singhania",
        email: "sanjay.singhania@corp.in",
        phone: "+91 99881 22910",
        customerPhone: "+91 99881 22910",
        address: "14/8, Mall Road, Kanpur - 208001",
        shippingAddress: { line1: "14/8, Mall Road", city: "Kanpur", state: "Uttar Pradesh", pincode: "208001" },
        items: [
            { productId: "prod_lhsun_achar", name: "Lahsun ka Achar", variantId: "var_500g", variant: "500 g", qty: 2, price: 289, category: "achar" },
            { productId: "prod_mix_veg_achar", name: "Mix Veg Achar", variantId: "var_500g", variant: "500 g", qty: 1, price: 249, category: "achar" }
        ],
        subtotal: 827,
        total: 827,
        finalAmount: 827,
        paymentMethod: "Card (HDFC)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "Delhivery Express",
        trackingNumber: "DEL-55192810",
        createdAt: "2026-09-22T15:10:00+05:30"
    },
    {
        id: "ORD-2026-8813",
        source: "online",
        name: "Tanvi Agarwal",
        customerName: "Tanvi Agarwal",
        email: "tanvi.ag@yahoo.com",
        phone: "+91 97110 88201",
        customerPhone: "+91 97110 88201",
        address: "Plot 19, Gomti Nagar, Extension 4, Lucknow - 226010",
        shippingAddress: { line1: "Plot 19, Gomti Nagar, Ext 4", city: "Lucknow", state: "Uttar Pradesh", pincode: "226010" },
        items: [
            { productId: "prod_besan_barfi", name: "Besan Barfi", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 529, category: "sweets" },
            { productId: "prod_chyawanprash", name: "Ancestral Chyawanprash", variantId: "var_500g", variant: "500 g", qty: 1, price: 599, category: "health" }
        ],
        subtotal: 1128,
        total: 1128,
        finalAmount: 1128,
        paymentMethod: "UPI (Paytm)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "BlueDart",
        trackingNumber: "BD-77291039",
        createdAt: "2026-09-21T18:40:00+05:30"
    },
    {
        id: "ORD-2026-8814",
        source: "online",
        name: "Harish Verma",
        customerName: "Harish Verma",
        email: "verma.harish@mp.gov.in",
        phone: "+91 94250 33819",
        customerPhone: "+91 94250 33819",
        address: "Bungalow 7, Arera Colony, Bhopal - 462016",
        shippingAddress: { line1: "Bungalow 7, Arera Colony", city: "Bhopal", state: "Madhya Pradesh", pincode: "462016" },
        items: [
            { productId: "prod_amla_murabba", name: "Amla Murabba", variantId: "var_1kg", variant: "1 kg", qty: 1, price: 499, category: "murabba" },
            { productId: "prod_amla_juice", name: "Sun-cured Amla Juice", variantId: "var_500ml", variant: "500 ml", qty: 2, price: 199, category: "health" }
        ],
        subtotal: 897,
        total: 897,
        finalAmount: 897,
        paymentMethod: "NetBanking (SBI)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "India Post Speed Post",
        trackingNumber: "EK6628190IN",
        createdAt: "2026-09-21T07:50:00+05:30"
    },
    {
        id: "ORD-2026-8815",
        source: "online",
        name: "Siddharth Banerjee",
        customerName: "Siddharth Banerjee",
        email: "sid.banerjee@techstart.io",
        phone: "+91 98450 67123",
        customerPhone: "+91 98450 67123",
        address: "401, Ferns Paradise, Outer Ring Road, Marathahalli, Bengaluru - 560037",
        shippingAddress: { line1: "401, Ferns Paradise, Outer Ring Rd", city: "Bengaluru", state: "Karnataka", pincode: "560037" },
        items: [
            { productId: "prod_laal_mirch_achar", name: "Laal Mirch ka Achar", variantId: "var_500g", variant: "500 g", qty: 1, price: 299, category: "achar" },
            { productId: "prod_hari_mirch_achar", name: "Hari Mirch ka Achar", variantId: "var_500g", variant: "500 g", qty: 1, price: 229, category: "achar" },
            { productId: "prod_gond_laddu", name: "Shuddh Desi Ghee Gond Laddu", variantId: "var_500g", variant: "500 g", qty: 1, price: 499, category: "sweets" }
        ],
        subtotal: 1027,
        total: 1027,
        finalAmount: 1027,
        paymentMethod: "UPI (Google Pay)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        courierPartner: "BlueDart",
        trackingNumber: "BD-66192837",
        createdAt: "2026-09-20T17:15:00+05:30"
    },
    {
        id: "ORD-2026-8816",
        source: "online",
        name: "Nandini Rao",
        customerName: "Nandini Rao",
        email: "nandini.rao@gmail.com",
        phone: "+91 99001 55291",
        customerPhone: "+91 99001 55291",
        address: "Villa 32, Prestige Palms, Whitefield, Bengaluru - 560066",
        shippingAddress: { line1: "Villa 32, Prestige Palms", city: "Bengaluru", state: "Karnataka", pincode: "560066" },
        items: [
            { productId: "prod_amla_powder", name: "Amla Powder", variantId: "var_500g", variant: "500 g", qty: 2, price: 349, category: "health" },
            { productId: "prod_chyawanprash", name: "Ancestral Chyawanprash", variantId: "var_500g", variant: "500 g", qty: 1, price: 599, category: "health" }
        ],
        subtotal: 1297,
        total: 1297,
        finalAmount: 1297,
        paymentMethod: "UPI (PhonePe)",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "confirmed",
        createdAt: "2026-09-26T13:30:00+05:30"
    }
];

const SEED_OFFLINE_ORDERS = [
    {
        id: "SS-OFF-1001",
        source: "offline",
        type: "offline_pos",
        name: "Ramesh Gupta (Varanasi Store Pickup)",
        customerName: "Ramesh Gupta (Varanasi Store Pickup)",
        phone: "+91 94152 01829",
        customerPhone: "+91 94152 01829",
        address: "In-Store Counter Pickup, Assi Ghat Store",
        items: [
            { productId: "prod_aam_achar", name: "Aam ka Achar", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 2, price: 450, category: "achar" },
            { productId: "prod_besan_laddu", name: "Besan Dry Fruit Laddu", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 1, price: 449, category: "sweets" }
        ],
        subtotal: 1349,
        total: 1349,
        finalAmount: 1349,
        paymentMethod: "UPI",
        paymentMode: "UPI",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "Main Store Counter",
        cashier: "Store Manager - Amit",
        date: "2026-09-26",
        createdAt: "2026-09-26T11:20:00+05:30"
    },
    {
        id: "SS-OFF-1002",
        source: "offline",
        type: "offline_pos",
        name: "Priya Sharma (Phone Order)",
        customerName: "Priya Sharma (Phone Order)",
        phone: "+91 98390 12844",
        customerPhone: "+91 98390 12844",
        address: "Brij Enclave, Colony Gate 2, Varanasi",
        items: [
            { productId: "prod_gond_laddu", name: "Shuddh Desi Ghee Gond Laddu", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 1, price: 949, category: "sweets" },
            { productId: "prod_chyawanprash", name: "Ancestral Chyawanprash", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 1, price: 599, category: "health" }
        ],
        subtotal: 1548,
        total: 1548,
        finalAmount: 1548,
        paymentMethod: "Khata",
        paymentMode: "Khata",
        paymentStatus: "pending",
        paymentVerified: false,
        status: "confirmed",
        posCounter: "Phone Order Desk",
        cashier: "Devendra (Sales Lead)",
        date: "2026-09-26",
        createdAt: "2026-09-26T10:05:00+05:30",
        notes: "Recorded in customer credit ledger (Khata)."
    },
    {
        id: "SS-OFF-1003",
        source: "offline",
        type: "offline_pos",
        name: "Kashi Mela Stall Sale",
        customerName: "Kashi Mela Stall Sale",
        phone: "Walk-in Festival Customers",
        customerPhone: "Walk-in Festival Customers",
        address: "Kashi Sanskriti Mela Stall #14, Rajghat",
        items: [
            { productId: "prod_hari_mirch_achar", name: "Hari Mirch ka Achar", variantId: "var_250g", variant: "250 g", weightGrams: 250, qty: 4, price: 129, category: "achar" },
            { productId: "prod_laal_mirch_achar", name: "Laal Mirch ka Achar", variantId: "var_250g", variant: "250 g", weightGrams: 250, qty: 3, price: 179, category: "achar" },
            { productId: "prod_amla_murabba", name: "Amla Murabba", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 2, price: 279, category: "murabba" }
        ],
        subtotal: 1611,
        total: 1611,
        finalAmount: 1611,
        paymentMethod: "Cash",
        paymentMode: "Cash",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "Mela Stall Counter",
        cashier: "Stall Volunteer - Rohit",
        date: "2026-09-25",
        createdAt: "2026-09-25T18:30:00+05:30"
    },
    {
        id: "SS-OFF-1004",
        source: "offline",
        type: "offline_pos",
        name: "Mahant Ji (Assi Ghat Ashram Bulk)",
        customerName: "Mahant Ji (Assi Ghat Ashram Bulk)",
        phone: "+91 94505 88210",
        customerPhone: "+91 94505 88210",
        address: "Shri Ram Ashram, Assi Ghat, Varanasi",
        items: [
            { productId: "prod_aam_achar", name: "Aam ka Achar", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 5, price: 450, category: "achar" },
            { productId: "prod_nimbu_achar", name: "Khatta Meetha Nimbu Achar", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 3, price: 430, category: "achar" },
            { productId: "prod_gond_laddu", name: "Shuddh Desi Ghee Gond Laddu", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 2, price: 949, category: "sweets" }
        ],
        subtotal: 5438,
        total: 5438,
        finalAmount: 5438,
        paymentMethod: "Cash",
        paymentMode: "Cash",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "Main Store Counter",
        cashier: "Store Manager - Amit",
        date: "2026-09-25",
        createdAt: "2026-09-25T14:15:00+05:30",
        notes: "Ashram bulk procurement discount applied."
    },
    {
        id: "SS-OFF-1005",
        source: "offline",
        type: "offline_pos",
        name: "Anand Kumar (Walk-in Customer)",
        customerName: "Anand Kumar (Walk-in Customer)",
        phone: "+91 98391 77210",
        customerPhone: "+91 98391 77210",
        address: "Lanka, Near BHU Main Gate, Varanasi",
        items: [
            { productId: "prod_chyawanprash", name: "Ancestral Chyawanprash", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 1, price: 1099, category: "health" },
            { productId: "prod_besan_barfi", name: "Besan Barfi", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 1, price: 279, category: "sweets" }
        ],
        subtotal: 1378,
        total: 1378,
        finalAmount: 1378,
        paymentMethod: "Card",
        paymentMode: "Card",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "POS Machine #1",
        cashier: "Cashier Counter",
        date: "2026-09-25",
        createdAt: "2026-09-25T11:45:00+05:30"
    },
    {
        id: "SS-OFF-1006",
        source: "offline",
        type: "offline_pos",
        name: "Shubham Pathak (Direct WhatsApp Booking)",
        customerName: "Shubham Pathak (Direct WhatsApp Booking)",
        phone: "+91 99350 44102",
        customerPhone: "+91 99350 44102",
        address: "Order picked up by Rapido driver",
        items: [
            { productId: "prod_laal_mirch_achar", name: "Laal Mirch ka Achar", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 2, price: 299, category: "achar" },
            { productId: "prod_besan_laddu", name: "Besan Dry Fruit Laddu", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 1, price: 849, category: "sweets" }
        ],
        subtotal: 1447,
        total: 1447,
        finalAmount: 1447,
        paymentMethod: "UPI",
        paymentMode: "UPI",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "WhatsApp Direct Desk",
        cashier: "Devendra (Sales Lead)",
        date: "2026-09-24",
        createdAt: "2026-09-24T17:10:00+05:30"
    },
    {
        id: "SS-OFF-1007",
        source: "offline",
        type: "offline_pos",
        name: "Sarla Devi (Brij Enclave Home Delivery)",
        customerName: "Sarla Devi (Brij Enclave Home Delivery)",
        phone: "+91 94150 99201",
        customerPhone: "+91 94150 99201",
        address: "House 18, Brij Enclave, Varanasi",
        items: [
            { productId: "prod_kareli_achar", name: "Kareli ka Achar", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 1, price: 269, category: "achar" },
            { productId: "prod_lhsun_achar", name: "Lahsun ka Achar", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 1, price: 289, category: "achar" },
            { productId: "prod_amla_chutney", name: "Amla ki Chutney", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 1, price: 239, category: "achar" }
        ],
        subtotal: 797,
        total: 797,
        finalAmount: 797,
        paymentMethod: "Cash",
        paymentMode: "Cash",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "Local Delivery Counter",
        cashier: "Store Delivery Boy",
        date: "2026-09-24",
        createdAt: "2026-09-24T12:30:00+05:30"
    },
    {
        id: "SS-OFF-1008",
        source: "offline",
        type: "offline_pos",
        name: "Varanasi Heritage Walk Tour Group",
        customerName: "Varanasi Heritage Walk Tour Group",
        phone: "+91 98100 23456 (Tour Guide Vikram)",
        customerPhone: "+91 98100 23456 (Tour Guide Vikram)",
        address: "Group Tasting Souvenir Pack, Assi Ghat",
        items: [
            { productId: "prod_aam_achar", name: "Aam ka Achar", variantId: "var_250g", variant: "250 g", weightGrams: 250, qty: 6, price: 149, category: "achar" },
            { productId: "prod_laal_mirch_achar", name: "Laal Mirch ka Achar", variantId: "var_250g", variant: "250 g", weightGrams: 250, qty: 4, price: 179, category: "achar" },
            { productId: "prod_besan_laddu", name: "Besan Dry Fruit Laddu", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 2, price: 449, category: "sweets" }
        ],
        subtotal: 2508,
        total: 2508,
        finalAmount: 2508,
        paymentMethod: "Card",
        paymentMode: "Card",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "POS Machine #2",
        cashier: "Store Manager - Amit",
        date: "2026-09-23",
        createdAt: "2026-09-23T16:45:00+05:30"
    },
    {
        id: "SS-OFF-1009",
        source: "offline",
        type: "offline_pos",
        name: "Gauri Shankar Misthan (Wholesale Sample)",
        customerName: "Gauri Shankar Misthan (Wholesale Sample)",
        phone: "+91 94158 33100",
        customerPhone: "+91 94158 33100",
        address: "Godowlia Chowk, Varanasi",
        items: [
            { productId: "prod_gond_laddu", name: "Shuddh Desi Ghee Gond Laddu", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 2, price: 949, category: "sweets" },
            { productId: "prod_besan_barfi", name: "Besan Barfi", variantId: "var_1kg", variant: "1 kg", weightGrams: 1000, qty: 2, price: 529, category: "sweets" }
        ],
        subtotal: 2956,
        total: 2956,
        finalAmount: 2956,
        paymentMethod: "Khata",
        paymentMode: "Khata",
        paymentStatus: "pending",
        paymentVerified: false,
        status: "delivered",
        posCounter: "B2B / Wholesale Desk",
        cashier: "Devendra (Sales Lead)",
        date: "2026-09-23",
        createdAt: "2026-09-23T10:15:00+05:30"
    },
    {
        id: "SS-OFF-1010",
        source: "offline",
        type: "offline_pos",
        name: "Subhash Chandra (Sankat Mochan Mandir Visitor)",
        customerName: "Subhash Chandra (Sankat Mochan Mandir Visitor)",
        phone: "+91 97920 11928",
        customerPhone: "+91 97920 11928",
        address: "Sankat Mochan Saket Nagar, Varanasi",
        items: [
            { productId: "prod_chyawanprash", name: "Ancestral Chyawanprash", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 1, price: 599, category: "health" },
            { productId: "prod_amla_murabba", name: "Amla Murabba", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 1, price: 279, category: "murabba" }
        ],
        subtotal: 878,
        total: 878,
        finalAmount: 878,
        paymentMethod: "UPI",
        paymentMode: "UPI",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "Main Store Counter",
        cashier: "Store Counter",
        date: "2026-09-22",
        createdAt: "2026-09-22T19:00:00+05:30"
    },
    {
        id: "SS-OFF-1011",
        source: "offline",
        type: "offline_pos",
        name: "Dr. Amit Dubey (Clinic Counter Order)",
        customerName: "Dr. Amit Dubey (Clinic Counter Order)",
        phone: "+91 98399 44019",
        customerPhone: "+91 98399 44019",
        address: "Dubey Ayurvedic Clinic, Sigra, Varanasi",
        items: [
            { productId: "prod_amla_juice", name: "Sun-cured Amla Juice", variantId: "var_1l", variant: "1 L", weightGrams: 1000, qty: 3, price: 349, category: "health" },
            { productId: "prod_amla_powder", name: "Amla Powder", variantId: "var_500g", variant: "500 g", weightGrams: 500, qty: 2, price: 349, category: "health" }
        ],
        subtotal: 1745,
        total: 1745,
        finalAmount: 1745,
        paymentMethod: "UPI",
        paymentMode: "UPI",
        paymentStatus: "paid",
        paymentVerified: true,
        status: "delivered",
        posCounter: "Phone / Clinic Order",
        cashier: "Store Manager - Amit",
        date: "2026-09-22",
        createdAt: "2026-09-22T13:20:00+05:30"
    }
];

const SEED_EXPENSES = [
    {
        id: "EXP-2026-001",
        type: "expense",
        category: "Spices & Oils",
        desc: "100 Litres Pure Cold-Pressed Kacchi Ghani Mustard Oil (Varanasi Oil Mill)",
        amount: 16500,
        date: "2026-09-24",
        paymentMode: "Bank Transfer",
        receiptRef: "VOM-2026-88",
        createdAt: "2026-09-24T11:00:00+05:30"
    },
    {
        id: "EXP-2026-002",
        type: "expense",
        category: "Packaging",
        desc: "Bulk Order 500x 500g Food-Grade Hexagonal Glass Jars (Firozabad Glass Works)",
        amount: 8750,
        date: "2026-09-23",
        paymentMode: "NEFT",
        receiptRef: "FGW-44102",
        createdAt: "2026-09-23T14:30:00+05:30"
    },
    {
        id: "EXP-2026-003",
        type: "expense",
        category: "Raw Produce",
        desc: "Raw Organic Green Mangoes (Ramnagar Orchards 250kg)",
        amount: 11250,
        date: "2026-09-22",
        paymentMode: "Cash",
        receiptRef: "RO-2026-19",
        createdAt: "2026-09-22T08:15:00+05:30"
    },
    {
        id: "EXP-2026-004",
        type: "expense",
        category: "Raw Produce",
        desc: "Organic Whole Spices (Kalonji, Saunf, Methi, Yellow Mustard, Hing) - Majithia Spices",
        amount: 7400,
        date: "2026-09-21",
        paymentMode: "UPI",
        receiptRef: "MS-77192",
        createdAt: "2026-09-21T16:20:00+05:30"
    },
    {
        id: "EXP-2026-005",
        type: "expense",
        category: "Packaging",
        desc: "Corrugated Shipping Cartons & 5-Layer Honeycomb Bubble Wrap (Box King)",
        amount: 5300,
        date: "2026-09-20",
        paymentMode: "UPI",
        receiptRef: "BK-99120",
        createdAt: "2026-09-20T10:45:00+05:30"
    },
    {
        id: "EXP-2026-006",
        type: "expense",
        category: "Raw Produce",
        desc: "Desi Gir Cow A2 Ghee 30kg Batch (Vrindavan Gaushala Trust)",
        amount: 28500,
        date: "2026-09-19",
        paymentMode: "NEFT",
        receiptRef: "VGT-88192",
        createdAt: "2026-09-19T12:00:00+05:30"
    },
    {
        id: "EXP-2026-007",
        type: "expense",
        category: "Marketing",
        desc: "Assi Ghat Stall Electricity & Exhibition Stall Rental Fee",
        amount: 3500,
        date: "2026-09-18",
        paymentMode: "Cash",
        receiptRef: "KMC-0918",
        createdAt: "2026-09-18T17:30:00+05:30"
    },
    {
        id: "EXP-2026-008",
        type: "expense",
        category: "Logistics",
        desc: "Local Tempo Delivery & Dispatch Transport (Varanasi to Hub)",
        amount: 1800,
        date: "2026-09-17",
        paymentMode: "Cash",
        receiptRef: "TRP-1092",
        createdAt: "2026-09-17T09:15:00+05:30"
    },
    {
        id: "EXP-2026-009",
        type: "income",
        category: "POS Cash Tally",
        desc: "Daily Store Counter Cash Register Gross Tally",
        amount: 12450,
        date: "2026-09-25",
        paymentMode: "Cash",
        receiptRef: "POS-2026-0925",
        createdAt: "2026-09-25T21:00:00+05:30"
    },
    {
        id: "EXP-2026-010",
        type: "income",
        category: "POS Cash Tally",
        desc: "Daily Store Counter Cash Register Gross Tally",
        amount: 14800,
        date: "2026-09-24",
        paymentMode: "Cash",
        receiptRef: "POS-2026-0924",
        createdAt: "2026-09-24T21:00:00+05:30"
    }
];

const SEED_REVIEWS = [
    {
        id: "REV-120",
        author: "Pooja Singhania",
        customerName: "Pooja Singhania",
        city: "Varanasi",
        productId: "prod_diwali_laddu",
        productName: "Diwali Festive Laddu",
        rating: 5,
        title: "Festive Joy in Every Bite!",
        text: "Ordered Diwali Festive Laddus for our family pooja. The pure desi cow ghee aroma and roasted dry fruits made everyone ask where we got them from!",
        date: "2026-10-28",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.99
    },
    {
        id: "REV-121",
        author: "Sadhna Upadhyay",
        customerName: "Sadhna Upadhyay",
        city: "Gorakhpur",
        productId: "prod_singhada_laddu",
        productName: "Singhada Laddu",
        rating: 5,
        title: "Perfect for Ekadashi & Navratri Vrat",
        text: "Finally a 100% pure vrat sweet made with fresh Singhada flour and A2 desi ghee. Kept us energized throughout the fasting day.",
        date: "2026-10-26",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.98
    },
    {
        id: "REV-111",
        author: "Shalini Bansal",
        customerName: "Shalini Bansal",
        city: "Chandigarh",
        productId: "prod_amla_achar",
        productName: "Amla ka Achar",
        rating: 5,
        title: "Tangy & Immunity Booster",
        text: "The spicy amla achar is packed with hing and mustard seeds. Extremely appetizing with parathas and pure cold-pressed mustard oil flavor.",
        date: "2026-09-15",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.96
    },
    {
        id: "REV-112",
        author: "Girish Mehra",
        customerName: "Girish Mehra",
        city: "Dehradun",
        productId: "prod_amla_chutney",
        productName: "Amla ki Chutney",
        rating: 4,
        title: "Zesty Banarasi Chutney",
        text: "Sour and sweet balance is top notch. Slightly finer amla grating would make it 5/5, but taste is authentically handmade.",
        date: "2026-09-14",
        verified: true,
        featured: false,
        sentiment: "positive",
        sentimentScore: 0.85
    },
    {
        id: "REV-113",
        author: "Manish Tewari",
        customerName: "Manish Tewari",
        city: "Kanpur",
        productId: "prod_kathal_achar",
        productName: "Kathal ka Achar",
        rating: 4,
        title: "Meaty Jackfruit Texture",
        text: "Very few brands make traditional Kathal achar right. The tender raw jackfruit chunks retain a juicy bite. Perfect oil preservation.",
        date: "2026-09-13",
        verified: true,
        featured: false,
        sentiment: "positive",
        sentimentScore: 0.87
    },
    {
        id: "REV-114",
        author: "Divya Nambiar",
        customerName: "Divya Nambiar",
        city: "Kochi",
        productId: "prod_amda_achar",
        productName: "Banarasi Amda ka Achar",
        rating: 5,
        title: "Rare Heritage Taste!",
        text: "So thrilled to find authentic Indian Hog Plum (Amda) pickle online. The tanginess mixed with Banarasi roasted spices is exceptional.",
        date: "2026-09-12",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.98
    },
    {
        id: "REV-115",
        author: "Sanjay Singhal",
        customerName: "Sanjay Singhal",
        city: "Gurugram",
        productId: "prod_seb_murabba",
        productName: "Kashmiri Seb Murabba",
        rating: 4,
        title: "Delicious Crisp Apples",
        text: "Whole organic apples steeped in light saffron syrup. My parents love having one every morning for cardiac wellness.",
        date: "2026-09-11",
        verified: true,
        featured: false,
        sentiment: "positive",
        sentimentScore: 0.86
    },
    {
        id: "REV-116",
        author: "Kiran Mazumdar",
        customerName: "Kiran Mazumdar",
        city: "Indore",
        productId: "prod_besan_barfi",
        productName: "Besan Barfi",
        rating: 5,
        title: "Melt in Mouth Desi Ghee",
        text: "Slow-roasted chana flour roasted to golden bliss with desi ghee. Pistachio topping adds great crunch.",
        date: "2026-09-10",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.97
    },
    {
        id: "REV-117",
        author: "Vikas Pathak",
        customerName: "Vikas Pathak",
        city: "Varanasi",
        productId: "prod_amla_powder",
        productName: "Shuddh Organic Amla Powder",
        rating: 3,
        title: "Pure but Bitter for Kids",
        text: "Zero chemical preservatives definitely, very bitter and potent. Adults can drink with warm water, difficult for children without honey.",
        date: "2026-09-09",
        verified: false,
        featured: false,
        sentiment: "neutral",
        sentimentScore: 0.54
    },
    {
        id: "REV-118",
        author: "Ritu Saxena",
        customerName: "Ritu Saxena",
        city: "Bhopal",
        productId: "prod_amla_juice",
        productName: "Cold-Pressed Amla Juice",
        rating: 4,
        title: "Pure Vitamin C Kick",
        text: "No added water, true fresh amla extract. Packaging was completely leak-proof.",
        date: "2026-09-08",
        verified: true,
        featured: false,
        sentiment: "positive",
        sentimentScore: 0.89
    },

    {
        id: "REV-101",
        author: "Priya Sharma",
        customerName: "Priya Sharma",
        city: "Lucknow",
        productId: "prod_aam_achar",
        productName: "Aam ka Achar",
        rating: 5,
        title: "Taste of Nani's Hand!",
        text: "The Aam ka Achar tastes exactly like what my Dadi used to sun-cure in big earthen barnis on the terrace in Banaras. The mustard oil aroma is unmatched!",
        date: "2026-09-25",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.98
    },
    {
        id: "REV-102",
        author: "Dr. Alok Tripathi",
        customerName: "Dr. Alok Tripathi",
        city: "New Delhi",
        productId: "prod_gond_laddu",
        productName: "Shuddh Desi Ghee Gond Laddu",
        rating: 5,
        title: "Incredible Quality & Purity",
        text: "Ordered the Desi Ghee Gond Laddus for postpartum recovery for my sister. Extremely nutritious, authentic crunch of gond, not overly sweet. Pure purity.",
        date: "2026-09-24",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.99
    },
    {
        id: "REV-103",
        author: "Vikramaditya Rao",
        customerName: "Vikramaditya Rao",
        city: "Bengaluru",
        productId: "prod_chyawanprash",
        productName: "Ancestral Chyawanprash",
        rating: 5,
        title: "Vedic Recipe That Actually Works",
        text: "Ancestral Chyawanprash is genuinely different from commercial chemical brands. Thick texture, real honey and amla tang, warms the throat immediately.",
        date: "2026-09-23",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.96
    },
    {
        id: "REV-104",
        author: "Sunita Nair",
        customerName: "Sunita Nair",
        city: "Mumbai",
        productId: "prod_hari_mirch_achar",
        productName: "Hari Mirch ka Achar",
        rating: 4,
        title: "Very Crisp & Punchy",
        text: "Hari Mirch achar is delightfully spicy and fresh. Sliced bite-sized chillies with generous lemon-mustard tempering. Deducting 1 star only because Delhivery took 4 days.",
        date: "2026-09-22",
        verified: true,
        featured: false,
        sentiment: "positive",
        sentimentScore: 0.82
    },
    {
        id: "REV-105",
        author: "Rajeshwari Iyer",
        customerName: "Rajeshwari Iyer",
        city: "Chennai",
        productId: "prod_amla_murabba",
        productName: "Amla Murabba",
        rating: 5,
        title: "Juicy and Translucent",
        text: "Amla Murabba is translucent, juicy, and infused with real elaichi & saffron. Each piece is succulent without being overly sugary.",
        date: "2026-09-21",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.97
    },
    {
        id: "REV-106",
        author: "K. Ramachandra",
        customerName: "K. Ramachandra",
        city: "Hyderabad",
        productId: "prod_besan_laddu",
        productName: "Besan Dry Fruit Laddu",
        rating: 4,
        title: "Fragrant Desi Ghee",
        text: "Besan Dry Fruit Laddus were rich and fragrant with A2 ghee. Packaging was superb in a sturdy tin, zero breakage during transit to Hyderabad.",
        date: "2026-09-20",
        verified: true,
        featured: false,
        sentiment: "positive",
        sentimentScore: 0.88
    },
    {
        id: "REV-107",
        author: "Mohit Agarwal",
        customerName: "Mohit Agarwal",
        city: "Jaipur",
        productId: "prod_aam_achar",
        productName: "Aam ka Achar",
        rating: 3,
        title: "Good Pickle, Slow Courier",
        text: "Pickle taste is genuine, but delivery courier partner arrived 2 days late without calling first. Product 5 stars, delivery service 2 stars.",
        date: "2026-09-19",
        verified: true,
        featured: false,
        sentiment: "neutral",
        sentimentScore: 0.50
    },
    {
        id: "REV-108",
        author: "Neha Kulkarni",
        customerName: "Neha Kulkarni",
        city: "Pune",
        productId: "prod_laal_mirch_achar",
        productName: "Laal Mirch ka Achar",
        rating: 3,
        title: "Fiery Traditional Heat",
        text: "The Laal Mirch Bharwa is very spicy for mild palates. Authentic Banarasi flavor definitely, but keep water handy! Would appreciate a mild spice variant option.",
        date: "2026-09-18",
        verified: true,
        featured: false,
        sentiment: "neutral",
        sentimentScore: 0.52
    },
    {
        id: "REV-109",
        author: "Tarun Ghosh",
        customerName: "Tarun Ghosh",
        city: "Kolkata",
        productId: "prod_nimbu_achar",
        productName: "Khatta Meetha Nimbu Achar",
        rating: 1,
        title: "Damaged Outer Box by Courier",
        text: "Outer parcel carton was heavily dented by the courier boy. Fortunately glass jar bubble wrap prevented leakage, but delivery experience was stressful.",
        date: "2026-09-17",
        verified: true,
        featured: false,
        sentiment: "negative",
        sentimentScore: 0.15
    },
    {
        id: "REV-110",
        author: "Anand Mathur",
        customerName: "Anand Mathur",
        city: "Ahmedabad",
        productId: "prod_aam_achar",
        productName: "In-Store Experience",
        rating: 5,
        title: "Unforgettable Varanasi Store Visit",
        text: "Visited their store pickup in Varanasi during Dev Deepawali. The warmth of the owners and the pure satvik ingredients made me a lifetime customer.",
        date: "2026-09-16",
        verified: true,
        featured: true,
        sentiment: "positive",
        sentimentScore: 0.99
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. UNIFIED ADMIN DATA ADAPTER CLASS
// ─────────────────────────────────────────────────────────────────────────────

const memoryStore = {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};

function getStorage() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
        if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return memoryStore;
}

const SEED_SUBSCRIBERS = [
    {
        id: "sub_1730001001",
        email: "priya.sharma92@gmail.com",
        source: "storefront_footer",
        status: "active",
        createdAt: "2026-11-08T18:45:00.000Z"
    },
    {
        id: "sub_1730001002",
        email: "alok.tripathi.delhi@yahoo.com",
        source: "storefront_footer",
        status: "active",
        createdAt: "2026-11-08T14:30:00.000Z"
    },
    {
        id: "sub_1730001003",
        email: "rajeshwari.iyer@outlook.com",
        source: "storefront_footer",
        status: "active",
        createdAt: "2026-11-07T11:15:00.000Z"
    },
    {
        id: "sub_1730001004",
        email: "vikramaditya.rao.blr@gmail.com",
        source: "storefront_footer",
        status: "active",
        createdAt: "2026-11-06T09:20:00.000Z"
    },
    {
        id: "sub_1730001005",
        email: "sunita.verma.lucknow@gmail.com",
        source: "storefront_footer",
        status: "active",
        createdAt: "2026-11-05T16:05:00.000Z"
    },
    {
        id: "sub_1730001006",
        email: "amit.deshmukh.pune@rediffmail.com",
        source: "storefront_footer",
        status: "active",
        createdAt: "2026-11-03T12:40:00.000Z"
    },
    {
        id: "sub_1730001007",
        email: "meenakshi.sundaram@gmail.com",
        source: "storefront_footer",
        status: "active",
        createdAt: "2026-10-28T10:10:00.000Z"
    }
];

export class AdminDataAdapter {
    constructor() {
        this._listeners = new Map();
        this._mode = this._detectInitialMode();
        this._initStorage();
    }

    /**
     * Determines whether we run in local dev mode or cloud firestore mode.
     */
    _detectInitialMode() {
        if (typeof window === 'undefined') return 'dev';
        const override = getStorage().getItem(STORAGE_KEYS.MODE);
        if (override) return override;

        const isLocal = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.protocol === 'file:';
        return isLocal ? 'dev' : 'auto';
    }

    get isDevMode() {
        if (this._mode === 'dev') return true;
        if (this._mode === 'firestore') return false;
        // Auto mode: check hostname or auth claim
        if (typeof window !== 'undefined') {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocal) return true;
        }
        return false;
    }

    /**
     * Initializes storage with seed data if absent or outdated.
     */



    _initStorage() {

        const currentSeedVer = getStorage().getItem(STORAGE_KEYS.SEED_VERSION);
        const shouldReSeed = currentSeedVer !== STORAGE_KEYS.SEED_VERSION;

        // 1. Products
        if (!getStorage().getItem(STORAGE_KEYS.PRODUCTS) || shouldReSeed) {
            getStorage().setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
        }

        // 2. Orders (Online + Offline combined into single store)
        if (!getStorage().getItem(STORAGE_KEYS.ORDERS) || shouldReSeed) {
            const mergedOrders = [...SEED_ONLINE_ORDERS, ...SEED_OFFLINE_ORDERS];
            // Sort newest first
            mergedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            getStorage().setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mergedOrders));
        }

        // 3. Expenses / Offline Finances
        if (!getStorage().getItem(STORAGE_KEYS.EXPENSES) || shouldReSeed) {
            const sortedExpenses = [...SEED_EXPENSES].sort((a, b) => new Date(b.date) - new Date(a.date));
            getStorage().setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(sortedExpenses));
        }

        // 4. Reviews
        if (!getStorage().getItem(STORAGE_KEYS.REVIEWS) || shouldReSeed) {
            getStorage().setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
        } else {
            // Ensure existing reviews have featured property defined
            try {
                const storedReviews = JSON.parse(getStorage().getItem(STORAGE_KEYS.REVIEWS) || '[]');
                let modified = false;
                storedReviews.forEach(r => {
                    if (typeof r.featured !== 'boolean') {
                        const seedMatch = SEED_REVIEWS.find(s => s.id === r.id);
                        r.featured = seedMatch ? Boolean(seedMatch.featured) : (r.rating === 5);
                        modified = true;
                    }
                });
                if (modified) {
                    getStorage().setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(storedReviews));
                }
            } catch (e) {}
        }

        // 4b. Sync Featured Reviews for Storefront Homepage Marquee
        if (!getStorage().getItem(STORAGE_KEYS.FEATURED_REVIEWS) || shouldReSeed) {
            const currentReviews = JSON.parse(getStorage().getItem(STORAGE_KEYS.REVIEWS) || '[]');
            const featuredList = currentReviews.filter(r => r.featured === true);
            const fallbackFeatured = featuredList.length > 0 ? featuredList : SEED_REVIEWS.filter(r => r.featured === true);
            getStorage().setItem(STORAGE_KEYS.FEATURED_REVIEWS, JSON.stringify(fallbackFeatured));
        }

        // 5. Newsletter Subscribers
        if (!getStorage().getItem(STORAGE_KEYS.SUBSCRIBERS)) {
            getStorage().setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(SEED_SUBSCRIBERS));
        } else {
            try {
                const existing = JSON.parse(getStorage().getItem(STORAGE_KEYS.SUBSCRIBERS) || '[]');
                if (!Array.isArray(existing) || existing.length === 0) {
                    getStorage().setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(SEED_SUBSCRIBERS));
                }
            } catch (e) {
                getStorage().setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(SEED_SUBSCRIBERS));
            }
        }

        getStorage().setItem(STORAGE_KEYS.SEED_VERSION, STORAGE_KEYS.SEED_VERSION);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Pub / Sub Event Subscription Engine
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Subscribe to data change events ('orders', 'products', 'offline_finances', 'reviews', '*')
     * Automatically triggers immediate callback with current data for instant render.
     */
    subscribe(eventType, callback) {
        if (!this._listeners.has(eventType)) {
            this._listeners.set(eventType, new Set());
        }
        this._listeners.get(eventType).add(callback);

        // Immediate callback with current snapshot
        try {
            if (eventType === 'orders') callback(this.getOrders());
            else if (eventType === 'online_orders') callback(this.getOnlineOrders());
            else if (eventType === 'offline_orders') callback(this.getOfflineOrders());
            else if (eventType === 'products') callback(this.getProducts());
            else if (eventType === 'offline_finances' || eventType === 'expenses') callback(this.getOfflineFinances());
            else if (eventType === 'reviews') callback(this.getReviews());
        } catch (e) {
            console.warn(`[AdminDataAdapter] Error during immediate subscription callback (${eventType}):`, e);
        }

        // Return unsubscribe closure
        return () => {
            const set = this._listeners.get(eventType);
            if (set) set.delete(callback);
        };
    }

    /**
     * Broadcasts event to all active subscribers.
     */
    _emit(eventType, data) {
        const notify = (cb) => {
            try { cb(data); } catch (err) { console.error(`[AdminDataAdapter] Subscriber error on ${eventType}:`, err); }
        };

        if (this._listeners.has(eventType)) {
            this._listeners.get(eventType).forEach(notify);
        }
        if (this._listeners.has('*')) {
            this._listeners.get('*').forEach(cb => {
                try { cb(eventType, data); } catch (err) { console.error(`[AdminDataAdapter] Wildcard subscriber error:`, err); }
            });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Orders CRUD (Online + Offline)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns all orders (both online and offline), sorted newest first.
     */
    getOrders(filters = {}) {
        let orders = [];
        try {
            orders = JSON.parse(getStorage().getItem(STORAGE_KEYS.ORDERS) || '[]');
        } catch (e) {
            console.error("[AdminDataAdapter] Failed to parse orders from getStorage():", e);
            orders = [];
        }

        if (filters.status && filters.status !== 'all') {
            const st = filters.status.toLowerCase();
            orders = orders.filter(o => (o.status || '').toLowerCase() === st);
        }
        if (filters.source && filters.source !== 'all') {
            const src = filters.source.toLowerCase();
            orders = orders.filter(o => (o.source || '').toLowerCase() === src);
        }

        return orders.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    }

    /**
     * Returns only online orders.
     */
    getOnlineOrders() {
        return this.getOrders().filter(o => o.source === 'online' || !String(o.id).startsWith('SS-OFF-'));
    }

    /**
     * Returns only offline POS orders.
     */
    getOfflineOrders() {
        return this.getOrders().filter(o => o.source === 'offline' || String(o.id).startsWith('SS-OFF-'));
    }

    /**
     * Saves a new offline POS order with unique ID and AUTOMATICALLY DECREMENTS INVENTORY!
     */
    async addOfflineOrder(orderData) {
        const orders = this.getOrders();
        
        // Generate sequential offline ID
        const nextId = this._generateOfflineOrderId(orders);

        const nowIso = new Date().toISOString();
        const dateStr = orderData.date || nowIso.split('T')[0];

        const newOrder = {
            id: orderData.id || nextId,
            source: 'offline',
            type: 'offline_pos',
            name: orderData.name || orderData.customerName || 'Offline POS Customer',
            customerName: orderData.name || orderData.customerName || 'Offline POS Customer',
            phone: orderData.phone || orderData.customerPhone || 'N/A',
            customerPhone: orderData.phone || orderData.customerPhone || 'N/A',
            address: orderData.address || 'In-Store Counter Pickup',
            items: Array.isArray(orderData.items) ? orderData.items : [],
            total: Number(orderData.total || orderData.finalAmount || 0),
            finalAmount: Number(orderData.total || orderData.finalAmount || 0),
            subtotal: Number(orderData.subtotal || orderData.total || 0),
            paymentMethod: orderData.paymentMethod || orderData.paymentMode || 'Cash',
            paymentMode: orderData.paymentMethod || orderData.paymentMode || 'Cash',
            paymentStatus: orderData.paymentStatus || (orderData.paymentMode === 'Khata' ? 'pending' : 'paid'),
            paymentVerified: (orderData.paymentMode !== 'Khata'),
            status: (orderData.status || 'delivered').toLowerCase(),
            posCounter: orderData.posCounter || 'Main Store Counter',
            cashier: orderData.cashier || orderData.recordedBy || 'Store Staff',
            notes: orderData.notes || '',
            date: dateStr,
            createdAt: orderData.createdAt || nowIso,
            updatedAt: nowIso
        };

        // 1. AUTOMATICALLY DECREMENT PRODUCT INVENTORY IN DATABASE
        this._decrementInventoryForOrder(newOrder);

        // 2. Prepend order and persist
        orders.unshift(newOrder);
        getStorage().setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

        // 3. Emit reactive events
        this._emit('orders', orders);
        this._emit('offline_orders', this.getOfflineOrders());

        console.log(`[AdminDataAdapter] Offline POS Order ${newOrder.id} saved & inventory decremented successfully.`);
        return newOrder;
    }

    /**
     * Decrements product and variant stock for an order's items.
     */
    _decrementInventoryForOrder(order) {
        if (!Array.isArray(order.items) || order.items.length === 0) return;

        const products = this.getProducts();
        let changed = false;

        order.items.forEach(item => {
            const qty = Number(item.qty || item.quantity || 1);
            if (qty <= 0) return;

            // Find matching product
            const prod = products.find(p => 
                p.id === item.productId || 
                (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
            );

            if (!prod) {
                console.warn(`[AdminDataAdapter] Product not found in catalog for inventory deduction:`, item);
                return;
            }

            // If variant specified, decrement variant stock
            if (Array.isArray(prod.variants) && prod.variants.length > 0) {
                let variant = null;
                if (item.variantId) {
                    variant = prod.variants.find(v => v.id === item.variantId);
                }
                if (!variant && item.variant) {
                    variant = prod.variants.find(v => v.label.toLowerCase() === String(item.variant).toLowerCase());
                }
                if (!variant) {
                    // Fallback to first active variant
                    variant = prod.variants[0];
                }

                if (variant) {
                    variant.stock = Math.max(0, Number(variant.stock || 0) - qty);
                    changed = true;
                }

                // Recalculate total product stock
                prod.stock = prod.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
            } else {
                prod.stock = Math.max(0, Number(prod.stock || 0) - qty);
                changed = true;
            }
        });

        if (changed) {
            getStorage().setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
            this._emit('products', products);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem('satvik_products_sync', String(Date.now()));
                window.localStorage.setItem('satvik_admin_dev_products', JSON.stringify(products));
                window.dispatchEvent(new CustomEvent('satvik_products_updated', { detail: { productId: target.id, product: target } }));
            } catch (e) {}
        }
        }
    }

    /**
     * Restores product and variant stock if an order is cancelled.
     */
    _restoreInventoryForOrder(order) {
        if (!Array.isArray(order.items) || order.items.length === 0) return;

        const products = this.getProducts();
        let changed = false;

        order.items.forEach(item => {
            const qty = Number(item.qty || item.quantity || 1);
            if (qty <= 0) return;

            const prod = products.find(p => 
                p.id === item.productId || 
                (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
            );

            if (!prod) return;

            if (Array.isArray(prod.variants) && prod.variants.length > 0) {
                let variant = null;
                if (item.variantId) {
                    variant = prod.variants.find(v => v.id === item.variantId);
                }
                if (!variant && item.variant) {
                    variant = prod.variants.find(v => v.label.toLowerCase() === String(item.variant).toLowerCase());
                }
                if (!variant) variant = prod.variants[0];

                if (variant) {
                    variant.stock = Number(variant.stock || 0) + qty;
                    changed = true;
                }
                prod.stock = prod.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
            } else {
                prod.stock = Number(prod.stock || 0) + qty;
                changed = true;
            }
        });

        if (changed) {
            getStorage().setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
            this._emit('products', products);
        }
    }

    /**
     * Updates order status. If transitioned to cancelled, restores inventory stock.
     */
    async updateOrderStatus(orderId, newStatus, meta = {}) {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            throw new Error(`Order #${orderId} not found.`);
        }

        const oldStatus = (order.status || '').toLowerCase();
        const targetStatus = newStatus ? newStatus.toLowerCase() : oldStatus;

        // Inventory lifecycle handling:
        // 1. Transitioning to CANCELLED: restore stock
        if (targetStatus === 'cancelled' && oldStatus !== 'cancelled') {
            this._restoreInventoryForOrder(order);
        }
        // 2. Un-cancelling an order: re-deduct stock
        else if (oldStatus === 'cancelled' && targetStatus !== 'cancelled') {
            this._decrementInventoryForOrder(order);
        }

        // Apply mutations
        if (newStatus) order.status = targetStatus;
        order.updatedAt = new Date().toISOString();
        Object.assign(order, meta);

        // Update in getStorage()
        getStorage().setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

        // If in Cloud Firestore mode, sync if authenticated
        if (!this.isDevMode && typeof window !== 'undefined' && window.db) {
            try {
                const fs = await getFirestoreLib();
                if (fs) {
                    const orderRef = fs.doc(window.db, 'orders', orderId);
                    await fs.updateDoc(orderRef, {
                        ...meta,
                        ...(newStatus ? { status: targetStatus } : {}),
                        updatedAt: fs.serverTimestamp()
                    });
                }
            } catch (err) {
                console.warn("[AdminDataAdapter] Cloud Firestore sync skipped or restricted; retained in local dev storage.", err.message);
            }
        }

        // Notify subscribers
        this._emit('orders', orders);
        return order;
    }

    /**
     * Generates a sequential offline ID like SS-OFF-1012.
     */
    _generateOfflineOrderId(orders) {
        let maxNum = 1000;
        orders.forEach(o => {
            if (o.id && String(o.id).startsWith('SS-OFF-')) {
                const num = parseInt(String(o.id).replace('SS-OFF-', ''), 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        });
        return `SS-OFF-${maxNum + 1}`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Products CRUD & Stock Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns full products catalogue with live stock levels.
     */
    getProducts(filters = {}) {
        let prods = [];
        try {
            prods = JSON.parse(getStorage().getItem(STORAGE_KEYS.PRODUCTS) || '[]');
        } catch (e) {
            prods = [];
        }

        if (filters.category && filters.category !== 'all') {
            const cat = filters.category.toLowerCase();
            prods = prods.filter(p => (p.category || p.cat || '').toLowerCase() === cat);
        }
        if (filters.search) {
            const q = filters.search.toLowerCase();
            prods = prods.filter(p => 
                (p.name || '').toLowerCase().includes(q) ||
                (p.hindiName || '').toLowerCase().includes(q) ||
                (p.sku || '').toLowerCase().includes(q)
            );
        }

        return prods;
    }

    /**
     * Gets a single product by ID.
     */
    getProduct(productId) {
        return this.getProducts().find(p => p.id === productId);
    }

    /**
     * Updates product stock directly, optionally for a specific variant.
     */
    async updateProductStock(productId, variantId, newStock) {
        const products = this.getProducts();
        const prod = products.find(p => p.id === productId);

        if (!prod) {
            throw new Error(`Product ${productId} not found.`);
        }

        const stockNum = Math.max(0, Number(newStock));

        if (variantId && Array.isArray(prod.variants)) {
            const v = prod.variants.find(item => item.id === variantId);
            if (v) {
                v.stock = stockNum;
            }
            prod.stock = prod.variants.reduce((sum, item) => sum + Number(item.stock || 0), 0);
        } else {
            prod.stock = stockNum;
            // Distribute or synchronize first variant
            if (Array.isArray(prod.variants) && prod.variants.length > 0) {
                prod.variants[0].stock = stockNum;
            }
        }

        prod.updatedAt = new Date().toISOString();
        getStorage().setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

        // Firestore sync fallback
        if (!this.isDevMode && typeof window !== 'undefined' && window.db) {
            try {
                const fs = await getFirestoreLib();
                if (fs) {
                    const prodRef = fs.doc(window.db, 'products', productId);
                    await fs.updateDoc(prodRef, {
                        stock: prod.stock,
                        variants: prod.variants || [],
                        updatedAt: fs.serverTimestamp()
                    });
                }
            } catch (err) {
                console.warn("[AdminDataAdapter] Firestore product update skipped or restricted:", err.message);
            }
        }

        this._emit('products', products);
        return prod;
    }

    /**
     * Saves or creates a new product.
     */
    async saveProduct(productData) {
        const products = this.getProducts();
        let target = null;

        if (productData.id) {
            target = products.find(p => p.id === productData.id);
        }

        // Strictly enforce min 1, max 5 images (and sanitize out any javascript: injection)
        if (productData.images && Array.isArray(productData.images)) {
            const validImages = productData.images.filter(im => typeof im === 'string' && im.trim().length > 0 && !/^javascript:/i.test(im.trim())).slice(0, 5);
            if (validImages.length > 0) {
                productData.images = validImages;
                productData.img = validImages[0];
                productData.image = validImages[0];
            } else {
                const fallback = productData.img || productData.image || 'assets/aam-ka-achar.png';
                productData.images = [fallback];
                productData.img = fallback;
                productData.image = fallback;
            }
        } else {
            const fallback = productData.img || productData.image || (target && target.images && target.images[0]) || 'assets/aam-ka-achar.png';
            productData.images = (target && target.images && target.images.length > 0) ? target.images : [fallback];
            productData.img = productData.images[0];
            productData.image = productData.images[0];
        }
        if (target) {
            Object.assign(target, productData, { updatedAt: new Date().toISOString() });
        } else {
            const newId = productData.id || ('prod_' + (productData.name || 'item').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) + '_' + Date.now().toString().slice(-4));
            target = {
                ...productData,
                id: newId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            products.push(target);
        }

        getStorage().setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

        if (!this.isDevMode && typeof window !== 'undefined' && window.db) {
            try {
                const fs = await getFirestoreLib();
                if (fs) {
                    const prodRef = fs.doc(window.db, 'products', target.id);
                    await fs.setDoc(prodRef, { ...target, updatedAt: fs.serverTimestamp() }, { merge: true });
                }
            } catch (err) {
                console.warn("[AdminDataAdapter] Firestore saveProduct skipped/restricted:", err.message);
            }
        }

        this._emit('products', products);
        return target;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Offline Finances & Expenses Ledger
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns offline expenses and income ledger entries, sorted newest first.
     */
    getOfflineFinances() {
        let entries = [];
        try {
            entries = JSON.parse(getStorage().getItem(STORAGE_KEYS.EXPENSES) || '[]');
        } catch (e) {
            entries = [];
        }
        return entries.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    }

    /**
     * Records a new offline expense or income ledger entry.
     */
    async addOfflineExpense(expenseData) {
        const entries = this.getOfflineFinances();
        const year = new Date().getFullYear();
        const nextId = `EXP-${year}-${String(entries.length + 1).padStart(3, '0')}`;

        const entry = {
            id: expenseData.id || nextId,
            type: expenseData.type || 'expense',
            category: expenseData.category || 'General',
            amount: Number(expenseData.amount || 0),
            date: expenseData.date || new Date().toISOString().split('T')[0],
            desc: expenseData.desc || expenseData.description || 'General expenditure',
            paymentMode: expenseData.paymentMode || 'Cash',
            receiptRef: expenseData.receiptRef || '',
            createdAt: expenseData.createdAt || new Date().toISOString()
        };

        entries.unshift(entry);
        getStorage().setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(entries));

        if (!this.isDevMode && typeof window !== 'undefined' && window.db) {
            try {
                const fs = await getFirestoreLib();
                if (fs) {
                    await fs.addDoc(fs.collection(window.db, 'offline_finances'), {
                        ...entry,
                        createdAt: fs.serverTimestamp()
                    });
                }
            } catch (err) {
                console.warn("[AdminDataAdapter] Firestore addOfflineExpense skipped:", err.message);
            }
        }

        this._emit('offline_finances', entries);
        return entry;
    }

    /**
     * Deletes an offline finance record.
     */
    async deleteOfflineExpense(id) {
        let entries = this.getOfflineFinances();
        entries = entries.filter(e => e.id !== id);
        getStorage().setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(entries));

        if (!this.isDevMode && typeof window !== 'undefined' && window.db) {
            try {
                const fs = await getFirestoreLib();
                if (fs) {
                    await fs.deleteDoc(fs.doc(window.db, 'offline_finances', id));
                }
            } catch (err) {
                console.warn("[AdminDataAdapter] Firestore deleteOfflineExpense skipped:", err.message);
            }
        }

        this._emit('offline_finances', entries);
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Customer Reviews & Sentiment Analysis
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns customer reviews with rating, featured status, and sentiment analysis scores.
     */
    
    /**
     * Returns reviews filtered by specific product ID or product name.
     */
    getReviewsByProduct(productId) {
        if (!productId || productId === 'all') return this.getReviews();
        const all = this.getReviews();
        const prod = this.getProduct(productId);
        const prodName = prod ? (prod.name || '').toLowerCase() : '';
        return all.filter(r => {
            if (r.productId && r.productId === productId) return true;
            if (prodName && (r.productName || '').toLowerCase() === prodName) return true;
            return false;
        });
    }

    /**
     * Returns computed review health & satisfaction metrics for a specific product.
     */
    getProductReviewMetrics(productId) {
        const prodReviews = this.getReviewsByProduct(productId);
        const total = prodReviews.length;
        if (total === 0) {
            const prod = this.getProduct(productId);
            return {
                avgRating: prod && prod.rating ? Number(prod.rating) : 5.0,
                totalReviews: 0,
                verifiedReviews: 0,
                loveScore: 100,
                breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            };
        }
        let sum = 0;
        let verifiedCount = 0;
        let lovedCount = 0;
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        prodReviews.forEach(r => {
            const stars = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
            breakdown[stars] = (breakdown[stars] || 0) + 1;
            sum += stars;
            if (r.verified) verifiedCount++;
            if (stars >= 4) lovedCount++;
        });
        const avg = Number((sum / total).toFixed(1));
        const loveScore = Math.round((lovedCount / total) * 100);
        return {
            avgRating: avg,
            totalReviews: total,
            verifiedReviews: verifiedCount,
            loveScore: loveScore,
            breakdown
        };
    }

    /**
     * Returns product comparison leaderboard data with top performers vs lower rated.
     */
    getProductPerformanceLeaderboard(sortBy = 'highest') {
        const products = this.getProducts();
        const list = products.map(p => {
            const metrics = this.getProductReviewMetrics(p.id);
            return {
                product: p,
                id: p.id,
                name: p.name,
                hindiName: p.hindiName || p.nameHindi || '',
                category: p.category || p.cat || 'achar',
                image: (p.images && p.images[0]) || p.image || p.img || 'assets/aam-ka-achar.png',
                avgRating: metrics.avgRating,
                totalReviews: metrics.totalReviews,
                verifiedReviews: metrics.verifiedReviews,
                loveScore: metrics.loveScore,
                breakdown: metrics.breakdown
            };
        });

        if (sortBy === 'lowest') {
            list.sort((a, b) => a.avgRating - b.avgRating || a.totalReviews - b.totalReviews);
        } else if (sortBy === 'most_reviews') {
            list.sort((a, b) => b.totalReviews - a.totalReviews || b.avgRating - a.avgRating);
        } else {
            // default highest
            list.sort((a, b) => b.avgRating - a.avgRating || b.totalReviews - a.totalReviews);
        }

        const topPerformers = list.filter(item => item.avgRating >= 4.8);
        const lowerRated = list.filter(item => item.avgRating < 4.8);

        return { all: list, topPerformers, lowerRated };
    }

    getReviews() {
        try {
            return JSON.parse(getStorage().getItem(STORAGE_KEYS.REVIEWS) || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * Returns reviews selected to be featured on the homepage.
     */
    getFeaturedReviews() {
        try {
            const featuredRaw = getStorage().getItem(STORAGE_KEYS.FEATURED_REVIEWS);
            if (featuredRaw) {
                const parsed = JSON.parse(featuredRaw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
            const all = this.getReviews();
            const featured = all.filter(r => r.featured === true);
            if (featured.length > 0) return featured;
            return all.filter(r => r.rating === 5);
        } catch (e) {
            return [];
        }
    }

    /**
     * Toggles the featured status of a review for the homepage marquee.
     */
    toggleFeaturedReview(reviewId) {
        const reviews = this.getReviews();
        const target = reviews.find(r => r.id === reviewId);
        if (!target) {
            throw new Error(`Review with ID "${reviewId}" not found.`);
        }

        target.featured = !target.featured;
        getStorage().setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

        // Sync featured reviews storage key for homepage marquee
        const featuredReviews = reviews.filter(r => r.featured === true);
        getStorage().setItem(STORAGE_KEYS.FEATURED_REVIEWS, JSON.stringify(featuredReviews));

        // Emit adapter and window events
        this._emit('reviews', reviews);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('satvik_reviews_updated', {
                detail: { reviewId, featured: target.featured, totalFeatured: featuredReviews.length }
            }));
            try {
                window.localStorage.setItem('satvik_featured_reviews_sync', String(Date.now()));
            } catch (e) {}
        }

        return { review: target, allReviews: reviews, featuredReviews };
    }

    /**
     * Explicitly sets featured status on a review.
     */
    setReviewFeatured(reviewId, isFeatured) {
        const reviews = this.getReviews();
        const target = reviews.find(r => r.id === reviewId);
        if (!target) return null;

        target.featured = Boolean(isFeatured);
        getStorage().setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

        const featuredReviews = reviews.filter(r => r.featured === true);
        getStorage().setItem(STORAGE_KEYS.FEATURED_REVIEWS, JSON.stringify(featuredReviews));

        this._emit('reviews', reviews);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('satvik_reviews_updated', { detail: { reviewId, featured: target.featured } }));
        }
        return target;
    }

    /**
     * Publishes featured reviews directly to storefront key with sync notification.
     */
    publishFeaturedReviews() {
        const reviews = this.getReviews();
        const featuredReviews = reviews.filter(r => r.featured === true);
        getStorage().setItem(STORAGE_KEYS.FEATURED_REVIEWS, JSON.stringify(featuredReviews));

        this._emit('reviews', reviews);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('satvik_reviews_updated', {
                detail: { totalFeatured: featuredReviews.length }
            }));
            try {
                window.localStorage.setItem('satvik_featured_reviews_sync', String(Date.now()));
            } catch (e) {}
        }
        return featuredReviews;
    }

    /**
     * Adds a new customer review or testimonial with featured support.
     */
    async addReview(reviewData) {
        const reviews = this.getReviews();
        const isFeatured = reviewData.featured === true || (reviewData.featured !== false && Number(reviewData.rating || 5) === 5);
        const newReview = {
            id: reviewData.id || `REV-${Date.now().toString().slice(-4)}`,
            author: reviewData.author || reviewData.customerName || 'Anonymous Foodie',
            customerName: reviewData.author || reviewData.customerName || 'Anonymous Foodie',
            city: reviewData.city || 'India',
            productId: reviewData.productId || 'prod_aam_achar',
            productName: reviewData.productName || 'Artisanal Delicacy',
            rating: Number(reviewData.rating || 5),
            title: reviewData.title || '',
            text: reviewData.text || reviewData.comment || '',
            date: reviewData.date || new Date().toISOString().split('T')[0],
            verified: reviewData.verified !== false,
            featured: isFeatured,
            sentiment: reviewData.sentiment || (Number(reviewData.rating || 5) >= 4 ? 'positive' : Number(reviewData.rating || 5) === 3 ? 'neutral' : 'negative'),
            sentimentScore: reviewData.sentimentScore || (Number(reviewData.rating || 5) === 5 ? 0.98 : Number(reviewData.rating || 5) === 4 ? 0.85 : Number(reviewData.rating || 5) === 3 ? 0.50 : 0.15),
            createdAt: new Date().toISOString()
        };

        reviews.unshift(newReview);
        getStorage().setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

        if (isFeatured) {
            const featuredReviews = reviews.filter(r => r.featured === true);
            getStorage().setItem(STORAGE_KEYS.FEATURED_REVIEWS, JSON.stringify(featuredReviews));
        }

        this._emit('reviews', reviews);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('satvik_reviews_updated', { detail: { reviewId: newReview.id } }));
            try {
                window.localStorage.setItem('satvik_featured_reviews_sync', String(Date.now()));
            } catch (e) {}
        }
        return newReview;
    }

    /**
     * Deletes a customer review by ID.
     */
    async deleteReview(reviewId) {
        let reviews = this.getReviews();
        reviews = reviews.filter(r => r.id !== reviewId);
        getStorage().setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

        const featuredReviews = reviews.filter(r => r.featured === true);
        getStorage().setItem(STORAGE_KEYS.FEATURED_REVIEWS, JSON.stringify(featuredReviews));

        this._emit('reviews', reviews);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('satvik_reviews_updated', { detail: { reviewId, action: 'delete' } }));
            try {
                window.localStorage.setItem('satvik_featured_reviews_sync', String(Date.now()));
            } catch (e) {}
        }
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Dev Mode Controls
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resets all dev data back to rich default seeds.
     */
    resetDevData() {
        getStorage().setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
        const mergedOrders = [...SEED_ONLINE_ORDERS, ...SEED_OFFLINE_ORDERS].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        getStorage().setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mergedOrders));
        getStorage().setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
        getStorage().setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
        getStorage().setItem(STORAGE_KEYS.SEED_VERSION, STORAGE_KEYS.SEED_VERSION);

        // Notify all subscribers
        this._emit('orders', mergedOrders);
        this._emit('products', SEED_PRODUCTS);
        this._emit('offline_finances', SEED_EXPENSES);
        this._emit('reviews', SEED_REVIEWS);
        console.log("[AdminDataAdapter] Dev database reset to fresh rich seeds.");
    }

    /**
     * Explicitly toggle runtime mode between 'dev', 'firestore', or 'auto'.
     */
    /**
     * Returns list of all newsletter subscribers.
     */
    async syncLocalSubscribers() {
        if (typeof window === 'undefined') return this.getSubscribers();
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isLocal) return this.getSubscribers();
        try {
            const port = window.location.port === '5001' ? '5000' : '5001';
            const res = await fetch(`http://localhost:${port}/api/subscribers`);
            if (res.ok) {
                const remoteSubs = await res.json();
                if (Array.isArray(remoteSubs) && remoteSubs.length > 0) {
                    const localSubs = this.getSubscribers();
                    let modified = false;
                    remoteSubs.forEach(r => {
                        const rEmail = (r.email || '').toLowerCase().trim();
                        if (rEmail && !localSubs.some(s => (s.email || '').toLowerCase().trim() === rEmail)) {
                            localSubs.unshift(r);
                            modified = true;
                        }
                    });
                    if (modified) {
                        getStorage().setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(localSubs));
                        this._emit('subscribers', localSubs);
                        return localSubs;
                    }
                }
            }
        } catch (e) {}
        return this.getSubscribers();
    }

    getSubscribers() {
        try {
            const raw = getStorage().getItem(STORAGE_KEYS.SUBSCRIBERS);
            if (!raw) return [];
            const list = JSON.parse(raw);
            if (!Array.isArray(list)) return [];
            return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } catch (e) {
            return [];
        }
    }

    /**
     * Returns computed subscriber KPIs (total, active, new this month).
     */
    getSubscribersKPIs() {
        const list = this.getSubscribers();
        const total = list.length;
        const active = list.filter(s => s.status !== 'unsubscribed').length;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const thisMonth = list.filter(s => {
            const d = new Date(s.createdAt || 0).getTime();
            return d >= startOfMonth;
        }).length;

        return {
            total,
            active,
            thisMonth,
            growth: total > 0 ? '+100%' : '0%'
        };
    }

    /**
     * Add a new newsletter subscriber.
     */
    addSubscriber(subscriberData) {
        if (!subscriberData || !subscriberData.email) {
            throw new Error("Subscriber email is required.");
        }
        const email = subscriberData.email.trim().toLowerCase();
        const list = this.getSubscribers();
        const existing = list.find(s => (s.email || '').toLowerCase() === email);
        if (existing) {
            throw new Error(`Email "${email}" is already subscribed.`);
        }

        const newSub = {
            id: subscriberData.id || ('sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
            email: email,
            source: subscriberData.source || 'admin_suite',
            status: subscriberData.status || 'active',
            createdAt: subscriberData.createdAt || new Date().toISOString()
        };

        list.unshift(newSub);
        getStorage().setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(list));
        this._emit('subscribers', list);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('satvik_subscribers_updated', { detail: newSub }));
            try {
                window.localStorage.setItem('satvik_subscribers_sync', String(Date.now()));
            } catch (e) {}
        }
        return newSub;
    }

    /**
     * Delete a subscriber by ID.
     */
    deleteSubscriber(subscriberId) {
        const list = this.getSubscribers();
        const filtered = list.filter(s => s.id !== subscriberId);
        getStorage().setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(filtered));
        this._emit('subscribers', filtered);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem('satvik_subscribers_sync', String(Date.now()));
            } catch (e) {}
        }
        return true;
    }

    /**
     * Formats all active subscriber emails into a single delimited string for 1-click clipboard copy.
     */
    getSubscriberEmailsString(delimiter = ', ') {
        const list = this.getSubscribers().filter(s => s.status !== 'unsubscribed');
        return list.map(s => s.email).join(delimiter);
    }

    setMode(mode) {
        if (!['dev', 'firestore', 'auto'].includes(mode)) {
            throw new Error("Invalid mode. Choose 'dev', 'firestore', or 'auto'.");
        }
        this._mode = mode;
        if (typeof window !== 'undefined') {
            getStorage().setItem(STORAGE_KEYS.MODE, mode);
        }
        console.log(`[AdminDataAdapter] Switched storage mode to: ${mode}`);
    }
}

// Instantiate global singleton
export const adminDataAdapter = new AdminDataAdapter();

// Make globally accessible in browser console and scripts
if (typeof window !== 'undefined') {
    window.AdminDataAdapter = AdminDataAdapter;
    window.adminDataAdapter = adminDataAdapter;
}

export default adminDataAdapter;
