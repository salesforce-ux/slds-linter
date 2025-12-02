import * as esbuild from 'esbuild';
import { series } from 'gulp';
import { rimraf } from 'rimraf';
import { task } from "gulp-execa";
import pkg from "./package.json" with {type:"json"};
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';
import { parse } from 'yaml';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * esbuild plugin to handle YAML imports
 * Generates a shared config file and rewrites imports to reference it
 */
const yamlPlugin = {
  name: 'yaml',
  setup(build) {
    let configGenerated = false;
    
    build.onResolve({ filter: /\.ya?ml$/ }, args => {
      const originalPath = resolve(dirname(args.importer), args.path);
      
      // Generate shared config file once
      if (!configGenerated) {
        mkdirSync('./build/config', { recursive: true });
        writeFileSync('./build/config/rule-messages.js',
          `module.exports = ${JSON.stringify(parse(readFileSync(originalPath, 'utf8')), null, 2)};\n`);
        configGenerated = true;
      }
      
      // Calculate relative path from importer to config/rule-messages.js
      const match = args.importer.match(/\/src\/(.*)\/[^/]+\.ts$/);
      const depth = match ? match[1].split('/').length : 0;
      
      return {
        path: (depth ? '../'.repeat(depth) : './') + 'config/rule-messages.js',
        external: true
      };
    });
  },
};

function cleanDirs(){
    return rimraf(['build']);
}

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
          },
          {
            search: /import\s+ruleConfigs\s+from\s+['"]\.\.\/eslint\.rules\.json['"]/g,
            replace: "import ruleConfigs from '../eslint.rules.internal.json'"
          }
        ]
      })
    );
  }
  
  // Mark non-YAML imports as external
  const externalPlugin = {
    name: 'external',
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (!args.importer) return null;
        if (args.path.match(/\.ya?ml$/)) return null; // Let yamlPlugin handle
        return { path: args.path, external: true };
      });
    },
  };
  
  plugins.push(externalPlugin);
  
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
