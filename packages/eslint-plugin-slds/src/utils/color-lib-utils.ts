import { ValueToStylingHooksMapping, ValueToStylingHookEntry } from '@salesforce-ux/sds-metadata';
import chroma from 'chroma-js';
import { generate } from '@eslint/css-tree';
import { isCssColorFunction } from './css-functions';

/**
 * Perceptual color difference threshold (Delta E, CIEDE2000 via chroma.deltaE).
 * Lower values are stricter matches. Used to decide which hooks are "close enough".
 */
const DELTAE_THRESHOLD = 10;

/**
 * Convert any valid CSS color (named, hex, rgb(a), hsl(a), etc.) to hex.
 * Returns null if the value is not a valid color.
 */
const convertToHex = (color: string): string | null => {
  try {
    // Try converting the color using chroma-js, which handles both named and hex colors
    return chroma(color).hex();
  } catch (e) {
    // If chroma can't process the color, it's likely invalid
    return null;
  }
};

const isHookPropertyMatch = (hook: ValueToStylingHookEntry, cssProperty: string): boolean => {
  return hook.properties.includes(cssProperty) || hook.properties.includes("*");
}

function getOrderByCssProp(cssProperty: string): string[] {
  if(cssProperty === 'color' || cssProperty === 'fill') {
      return ["surface", "theme",  "feedback", "reference"];
  } else if(cssProperty.match(/background/)){
     return ["surface", "surface-inverse", "theme",  "feedback", "reference"];
  } else if(cssProperty.match(/border/) || cssProperty.match(/outline/) || cssProperty.match(/stroke/)) {
      return ["borders", "borders-inverse", "feedback", "theme", "reference"];
  }
  return ["surface", "surface-inverse", "borders", "borders-inverse", "theme",  "feedback", "reference"];
}


/**
 * Given an input color and the metadata mapping of supported colors to hooks,
 * suggest up to 5 styling hook names ordered by:
 * 1) Category priority: semantic -> system -> palette
 * 2) Perceptual distance (Delta E)
 * Also prioritizes exact color matches (distance 0).
 */
const findClosestColorHook = (
  color: string,
  supportedColors:ValueToStylingHooksMapping,
  cssProperty: string
): string[] => {
  const closestHooks: Array<{distance: number, group: string, name: string}> = [];
  Object.entries(supportedColors).forEach(([sldsValue, data]) => {
    if (sldsValue && isValidColor(sldsValue)) {
      const hooks = data as ValueToStylingHookEntry[]; // Get the hooks for the sldsValue

      hooks.forEach((hook) => {
        // Exact match shortcut to avoid floating rounding noise
        const distance = (sldsValue.toLowerCase() === color.toLowerCase())
          ? 0
          : chroma.deltaE(sldsValue, color);
          
        // Check if the hook has the same property or universal selector
        if (isHookPropertyMatch(hook, cssProperty) && distance <= DELTAE_THRESHOLD) {
          // Add to same property hooks if within threshold
          closestHooks.push({ distance, group: hook.group, name: hook.name });
        }
      });
    }
  });

  const hooksByGroupMap:Record<string, string[]> = closestHooks.sort((a, b) => a.distance - b.distance).reduce((acc, hook) => {
    if (!acc[hook.group]) {
      acc[hook.group] = [];
    }
    acc[hook.group].push(hook.name);
    return acc;
  }, {});

  return getOrderByCssProp(cssProperty)
    .map(group => hooksByGroupMap[group]||[])
    .flat().slice(0, 5);
};

/**
 * Check if a value is any valid CSS color string (delegates to chroma-js).
 */
const isValidColor = (val:string):boolean => chroma.valid(val);

/**
 * Extract a color string from a CSS AST node produced by @eslint/css-tree.
 * Supports Hash (#rrggbb), Identifier (named colors), and color Function nodes.
 * Returns null if the extracted value is not a valid color.
 */
const extractColorValue = (node: any): string | null => {
  let colorValue: string | null = null;
  
  switch (node.type) {
    case 'Hash':
      colorValue = `#${node.value}`;
      break;
    case 'Identifier':
      colorValue = node.name;
      break;
    case 'Function':
      // Only extract color functions
      if (isCssColorFunction(node.name)) {
        colorValue = generate(node);
      }
      break;
  }
  
  return colorValue && isValidColor(colorValue) ? colorValue : null;
};

export { findClosestColorHook, convertToHex, isValidColor, extractColorValue };
