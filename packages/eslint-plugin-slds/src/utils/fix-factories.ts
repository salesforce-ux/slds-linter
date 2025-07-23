/**
 * Fix factory utilities for ESLint CSS value replacement
 */

// Helper to robustly get the range for fixer.replaceTextRange
export function getNodeRange(node: any, declValueRange: [number, number]): [number, number] {
  if (
    typeof node?.sourceIndex === 'number' &&
    typeof node?.sourceEndIndex === 'number' &&
    node.sourceEndIndex > node.sourceIndex
  ) {
    const start = declValueRange[0] + node.sourceIndex;
    const end = declValueRange[0] + node.sourceEndIndex;
    // Defensive: ensure start < end and within declValueRange
    if (start >= declValueRange[0] && end <= declValueRange[1] && start < end) {
      return [start, end];
    }
  }
  // Fallback to the full value range
  return declValueRange;
}

/**
 * Creates a fix factory for replacing CSS values with SLDS hooks
 */
export function createCSSValueFixFactory(
  decl: any, 
  node: any, 
  replacementValue: string
): () => any {
  return () => (fixer: any, sourceCode: any) => {
    const range = getNodeRange(node, decl.value.range);
    if (!Array.isArray(range) || range.length !== 2 || range[0] === range[1]) {
      return null;
    }
    return fixer.replaceTextRange(range, replacementValue);
  };
}

/**
 * Creates a simple fix factory for full value replacement
 */
export function createFullValueFixFactory(
  decl: any, 
  replacementValue: string
): () => any {
  return () => (fixer: any, sourceCode: any) => {
    const range = decl.value.range;
    if (!Array.isArray(range) || range.length !== 2 || range[0] === range[1]) {
      return null;
    }
    return fixer.replaceTextRange(range, replacementValue);
  };
} 