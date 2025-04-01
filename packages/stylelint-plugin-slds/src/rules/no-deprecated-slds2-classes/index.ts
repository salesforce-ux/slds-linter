import { sldsPlusMetadata } from "@salesforce-ux/metadata-slds";
import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import { getClassNodesFromSelector } from "../../utils/selector-utils";
const { utils, createPlugin } = stylelint;
const deprecatedSelectorsList = sldsPlusMetadata.bem.css.deprecated.selectors;



const ruleName:string = 'slds/no-deprecated-slds2-classes';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};
const messages = stylelint.utils.ruleMessages(ruleName, {
  deprecated: (selector: string) =>
    replacePlaceholders(errorMsg,{selector}),
});

function rule(primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) {
  return (root: Root, result: PostcssResult) => {
    root.walkRules((rule) => {
      const classNodes = getClassNodesFromSelector(rule.selector);
      const offsetIndex = rule.toString().indexOf(rule.selector);

      classNodes.forEach((classNode) => {
        if (!deprecatedSelectorsList.has(classNode.value)) {
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
