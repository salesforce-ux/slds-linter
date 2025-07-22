import * as esbuild from 'esbuild';
import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions";
import { series, watch } from 'gulp';
import { task } from "gulp-execa";
import { rimraf } from 'rimraf';
import { bundleSldsSharedUtilsPlugin } from '../../scripts/shared-plugin/esbuild-plugins.mjs';

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
  const plugins = [
    bundleSldsSharedUtilsPlugin,
    esbuildPluginFilePathExtensions({
      esmExtension:"js"
    })
  ];

  await esbuild.build({
    entryPoints: ["./src/**/*.ts"],
    bundle:true,
    outdir:"build",
    platform: "node",
    format: "esm",
    packages: 'external', // Externalize all node_modules by default
    sourcemap: ENABLE_SOURCE_MAPS,
    plugins // Apply our custom bundling plugin
  })
};

/**
  * ESBuild bydefault won't generate definition file. There are multiple ways 
  * to generate definition files. But we are reliying on tsc for now
  * */ 
const generateDefinitions = task('tsc --project tsconfig.json --emitDeclarationOnly');

export const build = series(cleanDirs, compileTs, generateDefinitions);

const watchChanges = ()=>{
  watch(["./src/**/*.ts"], function(cb) {
    build();
    cb();
  });
}

export const dev = series(build, watchChanges)  

export default task('gulp --tasks');