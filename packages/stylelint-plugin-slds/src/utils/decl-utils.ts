import { Declaration } from "postcss";
import valueParser from "postcss-value-parser";

export function isVarFunction(node:valueParser.Node): boolean{
  return (node.type === "function" && node.value === "var" && node.nodes.length>0);
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