import path from 'path';
import { BatchProcessor, BatchResult } from './batch-processor';
import { WorkerConfig, WorkerResult, LintResult } from '../types';
import { Logger } from '../utils/logger';
import { resolveDirName } from '../utils/nodeVersionUtil';

export interface LintOptions {
  fix?: boolean;
  configPath?: string;
  maxWorkers?: number;
  timeoutMs?: number;
  config?: object;
}

export class LintRunner {
  /**
   * Run linting on batches of files
   */
  static async runLinting(
    fileBatches: string[][],
    workerType: 'style' | 'component',
    options: LintOptions = {}
  ): Promise<LintResult[]> {
    try {
      const workerScript = path.resolve(
        resolveDirName(import.meta) ,
        '../workers',
        workerType === 'style' ? 'stylelint.worker.js' : 'eslint.worker.js'
      );

      const workerConfig: WorkerConfig = {
        configPath: options.configPath,
        config: options.config,
        fix: options.fix
      };

      const results = await BatchProcessor.processBatches(
        fileBatches,
        workerScript,
        workerConfig,
        {
          maxWorkers: options.maxWorkers,
          timeoutMs: options.timeoutMs
        }
      );

      return this.processResults(results);
    } catch (error: any) {
      Logger.error(`Linting failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process and normalize worker results
   */
  private static processResults(batchResults: BatchResult[]): LintResult[] {
    const results: LintResult[] = [];

    for (const batch of batchResults) {
      if (!batch.success || !batch.results) {
        Logger.warning(`Batch failed: ${batch.error}`);
        continue;
      }

      for (const result of batch.results as WorkerResult[]) {
        if (result.error) {
          Logger.warning(`File processing failed: ${result.file} - ${result.error}`);
          continue;
        }

        results.push({
          filePath: result.file,
          errors: result.errors?.map(e => ({
            ...e,
            severity: 2
          })) || [],
          warnings: result.warnings?.map(w => ({
            ...w,
            severity: 1
          })) || []
        });
      }
    }

    return results;
  }
} 