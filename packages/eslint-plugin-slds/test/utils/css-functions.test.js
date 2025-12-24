const {
  containsCssFunction,
  isCssFunction,
  isCssMathFunction,
  isCssColorFunction
} = require('../../src/utils/css-functions');

describe('css-functions', () => {
  describe('containsCssFunction', () => {
    it('should return true for values containing CSS functions', () => {
      expect(containsCssFunction('calc(100% - 20px)')).toBe(true);
      expect(containsCssFunction('var(--my-var)')).toBe(true);
      expect(containsCssFunction('linear-gradient(to right, red, blue)')).toBe(true);
      // Note: rgb is not in CSS_FUNCTIONS array, it's in RGB_COLOR_FUNCTIONS
      // So rgb() won't match containsCssFunction
      expect(containsCssFunction('min(10px, 20px)')).toBe(true);
      expect(containsCssFunction('max(10px, 20px)')).toBe(true);
      expect(containsCssFunction('attr(data-value)')).toBe(true);
      expect(containsCssFunction('counter(my-counter)')).toBe(true);
      expect(containsCssFunction('cubic-bezier(0.4, 0, 0.2, 1)')).toBe(true);
    });

    it('should return false for values without CSS functions', () => {
      expect(containsCssFunction('10px')).toBe(false);
      expect(containsCssFunction('#ffffff')).toBe(false);
      expect(containsCssFunction('red')).toBe(false);
      expect(containsCssFunction('')).toBe(false);
      // RGB functions are not in CSS_FUNCTIONS, so they won't match
      expect(containsCssFunction('rgb(255, 0, 0)')).toBe(false);
      expect(containsCssFunction('rgba(255, 0, 0, 0.5)')).toBe(false);
    });
  });

  describe('isCssFunction', () => {
    it('should return true for exact CSS function names', () => {
      expect(isCssFunction('calc')).toBe(true);
      expect(isCssFunction('var')).toBe(true);
      expect(isCssFunction('linear-gradient')).toBe(true);
      expect(isCssFunction('attr')).toBe(true);
      expect(isCssFunction('min')).toBe(true);
      expect(isCssFunction('max')).toBe(true);
    });

    it('should return false for non-CSS functions or partial matches', () => {
      expect(isCssFunction('calc()')).toBe(false);
      expect(isCssFunction('my-calc')).toBe(false);
      expect(isCssFunction('10px')).toBe(false);
      expect(isCssFunction('')).toBe(false);
    });
  });

  describe('isCssMathFunction', () => {
    it('should return true for CSS math functions', () => {
      expect(isCssMathFunction('calc')).toBe(true);
      expect(isCssMathFunction('min')).toBe(true);
      expect(isCssMathFunction('max')).toBe(true);
    });

    it('should return false for non-math CSS functions', () => {
      expect(isCssMathFunction('var')).toBe(false);
      expect(isCssMathFunction('linear-gradient')).toBe(false);
      expect(isCssMathFunction('attr')).toBe(false);
    });

    it('should return false for non-CSS functions', () => {
      expect(isCssMathFunction('my-function')).toBe(false);
      expect(isCssMathFunction('')).toBe(false);
    });
  });

  describe('isCssColorFunction', () => {
    it('should return true for RGB color functions', () => {
      expect(isCssColorFunction('rgb')).toBe(true);
      expect(isCssColorFunction('rgba')).toBe(true);
      expect(isCssColorFunction('hsl')).toBe(true);
      expect(isCssColorFunction('hsla')).toBe(true);
    });

    it('should return false for non-color functions', () => {
      expect(isCssColorFunction('calc')).toBe(false);
      expect(isCssColorFunction('var')).toBe(false);
      expect(isCssColorFunction('linear-gradient')).toBe(false);
      expect(isCssColorFunction('')).toBe(false);
    });
  });
});

