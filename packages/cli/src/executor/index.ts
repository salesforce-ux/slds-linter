import path from 'path';
import { Readable } from 'stream';
import { FileScanner } from '../services/file-scanner';
import { LintRunner, LintOptions } from '../services/lint-runner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { ReportGenerator, CsvReportGenerator } from '../services/report-generator';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH, LINTER_CLI_VERSION } from '../services/config.resolver';
import { LintResult, LintConfig, ReportConfig } from '../types';
import { normalizeConfig } from '../utils/config-utils';
import { Logger } from '../utils/logger';

/**
 * SLDS Linter executor for Node.js API
 * Main entry point for applications integrating with the SLDS Linter.
 */
export class SldsExecutor {
  /**
   * Run linting on specified files or directory
   * 
   * @param config Linting configuration options
   * @returns Promise resolving to an array of lint results
   * @throws Error if linting fails
   */
  async lint(config: LintConfig): Promise<LintResult[]> {
    try {
      Logger.debug('Starting linting with Node API');
      
      // Normalize configuration to ensure all required fields have values
      const normalizedConfig = normalizeConfig(config);
      
      // Scan directory for style files (CSS, SCSS, etc.)
      const styleFiles = await FileScanner.scanFiles(normalizedConfig.directory, {
        patterns: StyleFilePatterns,
        batchSize: 100,
      });
      
      // Scan directory for component files (HTML, etc.)
      const componentFiles = await FileScanner.scanFiles(normalizedConfig.directory, {
        patterns: ComponentFilePatterns,
        batchSize: 100,
      });
      
      // Configure linting options
      const lintOptions: LintOptions = {
        fix: normalizedConfig.fix,
        configPath: normalizedConfig.configStylelint,
      };
      
      // Run linting on style files
      const styleResults = await LintRunner.runLinting(styleFiles, 'style', {
        ...lintOptions,
        configPath: normalizedConfig.configStylelint,
      });
      
      // Run linting on component files
      const componentResults = await LintRunner.runLinting(componentFiles, 'component', {
        ...lintOptions,
        configPath: normalizedConfig.configEslint,
      });
      
      // Combine results from both linters
      const combinedResults = [...styleResults, ...componentResults];
      
      return combinedResults;
    } catch (error: any) {
      // Enhance error with context for better debugging
      const errorMessage = `Linting failed: ${error.message}`;
      Logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Generate a report from linting results
   * 
   * @param config Report configuration options
   * @returns A readable stream containing the report data
   * @throws Error if report generation fails
   */
  async report(config: ReportConfig): Promise<Readable> {
    try {
      Logger.debug('Starting report generation with Node API');
      
      // Normalize configuration to ensure all required fields have values
      const normalizedConfig = normalizeConfig(config);
      
      // Determine report format with default
      const format = normalizedConfig.format || 'sarif';
      
      // Get lint results either from provided issues or by running lint
      let lintResults: LintResult[];
      
      if (normalizedConfig.issues) {
        lintResults = normalizedConfig.issues;
      } else {
        lintResults = await this.lint({
          directory: normalizedConfig.directory,
          configStylelint: normalizedConfig.configStylelint,
          configEslint: normalizedConfig.configEslint,
        });
      }
      
      // Create appropriate output stream based on format
      let outputStream: Readable;
      
      // Process based on requested format
      switch (format) {
        case 'sarif':
          // Generate SARIF report as a stream
          outputStream = ReportGenerator.generateSarifReportStream(lintResults, {
            toolName: 'slds-linter',
            toolVersion: LINTER_CLI_VERSION
          });
          break;
          
        case 'csv':
          // Generate CSV data in memory
          const csvString = CsvReportGenerator.generateCsvString(lintResults);
          
          // Create a stream with the CSV content
          outputStream = new Readable({
            read() {} // No-op implementation
          });
          outputStream.push(csvString);
          outputStream.push(null); // End of stream
          break;
          
        default:
          // Throw error for unsupported formats
          const errorMessage = `Unsupported format: ${format}`;
          Logger.error(errorMessage);
          throw new Error(errorMessage);
      }
      
      return outputStream;
    } catch (error: any) {
      // Enhance error with context for better debugging
      const errorMessage = `Report generation failed: ${error.message}`;
      Logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}

// Create singleton instance for export
// This allows consumers to import the executor without needing to instantiate it
export const sldsExecutor = new SldsExecutor(); 