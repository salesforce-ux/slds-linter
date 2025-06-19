/**
 * Shared CSS parsing utilities for both ESLint and Stylelint rules
 * This provides consistent parsing logic across both linters
 */

import { Root, Declaration, Rule as PostcssRule, Comment } from 'postcss';
import valueParser from 'postcss-value-parser';
import SelectorParser from 'postcss-selector-parser';

/**
 * CSS AST Node types for ESLint
 */
export interface CssNode {
  type: 'css-rule' | 'css-declaration' | 'css-comment';
  selector?: string;
  property?: string;
  value?: string;
  important?: boolean;
  text?: string;
  startIndex: number;
  endIndex: number;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
}

/**
 * Parse CSS file content and return ESLint-compatible AST
 */
export function parseCssFile(content: string, filename: string): CssNode[] {
  const nodes: CssNode[] = [];
  let lineNumber = 1;
  let columnNumber = 1;

  try {
    // Use PostCSS to parse the CSS
    const root = new Root();
    const lines = content.split('\n');
    
    // Simple CSS parser that mimics PostCSS behavior
    let currentRule: { selector: string; startIndex: number; startLine: number; startColumn: number } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        lineNumber++;
        columnNumber = 1;
        continue;
      }

      // Check for CSS rules (selectors)
      if (!trimmedLine.startsWith('@') && !trimmedLine.includes(':') && trimmedLine.endsWith('{')) {
        const selector = trimmedLine.slice(0, -1).trim();
        currentRule = {
          selector,
          startIndex: content.indexOf(line),
          startLine: lineNumber,
          startColumn: columnNumber
        };
      }
      // Check for CSS declarations
      else if (trimmedLine.includes(':') && !trimmedLine.startsWith('@')) {
        const colonIndex = trimmedLine.indexOf(':');
        const property = trimmedLine.substring(0, colonIndex).trim();
        const valuePart = trimmedLine.substring(colonIndex + 1).trim();
        
        // Handle !important
        const importantIndex = valuePart.lastIndexOf('!important');
        const hasImportant = importantIndex !== -1;
        const value = hasImportant ? valuePart.substring(0, importantIndex).trim() : valuePart;
        
        if (property && value) {
          nodes.push({
            type: 'css-declaration',
            property,
            value,
            important: hasImportant,
            startIndex: content.indexOf(line) + line.indexOf(property),
            endIndex: content.indexOf(line) + line.length,
            line: lineNumber,
            column: columnNumber + line.indexOf(property),
            endLine: lineNumber,
            endColumn: columnNumber + line.length
          });
        }
      }
      // Check for comments
      else if (trimmedLine.startsWith('/*') || trimmedLine.startsWith('//')) {
        const commentText = trimmedLine.replace(/^\/\*|\*\/$/g, '').replace(/^\/\//, '').trim();
        nodes.push({
          type: 'css-comment',
          text: commentText,
          startIndex: content.indexOf(line),
          endIndex: content.indexOf(line) + line.length,
          line: lineNumber,
          column: columnNumber,
          endLine: lineNumber,
          endColumn: columnNumber + line.length
        });
      }
      
      lineNumber++;
      columnNumber = 1;
    }
  } catch (error) {
    // If parsing fails, return empty array
    console.warn(`Failed to parse CSS file ${filename}:`, error);
  }

  return nodes;
}

/**
 * Parse CSS var() functions from a string
 */
export function parseVarFunctions(cssString: string): Array<{
  fullMatch: string;
  varName: string;
  hasFallback: boolean;
  fallbackValue?: string;
  startIndex: number;
  endIndex: number;
}> {
  const results: Array<{
    fullMatch: string;
    varName: string;
    hasFallback: boolean;
    fallbackValue?: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  const varRegex = /var\(([^)]+)\)/g;
  let match;

  while ((match = varRegex.exec(cssString)) !== null) {
    const fullMatch = match[0];
    const args = match[1].split(',').map(arg => arg.trim());
    const varName = args[0];
    const hasFallback = args.length > 1;
    const fallbackValue = hasFallback ? args.slice(1).join(',').trim() : undefined;

    results.push({
      fullMatch,
      varName,
      hasFallback,
      fallbackValue,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
    });
  }

  return results;
}

/**
 * Check if a CSS variable name starts with --slds-
 */
export function isSldsCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--slds-');
}

/**
 * Check if a CSS variable name starts with --sds-
 */
export function isSdsCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--sds-');
}

/**
 * Check if a CSS variable name starts with --lwc-
 */
export function isLwcCssVariable(cssVar: string): boolean {
  return cssVar.startsWith('--lwc-');
}

/**
 * Extract CSS property and value from a declaration string
 */
export function parseCssDeclaration(declaration: string): {
  property: string;
  value: string;
} | null {
  const match = declaration.match(/^([^:]+):\s*(.+)$/);
  if (!match) return null;

  return {
    property: match[1].trim(),
    value: match[2].trim(),
  };
}

/**
 * Check if a CSS property matches target properties
 */
export function isTargetProperty(property: string, propertyTargets: string[] = []): boolean {
  return (
    property.startsWith('--sds-') ||
    property.startsWith('--slds-') ||
    property.startsWith('--lwc-') ||
    propertyTargets.length === 0 ||
    propertyTargets.includes(property)
  );
}

/**
 * Parse CSS calc() functions from a string
 */
export function parseCalcFunctions(cssString: string): Array<{
  fullMatch: string;
  startIndex: number;
  endIndex: number;
}> {
  const results: Array<{
    fullMatch: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  const calcRegex = /calc\([^)]+\)/g;
  let match;

  while ((match = calcRegex.exec(cssString)) !== null) {
    results.push({
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return results;
}

/**
 * Parse CSS color values from a string
 */
export function parseColorValues(cssString: string): Array<{
  value: string;
  startIndex: number;
  endIndex: number;
}> {
  const results: Array<{
    value: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  // Match hex colors, rgb/rgba, hsl/hsla, and named colors
  const colorRegex = /(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|\b[a-zA-Z]+\b)/g;
  let match;

  while ((match = colorRegex.exec(cssString)) !== null) {
    const value = match[0];
    if (isValidColor(value)) {
      results.push({
        value,
        startIndex: match.index,
        endIndex: match.index + value.length,
      });
    }
  }

  return results;
}

/**
 * Parse CSS selectors and extract class names
 */
export function parseCssSelectors(selector: string): Array<{
  className: string;
  startIndex: number;
  endIndex: number;
}> {
  const results: Array<{
    className: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  // Match class selectors (.class-name)
  const classRegex = /\.([a-zA-Z0-9_-]+)/g;
  let match;

  while ((match = classRegex.exec(selector)) !== null) {
    results.push({
      className: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return results;
}

/**
 * Basic color validation
 */
function isValidColor(value: string): boolean {
  // Hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return true;
  
  // RGB/RGBA
  if (/^rgba?\([^)]+\)$/.test(value)) return true;
  
  // HSL/HSLA
  if (/^hsla?\([^)]+\)$/.test(value)) return true;
  
  // Named colors (basic list)
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'transparent', 'currentColor', 'inherit', 'initial', 'unset'
  ];
  if (namedColors.includes(value.toLowerCase())) return true;
  
  return false;
} 