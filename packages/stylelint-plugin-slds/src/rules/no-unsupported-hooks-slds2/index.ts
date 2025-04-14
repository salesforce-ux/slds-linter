import { MetadataService, MetadataFile, DeprecatedStylingHooks } from '../../services/metadata.service';
import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
const { utils, createPlugin } = stylelint;

const deprecatedHooks = new Set(MetadataService.loadMetadata<DeprecatedStylingHooks>(MetadataFile.DEPRECATED_STYLING_HOOKS));

const ruleName: string = 'slds/no-unsupported-hooks-slds2';

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'No description provided',
} = ruleMetadata(ruleName) || {};
const messages = utils.ruleMessages(ruleName, {
  deprecated: (token: string) => replacePlaceholders(warningMsg, { token }),
  replaced: (token: string, newToken: string) =>
    // Replace deprecated hook ${oldStylingHook} with ${newStylingHook}
    replacePlaceholders(errorMsg, { token, newToken }),
});

const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      const parsedPropertyValue = decl.prop;
      if (parsedPropertyValue.startsWith('--slds-c-')  && deprecatedHooks.has(parsedPropertyValue)) {
        const index = decl.toString().indexOf(decl.prop);
        const endIndex = index + decl.prop.length;
        /*const proposedNewValue = deprecatedHooks[parsedPropertyValue];
        if (proposedNewValue && proposedNewValue !== 'null') {
          const index = decl.toString().indexOf(decl.prop);
          const endIndex = index + decl.prop.length;

          utils.report({
            message: JSON.stringify({message: messages.replaced(parsedPropertyValue, proposedNewValue), suggestions:[proposedNewValue]}),
            node: decl,
            index,
            endIndex,
            result,
            ruleName,
            severity,
            fix:()=>{
              decl.prop = proposedNewValue;
            }
          });
          
        } else {*/
          utils.report({
            message: JSON.stringify({message: messages.deprecated(parsedPropertyValue), suggestions:[]}),
            node: decl,
            index,
            endIndex,
            result,
            ruleName,
          });
        //}
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
