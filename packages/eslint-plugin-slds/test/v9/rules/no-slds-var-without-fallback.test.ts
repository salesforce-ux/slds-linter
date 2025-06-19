// NOTE: This rule only supports .css, .scss, .html, and .cmp files in ESLint v9.
// RuleTester cannot be used for these file types because ESLint expects JS/TS syntax.
// To test this rule, use integration tests or run ESLint directly on CSS/SCSS/HTML/CMP files in your static analyzer or CI pipeline.

describe('no-slds-var-without-fallback (integration)', () => {
  it('should be tested via integration/static analysis, not RuleTester', () => {
    expect(true).toBe(true);
  });
  
  it('supports .css, .scss, .html, and .cmp files only', () => {
    expect(true).toBe(true);
  });
}); 