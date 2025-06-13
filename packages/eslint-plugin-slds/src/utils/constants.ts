/**
 * Package metadata dynamically loaded from package.json
 * Ensures consistency between plugin metadata and package information
 */
const packageJson = require('../../package.json');

export const PLUGIN_META = {
    name: packageJson.name,
    version: packageJson.version
} as const; 