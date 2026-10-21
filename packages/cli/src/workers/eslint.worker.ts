import { ESLint } from 'eslint';
import { WorkerConfig, WorkerResult } from '../types';

export interface ESLintWorkerTask {
  filePath: string;
  config: WorkerConfig;
  contextSettings?: any;
}

let eslint: ESLint | null = null;
let cachedConfigKey: string | null = null;

function getESLint(config: WorkerConfig, contextSettings?: any): ESLint {
  const configKey = JSON.stringify({
    configPath: config.configPath,
    fix: config.fix,
    cwd: config.cwd
  });

  if (!eslint || cachedConfigKey !== configKey) {
    const linterOptions: ESLint.Options = {
      overrideConfigFile: config.configPath,
      fix: config.fix,
    };
    if ("cwd" in config) {
      linterOptions.cwd = config.cwd;
    }
    if (contextSettings) {
      linterOptions.overrideConfig = {
        settings: contextSettings
      };
    }
    eslint = new ESLint(linterOptions);
    cachedConfigKey = configKey;
  }

  return eslint;
}

/**
 * Release the cached ESLint instance to free memory.
 * Call after processing a batch in the direct (non-pool) path,
 * where cwd changes per batch and the instance won't be reused.
 */
export function resetESLintCache(): void {
  eslint = null;
  cachedConfigKey = null;
}

/**
 * Piscina worker function — processes a single file per invocation.
 * The ESLint instance is cached per thread for performance.
 */
export default async function lint(task: ESLintWorkerTask): Promise<WorkerResult> {
  const { filePath, config, contextSettings } = task;

  try {
    const linter = getESLint(config, contextSettings);
    const results = await linter.lintFiles([filePath]);
    const fileResult = results[0];

    // Apply fixes if requested
    if (config.fix && fileResult.output) {
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