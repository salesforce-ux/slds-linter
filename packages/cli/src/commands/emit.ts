import { Command } from "commander";
import { CliOptions } from "../types";
import { Logger } from "../utils/logger";
import { Colors } from "../utils/colors";
import { normalizeCliOptions } from '../utils/config-utils';
import { EMIT_ESLINT_CONFIG_PATH } from "../services/config.resolver";
import path from "path";
import { constants } from 'fs';
import { copyFile, readFile, rename, rm, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds';
import type { Linter } from 'eslint';

type RuleConfigs = Linter.RulesRecord;

/**
 * Merge the rule records from every entry in an ESLint plugin preset.
 */
function extractRulesFromConfig(configToExtract: any): RuleConfigs | null {
  configToExtract = Array.isArray(configToExtract) ? configToExtract : [configToExtract];
  const allRules: RuleConfigs = {};
  configToExtract.forEach((config: any) => {
    if (config.rules) Object.assign(allRules, config.rules);
  });
  return Object.keys(allRules).length > 0 ? allRules : null;
}

/**
 * Read the rules enabled by a named plugin configuration.
 */
function loadRuleConfigs(plugin: any, pluginName: string, configName: string): RuleConfigs {
  try {
    const configToExtract = plugin.configs?.[configName];
    const rules = extractRulesFromConfig(configToExtract);
    if (!rules) {
      throw new Error(`Configuration "${configName}" is missing or has no rules.`);
    }
    return rules;
  } catch (error) {
    throw new Error(`Failed to load ${pluginName} configuration "${configName}".`, { cause: error });
  }
}

/**
 * Serialize rule settings as readable JavaScript for the emitted config.
 */
function formatRulesForConfig(rules: RuleConfigs): string {
  return JSON.stringify(rules, null, 4).replace(/\n/g, '\n    ');
}

/**
 * Add editable SLDS rules and React support to the packaged config.
 */
async function generateEnhancedESLintConfig(sourceConfigPath: string): Promise<string> {
  const config = await readFile(sourceConfigPath, 'utf8');
  const { default: reactSldsPlugin } = await import('@salesforce-ux/eslint-plugin-react-slds');
  const rules = loadRuleConfigs(sldsPlugin, '@salesforce-ux/eslint-plugin-slds', 'flat/recommended');
  const reactRules = loadRuleConfigs(reactSldsPlugin, '@salesforce-ux/eslint-plugin-react-slds', 'recommended');
  const reactRuleOverride = `
  {
    files: ["**/*.{jsx,tsx}"],
    rules: ${formatRulesForConfig(reactRules)}
  },`;

  const enhancedConfig = config
    .replace(
      'import { sldsCssPlugin } from "@salesforce-ux/eslint-plugin-slds";',
      'import { sldsCssPlugin } from "@salesforce-ux/eslint-plugin-slds";\n' +
        'import reactSldsPlugin from "@salesforce-ux/eslint-plugin-react-slds";'
    )
    .replace(
      '    extends: ["@salesforce-ux/slds/flat/recommended"]',
      '    ignores: ["**/*.{jsx,tsx}"],\n' +
        '    extends: ["@salesforce-ux/slds/flat/recommended"],\n' +
        `    rules: ${formatRulesForConfig(rules)}`
    )
    .replace(
      /\n\]\);\s*$/,
      `\n  ...reactSldsPlugin.configs.recommended,${reactRuleOverride}\n]);\n`
    );

  if (
    enhancedConfig === config ||
    !enhancedConfig.includes('import reactSldsPlugin') ||
    !enhancedConfig.includes('...reactSldsPlugin.configs.recommended') ||
    !enhancedConfig.includes('ignores: ["**/*.{jsx,tsx}"]')
  ) {
    throw new Error('Failed to enhance the packaged ESLint configuration.');
  }

  return enhancedConfig;
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
        Logger.info("Emitting configuration files...");
        const normalizedOptions = normalizeCliOptions(options, {
          configEslint: EMIT_ESLINT_CONFIG_PATH,
        });

        const destESLintConfigPath = path.join(normalizedOptions.directory, 'eslint.config.mjs');
        const backupESLintConfigPath = path.join(normalizedOptions.directory, 'eslint.config.backup.mjs');
        const tempESLintConfigPath = path.join(
          normalizedOptions.directory,
          `.eslint.config.mjs.${randomUUID()}.tmp`
        );
        const enhancedConfig = await generateEnhancedESLintConfig(EMIT_ESLINT_CONFIG_PATH);
        let tempWritten = false;

        try {
          await writeFile(tempESLintConfigPath, enhancedConfig, {
            encoding: 'utf8',
            flag: 'wx',
            mode: 0o600,
          });
          tempWritten = true;

          try {
            await copyFile(destESLintConfigPath, backupESLintConfigPath, constants.COPYFILE_EXCL);
            Logger.info(`Existing ESLint configuration backed up at:\n${backupESLintConfigPath}\n`);
          } catch (error: any) {
            if (error?.code !== 'ENOENT') throw error;
          }

          await rename(tempESLintConfigPath, destESLintConfigPath);
          tempWritten = false;
        } catch (error) {
          if (tempWritten) {
            try {
              await rm(tempESLintConfigPath, { force: true });
            } catch {
              // Preserve the primary emission error.
            }
          }
          throw error;
        }
        
        Logger.success(Colors.success(`ESLint configuration created at:\n${destESLintConfigPath}\n`));
        Logger.info("Rules are dynamically loaded based on extends configuration.");
      } catch (error: any) {
        Logger.error(
          Colors.error(`Failed to emit configuration: ${error.message}`)
        );
        process.exit(1);
      }
    });
}
