import stylelint from 'stylelint';
import assert from 'assert';

const ruleName = 'slds/no-slds-class-overrides';

describe('slds/no-slds-class-overrides rule', () => {
  it('should report an error when overriding .slds- class styles', async () => {
    const css = `
      .foo {
        color: red;
      }
      .slds-button {
        background-color: blue;
      }
      .slds-textarea {
        font-size: 14px;
      }
    `;

    const result = await stylelint.lint({
      code: css,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          [ruleName]: true
        }
      }
    });

    const warnings = result.results[0].warnings;
    
    assert.strictEqual(warnings.length, 2);
    assert.strictEqual(warnings[0].text, `Overriding .slds-button isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button`);
    assert.strictEqual(warnings[1].text, `Overriding .slds-textarea isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button`);
  });

  it('should not report an error when custom classes are used', async () => {
    const css = `
      .custom-button {
        background-color: blue;
      }
      .custom-text {
        font-size: 14px;
      }
    `;
    
    const result = await stylelint.lint({
      code: css,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          [ruleName]: true
        }
      }
    });

    const warnings = result.results[0].warnings;
    
    assert.strictEqual(warnings.length, 0);
  });

  it('should report an error for each overridden .slds class', async () => {
    const css = `
      .foo {
        color: red;
      }
      .slds-button {
        background-color: blue;
      }
      .slds-text {
        font-size: 14px;
      }
      .slds-button-group {
        display: flex;
      }
    `;
    
    const result = await stylelint.lint({
      code: css,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          [ruleName]: true
        }
      }
    });

    const warnings = result.results[0].warnings;
    
    assert.strictEqual(warnings.length, 2);
    assert.strictEqual(warnings[0].text, `Overriding .slds-button isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button`);
    assert.strictEqual(warnings[1].text, `Overriding .slds-button-group isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button`);
  });

  it('should not report an error for custom .slds class', async () => {
    const css = `
      .foo {
        color: red;
      }
      .slds-button {
        background-color: blue;
      }
      .slds-my-own {
        font-size: 14px;
      }
      .slds-button-group {
        display: flex;
      }
    `;
    
    const result = await stylelint.lint({
      code: css,
      config: {
        plugins: ['./src/index.ts'],
        rules: {
          [ruleName]: true
        }
      }
    });

    const warnings = result.results[0].warnings;
    
    assert.strictEqual(warnings.length, 2);
    assert.strictEqual(warnings[0].text, `Overriding .slds-button isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button`);
    assert.strictEqual(warnings[1].text, `Overriding .slds-button-group isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button`);
  });
});