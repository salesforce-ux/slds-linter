
import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint } = stylelint;

describe('slds/no-unsupported-hooks-slds2', () => {
  const expectedMessages = [
    "{\"message\":\"The --slds-c-breadcrumbs-spacing-inline-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)\",\"suggestions\":[]}",
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
      expect(reportedMessage).toEqual(message);
    });
  });
});
