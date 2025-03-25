const index = require('../src/index');
const { ESLint } = require('eslint');
const enforceBemClassRule = require('../src/rules/enforce-bem-class');
const noDeprecatedSldsClassesRule = require('../src/rules/no-deprecated-classes-slds2');

jest.mock('../src/rules/enforce-bem-class', () => jest.fn());
jest.mock('../src/rules/no-deprecated-classes-slds2', () => jest.fn());


describe('ESLint Plugin Rules', () => {
    test('should define enforce-bem-class rule', () => {
        expect(index.rules).toHaveProperty('enforce-bem-class');
        expect(typeof index.rules['enforce-bem-class']).toBe('object');
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
      expect(index.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/enforce-bem-class', 'error');
      expect(index.configs.recommended.rules).toHaveProperty('@salesforce-ux/slds/no-deprecated-classes-slds2', 'error');
    });
});

describe('ESLint Rules Implementation', () => {
  test('enforce-bem-class rule should be implemented', () => {
    expect(index.rules['enforce-bem-class']).toBe(enforceBemClassRule);
  });

  test('no-deprecated-classes-slds2 rule should be implemented', () => {
    expect(index.rules['no-deprecated-classes-slds2']).toBe(noDeprecatedSldsClassesRule);
  });
});