import { rulesMetadata } from 'slds-shared-utils';

// Define the structure of the rules
export interface Rule {
  name: string;
  severityLevel: string;
  warningMsg?: string;
  errorMsg?: string;
  ruleDesc: string;
}

// Define a type for the rules object
export type Rules = {
  [key: string]: Rule;
};

// Singleton class to manage rules
class RuleManager {
  private static instance: RuleManager;
  private rules: Rules;

  private constructor() {
    this.rules = rulesMetadata; // Directly use imported rulesMetadata
  }

  // Method to get the singleton instance
  public static getInstance(): RuleManager {
    if (!RuleManager.instance) {
      RuleManager.instance = new RuleManager();
    }
    return RuleManager.instance;
  }

  // Utility function to read values from the rules object
  public getRuleInfo(ruleKey: string): Rule | undefined {
    return {
      name: this.rules[ruleKey]?.name,
      severityLevel: this.rules[ruleKey]?.severityLevel,
      warningMsg: this.rules[ruleKey]?.warningMsg,
      errorMsg: this.rules[ruleKey]?.errorMsg,
      ruleDesc: this.rules[ruleKey]?.ruleDesc,
    };
  }
}

// Function to get rule metadata
export default function ruleMetadata(ruleId: string) {

  const ruleManager = RuleManager.getInstance();
  return ruleManager.getRuleInfo(ruleId);

}

// // Example usage
// const ruleManager = RuleManager.getInstance();

// console.log(ruleManager.getSeverity("enforce-bem-usage")); // ✅ Output: "error"
// console.log(ruleManager.getWarningMsg("no-hardcoded-values-slds1")); // ✅ Output: Corresponding warning message

