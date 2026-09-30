import path from 'path';
import { ScanOptions } from '../../src/types';
import { FileScanner } from '../../src/services/file-scanner';
import { ReactFilePatterns, StyleFilePatterns } from '../../src/services/file-patterns';
import {mkdir, writeFile, rm} from "fs/promises";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FileScanner', () => {
  const testDir = path.join(__dirname , 'fixtures');

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

  it('should scan files and return flat file list', async () => {
    const options: ScanOptions = {
      patterns: StyleFilePatterns,
      gitignore: false
    };

    const files = await FileScanner.scanFiles(testDir, options);
    
    expect(files).toHaveLength(2);
    expect(files[0]).toMatch(/test\.(css|scss)$/);
    expect(files[1]).toMatch(/test\.(css|scss)$/);
  });

  it('should handle invalid files gracefully', async () => {
    const options: ScanOptions = {
      patterns: {
        extensions: ['nonexistent'],
        exclude: []
      },
      gitignore: false
    };

    const files = await FileScanner.scanFiles(testDir, options);
    expect(files).toHaveLength(0);
  });

  it('defines React file patterns for JSX and TSX only', () => {
    expect(ReactFilePatterns.extensions).toEqual(['jsx', 'tsx']);
    expect(ReactFilePatterns.exclude).toEqual(StyleFilePatterns.exclude);
  });
});
