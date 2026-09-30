const {
  findClosestColorHook,
  convertToHex,
  isValidColor,
  extractColorValue,
  classifyColorFamily,
  hasAlphaChannel,
  transparentPercentage,
} = require('../../src/utils/color-lib-utils');

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

    it('excludes reference group wildcard hooks when same-family semantic groups exist', () => {
      const result = findClosestColorHook('#ff0000', supportedColors, 'color');
      // --slds-universal-color is in the reference group — excluded when theme has same-family hooks
      expect(result).not.toContain('--slds-universal-color');
      expect(result).toContain('--slds-text-color');
    });

    it('includes wildcard (*) property hooks when no same-family groups exist', () => {
      // Neutral input: no family promotion, reference group hooks are included via fallback
      const neutralColors = {
        '#808080': [
          { name: '--slds-ref-color', properties: ['*'], group: 'reference' },
          { name: '--slds-surface-color', properties: ['color'], group: 'surface' },
        ],
      };
      const result = findClosestColorHook('#7f7f7f', neutralColors, 'color');
      expect(result).toContain('--slds-ref-color');
    });

    it('orders by group priority based on CSS property type', () => {
      const result = findClosestColorHook('#0000ff', supportedColors, 'border-color');
      // For border-color, borders group should be prioritized
      expect(result[0]).toBe('--slds-border-color');
    });

    it('limits results to 3 per group and total to group count', () => {
      const manyColors = {
        '#ff0000': [
          ...Array.from({ length: 5 }, (_, i) => ({
            name: `--slds-surface-${i}`,
            properties: ['color'],
            group: 'surface',
          })),
          ...Array.from({ length: 5 }, (_, i) => ({
            name: `--slds-feedback-${i}`,
            properties: ['color'],
            group: 'feedback',
          })),
          ...Array.from({ length: 5 }, (_, i) => ({
            name: `--slds-theme-${i}`,
            properties: ['color'],
            group: 'theme',
          })),
        ],
      };
      const result = findClosestColorHook('#ff0000', manyColors, 'color');
      // color order has 5 groups: surface, accent, feedback, theme, reference
      // max results = group count = 5
      expect(result.length).toBeLessThanOrEqual(5);
      // At most 3 from any single group
      expect(result.filter(h => h.includes('surface')).length).toBeLessThanOrEqual(3);
      expect(result.filter(h => h.includes('feedback')).length).toBeLessThanOrEqual(3);
      expect(result.filter(h => h.includes('theme')).length).toBeLessThanOrEqual(3);
    });

    it('includes hooks from multiple groups for diverse suggestions', () => {
      const diverseColors = {
        '#ff0000': [
          { name: '--slds-theme-color', properties: ['color'], group: 'theme' },
          { name: '--slds-feedback-color', properties: ['color'], group: 'feedback' },
          { name: '--slds-reference-color', properties: ['*'], group: 'reference' },
        ],
        '#ff0202': [
          { name: '--slds-surface-color', properties: ['color'], group: 'surface' },
        ],
      };
      const result = findClosestColorHook('#ff0000', diverseColors, 'color');
      // Should include hooks from surface, theme, feedback — not just nearest distance
      expect(result).toContain('--slds-theme-color');
      expect(result).toContain('--slds-surface-color');
      expect(result).toContain('--slds-feedback-color');
    });

    it('excludes different-family groups when same-family groups exist', () => {
      // Green input: only feedback (green) hooks should appear; surface (grey) hooks excluded
      const greenColors = {
        '#808080': [
          { name: '--slds-surface-container-1', properties: ['background-color'], group: 'surface' },
          { name: '--slds-surface-container-2', properties: ['background-color'], group: 'surface' },
        ],
        '#4bca81': [
          { name: '--slds-success-container-1', properties: ['background-color'], group: 'feedback' },
        ],
        '#3dbb72': [
          { name: '--slds-success-base-70', properties: ['background-color'], group: 'feedback' },
        ],
      };
      const result = findClosestColorHook('#4bca81', greenColors, 'background-color');
      // Feedback group has green hooks matching the green input
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('--slds-success-container-1');
      expect(result).toContain('--slds-success-base-70');
      // Surface (grey/neutral) hooks should be completely excluded
      expect(result.filter(h => h.includes('surface'))).toEqual([]);
    });

    it('does not promote groups for neutral input colors', () => {
      // Grey input: no family promotion, standard group order applies
      const greyColors = {
        '#808080': [
          { name: '--slds-surface-1', properties: ['background-color'], group: 'surface' },
        ],
        '#777777': [
          { name: '--slds-theme-neutral', properties: ['background-color'], group: 'theme' },
        ],
      };
      const result = findClosestColorHook('#888888', greyColors, 'background-color');
      // Surface should still come first for background (default group order, no promotion)
      if (result.length > 1) {
        const surfaceIdx = result.findIndex(h => h.includes('surface'));
        const themeIdx = result.findIndex(h => h.includes('theme'));
        if (surfaceIdx !== -1 && themeIdx !== -1) {
          expect(surfaceIdx).toBeLessThan(themeIdx);
        }
      }
    });
  });

  describe('hasAlphaChannel', () => {
    it('returns true for rgba with alpha < 1', () => {
      expect(hasAlphaChannel('rgba(181, 54, 45, 0.7)')).toBe(true);
    });

    it('returns true for hsla with alpha < 1', () => {
      expect(hasAlphaChannel('hsla(240, 75%, 60%, 0.9)')).toBe(true);
    });

    it('returns true for 8-digit hex with alpha', () => {
      expect(hasAlphaChannel('#ff000080')).toBe(true);
    });

    it('returns false for opaque hex color', () => {
      expect(hasAlphaChannel('#ff0000')).toBe(false);
    });

    it('returns false for opaque rgb color', () => {
      expect(hasAlphaChannel('rgb(255, 0, 0)')).toBe(false);
    });

    it('returns false for rgba with alpha = 1', () => {
      expect(hasAlphaChannel('rgba(255, 0, 0, 1)')).toBe(false);
    });

    it('returns false for invalid color', () => {
      expect(hasAlphaChannel('not-a-color')).toBe(false);
    });
  });

  describe('transparentPercentage', () => {
    it('returns 30 for alpha 0.7', () => {
      expect(transparentPercentage('rgba(181, 54, 45, 0.7)')).toBeCloseTo(30);
    });

    it('returns 10 for alpha 0.9', () => {
      expect(transparentPercentage('hsla(240, 75%, 60%, 0.9)')).toBeCloseTo(10);
    });

    it('returns 50 for alpha 0.5', () => {
      expect(transparentPercentage('rgba(0, 0, 0, 0.5)')).toBeCloseTo(50);
    });

    it('returns 0 for fully opaque color', () => {
      expect(transparentPercentage('#ff0000')).toBeCloseTo(0);
    });

    it('handles 8-digit hex with ~50% alpha', () => {
      expect(transparentPercentage('#ff000080')).toBeCloseTo(49.8, 0);
    });
  });

  describe('classifyColorFamily', () => {
    it('classifies pure red', () => {
      expect(classifyColorFamily('#ff0000')).toBe('red');
    });

    it('classifies green', () => {
      expect(classifyColorFamily('#4bca81')).toBe('green');
      expect(classifyColorFamily('#00ff00')).toBe('green');
    });

    it('classifies blue', () => {
      expect(classifyColorFamily('#0000ff')).toBe('blue');
    });

    it('classifies orange', () => {
      expect(classifyColorFamily('#ff8c00')).toBe('orange');
    });

    it('classifies grey/neutral for low saturation', () => {
      expect(classifyColorFamily('#808080')).toBe('neutral');
      expect(classifyColorFamily('#cccccc')).toBe('neutral');
    });

    it('classifies near-black as neutral', () => {
      expect(classifyColorFamily('#0a0a0a')).toBe('neutral');
    });

    it('classifies near-white as neutral', () => {
      expect(classifyColorFamily('#f8f8f8')).toBe('neutral');
    });

    it('classifies purple', () => {
      expect(classifyColorFamily('#8b00ff')).toBe('purple');
    });

    it('classifies cyan', () => {
      expect(classifyColorFamily('#00ced1')).toBe('cyan');
    });

    it('classifies yellow', () => {
      expect(classifyColorFamily('#ffd700')).toBe('yellow');
    });
  });
});