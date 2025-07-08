import valueParser from 'postcss-value-parser';
import { isFunctionNode } from './declUtils';

export const ALLOWED_UNITS = ['px', 'em', 'rem', '%', 'ch'];

export function getFullValueFromNode(node: valueParser.Node): string {
  if (!node) return '';
  const type = (node as any).type;
  if (type === 'word' || type === 'string') {
    if (/^-?\d*\.?\d+(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)?$/.test(node.value)) {
      return node.value;
    }
    return node.value;
  }
  if (type.toLowerCase() === 'percentage') {
    return (node as any).value === '0' || /^0+(\.0+)?$/.test((node as any).value) ? (node as any).value : (node as any).value + '%';
  }
  if (type.toLowerCase() === 'dimension') {
    return (node as any).value === '0' || /^0+(\.0+)?$/.test((node as any).value) ? (node as any).value : (node as any).value + ((node as any).unit || '');
  }
  return node.value;
}

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
  if (/^0+(\.0+)?$/.test(value)) return value;
  if (/^-?\d+(\.\d+)?(px|em|rem|ch|ex|vh|vw|vmin|vmax|%)$/.test(value)) {
      return value;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
      return value + 'px';
  }
  return value;
} 