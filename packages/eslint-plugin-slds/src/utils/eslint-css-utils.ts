import { Rule } from 'eslint';

/**
 * Extracts the CSS property and value from an ESLint CSS AST node.
 * Simplified to follow standard ESLint CSS patterns.
 */
export function extractCssPropertyAndValue(node: any, sourceCode: Rule.RuleContext['sourceCode']) {
  const cssProperty = node.property?.toLowerCase() || '';
  
  // Primary: use range to slice source
  if (node.value?.range && sourceCode?.text) {
    const cssValue = sourceCode.text.slice(node.value.range[0], node.value.range[1]);
    return { cssProperty, cssValue };
  }
  
  // Fallback: basic token reconstruction
  if (node.value?.children) {
    const cssValue = node.value.children.map(child => {
      if (child.type === 'Dimension') return `${child.value}${child.unit || ''}`;
      if (child.type === 'Percentage') return `${child.value}%`;
      if (child.type === 'Hash') return `#${child.value}`;
      return child.value || child.name || '';
    }).join(' ');
    return { cssProperty, cssValue };
  }
  
  return { 
    cssProperty, 
    cssValue: node.value?.raw || String(node.value || '') 
  };
}

/**
 * Creates PostCSS-like declaration for shared handlers.
 * Simplified to focus on what actually works.
 */
export function adaptEslintDeclarationToPostcss(
  node: any, 
  cssValue: string, 
  sourceCode?: Rule.RuleContext['sourceCode']
): any {
  // Use the most reliable range source
  const valueRange = node.value?.range || 
                    [node.value?.loc?.start?.offset, node.value?.loc?.end?.offset] || 
                    [0, 0];
  
  return {
    ...node,
    type: 'decl',
    prop: node.property || node.prop,
    value: { value: cssValue, range: valueRange },
    important: node.important || false,
    raws: node.raws || {},
    parent: node.parent || null,
    source: node.source || null,
    variable: node.variable || false
  };
}

/**
 * Manual line/column calculation from text offset.
 * This approach works correctly for precise error locations.
 */
function getLocFromIndexManual(text: string, idx: number) {
  let line = 1, col = 0, i = 0;
  while (i < idx && i < text.length) {
    if (text[i] === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }
    i++;
  }
  return { line, column: col + 1 };
}

/**
 * Creates ESLint report function with precise location calculation.
 */
export function createEslintReportFnFromNode(
  context: Rule.RuleContext, 
  node: any, 
  sourceCode: Rule.RuleContext['sourceCode']
) {
  return (reportObj: any) => {
    const { index, endIndex } = reportObj;
    
    const preciseLoc = (typeof index === 'number' && typeof endIndex === 'number' && sourceCode?.text)
      ? (() => {
          // ESLint CSS uses .loc.start.offset instead of .range[0]
          const valueStartOffset = node.value?.loc?.start?.offset ?? 0;
          const absStart = valueStartOffset + index;
          const absEnd = valueStartOffset + endIndex;
          
          const startLoc = getLocFromIndexManual(sourceCode.text, absStart);
          const endLoc = getLocFromIndexManual(sourceCode.text, absEnd);
          
          return {
            start: startLoc,
            end: endLoc
          };
        })()
              : undefined;
    
    context.report({
      node,
      loc: preciseLoc || reportObj.loc || node.loc,
      message: String(reportObj.message),
      fix: reportObj.fix ? (fixer: any) => reportObj.fix(fixer, sourceCode) || null : null,
    });
  };
} 