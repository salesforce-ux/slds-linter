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

const ruleConfig = ruleMessages['no-unsupported-hooks-slds2'];
const { type, description, url, messages } = ruleConfig;

const deprecatedHooks = new Set(metadata.deprecatedStylingHooks);

function shouldIgnoreDetection(sldsHook: string): boolean {
  return !deprecatedHooks.has(sldsHook);
}

export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    messages,
  },
  
  create(context) {
    const filename = context.filename || context.getFilename();

    // JSX/React: inline style objects and CSS-in-JS declarations.
    if (isJsxLikeFile(filename)) {
      return createDeclarationVisitor(context, (decl: JsxDeclaration) => {
        const property = decl.property;
        if (property && /^--s(lds|ds)-/.test(property) && !shouldIgnoreDetection(property) && decl.propertyStart !== null && decl.propertyEnd !== null) {
          reportRange(context, decl.propertyStart, decl.propertyEnd, {
            messageId: 'deprecated',
            data: { token: property },
          });
        }

        if (decl.valueText && decl.valueStart !== null) {
          forEachNamespacedVariable(decl.valueText, (variableInfo: CssVariableInfo, positionInfo: PositionInfo) => {
            const tokenName = variableInfo.name;
            if (shouldIgnoreDetection(tokenName)) {
              return;
            }
            const varCallStart = positionInfo.start?.offset || 0;
            const varCallText = decl.valueText.substring(varCallStart, positionInfo.end?.offset ?? decl.valueText.length);
            const tokenIdx = varCallText.indexOf(tokenName);
            const tokenStart = decl.valueStart! + varCallStart + (tokenIdx >= 0 ? tokenIdx : 0);
            const tokenEnd = tokenStart + tokenName.length;
            reportRange(context, tokenStart, tokenEnd, {
              messageId: 'deprecated',
              data: { token: tokenName },
            });
          });
        }
      });
    }

    function reportDeprecatedHook(node, token: string) {
      context.report({
        node,
        messageId: 'deprecated',
        data: { token }
      });
    }

    return {
      // Handle CSS custom property declarations (left-side usage): --slds-* properties
      // Example: .THIS { --slds-g-link-color: #f73650; }
      "Declaration[property=/^--s(lds|ds)-/]"(node) {
        const property = node.property;
        
        if (shouldIgnoreDetection(property)) {
          return;
        }
        
        reportDeprecatedHook(node, property);
      },

      // Handle SLDS/SDS hooks inside var() functions (right-side usage): var(--slds-*)
      // Example: .THIS .demo { border-top: 1px solid var(--slds-g-color-border-brand-1); }
      "Function[name='var'] Identifier[name=/^--s(lds|ds)-/]"(node) {
        const tokenName = node.name;
        
        if (shouldIgnoreDetection(tokenName)) {
          return;
        }
        
        reportDeprecatedHook(node, tokenName);
      },
    };
  },
} as Rule.RuleModule;
