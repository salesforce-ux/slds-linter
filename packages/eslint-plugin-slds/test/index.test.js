const v8Plugin = require('../src/v8');
const v9Plugin = require('../src/v9');
const enforceBemUsageRule = require('../src/rules/enforce-bem-usage');
const noDeprecatedSldsClassesRule = require('../src/rules/no-deprecated-classes-slds2');

jest.mock('../src/rules/enforce-bem-usage', () => jest.fn());
jest.mock('../src/rules/no-deprecated-classes-slds2', () => jest.fn());

describe('ESLint Plugin Rules', () => {
    test('should define enforce-bem-usage rule in both versions', () => {
        expect(v8Plugin.rules).toHaveProperty('enforce-bem-usage');
        expect(v9Plugin.rules).toHaveProperty('enforce-bem-usage');
    });

    test('should define no-deprecated-classes-slds2 rule in both versions', () => {
        expect(v8Plugin.rules).toHaveProperty('no-deprecated-classes-slds2');
        expect(v9Plugin.rules).toHaveProperty('no-deprecated-classes-slds2');
    });
});

describe('ESLint v8 Plugin Configuration', () => {
    test('should define recommended configuration', () => {
        expect(v8Plugin.configs).toHaveProperty('recommended');
    });

    test('should define recommended configuration with parser (legacy config)', () => {
        expect(v8Plugin.configs.recommended).toHaveProperty('parser');
        expect(v8Plugin.configs.recommended).toHaveProperty('parserOptions');
    });

    test('should define recommended configuration with plugins (legacy config)', () => {
        expect(v8Plugin.configs.recommended).toHaveProperty('plugins');
        expect(Array.isArray(v8Plugin.configs.recommended.plugins)).toBe(true);
        expect(v8Plugin.configs.recommended.plugins).toContain('@salesforce-ux/slds');
    });

    test('should define recommended configuration with rules', () => {
        expect(v8Plugin.configs.recommended).toHaveProperty('rules');
        expect(v8Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/enforce-bem-usage', 'error');
        expect(v8Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/no-deprecated-classes-slds2', 'error');
        expect(v8Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/modal-close-button-issue', 'error');
    });

    test('should not have meta information for ESLint v8', () => {
        expect(v8Plugin.meta).toBeUndefined();
    });
});

describe('ESLint v9 Plugin Configuration', () => {
    test('should define recommended configuration', () => {
        expect(v9Plugin.configs).toHaveProperty('recommended');
    });

    test('should define recommended configuration with parser (flat config)', () => {
        expect(v9Plugin.configs.recommended).toHaveProperty('languageOptions');
        expect(v9Plugin.configs.recommended.languageOptions).toHaveProperty('parser');
        expect(v9Plugin.configs.recommended.languageOptions).toHaveProperty('ecmaVersion');
        expect(v9Plugin.configs.recommended.languageOptions).toHaveProperty('sourceType');
    });

    test('should define recommended configuration with plugins (flat config)', () => {
        expect(v9Plugin.configs.recommended).toHaveProperty('plugins');
        expect(v9Plugin.configs.recommended.plugins).toHaveProperty('@salesforce-ux/slds');
    });

    test('should define recommended configuration with files (flat config)', () => {
        expect(v9Plugin.configs.recommended).toHaveProperty('files');
        expect(Array.isArray(v9Plugin.configs.recommended.files)).toBe(true);
    });

    test('should define recommended configuration with rules', () => {
        expect(v9Plugin.configs.recommended).toHaveProperty('rules');
        expect(v9Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/enforce-bem-usage', 'error');
        expect(v9Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/no-deprecated-classes-slds2', 'error');
        expect(v9Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/modal-close-button-issue', 'error');
    });

    test('should have meta information for ESLint v9+', () => {
        expect(v9Plugin.meta).toBeDefined();
        expect(v9Plugin.meta).toHaveProperty('name', '@salesforce-ux/eslint-plugin-slds');
        expect(v9Plugin.meta).toHaveProperty('version');
    });
});

describe('ESLint Rules Implementation', () => {
    test('enforce-bem-usage rule should be implemented in both versions', () => {
        expect(v8Plugin.rules['enforce-bem-usage']).toBe(enforceBemUsageRule);
        expect(v9Plugin.rules['enforce-bem-usage']).toBe(enforceBemUsageRule);
    });

    test('no-deprecated-classes-slds2 rule should be implemented in both versions', () => {
        expect(v8Plugin.rules['no-deprecated-classes-slds2']).toBe(noDeprecatedSldsClassesRule);
        expect(v9Plugin.rules['no-deprecated-classes-slds2']).toBe(noDeprecatedSldsClassesRule);
    });
});