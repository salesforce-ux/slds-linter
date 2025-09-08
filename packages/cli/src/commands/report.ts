import { Command, Option } from 'commander';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import { CliOptions } from '../types';
import { normalizeAndValidatePath, normalizeCliOptions, normalizeDirectoryPath } from '../utils/config-utils';
import { Logger } from '../utils/logger';
import { DEFAULT_ESLINT_CONFIG_PATH } from '../services/config.resolver';
import { report, lint } from '../executor';

export function registerReportCommand(program: Command): void {
  program
    .command('report')
    .description('Generate report from linting results')
    .argument('[directory]', 'Target directory to scan (defaults to current directory). Support glob patterns')
    .addOption(new Option('-d, --directory <path>', 'Target directory to scan (defaults to current directory). Support glob patterns').hideHelp())    
    .option('-o, --output <path>', 'Output directory for reports (defaults to current directory)')
    .option('--config-eslint <path>', 'Path to eslint config file')
    .addOption(new Option('--format <type>', 'Output format').choices(['sarif', 'csv']).default('sarif'))
    .action(async (directory: string, options: CliOptions) => {
      const spinner = ora('Starting report generation...');
      try {        
        const normalizedOptions = normalizeCliOptions(options, {
          configEslint: DEFAULT_ESLINT_CONFIG_PATH,
          output: normalizeAndValidatePath(options.output)
        });

        if(directory){ // If argument is passed, ignore -d, --directory option
          normalizedOptions.directory = normalizeDirectoryPath(directory);
        } else if(options.directory){
          // If -d, --directory option is passed, prompt deprecation warning
          Logger.newLine().warning(chalk.yellow(
            `WARNING: --directory, -d option is deprecated. Supply as argument instead.
            Example: npx @salesforce-ux/slds-linter report ${options.directory}`
          ));
        }
        spinner.start();
        
        // Generate report based on format using Node API
        const reportFormat = normalizedOptions.format?.toLowerCase() || 'sarif';
        
        // First run linting to get results
        const lintResults = await lint(normalizedOptions);
        
        // Generate report using the lint results
        const reportStream = await report({
          format: reportFormat as 'sarif' | 'csv'
        }, lintResults);
        
        // Save the report to a file
        let outputFilePath: string;
        if (reportFormat === 'sarif') {
          spinner.text = 'Saving SARIF report...';
          outputFilePath = path.join(normalizedOptions.output, 'slds-linter-report.sarif');
        } else if (reportFormat === 'csv') {
          spinner.text = 'Saving CSV report...';
          outputFilePath = path.join(normalizedOptions.output, 'slds-linter-report.csv');
        } else {
          throw new Error(`Invalid format: ${reportFormat}. Supported formats: sarif, csv`);
        }
        
        // Save stream to file
        const writeStream = fs.createWriteStream(outputFilePath);
        reportStream.pipe(writeStream);
        
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
        
        Logger.success(`${reportFormat.toUpperCase()} report generated: ${outputFilePath}\n`);
        spinner.succeed('Report generation completed');
        process.exit(0);
      } catch (error: any) {
        spinner?.fail('Report generation failed');
        Logger.error(`Failed to generate report: ${error.message}`);
        process.exit(1);
      }
    });
}
