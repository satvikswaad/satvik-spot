import fs from 'fs';
import path from 'path';

describe('Phase 15 — Product Details, Weight Selection & Cart Quantity System', () => {
  const publicSiteDir = path.resolve(__dirname, '../../public/site');
  const backendSrcDir = path.resolve(__dirname, '../../backend/src');
  const productDetailsPath = path.join(publicSiteDir, 'product-details.html');
  const productsPath = path.join(publicSiteDir, 'products.html');
  const scriptPath = path.join(publicSiteDir, 'script.js');
  const productsDataPath = path.join(publicSiteDir, 'js', 'productsData.js');
  const sitemapPath = path.join(publicSiteDir, 'sitemap.xml');
  const productServicePath = path.join(backendSrcDir, 'products', 'productService.ts');
  const reviewControllerPath = path.join(backendSrcDir, 'reviews', 'reviewController.ts');
  const appTsPath = path.join(backendSrcDir, 'app.ts');

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: File Existence & Structure
  // ──────────────────────────────────────────────────────────────────────────

  it('1. product-details.html exists in public/site/', () => {
    expect(fs.existsSync(productDetailsPath)).toBe(true);
  });

  it('2. productsData.js exists in public/site/js/', () => {
    expect(fs.existsSync(productsDataPath)).toBe(true);
  });

  it('3. products.html exists in public/site/', () => {
    expect(fs.existsSync(productsPath)).toBe(true);
  });

  it('4. script.js exists in public/site/', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: Product Details Page Structure
  // ──────────────────────────────────────────────────────────────────────────

  it('5. product-details.html has correct page title meta', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('<title>Product Details');
    expect(html).toContain('Satvik Swaad');
  });

  it('6. product-details.html contains canonical and meta description', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('meta name="description"');
  });

  it('7. product-details.html contains main product section', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('id="pd-main-section"');
    expect(html).toContain('id="pd-title"');
    expect(html).toContain('id="pd-main-img"');
    expect(html).toContain('id="pd-price-val"');
  });

  it('8. product-details.html contains variant selector container', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('id="pd-variants-container"');
    expect(html).toContain('Select Pack Size / Weight');
  });

  it('9. product-details.html contains quantity controls', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('id="pd-qty-minus"');
    expect(html).toContain('id="pd-qty-plus"');
    expect(html).toContain('id="pd-qty-val"');
    expect(html).toContain('id="pd-btn-add-cart"');
  });

  it('10. product-details.html contains disabled Buy Now notice', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('Buy Now Status');
    expect(html).toContain('COMMERCE_ENABLED=false');
  });

  it('11. product-details.html contains error/not-found container', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('id="pd-error-container"');
    expect(html).toContain('id="pd-error-heading"');
    expect(html).toContain('Product Not Found');
  });

  it('12. product-details.html contains verified product specs section', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('Verified Product Specifications');
    expect(html).toContain('id="pd-full-desc"');
    expect(html).toContain('id="pd-ingredients"');
    expect(html).toContain('id="pd-storage-info"');
    expect(html).toContain('id="pd-shelf-life"');
    expect(html).toContain('id="pd-allergens"');
    expect(html).toContain('id="pd-packaging"');
  });

  it('13. product-details.html contains product-specific reviews section', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('id="pd-reviews-container"');
    expect(html).toContain('Verified Customer Reviews');
    expect(html).toContain('approved public reviews');
  });

  it('14. product-details.html contains related products section', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('id="pd-related-grid"');
    expect(html).toContain('You Might Also Like');
  });

  it('15. product-details.html has breadcrumb navigation', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('id="pd-breadcrumb-title"');
    expect(html).toContain('aria-label="Breadcrumb"');
  });

  it('16. product-details.html contains footer with all policy links', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('privacy-policy.html');
    expect(html).toContain('terms-and-conditions.html');
    expect(html).toContain('shipping-delivery-policy.html');
    expect(html).toContain('cancellation-refund-policy.html');
    expect(html).toContain('FSSAI Licence');
    expect(html).toContain('PENDING');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: Products Data Catalogue (Fallback/Display)
  // ──────────────────────────────────────────────────────────────────────────

  it('17. productsData.js contains PRODUCTS_CATALOGUE export with 15 products', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    expect(js).toContain('PRODUCTS_CATALOGUE');
    expect(js).toContain('export');
    // Ensure all 15 product IDs are present
    const prodIds = [
      'prod_aam_achar', 'prod_kareli_achar', 'prod_amla_achar', 'prod_amla_chutney',
      'prod_laal_mirch_achar', 'prod_hari_mirch_achar', 'prod_nimbu_achar',
      'prod_lhsun_achar', 'prod_mix_veg_achar', 'prod_amla_murabba',
      'prod_seb_murabba', 'prod_gond_laddu', 'prod_besan_laddu',
      'prod_amla_juice', 'prod_chyawanprash'
    ];
    prodIds.forEach(id => {
      expect(js).toContain(`"${id}"`);
    });
  });

  it('18. productsData.js defines variants with id, label, weightGrams, price, mrp, sku, stock, active', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    expect(js).toContain('variants');
    expect(js).toContain('weightGrams');
    expect(js).toContain('sku');
    expect(js).toContain('active');
    expect(js).toContain('mrp');
    expect(js).toContain('stock');
  });

  it('19. productsData.js has verified product detail fields', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    expect(js).toContain('ingredients');
    expect(js).toContain('storageInfo');
    expect(js).toContain('shelfLife');
    expect(js).toContain('allergens');
    expect(js).toContain('packaging');
    expect(js).toContain('rating');
    expect(js).toContain('reviewCount');
  });

  it('20. productsData.js does not claim to be authoritative', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    // The file should explicitly note it is a fallback/display dataset
    expect(js.toLowerCase()).toContain('fallback');
    // It should NOT label itself as authoritative
    const jsLower = js.toLowerCase();
    const lines = jsLower.split('\n');
    const commentLines = lines.filter(l => l.trim().startsWith('*') || l.trim().startsWith('//'));
    const hasAuthoritativeClaim = commentLines.some(l => l.includes('authoritative') && !l.includes('not authoritative') && !l.includes('cloud firestore is authoritative'));
    expect(hasAuthoritativeClaim).toBe(false);
  });

  it('21. productsData.js variant SKUs are unique across all products', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    const skuMatches = js.match(/sku:\s*"([^"]+)"/g) || [];
    const skus = skuMatches.map(m => m.replace(/sku:\s*"/, '').replace('"', ''));
    const uniqueSkus = new Set(skus);
    expect(uniqueSkus.size).toBe(skus.length);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4: Cart Key Collision Safety (::)
  // ──────────────────────────────────────────────────────────────────────────

  it('22. script.js uses collision-safe :: delimiter for cart line keys', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('${productId}::${');
    // Should NOT use simple underscore concatenation for line keys
    const hasUnsafeKey = /lineKey\s*=\s*`\$\{productId\}_\$\{variantId\}`/.test(js);
    expect(hasUnsafeKey).toBe(false);
  });

  it('23. script.js uses satwikCart_v2 storage key', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('satwikCart_v2');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 5: Versioned Idempotent Cart Migration
  // ──────────────────────────────────────────────────────────────────────────

  it('24. script.js backs up legacy cart before migration', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('satwikCart_backup_v1');
    expect(js).toContain('BACKUP_STORAGE_KEY');
  });

  it('25. script.js handles legacy products without active variant', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // Legacy products without a matching catalogue entry should be marked unavailable
    expect(js).toContain('unavailable');
    expect(js).toContain('legacy');
  });

  it('26. script.js migration is idempotent (checks for v2 first)', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // Should try to load v2 key first, only migrate if v2 does not exist
    expect(js).toContain('CART_STORAGE_KEY');
    expect(js).toContain('LEGACY_STORAGE_KEY');
    const loadFn = js.includes('loadAndMigrateCart');
    expect(loadFn).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6: Quantity Limits & Stock Enforcement
  // ──────────────────────────────────────────────────────────────────────────

  it('27. script.js enforces maximum quantity cap', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // Should check stock limits and cap at a sensible max
    expect(js).toContain('maxQty');
    expect(js).toContain('Maximum available stock');
  });

  it('28. script.js prevents adding out-of-stock variants', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('out of stock');
  });

  it('29. script.js prevents adding inactive variants', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('currently unavailable');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 7: Malformed Query Parameter & XSS Protection
  // ──────────────────────────────────────────────────────────────────────────

  it('30. script.js validates product ID format from URL query parameter', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // Should validate ID against a safe pattern
    expect(js).toContain('URLSearchParams');
    expect(js.includes('/^[a-zA-Z0-9_-]+$/') || js.includes('[a-zA-Z0-9_-]')).toBe(true);
  });

  it('31. script.js shows error state for invalid/missing product ID', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('Invalid Product Request');
    expect(js).toContain('pd-error-container');
  });

  it('32. script.js sanitizes product ID before display', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('sanitizeText');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 8: Enhanced Products Page Cards
  // ──────────────────────────────────────────────────────────────────────────

  it('33. products.html cards include data-product-id attribute', () => {
    const html = fs.readFileSync(productsPath, 'utf8');
    expect(html).toContain('data-product-id="prod_aam_achar"');
    expect(html).toContain('data-product-id="prod_chyawanprash"');
  });

  it('34. products.html cards include View Details link to product-details.html', () => {
    const html = fs.readFileSync(productsPath, 'utf8');
    expect(html).toContain('product-details.html?id=prod_aam_achar');
    expect(html).toContain('View Details');
  });

  it('35. products.html cards include rating and review count badge', () => {
    const html = fs.readFileSync(productsPath, 'utf8');
    // At least the first product should have a rating display
    expect(html).toContain('★ 4.9');
    expect(html).toContain('(28)');
  });

  it('36. products.html cards include Available Packs weight summary', () => {
    const html = fs.readFileSync(productsPath, 'utf8');
    expect(html).toContain('Available Packs:');
    expect(html).toContain('250 g');
    expect(html).toContain('500 g');
    expect(html).toContain('1 kg');
  });

  it('37. products.html contains all 15 product cards', () => {
    const html = fs.readFileSync(productsPath, 'utf8');
    const cardMatches = html.match(/class="product-card"[^>]*data-product-id="/g);
    expect(cardMatches).not.toBeNull();
    expect(cardMatches!.length).toBe(15);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 9: Backend Variant Support
  // ──────────────────────────────────────────────────────────────────────────

  it('38. productService.ts defines AuthoritativeVariant interface', () => {
    const ts = fs.readFileSync(productServicePath, 'utf8');
    expect(ts).toContain('AuthoritativeVariant');
    expect(ts).toContain('weightGrams');
    expect(ts).toContain('sku');
    expect(ts).toContain('active');
  });

  it('39. productService.ts validates variantId in transaction lookup', () => {
    const ts = fs.readFileSync(productServicePath, 'utf8');
    expect(ts).toContain('variantId');
    expect(ts).toContain('selectedVariant');
    expect(ts).toContain('not found or inactive');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 10: Server-Side Review Filtering
  // ──────────────────────────────────────────────────────────────────────────

  it('40. reviewController.ts exports handleGetApprovedReviews function', () => {
    const ts = fs.readFileSync(reviewControllerPath, 'utf8');
    expect(ts).toContain('handleGetApprovedReviews');
    expect(ts).toContain('export');
  });

  it('41. reviewController.ts filters reviews server-side by productId and approved status', () => {
    const ts = fs.readFileSync(reviewControllerPath, 'utf8');
    expect(ts).toContain("where('approved', '==', true)");
    expect(ts).toContain("where('productId', '==', productId)");
  });

  it('42. reviewController.ts validates productId query parameter format', () => {
    const ts = fs.readFileSync(reviewControllerPath, 'utf8');
    expect(ts).toContain('Invalid product ID format');
    expect(ts.includes('/^[a-zA-Z0-9_-]+$/') || ts.includes('[a-zA-Z0-9_-]')).toBe(true);
  });

  it('43. app.ts mounts GET /api/v1/reviews endpoint', () => {
    const ts = fs.readFileSync(appTsPath, 'utf8');
    expect(ts).toContain("app.get('/api/v1/reviews'");
    expect(ts).toContain('handleGetApprovedReviews');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 11: SEO & Sitemap
  // ──────────────────────────────────────────────────────────────────────────

  it('44. sitemap.xml includes all 15 product detail discoverable URLs', () => {
    const xml = fs.readFileSync(sitemapPath, 'utf8');
    const productIds = [
      'prod_aam_achar', 'prod_kareli_achar', 'prod_amla_achar', 'prod_amla_chutney',
      'prod_laal_mirch_achar', 'prod_hari_mirch_achar', 'prod_nimbu_achar',
      'prod_lhsun_achar', 'prod_mix_veg_achar', 'prod_amla_murabba',
      'prod_seb_murabba', 'prod_gond_laddu', 'prod_besan_laddu',
      'prod_amla_juice', 'prod_chyawanprash'
    ];
    productIds.forEach(id => {
      expect(xml).toContain(`product-details.html?id=${id}`);
    });
  });

  it('45. sitemap.xml includes products.html listing page', () => {
    const xml = fs.readFileSync(sitemapPath, 'utf8');
    expect(xml).toContain('products.html');
  });

  it('46. sitemap.xml includes policy and static pages', () => {
    const xml = fs.readFileSync(sitemapPath, 'utf8');
    expect(xml).toContain('privacy-policy.html');
    expect(xml).toContain('terms-and-conditions.html');
    expect(xml).toContain('shipping-delivery-policy.html');
    expect(xml).toContain('cancellation-refund-policy.html');
    expect(xml).toContain('contact.html');
    expect(xml).toContain('why-us.html');
    expect(xml).toContain('our-story.html');
    expect(xml).toContain('reviews.html');
    expect(xml).toContain('faq.html');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 12: Commerce/Checkout Gating
  // ──────────────────────────────────────────────────────────────────────────

  it('47. product-details.html Buy Now button explicitly disabled with commerce notice', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('COMMERCE_ENABLED=false');
    expect(html).toContain('currently disabled');
  });

  it('48. script.js cart totals remain informational (no payment processing)', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // Order placement sends to backend which validates commerce gates; no client-side payment processing
    expect(js).not.toContain('stripe');
    expect(js).not.toContain('razorpay');
    expect(js).not.toContain('paypal');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 13: Accessibility
  // ──────────────────────────────────────────────────────────────────────────

  it('49. product-details.html has aria-labels on interactive elements', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('aria-label="Decrease quantity"');
    expect(html).toContain('aria-label="Increase quantity"');
    expect(html).toContain('aria-label="Select Product Weight Variant"');
  });

  it('50. product-details.html has skip link and role=main landmark', () => {
    const html = fs.readFileSync(productDetailsPath, 'utf8');
    expect(html).toContain('skip-link');
    expect(html).toContain('role="main"');
    expect(html).toContain('role="banner"');
    expect(html).toContain('role="contentinfo"');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 14: Product Detail Modules — script.js functions
  // ──────────────────────────────────────────────────────────────────────────

  it('51. script.js initializes product details page from URL query', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('initProductDetailsPage');
    expect(js).toContain('URLSearchParams');
    expect(js).toContain("urlParams.get('id')");
  });

  it('52. script.js fetches product-specific reviews from server endpoint', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('fetchProductReviews');
    expect(js).toContain('/api/v1/reviews?productId=');
  });

  it('53. script.js renders related products by category', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('pd-related-grid');
    expect(js).toContain('category');
  });

  it('54. script.js addToCart function requires both productId and variantId', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // The addToCart function should have a variantId parameter
    expect(js).toContain('function addToCart(productId, variantId');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 15: Firestore Rules — Variant Field Support
  // ──────────────────────────────────────────────────────────────────────────

  it('55. firestore.rules allows variants field in product writes', () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    expect(rules).toContain("'variants'");
    // Also verify extended product detail fields
    expect(rules).toContain("'images'");
    expect(rules).toContain("'ingredients'");
    expect(rules).toContain("'allergens'");
    expect(rules).toContain("'packaging'");
  });

  it('56. firestore.rules allows sweets and health categories', () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    expect(rules).toContain("'sweets'");
    expect(rules).toContain("'health'");
  });

  it('57. firestore.rules retains default-deny for all collections', () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    expect(rules).toContain('allow read, write: if false;');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 16: Admin Variant Management API
  // ──────────────────────────────────────────────────────────────────────────

  it('58. adminController.ts exports updateAdminVariants function', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    expect(ts).toContain('export async function updateAdminVariants');
    expect(ts).toContain('PRODUCT_VARIANTS_UPDATED');
  });

  it('59. adminController.ts validates duplicate variant SKUs on creation', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    expect(ts).toContain('Duplicate variant SKU');
    expect(ts).toContain('variantSkus');
  });

  it('60. adminController.ts validates duplicate variant IDs', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    expect(ts).toContain('Duplicate variant ID');
    expect(ts).toContain('variantIds');
  });

  it('61. adminController.ts validates variant ID format with safe pattern', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    // updateAdminVariants should validate variant ID format
    expect(ts).toContain('[a-zA-Z0-9_-]');
  });

  it('62. adminController.ts validates variant price must be positive', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    expect(ts).toContain('must be positive');
  });

  it('63. adminController.ts validates MRP >= price for variants', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    expect(ts).toContain('>= price');
  });

  it('64. adminController.ts validates variant stock as non-negative integer', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    expect(ts).toContain('non-negative integer');
  });

  it('65. app.ts mounts PUT /api/v1/admin/products/:productId/variants', () => {
    const ts = fs.readFileSync(appTsPath, 'utf8');
    expect(ts).toContain("app.put('/api/v1/admin/products/:productId/variants'");
    expect(ts).toContain('updateAdminVariants');
  });

  it('66. adminController.ts ALLOWED_KEYS includes variants and extended fields', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    // createAdminProduct should accept variants
    const keySection = ts.substring(ts.indexOf('ALLOWED_KEYS'), ts.indexOf('ALLOWED_KEYS') + 500);
    expect(keySection).toContain("'variants'");
    expect(keySection).toContain("'images'");
    expect(keySection).toContain("'ingredients'");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 17: XSS Payload & Malformed ID Protection
  // ──────────────────────────────────────────────────────────────────────────

  it('67. script.js rejects XSS payloads in product ID URL param', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // Must validate ID against alphanumeric + underscore + dash pattern
    expect(js).toContain('Invalid Product Request');
    expect(js).toContain('pd-error-container');
    // Regex validation present
    expect(js.match(/\[a-zA-Z0-9_-\]/)).not.toBeNull();
  });

  it('68. reviewController.ts rejects XSS payloads in productId query param', () => {
    const ts = fs.readFileSync(reviewControllerPath, 'utf8');
    expect(ts).toContain('Invalid product ID format');
    // Regex validation present
    expect(ts.match(/\[a-zA-Z0-9_-\]/)).not.toBeNull();
  });

  it('69. script.js uses sanitizeText from security.js module', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain("import { sanitizeText");
    expect(js).toContain("from './js/security.js'");
  });

  it('70. security.js exists and exports sanitizeText, validateUrl, createSafeElement', () => {
    const secPath = path.join(publicSiteDir, 'js', 'security.js');
    expect(fs.existsSync(secPath)).toBe(true);
    const js = fs.readFileSync(secPath, 'utf8');
    expect(js).toContain('sanitizeText');
    expect(js).toContain('validateUrl');
    expect(js).toContain('createSafeElement');
    expect(js).toContain('export');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 18: Calculation Accuracy & Variant Price Consistency
  // ──────────────────────────────────────────────────────────────────────────

  it('71. productsData.js all variants have MRP >= price', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    // Extract all price/mrp pairs
    const priceMatches = js.match(/price:\s*(\d+)/g) || [];
    const mrpMatches = js.match(/mrp:\s*(\d+)/g) || [];
    // Same count of price and mrp values
    expect(priceMatches.length).toBe(mrpMatches.length);
    // All MRP values should be >= corresponding price
    for (let i = 0; i < priceMatches.length; i++) {
      const price = parseInt(priceMatches[i].replace(/price:\s*/, ''));
      const mrp = parseInt(mrpMatches[i].replace(/mrp:\s*/, ''));
      expect(mrp).toBeGreaterThanOrEqual(price);
    }
  });

  it('72. productsData.js all variant stock values are non-negative integers', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    const stockMatches = js.match(/stock:\s*(\d+)/g) || [];
    expect(stockMatches.length).toBeGreaterThan(0);
    stockMatches.forEach(m => {
      const val = parseInt(m.replace(/stock:\s*/, ''));
      expect(val).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(val)).toBe(true);
    });
  });

  it('73. productsData.js all variant weightGrams are positive', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    const wMatches = js.match(/weightGrams:\s*(\d+)/g) || [];
    expect(wMatches.length).toBeGreaterThan(0);
    wMatches.forEach(m => {
      const val = parseInt(m.replace(/weightGrams:\s*/, ''));
      expect(val).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 19: Cart Migration Safety
  // ──────────────────────────────────────────────────────────────────────────

  it('74. script.js legacy migration handles parse errors gracefully', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('Legacy cart migration error');
    expect(js).toContain('catch (mErr)');
  });

  it('75. script.js legacy migration preserves unavailable products with legacy flag', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain("variantId: 'legacy'");
    expect(js).toContain('unavailable: true');
    expect(js).toContain("'Unavailable Product'");
  });

  it('76. script.js migration handles missing productId in legacy items', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // Should check for both item.productId and item.id
    expect(js).toContain('item.productId || item.id');
    // Should skip items without any ID
    expect(js).toContain('!item.id && !item.productId');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 20: Stock & Quantity Bounds
  // ──────────────────────────────────────────────────────────────────────────

  it('77. script.js enforces quantity cap at min(stock, 50)', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // The max quantity formula
    expect(js).toContain('Math.min(');
    expect(js).toContain('50)');
    expect(js).toContain('maxQty');
  });

  it('78. script.js prevents negative quantities', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    // Quantity decrease should check for minimum 1
    expect(js).toContain('selectedQty > 1');
  });

  it('79. script.js removes cart item when quantity reaches zero', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    expect(js).toContain('targetQty <= 0');
    expect(js).toContain('delete cart[lineKey]');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 21: Backend Variant Validation in Transaction
  // ──────────────────────────────────────────────────────────────────────────

  it('80. productService.ts rejects inactive variant in transaction', () => {
    const ts = fs.readFileSync(productServicePath, 'utf8');
    expect(ts).toContain('not found or inactive');
    expect(ts).toContain("v.active !== false");
  });

  it('81. productService.ts validates price > 0 in transaction', () => {
    const ts = fs.readFileSync(productServicePath, 'utf8');
    expect(ts).toContain('price <= 0');
    expect(ts).toContain('Invalid product price');
  });

  it('82. productService.ts verifies product exists in Firestore transaction', () => {
    const ts = fs.readFileSync(productServicePath, 'utf8');
    expect(ts).toContain('!snap.exists');
    expect(ts).toContain('not found in store catalog');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 22: Unauthorized Write Protection
  // ──────────────────────────────────────────────────────────────────────────

  it('83. firestore.rules denies direct client order creation', () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    // orders collection - create if false
    const ordersSection = rules.substring(rules.indexOf('ORDERS COLLECTION'));
    expect(ordersSection).toContain('allow create: if false');
  });

  it('84. firestore.rules denies direct client message creation', () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    const messagesSection = rules.substring(rules.indexOf('MESSAGES COLLECTION'));
    expect(messagesSection).toContain('allow create: if false');
  });

  it('85. script.js does not contain payment processor references', () => {
    const js = fs.readFileSync(scriptPath, 'utf8');
    const jsLower = js.toLowerCase();
    expect(jsLower).not.toContain('stripe');
    expect(jsLower).not.toContain('razorpay');
    expect(jsLower).not.toContain('paypal');
    expect(jsLower).not.toContain('payment_intent');
    expect(jsLower).not.toContain('checkout_session');
  });
});
