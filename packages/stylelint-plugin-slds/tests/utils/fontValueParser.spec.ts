import { parseFont } from '../../src/utils/fontValueParser';

describe('fontValueParser', () => {
  describe('parseFont', () => {
    it('should parse basic font shorthand', () => {
      expect(parseFont('12px Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": '12px',
        "line-height": '',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

    it('should parse font with line height', () => {
      expect(parseFont('12px/1.5 Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": '12px',
        "line-height": '1.5',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

    it('should parse font with style and weight', () => {
      expect(parseFont('italic bold 12px Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": '12px',
        "line-height": '',
        "font-style": 'italic',
        "font-variant": undefined,
        "font-weight": 'bold',
      });
    });

    it('should parse font with variant', () => {
      expect(parseFont('small-caps 12px Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": '12px',
        "line-height": '',
        "font-style": undefined,
        "font-variant": 'small-caps',
        "font-weight": undefined,
      });
    });

    it('should parse font with all properties', () => {
      expect(parseFont('italic small-caps bold 12px/1.5 Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": '12px',
        "line-height": '1.5',
        "font-style": 'italic',
        "font-variant": 'small-caps',
        "font-weight": 'bold',
      });
    });

    it('should handle quoted font family names', () => {
      expect(parseFont('12px "Times New Roman"')).toEqual({
        "font-family": '"Times New Roman"',
        "font-size": '12px',
        "line-height": '',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

    it('should handle multiple font families', () => {
      expect(parseFont('12px Arial, "Helvetica Neue", sans-serif')).toEqual({
        "font-family": 'Arial, "Helvetica Neue", sans-serif',
        "font-size": '12px',
        "line-height": '',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

    it('should handle CSS variables for font size', () => {
      expect(parseFont('var(--font-size) Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": 'var(--font-size)',
        "line-height": '',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

    it('should handle CSS variables for line height', () => {
      expect(parseFont('12px/var(--line-height) Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": '12px',
        "line-height": 'var(--line-height)',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

  

    it('should handle CSS variables for font weight', () => {
      expect(parseFont('var(--font-weight) 12px Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": '12px',
        "line-height": '',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": 'var(--font-weight)',
      });
    });


    it('should handle nested CSS variables', () => {
      expect(parseFont('var(--font-size, var(--fallback)) Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": 'var(--font-size, var(--fallback))',
        "line-height": '',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

    it('should handle CSS variables with fallbacks', () => {
      expect(parseFont('var(--font-size, 12px) Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": 'var(--font-size, 12px)',
        "line-height": '',
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

    it('should handle multiple CSS variables', () => {
      expect(parseFont('var(--font-style) var(--font-weight) var(--font-size) Arial')).toEqual({
        "font-family": 'Arial',
        "font-size": 'var(--font-size)',
        "line-height": '',
        "font-style": 'var(--font-style)',
        "font-variant": undefined,
        "font-weight": 'var(--font-weight)',
      });
    });

    it('should handle empty string', () => {
      expect(parseFont('')).toEqual({
        "font-family": "",
        "font-size": "",
        "line-height": "",
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });

    it('should handle invalid font string', () => {
      expect(parseFont('invalid')).toEqual({
        "font-family": 'invalid',
        "font-size": "",
        "line-height": "",
        "font-style": undefined,
        "font-variant": undefined,
        "font-weight": undefined,
      });
    });
  });
}); 