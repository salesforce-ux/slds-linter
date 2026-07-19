/**
 * Extension-routing matrix: drives the real ESLint flat engine with the
 * exported `flat/recommended` config and asserts each file extension is parsed
 * by the correct language and that the appropriate rules fire (or stay silent).
 * This guards the wiring in src/index.ts end-to-end, not just its shape.
 */
const { Linter } = require("eslint");
const plugin = require("../src");

const config = plugin.configs["flat/recommended"];

function lint(code, filename) {
  const linter = new Linter({ configType: "flat" });
  return linter.verify(code, config, { filename });
}

function ruleIds(messages) {
  return messages.map((m) => m.ruleId).filter(Boolean);
}

describe("flat/recommended extension routing", () => {
  it("lints CSS files via the CSS language", () => {
    const messages = lint("a {\n  color: var(--lwc-brandPrimary);\n}", "styles.css");
    expect(ruleIds(messages)).toContain("@salesforce-ux/slds/lwc-token-to-slds-hook");
  });

  it("lints HTML files via the HTML parser (deprecated class)", () => {
    const messages = lint(
      '<div class="slds-action-overflow--touch"></div>',
      "cmp.html"
    );
    expect(ruleIds(messages)).toContain(
      "@salesforce-ux/slds/no-deprecated-classes-slds2"
    );
  });

  it("lints TSX className via the JSX visitors", () => {
    const messages = lint(
      'const A = () => <div className="slds-text-heading--large" />;',
      "Comp.tsx"
    );
    expect(ruleIds(messages)).toContain("@salesforce-ux/slds/enforce-bem-usage");
  });

  it("lints JSX inline style objects via the JSX visitors", () => {
    const messages = lint(
      "const A = () => <div style={{ '--lwc-brandPrimary': 'red' }} />;",
      "Comp.jsx"
    );
    expect(ruleIds(messages)).toContain(
      "@salesforce-ux/slds/lwc-token-to-slds-hook"
    );
  });

  it("lints CSS-in-JS tagged templates in TS files", () => {
    const messages = lint(
      "const S = styled.div`\n  .slds-box { color: red; }\n`;",
      "styled.ts"
    );
    expect(ruleIds(messages)).toContain(
      "@salesforce-ux/slds/no-slds-class-overrides"
    );
  });

  it("does not report on plain JS/TS without SLDS artifacts", () => {
    const messages = lint(
      "export const add = (a, b) => a + b;\nconst obj = { padding: 16 };\n",
      "util.ts"
    );
    expect(messages.filter((m) => m.ruleId)).toHaveLength(0);
  });
});
