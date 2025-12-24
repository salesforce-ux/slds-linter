const { getCustomMapping } = require('../../build/utils/custom-mapping-utils');

describe('custom-mapping-utils', () => {
  describe('getCustomMapping', () => {
    const customMapping = {
      '--slds-g-color-surface-container-1': {
        properties: ['background*', 'color'],
        values: ['#fff', '#ffffff', 'white']
      },
      '--slds-g-spacing-custom': {
        properties: ['padding', 'margin'],
        values: ['10px', '1rem']
      },
      '--slds-g-font-custom': {
        properties: ['font-size'],
        values: ['14px']
      },
      '--slds-g-shadow-custom': {
        properties: ['box-shadow'],
        values: ['0 2px 4px rgba(0,0,0,0.1)']
      }
    };

    it('returns null when customMapping is undefined', () => {
      expect(getCustomMapping('color', '#fff')).toBeNull();
    });

    it('returns null when customMapping is empty', () => {
      expect(getCustomMapping('color', '#fff', {})).toBeNull();
    });

    it('returns hook for exact property and value match', () => {
      const hook = getCustomMapping('color', '#fff', customMapping);
      expect(hook).toBe('--slds-g-color-surface-container-1');
    });

    it('returns hook for exact property and normalized value match (case insensitive)', () => {
      const hook = getCustomMapping('color', '#FFF', customMapping);
      expect(hook).toBe('--slds-g-color-surface-container-1');
    });

    it('returns hook for wildcard property pattern match', () => {
      // background* should match background-color
      const hook = getCustomMapping('background-color', '#fff', customMapping);
      expect(hook).toBe('--slds-g-color-surface-container-1');
    });

    it('returns hook for another wildcard property pattern match', () => {
      // background* should match background-image
      const hook = getCustomMapping('background-image', '#fff', customMapping);
      expect(hook).toBe('--slds-g-color-surface-container-1');
    });

    it('returns null for non-matching property', () => {
      const hook = getCustomMapping('border-color', '#fff', customMapping);
      expect(hook).toBeNull();
    });

    it('returns null for non-matching value', () => {
      const hook = getCustomMapping('color', '#000', customMapping);
      expect(hook).toBeNull();
    });

    it('returns hook for multiple value matches (first match)', () => {
      const hook1 = getCustomMapping('color', '#fff', customMapping);
      const hook2 = getCustomMapping('color', '#ffffff', customMapping);
      const hook3 = getCustomMapping('color', 'white', customMapping);
      
      expect(hook1).toBe('--slds-g-color-surface-container-1');
      expect(hook2).toBe('--slds-g-color-surface-container-1');
      expect(hook3).toBe('--slds-g-color-surface-container-1');
    });

    it('returns hook for padding property', () => {
      const hook = getCustomMapping('padding', '10px', customMapping);
      expect(hook).toBe('--slds-g-spacing-custom');
    });

    it('returns hook for margin property', () => {
      const hook = getCustomMapping('margin', '1rem', customMapping);
      expect(hook).toBe('--slds-g-spacing-custom');
    });

    it('returns hook for font-size property', () => {
      const hook = getCustomMapping('font-size', '14px', customMapping);
      expect(hook).toBe('--slds-g-font-custom');
    });

    it('returns hook for box-shadow property', () => {
      const hook = getCustomMapping('box-shadow', '0 2px 4px rgba(0,0,0,0.1)', customMapping);
      expect(hook).toBe('--slds-g-shadow-custom');
    });

    it('handles whitespace in values', () => {
      const hook = getCustomMapping('color', '  #fff  ', customMapping);
      expect(hook).toBe('--slds-g-color-surface-container-1');
    });

    it('is case insensitive for property names', () => {
      const hook1 = getCustomMapping('COLOR', '#fff', customMapping);
      const hook2 = getCustomMapping('Color', '#fff', customMapping);
      
      expect(hook1).toBe('--slds-g-color-surface-container-1');
      expect(hook2).toBe('--slds-g-color-surface-container-1');
    });

    it('returns null when property pattern does not match (no wildcard match)', () => {
      const customMappingWithWildcard = {
        '--slds-g-color-custom': {
          properties: ['background*'],
          values: ['#fff']
        }
      };
      const hook = getCustomMapping('color', '#fff', customMappingWithWildcard);
      expect(hook).toBeNull();
    });

    it('returns null when property matches but value does not match', () => {
      const hook = getCustomMapping('background-color', '#000', customMapping);
      expect(hook).toBeNull();
    });

    it('handles property pattern that does not end with wildcard', () => {
      const customMappingExact = {
        '--slds-g-color-custom': {
          properties: ['background'], // No wildcard
          values: ['#fff']
        }
      };
      const hook1 = getCustomMapping('background', '#fff', customMappingExact);
      const hook2 = getCustomMapping('background-color', '#fff', customMappingExact);
      expect(hook1).toBe('--slds-g-color-custom');
      expect(hook2).toBeNull(); // Should not match because no wildcard
    });
  });
});
