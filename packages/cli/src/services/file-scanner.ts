import { promises as fs } from "fs";
import path from "path";
import { glob, Path } from "glob";
import { Logger } from "../utils/logger";

export interface FilePattern {
  include: string[];
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
      Logger.debug(`Include patterns: ${options.patterns.include.join(", ")}`);

      const allFiles: string[] = [];
        // Process include patterns
        for (const pattern of options.patterns.include) {
          const files = await glob(`${directory}/${pattern}`, {
            cwd: process.cwd(),
            ignore: options.patterns.exclude,
            withFileTypes: true,
            dot: true, // Include .dot files
          }).then((matches: Path[]) =>
            matches
              .filter((match) => match.isFile())
              .map((match) => {
                // Just use the fullpath directly as it's already relative to cwd
                return match.fullpath();
              })
          );

          allFiles.push(...files);
        }

      // Remove duplicates
      const uniqueFiles = [...new Set(allFiles)];

      // Validate files exist and are readable
      const validFiles = await this.validateFiles(uniqueFiles);

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
