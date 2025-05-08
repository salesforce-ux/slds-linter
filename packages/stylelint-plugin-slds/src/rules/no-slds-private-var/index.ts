import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import { formatMessageWithSuggestions } from '../../../../shared-utils/src';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName:string = 'slds/no-slds-private-var';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: (prop: string) =>
    replacePlaceholders(warningMsg,{prop}),
});



const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      if (decl.prop.startsWith('--_slds-')) {
        const index = decl.toString().indexOf(decl.prop);
        const endIndex = index + decl.prop.length;
        stylelint.utils.report({
          message: formatMessageWithSuggestions(
            messages.expected(decl.prop),
            [decl.prop.replace("--_slds-", "--slds-")]
          ),
          node: decl,
          index,
          endIndex,
          result,
          ruleName,
          severity,
          fix:()=>{
            // Modify the declaration as needed, e.g., remove the deprecated variable or correct it
            decl.prop = decl.prop.replace('--_slds-', '--slds-');
          }
        });
      }
    });
  };
}

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: '',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);

