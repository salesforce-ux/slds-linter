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

const ruleConfig = ruleMessages['enforce-sds-to-slds-hooks'];
const { type, description, url, messages } = ruleConfig;

const sldsPlusStylingHooks = metadata.sldsPlusStylingHooks;

// Generate values to hooks mapping using only global hooks
// shared hooks are private/ undocumented APIs, so they should not be recommended to customers
// Ref this thread: https://salesforce-internal.slack.com/archives/C071J0Q3FNV/p1743010620921339?thread_ts=1743009353.385429&cid=C071J0Q3FNV
const allSldsHooks = [...sldsPlusStylingHooks.global, ...sldsPlusStylingHooks.component];

const toSldsToken = (sdsToken: string) => sdsToken.replace('--sds-', '--slds-');

function shouldIgnoreDetection(sdsToken: string) {
  // Ignore if entry not found in the list
  return (
    !sdsToken.startsWith('--sds-') || !allSldsHooks.includes(toSldsToken(sdsToken))
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
        // Property side: --sds-* custom property keys
        const property = decl.property;
        if (property && property.startsWith('--sds-') && !shouldIgnoreDetection(property) && decl.propertyStart !== null && decl.propertyEnd !== null) {
          const suggestedMatch = toSldsToken(property);
          reportRange(context, decl.propertyStart, decl.propertyEnd, {
            messageId: 'replaceSdsWithSlds',
            data: { oldValue: property, suggestedMatch },
            fix: decl.propertyMappable
              ? (fixer) => fixer.replaceTextRange([decl.propertyStart!, decl.propertyEnd!], suggestedMatch)
              : undefined,
          });
        }

        // Value side: var(--sds-*)
        if (decl.valueText && decl.valueStart !== null) {
          forEachNamespacedVariable(decl.valueText, (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => {
            const tokenName = variableInfo.name;
            if (!tokenName.startsWith('--sds-') || shouldIgnoreDetection(tokenName)) {
              return;
            }
            const suggestedMatch = toSldsToken(tokenName);
            // positionInfo spans the whole var() call; target the token itself.
            const varCallStart = positionInfo.start?.offset || 0;
            const varCallText = decl.valueText.substring(varCallStart, positionInfo.end?.offset ?? decl.valueText.length);
            const tokenIdx = varCallText.indexOf(tokenName);
            const tokenStart = decl.valueStart! + varCallStart + (tokenIdx >= 0 ? tokenIdx : 0);
            const tokenEnd = tokenStart + tokenName.length;
            reportRange(context, tokenStart, tokenEnd, {
              messageId: 'replaceSdsWithSlds',
              data: { oldValue: tokenName, suggestedMatch },
              fix: decl.valueMappable
                ? (fixer) => fixer.replaceTextRange([tokenStart, tokenEnd], suggestedMatch)
                : undefined,
            });
          });
        }
      });
    }

    function reportAndFix(node, oldValue, suggestedMatch) {
      context.report({
        node,
        messageId: 'replaceSdsWithSlds',
        data: { oldValue, suggestedMatch },
        fix(fixer) {
          // For Declaration nodes, use the offset from loc info
          if (node.type === "Declaration") {
            const sourceCode = context.sourceCode;
            const fullText = sourceCode.getText();
            const nodeOffset = node.loc.start.offset;
            
            // The property name appears at the start of the Declaration
            const propertyStart = nodeOffset;
            const propertyEnd = propertyStart + oldValue.length;
            
            // Verify we're replacing the right text
            const textAtPosition = fullText.substring(propertyStart, propertyEnd);
            if (textAtPosition === oldValue) {
              return fixer.replaceTextRange([propertyStart, propertyEnd], suggestedMatch);
            }
          }
          
          // For Identifier nodes (inside var() functions), simple replacement works
          return fixer.replaceText(node, suggestedMatch);
        }
      });
    }

    return {
      // CSS custom property declarations: --sds-* properties
      "Declaration[property=/^--sds-/]"(node) {
        const property = node.property;
        
        if (shouldIgnoreDetection(property)) {
          return;
        }

        const suggestedMatch = toSldsToken(property);
        reportAndFix(node, property, suggestedMatch);
      },

      // SDS tokens inside var() functions: var(--sds-*)
      "Function[name='var'] Identifier[name=/^--sds-/]"(node) {
        const tokenName = node.name;
        
        if (shouldIgnoreDetection(tokenName)) {
          return;
        }

        const suggestedMatch = toSldsToken(tokenName);
        reportAndFix(node, tokenName, suggestedMatch);
      }
    };
  },
} as Rule.RuleModule;
