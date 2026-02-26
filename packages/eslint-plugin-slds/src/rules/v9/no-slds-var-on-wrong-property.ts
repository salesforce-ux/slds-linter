import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';
import { forEachSldsVariable } from '../../utils/css-utils';

const ruleConfig = ruleMessages['no-slds-var-on-wrong-property'];
const { type, description, url, messages } = ruleConfig;

/**
 * Flat map of --slds-* hook name → allowed CSS properties.
 * Built once at module load from all scopes in globalStylingHooksMetadata.
 * Hooks with an empty properties array are excluded — they cannot be validated.
 */
const hookPropertyMap = new Map<string, string[]>(
  Object.values(metadata.globalStylingHooksMetadata).flatMap((scopeData) =>
    Object.entries(scopeData)
      .filter(([, hookData]) => Array.isArray(hookData.properties) && hookData.properties.length > 0)
      .map(([hookName, hookData]) => [hookName, hookData.properties] as [string, string[]])
  )
);

/**
 * CSS shorthand properties that are valid wherever one of their sub-properties is listed.
 * For example, `background` is a shorthand that sets `background-color`, so a color hook
 * is semantically correct on `background` even though the metadata only lists `background-color`.
 */
const SHORTHAND_EXPANSIONS: Record<string, string[]> = {
  background:  ['background-color'],
  border:      ['border-color', 'border-width', 'border-radius'],
  font:        ['font-family', 'font-size', 'font-weight'],
  animation:   ['animation*'],
  transition:  ['transition*'],
};

/**
 * Check whether a CSS property satisfies at least one entry in the allowed list.
 * Entries ending with `*` are prefix wildcards (e.g. `animation*` matches `animation-duration`).
 * `SHORTHAND_EXPANSIONS` maps shorthand properties to the sub-properties they encompass.
 */
function isPropertyAllowed(cssProp: string, allowedProps: string[]): boolean {
  const candidates = SHORTHAND_EXPANSIONS[cssProp] ?? [cssProp];

  return candidates.some((candidate) =>
    allowedProps.some((allowed) => {
      if (allowed.endsWith('*')) {
        return candidate.startsWith(allowed.slice(0, -1));
      }
      return candidate === allowed;
    })
  );
}

/**
 * ESLint rule that verifies --slds-* CSS variables are applied to the CSS property
 * types they are designated for, as recorded in globalStylingHooks.metadata.json
 * from the @salesforce-ux/sds-metadata package.
 *
 * Example violations:
 *   color: var(--slds-g-spacing-4)            → spacing hooks belong on padding/margin/etc.
 *   padding: var(--slds-g-color-brand-base-1) → color hooks belong on color/background-color/etc.
 */
export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    fixable: null,
    messages,
  },

  create(context) {
    return {
      Declaration(node) {
        const cssProp = node.property;
        if (typeof cssProp !== 'string') return;

        const valueText = context.sourceCode.getText(node.value);
        if (!valueText) return;

        forEachSldsVariable(valueText, ({ name: cssVar }) => {
          const allowedProps = hookPropertyMap.get(cssVar);

          // Hook is not in the metadata (custom or unknown) — skip silently.
          if (!allowedProps) return;

          if (!isPropertyAllowed(cssProp, allowedProps)) {
            context.report({
              node,
              messageId: 'wrongProperty',
              data: {
                cssVar,
                property: cssProp,
                allowedProperties: allowedProps.join(', '),
              },
            });
          }
        });
      },
    };
  },
} as Rule.RuleModule;
