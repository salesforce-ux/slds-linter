import { Worker } from 'worker_threads';
import path from 'path';
import os from "os";
import { Logger } from '../utils/logger';
import { ProgressHandler } from './progress-handler';

const AVAILABLE_CPUS = os.cpus().length - 1;

export interface BatchProcessorOptions {
  maxWorkers?: number;
  timeoutMs?: number;
}

export interface BatchTask<T> {
  files: string[];
  config: T;
}

export interface BatchResult {
  success: boolean;
  error?: string;
  results: any[];
}

export class BatchProcessor {
  private static DEFAULT_MAX_WORKERS = Math.max(1, Math.min(4, AVAILABLE_CPUS));
  private static DEFAULT_TIMEOUT_MS = 300000; // 5 minutes

  /**
   * Process batches of files in parallel using worker threads
   * @param batches Array of file batches to process
   * @param workerScript Path to the worker script
   * @param taskConfig Configuration to pass to each worker
   * @param options Processing options
   */
  static async processBatches<T>(
    batches: string[][],
    workerScript: string,
    taskConfig: T,
    options: BatchProcessorOptions = {}
  ): Promise<BatchResult[]> {
    const maxWorkers = options.maxWorkers || this.DEFAULT_MAX_WORKERS;
    const timeoutMs = options.timeoutMs || this.DEFAULT_TIMEOUT_MS;

    Logger.debug(`Starting batch processing with ${maxWorkers} workers`);
    Logger.debug(`Processing ${batches.length} batches`);

    const results: BatchResult[] = [];
    const activeWorkers = new Set<Worker>();
    let currentBatchIndex = 0;

    const progress = new ProgressHandler({ total: batches.length });

    try {
      while (currentBatchIndex < batches.length || activeWorkers.size > 0) {
        // Start new workers if we have capacity and batches remaining
        while (
          activeWorkers.size < maxWorkers &&
          currentBatchIndex < batches.length
        ) {
          const batchIndex = currentBatchIndex++;
          const batch = batches[batchIndex];
          const worker = this.createWorker(
            workerScript,
            { files: batch, config: taskConfig },
            timeoutMs
          );
          activeWorkers.add(worker);

          // Handle worker completion
          worker
            .on('message', (result: BatchResult) => {
              results.push(result);
              activeWorkers.delete(worker);
              progress.increment();
              Logger.debug(`Completed batch ${batchIndex} of ${batches.length}`);
            })
            .on('error', (error) => {
              results.push({
                success: false,
                error: error.message,
                results: []
              });
              activeWorkers.delete(worker);
              progress.increment();
              Logger.error(`Worker error in batch ${batchIndex}: ${error.message}`);
            })
            .on('exit', (code) => {
              if (code !== 0) {
                Logger.warning(`Worker exited with code ${code}`);
              }
              activeWorkers.delete(worker);
            });
        }

        // Wait for any worker to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      progress.stop();
      return results;
    } catch (error: any) {
      progress.stop();
      Logger.error(`Batch processing failed: ${error.message}`);
      throw error;
    } finally {
      // Cleanup any remaining workers
      for (const worker of activeWorkers) {
        worker.terminate();
      }
    }
  }

  /**
   * Creates a new worker with timeout handling
   */
  private static createWorker<T>(
    scriptPath: string,
    task: BatchTask<T>,
    timeoutMs: number
  ): Worker {
    const worker = new Worker(scriptPath, {
      workerData: task
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      Logger.warning(`Worker timeout after ${timeoutMs}ms`);
      worker.terminate();
    }, timeoutMs);

    // Clear timeout when worker is done
    worker.once('exit', () => clearTimeout(timeoutId));

    return worker;
  }
} 