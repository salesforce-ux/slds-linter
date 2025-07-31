import { Declaration, Root } from 'postcss';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import metadata from '@salesforce-ux/sds-metadata';
const slds1DeprecatedComponentHooks = metadata.slds1DeprecatedComponentHooks;

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/enforce-component-hook-naming-convention';

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'Replace component styling hooks that use a deprecated naming convention.',
} = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  replace: (oldValue: string, suggestedMatch: string) =>
    replacePlaceholders(errorMsg, {
      oldValue,
      suggestedMatch,
    }),
});

function shouldIgnoreDetection(hook: string) {
  // Ignore if entry not found in the list
  return (
    !hook.startsWith('--slds-c-') || !(hook in slds1DeprecatedComponentHooks)
  );
}
/**
 * Example:
 *  .THIS .demo {
 *    --slds-c-button-color-border: 50%;
 *  }
 */
function detectLeftSide(
  decl: Declaration,
  basicReportProps: Partial<stylelint.Problem>
) {

  // Usage on left side
  const { prop } = decl;
  if (shouldIgnoreDetection(prop)) {
    return;
  }
  const startIndex = decl.toString().indexOf(prop);
  const endIndex = startIndex + prop.length;
  const suggestedMatch = slds1DeprecatedComponentHooks[prop];
  const message = messages.replace(prop, suggestedMatch);
  utils.report(<stylelint.Problem>{
    message,
    index: startIndex,
    endIndex,
    ...basicReportProps,
    fix: () => (decl.prop = decl.prop.replace(prop, suggestedMatch)),
  });
}

const ruleFunction: Partial<stylelint.Rule> = (
  primaryOptions: boolean,
  { severity = severityLevel as RuleSeverity } = {}
) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      const basicReportProps = {
        node: decl,
        result,
        ruleName,
        severity,
      };
      detectLeftSide(decl, basicReportProps);
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.meta = {
  url: 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#enforce-component-hook-naming-convention',
  fixable: true
};

export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
