import { expect } from 'chai';
import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint } = stylelint;

describe('slds/no-unsupported-hooks-slds2', () => {
  const expectedMessages = [
    "The --slds-c-breadcrumbs-spacing-inline-start styling hook isn’t present in SLDS 2. Replace it with --slds-c-breadcrumbs-spacing-inlinestart. (slds/no-unsupported-hooks-slds2)",
  ];

  expectedMessages.forEach((message, index) => {
    it(`should report deprecated hooks for test case #${index}`, async () => {
      const linterResult: LinterResult = await lint({
        files: './tests/providers/no-unsupported-hooks-slds2.css',
        config: {
          plugins: ['./src/index.ts'], // Path to the plugin
          rules: {
            'slds/no-unsupported-hooks-slds2': true, // Enable the rule
          },
        },
      } as LinterOptions);

      const reportedMessage =
        linterResult.results[0]._postcssResult.messages[index].text;
      expect(reportedMessage).to.equal(message);
    });
  });
});
