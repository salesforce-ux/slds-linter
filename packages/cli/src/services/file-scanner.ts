import path from 'path';
import { promises as fs } from "fs";
import {globby, isDynamicPattern} from 'globby';
import { Logger } from "../utils/logger";
import { FilePattern, ScanOptions, ScanResult } from "../types";

export interface NamedPattern {
  name: string;
  patterns: FilePattern;
}

export class FileScanner {
  static DEFAULT_BATCH_SIZE = 100;

  /**
   * Resolve the working directory and glob pattern for a given input path.
   * `extensions` is only used to synthesize a pattern for plain directory inputs.
   */
  private static resolveTarget(
    normalizedPath: string,
    extensions: string[]
  ): { workingDirectory: string; globPattern: string } {
    if (!isDynamicPattern(normalizedPath)) {
      const hasExtension = path.extname(normalizedPath) !== '';
      if (hasExtension) {
        // Single file - use its directory as cwd and filename as pattern
        const directory = path.dirname(normalizedPath);
        return {
          workingDirectory: path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory),
          globPattern: path.basename(normalizedPath),
        };
      }
      // Simple directory path - use it as cwd and search for files
      return {
        workingDirectory: path.isAbsolute(normalizedPath) ? normalizedPath : path.join(process.cwd(), normalizedPath),
        globPattern: `**/*.{${extensions.join(',')}}`,
      };
    }
    // Complex glob pattern - find the deepest concrete directory
    const firstGlobIndex = normalizedPath.search(/[*?{}[\]!+@()]/);
    const lastDirectoryIndex = normalizedPath.substring(0, firstGlobIndex).lastIndexOf('/');
    if (lastDirectoryIndex === -1) {
      return { workingDirectory: process.cwd(), globPattern: normalizedPath };
    }
    const basePath = normalizedPath.substring(0, lastDirectoryIndex);
    return {
      workingDirectory: path.isAbsolute(basePath) ? basePath : path.join(process.cwd(), basePath),
      globPattern: normalizedPath.substring(lastDirectoryIndex + 1),
    };
  }

  /**
   * Run a single globby pass and return validated absolute file paths whose
   * extension is in `extensions`.
   */
  private static async globAndValidate(
    workingDirectory: string,
    globPattern: string,
    extensions: string[],
    exclude: string[],
    gitignore: boolean
  ): Promise<string[]> {
    const extensionSet = new Set(extensions);
    const allFiles: string[] = await globby(globPattern, {
      cwd: workingDirectory,
      expandDirectories: false, // Disable for optimum performance - avoid unintended file discovery
      unique: true,
      ignore: exclude,
      onlyFiles: true,
      dot: true, // Include.dot files
      absolute: true,
      gitignore,
    }).then(matches => matches.filter(match => extensionSet.has(path.extname(match).substring(1))));

    return this.validateFiles(allFiles);
  }

  /**
   * Scans directory for files matching the given patterns
   * @param directory Base directory to scan
   * @param options Scanning options including patterns and batch size
   * @returns Array of file paths in batches
   */
  static async scanFiles(
    directory: string,
    options: ScanOptions
  ): Promise<ScanResult> {
    try {
      Logger.debug(`Scanning directory: ${directory}`);

      const normalizedPath = directory.replace(/\\/g, '/');
      const { workingDirectory, globPattern } = this.resolveTarget(
        normalizedPath,
        options.patterns.extensions
      );

      const validFiles = await this.globAndValidate(
        workingDirectory,
        globPattern,
        options.patterns.extensions,
        options.patterns.exclude,
        options.gitignore !== false
      );

      // Split into batches
      const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
      const batches = this.createBatches(validFiles, batchSize);

      Logger.debug(
        `Found ${validFiles.length} files, split into ${batches.length} batches`
      );
      return {
        filesCount: validFiles.length,
        batches
      };
    } catch (error: any) {
      Logger.error(`Failed to scan files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scan a directory ONCE for several extension groups and partition the results
   * per group. This avoids walking the tree once per file category. Groups are
   * assumed to have disjoint extension sets; a matched file is assigned to the
   * first group whose extensions include it.
   *
   * @returns A map of group name to that group's ScanResult (always present,
   *          even when empty).
   */
  static async scanFilesGrouped(
    directory: string,
    groups: NamedPattern[],
    options: { batchSize?: number; gitignore?: boolean } = {}
  ): Promise<Record<string, ScanResult>> {
    try {
      Logger.debug(`Scanning directory (grouped): ${directory}`);

      const normalizedPath = directory.replace(/\\/g, '/');
      const unionExtensions = Array.from(
        new Set(groups.flatMap(g => g.patterns.extensions))
      );
      const unionExclude = Array.from(
        new Set(groups.flatMap(g => g.patterns.exclude))
      );

      const { workingDirectory, globPattern } = this.resolveTarget(
        normalizedPath,
        unionExtensions
      );

      const validFiles = await this.globAndValidate(
        workingDirectory,
        globPattern,
        unionExtensions,
        unionExclude,
        options.gitignore !== false
      );

      const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
      const result: Record<string, ScanResult> = {};

      // Pre-seed empty results so callers can rely on every group existing.
      for (const group of groups) {
        result[group.name] = { filesCount: 0, batches: [] };
      }

      const buckets: Record<string, string[]> = {};
      for (const group of groups) {
        buckets[group.name] = [];
      }

      for (const file of validFiles) {
        const ext = path.extname(file).substring(1);
        const group = groups.find(g => g.patterns.extensions.includes(ext));
        if (group) {
          buckets[group.name].push(file);
        }
      }

      for (const group of groups) {
        const files = buckets[group.name];
        result[group.name] = {
          filesCount: files.length,
          batches: this.createBatches(files, batchSize),
        };
      }

      Logger.debug(
        `Grouped scan found ${validFiles.length} files across ${groups.length} groups`
      );
      return result;
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
  static createBatches(files: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    return batches;
  }
}
