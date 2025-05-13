export interface CliOptions {
  directory?: string;
  output?: string;
  fix?: boolean;  
  configStylelint?: string; // Used for stylelint config when command is lint
  configEslint?: string; // Used for eslint config when command is lint
  editor?: string;
  format?: string;
}

/**
 * Configuration for linting operation in the Node API
 * Extends the CLI options with additional API-specific properties
 */
export interface LintConfig {
  directory?: string;
  files?: string[];
  fix?: boolean;
  configStylelint?: string;
  configEslint?: string;
}

/**
 * Configuration for report generation in the Node API
 * Extends the CLI options with additional API-specific properties
 */
export interface ReportConfig {
  directory?: string;
  files?: string[];
  configStylelint?: string;
  configEslint?: string;
  format?: 'sarif' | 'csv';
  issues?: LintResult[];
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