// Utility to convert line/column to absolute offset in text
/**
 * Convert 1-based line/column to absolute offset in a string.
 * @param text The full source text
 * @param line 1-based line number
 * @param column 1-based column number
 * @returns Absolute offset (0-based), or -1 if not found
 */
function getOffsetFromLineCol(text, line, column) {
  let currentLine = 1;
  let currentCol = 0;
  for (let i = 0; i < text.length; i++) {
    if (currentLine === line && currentCol + 1 === column) {
      return i;
    }
    if (text[i] === '\n') {
      currentLine++;
      currentCol = 0;
    } else {
      currentCol++;
    }
  }
  return -1;
}

/**
 * Adapter utility: ESLint CSS AST node -> stylelint/PostCSS Declaration
 * Handles robust value range calculation for autofix.
 */
export function adaptEslintDeclarationToPostcss(node: any, cssValue: string, valueRange?: [number, number], sourceCode?: any) {
  let finalValueRange: [number, number] = [0, 0];
  // Try to use offset from loc if available (ESLint v9 CSS AST)
  if (
    node.value &&
    node.value.loc &&
    typeof node.value.loc.start?.offset === 'number' &&
    typeof node.value.loc.end?.offset === 'number'
  ) {
    finalValueRange = [
      node.value.loc.start.offset,
      node.value.loc.end.offset
    ];
  } else if (
    node.value &&
    node.value.loc &&
    typeof node.value.loc.start?.line === 'number' &&
    typeof node.value.loc.start?.column === 'number' &&
    typeof node.value.loc.end?.line === 'number' &&
    typeof node.value.loc.end?.column === 'number' &&
    sourceCode && typeof sourceCode.text === 'string'
  ) {
    // Compute offset from line/column if offset is not available
    const startOffset = getOffsetFromLineCol(
      sourceCode.text,
      node.value.loc.start.line,
      node.value.loc.start.column
    );
    const endOffset = getOffsetFromLineCol(
      sourceCode.text,
      node.value.loc.end.line,
      node.value.loc.end.column
    );
    if (startOffset !== -1 && endOffset !== -1) {
      finalValueRange = [startOffset, endOffset];
    }
  } else if (valueRange && Array.isArray(valueRange) && valueRange.length === 2) {
    finalValueRange = valueRange;
  } else if (node.value && node.value.range) {
    finalValueRange = node.value.range;
  } else if (node.range && typeof node.range[0] === 'number' && typeof node.range[1] === 'number' && sourceCode && typeof sourceCode.text === 'string') {
    // Try to compute the value's range within the declaration
    const declText = sourceCode.text.slice(node.range[0], node.range[1]);
    const valueIndex = declText.indexOf(cssValue);
    if (valueIndex !== -1) {
      finalValueRange = [
        node.range[0] + valueIndex,
        node.range[0] + valueIndex + cssValue.length
      ];
    } else {
      finalValueRange = node.range; // fallback
    }
  } else if (node.range) {
    finalValueRange = node.range;
  }
  return {
    ...node,
    type: 'decl',
    prop: node.property || node.prop,
    value: {
      value: cssValue,
      range: finalValueRange
    },
    important: node.important || false,
    raws: node.raws || {},
    parent: node.parent || null,
    source: node.source || null,
    variable: node.variable || false
    // Add more mappings as needed for stylelint compatibility
  };
} 