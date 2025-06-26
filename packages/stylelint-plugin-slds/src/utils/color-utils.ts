import valueParser from 'postcss-value-parser';
import { isValidColor } from './color-lib-utils';

const rgbColorFunctions = ['rgb', 'rgba', 'hsl', 'hsla'];

/**
 * Regex pattern for matching CSS functions.
 */
const cssFunctionsRegex =
  /^(?:attr|calc|color-mix|conic-gradient|counter|cubic-bezier|linear-gradient|max|min|radial-gradient|repeating-conic-gradient|repeating-linear-gradient|repeating-radial-gradient|var)$/;


export const isColorFunction = (value: string): boolean => {
  return rgbColorFunctions.includes(value);
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
        if (rgbColorFunctions.includes(node.value)) {
          node.value = valueParser.stringify(node);
          //@ts-ignore
          node.type = 'word';
          cb(node, index, nodes);
        } else if (cssFunctionsRegex.test(node.value)) {
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