import path from 'path';
import { mkdir, rm, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import { processArtifacts } from '../../src/services/artifact-processor';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('processArtifacts', () => {
  const originalCwd = process.cwd();
  const originalWarn = console.warn;

  beforeEach(() => {
    console.warn = () => {};
  });

  afterEach(() => {
    console.warn = originalWarn;
    process.chdir(originalCwd);
  });

  it('adds sourceLanguage, length, and sha-256 hash when file exists', async () => {
    const tmpDir = path.join(__dirname, 'fixtures-artifacts');
    await mkdir(tmpDir, { recursive: true });

    const relFile = 'test.html';
    const absFile = path.join(tmpDir, relFile);
    await writeFile(absFile, '<div>Hello</div>', 'utf-8');

    process.chdir(tmpDir);

    const artifacts: any[] = [
      {
        location: { uri: relFile }
      }
    ];

    await processArtifacts(artifacts);

    expect(artifacts[0].sourceLanguage).toBe('html');
    expect(artifacts[0].length).toBe('<div>Hello</div>'.length);
    expect(artifacts[0].hashes).toBeDefined();
    expect(artifacts[0].hashes['sha-256']).toMatch(/^[a-f0-9]{64}$/);

    await rm(tmpDir, { recursive: true, force: true });
  });

  it('warns and skips when artifact is missing location uri', async () => {
    const warnSpy = jest.spyOn(console, 'warn');

    const artifacts: any[] = [
      {
        location: {}
      }
    ];

    await processArtifacts(artifacts);

    expect(artifacts[0].sourceLanguage).toBe('html');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('warns when file cannot be read', async () => {
    const warnSpy = jest.spyOn(console, 'warn');

    const artifacts: any[] = [
      {
        location: { uri: 'does-not-exist.html' }
      }
    ];

    await processArtifacts(artifacts);

    expect(artifacts[0].sourceLanguage).toBe('html');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
