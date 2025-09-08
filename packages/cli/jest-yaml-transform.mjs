/**
 * Jest transformer for YAML files
 * Converts YAML imports to JSON for testing
 */

import { parse } from 'yaml';

export default {
  process(src, filename) {
    try {
      const data = parse(src);
      return {
        code: `module.exports = ${JSON.stringify(data, null, 2)};`,
      };
    } catch (error) {
      throw new Error(`Failed to parse YAML file ${filename}: ${error.message}`);
    }
  },
};
