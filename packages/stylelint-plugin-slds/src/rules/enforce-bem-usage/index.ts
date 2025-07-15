import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import { getClassNodesFromSelector } from '../../utils/selector-utils';
import replacePlaceholders from '../../utils/util';
import ruleMetadata from './../../utils/rulesMetadata';
const { createPlugin } = stylelint;
import metadata from '@salesforce-ux/sds-metadata';
const bemMappings = metadata.bemNaming;

const ruleName: string = 'slds/enforce-bem-usage';

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'No description provided',
} = ruleMetadata(ruleName) || {};


const messages = stylelint.utils.ruleMessages(ruleName, {
  replaced: (oldValue: string, newValue: string) =>
    replacePlaceholders(errorMsg, { oldValue, newValue }),
  //`Consider updating '${oldValue}' to new naming convention '${newValue}'`,
});


const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkRules((rule) => {
      
      let fixOffset = 0; // aggregate position change if using auto-fix, tracked at the rule level
      const startIndex = rule.toString().indexOf(rule.selector);
      const classNodes = getClassNodesFromSelector(rule.selector);
      


      classNodes.forEach((classNode)=>{
        // check mapping data for this class name
        const newValue = bemMappings[classNode.value];
        if (newValue) {
          const index = startIndex + classNode.sourceIndex + 1; // find selector in rule plus '.'
          const endIndex = index + classNode.value.length;
          
          const fix = () => {
            rule.selector =
              rule.selector.substring(0, fixOffset + index) +
              newValue +
              rule.selector.substring(fixOffset + endIndex);
            fixOffset += newValue.length - (endIndex - index);
          };

          if (typeof newValue === 'string') {
            stylelint.utils.report({
              message: messages.replaced(classNode.value, newValue),
              node: rule,
              index,
              endIndex,
              result,
              ruleName,
              severity,
              fix,
            });
          }
        }        
      })
    });
  };
}

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: '',
  fixable: true
};

export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
