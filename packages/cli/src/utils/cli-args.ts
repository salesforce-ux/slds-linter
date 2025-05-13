// DEPRECATED: This file is kept for backward compatibility with existing code
// New code should import directly from '../utils/config-utils' instead

// Re-export all necessary functions from config-utils.ts
export {
  normalizeAndValidatePath,
  normalizeDirectoryPath as nomalizeDirPath,
  normalizeCliOptions
} from './config-utils';
