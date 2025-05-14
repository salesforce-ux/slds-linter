import { Declaration, Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import metadata from '@salesforce-ux/sds-metadata';
import { formatMessageWithSuggestions } from '../../../../shared-utils/src';
const sldsPlusStylingHooks = metadata.sldsPlusStylingHooks;

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/enforce-sds-to-slds-hooks';

const ruleInfo = ruleMetadata(ruleName);

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
  const parsedValue = valueParser(decl.value);
  // Usage on right side
  parsedValue.walk((node) => {
    if (node.type !== 'word' || !node.value.startsWith('--sds-')) {
      return;
    }

    const oldValue = node.value;

    if (shouldIgnoreDetection(oldValue)) {
      // Ignore if entry not found in the list or the token is marked to use further
      return;
    }

    const startIndex = decl.toString().indexOf(oldValue);
    const endIndex = startIndex + oldValue.length;
    const suggestedMatch = toSldsToken(oldValue);
    const message = messages.replace(oldValue, suggestedMatch);

    utils.report(<stylelint.Problem>{
      message: formatMessageWithSuggestions(message, [suggestedMatch]),
      index: startIndex,
      endIndex,
      ...basicReportProps,
      fix: ()=> decl.value = decl.value.replace(oldValue, suggestedMatch)
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
      message: formatMessageWithSuggestions(message, [suggestedMatch]),
      index: startIndex,
      endIndex,
      ...basicReportProps,
      fix: () => decl.prop = decl.prop.replace(prop, suggestedMatch)
    });
}

const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) => {
  return (root: Root, result: PostcssResult) => {

    root.walkDecls((decl) => {
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
  url: '',
  fixable: true
};

export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
