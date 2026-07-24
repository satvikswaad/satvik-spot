import fs from 'fs';
import path from 'path';

describe('Phase 14 — Cancellation and Refund Policy Page Tests', () => {
  const publicSiteDir = path.resolve(__dirname, '../../public/site');
  const cancellationPath = path.join(publicSiteDir, 'cancellation-refund-policy.html');
  const shippingPath = path.join(publicSiteDir, 'shipping-delivery-policy.html');
  const termsPath = path.join(publicSiteDir, 'terms-and-conditions.html');
  const privacyPath = path.join(publicSiteDir, 'privacy-policy.html');
  const sitemapPath = path.join(publicSiteDir, 'sitemap.xml');

  // TEST 1: Cancellation and Refund Policy file exists
  it('1. Cancellation and Refund Policy page exists in public/site/', () => {
    expect(fs.existsSync(cancellationPath)).toBe(true);
  });

  // TEST 2: Effective and Last Updated dates exist
  it('2. Effective and Last Updated dates are present', () => {
    const html = fs.readFileSync(cancellationPath, 'utf8');
    expect(html).toContain('Effective Date:');
    expect(html).toContain('July 19, 2026');
    expect(html).toContain('Last Updated:');
    expect(html).toContain('July 22, 2026');
  });

  // TEST 3: All required Cancellation & Refund Policy sections exist
  it('3. All required Cancellation & Refund Policy sections and headings exist', () => {
    const html = fs.readFileSync(cancellationPath, 'utf8');
    
    // Page H1 title
    expect(html).toContain('<h1 class="page-title">Cancellation and Refund Policy</h1>');

    // Key Section H2 titles
    expect(html).toContain('Introduction');
    expect(html).toContain('Scope of this Policy');
    expect(html).toContain('Current Commerce Status');
    expect(html).toContain('Current Online-Ordering Status');
    expect(html).toContain('Current Cancellation Availability');
    expect(html.includes('Current Return and Replacement Availability') || html.includes('Current Return & Replacement')).toBe(true);
    expect(html).toContain('Current Refund Availability');
    expect(html.includes('Catalogue & Cart Limitations') || html.includes('Catalogue &amp; Cart Limitations')).toBe(true);
    expect(html.includes('Order Acceptance & Confirmation') || html.includes('Order Acceptance &amp; Confirmation')).toBe(true);
    expect(html).toContain('Future Customer Cancellation Requests');
    expect(html).toContain('Future Seller-Initiated Cancellations');
    expect(html).toContain('Future Cancellation Eligibility');
    expect(html).toContain('Future Cancellation Deadlines');
    expect(html).toContain('Future Cancellation Charges or Deductions');
    expect(html).toContain('Future Return Eligibility');
    expect(html.includes('Food Safety & Perishable Product Considerations') || html.includes('Food Safety &amp; Perishable')).toBe(true);
    expect(html.includes('Non-Returnable & Restricted Items') || html.includes('Non-Returnable &amp; Restricted')).toBe(true);
    expect(html).toContain('Damaged, Defective, Missing, or Incorrect Items');
    expect(html).toContain('Evidence Guidelines');
    expect(html.includes('Future Replacement & Exchange Handling') || html.includes('Future Replacement &amp; Exchange')).toBe(true);
    expect(html).toContain('Future Refund Eligibility');
    expect(html).toContain('Future Refund Method');
    expect(html).toContain('Future Refund-Processing Timelines');
    expect(html).toContain('Original Shipping or Delivery Charges');
    expect(html).toContain('Failed or Unsuccessful Delivery');
    expect(html).toContain('Refused Deliveries');
    expect(html).toContain('Customer-Provided Incorrect Information');
    expect(html.includes('Marketplace & Third-Party Purchases') || html.includes('Marketplace &amp; Third-Party')).toBe(true);
    expect(html.includes('Chargebacks & Payment Disputes') || html.includes('Chargebacks &amp; Payment')).toBe(true);
    expect(html.includes('Abuse, Fraud & Repeated Misuse') || html.includes('Abuse, Fraud &amp; Repeated')).toBe(true);
    expect(html.includes('Consumer Rights & Statutory Protections') || html.includes('Consumer Rights &amp; Statutory')).toBe(true);
    expect(html).toContain('Relationship with Terms and Conditions');
    expect(html.includes('Relationship with Shipping & Delivery Policy') || html.includes('Relationship with Shipping &amp; Delivery')).toBe(true);
    expect(html).toContain('Relationship with Privacy Policy');
    expect(html.includes('Service Interruptions & Exceptional Circumstances') || html.includes('Service Interruptions &amp; Exceptional')).toBe(true);
    expect(html).toContain('Changes to this Policy');
    expect(html.includes('Contact & Complaint Method') || html.includes('Contact &amp; Complaint')).toBe(true);
    expect(html.includes('Legal & Operational Review Notice') || html.includes('Legal &amp; Operational')).toBe(true);
  });

  // TEST 4: Table of Contents navigation works
  it('4. Table of contents contains valid internal anchor links', () => {
    const html = fs.readFileSync(cancellationPath, 'utf8');
    expect(html).toContain('<aside class="policy-toc"');
    expect(html).toContain('href="#sec-intro"');
    expect(html).toContain('href="#sec-scope"');
    expect(html).toContain('href="#sec-commerce-status"');
    expect(html).toContain('href="#sec-cancellation-availability"');
    expect(html).toContain('href="#sec-refunds-availability"');
    expect(html).toContain('href="#sec-statutory-rights"');
  });

  // TEST 5: Navigation links exist (Home, Contact, Privacy Policy, Terms, Shipping)
  it('5. Home, Contact, Privacy Policy, Terms, and Shipping routes are correctly linked', () => {
    const html = fs.readFileSync(cancellationPath, 'utf8');
    expect(html).toContain('href="index.html"');
    expect(html).toContain('href="contact.html"');
    expect(html).toContain('href="privacy-policy.html"');
    expect(html).toContain('href="terms-and-conditions.html"');
    expect(html).toContain('href="shipping-delivery-policy.html"');
  });

  // TEST 6: All customer site pages include Cancellation & Refund Policy in footer
  it('6. Footer across all customer site HTML pages contains Cancellation and Refund Policy link', () => {
    const pages = [
      'index.html', 'products.html', 'why-us.html', 'our-story.html',
      'reviews.html', 'faq.html', 'contact.html', 'privacy-policy.html',
      'terms-and-conditions.html', 'shipping-delivery-policy.html',
      'cancellation-refund-policy.html'
    ];
    
    pages.forEach((page) => {
      const pagePath = path.join(publicSiteDir, page);
      expect(fs.existsSync(pagePath)).toBe(true);
      const html = fs.readFileSync(pagePath, 'utf8');
      expect(html).toContain('cancellation-refund-policy.html');
    });
  });

  // TEST 7: Sitemap contains Cancellation and Refund Policy URL
  it('7. sitemap.xml contains Cancellation and Refund Policy URL', () => {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    expect(sitemap).toContain('<loc>https://satwikspot.web.app/cancellation-refund-policy.html</loc>');
  });

  // TEST 8: Prohibited claims ("100% secure", "unhackable", "guaranteed refund") are absent
  it('8. No prohibited absolute claims ("100% secure", "unhackable", "guaranteed refund") exist', () => {
    const html = fs.readFileSync(cancellationPath, 'utf8').toLowerCase();
    expect(html).not.toContain('100% secure');
    expect(html).not.toContain('completely secure');
    expect(html).not.toContain('unhackable');
    expect(html).not.toContain('guaranteed refund');
  });

  // TEST 9: Disabled features accurately disclosed
  it('9. Commerce, checkout, payments, cancellations, returns, and refunds are disclosed as disabled', () => {
    const html = fs.readFileSync(cancellationPath, 'utf8');
    expect(html).toContain('COMMERCE_ENABLED=false');
    expect(html).toContain('Online Cancellations Inactive');
    expect(html).toContain('Refunds Inactive');
    expect(html).toContain('PAYMENTS_ENABLED=false');
  });

  // TEST 10: Zero fake details or invented refund timelines
  it('10. No fake phone numbers, fake addresses, fake refund fees, or fake credit timelines exist', () => {
    const html = fs.readFileSync(cancellationPath, 'utf8');
    expect(html).not.toContain('123 Fake Street');
    expect(html).not.toContain('Restocking Fee ₹150');
    expect(html).not.toContain('0000000000');
  });

  // TEST 11: Zero inline scripts in Cancellation Policy page
  it('11. Cancellation and Refund Policy page contains zero inline <script> tags', () => {
    const html = fs.readFileSync(cancellationPath, 'utf8');
    const matches = html.match(/<script(?![^>]*src=)[^>]*>/gi);
    expect(matches).toBeNull();
  });

  // TEST 12: Consistency with Privacy Policy, Terms, and Shipping disclosures
  it('12. Cancellation disclosures are consistent with Privacy Policy, Terms, and Shipping Policy', () => {
    const cancellationHtml = fs.readFileSync(cancellationPath, 'utf8');
    const shippingHtml = fs.readFileSync(shippingPath, 'utf8');
    const termsHtml = fs.readFileSync(termsPath, 'utf8');
    const privacyHtml = fs.readFileSync(privacyPath, 'utf8');

    // All disclose COMMERCE_ENABLED=false
    expect(cancellationHtml).toContain('COMMERCE_ENABLED=false');
    expect(shippingHtml).toContain('COMMERCE_ENABLED=false');
    expect(termsHtml).toContain('COMMERCE_ENABLED=false');
    expect(privacyHtml).toContain('COMMERCE_ENABLED=false');

    // All link to contact.html
    expect(cancellationHtml).toContain('contact.html');
    expect(shippingHtml).toContain('contact.html');
    expect(termsHtml).toContain('contact.html');
    expect(privacyHtml).toContain('contact.html');
  });
});
