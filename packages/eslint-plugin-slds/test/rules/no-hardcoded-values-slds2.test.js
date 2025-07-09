const rule = require('../../src/v9/rules/no-hardcoded-values-slds2').default;
const { runRuleOnDecl } = require('../v9/testUtils');

// Replace all tests with a parity-driven, data-driven approach:
const testCases = [
  {
    description: 'flags hardcoded color',
    property: 'color',
    value: '#ff0000',
    expectWarning: true,
    expectedMessage: /#ff0000/,
    expectedReplacement: /slds-g-color-palette-red-50|slds-g-color-palette-hot-orange-50|slds-g-color-palette-hot-orange-60/
  },
  {
    description: 'does not flag fallback variable',
    property: 'background-color',
    value: 'var(--slds-g-color-palette-neutral-100, #fff)',
    expectWarning: false,
  },
  {
    description: 'does not flag fallback density',
    property: 'border',
    value: 'var(--slds-g-sizing-border-1, 1px) solid',
    expectWarning: false,
  },
  {
    description: 'does not flag nested fallback',
    property: 'border',
    value: 'var(--slds-g-sizing-border-1, var(--lwc-borderWidthThin, 1px)) solid',
    expectWarning: false,
  },
  {
    description: 'does not flag color-mix',
    property: 'background-color',
    value: 'color-mix(in oklab, #a71e14 25%, white)',
    expectWarning: false,
  },
  {
    description: 'does not flag 0',
    property: 'width',
    value: '0',
    expectWarning: false,
  },
  {
    description: 'does not flag 0px',
    property: 'width',
    value: '0px',
    expectWarning: false,
  },
  {
    description: 'does not flag 0.0',
    property: 'width',
    value: '0.0',
    expectWarning: false,
  },
  {
    description: 'flags hardcoded font-size',
    property: 'font-size',
    value: '0.875rem',
    expectWarning: true,
    expectedMessage: /0.875rem/,
    expectedReplacement: /slds-g-font-scale-1/
  },
  {
    description: 'flags hardcoded background-color',
    property: 'background-color',
    value: '#ffffff',
    expectWarning: true,
    expectedMessage: /#ffffff/,
    expectedReplacement: /slds-g-color-palette-neutral-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100|slds-g-color-success-base-100/
  },
  {
    description: 'flags hardcoded color (other)',
    property: 'color',
    value: '#ffffff',
    expectWarning: true,
    expectedMessage: /#ffffff/,
    expectedReplacement: /slds-g-color-palette-neutral-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100|slds-g-color-success-base-100/
  },
  {
    description: 'flags hardcoded border-color',
    property: 'border-color',
    value: '#fff',
    expectWarning: true,
    expectedMessage: /#fff/,
    expectedReplacement: /slds-g-color-palette-neutral-100|slds-g-color-brand-base-100|slds-g-color-error-base-100|slds-g-color-warning-base-100|slds-g-color-success-base-100/
  },
  {
    description: 'flags hardcoded font-size px',
    property: 'font-size',
    value: '16px',
    expectWarning: true,
    expectedMessage: /16px/,
    expectedReplacement: /slds-g-font-scale-2/
  },
  {
    description: 'flags hardcoded font-size rem',
    property: 'font-size',
    value: '1rem',
    expectWarning: true,
    expectedMessage: /1rem/,
    expectedReplacement: /slds-g-font-scale-2/
  },
  {
    description: 'flags hardcoded color (other)',
    property: 'background-color',
    value: '#123456',
    expectWarning: true,
    expectedMessage: /#123456/,
    expectedReplacement: /slds-g-color-palette-cloud-blue-20|slds-g-color-palette-blue-15|slds-g-color-palette-cloud-blue-30|slds-g-color-palette-blue-20|slds-g-color-palette-cloud-blue-15/
  },
  {
    description: 'does not flag variable',
    property: 'background-color',
    value: 'var(--color-brand)',
    expectWarning: false,
  },
];

describe('no-hardcoded-values-slds2 (parity with stylelint tests)', () => {
  testCases.forEach(({ description, property, value, expectWarning, expectedMessage, expectedReplacement }) => {
    it(description, () => {
      const reports = runRuleOnDecl(rule, property, value);
      if (expectWarning) {
        expect(reports.length).toBeGreaterThan(0);
        const msg = JSON.parse(reports[0].message).message;
        if (expectedMessage) expect(msg).toMatch(expectedMessage);
        if (expectedReplacement) expect(msg).toMatch(expectedReplacement);
      } else {
        expect(reports.length).toBe(0);
      }
    });
  });
}); 