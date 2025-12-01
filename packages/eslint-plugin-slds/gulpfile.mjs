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
 * esbuild plugin to handle YAML imports
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
        path: resolvedPath,
        namespace: 'yaml-file',
        external: false  // Mark as internal to bundle into output
      };
    });
    build.onLoad({ filter: /.*/, namespace: 'yaml-file' }, args => ({
      contents: `module.exports = ${JSON.stringify(parse(readFileSync(args.path, 'utf8')), null, 2)};`,
      loader: 'js',
    }));
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
  * Compile typescript files - generates individual JS files (not bundled)
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
  
  // Get all TypeScript files to compile individually
  const entryPoints = await globby(['./src/**/*.ts']);
  
  await esbuild.build({
    entryPoints,
    bundle: false,  // Don't bundle - generate individual files
    outdir: "build",
    outbase: "src",  // Preserve directory structure
    platform: "node",
    format: "cjs",
    packages: 'external',
    sourcemap: ENABLE_SOURCE_MAPS,
    define: {
      'process.env.PLUGIN_VERSION': `"${pkg.version}"`
    },
    plugins
  });
  
  // Generate the YAML as a JS module in build/config/ without .js extension
  // so require("../config/rule-messages.yml") works
  const yamlContent = readFileSync('./src/config/rule-messages.yml', 'utf8');
  const yamlData = parse(yamlContent);
  const jsContent = `module.exports = ${JSON.stringify(yamlData, null, 2)};`;
  
  await import('fs/promises').then(fs => 
    fs.mkdir('./build/config', { recursive: true })
      .then(() => fs.writeFile('./build/config/rule-messages.yml', jsContent))
  );
};

/**
 * ESBuild by default won't generate definition file. There are multiple ways 
 * to generate definition files. But we are relying on tsc for now
 */
const generateDefinitions = task('tsc --project tsconfig.json');

export const build = series(cleanDirs, compileTs, generateDefinitions);

export default task('gulp --tasks');