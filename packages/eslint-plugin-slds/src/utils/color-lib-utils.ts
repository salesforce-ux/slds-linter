//stylelint-sds/packages/stylelint-plugin-slds/src/utils/color-lib-utils.ts
import { ValueToStylingHooksMapping, ValueToStylingHookEntry } from '@salesforce-ux/sds-metadata';
import chroma from 'chroma-js';
import { generate } from '@eslint/css-tree';
import { isCssColorFunction } from './css-functions';

/**
 * Perceptual color difference threshold (Delta E, CIEDE2000 via chroma.deltaE).
 * Lower values are stricter matches. Used to decide which hooks are "close enough".
 */
const DELTAE_THRESHOLD = 25;

/**
 * Return true if the string likely represents a hardcoded color value.
 * - Supports hex, rgb(a), and named color keywords.
 * - Explicitly excludes CSS variables (var(...)).
 */
const isHardCodedColor = (color: string): boolean => {
  // Do not consider CSS variables as hardcoded colors
  if (/\bvar\s*\(/i.test(color)) {
    return false;
  }
  const colorRegex =
    /\b(rgb|rgba)\((\s*\d{1,3}\s*,\s*){2,3}\s*(0|1|0?\.\d+)\s*\)|#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b|[a-zA-Z]+(?!\s*\()/g;
  return colorRegex.test(color);
};

/**
 * Validate short (#rgb) or long (#rrggbb) hex color forms.
 */
const isHexCode = (color: string): boolean => {
  const hexPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/; // Pattern for #RGB or #RRGGBB
  return hexPattern.test(color);
};

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
  const returnStylingHooks: string[] = [];
  const closestHooksWithSameProperty: { name: string; distance: number }[] = [];
  const closestHooksWithoutSameProperty: { name: string; distance: number }[] =
    [];
  const closestHooksWithAllProperty: { name: string; distance: number }[] =
    [];
  Object.entries(supportedColors).forEach(([sldsValue, data]) => {
    if (sldsValue && isHexCode(sldsValue)) {
      const hooks = data as ValueToStylingHookEntry[]; // Get the hooks for the sldsValue

      hooks.forEach((hook) => {
        // Exact match shortcut to avoid floating rounding noise
        const distance = (sldsValue.toLowerCase() === color.toLowerCase())
          ? 0
          : chroma.deltaE(sldsValue, color);
        // Check if the hook has the same property
        if (hook.properties.includes(cssProperty)) {
          // Add to same property hooks if within threshold
          if (distance <= DELTAE_THRESHOLD) {
            closestHooksWithSameProperty.push({ name: hook.name, distance });
          }
        } 
        // Check for the universal selector
        else if ( hook.properties.includes("*") ){
          // Add to same property hooks if within threshold
          if (distance <= DELTAE_THRESHOLD) {
            closestHooksWithAllProperty.push({ name: hook.name, distance });
          }
        }
        else {
          // Add to different property hooks if within threshold
          if (distance <= DELTAE_THRESHOLD) {
            closestHooksWithoutSameProperty.push({ name: hook.name, distance });
          }
        }
      });
    }
  });

// Group hooks by their priority
const closesthookGroups = [
  { hooks: closestHooksWithSameProperty, distance: 0 },
  { hooks: closestHooksWithAllProperty, distance: 0 },
  { hooks: closestHooksWithSameProperty, distance: Infinity },  // For hooks with distance > 0
  { hooks: closestHooksWithAllProperty, distance: Infinity },
  { hooks: closestHooksWithoutSameProperty, distance: Infinity },
];

for (const group of closesthookGroups) {
  // Filter hooks based on the distance condition
  const filteredHooks = group.hooks.filter(h => 
    group.distance === 0 ? h.distance === 0 : h.distance > 0
  );

  if (returnStylingHooks.length < 1 && filteredHooks.length > 0) {
    const sortedSuggestions = sortSuggestions(closesthookGroups, cssProperty);
    returnStylingHooks.push(...sortedSuggestions.slice(0, 5));
  }
}


  return Array.from(new Set(returnStylingHooks));
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

/**
 * Heuristic: identify semantic color hooks (surface, accent, error, etc.).
 */
const isSemanticHook = (hook: string): boolean => hook.includes('surface-container') || hook.includes('-surface-') || hook.includes('-accent-') || hook.includes('-error-') || hook.includes('-warning-') || hook.includes('-info-') || hook.includes('-success-') || hook.includes('-disabled-');

/**
 * Heuristic: identify palette hooks (color palette tokens).
 */
const isPaletteHook = (hook: string): boolean => hook.includes('palette-');

/**
 * Sort hooks: semantic (0), system (1), palette (2), then by ascending distance.
 * Returns top 5 names.
 */
const sortBasedOnCategoryAndProperty = (hooks: { name: string; distance: number }[], cssProperty: string): string[] => {
  const rank = (name: string): number => (
    isSemanticHook(name) ? 0 : (!isPaletteHook(name) ? 1 : 2)
  );
  return hooks
    .slice()
    .sort((a, b) => {
      const ra = rank(a.name);
      const rb = rank(b.name);
      if (ra !== rb) return ra - rb; // semantic -> system -> palette
      return a.distance - b.distance; // then by distance within group
    })
    .map(h => h.name).slice(0, 5);
}

/**
 * Flatten grouped suggestions and apply the standard category+distance ordering.
 */
const sortSuggestions = (closesthookGroups: { hooks: { name: string; distance: number; }[], distance: number }[], cssProperty: string): string[] => {
  // flatten and apply single-pass comparator: semantic first, then distance
  const allHooks = closesthookGroups.map(group => group.hooks).flat();
  return sortBasedOnCategoryAndProperty(allHooks, cssProperty);
}

export { findClosestColorHook, convertToHex, isHexCode, isHardCodedColor, isValidColor, extractColorValue, isSemanticHook, isPaletteHook, sortBasedOnCategoryAndProperty };
