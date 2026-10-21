import { Readable } from 'stream';
import path from 'path';
import { FileScanner } from '../services/file-scanner';
import { LintRunner } from '../services/lint-runner';
import { StyleFilePatterns, ComponentFilePatterns, ReactFilePatterns } from '../services/file-patterns';
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
    
    const files = await FileScanner.scanFiles(normalizedConfig.directory, {
      patterns: {
        extensions: [
          ...StyleFilePatterns.extensions,
          ...ComponentFilePatterns.extensions,
          ...ReactFilePatterns.extensions,
        ],
        exclude: [...new Set([
          ...StyleFilePatterns.exclude ?? [],
          ...ComponentFilePatterns.exclude ?? [],
          ...ReactFilePatterns.exclude ?? [],
        ])],
      },
    });
    const styleExtensions = new Set(StyleFilePatterns.extensions);
    const componentExtensions = new Set(ComponentFilePatterns.extensions);
    const reactExtensions = new Set(ReactFilePatterns.extensions);
    const styleFiles: string[] = [];
    const componentFiles: string[] = [];
    const reactFiles: string[] = [];

    for (const file of files) {
      const extension = path.extname(file).substring(1);
      if (styleExtensions.has(extension)) {
        styleFiles.push(file);
      } else if (componentExtensions.has(extension)) {
        componentFiles.push(file);
      } else if (reactExtensions.has(extension)) {
        reactFiles.push(file);
      }
    }
    
    if(styleFiles.length>0){
      Logger.info(`Total style files: ${styleFiles.length}`);
    }
    if(componentFiles.length>0){
      Logger.info(`Total component files: ${componentFiles.length}`);
    }
    if(reactFiles.length>0){
      Logger.info(`Total React files: ${reactFiles.length}`);
    }
    
    const { fix, configEslint, deterministicOnly } = normalizedConfig;
    
    // Run ESLint on all files using Piscina worker pool
    return await LintRunner.runLinting([...styleFiles, ...componentFiles, ...reactFiles], {
      fix,
      configPath: configEslint,
      deterministicOnly,
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

    Logger.debug(
      `Found ${files.length} files`
    );
    
    const results = await LintRunner.runLinting(files, {
      fix: normalizedConfig.fix,
      configPath: normalizedConfig.configEslint,
      cwd: normalizedConfig.directory,
      deterministicOnly: normalizedConfig.deterministicOnly,
    });

    return results;
  } catch (error: any) {
    // Enhance error with context for better debugging
    const errorMessage = `Linting failed: ${error.message}`;
    Logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}


/**
 * Destroy the shared worker pool. Call after all linting is complete
 * to release resources.
 */
export async function destroy(): Promise<void> {
  await LintRunner.destroy();
}

export type { LintResult, LintResultEntry, LintConfig, ReportConfig, ExitCode, WorkerResult, SarifResultEntry } from '../types'; 
