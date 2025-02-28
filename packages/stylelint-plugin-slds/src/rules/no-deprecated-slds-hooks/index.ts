import stylelint, { Rule, PostcssResult, RuleSeverity } from 'stylelint';
import { readFileSync } from 'fs';
import { Root } from 'postcss';
import { metadataFileUrl } from '../../utils/metaDataFileUrl';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
const { utils, createPlugin } = stylelint;
import {deprecatedHooks} from "@salesforce-ux/metadata-slds";

const ruleName: string = 'slds/no-deprecated-slds-hooks';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};
const messages = utils.ruleMessages(ruleName, {
  deprecated: (token: string) => replacePlaceholders(warningMsg, { token }),
  replaced: (oldToken: string, newToken: string) =>
    // Replace deprecated hook "${oldToken}" with "${newToken}"
    replacePlaceholders(errorMsg, { oldToken, newToken }),
});

function rule(primaryOptions: boolean, {severity = severityLevel as RuleSeverity}={}) {
  return (root: Root, result: PostcssResult) => {
    root.walkDecls((decl) => {
      const parsedPropertyValue = decl.prop;
      if (parsedPropertyValue.startsWith('--slds-c-')) {
        const proposedNewValue = deprecatedHooks[parsedPropertyValue];
        if (proposedNewValue && proposedNewValue !== 'null') {
          const index = decl.toString().indexOf(decl.prop);
          const endIndex = index + decl.prop.length;
          
          utils.report({
            message: messages.replaced(parsedPropertyValue, proposedNewValue),
            node: decl,
            index,
            endIndex,
            result,
            ruleName,
            severity,
          });

          if (result.stylelint.config.fix) {
            decl.prop = proposedNewValue;
          }
        }
        // else {
        //   utils.report({
        //     message: messages.deprecated(parsedPropertyValue),
        //     node: decl,
        //     result,
        //     ruleName
        //   });
        // }
      }
    });
  };
}

export default createPlugin(ruleName, rule as unknown as Rule);
