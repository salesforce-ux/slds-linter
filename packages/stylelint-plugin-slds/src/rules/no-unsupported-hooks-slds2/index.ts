import metadata from '@salesforce-ux/sds-metadata';
import { Declaration, Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import { isTargetProperty } from '../../utils/prop-utills';
import { forEachVarFunction } from '../../utils/decl-utils';
const { utils, createPlugin } = stylelint;

const deprecatedHooks = new Set(metadata.deprecatedStylingHooks);

const ruleName: string = 'slds/no-unsupported-hooks-slds2';

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'No description provided',
} = ruleMetadata(ruleName) || {};
const messages = utils.ruleMessages(ruleName, {
  deprecated: (token: string) => replacePlaceholders(warningMsg, { token }),
  replaced: (token: string, newToken: string) =>
    // Replace deprecated hook ${oldStylingHook} with ${newStylingHook}
    replacePlaceholders(errorMsg, { token, newToken }),
});

function shouldIgnoreDetection(sldsHook: string) {
  return !deprecatedHooks.has(sldsHook);
}

/**
 * 
 * Example:
 *  .THIS  .demo {
 *    border-top: 1px solid var(--slds-g-color-border-brand-1);
 *  }
 * 
 */
function detectRightSide(decl:Declaration, basicReportProps:Partial<stylelint.Problem>) {
  const parsedValue = valueParser(decl.value);
  forEachVarFunction(decl, (node, startOffset) => {
    const functionNode = node as valueParser.FunctionNode;
    let cssVarNode = functionNode.nodes[0];
    let cssVar = cssVarNode.value;
    if (shouldIgnoreDetection(cssVar)) {
      return;
    }

    const index = cssVarNode.sourceIndex;
    const endIndex = cssVarNode.sourceEndIndex;

    stylelint.utils.report(<stylelint.Problem>{
      message: messages.deprecated(cssVar),
      ...basicReportProps,
      index: index+startOffset, endIndex: endIndex+startOffset
    });

  });
}

/**
 * 
 * Example:
 * 
 *.THIS {
 *     --slds-g-link-color: #f73650;
 * }
 * 
 */
 function detectLeftSide(decl:Declaration, basicReportProps:Partial<stylelint.Problem>) {
  // Usage on left side
  const { prop } = decl;
  if (shouldIgnoreDetection(prop)) {
    return;
  }
  const startIndex = decl.toString().indexOf(prop);
  const endIndex = startIndex + prop.length;
  const reportProps = {
    index: startIndex,
    endIndex,
    ...basicReportProps,
  };  
  reportProps.message = messages.deprecated(prop);
  stylelint.utils.report(<stylelint.Problem>reportProps);
}

const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity, propertyTargets = [] } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((node) => {
      if (!isTargetProperty(node.prop, propertyTargets)) {
        return;
      }

      const basicReportProps:Partial<stylelint.Problem> = {
        node,
        result,
        ruleName,
        severity,
      };
      detectRightSide(node, basicReportProps);
      detectLeftSide(node, basicReportProps);
    });
  };
}

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: '',
  fixable: false
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
