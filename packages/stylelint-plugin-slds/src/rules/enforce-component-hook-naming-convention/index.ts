import { Declaration, Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import metadata from '@salesforce-ux/sds-metadata';
const slds1DeprecatedComponentHooks = metadata.deprecatedStylingHooks;

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/enforce-component-hook-naming-convention';

const ruleInfo = ruleMetadata(ruleName);

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'No description provided',
} = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  replace: (oldValue: string, suggestedMatch: string) =>
    replacePlaceholders(errorMsg, {
      fullMatch: oldValue,
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
 *    border: 1px solid var(--slds-c-button-color-border));
 *  }
 */
function detectRightSide(
  decl: Declaration,
  basicReportProps: Partial<stylelint.Problem>
) {
  const parsedValue = valueParser(decl.value);
  // Usage on right side
  parsedValue.walk((node) => {
    if (node.type !== 'word' || !node.value.startsWith('--slds-c-')) {
      return;
    }

    const oldValue = node.value;

    if (shouldIgnoreDetection(oldValue)) {
      return;
    }

    const startIndex = decl.toString().indexOf(oldValue);
    const endIndex = startIndex + oldValue.length;
    const suggestedMatch = slds1DeprecatedComponentHooks[oldValue];
    const message = messages.replace(oldValue, suggestedMatch);

    utils.report(<stylelint.Problem>{
      message: JSON.stringify({ message, suggestions: [suggestedMatch] }),
      index: startIndex,
      endIndex,
      ...basicReportProps,
      fix: () => (decl.value = decl.value.replace(oldValue, suggestedMatch)),
    });
  });
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
    message: JSON.stringify({ message, suggestions: [suggestedMatch] }),
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

      detectRightSide(decl, basicReportProps);
      detectLeftSide(decl, basicReportProps);
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.meta = {
  url: '',
  fixable: true,
};

export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
