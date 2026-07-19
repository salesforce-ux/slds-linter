/**
 * Regression guard: CSS-in-JS declarations whose value straddles a `${...}`
 * interpolation must never be auto-fixed (and must not be reported at a
 * mis-computed location). Before the same-segment mapping fix, the placeholder
 * substituted for the interpolation had a different length than the real source
 * expression, so fix ranges computed from the placeholder text corrupted
 * consumer source. These cases assert the value side is skipped entirely.
 */
const { RuleTester } = require("eslint");

const enforceSdsToSlds = require("../../src/rules/v9/enforce-sds-to-slds-hooks").default;
const noSldsVarWithoutFallback = require("../../src/rules/v9/no-slds-var-without-fallback").default;
const lwcTokenToSldsHook = require("../../src/rules/v9/lwc-token-to-slds-hook").default;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    ecmaVersion: 2021,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// A fixable --sds- token that sits AFTER an interpolation in the same value.
// The interpolation `${x}` (4 chars) is shorter than the internal placeholder,
// so a naive offset would land past the real token and rewrite the wrong text.
ruleTester.run("enforce-sds-to-slds-hooks (css-in-js interpolation safety)", enforceSdsToSlds, {
  valid: [
    {
      code:
        "const x = 'red';\n" +
        "const S = styled.div`color: ${x} var(--sds-g-color-palette-blue-10);`;",
      filename: "test.tsx",
    },
    {
      code:
        "const x = 'red';\n" +
        "const S = styled.div`border: 1px solid ${x} var(--sds-g-color-palette-blue-10);`;",
      filename: "test.tsx",
    },
  ],
  invalid: [
    // Sanity: an interpolation-free value in the same template still fixes,
    // proving the same-segment guard only suppresses interpolated values.
    {
      code: "const S = styled.div`background: var(--sds-g-color-palette-blue-10);`;",
      filename: "test.tsx",
      output: "const S = styled.div`background: var(--slds-g-color-palette-blue-10);`;",
      errors: [{ messageId: "replaceSdsWithSlds" }],
    },
  ],
});

// no-slds-var-without-fallback: a var(--slds-*) after an interpolation must not
// be auto-wrapped with a fallback at the wrong offset.
ruleTester.run("no-slds-var-without-fallback (css-in-js interpolation safety)", noSldsVarWithoutFallback, {
  valid: [
    {
      code:
        "const x = 'red';\n" +
        "const S = styled.div`color: ${x} var(--slds-g-color-accent-1);`;",
      filename: "test.tsx",
    },
  ],
  invalid: [],
});

// lwc-token-to-slds-hook: var(--lwc-*) after an interpolation must not be fixed.
ruleTester.run("lwc-token-to-slds-hook (css-in-js interpolation safety)", lwcTokenToSldsHook, {
  valid: [
    {
      code:
        "const x = 'red';\n" +
        "const S = styled.div`color: ${x} var(--lwc-colorBackground);`;",
      filename: "test.tsx",
    },
  ],
  invalid: [],
});
