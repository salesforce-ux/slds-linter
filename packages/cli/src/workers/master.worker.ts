import path from 'path';
import { WorkerConfig, WorkerResult } from '../types';
import { addContextForFile, getContextSettings } from '../services/context-service';
import { StyleFilePatterns } from '../services/file-patterns';
import lint from './eslint.worker';

export interface MasterWorkerTask {
  filePath: string;
  config: WorkerConfig;
}

/**
 * Piscina worker function — handles all file types.
 * For style files, extracts context first then lints with ContextIndex.
 * For other files, lints directly without context extraction.
 */
export default async function masterLint(task: MasterWorkerTask): Promise<WorkerResult> {
  const { filePath, config } = task;

  try {
    const ext = path.extname(filePath).slice(1);
    if (StyleFilePatterns.extensions.includes(ext)) {
      const rootDir = config.cwd || process.cwd();
      await addContextForFile(rootDir, filePath);
    }
    const contextSettings = getContextSettings();
    if (config.deterministicOnly !== undefined) {
      contextSettings.deterministicOnly = config.deterministicOnly;
    }
    return await lint({ filePath, config, contextSettings });
  } catch (error: any) {
    return {
      filePath,
      error: error.message
    };
  }
}
