/**
 * JSX/TSX surface-extraction layer.
 *
 * Provides ESLint visitor factories that surface the SLDS-relevant styling
 * artifacts in React source:
 *   - `className` / `class` tokens (string, template literal, clsx/classnames)
 *   - inline `style={{ ... }}` object declarations
 *   - CSS-in-JS tagged template literals (styled-components / emotion)
 *
 * All findings are expressed with absolute source offsets so rules can report
 * with `context.sourceCode.getLocFromIndex` and fix with
 * `fixer.replaceTextRange`, without needing the underlying parser's node shapes.
 */
import { kebabCase, reactNumberToCssValue } from '../style-value-checks';
import { walkCssInJs } from './cssinjs-walker';

const JSX_EXTENSIONS = ['.jsx', '.tsx', '.js', '.ts', '.mjs', '.cjs', '.mts', '.cts'];
const CLASS_HELPER_CALLEES = new Set(['clsx', 'classnames', 'classNames', 'cx']);

export interface JsxClass {
  className: string;
  start: number;
  end: number;
  mappable: boolean;
  /** True only for CSS-in-JS selectors; identifies the trailing class. */
  isLastInSelector: boolean;
}

export interface JsxDeclaration {
  property: string;
  valueText: string;
  propertyStart: number | null;
  propertyEnd: number | null;
  propertyMappable: boolean;
  valueStart: number | null;
  valueEnd: number | null;
  valueMappable: boolean;
  /** Source of the declaration, for debugging / conditional handling. */
  origin: 'style-object' | 'css-in-js';
}

/**
 * Whether a filename should be handled by the JSX/TS visitors.
 */
export function isJsxLikeFile(filename: string): boolean {
  if (!filename) {
    return false;
  }
  const lower = filename.toLowerCase();
  return JSX_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Merge multiple ESLint visitor objects. When several visitors share the same
 * selector key, all handlers run in order.
 */
export function mergeVisitors(...visitors: Record<string, any>[]): Record<string, any> {
  const merged: Record<string, any[]> = {};
  for (const visitor of visitors) {
    for (const key of Object.keys(visitor)) {
      (merged[key] ||= []).push(visitor[key]);
    }
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(merged)) {
    const handlers = merged[key];
    result[key] = handlers.length === 1 ? handlers[0] : (node: any) => handlers.forEach((h) => h(node));
  }
  return result;
}

/**
 * Report a finding by absolute source offsets.
 */
export function reportRange(
  context: any,
  start: number,
  end: number,
  descriptor: { messageId: string; data?: any; fix?: (fixer: any) => any }
): void {
  const sourceCode = context.sourceCode;
  context.report({
    loc: {
      start: sourceCode.getLocFromIndex(start),
      end: sourceCode.getLocFromIndex(end),
    },
    ...descriptor,
  });
}

/**
 * Split a class attribute value into individual class tokens with absolute
 * source offsets. `baseOffset` is the source offset of `text[0]`.
 */
function splitClassTokens(text: string, baseOffset: number): Array<{ token: string; start: number; end: number }> {
  const tokens: Array<{ token: string; start: number; end: number }> = [];
  for (const match of text.matchAll(/\S+/g)) {
    const index = match.index ?? 0;
    tokens.push({
      token: match[0],
      start: baseOffset + index,
      end: baseOffset + index + match[0].length,
    });
  }
  return tokens;
}

function emitClassTokens(text: string, baseOffset: number, onClass: (c: JsxClass) => void): void {
  for (const { token, start, end } of splitClassTokens(text, baseOffset)) {
    onClass({ className: token, start, end, mappable: true, isLastInSelector: false });
  }
}

/**
 * Handle an expression used as a className value (string, template literal,
 * clsx()/classnames() call, arrays, conditionals).
 */
function handleClassNameExpression(node: any, sourceCode: any, onClass: (c: JsxClass) => void): void {
  if (!node) {
    return;
  }
  switch (node.type) {
    case 'Literal':
      if (typeof node.value === 'string') {
        emitClassTokens(node.value, node.range[0] + 1, onClass);
      }
      break;
    case 'TemplateLiteral':
      node.quasis.forEach((quasi: any) => {
        // TemplateElement.range includes the delimiters (`` ` ``, `${`, `}`);
        // the raw content starts one character in.
        emitClassTokens(quasi.value.raw, quasi.range[0] + 1, onClass);
      });
      break;
    case 'CallExpression': {
      const calleeName = node.callee?.type === 'Identifier' ? node.callee.name : undefined;
      if (calleeName && CLASS_HELPER_CALLEES.has(calleeName)) {
        node.arguments.forEach((arg: any) => handleClassNameExpression(arg, sourceCode, onClass));
      }
      break;
    }
    case 'ArrayExpression':
      node.elements.forEach((el: any) => el && handleClassNameExpression(el, sourceCode, onClass));
      break;
    case 'ObjectExpression':
      node.properties.forEach((prop: any) => {
        if (prop.type === 'Property' && !prop.computed) {
          const key = prop.key;
          if (key.type === 'Literal' && typeof key.value === 'string') {
            emitClassTokens(key.value, key.range[0] + 1, onClass);
          }
        }
      });
      break;
    case 'ConditionalExpression':
      handleClassNameExpression(node.consequent, sourceCode, onClass);
      handleClassNameExpression(node.alternate, sourceCode, onClass);
      break;
    case 'LogicalExpression':
      handleClassNameExpression(node.right, sourceCode, onClass);
      break;
    default:
      break;
  }
}

/**
 * Visitor for `className` / `class` attributes.
 */
export function createClassNameVisitor(context: any, onClass: (c: JsxClass) => void): Record<string, any> {
  const sourceCode = context.sourceCode;
  return {
    JSXAttribute(node: any) {
      const name = node.name?.name;
      if (name !== 'className' && name !== 'class') {
        return;
      }
      const value = node.value;
      if (!value) {
        return;
      }
      if (value.type === 'Literal') {
        handleClassNameExpression(value, sourceCode, onClass);
      } else if (value.type === 'JSXExpressionContainer') {
        handleClassNameExpression(value.expression, sourceCode, onClass);
      }
    },
  };
}

function propertyKeyName(prop: any): string | null {
  const key = prop.key;
  if (prop.computed) {
    return null;
  }
  if (key.type === 'Identifier') {
    return key.name;
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }
  return null;
}

/**
 * Visitor for inline `style={{ ... }}` object expressions.
 */
export function createStyleObjectVisitor(
  context: any,
  onDeclaration: (decl: JsxDeclaration) => void
): Record<string, any> {
  return {
    JSXAttribute(node: any) {
      if (node.name?.name !== 'style') {
        return;
      }
      const value = node.value;
      if (!value || value.type !== 'JSXExpressionContainer') {
        return;
      }
      const expr = value.expression;
      if (!expr || expr.type !== 'ObjectExpression') {
        return;
      }
      expr.properties.forEach((prop: any) => {
        if (prop.type !== 'Property') {
          return;
        }
        const rawKey = propertyKeyName(prop);
        if (rawKey === null) {
          return;
        }
        const property = kebabCase(rawKey);

        // Property offsets (content only, for custom-property string-literal keys)
        let propertyStart: number | null = null;
        let propertyEnd: number | null = null;
        let propertyMappable = false;
        if (prop.key.type === 'Literal') {
          propertyStart = prop.key.range[0] + 1;
          propertyEnd = prop.key.range[1] - 1;
          propertyMappable = true;
        } else if (prop.key.type === 'Identifier') {
          propertyStart = prop.key.range[0];
          propertyEnd = prop.key.range[1];
          propertyMappable = true;
        }

        let valueText = '';
        let valueStart: number | null = null;
        let valueEnd: number | null = null;
        let valueMappable = false;

        const val = prop.value;
        if (val.type === 'Literal') {
          if (typeof val.value === 'string') {
            valueText = val.value;
            valueStart = val.range[0] + 1;
            valueEnd = val.range[1] - 1;
            valueMappable = true;
          } else if (typeof val.value === 'number') {
            // Numeric values are intentionally skipped: `valueMappable` stays
            // false so value handlers never run. A JS number literal cannot be
            // rewritten into a `var()`/hook string, and the derived CSS text
            // (e.g. "16px") has a different length than the source literal
            // ("16"), which would break any offset arithmetic. Consumers who
            // want these checked should use a string value ('16px').
            valueText = reactNumberToCssValue(property, val.value);
            valueStart = val.range[0];
            valueEnd = val.range[1];
            valueMappable = false;
          }
        }

        onDeclaration({
          property,
          valueText,
          propertyStart,
          propertyEnd,
          propertyMappable,
          valueStart,
          valueEnd,
          valueMappable,
          origin: 'style-object',
        });
      });
    },
  };
}

function isStyledTag(tag: any): boolean {
  if (!tag) {
    return false;
  }
  // css`...`, keyframes`...`, createGlobalStyle`...`, injectGlobal`...`
  if (tag.type === 'Identifier') {
    return ['css', 'keyframes', 'createGlobalStyle', 'injectGlobal'].includes(tag.name);
  }
  // styled.div`...`, styled.button`...`
  if (tag.type === 'MemberExpression') {
    return tag.object?.type === 'Identifier' && tag.object.name === 'styled';
  }
  // styled(Component)`...`, styled('div')`...`, styled.div.attrs(...)`...`
  if (tag.type === 'CallExpression') {
    const callee = tag.callee;
    if (callee?.type === 'Identifier' && callee.name === 'styled') {
      return true;
    }
    if (callee?.type === 'MemberExpression') {
      let obj = callee.object;
      while (obj?.type === 'MemberExpression' || obj?.type === 'CallExpression') {
        obj = obj.object ?? obj.callee?.object;
      }
      return obj?.type === 'Identifier' && obj.name === 'styled';
    }
  }
  return false;
}

/**
 * Convenience visitor that surfaces declarations from BOTH inline style objects
 * and CSS-in-JS template literals through a single callback. CSS-in-JS class
 * selectors are optionally surfaced via `onClass`.
 */
export function createDeclarationVisitor(
  context: any,
  onDeclaration: (decl: JsxDeclaration) => void,
  onClass?: (c: JsxClass) => void
): Record<string, any> {
  return mergeVisitors(
    createStyleObjectVisitor(context, onDeclaration),
    createCssInJsVisitor(context, onDeclaration, onClass)
  );
}

/**
 * Visitor for CSS-in-JS tagged template literals.
 */
export function createCssInJsVisitor(
  context: any,
  onDeclaration: (decl: JsxDeclaration) => void,
  onClass?: (c: JsxClass) => void
): Record<string, any> {
  const sourceCode = context.sourceCode;
  return {
    TaggedTemplateExpression(node: any) {
      if (!isStyledTag(node.tag)) {
        return;
      }
      const { declarations, classes } = walkCssInJs(node.quasi, sourceCode);
      declarations.forEach((decl) => {
        onDeclaration({
          property: decl.property,
          valueText: decl.valueText,
          propertyStart: decl.propertyStart,
          propertyEnd: decl.propertyEnd,
          propertyMappable: decl.propertyMappable,
          valueStart: decl.valueStart,
          valueEnd: decl.valueEnd,
          valueMappable: decl.valueMappable,
          origin: 'css-in-js',
        });
      });
      if (onClass) {
        classes.forEach((cls) => {
          if (cls.start === null || cls.end === null) {
            return;
          }
          onClass({
            className: cls.className,
            start: cls.start,
            end: cls.end,
            mappable: cls.mappable,
            isLastInSelector: cls.isLastInSelector,
          });
        });
      }
    },
  };
}

/**
 * Build a synthetic css-tree-like Declaration node plus a proxied handler
 * context so that the existing no-hardcoded-values handlers can run against a
 * JSX declaration whose value is a string. Returns null when the declaration
 * value cannot be safely fixed/inspected.
 */
export function synthesizeDeclarationForHandlers(
  context: any,
  decl: JsxDeclaration
): { node: any; proxiedContext: any } | null {
  if (decl.valueStart === null || decl.valueEnd === null || !decl.valueMappable) {
    return null;
  }
  const sourceCode = context.sourceCode;
  const startLoc = sourceCode.getLocFromIndex(decl.valueStart);
  const endLoc = sourceCode.getLocFromIndex(decl.valueEnd);

  const valueNode: any = {
    type: 'Value',
    range: [decl.valueStart, decl.valueEnd],
    loc: {
      start: { line: startLoc.line, column: startLoc.column, offset: decl.valueStart },
      end: { line: endLoc.line, column: endLoc.column, offset: decl.valueEnd },
    },
  };

  const node: any = {
    type: 'Declaration',
    property: decl.property,
    value: valueNode,
    range: [decl.valueStart, decl.valueEnd],
    loc: valueNode.loc,
  };

  const proxiedSourceCode = new Proxy(sourceCode, {
    get(target: any, key: string) {
      if (key === 'getText') {
        return (arg?: any) => (arg === valueNode ? decl.valueText : arg ? target.getText(arg) : target.getText());
      }
      return target[key];
    },
  });

  const proxiedContext = new Proxy(context, {
    get(target: any, key: string) {
      if (key === 'sourceCode') {
        return proxiedSourceCode;
      }
      return target[key];
    },
  });

  return { node, proxiedContext };
}
