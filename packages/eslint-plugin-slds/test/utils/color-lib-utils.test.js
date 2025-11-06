const {
  findClosestColorHook,
  convertToHex,
  isHexCode,
  isHardCodedColor,
  isValidColor,
  extractColorValue,
} = require('../../src/utils/color-lib-utils');

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

    it('rejects non-hex strings', () => {
      expect(isHexCode('red')).toBe(false);
      expect(isHexCode('rgb(0,0,0)')).toBe(false);
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
  });

  describe('convertToHex', () => {
    it('converts named colors to hex', () => {
      const hex = convertToHex('red');
      expect(hex && hex.toLowerCase()).toBe('#ff0000');
    });

    it('returns null for invalid colors', () => {
      expect(convertToHex('not-a-color')).toBeNull();
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
  });
});
