import SelectorParser from 'postcss-selector-parser';

interface CssClassNode{
  value:string,
  sourceIndex: number,
  inAuraExpression?: boolean
}

// Regular expression to find SLDS class names in AURA expressions
const sldsClassRegex = /['"]([a-zA-Z0-9-_]+slds[a-zA-Z0-9-_]+)['"]/g;

/**
 * Extract class nodes from an AURA expression like {! (v.hasErrors ? 'slds-theme_error' : 'slds-theme_success') }
 * @param selector The selector string that may contain AURA expressions
 * @returns Array of CSS class nodes
 */
export function extractClassesFromAuraExpression(selector: string): CssClassNode[] {
  const classNodes: CssClassNode[] = [];
  
  // Find all AURA expressions in the selector
  const auraExpressionRegex = /\{\!.*?\}/gs;
  
  let match;
  while ((match = auraExpressionRegex.exec(selector)) !== null) {
    const auraExpression = match[0];
    
    // Extract quoted class names from the AURA expression
    let sldsMatch;
    sldsClassRegex.lastIndex = 0; // Reset regex state
    
    while ((sldsMatch = sldsClassRegex.exec(auraExpression)) !== null) {
      const className = sldsMatch[1];
      // Calculate the sourceIndex relative to the start of the selector
      const sourceIndex = match.index + sldsMatch.index + 1; // +1 to account for the quote
      
      classNodes.push({
        value: className,
        sourceIndex,
        inAuraExpression: true
      });
    }
    
    // Extract class names from string concatenation
    if (auraExpression.includes("+ '") || auraExpression.includes('+ "')) {
      const concatenationPattern = /\+\s*['"]([^'"]+)['"]/g;
      let concatMatch;
      
      while ((concatMatch = concatenationPattern.exec(auraExpression)) !== null) {
        const concatString = concatMatch[1];
        
        // Find all SLDS classes in the concatenated string
        const sldsPattern = /\b(slds-[a-zA-Z0-9_-]+)\b/g;
        let sldsMatch;
        
        while ((sldsMatch = sldsPattern.exec(concatString)) !== null) {
          const className = sldsMatch[1];
          // Calculate the sourceIndex - this is approximate since the class is in a concatenated string
          const sourceIndex = match.index + concatMatch.index + concatMatch[0].indexOf(className);
          
          classNodes.push({
            value: className,
            sourceIndex,
            inAuraExpression: true
          });
        }
      }
    }
  }
  
  return classNodes;
}

export function getClassNodesFromSelector(selector: string): CssClassNode[] {
  // Handle AURA expressions first
  const auraClassNodes = extractClassesFromAuraExpression(selector);
  
  // Then handle standard CSS selectors
  const selectorParser = SelectorParser();
  let standardClassNodes: CssClassNode[] = [];
  
  try {
    const selectorAst = selectorParser.astSync(selector);
    selectorAst.walkClasses((classNode) => {
      standardClassNodes.push(classNode);
    });
  } catch (e) {
    // If the selector can't be parsed (e.g., it contains complex AURA expressions),
    // we'll still have the AURA class nodes
    console.warn(`Could not parse selector: ${selector}. Error: ${e}`);
  }
  
  return [...auraClassNodes, ...standardClassNodes];
}
