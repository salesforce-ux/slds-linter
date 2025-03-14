
import stylelint, { LinterResult, LinterOptions } from 'stylelint';
const { lint }: typeof stylelint = stylelint;

const errorWithStyleHooks = (oldValue, newValue) =>
  `The '${oldValue}' design token is deprecated. Replace it with the SLDS 2 '${newValue}' styling hook and set the fallback to '${oldValue}'. For more info, see Global Styling Hooks on lightningdesignsystem.com.`;
const errorWithNoRecommendation = (oldValue) =>
  `The '${oldValue}' design token is deprecated. For more info, see the New Global Styling Hook Guidance on lightningdesignsystem.com.`;
const errorWithRawValue = (oldValue, newValue) =>
  `The '${oldValue}' design token is deprecated. Replace it with the SLDS 2 '${newValue}' styling hook and set the fallback to '${oldValue}'. For more info, see Global Styling Hooks on lightningdesignsystem.com.`;

const LWC_TOKEN_MAPPINGS = {
  '--lwc-brandDark': '--slds-g-color-accent-dark-1',
  '--lwc-brandBackgroundDark': '--',
  '--lwc-brandBackgroundDarkTransparent': 'transparent',
  '--lwc-cardBodyPadding': '0 var(--slds-g-spacing-4)',
  '--lwc-brandPrimaryTransparent10':
    'color-mix(in oklab, var(--slds-g-color-accent-1), transparent 90%)',
  '--lwc-nubbinTriangleOffset': '-0.1875rem',
  '--lwc-heightTappable':
    'calc(var(--slds-g-sizing-9) + var(--slds-g-sizing-4))',
  '--lwc-colorBackgroundLight': [
    '--slds-g-color-surface-1',
    '--slds-g-color-surface-container-1',
  ],
  '--lwc-varFontSize2': 'Continue to use',
  '--lwc-customer-created': null,
};

const CSS_PROP = [
  'color',
  'background',
  'background',
  'padding',
  'color',
  'margin-left',
  'height',
  'background',
  'font-size',
  'color',
];

const getRandomValue = (prop: string) => {
  if (prop === 'color' || prop === 'background') {
    return '#874900';
  } else if (prop === 'padding' || prop === 'margin-left') {
    return '24px';
  } else if (prop === 'height') {
    return '50px';
  } else if (prop === 'font-size') {
    return '14px';
  }
  return '';
};

const testStyleLintRule = async (inputCss: string) => {
  const ruleName = 'slds/lwc-token-to-slds-hook';
  const linterResult: LinterResult = await lint({
    code: inputCss,
    config: {
      plugins: ['./src/index.ts'], // Adjust the plugin path if needed
      rules: {
        [ruleName]: true,
      },
    },
  } as LinterOptions);

  return linterResult.results[0].warnings.map((warning) => warning.text);
};

const createTest = ({ description, inputCss, expectedMessage }, index) => {
  it(description, async () => {
    const messages = await testStyleLintRule(inputCss);
    if (expectedMessage) {
      expect(messages[0]).toMatch(expectedMessage);
    } else {
      expect(messages).toHaveLength(0);
    }
  });
};

describe('lwc-token-to-slds-hook', () => {
  const OnRightSideTestCases = [];

  //Right side use text cases
  Object.entries(LWC_TOKEN_MAPPINGS).forEach(([key, val], ind) => {
    const inputCss = `.testLWC_RightSide_${ind}{${CSS_PROP[ind]}:var(${key})}`;
    if (val === null) {
      OnRightSideTestCases.push({
        description: `#Ignore customer created`,
        inputCss,
      });
    } else if (Array.isArray(val)) {
      OnRightSideTestCases.push({
        description: `#suggest multiple recommendations`,
        inputCss,
        expectedMessage: errorWithStyleHooks(key, val.join(' or ')),
      });
    } else if (val.startsWith('--slds-')) {
      OnRightSideTestCases.push({
        description: `#suggest --slds-* token recommendation`,
        inputCss,
        expectedMessage: errorWithStyleHooks(key, val),
      });
    } else if (val === '--') {
      OnRightSideTestCases.push({
        description: `#when no recommendation`,
        inputCss,
        expectedMessage: errorWithNoRecommendation(key),
      });
    } else if (val === 'Continue to use') {
      OnRightSideTestCases.push({
        description: `#Continue to use`,
        inputCss,
      });
    } else {
      OnRightSideTestCases.push({
        description: `#replace with raw value`,
        inputCss,
        expectedMessage: errorWithRawValue(key, val),
      });
    }
  });

  const OnLeftSideTestCases = [];

  //Left side use text cases
  Object.entries(LWC_TOKEN_MAPPINGS).forEach(([key, val], ind) => {
    const inputCss = `.testLWC_LeftSide_${ind}{${key}: ${getRandomValue(CSS_PROP[ind])}}`;
    if (val === null) {
      OnLeftSideTestCases.push({
        description: `#Ignore customer created`,
        inputCss,
      });
    } else if (Array.isArray(val)) {
      OnLeftSideTestCases.push({
        description: `#suggest multiple recommendations`,
        inputCss,
        expectedMessage: errorWithStyleHooks(key, val.join(' or ')),
      });
    } else if (val.startsWith('--slds-')) {
      OnLeftSideTestCases.push({
        description: `#suggest --slds-* token recommendation`,
        inputCss,
        expectedMessage: errorWithStyleHooks(key, val),
      });
    } else if (val === '--') {
      OnLeftSideTestCases.push({
        description: `#when no recommendation`,
        inputCss,
        expectedMessage: errorWithNoRecommendation(key),
      });
    } else if (val === 'Continue to use') {
      OnLeftSideTestCases.push({
        description: `#Continue to use`,
        inputCss,
      });
    } else {
      OnLeftSideTestCases.push({
        description: `#raw value`,
        inputCss,
        expectedMessage: errorWithNoRecommendation(key),
      });
    }
  });

  describe('#right-side-use', () => {
    OnRightSideTestCases.forEach(createTest);
  });

  describe('#left-side-use', () => {
    OnLeftSideTestCases.forEach(createTest);
  });
});
