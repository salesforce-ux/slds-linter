import { join, dirname } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

/**
 * Enum representing all available metadata JSON files
 */
export enum MetadataFile {
  AURA_TO_LWC_TOKENS = 'auraToLwcTokensMapping.json',
  BEM_NAMING = 'bem-naming.json',
  DEPRECATED_CLASSES = 'deprecatedClasses.json',
  DEPRECATED_STYLING_HOOKS = 'deprecatedStylingHooks.json',
  GLOBAL_STYLING_HOOKS = 'globalStylingHooks.metadata.json',
  ICONS = 'icons.json',
  LWC_TO_SLDS = 'lwc-to-slds.json',
  SLDS_CLASSES = 'sldsClasses.json',
  SLDS_PLUS_CLASSES = 'sldsPlusClasses.json',
  SLDS_PLUS_STYLING_HOOKS = 'sldsPlusStylingHooks.json',
  SLDS_STYLING_HOOKS = 'sldsStylingHooks.json',
  VALUE_TO_STYLING_HOOKS_COSMOS = 'valueToStylingHooks.cosmos.json',
  VALUE_TO_STYLING_HOOKS_SLDS = 'valueToStylingHooks.slds.json'
}

export class MetadataService {
  private static instance: MetadataService;
  private readonly metadataPath: string;
  private cache: Map<string, any> = new Map();

  private constructor() {
    // Create a require function for the current module
    const require = createRequire(import.meta.url);
    // Resolve the path to @salesforce-ux/sds-metadata package
    this.metadataPath = require.resolve('@salesforce-ux/sds-metadata');
  }

  /**
   * Get the singleton instance of MetadataService
   */
  public static getInstance(): MetadataService {
    if (!MetadataService.instance) {
      MetadataService.instance = new MetadataService();
    }
    return MetadataService.instance;
  }

  /**
   * Loads a metadata file from the package
   * @param filePath - Path to the metadata file relative to the metadata package root
   * @returns Parsed metadata as a JavaScript object/array
   */
  private loadMetadata<T>(filePath: string): T {
    try {
      // Check cache first
      if (this.cache.has(filePath)) {
        return this.cache.get(filePath) as T;
      }

      const fullPath = join(this.metadataPath, '..', filePath);
      const fileContent = readFileSync(fullPath, 'utf8');
      const data = JSON.parse(fileContent) as T;
      
      // Cache the result
      this.cache.set(filePath, data);
      
      return data;
    } catch (error) {
      throw new Error(`Failed to load metadata file: ${filePath}. Error: ${error.message}`);
    }
  }

  /**
   * Loads multiple metadata files from the package
   * @param filePaths - Array of paths to metadata files relative to the metadata package root
   * @returns Array of parsed metadata as JavaScript objects/arrays
   */
  private loadMultipleMetadata<T>(filePaths: string[]): T[] {
    return filePaths.map(filePath => this.loadMetadata<T>(filePath));
  }

  /**
   * Static method to load a single metadata file
   * @param file - The metadata file to load
   * @returns Parsed metadata as a JavaScript object/array
   */
  public static loadMetadata<T>(file: MetadataFile): T {
    return MetadataService.getInstance().loadMetadata<T>(file);
  }

  /**
   * Static method to load multiple metadata files
   * @param files - Array of metadata files to load
   * @returns Array of parsed metadata as JavaScript objects/arrays
   */
  public static loadMultipleMetadata<T>(files: MetadataFile[]): T[] {
    return MetadataService.getInstance().loadMultipleMetadata<T>(files);
  }
}
