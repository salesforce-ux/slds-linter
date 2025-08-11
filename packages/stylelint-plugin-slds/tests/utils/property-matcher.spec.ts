import {
  matchesCssProperty,
  isBorderColorProperty,
  isBorderWidthProperty,
  isMarginProperty,
  isPaddingProperty,
  isBorderRadius,
  isDimensionProperty,
  isInsetProperty,
  colorProperties,
  densificationProperties,
  resolvePropertyToMatch
} from '../../src/utils/property-matcher';

describe('property-matcher', () => {
  describe('matchesCssProperty', () => {
    it('should match exact property names', () => {
      const hookProperties = ['color', 'background-color', 'border-width'];
      expect(matchesCssProperty(hookProperties, 'color')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'background-color')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'border-width')).toBe(true);
    });

    it('should match wildcard patterns', () => {
      const hookProperties = ['border*-color', 'margin*', 'padding*'];
      expect(matchesCssProperty(hookProperties, 'border-color')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'border-top-color')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'border-right-color')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'margin')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'margin-top')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'padding')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'padding-bottom')).toBe(true);
    });

    it('should not match non-matching properties', () => {
      const hookProperties = ['border*-color', 'margin*'];
      expect(matchesCssProperty(hookProperties, 'background-color')).toBe(false);
      expect(matchesCssProperty(hookProperties, 'padding')).toBe(false);
      expect(matchesCssProperty(hookProperties, 'border-width')).toBe(false);
    });

    it('should handle empty hook properties array', () => {
      const hookProperties: string[] = [];
      expect(matchesCssProperty(hookProperties, 'color')).toBe(false);
    });

    it('should handle complex wildcard patterns', () => {
      const hookProperties = ['border-*-color', 'margin-*', '*width'];
      expect(matchesCssProperty(hookProperties, 'border-top-color')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'margin-top')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'width')).toBe(true);
      expect(matchesCssProperty(hookProperties, 'border-width')).toBe(true);
    });
  });

  describe('isBorderColorProperty', () => {
    it('should match basic border color properties', () => {
      expect(isBorderColorProperty('border-color')).toBe(true);
      expect(isBorderColorProperty('border-top-color')).toBe(true);
      expect(isBorderColorProperty('border-right-color')).toBe(true);
      expect(isBorderColorProperty('border-bottom-color')).toBe(true);
      expect(isBorderColorProperty('border-left-color')).toBe(true);
    });

    it('should match logical border color properties', () => {
      expect(isBorderColorProperty('border-inline-color')).toBe(true);
      expect(isBorderColorProperty('border-block-color')).toBe(true);
      expect(isBorderColorProperty('border-inline-start-color')).toBe(true);
      expect(isBorderColorProperty('border-inline-end-color')).toBe(true);
      expect(isBorderColorProperty('border-block-start-color')).toBe(true);
      expect(isBorderColorProperty('border-block-end-color')).toBe(true);
      expect(isBorderColorProperty('border-start-color')).toBe(true);
      expect(isBorderColorProperty('border-end-color')).toBe(true);
    });

    it('should not match non-border color properties', () => {
      expect(isBorderColorProperty('color')).toBe(false);
      expect(isBorderColorProperty('background-color')).toBe(false);
      expect(isBorderColorProperty('border-width')).toBe(false);
      expect(isBorderColorProperty('border-style')).toBe(false);
    });
  });

  describe('isBorderWidthProperty', () => {
    it('should match basic border width properties', () => {
      expect(isBorderWidthProperty('border-width')).toBe(true);
      expect(isBorderWidthProperty('border-top-width')).toBe(true);
      expect(isBorderWidthProperty('border-right-width')).toBe(true);
      expect(isBorderWidthProperty('border-bottom-width')).toBe(true);
      expect(isBorderWidthProperty('border-left-width')).toBe(true);
    });

    it('should match logical border width properties', () => {
      expect(isBorderWidthProperty('border-inline-width')).toBe(true);
      expect(isBorderWidthProperty('border-block-width')).toBe(true);
      expect(isBorderWidthProperty('border-inline-start-width')).toBe(true);
      expect(isBorderWidthProperty('border-inline-end-width')).toBe(true);
      expect(isBorderWidthProperty('border-block-start-width')).toBe(true);
      expect(isBorderWidthProperty('border-block-end-width')).toBe(true);
      expect(isBorderWidthProperty('border-start-width')).toBe(true);
      expect(isBorderWidthProperty('border-end-width')).toBe(true);
    });

    it('should not match non-border width properties', () => {
      expect(isBorderWidthProperty('border-color')).toBe(false);
      expect(isBorderWidthProperty('border-style')).toBe(false);
      expect(isBorderWidthProperty('width')).toBe(false);
    });
  });

  describe('isMarginProperty', () => {
    it('should match basic margin properties', () => {
      expect(isMarginProperty('margin')).toBe(true);
      expect(isMarginProperty('margin-top')).toBe(true);
      expect(isMarginProperty('margin-right')).toBe(true);
      expect(isMarginProperty('margin-bottom')).toBe(true);
      expect(isMarginProperty('margin-left')).toBe(true);
    });

    it('should match logical margin properties', () => {
      expect(isMarginProperty('margin-inline')).toBe(true);
      expect(isMarginProperty('margin-block')).toBe(true);
      expect(isMarginProperty('margin-inline-start')).toBe(true);
      expect(isMarginProperty('margin-inline-end')).toBe(true);
      expect(isMarginProperty('margin-block-start')).toBe(true);
      expect(isMarginProperty('margin-block-end')).toBe(true);
      expect(isMarginProperty('margin-start')).toBe(true);
      expect(isMarginProperty('margin-end')).toBe(true);
    });

    it('should not match non-margin properties', () => {
      expect(isMarginProperty('padding')).toBe(false);
      expect(isMarginProperty('border-width')).toBe(false);
      expect(isMarginProperty('color')).toBe(false);
    });
  });

  describe('isPaddingProperty', () => {
    it('should match basic padding properties', () => {
      expect(isPaddingProperty('padding')).toBe(true);
      expect(isPaddingProperty('padding-top')).toBe(true);
      expect(isPaddingProperty('padding-right')).toBe(true);
      expect(isPaddingProperty('padding-bottom')).toBe(true);
      expect(isPaddingProperty('padding-left')).toBe(true);
    });

    it('should match logical padding properties', () => {
      expect(isPaddingProperty('padding-inline')).toBe(true);
      expect(isPaddingProperty('padding-block')).toBe(true);
      expect(isPaddingProperty('padding-inline-start')).toBe(true);
      expect(isPaddingProperty('padding-inline-end')).toBe(true);
      expect(isPaddingProperty('padding-block-start')).toBe(true);
      expect(isPaddingProperty('padding-block-end')).toBe(true);
      expect(isPaddingProperty('padding-start')).toBe(true);
      expect(isPaddingProperty('padding-end')).toBe(true);
    });

    it('should not match non-padding properties', () => {
      expect(isPaddingProperty('margin')).toBe(false);
      expect(isPaddingProperty('border-width')).toBe(false);
      expect(isPaddingProperty('color')).toBe(false);
    });
  });

  describe('isBorderRadius', () => {
    it('should match basic border radius properties', () => {
      expect(isBorderRadius('border-radius')).toBe(true);
      expect(isBorderRadius('border-top-left-radius')).toBe(true);
      expect(isBorderRadius('border-top-right-radius')).toBe(true);
      expect(isBorderRadius('border-bottom-right-radius')).toBe(true);
      expect(isBorderRadius('border-bottom-left-radius')).toBe(true);
    });

    it('should match logical border radius properties', () => {
      expect(isBorderRadius('border-start-start-radius')).toBe(true);
      expect(isBorderRadius('border-start-end-radius')).toBe(true);
      expect(isBorderRadius('border-end-start-radius')).toBe(true);
      expect(isBorderRadius('border-end-end-radius')).toBe(true);
    });

    it('should not match non-border radius properties', () => {
      expect(isBorderRadius('border-width')).toBe(false);
      expect(isBorderRadius('border-color')).toBe(false);
      expect(isBorderRadius('radius')).toBe(false);
    });
  });

  describe('isDimensionProperty', () => {
    it('should match dimension properties', () => {
      expect(isDimensionProperty('width')).toBe(true);
      expect(isDimensionProperty('height')).toBe(true);
      expect(isDimensionProperty('min-width')).toBe(true);
      expect(isDimensionProperty('max-width')).toBe(true);
      expect(isDimensionProperty('min-height')).toBe(true);
      expect(isDimensionProperty('max-height')).toBe(true);
    });

    it('should not match non-dimension properties', () => {
      expect(isDimensionProperty('color')).toBe(false);
      expect(isDimensionProperty('margin')).toBe(false);
      expect(isDimensionProperty('padding')).toBe(false);
      expect(isDimensionProperty('border-width')).toBe(false);
    });
  });

  describe('isInsetProperty', () => {
    it('should match basic inset properties', () => {
      expect(isInsetProperty('inset')).toBe(true);
      expect(isInsetProperty('inset-inline')).toBe(true);
      expect(isInsetProperty('inset-block')).toBe(true);
      expect(isInsetProperty('inset-inline-start')).toBe(true);
      expect(isInsetProperty('inset-inline-end')).toBe(true);
      expect(isInsetProperty('inset-block-start')).toBe(true);
      expect(isInsetProperty('inset-block-end')).toBe(true);
    });

    it('should not match non-inset properties', () => {
      expect(isInsetProperty('top')).toBe(false);
      expect(isInsetProperty('right')).toBe(false);
      expect(isInsetProperty('bottom')).toBe(false);
      expect(isInsetProperty('left')).toBe(false);
      expect(isInsetProperty('margin')).toBe(false);
    });
  });

  describe('colorProperties', () => {
    it('should contain expected color properties', () => {
      expect(colorProperties).toContain('color');
      expect(colorProperties).toContain('fill');
      expect(colorProperties).toContain('background');
      expect(colorProperties).toContain('background-color');
      expect(colorProperties).toContain('stroke');
      expect(colorProperties).toContain('border*-color');
      expect(colorProperties).toContain('outline');
      expect(colorProperties).toContain('outline-color');
    });

    it('should be an array', () => {
      expect(Array.isArray(colorProperties)).toBe(true);
    });
  });

  describe('densificationProperties', () => {
    it('should contain expected densification properties', () => {
      expect(densificationProperties).toContain('border*');
      expect(densificationProperties).toContain('margin*');
      expect(densificationProperties).toContain('padding*');
      expect(densificationProperties).toContain('width');
      expect(densificationProperties).toContain('height');
      expect(densificationProperties).toContain('min-width');
      expect(densificationProperties).toContain('max-width');
      expect(densificationProperties).toContain('min-height');
      expect(densificationProperties).toContain('max-height');
      expect(densificationProperties).toContain('inset');
      expect(densificationProperties).toContain('top');
      expect(densificationProperties).toContain('right');
      expect(densificationProperties).toContain('left');
      expect(densificationProperties).toContain('bottom');
      expect(densificationProperties).toContain('outline');
      expect(densificationProperties).toContain('outline-width');
    });

    it('should be an array', () => {
      expect(Array.isArray(densificationProperties)).toBe(true);
    });
  });

  describe('resolvePropertyToMatch', () => {
    it('should resolve outline properties to border-width', () => {
      expect(resolvePropertyToMatch('outline')).toBe('border-width');
      expect(resolvePropertyToMatch('outline-width')).toBe('border-width');
    });

    it('should resolve border width properties to border-width', () => {
      expect(resolvePropertyToMatch('border-width')).toBe('border-width');
      expect(resolvePropertyToMatch('border-top-width')).toBe('border-width');
      expect(resolvePropertyToMatch('border-right-width')).toBe('border-width');
    });

    it('should resolve margin properties to margin', () => {
      expect(resolvePropertyToMatch('margin')).toBe('margin');
      expect(resolvePropertyToMatch('margin-top')).toBe('margin');
      expect(resolvePropertyToMatch('margin-right')).toBe('margin');
    });

    it('should resolve padding properties to padding', () => {
      expect(resolvePropertyToMatch('padding')).toBe('padding');
      expect(resolvePropertyToMatch('padding-top')).toBe('padding');
      expect(resolvePropertyToMatch('padding-right')).toBe('padding');
    });

    it('should resolve border radius properties to border-radius', () => {
      expect(resolvePropertyToMatch('border-radius')).toBe('border-radius');
      expect(resolvePropertyToMatch('border-top-left-radius')).toBe('border-radius');
      expect(resolvePropertyToMatch('border-top-right-radius')).toBe('border-radius');
    });

    it('should resolve dimension properties to width', () => {
      expect(resolvePropertyToMatch('width')).toBe('width');
      expect(resolvePropertyToMatch('height')).toBe('width');
      expect(resolvePropertyToMatch('min-width')).toBe('width');
      expect(resolvePropertyToMatch('max-width')).toBe('width');
      expect(resolvePropertyToMatch('min-height')).toBe('width');
      expect(resolvePropertyToMatch('max-height')).toBe('width');
    });

    it('should resolve inset properties to top', () => {
      expect(resolvePropertyToMatch('inset')).toBe('top');
      expect(resolvePropertyToMatch('inset-inline')).toBe('top');
      expect(resolvePropertyToMatch('inset-block')).toBe('top');
      expect(resolvePropertyToMatch('inset-inline-start')).toBe('top');
      expect(resolvePropertyToMatch('inset-inline-end')).toBe('top');
      expect(resolvePropertyToMatch('inset-block-start')).toBe('top');
      expect(resolvePropertyToMatch('inset-block-end')).toBe('top');
    });

    it('should return the property as-is for other properties', () => {
      expect(resolvePropertyToMatch('color')).toBe('color');
      expect(resolvePropertyToMatch('background-color')).toBe('background-color');
      expect(resolvePropertyToMatch('font-size')).toBe('font-size');
      expect(resolvePropertyToMatch('display')).toBe('display');
    });

    it('should handle case-insensitive input', () => {
      expect(resolvePropertyToMatch('OUTLINE')).toBe('border-width');
      expect(resolvePropertyToMatch('Margin')).toBe('margin');
      expect(resolvePropertyToMatch('PADDING')).toBe('padding');
    });
  });
}); 