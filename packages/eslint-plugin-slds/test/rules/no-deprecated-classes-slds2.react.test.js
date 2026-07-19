const { RuleTester } = require("eslint");
const rule = require("../../src/rules/no-deprecated-classes-slds2");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// Known deprecated class present in @salesforce-ux/sds-metadata
const DEPRECATED = "slds-action-overflow--touch";

ruleTester.run("no-deprecated-classes-slds2 (react)", rule, {
  valid: [
    { code: `const A = () => <div className="my-custom-class" />;`, filename: "test.tsx" },
    { code: `const A = () => <div className="slds-button" />;`, filename: "test.jsx" },
    {
      code: "const S = styled.div`\n  .my-custom-class { color: red; }\n`;",
      filename: "test.tsx",
    },
  ],
  invalid: [
    {
      code: `const A = () => <div className="${DEPRECATED}" />;`,
      filename: "test.tsx",
      errors: [{ messageId: "deprecatedClass", data: { className: DEPRECATED } }],
    },
    {
      code: "const A = () => <div className={`" + DEPRECATED + " ${x}`} />;",
      filename: "test.tsx",
      errors: [{ messageId: "deprecatedClass" }],
    },
    {
      code: `const A = () => <div className={clsx("${DEPRECATED}")} />;`,
      filename: "test.tsx",
      errors: [{ messageId: "deprecatedClass" }],
    },
    {
      // CSS-in-JS class selector
      code: "const S = styled.div`\n  ." + DEPRECATED + " { color: red; }\n`;",
      filename: "test.tsx",
      errors: [{ messageId: "deprecatedClass" }],
    },
  ],
});
