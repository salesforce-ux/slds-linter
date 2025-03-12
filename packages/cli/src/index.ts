#!/usr/bin/env node

import { Command } from 'commander';
import { registerLintStylesCommand } from './commands/lint-styles';
import { registerLintComponentsCommand } from './commands/lint-components';
import { registerLintCommand } from './commands/lint';
import { registerReportCommand } from './commands/report';
import { registerEmitCommand } from './commands/emit';
import { registerSetPersonaCommand } from './commands/set-persona';
import { Logger } from './utils/logger';
import { validateNodeVersion } from './utils/nodeVersionUtil';

// Validate Node.js version before proceeding
validateNodeVersion();

process.on('unhandledRejection', (error) => {
  Logger.error(`Unhandled rejection: ${error}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  Logger.error(`Uncaught exception: ${error}`);
  process.exit(1);
});

const program = new Command();

program
  .name('npx @salesforce-ux/slds-linter@latest')
  .showHelpAfterError();

function registerVersion(){
  // resolving version and description from env props. check gulp file
  program.description(process.env.CLI_DESCRIPTION)
  .version(process.env.CLI_VERSION);
}

registerLintStylesCommand(program);
registerLintComponentsCommand(program);
registerLintCommand(program);
registerReportCommand(program);
registerEmitCommand(program);
registerSetPersonaCommand(program);
registerVersion();

program.parse(process.argv); 