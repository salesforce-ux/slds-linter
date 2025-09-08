import path from 'path';
import fs, { writeFile } from 'fs/promises';
import { mkConfig, generateCsv, asString } from 'export-to-csv';
import { LintResult, LintResultEntry, SarifResultEntry } from '../types';
import { SarifBuilder, SarifRunBuilder, SarifResultBuilder, SarifRuleBuilder } from 'node-sarif-builder';
import { createWriteStream } from 'fs';
import { JsonStreamStringify } from 'json-stream-stringify';
import { getRuleDescription } from './config.resolver';
import { parseText, replaceNamespaceinRules, transformedResults } from '../utils/lintResultsUtil';
import { Readable } from 'stream';
import { processArtifacts } from './artifact-processor';


export interface ReportOptions {
  outputPath?: string;
  toolName: string;
  toolVersion: string;
}

export class ReportGenerator {
  /**
   * Generate SARIF report from lint results with file output
   */
  static async generateSarifReport(
    results: LintResult[],
    options: ReportOptions
  ): Promise<void> {
      // If no outputPath, we're just building the report in memory
      if (!options.outputPath) {
        return;
      }
      
      // Build SARIF report data
      const sarifReport = await this.buildSarifReport(results, options);
      
      // Process artifacts and add file content properties
      for (const run of sarifReport.runs) {
        await processArtifacts(run.artifacts);
      }
      
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
   * Generate SARIF report as a stream without creating a file
   */
  static async generateSarifReportStream(
    results: LintResult[],
    options: ReportOptions
  ): Promise<Readable> {
    // Create SARIF report
    const sarifReport = await this.buildSarifReport(results, options);
    
    // Return JsonStreamStringify as a readable stream
    return new JsonStreamStringify(sarifReport, null, 2);
  }

  /**
   * Build SARIF report data in memory
   */
  static async buildSarifReport(
    results: LintResult[],
    options: ReportOptions
  ): Promise<any> {
    const builder = new SarifBuilder();
    const runBuilder = new SarifRunBuilder({
      defaultSourceLanguage: 'html'
    }).initSimple({
      toolDriverName: options.toolName,
      toolDriverVersion: options.toolVersion,
      url: 'https://github.com/salesforce-ux/slds-linter'
    });

    // Add additional properties for better SARIF compatibility
    runBuilder.run.properties = {
      id: Number(Math.random().toString(10).substring(2, 10)),
      version: options.toolVersion,
      submissionDate: new Date().toISOString().split('T')[0],
      language: 'html',
      status: 'accepted',
      type: 'source code'
    };

    runBuilder.run.tool.driver.organization = "Salesforce";

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

    // Return the report data
    return builder.buildSarifOutput();
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
    lintResult.errors.forEach(error => {
      const resultBuilder = new SarifResultBuilder().initSimple(transformedResults(lintResult, error, 'error'));
      runBuilder.addResult(resultBuilder);
    });

    lintResult.warnings.forEach(warning => {
      const resultBuilder = new SarifResultBuilder().initSimple(transformedResults(lintResult, warning, 'warning'));
      runBuilder.addResult(resultBuilder);
    });
  }
}

export class CsvReportGenerator {
  /**
   * Generate CSV report and write to file
   */
  static async generate(results: any[]): Promise<string> {
    // Generate CSV string using the shared method
    const csvString = this.generateCsvString(results);
    
    // Define the output path
    const csvReportPath = path.join(process.cwd(), 'slds-linter-report.csv');

    // Write to file
    await writeFile(csvReportPath, csvString);
    return csvReportPath;
  }
  
  /**
   * Generate CSV string from lint results
   */
  static generateCsvString(results: any[]): string {
    const csvData = this.convertResultsToCsvData(results);
    return asString(csvData);
  }
  
  /**
   * Convert lint results to CSV-compatible data format
   */
  private static convertResultsToCsvData(results: any[]): any {
    const cwd = process.cwd();
    
    // Create CSV config inline instead of using a separate method
    const csvConfig = mkConfig({
      fieldSeparator: ',',
      quoteStrings: true,
      decimalSeparator: '.',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    });

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

    return generateCsv(csvConfig)(transformedResults);
  }
}