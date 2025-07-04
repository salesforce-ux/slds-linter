// Adapter utility: ESLint CSS AST node -> stylelint/PostCSS Declaration
export function adaptEslintDeclarationToPostcss(node: any, cssValue: string) {
  return {
    ...node,
    type: 'decl',
    prop: node.property || node.prop,
    value: cssValue,
    important: node.important || false,
    raws: node.raws || {},
    parent: node.parent || null,
    source: node.source || null,
    variable: node.variable || false
    // Add more mappings as needed for stylelint compatibility
  };
} 