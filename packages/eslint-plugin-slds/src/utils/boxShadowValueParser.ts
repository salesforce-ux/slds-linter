import { parse, walk, generate } from '@eslint/css-tree';
import { isValidColor } from './color-lib-utils';
import { parseUnitValue } from './value-utils';
import { isCssColorFunction, isCssMathFunction } from './css-functions';
import { getVarToken } from './css-utils';

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
      // Check for color functions (rgb, rgba, hsl, hsla)
      if (isCssColorFunction(node.name.toLowerCase())) {
        return true;
      }
      // Check for SLDS color vars: var(--slds-g-color-*)
      const varToken = getVarToken(node);
      return !!varToken.match(/^--slds-g-color/);
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
    case 'Function':
      // Check for math functions (calc, min, max)
      if (isCssMathFunction(node.name.toLowerCase())) {
        return true;
      }
      // Check for SLDS spacing/sizing vars: var(--slds-g-spacing-*) or var(--slds-g-sizing-*)
      const varToken = getVarToken(node);
      return !!varToken.match(/^--slds-g-(spacing|sizing)/);
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
 * Check if a node is a comma separator (used to separate multiple shadows)
 */
function isCommaSeparator(node: any): boolean {
  return node?.type === 'Operator' && node.value === ',';
}

/**
 * Extract shadow parts from CSS tree nodes
 * Properly handles comma-separated multiple shadows and var() functions
 */
function extractShadowParts(ast: any): ShadowParts[] {
  const shadows: ShadowParts[] = [];
  let currentShadow: ShadowParts | null = null;

  // Helper to finalize current shadow
  const finalizeShadow = () => {
    if (currentShadow && (currentShadow.lengthParts.length > 0 || currentShadow.colorParts.length > 0 || currentShadow.inset)) {
      shadows.push(currentShadow);
    }
    currentShadow = null;
  };

  walk(ast, {
    enter(node: any) {
      // Handle comma separator - finalize current shadow and start new one
      if (isCommaSeparator(node)) {
        finalizeShadow();
        return;
      }

      // Skip whitespace
      if (node.type === 'WhiteSpace') {
        return;
      }

      // Ensure current shadow exists for all value nodes
      currentShadow = currentShadow || { lengthParts: [], colorParts: [], inset: false };

      // Handle function nodes (var, calc, rgb, etc.)
      if (node.type === 'Function') {
        if (isColorValue(node)) {
          currentShadow.colorParts.push(generate(node));
        } else if (isLengthValue(node)) {
          currentShadow.lengthParts.push(generate(node));
        }
        // Skip children - we've handled the entire function
        return this.skip;
      }

      // Handle inset keyword
      if (isInsetKeyword(node)) {
        currentShadow.inset = true;
        return;
      }

      // Handle length values (Dimension, Number)
      if (isLengthValue(node)) {
        currentShadow.lengthParts.push(generate(node));
        return;
      }

      // Handle color values (Hash, Identifier)
      if (isColorValue(node)) {
        currentShadow.colorParts.push(generate(node));
        return;
      }
    }
  });

  // Finalize the last shadow
  finalizeShadow();

  return shadows;
}

/**
 * Parse box-shadow value into structured format
 * Uses CSS tree parser to properly handle comma-separated shadows and var() functions
 */
export function parseBoxShadowValue(value: string): BoxShadowValue[] {
  try {
    const ast = parse(value, { context: 'value' as const });
    const shadowParts = extractShadowParts(ast);

    return shadowParts.map((shadow) => {
      /**
       * Box-shadow syntax :
       * Two, three, or four <length> values.
       *   If only two values are given, they are interpreted as <offset-x> and <offset-y> values.
       *   If a third value is given, it is interpreted as a <blur-radius>.
       *   If a fourth value is given, it is interpreted as a <spread-radius>.
       * Optionally, the inset keyword.
       * Optionally, a <color> value.
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
        shadowValue.inset = shadow.inset;
      }
      
      return shadowValue;
    });
  } catch (error) {
    return [];
  }
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
