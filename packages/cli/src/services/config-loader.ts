import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../utils/logger';

// Manually define __dirname for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PERSONA_CONFIG_PATH = path.resolve(__dirname, '../config/persona-config.json');

export function loadPersonaConfig(persona: string): { styleConfig?: object; eslintConfig?: object } {
  let personaConfigs;

  if (!fs.existsSync(PERSONA_CONFIG_PATH)) {
    Logger.info('⚠️ No persona configuration found. Using default linting rules.');
    return {};
  }

  try {
    personaConfigs = JSON.parse(fs.readFileSync(PERSONA_CONFIG_PATH, 'utf8'));
  } catch (error) {
    Logger.error(`❌ Failed to read persona configuration: ${error.message}`);
    return {};
  }

  if (!personaConfigs || typeof personaConfigs !== 'object' || !personaConfigs.base || !personaConfigs.personas) {
    Logger.error('❌ Invalid persona configuration format.');
    return {};
  }

  const baseConfig = personaConfigs.base;
  const personaConfig = personaConfigs.personas[persona] || {};

  return {
    styleConfig: {
      ...baseConfig.style,
      rules: { ...baseConfig.style?.rules, ...personaConfig.style?.rules }
    },
    eslintConfig: {
      ...baseConfig.eslint,
      rules: { ...baseConfig.eslint?.rules, ...personaConfig.eslint?.rules },
      overrides: mergeOverrides(baseConfig.eslint?.overrides, personaConfig.eslint?.overrides)
    }
  };
}

/**
 * Merges base overrides with persona-specific overrides.
 */
function mergeOverrides(baseOverrides = [], personaOverrides = []) {
  return baseOverrides.map(baseOverride => {
    const personaOverride = personaOverrides?.find(o => o.files.toString() === baseOverride.files.toString());
    return personaOverride ? { ...baseOverride, rules: { ...baseOverride.rules, ...personaOverride.rules } } : baseOverride;
  });
}
