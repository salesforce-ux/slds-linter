const v8Plugin = require('../../src/v8');
const enforceBemUsageRule = require('../../src/rules/enforce-bem-usage');
const noDeprecatedSldsClassesRule = require('../../src/rules/no-deprecated-classes-slds2');

jest.mock('../../src/rules/enforce-bem-usage', () => jest.fn());
jest.mock('../../src/rules/no-deprecated-classes-slds2', () => jest.fn());

describe('ESLint v8 Plugin', () => {
    describe('Rules', () => {
        test('should define enforce-bem-usage rule', () => {
            expect(v8Plugin.rules).toHaveProperty('enforce-bem-usage');
            expect(typeof v8Plugin.rules['enforce-bem-usage']).toBe('object');
        });
        
        test('should define no-deprecated-classes-slds2 rule', () => {
            expect(v8Plugin.rules).toHaveProperty('no-deprecated-classes-slds2');
            expect(typeof v8Plugin.rules['no-deprecated-classes-slds2']).toBe('object');
        });
    });

    describe('Configuration', () => {
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

    describe('Rule Implementation', () => {
        test('enforce-bem-usage rule should be implemented', () => {
            expect(v8Plugin.rules['enforce-bem-usage']).toBe(enforceBemUsageRule);
        });

        test('no-deprecated-classes-slds2 rule should be implemented', () => {
            expect(v8Plugin.rules['no-deprecated-classes-slds2']).toBe(noDeprecatedSldsClassesRule);
        });
    });
}); 