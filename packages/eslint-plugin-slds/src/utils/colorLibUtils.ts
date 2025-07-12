import { ValueToStylingHooksMapping, ValueToStylingHookEntry } from '@salesforce-ux/sds-metadata';
import chroma from 'chroma-js';

const LAB_THRESHOLD = 25;

const isHardCodedColor = (color: string): boolean => {
  const colorRegex =
    /\b(rgb|rgba)\((\s*\d{1,3}\s*,\s*){2,3}\s*(0|1|0?\.\d+)\s*\)|#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b|[a-zA-Z]+/g;
  return colorRegex.test(color);
};

const isHexCode = (color: string): boolean => {
  const hexPattern = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
  return hexPattern.test(color);
};

const convertToHex = (color: string): string | null => {
  try {
    return chroma(color).hex();
  } catch (e) {
    return null;
  }
};

const findClosestColorHook = (
  color: string,
  supportedColors:ValueToStylingHooksMapping,
  cssProperty: string
): string[] => {
  const returnStylingHooks: string[] = [];
  const closestHooksWithSameProperty: { name: string; distance: number }[] = [];
  const closestHooksWithoutSameProperty: { name: string; distance: number }[] = [];
  const closestHooksWithAllProperty: { name: string; distance: number }[] = [];
  const labColor = chroma(color).lab();

  Object.entries(supportedColors).forEach(([sldsValue, data]) => {
    if (sldsValue && isHexCode(sldsValue)) {
      const hooks = data as ValueToStylingHookEntry[];
      hooks.forEach((hook) => {
        const labSupportedColor = chroma(sldsValue).lab();
        const distance = (JSON.stringify(labColor) === JSON.stringify(labSupportedColor)) ? 0
            : chroma.distance(chroma.lab(...labColor), chroma.lab(...labSupportedColor), "lab");
        if (hook.properties.includes(cssProperty)) {
          if (distance <= LAB_THRESHOLD) {
            closestHooksWithSameProperty.push({ name: hook.name, distance });
          }
        } 
        else if ( hook.properties.includes("*") ){
          if (distance <= LAB_THRESHOLD) {
            closestHooksWithAllProperty.push({ name: hook.name, distance });
          }
        }
        else {
          if (distance <= LAB_THRESHOLD) {
            closestHooksWithoutSameProperty.push({ name: hook.name, distance });
          }
        }
      });
    }
  });

const closesthookGroups = [
  { hooks: closestHooksWithSameProperty, distance: 0 },
  { hooks: closestHooksWithAllProperty, distance: 0 },
  { hooks: closestHooksWithSameProperty, distance: Infinity },
  { hooks: closestHooksWithAllProperty, distance: Infinity },
  { hooks: closestHooksWithoutSameProperty, distance: Infinity },
];

for (const group of closesthookGroups) {
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

const isValidColor = (val:string):boolean => chroma.valid(val);

export { findClosestColorHook, convertToHex, isHexCode, isHardCodedColor, isValidColor }; 