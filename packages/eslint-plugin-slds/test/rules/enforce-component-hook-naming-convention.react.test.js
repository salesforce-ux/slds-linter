const { RuleTester } = require("eslint");
const rule = require("../../src/rules/v9/enforce-component-hook-naming-convention").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("enforce-component-hook-naming-convention (react)", rule, {
  valid: [
    { code: `const A = () => <div style={{ '--slds-c-accordion-section-color-border': '#000' }} />;`, filename: "test.tsx" },
    { code: `const s = { background: 'var(--slds-c-accordion-section-color-border)' };`, filename: "test.tsx" },
  ],
  invalid: [
    // property side deprecated component hook
    {
      code: `const A = () => <div style={{ '--slds-c-accordion-color-border': '#000' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ '--slds-c-accordion-section-color-border': '#000' }} />;`,
      errors: [
        {
          messageId: "replace",
          data: {
            oldValue: "--slds-c-accordion-color-border",
            suggestedMatch: "--slds-c-accordion-section-color-border",
          },
        },
      ],
    },
    // value side
    {
      code: `const A = () => <div style={{ color: 'var(--slds-c-accordion-color-border)' }} />;`,
      filename: "test.tsx",
      output: `const A = () => <div style={{ color: 'var(--slds-c-accordion-section-color-border)' }} />;`,
      errors: [{ messageId: "replace" }],
    },
    // CSS-in-JS
    {
      code: "const S = styled.div`\n  --slds-c-accordion-color-border: #000;\n`;",
      filename: "test.tsx",
      output: "const S = styled.div`\n  --slds-c-accordion-section-color-border: #000;\n`;",
      errors: [{ messageId: "replace" }],
    },
  ],
});
