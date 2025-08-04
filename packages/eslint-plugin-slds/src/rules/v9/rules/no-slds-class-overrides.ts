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
    function generateSuggestion(classNode: any, className: string) {
      return {
        messageId: 'addDisableComment',
        data: { className },
        fix(fixer: any) {
          const nodeText = sourceCode.getText(classNode);
          const commentedText = `/* eslint-disable-next-line slds/no-slds-class-overrides */\n${nodeText}`;
          return fixer.replaceText(classNode, commentedText);
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
              suggest: [generateSuggestion(classSelectorNode, className)],
            });
          }
        }
      },
    };
  },
} as Rule.RuleModule; 