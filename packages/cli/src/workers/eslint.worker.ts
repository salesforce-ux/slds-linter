import { ESLint } from 'eslint';
import { BaseWorker } from './base.worker';
import { WorkerConfig, WorkerResult } from '../types';

class ESLintWorker extends BaseWorker<WorkerConfig, WorkerResult> {
  private eslint: ESLint;

  constructor() {
    super();
    this.eslint = new ESLint({
      overrideConfigFile: this.task.config.configPath,
      fix: this.task.config.fix
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
      
      // Return raw ESLint result
      return {
        filePath,
        lintResult: fileResult
      };
    } catch (error: any) {
      return {
        filePath,
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