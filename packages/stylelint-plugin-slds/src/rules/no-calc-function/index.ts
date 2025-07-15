import { Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import valueParser from 'postcss-value-parser';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import { isTargetProperty } from '../../utils/prop-utills';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName:string = 'slds/no-calc-function';


const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  disallowed: (property: string) =>
    replacePlaceholders(errorMsg,{property}),
});

function isCalcFunction(node:valueParser.Node): boolean{
  return (node.type === "function" && node.value === "calc" && node.nodes.length>0);
}

const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, {severity = severityLevel as RuleSeverity, propertyTargets = []}={}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      if (!isTargetProperty(decl.prop, propertyTargets)) {
        return;
      }

      const parsedValue = valueParser(decl.value);
      const startIndex = decl.toString().indexOf(decl.value);
      parsedValue.walk((node) => {
        if(!isCalcFunction(node)){
            return null;
        }
        const functionNode = node as valueParser.FunctionNode;
        utils.report({
          message: messages.disallowed(decl.prop),
          node: decl,
          index: startIndex + functionNode.sourceIndex,
          endIndex: startIndex + functionNode.sourceEndIndex,
          result,
          ruleName,
          severity
        });
      });
    });
  };
}

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: '',
  fixable: false
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
