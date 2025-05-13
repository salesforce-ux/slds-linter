// DEPRECATED: This file is kept for backward compatibility
// New code should import from '../utils/config-utils' instead

import { normalizeDirectoryPath, normalizeAndValidatePath, normalizeCliOptions as importedNormalizeCliOptions } from './config-utils';
import { CliOptions } from "../types";

/**
 * @deprecated Use normalizeAndValidatePath from config-utils instead
 */
export function nomalizeAndValidatePath(inputPath?: string): string {
  return normalizeAndValidatePath(inputPath);
}

/**
 * @deprecated Use normalizeDirectoryPath from config-utils instead
 */
export function nomalizeDirPath(inputPath?: string): string {
  return normalizeDirectoryPath(inputPath);
}

/**
 * @deprecated Use normalizeCliOptions from config-utils instead
 */
export function normalizeCliOptions(
  options: CliOptions,
  defultOptions: Partial<CliOptions> = {}
): Required<CliOptions> {
  return importedNormalizeCliOptions(options, defultOptions);
}
