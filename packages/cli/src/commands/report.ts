import { Command, Option } from 'commander';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { CliOptions } from '../types';
import { nomalizeDirPath, normalizeCliOptions } from '../utils/cli-args';
import { Logger } from '../utils/logger';
import { FileScanner } from '../services/file-scanner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { LintRunner } from '../services/lint-runner';
import { ReportGenerator } from '../services/report-generator';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH, LINTER_CLI_VERSION } from '../services/config.resolver';
import { mkConfig, generateCsv, asString } from 'export-to-csv';
import { writeFile } from 'fs/promises';

export function registerReportCommand(program: Command): void {
  program
    .command('report')
    .description('Generate report from linting results')
    .argument('[directory]', 'Target directory to scan (defaults to current directory). Support glob patterns')
    .addOption(new Option('-d, --directory <path>', 'Target directory to scan (defaults to current directory). Support glob patterns').hideHelp())    
    .option('-o, --output <path>', 'Output directory for reports (defaults to current directory)')
    .option('--config-stylelint <path>', 'Path to stylelint config file')
    .option('--config-eslint <path>', 'Path to eslint config file')
    .option('--format <type>', 'Output format (sarif or csv)', 'sarif')
    .action(async (directory: string, options: CliOptions) => {
      const spinner = ora('Starting report generation...');
      try {        
        const normalizedOptions = normalizeCliOptions(options, {
          configStylelint: DEFAULT_STYLELINT_CONFIG_PATH,
          configEslint: DEFAULT_ESLINT_CONFIG_PATH
        });

        if(directory){ // If argument is passed, ignore -d, --directory option
          normalizedOptions.directory = nomalizeDirPath(directory);
        } else if(options.directory){
          // If  -d, --directory option is passed, prompt deprecation warning
          Logger.newLine().warning(chalk.yellow(
            `WARNING: --directory, -d option is deprecated. Supply as argument instead.
            Example: npx @salesforce-ux/slds-linter report ${options.directory}`
          ));
        }
        spinner.start();
        
        // Run styles linting
        spinner.text = 'Running styles linting...';
        const styleFileBatches = await FileScanner.scanFiles(normalizedOptions.directory, {
          patterns: StyleFilePatterns,
          batchSize: 100
        });
        
        const styleResults = await LintRunner.runLinting(styleFileBatches, 'style', {
          configPath: normalizedOptions.configStylelint
        });

        // Run components linting
        spinner.text = 'Running components linting...';
        const componentFileBatches = await FileScanner.scanFiles(normalizedOptions.directory, {
          patterns: ComponentFilePatterns,
          batchSize: 100
        });
        
        const componentResults = await LintRunner.runLinting(componentFileBatches, 'component', {
          configPath: normalizedOptions.configEslint
        });

        // Generate report based on format
        const reportFormat = options.format.toLowerCase();
        
        if (reportFormat === 'sarif') {
          spinner.text = 'Generating SARIF report...';
          const combinedReportPath = path.join(normalizedOptions.output, 'slds-linter-report.sarif');
          await ReportGenerator.generateSarifReport([...styleResults, ...componentResults], {
            outputPath: combinedReportPath,
            toolName: 'slds-linter',
            toolVersion: LINTER_CLI_VERSION
          });
          Logger.success(`SARIF report generated: ${combinedReportPath}\n`);
        } else if (reportFormat === 'csv') {
          spinner.text = 'Generating CSV report...';
          const csvConfig = mkConfig({
            filename: 'slds-linter-report',
            fieldSeparator: ',',
            quoteStrings: true,
            decimalSeparator: '.',
            showLabels: true,
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true,
          });
          
          const transformedResults = [...styleResults, ...componentResults].flatMap(result =>
            [
              ...result.errors.map(error => ({
                "File Path": result.filePath,
                "Message": error.message,
                "Severity": error.severity === 1 ? 'warning' : 'error',
                "Rule ID": error.ruleId || 'N/A',
                "Start Line": error.line,
                "Start Column": error.column,
                "End Column": error.endColumn || error.column, // Default to start column if missing
                "Type": 'Error'
              })),
              ...result.warnings.map(warning => ({
                "File Path": result.filePath,
                "Message": warning.message,
                "Severity": warning.severity === 1 ? 'warning' : 'error',
                "Rule ID": warning.ruleId || 'N/A',
                "Start Line": warning.line,
                "Start Column": warning.column,
                "End Column": warning.endColumn || warning.column, // Default to start column if missing
                "Type": 'Warning'
              }))
            ]
          );
          
          const csvData = generateCsv(csvConfig)(transformedResults);
          const csvString = asString(csvData);
          const csvReportPath = path.join(normalizedOptions.output, `${csvConfig.filename}.csv`);
          await writeFile(csvReportPath, csvString);
          Logger.success(`CSV report generated: ${csvReportPath}\n`);
        } else {
          throw new Error(`Invalid format: ${reportFormat}. Supported formats: sarif, csv`);
        }
        
        spinner.succeed('Report generation completed');
        process.exit(0);
      } catch (error: any) {
        spinner?.fail('Report generation failed');
        Logger.error(`Failed to generate report: ${error.message}`);
        process.exit(1);
      }
    });
}
