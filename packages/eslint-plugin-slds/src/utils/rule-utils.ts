import { Rule } from 'eslint';

/**
 * Check if a specific ESLint rule is enabled in the current configuration
 * @param context - ESLint rule context
 * @param ruleName - rule name
 * @returns true if the rule is enabled, false otherwise
 */
export function isRuleEnabled(context: Rule.RuleContext, ruleName: string): boolean {
  try {
    // get rules from context settings
    const rules: Record<string, any> = (context.settings?.sldsRules as Record<string, any>) || {};
    
    if (ruleName in rules) {
      const ruleConfig = rules[ruleName];
      
      // Extract severity: first element if array, otherwise the value itself
      const severity = Array.isArray(ruleConfig) ? ruleConfig[0] : ruleConfig;

      // ESLint rule severities: "off"/0 = disabled, "warn"/1 = enabled, "error"/2 = enabled
      if (severity === "off" || severity === 0 || severity === false) {
        return false;
      }
      return true;
    }
  } catch (error) {
    return false;
  }
}
