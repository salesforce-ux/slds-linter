import { parse, walk } from '@eslint/css-tree';
import { isValidColor } from './color-lib-utils';

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
      return isValidColor(node.name); // named colors
    case 'Function':
      // Color functions: rgb(), rgba(), hsl(), hsla()
      const colorFunctions = ['rgb', 'rgba', 'hsl', 'hsla', 'color'];
      return colorFunctions.includes(node.name.toLowerCase());
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
      // Length units: px, rem, em, etc.
      const lengthUnits = ['px', 'rem', 'em', '%', 'ch', 'vh', 'vw'];
      return lengthUnits.includes(node.unit.toLowerCase());
    case 'Number':
      // Zero values without units
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
 * Convert CSS tree node to string representation
 */
function nodeToString(node: any): string {
  if (!node) return '';
  
  switch (node.type) {
    case 'Dimension':
      return `${node.value}${node.unit}`;
    case 'Number':
      return node.value.toString();
    case 'Hash':
      return `#${node.value}`;
    case 'Identifier':
      return node.name;
    case 'Function':
      // This is a simplified function serialization
      // For full serialization, we'd need to walk the function's children
      return `${node.name}(...)`;
    default:
      return '';
  }
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
          currentShadow.lengthParts.push(nodeToString(node));
        } else if (isColorValue(node)) {
          currentShadow.colorParts.push(nodeToString(node));
        }
      }
    });
    
    // Add the current shadow if it has any content
    if (currentShadow.lengthParts.length > 0 || currentShadow.colorParts.length > 0 || currentShadow.inset) {
      shadows.push(currentShadow);
    }
    
  } catch (error) {
    // If parsing fails, return empty array
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
 * Simplified version without full unit conversion
 */
function normalizeLengthValue(value: string | undefined): string {
  if (!value) return '0px';
  
  // Convert 0 to 0px for consistency
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
