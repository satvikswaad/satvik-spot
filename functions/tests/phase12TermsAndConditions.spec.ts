import fs from 'fs';
import path from 'path';

describe('Phase 12 — Terms and Conditions Page Tests', () => {
  const publicSiteDir = path.resolve(__dirname, '../../public/site');
  const termsPath = path.join(publicSiteDir, 'terms-and-conditions.html');
  const privacyPath = path.join(publicSiteDir, 'privacy-policy.html');
  const contactPath = path.join(publicSiteDir, 'contact.html');
  const sitemapPath = path.join(publicSiteDir, 'sitemap.xml');

  // TEST 1: Terms and Conditions file exists
  it('1. Terms and Conditions page exists in public/site/', () => {
    expect(fs.existsSync(termsPath)).toBe(true);
  });

  // TEST 2: Effective and Last Updated dates exist
  it('2. Effective and Last Updated dates are present', () => {
    const html = fs.readFileSync(termsPath, 'utf8');
    expect(html).toContain('Effective Date:');
    expect(html).toContain('July 19, 2026');
    expect(html).toContain('Last Updated:');
    expect(html).toContain('July 22, 2026');
  });

  // TEST 3: Key required Terms sections exist
  it('3. All required Terms & Conditions sections and headings exist', () => {
    const html = fs.readFileSync(termsPath, 'utf8');
    
    // Page H1 title
    expect(html).toContain('<h1 class="page-title">Terms and Conditions</h1>');

    // Key Section H2 titles
    expect(html).toContain('Introduction');
    expect(html).toContain('Acceptance of Terms');
    expect(html).toContain('Scope of Website');
    expect(html).toContain('Availability of Services');
    expect(html).toContain('Customer Eligibility');
    expect(html.includes('Account Registration & Security') || html.includes('Account Registration &amp; Security')).toBe(true);
    expect(html).toContain('Accurate Information Supplied by Customers');
    expect(html.includes('Product Information & Availability') || html.includes('Product Information &amp; Availability')).toBe(true);
    expect(html).toContain('Pricing Disclosures');
    expect(html).toContain('Cart Functionality');
    expect(html.includes('Commerce, Checkout & Payment Status') || html.includes('Commerce, Checkout &amp; Payment Status')).toBe(true);
    expect(html.includes('Delivery Status & Limitations') || html.includes('Delivery Status &amp; Limitations')).toBe(true);
    expect(html.includes('Cancellations & Refund Disclosures') || html.includes('Cancellations &amp; Refund Disclosures')).toBe(true);
    expect(html.includes('Reviews & User-Submitted Content') || html.includes('Reviews &amp; User-Submitted Content')).toBe(true);
    expect(html.includes('Contact Inquiries & Communications') || html.includes('Contact Inquiries &amp; Communications')).toBe(true);
    expect(html).toContain('Acceptable Use');
    expect(html).toContain('Prohibited Activities');
    expect(html).toContain('Intellectual Property Ownership');
    expect(html.includes('Third-Party Infrastructure & Service Providers') || html.includes('Third-Party Infrastructure &amp; Service Providers')).toBe(true);
    expect(html).toContain('External Links');
    expect(html.includes('Privacy & Personal Information') || html.includes('Privacy &amp; Personal Information')).toBe(true);
    expect(html.includes('Service Availability & Technical Interruptions') || html.includes('Service Availability &amp; Technical Interruptions')).toBe(true);
    expect(html).toContain('Security Limitations');
    expect(html).toContain('Disclaimer of Warranties');
    expect(html).toContain('Limitation of Liability');
    expect(html).toContain('Indemnification');
    expect(html.includes('Suspension & Access Termination') || html.includes('Suspension &amp; Access Termination')).toBe(true);
    expect(html).toContain('Changes to These Terms');
    expect(html.includes('Governing Law & Dispute Resolution') || html.includes('Governing Law &amp; Dispute Resolution')).toBe(true);
    expect(html).toContain('Severability');
    expect(html).toContain('No Waiver');
    expect(html).toContain('Entire Agreement');
    expect(html).toContain('Contact Method');
  });

  // TEST 4: Table of Contents navigation works
  it('4. Table of contents contains valid internal anchor links', () => {
    const html = fs.readFileSync(termsPath, 'utf8');
    expect(html).toContain('<aside class="policy-toc"');
    expect(html).toContain('href="#sec-intro"');
    expect(html).toContain('href="#sec-acceptance"');
    expect(html).toContain('href="#sec-commerce-status"');
    expect(html).toContain('href="#sec-delivery-status"');
    expect(html).toContain('href="#sec-refunds-status"');
    expect(html).toContain('href="#sec-ip-ownership"');
    expect(html).toContain('href="#sec-governing-law"');
  });

  // TEST 5: Navigation links exist (Home, Contact, Privacy Policy)
  it('5. Home, Contact, and Privacy Policy routes are correctly linked', () => {
    const html = fs.readFileSync(termsPath, 'utf8');
    expect(html).toContain('href="index.html"');
    expect(html).toContain('href="contact.html"');
    expect(html).toContain('href="privacy-policy.html"');
  });

  // TEST 6: All customer site pages include Terms link in footer
  it('6. Footer across all customer site HTML pages contains Terms and Conditions link', () => {
    const pages = [
      'index.html', 'products.html', 'why-us.html', 'our-story.html',
      'reviews.html', 'faq.html', 'contact.html', 'privacy-policy.html',
      'terms-and-conditions.html'
    ];
    
    pages.forEach((page) => {
      const pagePath = path.join(publicSiteDir, page);
      expect(fs.existsSync(pagePath)).toBe(true);
      const html = fs.readFileSync(pagePath, 'utf8');
      expect(html).toContain('terms-and-conditions.html');
    });
  });

  // TEST 7: Sitemap contains Terms and Conditions URL
  it('7. sitemap.xml contains Terms and Conditions URL', () => {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    expect(sitemap).toContain('<loc>https://satwikspot.web.app/terms-and-conditions.html</loc>');
  });

  // TEST 8: Prohibited absolute-security claims are absent
  it('8. No prohibited absolute-security claims ("100% secure", "unhackable") exist', () => {
    const html = fs.readFileSync(termsPath, 'utf8').toLowerCase();
    expect(html).not.toContain('100% secure');
    expect(html).not.toContain('completely secure');
    expect(html).not.toContain('unhackable');
    expect(html).not.toContain('bulletproof security');
  });

  // TEST 9: Disabled features accurately disclosed
  it('9. Commerce, checkout, payments, and Storage are disclosed as disabled or deferred', () => {
    const html = fs.readFileSync(termsPath, 'utf8');
    expect(html).toContain('COMMERCE_ENABLED=false');
    expect(html).toContain('Zero Financial Data Collection');
    expect(html).toContain('Shipping and Delivery terms');
    expect(html.includes('Cancellations & Refund Disclosures') || html.includes('Cancellations &amp; Refund Disclosures')).toBe(true);
  });

  // TEST 10: Zero fake details or secret leaks
  it('10. No fake phone numbers, fake addresses, or internal admin secrets exist', () => {
    const html = fs.readFileSync(termsPath, 'utf8');
    expect(html).not.toContain('123 Fake Street');
    expect(html).not.toContain('admin_owner_secret');
    expect(html).not.toContain('admin@satvik.com');
    expect(html).not.toContain('0000000000');
  });

  // TEST 11: Zero inline scripts in Terms page
  it('11. Terms and Conditions page contains zero inline <script> tags', () => {
    const html = fs.readFileSync(termsPath, 'utf8');
    const matches = html.match(/<script(?![^>]*src=)[^>]*>/gi);
    expect(matches).toBeNull();
  });

  // TEST 12: Consistency with Privacy Policy disclosures
  it('12. Terms disclosures are consistent with Privacy Policy', () => {
    const termsHtml = fs.readFileSync(termsPath, 'utf8');
    const privacyHtml = fs.readFileSync(privacyPath, 'utf8');

    // Both disclose COMMERCE_ENABLED=false
    expect(termsHtml).toContain('COMMERCE_ENABLED=false');
    expect(privacyHtml).toContain('COMMERCE_ENABLED=false');

    // Both link to contact.html
    expect(termsHtml).toContain('contact.html');
    expect(privacyHtml).toContain('contact.html');
  });
});
