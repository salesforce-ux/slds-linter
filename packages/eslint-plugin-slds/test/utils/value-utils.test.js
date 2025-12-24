const {
  isGlobalValue,
  parseUnitValue,
  toAlternateUnitValue
} = require('../../src/utils/value-utils');

describe('value-utils', () => {
  describe('isGlobalValue', () => {
    it('should return true for CSS global values', () => {
      expect(isGlobalValue('initial')).toBe(true);
      expect(isGlobalValue('inherit')).toBe(true);
      expect(isGlobalValue('unset')).toBe(true);
      expect(isGlobalValue('revert')).toBe(true);
      expect(isGlobalValue('revert-layer')).toBe(true);
    });

    it('should return false for non-global values', () => {
      expect(isGlobalValue('10px')).toBe(false);
      expect(isGlobalValue('red')).toBe(false);
      expect(isGlobalValue('auto')).toBe(false);
      expect(isGlobalValue('')).toBe(false);
    });
  });

  describe('parseUnitValue', () => {
    it('should parse values with units', () => {
      expect(parseUnitValue('10px')).toEqual({ value: 10, unit: 'px' });
      expect(parseUnitValue('1.5rem')).toEqual({ value: 1.5, unit: 'rem' });
      expect(parseUnitValue('50%')).toEqual({ value: 50, unit: '%' });
      expect(parseUnitValue('2em')).toEqual({ value: 2, unit: 'em' });
      expect(parseUnitValue('5ch')).toEqual({ value: 5, unit: 'ch' });
    });

    it('should parse negative values', () => {
      expect(parseUnitValue('-10px')).toEqual({ value: -10, unit: 'px' });
      expect(parseUnitValue('-1.5rem')).toEqual({ value: -1.5, unit: 'rem' });
    });

    it('should parse unitless values', () => {
      expect(parseUnitValue('10')).toEqual({ value: 10, unit: null });
      expect(parseUnitValue('1.5')).toEqual({ value: 1.5, unit: null });
    });

    it('should return null for invalid values', () => {
      expect(parseUnitValue('')).toBe(null);
      expect(parseUnitValue('abc')).toBe(null);
      expect(parseUnitValue('10pt')).toBe(null); // pt is not in allowed units
      expect(parseUnitValue('10px 20px')).toBe(null);
    });
  });

  describe('toAlternateUnitValue', () => {
    it('should convert px to rem', () => {
      expect(toAlternateUnitValue(16, 'px')).toEqual({ value: 1, unit: 'rem' });
      expect(toAlternateUnitValue(8, 'px')).toEqual({ value: 0.5, unit: 'rem' });
      expect(toAlternateUnitValue(24, 'px')).toEqual({ value: 1.5, unit: 'rem' });
    });

    it('should convert rem to px', () => {
      expect(toAlternateUnitValue(1, 'rem')).toEqual({ value: 16, unit: 'px' });
      expect(toAlternateUnitValue(1.5, 'rem')).toEqual({ value: 24, unit: 'px' });
      expect(toAlternateUnitValue(0.5, 'rem')).toEqual({ value: 8, unit: 'px' });
    });

    it('should return null for other units', () => {
      expect(toAlternateUnitValue(10, '%')).toBe(null);
      expect(toAlternateUnitValue(10, 'em')).toBe(null);
      expect(toAlternateUnitValue(10, 'ch')).toBe(null);
      expect(toAlternateUnitValue(10, null)).toBe(null);
    });

    it('should handle decimal conversions correctly', () => {
      const result = toAlternateUnitValue(10, 'px');
      expect(result).toEqual({ value: 0.625, unit: 'rem' });
    });
  });
});

