/**
 * Jest transformer for YAML files
 * Converts YAML imports to JSON for testing
 */

const yaml = require('js-yaml');
const fs = require('fs');

module.exports = {
  process(src, filename) {
    try {
      const data = yaml.load(src);
      return {
        code: `module.exports = ${JSON.stringify(data, null, 2)};`,
      };
    } catch (error) {
      throw new Error(`Failed to parse YAML file ${filename}: ${error.message}`);
    }
  },
}; 