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
      
      if (Array.isArray(ruleConfig)) {
        return ruleConfig[0] === true;
      } else if (ruleConfig === false) {
        return false;
      } else if (ruleConfig !== undefined && ruleConfig !== null) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}
