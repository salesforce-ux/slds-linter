import path from 'path';
import rules from './stylelint.rules.json';

async function getPlugin() {
  try {
    return await import('@salesforce-ux/stylelint-plugin-slds/build/index.js');
  } catch (err) {
    try {
      const nodeExecutablePath = process.env._;
      if (nodeExecutablePath && nodeExecutablePath.endsWith('slds-linter')) {
        const nodeModulesPath = path.join(nodeExecutablePath, '../..');
        const cliPath = path.join(nodeModulesPath, '@salesforce-ux', 'stylelint-plugin-slds', 'build', 'index.js');
        return await import(`file://${cliPath}`);
      } else {
        throw new Error('process.env._ does not point to slds-linter executable');
      }    
    } catch (err) {
      console.error('Error loading sldsPlugin:', err);
      process.exit(1);
    }
  }  
}

const sldsPlugin = await getPlugin();

/** @type {import('stylelint').Config} */
export default {
  plugins: [sldsPlugin],
  rules: {},
  overrides: [
    {
      files: ["**/*.css", "**/*.scss"],
      customSyntax: "postcss",
      rules
    },
  ],
};