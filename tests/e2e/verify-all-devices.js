const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const widths = [360, 375, 390, 430];
const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const proc = spawn(edgeExe, [
  '--headless',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  'http://localhost:5000/index.html'
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      const tabs = JSON.parse(data);
      const pageTab = tabs.find(t => t.type === 'page');
      const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

      ws.onopen = async () => {
        let idx = 0;
        const results = [];

        function testNext() {
          if (idx >= widths.length) {
            console.log('\n=======================================');
            console.log('ALL VIEWPORT VERIFICATIONS COMPLETE:');
            console.log(JSON.stringify(results, null, 2));
            console.log('=======================================\n');
            ws.close();
            proc.kill();
            process.exit(0);
          }

          const w = widths[idx];
          console.log(`Testing width ${w}px...`);

          // 1. Set emulation
          ws.send(JSON.stringify({
            id: 10 + idx,
            method: 'Emulation.setDeviceMetricsOverride',
            params: { width: w, height: 844, deviceScaleFactor: 2, mobile: true }
          }));

          setTimeout(() => {
            // 2. Evaluate viewport metrics and check horizontal scroll
            const evalExpr = `(() => {
              window.scrollTo(500, 0);
              const scrolledX = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;
              const docW = document.documentElement.clientWidth;
              const scrollW = document.documentElement.scrollWidth;
              const bodyW = document.body.scrollWidth;

              // Check landmarks
              const headerR = document.querySelector('.ref-header') ? document.querySelector('.ref-header').getBoundingClientRect().right : 0;
              const heroR = document.querySelector('#hero') ? document.querySelector('#hero').getBoundingClientRect().right : 0;
              const navR = document.querySelector('.mobile-bottom-nav') ? document.querySelector('.mobile-bottom-nav').getBoundingClientRect().right : 0;

              return JSON.stringify({
                width: ${w},
                docW,
                scrollW,
                bodyW,
                scrolledX,
                isZeroHorizontalScroll: scrolledX === 0 && scrollW <= docW,
                headerFits: headerR <= docW + 1,
                heroFits: heroR <= docW + 1,
                navFits: navR <= docW + 1
              });
            })()`;

            ws.send(JSON.stringify({
              id: 20 + idx,
              method: 'Runtime.evaluate',
              params: { expression: evalExpr }
            }));
          }, 600);
        }

        ws.onmessage = (msg) => {
          const r = JSON.parse(msg.data);
          if (r.id >= 20 && r.id < 30) {
            const val = JSON.parse(r.result.result.value);
            results.push(val);

            // Also capture screenshot for this width
            const w = widths[idx];
            ws.send(JSON.stringify({
              id: 30 + idx,
              method: 'Page.captureScreenshot',
              params: { format: 'png' }
            }));
          } else if (r.id >= 30 && r.id < 40) {
            const w = widths[idx];
            const outDir = 'docs/design/screenshots';
            if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
            const buf = Buffer.from(r.result.data, 'base64');
            fs.writeFileSync(`${outDir}/device_${w}px.png`, buf);
            console.log(`Saved screenshot ${outDir}/device_${w}px.png`);
            idx++;
            setTimeout(testNext, 300);
          }
        };

        setTimeout(testNext, 800);
      };
    });
  });
}, 2000);
