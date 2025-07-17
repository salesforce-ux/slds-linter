import * as esbuild from 'esbuild';
import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions";
import { series, watch } from 'gulp';
import { task } from "gulp-execa";
import { rimraf } from 'rimraf';

const ENABLE_SOURCE_MAPS = process.env.CLI_BUILD_MODE!=='release';

/**
 * Clean all generated folder
 * @returns 
 */
function cleanDirs(){
    return rimraf(['build', 'publish']);
}

 /**
  * Compile typescript files
  * */ 
const compileTs = async ()=>{
  await esbuild.build({
    entryPoints: ["./src/**/*.ts"],
    bundle:true,
    outdir:"build",
    platform: "node",
    format: "esm",
    preserveSymlinks: false, // Follow symlinks and bundle workspace packages
    absWorkingDir: process.cwd(), // Set working directory for resolution
    nodePaths: ["../../node_modules"], // Help find workspace packages
    metafile: true,
    minify: false,
    treeShaking: true,
    external: ["stylelint", "postcss", "postcss-selector-parser", "@salesforce-ux/sds-metadata"], // External deps for stylelint plugin but bundle slds-shared-utils and postcss-value-parser
    sourcemap: ENABLE_SOURCE_MAPS,
    plugins:[esbuildPluginFilePathExtensions({
      esmExtension:"js"
    })]
  })
};

/**
  * ESBuild bydefault won't generate definition file. There are multiple ways 
  * to generate definition files. But we are reliying on tsc for now
  * */ 
// const generateDefinitions = task('tsc --project tsconfig.json --emitDeclarationOnly');

export const build = series(cleanDirs, compileTs); // Skip TypeScript declarations for now due to path resolution issues

const watchChanges = ()=>{
  watch(["./src/**/*.ts"], function(cb) {
    build();
    cb();
  });
}

export const dev = series(build, watchChanges)  

export default task('gulp --tasks');