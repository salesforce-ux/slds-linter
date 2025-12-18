import { jest } from '@jest/globals';

describe('nodeVersionUtil', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('checkNodeVersion delegates to semver.satisfies', async () => {
    await jest.unstable_mockModule('semver', () => ({
      default: { satisfies: jest.fn(() => true) },
      satisfies: jest.fn(() => true),
    }));

    const mod = await import('../../src/utils/nodeVersionUtil');
    expect(mod.checkNodeVersion('>=1.0.0')).toBe(true);
  });

  it('validateNodeVersion warns only for very old versions branch', async () => {
    const warning = jest.fn();

    // First satisfies: required version check -> false.
    // Second satisfies: "<18.4.x" -> true.
    const satisfies = jest
      .fn()
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => true);

    await jest.unstable_mockModule('semver', () => ({
      satisfies,
      default: { satisfies },
    }));

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { warning },
    }));

    const { validateNodeVersion } = await import('../../src/utils/nodeVersionUtil');

    validateNodeVersion();
    expect(warning).toHaveBeenCalled();
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
