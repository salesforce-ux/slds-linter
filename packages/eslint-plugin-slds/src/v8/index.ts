import type { PluginConfig } from '../types';
import { PLUGIN_META } from '../constants';
import { createLegacyConfig } from '../config';
import { rules } from '../rules';

/**
 * ESLint v8 compatible plugin configuration
 */
const plugin: PluginConfig = {
  rules,
  configs: {
    recommended: createLegacyConfig()
  }
};

export = plugin; 