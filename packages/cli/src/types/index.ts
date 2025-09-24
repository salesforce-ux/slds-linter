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

export interface LintRunnerOptions {
  fix?: boolean;
  configPath?: string;
  maxWorkers?: number;
  timeoutMs?: number;
}

export interface LintResultEntry {
  line: number;
  column: number;
  endColumn: number;
  message: string;
  ruleId: string;
  severity: number;
}

export interface LintResult {
  filePath: string;
  errors: Array<LintResultEntry>;
  warnings: Array<LintResultEntry>;
}

export type ExitCode = 0 | 1 | 2;

export interface WorkerConfig {
  configPath?: string;
  fix?: boolean;
}

export interface WorkerResult {
  file: string;
  error?: string;
  warnings?: Array<{
    line: number;
    column: number;
    endColumn: number;
    message: string;
    ruleId: string;
  }>;
  errors?: Array<{
    line: number;
    column: number;
    endColumn: number;
    message: string;
    ruleId: string;
  }>;
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