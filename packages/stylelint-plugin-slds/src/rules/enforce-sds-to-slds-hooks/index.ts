import { Declaration, Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import { isTargetProperty } from '../../utils/prop-utills';
import metadata from '@salesforce-ux/sds-metadata';
import { forEachVarFunction } from '../../utils/decl-utils';
const sldsPlusStylingHooks = metadata.sldsPlusStylingHooks;

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/enforce-sds-to-slds-hooks';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  replace: (oldValue:string, suggestedMatch:string)=> replacePlaceholders(errorMsg, { 
    fullMatch: oldValue, 
    suggestedMatch
  })
})

// Generate values to hooks mapping using only global hooks
// shared hooks are private/ undocumented APIs, so they should not be recommended to customers
// Ref this thread: https://salesforce-internal.slack.com/archives/C071J0Q3FNV/p1743010620921339?thread_ts=1743009353.385429&cid=C071J0Q3FNV
const allSldsHooks = [...sldsPlusStylingHooks.global, ...sldsPlusStylingHooks.component];

const toSldsToken = (sdsToken: string) => sdsToken.replace('--sds-', '--slds-')

function shouldIgnoreDetection(sdsToken: string) {
  // Ignore if entry not found in the list
  return (
    !sdsToken.startsWith('--sds-') || !allSldsHooks.includes(toSldsToken(sdsToken))
  );
}



/**
 * 
 * Example:
 *  .THIS  .demo {
 *    border: 1px solid var(--sds-g-color-border-1));
 *  }
 * 
 */
function detectRightSide(decl:Declaration, basicReportProps:Partial<stylelint.Problem>) {

  forEachVarFunction(decl, (node: valueParser.FunctionNode, startOffset: number) => {    
    const tokenNode = node.nodes[0];
    const oldValue = tokenNode.value;
    if (shouldIgnoreDetection(oldValue)) {
      // Ignore if entry not found in the list or the token is marked to use further
      return;
    }

    const index = startOffset + tokenNode.sourceIndex;
    const endIndex = startOffset + tokenNode.sourceEndIndex;
    const suggestedMatch = toSldsToken(oldValue);
    const message = messages.replace(oldValue, suggestedMatch);

    utils.report(<stylelint.Problem>{
      message,
      index,
      endIndex,
      ...basicReportProps,
      fix: ()=> {
        decl.value = decl.value.replace(oldValue, suggestedMatch);
      }
    });
  });
}

/**
 * 
 * Example:
 *  .THIS  .demo {
 *    --sds-c-border-radius: 50%;
 *  }
 * 
 */
function detectLeftSide(decl:Declaration, basicReportProps:Partial<stylelint.Problem>) {
  // Usage on left side
  const { prop } = decl;
  if (shouldIgnoreDetection(prop)) {
    // Ignore if entry not found in the list or the token is marked to use further
    return;
  }
  const startIndex = decl.toString().indexOf(prop);
  const endIndex = startIndex + prop.length;

  const suggestedMatch = toSldsToken(prop);
  const message = messages.replace(prop, suggestedMatch);

    utils.report(<stylelint.Problem>{
      message,
      index: startIndex,
      endIndex,
      ...basicReportProps,
      fix: () => decl.prop = decl.prop.replace(prop, suggestedMatch)
    });
}

const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, {severity = severityLevel as RuleSeverity, propertyTargets = []}={}) => {

  return (root: Root, result: PostcssResult) => {

    root.walkDecls((decl) => {
      if (!isTargetProperty(decl.prop, propertyTargets)) {
        return;
      }

      const basicReportProps = {
        node:decl,
        result,
        ruleName,
        severity,
      };

      detectRightSide(decl, basicReportProps);
      detectLeftSide(decl, basicReportProps);      
    });
  };
}

ruleFunction.ruleName = ruleName;
ruleFunction.meta = {
  url: 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#enforce-sds-to-slds-hooks',
  fixable: true
};

export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
