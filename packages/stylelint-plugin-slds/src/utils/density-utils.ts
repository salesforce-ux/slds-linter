import valueParser from 'postcss-value-parser';
import { isFunctionNode } from './decl-utils';

export const ALLOWED_UNITS = ['px', 'em', 'rem', '%', 'ch'];

export function isDensifyValue(node: valueParser.Node, nonZeroOnly: boolean = true): boolean {
  
  const parsedValue = valueParser.unit(node.value);
  if (node.type !== 'word' || !parsedValue) {
    // Consider only node of type word and parsable by unit function
    return false;
  } else if (
    parsedValue.unit &&
    !ALLOWED_UNITS.includes(parsedValue.unit)
  ) {
    // If unit exists make sure its in allowed list
    return false;
  } else if (isNaN(Number(parsedValue.number))) {
    // Consider only valid numeric values
    return false;
  } else if (nonZeroOnly && Number(parsedValue.number) === 0) {
    // Do not report zero value
    return false;
  }
  return true;
}


export const forEachDensifyValue = (
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
      if (isFunctionNode(node)) {
        // Skip CSS functions as they often contain necessary hardcoded values
        // that are part of their syntax (e.g., calc(100% - 20px))
        return false;
      }
      if (isDensifyValue(node)) {
        cb(node, index, nodes);
      }
    }
  );
};

export function normalizeLengthValue(value: string | undefined): string {
  if (!value) return '';
  
  // Convert 0 to 0px for consistency
  if (value === '0') return '0px';
  
  // If it already has a unit, return as is
  if (/^-?\d+(\.\d+)?(px|em|rem|ch|ex|vh|vw|vmin|vmax|%)$/.test(value)) {
      return value;
  }
  
  // If it's a number without unit, assume px
  if (/^-?\d+(\.\d+)?$/.test(value)) {
      return value + 'px';
  }
  
  return value;
}