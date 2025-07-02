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
  // @ts-ignore: 'percentage' and 'dimension' are valid runtime types
  if (node.type === 'word' || node.type === 'percentage' || node.type === 'dimension') {
    const parsedValue = valueParser.unit((node as any).value);
    if (parsedValue && parsedValue.unit && !ALLOWED_UNITS.includes(parsedValue.unit)) {
      return false;
    }
    if (isNaN(Number(parsedValue ? parsedValue.number : (node as any).value))) {
      return false;
    }
    if (nonZeroOnly && Number(parsedValue ? parsedValue.number : (node as any).value) === 0) {
      return false;
    }
    return true;
  }
  return false;
}

export function forEachDensifyValue(parsedValue: valueParser.ParsedValue, cb: (node: valueParser.Node) => void) {
  const nodes = parsedValue.nodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const type = (node as any).type;
    if (type === 'word' || type === 'string' || type.toLowerCase() === 'percentage' || type.toLowerCase() === 'dimension') {
      cb(node);
    }
  }
}

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