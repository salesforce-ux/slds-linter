import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Artifact as SarifArtifact } from 'sarif';

const BATCH_SIZE = 10;

/**
 * Process artifacts and add file content properties
 * @param artifacts Array of artifacts to process
 */
export async function processArtifacts(artifacts: SarifArtifact[]): Promise<void> {
  // Create batches first
  const batches = Array.from(
    { length: Math.ceil(artifacts.length / BATCH_SIZE) },
    (_, i) => artifacts.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
  );

  // Process batches sequentially
  for (const batch of batches) {
    // Process items within batch concurrently
    await Promise.all(
      batch.map(async (artifact) => {
        try {
          
          // default to html
          artifact.sourceLanguage = 'html';
            
          if (!artifact.location?.uri) {
            console.warn('Warning: Artifact missing location URI');
            return;
          }

          const filePath = path.join(process.cwd(), artifact.location.uri);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Calculate content length
          artifact.length = content.length;
          
          // Calculate content hash using SHA-256
          const hash = crypto.createHash('sha256');
          hash.update(content);
          artifact.hashes = {
            "sha-256": hash.digest('hex')
          };
        } catch (error) {
          console.warn(`Warning: Could not process artifact ${artifact.location?.uri}: ${error.message}`);
        }
      })
    );
  }
} 