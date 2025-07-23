import * as esbuild from 'esbuild';
import { series, src, dest } from 'gulp';
import { rimraf} from 'rimraf'
import {task} from "gulp-execa";
import path from 'path';
import { bundleSldsSharedUtilsPlugin } from '../../scripts/shared-plugin/esbuild-plugins.mjs';
import pkg from "./package.json" with {type:"json"};
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';

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
  const plugins = [bundleSldsSharedUtilsPlugin];

  const isInternal = process.env.TARGET_PERSONA === 'internal';
  
  if (isInternal) {
    plugins.push(
      conditionalReplacePlugin({
        filter: /\.ts$/,
        replacements: [
          {
            search: /from\s+['"]@salesforce-ux\/sds-metadata['"]/g,
            replace: "from '@salesforce-ux/sds-metadata/next'"
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
    packages: 'external', // Externalize all node_modules by default
    plugins, // Apply our custom bundling plugin
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