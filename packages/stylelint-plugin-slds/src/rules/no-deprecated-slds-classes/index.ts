import { deprecatedClasses } from "@salesforce-ux/metadata-slds";
import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import { getClassNodesFromSelector } from '../../utils/selector-utils';
import replacePlaceholders from '../../utils/util';

const { utils, createPlugin } = stylelint;

const ruleName: string = 'slds/no-deprecated-slds-classes';

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'No description provided',
} = ruleMetadata(ruleName) || {};
const messages = stylelint.utils.ruleMessages(ruleName, {
  deprecated: (className: string) =>
    replacePlaceholders(errorMsg, { className }),
});


function rule(primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) {
  return (root: Root, result: PostcssResult) => {
    
    const deprecatedClassesSet = new Set(deprecatedClasses);

    root.walkRules((rule) => {
      const classNodes = getClassNodesFromSelector(rule.selector);
      const offsetIndex = rule.toString().indexOf(rule.selector);
      classNodes.forEach((classNode) => {
        if (!deprecatedClassesSet.has(classNode.value)) {
          return;
        }
        const index = offsetIndex + classNode.sourceIndex + 1; // find selector in rule plus '.'
        const endIndex = index + classNode.value.length;
        utils.report({
          message: messages.deprecated(classNode.value),
          node: rule,
          result,
          ruleName,
          severity,
          index,
          endIndex
        });
      });
    });
  };
}

export default createPlugin(ruleName, rule as unknown as Rule);
