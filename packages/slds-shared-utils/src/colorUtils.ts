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
  /**
   * Using valueParser.walk() without the bubble parameter (defaults to false),
   * which means returning false in the callback prevents traversal of descendant nodes.
   * See: https://www.npmjs.com/package/postcss-value-parser#valueparserwalknodes-callback-bubble
   */
  parsedValue.walk(
    (node: valueParser.Node, index: number, nodes: valueParser.Node[]) => {
      if (node.type === 'function') {
        if (isCssColorFunction(node.value)) {
          node.value = valueParser.stringify(node);
          //@ts-ignore
          node.type = 'word';
          cb(node, index, nodes);
        } else if (isCssFunction(node.value)) {
          // Skip CSS functions as they often contain necessary hardcoded values
          // that are part of their syntax (e.g., linear-gradient(45deg, #fff, #000))
          return false;
        }
      } else if (node.type === 'word' && isValidColor(node.value)) {
        cb(node, index, nodes);
      }
      return true;
    }
  );
}; 