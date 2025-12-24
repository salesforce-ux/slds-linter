const { isRuleEnabled } = require('../../src/utils/rule-utils');

describe('rule-utils', () => {
  describe('isRuleEnabled', () => {
    it('should return true when rule is enabled with boolean true', () => {
      const context = {
        settings: {
          sldsRules: {
            'my-rule': true
          }
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(true);
    });

    it('should return true when rule is enabled with array [true]', () => {
      const context = {
        settings: {
          sldsRules: {
            'my-rule': [true]
          }
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(true);
    });

    it('should return false when rule is enabled with array [false]', () => {
      const context = {
        settings: {
          sldsRules: {
            'my-rule': [false]
          }
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(false);
    });

    it('should return false when rule is explicitly set to false', () => {
      // The implementation now checks ruleConfig === false first, before checking !== undefined && !== null
      const context = {
        settings: {
          sldsRules: {
            'my-rule': false
          }
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(false);
    });

    it('should return false when rule is not in settings', () => {
      const context = {
        settings: {
          sldsRules: {}
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(false);
    });

    it('should return false when settings are undefined', () => {
      const context = {
        settings: undefined
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(false);
    });

    it('should return false when sldsRules are undefined', () => {
      const context = {
        settings: {}
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(false);
    });

    it('should return false when rule value is null', () => {
      const context = {
        settings: {
          sldsRules: {
            'my-rule': null
          }
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(false);
    });

    it('should return false when rule value is undefined', () => {
      const context = {
        settings: {
          sldsRules: {
            'my-rule': undefined
          }
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(false);
    });

    it('should handle errors gracefully and return false', () => {
      // Create a context that throws when accessing sldsRules
      const context = {
        get settings() {
          return {
            get sldsRules() {
              throw new Error('Access error');
            }
          };
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(false);
    });

    it('should return true for non-boolean truthy values', () => {
      const context = {
        settings: {
          sldsRules: {
            'my-rule': 'warn',
            'another-rule': 1,
            'third-rule': 'error'
          }
        }
      };
      expect(isRuleEnabled(context, 'my-rule')).toBe(true);
      expect(isRuleEnabled(context, 'another-rule')).toBe(true);
      expect(isRuleEnabled(context, 'third-rule')).toBe(true);
    });
  });
});

