import { Command } from 'commander';
import path from 'path';
import ora from 'ora';
import { CliOptions } from '../types';
import { normalizeCliOptions } from '../utils/cli-args';
import { Logger } from '../utils/logger';
import { FileScanner } from '../services/file-scanner';
import { StyleFilePatterns, ComponentFilePatterns } from '../services/file-patterns';
import { LintRunner } from '../services/lint-runner';
import { ReportGenerator } from '../services/report-generator';
import { DEFAULT_ESLINT_CONFIG_PATH, DEFAULT_STYLELINT_CONFIG_PATH, LINTER_CLI_VERSION } from '../services/config.resolver';
import { loadPersonaConfig } from '../services/config-loader';
import { loadStoredPersona } from '../services/persona-loader';

export function registerReportCommand(program: Command): void {
  program
    .command('report')
    .description('Generate SARIF report from linting results')
    .option('-d, --directory <path>', 'Target directory to scan (defaults to current directory)')
    .option('-o, --output <path>', 'Output directory for reports (defaults to current directory)')
    .option('--config-style <path>', 'Path to stylelint config file')
    .option('--config-eslint <path>', 'Path to eslint config file')
    .action(async (options: CliOptions) => {
      const spinner = ora('Starting report generation...').start();
      try {        
        const normalizedOptions = normalizeCliOptions(options, {
          configStyle: DEFAULT_STYLELINT_CONFIG_PATH,
          configEslint: DEFAULT_ESLINT_CONFIG_PATH
        });

        const persona = loadStoredPersona();
        Logger.info(`🔹 Using persona: ${persona}`);
        const personaConfig = loadPersonaConfig(persona);
        
        // Run styles linting
        spinner.text = 'Running styles linting...';
        const styleFileBatches = await FileScanner.scanFiles(normalizedOptions.directory, {
          patterns: StyleFilePatterns,
          batchSize: 100
        });
        
        const styleResults = await LintRunner.runLinting(styleFileBatches, 'style', {
          configPath: normalizedOptions.configStyle,
          config: personaConfig.styleConfig
        });

        // Run components linting
        spinner.text = 'Running components linting...';
        const componentFileBatches = await FileScanner.scanFiles(normalizedOptions.directory, {
          patterns: ComponentFilePatterns,
          batchSize: 100
        });
        
        const componentResults = await LintRunner.runLinting(componentFileBatches, 'component', {
          configPath: normalizedOptions.configEslint,
          config: personaConfig.eslintConfig
        });

        /* 
         // TODO: Enable only if dedicated report per linter is needed
         // Generate styles report
        const styleReportPath = path.join(normalizedOptions.output, 'stylelint-report.sarif');
        await ReportGenerator.generateSarifReport(styleResults, {
          outputPath: styleReportPath,
          toolName: 'stylelint',
          toolVersion: STYLELINT_VERSION
        }); */

        /* 
        // TODO: Enable only if dedicated report per linter is needed
        // Generate components report
        const componentReportPath = path.join(normalizedOptions.output, 'eslint-report.sarif');
        await ReportGenerator.generateSarifReport(componentResults, {
          outputPath: componentReportPath,
          toolName: 'eslint',
          toolVersion: ESLINT_VERSION
        }); */

        // Generate combined report
        spinner.text = 'Generating combined report...';
        const combinedReportPath = path.join(normalizedOptions.output, 'slds-linter-report.sarif');
        await ReportGenerator.generateSarifReport([...styleResults, ...componentResults], {
          outputPath: combinedReportPath,
          toolName: 'slds-linter',
          toolVersion: LINTER_CLI_VERSION
        });

        spinner.succeed('Report generation completed');
        process.exit(0);
      } catch (error: any) {
        spinner?.fail('Report generation failed');
        Logger.error(`Failed to generate report: ${error.message}`);
        process.exit(1);
      }
    });
} 