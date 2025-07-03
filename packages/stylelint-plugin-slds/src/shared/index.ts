// Shared utilities for both stylelint and ESLint v9 plugins
export {
  handleBoxShadow,
  handleColorProps,
  handleDensityPropForNode,
  handleFontProps,
  GenericReportFn,
} from '../utils/shared/handlers';
export { isTargetProperty } from '../utils/shared/general';
export { matchesCssProperty, colorProperties, densificationProperties } from '../utils/property-matcher';
export { forEachDensifyValue, getFullValueFromNode, isDensifyValue, normalizeLengthValue } from '../utils/density-utils';
export { isFontProperty, isKnownFontWeight, parseFont, FontValue } from '../utils/fontValueParser';
export { makeReportMatchingHooks } from '../utils/report-utils-generic';
export { toRuleMessages } from '../utils/rule-message-utils-generic'; 