const rulesMetadata = {
  //eslint
  "slds/enforce-bem-class": {
    name: "slds/enforce-bem-class", // BEM - Double Dash to BEM Notation
    severityLevel: "error",
    ruleDesc:
      "Replace BEM double-dash syntax in class names with single underscore syntax.",
  },

  "slds/modal-close-button-issue": {
    name: "slds/modal-close-button-issue",
    severityLevel: "error",
    ruleDesc:
      "Ensure SLDS modal compliance by enforcing correct button and icon attributes.",
  },

  "slds/no-deprecated-classes-slds2": {
    name: "slds/no-deprecated-classes-slds2",
    severityLevel: "error",
    ruleDesc:
      "Replace classes that aren’t available with SLDS 2 classes. See lightningdesignsystem.com for more info.",
  },

  // CHECKED
  "length-zero-no-unit": {
    name: "length-zero-no-unit",
    severityLevel: "warning",
    ruleDesc: "Disallow units for zero lengths.",
  },

  "slds/enforce-bem-usage": {
    name: "slds/enforce-bem-usage", // BEM - Double Dash to BEM Notation
    severityLevel: "warning",
    warningMsg:
      "The ${oldValue} class doesn’t follow the correct BEM naming convention. Update it to ${newValue}",
    errorMsg:
      "${oldValue} has been retired. Update it to the new name ${newValue}",
    ruleDesc:
      "Replace BEM double-dash syntax in class names with single underscore syntax.",
  },

  // Checked
  "slds/no-hardcoded-values-slds1": {
    name: "slds/no-hardcoded-values-slds1", //DESIGN_TOKEN - Design Token
    severityLevel: "warning",
    //suggestedMsg: `There’s no replacement styling hook for the ${oldValue} static value. Remove the static value.` //TODO: How to handle this scenario.
    warningMsg:
      "Replace the ${oldValue} static value with an SLDS 1 styling hook: ${newValue}.",
    errorMsg:
      "Replace the ${color} static value with an SLDS 1 styling hook: ${stylingHook}.",
    ruleDesc:
      "Replace static values with SLDS 1 design tokens. For more information, look up design tokens on lightningdesignsystem.com.",
  },
  "slds/no-hardcoded-values-slds2": {
    name: "slds/no-hardcoded-values-slds2",
    severityLevel: "warning",
    // suggestedMsg:
    //   "There’s no replacement SLDS 2 styling hook for the ${oldValue} static value. Remove the static value.",
    warningMsg:
      "Consider replacing the ${oldValue} static value with an SLDS 2 styling hook that has a similar value: ${newValue}",
    errorMsg:
      "Consider replacing the ${oldValue} static value with an SLDS 2 styling hook that has a similar value: ${newValue}",
    ruleDesc:
      "Replace static values with SLDS 2 styling hooks. For more information, look up design tokens on lightningdesignsystem.com.",
  },

  // CHECKED
  "slds/no-slds-class-overrides": {
    //OVERRIDE -- SLDS Classes Override
    name: "slds/no-slds-class-overrides",
    severityLevel: "warning",
    warningMsg:
      "Overriding ${selector} isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button",
    errorMsg:
      "Overriding ${selector} isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button",
    ruleDesc:
      "Create new custom CSS classes instead of overriding SLDS selectors. For more information, see the Lightning Web Components Developer Guide.",
  },

  // CHECKED --- TODO:Kishore do we still need this?
  "slds/no-deprecated-tokens-slds1": {
    name: "slds/no-deprecated-tokens-slds1",
    severityLevel: "warning",
    //deprecatedMsg: "Aura tokens are deprecated. Please migrate to SLDS Design Tokens.",
    warningMsg:
      "Consider removing ${oldValue} or replacing it with ${newValue}. Set the fallback to ${oldValue}. For more info, see Styling Hooks on lightningdesignsystem.com.",
    errorMsg:
      "Consider removing ${oldValue} or replacing it with ${newValue}. Set the fallback to ${oldValue}. For more info, see Styling Hooks on lightningdesignsystem.com.",
    ruleDesc:
      "Update outdated design tokens to SLDS 2 styling hooks with similar values. For more information, see Styling Hooks on lightningdesignsystem.com.",
  },

  "slds/lwc-token-to-slds-hook": {
    name: "slds/lwc-token-to-slds-hook",
    severityLevel: "warning",
    warningMsg:
      "${oldValue} design token is deprecated in SLDS 1 and is not present in SLDS 2.",
    errorMsg:
      "The ${oldValue} design token is deprecated. Replace it with the SLDS 2 ${newValue} styling hook and set the fallback to ${oldValue}. For more info, see Global Styling Hooks on lightningdesignsystem.com.",
    ruleDesc:
      "Replace the deprecated --lwc tokens with the latest --slds tokens. See lightningdesignsystem.com for more info.",
  },

  "slds/enforce-sds-to-slds-hooks": {
    name: "slds/enforce-sds-to-slds-hooks",
    severityLevel: "warning",
    warningMsg: "Replace ${fullMatch} with ${suggestedMatch} styling hook.",
    errorMsg: "Replace ${fullMatch} with ${suggestedMatch} styling hook.",
    ruleDesc:
      "Convert your existing --sds styling hooks to --slds styling hooks. See lightningdesignsystem.com for more info.",
  },
  // Needs CX review
  "slds/no-deprecated-slds2-classes": {
    name: "slds/no-deprecated-slds2-classes",
    severityLevel: "warning",
    warningMsg:
      "Selector: ${selector} is no longer available in SLDS2. Please update to a supported selector.",
    errorMsg:
      "Selector: ${selector} is no longer available in SLDS2. Please update to a supported selector.",
    ruleDesc:
      "We’ve found code that’s not currently compatible with the Cosmos.",
  },

  // New rules
  "slds/no-invalid-tokens": {
    // INVALID -- Invalid Token and Class (WARNING)
    name: "slds/no-invalid-tokens",
    severityLevel: "error",
    warningMsg:
      "Consider removing ${oldValue}, or updating to a design token with a corresponding value. To avoid breaking changes, replace it with ${newValue} styling hook. Set the fallback to ${oldValue}. For more info, read Design Tokens on lightningdesignsystem.com.\n\nOld Value: ${oldValue}\nNew Value: ${newValue}\n",
    errorMsg:
      "Consider removing ${oldValue}, or updating to a design token with a corresponding value. To avoid breaking changes, replace it with ${newValue} styling hook. Set the fallback to ${oldValue}. For more info, read Design Tokens on lightningdesignsystem.com.\n\nOld Value: ${oldValue}\nNew Value: ${newValue}\n",
    ruleDesc:
      "Please update to a design token or class with corresponding value",
  },
  "slds/reduce-annotations": {
    name: "slds/no-annotation-rule",
    severityLevel: "warning",
    warningMsg:
      "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/",
    errorMsg:
      "Remove this annotation and update the code to SLDS best practices. For help, file an issue at https://github.com/salesforce-ux/slds-linter/",
    ruleDesc: "Remove your annotations and update your code.",
  },

  // Do We need these rules??
  "slds/no-important-tag": {
    name: "slds/no-important-tag",
    severityLevel: "warning",
    warningMsg: "Avoid using '!important' unless absolutely necessary.",
    errorMsg: "Avoid using '!important' unless absolutely necessary.",
    ruleDesc: "Avoid using '!important' unless absolutely necessary.",
  },
  "slds/no-slds-private-var": {
    name: "slds/no-slds-private-var",
    severityLevel: "warning",
    warningMsg:
      "This styling hook is reserved for internal Salesforce use. Remove the --_slds- or –slds-s private variable within selector ${prop}. For more information, look up private CSS in lightningdesignsystem.com.",
    errorMsg:
      "This styling hook is reserved for internal Salesforce use. Remove the --_slds- or –slds-s private variable within selector ${prop}. For more information, look up private CSS in lightningdesignsystem.com.",
    ruleDesc:
      "Some SLDS styling hooks are private and reserved only for internal Salesforce use. Private SLDS styling hooks have prefixes --_slds- and --slds-s-.  For more information, look up private CSS in lightningdesignsystem.com.",
  },

  // Needs CX review
  "slds/no-unsupported-hooks-slds2": {
    name: "slds/no-unsupported-hooks-slds2",
    severityLevel: "warning",
    warningMsg:
      "The ${token} styling hook isn’t present in SLDS 2 and there\'s no equivalent replacement. Remove it or replace it with a styling hook with a similar effect.",
    errorMsg:
      "Replace deprecated ${oldStylingHook} styling hook with ${newStylingHook}.",
    ruleDesc:
      "Replace deprecated --slds styling hooks. See lightningdesignsystem.com for more info.",
  },
  "slds/no-deprecated-slds-classes": {
    name: "slds/no-deprecated-slds-classes",
    severityLevel: "warning",
    warningMsg:
      "The class ${className} is deprecated and not available in SLDS2. Please update to a supported class.",
    errorMsg:
      "The class ${className} is deprecated and not available in SLDS2. Please update to a supported class.",
    ruleDesc: "Please replace the deprecated classes with a modern equivalent",
  },

  // Needs CX review
  "slds/no-calc-function": {
    name: "slds/no-calc-function",
    severityLevel: "warning",
    warningMsg: "Don’t use the calc() function in the property ${property}.",
    errorMsg: "Don’t use the calc() function in the property ${property}.",
    ruleDesc: "Avoid using calc() functions.",
  },
} as const; // Ensures it's a readonly object

export default rulesMetadata;
