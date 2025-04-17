// Manual test for AURA expression processing
const { extractClassesFromAuraExpression } = require('./src/utils/selector-utils');

// Test case
const auraExpression = `div[class="{! (v.hasErrors ? 'slds-theme_error' : 'slds-theme_success') + ' slds-modal__header slds-theme_alert-texture'}"]`;

// Test the extraction function
console.log("Testing AURA expression extraction:");
const extractedClasses = extractClassesFromAuraExpression(auraExpression);
console.log("Extracted classes:", extractedClasses);

// Test the replacement logic
console.log("\nTesting replacement logic:");
const hasAuraExpression = (selector) => {
  return selector.includes('{!') && selector.includes('}');
};

if (hasAuraExpression(auraExpression)) {
  console.log("Found AURA expression");

  // Example BEM mappings (simplified)
  const bemMappings = {
    'slds-theme_error': 'slds-theme--error',
    'slds-theme_success': 'slds-theme--success',
    'slds-theme_alert-texture': 'slds-theme--alert-texture'
  };

  // Apply replacements for each extracted class
  let updatedSelector = auraExpression;
  
  extractedClasses.forEach(classNode => {
    const newValue = bemMappings[classNode.value];
    if (newValue) {
      console.log(`Replacing '${classNode.value}' with '${newValue}'`);
      
      // Replace the specific class within the AURA expression
      updatedSelector = updatedSelector.replace(
        new RegExp(`'${classNode.value}'|"${classNode.value}"`, 'g'),
        (match) => match.replace(classNode.value, newValue)
      );
    }
  });
  
  console.log("\nOriginal:", auraExpression);
  console.log("Updated:", updatedSelector);
} 