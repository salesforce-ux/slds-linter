import path from 'path';
import { FileScanner, ScanOptions } from '../src/services/file-scanner';
import { StyleFilePatterns } from '../src/services/file-patterns';
import {mkdir, writeFile, rm} from "fs/promises";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FileScanner', () => {
  const testDir = path.join(__dirname, 'fixtures');

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
      batchSize: 1,
      gitignore: false // Disable gitignore for tests
    };

    // Use relative path to test directory
    const relativeTestDir = path.relative(process.cwd(), testDir);
    const batches = FileScanner.scanFiles(relativeTestDir, options);
    
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(1);
    expect(batches[1]).toHaveLength(1);
    expect(batches[0][0]).toMatch(/test\.(css|scss)$/);
    expect(batches[1][0]).toMatch(/test\.(css|scss)$/);
  });

  it('should handle invalid files gracefully', async () => {
    const options: ScanOptions = {
      patterns: {
        extensions: ['nonexistent'],
        exclude: []
      },
      gitignore: false // Disable gitignore for tests
    };

    // Use relative path to test directory
    const relativeTestDir = path.relative(process.cwd(), testDir);
    const batches = FileScanner.scanFiles(relativeTestDir, options);
    expect(batches).toHaveLength(0);
  });
}); 