import path from 'path';
import { BatchProcessor, BatchResult } from './batch-processor';
import { WorkerConfig, WorkerResult, LintResult, LintRunnerOptions } from '../types';
import { Logger } from '../utils/logger';
import { resolveDirName } from '../utils/nodeVersionUtil';
import { ConfigLoader } from './config-loader';


export class LintRunner {
  /**
   * Run linting on batches of files
   */
  static async runLinting(
    fileBatches: string[][],
    options: LintRunnerOptions = {}
  ): Promise<LintResult[]> {
    try {
      const workerScript = path.resolve(
        resolveDirName(import.meta) ,
        '../workers',
        'eslint.worker.js'
      );

      // Process custom config (only rewrites if dependencies not installed)
      const configPath = await ConfigLoader.processConfig(options.configPath);
      
      const workerConfig: WorkerConfig = {
        configPath,
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
        if (result.error || !result.lintResult) {
          Logger.warning(`File processing failed: ${result.filePath} - ${result.error}`);
          continue;
        }
        results.push(result.lintResult);
      }
    }

    return results;
  }
} 