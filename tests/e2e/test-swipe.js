const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

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
        ws.send(JSON.stringify({
          id: 1,
          method: 'Emulation.setDeviceMetricsOverride',
          params: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
        }));

        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                window.scrollTo(0, 2800);
                const vp = document.querySelector('#product-marquee-viewport');
                if (vp) vp.scrollLeft = 320;
              })()`
            }
          }));

          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 3,
              method: 'Page.captureScreenshot',
              params: { format: 'png' }
            }));
          }, 400);
        }, 800);
      };

      ws.onmessage = (msg) => {
        const r = JSON.parse(msg.data);
        if (r.id === 3) {
          fs.writeFileSync('scratch/catalog_swiped_390.png', Buffer.from(r.result.data, 'base64'));
          console.log('Saved scratch/catalog_swiped_390.png');
          ws.close();
          proc.kill();
          process.exit(0);
        }
      };
    });
  });
}, 2000);
