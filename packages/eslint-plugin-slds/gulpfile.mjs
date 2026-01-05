import * as esbuild from 'esbuild';
import { series } from 'gulp';
import { rimraf } from 'rimraf';
import { task } from "gulp-execa";
import pkg from "./package.json" with {type:"json"};
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';
import { parse } from 'yaml';
import { readFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';

/**
 * esbuild plugin to handle YAML imports
 */
const yamlPlugin = {
  name: 'yaml',
  setup(build) {
    build.onResolve({ filter: /\.ya?ml$/ }, args => ({
      path: basename(resolve(dirname(args.importer), args.path)),
      namespace: 'yaml-file',
      external: false,
      pluginData: { originalPath: resolve(dirname(args.importer), args.path) }
    }));
    build.onLoad({ filter: /.*/, namespace: 'yaml-file' }, args => ({
      contents: `module.exports = ${JSON.stringify(parse(readFileSync(args.pluginData.originalPath, 'utf8')), null, 2)};`,
      loader: 'js',
    }));
  },
};

/**
 * esbuild plugin to handle config JSON imports (eslint.rules*.json files)
 * This inlines the JSON content into the bundle instead of requiring external files
 */
const configJsonPlugin = {
  name: 'json-inline',
  setup(build) {
    // Only handle eslint.rules*.json files to avoid interfering with other JSON imports
    build.onResolve({ filter: /eslint\.rules.*\.json$/ }, args => ({
      path: basename(resolve(dirname(args.importer), args.path)),
      namespace: 'json-inline',
      external: false,  // Mark as internal to bundle into output
      pluginData: { originalPath: resolve(dirname(args.importer), args.path) }
    }));
    build.onLoad({ filter: /.*/, namespace: 'json-inline' }, args => ({
      contents: `module.exports = ${readFileSync(args.pluginData.originalPath, 'utf8')};`,
      loader: 'js',
    }));
  },
};

/**
 * esbuild plugin to externalize local imports
 */
const externalPlugin = {
  name: 'external',
  setup(build) {
    build.onResolve({ filter: /.*/ }, args => {
      if (!args.importer) return null; // Entry points
      if (args.path.match(/\.ya?ml$/)) return null; // Let yamlPlugin handle
      if (args.path.match(/eslint\.rules.*\.json$/)) return null; // Let configJsonPlugin handle
      return { path: args.path, external: true };
    });
  },
};

function cleanDirs(){
    return rimraf(['build']);
}

const compileTs = async () => {
  const isInternal = process.env.TARGET_PERSONA === 'internal';
  const plugins = [yamlPlugin, configJsonPlugin, externalPlugin];
  
  if (isInternal) {
    plugins.push(
      conditionalReplacePlugin({
        filter: /\.ts$/,
        replacements: [
          {
            search: /from\s+['"]@salesforce-ux\/sds-metadata['"]/g,
            replace: "from '@salesforce-ux/sds-metadata/next'"
          },
          {
            search: /import\s+ruleConfigs\s+from\s+['"]\.\.\/eslint\.rules\.json['"]/g,
            replace: "import ruleConfigs from '../eslint.rules.internal.json'"
          }
        ]
      })
    );
  }
  
  await esbuild.build({
    entryPoints: ["./src/**/*.ts"],
    bundle: true,
    outdir: "build",
    outbase: "src",
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

const generateDefinitions = task('tsc --project tsconfig.json');

export const build = series(cleanDirs, compileTs, generateDefinitions);

export default task('gulp --tasks');
