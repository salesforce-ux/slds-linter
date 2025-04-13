import { Declaration, Root } from 'postcss';
import valueParser from 'postcss-value-parser';
import stylelint, { PostcssResult, RuleSeverity } from 'stylelint';
import {
  convertToHex,
  findClosestColorHook,
  isValidColor,
} from '../../utils/color-lib-utils';
import generateSuggestionsList from '../../utils/generateSuggestionsList';
import ruleMetadata from '../../utils/rulesMetadata';
import replacePlaceholders from '../../utils/util';
import { ValueToStylingHooksMapping } from '../../services/metadata.service';
const { utils, createPlugin } = stylelint;

// Define the structure of a hook
interface Hook {
  name: string;
  properties: string[];
}

interface MessagesObj {
  rejected: (oldValue: string, newValue: string)=>string,
  suggested: (oldValue: string) => string
}

function toRuleMessages(ruleName: string, warningMsg: string):MessagesObj {
  return utils.ruleMessages(ruleName, {
    rejected: (oldValue: string, newValue: string) => replacePlaceholders(warningMsg, { oldValue, newValue }),
    suggested: (oldValue: string) => `There’s no replacement styling hook for the ${oldValue} static value. Remove the static value.`,
  });
}

/**
 * Check if any of the hook properties match the provided cssProperty using wildcard matching.
 * @param hookProperties - Array of property patterns (can contain wildcards like `*`)
 * @param cssProperty - The CSS property to be checked
 * @returns true if a match is found, otherwise false
 */
function matchesCssProperty(
  hookProperties: string[],
  cssProperty: string
): boolean {
  return hookProperties.some((propertyPattern: string) => {
    const regexPattern = new RegExp(
      '^' + propertyPattern.replace(/\*/g, '.*') + '$'
    );
    return regexPattern.test(cssProperty);
  });
}

export const findExactMatchStylingHook = (
  cssValue: string,
  supportedStylinghooks: ValueToStylingHooksMapping,
  cssProperty: string
): { name: string }[] => {
  let matchedHooks = [];
  if (cssValue in supportedStylinghooks) {
    matchedHooks = supportedStylinghooks[cssValue] || [];
    return matchedHooks
      .filter((hook) => {
        return matchesCssProperty(hook.properties, cssProperty);
      })
      .map((hook) => hook.name);
  }
  return matchedHooks;
};

const colorProperties = [
  'color',
  'fill',
  'background',
  'background-color',
  'stroke',
  'border*-color',
  'outline-color',
];
const densificationProperties = [
  'font-size',
  'border*',
  'margin*',
  'padding*',
  'width',
  'height',
  'top',
  'right',
  'left',
  'box-shadow',
];

const rgbColorFunctions = [
  'rgb',
  'rgba',
  'hsl',
  'hsla'
];

const forEachColorValue = (
  parsedValue: valueParser.ParsedValue,
  cb: valueParser.WalkCallback
) => {
  parsedValue.walk(
    (node: valueParser.Node, index: number, nodes: valueParser.Node[]) => {
      if(node.type === 'function' && rgbColorFunctions.includes(node.value)){
        // override the type to word
        node.value = valueParser.stringify(node);
        //@ts-ignore
        node.type = 'word';
        cb(node, index, nodes);
      } else if (node.type === 'word' && isValidColor(node.value)) {
        cb(node, index, nodes);
      }
    }
  );
};

const forEachDensifyValue = (
  parsedValue: valueParser.ParsedValue,
  cb: valueParser.WalkCallback
) => {
  const ALLOWED_UNITS = ['px', 'em', 'rem', '%', 'ch'];
  parsedValue.walk(
    (node: valueParser.Node, index: number, nodes: valueParser.Node[]) => {
      const parsedValue = valueParser.unit(node.value);
      if (node.type !== 'word' || !parsedValue) {
        // Conider only node of type word and parsable by unit function
        return;
      } else if (
        parsedValue.unit &&
        !ALLOWED_UNITS.includes(parsedValue.unit)
      ) {
        // If unit exists make sure its in allowed list
        return;
      } else if (isNaN(Number(parsedValue.number))) {
        // Consider only valid numeric values
        return;
      } else if (Number(parsedValue.number) === 0) {
        // Do not report zero value
        return;
      }
      cb(node, index, nodes);
    }
  );
};

function reportMatchingHooks(
  valueNode: valueParser.Node | Declaration,
  suggestions: string[],
  offsetIndex: number,
  props: Partial<stylelint.Problem>,
  messages:MessagesObj,
  fix?: stylelint.FixCallback
) {
  let index = offsetIndex;
  const value = valueNode.value;
  let endIndex = offsetIndex + valueNode.value.length;
  const node = valueNode as any;
  if ('sourceIndex' in valueNode && 'sourceEndIndex' in valueNode) {
    index = valueNode.sourceIndex + offsetIndex;
    endIndex = valueNode.sourceEndIndex + offsetIndex;
  }

  const reportProps = {
    node,
    index,
    endIndex,
    ...props,
  };

  if (suggestions.length > 0) {
    utils.report(<stylelint.Problem>{
      message: JSON.stringify({
        message: messages.rejected(value, generateSuggestionsList(suggestions)),
        suggestions,
      }),
      ...reportProps,
      fix: suggestions.length ===1?fix:null
    });
  } else {
    utils.report(<stylelint.Problem>{
      message: JSON.stringify({
        message: messages.suggested(value),
        suggestions: [],
      }),
      ...reportProps,
    });
  }
}

export const createNoHardcodedValueRule = (
  ruleName: string,
  supportedStylinghooks: ValueToStylingHooksMapping
) => {
  const {
    severityLevel = 'error',
    warningMsg = '',
    errorMsg = '',
    ruleDesc = 'No description provided',
  } = ruleMetadata(ruleName) || {};

  const messages = toRuleMessages(ruleName, warningMsg);

  const ruleFunction: Partial<stylelint.Rule> = (
    primaryOptions: boolean,
    { severity = severityLevel as RuleSeverity } = {}
  ) => {
    return (root: Root, result: PostcssResult) => {
      root.walkDecls((decl) => {
        const cssProperty = decl.prop.toLowerCase();
        const cssValue = decl.value;
        const parsedValue = valueParser(cssValue);
        const cssValueStartIndex = decl.toString().indexOf(cssValue);
        const isColorProp = matchesCssProperty(colorProperties, cssProperty);
        const isDensiProp = matchesCssProperty(
          densificationProperties,
          cssProperty
        );
        let closestHooks = [];

        const reportProps: Partial<stylelint.Problem> = {
          node: decl,
          result,
          ruleName,
          severity,
        };

        if (cssProperty === 'box-shadow' && cssValue in supportedStylinghooks) {
          closestHooks = findExactMatchStylingHook(
            cssValue,
            supportedStylinghooks,
            cssProperty
          );
          const fix = ()=> {
            decl.value = `var(${closestHooks[0]})`;
          };

          if (closestHooks.length > 0) {
            // Report suggessions
            reportMatchingHooks(
              decl,
              closestHooks,
              cssValueStartIndex,
              reportProps,
              messages,
              fix
            );
            return;
          }
        }

        if (isColorProp) {
          forEachColorValue(parsedValue, (node) => {
            const hexValue = convertToHex(node.value);
            if (!hexValue) {
              return;
            }
            closestHooks = findClosestColorHook(
              hexValue,
              supportedStylinghooks,
              cssProperty
            );

            const fix = ()=> {
              decl.value = decl.value.replace(valueParser.stringify(node), `var(${closestHooks[0]})`);
            };

            // Report suggessions
            reportMatchingHooks(
              node,
              closestHooks,
              cssValueStartIndex,
              reportProps,
              messages,
              fix
            );
          });
        } else if (isDensiProp) {
          forEachDensifyValue(parsedValue, (node) => {
            closestHooks = findExactMatchStylingHook(
              node.value,
              supportedStylinghooks,
              cssProperty
            );

            const fix = ()=> {
              decl.value = decl.value.replace(valueParser.stringify(node), `var(${closestHooks[0]})`);
            };

            // Report suggessions
            reportMatchingHooks(
              node,
              closestHooks,
              cssValueStartIndex,
              reportProps,
              messages,
              fix
            );
          });
        }
      });
    };
  };

  ruleFunction.ruleName = ruleName;
  ruleFunction.messages = <any>messages;
  ruleFunction.meta = {
    url: '',
    fixable: true,
  };

  // Export the plugin
  return createPlugin(ruleName, <stylelint.Rule>ruleFunction);
};
