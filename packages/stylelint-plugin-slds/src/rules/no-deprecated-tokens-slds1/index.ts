import { Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
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

function isTokenFunction(node:valueParser.Node): boolean{
  return (node.type === "function" && (node.value === "token" || node.value === "t") && node.nodes.length>0);
}

function shouldIgnoreDetection(token: string):boolean {
  return (!(token in tokenMapping) || !tokenMapping[token].startsWith('--lwc-'))
}

function isAlreadyFixed(recommendation:string,functionNode:valueParser.FunctionNode, allNodes:valueParser.Node[]): boolean{
  const hasFixInFirstNode = allNodes[0].type == "word" && allNodes[0].value === recommendation;
  const isInFallback = allNodes.length > 1 && isTokenFunction(allNodes[allNodes.length - 1]) && functionNode === allNodes[allNodes.length - 1];
  const sourceIndexMatched = functionNode.sourceIndex === allNodes[allNodes.length - 1].sourceIndex
  return (hasFixInFirstNode || isInFallback) && sourceIndexMatched;
}

function transformTokenFunction(node:valueParser.Node, allNodes:valueParser.Node[]) {
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

  if(isAlreadyFixed(recommendation,functionNode,allNodes)){
    // Ignore if already fixed.
    return null;
  }
  replacement = `var(${recommendation}, ${valueParser.stringify(node)})`;

  return {cssVar, replacement, recommendation, original: valueParser.stringify(node), index, endIndex};
}


const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, {severity = severityLevel as RuleSeverity, propertyTargets = []}={})  => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      if (!isTargetProperty(decl.prop, propertyTargets)) {
        return;
      }

      const parsedValue = valueParser(decl.value);
      const startIndex = decl.toString().indexOf(decl.value);
      
      parsedValue.walk((node, i, allNodes) => {
        const data = transformTokenFunction(node, allNodes);

        if(data){
          const {cssVar, replacement, recommendation, original, index, endIndex} = data;
          const message = recommendation?messages.replaced(original, replacement):messages.deprecatedMsg;
          let fix = null;
          
          if(replacement){
            fix = () => {
              decl.value = decl.value.replace(original, replacement);
            }
          }
          
          stylelint.utils.report(<stylelint.Problem>{
            message,
            node: decl,
            result,
            ruleName,
            severity,
            index: index+startIndex, 
            endIndex: endIndex+startIndex, 
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
  url: '',
  fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);
