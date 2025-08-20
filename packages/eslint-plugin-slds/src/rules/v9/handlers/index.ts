/**
 * CSS Property Handlers for ESLint v9 no-hardcoded-values rule
 * 
 * These handlers process different types of CSS properties and convert
 * hardcoded values to SLDS styling hooks following the patterns from
 * the original Stylelint implementation.
 * 
 * New CSS AST-based handlers provide simplified processing for simple values
 * while maintaining the original handlers for complex parsing scenarios.
 */

export { handleBoxShadow } from './boxShadowHandler';
export { handleColorProps, handleColorValueFromCSS } from './colorHandler';  
export { handleDensityPropForNode, handleDensityValueFromCSS } from './densityHandler';
export { handleFontProps } from './fontHandler';
