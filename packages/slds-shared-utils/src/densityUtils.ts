import valueParser from 'postcss-value-parser';
import { isFunctionNode } from './declUtils';

export const ALLOWED_UNITS = ['px', 'em', 'rem', '%', 'ch'];

export function isDensifyValue(node: valueParser.Node, nonZeroOnly: boolean = true): boolean {
  const parsedValue = valueParser.unit(node.value);
  if (node.type !== 'word' || !parsedValue) {
    return false;
  } else if (
    parsedValue.unit &&
    !ALLOWED_UNITS.includes(parsedValue.unit)
  ) {
    return false;
  } else if (isNaN(Number(parsedValue.number))) {
    return false;
  } else if (nonZeroOnly && Number(parsedValue.number) === 0) {
    return false;
  }
  return true;
}

export const forEachDensifyValue = (
  parsedValue: valueParser.ParsedValue,
  cb: valueParser.WalkCallback
) => {
  parsedValue.walk(
    (node: valueParser.Node, index: number, nodes: valueParser.Node[]) => {
      if (isFunctionNode(node)) {
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