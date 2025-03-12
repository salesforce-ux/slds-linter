#!/usr/bin/env node

import { Command } from 'commander';
import { registerLintCommand } from './commands/lint';
import { registerReportCommand } from './commands/report';
import { registerEmitCommand } from './commands/emit';
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

registerLintCommand(program);
registerReportCommand(program);
registerEmitCommand(program);
registerVersion();
program.configureHelp({  
  subcommandTerm:(cmd)=>{
    return cmd.name();
  },
})

program.parse(process.argv); 