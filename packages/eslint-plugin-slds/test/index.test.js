const plugin = require('../src');
const enforceBemUsageRule = require('../src/rules/enforce-bem-usage');
const noDeprecatedSldsClassesRule = require('../src/rules/no-deprecated-classes-slds2');
const modalCloseButtonIssueRule = require('../src/rules/modal-close-button-issue');

describe('Unified plugin export', () => {
  it('should export the correct meta', () => {
    expect(plugin.meta).toBeDefined();
    expect(plugin.meta.name).toBe('@salesforce-ux/eslint-plugin-slds');
  });

  it('should export all rules', () => {
    expect(plugin.rules['enforce-bem-usage']).toBe(enforceBemUsageRule);
    expect(plugin.rules['no-deprecated-classes-slds2']).toBe(noDeprecatedSldsClassesRule);
    expect(plugin.rules['modal-close-button-issue']).toBe(modalCloseButtonIssueRule);
  });

  it('should export a legacy (v8) config', () => {
    expect(plugin.configs.recommended).toBeDefined();
    expect(plugin.configs.recommended.plugins).toContain('@salesforce-ux/slds');
    expect(plugin.configs.recommended.rules['@salesforce-ux/slds/enforce-bem-usage']).toBe('error');
  });

  it('should export a flat (v9+) config', () => {
    expect(plugin.configs['flat/recommended']).toBeDefined();
    const flatConfig = plugin.configs['flat/recommended'][0];
    expect(flatConfig.plugins['@salesforce-ux/slds']).toBe(plugin);
    expect(flatConfig.rules['@salesforce-ux/slds/enforce-bem-usage']).toBe('error');
  });
}); 