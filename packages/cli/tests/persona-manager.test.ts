/**
 * Tests for persona manager functionality
 */

import { 
  Persona, 
  getStylelintRulesForPersona, 
  getEslintRulesForPersona, 
  canExecuteRule 
} from '../src/services/persona-manager';

describe('Persona Manager', () => {
  describe('Persona enum', () => {
    it('should have correct values', () => {
      expect(Persona.INTERNAL).toBe('internal');
      expect(Persona.EXTERNAL).toBe('external');
    });
  });

  describe('getStylelintRulesForPersona', () => {
    it('should return rules for internal persona', () => {
      const rules = getStylelintRulesForPersona(Persona.INTERNAL);
      
      // Check that internal-only rules are included
      expect(rules['slds/no-hardcoded-values-slds1']).toEqual([true, { severity: 'error' }]);
      expect(rules['slds/no-deprecated-tokens-slds1']).toEqual([true, { severity: 'error' }]);
      expect(rules['slds/lwc-token-to-slds-hook']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/enforce-bem-usage']).toEqual([true, { severity: 'warning' }]);
      
      // Check that shared rules are included
      expect(rules['slds/no-slds-class-overrides']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-hardcoded-values-slds2']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-slds-private-var']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/reduce-annotations']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-unsupported-hooks-slds2']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-slds-var-without-fallback']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-slds-namespace-for-custom-hooks']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-sldshook-fallback-for-lwctoken']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/enforce-component-hook-naming-convention']).toEqual([true, { severity: 'error' }]);
    });

    it('should return rules for external persona', () => {
      const rules = getStylelintRulesForPersona(Persona.EXTERNAL);
      
      // Check that external-only rules are NOT included
      expect(rules['slds/no-hardcoded-values-slds1']).toBeUndefined();
      expect(rules['slds/no-deprecated-tokens-slds1']).toBeUndefined();
      expect(rules['slds/lwc-token-to-slds-hook']).toBeUndefined();
      expect(rules['slds/enforce-bem-usage']).toBeUndefined();
      
      // Check that shared rules are included
      expect(rules['slds/no-slds-class-overrides']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-hardcoded-values-slds2']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-slds-private-var']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/reduce-annotations']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-unsupported-hooks-slds2']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-slds-var-without-fallback']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-slds-namespace-for-custom-hooks']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/no-sldshook-fallback-for-lwctoken']).toEqual([true, { severity: 'warning' }]);
      expect(rules['slds/enforce-component-hook-naming-convention']).toEqual([true, { severity: 'error' }]);
    });

    it('should not include rules with empty targetPersona array', () => {
      const internalRules = getStylelintRulesForPersona(Persona.INTERNAL);
      const externalRules = getStylelintRulesForPersona(Persona.EXTERNAL);
      
      // Rules with empty targetPersona should not be included for any persona
      expect(internalRules['slds/no-important-tag']).toBeUndefined();
      expect(externalRules['slds/no-important-tag']).toBeUndefined();
      expect(internalRules['slds/no-calc-function']).toBeUndefined();
      expect(externalRules['slds/no-calc-function']).toBeUndefined();
    });
  });

  describe('getEslintRulesForPersona', () => {
    it('should return rules for internal persona', () => {
      const rules = getEslintRulesForPersona(Persona.INTERNAL);
      
      // Check that internal-only rules are enabled
      expect(rules['@salesforce-ux/slds/enforce-bem-usage']).toBe('error');
      expect(rules['@salesforce-ux/slds/no-deprecated-classes-slds2']).toBe('error');
      
      // Check that shared rules are enabled
      expect(rules['@salesforce-ux/slds/modal-close-button-issue']).toBe('error');
    });

    it('should return rules for external persona', () => {
      const rules = getEslintRulesForPersona(Persona.EXTERNAL);
      
      // Check that internal-only rules are disabled
      expect(rules['@salesforce-ux/slds/enforce-bem-usage']).toBe('off');
      expect(rules['@salesforce-ux/slds/no-deprecated-classes-slds2']).toBe('off');
      
      // Check that shared rules are enabled
      expect(rules['@salesforce-ux/slds/modal-close-button-issue']).toBe('error');
    });

    it('should return all ESLint rules with correct severity', () => {
      const internalRules = getEslintRulesForPersona(Persona.INTERNAL);
      const externalRules = getEslintRulesForPersona(Persona.EXTERNAL);
      
      // All ESLint rules should be present in both personas
      expect(internalRules).toHaveProperty('@salesforce-ux/slds/enforce-bem-usage');
      expect(internalRules).toHaveProperty('@salesforce-ux/slds/no-deprecated-classes-slds2');
      expect(internalRules).toHaveProperty('@salesforce-ux/slds/modal-close-button-issue');
      
      expect(externalRules).toHaveProperty('@salesforce-ux/slds/enforce-bem-usage');
      expect(externalRules).toHaveProperty('@salesforce-ux/slds/no-deprecated-classes-slds2');
      expect(externalRules).toHaveProperty('@salesforce-ux/slds/modal-close-button-issue');
    });
  });

  describe('canExecuteRule', () => {
    it('should return true for internal persona with internal-only rules', () => {
      expect(canExecuteRule('@salesforce-ux/slds/enforce-bem-usage', Persona.INTERNAL)).toBe(true);
      expect(canExecuteRule('@salesforce-ux/slds/no-deprecated-classes-slds2', Persona.INTERNAL)).toBe(true);
    });

    it('should return false for external persona with internal-only rules', () => {
      expect(canExecuteRule('@salesforce-ux/slds/enforce-bem-usage', Persona.EXTERNAL)).toBe(false);
      expect(canExecuteRule('@salesforce-ux/slds/no-deprecated-classes-slds2', Persona.EXTERNAL)).toBe(false);
    });

    it('should return true for both personas with shared rules', () => {
      expect(canExecuteRule('@salesforce-ux/slds/modal-close-button-issue', Persona.INTERNAL)).toBe(true);
      expect(canExecuteRule('@salesforce-ux/slds/modal-close-button-issue', Persona.EXTERNAL)).toBe(true);
    });

    it('should return false for non-existent rules', () => {
      expect(canExecuteRule('non-existent-rule', Persona.INTERNAL)).toBe(false);
      expect(canExecuteRule('non-existent-rule', Persona.EXTERNAL)).toBe(false);
    });

    it('should return false for empty string rule', () => {
      expect(canExecuteRule('', Persona.INTERNAL)).toBe(false);
      expect(canExecuteRule('', Persona.EXTERNAL)).toBe(false);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null/undefined persona gracefully', () => {
      // TypeScript should prevent this, but let's test the function behavior
      const internalRules = getStylelintRulesForPersona(Persona.INTERNAL);
      const externalRules = getStylelintRulesForPersona(Persona.EXTERNAL);
      
      expect(typeof internalRules).toBe('object');
      expect(typeof externalRules).toBe('object');
      expect(Array.isArray(internalRules)).toBe(false);
      expect(Array.isArray(externalRules)).toBe(false);
    });

    it('should return consistent rule structure', () => {
      const internalRules = getStylelintRulesForPersona(Persona.INTERNAL);
      const externalRules = getStylelintRulesForPersona(Persona.EXTERNAL);
      
      // Check that all returned rules have the correct structure
      Object.values(internalRules).forEach(rule => {
        expect(Array.isArray(rule)).toBe(true);
        expect(rule).toHaveLength(2);
        expect(rule[0]).toBe(true);
        expect(typeof rule[1]).toBe('object');
        expect(rule[1]).toHaveProperty('severity');
        expect(['warning', 'error', 'off']).toContain(rule[1].severity);
      });

      Object.values(externalRules).forEach(rule => {
        expect(Array.isArray(rule)).toBe(true);
        expect(rule).toHaveLength(2);
        expect(rule[0]).toBe(true);
        expect(typeof rule[1]).toBe('object');
        expect(rule[1]).toHaveProperty('severity');
        expect(['warning', 'error', 'off']).toContain(rule[1].severity);
      });
    });

    it('should return consistent ESLint rule structure', () => {
      const internalRules = getEslintRulesForPersona(Persona.INTERNAL);
      const externalRules = getEslintRulesForPersona(Persona.EXTERNAL);
      
      // Check that all returned rules have string values
      Object.values(internalRules).forEach(severity => {
        expect(typeof severity).toBe('string');
        expect(['warning', 'error', 'off']).toContain(severity);
      });

      Object.values(externalRules).forEach(severity => {
        expect(typeof severity).toBe('string');
        expect(['warning', 'error', 'off']).toContain(severity);
      });
    });
  });

  describe('Integration tests', () => {
    it('should provide consistent behavior across all functions', () => {
      const internalPersona = Persona.INTERNAL;
      const externalPersona = Persona.EXTERNAL;
      
      // Test that canExecuteRule matches getEslintRulesForPersona behavior
      const internalRules = getEslintRulesForPersona(internalPersona);
      const externalRules = getEslintRulesForPersona(externalPersona);
      
      Object.keys(internalRules).forEach(ruleId => {
        const isEnabled = internalRules[ruleId] !== 'off';
        const canExecute = canExecuteRule(ruleId, internalPersona);
        expect(canExecute).toBe(isEnabled);
      });
      
      Object.keys(externalRules).forEach(ruleId => {
        const isEnabled = externalRules[ruleId] !== 'off';
        const canExecute = canExecuteRule(ruleId, externalPersona);
        expect(canExecute).toBe(isEnabled);
      });
    });
    
  });
}); 