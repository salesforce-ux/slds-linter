const v9Plugin = require('../../src/v9');
const enforceBemUsageRule = require('../../src/rules/enforce-bem-usage');
const noDeprecatedSldsClassesRule = require('../../src/rules/no-deprecated-classes-slds2');
const noSldsVarWithoutFallbackRule = require('../../src/v9/rules/no-slds-var-without-fallback');

jest.mock('../../src/rules/enforce-bem-usage', () => jest.fn());
jest.mock('../../src/rules/no-deprecated-classes-slds2', () => jest.fn());
jest.mock('../../src/v9/rules/no-slds-var-without-fallback', () => jest.fn());

describe('ESLint v9 Plugin', () => {
    describe('Rules', () => {
        test('should define enforce-bem-usage rule', () => {
            expect(v9Plugin.rules).toHaveProperty('enforce-bem-usage');
            expect(typeof v9Plugin.rules['enforce-bem-usage']).toBe('object');
        });
        
        test('should define no-deprecated-classes-slds2 rule', () => {
            expect(v9Plugin.rules).toHaveProperty('no-deprecated-classes-slds2');
            expect(typeof v9Plugin.rules['no-deprecated-classes-slds2']).toBe('object');
        });

        test('should define no-slds-var-without-fallback rule', () => {
            expect(v9Plugin.rules).toHaveProperty('no-slds-var-without-fallback');
            expect(typeof v9Plugin.rules['no-slds-var-without-fallback']).toBe('object');
        });
    });

    describe('Configuration', () => {
        test('should define recommended configuration', () => {
            expect(v9Plugin.configs).toHaveProperty('recommended');
        });

        test('should define recommended configuration with languageOptions (flat config)', () => {
            expect(v9Plugin.configs.recommended).toHaveProperty('languageOptions');
            expect(v9Plugin.configs.recommended.languageOptions).toHaveProperty('parser');
            expect(v9Plugin.configs.recommended.languageOptions).toHaveProperty('ecmaVersion');
            expect(v9Plugin.configs.recommended.languageOptions).toHaveProperty('sourceType');
        });

        test('should define recommended configuration with plugins (flat config)', () => {
            expect(v9Plugin.configs.recommended).toHaveProperty('plugins');
            expect(v9Plugin.configs.recommended.plugins).toHaveProperty('@salesforce-ux/slds');
        });

        test('should define recommended configuration with rules', () => {
            expect(v9Plugin.configs.recommended).toHaveProperty('rules');
            expect(v9Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/enforce-bem-usage', 'error');
            expect(v9Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/no-deprecated-classes-slds2', 'error');
            expect(v9Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/modal-close-button-issue', 'error');
            expect(v9Plugin.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/no-slds-var-without-fallback', 'error');
        });

        test('should have meta information for ESLint v9', () => {
            expect(v9Plugin.meta).toBeDefined();
            expect(v9Plugin.meta).toHaveProperty('name', '@salesforce-ux/eslint-plugin-slds');
            expect(v9Plugin.meta).toHaveProperty('version');
        });
    });

    describe('Rule Implementation', () => {
        test('enforce-bem-usage rule should be implemented', () => {
            expect(v9Plugin.rules['enforce-bem-usage']).toBe(enforceBemUsageRule);
        });

        test('no-deprecated-classes-slds2 rule should be implemented', () => {
            expect(v9Plugin.rules['no-deprecated-classes-slds2']).toBe(noDeprecatedSldsClassesRule);
        });

        test('no-slds-var-without-fallback rule should be implemented', () => {
            expect(v9Plugin.rules['no-slds-var-without-fallback']).toBe(noSldsVarWithoutFallbackRule);
        });
    });
}); 