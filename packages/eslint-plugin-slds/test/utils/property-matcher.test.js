const {
  matchesCssProperty,
  isBorderColorProperty,
  isBorderWidthProperty,
  isMarginProperty,
  isPaddingProperty,
  isBorderRadius,
  isDimensionProperty,
  isInsetProperty,
  toSelector,
  resolveDensityPropertyToMatch,
  resolveColorPropertyToMatch,
  isOutlineWidthProperty
} = require('../../src/utils/property-matcher');

describe('property-matcher', () => {
  describe('matchesCssProperty', () => {
    it('should match exact property names', () => {
      expect(matchesCssProperty(['color'], 'color')).toBe(true);
      expect(matchesCssProperty(['background-color'], 'background-color')).toBe(true);
    });

    it('should match wildcard patterns', () => {
      expect(matchesCssProperty(['border*'], 'border')).toBe(true);
      expect(matchesCssProperty(['border*'], 'border-top')).toBe(true);
      expect(matchesCssProperty(['border*'], 'border-color')).toBe(true);
      expect(matchesCssProperty(['margin*'], 'margin-top')).toBe(true);
    });

    it('should return false for non-matching properties', () => {
      expect(matchesCssProperty(['color'], 'background-color')).toBe(false);
      expect(matchesCssProperty(['border*'], 'margin')).toBe(false);
    });

    it('should match if any pattern matches', () => {
      expect(matchesCssProperty(['color', 'background*'], 'background-color')).toBe(true);
      expect(matchesCssProperty(['margin*', 'padding*'], 'padding-top')).toBe(true);
    });
  });

  describe('isBorderColorProperty', () => {
    it('should return true for border-color properties', () => {
      expect(isBorderColorProperty('border')).toBe(true);
      expect(isBorderColorProperty('border-color')).toBe(true);
      expect(isBorderColorProperty('border-top-color')).toBe(true);
      expect(isBorderColorProperty('border-right-color')).toBe(true);
      expect(isBorderColorProperty('border-bottom-color')).toBe(true);
      expect(isBorderColorProperty('border-left-color')).toBe(true);
    });

    it('should return false for non-border-color properties', () => {
      expect(isBorderColorProperty('border-width')).toBe(false);
      expect(isBorderColorProperty('margin')).toBe(false);
      expect(isBorderColorProperty('color')).toBe(false);
    });
  });

  describe('isBorderWidthProperty', () => {
    it('should return true for border-width properties', () => {
      expect(isBorderWidthProperty('border')).toBe(true);
      expect(isBorderWidthProperty('border-width')).toBe(true);
      expect(isBorderWidthProperty('border-top-width')).toBe(true);
    });

    it('should return false for non-border-width properties', () => {
      expect(isBorderWidthProperty('border-color')).toBe(false);
      expect(isBorderWidthProperty('margin')).toBe(false);
    });
  });

  describe('isMarginProperty', () => {
    it('should return true for margin properties', () => {
      expect(isMarginProperty('margin')).toBe(true);
      expect(isMarginProperty('margin-top')).toBe(true);
      expect(isMarginProperty('margin-right')).toBe(true);
      expect(isMarginProperty('margin-bottom')).toBe(true);
      expect(isMarginProperty('margin-left')).toBe(true);
    });

    it('should return false for non-margin properties', () => {
      expect(isMarginProperty('padding')).toBe(false);
      expect(isMarginProperty('border')).toBe(false);
    });
  });

  describe('isPaddingProperty', () => {
    it('should return true for padding properties', () => {
      expect(isPaddingProperty('padding')).toBe(true);
      expect(isPaddingProperty('padding-top')).toBe(true);
      expect(isPaddingProperty('padding-right')).toBe(true);
    });

    it('should return false for non-padding properties', () => {
      expect(isPaddingProperty('margin')).toBe(false);
      expect(isPaddingProperty('border')).toBe(false);
    });
  });

  describe('isBorderRadius', () => {
    it('should return true for border-radius properties', () => {
      expect(isBorderRadius('border-radius')).toBe(true);
      expect(isBorderRadius('border-top-left-radius')).toBe(true);
      expect(isBorderRadius('border-top-right-radius')).toBe(true);
    });

    it('should return false for non-border-radius properties', () => {
      expect(isBorderRadius('border')).toBe(false);
      expect(isBorderRadius('margin')).toBe(false);
    });
  });

  describe('isDimensionProperty', () => {
    it('should return true for dimension properties', () => {
      expect(isDimensionProperty('width')).toBe(true);
      expect(isDimensionProperty('height')).toBe(true);
      expect(isDimensionProperty('min-width')).toBe(true);
      expect(isDimensionProperty('max-width')).toBe(true);
      expect(isDimensionProperty('min-height')).toBe(true);
      expect(isDimensionProperty('max-height')).toBe(true);
    });

    it('should return false for non-dimension properties', () => {
      expect(isDimensionProperty('margin')).toBe(false);
      expect(isDimensionProperty('color')).toBe(false);
    });
  });

  describe('isInsetProperty', () => {
    it('should return true for inset properties', () => {
      expect(isInsetProperty('inset')).toBe(true);
      expect(isInsetProperty('inset-inline')).toBe(true);
      expect(isInsetProperty('inset-block')).toBe(true);
    });

    it('should return false for non-inset properties', () => {
      expect(isInsetProperty('margin')).toBe(false);
      expect(isInsetProperty('padding')).toBe(false);
    });
  });

  describe('toSelector', () => {
    it('should convert properties to CSS AST selectors', () => {
      expect(toSelector(['color'])).toBe("Declaration[property='color']");
      expect(toSelector(['background-color'])).toBe("Declaration[property='background-color']");
    });

    it('should handle wildcard patterns', () => {
      const result = toSelector(['border*']);
      expect(result).toContain('Declaration[property=/^border');
    });

    it('should handle multiple properties', () => {
      const result = toSelector(['color', 'background-color']);
      expect(result).toContain("Declaration[property='color']");
      expect(result).toContain("Declaration[property='background-color']");
    });
  });

  describe('resolveDensityPropertyToMatch', () => {
    it('should resolve border-width properties', () => {
      expect(resolveDensityPropertyToMatch('border-width')).toBe('border-width');
      expect(resolveDensityPropertyToMatch('outline-width')).toBe('border-width');
    });

    it('should resolve margin properties', () => {
      expect(resolveDensityPropertyToMatch('margin')).toBe('margin');
      expect(resolveDensityPropertyToMatch('margin-top')).toBe('margin');
    });

    it('should resolve padding properties', () => {
      expect(resolveDensityPropertyToMatch('padding')).toBe('padding');
      expect(resolveDensityPropertyToMatch('padding-top')).toBe('padding');
    });

    it('should resolve dimension properties to width', () => {
      expect(resolveDensityPropertyToMatch('width')).toBe('width');
      expect(resolveDensityPropertyToMatch('height')).toBe('width');
      expect(resolveDensityPropertyToMatch('min-width')).toBe('width');
    });

    it('should resolve inset properties to top', () => {
      expect(resolveDensityPropertyToMatch('inset')).toBe('top');
      expect(resolveDensityPropertyToMatch('inset-inline')).toBe('top');
    });
  });

  describe('resolveColorPropertyToMatch', () => {
    it('should resolve outline to border-color', () => {
      expect(resolveColorPropertyToMatch('outline')).toBe('border-color');
      expect(resolveColorPropertyToMatch('outline-color')).toBe('border-color');
    });

    it('should resolve background properties', () => {
      expect(resolveColorPropertyToMatch('background')).toBe('background-color');
      expect(resolveColorPropertyToMatch('background-color')).toBe('background-color');
    });

    it('should resolve border-color properties', () => {
      expect(resolveColorPropertyToMatch('border')).toBe('border-color');
      expect(resolveColorPropertyToMatch('border-color')).toBe('border-color');
      expect(resolveColorPropertyToMatch('border-top-color')).toBe('border-color');
    });

    it('should return property as-is for other properties', () => {
      expect(resolveColorPropertyToMatch('color')).toBe('color');
      expect(resolveColorPropertyToMatch('fill')).toBe('fill');
    });
  });

  describe('isOutlineWidthProperty', () => {
    it('should return true for outline width properties', () => {
      expect(isOutlineWidthProperty('outline')).toBe(true);
      expect(isOutlineWidthProperty('outline-width')).toBe(true);
    });

    it('should return false for other properties', () => {
      expect(isOutlineWidthProperty('outline-color')).toBe(false);
      expect(isOutlineWidthProperty('border')).toBe(false);
    });
  });
});

