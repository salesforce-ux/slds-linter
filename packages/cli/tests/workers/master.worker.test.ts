import { jest } from '@jest/globals';

describe('master.worker', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('extracts context before linting for style files (.css)', async () => {
    const extractor = await import('@salesforce-ux/context-extractor') as any;
    extractor.createBundleFromFile.mockReturnValue({ files: [] });
    extractor.auditBundle.mockResolvedValue([]);

    const { default: masterLint } = await import('../../src/workers/master.worker');

    const result = await masterLint({
      filePath: 'component.css',
      config: { configPath: '/config.mjs', cwd: '/project' },
    });

    expect(extractor.createBundleFromFile).toHaveBeenCalledWith('/project', 'component.css');
    expect(extractor.auditBundle).toHaveBeenCalled();
    expect(result.filePath).toBe('component.css');
  });

  it('extracts context for .scss files', async () => {
    const extractor = await import('@salesforce-ux/context-extractor') as any;
    extractor.createBundleFromFile.mockReturnValue({ files: [] });
    extractor.auditBundle.mockResolvedValue([]);

    const { default: masterLint } = await import('../../src/workers/master.worker');

    await masterLint({
      filePath: 'styles.scss',
      config: { configPath: '/config.mjs', cwd: '/project' },
    });

    expect(extractor.createBundleFromFile).toHaveBeenCalledWith('/project', 'styles.scss');
  });

  it('uses process.cwd() as rootDir when config.cwd is not set', async () => {
    const extractor = await import('@salesforce-ux/context-extractor') as any;
    extractor.createBundleFromFile.mockReturnValue({ files: [] });
    extractor.auditBundle.mockResolvedValue([]);

    const { default: masterLint } = await import('../../src/workers/master.worker');

    await masterLint({
      filePath: 'styles.less',
      config: { configPath: '/config.mjs' },
    });

    expect(extractor.createBundleFromFile).toHaveBeenCalledWith(process.cwd(), 'styles.less');
  });

  it('skips context extraction for non-style files', async () => {
    const extractor = await import('@salesforce-ux/context-extractor') as any;

    const { default: masterLint } = await import('../../src/workers/master.worker');

    const result = await masterLint({
      filePath: 'page.html',
      config: { configPath: '/config.mjs' },
    });

    expect(extractor.createBundleFromFile).not.toHaveBeenCalled();
    expect(extractor.auditBundle).not.toHaveBeenCalled();
    expect(result.filePath).toBe('page.html');
  });

  it('returns an error result when context extraction throws', async () => {
    const extractor = await import('@salesforce-ux/context-extractor') as any;
    extractor.createBundleFromFile.mockImplementation(() => { throw new Error('context fail'); });

    const { default: masterLint } = await import('../../src/workers/master.worker');

    const result = await masterLint({
      filePath: 'broken.css',
      config: { configPath: '/config.mjs' },
    });

    expect(result).toEqual({ filePath: 'broken.css', error: 'context fail' });
  });

  it('catches linting errors and returns them in the result', async () => {
    const extractor = await import('@salesforce-ux/context-extractor') as any;

    const { default: masterLint } = await import('../../src/workers/master.worker');

    // Linting a non-existent file triggers the error path
    const result = await masterLint({
      filePath: 'nonexistent.html',
      config: { configPath: '/config.mjs' },
    });

    expect(result.filePath).toBe('nonexistent.html');
    expect(result.error).toBeDefined();
    expect(extractor.createBundleFromFile).not.toHaveBeenCalled();
  });
});
