import * as esbuild from 'esbuild';
import { series, watch } from 'gulp';
import { task } from "gulp-execa";
import { rimraf } from 'rimraf';
import { bundleSldsSharedUtilsPlugin } from '../../scripts/shared-plugin/esbuild-plugins.mjs';
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';

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
  const plugins = [bundleSldsSharedUtilsPlugin];

  const isInternal = process.env.TARGET_PERSONA === 'internal';
  
  if (isInternal) {
    plugins.unshift(
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
    bundle:true,
    outdir:"build",
    platform: "node",
    format:"esm",
    packages:'external',
    sourcemap:ENABLE_SOURCE_MAPS,
    plugins
  })

  //use esbuild to generate .stylelintrc.mjs from stylelint.config.mjs
  // out file name should be .stylelintrc.mjs
  await esbuild.build({
    entryPoints: ["./stylelint.config.mjs"],
    bundle:true,
    outfile:".stylelintrc.mjs",
    platform: "node",
    format:"esm",
    packages:'external',
    plugins: isInternal ? [
      conditionalReplacePlugin({
        filter: /\.mjs$/,
        replacements: [
          {
            search: /import\s+rules\s+from\s+['"]\.\/stylelint\.rules\.json['"]/g,
            replace: "import rules from './stylelint.rules.internal.json'"
          }
        ]
      })
    ] : []
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