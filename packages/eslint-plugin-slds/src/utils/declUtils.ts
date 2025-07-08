import valueParser from 'postcss-value-parser';

export function isFunctionNode(node: valueParser.Node): boolean {
  return node.type === 'function';
}

export function isCommaDivision(node: valueParser.Node): boolean {
  return node.type === 'div' && node.value === ',';
}

export function isSpaceDivision(node: valueParser.Node): boolean {
  return node.type === 'space';
}

export function isInsetKeyword(node: valueParser.Node): boolean {
  return node.type === 'word' && node.value === 'inset';
}

export function getVarToken(node: valueParser.Node): string {
  if (node.type === 'function' && node.value === 'var' && node.nodes.length > 0) {
    return node.nodes[0].value;
  }
  return '';
}

export function isMathFunction(node: valueParser.Node): boolean {
  return node.type === 'function' && ['calc', 'min', 'max', 'clamp'].includes(node.value);
} 