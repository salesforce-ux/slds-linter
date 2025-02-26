import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName:string = 'slds/no-slds-private-var';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: (prop: string) =>
    replacePlaceholders(errorMsg,{prop}),
});



function rule(primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      if (decl.prop.startsWith('--_slds-')) {
        stylelint.utils.report({
          message: messages.expected(decl.prop),
          node: decl,
          result,
          ruleName,
          severity
        });

        // Optional: Call the fix method if in fixing context
        if (result.stylelint.config.fix) {
          fix(decl);
        }
      }
    });
  };
}

// Implement the fix method
function fix(decl: any): void {
  // Modify the declaration as needed, e.g., remove the deprecated variable or correct it
  decl.prop = decl.prop.replace('--_slds-', '--slds-');
}

export default createPlugin(ruleName, rule as unknown as Rule);
