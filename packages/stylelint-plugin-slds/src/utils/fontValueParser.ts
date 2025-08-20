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

export interface FontValue {
  'font-family'?: string;
  'font-size'?: string;
  'line-height'?: string;
  'font-style'?: string;
  'font-weight'?: string;
  'font-variant'?: string;
}

function isKnownValue(value: string, knownValues: string[]): boolean {
  return knownValues.includes(value.toLowerCase());
}

export function isKnownFontWeight(value: string): boolean {
  return isKnownValue(value, FONT_WEIGHTS);
}

function findKnownValue(parts: string[], knownValues: string[]): string | undefined {
  const index = parts.findIndex(part => isKnownValue(part, knownValues));
  if (index !== -1) {
    const value = parts[index];
    parts.splice(index, 1);
    return value.toLowerCase();
  }
  return undefined;
}


/**
 * Parses a CSS font shorthand string into structured parts for analysis.
 * 
 * This function extracts the main components of a font shorthand declaration:
 * - fontFamily: Everything after the first comma (handles quoted names, multiple families)
 * - fontSize: The font size value (before any slash)
 * - lineHeight: The line height value (after slash, if present)
 * - rest: Remaining parts that could be font-style, font-weight, font-variant, or CSS variables
 * 
 * Handles complex cases including:
 * - Quoted font family names (e.g., "Times New Roman")
 * - Multiple font families separated by commas
 * - CSS variables (var(--font-size))
 * - Font-size/line-height shorthand (e.g., '16px/24px')
 * - Nested CSS variables and fallbacks
 * 
 * @param fontString The CSS font shorthand string to parse (e.g., 'bold 12px/1.5 "Arial", sans-serif')
 * @returns Object containing { fontFamily, fontSize, lineHeight, rest } where rest is an array of remaining parts
 */
function extractFontParts(fontString: string) {
  const parsed = valueParser(fontString);

  let parts: valueParser.Node[] = parsed.nodes.filter((node) => node.type !== "space");
  let fontFamily = "";
  let fontSize = "";
  let lineHeight = "";


  const commaIndex = parts.findIndex(
    (node) => node.type === "div" && node.value === ","
  );
  if (commaIndex !== -1) {
    const firstNonSpaceIndex = commaIndex - 1;
    fontFamily = valueParser.stringify(parts.slice(firstNonSpaceIndex));
    parts = parts.slice(0, firstNonSpaceIndex);
  }

  const divisionIndex = parts.findIndex(
    (node) => node.type === "div" && node.value === "/"
  );
  if (divisionIndex !== -1) {
    fontSize = valueParser.stringify(parts[divisionIndex - 1]);
    lineHeight = valueParser.stringify(parts[divisionIndex + 1]);
    parts.splice(divisionIndex - 1, 3);
  }

  return {
    fontFamily,
    fontSize,
    lineHeight,
    rest: parts.map((node) => {
      return (node.type !== "word") ? valueParser.stringify(node) : node.value;
    })
  };
}

/**
 * Parses a font shorthand value into an object with individual font properties
 * @param value - The font shorthand value to parse
 * @returns Object containing parsed font properties
 */
export function parseFont(value: string): FontValue {
  let { fontFamily, fontSize, lineHeight, rest } = extractFontParts(value);

  // Find all known fixed string values
  let fontStyle = findKnownValue(rest, FONT_STYLES);
  let fontWeight = findKnownValue(rest, FONT_WEIGHTS);  
  let fontVariant = findKnownValue(rest, FONT_VARIANTS);

  // Anything after this line is best effort may not be correct


  /* treat font string as following order:
      font-style font-weight font-size font-family
      https://developer.mozilla.org/en-US/docs/Web/CSS/font
       - font-family must be the last value specified.
      - font-style, font-variant and font-weight must precede font-size.
  */
  if (!fontFamily && rest.length > 0) {
    fontFamily = rest.pop();
  }
  if (!fontSize && rest.length > 0) {
    fontSize = rest.pop();
  }

  if (!fontWeight && rest.length > 0) {
    fontWeight = rest.pop();
  }

  // If there are more than 1 rest value, then the last value is font-variant
  if (rest.length > 1 && !fontVariant) {
    fontVariant = rest.pop();
  }
  if (rest.length > 0 && !fontStyle) {
    fontStyle = rest.pop();
  }

  return {
    'font-family': fontFamily,
    'font-size': fontSize,
    'line-height': lineHeight,
    'font-style': fontStyle,
    'font-variant': fontVariant,
    'font-weight': fontWeight,
  };
}

export function isFontProperty(property: string, value: string): boolean {
  return property === 'font' 
    || (property === 'font-weight' && isKnownFontWeight(value))
    || property === 'font-size'
    || property === 'line-height';
}