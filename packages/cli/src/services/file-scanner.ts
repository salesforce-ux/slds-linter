import { promises as fs } from "fs";
import { Logger } from "../utils/logger";
import {globby, isDynamicPattern} from 'globby';
import {extname} from "path";
import path from 'path';

export interface FilePattern {
  extensions:string[];
  exclude?: string[];
}

export interface ScanOptions {
  patterns: FilePattern;
  batchSize?: number;
  gitignore?: boolean;
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

      // Normalize path separators for cross-platform compatibility
      const normalizedPath = directory.replace(/\\/g, '/');
      
      let workingDirectory: string;
      let globPattern: string;
      
      if (!isDynamicPattern(normalizedPath)) {
        // Check if it's a file (has extension) or directory
        const hasExtension = path.extname(normalizedPath) !== '';
        if (hasExtension) {
          // Single file - use its directory as cwd and filename as pattern
          const directory = path.dirname(normalizedPath);
          workingDirectory = path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory);
          globPattern = path.basename(normalizedPath);
        } else {
          // Simple directory path - use it as cwd and search for files
          workingDirectory = path.isAbsolute(normalizedPath) ? normalizedPath : path.join(process.cwd(), normalizedPath);
          const extensions = options.patterns.extensions.join(',');
          globPattern = `**/*.{${extensions}}`;
        }
      } else {
        // Complex glob pattern - find the deepest concrete directory
        const firstGlobIndex = normalizedPath.search(/[*?{}[\]!+@()]/);
        const lastDirectoryIndex = normalizedPath.substring(0, firstGlobIndex).lastIndexOf('/');
        
        if (lastDirectoryIndex === -1) {
          workingDirectory = process.cwd();
          globPattern = normalizedPath;
        } else {
          const basePath = normalizedPath.substring(0, lastDirectoryIndex);
          workingDirectory = path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath);
          globPattern = normalizedPath.substring(lastDirectoryIndex + 1);
        }
      }

      const allFiles: string[] = await globby(globPattern, {
        cwd: workingDirectory,
        expandDirectories: false, // Disable for optimum performance - avoid unintended file discovery
        unique: true,
        ignore: options.patterns.exclude,
        onlyFiles: true,
        dot: true, // Include.dot files
        absolute: true,
        gitignore: options.gitignore !== false
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
