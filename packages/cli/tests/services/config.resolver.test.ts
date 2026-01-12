import { jest } from '@jest/globals';

describe('config.resolver', () => {
  it('getRuleDescription strips namespace and slds/ prefix and falls back to --', async () => {
    jest.resetModules();

    await jest.unstable_mockModule('@salesforce-ux/eslint-plugin-slds/rule-messages', () => ({
      default: {
        'my-rule': { description: 'My Rule Description' }
      }
    }));

    await jest.unstable_mockModule('../../src/utils/nodeVersionUtil', () => ({
      resolvePath: () => '/abs/config/path'
    }));

    const mod = await import('../../src/services/config.resolver');

    expect(mod.DEFAULT_ESLINT_CONFIG_PATH).toBe('/abs/config/path');
    expect(mod.getRuleDescription('@salesforce-ux/slds/my-rule')).toBe('My Rule Description');
    expect(mod.getRuleDescription('slds/my-rule')).toBe('My Rule Description');
    expect(mod.getRuleDescription('unknown-rule')).toBe('--');
  });
});
