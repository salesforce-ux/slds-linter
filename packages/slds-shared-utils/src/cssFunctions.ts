/**
 * Complete list of CSS functions that should be preserved/recognized
 */
const CSS_FUNCTIONS = [
  'attr',
  'calc',
  'color-mix',
  'conic-gradient',
  'counter',
  'cubic-bezier',
  'linear-gradient',
  'max',
  'min',
  'radial-gradient',
  'repeating-conic-gradient',
  'repeating-linear-gradient',
  'repeating-radial-gradient',
  'var'
];

const CSS_MATH_FUNCTIONS = ['calc', 'min', 'max'];

const RGB_COLOR_FUNCTIONS = ['rgb', 'rgba', 'hsl', 'hsla'];

/**
 * Regex for matching any CSS function (for general detection)
 * Matches function names within other text
 */
const cssFunctionsRegex = new RegExp(`(?:${CSS_FUNCTIONS.join('|')})`);

const cssFunctionsExactRegex = new RegExp(`^(?:${CSS_FUNCTIONS.join('|')})$`);

const cssMathFunctionsRegex = new RegExp(`^(?:${CSS_MATH_FUNCTIONS.join('|')})$`);

export function containsCssFunction(value: string): boolean {
  return cssFunctionsRegex.test(value);
}

/**
 * Check if a value is exactly a CSS function name
 */
export function isCssFunction(value: string): boolean {
  return cssFunctionsExactRegex.test(value);
}

export function isCssMathFunction(value: string): boolean {
  return cssMathFunctionsRegex.test(value);
}

export function isCssColorFunction(value: string): boolean {
  return RGB_COLOR_FUNCTIONS.includes(value);
} 