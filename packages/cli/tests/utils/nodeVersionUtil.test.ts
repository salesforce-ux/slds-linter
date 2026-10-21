import { jest } from '@jest/globals';
import semver from 'semver';

describe('nodeVersionUtil', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('matches the Node.js versions supported by the CLI dependencies', async () => {
    const { REQUIRED_NODE_VERSION } = await import('../../src/utils/nodeVersionUtil');

    expect(REQUIRED_NODE_VERSION).toBe('^22.13.0 || >=24.0.0');
    expect(semver.satisfies('20.18.3', REQUIRED_NODE_VERSION)).toBe(false);
    expect(semver.satisfies('20.19.0', REQUIRED_NODE_VERSION)).toBe(false);
    expect(semver.satisfies('22.12.0', REQUIRED_NODE_VERSION)).toBe(false);
    expect(semver.satisfies('22.13.0', REQUIRED_NODE_VERSION)).toBe(true);
    expect(semver.satisfies('23.11.0', REQUIRED_NODE_VERSION)).toBe(false);
    expect(semver.satisfies('24.0.0', REQUIRED_NODE_VERSION)).toBe(true);
  });

  it('checkNodeVersion delegates to semver.satisfies', async () => {
    await jest.unstable_mockModule('semver', () => ({
      default: { satisfies: jest.fn(() => true) },
      satisfies: jest.fn(() => true),
    }));

    const mod = await import('../../src/utils/nodeVersionUtil');
    expect(mod.checkNodeVersion('>=1.0.0')).toBe(true);
  });

  it('validateNodeVersion warns for unsupported versions', async () => {
    const warning = jest.fn();
    const satisfies = jest.fn(() => false);

    await jest.unstable_mockModule('semver', () => ({
      satisfies,
      default: { satisfies },
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { warning },
    }));

    const { validateNodeVersion } = await import('../../src/utils/nodeVersionUtil');

    validateNodeVersion();
    expect(satisfies).toHaveBeenCalledWith(process.version, '^22.13.0 || >=24.0.0');
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('works best with the latest [Active LTS]'));
  });

  it('resolveDirName uses importMeta.dirname if present, else derives from url', async () => {
    const mod = await import('../../src/utils/nodeVersionUtil');

    expect(mod.resolveDirName({ dirname: '/x' } as any)).toBe('/x');

    const out = mod.resolveDirName({ url: 'file:///tmp/a/b.js' } as any);
    expect(out.replace(/\\/g, '/')).toContain('/tmp/a');
  });

  it('resolvePath uses importMeta.resolve when available, else ponyfill resolve()', async () => {
    jest.resetModules();

    await jest.unstable_mockModule('import-meta-resolve', () => ({
      resolve: () => 'file:///tmp/ponyfill.js',
    }));

    const mod = await import('../../src/utils/nodeVersionUtil');

    const p1 = mod.resolvePath('x', { resolve: () => 'file:///tmp/meta.js' } as any);
    expect(p1.replace(/\\/g, '/')).toContain('/tmp/meta.js');

    const p2 = mod.resolvePath('x', { url: 'file:///tmp/base.js' } as any);
    expect(p2.replace(/\\/g, '/')).toContain('/tmp/ponyfill.js');
  });
});
