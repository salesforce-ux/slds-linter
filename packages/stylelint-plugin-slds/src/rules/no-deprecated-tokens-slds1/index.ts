import { Declaration, Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMetadata from '../../utils/rulesMetadata';
import { replacePlaceholders, forEachTokenFunction, getTokenFunctionNode, isTokenFunction } from 'slds-shared-utils';
import { isTargetProperty } from '../../utils/prop-utills';
const { utils, createPlugin }: typeof stylelint = stylelint;
const ruleName: string = 'slds/no-deprecated-tokens-slds1';
const tokenMapping = metadata.auraToLwcTokensMapping;

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  deprecatedMsg: "Update outdated design tokens to SLDS 2 styling hooks with similar values. For more information, see Styling Hooks on lightningdesignsystem.com.", //no deprecatedMsg avalaible in doc
  replaced: (oldValue: string, newValue: string) =>
    replacePlaceholders(warningMsg, { oldValue, newValue }),
});

function shouldIgnoreDetection(token: string):boolean {
  return (!(token in tokenMapping) || !tokenMapping[token].startsWith('--lwc-'))
}


function transformTokenFunction(node:valueParser.Node) {
  if(!isTokenFunction(node)){
    return null;
  }
  const functionNode = node as valueParser.FunctionNode;
  let cssVarNode = functionNode.nodes[0];
  let cssVar = cssVarNode.value;

  if (shouldIgnoreDetection(cssVar)) {
    return null;
  }

  const index = cssVarNode.sourceIndex;
  const endIndex = cssVarNode.sourceEndIndex;
  let replacement:string;
  const recommendation:string = tokenMapping[cssVar];

  replacement = `var(${recommendation}, ${valueParser.stringify(node)})`;

  return {cssVar, replacement, recommendation, original: valueParser.stringify(node), index, endIndex};
}


const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, {severity = severityLevel as RuleSeverity, propertyTargets = []}={})  => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      if (!isTargetProperty(decl.prop, propertyTargets)) {
        return;
      }

      forEachTokenFunction(decl, (node, startOffset) => {
        const data = transformTokenFunction(node);
        if(data){
          const {cssVar, replacement, recommendation, original, index, endIndex} = data;
          const message = recommendation?messages.replaced(original, replacement):messages.deprecatedMsg;
          let fix = null;
          
          if(replacement){
            fix = () => {
              const functionNode = getTokenFunctionNode(decl, original);
              if(!functionNode){
                return;
              }
              const valueStartIndex = functionNode.sourceIndex;
              const valueEndIndex = functionNode.sourceEndIndex;
              decl.value = decl.value.slice(0, valueStartIndex) + replacement + decl.value.slice(valueEndIndex);
            }
          }
          
          stylelint.utils.report(<stylelint.Problem>{
            message,
            node: decl,
            result,
            ruleName,
            severity,
            index: index+startOffset, 
            endIndex: endIndex+startOffset, 
            fix
          });
        }
      });
    });
  };
}

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
  url: 'https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html#no-deprecated-tokens-slds1',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
