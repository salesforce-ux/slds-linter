import valueParser from 'postcss-value-parser';

const FONT_STYLES = ['normal', 'italic', 'oblique'];
const FONT_VARIANTS = ['normal', 'small-caps'];
const FONT_WEIGHTS = [
  'normal',
  'bold',
  'bolder',
  'lighter',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
];

interface FontValue {
  fontFamily?: string[];
  fontSize?: string;
  lineHeight?: string;
  fontStyle?: string;
  fontWeight?: string;
  fontVariant?: string;
}

/**
 * Parses a font-family string into an array of font families
 * @param value - The font-family string to parse
 * @returns Array of font family names
 */
export function parseFontFamily(value: string): string[] {
  const parsed = valueParser(value);
  const families: string[] = [];
  let currentFamily = '';

  parsed.nodes.forEach((node) => {
    if (node.type === 'string') {
      // Remove quotes from string values
      currentFamily = node.value.replace(/['"]/g, '');
    } else if (node.type === 'word') {
      currentFamily = node.value;
    } else if (node.type === 'div' && node.value === ',') {
      if (currentFamily) {
        families.push(currentFamily.trim());
        currentFamily = '';
      }
    }
  });

  // Add the last family if exists
  if (currentFamily) {
    families.push(currentFamily.trim());
  }

  return families;
}

function splitFontParts(value: string): string[] {
  const parsed = valueParser(value);
  const parts: string[] = [];
  let currentPart = '';

  parsed.nodes.forEach((node) => {
    if (node.type === 'div' && node.value === '/') {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = '';
      }
    } else if (node.type === 'space') {
      if (currentPart) {
        parts.push(currentPart.trim());
        currentPart = '';
      }
    } else {
      currentPart += node.value;
    }
  });

  if (currentPart) {
    parts.push(currentPart.trim());
  }

  return parts;
}

function parseFontSizeAndLineHeight(parts: string[]): { fontSize?: string; lineHeight?: string; remainingParts: string[] } {
  const result: { fontSize?: string; lineHeight?: string; remainingParts: string[] } = { remainingParts: [...parts] };
  const slashIndex = parts.findIndex(part => part.includes('/'));

  if (slashIndex !== -1) {
    const [size, lineHeight] = parts[slashIndex].split('/');
    result.fontSize = size.trim();
    result.lineHeight = lineHeight.trim();
    result.remainingParts.splice(slashIndex, 1);
  } else if (parts.length > 0) {
    result.fontSize = parts.pop()?.trim();
  }

  return result;
}

function parseFontStyle(parts: string[]): { fontStyle?: string; remainingParts: string[] } {
  const result: { fontStyle?: string; remainingParts: string[] } = { remainingParts: [...parts] };
  const style = parts[0]?.toLowerCase();

  if (FONT_STYLES.includes(style)) {
    result.fontStyle = style;
    result.remainingParts.shift();
  }

  return result;
}

function parseFontVariant(parts: string[]): { fontVariant?: string; remainingParts: string[] } {
  const result: { fontVariant?: string; remainingParts: string[] } = { remainingParts: [...parts] };
  const variant = parts[0]?.toLowerCase();

  if (FONT_VARIANTS.includes(variant)) {
    result.fontVariant = variant;
    result.remainingParts.shift();
  }

  return result;
}

function parseFontWeight(parts: string[]): { fontWeight?: string; remainingParts: string[] } {
  const result: { fontWeight?: string; remainingParts: string[] } = { remainingParts: [...parts] };
  const weight = parts[0]?.toLowerCase();

  if (FONT_WEIGHTS.includes(weight)) {
    result.fontWeight = weight;
    result.remainingParts.shift();
  }

  return result;
}

/**
 * Parses a font shorthand value into an object with individual font properties
 * @param value - The font shorthand value to parse
 * @returns Object containing parsed font properties
 */
export function parseFont(value: string): FontValue {
  const parts = splitFontParts(value);
  if (parts.length === 0) return {};

  const result: FontValue = {};
  const fontFamilyPart = parts.pop() || '';
  result.fontFamily = parseFontFamily(fontFamilyPart);

  const { fontSize, lineHeight, remainingParts: sizeParts } = parseFontSizeAndLineHeight(parts);
  if (fontSize) result.fontSize = fontSize;
  if (lineHeight) result.lineHeight = lineHeight;

  const { fontStyle, remainingParts: styleParts } = parseFontStyle(sizeParts);
  if (fontStyle) result.fontStyle = fontStyle;

  const { fontVariant, remainingParts: variantParts } = parseFontVariant(styleParts);
  if (fontVariant) result.fontVariant = fontVariant;

  const { fontWeight } = parseFontWeight(variantParts);
  if (fontWeight) result.fontWeight = fontWeight;

  return result;
} 