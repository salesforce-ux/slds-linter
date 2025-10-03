import { Command } from "commander";
import chalk from "chalk";
import { CliOptions } from "../types";
import { Logger } from "../utils/logger";
import { normalizeCliOptions } from '../utils/config-utils';
import {
  DEFAULT_ESLINT_CONFIG_PATH,
} from "../services/config.resolver";
import path from "path";
import { writeFile, readFile } from 'fs/promises';

/**
 * Load rules from ESLint plugin based on extends config
 */
async function loadRuleConfigs(extendsConfig: string) {
  try {
    const sldsPlugin = await import('@salesforce-ux/eslint-plugin-slds');
    const plugin = sldsPlugin.default || sldsPlugin;
    const pluginWithConfigs = plugin as any;
    
    if (extendsConfig.includes('recommended')) {
      const configToExtract = pluginWithConfigs.configs?.['flat/recommended'] || pluginWithConfigs.configs?.['recommended'];
      
      if (Array.isArray(configToExtract)) {
        let allRules = {};
        configToExtract.forEach((config: any) => {
          if (config.rules) Object.assign(allRules, config.rules);
        });
        return Object.keys(allRules).length > 0 ? allRules : null;
      } else if (configToExtract?.rules) {
        return configToExtract.rules;
      }
    }
  } catch (error) {
    // Silently fail
  }
  return null;
}

/**
 * Generate enhanced ESLint config with dynamic rules injection
 */
async function generateEnhancedESLintConfig(sourceConfigPath: string): Promise<string> {
  const config = await readFile(sourceConfigPath, 'utf8');
  const extendsMatch = config.match(/extends:\s*\[(.*?)\]/s);
  const rules = extendsMatch ? await loadRuleConfigs(extendsMatch[1]) : null;
  
  return rules 
    ? config.replace(
        /(extends:\s*\[.*?\])/s,
        `$1,\n    rules: ${JSON.stringify(rules, null, 6).replace(/\n/g, '\n    ')}`
      )
    : config;
}

export function registerEmitCommand(program: Command): void {
  program
    .command("emit")
    .description("Emits the configuration files used by slds-linter cli")
    .option(
      "-d, --directory <path>",
      "Target directory to emit (defaults to current directory). Support glob patterns"
    )
    .action(async (options: CliOptions) => {
      try {
        Logger.info(chalk.blue("Emitting configuration files..."));
        const normalizedOptions = normalizeCliOptions(options, {
          configEslint: DEFAULT_ESLINT_CONFIG_PATH,
        });

        const enhancedConfig = await generateEnhancedESLintConfig(normalizedOptions.configEslint);
        const destESLintConfigPath = path.join(normalizedOptions.directory, path.basename(normalizedOptions.configEslint));
        
        await writeFile(destESLintConfigPath, enhancedConfig, 'utf8');
        
        Logger.success(chalk.green(`ESLint configuration created at:\n${destPath}\n`));
        Logger.info(chalk.cyan("Rules are dynamically loaded based on extends configuration."));
      } catch (error: any) {
        Logger.error(
          chalk.red(`Failed to emit configuration: ${error.message}`)
        );
        process.exit(1);
      }
    });
}
