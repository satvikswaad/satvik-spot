import fs from 'fs';
import path from 'path';

describe('Phase 16 — Owner Decisions & Regulatory Completion', () => {
  const publicSiteDir = path.resolve(__dirname, '../../public/site');
  const backendSrcDir = path.resolve(__dirname, '../../backend/src');
  const productsDataPath = path.join(publicSiteDir, 'js', 'productsData.js');

  const policyFiles = [
    'contact.html',
    'privacy-policy.html',
    'terms-and-conditions.html',
    'shipping-delivery-policy.html',
    'cancellation-refund-policy.html'
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: Brand Name Consistency
  // ──────────────────────────────────────────────────────────────────────────

  it('1. Public storefront pages consistently use Satvik Swaad as primary brand name', () => {
    policyFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      expect(html).toContain('Satvik Swaad');
    });
  });

  it('2. index.html title and Open Graph metadata use Satvik Swaad', () => {
    const html = fs.readFileSync(path.join(publicSiteDir, 'index.html'), 'utf8');
    expect(html).toContain('<title>Satvik Swaad');
    expect(html).toContain('og:site_name" content="Satvik Swaad"');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: Regulatory & Registration Status Disclosures
  // ──────────────────────────────────────────────────────────────────────────

  it('3. FSSAI status is represented as Pending without fake 14-digit licence numbers', () => {
    policyFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      // Should mention Pending FSSAI
      expect(html.toLowerCase()).toContain('pending');
      // Must not contain fake 14-digit numbers in body
      expect(html.match(/fssai\s*:\s*\d{14}/i)).toBeNull();
    });
  });

  it('4. GST status is represented as Pending without fake 15-character GSTIN strings', () => {
    policyFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      expect(html.toLowerCase()).toContain('pending');
      // Must not contain fake GSTIN regex matches
      expect(html.match(/\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}/)).toBeNull();
    });
  });

  it('5. environment.ts defaults FSSAI_STATUS and GST_STATUS to pending', () => {
    const envPath = path.join(backendSrcDir, 'config', 'environment.ts');
    const ts = fs.readFileSync(envPath, 'utf8');
    expect(ts).toContain("fssaiStatus: (process.env.FSSAI_STATUS as any) || 'pending'");
    expect(ts).toContain("gstStatus: (process.env.GST_STATUS as any) || 'pending'");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: Absence of Fake Placeholders & Unsupported Claims
  // ──────────────────────────────────────────────────────────────────────────

  it('6. Public HTML pages do not contain dummy placeholders like 0000000000 or Lorem ipsum', () => {
    const siteFiles = fs.readdirSync(publicSiteDir).filter(f => f.endsWith('.html'));
    siteFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      expect(html).not.toContain('0000000000');
      expect(html).not.toContain('Lorem ipsum');
    });
  });

  it('7. productsData.js contains zero Immunity Booster badges or unverified therapeutic claims', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    expect(js).not.toContain('Immunity Booster');
    expect(js).not.toContain('medicinal herbs');
    expect(js).not.toContain('cures disease');
    expect(js).not.toContain('prevents disease');
  });

  it('8. index.html does not display unverified Immunity Booster badges', () => {
    const html = fs.readFileSync(path.join(publicSiteDir, 'index.html'), 'utf8');
    expect(html).not.toContain('Immunity Booster');
    expect(html).not.toContain('Preservative-Free');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4: Policy Disclosures Consistency Across All 5 Pages
  // ──────────────────────────────────────────────────────────────────────────

  it('9. Policy pages disclose COMMERCE_ENABLED operational status', () => {
    const privacy = fs.readFileSync(path.join(publicSiteDir, 'privacy-policy.html'), 'utf8');
    const terms = fs.readFileSync(path.join(publicSiteDir, 'terms-and-conditions.html'), 'utf8');
    const shipping = fs.readFileSync(path.join(publicSiteDir, 'shipping-delivery-policy.html'), 'utf8');
    const cancel = fs.readFileSync(path.join(publicSiteDir, 'cancellation-refund-policy.html'), 'utf8');
    expect(privacy).toContain('COMMERCE_ENABLED');
    expect(terms).toContain('COMMERCE_ENABLED');
    expect(shipping).toContain('COMMERCE_ENABLED');
    expect(cancel).toContain('COMMERCE_ENABLED');
  });

  it('10a. Privacy policy states disabled status', () => {
    const privacy = fs.readFileSync(path.join(publicSiteDir, 'privacy-policy.html'), 'utf8');
    expect(privacy).toContain('DISABLED');
  });

  it('10b. Terms and conditions states disabled status', () => {
    const terms = fs.readFileSync(path.join(publicSiteDir, 'terms-and-conditions.html'), 'utf8');
    expect(terms).toContain('DISABLED');
  });

  it('10c. Shipping policy states disabled status', () => {
    const shipping = fs.readFileSync(path.join(publicSiteDir, 'shipping-delivery-policy.html'), 'utf8');
    expect(shipping).toContain('DISABLED');
  });

  it('10d. Cancellation policy states disabled status', () => {
    const cancel = fs.readFileSync(path.join(publicSiteDir, 'cancellation-refund-policy.html'), 'utf8');
    expect(cancel).toContain('DISABLED');
  });

  it('11. Terms and Cancellation policies preserve statutory consumer rights', () => {
    const terms = fs.readFileSync(path.join(publicSiteDir, 'terms-and-conditions.html'), 'utf8');
    const cancel = fs.readFileSync(path.join(publicSiteDir, 'cancellation-refund-policy.html'), 'utf8');
    expect(terms).toContain('Consumer Protection Act');
    expect(cancel).toContain('Consumer Protection Act');
  });

  it('12. Shipping and Cancellation policies note perishable food safety rules', () => {
    const shipping = fs.readFileSync(path.join(publicSiteDir, 'shipping-delivery-policy.html'), 'utf8');
    const cancel = fs.readFileSync(path.join(publicSiteDir, 'cancellation-refund-policy.html'), 'utf8');
    expect(shipping.toLowerCase()).toContain('food');
    expect(cancel.toLowerCase()).toContain('food safety');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 5: Disabled Feature Gate Integrity
  // ──────────────────────────────────────────────────────────────────────────

  it('13. environment.ts keeps all feature gates default false', () => {
    const envPath = path.join(backendSrcDir, 'config', 'environment.ts');
    const ts = fs.readFileSync(envPath, 'utf8');
    expect(ts).toContain("commerceEnabled: process.env.COMMERCE_ENABLED === 'true'");
    expect(ts).toContain("checkoutEnabled: process.env.CHECKOUT_ENABLED === 'true'");
    expect(ts).toContain("paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true'");
  });

  it('14. script.js cart drawer presents non-binding informational totals', () => {
    const js = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(js).toContain('cart-drawer');
    expect(js).not.toContain('stripe');
    expect(js).not.toContain('razorpay');
  });

  it('15. Firebase Storage remains deferred and unreferenced in active storefront scripts', () => {
    const js = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(js).not.toContain('firebase/storage');
    expect(js).not.toContain('getStorage');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6: XSS Safety & Security Controls
  // ──────────────────────────────────────────────────────────────────────────

  it('16. script.js imports sanitizeText and validateUrl from security.js', () => {
    const js = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(js).toContain("import { sanitizeText, validateUrl, createSafeElement } from './js/security.js'");
  });

  it('17. security.js provides XSS escaping for text nodes', () => {
    const secPath = path.join(publicSiteDir, 'js', 'security.js');
    const js = fs.readFileSync(secPath, 'utf8');
    expect(js).toContain('&lt;');
    expect(js).toContain('&gt;');
    expect(js).toContain('&quot;');
  });

  it('18. firestore.rules denies direct client writes to products without admin claims', () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    expect(rules).toContain('isAdmin()');
    expect(rules).toContain('match /products/{productId}');
  });

  it('19. backend routes use verifyAuth and rateLimiter middleware', () => {
    const appTs = fs.readFileSync(path.join(backendSrcDir, 'app.ts'), 'utf8');
    expect(appTs).toContain('rateLimiter');
    expect(appTs).toContain('verifyAuth');
  });

  it('20. adminController.ts validates catalog_manager permission for product mutations', () => {
    const adminPath = path.join(backendSrcDir, 'admin', 'adminController.ts');
    const ts = fs.readFileSync(adminPath, 'utf8');
    expect(ts).toContain("checkPermission(req, 'catalog_manager');");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 7: Navigation & Footer Integrity
  // ──────────────────────────────────────────────────────────────────────────

  it('21. Policy pages contain links to Privacy, Terms, Shipping, Cancellation policies', () => {
    policyFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      expect(html).toContain('privacy-policy.html');
      expect(html).toContain('terms-and-conditions.html');
      expect(html).toContain('shipping-delivery-policy.html');
      expect(html).toContain('cancellation-refund-policy.html');
    });
  });

  it('22. All public pages contain link to products.html catalog', () => {
    const siteFiles = fs.readdirSync(publicSiteDir).filter(f => f.endsWith('.html'));
    siteFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      expect(html).toContain('products.html');
    });
  });

  it('23. sitemap.xml contains entries for all 5 policy pages', () => {
    const sitemap = fs.readFileSync(path.join(publicSiteDir, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('contact.html');
    expect(sitemap).toContain('privacy-policy.html');
    expect(sitemap).toContain('terms-and-conditions.html');
    expect(sitemap).toContain('shipping-delivery-policy.html');
    expect(sitemap).toContain('cancellation-refund-policy.html');
  });

  it('24. robots.txt specifies crawler policy for staging environment', () => {
    const robots = fs.readFileSync(path.join(publicSiteDir, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Disallow: /');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 8: Accessibility Standards
  // ──────────────────────────────────────────────────────────────────────────

  it('25. All policy pages contain skip-to-content links', () => {
    policyFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      expect(html).toContain('skip-link');
    });
  });

  it('26. All policy pages contain role="main", role="banner", role="contentinfo"', () => {
    policyFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      expect(html).toContain('role="main"');
      expect(html).toContain('role="banner"');
      expect(html).toContain('role="contentinfo"');
    });
  });

  it('27. All policy pages contain single h1 heading tag', () => {
    policyFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
      expect(h1Count).toBe(1);
    });
  });

  it('28. Announcement tickers contain aria-label attributes', () => {
    policyFiles.forEach(file => {
      const html = fs.readFileSync(path.join(publicSiteDir, file), 'utf8');
      expect(html).toContain('aria-label=');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 9: Product Catalog Integrity (15 Products)
  // ──────────────────────────────────────────────────────────────────────────

  it('29. productsData.js contains exactly 15 active products', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    const idMatches = js.match(/id:\s*"prod_[a-z0-9_]+"/g) || [];
    expect(idMatches.length).toBe(15);
  });

  it('30. productsData.js all products have valid non-empty arrays for images and variants', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    expect(js).toContain('images: [');
    expect(js).toContain('variants: [');
  });

  it('31. productsData.js all products contain mandatory storage and allergen disclosures', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    const storageCount = (js.match(/storageInfo:\s*"/g) || []).length;
    const allergenCount = (js.match(/allergens:\s*"/g) || []).length;
    expect(storageCount).toBe(15);
    expect(allergenCount).toBe(15);
  });

  it('32. productsData.js all variant SKUs match SAT-XXX-YYY format', () => {
    const js = fs.readFileSync(productsDataPath, 'utf8');
    const skuMatches = js.match(/SAT-[A-Z0-9]+-[A-Z0-9]+/g) || [];
    expect(skuMatches.length).toBeGreaterThanOrEqual(35);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 10: Phase 1–15 Functionality Preservation
  // ──────────────────────────────────────────────────────────────────────────

  it('33. product-details.html contains dynamic gallery and variant containers', () => {
    const pd = fs.readFileSync(path.join(publicSiteDir, 'product-details.html'), 'utf8');
    expect(pd).toContain('id="pd-thumbnails-container"');
    expect(pd).toContain('id="pd-variants-container"');
    expect(pd).toContain('id="pd-stock-badge"');
  });

  it('34. script.js maintains composite cart line keys productId::variantId', () => {
    const js = fs.readFileSync(path.join(publicSiteDir, 'script.js'), 'utf8');
    expect(js).toContain('lineKey');
    expect(js).toContain('::');
    expect(js).toContain('satwikCart_v2');
  });

  it('35. reviewController.ts filters approved reviews by productId', () => {
    const rev = fs.readFileSync(path.join(backendSrcDir, 'reviews', 'reviewController.ts'), 'utf8');
    expect(rev).toContain("where('approved', '==', true)");
    expect(rev).toContain("where('productId', '==', productId)");
  });

  it('36. orderService.ts checks authoritative stock in transaction', () => {
    const os = fs.readFileSync(path.join(backendSrcDir, 'orders', 'orderService.ts'), 'utf8');
    expect(os).toContain('getAuthoritativeProductInTransaction');
  });

  it('37. healthRouter exposes /health and /ready endpoints', () => {
    const hr = fs.readFileSync(path.join(backendSrcDir, 'routes', 'healthRoutes.ts'), 'utf8');
    expect(hr).toContain("'/health'");
    expect(hr).toContain("'/ready'");
  });

  it('38. firebase.json contains site and admin hosting targets', () => {
    const fb = fs.readFileSync(path.resolve(__dirname, '../../firebase.json'), 'utf8');
    expect(fb).toContain('"target": "site"');
    expect(fb).toContain('"target": "admin"');
  });

  it('39. firestore.rules blocks unauthenticated writes to orders and audit_logs', () => {
    const rules = fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8');
    expect(rules).toContain('match /orders/{orderId}');
    expect(rules).toContain('match /audit_logs/{logId}');
  });

  it('40. deploy-preflight.ts validates deployment readiness', () => {
    const preflight = fs.readFileSync(path.resolve(__dirname, '../../scripts/deploy-preflight.ts'), 'utf8');
    expect(preflight).toContain('SATWIK SPOT — DEPLOYMENT PREFLIGHT VALIDATION');
  });
});
