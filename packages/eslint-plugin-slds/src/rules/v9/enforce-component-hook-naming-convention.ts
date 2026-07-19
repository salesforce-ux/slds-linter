import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';
import { forEachNamespacedVariable, type CssVariableInfo } from '../../utils/css-utils';
import type { PositionInfo } from '../../utils/hardcoded-shared-utils';
import {
  isJsxLikeFile,
  reportRange,
  createDeclarationVisitor,
  type JsxDeclaration,
} from '../../utils/jsx';

const ruleConfig = ruleMessages['enforce-component-hook-naming-convention'];
const { type, description, url, messages } = ruleConfig;

const slds1DeprecatedComponentHooks = metadata.slds1DeprecatedComponentHooks;

/**
 * Check if using a deprecated component hook that should be replaced
 */
function shouldIgnoreDetection(hook: string): boolean {
  // Ignore if entry not found in the list
  return (
    !hook.startsWith('--slds-c-') || !(hook in slds1DeprecatedComponentHooks)
  );
}

export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    fixable: 'code',
    messages,
  },
  
  create(context) {
    const filename = context.filename || context.getFilename();

    // JSX/React: inline style objects and CSS-in-JS declarations.
    if (isJsxLikeFile(filename)) {
      return createDeclarationVisitor(context, (decl: JsxDeclaration) => {
        const property = decl.property;
        if (property && !shouldIgnoreDetection(property) && decl.propertyStart !== null && decl.propertyEnd !== null) {
          const suggestedMatch = slds1DeprecatedComponentHooks[property];
          reportRange(context, decl.propertyStart, decl.propertyEnd, {
            messageId: 'replace',
            data: { oldValue: property, suggestedMatch },
            fix: decl.propertyMappable
              ? (fixer) => fixer.replaceTextRange([decl.propertyStart!, decl.propertyEnd!], suggestedMatch)
              : undefined,
          });
        }

        if (decl.valueText && decl.valueStart !== null) {
          forEachNamespacedVariable(decl.valueText, (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => {
            const tokenName = variableInfo.name;
            if (shouldIgnoreDetection(tokenName)) {
              return;
            }
            const suggestedMatch = slds1DeprecatedComponentHooks[tokenName];
            const varCallStart = positionInfo.start?.offset || 0;
            const varCallText = decl.valueText.substring(varCallStart, positionInfo.end?.offset ?? decl.valueText.length);
            const tokenIdx = varCallText.indexOf(tokenName);
            const tokenStart = decl.valueStart! + varCallStart + (tokenIdx >= 0 ? tokenIdx : 0);
            const tokenEnd = tokenStart + tokenName.length;
            reportRange(context, tokenStart, tokenEnd, {
              messageId: 'replace',
              data: { oldValue: tokenName, suggestedMatch },
              fix: decl.valueMappable
                ? (fixer) => fixer.replaceTextRange([tokenStart, tokenEnd], suggestedMatch)
                : undefined,
            });
          });
        }
      });
    }

    return {
      /*
       * Handle component hooks in CSS declarations
       * Limitation: For example:
       * .testClass{
       *    --slds-c-accordion-section-color-background: var(--slds-c-accordion-section-color-border);
       *  }
       * var in value is not detected, because eslint treats above statement as custom property assignment 
       * and value treated as raw string, not parsed into function nodes
       */
      "Declaration[property=/^--slds-c-/], Function[name='var'] Identifier[name=/^--slds-c-/]"(node) {
        let hookName: string;
        let reportNode = node;
        
        if (node.type === "Declaration") {
          // CSS custom property declaration: --slds-c-...
          hookName = node.property;
        } else if (node.type === "Identifier") {
          // Inside var() function: var(--slds-c-...)
          hookName = node.name;
        } else {
          return;
        }

        // Skip if hook should be ignored
        if (shouldIgnoreDetection(hookName)) {
          return;
        }

        const suggestedMatch = slds1DeprecatedComponentHooks[hookName];
        
        context.report({
          node: reportNode,
          messageId: 'replace',
          data: { 
            oldValue: hookName,
            suggestedMatch: suggestedMatch
          },
          fix(fixer) {
            if (node.type === "Declaration") {
              // Replace the property name in CSS declaration
              const originalText = context.sourceCode.getText(node);
              const colonIndex = originalText.indexOf(':');
              const valuePartWithColon = originalText.substring(colonIndex);
              return fixer.replaceText(node, `${suggestedMatch}${valuePartWithColon}`);
            } else if (node.type === "Identifier") {
              // Replace the identifier name in var() function
              return fixer.replaceText(node, suggestedMatch);
            }
            return null;
          }
        });
      }
    };
  },
} as Rule.RuleModule;
