import path from 'path';

// Helper: Load module from npx cache
async function loadFromNpx(nodeExecutablePath, packageName, subPath) {
  const nodeModulesPath = path.join(nodeExecutablePath, '../..');
  const modulePath = path.join(nodeModulesPath, packageName, subPath);
  return await import(`file://${modulePath}`);
}

async function loadModule(packageName, npxSubPath = '', prioritizeNpx = false, standardSubPath = null) {
  const nodeExecutablePath = process.env._;
  const isNpx = nodeExecutablePath && nodeExecutablePath.endsWith('slds-linter');
  
  // Use npxSubPath for npx cache, standardSubPath (or npxSubPath) for standard imports
  const stdPath = standardSubPath !== null ? standardSubPath : npxSubPath;
  
  try {
    // When running via npx, load from npx FIRST to avoid version conflicts
    if (isNpx && prioritizeNpx) {
      return await loadFromNpx(nodeExecutablePath, packageName, npxSubPath);
    }
    return await import(stdPath ? `${packageName}/${stdPath}` : packageName);
  } catch (err) {
    // Fallback to npx cache
    try {
      return await loadFromNpx(nodeExecutablePath, packageName, npxSubPath);
    } catch (npxErr) {
      console.error(`Failed to load ${packageName}:`, err.message);
      throw new Error(`Cannot load ${packageName}`);
    }
    throw new Error(`Cannot load ${packageName}: ${err.message}`);
  }
}

// Load modules
// Note: 'eslint/config' for standard import, but npx cache needs full path 'eslint/lib/config-api.js'
const eslintConfigModule = await loadModule('eslint', 'lib/config-api.js', false, 'config');
const { defineConfig } = eslintConfigModule;

const sldsPluginModule = await loadModule('@salesforce-ux/eslint-plugin-slds', 'build/index.js', true);
const sldsPlugin = sldsPluginModule.default;

export default defineConfig([
  {
    plugins: {
      "@salesforce-ux/slds": sldsPlugin,
    },
    extends: ["@salesforce-ux/slds/recommended"]
    //defineConfig() helper helps which config to use internally.
  },
]);