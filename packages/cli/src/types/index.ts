export interface BaseConfig {
  directory?: string;
  files?: string[];
  configStylelint?: string;
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
  results?: LintResult[];
}

export interface LintResult {
  filePath: string;
  errors: Array<{
    line: number;
    column: number;
    endColumn: number;
    message: string;
    ruleId: string;
    severity: number;
  }>;
  warnings: Array<{
    line: number;
    column: number;
    endColumn: number;
    message: string;
    ruleId: string;
    severity: number;
  }>;
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