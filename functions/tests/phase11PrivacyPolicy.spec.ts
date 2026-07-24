import fs from 'fs';
import path from 'path';

describe('Phase 11 — Privacy Policy & Contact Page Tests', () => {
  const publicSiteDir = path.resolve(__dirname, '../../public/site');
  const privacyPath = path.join(publicSiteDir, 'privacy-policy.html');
  const contactPath = path.join(publicSiteDir, 'contact.html');
  const sitemapPath = path.join(publicSiteDir, 'sitemap.xml');

  // TEST 1: Privacy Policy file exists
  it('1. Privacy Policy page exists in public/site/', () => {
    expect(fs.existsSync(privacyPath)).toBe(true);
  });

  // TEST 2: Contact page file exists
  it('2. Contact page exists in public/site/', () => {
    expect(fs.existsSync(contactPath)).toBe(true);
  });

  // TEST 3: Effective date and last updated date exist
  it('3. Effective and Last Updated dates are present', () => {
    const html = fs.readFileSync(privacyPath, 'utf8');
    expect(html).toContain('Effective Date:');
    expect(html).toContain('July 19, 2026');
    expect(html).toContain('Last Updated:');
    expect(html).toContain('July 22, 2026');
  });

  // TEST 4: All required Privacy Policy sections exist
  it('4. All required Privacy Policy sections and headings exist', () => {
    const html = fs.readFileSync(privacyPath, 'utf8');
    
    // Page H1 title
    expect(html).toContain('<h1 class="page-title">Privacy Policy</h1>');

    // Key Section H2 titles
    expect(html.includes('Introduction & Scope') || html.includes('Introduction &amp; Scope')).toBe(true);
    expect(html).toContain('Information Customers Provide');
    expect(html.includes('Authentication & Account Information') || html.includes('Authentication &amp; Account Information')).toBe(true);
    expect(html).toContain('Contact Form Information');
    expect(html.includes('Order & Transaction Information') || html.includes('Order &amp; Transaction Information')).toBe(true);
    expect(html).toContain('Automatically Collected Technical Information');
    expect(html.includes('Cookies & Browser Local Storage') || html.includes('Cookies &amp; Browser Local Storage')).toBe(true);
    expect(html).toContain('How Information is Used');
    expect(html.includes('Legal & Operational Processing Grounds') || html.includes('Legal &amp; Operational')).toBe(true);
    expect(html.includes('Firebase, Firestore & Cloud Infrastructure') || html.includes('Firebase, Firestore')).toBe(true);
    expect(html).toContain('Render Backend Application Processing');
    expect(html.includes('Service Providers & Third-Party Processors') || html.includes('Service Providers')).toBe(true);
    expect(html.includes('Data Sharing & Non-Disclosure') || html.includes('Data Sharing')).toBe(true);
    expect(html).toContain('Data Retention Policies');
    expect(html.includes('Security Safeguards & Technical Limitations') || html.includes('Security Safeguards')).toBe(true);
    expect(html).toContain("Children's Privacy");
    expect(html.includes('Customer Choices & Privacy Rights') || html.includes('Customer Choices')).toBe(true);
    expect(html.includes('Account & Data Deletion Requests') || html.includes('Account &amp; Data Deletion')).toBe(true);
    expect(html.includes('Email & Communication Preferences') || html.includes('Email &amp; Communication')).toBe(true);
    expect(html).toContain('Cross-Region Processing');
    expect(html.includes('Disabled & Future Functionality') || html.includes('Disabled &amp; Future')).toBe(true);
    expect(html).toContain('Changes to this Privacy Policy');
    expect(html).toContain('Contact Method for Privacy Questions');
  });

  // TEST 5: Table of Contents navigation works
  it('5. Table of contents contains valid internal anchor links', () => {
    const html = fs.readFileSync(privacyPath, 'utf8');
    expect(html).toContain('<aside class="policy-toc"');
    expect(html).toContain('href="#sec-intro"');
    expect(html).toContain('href="#sec-information-provided"');
    expect(html).toContain('href="#sec-authentication"');
    expect(html).toContain('href="#sec-contact-inquiries"');
    expect(html).toContain('href="#sec-disabled-features"');
  });

  // TEST 6: Navigation links exist (Home & Contact)
  it('6. Home and Contact routes are correctly linked', () => {
    const html = fs.readFileSync(privacyPath, 'utf8');
    expect(html).toContain('href="index.html"');
    expect(html).toContain('href="contact.html"');
  });

  // TEST 7: All site pages include Privacy Policy in footer
  it('7. Footer across all customer site HTML pages contains Privacy Policy link', () => {
    const pages = ['index.html', 'products.html', 'why-us.html', 'our-story.html', 'reviews.html', 'faq.html', 'contact.html', 'privacy-policy.html'];
    
    pages.forEach((page) => {
      const pagePath = path.join(publicSiteDir, page);
      expect(fs.existsSync(pagePath)).toBe(true);
      const html = fs.readFileSync(pagePath, 'utf8');
      expect(html).toContain('privacy-policy.html');
    });
  });

  // TEST 8: Sitemap contains Privacy Policy and Contact URLs
  it('8. sitemap.xml contains Privacy Policy and Contact URLs', () => {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    expect(sitemap).toContain('<loc>https://satwikspot.web.app/privacy-policy.html</loc>');
    expect(sitemap).toContain('<loc>https://satwikspot.web.app/contact.html</loc>');
  });

  // TEST 9: Prohibited absolute-security claims are absent
  it('9. No prohibited absolute-security claims ("100% secure", "unhackable") exist', () => {
    const html = fs.readFileSync(privacyPath, 'utf8').toLowerCase();
    expect(html).not.toContain('100% secure');
    expect(html).not.toContain('completely secure');
    expect(html).not.toContain('unhackable');
    expect(html).not.toContain('bulletproof security');
  });

  // TEST 10: Disabled / Deferred features accurately disclosed
  it('10. Commerce, checkout, payments, and Storage are disclosed as disabled or deferred', () => {
    const html = fs.readFileSync(privacyPath, 'utf8');
    expect(html).toContain('COMMERCE_ENABLED=false');
    expect(html).toContain('Zero Payment Card Storage');
    expect(html).toContain('Firebase Storage');
    expect(html).toContain('Marketplace Synchronization');
  });

  // TEST 11: Zero fake details or secret leaks
  it('11. No fake phone numbers, fake addresses, or internal admin secrets exist', () => {
    const html = fs.readFileSync(privacyPath, 'utf8');
    expect(html).not.toContain('123 Fake Street');
    expect(html).not.toContain('admin_owner_secret');
    expect(html).not.toContain('admin@satvik.com');
    expect(html).not.toContain('0000000000');
  });

  // TEST 12: Zero inline scripts in Privacy Policy
  it('12. Privacy Policy page contains zero inline <script> tags', () => {
    const html = fs.readFileSync(privacyPath, 'utf8');
    const matches = html.match(/<script(?![^>]*src=)[^>]*>/gi);
    expect(matches).toBeNull();
  });
});
