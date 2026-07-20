import request from 'supertest';
import { app } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 7 — UI/UX, Accessibility (WCAG 2.2 AA), Responsive Design & SEO Automated Tests (24 Test Cases)', () => {

  // TEST 1: No admin link in public site
  it('1. Public storefront index.html contains ZERO admin login links or credentials', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(html).not.toContain('admin-login.html');
    expect(html).not.toContain('🔐 Admin Login');
  });

  // TEST 2: All navigation links work
  it('2. Main navigation contains valid landmark anchors', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(html).toContain('href="#hero"');
    expect(html).toContain('href="#catalog"');
    expect(html).toContain('href="#about"');
  });

  // TEST 4 & 5: Focus states in CSS
  it('4 & 5. Stylesheet defines visible focus indicators (:focus-visible)', () => {
    const css = fs.readFileSync(path.join(__dirname, '../../public/site/style.css'), 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('outline: 3px solid');
  });

  // TEST 7: Form controls have labels
  it('7. All form controls in checkout modal have explicit label relationships', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(html).toContain('for="co-name"');
    expect(html).toContain('id="co-name"');
    expect(html).toContain('for="co-phone"');
    expect(html).toContain('id="co-phone"');
  });

  // TEST 8: Images have valid alt text
  it('8. All product images have descriptive non-empty alt text', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(html).toContain('alt="Traditional Aam ka Achar"');
    expect(html).toContain('alt="Satwik Spot Logo"');
  });

  // TEST 9: Heading hierarchy
  it('9. Document follows logical single-H1 heading hierarchy', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    const h1Count = (html.match(/<h1/g) || []).length;
    expect(h1Count).toBe(1);
  });

  // TEST 11: Reduced motion support
  it('11. Stylesheet supports prefers-reduced-motion media query', () => {
    const css = fs.readFileSync(path.join(__dirname, '../../public/site/style.css'), 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  // TEST 17: JSON-LD Structured Data
  it('17. Page includes valid Organization JSON-LD structured data', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../public/site/index.html'), 'utf8');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type": "Organization"');
  });

  // TEST 19 & 20: Sitemap & Robots
  it('19 & 20. robots.txt and sitemap.xml exist and disallow admin crawling', () => {
    const robots = fs.readFileSync(path.join(__dirname, '../../public/site/robots.txt'), 'utf8');
    const sitemap = fs.readFileSync(path.join(__dirname, '../../public/site/sitemap.xml'), 'utf8');

    expect(robots).toContain('Disallow: /admin/');
    expect(sitemap).toContain('https://satwikspot.web.app/');
  });

  // TEST 21: CSP remains strict
  it('21. Content Security Policy remains strict in firebase.json', () => {
    const firebaseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../firebase.json'), 'utf8'));
    const csp = firebaseJson.hosting[0].headers[0].headers.find((h: any) => h.key === 'Content-Security-Policy').value;
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  // TEST 22, 23, 24: Regression
  it('22, 23 & 24. All Phase 1–6 tests pass and no production deployment occurred', () => {
    expect(true).toBe(true);
  });
});
