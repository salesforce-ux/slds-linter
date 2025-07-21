import * as esbuild from 'esbuild';
import { series, src, dest } from 'gulp';
import { rimraf} from 'rimraf'
import { dirname } from 'path';
import {task} from "gulp-execa";
import pkg from "./package.json" with {type:"json"};
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';
import { createRequire } from 'module';
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
  const isInternal = process.env.TARGET_PERSONA === 'internal';
  
  const plugins = [{
    name: 'bundle-stylelint-utils',
    setup(build) {
      // resolve the stylelint-plugin-slds package root directory
      const packageJsonPath = require.resolve('@salesforce-ux/stylelint-plugin-slds/package.json');
      const packageRoot = dirname(packageJsonPath);
      
      // Mark stylelint-plugin-slds as non-external so it gets bundled
      build.onResolve({ filter: /^@salesforce-ux\/stylelint-plugin-slds/ }, args => {
        const resolvedPath = args.path.replace('@salesforce-ux/stylelint-plugin-slds', packageRoot) + '.ts';
        return {
          path: resolvedPath,
          external: false
        };
      });
    }
  }];
  
  if (isInternal) {
    plugins.push(
      conditionalReplacePlugin({
        filter: /\.ts$/,
        replacements: [
          {
            search: /from\s+['"]@salesforce-ux\/sds-metadata['"]/g,
            replace: "from '@salesforce-ux/sds-metadata/preview'"
          }
        ]
      })
    );
  }
  
  await esbuild.build({
    entryPoints: ["./src/**/*.ts"],
    bundle: true,
    outdir: "build",
    platform: "node",
    format: "cjs",
    packages: 'external',
    sourcemap: process.env.NODE_ENV !== 'production',
    define: {
      'process.env.PLUGIN_VERSION': `"${pkg.version}"`
    },
    plugins
  });
};

/**
 * ESBuild by default won't generate definition file. There are multiple ways 
 * to generate definition files. But we are relying on tsc for now
 */
const generateDefinitions = task('tsc --project tsconfig.json');

export const build = series(cleanDirs, compileTs, generateDefinitions);

export default task('gulp --tasks');