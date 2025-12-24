const {
  isTargetProperty,
  getVarToken,
  forEachSldsVariable,
  forEachNamespacedVariable,
  forEachLwcVariable,
  formatSuggestionHooks
} = require('../../src/utils/css-utils');

describe('css-utils', () => {
  describe('isTargetProperty', () => {
    it('should return true for properties starting with --sds-', () => {
      expect(isTargetProperty('--sds-c-button-color-background')).toBe(true);
      expect(isTargetProperty('--sds-g-color-brand-base')).toBe(true);
    });

    it('should return true for properties starting with --slds-', () => {
      expect(isTargetProperty('--slds-c-button-color-background')).toBe(true);
      expect(isTargetProperty('--slds-g-color-brand-base')).toBe(true);
    });

    it('should return true for properties starting with --lwc-', () => {
      expect(isTargetProperty('--lwc-c-button-color-background')).toBe(true);
    });

    it('should return true when propertyTargets is empty', () => {
      expect(isTargetProperty('color', [])).toBe(true);
      expect(isTargetProperty('background-color', [])).toBe(true);
    });

    it('should return true when property is in propertyTargets', () => {
      expect(isTargetProperty('color', ['color', 'background'])).toBe(true);
      expect(isTargetProperty('background', ['color', 'background'])).toBe(true);
    });

    it('should return false when property is not in propertyTargets and not a hook', () => {
      expect(isTargetProperty('margin', ['color', 'background'])).toBe(false);
      expect(isTargetProperty('padding', ['color'])).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isTargetProperty(null, [])).toBe(false);
      expect(isTargetProperty(undefined, [])).toBe(false);
      expect(isTargetProperty(123, [])).toBe(false);
    });
  });

  describe('getVarToken', () => {
    it('should extract variable name from var() function node', () => {
      const node = {
        type: 'Function',
        name: 'var',
        children: [
          { type: 'Identifier', name: '--slds-c-button-color-background' }
        ]
      };
      expect(getVarToken(node)).toBe('--slds-c-button-color-background');
    });

    it('should return empty string for non-var function', () => {
      const node = {
        type: 'Function',
        name: 'calc',
        children: []
      };
      expect(getVarToken(node)).toBe('');
    });

    it('should return empty string for non-function node', () => {
      const node = {
        type: 'Identifier',
        name: '--slds-c-button-color-background'
      };
      expect(getVarToken(node)).toBe('');
    });

    it('should return empty string when children is empty', () => {
      const node = {
        type: 'Function',
        name: 'var',
        children: []
      };
      expect(getVarToken(node)).toBe('');
    });

    it('should return empty string when first child is not Identifier', () => {
      const node = {
        type: 'Function',
        name: 'var',
        children: [
          { type: 'Operator', value: ',' }
        ]
      };
      expect(getVarToken(node)).toBe('');
    });
  });

  describe('forEachSldsVariable', () => {
    it('should call callback for SLDS variables', () => {
      const callback = jest.fn();
      forEachSldsVariable('var(--slds-c-button-color-background)', callback);
      expect(callback).toHaveBeenCalled();
    });

    it('should not call callback for non-SLDS variables', () => {
      const callback = jest.fn();
      forEachSldsVariable('var(--custom-var)', callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should detect fallback in var()', () => {
      const callback = jest.fn();
      forEachSldsVariable('var(--slds-c-button-color-background, #fff)', callback);
      expect(callback).toHaveBeenCalled();
      const callArgs = callback.mock.calls[0];
      expect(callArgs[0].hasFallback).toBe(true);
    });
  });

  describe('forEachNamespacedVariable', () => {
    it('should call callback for SLDS variables', () => {
      const callback = jest.fn();
      forEachNamespacedVariable('var(--slds-c-button-color-background)', callback);
      expect(callback).toHaveBeenCalled();
    });

    it('should call callback for SDS variables', () => {
      const callback = jest.fn();
      forEachNamespacedVariable('var(--sds-c-button-color-background)', callback);
      expect(callback).toHaveBeenCalled();
    });

    it('should not call callback for non-namespaced variables', () => {
      const callback = jest.fn();
      forEachNamespacedVariable('var(--custom-var)', callback);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('forEachLwcVariable', () => {
    it('should call callback for LWC variables', () => {
      const callback = jest.fn();
      forEachLwcVariable('var(--lwc-c-button-color-background)', callback);
      expect(callback).toHaveBeenCalled();
    });

    it('should not call callback for non-LWC variables', () => {
      const callback = jest.fn();
      forEachLwcVariable('var(--slds-c-button-color-background)', callback);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should detect fallback in var()', () => {
      const callback = jest.fn();
      forEachLwcVariable('var(--lwc-c-button-color-background, #fff)', callback);
      expect(callback).toHaveBeenCalled();
      const callArgs = callback.mock.calls[0];
      expect(callArgs[0].hasFallback).toBe(true);
    });
  });

  describe('formatSuggestionHooks', () => {
    it('should return single hook without formatting', () => {
      expect(formatSuggestionHooks(['--slds-c-button-color-background'])).toBe('--slds-c-button-color-background');
    });

    it('should format multiple hooks as numbered list', () => {
      const result = formatSuggestionHooks([
        '--slds-c-button-color-background',
        '--slds-c-button-color-text',
        '--slds-c-button-border-radius'
      ]);
      expect(result).toContain('1. --slds-c-button-color-background');
      expect(result).toContain('2. --slds-c-button-color-text');
      expect(result).toContain('3. --slds-c-button-border-radius');
      expect(result).toContain('\n');
    });

    it('should handle empty array', () => {
      const result = formatSuggestionHooks([]);
      expect(result).toBe('\n');
    });
  });
});

