import { Rule } from 'eslint';

/**
 * Extracts the CSS property and value from an ESLint CSS AST node.
 */
export function extractCssPropertyAndValue(node: any, sourceCode: Rule.RuleContext['sourceCode']) {
  let cssProperty = node.property && node.property.toLowerCase();
  let cssValue = '';
  if (node.value && node.value.range) {
    cssValue = sourceCode.text.slice(node.value.range[0], node.value.range[1]);
  } else if (node.value && node.value.children && Array.isArray(node.value.children)) {
    cssValue = node.value.children.map(child => {
      if (child.type === 'Dimension' && child.value && child.unit) {
        return `${child.value}${child.unit}`;
      }
      if (child.type === 'Percentage' && child.value) {
        return `${child.value}%`;
      }
      if (child.type === 'Hash' && child.value) {
        return `#${child.value}`;
      }
      if (child.value && child.unit) {
        return `${child.value}${child.unit}`;
      }
      if (child.value) {
        return child.value;
      }
      if (child.name) {
        return child.name;
      }
      return '';
    }).join(' ');
  }
  return { cssProperty, cssValue };
}

/**
 * Maps value-relative indices to ESLint loc using the exact working logic from the rule.
 */
export function getLocFromValueIndex(sourceText: string, valueNode: any, index: number, endIndex: number) {
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
  const valueStartOffset = valueNode && valueNode.range ? valueNode.range[0] : 0;
  const absStart = valueStartOffset + (index ?? 0);
  const absEnd = valueStartOffset + (endIndex ?? 0);
  return {
    start: getLocFromIndexManual(sourceText, absStart),
    end: getLocFromIndexManual(sourceText, absEnd),
  };
}

/**
 * ESLint report function with exact working location logic, extracted as a utility.
 */
export function createEslintReportFnFromNode(context: any, node: any, sourceCode: any) {
  return (reportObj: any) => {
    const { index, endIndex } = reportObj;
    context.report({
      node,
      message: typeof reportObj.message === 'string' ? reportObj.message : JSON.stringify(reportObj.message),
      loc: (typeof index === 'number' && typeof endIndex === 'number')
        ? (() => {
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
            const valueStartOffset = node.value?.loc?.start?.offset ?? 0;
            const absStart = valueStartOffset + (index ?? 0);
            const absEnd = valueStartOffset + (endIndex ?? 0);
            const startLoc = getLocFromIndexManual(sourceCode.text, absStart);
            const endLoc = getLocFromIndexManual(sourceCode.text, absEnd);
            return {
              start: startLoc,
              end: endLoc
            };
          })()
        : undefined,
      fix: reportObj.fix
        ? (fixer: any) => {
            return reportObj.fix(fixer, sourceCode) || null;
          }
        : null,
    });
  };
} 