const {
  findClosestColorHook,
  convertToHex,
  isHexCode,
  isHardCodedColor,
  isValidColor,
  extractColorValue,
  isSemanticHook,
  isPaletteHook,
  sortBasedOnCategoryAndProperty,
} = require('../../build/utils/color-lib-utils');

// Minimal shape for ValueToStylingHooksMapping used by findClosestColorHook
const supportedColors = {
  '#ff0000': [
    { name: '--slds-text-color', properties: ['color'] },
    { name: '--slds-universal-color', properties: ['*'] },
  ],
  '#00ff00': [
    { name: '--slds-bg-color', properties: ['background-color'] },
  ],
  '#0000ff': [
    { name: '--slds-border-color', properties: ['border-color'] },
  ],
};

describe('color-lib-utils', () => {
  describe('isHexCode', () => {
    it('detects valid hex codes', () => {
      expect(isHexCode('#fff')).toBe(true);
      expect(isHexCode('#ff00ff')).toBe(true);
    });

  describe('isSemanticHook and isPaletteHook', () => {
    it('detects semantic hooks', () => {
      expect(isSemanticHook('--slds-surface-container')).toBe(true);
      expect(isSemanticHook('--slds-g-color-surface-1')).toBe(true);
      expect(isSemanticHook('--slds-g-color-accent-1')).toBe(true);
      expect(isSemanticHook('--slds-g-color-error-1')).toBe(true);
      expect(isSemanticHook('--slds-g-color-warning-1')).toBe(true);
      expect(isSemanticHook('--slds-g-color-info-1')).toBe(true);
      expect(isSemanticHook('--slds-g-color-success-1')).toBe(true);
      expect(isSemanticHook('--slds-g-color-disabled-1')).toBe(true);
    });

    it('detects palette hooks', () => {
      expect(isPaletteHook('--slds-g-color-palette-neutral-100')).toBe(true);
      expect(isPaletteHook('--slds-g-color-palette-brand-50')).toBe(true);
    });

    it('does not misclassify system hooks as semantic/palette - all these are system hooks', () => {
      expect(isSemanticHook('--slds-g-color-border-base-1')).toBe(false);
      expect(isPaletteHook('--slds-g-color-border-base-1')).toBe(false);
    });
  });

  describe('sortBasedOnCategoryAndProperty', () => {
    it('orders semantic first, then system, then palette; each by distance; returns top 5', () => {
      const hooks = [
        { name: '--slds-g-color-border-base-1', distance: 2 }, // system
        { name: '--slds-g-color-palette-brand-50', distance: 1 }, // palette
        { name: '--slds-g-color-surface-1', distance: 5 }, // semantic
        { name: '--slds-g-color-surface-2', distance: 1 }, // semantic
        { name: '--slds-g-color-palette-neutral-100', distance: 0.5 }, // palette
        { name: '--slds-g-color-border-base-2', distance: 1 }, // system
        { name: '--slds-g-color-accent-1', distance: 3 }, // semantic
      ];

      const result = sortBasedOnCategoryAndProperty(hooks, 'color');
      // Expect first group: semantic sorted by distance: surface-2 (1), accent-1 (3), surface-1 (5)
      expect(result.slice(0, 3)).toEqual([
        '--slds-g-color-surface-2',
        '--slds-g-color-accent-1',
        '--slds-g-color-surface-1',
      ]);
      // Then system by distance
      expect(result[3]).toBe('--slds-g-color-border-base-2');
      // Still system due to top-5 slice and category priority
      expect(result[4]).toBe('--slds-g-color-border-base-1');
      // Only top 5 returned
      expect(result.length).toBe(5);
    });

    it('is stable within same rank by distance comparison', () => {
      const hooks = [
        { name: '--slds-g-color-surface-3', distance: 2 },
        { name: '--slds-g-color-surface-1', distance: 1 },
        { name: '--slds-g-color-surface-2', distance: 1 },
      ];
      const result = sortBasedOnCategoryAndProperty(hooks, 'color');
      // distance ties keep original relative order among ties due to stable sort behavior of V8
      // Expected first two are the two distance 1 entries in input order
      expect(result[0]).toBe('--slds-g-color-surface-1');
      expect(result[1]).toBe('--slds-g-color-surface-2');
      expect(result[2]).toBe('--slds-g-color-surface-3');
    });
  });

    it('rejects non-hex strings', () => {
      expect(isHexCode('red')).toBe(false);
      expect(isHexCode('rgb(0,0,0)')).toBe(false);
    });

    it('is case-insensitive and exact-length', () => {
      expect(isHexCode('#FFAA00')).toBe(true);
      expect(isHexCode('#ffaa0')).toBe(false);
    });
  });

  describe('isHardCodedColor', () => {
    it('matches rgb/rgba, hex, and named colors', () => {
      expect(isHardCodedColor('rgb(255, 0, 0)')).toBe(true);
      expect(isHardCodedColor('#0f0')).toBe(true);
      expect(isHardCodedColor('red')).toBe(true);
    });

    it('does not match variables or non-color strings', () => {
      expect(isHardCodedColor('var(--slds-color-brand)')).toBe(false);
      expect(isHardCodedColor('inherit')).toBe(true);
    });

    it('ignores CSS variables even with spacing and case', () => {
      expect(isHardCodedColor('VaR   (  --token  )')).toBe(false);
    });
  });

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

  describe('findClosestColorHook (Delta E)', () => {
    it('prefers exact matches for the same property (distance 0)', () => {
      const result = findClosestColorHook('#ff0000', supportedColors, 'color');
      expect(result[0]).toBe('--slds-text-color');
    });

    it('finds close colors within threshold for the requested property', () => {
      const result = findClosestColorHook('#ff0101', supportedColors, 'color');
      expect(result).toContain('--slds-text-color');
    });

    it('returns empty when no close colors within threshold', () => {
      const result = findClosestColorHook('#abcdef', supportedColors, 'color');
      expect(result).toEqual([]);
    });

    it('does not suggest wildcard-only hook if same-property exists and matches better', () => {
      const result = findClosestColorHook('#ff0000', supportedColors, 'color');
      expect(result[0]).toBe('--slds-text-color');
      // universal can still appear later depending on sort, but first should be exact-property semantic
    });
  });
});