#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const eslintConfigPath = fileURLToPath(await import.meta.resolve('@salesforce-ux/eslint-plugin-slds/build/.eslintrc.yml'));
const stylelintConfigPath = fileURLToPath(await import.meta.resolve('@salesforce-ux/stylelint-plugin-slds/build/.stylelintrc.yml'));
const reportExecuterPath = fileURLToPath(await import.meta.resolve('@salesforce-ux/stylelint-plugin-slds/build/report.js'));

// ✅ Define CLI Commands using `yargs`
yargs(hideBin(process.argv))
    .scriptName('')
    .usage('Usage: npx @salesforce-ux/slds-linter [command]')
    .command(
        'lint',
        'Run both ESLint and Stylelint',
        () => {},
        () => {
            console.log(chalk.cyan('🔍 Running ESLint and Stylelint...'));
            try {
                execSync(`eslint **/*.{html,cmp} --config ${eslintConfigPath} --ext .html,.cmp`, { stdio: 'inherit' });
                console.log(chalk.green('✅ Linting components completed successfully!'));
            } catch (error) {
                console.error(chalk.red('❌ Linting components failed. Please fix the errors and try again.'));
                //process.exit(1);
            }

            try {
                execSync(`stylelint ./**/*.css --config ${stylelintConfigPath}`, { stdio: 'inherit' });
                console.log(chalk.green('✅ Linting styles completed successfully!'));
            } catch (error) {
                console.error(chalk.red('❌ Linting styles failed. Please fix the errors and try again.'));
                //process.exit(1);
            }
            
        }
    )
    .command(
        'lint:styles',
        'Run only Stylelint',
        () => {},
        () => {
            console.log(chalk.cyan('🎨 Running Stylelint...'));
            try {
                execSync(`stylelint ./**/*.css --config ${stylelintConfigPath}`, { stdio: 'inherit' });
                console.log(chalk.green('✅ Stylelint completed successfully!'));
            } catch (error) {
                console.error(chalk.red('❌ Stylelint failed. Please fix the errors and try again.'));
                process.exit(1);
            }
        }
    )
    .command(
        'lint:components',
        'Run only ESLint',
        () => {},
        () => {
            console.log(chalk.cyan('🛠️ Running ESLint...'));
            try {
                execSync(`eslint **/*.{html,cmp} --config ${eslintConfigPath} --ext .html,.cmp`, { stdio: 'inherit' });
                console.log(chalk.green('✅ ESLint completed successfully!'));
            } catch (error) {
                console.error(chalk.red('❌ ESLint failed. Please fix the errors and try again.'));
                process.exit(1);
            }
        }
    )
    .command(
        'fix',
        'Fix auto-fixable issues',
        () => {},
        () => {
            console.log(chalk.cyan('🔧 Running auto-fix for ESLint and Stylelint...'));
            try {
                execSync(`eslint **/*.{html,cmp} --config ${eslintConfigPath} --fix --ext .html,.cmp`, { stdio: 'inherit' });
                console.log(chalk.green('✅ Auto-fix components applied successfully!'));
            } catch (error) {
                console.error(chalk.red('❌ Fixing components failed. Please check linting errors.'));
                //process.exit(1);
            }

            try {
                execSync(`stylelint "**/*.css" -c ${stylelintConfigPath} --fix`, { stdio: 'inherit' });
                console.log(chalk.green('✅ Auto-fix styles applied successfully!'));
            } catch (error) {
                console.error(chalk.red('❌ Fixing styles failed. Please check linting errors.'));
                //process.exit(1);
            }

        }
    )
    .command(
        'report',
        'Generate a linting report',
        (yargs) => {
            return yargs.option('dir', {
                alias: 'd',
                describe: 'Target directory for linting',
                type: 'string',
                default: 'force-app/'
            });
        },
        (argv) => {
            console.log(chalk.cyan(`📊 Generating linting report for ${argv.dir}...`));
            try {
                execSync(`node ${reportExecuterPath} ${argv.dir} -c ${stylelintConfigPath}`, { stdio: 'inherit' });
                console.log(chalk.green('✅ Report generated successfully!'));
            } catch (error) {
                console.error(chalk.red('❌ Failed to generate the report.'));
                process.exit(1);
            }
        }
    )
    .help();

yargsInst.showHelp();