/**
 * End-to-end lint + fix test driving the real ESLint engine the CLI worker uses
 * (`new ESLint({...}).lintFiles()` followed by `ESLint.outputFixes`) against a
 * real React file on disk with the exported `flat/recommended` config.
 *
 * Verifies that:
 *   - findings are produced across className, inline style, and CSS-in-JS,
 *   - safe fixes are written to disk,
 *   - a CSS-in-JS edit that would cross a `${...}` interpolation is left alone
 *     (the P1 corruption guard, exercised through the full pipeline).
 */
const { ESLint } = require("eslint");
const fs = require("fs");
const os = require("os");
const path = require("path");
const plugin = require("../src");

const SOURCE = [
  "const accent = 'red';",
  "export const Widget = () => (",
  "  <div",
  '    className="slds-text-heading--large"',
  "    style={{ '--lwc-brandPrimary': 'red' }}",
  "  />",
  ");",
  "const S = styled.div`",
  "  color: ${accent} var(--sds-g-color-palette-blue-10);",
  "`;",
  "",
].join("\n");

function makeEslint(dir, fix) {
  return new ESLint({
    cwd: dir,
    overrideConfigFile: true,
    overrideConfig: plugin.configs["flat/recommended"],
    fix,
  });
}

describe("e2e lint + fix (ESLint engine)", () => {
  let dir;
  let file;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "slds-e2e-"));
    file = path.join(dir, "Widget.tsx");
    fs.writeFileSync(file, SOURCE, "utf8");
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("reports violations across all React surfaces", async () => {
    const results = await makeEslint(dir, false).lintFiles([file]);
    const ruleIds = results[0].messages.map((m) => m.ruleId);

    expect(ruleIds).toContain("@salesforce-ux/slds/enforce-bem-usage");
    expect(ruleIds).toContain("@salesforce-ux/slds/lwc-token-to-slds-hook");
  });

  it("applies safe fixes and preserves interpolated CSS-in-JS untouched", async () => {
    const results = await makeEslint(dir, true).lintFiles([file]);
    await ESLint.outputFixes(results);
    const fixed = fs.readFileSync(file, "utf8");

    // className BEM token is normalized
    expect(fixed).toContain("slds-text-heading_large");
    expect(fixed).not.toContain("slds-text-heading--large");

    // inline-style --lwc- key is upgraded to the SLDS hook
    expect(fixed).toContain("--slds-g-color-accent-1");
    expect(fixed).not.toContain("--lwc-brandPrimary");

    // CSS-in-JS value straddles `${accent}`: must be left exactly as-is
    expect(fixed).toContain("${accent} var(--sds-g-color-palette-blue-10)");
  });
});
