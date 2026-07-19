import path from 'path';
import { ScanOptions } from '../../src/types';
import { FileScanner } from '../../src/services/file-scanner';
import { StyleFilePatterns, ComponentFilePatterns, FrameworkFilePatterns } from '../../src/services/file-patterns';
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
    await writeFile(
      path.join(testDir, 'Component.jsx'),
      'export const C = () => <div className="slds-button" />;'
    );
    await writeFile(
      path.join(testDir, 'Component.tsx'),
      'export const C = () => <div className="slds-button" />;'
    );
    await writeFile(
      path.join(testDir, 'helper.ts'),
      'export const x = 1;'
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
      gitignore: false
    };

    const { batches } = await FileScanner.scanFiles(testDir, options);
    
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(1);
    expect(batches[1]).toHaveLength(1);
    expect(batches[0][0]).toMatch(/test\.(css|scss)$/);
    expect(batches[1][0]).toMatch(/test\.(css|scss)$/);
  });

  it('should discover React framework files (.jsx/.tsx/.ts)', async () => {
    const options: ScanOptions = {
      patterns: FrameworkFilePatterns,
      batchSize: 100,
      gitignore: false
    };

    const { filesCount, batches } = await FileScanner.scanFiles(testDir, options);
    const files = batches.flat().map((f) => path.basename(f)).sort();

    expect(filesCount).toBe(3);
    expect(files).toEqual(['Component.jsx', 'Component.tsx', 'helper.ts']);
  });

  it('should partition a single scan into style/component/framework groups', async () => {
    const result = await FileScanner.scanFilesGrouped(
      testDir,
      [
        { name: 'style', patterns: StyleFilePatterns },
        { name: 'component', patterns: ComponentFilePatterns },
        { name: 'framework', patterns: FrameworkFilePatterns },
      ],
      { batchSize: 100, gitignore: false }
    );

    expect(result.style.filesCount).toBe(2); // test.css, test.scss
    expect(
      result.style.batches.flat().map((f) => path.basename(f)).sort()
    ).toEqual(['test.css', 'test.scss']);

    expect(result.component.filesCount).toBe(0); // no html/cmp fixtures

    expect(result.framework.filesCount).toBe(3); // Component.jsx/.tsx, helper.ts
    expect(
      result.framework.batches.flat().map((f) => path.basename(f)).sort()
    ).toEqual(['Component.jsx', 'Component.tsx', 'helper.ts']);
  });

  it('should handle invalid files gracefully', async () => {
    const options: ScanOptions = {
      patterns: {
        extensions: ['nonexistent'],
        exclude: []
      },
      gitignore: false
    };

    const { batches } = await FileScanner.scanFiles(testDir, options);
    expect(batches).toHaveLength(0);
  });
}); 