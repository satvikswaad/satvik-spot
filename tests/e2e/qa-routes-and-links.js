const fs = require('fs');
const path = require('path');
const http = require('http');

const siteDir = path.resolve(__dirname, '../../public/site');

// 1. Audit static links in all HTML files
function auditLinks() {
  console.log('--- Step 1: Auditing Links in HTML Files ---');
  const htmlFiles = fs.readdirSync(siteDir).filter(f => f.endsWith('.html'));
  const issues = [];

  htmlFiles.forEach(file => {
    const filePath = path.join(siteDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Match href, src
    const hrefRegex = /href=["']([^"'#]+)(#[^"']*)?["']/g;
    const srcRegex = /src=["']([^"'?]+)(\?[^"']*)?["']/g;

    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      let target = match[1].trim();
      if (!target || target.startsWith('http:') || target.startsWith('https:') || target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('javascript:')) {
        continue;
      }
      // Remove query string
      target = target.split('?')[0];
      checkTarget(file, 'href', target);
    }

    while ((match = srcRegex.exec(content)) !== null) {
      let target = match[1].trim();
      if (!target || target.startsWith('http:') || target.startsWith('https:') || target.startsWith('data:')) {
        continue;
      }
      target = target.split('?')[0];
      checkTarget(file, 'src', target);
    }
  });

  function checkTarget(sourceFile, type, target) {
    let cleanTarget = target.startsWith('/') ? target.slice(1) : target;
    cleanTarget = cleanTarget.replace(/^\.\//, '');

    // Check if target matches existing file or known clean route
    const directPath = path.join(siteDir, cleanTarget);
    const htmlPath = path.join(siteDir, cleanTarget + '.html');
    
    // Known rewrites
    const rewrites = {
      'shop': 'products.html',
      'products': 'products.html',
      'cookies-policy': 'cookies-policy.html',
      'cancellation-policy': 'cancellation-refund-policy.html',
      'terms': 'terms-and-conditions.html',
      'privacy': 'privacy-policy.html',
      'our-story': 'our-story.html',
      'why-us': 'why-us.html',
      'contact': 'contact.html',
      'faq': 'faq.html',
      'reviews': 'reviews.html',
      'profile': 'profile.html'
    };

    const isDirect = fs.existsSync(directPath);
    const isHtml = fs.existsSync(htmlPath);
    const isRewrite = rewrites[cleanTarget] && fs.existsSync(path.join(siteDir, rewrites[cleanTarget]));

    if (!isDirect && !isHtml && !isRewrite) {
      issues.push({
        sourceFile,
        type,
        target,
        resolvedPath: directPath
      });
    }
  }

  console.log(`Audited ${htmlFiles.length} HTML files.`);
  if (issues.length === 0) {
    console.log('✅ No broken static links or missing asset references found!');
  } else {
    console.warn(`⚠️ Found ${issues.length} potentially broken links:`);
    issues.forEach(iss => console.warn(`  In ${iss.sourceFile} (${iss.type}): "${iss.target}" not found`));
  }
  return issues;
}

// 2. Audit routes on local server
function checkRoute(port, route) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: 'localhost',
      port: port,
      path: route,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          route,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          length: body.length,
          ok: res.statusCode === 200 && body.length > 0
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        route,
        statusCode: null,
        error: err.message,
        ok: false
      });
    });
  });
}

async function testAllRoutes(port) {
  console.log(`\n--- Step 2: Testing Routes on http://localhost:${port} ---`);
  const testRoutes = [
    // Clean slash routes from prompt
    '/shop',
    '/cookies-policy',
    '/cancellation-policy',
    '/terms',
    '/privacy',
    '/our-story',
    '/why-us',
    '/contact',
    '/faq',
    '/reviews',
    '/profile',
    '/cancellation-refund-policy',
    '/terms-and-conditions',
    '/privacy-policy',
    '/shipping-delivery-policy',
    // Direct .html routes
    '/index.html',
    '/products.html',
    '/cookies-policy.html',
    '/terms-and-conditions.html',
    '/privacy-policy.html',
    '/cancellation-refund-policy.html',
    '/shipping-delivery-policy.html',
    '/our-story.html',
    '/why-us.html',
    '/contact.html',
    '/faq.html',
    '/reviews.html',
    '/profile.html',
    '/cart.html',
    '/product-details.html',
    '/order-success.html',
    '/payment-failed.html',
    '/404.html'
  ];

  const results = [];
  let allOk = true;

  for (const r of testRoutes) {
    const res = await checkRoute(port, r);
    results.push(res);
    if (!res.ok) {
      allOk = false;
      console.log(`❌ ${r.padEnd(32)} -> Status: ${res.statusCode} (${res.error || 'Empty body'})`);
    } else {
      console.log(`✅ ${r.padEnd(32)} -> ${res.statusCode} OK (${res.length} bytes, ${res.contentType})`);
    }
  }

  return { allOk, results };
}

module.exports = { auditLinks, testAllRoutes };

if (require.main === module) {
  auditLinks();
  testAllRoutes(5000).then(res => {
    console.log('\nRoute Testing Complete. Overall OK:', res.allOk);
  });
}
