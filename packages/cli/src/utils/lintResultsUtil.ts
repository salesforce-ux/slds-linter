// src/utils/lintResultsUtil.ts

import chalk from 'chalk';
import path from 'path';
import { createClickableLineCol } from './editorLinkUtil';
import { Logger } from '../utils/logger';
import { LintResult, LintResultEntry, SarifResultEntry } from '../types';

/**
 * 
 * @param id - Rule id
 * @returns updated Rule id without the namespace @salesforce-ux
 */
export function replaceNamespaceinRules(id: string) {
  return id.includes("@salesforce-ux/")
    ? id.replace("@salesforce-ux/", "")
    : id;
}
/**
 * 
 * @param text - The input text that could either be a plain string or a stringified JSON object.
 * @returns The parsed message or the original string if parsing fails.
 */
export function parseText(text: string): string {
  let safeText = text;
  try {
    // Try to parse the text as JSON
    const parsed = JSON.parse(text);
    // If successful, return the message property or the whole object if no message
    safeText = parsed.message || JSON.stringify(parsed);
  } catch (error) {
    // If JSON parsing fails, return the original string
    safeText = text;
  }
  return safeText.endsWith('.') ? safeText : `${safeText}.`;
}

/**
 * Prints detailed lint results for each file that has issues.
 *
 * @param results - Array of lint results.
 * @param editor - The chosen editor for clickable links (e.g., "vscode", "atom", "sublime"). If not provided, will auto-detect.
 */
export function printLintResults(results: LintResult[], editor?: string): void {
  results.forEach(result => {
    const hasErrors = result.errors && result.errors.length > 0;
    const hasWarnings = result.warnings && result.warnings.length > 0;
    if (!hasErrors && !hasWarnings) return;

    const absolutePath = result.filePath || '';
    const relativeFile = path.relative(process.cwd(), absolutePath) || 'Unknown file';
    // Print file name with a preceding new line for spacing.
    Logger.newLine().info(`${chalk.bold(relativeFile)}`);

    if (hasErrors) {
      result.errors.forEach((error: any) => {
        if (error.line && error.column && absolutePath) {
          const lineCol = `${error.line}:${error.column}`;
          const clickable = createClickableLineCol(lineCol, absolutePath, error.line, error.column, editor);
          const ruleId = error.ruleId ? chalk.dim(replaceNamespaceinRules(error.ruleId)) : '';
          Logger.error(`  ${clickable}  ${parseText(error.message)}  ${ruleId}`);
        } else {
          Logger.error(`  ${chalk.red('Error:')} ${parseText(error.message)}`);
        }
      });
    }

    if (hasWarnings) {
      result.warnings.forEach((warn: any) => {
        if (warn.line && warn.column && absolutePath) {
          const lineCol = `${warn.line}:${warn.column}`;
          const clickable = createClickableLineCol(lineCol, absolutePath, warn.line, warn.column, editor);
          const ruleId = warn.ruleId ? chalk.dim(replaceNamespaceinRules(warn.ruleId)) : '';
          Logger.warning(`  ${clickable}  ${parseText(warn.message)}  ${ruleId}`);
        } else {
          Logger.warning(`  ${chalk.yellow('Warning:')} ${parseText(warn.message)}`);
        }
      });
    }
  });
}

export function transformedResults(lintResult: LintResult, entry: LintResultEntry, level: 'error' | 'warning'): SarifResultEntry {
  return {
    ruleId: replaceNamespaceinRules(entry.ruleId),
    level,
    messageText: parseText(entry.message),
    fileUri: path.relative(process.cwd(), lintResult.filePath),
    startLine: entry.line,
    startColumn: entry.column,
    endLine: entry.line,
    endColumn: entry.endColumn
  }
}