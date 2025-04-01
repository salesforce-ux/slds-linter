import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/no-important-tag';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};


const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      if (decl.important) {
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
  url: '',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);