import * as admin from 'firebase-admin';

export interface CatalogProductSeed {
  id: string;
  sku: string;
  name: string;
  cat: 'achar' | 'murabba' | 'chawmpras';
  emoji: string;
  img: string;
  desc: string;
  ingredients: string[];
  allergens: string[];
  weightVariant: string;
  price: number;
  mrp: number;
  stock: number;
  available: boolean;
  featured: boolean;
  badge?: string;
}

export const CANONICAL_SEED_PRODUCTS: CatalogProductSeed[] = [
  {
    id: 'prod_mango_achar',
    sku: 'SKU-ACH-001',
    name: 'Traditional Aam ka Achar (आम का अचार)',
    cat: 'achar',
    emoji: '🥭',
    img: 'assets/mango-pickle.jpg',
    desc: 'Authentic handmade raw mango pickle crafted with pure mustard oil and traditional spices.',
    ingredients: ['Raw Mango', 'Mustard Oil', 'Fenugreek', 'Fennel', 'Nigella Seeds', 'Turmeric', 'Red Chili', 'Salt'],
    allergens: ['Mustard'],
    weightVariant: '500g',
    price: 249,
    mrp: 320,
    stock: 50,
    available: true,
    featured: true,
    badge: 'Bestseller'
  },
  {
    id: 'prod_lemon_achar',
    sku: 'SKU-ACH-002',
    name: 'Khatta Meetha Nimbu Achar (नींबू का अचार)',
    cat: 'achar',
    emoji: '🍋',
    img: 'assets/lemon-pickle.jpg',
    desc: 'Sun-cured sweet and sour lemon pickle seasoned with black salt and carom seeds.',
    ingredients: ['Juicy Lemons', 'Sugar', 'Black Salt', 'Ajwain', 'Cumin', 'Garam Masala'],
    allergens: [],
    weightVariant: '500g',
    price: 229,
    mrp: 290,
    stock: 40,
    available: true,
    featured: true,
    badge: 'Popular'
  },
  {
    id: 'prod_garlic_achar',
    sku: 'SKU-ACH-003',
    name: 'Spicy Lahsun Achar (लहसुन का अचार)',
    cat: 'achar',
    emoji: '🧄',
    img: 'assets/garlic-pickle.jpg',
    desc: 'Bold peeled garlic clove pickle marinated in cold-pressed mustard oil and red chili flakes.',
    ingredients: ['Peeled Garlic', 'Mustard Oil', 'Red Chili Flakes', 'Mustard Powder', 'Asafoetida', 'Salt'],
    allergens: ['Mustard'],
    weightVariant: '400g',
    price: 269,
    mrp: 340,
    stock: 35,
    available: true,
    featured: false
  },
  {
    id: 'prod_green_chilly_achar',
    sku: 'SKU-ACH-004',
    name: 'Stuffed Hari Mirch Achar (हरी मिर्च का अचार)',
    cat: 'achar',
    emoji: '🌶️',
    img: 'assets/chilli-pickle.jpg',
    desc: 'Big green chilies stuffed with aromatic roasted mustard and fennel seed spice blend.',
    ingredients: ['Green Chilies', 'Mustard Powder', 'Amchur', 'Fennel', 'Mustard Oil', 'Salt'],
    allergens: ['Mustard'],
    weightVariant: '400g',
    price: 219,
    mrp: 280,
    stock: 25,
    available: true,
    featured: false
  },
  {
    id: 'prod_amla_murabba',
    sku: 'SKU-MUR-001',
    name: 'Organic Amla Murabba (आंवला मुरब्बा)',
    cat: 'murabba',
    emoji: '🍈',
    img: 'assets/amla-murabba.jpg',
    desc: 'Fresh Indian gooseberries preserved in pure cardamom-infused sugar syrup. Rich in Vitamin C.',
    ingredients: ['Fresh Amla', 'Pure Sugar Syrup', 'Cardamom', 'Saffron Threads'],
    allergens: [],
    weightVariant: '1000g',
    price: 299,
    mrp: 390,
    stock: 30,
    available: true,
    featured: true,
    badge: 'Healthy'
  },
  {
    id: 'prod_chyawanprash',
    sku: 'SKU-CHW-001',
    name: 'Shuddha Desi Chyawanprash (च्यवनप्राश)',
    cat: 'chawmpras',
    emoji: '🍯',
    img: 'assets/chyawanprash.jpg',
    desc: 'Ayurvedic immunity booster crafted with wild amla, A2 cow ghee, raw honey, and 40+ herbs.',
    ingredients: ['Amla', 'A2 Cow Ghee', 'Raw Honey', 'Ashwagandha', 'Shatavari', 'Pippali', 'Preshnaparni', 'Brahmi'],
    allergens: ['Honey', 'Dairy'],
    weightVariant: '1000g',
    price: 599,
    mrp: 750,
    stock: 20,
    available: true,
    featured: true,
    badge: 'Immunity'
  }
];

function parseArgs() {
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

export async function runProductSeed(dryRun = false, project = 'satwiksweetsandpickels') {
  console.log('====================================================');
  console.log('      SATWIK SPOT — PRODUCT SEED MIGRATION TOOL     ');
  console.log('====================================================');
  console.log(`📌 Target Project: [ ${project} ]`);
  console.log(`🔍 Dry-Run Mode: [ ${dryRun ? 'YES (No DB Writes)' : 'NO (Live Emulator Migration)'} ]`);

  // 1. Detect Duplicate SKUs
  const skuSet = new Set<string>();
  for (const prod of CANONICAL_SEED_PRODUCTS) {
    if (skuSet.has(prod.sku)) {
      throw new Error(`Duplicate SKU detected: ${prod.sku}`);
    }
    skuSet.add(prod.sku);
  }

  // 2. Validate Schema
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

  // 3. Initialize Admin SDK
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: project });
  }

  const db = admin.firestore();
  const batch = db.batch();

  for (const prod of CANONICAL_SEED_PRODUCTS) {
    const docRef = db.collection('products').doc(prod.id);
    batch.set(docRef, {
      ...prod,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
  console.log(`🎉 Successfully seeded ${CANONICAL_SEED_PRODUCTS.length} products to Firestore '/products' collection.`);
  return { success: true, count: CANONICAL_SEED_PRODUCTS.length, dryRun: false };
}

if (require.main === module) {
  const flags = parseArgs();
  const dryRun = flags['dry-run'] === true;
  const project = (flags.project as string) || process.env.FIREBASE_PROJECT_ID || 'satwiksweetsandpickels';

  runProductSeed(dryRun, project).catch(err => {
    console.error('❌ Fatal Migration Error:', err.message);
    process.exit(1);
  });
}
