import * as esbuild from 'esbuild';
import { series } from 'gulp';
import { rimraf } from 'rimraf';
import { task } from "gulp-execa";
import pkg from "./package.json" with {type:"json"};
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';
import { parse } from 'yaml';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';

const ENABLE_SOURCE_MAPS = process.env.CLI_BUILD_MODE !== 'release';

function cleanDirs(){
    return rimraf(['build']);
}

/**
 * Generate rule-messages.js from YAML (single source of truth)
 */
const generateConfigFiles = async () => {
  const yamlData = parse(readFileSync('./src/config/rule-messages.yml', 'utf8'));
  mkdirSync('./build/config', { recursive: true });
  writeFileSync('./build/config/rule-messages.js', 
    `module.exports = ${JSON.stringify(yamlData, null, 2)};\n`);
};

const compileTs = async () => {
  const isInternal = process.env.TARGET_PERSONA === 'internal';
  const plugins = [];
  
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
  
  // Rewrite YAML imports to generated config file
  const yamlRewritePlugin = {
    name: 'yaml-rewrite',
    setup(build) {
      build.onResolve({ filter: /rule-messages\.ya?ml$/ }, args => {
        const match = args.importer.match(/\/src\/(.*)\/[^/]+\.ts$/);
        const depth = match ? match[1].split('/').length : 0;
        return { path: (depth ? '../'.repeat(depth) : './') + 'config/rule-messages.js', external: true };
      });
    },
  };
  
  // Mark non-YAML imports as external
  const externalPlugin = {
    name: 'external',
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (!args.importer) return null;
        if (args.path.match(/\.ya?ml$/)) return null; // Let yamlRewritePlugin handle
        return { path: args.path, external: true };
      });
    },
  };
  
  plugins.push(yamlRewritePlugin, externalPlugin);
  
  await esbuild.build({
    entryPoints: ["./src/**/*.ts"],
    bundle: true,
    outdir: "build",
    outbase: "src",
    platform: "node",
    format: "cjs",
    packages: 'external',
    sourcemap: ENABLE_SOURCE_MAPS,
    define: {
      'process.env.PLUGIN_VERSION': `"${pkg.version}"`
    },
    plugins
  });
};

const generateDefinitions = task('tsc --project tsconfig.json');

export const build = series(cleanDirs, generateConfigFiles, compileTs, generateDefinitions);

export default task('gulp --tasks');
