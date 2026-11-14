import * as path from 'path';
import { execSync } from 'child_process';

describe('Wave F — CI Gate: i18n Translation Parity (Rule I18N-3, Section 16.4)', () => {
  it('English, Hindi, and Urdu translation dictionaries have 100% identical nested keys', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const script = `
      import('./public/site/js/translations.js').then(m => {
        const t = m.TRANSLATIONS;
        function getAllKeys(obj, prefix = '') {
          let keys = [];
          for (const k of Object.keys(obj)) {
            const full = prefix ? prefix + '.' + k : k;
            keys.push(full);
            if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
              keys = keys.concat(getAllKeys(obj[k], full));
            }
          }
          return keys;
        }

        const enKeys = getAllKeys(t.en).sort();
        const hiKeys = getAllKeys(t.hi).sort();
        const urKeys = getAllKeys(t.ur).sort();

        const missingInHindi = enKeys.filter(k => !hiKeys.includes(k));
        const missingInUrdu = enKeys.filter(k => !urKeys.includes(k));
        const extraInHindi = hiKeys.filter(k => !enKeys.includes(k));
        const extraInUrdu = urKeys.filter(k => !enKeys.includes(k));

        console.log(JSON.stringify({
          enCount: enKeys.length,
          hiCount: hiKeys.length,
          urCount: urKeys.length,
          missingInHindi,
          missingInUrdu,
          extraInHindi,
          extraInUrdu
        }));
      });
    `.replace(/\n/g, ' ');

    const output = execSync(`node --input-type=module -e "${script}"`, {
      cwd: rootDir,
      encoding: 'utf-8'
    });

    // Extract JSON line (ignoring any node warnings)
    const jsonLine = output.trim().split('\n').find(l => l.startsWith('{'));
    expect(jsonLine).toBeDefined();

    const result = JSON.parse(jsonLine!);
    expect(result.enCount).toBeGreaterThan(500);
    expect(result.missingInHindi).toEqual([]);
    expect(result.missingInUrdu).toEqual([]);
    expect(result.extraInHindi).toEqual([]);
    expect(result.extraInUrdu).toEqual([]);
  });
});
