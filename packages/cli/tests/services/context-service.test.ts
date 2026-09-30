import { jest } from '@jest/globals';

describe('context-service', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('getContextIndex returns a ContextIndex singleton', async () => {
    const { ContextIndex } = await import('@salesforce-ux/context-extractor') as any;
    const { getContextIndex } = await import('../../src/services/context-service');

    const first = getContextIndex();
    const second = getContextIndex();

    expect(ContextIndex).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('getContextSettings returns context-extractor utilities with shared index', async () => {
    const extractor = await import('@salesforce-ux/context-extractor') as any;
    const { getContextSettings } = await import('../../src/services/context-service');

    const settings = getContextSettings();

    expect(settings.contextIndex).toBeDefined();
    expect(settings.classifyIssue).toBe(extractor.classifyIssue);
    expect(settings.serializeIssueContext).toBe(extractor.serializeIssueContext);
  });

  it('addContextForFile creates a bundle and adds audited issues to the index', async () => {
    const extractor = await import('@salesforce-ux/context-extractor') as any;
    const mockBundle = { files: ['style.css'] };
    const mockIssues = [{ id: 1 }];

    extractor.createBundleFromFile.mockReturnValue(mockBundle);
    extractor.auditBundle.mockResolvedValue(mockIssues);

    const { addContextForFile } = await import('../../src/services/context-service');

    await addContextForFile('/root', '/root/src/style.css');

    expect(extractor.createBundleFromFile).toHaveBeenCalledWith('/root', '/root/src/style.css');
    expect(extractor.auditBundle).toHaveBeenCalledWith({ rootDir: '/root', bundle: mockBundle });

    const ctxInstance = extractor.ContextIndex.mock.results[0].value;
    expect(ctxInstance.addIssues).toHaveBeenCalledWith(mockIssues);
  });
});
