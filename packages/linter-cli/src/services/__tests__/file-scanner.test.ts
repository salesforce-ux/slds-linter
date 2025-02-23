import path from 'path';
import { FileScanner, ScanOptions } from '../file-scanner';
import { StyleFilePatterns } from '../file-patterns';
import {mkdir, writeFile, rm} from "fs/promises";

describe('FileScanner', () => {
  const testDir = path.join(import.meta.dirname , 'fixtures');

  beforeAll(async () => {
    // Create test directory and files for testing
    await mkdir(testDir, { recursive: true });
    await writeFile(
      path.join(testDir, 'test.css'),
      'body { color: red; }'
    );
    await writeFile(
      path.join(testDir, 'test.scss'),
      '$color: red;'
    );
  });

  afterAll(async () => {
    // Clean up test files
    await rm(testDir, { recursive: true });
  });

  it('should scan and batch files correctly', async () => {
    const options: ScanOptions = {
      patterns: StyleFilePatterns,
      batchSize: 1
    };

    const batches = await FileScanner.scanFiles(testDir, options);
    
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(1);
    expect(batches[1]).toHaveLength(1);
    expect(batches[0][0]).toMatch(/test\.(css|scss)$/);
    expect(batches[1][0]).toMatch(/test\.(css|scss)$/);
  });

  it('should handle invalid files gracefully', async () => {
    const options: ScanOptions = {
      patterns: {
        include: ['**/*.nonexistent'],
        exclude: []
      }
    };

    const batches = await FileScanner.scanFiles(testDir, options);
    expect(batches).toHaveLength(0);
  });
}); 