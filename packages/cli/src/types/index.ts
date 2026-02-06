import type { ESLint, Linter } from 'eslint';

export interface BaseConfig {
  directory?: string;
  files?: string[];
  configEslint?: string;
}

/**
 * CLI options interface extends BaseConfig for shared properties
 */
export interface CliOptions extends BaseConfig {
  output?: string;
  fix?: boolean;  
  editor?: string;
  format?: string;
}

/**
 * Configuration for linting operation in the Node API
 * Extends the common base configuration
 */
export interface LintConfig extends BaseConfig {
  fix?: boolean;
}

/**
 * Configuration for report generation in the Node API
 * Extends the common base configuration
 */
export interface ReportConfig extends BaseConfig {
  format?: 'sarif' | 'csv';
}


export type LintResultEntry = Linter.LintMessage;


export type LintResult = ESLint.LintResult;

export type ExitCode = 0 | 1 | 2;

export interface WorkerConfig {
  configPath?: string;
  fix?: boolean;
  cwd?: string;
}

export interface LintRunnerOptions extends WorkerConfig {
  maxWorkers?: number;
  timeoutMs?: number;
}

export interface WorkerResult{
  filePath: string;
  lintResult?: LintResult;
  error?: string;  
} 

export interface SarifResultEntry {
  level: any;
  messageText: string;
  ruleId: string;
  fileUri?: string;
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
}

export interface LintResultSummary {
  totalErrors: number;
  totalWarnings: number;
  fixableErrors: number;
  fixableWarnings: number;
}

export interface FilePattern {
  extensions:string[];
  exclude?: string[];
}

export interface ScanOptions {
  patterns: FilePattern;
  batchSize?: number;
  gitignore?: boolean;
}

export interface ScanResult {
  filesCount: number;
  batches: string[][];
}

export interface PrintOptions {
  editor?: string;
  cwd?: string;
}

export interface CsvRowEntry{
    "File Path": string,
    "Message": string,
    "Severity": string,
    "Rule ID": string,
    "Start Line": number,
    "Start Column": number,
    "End Line": number,
    "End Column": number
}