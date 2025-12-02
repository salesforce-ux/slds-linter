import * as esbuild from 'esbuild';
import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions";
import { series, watch } from 'gulp';
import { task } from "gulp-execa";
import { rimraf } from 'rimraf';
import eslintPackage from "eslint/package.json" with {type:"json"};
import pkg from "./package.json" with {type:"json"};
import { parse } from 'yaml';
import { readFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const ENABLE_SOURCE_MAPS = process.env.CLI_BUILD_MODE!=='release';

/**
 * esbuild plugin to handle YAML imports
 * Security: Uses basename to avoid exposing absolute file paths in build output
 */
const yamlPlugin = {
  name: 'yaml',
  setup(build) {
    build.onResolve({ filter: /\.ya?ml$/ }, args => {
      // Handle package imports vs relative imports
      const resolvedPath = args.path.startsWith('.') 
        ? resolve(dirname(args.importer), args.path)
        : require.resolve(args.path, { paths: [dirname(args.importer)] });
      
      return {
        // Use basename to prevent exposing absolute paths in build output
        path: basename(resolvedPath),
        namespace: 'yaml-file',
        external: false,  // Mark as internal to bundle into output
        // Store absolute path in pluginData for onLoad
        pluginData: { absolutePath: resolvedPath }
      };
    });
    build.onLoad({ filter: /.*/, namespace: 'yaml-file' }, args => ({
      // Load YAML from the absolute path stored in pluginData
      contents: `export default ${JSON.stringify(parse(readFileSync(args.pluginData.absolutePath, 'utf8')), null, 2)};`,
      loader: 'js',
    }));
  },
};

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
      'process.env.ESLINT_VERSION': `"${eslintPackage.version}"`,
      'process.env.CLI_VERSION': `"${pkg.version}"`,
      'process.env.CLI_DESCRIPTION': `"${pkg.description}"`
    },
    plugins:[
      yamlPlugin,
      esbuildPluginFilePathExtensions({
        esmExtension:"js"
      })
    ]
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