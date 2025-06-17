import type { PluginConfig } from '../types';
import { PLUGIN_META } from '../constants';
import { createFlatConfig } from '../config';
import { rules } from '../rules';

/**
 * ESLint v9 compatible plugin configuration
 */
const plugin: PluginConfig = {
  rules,
  meta: PLUGIN_META,
  configs: {}
};

// Configure recommended preset
plugin.configs.recommended = createFlatConfig(plugin);

export = plugin; 