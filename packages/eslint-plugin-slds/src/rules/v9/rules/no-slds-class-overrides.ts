/**
 * @fileoverview Rule to disallow overriding SLDS CSS classes
 * Compatible with @eslint/css parser for ESLint v9
 * Maintains full parity with stylelint version behavior
 */

import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import { getRuleConfig } from '../../../utils/rule-config';

const ruleName = 'no-slds-class-overrides';
const ruleConfig = getRuleConfig(ruleName);

// Get SLDS classes from metadata (same as stylelint version)
const sldsClasses = metadata.sldsPlusClasses;
const sldsClassesSet = new Set(sldsClasses);

export default {
  meta: {
    type: ruleConfig.meta.type,
    docs: {
      description: ruleConfig.meta.docs.description,
      category: ruleConfig.meta.docs.category,
      recommended: ruleConfig.meta.docs.recommended,
      url: ruleConfig.meta.docs.url || 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-slds-class-overrides',
    },
    fixable: null, // No auto-fix (matches stylelint's fixable: false)
    hasSuggestions: true,
    schema: [],
    messages: ruleConfig.messages,
  },
  
  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Generate suggestion for disabling the rule
     */
    function generateSuggestion(classNode: any, className: string, selectorNode: any) {
      return {
        messageId: 'addDisableComment',
        data: { className },
        fix(fixer: any) {
          // VSCode extension workaround: Avoid [0,0] ranges which it handles incorrectly
          // Instead use replaceTextRange to replace a minimal range with comment + original text
          const allText = sourceCode.getText();
          const classRange = sourceCode.getRange(classNode);
          const classStart = classRange[0];
          
          // Find the beginning of the line containing the class selector
          let lineStart = classStart;
          while (lineStart > 0 && allText[lineStart - 1] !== '\n') {
            lineStart--;
          }
          
          // Find the first non-whitespace character on this line (start of CSS selector)
          let selectorStart = lineStart;
          while (selectorStart < allText.length && /\s/.test(allText[selectorStart])) {
            selectorStart++;
          }
          
          // Find the end of the CSS selector (until the opening brace)
          let selectorEnd = selectorStart;
          while (selectorEnd < allText.length && allText[selectorEnd] !== '{') {
            selectorEnd++;
          }
          
          // Get the entire selector text and replace it with comment + selector
          const selectorText = allText.substring(selectorStart, selectorEnd);
          const comment = '/* eslint-disable-line @salesforce-ux/slds/no-slds-class-overrides */ ';
          
          // Replace entire selector with comment + selector to avoid [0,0] range issue
          return fixer.replaceTextRange([selectorStart, selectorEnd], comment + selectorText);
        },
      };
    }

    return {
      // For no-slds-class-overrides: Only flags classes at selector end
      "SelectorList Selector"(node: any) {
        // Get the last ClassSelector in this selector (the one at the end)
        const classSelectorNode = node.children.filter((child: any) => child.type === "ClassSelector").at(-1);
        
        if (classSelectorNode) {
          const className = classSelectorNode.name;
          
          // Check if it's an SLDS class that exists in metadata
          if (className && 
              className.startsWith('slds-') && 
              sldsClassesSet.has(className)) {
            context.report({
              node: classSelectorNode,
              messageId: 'sldsClassOverride',
              data: { className },
              suggest: [generateSuggestion(classSelectorNode, className, node)],
            });
          }
        }
      },
    };
  },
} as Rule.RuleModule; 