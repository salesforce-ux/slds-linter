import path from 'path';
import { Readable } from 'stream';
import { FileScanner, FilePattern } from '../services/file-scanner';
import { LintRunner, LintOptions } from '../services/lint-runner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { ReportGenerator, CsvReportGenerator } from '../services/report-generator';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH, LINTER_CLI_VERSION } from '../services/config.resolver';
import { LintResult } from '../types';
import { JsonStreamStringify } from 'json-stream-stringify';
import fs from 'fs/promises';
import { SarifBuilder, SarifRunBuilder } from 'node-sarif-builder';

export interface LintConfig {
  directory?: string;
  files?: string[];
  fix?: boolean;
  configStylelint?: string;
  configEslint?: string;
}

export interface ReportConfig {
  directory?: string;
  files?: string[];
  configStylelint?: string;
  configEslint?: string;
  format?: 'sarif' | 'csv' | 'json';
  outputPath?: string;
}

/**
 * SLDS Linter executor for Node.js API
 * Provides methods to run linting and generate reports programmatically
 */
export class SldsExecutor {
  /**
   * Run linting on specified files or directory
   * @param config Linting configuration
   * @returns Promise resolving to lint results in JSON format
   */
  async lint(config: LintConfig): Promise<LintResult[]> {
    try {
      const normalizedConfig = this.normalizeConfig(config);
      
      // If specific files are provided, use them directly
      let styleFiles: string[][] = [];
      let componentFiles: string[][] = [];
      
      if (normalizedConfig.files && normalizedConfig.files.length > 0) {
        // Filter files based on patterns
        const allFiles = normalizedConfig.files;
        const styleFileList = allFiles.filter(file => {
          const fileExt = path.extname(file).substring(1);
          return StyleFilePatterns.extensions.includes(fileExt);
        });
        
        const componentFileList = allFiles.filter(file => {
          const fileExt = path.extname(file).substring(1);
          return ComponentFilePatterns.extensions.includes(fileExt);
        });
        
        // Batch files
        styleFiles = this.batchFiles(styleFileList, 100);
        componentFiles = this.batchFiles(componentFileList, 100);
      } else {
        // Scan directory
        styleFiles = await FileScanner.scanFiles(normalizedConfig.directory, {
          patterns: StyleFilePatterns,
          batchSize: 100,
        });
        
        componentFiles = await FileScanner.scanFiles(normalizedConfig.directory, {
          patterns: ComponentFilePatterns,
          batchSize: 100,
        });
      }
      
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
      const format = normalizedConfig.format || 'json';
      
      // Run linting first to get results
      const lintResults = await this.lint({
        directory: normalizedConfig.directory,
        files: normalizedConfig.files,
        configStylelint: normalizedConfig.configStylelint,
        configEslint: normalizedConfig.configEslint,
      });
      
      // Create a readable stream to return the results
      const outputStream = new Readable({
        objectMode: true,
        read() {} // No-op implementation
      });
      
      // Process based on format
      if (format === 'json') {
        // Return JSON directly as a stream
        const jsonString = JSON.stringify(lintResults, null, 2);
        outputStream.push(jsonString);
        outputStream.push(null); // End of stream
      } else if (format === 'sarif') {
        // Generate SARIF report
        // Build the report in memory without writing to a file
        const builder = new SarifBuilder();
        const runBuilder = new SarifRunBuilder().initSimple({
          toolDriverName: 'slds-linter',
          toolDriverVersion: LINTER_CLI_VERSION,
          url: 'https://github.com/salesforce-ux/slds-linter'
        });
        
        // Extract rules and add results using ReportGenerator methods
        // Since we can't directly access the internal methods, we need to
        // create a temporary file and then read it back
        const tempFilePath = path.join(process.cwd(), 'temp-sarif-report.sarif');
        await ReportGenerator.generateSarifReport(lintResults, {
          outputPath: tempFilePath,
          toolName: 'slds-linter',
          toolVersion: LINTER_CLI_VERSION
        });
        
        // Read the file and stream it
        const sarifContent = await fs.readFile(tempFilePath, 'utf-8');
        outputStream.push(sarifContent);
        
        // Clean up the temporary file
        await fs.unlink(tempFilePath);
        
        outputStream.push(null); // End of stream
      } else if (format === 'csv') {
        // Generate CSV report
        // Similar approach: generate a temporary file and read it
        const csvReportPath = await CsvReportGenerator.generate(lintResults);
        const csvContent = await fs.readFile(csvReportPath, 'utf-8');
        
        outputStream.push(csvContent);
        
        // Clean up the temporary file (if desired)
        await fs.unlink(csvReportPath);
        
        outputStream.push(null); // End of stream
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
      
      return outputStream;
    } catch (error: any) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }
  
  /**
   * Normalize configuration with defaults
   */
  private normalizeConfig<T extends LintConfig | ReportConfig>(config: T): T {
    return {
      ...config,
      directory: config.directory || '.',
      configStylelint: config.configStylelint || DEFAULT_STYLELINT_CONFIG_PATH,
      configEslint: config.configEslint || DEFAULT_ESLINT_CONFIG_PATH,
    };
  }
  
  /**
   * Batch files into arrays of specified size
   */
  private batchFiles(files: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    return batches;
  }
}

// Create singleton instance for export
export const sldsExecutor = new SldsExecutor(); 