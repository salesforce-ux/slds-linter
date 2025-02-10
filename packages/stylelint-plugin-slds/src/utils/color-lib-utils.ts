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
  supportedColors,
  cssProperty: string
): { name: string }[] => {
  const returnStylingHooks: string[] = [];
  const closestHooksWithSameProperty: { name: string; distance: number }[] = [];
  const closestHooksWithoutSameProperty: { name: string; distance: number }[] =
    [];
  const labColor = chroma(color).lab();

  Object.entries(supportedColors).forEach(([sldsValue, data]) => {
    if (sldsValue && isHexCode(sldsValue)) {
      const hooks = data['hooks']; // Get the hooks for the sldsValue

      hooks.forEach((hook) => {
        const labSupportedColor = chroma(sldsValue).lab();
        const distance = chroma.distance(labColor, labSupportedColor, 'lab');

        // Check if the hook has the same property
        if (hook.properties.includes(cssProperty)) {
          // Add to same property hooks if within threshold
          if (distance <= LAB_THRESHOLD) {
            closestHooksWithSameProperty.push({ name: hook.name, distance });
          }
        } else {
          // Add to different property hooks if within threshold
          if (distance <= LAB_THRESHOLD) {
            closestHooksWithoutSameProperty.push({ name: hook.name, distance });
          }
        }
      });
    }
  });

  // Sort by distance and slice top 5
  closestHooksWithSameProperty.sort((a, b) => a.distance - b.distance);

  // Push top 5 hooks with the same property
  returnStylingHooks.push(
    ...closestHooksWithSameProperty.slice(0, 5).map((h) => h.name)
  );
  if (returnStylingHooks.length < 1) {
    // Push top 5 hooks without the same property
    closestHooksWithoutSameProperty.sort((a, b) => a.distance - b.distance);
    returnStylingHooks.push(
      ...closestHooksWithoutSameProperty.slice(0, 5).map((h) => h.name)
    );
  }

  const uniqueHooks = Array.from(new Set(returnStylingHooks));

  // Transform the unique string array into an array of objects
  return uniqueHooks.map((hook) => ({
    name: hook,
  }));
};

export { findClosestColorHook, convertToHex, isHexCode, isHardCodedColor };
