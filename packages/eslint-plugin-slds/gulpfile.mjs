import * as esbuild from 'esbuild';
import { series, src, dest } from 'gulp';
import { rimraf} from 'rimraf'
import {task} from "gulp-execa";
import path from 'path';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';
import pkg from "./package.json" with {type:"json"};

const require = createRequire(import.meta.url);

/**
 * Clean all generated folder
 * @returns
 */
function cleanDirs(){
    return rimraf(['build']);
}

 /**
  * Compile typescript files with version injection
  * */
const compileTs = async () => {
  const plugins = [{
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
  }];

  await esbuild.build({
    entryPoints: ["./src/**/*.ts"],
    bundle: true,
    outdir: "build",
    platform: "node",
    format: "cjs",
    packages: 'external', // Externalize all node_modules by default
    plugins, // Apply our custom bundling plugin
    sourcemap: process.env.NODE_ENV !== 'production',
    define: {
      'process.env.PLUGIN_VERSION': `"${pkg.version}"`
    }
  });
};

/**
 * ESBuild by default won't generate definition file. There are multiple ways 
 * to generate definition files. But we are relying on tsc for now
 */
const generateDefinitions = task('tsc --project tsconfig.json');

export const build = series(cleanDirs, compileTs, generateDefinitions);

export default task('gulp --tasks');