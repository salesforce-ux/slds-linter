import { Declaration } from "postcss";
import valueParser from "postcss-value-parser";

/**
 * Regex pattern for matching CSS functions.
 */
const cssFunctionsRegex =
  /^(?:attr|calc|color-mix|conic-gradient|counter|cubic-bezier|linear-gradient|max|min|radial-gradient|repeating-conic-gradient|repeating-linear-gradient|repeating-radial-gradient|var)$/;

const cssMathFunctionsRegex = /^(?:calc|min|max)$/;

export function isFunctionNode(node: valueParser.Node): boolean {
  return node.type === 'function' && cssFunctionsRegex.test(node.value);
}

export function isVarFunction(node:valueParser.Node): boolean{
  return (node.type === "function" && node.value === "var" && node.nodes.length>0);
}

export function isMathFunction(node: valueParser.Node): boolean {
  return node.type === 'function' && cssMathFunctionsRegex.test(node.value);
}

export function getVarToken(node: valueParser.Node): string {
  return isVarFunction(node)? (<valueParser.FunctionNode>node).nodes[0].value: '';
}

export function forEachVarFunction(decl:Declaration, callback: (node: valueParser.Node, startOffset: number) => void, shallow: boolean = true) {
    const startOffset = decl.toString().indexOf(decl.value);
    const parsedValue = valueParser(decl.value);
    parsedValue.walk((node) => {
      if (isVarFunction(node)) {
        callback(node, startOffset);
        return !shallow;
      }
    });
  }

export function isSpaceDivision(node: valueParser.Node): boolean {
  return node.type === 'space';
}

export function isCommaDivision(node: valueParser.Node): boolean {
  return node.type === 'div' && node.value === ',';
}

export function isInsetKeyword(node: valueParser.Node): boolean {
  return node.type === 'word' && node.value === 'inset';
}