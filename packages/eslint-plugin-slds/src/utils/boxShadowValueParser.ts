import { parse, walk, generate } from '@eslint/css-tree';
import { isValidColor } from './color-lib-utils';
import { parseUnitValue, type ParsedUnitValue } from './value-utils';
import { isCssColorFunction } from './css-functions';

export interface BoxShadowValue {
  offsetX?: string;
  offsetY?: string;
  blurRadius?: string;
  spreadRadius?: string;
  color?: string;
  inset?: boolean;
}

interface ShadowParts {
  lengthParts: string[];
  colorParts: string[];
  inset: boolean;
}

/**
 * Check if a CSS tree node represents a color value
 */
function isColorValue(node: any): boolean {
  if (!node) return false;
  
  switch (node.type) {
    case 'Hash':
      return true; // #hex colors
    case 'Identifier':
      return isValidColor(node.name);
    case 'Function':
      return isCssColorFunction(node.name.toLowerCase());
    default:
      return false;
  }
}

/**
 * Check if a CSS tree node represents a length value
 */
function isLengthValue(node: any): boolean {
  if (!node) return false;
  
  switch (node.type) {
    case 'Dimension':
      // Use existing unit parsing to validate the unit
      const dimensionStr = `${node.value}${node.unit}`;
      return parseUnitValue(dimensionStr) !== null;
    case 'Number':
      // Zero values without units are valid lengths
      return Number(node.value) === 0;
    default:
      return false;
  }
}

/**
 * Check if a CSS tree node represents the 'inset' keyword
 */
function isInsetKeyword(node: any): boolean {
  return node?.type === 'Identifier' && node.name.toLowerCase() === 'inset';
}

/**
 * Extract shadow parts from CSS tree nodes
 */
function extractShadowParts(valueText: string): ShadowParts[] {
  const shadows: ShadowParts[] = [];
  let currentShadow: ShadowParts = {
    lengthParts: [],
    colorParts: [],
    inset: false
  };

  try {
    const ast = parse(valueText, { context: 'value' as const });
    
    walk(ast, {
      enter(node: any) {
        // Skip nested function content for now
        if (node.type === 'Function') {
          return this.skip;
        }
        
        if (isInsetKeyword(node)) {
          currentShadow.inset = true;
        } else if (isLengthValue(node)) {
          currentShadow.lengthParts.push(generate(node));
        } else if (isColorValue(node)) {
          currentShadow.colorParts.push(generate(node));
        }
      }
    });
    
    // Add the current shadow if it has any content
    if (currentShadow.lengthParts.length > 0 || currentShadow.colorParts.length > 0 || currentShadow.inset) {
      shadows.push(currentShadow);
    }
    
  } catch (error) {
    return [];
  }

  return shadows;
}

/**
 * Parse box-shadow value into structured format
 * Simplified version for ESLint v9 compatibility
 */
export function parseBoxShadowValue(value: string): BoxShadowValue[] {
  // Handle multiple shadows separated by commas
  const shadowStrings = value.split(',').map(s => s.trim());
  const allShadows: BoxShadowValue[] = [];
  
  for (const shadowString of shadowStrings) {
    const shadows = extractShadowParts(shadowString);
    
    const parsedShadows = shadows.map((shadow) => {
      /**
       * Box-shadow syntax:
       * Two, three, or four <length> values:
       * - offset-x offset-y [blur-radius] [spread-radius]
       * Optionally: inset keyword and color value
       */
      const shadowValue: BoxShadowValue = {};
      
      // Map length parts to shadow properties
      const lengthProps = ['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'] as const;
      lengthProps.forEach((prop, index) => {
        if (shadow.lengthParts.length > index) {
          shadowValue[prop] = shadow.lengthParts[index];
        }
      });
      
      // Add color if present
      if (shadow.colorParts.length > 0) {
        shadowValue.color = shadow.colorParts[0];
      }
      
      // Add inset flag if present
      if (shadow.inset) {
        shadowValue.inset = true;
      }
      
      return shadowValue;
    });
    
    allShadows.push(...parsedShadows);
  }
  
  return allShadows;
}

/**
 * Normalize length value for comparison
 */
function normalizeLengthValue(value: string | undefined): string {
  if (!value) return '0px';
  if (value === '0') return '0px';
  return value;
}

/**
 * Check if two parsed box-shadow values match
 */
export function isBoxShadowMatch(parsedCssValue: BoxShadowValue[], parsedValueHook: BoxShadowValue[]): boolean {
  // If the number of shadows doesn't match, they're not equal
  if (parsedCssValue.length !== parsedValueHook.length) {
    return false;
  }

  // Compare each shadow in the array
  for (let i = 0; i < parsedCssValue.length; i++) {
    const cssShadow = parsedCssValue[i];
    const hookShadow = parsedValueHook[i];

    // Compare color and inset properties
    if (cssShadow.color !== hookShadow.color || cssShadow.inset !== hookShadow.inset) {
      return false;
    }

    // Compare length properties
    const lengthProps = ['offsetX', 'offsetY', 'blurRadius', 'spreadRadius'] as const;
    for (const prop of lengthProps) {
      if (normalizeLengthValue(cssShadow[prop]) !== normalizeLengthValue(hookShadow[prop])) {
        return false;
      }
    }
  }

  return true;
}
