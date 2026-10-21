import eslintReactKit, { type RuleFunction } from '@eslint-react/kit';
import { type Rule } from 'eslint';
import ruleMessages from '@salesforce-ux/eslint-plugin-slds/rule-messages';

export function createReactRule(
  ruleName: string,
  factory: () => RuleFunction,
  fixable = false,
  schema: Rule.RuleMetaData['schema'] = [],
): Rule.RuleModule {
  const ruleConfig = ruleMessages[ruleName];
  if (!ruleConfig) throw new Error(`Missing rule metadata for ${ruleName}`);

  const generatedRules = Object.values(eslintReactKit().use(factory).getPlugin().rules ?? {});
  if (generatedRules.length !== 1) {
    throw new Error(`Expected one generated rule for ${ruleName}, received ${generatedRules.length}`);
  }

  return {
    meta: {
      type: ruleConfig.type,
      docs: {
        description: ruleConfig.description,
        recommended: true,
        url: ruleConfig.url,
      },
      ...(fixable ? {fixable: 'code' as const} : {}),
      schema,
      messages: ruleConfig.messages,
    },
    create: generatedRules[0].create as unknown as Rule.RuleModule['create'],
  };
}
