const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/no-slds-class-overrides").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-slds-class-overrides (react)", rule, {
  valid: [
    // className usage is not a selector override, so it must not be flagged
    { code: `const A = () => <div className="slds-button" />;`, filename: "test.tsx" },
    // custom classes in CSS-in-JS are fine
    {
      code: "const S = styled.div`\n  .my-app-button { color: red; }\n`;",
      filename: "test.tsx",
    },
    // SLDS class not at selector end is not flagged
    {
      code: "const S = styled.div`\n  .slds-button .my-child { color: red; }\n`;",
      filename: "test.tsx",
    },
  ],
  invalid: [
    {
      code: "const S = styled.div`\n  .slds-button { background: red; }\n`;",
      filename: "test.tsx",
      errors: [{ messageId: "sldsClassOverride", data: { className: "slds-button" } }],
    },
  ],
});
