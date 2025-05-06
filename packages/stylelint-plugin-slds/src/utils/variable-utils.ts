import valueParser from 'postcss-value-parser';

/**
 * Parse a var() function string and extract the variable name and fallback
 */
export function parseVarFunction(varFunction: string): { cssVar: string; fallbackValue?: string } {
  const parsed = valueParser(varFunction);
  let cssVar = '';
  let fallbackValue: string | undefined;

  parsed.walk((node) => {
    if (node.type === 'function' && node.value === 'var') {
      // The first argument is the CSS variable name
      if (node.nodes.length > 0) {
        cssVar = node.nodes[0].value;
      }

      // If there's a comma, everything after it is the fallback value
      if (node.nodes.length > 2 && node.nodes[1].type === 'div' && node.nodes[1].value === ',') {
        const fallbackNodes = node.nodes.slice(2);
        fallbackValue = valueParser.stringify(fallbackNodes);
      }

      return false; // Stop after finding the first var() function
    }
    return true;
  });

  return { cssVar, fallbackValue };
}

/**
 * Check if a CSS variable name starts with --slds-
 */
export function isSldsCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--slds-');
} 