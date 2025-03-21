import path from 'path';
import fs, { writeFile } from 'fs/promises';
import { mkConfig, generateCsv, asString } from 'export-to-csv';
import { Logger } from '../utils/logger';
import { LintResult } from '../types';
import { SarifBuilder, SarifRunBuilder, SarifResultBuilder, SarifRuleBuilder } from 'node-sarif-builder';
import { createWriteStream } from 'fs';
import { JsonStreamStringify } from 'json-stream-stringify';
import {getRuleDescription} from "./config.resolver";
import { parseText, replaceNamespaceinRules } from '../utils/lintResultsUtil';


export interface ReportOptions {
  outputPath: string;
  toolName: string;
  toolVersion: string;
}

export class ReportGenerator {
  /**
   * Generate SARIF report from lint results
   */
  static async generateSarifReport(
    results: LintResult[],
    options: ReportOptions
  ): Promise<void> {
      const builder = new SarifBuilder();
      const runBuilder = new SarifRunBuilder().initSimple({
        toolDriverName: options.toolName,
        toolDriverVersion: options.toolVersion,
        url: 'https://github.com/salesforce-ux/slds-linter'
      });

      // Add rules
      const rules = this.extractRules(results);
      for (const rule of rules) {
        const ruleBuilder = new SarifRuleBuilder().initSimple({
          ruleId: replaceNamespaceinRules(rule.id),
          shortDescriptionText: rule.shortDescription?.text,
        });
        runBuilder.addRule(ruleBuilder);
      }

      // Add results
      for (const result of results) {
        this.addResultsToSarif(runBuilder, result);
      }

      // Add run to builder
      builder.addRun(runBuilder);

      // Generate the report
      const sarifReport = builder.buildSarifOutput();
      
      // Ensure output directory exists
      const outputDir = path.dirname(options.outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Use JsonStreamStringify to write large JSON efficiently
      const writeStream = createWriteStream(options.outputPath);
      const jsonStream = new JsonStreamStringify(sarifReport, null, 2); // pretty print with 2 spaces
      
      // Write the report
      await new Promise<void>((resolve, reject) => {
        jsonStream
          .pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });      
  }

  /**
   * Extract unique rules from results
   */
  private static extractRules(results: LintResult[]): any[] {
    const rules = new Map();

    for (const result of results) {
      // Process errors
      for (const error of result.errors) {
        if (!rules.has(error.ruleId)) {
          
          rules.set(error.ruleId, {
            id: replaceNamespaceinRules(error.ruleId),
            shortDescription: {
              text: getRuleDescription(replaceNamespaceinRules(error.ruleId))
            },
            properties: {
              category: 'Style'
            }
          });
        }
      }

      // Process warnings
      for (const warning of result.warnings) {
        if (!rules.has(warning.ruleId)) {          
          rules.set(warning.ruleId, {
            id: replaceNamespaceinRules(warning.ruleId),
            shortDescription: {
              text: getRuleDescription(replaceNamespaceinRules(warning.ruleId))
            },
            properties: {
              category: 'Style'
            }
          });
        }
      }
    }

    return Array.from(rules.values());
  }

  /**
   * Add lint results to SARIF report
   */
  private static addResultsToSarif(
    runBuilder: SarifRunBuilder,
    lintResult: LintResult
  ): void {
    // Add errors
    for (const error of lintResult.errors) {

      const resultBuilder = new SarifResultBuilder().initSimple({
        ruleId: replaceNamespaceinRules(error.ruleId),
        level: 'error',
        messageText: parseText(error.message),
        fileUri: path.relative(process.cwd(), lintResult.filePath),
        startLine: error.line,
        startColumn: error.column,
        endLine: error.line,
        endColumn: error.endColumn
      });
      runBuilder.addResult(resultBuilder);
    }

    // Add warnings
    for (const warning of lintResult.warnings) {
      const resultBuilder = new SarifResultBuilder().initSimple({
        ruleId: replaceNamespaceinRules(warning.ruleId),
        level: 'warning',
        messageText: parseText(warning.message),
        fileUri: path.relative(process.cwd(), lintResult.filePath),
        startLine: warning.line,
        startColumn: warning.column,
        endLine: warning.line,
        endColumn: warning.endColumn
      });
      runBuilder.addResult(resultBuilder);
    }
  }
}

export class CsvReportGenerator {
  static async generate(results: any[]) {
    const csvConfig = mkConfig({
      filename: 'slds-linter-report',
      fieldSeparator: ',',
      quoteStrings: true,
      decimalSeparator: '.',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    });

    const cwd = process.cwd();

    const transformedResults = results.flatMap((result: { errors: any[]; filePath: string; warnings: any[]; }) =>
      [
        ...result.errors.map((error: { message: any; ruleId: any; line: any; column: any; endLine: any; endColumn: any; }) => ({
          "File Path": path.relative(cwd, result.filePath),
          "Message": parseText(error.message),
          "Severity": 'error',
          "Rule ID": replaceNamespaceinRules(error.ruleId || 'N/A'),
          "Start Line": error.line,
          "Start Column": error.column,
          "End Line": error.endLine || error.line, // Default to start line if missing
          "End Column": error.endColumn || error.column // Default to start column if missing
        })),
        ...result.warnings.map((warning: { message: any; ruleId: any; line: any; column: any; endLine: any; endColumn: any; }) => ({
          "File Path": path.relative(cwd, result.filePath),
          "Message": parseText(warning.message),
          "Severity": 'warning',
          "Rule ID": replaceNamespaceinRules(warning.ruleId || 'N/A'),
          "Start Line": warning.line,
          "Start Column": warning.column,
          "End Line": warning.endLine || warning.line, // Default to start line if missing
          "End Column": warning.endColumn || warning.column // Default to start column if missing
        }))
      ]
    );

    const csvData = generateCsv(csvConfig)(transformedResults);
    const csvString = asString(csvData);
    const csvReportPath = path.join(cwd, `${csvConfig.filename}.csv`);

    return writeFile(csvReportPath, csvString).then(() => {
      return csvReportPath;
    });
  }
}