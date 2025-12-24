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
    expect(plugin.configs['flat/recommended']).toHaveLength(2);
    
    // Test CSS config (first element)
    const cssConfig = plugin.configs['flat/recommended'][0];
    expect(cssConfig.plugins['@salesforce-ux/slds']).toBe(plugin);
    expect(cssConfig.files).toContain('**/*.{css,scss}');
    expect(cssConfig.rules['@salesforce-ux/slds/no-slds-class-overrides']).toBe('warn');
    
    // Test HTML config (second element)  
    const htmlConfig = plugin.configs['flat/recommended'][1];
    expect(htmlConfig.plugins['@salesforce-ux/slds']).toBe(plugin);
    expect(htmlConfig.files).toContain('**/*.html');
    expect(htmlConfig.rules['@salesforce-ux/slds/enforce-bem-usage']).toBe('error');
  });

  it('should export separate flat CSS and HTML configs', () => {
    // Test flat/recommended-css config
    expect(plugin.configs['flat/recommended-css']).toBeDefined();
    expect(plugin.configs['flat/recommended-css']).toHaveLength(1);
    const cssConfig = plugin.configs['flat/recommended-css'][0];
    expect(cssConfig.plugins['@salesforce-ux/slds']).toBe(plugin);
    expect(cssConfig.files).toContain('**/*.{css,scss}');
    expect(cssConfig.rules['@salesforce-ux/slds/no-slds-class-overrides']).toBe('warn');

    // Test flat/recommended-html config
    expect(plugin.configs['flat/recommended-html']).toBeDefined();
    expect(plugin.configs['flat/recommended-html']).toHaveLength(1);
    const htmlConfig = plugin.configs['flat/recommended-html'][0];
    expect(htmlConfig.plugins['@salesforce-ux/slds']).toBe(plugin);
    expect(htmlConfig.files).toContain('**/*.html');
    expect(htmlConfig.rules['@salesforce-ux/slds/enforce-bem-usage']).toBe('error');
  });

  it('should export sldsCssPlugin function', () => {
    expect(plugin.sldsCssPlugin).toBeDefined();
    expect(typeof plugin.sldsCssPlugin).toBe('function');
    
    const cssPlugins = plugin.sldsCssPlugin();
    expect(cssPlugins).toBeDefined();
    expect(cssPlugins.css).toBeDefined();
    expect(cssPlugins['@salesforce-ux/slds']).toBe(plugin);
  });
}); 