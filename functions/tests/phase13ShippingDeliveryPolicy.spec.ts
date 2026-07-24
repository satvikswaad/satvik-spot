import fs from 'fs';
import path from 'path';

describe('Phase 13 — Shipping and Delivery Policy Page Tests', () => {
  const publicSiteDir = path.resolve(__dirname, '../../public/site');
  const shippingPath = path.join(publicSiteDir, 'shipping-delivery-policy.html');
  const termsPath = path.join(publicSiteDir, 'terms-and-conditions.html');
  const privacyPath = path.join(publicSiteDir, 'privacy-policy.html');
  const contactPath = path.join(publicSiteDir, 'contact.html');
  const sitemapPath = path.join(publicSiteDir, 'sitemap.xml');

  // TEST 1: Shipping and Delivery Policy file exists
  it('1. Shipping and Delivery Policy page exists in public/site/', () => {
    expect(fs.existsSync(shippingPath)).toBe(true);
  });

  // TEST 2: Effective and Last Updated dates exist
  it('2. Effective and Last Updated dates are present', () => {
    const html = fs.readFileSync(shippingPath, 'utf8');
    expect(html).toContain('Effective Date:');
    expect(html).toContain('July 19, 2026');
    expect(html).toContain('Last Updated:');
    expect(html).toContain('July 22, 2026');
  });

  // TEST 3: All required Shipping & Delivery Policy sections exist
  it('3. All required Shipping & Delivery Policy sections and headings exist', () => {
    const html = fs.readFileSync(shippingPath, 'utf8');
    
    // Page H1 title
    expect(html).toContain('<h1 class="page-title">Shipping and Delivery Policy</h1>');

    // Key Section H2 titles
    expect(html).toContain('Introduction');
    expect(html).toContain('Scope of this Policy');
    expect(html).toContain('Current Commerce Status');
    expect(html).toContain('Current Online-Ordering Status');
    expect(html).toContain('Current Shipping and Delivery Availability');
    expect(html.includes('Product Catalogue & Cart Limitations') || html.includes('Product Catalogue &amp; Cart Limitations')).toBe(true);
    expect(html).toContain('Order Acceptance Status');
    expect(html.includes('Future Serviceability & Delivery Coverage') || html.includes('Future Serviceability &amp; Delivery Coverage')).toBe(true);
    expect(html).toContain('Future Shipping Methods');
    expect(html).toContain('Future Shipping Charges');
    expect(html).toContain('Future Dispatch Processing');
    expect(html).toContain('Future Delivery Estimates');
    expect(html).toContain('Future Order Tracking');
    expect(html).toContain('Customer Shipping-Address Responsibilities');
    expect(html).toContain('Address Changes');
    expect(html).toContain('Unsuccessful Delivery Attempts');
    expect(html).toContain('Damaged, Missing, or Incorrect Shipments');
    expect(html.includes('Product Availability & Fulfilment Limitations') || html.includes('Product Availability &amp; Fulfilment Limitations')).toBe(true);
    expect(html.includes('Risk & Responsibility During Delivery') || html.includes('Risk &amp; Responsibility During Delivery')).toBe(true);
    expect(html.includes('Marketplace & Third-Party Fulfilment Status') || html.includes('Marketplace &amp; Third-Party Fulfilment Status')).toBe(true);
    expect(html).toContain('International Shipping Status');
    expect(html.includes('Relationship with Cancellation & Refund Policy') || html.includes('Relationship with Cancellation &amp; Refund Policy')).toBe(true);
    expect(html.includes('Service Interruptions & Force Majeure') || html.includes('Service Interruptions &amp; Force Majeure')).toBe(true);
    expect(html).toContain('Changes to this Policy');
    expect(html).toContain('Contact Method');
  });

  // TEST 4: Table of Contents navigation works
  it('4. Table of contents contains valid internal anchor links', () => {
    const html = fs.readFileSync(shippingPath, 'utf8');
    expect(html).toContain('<aside class="policy-toc"');
    expect(html).toContain('href="#sec-intro"');
    expect(html).toContain('href="#sec-scope"');
    expect(html).toContain('href="#sec-commerce-status"');
    expect(html).toContain('href="#sec-delivery-status"');
    expect(html).toContain('href="#sec-international-shipping"');
    expect(html).toContain('href="#sec-refunds-relationship"');
  });

  // TEST 5: Navigation links exist (Home, Contact, Privacy Policy, Terms)
  it('5. Home, Contact, Privacy Policy, and Terms routes are correctly linked', () => {
    const html = fs.readFileSync(shippingPath, 'utf8');
    expect(html).toContain('href="index.html"');
    expect(html).toContain('href="contact.html"');
    expect(html).toContain('href="privacy-policy.html"');
    expect(html).toContain('href="terms-and-conditions.html"');
  });

  // TEST 6: All customer site pages include Shipping & Delivery Policy in footer
  it('6. Footer across all customer site HTML pages contains Shipping and Delivery Policy link', () => {
    const pages = [
      'index.html', 'products.html', 'why-us.html', 'our-story.html',
      'reviews.html', 'faq.html', 'contact.html', 'privacy-policy.html',
      'terms-and-conditions.html', 'shipping-delivery-policy.html'
    ];
    
    pages.forEach((page) => {
      const pagePath = path.join(publicSiteDir, page);
      expect(fs.existsSync(pagePath)).toBe(true);
      const html = fs.readFileSync(pagePath, 'utf8');
      expect(html).toContain('shipping-delivery-policy.html');
    });
  });

  // TEST 7: Sitemap contains Shipping and Delivery Policy URL
  it('7. sitemap.xml contains Shipping and Delivery Policy URL', () => {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    expect(sitemap).toContain('<loc>https://satwikspot.web.app/shipping-delivery-policy.html</loc>');
  });

  // TEST 8: Prohibited claims ("100% secure", "unhackable", "guaranteed delivery") are absent
  it('8. No prohibited absolute claims ("100% secure", "unhackable", "guaranteed delivery") exist', () => {
    const html = fs.readFileSync(shippingPath, 'utf8').toLowerCase();
    expect(html).not.toContain('100% secure');
    expect(html).not.toContain('completely secure');
    expect(html).not.toContain('unhackable');
    expect(html).not.toContain('guaranteed delivery');
  });

  // TEST 9: Disabled features accurately disclosed
  it('9. Commerce, checkout, payments, physical shipping, and Storage are disclosed as disabled or deferred', () => {
    const html = fs.readFileSync(shippingPath, 'utf8');
    expect(html).toContain('COMMERCE_ENABLED=false');
    expect(html).toContain('Physical Delivery Inactive');
    expect(html).toContain('No International Shipping');
    expect(html).toContain('MARKETPLACE_AMAZON_ENABLED=false');
  });

  // TEST 10: Zero fake details or invented shipping charges
  it('10. No fake phone numbers, fake addresses, fake courier partners, or fake shipping fees exist', () => {
    const html = fs.readFileSync(shippingPath, 'utf8');
    expect(html).not.toContain('123 Fake Street');
    expect(html).not.toContain('Bluedart Express Guaranteed');
    expect(html).not.toContain('Flat ₹99 Shipping Fee');
    expect(html).not.toContain('0000000000');
  });

  // TEST 11: Zero inline scripts in Shipping Policy page
  it('11. Shipping and Delivery Policy page contains zero inline <script> tags', () => {
    const html = fs.readFileSync(shippingPath, 'utf8');
    const matches = html.match(/<script(?![^>]*src=)[^>]*>/gi);
    expect(matches).toBeNull();
  });

  // TEST 12: Consistency with Privacy Policy and Terms disclosures
  it('12. Shipping disclosures are consistent with Privacy Policy and Terms', () => {
    const shippingHtml = fs.readFileSync(shippingPath, 'utf8');
    const termsHtml = fs.readFileSync(termsPath, 'utf8');
    const privacyHtml = fs.readFileSync(privacyPath, 'utf8');

    // All disclose COMMERCE_ENABLED=false
    expect(shippingHtml).toContain('COMMERCE_ENABLED=false');
    expect(termsHtml).toContain('COMMERCE_ENABLED=false');
    expect(privacyHtml).toContain('COMMERCE_ENABLED=false');

    // All link to contact.html
    expect(shippingHtml).toContain('contact.html');
    expect(termsHtml).toContain('contact.html');
    expect(privacyHtml).toContain('contact.html');
  });
});
