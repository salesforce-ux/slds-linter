import path from 'path';
import os from 'os';
import Piscina from 'piscina';
import { WorkerConfig, WorkerResult, LintResult, LintRunnerOptions } from '../types';
import { Logger } from '../utils/logger';
import { resolveDirName } from '../utils/nodeVersionUtil';
import { ConfigLoader } from './config-loader';
import { ProgressHandler } from './progress-handler';
import masterLint from '../workers/master.worker';
import { resetESLintCache } from '../workers/eslint.worker';

const AVAILABLE_CPUS = os.cpus().length - 1;

export class LintRunner {
  private static DEFAULT_MAX_WORKERS = Math.max(1, Math.min(4, AVAILABLE_CPUS));
  private static DEFAULT_TIMEOUT_MS = 300000; // 5 minutes
  private static pool: Piscina | null = null;
  private static poolConfigKey: string | null = null;

  private static getPool(masterWorkerScript: string, maxWorkers: number, timeoutMs: number, configPath: string | undefined): Piscina {
    const key = JSON.stringify({ masterWorkerScript, maxWorkers, configPath });
    if (this.pool && this.poolConfigKey === key) {
      return this.pool;
    }
    if (this.pool) {
      this.pool.destroy();
    }
    this.pool = new Piscina({
      filename: masterWorkerScript,
      minThreads: 1,
      maxThreads: maxWorkers,
      idleTimeout: timeoutMs,
    });
    this.poolConfigKey = key;
    return this.pool;
  }

  /**
   * Destroy the shared worker pool. Call when linting is fully complete.
   */
  static async destroy(): Promise<void> {
    if (this.pool) {
      await this.pool.destroy();
      this.pool = null;
      this.poolConfigKey = null;
    }
  }

  /**
   * Run linting directly in the main thread (no pool overhead).
   * Used for small file batches where parallelization isn't beneficial.
   */
  private static async runDirect(
    files: string[],
    workerConfig: WorkerConfig
  ): Promise<WorkerResult[]> {
    const results: WorkerResult[] = [];
    for (const filePath of files) {
      try {
        const result = await masterLint({ filePath, config: workerConfig });
        results.push(result);
      } catch (error: any) {
        Logger.warning(`File processing failed: ${filePath} - ${error.message}`);
        results.push({ filePath, error: error.message });
      }
    }
    resetESLintCache();
    return results;
  }

  /**
   * Run linting on files. Uses direct execution for small batches
   * and a Piscina worker pool for larger ones.
   */
  static async runLinting(
    files: string[],
    options: LintRunnerOptions = {}
  ): Promise<LintResult[]> {
    if (files.length === 0) {
      return [];
    }

    const maxWorkers = options.maxWorkers || this.DEFAULT_MAX_WORKERS;
    const timeoutMs = options.timeoutMs || this.DEFAULT_TIMEOUT_MS;
    const configPath = await ConfigLoader.processConfig(options.configPath);

    const workerConfig: WorkerConfig = {
      configPath,
      fix: options.fix,
      cwd: options.cwd,
      deterministicOnly: options.deterministicOnly,
    };

    const usePool = files.length >= maxWorkers;

    const progress = new ProgressHandler({ total: files.length });

    try {
      let workerResults: WorkerResult[];

      if (usePool) {
        const workersDir = path.resolve(resolveDirName(import.meta), '../workers');
        const masterWorkerScript = path.resolve(workersDir, 'master.worker.js');
        const pool = this.getPool(masterWorkerScript, maxWorkers, timeoutMs, configPath);

        Logger.debug(`Starting linting with Piscina pool (${maxWorkers} workers, ${files.length} files)`);

        const taskPromises: Promise<WorkerResult>[] = files.map(filePath =>
          pool.run({ filePath, config: workerConfig })
            .then((result: WorkerResult) => {
              progress.increment();
              return result;
            })
            .catch((error: Error) => {
              progress.increment();
              Logger.warning(`File processing failed: ${filePath} - ${error.message}`);
              return { filePath, error: error.message } as WorkerResult;
            })
        );

        workerResults = await Promise.all(taskPromises);
      } else {
        Logger.debug(`Starting linting directly (${files.length} files)`);
        workerResults = await this.runDirect(files, workerConfig);
        workerResults.forEach(() => progress.increment());
      }

      progress.stop();

      return this.processResults(workerResults);
    } catch (error: any) {
      progress.stop();
      Logger.error(`Linting failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process and normalize worker results
   */
  private static processResults(workerResults: WorkerResult[]): LintResult[] {
    const results: LintResult[] = [];

    for (const result of workerResults) {
      if (result.error || !result.lintResult) {
        if (result.error) {
          Logger.warning(`File processing failed: ${result.filePath} - ${result.error}`);
        }
        continue;
      }
      results.push(result.lintResult);
    }

    return results;
  }
} 