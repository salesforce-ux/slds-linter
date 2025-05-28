import { ESLint } from 'eslint';
import { BaseWorker } from './base.worker';
import { WorkerConfig, WorkerResult } from '../types';
import { normalizeLintMessage } from '../utils/lintMessageUtils';

class ESLintWorker extends BaseWorker<WorkerConfig, WorkerResult> {
  private eslint: ESLint;

  constructor() {
    super();
    this.eslint = new ESLint({
      useEslintrc: false,
      fix: this.task.config.fix,
      overrideConfigFile: this.task.config.configPath
    });
  }

  protected async processFile(filePath: string): Promise<WorkerResult> {
    try {
      const results = await this.eslint.lintFiles([filePath]);
      const fileResult = results[0];

      // Apply fixes if requested
      if (this.task.config.fix && fileResult.output) {
        await ESLint.outputFixes(results);
      }
      return {
        file: filePath,
        warnings: fileResult.messages
          .filter(msg => msg.severity === 1)
          .map(warning => ({
            line: warning.line,
            column: warning.column,
            endColumn: warning.endColumn,
            ...normalizeLintMessage(warning.message),
            ruleId: warning.ruleId || 'unknown'
          })),
        errors: fileResult.messages
          .filter(msg => msg.severity === 2)
          .map(error => ({
            line: error.line,
            column: error.column,
            endColumn: error.endColumn,
            ...normalizeLintMessage(error.message),
            ruleId: error.ruleId || 'unknown'
          }))
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
const worker = new ESLintWorker();
worker.process().catch(error => {
  console.error('Worker failed:', error);
  process.exit(1);
}); 