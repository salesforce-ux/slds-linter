import valueParser from 'postcss-value-parser';
import { isFunctionNode } from './decl-utils';

export const ALLOWED_UNITS = ['px', 'em', 'rem', '%', 'ch'];

export function getFullValueFromNode(node: valueParser.Node): string {
  if (!node) return '';
  const type = (node as any).type;
  if (type === 'word' || type === 'string') {
    // If the value is a number followed by a unit (e.g., '20rem', '50%'), return as-is
    if (/^-?\d*\.?\d+(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)?$/.test(node.value)) {
      return node.value;
    }
    return node.value;
  }
  if (type.toLowerCase() === 'percentage') {
    // Only append % if not zero
    return (node as any).value === '0' || /^0+(\.0+)?$/.test((node as any).value) ? (node as any).value : (node as any).value + '%';
  }
  if (type.toLowerCase() === 'dimension') {
    // Only append unit if not zero
    return (node as any).value === '0' || /^0+(\.0+)?$/.test((node as any).value) ? (node as any).value : (node as any).value + ((node as any).unit || '');
  }
  return node.value;
}

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
  
  // If the value is exactly zero (0, 0.0, 0.00, etc.), return as-is (no unit)
  if (/^0+(\.0+)?$/.test(value)) return value;
  
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