import { Readable } from 'stream';
import { FileScanner } from '../services/file-scanner';
import { LintRunner, LintOptions } from '../services/lint-runner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { ReportGenerator, CsvReportGenerator } from '../services/report-generator';
import { DEFAULT_ESLINT_CONFIG_PATH, LINTER_CLI_VERSION } from '../services/config.resolver';
import { LintResult, LintConfig, ReportConfig } from '../types';
import { normalizeCliOptions } from '../utils/config-utils';
import { Logger } from '../utils/logger';

/**
 * Run linting on specified files or directory
 * 
 * @param config Linting configuration options
 * @returns Promise resolving to an array of lint results
 * @throws Error if linting fails
 */
export async function lint(config: LintConfig): Promise<LintResult[]> {
  try {
    Logger.debug('Starting linting with Node API');
    
    // Normalize configuration to ensure all required fields have values
    const normalizedConfig = normalizeCliOptions(config, {}, true);
    
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
      configPath: normalizedConfig.configEslint,
    };
    
    // Run linting on style files
    const styleResults = await LintRunner.runLinting(styleFiles, 'style', {
      ...lintOptions,
      configPath: normalizedConfig.configEslint,
    });
    
    // Run linting on component files
    const componentResults = await LintRunner.runLinting(componentFiles, 'component', {
      ...lintOptions,
      configPath: normalizedConfig.configEslint,
    });
    
    // Combine results from both linters
    const combinedResults = [...styleResults, ...componentResults];
    return standardizeLintMessages(combinedResults);
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
 * @param results Optional lint results (if not provided, will run lint)
 * @returns A readable stream containing the report data
 * @throws Error if report generation fails
 */
export async function report(config: ReportConfig, results?: LintResult[]): Promise<Readable> {
  try {
    Logger.debug('Starting report generation with Node API');
    
    // Normalize configuration to ensure all required fields have values
    const normalizedConfig = normalizeCliOptions(config, {}, true);
    
    // Determine report format with default
    const format = normalizedConfig.format || 'sarif';
    
    // Get lint results either from provided results parameter or by running lint
    const lintResults = results || await lint({
      directory: normalizedConfig.directory,
      configEslint: normalizedConfig.configEslint,
    });
    
    // Process based on requested format
    switch (format) {
      case 'sarif':
        // Generate SARIF report as a stream
        return ReportGenerator.generateSarifReportStream(lintResults, {
          toolName: 'slds-linter',
          toolVersion: LINTER_CLI_VERSION
        });
        
      case 'csv':
        // Generate CSV data in memory and create a stream
        const csvString = CsvReportGenerator.generateCsvString(lintResults);
        const csvStream = new Readable();
        csvStream.push(csvString);
        csvStream.push(null); // End of stream
        return csvStream;
        
      default:
        // Throw error for unsupported formats
        const errorMessage = `Unsupported format: ${format}`;
        Logger.error(errorMessage);
        throw new Error(errorMessage);
    }
  } catch (error: any) {
    // Enhance error with context for better debugging
    const errorMessage = `Report generation failed: ${error.message}`;
    Logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// Helper to standardize message field for all warnings and errors
function standardizeLintMessages(results: LintResult[]): LintResult[] {
  return results.map(result => ({
    ...result,
    errors: result.errors.map(entry => {
      let msgObj;
      try {
        msgObj = JSON.parse(entry.message);
        // If already an object, spread all properties into the entry
        if (typeof msgObj === 'object' && 'message' in msgObj) {
          return { ...entry, ...msgObj };
        }
      } catch {}
      // Otherwise, wrap as { message }
      return { ...entry, message: entry.message };
    }),
    warnings: result.warnings.map(entry => {
      let msgObj;
      try {
        msgObj = JSON.parse(entry.message);
        if (typeof msgObj === 'object' && 'message' in msgObj) {
          return { ...entry, ...msgObj };
        }
      } catch {}
      return { ...entry, message: entry.message };
    })
  }));
}

export type { LintResult, LintResultEntry, LintConfig, ReportConfig, ExitCode, WorkerResult, SarifResultEntry } from '../types'; 