import {merge, type RuleFunction} from '@eslint-react/kit';
import {isDynamicCssRange} from '../utils/css-value';
import {
  createInlineStyleDeclarationVisitor,
  type InlineStyleDeclaration,
} from '../utils/inline-style';
import {
  analyzeHardcodedValue,
  getHardcodedValueSettings,
  type HardcodedValueOptions,
} from '../utils/no-hardcoded-values/engine';
import {createReactRule} from '../utils/react-rule';
import {
  createStyledComponentsDeclarationVisitor,
  type StyledDeclaration,
} from '../utils/styled-components';

const schema = [{
  type: 'object',
  properties: {
    reportNumericValue: {type: 'string', enum: ['never', 'always', 'hasReplacement'], default: 'always'},
    customMapping: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          properties: {type: 'array', items: {type: 'string'}},
          values: {type: 'array', items: {type: 'string'}},
        },
        required: ['properties', 'values'],
      },
    },
    deterministicOnly: {type: 'boolean', default: false},
  },
  additionalProperties: false,
}];

type Declaration = InlineStyleDeclaration | StyledDeclaration;

function noHardcodedValuesSlds2(): RuleFunction {
  return context => {
    const options = (context.options[0] || {}) as HardcodedValueOptions;
    const settings = getHardcodedValueSettings(context.settings);
    const inspect = (declaration: Declaration) => {
      const valueLocation = context.sourceCode.getLocFromIndex(declaration.valueStart);
      const findings = analyzeHardcodedValue({
        property: declaration.property,
        value: declaration.value,
        sourceStart: declaration.valueStart,
        source: {
          filename: context.filename,
          line: valueLocation.line,
          column: valueLocation.column,
          locationAt: offset => context.sourceCode.getLocFromIndex(declaration.valueStart + offset),
        },
        options,
        settings,
      });
      for (const finding of findings) {
        if (isDynamicCssRange(finding.range[0], finding.range, declaration.dynamicRanges, true)) continue;
        context.report({
          node: declaration.node,
          loc: {
            start: context.sourceCode.getLocFromIndex(finding.range[0]),
            end: context.sourceCode.getLocFromIndex(finding.range[1]),
          },
          messageId: finding.messageId,
          data: finding.data,
          ...(
            finding.replacement && declaration.canFix && !isDynamicCssRange(
              declaration.valueStart,
              [declaration.valueStart, declaration.valueStart + declaration.value.length],
              declaration.dynamicRanges,
              true,
            )
              ? {fix: fixer => fixer.replaceTextRange(finding.range, finding.replacement!)}
              : {}
          ),
        });
      }
    };

    return merge(
      // <div style={{color: '#fff'}} />
      createInlineStyleDeclarationVisitor(context, inspect),
      // styled.div`color: #fff;`
      createStyledComponentsDeclarationVisitor(context, inspect),
    );
  };
}

export default createReactRule('no-hardcoded-values-slds2', noHardcodedValuesSlds2, true, schema);
