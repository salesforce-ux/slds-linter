import { Command, Option } from 'commander';
import chalk from 'chalk';
import { CliOptions } from '../types';
import { printLintResults } from '../utils/lintResultsUtil';
import { normalizeCliOptions, normalizeDirectoryPath } from '../utils/config-utils';
import { Logger } from '../utils/logger';
import { FileScanner } from '../services/file-scanner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { LintRunner } from '../services/lint-runner';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH } from '../services/config.resolver';

export function registerLintCommand(program: Command): void {
  program
    .command('lint')
    .aliases(['lint:styles', 'lint:components'])
    .configureHelp({
      commandUsage: ()=>{
        return `${program.name()} lint [directory] [options]`
      }
    })
    .description('Run both style and component linting')
    .argument('[directory]', 'Target directory to scan (defaults to current directory). Support glob patterns')
    .addOption(new Option('-d, --directory <path>', 'Target directory to scan (defaults to current directory). Support glob patterns').hideHelp())
    .option('--fix', 'Automatically fix problems')
    .option('--config-stylelint <path>', 'Path to stylelint config file')
    .option('--config-eslint <path>', 'Path to eslint config file')
    .option('--editor <editor>', 'Editor to open files with (e.g., vscode, atom, sublime). Defaults to vscode', 'vscode')
    .action(async (directory:string, options: CliOptions) => {
      const startTime = Date.now();
      try {
        Logger.info(chalk.blue('Starting lint process...'));
        const normalizedOptions = normalizeCliOptions(options, {
          configStylelint: DEFAULT_STYLELINT_CONFIG_PATH,
          configEslint: DEFAULT_ESLINT_CONFIG_PATH
        });

        if(directory){ // If argument is passed, ignore -d, --directory option
          normalizedOptions.directory = normalizeDirectoryPath(directory);
        } else if(options.directory){
          // If  -d, --directory option is passed, prompt deprecation warning
          Logger.newLine().warning(chalk.yellow(
            `WARNING: --directory, -d option is deprecated. Supply as argument instead.
            Example: npx @salesforce-ux/slds-linter lint ${options.directory}`
          ))
        }

        // 1) STYLE LINT
        Logger.newLine().info(chalk.blue('Scanning style files...'));
        const styleFileBatches = await FileScanner.scanFiles(normalizedOptions.directory, {
          patterns: StyleFilePatterns,
          batchSize: 100,
        });
        const totalStyleFiles = styleFileBatches.reduce((sum, batch) => sum + batch.length, 0);
        Logger.info(chalk.blue(`Found ${totalStyleFiles} style file(s). Running stylelint...`));

        Logger.newLine().info(chalk.blue(`Running stylelint${normalizedOptions.fix?' with autofix':''}...`));
        const styleResults = await LintRunner.runLinting(styleFileBatches, 'style', {
          fix: normalizedOptions.fix,
          configPath: normalizedOptions.configStylelint,
        });

        // Print detailed lint results only for files with issues
        printLintResults(styleResults, normalizedOptions.editor);

        const styleErrorCount = styleResults.reduce((sum, r) => sum + r.errors.length, 0);
        const styleWarningCount = styleResults.reduce((sum, r) => sum + r.warnings.length, 0);

        // 2) COMPONENT LINT
        Logger.newLine().info(chalk.blue('Scanning component files...'));
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
        Logger.success(chalk.green(`\nLinting completed in ${elapsedTime} seconds.`));
        process.exit(totalErrors > 0 ? 1 : 0);
      } catch (error: any) {
        Logger.error(chalk.red(`Failed to complete linting: ${error.message}`));
        process.exit(1);
      }
    });
}
