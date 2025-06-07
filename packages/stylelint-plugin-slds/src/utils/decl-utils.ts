import { Declaration } from "postcss";
import valueParser from "postcss-value-parser";

export function forEachVarFunction(decl:Declaration, callback: (node: valueParser.Node, startOffset: number) => void, shallow: boolean = true) {
    const startOffset = decl.toString().indexOf(decl.value);
    const parsedValue = valueParser(decl.value);
    parsedValue.walk((node) => {
      if (node.type === 'function' && node.value === 'var') {
        callback(node, startOffset);
        return !shallow;
      }
    });
  }