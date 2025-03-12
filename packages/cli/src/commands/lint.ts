import { Command } from 'commander';
import chalk from 'chalk';
import { CliOptions } from '../types';
import { Logger } from '../utils/logger';
import { normalizeCliOptions } from '../utils/cli-args';
import { printLintResults } from '../utils/lintResultsUtil';
import { FileScanner } from '../services/file-scanner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { LintRunner } from '../services/lint-runner';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH } from '../services/config.resolver';
import { loadPersonaConfig } from '../services/config-loader';
import { loadStoredPersona } from '../services/persona-loader';

export function registerLintCommand(program: Command): void {
  program
    .command('lint')
    .description('Run both style and component linting')
    .option('-d, --directory <path>', 'Target directory to scan (defaults to current directory)')
    .option('--fix', 'Automatically fix problems')
    .option('--config-style <path>', 'Path to stylelint config file')
    .option('--config-eslint <path>', 'Path to eslint config file')
    // .option('--persona <persona>', 'Specify a persona for linting rules')
    .option('--editor <editor>', 'Editor to open files with (e.g., vscode, atom, sublime). Defaults to vscode', 'vscode')
    .action(async (options: CliOptions) => {
      const startTime = Date.now();
      try {
        Logger.info(chalk.blue('🔹 Starting lint process...'));

        const normalizedOptions = normalizeCliOptions(options, {
          configStyle: DEFAULT_STYLELINT_CONFIG_PATH,
          configEslint: DEFAULT_ESLINT_CONFIG_PATH
        });

        // ✅ Load persona-based config
        // let personaConfig;
        // if (normalizedOptions.persona) {
        //   Logger.info(chalk.blue(`🔹 Applying persona-based linting for: ${options.persona}`));
        //   personaConfig = loadPersonaConfig(options.persona);
        // }

        const persona = loadStoredPersona();
        Logger.info(`🔹 Using persona: ${persona}`);
        const personaConfig = loadPersonaConfig(persona);

        // 1) STYLE LINT
        Logger.info(chalk.blue('\nScanning style files...'));
        const styleFileBatches = await FileScanner.scanFiles(normalizedOptions.directory, {
          patterns: StyleFilePatterns,
          batchSize: 100,
        });
        const totalStyleFiles = styleFileBatches.reduce((sum, batch) => sum + batch.length, 0);
        Logger.info(chalk.blue(`Found ${totalStyleFiles} style file(s). Running stylelint...\n`));

        Logger.info(chalk.blue(`Running stylelint${normalizedOptions.fix?' with autofix':''}...`));
        const styleResults = await LintRunner.runLinting(styleFileBatches, 'style', {
          fix: normalizedOptions.fix,
          configPath: normalizedOptions.configStyle,
          config: personaConfig.styleConfig
        });

        // Print detailed lint results only for files with issues
        printLintResults(styleResults, normalizedOptions.editor);

        const styleErrorCount = styleResults.reduce((sum, r) => sum + r.errors.length, 0);
        const styleWarningCount = styleResults.reduce((sum, r) => sum + r.warnings.length, 0);

        // ✅ Run ESLint
        Logger.info(chalk.blue('\nScanning component files...'));
        const componentFileBatches = await FileScanner.scanFiles(normalizedOptions.directory, {
          patterns: ComponentFilePatterns,
          batchSize: 100,
        });
        const totalComponentFiles = componentFileBatches.reduce((sum, batch) => sum + batch.length, 0);
        Logger.info(chalk.blue(`Found ${totalComponentFiles} component file(s). Running eslint...\n`));

        Logger.info(chalk.blue(`Running linting${normalizedOptions.fix?' with autofix':''}...`));
        const componentResults = await LintRunner.runLinting(componentFileBatches, 'component', {
          fix: normalizedOptions.fix,
          configPath: normalizedOptions.configEslint,
          config: personaConfig.eslintConfig
        });

        // Print component lint issues (only for files with issues)
        printLintResults(componentResults, normalizedOptions.editor);

        const componentErrorCount = componentResults.reduce((sum, r) => sum + r.errors.length, 0);
        const componentWarningCount = componentResults.reduce((sum, r) => sum + r.warnings.length, 0);

        // Final summary
        const totalErrors = styleErrorCount + componentErrorCount;
        const totalWarnings = styleWarningCount + componentWarningCount;
        Logger.info(
          `\n${chalk.red(`${totalErrors} error${totalErrors !== 1 ? 's' : ''}`)}` +
          `  ${chalk.yellow(`${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''}`)}`
        );
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        Logger.success(chalk.green(`\nFull linting completed in ${elapsedTime} seconds.`));
        process.exit(totalErrors > 0 ? 1 : 0);
      } catch (error: any) {
        Logger.error(chalk.red(`❌ Failed to complete linting: ${error.message}`));
        process.exit(1);
      }
    });
}
