const { RuleTester } = require("eslint");
const rule = require("../../src/rules/enforce-bem-usage");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("enforce-bem-usage (react)", rule, {
  valid: [
    {
      code: `const A = () => <div className="block__element_modifier" />;`,
      filename: "test.tsx",
    },
    {
      code: `const A = () => <div className="my-custom-class" />;`,
      filename: "test.jsx",
    },
    {
      // Deprecated BEM value is owned by no-deprecated-classes-slds2, not this rule
      code: `const A = () => <div className="slds-action-overflow--touch" />;`,
      filename: "test.tsx",
    },
  ],
  invalid: [
    {
      code: `const A = () => <div className="slds-container--medium" />;`,
      filename: "test.tsx",
      output: `const A = () => <div className="slds-container_medium" />;`,
      errors: [{ messageId: "bemDoubleDash" }],
    },
    {
      code: `const A = () => <div className={"slds-container--medium"} />;`,
      filename: "test.tsx",
      output: `const A = () => <div className={"slds-container_medium"} />;`,
      errors: [{ messageId: "bemDoubleDash" }],
    },
    {
      code: "const A = () => <div className={`slds-container--medium ${x}`} />;",
      filename: "test.tsx",
      output: "const A = () => <div className={`slds-container_medium ${x}`} />;",
      errors: [{ messageId: "bemDoubleDash" }],
    },
    {
      code: `const A = () => <div className={clsx("slds-container--medium", cond)} />;`,
      filename: "test.tsx",
      output: `const A = () => <div className={clsx("slds-container_medium", cond)} />;`,
      errors: [{ messageId: "bemDoubleDash" }],
    },
    {
      code: `const A = () => <div className={clsx({ "slds-container--medium": cond })} />;`,
      filename: "test.tsx",
      output: `const A = () => <div className={clsx({ "slds-container_medium": cond })} />;`,
      errors: [{ messageId: "bemDoubleDash" }],
    },
  ],
});
