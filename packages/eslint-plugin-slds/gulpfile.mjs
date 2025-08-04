import * as esbuild from 'esbuild';
import { series, src, dest } from 'gulp';
import { rimraf} from 'rimraf'
import {task} from "gulp-execa";
import pkg from "./package.json" with {type:"json"};
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * esbuild plugin to handle YAML imports
 */
const yamlPlugin = {
  name: 'yaml',
  setup(build) {
    build.onResolve({ filter: /\.ya?ml$/ }, args => ({
      path: resolve(dirname(args.importer), args.path),
      namespace: 'yaml-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'yaml-file' }, args => ({
      contents: JSON.stringify(load(readFileSync(args.path, 'utf8'))),
      loader: 'json',
    }));
  },
};

/**
 * Clean all generated folder
 * @returns
 */
function cleanDirs(){
    return rimraf(['build']);
}

/**
 * Copy non-TypeScript assets (YAML files, etc.) to build directory
 */
function copyAssets() {
  return src(['src/**/*.yml', 'src/**/*.yaml'])
    .pipe(dest('build/'));
}

 /**
  * Compile typescript files with version injection
  * */
const compileTs = async () => {
  const isInternal = process.env.TARGET_PERSONA === 'internal';
  
  const plugins = [yamlPlugin];
  
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

export const build = series(cleanDirs, compileTs, copyAssets, generateDefinitions);

export default task('gulp --tasks');