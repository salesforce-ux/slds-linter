import { createBundleFromFile, auditBundle, ContextIndex, classifyIssue, serializeIssueContext } from '@salesforce-ux/context-extractor';

// Singleton ContextIndex per worker thread — accumulates issues across files
let contextIndex: ContextIndex | null = null;

/**
 * Returns the shared ContextIndex singleton for this worker thread.
 */
export function getContextIndex(): ContextIndex {
  if (!contextIndex) {
    contextIndex = new ContextIndex();
  }
  return contextIndex;
}

/**
 * Returns an object containing everything the ESLint plugin needs
 * from context-extractor, to be passed via ESLint settings.
 */
export function getContextSettings(): Record<string, any> {
  return {
    contextIndex: getContextIndex(),
    classifyIssue,
    serializeIssueContext
  };
}

/**
 * Audit a single CSS file and add its issues to the shared ContextIndex.
 */
export async function addContextForFile(rootDir: string, cssFilePath: string): Promise<void> {
  const bundle = createBundleFromFile(rootDir, cssFilePath);
  const issues = await auditBundle({ rootDir, bundle });
  getContextIndex().addIssues(issues);
}
