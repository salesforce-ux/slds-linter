import { promises as fs } from "fs";
import { Logger } from "../utils/logger";
import { globbySync } from 'globby';
import path from 'path';
import { StyleFilePatterns, ComponentFilePatterns } from './file-patterns';

export interface FilePattern {
  extensions:string[];
  exclude?: string[];
}

export interface ScanOptions {
  patterns: FilePattern;
  batchSize?: number;
  gitignore?: boolean; // Allow overriding gitignore in tests
}

export class FileScanner {
  private static DEFAULT_BATCH_SIZE = 100;

  /**
   * Scans directory for files matching the given patterns
   * @param directory Base directory to scan
   * @param options Scanning options including patterns and batch size
   * @returns Array of file paths in batches
   */
  static scanFiles(
    directory: string,
    options: ScanOptions
  ): string[][] {
    try {
      Logger.debug(`Scanning directory: ${directory}`);

      // Normalize path separators for cross-platform compatibility
      const normalizedPath = directory.replace(/\\/g, '/');
      const currentWorkingDir = process.cwd();

      // Parse path components for glob optimization
      const { searchPattern, searchDirectory } = this.parseSearchPath(normalizedPath, currentWorkingDir, options.patterns.extensions);

      // Set working directory and search pattern
      const workingDirectory = searchDirectory;
      const globPattern = searchPattern;

      Logger.debug(`Using working directory: ${workingDirectory}, pattern: ${globPattern}`);

      // Use globby with optimized options
      const allFiles: string[] = globbySync(globPattern, {
        cwd: workingDirectory,
        onlyFiles: true,
        absolute: true,
        ignore: [...(options.patterns.exclude || []), '**/node_modules/**'], // Exclude node_modules for better performance
        gitignore: options.gitignore !== false // Enable gitignore by default, allow disabling for tests
      });

      // Split into batches
      const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
      const batches = this.createBatches(allFiles, batchSize);

      Logger.debug(
        `Found ${allFiles.length} files, split into ${batches.length} batches`
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

  /**
   * Parses a file path into optimized search components
   * @param filePath Normalized file path to parse
   * @param rootDirectory Base directory to start search from
   * @param fileExtensions Allowed file extensions
   * @returns Object containing search pattern and directory
   */
  private static parseSearchPath(
    filePath: string,
    rootDirectory: string,
    fileExtensions: string[]
  ): { searchPattern: string; searchDirectory: string } {
    // Handle glob patterns
    if (filePath.includes('*')) {
      return this.parseGlobPattern(filePath, rootDirectory);
    }

    // Handle single files
    if (this.isSupportedFile(filePath)) {
      return this.parseSingleFile(filePath, rootDirectory);
    }

    // Handle directories
    return this.parseDirectory(filePath, rootDirectory, fileExtensions);
  }

  /**
   * Checks if a file has a supported extension
   */
  private static isSupportedFile(filePath: string): boolean {
    const allSupportedExtensions = [
      ...StyleFilePatterns.extensions,
      ...ComponentFilePatterns.extensions
    ];
    return allSupportedExtensions.some(ext => filePath.endsWith(`.${ext}`));
  }

  /**
   * Parses a glob pattern into search components
   */
  private static parseGlobPattern(
    globPath: string,
    rootDirectory: string
  ): { searchPattern: string; searchDirectory: string } {
    const globIndex = globPath.indexOf('*');
    const directoryPath = globPath.substring(0, globIndex).lastIndexOf('/');

    if (directoryPath === -1) {
      return {
        searchPattern: globPath,
        searchDirectory: rootDirectory
      };
    }

    return {
      searchPattern: globPath.substring(directoryPath + 1),
      searchDirectory: path.join(rootDirectory, globPath.substring(0, directoryPath))
    };
  }

  /**
   * Parses a single file path into search components
   */
  private static parseSingleFile(
    filePath: string,
    rootDirectory: string
  ): { searchPattern: string; searchDirectory: string } {
    const directoryPath = filePath.lastIndexOf('/');

    if (directoryPath === -1) {
      return {
        searchPattern: filePath,
        searchDirectory: rootDirectory
      };
    }

    return {
      searchPattern: filePath.substring(directoryPath + 1),
      searchDirectory: path.join(rootDirectory, filePath.substring(0, directoryPath))
    };
  }

  /**
   * Parses a directory path into search components
   */
  private static parseDirectory(
    directoryPath: string,
    rootDirectory: string,
    fileExtensions: string[]
  ): { searchPattern: string; searchDirectory: string } {
    return {
      searchPattern: `*.{${fileExtensions.join(',')}}`,
      searchDirectory: path.join(rootDirectory, directoryPath)
    };
  }
}
