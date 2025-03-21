
import stylelint, { LinterResult, LinterOptions } from 'stylelint';
const { lint }: typeof stylelint = stylelint;

describe('no-important', () => {
  [
    "Avoid using '!important' unless absolutely necessary.",
    "Avoid using '!important' unless absolutely necessary.",
  ].map((message, index) => {
    it('test rule #' + index, async () => {
      const linterResult: LinterResult = await lint({
        files: './tests/providers/no-important.css',
        config: {
          plugins: ['./src/index.ts'],
          rules: {
            'slds/no-important-tag': true,
          },
        },
      } as LinterOptions);

      expect(
        linterResult.results.at(0)._postcssResult.messages[index].text
      ).toEqual(message);
    });
  });
});
