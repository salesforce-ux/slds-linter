import stylelint from 'stylelint';
import { BaseWorker } from './base.worker';
import { WorkerConfig, WorkerResult } from '../types';

class StylelintWorker extends BaseWorker<WorkerConfig, WorkerResult> {
  protected async processFile(filePath: string): Promise<WorkerResult> {
    try {
      const options: stylelint.LinterOptions = {
        files: filePath,
        fix: this.task.config.fix,
      };

      // Load custom config if provided
      if (this.task.config.configPath) {
        options.configFile = this.task.config.configPath;
      }

      const result = await stylelint.lint(options);
      const fileResult = result.results[0];

      // Convert stylelint results to our format
      // Stylelint uses severity: "ignore", "warning", "error"
      const warnings = fileResult.warnings
        .filter(warning => warning.severity === 'warning')
        .map(warning => ({
          line: warning.line,
          column: warning.column,
          endColumn: warning.endColumn,
          message: warning.text,
          ruleId: warning.rule
        }));

      const errors = fileResult.warnings
        .filter(warning => warning.severity === 'error')
        .map(warning => ({
          line: warning.line,
          column: warning.column,
          endColumn: warning.endColumn,
          message: warning.text,
          ruleId: warning.rule
        }));

      const combinedResults = [...warnings, ...errors].sort((a, b) => a.line - b.line);
      return {
        file: filePath,
        warnings: combinedResults,
        errors: []
      };
    } catch (error: any) {
      return {
        file: filePath,
        error: error.message
      };
    }
  }
}

// Initialize and start the worker
const worker = new StylelintWorker();
worker.process().catch(error => {
  console.error('Worker failed:', error);
  process.exit(1);
}); 