import { ESLint } from 'eslint';
import { isMainThread } from 'worker_threads';
import { BaseWorker } from './base.worker';
import { WorkerConfig, WorkerResult } from '../types';

export class ESLintWorker extends BaseWorker<WorkerConfig, WorkerResult> {
  private eslint: ESLint;

  constructor() {
    super();

    const linterOptions:ESLint.Options = {
      overrideConfigFile: this.task.config.configPath,
      fix: this.task.config.fix,
    };
    if("cwd" in this.task.config){
      linterOptions.cwd = this.task.config.cwd;
    }

    this.eslint = new ESLint(linterOptions);
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

if (!isMainThread) {
  const worker = new ESLintWorker();
  worker.process().catch(error => {
    console.error('Worker failed:', error);
    process.exit(1);
  });
}