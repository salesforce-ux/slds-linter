const rule = require('../../src/v9/rules/no-hardcoded-values-slds1').default;
const { runRuleOnDecl } = require('../v9/testUtils');

const testCases = [
  {
    description: 'flags hardcoded color',
    property: 'color',
    value: '#ff0000',
    expectWarning: true,
    expectedMessage: /#ff0000/,
    expectedReplacement: /slds-g-color-error-base-50|slds-g-color-palette-red-50|slds-g-color-palette-hot-orange-50|slds-g-color-palette-hot-orange-60/
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
    description: 'flags hardcoded box-shadow',
    property: 'box-shadow',
    value: '0px 2px 3px 0px #00000027',
    expectWarning: true,
    expectedReplacement: /slds-g-shadow-2/,
    customAssert: (msg) => {
      expect(msg).toMatch(/Replace the/);
      expect(msg).toMatch(/static value/);
      expect(msg).toMatch(/slds-g-shadow-2/);
    }
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
    description: 'flags hardcoded color (other)',
    property: 'background-color',
    value: '#123456',
    expectWarning: true,
    expectedMessage: /#123456/,
    expectedReplacement: /slds-g-color-palette-cloud-blue-20|slds-g-color-palette-blue-15|slds-g-color-brand-base-15|slds-g-color-palette-cloud-blue-30|slds-g-color-palette-blue-20/
  },
  {
    description: 'does not flag variable',
    property: 'background-color',
    value: 'var(--color-brand)',
    expectWarning: false,
  },
  {
    description: 'flags hardcoded padding (no replacement)',
    property: 'padding',
    value: '20px',
    expectWarning: true,
    expectedMessage: /20px/,
    expectedReplacement: /no replacement styling hook|Remove the static value/
  },
];

describe('no-hardcoded-values-slds1 (parity with stylelint tests)', () => {
  testCases.forEach(({ description, property, value, expectWarning, expectedMessage, expectedReplacement, customAssert }) => {
    it(description, () => {
      const reports = runRuleOnDecl(rule, property, value);
      if (expectWarning) {
        expect(reports.length).toBeGreaterThan(0);
        const msg = JSON.parse(reports[0].message).message;
        if (customAssert) {
          customAssert(msg);
        } else {
          if (expectedMessage) expect(msg).toMatch(expectedMessage);
          if (expectedReplacement) expect(msg).toMatch(expectedReplacement);
        }
      } else {
        expect(reports.length).toBe(0);
      }
    });
  });
}); 