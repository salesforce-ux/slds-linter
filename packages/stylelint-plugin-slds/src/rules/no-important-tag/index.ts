import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import { isTargetProperty } from '../../utils/prop-utills';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/no-important-tag';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};


const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity, propertyTargets = [] } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {

      if (decl.important && isTargetProperty(decl.prop, propertyTargets)) {
        const index = decl.toString().indexOf('!important');
        const endIndex = index + '!important'.length;          

        utils.report({
          message: warningMsg,
          node: decl,
          index,
          endIndex,
          result,
          ruleName,
          severity,
          fix: ()=>{
            decl.important = false;
          }
        });

      }
    });
  };
}

ruleFunction.ruleName = ruleName;
ruleFunction.meta = {
  url: 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-important-tag',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);