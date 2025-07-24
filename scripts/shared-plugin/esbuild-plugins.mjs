import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * ESBuild plugin to bundle slds-shared-utils instead of treating it as external
 * This allows the shared utilities to be included in the final bundle
 */
export const bundleSldsSharedUtilsPlugin = {
  name: 'bundle-slds-shared-utils',
  setup(build) {
    // Resolve the slds-shared-utils package root directory
    try {
      const packageJsonPath = require.resolve('slds-shared-utils/package.json');
      const packageRoot = dirname(packageJsonPath);
      
      // Mark slds-shared-utils as non-external so it gets bundled
      build.onResolve({ filter: /^slds-shared-utils/ }, args => {
        // Handle subpath imports like 'slds-shared-utils/submodule'
        const subpath = args.path.replace(/^slds-shared-utils\/?/, '');
        
        let resolvedPath;
        if (subpath) {
          // If there's a subpath, resolve it directly
          resolvedPath = resolve(packageRoot, 'src', subpath + '.ts');
        } else {
          // If it's just 'slds-shared-utils', resolve to index
          resolvedPath = resolve(packageRoot, 'src', 'index.ts');
        }
        
        return {
          path: resolvedPath,
          external: false
        };
      });
    } catch (error) {
      console.warn('Could not resolve slds-shared-utils for bundling:', error.message);
    }
  }
}; 