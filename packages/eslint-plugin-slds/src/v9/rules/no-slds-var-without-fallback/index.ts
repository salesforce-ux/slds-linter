import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import { getRuleMetadata, getFormattedMessage } from '../../../utils/rule-metadata';
import { isSldsCssVariable, isTargetProperty } from '../../../utils/css-parser';
import valueParser from 'postcss-value-parser';

const ruleName = 'no-slds-var-without-fallback';

// Access the slds1ExcludedVars property from metadata
const sldsVariables = metadata.slds1ExcludedVars || {};

// Get rule metadata
const ruleInfo = getRuleMetadata(ruleName);

/**
 * Parse var() functions using PostCSS value parser for robust parsing
 */
function parseVarFunctionsRobust(cssString: string): Array<{
  fullMatch: string;
  varName: string;
  hasFallback: boolean;
  fallbackValue?: string;
  startIndex: number;
  endIndex: number;
}> {
  const results: Array<{
    fullMatch: string;
    varName: string;
    hasFallback: boolean;
    fallbackValue?: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  try {
    const parsedValue = valueParser(cssString);
    let currentIndex = 0;

    parsedValue.walk((node) => {
      if (node.type === 'function' && node.value === 'var') {
        const varFunctionStr = valueParser.stringify(node);
        const varName = node.nodes[0]?.value || '';
        
        // Check if there's a fallback (comma separator)
        const hasFallback = node.nodes.some((arg) => arg.type === 'div' && arg.value === ',');
        
        let fallbackValue: string | undefined;
        if (hasFallback) {
          // Extract fallback value (everything after the first comma)
          const fallbackNodes = node.nodes.slice(2); // Skip var name and comma
          fallbackValue = valueParser.stringify(fallbackNodes);
        }

        results.push({
          fullMatch: varFunctionStr,
          varName,
          hasFallback,
          fallbackValue,
          startIndex: currentIndex + (node.sourceIndex || 0),
          endIndex: currentIndex + (node.sourceEndIndex || 0),
        });
      }
    });
  } catch (error) {
    // If PostCSS parsing fails, fall back to regex parsing
    console.warn('PostCSS parsing failed, falling back to regex:', error);
    return parseVarFunctionsRegex(cssString);
  }

  return results;
}

/**
 * Fallback regex-based parsing for edge cases
 */
function parseVarFunctionsRegex(cssString: string): Array<{
  fullMatch: string;
  varName: string;
  hasFallback: boolean;
  fallbackValue?: string;
  startIndex: number;
  endIndex: number;
}> {
  const results: Array<{
    fullMatch: string;
    varName: string;
    hasFallback: boolean;
    fallbackValue?: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  const varRegex = /var\(([^)]+)\)/g;
  let match;

  while ((match = varRegex.exec(cssString)) !== null) {
    const fullMatch = match[0];
    const args = match[1].split(',').map(arg => arg.trim());
    const varName = args[0];
    const hasFallback = args.length > 1;
    const fallbackValue = hasFallback ? args.slice(1).join(',').trim() : undefined;

    results.push({
      fullMatch,
      varName,
      hasFallback,
      fallbackValue,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
    });
  }

  return results;
}

/**
 * Parse CSS content and extract declarations
 */
function parseCssContent(content: string): Array<{
  property: string;
  value: string;
  startIndex: number;
  endIndex: number;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}> {
  const declarations: Array<{
    property: string;
    value: string;
    startIndex: number;
    endIndex: number;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
  }> = [];

  const lines = content.split('\n');
  let currentIndex = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('/*') || trimmedLine.startsWith('//')) {
      currentIndex += line.length + 1; // +1 for newline
      continue;
    }

    // Look for CSS declarations (property: value)
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex !== -1 && !trimmedLine.startsWith('@')) {
      const property = trimmedLine.substring(0, colonIndex).trim();
      const valuePart = trimmedLine.substring(colonIndex + 1).trim();
      
      // Handle !important
      const importantIndex = valuePart.lastIndexOf('!important');
      const hasImportant = importantIndex !== -1;
      const value = hasImportant ? valuePart.substring(0, importantIndex).trim() : valuePart;
      
      if (property && value) {
        const lineStartIndex = currentIndex + line.indexOf(property);
        const lineEndIndex = currentIndex + line.length;
        
        declarations.push({
          property,
          value,
          startIndex: lineStartIndex,
          endIndex: lineEndIndex,
          line: lineIndex + 1,
          column: line.indexOf(property) + 1,
          endLine: lineIndex + 1,
          endColumn: line.length + 1,
        });
      }
    }

    currentIndex += line.length + 1; // +1 for newline
  }

  return declarations;
}

/**
 * This rule supports all file types that may contain CSS content.
 * It uses robust PostCSS-based parsing for accurate CSS variable detection.
 */
export = {
  meta: {
    type: 'problem',
    docs: {
      description: ruleInfo?.ruleDesc || 'Add fallback values to SLDS styling hooks',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          propertyTargets: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingFallback: 'SLDS variable without fallback value',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const { propertyTargets = [] } = options;
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();
    const content = sourceCode.text;

    // Check if content contains CSS variables before processing
    if (!content.includes('var(') && !content.includes('--slds-')) {
      return {};
    }

    // Parse CSS content to find declarations
    const cssDeclarations = parseCssContent(content);

    cssDeclarations.forEach((declaration) => {
      // Check if this property should be targeted (matches stylelint behavior)
      if (!isTargetProperty(declaration.property, propertyTargets)) {
        return;
      }

      // Parse var() functions using robust PostCSS-based parsing
      const varFunctions = parseVarFunctionsRobust(declaration.value);
      
      varFunctions.forEach(({ varName, hasFallback, fullMatch, startIndex, endIndex }) => {
        if (!isSldsCssVariable(varName) || hasFallback) return;

        const fallbackValue = sldsVariables[varName];
        if (!fallbackValue) return;

        const message = getFormattedMessage(ruleName, 'errorMsg', {
          cssVar: varName,
          recommendation: fallbackValue,
        });

        // Calculate absolute positions in the file
        const absoluteStartIndex = declaration.startIndex + startIndex;
        const absoluteEndIndex = declaration.startIndex + endIndex;

        // Create a virtual node for reporting
        const virtualNode = {
          type: 'Program',
          range: [absoluteStartIndex, absoluteEndIndex] as [number, number],
          loc: {
            start: { 
              line: declaration.line, 
              column: declaration.column + startIndex 
            },
            end: { 
              line: declaration.endLine, 
              column: declaration.column + endIndex 
            }
          }
        };

        context.report({
          node: virtualNode,
          message,
          data: {
            cssVar: varName,
            fallbackValue,
          },
          fix(fixer) {
            const newVarFunction = `var(${varName}, ${fallbackValue})`;
            const newValue = declaration.value.replace(fullMatch, newVarFunction);
            const newDeclaration = `${declaration.property}: ${newValue};`;
            return fixer.replaceTextRange(
              [declaration.startIndex, declaration.endIndex], 
              newDeclaration
            );
          },
        });
      });
    });

    return {};
  },
}; 