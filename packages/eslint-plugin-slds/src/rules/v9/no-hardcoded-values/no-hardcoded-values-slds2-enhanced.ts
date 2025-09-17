import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../../config/rule-messages.yml';
import { defineEnhancedNoHardcodedValueRule } from './enhancedNoHardcodedValueRule';

/**
 * Enhanced no-hardcoded-values-slds2 rule with context-aware analysis
 * 
 * This POC version provides:
 * - Component context analysis (HTML/CSS file bundle analysis)
 * - Intelligent suggestion scoring based on semantic context
 * - Rich violation reporting with contextual help
 * - Auto-fix capabilities for high-confidence suggestions
 */

const ruleName = 'no-hardcoded-values-slds2-enhanced';
const ruleConfig = ruleMessages['no-hardcoded-values-slds2']; // Reuse existing messages for POC
const { type, description, url, messages } = ruleConfig;

const valueToStylinghook = metadata.valueToStylingHooksCosmos;

export default defineEnhancedNoHardcodedValueRule({
  ruleConfig: {
    ...ruleConfig,
    // Enhanced messages for POC
    messages: {
      ...messages,
      contextualHardcodedValue: "Replace '{{oldValue}}' with '{{newValue}}' {{contextInfo}}. {{confidence}}% confidence based on {{reasons}}.",
      multipleOptions: "Replace '{{oldValue}}' - {{optionCount}} SLDS2 options available {{contextInfo}}. Top suggestion: {{topSuggestion}}.",
      noReplacementWithContext: "No direct SLDS2 replacement for '{{oldValue}}' {{contextInfo}}. Consider custom properties or design system consultation.",
      contextAnalysisError: "Replace '{{oldValue}}' with SLDS2 styling hook (context analysis unavailable)."
    }
  },
  valueToStylinghook,
  ruleName,
  enableContextAnalysis: true, // Enable context analysis for POC
}) as Rule.RuleModule;
