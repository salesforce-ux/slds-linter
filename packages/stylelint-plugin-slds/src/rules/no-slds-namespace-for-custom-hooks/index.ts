import { Declaration, Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import { replacePlaceholders, forEachVarFunction } from 'slds-shared-utils';
import metadata from '@salesforce-ux/sds-metadata';
import { isTargetProperty } from '../../utils/prop-utills';
import valueParser from 'postcss-value-parser';

const sldsPlusStylingHooks = metadata.sldsPlusStylingHooks;

// Generate values to hooks mapping using only global hooks
// shared hooks are private/ undocumented APIs, so they should not be recommended to customers
// Ref this thread: https://salesforce-internal.slack.com/archives/C071J0Q3FNV/p1743010620921339?thread_ts=1743009353.385429&cid=C071J0Q3FNV
const allSldsHooks = [...sldsPlusStylingHooks.global, ...sldsPlusStylingHooks.component];


const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/no-slds-namespace-for-custom-hooks';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

const toSldsToken = (sdsToken: string) => sdsToken.replace('--sds-', '--slds-')

const messages = stylelint.utils.ruleMessages(ruleName, {
    expected: (token: string) => {
        const tokenWithoutNamespace = token.replace('--slds-', '').replace('--sds-', '');
        return replacePlaceholders(warningMsg, { token, tokenWithoutNamespace })
    },
});

function shouldIgnoreDetection(sdsToken: string) {
    // Ignore if entry found in the list or not starts with reserved namespace
    if(sdsToken.startsWith('--sds-') || sdsToken.startsWith('--slds-')){
        return allSldsHooks.includes(toSldsToken(sdsToken))
    }
    return true;
}

/**
 * 
 * Example:
 *  .THIS  .demo {
 *    border: 1px solid var(--slds-my-own-token));
 *  }
 * 
 */
function detectRightSide(decl: Declaration, basicReportProps: Partial<stylelint.Problem>) {

    forEachVarFunction(decl, (node: valueParser.FunctionNode, startOffset: number) => {
        const tokenNode = node.nodes[0];
        const oldValue = tokenNode.value;
        if (shouldIgnoreDetection(oldValue)) {
            // Ignore if entry not found in the list or the token is marked to use further
            return;
        }

        const index = startOffset + tokenNode.sourceIndex;
        const endIndex = startOffset + tokenNode.sourceEndIndex;
        const message = messages.expected(oldValue);

        utils.report(<stylelint.Problem>{
            message,
            index,
            endIndex,
            ...basicReportProps
        });
    });
}

/**
 * 
 * Example:
 *  .THIS  .demo {
 *    --slds-my-own-token: 50%;
 *  }
 * 
 */
function detectLeftSide(decl: Declaration, basicReportProps: Partial<stylelint.Problem>) {
    // Usage on left side
    const { prop } = decl;
    if (shouldIgnoreDetection(prop)) {
        // Ignore if entry not found in the list or the token is marked to use further
        return;
    }
    const startIndex = decl.toString().indexOf(prop);
    const endIndex = startIndex + prop.length;

    const message = messages.expected(prop);

    utils.report(<stylelint.Problem>{
        message,
        index: startIndex,
        endIndex,
        ...basicReportProps
    });
}


const ruleFunction: Partial<stylelint.Rule> = (primaryOptions: boolean, { severity = severityLevel as RuleSeverity, propertyTargets = [] } = {}) => {

    return (root: Root, result: PostcssResult) => {

        root.walkDecls((decl) => {
            if (!isTargetProperty(decl.prop, propertyTargets)) {
                return;
            }

            const basicReportProps = {
                node: decl,
                result,
                ruleName,
                severity,
            };

            detectRightSide(decl, basicReportProps);
            detectLeftSide(decl, basicReportProps);
        });
    };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = {
    url: '',
    fixable: true
};

// Export the plugin
export default createPlugin(ruleName, <stylelint.Rule>ruleFunction);

