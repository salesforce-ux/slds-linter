import { parse, walk } from '@eslint/css-tree';
import type { HandlerContext } from '../types';

/**
 * Common replacement data structure used by both color and density handlers
 */
export interface ReplacementInfo {
  start: number;
  end: number;
  replacement: string;        // Full CSS var: var(--hook, fallback)
  displayValue: string;       // Just the hook: --hook
  hasHook: boolean;
}

/**
 * Position information from CSS tree parsing
 */
export interface PositionInfo {
  start?: { column: number };
  end?: { column: number };
}

/**
 * Generic callback for processing values with position information
 */
export type ValueCallback<T> = (value: T, positionInfo?: PositionInfo) => void;

/**
 * Generic shorthand auto-fix handler
 * Handles the common logic for reconstructing shorthand values with replacements
 */
export function handleShorthandAutoFix(
  declarationNode: any,
  context: HandlerContext,
  valueText: string,
  replacements: ReplacementInfo[]
) {
  // Sort replacements by position for proper reconstruction
  const sortedReplacements = replacements.sort((a, b) => a.start - b.start);
  
  // Check if we can apply auto-fix (at least one value has a hook)
  const hasAnyHooks = sortedReplacements.some(r => r.hasHook);
  const canAutoFix = hasAnyHooks;

  // Report each individual value
  sortedReplacements.forEach(({ start, end, replacement, displayValue, hasHook }) => {
    const originalValue = valueText.substring(start, end);
    const valueStartColumn = declarationNode.value.loc.start.column;
    const valueColumn = valueStartColumn + start;
    
    // Create precise error location for this value
    const reportNode = {
      ...declarationNode.value,
      loc: {
        ...declarationNode.value.loc,
        start: {
          ...declarationNode.value.loc.start,
          column: valueColumn
        },
        end: {
          ...declarationNode.value.loc.end,
          column: valueColumn + originalValue.length
        }
      }
    };

    if (hasHook) {
      // Create auto-fix for the entire shorthand value
      const fix = canAutoFix ? (fixer: any) => {
        // Reconstruct the entire value with all replacements
        let newValue = valueText;
        
        // Apply replacements from right to left to maintain string positions
        for (let i = sortedReplacements.length - 1; i >= 0; i--) {
          const { start: rStart, end: rEnd, replacement: rReplacement } = sortedReplacements[i];
          newValue = newValue.substring(0, rStart) + rReplacement + newValue.substring(rEnd);
        }
        
        return fixer.replaceText(declarationNode.value, newValue);
      } : undefined;

      context.context.report({
        node: reportNode,
        messageId: 'hardcodedValue',
        data: {
          oldValue: originalValue,
          newValue: displayValue
        },
        fix
      });
    } else {
      // No hook available
      context.context.report({
        node: reportNode,
        messageId: 'noReplacement',
        data: {
          oldValue: originalValue
        }
      });
    }
  });
}

/**
 * Core CSS tree traversal function that handles all use cases
 * Unified implementation for counting, position tracking, and simple iteration
 */
function forEachValueCore<T>(
  valueText: string,
  extractValue: (node: any) => T | null,
  shouldSkipNode: (node: any) => boolean,
  options: {
    withPositions?: boolean;
    countOnly?: boolean;
    callback?: (value: T, positionInfo?: PositionInfo) => void;
  }
): number | void {
  if (!valueText || typeof valueText !== 'string') {
    return options.countOnly ? 0 : undefined;
  }

  let count = 0;
  try {
    const parseOptions = options.withPositions ? { context: 'value' as const, positions: true } : { context: 'value' as const };
    const ast = parse(valueText, parseOptions);
    
    walk(ast, {
      enter(node: any) {
        // Skip nodes efficiently using this.skip
        if (shouldSkipNode(node)) {
          return this.skip;
        }
        
        const value = extractValue(node);
        if (value !== null) {
          if (options.countOnly) {
            count++;
          } else if (options.callback) {
            const positionInfo = options.withPositions ? {
              start: node.loc?.start,
              end: node.loc?.end
            } : undefined;
            options.callback(value, positionInfo);
          }
        }
      }
    });
  } catch (error) {
    return options.countOnly ? 0 : undefined;
  }

  return options.countOnly ? count : undefined;
}

/**
 * Generic CSS tree traversal with optional position tracking
 * Unified function that handles both simple iteration and position tracking
 */
export function forEachValue<T>(
  valueText: string,
  extractValue: (node: any) => T | null,
  shouldSkipNode: (node: any) => boolean,
  callback: (value: T, positionInfo?: PositionInfo) => void,
  options?: { withPositions?: boolean }
): void {
  forEachValueCore(valueText, extractValue, shouldSkipNode, {
    withPositions: options?.withPositions || false,
    callback
  });
}

/**
 * Generic count function for values in CSS
 * Handles the common logic for counting specific types of values
 */
export function countValues<T>(
  valueText: string,
  extractValue: (node: any) => T | null,
  shouldSkipNode: (node: any) => boolean
): number {
  return forEachValueCore(valueText, extractValue, shouldSkipNode, {
    countOnly: true
  }) as number;
}

/**
 * @deprecated Use forEachValue with options.withPositions instead
 */
export function forEachValueWithPosition<T>(
  valueText: string,
  extractValue: (node: any) => T | null,
  shouldSkipNode: (node: any) => boolean,
  callback: ValueCallback<T>
): void {
  forEachValue(valueText, extractValue, shouldSkipNode, callback, { withPositions: true });
}
