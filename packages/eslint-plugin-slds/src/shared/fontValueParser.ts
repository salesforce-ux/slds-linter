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

export function parseFont(value: string): FontValue {
  let { fontFamily, fontSize, lineHeight, rest } = extractFontParts(value);
  let fontStyle = findKnownValue(rest, FONT_STYLES);
  let fontWeight = findKnownValue(rest, FONT_WEIGHTS);  
  let fontVariant = findKnownValue(rest, FONT_VARIANTS);
  if (!fontFamily && rest.length > 0) {
    fontFamily = rest.pop();
  }
  if (!fontSize && rest.length > 0) {
    fontSize = rest.pop();
  }
  if (!fontWeight && rest.length > 0) {
    fontWeight = rest.pop();
  }
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
  || (property === 'font-size');
} 