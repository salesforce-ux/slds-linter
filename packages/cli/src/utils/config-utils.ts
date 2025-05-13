import path from 'path';
import { LintConfig, ReportConfig, CliOptions } from '../types';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH } from '../services/config.resolver';
import { isDynamicPattern } from 'globby';
import { accessSync } from 'fs';
import { Logger } from './logger';

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
 * Normalize CLI options with appropriate defaults
 * This function ensures all required CLI options have valid values
 * It applies provided defaults and then options, then normalizes paths
 * 
 * @param options CLI options to normalize
 * @param defaultOptions Default options to apply
 * @returns Normalized CLI options with all fields populated
 */
export function normalizeCliOptions(
  options: CliOptions,
  defaultOptions: Partial<CliOptions> = {}
): Required<CliOptions> {
  Logger.debug('Normalizing CLI options');
  
  // Create normalized options object with appropriate precedence:
  // 1. Base defaults
  // 2. Provided default overrides
  // 3. User-provided options
  const normalizedOptions = {
    // Base defaults
    fix: false,
    editor: "vscode",
    configStylelint: "",
    configEslint: "",
    format: "sarif",
    // Default overrides
    ...defaultOptions,
    // User-provided options (highest priority)
    ...options,
    // Special handling for paths
    directory: normalizeDirectoryPath(options.directory),
    output: normalizeAndValidatePath(options.output),
  };
  
  Logger.debug(`Normalized CLI options: ${JSON.stringify(normalizedOptions, null, 2)}`);
  return normalizedOptions;
}

/**
 * Normalize configuration for the Node API
 * This function applies default values to the configuration object
 * It handles configuration for both linting and reporting operations
 * 
 * @param config Configuration object to normalize
 * @returns Normalized configuration with defaults applied
 */
export function normalizeConfig<T extends LintConfig | ReportConfig>(config: T): T {
  Logger.debug('Normalizing Node API configuration');
  
  // Apply defaults while preserving the original object structure
  const normalizedConfig = {
    ...config,
    // Apply defaults for common properties
    directory: config.directory || '.',
    configStylelint: config.configStylelint || DEFAULT_STYLELINT_CONFIG_PATH,
    configEslint: config.configEslint || DEFAULT_ESLINT_CONFIG_PATH,
  };
  
  Logger.debug(`Normalized config: ${JSON.stringify(normalizedConfig, null, 2)}`);
  return normalizedConfig;
} 