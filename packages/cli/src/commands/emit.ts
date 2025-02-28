import { Command } from "commander";
import chalk from "chalk";
import { CliOptions } from "../types";
import { Logger } from "../utils/logger";
import { normalizeCliOptions } from "../utils/cli-args";
import {
  DEFAULT_ESLINT_CONFIG_PATH,
  DEFAULT_STYLELINT_CONFIG_PATH,
} from "../services/config.resolver";
import path from "path";
import { copyFile } from 'fs/promises';

export function registerEmitCommand(program: Command): void {
  program
    .command("emit")
    .description("Emits the configuration files used by slds-linter cli")
    .option(
      "-d, --directory <path>",
      "Target directory to emit (defaults to current directory)"
    )
    .action(async (options: CliOptions) => {
      try {
        Logger.info(chalk.blue("Emitting configuration files..."));
        const normalizedOptions = normalizeCliOptions(options, {
          configStyle: DEFAULT_STYLELINT_CONFIG_PATH,
          configEslint: DEFAULT_ESLINT_CONFIG_PATH,
        });

        const destStyleConfigPath = path.join(
          normalizedOptions.directory,
          path.basename(normalizedOptions.configStyle)
        );
        await copyFile(normalizedOptions.configStyle, destStyleConfigPath);
        Logger.success(chalk.green(`Stylelint configuration created at:\n${destStyleConfigPath}\n`));

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
