import { Declaration } from "postcss";
import valueParser from "postcss-value-parser";
import { isCssFunction, isCssMathFunction } from './css-functions';

export function isFunctionNode(node: valueParser.Node): boolean {
  return node.type === 'function' && isCssFunction(node.value);
}

export function isVarFunction(node:valueParser.Node): boolean{
  return (node.type === "function" && node.value === "var" && node.nodes.length>0);
}

export function isMathFunction(node: valueParser.Node): boolean {
  return node.type === 'function' && isCssMathFunction(node.value);
}

export function getVarToken(node: valueParser.Node): string {
  return isVarFunction(node)? (<valueParser.FunctionNode>node).nodes[0].value: '';
}

export function getFallbackFunction(node: valueParser.FunctionNode): valueParser.FunctionNode {
  return node.nodes.find(isVarFunction) as valueParser.FunctionNode;
}

export function getFallbackToken(node: valueParser.FunctionNode): string {
  const fallbackFunction = getFallbackFunction(node);
  return fallbackFunction? getVarToken(fallbackFunction): '';
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

// This function iterates over the immediate node (descendent nodes are not considered) to find the var function node with the given value
export function getVarFunctionNode(decl:Declaration, nodeValue:string): valueParser.FunctionNode{
  const parsedValue = valueParser(decl.value);
  return <valueParser.FunctionNode>parsedValue.nodes.find(node=>(isVarFunction(node) && valueParser.stringify(node) === nodeValue));
}

export function isTokenFunction(node:valueParser.Node): boolean{
  return (node.type === "function" && (node.value === "token" || node.value === "t") && node.nodes.length>0);
}

export function getTokenFunctionNode(decl:Declaration, nodeValue:string): valueParser.FunctionNode{
  const parsedValue = valueParser(decl.value);
  return <valueParser.FunctionNode>parsedValue.nodes.find(node=>(isTokenFunction(node) && valueParser.stringify(node) === nodeValue));
}

export function forEachTokenFunction(decl:Declaration, callback: (node: valueParser.Node, startOffset: number) => void, shallow: boolean = true) {
  const startOffset = decl.toString().indexOf(decl.value);
  const parsedValue = valueParser(decl.value);
  parsedValue.walk((node) => {
    if(isVarFunction(node)){
      // Do not look for token functions inside var functions
      return !shallow;
    }
    if (isTokenFunction(node)) {
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