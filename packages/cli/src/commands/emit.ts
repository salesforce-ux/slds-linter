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
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds';

/**
 * Reusable rules extractor
 */
function extractRulesFromConfig(configToExtract: any): Record<string, string> | null {
  configToExtract = Array.isArray(configToExtract) ? configToExtract : [configToExtract];
  const allRules = {};
  configToExtract.forEach((config: any) => {
    if (config.rules) Object.assign(allRules, config.rules);
  });
  return Object.keys(allRules).length > 0 ? allRules : null;
}

/**
 * Load rules from ESLint plugin for "@salesforce-ux/slds/recommended" config
 */
async function loadRuleConfigs() {
  try {
    const plugin = sldsPlugin as any;
    const configToExtract = plugin.configs?.['flat/recommended'] || plugin.configs?.['recommended'];
    return extractRulesFromConfig(configToExtract);
  } catch (error) {
    return null;
  }
}

/**
 * Reusable config formatter utility
 */
function formatRulesForConfig(rules: Record<string, string>): string {
  return JSON.stringify(rules, null, 4).replace(/\n/g, '\n    ');
}

/**
 * Generate enhanced ESLint config targeted for eslint.config.mjs structure
 */
async function generateEnhancedESLintConfig(sourceConfigPath: string): Promise<string> {
  const config = await readFile(sourceConfigPath, 'utf8');
  const rules = await loadRuleConfigs();
  
  if (rules) {
    const formattedRules = formatRulesForConfig(rules);
    return config.replace(
      /extends:\s*\["@salesforce-ux\/slds\/recommended"\]/,
      `extends: ["@salesforce-ux/slds/recommended"],
    rules: ${formattedRules}`
    );
  }
  
  return config;
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
        
        Logger.success(chalk.green(`ESLint configuration created at:\n${destESLintConfigPath}\n`));
        Logger.info(chalk.cyan("Rules are dynamically loaded based on extends configuration."));
      } catch (error: any) {
        Logger.error(
          chalk.red(`Failed to emit configuration: ${error.message}`)
        );
        process.exit(1);
      }
    });
}
