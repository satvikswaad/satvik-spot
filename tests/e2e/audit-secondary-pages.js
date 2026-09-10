const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const pages = [
  'our-story.html',
  'why-us.html',
  'profile.html',
  'products.html'
];
const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const proc = spawn(edgeExe, [
  '--headless',
  '--remote-debugging-port=9223',
  '--disable-gpu',
  'http://localhost:5000/our-story.html'
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9223/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const tabs = JSON.parse(data);
      const pageTab = tabs.find(t => t.type === 'page');
      const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

      ws.onopen = async () => {
        let pageIdx = 0;
        const results = [];

        function testPage() {
          if (pageIdx >= pages.length) {
            console.log('\n=======================================');
            console.log('SECONDARY PAGES VERIFICATION COMPLETE:');
            console.log(JSON.stringify(results, null, 2));
            console.log('=======================================\n');
            ws.close();
            proc.kill();
            process.exit(0);
          }

          const pageName = pages[pageIdx];
          console.log(`Navigating to ${pageName}...`);

          ws.send(JSON.stringify({
            id: 100 + pageIdx,
            method: 'Page.navigate',
            params: { url: `http://localhost:5000/${pageName}` }
          }));

          setTimeout(() => {
            // Set mobile device metrics (390px)
            ws.send(JSON.stringify({
              id: 200 + pageIdx,
              method: 'Emulation.setDeviceMetricsOverride',
              params: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
            }));

            setTimeout(() => {
              const evalExpr = `(() => {
                window.scrollTo(500, 0);
                const scrolledX = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;
                const docW = document.documentElement.clientWidth;
                const scrollW = document.documentElement.scrollWidth;

                // Find any elements exceeding docW
                const overflowing = [];
                document.querySelectorAll('*').forEach(el => {
                  const r = el.getBoundingClientRect();
                  if (r.right > docW + 2 || r.left < -2) {
                    overflowing.push(el.tagName + (el.className ? '.' + String(el.className).slice(0, 30) : ''));
                  }
                });

                return JSON.stringify({
                  page: "${pageName}",
                  docW,
                  scrollW,
                  scrolledX,
                  isZeroHorizontalScroll: scrolledX === 0 && scrollW <= docW,
                  overflowCount: overflowing.length,
                  samples: overflowing.slice(0, 3)
                });
              })()`;

              ws.send(JSON.stringify({
                id: 300 + pageIdx,
                method: 'Runtime.evaluate',
                params: { expression: evalExpr }
              }));
            }, 800);
          }, 1200);
        }

        ws.onmessage = (msg) => {
          const r = JSON.parse(msg.data);
          if (r.id >= 300 && r.id < 400) {
            const val = JSON.parse(r.result.result.value);
            results.push(val);
            console.log(`Result for ${val.page}: ZeroHorizontalScroll=${val.isZeroHorizontalScroll}, OverflowCount=${val.overflowCount}`);

            // Take a screenshot
            ws.send(JSON.stringify({
              id: 400 + pageIdx,
              method: 'Page.captureScreenshot',
              params: { format: 'png' }
            }));
          } else if (r.id >= 400 && r.id < 500) {
            const pageName = pages[pageIdx].replace('.html', '');
            const outDir = 'docs/design/screenshots';
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
            const buf = Buffer.from(r.result.data, 'base64');
            fs.writeFileSync(`${outDir}/secondary_${pageName}_390.png`, buf);
            pageIdx++;
            setTimeout(testPage, 400);
          }
        };

        testPage();
      };
    });
  });
}, 2000);
