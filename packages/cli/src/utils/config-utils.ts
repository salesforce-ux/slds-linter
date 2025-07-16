/**
 * Config utilities for SLDS Linter
 * 
 * Note: This file replaces the earlier cli-args.ts and consolidates configuration 
 * handling for both CLI and Node API into a single place
 */
import path from 'path';
import { LintConfig, ReportConfig, CliOptions } from '../types';
import { isDynamicPattern } from 'globby';
import { accessSync } from 'fs';
import { Logger } from './logger';
import { detectCurrentEditor } from './editorLinkUtil';

/**
 * Normalize and validate a file path
 * This function ensures that the provided path exists and is accessible
 * If no path is provided, it defaults to the current working directory
 * 
 * @param inputPath Input file path or undefined
 * @returns Normalized and validated absolute path
 * @throws Error if the path is invalid or inaccessible
 */
export function normalizeAndValidatePath(inputPath?: string): string {
  // Default to current working directory if no path provided
  if (!inputPath) {
    Logger.debug('No path provided, using current working directory');
    return process.cwd();
  }

  // Resolve to absolute path
  const normalizedPath = path.resolve(inputPath);
  Logger.debug(`Normalized path: ${normalizedPath}`);

  try {
    // Check if path exists and is accessible
    accessSync(normalizedPath);
    return normalizedPath;
  } catch (error) {
    // Throw descriptive error if path is invalid
    const errorMessage = `Invalid path: ${inputPath}`;
    Logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Normalize directory path with special handling for glob patterns
 * This function preserves glob patterns and resolves regular paths to absolute paths
 * If no directory is provided, it defaults to the current working directory
 * 
 * @param directory Input directory or glob pattern or undefined
 * @returns Normalized directory path
 */
export function normalizeDirectoryPath(directory?: string): string {
  // Default to current working directory if no directory provided
  if (!directory) {
    Logger.debug('No directory provided, using current working directory');
    return process.cwd();
  }
  
  // If it's a glob pattern, return as-is to preserve pattern matching
  if (isDynamicPattern(directory)) {
    Logger.debug(`Detected glob pattern: ${directory}`);
    return directory;
  }
  
  // For regular directories, resolve to absolute path
  Logger.debug(`Normalizing directory path: ${directory}`);
  return path.resolve(directory);
}

/**
 * Normalize configuration with appropriate defaults
 * This function ensures all required options have valid values
 * It applies provided defaults, then user-provided options, then normalizes paths
 * Used by both CLI commands and Node API functions
 * 
 * @param options Options to normalize
 * @param defaultOptions Default options to apply
 * @returns Normalized options with appropriate defaults
 */
export function normalizeCliOptions<T extends CliOptions | LintConfig | ReportConfig>(
  options: T,
  defaultOptions: Partial<T> = {},
): T {
  // Set up defaults based on context
  const baseDefaults: Partial<CliOptions> = {
    files: [],
    configStylelint: "",
    configEslint: "",
    fix: false,
    editor: detectCurrentEditor(),
    format: "sarif",
    internal: false
  };
  
  // Create normalized options with proper precedence
  const normalizedOptions = {
    ...baseDefaults,
    ...defaultOptions,
    ...options,
    directory: normalizeDirectoryPath(options.directory)
  };
  
  return normalizedOptions as T;
}

// For backward compatibility with imports, but deprecate in future versions
export const normalizeConfig = normalizeCliOptions; 