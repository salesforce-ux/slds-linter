import metadata from '@salesforce-ux/sds-metadata';
import { findClosestColorHook, convertToHex } from '../packages/eslint-plugin-slds/build/utils/color-lib-utils.js';
import { resolveColorPropertyToMatch } from '../packages/eslint-plugin-slds/build/utils/property-matcher.js';

// get color and property from command line arguments
const colorValue = process.argv[2];
const cssProperty = process.argv[3];

const valueToStylinghook = metadata.valueToStylingHooksCosmos;
const hexValue = convertToHex(colorValue);
if (!hexValue) {
  console.error('Invalid color value');
  process.exit(1);
}

const propToMatch = resolveColorPropertyToMatch(cssProperty);
const closestHooks = findClosestColorHook(hexValue, valueToStylinghook, propToMatch);
console.log(closestHooks);