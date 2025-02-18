import fs from 'fs/promises'; // Use promises to read the file asynchronously
import stylelint, { Rule, PostcssResult } from 'stylelint';
import generateTable from '../../utils/generateTable';
import {
  findClosestColorHook,
  convertToHex,
  isHardCodedColor,
} from '../../utils/color-lib-utils';
import { Root } from 'postcss';
import { metadataFileUrl } from '../../utils/metaDataFileUrl';
import replacePlaceholders from '../../utils/util';
import ruleMetadata from '../../utils/rulesMetadata';
const { utils, createPlugin } = stylelint;

// Define the structure of a hook
interface Hook {
  name: string;
  properties: string[];
}

// Define the structure of the color data
interface StylinghookData {
  [value: string]: {
    hooks: Hook[];
  };
}

const ruleName:string = 'slds/no-hardcoded-values';

const { severityLevel = 'error', warningMsg = '', errorMsg = '', ruleDesc = 'No description provided' } = ruleMetadata(ruleName) || {};

const messages = utils.ruleMessages(ruleName, {
  rejected: (oldValue: string, newValue: string) =>
    replacePlaceholders(errorMsg, { oldValue, newValue} ),
  suggested: (color: string) =>
    `The "${color}" static value has no replacement styling hook.`,  //TODO: Messaging.
});

const isHardCodedDensifyValue = (cssValue: string): boolean => {
  // Regular expression to match number, number with px, or number with rem
  const regex = /^\d+(\.\d+)?(px|rem)?$/;
  return regex.test(cssValue);
};

// Load and parse the JSON file
const loadStylinghooksData = async (): Promise<StylinghookData> => {
  const jsonFilePath = metadataFileUrl('public/metadata/valueToStylinghook.slds.json');
  
  const jsonData = await fs.readFile(jsonFilePath, 'utf8');
  return JSON.parse(jsonData) as StylinghookData; // Cast the parsed data to StylinghookData type
};

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

const findExactMatchStylingHook = (
  cssValue: string,
  supportedStylinghooks: StylinghookData,
  cssProperty: string
): { name: string }[] => {
  return Object.entries(supportedStylinghooks).reduce(
    (acc, [sldsValue, data]) => {
      if (sldsValue && cssValue === sldsValue) {
        const hooks = data.hooks;

        hooks.forEach((hook) => {
          if (
            matchesCssProperty(hook.properties, cssProperty) &&
            sldsValue === cssValue
          ) {
            acc.push({ name: hook.name });
          }
        });
      }
      return acc;
    },
    []
  );
};

function validateOptions(result: PostcssResult, options: any): boolean {
  return utils.validateOptions(result, ruleName, {
    actual: options,
    possible: {}, // Customize as needed
  });
}

function rule(primaryOptions?: any) {
  return async (root: Root, result: PostcssResult) => {
    const supportedStylinghooks = await loadStylinghooksData(); // Await the loading of color data

    root.walkDecls((decl) => {
      const severity =
                    result.stylelint.config.rules[ruleName]?.[1] || severityLevel; // Default to "error"
      const cssProperty = decl.prop.toLowerCase();
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
      ];

      const value = decl.value;
      const index = decl.toString().indexOf(decl.value); // Start index of the value
      const endIndex = index + decl.value.length;

      // For color changes
      if (
        matchesCssProperty(colorProperties, cssProperty) &&
        isHardCodedColor(value)
      ) {
        const hexValue = convertToHex(value);
        if (hexValue) {
          const closestHooks = findClosestColorHook(
            hexValue,
            supportedStylinghooks,
            cssProperty
          );
          if (closestHooks.length > 0) {
            utils.report({
              message: messages.rejected(value, generateTable(closestHooks)),
              node: decl,
              index,
              endIndex,
              result,
              ruleName,
              severity
            });
          } else {
            utils.report({
              message: messages.suggested(value),
              node: decl,
              index,
              endIndex,
              result,
              ruleName,
              severity
            });
          }
        }
      } else if (
        matchesCssProperty(densificationProperties, cssProperty) &&
        isHardCodedDensifyValue(value)
      ) {
        const closestHooks = findExactMatchStylingHook(
          value,
          supportedStylinghooks,
          cssProperty
        );
        if (closestHooks.length > 0) {
          utils.report({
            message: messages.rejected(value, generateTable(closestHooks)),
            node: decl,
            index,
            endIndex,
            result,
            ruleName,
            severity
          });
        } else {
          utils.report({
            message: messages.suggested(value),
            node: decl,
            index,
            endIndex,
            result,
            ruleName,
            severity
          });
        }
      }
    });
  };
}

export default createPlugin(ruleName, rule as unknown as Rule);
