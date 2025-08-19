/**
 * CSS Property Handlers for ESLint v9 no-hardcoded-values rule
 * 
 * These handlers process different types of CSS properties and convert
 * hardcoded values to SLDS styling hooks following the patterns from
 * the original Stylelint implementation.
 */

export { handleBoxShadow } from './boxShadowHandler';
export { handleColorProps } from './colorHandler';  
export { handleDensityPropForNode } from './densityHandler';
export { handleFontProps } from './fontHandler';
