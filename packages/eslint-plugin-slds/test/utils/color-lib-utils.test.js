const {
  findClosestColorHook,
  convertToHex,
  isValidColor,
  extractColorValue,
} = require('../../build/utils/color-lib-utils');

// Minimal shape for ValueToStylingHooksMapping used by findClosestColorHook
const supportedColors = {
  '#ff0000': [
    { name: '--slds-text-color', properties: ['color'], group: 'theme' },
    { name: '--slds-universal-color', properties: ['*'], group: 'reference' },
  ],
  '#00ff00': [
    { name: '--slds-bg-color', properties: ['background-color'], group: 'surface' },
  ],
  '#0000ff': [
    { name: '--slds-border-color', properties: ['border-color'], group: 'borders' },
  ],
  '#ff0101': [
    { name: '--slds-close-red', properties: ['color'], group: 'theme' },
  ],
};

describe('color-lib-utils', () => {

  describe('convertToHex', () => {
    it('converts named colors to hex', () => {
      const hex = convertToHex('red');
      expect(hex && hex.toLowerCase()).toBe('#ff0000');
    });

    it('returns null for invalid colors', () => {
      expect(convertToHex('not-a-color')).toBeNull();
    });

    it('passes through hex unchanged (normalized)', () => {
      const hex = convertToHex('#FfAacc');
      expect(hex && hex.toLowerCase()).toBe('#ffaacc');
    });
  });

  describe('isValidColor', () => {
    it('validates multiple color syntaxes', () => {
      expect(isValidColor('#112233')).toBe(true);
      expect(isValidColor('rgb(10, 20, 30)')).toBe(true);
      expect(isValidColor('hsl(120, 100%, 50%)')).toBe(true);
      expect(isValidColor('rebeccapurple')).toBe(true);
    });

    it('rejects invalid values', () => {
      expect(isValidColor('nope')).toBe(false);
    });

    it('accepts transparent keyword', () => {
      expect(isValidColor('transparent')).toBe(true);
    });
  });

  describe('extractColorValue', () => {
    it('extracts from Hash and Identifier nodes', () => {
      expect(
        extractColorValue({ type: 'Hash', value: 'ff0000' })
      ).toBe('#ff0000');

      expect(
        extractColorValue({ type: 'Identifier', name: 'red' })
      ).toBe('red');
    });

    it('ignores non-color Function nodes', () => {
      expect(
        extractColorValue({ type: 'Function', name: 'calc', children: [] })
      ).toBeNull();
    });

    it('extracts color Function nodes (rgb)', () => {
      const { parse } = require('@eslint/css-tree');
      const ast = parse('rgb(255,0,0)', { context: 'value' });
      const fn = ast.children && ast.children.head && ast.children.head.data;
      const extracted = extractColorValue(fn);
      expect(extracted).toMatch(/^rgb\(/);
      expect(isValidColor(extracted)).toBe(true);
    });
    it('extracts color Function nodes (hsl)', () => {
      const { parse } = require('@eslint/css-tree');
      const ast = parse('hsl(120, 100%, 50%)', { context: 'value' });
      const fn = ast.children && ast.children.head && ast.children.head.data;
      const extracted = extractColorValue(fn);
      expect(extracted).toMatch(/^hsl\(/);
      expect(isValidColor(extracted)).toBe(true);
    });
  });

  describe('findClosestColorHook', () => {
    it('returns hooks ordered by group priority for color property', () => {
      const result = findClosestColorHook('#ff0000', supportedColors, 'color');
      // For color property, order is: surface, theme, feedback, reference
      // #ff0000 matches theme group (--slds-text-color) with distance 0
      expect(result[0]).toBe('--slds-text-color');
      expect(result).toContain('--slds-text-color');
    });

    it('finds close colors within threshold for the requested property', () => {
      const result = findClosestColorHook('#ff0101', supportedColors, 'color');
      // Should find both --slds-text-color and --slds-close-red (both theme group, close to input)
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('--slds-text-color');
    });

    it('returns empty array when no close colors within threshold', () => {
      const result = findClosestColorHook('#abcdef', supportedColors, 'color');
      expect(result).toEqual([]);
    });

    it('respects property matching - only returns hooks for matching properties', () => {
      const result = findClosestColorHook('#00ff00', supportedColors, 'background-color');
      // Should find --slds-bg-color which has background-color property
      expect(result).toContain('--slds-bg-color');
    });

    it('includes wildcard (*) property hooks for any CSS property', () => {
      const result = findClosestColorHook('#ff0000', supportedColors, 'color');
      // --slds-universal-color has '*' property, should be included
      expect(result).toContain('--slds-universal-color');
    });

    it('orders by group priority based on CSS property type', () => {
      const result = findClosestColorHook('#0000ff', supportedColors, 'border-color');
      // For border-color, borders group should be prioritized
      expect(result[0]).toBe('--slds-border-color');
    });

    it('limits results to 5 hooks maximum', () => {
      const manyColors = {
        '#ff0000': Array.from({ length: 10 }, (_, i) => ({
          name: `--slds-hook-${i}`,
          properties: ['color'],
          group: 'theme',
        })),
      };
      const result = findClosestColorHook('#ff0000', manyColors, 'color');
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });
});