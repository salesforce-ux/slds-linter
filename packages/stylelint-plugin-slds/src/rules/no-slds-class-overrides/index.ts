import { Root } from 'postcss';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';

import metadata from '@salesforce-ux/sds-metadata';
import ruleMetadata from '../../utils/rulesMetadata';
import { getClassNodesAtEnd } from '../../utils/selector-utils';
import replacePlaceholders from '../../utils/util';
const { utils, createPlugin }: typeof stylelint = stylelint;
const sldsClasses = metadata.sldsPlusClasses;

const ruleName: string = 'slds/no-slds-class-overrides';

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'No description provided',
} = ruleMetadata(ruleName) || {};

const sldsSet = new Set(sldsClasses);

const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: (selector: string) => {
      return replacePlaceholders(warningMsg, {selector})
  },
});


const ruleFunction: Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {

    root.walkRules((rule) => {
      const classNodes = getClassNodesAtEnd(rule.selector);
      const offsetIndex = rule.toString().indexOf(rule.selector);
      classNodes.forEach((classNode) => {
        if (!classNode.value.startsWith('slds-') || !sldsSet.has(classNode.value)) {
          // Ignore if the selector do not start with `slds-*` or is not in cosmos
          return;
        } 
        const index = offsetIndex + classNode.sourceIndex + 1; // find selector in rule plus '.'  
        const endIndex = index + classNode.value.length;
        utils.report({
          message: messages.expected(classNode.value),
          node: rule,
          result,
          ruleName,
          severity,
          index,
          endIndex,
        });
      });
    });
  };
}

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-slds-class-overrides',
  fixable: false
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
