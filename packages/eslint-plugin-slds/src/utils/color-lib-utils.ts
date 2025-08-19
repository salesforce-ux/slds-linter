import { ValueToStylingHooksMapping, ValueToStylingHookEntry } from '@salesforce-ux/sds-metadata';
import chroma from 'chroma-js';

const LAB_THRESHOLD = 25; // Adjust this to set how strict the matching should be

const isHardCodedColor = (color: string): boolean => {
  const colorRegex =
    /\b(rgb|rgba)\((\s*\d{1,3}\s*,\s*){2,3}\s*(0|1|0?\.\d+)\s*\)|#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b|[a-zA-Z]+/g;
  return colorRegex.test(color);
};

const isHexCode = (color: string): boolean => {
  const hexPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/; // Pattern for #RGB or #RRGGBB
  return hexPattern.test(color);
};

// Convert a named color or hex code into a hex format using chroma-js
const convertToHex = (color: string): string | null => {
  try {
    // Try converting the color using chroma-js, which handles both named and hex colors
    return chroma(color).hex();
  } catch (e) {
    // If chroma can't process the color, it's likely invalid
    return null;
  }
};

// Find the closest color hook using LAB distance
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
  const labColor = chroma(color).lab();

  Object.entries(supportedColors).forEach(([sldsValue, data]) => {
    if (sldsValue && isHexCode(sldsValue)) {
      const hooks = data as ValueToStylingHookEntry[]; // Get the hooks for the sldsValue

      hooks.forEach((hook) => {
        const labSupportedColor = chroma(sldsValue).lab();
        const distance = (JSON.stringify(labColor) === JSON.stringify(labSupportedColor)) ? 0
            : chroma.distance(chroma.lab(...labColor), chroma.lab(...labSupportedColor), "lab");
        // Check if the hook has the same property
        if (hook.properties.includes(cssProperty)) {
          // Add to same property hooks if within threshold
          if (distance <= LAB_THRESHOLD) {
            closestHooksWithSameProperty.push({ name: hook.name, distance });
          }
        } 
        // Check for the universal selector
        else if ( hook.properties.includes("*") ){
          // Add to same property hooks if within threshold
          if (distance <= LAB_THRESHOLD) {
            closestHooksWithAllProperty.push({ name: hook.name, distance });
          }
        }
        else {
          // Add to different property hooks if within threshold
          if (distance <= LAB_THRESHOLD) {
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
    filteredHooks.sort((a, b) => a.distance - b.distance);
    returnStylingHooks.push(...filteredHooks.slice(0, 5).map((h) => h.name));
  }
}


  return Array.from(new Set(returnStylingHooks));
};

/**
 * This method is usefull to identify all possible css color values.
 *  - names colors
 *  - 6,8 digit hex
 *  - rgb and rgba
 *  - hsl and hsla
 */
const isValidColor = (val:string):boolean => chroma.valid(val);

export { findClosestColorHook, convertToHex, isHexCode, isHardCodedColor, isValidColor };
