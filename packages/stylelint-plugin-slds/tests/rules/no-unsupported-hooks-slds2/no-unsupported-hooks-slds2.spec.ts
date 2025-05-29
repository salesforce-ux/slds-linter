
import stylelint, { LinterResult, LinterOptions } from 'stylelint';

const { lint } = stylelint;

describe('slds/no-unsupported-hooks-slds2', () => {
  const expectedMessages = [
    "The --slds-c-breadcrumbs-spacing-inline-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-pill-container-spacing-block-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-g-color-border-base-2 styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-g-color-border-base-3 styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-g-color-border-base-2 styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-g-link-color styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-g-link-color-hover styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-g-link-color styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-kx-button-underline-scale-x styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-kx-button-underline-base-y styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-kx-button-underline-offset-y styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-kx-button-underline-scale-x styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --sds-s-navigation-radius-border styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --sds-s-label-sizing-gap styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --sds-s-navigation-radius-border styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --sds-s-input-color-border-hover styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --sds-s-input-color-border-hover styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-accordion-heading-text-color styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-accordion-section-spacing-block-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-accordion-heading-text-color styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-alert-spacing-inline-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-alert-spacing-block-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-alert-spacing-inline-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-button-spacing-inline-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-button-spacing-block-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-button-spacing-inline-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-toast-sizing-min-width styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-toast-spacing-block-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-toast-sizing-min-width styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-modal-header-spacing-block-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-modal-header-spacing-inline-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-modal-header-spacing-block-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-pill-container-spacing-block-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-pill-container-spacing-inline-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-pill-container-spacing-block-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-form-compound-spacing-block-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-form-compound-spacing-inline styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-form-compound-spacing-block-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-card-spacing-block-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-card-spacing-inline-end styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)",
    "The --slds-c-card-spacing-block-start styling hook isn’t present in SLDS 2 and there's no equivalent replacement. Remove it or replace it with a styling hook with a similar effect. (slds/no-unsupported-hooks-slds2)"
  ];

  let linterResult: LinterResult;
  beforeAll(async () => {
    linterResult = await lint({
      files: './tests/providers/no-unsupported-hooks-slds2.css',
      config: {
        plugins: ['./src/index.ts'], // Path to the plugin
        rules: {
          'slds/no-unsupported-hooks-slds2': true, // Enable the rule
        },
      },
    } as LinterOptions);
  });

  expectedMessages.forEach((message, index) => {
    it(`should report deprecated hooks for test case #${index}`, () => {      
      const reportedMessage =linterResult.results[0]._postcssResult?.messages[index]?.text;
      expect(reportedMessage).toEqual(message);
    });
  });
});
