import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export interface ProductVariantSeed {
  id: string;
  label: string;
  weightGrams?: number;
  price: number;
  mrp: number;
  sku: string;
  stock: number;
  active: boolean;
}

export interface CatalogProductSeed {
  id: string;
  sku: string;
  name: string;
  hindiName?: string;
  cat: 'achar' | 'murabba' | 'sweets' | 'health';
  emoji?: string;
  img: string;
  images?: string[];
  desc: string;
  shortDesc?: string;
  fullDesc?: string;
  ingredients?: string | string[];
  storageInfo?: string;
  shelfLife?: string;
  allergens?: string | string[];
  packaging?: string;
  weightVariant?: string;
  price: number;
  mrp: number;
  stock: number;
  available: boolean;
  featured?: boolean;
  badge?: string;
  variants?: ProductVariantSeed[];
}

export const CANONICAL_SEED_PRODUCTS: CatalogProductSeed[] = [
  {
    id: 'prod_aam_achar',
    sku: 'SKU-AAM-001',
    name: 'Traditional Aam ka Achar (आम का अचार)',
    hindiName: 'पारंपरिक आम का अचार',
    cat: 'achar',
    emoji: '🥭',
    img: 'assets/mango_pickle.jpg',
    images: ['assets/mango_pickle.jpg'],
    desc: 'Authentic raw mango pickle marinated in pure cold-pressed mustard oil, fennel, fenugreek, and nigella seeds.',
    shortDesc: 'Authentic raw mango pickle marinated in pure cold-pressed mustard oil, fennel, fenugreek, and nigella seeds.',
    fullDesc: 'Our traditional Aam ka Achar is prepared using hand-picked raw green mangoes from local orchards. Sun-cured slowly in small batches over 14 days with cold-pressed mustard oil and aromatic ground spices following ancestral recipes passed down through generations.',
    ingredients: 'Raw Green Mangoes, Pure Cold-Pressed Mustard Oil, Fennel Seeds (Saunf), Fenugreek (Methi), Nigella Seeds (Kalonji), Yellow Mustard Seeds, Turmeric, Red Chilli Powder, Asafoetida (Hing), Rock Salt.',
    storageInfo: 'Store in a cool, dry place. Always use a clean, dry spoon.',
    shelfLife: '12 Months from Batch Curing Date',
    allergens: 'Contains Mustard.',
    packaging: 'Food-Grade Sealed Glass Jar',
    weightVariant: '500g',
    price: 249,
    mrp: 320,
    stock: 50,
    available: true,
    featured: true,
    badge: 'Bestseller',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 149, mrp: 190, sku: 'SAT-AAM-250G', stock: 50, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 249, mrp: 320, sku: 'SAT-AAM-500G', stock: 35, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 450, mrp: 580, sku: 'SAT-AAM-1KG', stock: 20, active: true }
    ]
  },
  {
    id: 'prod_kareli_achar',
    sku: 'SKU-KAR-001',
    name: 'Kareli ka Achar (करेली का अचार)',
    hindiName: 'मसालेदार करेली का अचार',
    cat: 'achar',
    emoji: '🥒',
    img: 'assets/mix_veg_pickle.jpg',
    images: ['assets/mix_veg_pickle.jpg'],
    desc: 'Sun-cured bitter gourd pickle seasoned with amchur, bishop’s weed, black salt, and pure mustard oil.',
    shortDesc: 'Sun-cured bitter gourd pickle seasoned with amchur, ajwain, and pure mustard oil.',
    fullDesc: 'Kareli ka Achar balances the natural bitterness of fresh bitter gourd with tangy dry mango powder (amchur), ajwain, and pure mustard oil.',
    ingredients: 'Fresh Bitter Gourd (Karela), Cold-Pressed Mustard Oil, Amchur, Ajwain, Black Salt, Turmeric, Fennel, Cumin, Rock Salt.',
    storageInfo: 'Store in a dry container away from direct moisture.',
    shelfLife: '9 Months from Batch Curing Date',
    allergens: 'Contains Mustard.',
    packaging: 'Food-Grade Glass Jar',
    weightVariant: '500g',
    price: 269,
    mrp: 340,
    stock: 40,
    available: true,
    featured: false,
    badge: 'Healthy Choice',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 159, mrp: 200, sku: 'SAT-KAR-250G', stock: 40, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 269, mrp: 340, sku: 'SAT-KAR-500G', stock: 25, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 490, mrp: 620, sku: 'SAT-KAR-1KG', stock: 15, active: true }
    ]
  },
  {
    id: 'prod_amla_achar',
    sku: 'SKU-AML-001',
    name: 'Amla ka Achar (आंवला का अचार)',
    hindiName: 'चटपटा आंवला का अचार',
    cat: 'achar',
    emoji: '🍈',
    img: 'assets/amla_murabba.jpg',
    images: ['assets/amla_murabba.jpg'],
    desc: 'Spicy Indian gooseberry pickle rich in Vitamin C, preserved with roasted cumin, mustard, and asafoetida.',
    shortDesc: 'Spicy Indian gooseberry pickle rich in Vitamin C.',
    fullDesc: 'Fresh winter amla (Indian gooseberries) steamed and marinated in cold-pressed mustard oil with hing, roasted cumin, and red chillies.',
    ingredients: 'Fresh Amla, Cold-Pressed Mustard Oil, Roasted Cumin, Asafoetida (Hing), Yellow Mustard, Red Chilli, Rock Salt.',
    storageInfo: 'Store in a cool pantry. Keep jar tightly sealed.',
    shelfLife: '12 Months from Batch Curing Date',
    allergens: 'Contains Mustard.',
    packaging: 'Sealed Glass Jar',
    weightVariant: '500g',
    price: 259,
    mrp: 330,
    stock: 45,
    available: true,
    featured: false,
    badge: 'Traditional Recipe',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 149, mrp: 190, sku: 'SAT-AML-250G', stock: 45, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 259, mrp: 330, sku: 'SAT-AML-500G', stock: 30, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 470, mrp: 600, sku: 'SAT-AML-1KG', stock: 18, active: true }
    ]
  },
  {
    id: 'prod_amla_chutney',
    sku: 'SKU-ACH-001',
    name: 'Amla ki Chutney (आंवला चटनी)',
    hindiName: 'चटपटी आंवला चटनी',
    cat: 'achar',
    emoji: '🥣',
    img: 'assets/green_chutney.jpg',
    images: ['assets/green_chutney.jpg'],
    desc: 'Sweet & sour Indian gooseberry relish cooked with jaggery, black salt, cumin, and mint notes.',
    shortDesc: 'Sweet & sour Indian gooseberry relish cooked with jaggery and spices.',
    fullDesc: 'A tangy sweet and sour relish made with fresh amla pulp, organic jaggery (gur), black salt, and roasted cumin.',
    ingredients: 'Fresh Amla Pulp, Organic Jaggery, Black Salt, Roasted Cumin, Ginger, Red Chilli Flakes, Rock Salt.',
    storageInfo: 'Refrigerate after opening for best freshness.',
    shelfLife: '6 Months from Batch Curing Date',
    allergens: 'None declared.',
    packaging: 'Food-Grade Glass Jar',
    weightVariant: '250g',
    price: 139,
    mrp: 180,
    stock: 35,
    available: true,
    featured: false,
    badge: 'Tangy Special',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 139, mrp: 180, sku: 'SAT-ACH-250G', stock: 35, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 239, mrp: 310, sku: 'SAT-ACH-500G', stock: 20, active: true }
    ]
  },
  {
    id: 'prod_laal_mirch_achar',
    sku: 'SKU-LMC-001',
    name: 'Laal Mirch ka Achar (लाल मिर्च का अचार)',
    hindiName: 'भरवां लाल मिर्च का अचार',
    cat: 'achar',
    emoji: '🌶️',
    img: 'assets/red_chilli_pickle.png',
    images: ['assets/red_chilli_pickle.png'],
    desc: 'Stuffed Banarasi red chilli pickle filled with roasted aromatic spices and sun-cured in pure mustard oil.',
    shortDesc: 'Stuffed Banarasi red chilli pickle filled with roasted aromatic spices.',
    fullDesc: 'Authentic Banarasi-style large red chillies stuffed with hand-ground spices including saunf, methi, amchur, kalonji, and mustard oil.',
    ingredients: 'Banarasi Red Chillies, Mustard Oil, Amchur, Saunf, Methi, Kalonji, Coriander Powder, Mustard Seeds, Rock Salt.',
    storageInfo: 'Keep chillies submerged in mustard oil. Store in a dry place.',
    shelfLife: '12 Months from Batch Curing Date',
    allergens: 'Contains Mustard.',
    packaging: 'Sealed Glass Jar',
    weightVariant: '500g',
    price: 299,
    mrp: 380,
    stock: 30,
    available: true,
    featured: true,
    badge: 'Banarasi Special',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 179, mrp: 220, sku: 'SAT-LMC-250G', stock: 30, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 299, mrp: 380, sku: 'SAT-LMC-500G', stock: 25, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 550, mrp: 690, sku: 'SAT-LMC-1KG', stock: 12, active: true }
    ]
  },
  {
    id: 'prod_hari_mirch_achar',
    sku: 'SKU-HMC-001',
    name: 'Hari Mirch ka Achar (हरी मिर्च का अचार)',
    hindiName: 'चटपटी हरी मिर्च का अचार',
    cat: 'achar',
    emoji: '🌶️',
    img: 'assets/green_chutney.jpg',
    images: ['assets/green_chutney.jpg'],
    desc: 'Sliced green chillies tempered with lemon juice, mustard seeds, and turmeric in cold-pressed oil.',
    shortDesc: 'Sliced green chillies tempered with lemon juice and mustard seeds.',
    fullDesc: 'Crisp green chillies cut into bite-sized pieces, tossed with lemon juice, rai, hing, and cold-pressed mustard oil.',
    ingredients: 'Fresh Green Chillies, Lemon Juice, Mustard Seeds, Turmeric, Mustard Oil, Asafoetida, Rock Salt.',
    storageInfo: 'Keep refrigerated for long-lasting crisp texture.',
    shelfLife: '6 Months from Batch Curing Date',
    allergens: 'Contains Mustard.',
    packaging: 'Sealed Glass Jar',
    weightVariant: '250g',
    price: 129,
    mrp: 170,
    stock: 40,
    available: true,
    featured: false,
    badge: 'Spicy Favorite',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 129, mrp: 170, sku: 'SAT-HMC-250G', stock: 40, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 229, mrp: 290, sku: 'SAT-HMC-500G', stock: 25, active: true }
    ]
  },
  {
    id: 'prod_nimbu_achar',
    sku: 'SKU-NIM-001',
    name: 'Khatta Meetha Nimbu Achar (नींबू का अचार)',
    hindiName: 'खट्टा मीठा नींबू अचार',
    cat: 'achar',
    emoji: '🍋',
    img: 'assets/mango_pickle.jpg',
    images: ['assets/mango_pickle.jpg'],
    desc: 'Oil-free sweet & sour lemon pickle aged with jaggery, ajwain, black salt, and warm spices.',
    shortDesc: 'Oil-free sweet & sour lemon pickle aged with jaggery and ajwain.',
    fullDesc: 'Oil-free traditional lemon pickle sun-aged naturally with jaggery, black salt, ajwain, and cloves.',
    ingredients: 'Thin-skinned Lemons, Organic Jaggery, Black Salt, Ajwain, Black Pepper, Cloves, Cinnamon, Rock Salt.',
    storageInfo: 'Store in a dry location. Improves with age.',
    shelfLife: '24 Months from Batch Curing Date',
    allergens: 'None declared.',
    packaging: 'Sealed Glass Jar',
    weightVariant: '500g',
    price: 239,
    mrp: 310,
    stock: 45,
    available: true,
    featured: true,
    badge: 'Digestive Remedy',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 139, mrp: 180, sku: 'SAT-NIM-250G', stock: 45, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 239, mrp: 310, sku: 'SAT-NIM-500G', stock: 30, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 430, mrp: 550, sku: 'SAT-NIM-1KG', stock: 20, active: true }
    ]
  },
  {
    id: 'prod_lhsun_achar',
    sku: 'SKU-LHS-001',
    name: 'Lahsun ka Achar (लहसुन का अचार)',
    hindiName: 'मसालेदार लहसुन का अचार',
    cat: 'achar',
    emoji: '🧄',
    img: 'assets/mix_veg_pickle.jpg',
    images: ['assets/mix_veg_pickle.jpg'],
    desc: 'Peeled whole garlic cloves marinated in spicy mustard oil, methi, saunf, and amchur.',
    shortDesc: 'Peeled whole garlic cloves marinated in spicy mustard oil.',
    fullDesc: 'Whole fresh garlic cloves slow-marinated in mustard oil with fennel, fenugreek, and dry mango.',
    ingredients: 'Whole Garlic Cloves, Cold-Pressed Mustard Oil, Amchur, Saunf, Methi, Red Chilli, Turmeric, Rock Salt.',
    storageInfo: 'Store in a cool dry place.',
    shelfLife: '12 Months from Batch Curing Date',
    allergens: 'Contains Mustard.',
    packaging: 'Sealed Glass Jar',
    weightVariant: '250g',
    price: 169,
    mrp: 210,
    stock: 35,
    available: true,
    featured: false,
    badge: 'Heart Healthy',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 169, mrp: 210, sku: 'SAT-LHS-250G', stock: 35, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 289, mrp: 360, sku: 'SAT-LHS-500G', stock: 20, active: true }
    ]
  },
  {
    id: 'prod_mix_veg_achar',
    sku: 'SKU-MIX-001',
    name: 'Mix Veg Achar (मिक्स वेज अचार)',
    hindiName: 'स्वादिष्ट मिक्स वेज अचार',
    cat: 'achar',
    emoji: '🥗',
    img: 'assets/mix_veg_pickle.jpg',
    images: ['assets/mix_veg_pickle.jpg'],
    desc: 'Crunchy carrot, turnip, cauliflower, and green chilli pickle in cold-pressed mustard oil.',
    shortDesc: 'Crunchy carrot, turnip, cauliflower, and green chilli pickle.',
    fullDesc: 'Seasonal winter vegetables sun-cured with ground mustard, jaggery notes, and spices.',
    ingredients: 'Carrots, Turnips, Cauliflower, Green Chillies, Mustard Oil, Mustard Powder, Saunf, Turmeric, Salt.',
    storageInfo: 'Store in a cool dry pantry.',
    shelfLife: '9 Months from Batch Curing Date',
    allergens: 'Contains Mustard.',
    packaging: 'Sealed Glass Jar',
    weightVariant: '500g',
    price: 249,
    mrp: 320,
    stock: 40,
    available: true,
    featured: false,
    badge: 'Winter Classic',
    variants: [
      { id: 'var_250g', label: '250 g', weightGrams: 250, price: 149, mrp: 190, sku: 'SAT-MIX-250G', stock: 40, active: true },
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 249, mrp: 320, sku: 'SAT-MIX-500G', stock: 25, active: true }
    ]
  },
  {
    id: 'prod_amla_murabba',
    sku: 'SKU-MUR-001',
    name: 'Amla Murabba (आंवला मुरब्बा)',
    hindiName: 'शाही आंवला मुरब्बा',
    cat: 'murabba',
    emoji: '🍈',
    img: 'assets/amla_murabba.jpg',
    images: ['assets/amla_murabba.jpg'],
    desc: 'Whole green gooseberries simmered in cardamom-infused sugar syrup. Rich in Vitamin C.',
    shortDesc: 'Whole green gooseberries simmered in cardamom-infused sugar syrup.',
    fullDesc: 'Pricked whole amla fruit simmered slowly in refined sugar syrup spiced with green cardamom and saffron strands.',
    ingredients: 'Fresh Whole Amla, Sugar Syrup, Green Cardamom (Elaichi), Saffron (Kesar).',
    storageInfo: 'Ensure amla fruit remains submerged in syrup. Store in a clean dry jar.',
    shelfLife: '12 Months from Date of Manufacture',
    allergens: 'None declared.',
    packaging: 'Wide-Mouth Food-Grade Glass Jar',
    weightVariant: '500g',
    price: 279,
    mrp: 350,
    stock: 30,
    available: true,
    featured: true,
    badge: 'Rasayana Classic',
    variants: [
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 279, mrp: 350, sku: 'SAT-MUR-500G', stock: 30, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 499, mrp: 640, sku: 'SAT-MUR-1KG', stock: 20, active: true }
    ]
  },
  {
    id: 'prod_seb_murabba',
    sku: 'SKU-SEB-001',
    name: 'Seb ka Murabba (सेब का मुरब्बा)',
    hindiName: 'स्वादिष्ट सेब का मुरब्बा',
    cat: 'murabba',
    emoji: '🍎',
    img: 'assets/amla_murabba.jpg',
    images: ['assets/amla_murabba.jpg'],
    desc: 'Hand-picked Himalayan apples preserved in fragrant clove and cardamom syrup.',
    shortDesc: 'Hand-picked Himalayan apples preserved in fragrant clove and cardamom syrup.',
    fullDesc: 'Small Himalayan apples cooked gently in light cardamom syrup until translucent and tender.',
    ingredients: 'Fresh Himalayan Apples, Sugar, Cardamom, Cloves, Citric Acid.',
    storageInfo: 'Store in a cool dry place. Use clean spoon.',
    shelfLife: '12 Months from Date of Manufacture',
    allergens: 'None declared.',
    packaging: 'Wide-Mouth Sealed Glass Jar',
    weightVariant: '500g',
    price: 349,
    mrp: 440,
    stock: 25,
    available: true,
    featured: false,
    badge: 'Premium Preserve',
    variants: [
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 349, mrp: 440, sku: 'SAT-SEB-500G', stock: 25, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 649, mrp: 800, sku: 'SAT-SEB-1KG', stock: 15, active: true }
    ]
  },
  {
    id: 'prod_gond_laddu',
    sku: 'SKU-GND-001',
    name: 'Shuddh Desi Ghee Gond Laddu (गोंद के लड्डू)',
    hindiName: 'शुद्ध देसी घी गोंद के लड्डू',
    cat: 'sweets',
    emoji: '🟡',
    img: 'assets/gond_laddu.png',
    images: ['assets/gond_laddu.png'],
    desc: 'Edible gum, roasted whole wheat flour, almonds, cashew nuts, and nutmeg bound in pure A2 cow ghee.',
    shortDesc: 'Edible gum, roasted whole wheat flour, almonds, cashews bound in pure ghee.',
    fullDesc: 'Handcrafted winter energy laddus prepared with fried edible gum (dink/gond), roasted whole wheat flour, crushed almonds, cashew nuts, cardamom, and pure A2 cow ghee.',
    ingredients: 'Edible Gum (Gond), Pure Desi Ghee, Whole Wheat Flour, Almonds, Cashews, Jaggery/Sugar, Cardamom, Nutmeg.',
    storageInfo: 'Store in an airtight tin at room temperature.',
    shelfLife: '3 Months from Preparation Date',
    allergens: 'Contains Milk Solids (Ghee), Wheat (Gluten), Tree Nuts.',
    packaging: 'Airtight Gift Box Container',
    weightVariant: '500g',
    price: 499,
    mrp: 620,
    stock: 20,
    available: true,
    featured: true,
    badge: 'Winter Special',
    variants: [
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 499, mrp: 620, sku: 'SAT-GND-500G', stock: 20, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 949, mrp: 1200, sku: 'SAT-GND-1KG', stock: 15, active: true }
    ]
  },
  {
    id: 'prod_besan_laddu',
    sku: 'SKU-BSN-001',
    name: 'Besan Dry Fruit Laddu (बेसन लड्डू)',
    hindiName: 'बेसन ड्राई फ्रूट लड्डू',
    cat: 'sweets',
    emoji: '🟡',
    img: 'assets/amla_laddu.png',
    images: ['assets/amla_laddu.png'],
    desc: 'Slow-roasted coarse gram flour with crushed pistachios, almonds, and aromatic cardamom in pure ghee.',
    shortDesc: 'Slow-roasted coarse gram flour with crushed pistachios and almonds in pure ghee.',
    fullDesc: 'Slow-roasted coarse chana dal besan cooked patiently in pure desi ghee until golden brown, blended with bura sugar, almonds, and pistachios.',
    ingredients: 'Coarse Gram Flour (Besan), Pure Desi Ghee, Bura Sugar, Almonds, Pistachios, Cardamom.',
    storageInfo: 'Store in a cool dry place in an airtight box.',
    shelfLife: '3 Months from Preparation Date',
    allergens: 'Contains Milk Solids (Ghee), Tree Nuts.',
    packaging: 'Airtight Container',
    weightVariant: '500g',
    price: 449,
    mrp: 560,
    stock: 25,
    available: true,
    featured: false,
    badge: 'Festive Favorite',
    variants: [
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 449, mrp: 560, sku: 'SAT-BSN-500G', stock: 25, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 849, mrp: 1080, sku: 'SAT-BSN-1KG', stock: 15, active: true }
    ]
  },
  {
    id: 'prod_amla_juice',
    sku: 'SKU-JUC-001',
    name: 'Sun-cured Amla Juice (आंवला रस)',
    hindiName: 'शुद्ध आंवला रस',
    cat: 'health',
    emoji: '🧃',
    img: 'assets/amla_juice.png',
    images: ['assets/amla_juice.png'],
    desc: 'Cold-extracted wild amla juice without added water, synthetic color, or artificial flavor.',
    shortDesc: 'Cold-extracted wild amla juice without added water or artificial flavor.',
    fullDesc: 'Pure cold-pressed juice extracted from fresh wild amla fruits. Zero added water, sugar, or synthetic dyes.',
    ingredients: '100% Pure Fresh Amla Extract, Permitted Class II Preservative (0.1%).',
    storageInfo: 'Refrigerate after opening and consume within 30 days.',
    shelfLife: '6 Months from Date of Manufacture',
    allergens: 'None declared.',
    packaging: 'Food-Grade BPA-Free Bottle',
    weightVariant: '500ml',
    price: 199,
    mrp: 250,
    stock: 35,
    available: true,
    featured: false,
    badge: '100% Pure',
    variants: [
      { id: 'var_500ml', label: '500 ml', weightGrams: 500, price: 199, mrp: 250, sku: 'SAT-JUC-500ML', stock: 35, active: true },
      { id: 'var_1l', label: '1 L', weightGrams: 1000, price: 349, mrp: 450, sku: 'SAT-JUC-1L', stock: 20, active: true }
    ]
  },
  {
    id: 'prod_chyawanprash',
    sku: 'SKU-CHW-001',
    name: 'Ancestral Chyawanprash (च्यवनप्राश)',
    hindiName: 'विशेष वैदिक च्यवनप्राश',
    cat: 'health',
    emoji: '🍯',
    img: 'assets/amla_murabba.jpg',
    images: ['assets/amla_murabba.jpg'],
    desc: 'Prepared with 40+ wild herbs, fresh amla pulp, raw forest honey, and pure A2 cow ghee.',
    shortDesc: 'Prepared with 40+ wild herbs, fresh amla pulp, raw honey, and A2 cow ghee.',
    fullDesc: 'Authentic Vedic Chyawanprash cooked over wood fire with fresh amla pulp, raw forest honey, A2 cow ghee, and 40+ traditional herbs.',
    ingredients: 'Fresh Amla Pulp, Raw Honey, A2 Cow Ghee, Ashwagandha, Shatavari, Pippali, Cardamom, Cinnamon, Sesame Oil.',
    storageInfo: 'Store in a dry cool place. Do not refrigerate.',
    shelfLife: '24 Months from Preparation Date',
    allergens: 'Contains Milk Solids (Ghee), Sesame.',
    packaging: 'Sealed Food-Grade Glass Jar',
    weightVariant: '500g',
    price: 599,
    mrp: 750,
    stock: 25,
    available: true,
    featured: true,
    badge: 'Ayurvedic Elixir',
    variants: [
      { id: 'var_500g', label: '500 g', weightGrams: 500, price: 599, mrp: 750, sku: 'SAT-CHW-500G', stock: 25, active: true },
      { id: 'var_1kg', label: '1 kg', weightGrams: 1000, price: 1099, mrp: 1380, sku: 'SAT-CHW-1KG', stock: 15, active: true }
    ]
  }
];

export interface SeedOptions {
  dryRun?: boolean;
  project?: string;
  confirm?: boolean;
  confirmProduction?: boolean;
}

export function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }

  return parsed;
}

export async function runProductSeed(options: SeedOptions = {}) {
  const dryRun = options.dryRun !== false; // Default to dry-run mode for safety
  const project = (options.project || '').trim();
  const confirm = options.confirm === true;
  const confirmProduction = options.confirmProduction === true;

  console.log('====================================================');
  console.log('      SATWIK SPOT — PRODUCT SEED MIGRATION TOOL     ');
  console.log('====================================================');
  console.log(`📌 Target Project: [ ${project || 'UNSPECIFIED'} ]`);
  console.log(`🔍 Dry-Run Mode: [ ${dryRun ? 'YES (No DB Writes)' : 'NO (Live Firestore Migration)'} ]`);

  // 1. Refuse empty project ID
  if (!project) {
    throw new Error('Target project ID is required. Pass --project <project_id> explicitly.');
  }

  // 2. Refuse legacy project
  if (project === 'satwiksweetsandpickels') {
    throw new Error('Legacy project satwiksweetsandpickels is rejected. Use satvik-spot-staging or satvik-spot-test.');
  }

  // 3. Refuse production projects unless explicitly confirmed
  if (project.includes('prod') && !confirmProduction) {
    throw new Error(`Production seeding on project '${project}' requires explicit --confirm-production flag.`);
  }

  // 4. Refuse live writes during automated tests without emulator host
  if (!dryRun) {
    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
      throw new Error('Live database writes are forbidden in test environment without FIRESTORE_EMULATOR_HOST.');
    }
    if (!process.env.FIRESTORE_EMULATOR_HOST && !confirm) {
      throw new Error(`Non-emulator database write to '${project}' requires explicit --confirm flag.`);
    }
  }

  // 5. Detect Duplicate SKUs
  const skuSet = new Set<string>();
  for (const prod of CANONICAL_SEED_PRODUCTS) {
    if (skuSet.has(prod.sku)) {
      throw new Error(`Duplicate SKU detected: ${prod.sku}`);
    }
    skuSet.add(prod.sku);
  }

  // 6. Validate Schema
  for (const p of CANONICAL_SEED_PRODUCTS) {
    if (!p.id || !p.name || p.price <= 0 || p.mrp < p.price || p.stock < 0) {
      throw new Error(`Validation failed for product ID ${p.id}`);
    }
  }

  console.log(`✅ Validated ${CANONICAL_SEED_PRODUCTS.length} canonical products. Zero duplicate SKUs found.`);

  if (dryRun) {
    console.log('ℹ️ Dry-run completed successfully. No changes written to database.');
    return { success: true, count: CANONICAL_SEED_PRODUCTS.length, dryRun: true };
  }

  // 7. Initialize Admin SDK
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp({ projectId: project });

  const db = getFirestore(app);
  const batch = db.batch();

  for (const prod of CANONICAL_SEED_PRODUCTS) {
    const docRef = db.collection('products').doc(prod.id);
    batch.set(docRef, {
      ...prod,
      testData: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }

  await batch.commit();
  console.log(`🎉 Successfully seeded ${CANONICAL_SEED_PRODUCTS.length} products to Firestore '/products' collection in project '${project}'.`);
  return { success: true, count: CANONICAL_SEED_PRODUCTS.length, dryRun: false };
}

// Main entry guard for CLI execution only
if (typeof require !== 'undefined' && require.main === module) {
  const flags = parseArgs();
  const dryRun = flags['dry-run'] !== false && flags.live !== true;
  const project = (typeof flags.project === 'string' ? flags.project : process.env.FIREBASE_PROJECT_ID) || '';
  const confirm = flags.confirm === true;
  const confirmProduction = flags['confirm-production'] === true;

  runProductSeed({ dryRun, project, confirm, confirmProduction }).catch(err => {
    console.error('❌ Fatal Migration Error:', err.message);
    process.exit(1);
  });
}
