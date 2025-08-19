import { Readable } from 'stream';
import { FileScanner } from '../services/file-scanner';
import { LintRunner } from '../services/lint-runner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { ReportGenerator, CsvReportGenerator } from '../services/report-generator';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH, LINTER_CLI_VERSION } from '../services/config.resolver';
import { LintResult, LintConfig, ReportConfig } from '../types';
import { normalizeCliOptions } from '../utils/config-utils';
import { Logger } from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { isDynamicPattern } from 'globby';

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
      configStylelint: DEFAULT_STYLELINT_CONFIG_PATH,
    });
    
    let styleFiles: string[][] = [];
    let componentFiles: string[][] = [];

    // Check if it's a single file path and not a glob pattern
    if (normalizedConfig.directory && !isDynamicPattern(normalizedConfig.directory)) {
      const stats = await fs.stat(normalizedConfig.directory).catch(() => null);
      if (stats?.isFile()) {
        // Fast path for single file
        const ext = path.extname(normalizedConfig.directory).toLowerCase();
        Logger.debug(`Detected single file with extension: ${ext}`);
        
        if (['.css'].includes(ext)) {
          styleFiles = [[normalizedConfig.directory]];
        } else if (['.html', '.htm'].includes(ext)) {
          componentFiles = [[normalizedConfig.directory]];
        } else {
          Logger.warning(`Unsupported file type: ${ext}`);
        }
      } else {
        // Regular directory scanning
        Logger.debug('Scanning directory for files...');
        [styleFiles, componentFiles] = await scanDirectory(normalizedConfig.directory);
      }
    } else {
      // Handle glob patterns or directory scanning
      Logger.debug('Processing glob pattern or directory...');
      [styleFiles, componentFiles] = await scanDirectory(normalizedConfig.directory);
    }
    
    const { fix, configStylelint, configEslint } = normalizedConfig;
    
    // Run linting on style files
    const styleResults = await LintRunner.runLinting(styleFiles, 'style', {
      fix,
      configPath: configStylelint,
    });
    
    // Combine all files into a single array for unified processing
    const allFiles = [...styleFiles, ...componentFiles];
    // Run linting on all files
    const allResults = await LintRunner.runLinting(allFiles, 'component', {
      fix,
      configPath: configEslint,
    });
    
    // Combine results from both linters
    const combinedResults = [...styleResults, ...allResults];
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
    const normalizedConfig = normalizeCliOptions(config, {
      configStylelint: DEFAULT_STYLELINT_CONFIG_PATH,
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

/**
 * Helper function to scan directory for style and component files
 * @param directory Directory to scan
 * @returns Promise resolving to [styleFiles, componentFiles]
 */
async function scanDirectory(directory: string): Promise<[string[][], string[][]]> {
  return Promise.all([
    FileScanner.scanFiles(directory, {
      patterns: StyleFilePatterns,
      batchSize: 100,
    }),
    FileScanner.scanFiles(directory, {
      patterns: ComponentFilePatterns,
      batchSize: 100,
    })
  ]);
}

export type { LintResult, LintResultEntry, LintConfig, ReportConfig, ExitCode, WorkerResult, SarifResultEntry } from '../types'; 