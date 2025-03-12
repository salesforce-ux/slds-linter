import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { CliOptions } from '../types';
import { printLintResults } from '../utils/lintResultsUtil';
import { getEditorLink, createClickableLineCol } from '../utils/editorLinkUtil';
import { normalizeCliOptions } from '../utils/cli-args';
import { Logger } from '../utils/logger';
import { FileScanner } from '../services/file-scanner';
import { StyleFilePatterns } from '../services/file-patterns';
import { LintRunner } from '../services/lint-runner';
import { DEFAULT_STYLELINT_CONFIG_PATH } from '../services/config.resolver';
import { loadPersonaConfig } from '../services/config-loader';
import { loadStoredPersona } from '../services/persona-loader';

export function registerLintStylesCommand(program: Command): void {
  program
    .command('lint:styles')
    .description('Run stylelint on all style files')
    .option('-d, --directory <path>', 'Target directory to scan (defaults to current directory)')
    .option('--fix', 'Automatically fix problems')
    .option('--config <path>', 'Path to stylelint config file')
    .option('--editor <editor>', 'Editor to open files with (vscode, atom, sublime). Defaults to vscode', 'vscode')
    .action(async (options: CliOptions) => {
      const startTime = Date.now();
      try {
        Logger.info(chalk.blue('Starting linting of style files...'));
        const normalizedOptions = normalizeCliOptions(options, {
          config: DEFAULT_STYLELINT_CONFIG_PATH
        });

        Logger.info(chalk.blue('Scanning for style files...'));
        const fileBatches = await FileScanner.scanFiles(normalizedOptions.directory, {
          patterns: StyleFilePatterns,
          batchSize: 100,
        });
        const totalFiles = fileBatches.reduce((sum, batch) => sum + batch.length, 0);
        Logger.info(chalk.blue(`Scanned ${totalFiles} file(s).`));

        const persona = loadStoredPersona();
        Logger.info(`🔹 Using persona: ${persona}`);
        const personaConfig = loadPersonaConfig(persona);

        Logger.info(chalk.blue(`Running stylelint${normalizedOptions.fix?' with autofix':''}...`));
        const results = await LintRunner.runLinting(fileBatches, 'style', {
          fix: normalizedOptions.fix,
          configPath: normalizedOptions.config,
          config: personaConfig.styleConfig,
        });

        // Print detailed lint results only for files with issues
        printLintResults(results, normalizedOptions.editor);

        const errorCount = results.reduce((sum, r) => sum + r.errors.length, 0);
        const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);

        Logger.info(
          chalk.blue(
            `\nSummary: Processed ${totalFiles} file(s) with ${chalk.red(
              errorCount.toString()
            )} error(s) and ${chalk.yellow(warningCount.toString())} warning(s).`
          )
        );
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        Logger.success(chalk.green(`Style files linting completed in ${elapsedTime} seconds.`));
        process.exit(errorCount > 0 ? 1 : 0);
      } catch (error: any) {
        Logger.error(chalk.red(`Error during linting: ${error.message}`));
        process.exit(1);
      }
    });
}
