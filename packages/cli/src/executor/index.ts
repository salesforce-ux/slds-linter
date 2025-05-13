import path from 'path';
import { Readable } from 'stream';
import { FileScanner } from '../services/file-scanner';
import { LintRunner, LintOptions } from '../services/lint-runner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { ReportGenerator, CsvReportGenerator } from '../services/report-generator';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH, LINTER_CLI_VERSION } from '../services/config.resolver';
import { LintResult, LintConfig, ReportConfig } from '../types';

/**
 * SLDS Linter executor for Node.js API
 * Provides methods to run linting and generate reports programmatically
 */
export class SldsExecutor {
  /**
   * Run linting on specified files or directory
   * @param config Linting configuration
   * @returns Promise resolving to lint results
   */
  async lint(config: LintConfig): Promise<LintResult[]> {
    try {
      const normalizedConfig = this.normalizeConfig(config);
      
      // Scan directory for files
      const styleFiles = await FileScanner.scanFiles(normalizedConfig.directory, {
        patterns: StyleFilePatterns,
        batchSize: 100,
      });
      
      const componentFiles = await FileScanner.scanFiles(normalizedConfig.directory, {
        patterns: ComponentFilePatterns,
        batchSize: 100,
      });
      
      // Run linting
      const lintOptions: LintOptions = {
        fix: normalizedConfig.fix,
        configPath: normalizedConfig.configStylelint,
      };
      
      const styleResults = await LintRunner.runLinting(styleFiles, 'style', {
        ...lintOptions,
        configPath: normalizedConfig.configStylelint,
      });
      
      const componentResults = await LintRunner.runLinting(componentFiles, 'component', {
        ...lintOptions,
        configPath: normalizedConfig.configEslint,
      });
      
      return [...styleResults, ...componentResults];
    } catch (error: any) {
      throw new Error(`Linting failed: ${error.message}`);
    }
  }
  
  /**
   * Generate a report from linting results
   * @param config Report configuration
   * @returns A readable stream of the report data
   */
  async report(config: ReportConfig): Promise<Readable> {
    try {
      const normalizedConfig = this.normalizeConfig(config);
      const format = normalizedConfig.format || 'sarif';
      
      // Get lint results either from provided issues or by running lint
      const lintResults = normalizedConfig.issues || await this.lint({
        directory: normalizedConfig.directory,
        configStylelint: normalizedConfig.configStylelint,
        configEslint: normalizedConfig.configEslint,
      });
      
      // Create output stream
      let outputStream: Readable;
      
      // Process based on format
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
            read() {}
          });
          outputStream.push(csvString);
          outputStream.push(null);
          break;
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      return outputStream;
    } catch (error: any) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }
  
  /**
   * Normalize configuration with defaults
   * @param config Configuration object to normalize
   * @returns Normalized configuration
   */
  normalizeConfig<T extends LintConfig | ReportConfig>(config: T): T {
    return {
      ...config,
      directory: config.directory || '.',
      configStylelint: config.configStylelint || DEFAULT_STYLELINT_CONFIG_PATH,
      configEslint: config.configEslint || DEFAULT_ESLINT_CONFIG_PATH,
    };
  }
}

// Create singleton instance for export
export const sldsExecutor = new SldsExecutor(); 