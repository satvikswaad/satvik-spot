/**
 * Satvik Swaad — Client-side Product Catalogue Display Dataset (Fallback/Display)
 * Note: Cloud Firestore is authoritative for runtime prices, stock, and availability.
 */

export const PRODUCTS_CATALOGUE = [
  {
    id: "prod_aam_achar",
    name: "Aam ka Achar",
    hindiName: "पारंपरिक आम का अचार",
    category: "achar",
    badge: "Bestseller",
    shortDesc: "Authentic raw mango pickle marinated in pure cold-pressed mustard oil, fennel, fenugreek, and nigella seeds.",
    fullDesc: "Our traditional Aam ka Achar is prepared using hand-picked raw green mangoes from local orchards. Sun-cured slowly in small batches over 14 days with cold-pressed mustard oil and aromatic ground spices following ancestral recipes passed down through generations.",
    ingredients: "Raw Green Mangoes, Pure Cold-Pressed Mustard Oil, Fennel Seeds (Saunf), Fenugreek (Methi), Nigella Seeds (Kalonji), Yellow Mustard Seeds, Turmeric, Red Chilli Powder, Asafoetida (Hing), Rock Salt.",
    storageInfo: "Store in a cool, dry place. Always use a clean, dry spoon. Ensure mustard oil layer covers pickles for maximum shelf life.",
    shelfLife: "12 Months from Batch Curing Date",
    allergens: "Contains Mustard. Produced in a facility handling sesame and nuts.",
    packaging: "Food-Grade Sealed Glass Jar with Protective Pressure Ring",
    rating: 4.9,
    reviewCount: 28,
    images: [
      "assets/aam-ka-achar.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 149, mrp: 190, sku: "SAT-AAM-250G", stock: 50, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 249, mrp: 320, sku: "SAT-AAM-500G", stock: 35, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 450, mrp: 580, sku: "SAT-AAM-1KG", stock: 20, active: true }
    ]
  },
  {
    id: "prod_kareli_achar",
    name: "Kareli ka Achar",
    hindiName: "मसालेदार करेली का अचार",
    category: "achar",
    badge: "Healthy Choice",
    shortDesc: "Sun-cured bitter gourd pickle seasoned with amchur, bishop's weed, black salt, and pure mustard oil.",
    fullDesc: "Kareli ka Achar balances the natural bitterness of fresh bitter gourd with tangy dry mango powder (amchur), ajwain, and pure mustard oil. Sun-cured to perfection for diabetic-friendly and wellness-oriented traditional taste.",
    ingredients: "Fresh Bitter Gourd (Karela), Cold-Pressed Mustard Oil, Amchur, Ajwain, Black Salt, Turmeric, Fennel, Cumin, Rock Salt.",
    storageInfo: "Store in a dry container away from direct moisture. Use clean dry cutlery.",
    shelfLife: "9 Months from Batch Curing Date",
    allergens: "Contains Mustard.",
    packaging: "Food-Grade Glass Jar",
    rating: 4.7,
    reviewCount: 16,
    images: [
      "assets/karela-ka-achar.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 159, mrp: 200, sku: "SAT-KAR-250G", stock: 40, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 269, mrp: 340, sku: "SAT-KAR-500G", stock: 25, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 490, mrp: 620, sku: "SAT-KAR-1KG", stock: 15, active: true }
    ]
  },
  {
    id: "prod_amla_achar",
    name: "Amla ka Achar",
    hindiName: "चटपटा आंवला का अचार",
    category: "achar",
    badge: "Traditional Recipe",
    shortDesc: "Spicy Indian gooseberry pickle rich in Vitamin C, preserved with roasted cumin, mustard, and asafoetida.",
    fullDesc: "Fresh winter amla (Indian gooseberries) steamed and marinated in cold-pressed mustard oil with hing, roasted cumin, and red chillies. Packed with natural Vitamin C.",
    ingredients: "Fresh Amla, Cold-Pressed Mustard Oil, Roasted Cumin, Asafoetida (Hing), Yellow Mustard, Red Chilli, Rock Salt.",
    storageInfo: "Store in a cool pantry. Keep jar tightly sealed.",
    shelfLife: "12 Months from Batch Curing Date",
    allergens: "Contains Mustard.",
    packaging: "Sealed Glass Jar",
    rating: 4.8,
    reviewCount: 22,
    images: [
      "assets/amla-ka-achar.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 149, mrp: 190, sku: "SAT-AML-250G", stock: 45, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 259, mrp: 330, sku: "SAT-AML-500G", stock: 30, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 470, mrp: 600, sku: "SAT-AML-1KG", stock: 18, active: true }
    ]
  },
  {
    id: "prod_amla_chutney",
    name: "Amla ki Chutney",
    hindiName: "चटपटी आंवला चटनी",
    category: "achar",
    badge: "Tangy Special",
    shortDesc: "Sweet & sour Indian gooseberry relish cooked with jaggery, black salt, cumin, and mint notes.",
    fullDesc: "A tangy sweet and sour relish made with fresh amla pulp, organic jaggery (gur), black salt, and roasted cumin. Delicious with parathas, mathris, and daily thalis.",
    ingredients: "Fresh Amla Pulp, Organic Jaggery, Black Salt, Roasted Cumin, Ginger, Red Chilli Flakes, Rock Salt.",
    storageInfo: "Refrigerate after opening for best freshness.",
    shelfLife: "6 Months from Batch Curing Date",
    allergens: "None declared.",
    packaging: "Food-Grade Glass Jar",
    rating: 4.6,
    reviewCount: 14,
    images: [
      "assets/amla-ki-chutney.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 139, mrp: 180, sku: "SAT-ACH-250G", stock: 35, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 239, mrp: 310, sku: "SAT-ACH-500G", stock: 20, active: true }
    ]
  },
  {
    id: "prod_laal_mirch_achar",
    name: "Laal Mirch ka Achar",
    hindiName: "भरवां लाल मिर्च का अचार",
    category: "achar",
    badge: "Banarasi Special",
    shortDesc: "Stuffed red chilli pickle filled with roasted aromatic spices and sun-cured in pure mustard oil.",
    fullDesc: "Authentic Banarasi-style large red chillies stuffed with hand-ground spices including saunf, methi, amchur, kalonji, and mustard oil. A fiery traditional delicacy.",
    ingredients: "Banarasi Red Chillies, Mustard Oil, Amchur, Saunf, Methi, Kalonji, Coriander Powder, Mustard Seeds, Rock Salt.",
    storageInfo: "Keep chillies submerged in mustard oil. Store in a dry place.",
    shelfLife: "12 Months from Batch Curing Date",
    allergens: "Contains Mustard.",
    packaging: "Sealed Glass Jar",
    rating: 4.9,
    reviewCount: 31,
    images: [
      "assets/lal-mirch-ka-achar.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 179, mrp: 220, sku: "SAT-LMC-250G", stock: 30, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 299, mrp: 380, sku: "SAT-LMC-500G", stock: 25, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 550, mrp: 690, sku: "SAT-LMC-1KG", stock: 12, active: true }
    ]
  },
  {
    id: "prod_hari_mirch_achar",
    name: "Hari Mirch ka Achar",
    hindiName: "चटपटी हरी मिर्च का अचार",
    category: "achar",
    badge: "Spicy Favorite",
    shortDesc: "Sliced green chillies tempered with lemon juice, mustard seeds, and turmeric in cold-pressed oil.",
    fullDesc: "Crisp green chillies cut into bite-sized pieces, tossed with lemon juice, rai, hing, and cold-pressed mustard oil. Adds instant zip to any meal.",
    ingredients: "Fresh Green Chillies, Lemon Juice, Mustard Seeds, Turmeric, Mustard Oil, Asafoetida, Rock Salt.",
    storageInfo: "Keep refrigerated for long-lasting crisp texture.",
    shelfLife: "6 Months from Batch Curing Date",
    allergens: "Contains Mustard.",
    packaging: "Sealed Glass Jar",
    rating: 4.7,
    reviewCount: 19,
    images: [
      "assets/hari-mirch-ka-achar.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 129, mrp: 170, sku: "SAT-HMC-250G", stock: 40, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 229, mrp: 290, sku: "SAT-HMC-500G", stock: 25, active: true }
    ]
  },
  {
    id: "prod_nimbu_achar",
    name: "Khatta Meetha Nimbu Achar",
    hindiName: "खट्टा मीठा नींबू अचार",
    category: "achar",
    badge: "Digestive Remedy",
    shortDesc: "Oil-free sweet & sour lemon pickle aged with jaggery, ajwain, black salt, and warm spices.",
    fullDesc: "Oil-free traditional lemon pickle sun-aged naturally with jaggery, black salt, ajwain, and cloves. Known in Indian homes as a comforting digestive digestive aid.",
    ingredients: "Thin-skinned Lemons, Organic Jaggery, Black Salt, Ajwain, Black Pepper, Cloves, Cinnamon, Rock Salt.",
    storageInfo: "Store in a dry location. Improves with age.",
    shelfLife: "24 Months from Batch Curing Date",
    allergens: "None declared.",
    packaging: "Sealed Glass Jar",
    rating: 4.8,
    reviewCount: 25,
    images: [
      "assets/nimbu-mirch-ka-achar.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 139, mrp: 180, sku: "SAT-NIM-250G", stock: 45, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 239, mrp: 310, sku: "SAT-NIM-500G", stock: 30, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 430, mrp: 550, sku: "SAT-NIM-1KG", stock: 20, active: true }
    ]
  },
  {
    id: "prod_lhsun_achar",
    name: "Lahsun ka Achar",
    hindiName: "मसालेदार लहसुन का अचार",
    category: "achar",
    badge: "Heart Healthy",
    shortDesc: "Peeled whole garlic cloves marinated in spicy mustard oil, methi, saunf, and amchur.",
    fullDesc: "Whole fresh garlic cloves slow-marinated in mustard oil with fennel, fenugreek, and dry mango. Rich in allicin and traditional digestive benefits.",
    ingredients: "Whole Garlic Cloves, Cold-Pressed Mustard Oil, Amchur, Saunf, Methi, Red Chilli, Turmeric, Rock Salt.",
    storageInfo: "Store in a cool dry place.",
    shelfLife: "12 Months from Batch Curing Date",
    allergens: "Contains Mustard.",
    packaging: "Sealed Glass Jar",
    rating: 4.8,
    reviewCount: 18,
    images: [
      "assets/amda-ka-achar.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 169, mrp: 210, sku: "SAT-LHS-250G", stock: 35, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 289, mrp: 360, sku: "SAT-LHS-500G", stock: 20, active: true }
    ]
  },
  {
    id: "prod_mix_veg_achar",
    name: "Mix Veg Achar",
    hindiName: "स्वादिष्ट मिक्स वेज अचार",
    category: "achar",
    badge: "Winter Classic",
    shortDesc: "Crunchy carrot, turnip, cauliflower, and green chilli pickle in cold-pressed mustard oil.",
    fullDesc: "Seasonal winter vegetables (cauliflower, carrots, turnips, and green chillies) sun-cured with ground mustard, jaggery notes, and spices.",
    ingredients: "Carrots, Turnips, Cauliflower, Green Chillies, Mustard Oil, Mustard Powder, Saunf, Turmeric, Salt.",
    storageInfo: "Store in a cool dry pantry.",
    shelfLife: "9 Months from Batch Curing Date",
    allergens: "Contains Mustard.",
    packaging: "Sealed Glass Jar",
    rating: 4.7,
    reviewCount: 15,
    images: [
      "assets/kathal-ka-achar.png?v=2"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 149, mrp: 190, sku: "SAT-MIX-250G", stock: 40, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 249, mrp: 320, sku: "SAT-MIX-500G", stock: 25, active: true }
    ]
  },
  {
    id: "prod_amla_murabba",
    name: "Amla Murabba",
    hindiName: "शाही आंवला मुरब्बा",
    category: "murabba",
    badge: "Rasayana Classic",
    shortDesc: "Whole green gooseberries simmered in cardamom-infused sugar syrup. Rich in Vitamin C.",
    fullDesc: "Pricked whole amla fruit simmered slowly in refined sugar syrup spiced with green cardamom and saffron strands. A traditional Ayurvedic rasayana for daily vitality.",
    ingredients: "Fresh Whole Amla, Sugar Syrup, Green Cardamom (Elaichi), Saffron (Kesar).",
    storageInfo: "Ensure amla fruit remains submerged in syrup. Store in a clean dry jar.",
    shelfLife: "12 Months from Date of Manufacture",
    allergens: "None declared.",
    packaging: "Wide-Mouth Food-Grade Glass Jar",
    rating: 4.9,
    reviewCount: 34,
    images: [
      "assets/amla-murabba-sugar.png?v=2"
    ],
    variants: [
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 279, mrp: 350, sku: "SAT-MUR-500G", stock: 30, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 499, mrp: 640, sku: "SAT-MUR-1KG", stock: 20, active: true }
    ]
  },
  {
    id: "prod_seb_murabba",
    name: "Seb ka Murabba",
    hindiName: "स्वादिष्ट सेब का मुरब्बा",
    category: "murabba",
    badge: "Premium Preserve",
    shortDesc: "Hand-picked Himalayan apples preserved in fragrant clove and cardamom syrup.",
    fullDesc: "Small Himalayan apples cooked gently in light cardamom syrup until translucent and tender. A nourishing morning preserve.",
    ingredients: "Fresh Himalayan Apples, Sugar, Cardamom, Cloves, Citric Acid.",
    storageInfo: "Store in a cool dry place. Use clean spoon.",
    shelfLife: "12 Months from Date of Manufacture",
    allergens: "None declared.",
    packaging: "Wide-Mouth Sealed Glass Jar",
    rating: 4.8,
    reviewCount: 12,
    images: [
      "assets/amla-murabba-jaggery.png?v=2"
    ],
    variants: [
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 349, mrp: 440, sku: "SAT-SEB-500G", stock: 25, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 649, mrp: 800, sku: "SAT-SEB-1KG", stock: 15, active: true }
    ]
  },
  {
    id: "prod_gond_laddu",
    name: "Shuddh Desi Ghee Gond Laddu",
    hindiName: "शुद्ध देसी घी गोंद के लड्डू",
    category: "sweets",
    badge: "Winter Special",
    shortDesc: "Edible gum, roasted whole wheat flour, almonds, cashew nuts, and nutmeg bound in pure A2 cow ghee.",
    fullDesc: "Handcrafted winter energy laddus prepared with fried edible gum (dink/gond), roasted whole wheat flour, crushed almonds, cashew nuts, cardamom, and pure A2 cow ghee.",
    ingredients: "Edible Gum (Gond), Pure Desi Ghee, Whole Wheat Flour, Almonds, Cashews, Jaggery/Sugar, Cardamom, Nutmeg.",
    storageInfo: "Store in an airtight tin at room temperature.",
    shelfLife: "3 Months from Preparation Date",
    allergens: "Contains Milk Solids (Ghee), Wheat (Gluten), Tree Nuts (Almonds, Cashews).",
    packaging: "Airtight Gift Box Container",
    rating: 5.0,
    reviewCount: 42,
    images: [
      "assets/amla-laddu-jaggery.png?v=2"
    ],
    variants: [
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 499, mrp: 620, sku: "SAT-GND-500G", stock: 20, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 949, mrp: 1200, sku: "SAT-GND-1KG", stock: 15, active: true }
    ]
  },
  {
    id: "prod_besan_laddu",
    name: "Besan Dry Fruit Laddu",
    hindiName: "बेसन ड्राई फ्रूट लड्डू",
    category: "sweets",
    badge: "Festive Favorite",
    shortDesc: "Slow-roasted coarse gram flour with crushed pistachios, almonds, and aromatic cardamom in pure ghee.",
    fullDesc: "Slow-roasted coarse chana dal besan cooked patiently in pure desi ghee until golden brown, blended with bura sugar, almonds, and pistachios.",
    ingredients: "Coarse Gram Flour (Besan), Pure Desi Ghee, Bura Sugar, Almonds, Pistachios, Cardamom.",
    storageInfo: "Store in a cool dry place in an airtight box.",
    shelfLife: "3 Months from Preparation Date",
    allergens: "Contains Milk Solids (Ghee), Tree Nuts (Almonds, Pistachios).",
    packaging: "Airtight Container",
    rating: 4.9,
    reviewCount: 38,
    images: [
      "assets/amla-laddu-sugar.png?v=2"
    ],
    variants: [
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 449, mrp: 560, sku: "SAT-BSN-500G", stock: 25, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 849, mrp: 1080, sku: "SAT-BSN-1KG", stock: 15, active: true }
    ]
  },
  {
    id: "prod_amla_juice",
    name: "Sun-cured Amla Juice",
    hindiName: "शुद्ध आंवला रस",
    category: "health",
    badge: "100% Pure",
    shortDesc: "Cold-extracted wild amla juice without added water, synthetic color, or artificial flavor.",
    fullDesc: "Pure cold-pressed juice extracted from fresh wild amla fruits. Zero added water, sugar, or synthetic dyes.",
    ingredients: "100% Pure Fresh Amla Extract, Permitted Class II Preservative (0.1%).",
    storageInfo: "Refrigerate after opening and consume within 30 days.",
    shelfLife: "6 Months from Date of Manufacture",
    allergens: "None declared.",
    packaging: "Food-Grade BPA-Free Bottle",
    rating: 4.7,
    reviewCount: 20,
    images: [
      "assets/amla-juice.png?v=2"
    ],
    variants: [
      { id: "var_500ml", label: "500 ml", weightGrams: 500, price: 199, mrp: 250, sku: "SAT-JUC-500ML", stock: 35, active: true },
      { id: "var_1l", label: "1 L", weightGrams: 1000, price: 349, mrp: 450, sku: "SAT-JUC-1L", stock: 20, active: true }
    ]
  },
  {
    id: "prod_chyawanprash",
    name: "Ancestral Chyawanprash",
    hindiName: "विशेष वैदिक च्यवनप्राश",
    category: "health",
    badge: "Ayurvedic Elixir",
    shortDesc: "Prepared with 40+ wild herbs, fresh amla pulp, raw forest honey, and pure A2 cow ghee.",
    fullDesc: "Authentic Vedic Chyawanprash cooked over wood fire with fresh amla pulp, raw forest honey, A2 cow ghee, and 40+ traditional herbs including Ashwagandha, Shatavari, and Pippali.",
    ingredients: "Fresh Amla Pulp, Raw Honey, A2 Cow Ghee, Ashwagandha, Shatavari, Pippali, Cardamom, Cinnamon, Nagkesar, Sesame Oil.",
    storageInfo: "Store in a dry cool place. Do not refrigerate.",
    shelfLife: "24 Months from Preparation Date",
    allergens: "Contains Milk Solids (Ghee), Sesame.",
    packaging: "Sealed Food-Grade Glass Jar",
    rating: 4.9,
    reviewCount: 36,
    images: [
      "assets/chyawanprash.png?v=2"
    ],
    variants: [
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 599, mrp: 750, sku: "SAT-CHW-500G", stock: 25, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 1099, mrp: 1380, sku: "SAT-CHW-1KG", stock: 15, active: true }
    ]
  },
  {
    id: "prod_besan_barfi",
    name: "Besan Barfi",
    hindiName: "शुद्ध देसी घी बेसन बर्फी",
    category: "sweets",
    badge: "Bestseller",
    shortDesc: "Melt-in-mouth traditional gram flour fudge roasted in pure A2 cow ghee with pistachios and silver vark.",
    fullDesc: "Prepared using ancestral slow-roasting technique with fragrant besan, pure A2 desi ghee, and green cardamom, garnished with chopped pistachios and almonds.",
    ingredients: "Gram Flour (Besan), Pure Desi Ghee, Sugar, Pistachios, Almonds, Cardamom.",
    storageInfo: "Store in an airtight container at room temperature.",
    shelfLife: "30 Days from Preparation Date",
    allergens: "Contains Milk Solids (Ghee), Tree Nuts.",
    packaging: "Sealed Gift Box",
    rating: 4.8,
    reviewCount: 94,
    images: [
      "assets/product-besan-barfi.png"
    ],
    variants: [
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 279, mrp: 349, sku: "SAT-BRF-500G", stock: 30, active: true },
      { id: "var_1kg", label: "1 kg", weightGrams: 1000, price: 529, mrp: 679, sku: "SAT-BRF-1KG", stock: 15, active: true }
    ]
  },
  {
    id: "prod_amla_powder",
    name: "Amla Powder",
    hindiName: "जैविक शुद्ध आंवला चूर्ण",
    category: "health",
    badge: "New",
    shortDesc: "100% shade-dried wild forest amla ground to fine organic powder, loaded with natural Vitamin C.",
    fullDesc: "Sun-cured and shade-dried organic forest amlas stone-ground to preserve heat-sensitive Vitamin C, antioxidants, and digestive bioactives.",
    ingredients: "100% Organic Shade-Dried Wild Amla Fruit Powder.",
    storageInfo: "Store in a cool, dry place. Keep airtight.",
    shelfLife: "18 Months from Packaging Date",
    allergens: "None declared.",
    packaging: "Sealed Food-Grade Jar",
    rating: 4.7,
    reviewCount: 63,
    images: [
      "assets/product-amla-powder.png"
    ],
    variants: [
      { id: "var_250g", label: "250 g", weightGrams: 250, price: 199, mrp: 259, sku: "SAT-AML-POW-250G", stock: 40, active: true },
      { id: "var_500g", label: "500 g", weightGrams: 500, price: 349, mrp: 449, sku: "SAT-AML-POW-500G", stock: 25, active: true }
    ]
  }
];

