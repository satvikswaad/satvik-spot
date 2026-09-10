const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const pages = [
  'cookies-policy.html',
  'terms-and-conditions.html',
  'privacy-policy.html',
  'cancellation-refund-policy.html'
];

const viewports = [
  { name: 'desktop', width: 1280, height: 800, mobile: false, dsf: 1 },
  { name: 'mobile', width: 390, height: 844, mobile: true, dsf: 2 }
];

const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const remotePort = 9224;

const proc = spawn(edgeExe, [
  '--headless',
  `--remote-debugging-port=${remotePort}`,
  '--disable-gpu',
  'http://localhost:5000/cookies-policy.html'
]);

proc.on('error', (err) => {
  console.error('Failed to spawn Edge:', err);
  process.exit(1);
});

setTimeout(() => {
  http.get(`http://127.0.0.1:${remotePort}/json`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const tabs = JSON.parse(data);
      const pageTab = tabs.find(t => t.type === 'page');
      if (!pageTab) {
        console.error('No page tab found');
        proc.kill();
        process.exit(1);
      }

      const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

      ws.onopen = async () => {
        console.log('Connected to Edge DevTools WebSocket');

        // Enable Runtime and Log
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));

        const testMatrix = [];
        for (const p of pages) {
          for (const vp of viewports) {
            testMatrix.push({ page: p, viewport: vp });
          }
        }

        let currentIdx = 0;
        const auditResults = [];
        const consoleErrors = {};

        function runNextTest() {
          if (currentIdx >= testMatrix.length) {
            console.log('\n======================================================');
            console.log('POLICY PAGES DESKTOP & MOBILE AUDIT COMPLETE:');
            console.log(JSON.stringify(auditResults, null, 2));
            console.log('======================================================\n');
            
            console.log('Console Errors Summary:');
            console.log(JSON.stringify(consoleErrors, null, 2));

            ws.close();
            proc.kill();
            
            // Check if any failed
            const failures = auditResults.filter(r => !r.isZeroHorizontalScroll || r.consoleErrorsCount > 0);
            if (failures.length > 0) {
              console.error(`\n❌ Found ${failures.length} viewport/overflow/error issues!`);
              process.exit(1);
            } else {
              console.log('\n✅ All policy pages passed desktop (1280px) and mobile (390px) responsive audits with 0 overflows and 0 errors!');
              process.exit(0);
            }
          }

          const { page, viewport } = testMatrix[currentIdx];
          const testKey = `${page} @ ${viewport.name} (${viewport.width}px)`;
          console.log(`\nTesting ${testKey}...`);

          if (!consoleErrors[testKey]) consoleErrors[testKey] = [];

          // 1. Navigate
          ws.send(JSON.stringify({
            id: 1000 + currentIdx,
            method: 'Page.navigate',
            params: { url: `http://localhost:5000/${page}` }
          }));

          setTimeout(() => {
            // 2. Set Device Metrics
            ws.send(JSON.stringify({
              id: 2000 + currentIdx,
              method: 'Emulation.setDeviceMetricsOverride',
              params: {
                width: viewport.width,
                height: viewport.height,
                deviceScaleFactor: viewport.dsf,
                mobile: viewport.mobile
              }
            }));

            setTimeout(() => {
              // 3. Evaluate horizontal overflow and layout
              const evalExpr = `(() => {
                window.scrollTo(500, 0);
                const scrolledX = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;
                const docW = document.documentElement.clientWidth;
                const scrollW = document.documentElement.scrollWidth;
                const bodyW = document.body.scrollWidth;

                // Elements with overflow
                const overflowing = [];
                document.querySelectorAll('*').forEach(el => {
                  const r = el.getBoundingClientRect();
                  if (r.right > docW + 1.5 || r.left < -1.5) {
                    // Ignore elements hidden or styled with overflow hidden parents
                    const style = window.getComputedStyle(el);
                    if (style.display !== 'none' && style.visibility !== 'hidden' && style.position !== 'fixed') {
                      overflowing.push({
                        tag: el.tagName,
                        className: String(el.className).slice(0, 40),
                        id: el.id || '',
                        left: Math.round(r.left),
                        right: Math.round(r.right),
                        width: Math.round(r.width)
                      });
                    }
                  }
                });

                // Check key sections
                const header = document.querySelector('.ref-header') || document.querySelector('.site-header');
                const footer = document.querySelector('.site-footer');
                const main = document.querySelector('main') || document.querySelector('.policy-article-container') || document.querySelector('.terms-content-container') || document.querySelector('.cookie-content-container');

                return JSON.stringify({
                  page: "${page}",
                  viewport: "${viewport.name}",
                  width: ${viewport.width},
                  docW,
                  scrollW,
                  bodyW,
                  scrolledX,
                  isZeroHorizontalScroll: scrolledX === 0 && scrollW <= docW,
                  hasHeader: !!header,
                  hasFooter: !!footer,
                  hasMain: !!main,
                  overflowCount: overflowing.length,
                  overflowElements: overflowing.slice(0, 5)
                });
              })()`;

              ws.send(JSON.stringify({
                id: 3000 + currentIdx,
                method: 'Runtime.evaluate',
                params: { expression: evalExpr }
              }));
            }, 600);
          }, 1000);
        }

        ws.onmessage = (msg) => {
          const r = JSON.parse(msg.data);

          // Track runtime exceptions or console errors
          if (r.method === 'Runtime.exceptionThrown') {
            const currentTestKey = testMatrix[currentIdx] ? `${testMatrix[currentIdx].page} @ ${testMatrix[currentIdx].viewport.name}` : 'unknown';
            if (consoleErrors[currentTestKey]) {
              consoleErrors[currentTestKey].push(r.params.exceptionDetails.text);
            }
          }
          if (r.method === 'Log.entryAdded' && r.params.entry.level === 'error') {
            const currentTestKey = testMatrix[currentIdx] ? `${testMatrix[currentIdx].page} @ ${testMatrix[currentIdx].viewport.name}` : 'unknown';
            if (consoleErrors[currentTestKey]) {
              consoleErrors[currentTestKey].push(r.params.entry.text);
            }
          }

          if (r.id >= 3000 && r.id < 4000) {
            const evalResult = JSON.parse(r.result.result.value);
            const currentTestKey = `${evalResult.page} @ ${evalResult.viewport} (${evalResult.width}px)`;
            evalResult.consoleErrorsCount = (consoleErrors[currentTestKey] || []).length;
            evalResult.consoleErrors = consoleErrors[currentTestKey] || [];
            auditResults.push(evalResult);

            console.log(`  -> docW: ${evalResult.docW}px, scrollW: ${evalResult.scrollW}px, scrolledX: ${evalResult.scrolledX}px`);
            console.log(`  -> ZeroHorizontalScroll: ${evalResult.isZeroHorizontalScroll ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`  -> Overflow elements count: ${evalResult.overflowCount}`);
            if (evalResult.overflowCount > 0) {
              console.log('  -> Overflow elements:', evalResult.overflowElements);
            }
            console.log(`  -> Console Errors: ${evalResult.consoleErrorsCount === 0 ? '✅ 0' : '❌ ' + evalResult.consoleErrorsCount}`);

            currentIdx++;
            setTimeout(runNextTest, 300);
          }
        };

        runNextTest();
      };
    });
  });
}, 2000);
