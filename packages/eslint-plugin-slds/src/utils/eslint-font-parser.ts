/**
 * ESLint CSS Font Parser Utilities
 * 
 * Provides robust font parsing using ESLint v9 CSS native capabilities.
 * More robust than legacy parseFont - handles CSS variables, quotes, complex syntax.
 */

/**
 * Font properties extracted from shorthand
 */
export interface ParsedFontProperties {
  'font-size'?: string;
  'font-weight'?: string;
  'font-style'?: string;
  'font-variant'?: string;
  'font-family'?: string;
  'line-height'?: string;
}

/**
 * Enhanced font parser using ESLint CSS v9 native capabilities
 * More robust than legacy parseFont - handles CSS variables, quotes, complex syntax
 */
export function parseESLintCSSFont(node: any): ParsedFontProperties {
  const result: ParsedFontProperties = {};
  
  if (!node.value || !node.value.children) {
    return result;
  }

  const children = node.value.children;
  const tokens: string[] = [];
  
  // Extract all meaningful tokens from ESLint CSS AST
  for (const child of children) {
    switch (child.type) {
      case 'Identifier':
        tokens.push(child.name);
        break;
      case 'String':
        tokens.push(child.value);
        break;
      case 'Dimension':
        tokens.push(`${child.value}${child.unit}`);
        break;
      case 'Number':
        tokens.push(child.value.toString());
        break;
      case 'Percentage':
        tokens.push(`${child.value}%`);
        break;
      case 'Function':
        // Handle CSS functions like var(), calc(), etc.
        if (child.name === 'var') {
          const varValue = extractVariableName(child);
          if (varValue) tokens.push(varValue);
        }
        break;
      case 'Operator':
        if (child.value === '/') {
          // Handle font-size/line-height notation
          const nextToken = getNextMeaningfulToken(children, children.indexOf(child));
          if (nextToken) {
            result['line-height'] = nextToken;
          }
        }
        break;
    }
  }

  // Parse tokens using CSS font shorthand specification order
  return parseTokensIntoFontProperties(tokens);
}

/**
 * Extract variable name from CSS var() function
 */
function extractVariableName(funcNode: any): string | null {
  if (funcNode.children && funcNode.children.length > 0) {
    const firstChild = funcNode.children[0];
    if (firstChild.type === 'Identifier') {
      return `var(${firstChild.name})`;
    }
  }
  return null;
}

/**
 * Get next meaningful token after operator
 */
function getNextMeaningfulToken(children: any[], currentIndex: number): string | null {
  for (let i = currentIndex + 1; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'Dimension') {
      return `${child.value}${child.unit}`;
    }
    if (child.type === 'Number') {
      return child.value.toString();
    }
    if (child.type === 'Identifier') {
      return child.name;
    }
  }
  return null;
}

/**
 * Parse tokens into font properties following CSS specification
 * More robust than legacy parser - handles edge cases and invalid syntax gracefully
 */
function parseTokensIntoFontProperties(tokens: string[]): ParsedFontProperties {
  const result: ParsedFontProperties = {};
  const remaining = [...tokens];
  
  // CSS font shorthand order: font-style font-variant font-weight font-size/line-height font-family
  
  // Extract font-family (everything after last size-like token)
  const sizeIndex = findLastSizeToken(remaining);
  if (sizeIndex !== -1 && sizeIndex < remaining.length - 1) {
    result['font-family'] = remaining.slice(sizeIndex + 1).join(' ');
    remaining.splice(sizeIndex + 1); // Remove font-family tokens
  }
  
  // Extract font-size (required property)
  if (sizeIndex !== -1) {
    result['font-size'] = remaining[sizeIndex];
    remaining.splice(sizeIndex, 1);
  }
  
  // Extract font-weight (look for weight keywords or numbers)
  const weightIndex = remaining.findIndex(isWeightToken);
  if (weightIndex !== -1) {
    result['font-weight'] = remaining[weightIndex];
    remaining.splice(weightIndex, 1);
  }
  
  // Extract font-style
  const styleIndex = remaining.findIndex(isStyleToken);
  if (styleIndex !== -1) {
    result['font-style'] = remaining[styleIndex];
    remaining.splice(styleIndex, 1);
  }
  
  // Extract font-variant
  const variantIndex = remaining.findIndex(isVariantToken);
  if (variantIndex !== -1) {
    result['font-variant'] = remaining[variantIndex];
  }
  
  return result;
}

/**
 * Find the last token that looks like a font-size
 */
function findLastSizeToken(tokens: string[]): number {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (isSizeToken(tokens[i])) {
      return i;
    }
  }
  return -1;
}

/**
 * Check if token is a font-size value
 */
function isSizeToken(token: string): boolean {
  return /^[\d.]+(?:px|em|rem|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|%)$/.test(token) ||
         /^[\d.]+$/.test(token) ||
         ['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'larger', 'smaller'].includes(token);
}

/**
 * Check if token is a font-weight value
 */
function isWeightToken(token: string): boolean {
  return ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'].includes(token) ||
         /^[1-9]\d{2}$/.test(token); // Support 100-900 range
}

/**
 * Check if token is a font-style value
 */
function isStyleToken(token: string): boolean {
  return ['normal', 'italic', 'oblique'].includes(token);
}

/**
 * Check if token is a font-variant value
 */
function isVariantToken(token: string): boolean {
  return ['normal', 'small-caps'].includes(token);
} 