import * as esbuild from 'esbuild';
import { series } from 'gulp';
import { rimraf } from 'rimraf';
import { task } from "gulp-execa";
import pkg from "./package.json" with {type:"json"};
import { conditionalReplacePlugin } from 'esbuild-plugin-conditional-replace';
import { parse } from 'yaml';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { createRequire } from 'module';
import { globby } from 'globby';

const require = createRequire(import.meta.url);

const ENABLE_SOURCE_MAPS = process.env.CLI_BUILD_MODE !== 'release';

/**
 * esbuild plugin to handle YAML imports - inlines YAML content into each file
 * With bundle: false, this creates a virtual module that gets inlined at each import site
 */
const yamlPlugin = {
  name: 'yaml',
  setup(build) {
    build.onResolve({ filter: /\.ya?ml$/ }, args => {
      // Resolve the absolute path to the YAML file
      const resolvedPath = args.path.startsWith('.') 
        ? resolve(dirname(args.importer), args.path)
        : require.resolve(args.path, { paths: [dirname(args.importer)] });
      
      return {
        path: resolvedPath,
        namespace: 'yaml-inline',
      };
    });
    
    build.onLoad({ filter: /.*/, namespace: 'yaml-inline' }, args => {
      // Load and parse YAML, return as inline JS module
      const yamlContent = readFileSync(args.path, 'utf8');
      const yamlData = parse(yamlContent);
      
      return {
        contents: `export default ${JSON.stringify(yamlData, null, 2)};`,
        loader: 'js',
      };
    });
  },
};

/**
 * Clean all generated folder
 * @returns
 */
function cleanDirs(){
    return rimraf(['build']);
}

 /**
  * Compile typescript files - generates individual JS files with YAML inlined
  * */
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
  
  // Plugin to mark non-YAML imports as external (don't bundle them)
  const externalPlugin = {
    name: 'external',
    setup(build) {
      // Mark all non-entry-point imports as external except YAML files
      build.onResolve({ filter: /.*/ }, args => {
        // Skip if it's an entry point (no importer)
        if (!args.importer) {
          return null;
        }
        
        // Let yamlPlugin handle YAML files
        if (args.path.match(/\.ya?ml$/)) {
          return null;
        }
        
        // Mark everything else as external
        return { path: args.path, external: true };
      });
    },
  };
  
  plugins.push(externalPlugin);
  
  // Get all TypeScript files to compile individually
  const entryPoints = await globby(['./src/**/*.ts']);
  
  await esbuild.build({
    entryPoints,
    bundle: true,  // Bundle to inline YAML, but externalize everything else
    outdir: "build",
    outbase: "src",
    platform: "node",
    format: "cjs",
    sourcemap: ENABLE_SOURCE_MAPS,
    define: {
      'process.env.PLUGIN_VERSION': `"${pkg.version}"`
    },
    plugins
  });
};

/**
 * ESBuild by default won't generate definition file. There are multiple ways 
 * to generate definition files. But we are relying on tsc for now
 */
const generateDefinitions = task('tsc --project tsconfig.json');

export const build = series(cleanDirs, compileTs, generateDefinitions);

export default task('gulp --tasks');