import { Rule } from 'eslint';
import metadata from '@salesforce-ux/sds-metadata';
import ruleMessages from '../../config/rule-messages';
import {
  matchesCssProperty,
  resolveColorPropertyToMatch,
  resolveDensityPropertyToMatch,
} from '../../utils/property-matcher';

const ruleConfig = ruleMessages['no-invalid-hook-property-usage'];
const { type, description, url, messages } = ruleConfig;

const globalHooksMetadata = metadata.globalStylingHooksMetadata?.global || {};
const allowedPropertiesByHook = new Map<string, string[]>();

Object.entries(globalHooksMetadata).forEach(([hookName, hookMetadata]: [string, any]) => {
  const properties = hookMetadata?.properties;
  if (Array.isArray(properties) && properties.length > 0) {
    allowedPropertiesByHook.set(hookName, properties);
  }
});

function findParentDeclaration(context: Rule.RuleContext, node: any): any {
  return context.sourceCode
    .getAncestors(node)
    .reverse()
    .find((ancestor: any) => ancestor.type === 'Declaration');
}

function getPropertiesToValidate(property: string): string[] {
  if(property === 'font'){
    return ['font', 'font-size', 'font-weight', 'line-height'];
  } else if(property === 'box-shadow'){
    return ['box-shadow', 'color', 'border-color', 'background-color', 'fill', 'border-width', 'top'];
  } else if(property === 'gap'){
    return ['top']
  } else {
    const propertiesToValidate = [property];
    const colorProperty = resolveColorPropertyToMatch(property);
    if(colorProperty !== property){
      propertiesToValidate.push(colorProperty);
    }
    const densityProperty = resolveDensityPropertyToMatch(property);
    if(densityProperty !== property){
      propertiesToValidate.push(densityProperty);
    }
    return propertiesToValidate;
  }
}

export default {
  meta: {
    type,
    docs: {
      description,
      recommended: true,
      url,
    },
    messages,
  },

  create(context) {
    return {
      "Function[name='var'] Identifier[name=/^--slds-g-/]"(node) {
        const hook = node.name;
        const allowedProperties = allowedPropertiesByHook.get(hook);
        if (!allowedProperties) return;

        const declaration = findParentDeclaration(context, node);
        if (!declaration || typeof declaration.property !== 'string') return;

        const property = String(declaration.property).toLowerCase();
        const propertiesToValidate = getPropertiesToValidate(property);
        const isAllowed = propertiesToValidate.some((propertyToValidate) =>
          matchesCssProperty(allowedProperties, propertyToValidate)
        );
        if (isAllowed) return;

        context.report({
          node,
          messageId: 'invalidProperty',
          data: {
            hook,
            property,
            allowedProperties: allowedProperties.join(', '),
          },
        });
      },
    };
  },
} as Rule.RuleModule;
