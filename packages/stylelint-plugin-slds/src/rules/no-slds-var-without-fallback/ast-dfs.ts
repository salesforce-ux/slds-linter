import { Declaration } from 'postcss';
import valueParser from 'postcss-value-parser';

// Interface for a var node in the AST
export interface VarNode {
  value: string;
  node: valueParser.FunctionNode;
  parent: valueParser.Node | null;
}

/**
 * Find all var() function nodes in a valueParser node
 */
export function findAllVarsInNode(
  node: valueParser.Node | valueParser.ParsedValue,
  callback: (node: valueParser.FunctionNode, parent: valueParser.Node | null) => boolean,
  parent: valueParser.Node | null = null
): void {
  if (node.type === 'function' && node.value === 'var') {
    const shouldContinue = callback(node as valueParser.FunctionNode, parent);
    if (!shouldContinue) {
      return;
    }
  }

  // Check if node has child nodes before traversing
  if ('nodes' in node && Array.isArray(node.nodes)) {
    node.nodes.forEach((childNode) => {
      findAllVarsInNode(childNode, callback, node);
    });
  }
}

/**
 * Find all var() functions in a declaration
 */
export function findAllVarNodes(decl: Declaration): VarNode[] {
  const result: VarNode[] = [];
  const parsedValue = valueParser(decl.value);

  // Start traversal with the root parsed value
  parsedValue.walk((node) => {
    if (node.type === 'function' && node.value === 'var') {
      result.push({
        value: valueParser.stringify(node),
        node: node as valueParser.FunctionNode,
        parent: null // We don't track parent in this simplified version
      });
    }
    return true; // Continue traversal
  });

  return result;
} 