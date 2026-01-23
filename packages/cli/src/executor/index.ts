import { Readable } from 'stream';
import { FileScanner } from '../services/file-scanner';
import { LintRunner } from '../services/lint-runner';
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
    const normalizedConfig = normalizeCliOptions(config, {
      configEslint: DEFAULT_ESLINT_CONFIG_PATH,
    });
    
    // Scan directory for style files (CSS, SCSS, etc.)
    const {filesCount: styleFilesCount, batches: styleFiles} = await FileScanner.scanFiles(normalizedConfig.directory, {
      patterns: StyleFilePatterns,
      batchSize: 100,
    });
    
    // Scan directory for component files (HTML, etc.)
    const {filesCount: componentFilesCount, batches: componentFiles} = await FileScanner.scanFiles(normalizedConfig.directory, {
      patterns: ComponentFilePatterns,
      batchSize: 100,
    });
    
    if(styleFilesCount>0){
      Logger.info(`Total style files: ${styleFilesCount}`);
    }
    if(componentFilesCount>0){
      Logger.info(`Total component files: ${componentFilesCount}`);
    }
    
    const { fix, configEslint } = normalizedConfig;
    
    // Run ESLint on all files
    return await LintRunner.runLinting([...styleFiles, ...componentFiles], {
      fix,
      configPath: configEslint,
    });
    
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
    const normalizedConfig = normalizeCliOptions(config, {
      configEslint: DEFAULT_ESLINT_CONFIG_PATH,
    });
    
    // Determine report format with default
    const format = normalizedConfig.format || 'sarif';
    
    // Get lint results either from provided results parameter or by running lint
    const lintResults = results || await lint(normalizedConfig);
    
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

/**
 * This function supports user to supply array of files to be linted
 * 
 * @param files Array of file paths to be linted
 * @param config Linting configuration options
 * @returns Promise resolving to an array of lint results
 * @throws Error if linting fails or if any file is not found
 */
export async function lintFiles(files: string[], config: LintConfig): Promise<LintResult[]> {
  try {
    Logger.debug('Starting linting with Node API');
    // Normalize configuration to ensure all required fields have values
    const normalizedConfig = normalizeCliOptions(config, {
      configEslint: DEFAULT_ESLINT_CONFIG_PATH,
    });

    const batches = FileScanner.createBatches(files, FileScanner.DEFAULT_BATCH_SIZE);
    Logger.debug(
      `Found ${files.length} files, split into ${batches.length} batches`
    );
    
    // Run ESLint on all files
    const results = await LintRunner.runLinting(batches, {
      fix: normalizedConfig.fix,
      configPath: normalizedConfig.configEslint,
      // when linting files, use the directory of the files as the working directory
      cwd: normalizedConfig.directory
    });

    return results;
  } catch (error: any) {
    // Enhance error with context for better debugging
    const errorMessage = `Linting failed: ${error.message}`;
    Logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}


export type { LintResult, LintResultEntry, LintConfig, ReportConfig, ExitCode, WorkerResult, SarifResultEntry } from '../types'; 
