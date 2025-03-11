import * as esbuild from 'esbuild';
import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions";
import { series, watch } from 'gulp';
import { task } from "gulp-execa";
import { rimraf } from 'rimraf';
import stylelintPackage from "stylelint/package.json" with {type:"json"};
import eslintPackage from "eslint/package.json" with {type:"json"};
import pkg from "./package.json" with {type:"json"};

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
    format:"esm",
    packages:'external',
    sourcemap:ENABLE_SOURCE_MAPS,
    define:{
      'process.env.STYLELINT_VERSION': `"${stylelintPackage.version}"`,
      'process.env.ESLINT_VERSION': `"${eslintPackage.version}"`,
      'process.env.CLI_VERSION': `"${pkg.version}"`,
      'process.env.CLI_DESCRIPTION': `"${pkg.description}"`
    },
    plugins:[esbuildPluginFilePathExtensions({
      esmExtension:"js"
    })]
  })
};

/**
  * ESBuild bydefault won't generate definition file. There are multiple ways 
  * to generate definition files. But we are reliying on tsc for now
  * */ 
const generateDefinitions = task('tsc --project tsconfig.json');

export const build = series(cleanDirs, compileTs, generateDefinitions);

const watchChanges = ()=>{
  watch(["./src/**/*.ts"], function(cb) {
    build();
    cb();
  });
}

export const dev = series(build, watchChanges)  

export default task('gulp --tasks');