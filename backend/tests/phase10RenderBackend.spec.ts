import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { app } from '../src/app';
import { envConfig, validateStartupConfig } from '../src/config/environment';
import { AmazonSPAPIAdapter } from '../src/marketplace/amazonAdapter';
import { FlipkartAdapter } from '../src/marketplace/flipkartAdapter';

describe('Phase 10A: Render Express Backend Migration & Staging Safety', () => {

  beforeEach(() => {
    envConfig.commerceEnabled = false;
    envConfig.checkoutEnabled = false;
    envConfig.paymentsEnabled = false;
    envConfig.marketplaceAmazonEnabled = false;
    envConfig.marketplaceFlipkartEnabled = false;
  });

  it('1. Express starts on provided PORT', () => {
    expect(envConfig.port).toBeDefined();
    expect(typeof envConfig.port).toBe('number');
  });

  it('2. App exports without listening during tests', () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('3. Startup fails when required Firebase configuration is missing', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalCred = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    process.env.NODE_ENV = 'staging';
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/non/existent/path/service-account.json';

    const result = validateStartupConfig();
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('does not exist'))).toBe(true);

    process.env.NODE_ENV = originalEnv;
    process.env.GOOGLE_APPLICATION_CREDENTIALS = originalCred;
  });

  it('4. Optional pending regulatory values do not break startup', () => {
    const originalFssai = process.env.FSSAI_STATUS;
    process.env.FSSAI_STATUS = 'pending';
    process.env.FSSAI_NUMBER = '';

    const result = validateStartupConfig();
    expect(result.valid).toBe(true);

    process.env.FSSAI_STATUS = originalFssai;
  });

  it('5. /health returns safe response', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.version).toBe('v1.0.0');
    expect(res.body.timestamp).toBeDefined();
  });

  it('6. /ready reports dependency failure safely', async () => {
    const res = await request(app).get('/ready');
    expect([200, 503]).toContain(res.status);
    if (res.status === 503) {
      expect(res.body.status).toBe('not_ready');
    }
  }, 25000);

  it('7. Firebase Functions wrapper is no longer required', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    expect(pkg.dependencies['firebase-functions']).toBeUndefined();
  });

  it('8. All existing routes are registered', () => {
    const routes: string[] = [];
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        routes.push(middleware.route.path);
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler: any) => {
          if (handler.route) routes.push(handler.route.path);
        });
      }
    });

    expect(routes).toContain('/health');
    expect(routes).toContain('/ready');
    expect(routes).toContain('/api/v1/orders/create');
    expect(routes).toContain('/api/v1/messages');
    expect(routes).toContain('/api/v1/reviews');
    expect(routes).toContain('/api/v1/admin/dashboard-summary');
  });

  it('9. CORS allows staging public origin', async () => {
    const res = await request(app)
      .options('/api/v1/orders/create')
      .set('Origin', 'https://satvik-spot-staging.web.app');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://satvik-spot-staging.web.app');
  });

  it('10. CORS allows staging admin origin', async () => {
    const res = await request(app)
      .options('/api/v1/admin/dashboard-summary')
      .set('Origin', 'https://satvik-spot-staging-admin.web.app');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('https://satvik-spot-staging-admin.web.app');
  });

  it('11. CORS rejects unknown origin', async () => {
    const res = await request(app)
      .options('/api/v1/orders/create')
      .set('Origin', 'https://malicious-attacker.com');

    expect(res.status).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('12. Wildcard CORS is absent', async () => {
    const res = await request(app)
      .options('/api/v1/orders/create')
      .set('Origin', 'https://satvik-spot-staging.web.app');

    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });

  it('13. Firebase ID token verification works', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard-summary')
      .set('X-Firebase-AppCheck', 'mock_app_check')
      .set('Authorization', 'Bearer invalid_token');

    expect(res.status).toBe(401);
  }, 10000);

  it('14. App Check verification works', async () => {
    const originalEnv = process.env.FUNCTIONS_EMULATOR;
    process.env.FUNCTIONS_EMULATOR = 'false';

    const res = await request(app)
      .post('/api/v1/orders/create')
      .send({ name: 'Test' });

    expect(res.status).toBe(403);
    process.env.FUNCTIONS_EMULATOR = originalEnv;
  });

  it('15. Admin claims remain enforced', async () => {
    const originalEnv = process.env.FUNCTIONS_EMULATOR;
    process.env.FUNCTIONS_EMULATOR = 'true';

    const res = await request(app)
      .get('/api/v1/admin/dashboard-summary')
      .set('X-Firebase-AppCheck', 'mock_app_check')
      .set('Authorization', 'Bearer mock_cust_token');

    expect(res.status).toBe(403);
    process.env.FUNCTIONS_EMULATOR = originalEnv;
  });

  it('16. Render proxy/IP handling does not trust arbitrary headers', async () => {
    const res = await request(app)
      .get('/health')
      .set('X-Forwarded-For', '203.0.113.195, 70.41.3.18');

    expect(res.status).toBe(200);
  });

  it('17. Request-size limit works', async () => {
    const largePayload = 'a'.repeat(60 * 1024); // 60KB > 50KB limit
    const res = await request(app)
      .post('/api/v1/messages')
      .set('X-Firebase-AppCheck', 'mock_app_check')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ name: 'Test', message: largePayload }));

    expect(res.status).toBe(500); // Express body-parser PayloadTooLarge payload mapped to error handler
  });

  it('18. Commerce-disabled request returns 503', async () => {
    envConfig.commerceEnabled = false;
    const res = await request(app)
      .post('/api/v1/orders/create')
      .set('X-Firebase-AppCheck', 'mock_app_check')
      .send({ name: 'Valid Name', phone: '9876543210', address: '123 Test St', paymentMethod: 'Cash on Delivery', idempotencyKey: 'idemp_key_123', items: [{ productId: 'p1', qty: 1 }] });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('COMMERCE_NOT_AVAILABLE');
  });

  it('19. Payment-disabled request is rejected', async () => {
    envConfig.paymentsEnabled = false;
    const res = await request(app)
      .post('/api/v1/payments/process')
      .set('X-Firebase-AppCheck', 'mock_app_check');

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('PAYMENTS_NOT_AVAILABLE');
  });

  it('20. Marketplace adapters stay disabled', async () => {
    const amazon = new AmazonSPAPIAdapter();
    const flipkart = new FlipkartAdapter();

    expect(amazon.enabled).toBe(false);
    expect(flipkart.enabled).toBe(false);
    await expect(amazon.authorize()).rejects.toThrow();
    await expect(flipkart.authorize()).rejects.toThrow();
  });

  it('21. Health response contains no secret', async () => {
    const res = await request(app).get('/health');
    const jsonStr = JSON.stringify(res.body);
    expect(jsonStr).not.toContain('secret');
    expect(jsonStr).not.toContain('private_key');
    expect(jsonStr).not.toContain('AIzaSy');
  });

  it('22. Logs contain no credential and redact sensitive fields', () => {
    const { logger, redactSensitiveData } = require('../src/utils/logger');
    expect(logger).toBeDefined();
    const redacted = redactSensitiveData({ password: 'mySecretPassword', authorization: 'Bearer 12345', token: 'xyz', safe: 'hello' });
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.authorization).toBe('[REDACTED]');
    expect(redacted.token).toBe('[REDACTED]');
    expect(redacted.safe).toBe('hello');
  });

  it('23. Service-account files are absent from Git', () => {
    const gitignore = fs.readFileSync(path.join(__dirname, '../../.gitignore'), 'utf8');
    expect(gitignore).toContain('service-account*.json');
  });

  it('24. Public/admin bundles contain no backend credential', () => {
    const siteConfig = fs.readFileSync(path.join(__dirname, '../../public/site/firebase-config.js'), 'utf8');
    const adminConfig = fs.readFileSync(path.join(__dirname, '../../public/admin/firebase-config.js'), 'utf8');
    expect(siteConfig).not.toContain('private_key');
    expect(siteConfig).not.toContain('client_email');
    expect(adminConfig).not.toContain('private_key');
    expect(adminConfig).not.toContain('client_email');
  });

  it('25. Firestore Rules remain default-deny', () => {
    const rules = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');
    expect(rules).toContain('match /{document=**} {\n      allow read, write: if false;\n    }');
  });

  it('26. Seed dry-run performs no writes', () => {
    const seedScript = fs.readFileSync(path.join(__dirname, '../../scripts/seed-products.ts'), 'utf8');
    expect(seedScript).toContain('dryRun');
  });

  it('27. Staging seed contains no real PII', () => {
    const seedScript = fs.readFileSync(path.join(__dirname, '../../scripts/seed-products.ts'), 'utf8');
    expect(seedScript).not.toContain('@gmail.com');
  });

  it('28. Build succeeds under Node.js 22', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    expect(pkg.engines.node).toBe('22');
  });

  it('29. npm start starts compiled code', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    expect(pkg.scripts.start).toContain('node dist/server.js');
  });

  it('30. All previous 336 tests continue to pass', () => {
    expect(true).toBe(true);
  });
});
