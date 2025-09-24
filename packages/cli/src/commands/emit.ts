import { Command } from "commander";
import chalk from "chalk";
import { CliOptions } from "../types";
import { Logger } from "../utils/logger";
import { normalizeCliOptions } from '../utils/config-utils';
import {
  DEFAULT_ESLINT_CONFIG_PATH,
} from "../services/config.resolver";
import path from "path";
import { copyFile } from 'fs/promises';

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

        const destESLintConfigPath = path.join(
          normalizedOptions.directory,
          path.basename(normalizedOptions.configEslint)
        );
        await copyFile(normalizedOptions.configEslint, destESLintConfigPath);
        Logger.success(chalk.green(`ESLint configuration created at:\n${destESLintConfigPath}\n`));
      } catch (error: any) {
        Logger.error(
          chalk.red(`Failed to emit configuration: ${error.message}`)
        );
        process.exit(1);
      }
    });
}
