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
 * 
 * This class provides the core functionality for the SLDS Linter Node.js API,
 * allowing programmatic access to linting and reporting capabilities.
 * 
 * It serves as the main entry point for applications integrating with the SLDS Linter.
 */
export class SldsExecutor {
  /**
   * Run linting on specified files or directory
   * 
   * This method performs the following operations:
   * 1. Normalizes the configuration with proper defaults
   * 2. Scans the target directory for style and component files
   * 3. Runs the appropriate linters on each file type
   * 4. Returns the combined results
   * 
   * @param config Linting configuration options
   * @returns Promise resolving to an array of lint results
   * @throws Error if linting fails for any reason
   */
  async lint(config: LintConfig): Promise<LintResult[]> {
    try {
      Logger.debug('Starting linting with Node API');
      
      // Normalize configuration to ensure all required fields have values
      const normalizedConfig = normalizeConfig(config);
      Logger.debug(`Using normalized config: ${JSON.stringify(normalizedConfig, null, 2)}`);
      
      // Scan directory for style files (CSS, SCSS, etc.)
      Logger.debug(`Scanning for style files in: ${normalizedConfig.directory}`);
      const styleFiles = await FileScanner.scanFiles(normalizedConfig.directory, {
        patterns: StyleFilePatterns,
        batchSize: 100,
      });
      Logger.debug(`Found ${styleFiles.length} style file batches`);
      
      // Scan directory for component files (HTML, etc.)
      Logger.debug(`Scanning for component files in: ${normalizedConfig.directory}`);
      const componentFiles = await FileScanner.scanFiles(normalizedConfig.directory, {
        patterns: ComponentFilePatterns,
        batchSize: 100,
      });
      Logger.debug(`Found ${componentFiles.length} component file batches`);
      
      // Configure linting options
      const lintOptions: LintOptions = {
        fix: normalizedConfig.fix,
        configPath: normalizedConfig.configStylelint,
      };
      Logger.debug(`Lint options: ${JSON.stringify(lintOptions, null, 2)}`);
      
      // Run linting on style files
      Logger.debug('Running linting on style files');
      const styleResults = await LintRunner.runLinting(styleFiles, 'style', {
        ...lintOptions,
        configPath: normalizedConfig.configStylelint,
      });
      Logger.debug(`Style linting found issues in ${styleResults.length} files`);
      
      // Run linting on component files
      Logger.debug('Running linting on component files');
      const componentResults = await LintRunner.runLinting(componentFiles, 'component', {
        ...lintOptions,
        configPath: normalizedConfig.configEslint,
      });
      Logger.debug(`Component linting found issues in ${componentResults.length} files`);
      
      // Combine results from both linters
      const combinedResults = [...styleResults, ...componentResults];
      Logger.debug(`Total files with issues: ${combinedResults.length}`);
      
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
   * This method performs the following operations:
   * 1. Normalizes the report configuration
   * 2. Obtains lint results either from provided issues or by running lint
   * 3. Generates a report in the requested format
   * 4. Returns the report as a readable stream
   * 
   * @param config Report configuration options
   * @returns A readable stream containing the report data
   * @throws Error if report generation fails for any reason
   */
  async report(config: ReportConfig): Promise<Readable> {
    try {
      Logger.debug('Starting report generation with Node API');
      
      // Normalize configuration to ensure all required fields have values
      const normalizedConfig = normalizeConfig(config);
      Logger.debug(`Using normalized config: ${JSON.stringify(normalizedConfig, null, 2)}`);
      
      // Determine report format with default
      const format = normalizedConfig.format || 'sarif';
      Logger.debug(`Using report format: ${format}`);
      
      // Get lint results either from provided issues or by running lint
      let lintResults: LintResult[];
      
      if (normalizedConfig.issues) {
        Logger.debug('Using provided lint results');
        lintResults = normalizedConfig.issues;
      } else {
        Logger.debug('No lint results provided, running linting');
        lintResults = await this.lint({
          directory: normalizedConfig.directory,
          configStylelint: normalizedConfig.configStylelint,
          configEslint: normalizedConfig.configEslint,
        });
      }
      
      Logger.debug(`Processing ${lintResults.length} files with issues`);
      
      // Create appropriate output stream based on format
      let outputStream: Readable;
      
      // Process based on requested format
      switch (format) {
        case 'sarif':
          // Generate SARIF report as a stream
          Logger.debug('Generating SARIF format report');
          outputStream = ReportGenerator.generateSarifReportStream(lintResults, {
            toolName: 'slds-linter',
            toolVersion: LINTER_CLI_VERSION
          });
          break;
          
        case 'csv':
          // Generate CSV data in memory
          Logger.debug('Generating CSV format report');
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
      
      Logger.debug('Report generation completed successfully');
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