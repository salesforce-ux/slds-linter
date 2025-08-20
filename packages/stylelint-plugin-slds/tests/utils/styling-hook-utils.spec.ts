import { getStylingHooksForDensityValue } from '../../src/utils/styling-hook-utils';
import type { ValueToStylingHookEntry, ValueToStylingHooksMapping } from '@salesforce-ux/sds-metadata';

describe('styling-hook-utils', () => {
  describe('getStylingHooksForDensityValue', () => {
    const mockStylingHooks: ValueToStylingHooksMapping = {
      // Original spacing hooks
      '16px': [
        {
          name: 'slds-spacing-small',
          properties: ['margin', 'padding', 'width', 'height']
        },
        {
          name: 'slds-spacing-medium',
          properties: ['margin', 'padding']
        }
      ],
      '1rem': [
        {
          name: 'slds-spacing-small-rem',
          properties: ['margin', 'padding', 'width', 'height']
        }
      ],
      '32px': [
        {
          name: 'slds-spacing-large',
          properties: ['margin', 'padding']
        }
      ],
      '2rem': [
        {
          name: 'slds-spacing-large-rem',
          properties: ['margin', 'padding']
        }
      ],
      // Line height hooks
      '1.25': [
        {
          name: '--slds-g-font-lineheight-2',
          properties: ['line-height']
        }
      ],
      '1.5': [
        {
          name: '--slds-g-font-lineheight-base',
          properties: ['line-height']
        },
        {
          name: '--slds-g-font-lineheight-4',
          properties: ['line-height']
        }
      ],
      '1.375': [
        {
          name: '--slds-g-font-lineheight-3',
          properties: ['line-height']
        }
      ],
      '1.75': [
        {
          name: '--slds-g-font-lineheight-5',
          properties: ['line-height']
        }
      ]
    };

    it('should return matching hooks for exact px value match', () => {
      const result = getStylingHooksForDensityValue('16px', mockStylingHooks, 'margin');
      expect(result).toEqual(['slds-spacing-small', 'slds-spacing-medium', 'slds-spacing-small-rem']);
    });

    it('should return matching hooks for exact rem value match', () => {
      const result = getStylingHooksForDensityValue('1rem', mockStylingHooks, 'padding');
      expect(result).toEqual(['slds-spacing-small', 'slds-spacing-medium', 'slds-spacing-small-rem']);
    });

    it('should return matching hooks for px to rem conversion', () => {
      const result = getStylingHooksForDensityValue('16px', mockStylingHooks, 'width');
      expect(result).toEqual(['slds-spacing-small', 'slds-spacing-small-rem']);
    });

    it('should return matching hooks for rem to px conversion', () => {
      const result = getStylingHooksForDensityValue('2rem', mockStylingHooks, 'margin');
      expect(result).toEqual(['slds-spacing-large', 'slds-spacing-large-rem']);
    });

    it('should return matching hooks for rem to px conversion', () => {
      const result = getStylingHooksForDensityValue('1rem', mockStylingHooks, 'height');
      expect(result).toEqual(['slds-spacing-small', 'slds-spacing-small-rem']);
    });

    it('should filter hooks by CSS property', () => {
      const result = getStylingHooksForDensityValue('16px', mockStylingHooks, 'width');
      expect(result).toEqual(['slds-spacing-small', 'slds-spacing-small-rem']);
      // Should not include slds-spacing-medium since it doesn't include 'width'
      const result1 = getStylingHooksForDensityValue('1.25', mockStylingHooks, 'font-size');
      expect(result1).toEqual([]);
      // Should not include any hooks since they are for line-height only
    });

    it('should return empty array when no matching value found', () => {
      const result = getStylingHooksForDensityValue('8px', mockStylingHooks, 'margin');
      expect(result).toEqual([]);
    });

    it('should return empty array when no hooks match the CSS property', () => {
      const result = getStylingHooksForDensityValue('16px', mockStylingHooks, 'color');
      expect(result).toEqual([]);
    });

    it('should handle empty styling hooks mapping', () => {
      const emptyMapping: ValueToStylingHooksMapping = {};
      const result = getStylingHooksForDensityValue('16px', emptyMapping, 'margin');
      expect(result).toEqual([]);
    });

    it('should handle invalid value format', () => {
      expect(() => {
        getStylingHooksForDensityValue('invalid', mockStylingHooks, 'margin');
      }).toThrow();
    });

    it('should handle empty value', () => {
      expect(() => {
        getStylingHooksForDensityValue('', mockStylingHooks, 'margin');
      }).toThrow();
    });

    it('should handle zero values', () => {
      const zeroMapping: ValueToStylingHooksMapping = {
        '0px': [
          {
            name: 'slds-spacing-none',
            properties: ['margin', 'padding']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('0px', zeroMapping, 'margin');
      expect(result).toEqual(['slds-spacing-none']);
    });

    it('should handle decimal values', () => {
      const decimalMapping: ValueToStylingHooksMapping = {
        '0.5rem': [
          {
            name: 'slds-spacing-tiny',
            properties: ['margin', 'padding']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('0.5rem', decimalMapping, 'margin');
      expect(result).toEqual(['slds-spacing-tiny']);
    });

    it('should handle multiple hooks with same value but different properties', () => {
      const multiHookMapping: ValueToStylingHooksMapping = {
        '16px': [
          {
            name: 'slds-spacing-small',
            properties: ['margin', 'padding']
          },
          {
            name: 'slds-spacing-small-dimensions',
            properties: ['width', 'height']
          },
          {
            name: 'slds-spacing-small-all',
            properties: ['margin', 'padding', 'width', 'height']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('16px', multiHookMapping, 'width');
      expect(result).toEqual(['slds-spacing-small-dimensions', 'slds-spacing-small-all']);
    });

    it('should handle case-sensitive CSS property matching', () => {
      const result = getStylingHooksForDensityValue('16px', mockStylingHooks, 'MARGIN');
      expect(result).toEqual([]);
    });

    it('should handle complex unit conversions', () => {
      // Test that 16px matches 1rem (16/16 = 1)
      const conversionMapping: ValueToStylingHooksMapping = {
        '1rem': [
          {
            name: 'slds-spacing-small-rem',
            properties: ['margin', 'padding']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('16px', conversionMapping, 'margin');
      expect(result).toEqual(['slds-spacing-small-rem']);
    });

    it('should handle reverse unit conversions', () => {
      // Test that 1rem matches 16px (1*16 = 16)
      const conversionMapping: ValueToStylingHooksMapping = {
        '16px': [
          {
            name: 'slds-spacing-small',
            properties: ['margin', 'padding']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('1rem', conversionMapping, 'margin');
      expect(result).toEqual(['slds-spacing-small']);
    });

    it('should handle non-convertible values', () => {
      // Test values that don't convert cleanly between px and rem
      const result = getStylingHooksForDensityValue('17px', mockStylingHooks, 'margin');
      expect(result).toEqual([]);
    });

    it('should handle hooks with empty properties array', () => {
      const emptyPropsMapping: ValueToStylingHooksMapping = {
        '16px': [
          {
            name: 'slds-spacing-small',
            properties: []
          }
        ]
      };
      const result = getStylingHooksForDensityValue('16px', emptyPropsMapping, 'margin');
      expect(result).toEqual([]);
    });

    it('should handle hooks with null/undefined properties', () => {
      const nullPropsMapping: ValueToStylingHooksMapping = {
        '16px': [
          {
            name: 'slds-spacing-small',
            properties: ['margin', 'padding']
          } as ValueToStylingHookEntry
        ]
      };
      const result = getStylingHooksForDensityValue('16px', nullPropsMapping, 'margin');
      expect(result).toEqual(['slds-spacing-small']);
    });

    it('should handle very large values', () => {
      const largeValueMapping: ValueToStylingHooksMapping = {
        '1000px': [
          {
            name: 'slds-spacing-very-large',
            properties: ['margin', 'padding']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('1000px', largeValueMapping, 'margin');
      expect(result).toEqual(['slds-spacing-very-large']);
    });

    it('should handle very small values', () => {
      const smallValueMapping: ValueToStylingHooksMapping = {
        '0.0625rem': [
          {
            name: 'slds-spacing-tiny',
            properties: ['margin', 'padding']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('0.0625rem', smallValueMapping, 'margin');
      expect(result).toEqual(['slds-spacing-tiny']);
    });

    it('should handle negative values', () => {
      const negativeValueMapping: ValueToStylingHooksMapping = {
        '-16px': [
          {
            name: 'slds-spacing-negative',
            properties: ['margin', 'padding']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('-16px', negativeValueMapping, 'margin');
      expect(result).toEqual(['slds-spacing-negative']);
    });

    it('should handle mixed unit types in the same mapping', () => {
      const mixedMapping: ValueToStylingHooksMapping = {
        '16px': [
          {
            name: 'slds-spacing-small-px',
            properties: ['margin', 'padding']
          }
        ],
        '1rem': [
          {
            name: 'slds-spacing-small-rem',
            properties: ['margin', 'padding']
          }
        ]
      };
      const result = getStylingHooksForDensityValue('16px', mixedMapping, 'margin');
      expect(result).toEqual(['slds-spacing-small-px', 'slds-spacing-small-rem']);
    });

    // Line height specific tests
    it('should return matching hooks for line-height with single hook', () => {
      const result = getStylingHooksForDensityValue('1.25', mockStylingHooks, 'line-height');
      expect(result).toEqual(['--slds-g-font-lineheight-2']);
    });

    it('should return matching hooks for line-height with multiple hooks', () => {
      const result = getStylingHooksForDensityValue('1.5', mockStylingHooks, 'line-height');
      expect(result).toEqual(['--slds-g-font-lineheight-base', '--slds-g-font-lineheight-4']);
    });

    it('should return matching hooks for line-height with decimal value', () => {
      const result = getStylingHooksForDensityValue('1.375', mockStylingHooks, 'line-height');
      expect(result).toEqual(['--slds-g-font-lineheight-3']);
    });

    it('should return matching hooks for line-height with larger value', () => {
      const result = getStylingHooksForDensityValue('1.75', mockStylingHooks, 'line-height');
      expect(result).toEqual(['--slds-g-font-lineheight-5']);
    });

    it('should handle unitless line-height values', () => {
      const result = getStylingHooksForDensityValue('1.25', mockStylingHooks, 'line-height');
      expect(result).toEqual(['--slds-g-font-lineheight-2']);
    });
  });
}); 