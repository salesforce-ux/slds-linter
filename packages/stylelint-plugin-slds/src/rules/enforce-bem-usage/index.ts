import { bemNaming as bemMappings } from "@salesforce-ux/metadata-slds";
import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import { getClassNodesFromSelector } from '../../utils/selector-utils';
import replacePlaceholders from '../../utils/util';
import ruleMetadata from './../../utils/rulesMetadata';
const { createPlugin } = stylelint;

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

// Check if a selector might contain an AURA expression
const hasAuraExpression = (selector: string): boolean => {
  return selector.includes('{!') && selector.includes('}');
};

const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkRules((rule) => {
      let fixOffset = 0; // aggregate position change if using auto-fix, tracked at the rule level
      const ruleString = rule.toString();
      const startIndex = ruleString.indexOf(rule.selector);
      const classNodes = getClassNodesFromSelector(rule.selector);
      
      classNodes.forEach((classNode)=>{
        // check mapping data for this class name
        const newValue = bemMappings[classNode.value];
        if (newValue) {
          const index = startIndex + classNode.sourceIndex + (classNode.inAuraExpression ? 0 : 1); // adjust for AURA expressions
          const endIndex = index + classNode.value.length;
          
          const fix = () => {
            // Special handling for AURA expressions
            if (classNode.inAuraExpression) {
              // For classes in AURA expressions, we need to replace either:
              // 1. The class name with quotes: 'slds-class_name' or "slds-class_name"
              // 2. The class name in a string concatenation: + ' slds-class_name'
              
              // Check if the class is in a quoted context
              const singleQuotePattern = new RegExp(`'${classNode.value}'`);
              const doubleQuotePattern = new RegExp(`"${classNode.value}"`);
              
              if (singleQuotePattern.test(rule.selector)) {
                rule.selector = rule.selector.replace(
                  singleQuotePattern,
                  `'${newValue}'`
                );
              } else if (doubleQuotePattern.test(rule.selector)) {
                rule.selector = rule.selector.replace(
                  doubleQuotePattern,
                  `"${newValue}"`
                );
              } else {
                // For classes in concatenated strings, use word boundaries
                const wordBoundaryPattern = new RegExp(`\\b${classNode.value}\\b`, 'g');
                rule.selector = rule.selector.replace(
                  wordBoundaryPattern,
                  newValue
                );
              }
            } else {
              // Standard CSS selector fix
              rule.selector =
                rule.selector.substring(0, fixOffset + index) +
                newValue +
                rule.selector.substring(fixOffset + endIndex);
              fixOffset += newValue.length - (endIndex - index);
            }
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
