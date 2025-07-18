import * as esbuild from 'esbuild';
import { series, src, dest } from 'gulp';
import { rimraf} from 'rimraf'
import {task} from "gulp-execa";
import path from 'path';
import pkg from "./package.json" with {type:"json"};

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
  await esbuild.build({
    entryPoints: ["./src/**/*.ts"],
    bundle: true,
    outdir: "build",
    platform: "node",
    format: "cjs",
    preserveSymlinks: false, // Follow symlinks and bundle workspace packages
    absWorkingDir: process.cwd(), // Set working directory for resolution
    nodePaths: ["../../node_modules"], // Help find workspace packages
    metafile: true, // Generate metadata for debugging
    external: ["@html-eslint/parser", "@html-eslint/eslint-plugin", "@eslint/css", "@salesforce-ux/sds-metadata"], // External deps but bundle slds-shared-utils and chroma-js for independence
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