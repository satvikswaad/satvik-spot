const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=UTF-8',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.xml': 'application/xml; charset=UTF-8',
    '.txt': 'text/plain; charset=UTF-8'
};

function createStaticServer(publicDir, port, name) {
    const server = http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';

        const routeRewrites = {
            '/shop': '/products.html',
            '/products': '/products.html',
            '/cookies-policy': '/cookies-policy.html',
            '/cancellation-policy': '/cancellation-refund-policy.html',
            '/shipping': '/shipping-delivery-policy.html',
            '/shipping-delivery-policy': '/shipping-delivery-policy.html',
            '/terms': '/terms-and-conditions.html',
            '/privacy': '/privacy-policy.html',
            '/our-story': '/our-story.html',
            '/why-us': '/why-us.html',
            '/contact': '/contact.html',
            '/faq': '/faq.html',
            '/reviews': '/reviews.html',
            '/profile': '/profile.html'
        };

        if (routeRewrites[reqPath]) {
            reqPath = routeRewrites[reqPath];
        }

        let filePath = path.join(publicDir, reqPath);

        // Extensionless .html fallback
        if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
        }
        
        // Prevent directory traversal
        if (!filePath.startsWith(publicDir)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
        }

        fs.readFile(filePath, (err, data) => {
            if (err) {
                // SPA fallback for HTML requests
                if (req.headers.accept && req.headers.accept.includes('text/html')) {
                    fs.readFile(path.join(publicDir, 'index.html'), (spaErr, spaData) => {
                        if (spaErr) {
                            res.writeHead(404, { 'Content-Type': 'text/plain' });
                            res.end('404 Not Found');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
                            res.end(spaData);
                        }
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                }
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });

    server.listen(port, () => {
        console.log(`====================================================`);
        console.log(`🚀 ${name} LIVE ON LOCALHOST:`);
        console.log(`👉 http://localhost:${port}`);
        console.log(`====================================================`);
    });

    return server;
}

const siteDir = path.resolve(__dirname, '../public/site');
const adminDir = path.resolve(__dirname, '../public/admin');

createStaticServer(siteDir, 5000, 'Satvik Swaad Customer Storefront');
createStaticServer(siteDir, 8000, 'Satvik Swaad Customer Storefront (Port 8000)');
createStaticServer(adminDir, 5001, 'Satvik Swaad Admin Portal');
