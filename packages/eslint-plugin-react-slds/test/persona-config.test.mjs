import {readFileSync} from 'node:fs';

const readManifest = fileName => JSON.parse(
  readFileSync(new URL(`../${fileName}`, import.meta.url), 'utf8'),
).react;

describe('persona rule manifests', () => {
  const externalRules = readManifest('eslint.rules.json');
  const internalRules = readManifest('eslint.rules.internal.json');

  it('keeps internal-only rules out of the external preset', () => {
    expect(externalRules['@salesforce-ux/slds/no-deprecated-tokens-slds1']).toBeUndefined();
    expect(externalRules['@salesforce-ux/slds/no-invalid-hook-property-usage']).toBeUndefined();
  });

  it('enables internal-only rules and hardcoded-value options internally', () => {
    expect(internalRules['@salesforce-ux/slds/no-deprecated-tokens-slds1']).toBe('error');
    expect(internalRules['@salesforce-ux/slds/no-invalid-hook-property-usage']).toBe('warn');
    expect(internalRules['@salesforce-ux/slds/no-hardcoded-values-slds2']).toEqual([
      'warn',
      expect.objectContaining({
        reportNumericValue: 'hasReplacement',
        customMapping: expect.any(Object),
      }),
    ]);
  });

  it('keeps the external rule set enabled internally', () => {
    for (const [ruleId, severity] of Object.entries(externalRules)) {
      const internalSetting = internalRules[ruleId];
      expect(Array.isArray(internalSetting) ? internalSetting[0] : internalSetting).toBe(severity);
    }
  });
});
