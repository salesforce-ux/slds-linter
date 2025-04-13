import { MetadataService, MetadataFile, LwcToSldsTokensMapping } from '../../services/metadata.service';
import { Declaration, Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, Rule, RuleContext, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';

const { createPlugin }: typeof stylelint = stylelint;
const lwcToSlds = MetadataService.loadMetadata<LwcToSldsTokensMapping>(MetadataFile.LWC_TO_SLDS);
const ruleName: string = 'slds/lwc-token-to-slds-hook';

const {
  severityLevel = 'error',
  warningMsg = '',
  errorMsg = '',
  ruleDesc = 'No description provided',
} = ruleMetadata(ruleName) || {};
// Define messages for reporting
const messages = stylelint.utils.ruleMessages(ruleName, {
  replaced: (oldValue: string, newValue: string) =>
    replacePlaceholders(errorMsg, { oldValue, newValue }),
  warning: (oldValue: string) => replacePlaceholders(warningMsg, { oldValue }),

  errorWithStyleHooks: (oldValue, newValue) =>
    `The '${oldValue}' design token is deprecated. Replace it with the SLDS 2 '${newValue}' styling hook and set the fallback to '${oldValue}'. For more info, see Global Styling Hooks on lightningdesignsystem.com.`,
  //Need review
  errorWithNoRecommendation: (oldValue) =>
    `The '${oldValue}' design token is deprecated. For more info, see the New Global Styling Hook Guidance on lightningdesignsystem.com.`,
});

function shouldIgnoreDetection(lwcToken: string) {
  // Ignore if entry not found in the list or the token is marked to use further
  return (
    !lwcToken.startsWith('--lwc-') ||
    !(lwcToken in lwcToSlds) ||
    lwcToSlds[lwcToken].continueToUse
  );
}

function getRecommendation(lwcToken: string) {
  const oldValue = lwcToken;
  const recommendation = lwcToSlds[oldValue].replacement;
  const hasRecommendation = recommendation && recommendation !== '--';
  return {hasRecommendation, recommendation};
}

function isVarFunction(node:valueParser.Node): boolean{
  return (node.type === "function" && node.value === "var" && node.nodes.length>0);
}

function isAlreadyFixed(recommendation:string,functionNode:valueParser.FunctionNode, allNodes:valueParser.Node[]): boolean{
  const hasFixInFirstNode = allNodes[0].type == "word" && allNodes[0].value === recommendation;
  const sourceIndexMatched = functionNode.sourceIndex === allNodes[allNodes.length - 1].sourceIndex
  return hasFixInFirstNode&& sourceIndexMatched;
}

function getReportMessage(cssVar:string, recommendation:string|string[]):string{
  if (!recommendation) {
    // Found a deprecated token but don't have any alternate recommendation then just report user to follow docs
    return messages.errorWithNoRecommendation(cssVar);
  } else if(Array.isArray(recommendation)){
    return messages.errorWithStyleHooks(cssVar, recommendation.join(' or '));   
  }

  return messages.errorWithStyleHooks(cssVar, recommendation);
}

function transformVarFunction(node:valueParser.Node, allNodes:valueParser.Node[]) {
  if(!isVarFunction(node)){
    return null;
  }
  const functionNode = node as valueParser.FunctionNode;
  let cssVarNode = functionNode.nodes[0];
  let hasFallback = functionNode.nodes.length > 2; // Checking if fallback exists
  let cssVar = cssVarNode.value;

  if (shouldIgnoreDetection(cssVar)) {
    return null;
  }

  const index = cssVarNode.sourceIndex;
  const endIndex = cssVarNode.sourceEndIndex;
  let replacement:string;

  let {hasRecommendation, recommendation} = getRecommendation(cssVar);
  if (hasRecommendation) {
    if(typeof recommendation ==='string' && recommendation.startsWith('--slds-')){
      
      if(isAlreadyFixed(recommendation,functionNode,allNodes)){ 
        // Ignore if already fixed.
        return null;
      }
      replacement = hasFallback
      ? `var(${recommendation}, var(${cssVar}, ${valueParser.stringify(functionNode.nodes.slice(2))}))`
      : `var(${recommendation}, var(${cssVar}))`;
    }
  } else {
    recommendation = null;
  }
  return {cssVar, replacement, recommendation, original: valueParser.stringify(node), index, endIndex};
}

/**
 * 
 * Example:
 *  .THIS  .demo {
 *    border-top: 1px solid var(--lwc-colorBorder, var(--lwc-colorBrandDarker, red));
 *  }
 * 
 */
function detectRightSide(decl:Declaration, basicReportProps:Partial<stylelint.Problem>) {
  const parsedValue = valueParser(decl.value);
  const startIndex = decl.toString().indexOf(decl.value);
  // Usage on right side
  parsedValue.walk((node, i, allNodes) => {
    const result = transformVarFunction(node, allNodes);
    if(result){
      const {cssVar, replacement, recommendation, original, index, endIndex} = result;
      const message = getReportMessage(cssVar, recommendation);
      let fix = null;
      
      if(replacement){
        fix = () => {
          decl.value = decl.value.replace(original, replacement);
        }
      }
      
      stylelint.utils.report(<stylelint.Problem>{
        message,
        ...basicReportProps,
        index: index+startIndex, endIndex: endIndex+startIndex, fix
      });
    }
  });
}

/**
 * 
 * Example:
 * 
 *.THIS {
 *     --lwc-colorBorder: #f73650;
 * }
 * 
 */
function detectLeftSide(decl:Declaration, basicReportProps:Partial<stylelint.Problem>) {
  // Usage on left side
  const { prop } = decl;
  if (shouldIgnoreDetection(prop)) {
    return;
  }

  const startIndex = decl.toString().indexOf(prop);
  const endIndex = startIndex + prop.length;
  const reportProps = {
    index: startIndex,
    endIndex,
    ...basicReportProps,
  };
  const {hasRecommendation, recommendation} = getRecommendation(prop);
  // for any raw values, color-mix, calc just recommend as deprecated, suggest only if recommendation is string or array of strings
  const canSuggest = (hasRecommendation && (Array.isArray(recommendation) || recommendation.startsWith('--slds-')));
  reportProps.message = getReportMessage(prop, canSuggest?recommendation:null);
  if(typeof recommendation ==='string' && recommendation.startsWith('--slds-')){
    reportProps.fix = () => {
      decl.prop = recommendation;
    }
  }

  stylelint.utils.report(<stylelint.Problem>reportProps);
}

// Define the main rule logic
const ruleFunction:Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity } = {}) => {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((node) => {
      const basicReportProps:Partial<stylelint.Problem> = {
        node,
        result,
        ruleName,
        severity,
      };
      detectRightSide(node, basicReportProps);
      detectLeftSide(node, basicReportProps);
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

