import { runProductSeed, CANONICAL_SEED_PRODUCTS } from '../../scripts/seed-products';

describe('Seed Script Safety & Default Protections', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('1. Importing the seed script causes zero database writes or side effects', () => {
    expect(CANONICAL_SEED_PRODUCTS).toBeDefined();
    expect(CANONICAL_SEED_PRODUCTS.length).toBeGreaterThan(0);
  });

  it('2. Refuses empty or missing project ID', async () => {
    await expect(runProductSeed({ dryRun: true, project: '' }))
      .rejects
      .toThrow('Target project ID is required');
  });

  it('3. Default mode is dry-run when dryRun is omitted', async () => {
    const res = await runProductSeed({ project: 'satvik-spot-test' });
    expect(res.dryRun).toBe(true);
    expect(res.count).toBe(CANONICAL_SEED_PRODUCTS.length);
  });

  it('4. Rejects legacy project satwiksweetsandpickels', async () => {
    await expect(runProductSeed({ dryRun: true, project: 'satwiksweetsandpickels' }))
      .rejects
      .toThrow('Legacy project satwiksweetsandpickels is rejected');
  });

  it('5. Rejects live non-emulator writes without explicit --confirm flag', async () => {
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.NODE_ENV;
    await expect(runProductSeed({ dryRun: false, project: 'satvik-spot-staging', confirm: false }))
      .rejects
      .toThrow('Non-emulator database write to \'satvik-spot-staging\' requires explicit --confirm flag');
  });

  it('6. Rejects live writes during tests if FIRESTORE_EMULATOR_HOST is missing', async () => {
    delete process.env.FIRESTORE_EMULATOR_HOST;
    process.env.NODE_ENV = 'test';
    await expect(runProductSeed({ dryRun: false, project: 'satvik-spot-test', confirm: true }))
      .rejects
      .toThrow('Live database writes are forbidden in test environment without FIRESTORE_EMULATOR_HOST');
  });

  it('7. Accepts dry-run validation on valid test project ID', async () => {
    const res = await runProductSeed({ dryRun: true, project: 'satvik-spot-test' });
    expect(res.success).toBe(true);
    expect(res.dryRun).toBe(true);
  });
});
