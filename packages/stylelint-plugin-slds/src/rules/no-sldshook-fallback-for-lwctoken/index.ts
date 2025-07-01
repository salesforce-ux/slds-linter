import { Declaration, Root } from 'postcss';
import stylelint, { PostcssResult, Rule, RuleSeverity } from 'stylelint';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import metadata from '@salesforce-ux/sds-metadata';
import { isTargetProperty } from '../../utils/prop-utills';
import { forEachVarFunction, getFallbackToken, getVarToken } from '../../utils/decl-utils';
import valueParser from 'postcss-value-parser';

const sldsPlusStylingHooks = metadata.sldsPlusStylingHooks;

// Generate values to hooks mapping using only global hooks
// shared hooks are private/ undocumented APIs, so they should not be recommended to customers
// Ref this thread: https://salesforce-internal.slack.com/archives/C071J0Q3FNV/p1743010620921339?thread_ts=1743009353.385429&cid=C071J0Q3FNV
const allSldsHooks = [...sldsPlusStylingHooks.global, ...sldsPlusStylingHooks.component];


const { utils, createPlugin }: typeof stylelint = stylelint;

const ruleName: string = 'slds/no-sldshook-fallback-for-lwctoken';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

const toSldsToken = (sdsToken: string='') => (sdsToken || '').replace('--sds-', '--slds-')

const messages = stylelint.utils.ruleMessages(ruleName, {
    expected: (lwcToken: string, sldsToken: string) => {
        return replacePlaceholders(warningMsg, { lwcToken, sldsToken })
    },
});

function hasUnsupportedFallback(lwcToken: string, sldsToken: string): boolean {
    const safeSldsToken = toSldsToken(sldsToken);
    return lwcToken && safeSldsToken 
    && lwcToken.startsWith('--lwc-') 
    && safeSldsToken.startsWith('--slds-') 
    && allSldsHooks.includes(safeSldsToken);
}

/**
 * 
 * Example:
 *  .THIS  .demo {
 *    color: var(--lwc-color-background-1, var(--sds-g-color-background-1));
 *  }
 * 
 */
function detectRightSide(decl: Declaration, basicReportProps: Partial<stylelint.Problem>) {

    forEachVarFunction(decl, (node: valueParser.FunctionNode, startOffset: number) => {
        const lwcToken = getVarToken(node);
        const sldsToken = getFallbackToken(node);

        if(!hasUnsupportedFallback(lwcToken, sldsToken)){
            return;
        }

        const index = startOffset + node.sourceIndex;
        const endIndex = startOffset + node.sourceEndIndex;
        const message = messages.expected(lwcToken, sldsToken);

        utils.report(<stylelint.Problem>{
            message,
            index,
            endIndex,
            ...basicReportProps
        });
    }, false);
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

