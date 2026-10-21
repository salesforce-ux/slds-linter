import { ValueToStylingHooksMapping, ValueToStylingHookEntry } from '@salesforce-ux/sds-metadata';
import chroma from 'chroma-js';
import { generate } from '@eslint/css-tree';
import { isCssColorFunction } from './css-functions';

/**
 * Perceptual color difference threshold (Delta E, CIEDE2000 via chroma.deltaE).
 * Lower values are stricter matches. Used to decide which hooks are "close enough".
 * 
 * Summary of Perception Thresholds
 *  Delta E Value | Visual Perception
 * ---------------|-------------------
 *    < 1.0       | Imperceptible to the human eye.
 *    1.0 – 2.0   | Only noticeable through close, side-by-side observation.
 *    3.0 – 6.0   | Clearly visible at a glance; acceptable for some commercial prints.
 */
const DELTAE_THRESHOLD = 50;
const MAX_PER_GROUP = 3;

/**
 * Convert any valid CSS color (named, hex, rgb(a), hsl(a), etc.) to hex.
 * Returns null if the value is not a valid color.
 */
export const convertToHex = (color: string, includeAlpha: boolean = false): string | null => {
  try {
    const format = includeAlpha? 'rgba' : 'rgb';
    // Try converting the color using chroma-js, which handles both named and hex colors
    return chroma(color).hex(format);
  } catch (e) {
    // If chroma can't process the color, it's likely invalid
    return null;
  }
};

export const hasAlphaChannel = (color: string): boolean => {
  try {
    return chroma(color).alpha() !== 1;
  } catch {
    return false;
  }
}

/**
 * Computes the transparent percentage for use in a CSS `color-mix()` replacement
 * of a hardcoded color with an alpha channel.
 *
 * For example, `rgba(181, 54, 45, 0.7)` has an alpha of 0.7, so (1 - 0.7) * 100 = 30,
 * which becomes the `transparent` percentage in the replacement:
 * `color-mix(in srgb, var(--slds-g-color-palette-red-40), transparent 30%)`
 *
 * @param color - A CSS color string (e.g. `rgba(181, 54, 45, 0.7)`)
 * @returns The transparent mix percentage (0–100)
 */
export const transparentPercentage = (color: string): number => Math.round((1 - chroma(color).alpha()) * 100);

/**
 * Classify a color into a broad color family based on its HSL hue, saturation, and lightness.
 * Returns one of: "red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink", "neutral".
 * Colors with very low saturation or extreme lightness are classified as "neutral" (greys/whites/blacks).
 */
export const classifyColorFamily = (hex: string): string => {
  try {
    const [hue, saturation, lightness] = chroma(hex).hsl();

    // Achromatic: very low saturation, or near-black / near-white
    if (saturation < 0.1 || lightness < 0.08 || lightness > 0.95 || isNaN(hue)) {
      return 'neutral';
    }

    // Bucket hue (0-360) into color families
    if (hue < 15)   return 'red';
    if (hue < 45)   return 'orange';
    if (hue < 70)   return 'yellow';
    if (hue < 160)  return 'green';
    if (hue < 200)  return 'cyan';
    if (hue < 265)  return 'blue';
    if (hue < 330)  return 'purple';
    if (hue < 345)  return 'pink';
    return 'red'; // wraps around
  } catch {
    return 'neutral';
  }
};

/**
 * Adjacent color families that should be treated as compatible.
 * Covers perceptually close hue ranges that straddle bucket boundaries.
 */
const ADJACENT_FAMILIES: Record<string, string[]> = {
  red:     ['orange', 'pink'],
  orange:  ['red', 'yellow'],
  yellow:  ['orange', 'green'],
  green:   ['yellow', 'cyan'],
  cyan:    ['green', 'blue'],
  blue:    ['cyan', 'purple'],
  purple:  ['blue', 'pink'],
  pink:    ['purple', 'red'],
  neutral: [],
};

/**
 * Check whether two color families are the same or adjacent on the hue wheel.
 * Neutral is never considered compatible with any chromatic family.
 */
const isCompatibleFamily = (familyA: string, familyB: string): boolean => {
  if (familyA === 'neutral' || familyB === 'neutral') return false;
  if (familyA === familyB) return true;
  return (ADJACENT_FAMILIES[familyA] || []).includes(familyB);
};

/** Groups that should never be promoted via color-family affinity (raw palette values). */
const NON_PROMOTABLE_GROUPS = new Set(['reference']);

const isHookPropertyMatch = (hook: ValueToStylingHookEntry, cssProperty: string): boolean => {
  return hook.properties.includes(cssProperty) || hook.properties.includes("*");
}

function getOrderByCssProp(cssProperty: string): string[] {
  if(cssProperty === 'color' || cssProperty === 'fill') {
      return ["surface", "accent", "feedback", "theme", "reference"];
  } else if(cssProperty.match(/background/)){
     return ["surface", "inverse-surface", "accent", "feedback", "theme", "reference"];
  } else if(cssProperty.match(/border/) || cssProperty.match(/outline/) || cssProperty.match(/stroke/)) {
      return ["borders", "inverse-borders", "accent", "feedback", "theme", "reference"];
  }
  return ["surface", "inverse-surface", "accent", "borders", "inverse-borders", "feedback", "theme", "reference"];
}


/**
 * Given an input color and the metadata mapping of supported colors to hooks,
 * suggest styling hook names ordered by:
 * 1) Color family affinity: groups containing hooks in the same color family as the input are promoted
 * 2) Group priority: semantic -> system -> palette (within promoted / non-promoted sets)
 * 3) Perceptual distance (Delta E) within each group, with same-family hooks first
 */
export const findClosestColorHook = (
  color: string,
  supportedColors:ValueToStylingHooksMapping,
  cssProperty: string
): string[] => {
  const inputFamily = classifyColorFamily(color);

  const closestHooks: Array<{distance: number, group: string, name: string, sameFamily: boolean}> = [];
  Object.entries(supportedColors).forEach(([sldsValue, data]) => {
    if (sldsValue && isValidColor(sldsValue)) {
      const hooks = data as ValueToStylingHookEntry[]; // Get the hooks for the sldsValue
      const hookFamily = classifyColorFamily(sldsValue);
      const sameFamily = isCompatibleFamily(inputFamily, hookFamily);

      hooks.forEach((hook) => {
        // Exact match shortcut to avoid floating rounding noise
        const distance = (sldsValue.toLowerCase() === color.toLowerCase())
          ? 0
          : chroma.deltaE(sldsValue, color);
          
        // Check if the hook has the same property or universal selector
        if (isHookPropertyMatch(hook, cssProperty) && distance < DELTAE_THRESHOLD) {
          // Add to same property hooks if within threshold
          closestHooks.push({ distance, group: hook.group, name: hook.name, sameFamily });
        }
      });
    }
  });

  // Sort within each group: same-family hooks first, then by deltaE distance
  const hooksByGroupMap:Record<string, Array<{distance: number, name: string, sameFamily: boolean}>> = closestHooks
  .sort((a, b) => {
    if (a.sameFamily !== b.sameFamily) return a.sameFamily ? -1 : 1;
    return a.distance - b.distance;
  })
  .reduce((acc, hook) => {
    if (!acc[hook.group]) {
      acc[hook.group] = [];
    }
    acc[hook.group].push({distance: hook.distance, name: hook.name, sameFamily: hook.sameFamily});
    return acc;
  }, {} as Record<string, Array<{distance: number, name: string, sameFamily: boolean}>>);

  const groupOrder = getOrderByCssProp(cssProperty);

  // When same-family groups exist, only include those (excluding reference/palette).
  // Different-family groups are excluded entirely to avoid unrelated suggestions.
  // Fall back to full group order when no groups have color family affinity (e.g., neutral input).
  const promoted = groupOrder.filter(g => !NON_PROMOTABLE_GROUPS.has(g) && (hooksByGroupMap[g] || []).some(h => h.sameFamily));
  const activeGroups = promoted.length > 0 ? promoted : groupOrder;

  const matchedHookNames = activeGroups
    .flatMap(group => (hooksByGroupMap[group] || []).slice(0, MAX_PER_GROUP))
    .slice(0, groupOrder.length)
    .map(hook => hook.name);

    return matchedHookNames;
};

/**
 * Check if a value is any valid CSS color string (delegates to chroma-js).
 */
export const isValidColor = (val:string):boolean => chroma.valid(val);

/**
 * Extract a color string from a CSS AST node produced by @eslint/css-tree.
 * Supports Hash (#rrggbb), Identifier (named colors), and color Function nodes.
 * Returns null if the extracted value is not a valid color.
 */
export const extractColorValue = (node: any): string | null => {
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
