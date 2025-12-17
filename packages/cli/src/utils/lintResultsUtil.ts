// src/utils/lintResultsUtil.ts

import path from 'path';
import { createClickableLineCol } from './editorLinkUtil';
import { Logger } from '../utils/logger';
import { Colors } from './colors';
import { LintResult, LintResultEntry, SarifResultEntry, LintResultSummary } from '../types';

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
 * Example output:
 * "✖ 3 SLDS Violations (1 error, 2 warnings)"
 * "⚠ 3 SLDS Violations (0 error, 3 warnings)"
 * "✖ 3 SLDS Violations (3 errors, 0 warnings)"
 */
function printTotalViolationsSummary(totalErrors: number, totalWarnings: number) {
  const totalProblems = totalErrors + totalWarnings;
  if(!totalProblems){
    return;
  }
  let totalProblemsText = `${totalProblems} SLDS Violation${totalProblems !== 1 ? 's' : ''}`;
  if (totalErrors > 0) {
    totalProblemsText = Colors.error(`✖ ${totalProblemsText}`);
  } else {
    totalProblemsText = Colors.warning(`⚠ ${totalProblemsText}`);
  }

  const totalBreakdown = [
    Colors.error(`${totalErrors} error${totalErrors !== 1 ? 's' : ''}`),
    Colors.warning(`${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}`)
  ];
  console.log(`${totalProblemsText} (${totalBreakdown.join(', ')})`);
}

/**
 * Example output:
 * "  1 error and 2 warnings potentially fixable with the `--fix` option."
 * "  3 errors potentially fixable with the `--fix` option."
 * "  3 warnings potentially fixable with the `--fix` option."
 */
function printFixableViolationsSummary(fixableErrors: number, fixableWarnings: number) {
  const fixableTotal = fixableErrors + fixableWarnings;
  if (!fixableTotal) {
    return;
  }
  const fixableBreakdown = [];
  if (fixableErrors > 0) {
    fixableBreakdown.push(Colors.error(`${fixableErrors} error${fixableErrors !== 1 ? 's' : ''}`));
  }
  if (fixableWarnings > 0) {
    fixableBreakdown.push(Colors.warning(`${fixableWarnings} warning${fixableWarnings !== 1 ? 's' : ''}`));
  }

  console.log(`  ${fixableBreakdown.join(' and ')} potentially fixable with the \`--fix\` option.`);
}

/**
 * Prints detailed lint results for each file that has issues.
 *
 * @param results - Array of lint results.
 * @param editor - The chosen editor for clickable links (e.g., "vscode", "atom", "sublime"). If not provided, will auto-detect.
 */
export function printLintResults(results: LintResult[], editor?: string): LintResultSummary {
  let totalErrors = 0;
  let totalWarnings = 0;
  let fixableErrors = 0;
  let fixableWarnings = 0;

  results.forEach(result => {
    // Check if there are any messages to display
    if (!result.messages || result.messages.length === 0) return;

    const absolutePath = result.filePath || '';
    const relativeFile = path.relative(process.cwd(), absolutePath) || 'Unknown file';
    
    // Print file name with a preceding new line for spacing.
    console.log(`\n${Colors.info.underline(relativeFile)}\n`);

    // Prepare table data
    const tableData: string[][] = [];

    // Process all messages (errors and warnings)
    result.messages.forEach((msg: any) => {
      const isError = msg.severity === 2;
      const isWarning = msg.severity === 1;
      
      if (isError) {
        totalErrors++;
        if (msg.fix) fixableErrors++;
      } else if (isWarning) {
        totalWarnings++;
        if (msg.fix) fixableWarnings++;
      }
      
      // Create clickable line:column link
      const lineCol = msg.line && msg.column ? `${msg.line}:${msg.column}` : '-';
      const clickableLineCol = msg.line && msg.column 
        ? createClickableLineCol(lineCol, absolutePath, msg.line, msg.column, editor)
        : lineCol;
      
      const severityText = isError ? Colors.error('error') : Colors.warning('warning');
      // Replace newlines and multiple spaces to prevent layout issues
      const message = parseText(msg.message);
      const ruleId = msg.ruleId ? Colors.lowEmphasis(replaceNamespaceinRules(msg.ruleId)) : '';
      
      tableData.push([clickableLineCol, severityText, message, ruleId]);
    });

    // Print with simple formatting (no table library to avoid ANSI width issues)
    if (tableData.length > 0) {
      tableData.forEach(([lineCol, severity, message, ruleId], index) => {
        // Add blank line before each row except the first for vertical spacing
        if (index > 0) console.log();
        console.log(`  ${lineCol}  ${severity}  ${message}  ${ruleId}`);
      });
    }
  });

  Logger.newLine();
  // Print summary
  if (totalErrors>0 || totalWarnings>0) {
    printTotalViolationsSummary(totalErrors, totalWarnings);
    printFixableViolationsSummary(fixableErrors, fixableWarnings);    
  } else {
    Logger.success('No SLDS Violations found.');
  }
  return {totalErrors, totalWarnings, fixableErrors, fixableWarnings}
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