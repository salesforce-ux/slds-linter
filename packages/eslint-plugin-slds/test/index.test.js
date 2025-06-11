const index = require('../src/index');
const { ESLint } = require('eslint');
const enforceBemUsageRule = require('../src/rules/enforce-bem-usage');
const noDeprecatedSldsClassesRule = require('../src/rules/no-deprecated-classes-slds2');

jest.mock('../src/rules/enforce-bem-usage', () => jest.fn());
jest.mock('../src/rules/no-deprecated-classes-slds2', () => jest.fn());

/**
 * Determine if we're testing flat config based on environment
 */
function shouldUseFlatConfig() {
    const envVar = process.env.ESLINT_USE_FLAT_CONFIG;
    if (envVar !== undefined) {
        return envVar === 'true';
    }
    return true; // Default to flat config
}

describe('ESLint Plugin Rules', () => {
    test('should define enforce-bem-usage rule', () => {
        expect(index.rules).toHaveProperty('enforce-bem-usage');
        expect(typeof index.rules['enforce-bem-usage']).toBe('object');
    });
    
    test('should define no-deprecated-classes-slds2 rule', () => {
        expect(index.rules).toHaveProperty('no-deprecated-classes-slds2');
        expect(typeof index.rules['no-deprecated-classes-slds2']).toBe('object');
    });
});

describe('ESLint Plugin Configurations', () => {
    const useFlatConfig = shouldUseFlatConfig();
    
    test('should define recommended configuration', () => {
        expect(index.configs).toHaveProperty('recommended');
    });

    if (useFlatConfig) {
        // ESLint v9 flat config tests
        test('should define recommended configuration with parser (flat config)', () => {
            expect(index.configs.recommended).toHaveProperty('languageOptions');
            expect(index.configs.recommended.languageOptions).toHaveProperty('parser');
        });

        test('should define recommended configuration with plugins (flat config)', () => {
            expect(index.configs.recommended).toHaveProperty('plugins');
            expect(index.configs.recommended.plugins).toHaveProperty('@salesforce-ux/slds');
        });

        test('should define recommended configuration with files (flat config)', () => {
            expect(index.configs.recommended).toHaveProperty('files');
            expect(Array.isArray(index.configs.recommended.files)).toBe(true);
        });
    } else {
        // ESLint v8 legacy config tests
        test('should define recommended configuration with parser (legacy config)', () => {
            expect(index.configs.recommended).toHaveProperty('parser');
            expect(index.configs.recommended).toHaveProperty('parserOptions');
        });

        test('should define recommended configuration with plugins (legacy config)', () => {
            expect(index.configs.recommended).toHaveProperty('plugins');
            expect(Array.isArray(index.configs.recommended.plugins)).toBe(true);
            expect(index.configs.recommended.plugins).toContain('@salesforce-ux/slds');
        });
    }

    test('should define recommended configuration with rules', () => {
        expect(index.configs.recommended).toHaveProperty('rules');
        expect(index.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/enforce-bem-usage', 'error');
        expect(index.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/no-deprecated-classes-slds2', 'error');
        expect(index.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/modal-close-button-issue', 'error');
    });
});

describe('ESLint Plugin Metadata', () => {
    const useFlatConfig = shouldUseFlatConfig();
    
    if (useFlatConfig) {
        test('should have meta information for ESLint v9+', () => {
            expect(index).toHaveProperty('meta');
            expect(index.meta).toHaveProperty('name', '@salesforce-ux/eslint-plugin-slds');
            expect(index.meta).toHaveProperty('version');
        });
    } else {
        test('should not have meta information for ESLint v8', () => {
            expect(index.meta).toBeUndefined();
        });
    }
});

describe('ESLint Rules Implementation', () => {
    test('enforce-bem-usage rule should be implemented', () => {
        expect(index.rules['enforce-bem-usage']).toBe(enforceBemUsageRule);
    });

    test('no-deprecated-classes-slds2 rule should be implemented', () => {
        expect(index.rules['no-deprecated-classes-slds2']).toBe(noDeprecatedSldsClassesRule);
    });
});

describe('Configuration Format Detection', () => {
    test('should respond to ESLINT_USE_FLAT_CONFIG environment variable', () => {
        const useFlatConfig = shouldUseFlatConfig();
        const expectedFormat = process.env.ESLINT_USE_FLAT_CONFIG === 'false' ? 'legacy' : 'flat';
        
        if (expectedFormat === 'flat') {
            expect(index.configs.recommended).toHaveProperty('languageOptions');
            expect(index.configs.recommended).toHaveProperty('files');
        } else {
            expect(index.configs.recommended).toHaveProperty('parser');
            expect(index.configs.recommended).toHaveProperty('parserOptions');
        }
    });
});