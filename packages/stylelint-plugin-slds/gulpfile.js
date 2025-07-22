import * as esbuild from 'esbuild';
import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions";
import { series, watch } from 'gulp';
import { task } from "gulp-execa";
import { rimraf } from 'rimraf';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
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
  }, esbuildPluginFilePathExtensions({
    esmExtension:"js"
  })];

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