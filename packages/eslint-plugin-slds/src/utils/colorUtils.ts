import valueParser from 'postcss-value-parser';
import { isValidColor } from './colorLibUtils';

const rgbColorFunctions = ['rgb', 'rgba', 'hsl', 'hsla'];

export const isColorFunction = (value: string): boolean => {
  return rgbColorFunctions.includes(value);
}

export const forEachColorValue = (
  parsedValue: valueParser.ParsedValue,
  cb: valueParser.WalkCallback
) => {
  parsedValue.walk(
    (node: valueParser.Node, index: number, nodes: valueParser.Node[]) => {
      if (node.type === 'function') {
        if (rgbColorFunctions.includes(node.value)) {
          node.value = valueParser.stringify(node);
          //@ts-ignore
          node.type = 'word';
          cb(node, index, nodes);
        } else if (/^(?:attr|calc|color-mix|conic-gradient|counter|cubic-bezier|linear-gradient|max|min|radial-gradient|repeating-conic-gradient|repeating-linear-gradient|repeating-radial-gradient|var)$/.test(node.value)) {
          return false;
        }
      } else if (node.type === 'word' && isValidColor(node.value)) {
        cb(node, index, nodes);
      }
      return true;
    }
  );
}; 