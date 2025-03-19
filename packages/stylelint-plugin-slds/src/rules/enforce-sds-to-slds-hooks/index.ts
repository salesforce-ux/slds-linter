import { globalSharedHooksMetadata } from "@salesforce-ux/metadata-slds";
import { Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';

const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/enforce-sds-to-slds-hooks';

const ruleInfo = ruleMetadata(ruleName);

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

// data
const allSldsHooks = [].concat(Object.keys(globalSharedHooksMetadata.global), Object.keys(globalSharedHooksMetadata.shared));

const toSldsToken = (sdsToken: string) => sdsToken.replace('--sds-', '--slds-')

function shouldIgnoreDetection(sdsToken: string) {
  // Ignore if entry not found in the list
  return (
    !sdsToken.startsWith('--sds-') || !allSldsHooks.includes(toSldsToken(sdsToken))
  );
}

function detectRightSide(decl, basicReportProps, autoFixEnabled){
  const parsedValue = valueParser(decl.value);
  // Usage on right side
  parsedValue.walk((node) => {
    if (node.type !== 'word' || !node.value.startsWith('--sds-')) {
      return;
    }

    const oldValue = node.value;

    if (shouldIgnoreDetection(oldValue)) {
      // Ignore if entry not found in the list or the token is marked to use further
      return;
    }

    const startIndex = decl.toString().indexOf(oldValue);
    const endIndex = startIndex + oldValue.length;
    const suggestedMatch = toSldsToken(oldValue);
    const message = replacePlaceholders(errorMsg, { 
      fullMatch: oldValue, 
      suggestedMatch
    });

    utils.report({
      message: JSON.stringify({message, suggestions:[suggestedMatch]}),
      index: startIndex,
      endIndex,
      ...basicReportProps,
    });

    if(autoFixEnabled){
      decl.value = decl.value.replace(oldValue, suggestedMatch)
    }
  });
}

function detectLeftSide(decl, basicReportProps, autoFixEnabled) {
  // Usage on left side
  const { prop } = decl;
  if (shouldIgnoreDetection(prop)) {
    // Ignore if entry not found in the list or the token is marked to use further
    return;
  }
  const startIndex = decl.toString().indexOf(prop);
  const endIndex = startIndex + prop.length;

  const suggestedMatch = toSldsToken(prop);
    const message = replacePlaceholders(errorMsg, { 
      fullMatch: prop, 
      suggestedMatch
    });

    utils.report({
      message: JSON.stringify({message, suggestions:[suggestedMatch]}),
      index: startIndex,
      endIndex,
      ...basicReportProps,
    });

    if(autoFixEnabled){
      decl.prop = decl.prop.replace(prop, suggestedMatch)
    }
}

function rule(primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) {
  return (root: Root, result: PostcssResult) => {

    const autoFixEnabled = result.stylelint.config.fix;

    root.walkDecls((decl) => {
      const basicReportProps = {
        node:decl,
        result,
        ruleName,
        severity,
      };

      detectRightSide(decl, basicReportProps, autoFixEnabled);
      detectLeftSide(decl, basicReportProps, autoFixEnabled);      
    });
  };
}


export default createPlugin(ruleName, rule as unknown as Rule);
