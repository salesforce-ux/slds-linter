import * as esbuild from 'esbuild';
import { series, watch } from 'gulp';
import { rimraf } from 'rimraf';
import { task } from "gulp-execa";
import pkg from "./package.json" with {type:"json"};
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';

/**
 * esbuild plugin to externalize local imports
 */
const externalPlugin = {
  name: 'external',
  setup(build) {
    build.onResolve({ filter: /.*/ }, args => {
      if (!args.importer) return null; // Entry points
      if (args.path.match(/\.ya?ml$/)) return null; // Let yamlPlugin handle
      return { path: args.path, external: true };
    });
  },
};

function cleanDirs(){
    return rimraf(['build']);
}

const compileTs = async () => {
  const plugins = [];

  if (process.env.TARGET_PERSONA === 'internal') {
    plugins.push(conditionalReplacePlugin({
      filter: /\.ts$/,
      replacements: [{
        search: /import\s+ruleConfigs\s+from\s+['"]\.\.\/eslint\.rules\.json['"]/g,
        replace: "import ruleConfigs from '../eslint.rules.internal.json'"
      }]
    }));
  }

  await esbuild.build({
    entryPoints: ["./src/index.ts"],
    bundle: true,
    outdir: "build",
    outbase: "src",
    platform: "node",
    format: "esm",
    outExtension: { '.js': '.mjs' },
    packages: 'external',
    sourcemap: process.env.NODE_ENV !== 'production',
    define: {
      'process.env.PLUGIN_VERSION': `"${pkg.version}"`
    },
    plugins
  });
};

const generateDefinitions = task('tsc --project tsconfig.json');

export const build = series(cleanDirs, compileTs, generateDefinitions);

const watchChanges = ()=>{
  watch(["./src/**/*.ts"], build);
}

export const dev = series(build, watchChanges)

export default task('gulp --tasks');
