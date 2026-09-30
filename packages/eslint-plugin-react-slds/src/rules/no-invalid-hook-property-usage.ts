import {merge, type RuleFunction} from '@eslint-react/kit';
import metadata from '@salesforce-ux/sds-metadata';
import {isDynamicCssRange, visitStaticCssVariableNames} from '../utils/css-value';
import {
  createInlineStyleDeclarationVisitor,
  type InlineStyleDeclaration,
} from '../utils/inline-style';
import {
  matchesCssProperty,
  resolveColorPropertyToMatch,
  resolveDensityPropertyToMatch,
} from '../utils/no-hardcoded-values/property-matcher';
import {createReactRule} from '../utils/react-rule';
import {
  createStyledComponentsDeclarationVisitor,
  type StyledDeclaration,
} from '../utils/styled-components';

const globalHooksMetadata = metadata.globalStylingHooksMetadata?.global || {};
const allowedPropertiesByHook = new Map<string, string[]>();

Object.entries(globalHooksMetadata).forEach(([hookName, hookMetadata]: [string, any]) => {
  const properties = hookMetadata?.properties;
  if (Array.isArray(properties) && properties.length > 0) {
    allowedPropertiesByHook.set(hookName, properties);
  }
});

function getPropertiesToValidate(property: string): string[] {
  if (property === 'font') {
    return ['font', 'font-size', 'font-weight', 'line-height'];
  } else if (property === 'box-shadow') {
    return ['box-shadow', 'color', 'border-color', 'background-color', 'fill', 'border-width', 'top'];
  } else if (property === 'gap') {
    return ['top'];
  } else {
    const propertiesToValidate = [property];
    const colorProperty = resolveColorPropertyToMatch(property);
    if (colorProperty !== property) {
      propertiesToValidate.push(colorProperty);
    }
    const densityProperty = resolveDensityPropertyToMatch(property);
    if (densityProperty !== property) {
      propertiesToValidate.push(densityProperty);
    }
    return propertiesToValidate;
  }
}

type Declaration = InlineStyleDeclaration | StyledDeclaration;

function noInvalidHookPropertyUsage(): RuleFunction {
  return context => {
    const inspect = (declaration: Declaration) => {
      const property = declaration.property.toLowerCase();
      const propertiesToValidate = getPropertiesToValidate(property);
      visitStaticCssVariableNames(
        declaration.node,
        declaration.value,
        declaration.valueStart,
        variable => {
          if (!variable.name.startsWith('--slds-g-')) return;
          const allowedProperties = allowedPropertiesByHook.get(variable.name);
          if (!allowedProperties) return;
          if (isDynamicCssRange(variable.functionRange[0], variable.range, declaration.dynamicRanges, true)) return;
          if (propertiesToValidate.some(propertyToValidate =>
            matchesCssProperty(allowedProperties, propertyToValidate)
          )) return;

          context.report({
            node: variable.node,
            loc: {
              start: context.sourceCode.getLocFromIndex(variable.range[0]),
              end: context.sourceCode.getLocFromIndex(variable.range[1]),
            },
            messageId: 'invalidProperty',
            data: {
              hook: variable.name,
              property,
              allowedProperties: allowedProperties.join(', '),
            },
          });
        },
      );
    };

    return merge(
      // <div style={{color: 'var(--slds-g-spacing-1)'}} />
      createInlineStyleDeclarationVisitor(context, inspect),
      // styled.div`color: var(--slds-g-spacing-1);`
      createStyledComponentsDeclarationVisitor(context, inspect),
    );
  };
}

export default createReactRule('no-invalid-hook-property-usage', noInvalidHookPropertyUsage);
