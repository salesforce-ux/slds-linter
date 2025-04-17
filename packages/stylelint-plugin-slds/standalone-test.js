// Standalone test for AURA expression handling

// Test case
const auraExpression = `div[class="{! (v.hasErrors ? 'slds-theme_error' : 'slds-theme_success') + ' slds-modal__header slds-theme_alert-texture'}"]`;

// Standalone approach to extract and fix BEM class names in AURA expressions
function processAuraExpressions(selector) {
  // Store the original selector
  const original = selector;
  
  // BEM mappings for our test (simplified)
  const bemMappings = {
    'slds-theme_error': 'slds-theme--error',
    'slds-theme_success': 'slds-theme--success',
    'slds-theme_alert-texture': 'slds-theme--alert-texture',
    'slds-modal__header': 'slds-modal__header' // No mapping needed, just for completeness
  };
  
  // Step 1: Find and process AURA expressions
  const auraPattern = /\{\![^}]*\}/g;
  let updatedSelector = selector;
  let match;
  
  while ((match = auraPattern.exec(selector)) !== null) {
    const auraExpr = match[0];
    console.log("Found AURA expression:", auraExpr);
    
    // Step 2: Process each AURA expression
    let processedExpr = auraExpr;
    
    // First handle quoted classes
    const quotedPattern = /'(slds-[^']+)'|"(slds-[^"]+)"/g;
    let quoteMatch;
    while ((quoteMatch = quotedPattern.exec(auraExpr)) !== null) {
      const className = quoteMatch[1] || quoteMatch[2];
      const newValue = bemMappings[className];
      
      if (newValue && newValue !== className) {
        console.log(`Replacing quoted class '${className}' with '${newValue}'`);
        
        // Replace the class name within its quotes
        processedExpr = processedExpr.replace(
          new RegExp(`'${className}'`, 'g'),
          `'${newValue}'`
        );
        processedExpr = processedExpr.replace(
          new RegExp(`"${className}"`, 'g'),
          `"${newValue}"`
        );
      }
    }
    
    // Handle string concatenation with string literal
    if (processedExpr.includes("+ '")) {
      const concatenationPattern = /\+\s*'([^']+)'/g;
      let concatMatch;
      
      while ((concatMatch = concatenationPattern.exec(processedExpr)) !== null) {
        const concatString = concatMatch[1];
        console.log("Found concatenated string:", concatString);
        
        // Look for SLDS classes in the concatenated string
        let updatedConcatString = concatString;
        const sldsPattern = /\bslds-[a-zA-Z0-9_-]+\b/g;
        let sldsMatch;
        
        while ((sldsMatch = sldsPattern.exec(concatString)) !== null) {
          const className = sldsMatch[0];
          const newValue = bemMappings[className];
          
          if (newValue && newValue !== className) {
            console.log(`Replacing concatenated class '${className}' with '${newValue}'`);
            
            // Replace the class name in the concatenated string
            updatedConcatString = updatedConcatString.replace(
              new RegExp(`\\b${className}\\b`, 'g'),
              newValue
            );
          }
        }
        
        // Replace the entire concatenated string if changes were made
        if (updatedConcatString !== concatString) {
          processedExpr = processedExpr.replace(
            `+ '${concatString}'`,
            `+ '${updatedConcatString}'`
          );
        }
      }
    }
    
    // Replace the entire AURA expression with the processed version
    if (processedExpr !== auraExpr) {
      updatedSelector = updatedSelector.replace(auraExpr, processedExpr);
    }
  }
  
  // Output the results
  console.log("\nOriginal:", original);
  console.log("Updated:", updatedSelector);
  
  return updatedSelector;
}

// Run the test
console.log("Processing AURA expressions for BEM class names:");
processAuraExpressions(auraExpression); 