const index = require('../src/index');
const { ESLint } = require('eslint');
const enforceBemUsageRule = require('../src/rules/enforce-bem-usage');
const noDeprecatedSldsClassesRule = require('../src/rules/no-deprecated-classes-slds2');

jest.mock('../src/rules/enforce-bem-usage', () => jest.fn());
jest.mock('../src/rules/no-deprecated-classes-slds2', () => jest.fn());


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
    test('should define recommended configuration', () => {
      expect(index.configs).toHaveProperty('recommended');
    });
  
    test('should define recommended configuration with parser', () => {
      expect(index.configs.recommended).toHaveProperty('parser', '@html-eslint/parser');
    });
  
    test('should define recommended configuration with plugins', () => {
      expect(index.configs.recommended).toHaveProperty('plugins');
      expect(index.configs.recommended.plugins).toContain('@salesforce-ux/slds');
    });
  
    test('should define recommended configuration with rules', () => {
      expect(index.configs.recommended).toHaveProperty('rules');
      expect(index.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/enforce-bem-usage', 'error');
      expect(index.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/no-deprecated-classes-slds2', 'error');
    });
});

describe('ESLint Rules Implementation', () => {
  test('enforce-bem-usage rule should be implemented', () => {
    expect(index.rules['enforce-bem-usage']).toBe(enforceBemUsageRule);
  });

  test('no-deprecated-classes-slds2 rule should be implemented', () => {
    expect(index.rules['no-deprecated-classes-slds2']).toBe(noDeprecatedSldsClassesRule);
  });
});