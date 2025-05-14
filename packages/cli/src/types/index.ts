export interface CliOptions {
  directory?: string;
  output?: string;
  fix?: boolean;  
  configStylelint?: string; // Used for stylelint config when command is lint
  configEslint?: string; // Used for eslint config when command is lint
  editor?: string;
  format?: string;
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