import { promises as fs } from "fs";
import { Logger } from "../utils/logger";
import {globby} from 'globby';
import {extname} from "path";

export interface FilePattern {
  extensions:string[];
  exclude?: string[];
}

export interface ScanOptions {
  patterns: FilePattern;
  batchSize?: number;
}

export class FileScanner {
  private static DEFAULT_BATCH_SIZE = 100;

  /**
   * Scans directory for files matching the given patterns
   * @param directory Base directory to scan
   * @param options Scanning options including patterns and batch size
   * @returns Array of file paths in batches
   */
  static async scanFiles(
    directory: string,
    options: ScanOptions
  ): Promise<string[][]> {
    try {
      Logger.debug(`Scanning directory: ${directory}`);

      const allFiles: string[] = await globby(directory, {
        cwd: process.cwd(),
        expandDirectories:true,
        unique:true,
        ignore: options.patterns.exclude,
        onlyFiles: true,
        dot: true, // Include.dot files
        absolute: true,
        gitignore:true
      }).then(matches => matches.filter(match => {
        const fileExt = extname(match).substring(1);
        return options.patterns.extensions.includes(fileExt);
      }));

      // Validate files exist and are readable
      const validFiles = await this.validateFiles(allFiles);

      // Split into batches
      const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
      const batches = this.createBatches(validFiles, batchSize);

      Logger.debug(
        `Found ${validFiles.length} files, split into ${batches.length} batches`
      );
      return batches;
    } catch (error: any) {
      Logger.error(`Failed to scan files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates that files exist and are readable
   */
  private static async validateFiles(files: string[]): Promise<string[]> {
    const validFiles: string[] = [];

    for (const file of files) {
      try {
        await fs.access(file, fs.constants.R_OK);
        validFiles.push(file);
      } catch (error) {
        Logger.warning(`Skipping inaccessible file: ${file}`);
      }
    }

    return validFiles;
  }

  /**
   * Splits array of files into batches
   */
  private static createBatches(files: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    return batches;
  }
}
