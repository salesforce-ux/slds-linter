import valueParser from 'postcss-value-parser';
import { isValidColor } from './colorLibUtils';
import { isCssColorFunction, isCssFunction } from './cssFunctions';

export const isColorFunction = (value: string): boolean => {
  return isCssColorFunction(value);
}

export const forEachColorValue = (
  parsedValue: valueParser.ParsedValue,
  cb: valueParser.WalkCallback
) => {
  parsedValue.walk(
    (node: valueParser.Node, index: number, nodes: valueParser.Node[]) => {
      if (node.type === 'function') {
        if (isCssColorFunction(node.value)) {
          node.value = valueParser.stringify(node);
          //@ts-ignore
          node.type = 'word';
          cb(node, index, nodes);
        } else if (isCssFunction(node.value)) {
          return false;
        }
      } else if (node.type === 'word' && isValidColor(node.value)) {
        cb(node, index, nodes);
      }
      return true;
    }
  );
}; 