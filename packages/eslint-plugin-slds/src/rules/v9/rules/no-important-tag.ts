/**
 * @fileoverview Rule to disallow `!important` flags in CSS properties
 * Compatible with @eslint/css parser for ESLint v9
 * SLDS-specific targeting and suggest API for multiple fix options
 */

import { Rule } from 'eslint';
import { getRuleConfig } from '../../../utils/rule-config';
import { isTargetProperty } from '../../../utils/css-utils';

const ruleName = 'no-important-tag';
const ruleConfig = getRuleConfig(ruleName);

const importantPattern = /!(\s|\/\*.*?\*\/)*important/iu;
const trailingWhitespacePattern = /\s*$/u;

/**
 * Find line and column offsets from a given index in text
 * Adapted from official @eslint/css findOffsets utility
 */
function findOffsets(text: string, targetIndex: number) {
  let lineOffset = 0;
  let columnOffset = 0;
  
  for (let i = 0; i < targetIndex; i++) {
    if (text[i] === '\n') {
      lineOffset++;
      columnOffset = 0;
    } else {
      columnOffset++;
    }
  }
  
  return { lineOffset, columnOffset };
}

/**
 * Create a fix function that removes !important flag
 * Reusable for both main fix and suggestions
 */
function createRemoveImportantFix(node: any, importantMatch: RegExpExecArray, declarationText: string) {
  return function(fixer: any) {
    const importantStart = importantMatch.index;
    const importantEnd = importantStart + importantMatch[0].length;

    // Find any trailing whitespace before the !important
    const valuePart = declarationText.slice(0, importantStart);
    const whitespaceEnd = valuePart.search(trailingWhitespacePattern);

    // Use offset-based removal if available, fallback to text replacement
    if (node.loc?.start?.offset !== undefined) {
      const start = node.loc.start.offset + whitespaceEnd;
      const end = node.loc.start.offset + importantEnd;
      return fixer.removeRange([start, end]);
    } else {
      // Fallback: text replacement for CSS AST compatibility
      const newText = declarationText.slice(0, whitespaceEnd) + 
                     declarationText.slice(importantEnd);
      return fixer.replaceText(node, newText);
    }
  };
}

/**
 * Create a fix function that replaces !important with a specificity comment
 */
function createSpecificityCommentFix(node: any, importantMatch: RegExpExecArray, declarationText: string) {
  return function(fixer: any) {
    const importantStart = importantMatch.index;
    const importantEnd = importantStart + importantMatch[0].length;
    
    const beforeMatch = declarationText.slice(0, importantStart);
    const afterMatch = declarationText.slice(importantEnd);
    const newText = beforeMatch + '/* TODO: Increase specificity instead */' + afterMatch;
    
    return fixer.replaceText(node, newText);
  };
}

/**
 * Generate suggestion options for the rule
 */
function generateSuggestions(node: any, importantMatch: RegExpExecArray, declarationText: string) {
  return [
    {
      messageId: 'removeImportant',
      fix: createRemoveImportantFix(node, importantMatch, declarationText),
    },
    {
      messageId: 'addSpecificityComment',
      fix: createSpecificityCommentFix(node, importantMatch, declarationText),
    },
  ];
}

/**
 * Calculate precise location for error reporting
 */
function calculatePreciseLocation(node: any, importantMatch: RegExpExecArray, declarationText: string) {
  const {
    lineOffset: startLineOffset,
    columnOffset: startColumnOffset,
  } = findOffsets(declarationText, importantMatch.index);

  const {
    lineOffset: endLineOffset,
    columnOffset: endColumnOffset,
  } = findOffsets(
    declarationText,
    importantMatch.index + importantMatch[0].length,
  );

  const nodeStartLine = node.loc.start.line;
  const nodeStartColumn = node.loc.start.column;
  const startLine = nodeStartLine + startLineOffset;
  const endLine = nodeStartLine + endLineOffset;
  const startColumn =
    (startLine === nodeStartLine ? nodeStartColumn : 1) +
    startColumnOffset;
  const endColumn =
    (endLine === nodeStartLine ? nodeStartColumn : 1) +
    endColumnOffset;

  return {
    start: { line: startLine, column: startColumn },
    end: { line: endLine, column: endColumn },
  };
}

export default {
  meta: {
    type: ruleConfig.meta.type,
    docs: {
      description: ruleConfig.meta.docs.description,
      category: ruleConfig.meta.docs.category,
      recommended: ruleConfig.meta.docs.recommended,
      url: ruleConfig.meta.docs.url || 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-important-tag',
    },
    fixable: ruleConfig.meta.fixable,
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          propertyTargets: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of CSS properties to target for !important checking'
          }
        },
        additionalProperties: false,
      },
    ],
    messages: ruleConfig.messages,
  },
  
  create(context) {
    const sourceCode = context.sourceCode;
    const options = context.options[0] || {};
    const propertyTargets = options.propertyTargets || [];

    return {
      Declaration(node: any) {
        // Official rule pattern: simple important check first
        if (!node.important) return;
        
        // SLDS-specific: property targeting check
        if (!isTargetProperty(node.property, propertyTargets)) return;
        
        const declarationText = sourceCode.getText(node);
        const importantMatch = importantPattern.exec(declarationText);
        
        if (!importantMatch) return;

        // Calculate precise location for error reporting
        const preciseLocation = calculatePreciseLocation(node, importantMatch, declarationText);

        // Report with auto-fix and suggestions
        context.report({
          node, // Required for RuleTester to determine error type
          loc: preciseLocation,
          messageId: 'unexpectedImportant',
          
          // Primary auto-fix (reusing the same logic as removeImportant suggestion)
          fix: createRemoveImportantFix(node, importantMatch, declarationText),
          
          // Enhanced suggestions with multiple fix options
          suggest: generateSuggestions(node, importantMatch, declarationText),
        });
      },
    };
  },
} as Rule.RuleModule; 