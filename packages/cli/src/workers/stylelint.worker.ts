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
      // Only add `config` if `personaConfig` is not null or empty
      if (this.task.config.config) {
        options.config = this.task.config.config; //Uses the Inline config (Highest Priority)
      }

      // Load custom config if provided
      // If config were missing, Stylelint would fallback to using configFile.
      if (this.task.config.configPath) {
        options.configFile = this.task.config.configPath;
      }

      const result = await stylelint.lint(options);
      const fileResult = result.results[0];

      // Convert stylelint results to our format
      return {
        file: filePath,
        warnings: fileResult.warnings.map(warning => ({
          line: warning.line,
          column: warning.column,
          endColumn: warning.endColumn,
          message: warning.text,
          ruleId: warning.rule
        })),
        errors: [] // Stylelint doesn't differentiate between warnings and errors
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