import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';

import metadata from '@salesforce-ux/sds-metadata';
import ruleMetadata from '../../utils/rulesMetadata';
import { getClassNodesFromSelector } from '../../utils/selector-utils';
import replacePlaceholders from '../../utils/util';
import { formatMessageWithSuggestions } from '../../../../shared-utils/src';
const { utils, createPlugin }: typeof stylelint = stylelint;
const sldsClasses = metadata.sldsClasses;

const ruleName: string = 'slds/no-slds-class-overrides';

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'No description provided',
} = ruleMetadata(ruleName) || {};

const sldsSet = new Set(sldsClasses);

function rule(primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) {
  return (root: Root, result: PostcssResult) => {

    root.walkRules((rule) => {
      const classNodes = getClassNodesFromSelector(rule.selector);
      const offsetIndex = rule.toString().indexOf(rule.selector);
      classNodes.forEach((classNode) => {
        if (!classNode.value.startsWith('slds-')) {
          // Ignore if the selector do not start with `slds-*`
          return;
        } else {
          //match against slds_classes.json entries. As of now we have 4k_ entries.
          if (sldsSet.has(classNode.value)) {
            const index = offsetIndex + classNode.sourceIndex + 1; // find selector in rule plus '.'
            const endIndex = index + classNode.value.length;
            utils.report({
              message: formatMessageWithSuggestions(
                replacePlaceholders(warningMsg, {
                  selector: `.${classNode.value}`
                }),
                []
              ),
              node: rule,
              result,
              ruleName,
              severity,
              index,
              endIndex,
            });
          }
        }
      });
    });
  };
}

export default createPlugin(ruleName, rule as unknown as Rule);
