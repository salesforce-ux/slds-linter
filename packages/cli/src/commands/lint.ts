import { Command, Option } from 'commander';
import chalk from 'chalk';
import { CliOptions } from '../types';
import { printLintResults } from '../utils/lintResultsUtil';
import { normalizeCliOptions, normalizeDirectoryPath } from '../utils/config-utils';
import { Logger } from '../utils/logger';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH } from '../services/config.resolver';
import { lint } from '../executor';

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
    .option('--editor <editor>', 'Editor to open files with (e.g., vscode, atom, sublime). Auto-detects if not specified')
    .action(async (directory:string, options: CliOptions) => {
      const startTime = Date.now();
      try {
        Logger.info(chalk.blue('Starting lint process...'));
        // Parse CLI options with appropriate defaults
        const normalizedOptions = normalizeCliOptions(options, {
          configStylelint: DEFAULT_STYLELINT_CONFIG_PATH,
          configEslint: DEFAULT_ESLINT_CONFIG_PATH,
        });

        if(directory){ // If argument is passed, ignore -d, --directory option
          normalizedOptions.directory = normalizeDirectoryPath(directory);
        } else if(options.directory){
          // If  -d, --directory option is passed, prompt deprecation warning
          Logger.newLine().warning(chalk.yellow(
            `WARNING: --directory, -d option is deprecated. Supply as argument instead.
            Example: npx @salesforce-ux/slds-linter lint ${options.directory}`
          ));
        }

        // Use Node API to perform the linting
        const lintResults = await lint({
          directory: normalizedOptions.directory,
          fix: normalizedOptions.fix,
          configStylelint: normalizedOptions.configStylelint,
          configEslint: normalizedOptions.configEslint
        });

        // Print detailed lint results only for files with issues
        printLintResults(lintResults, normalizedOptions.editor);

        // Calculate statistics
        const errorCount = lintResults.reduce((sum, r) => sum + r.errors.length, 0);
        const warningCount = lintResults.reduce((sum, r) => sum + r.warnings.length, 0);

        // Final summary
        Logger.info(
          `\n${chalk.red(`${errorCount} error${errorCount !== 1 ? 's' : ''}`)}` +
          `  ${chalk.yellow(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`)}`
        );
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        Logger.success(chalk.green(`\nLinting completed in ${elapsedTime} seconds.`));
        process.exit(errorCount > 0 ? 1 : 0);
      } catch (error: any) {
        Logger.error(chalk.red(`Failed to complete linting: ${error.message}`));
        process.exit(1);
      }
    });
}
