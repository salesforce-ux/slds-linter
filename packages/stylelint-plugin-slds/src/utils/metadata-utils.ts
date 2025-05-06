import * as path from 'path';

// Path to metadata files
export const metadataFileUrl = path.resolve(
  process.cwd(),
  'node_modules/@salesforce-ux/sds-metadata/generated/slds1ExcludedVars.json'
);

// Metadata interface
export interface MetadataVariable {
  value: string;
  type?: string;
  description?: string;
}

export interface Metadata {
  variables: {
    [key: string]: MetadataVariable;
  };
} 