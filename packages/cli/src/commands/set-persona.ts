import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

const globalPersonaConfigPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', '.slds-linter-persona');

export function registerSetPersonaCommand(program: Command): void {
  program
    .command('set-persona <persona>')
    .description('Set your default persona for SLDS-Linter')
    .action((persona: string) => {
      const validPersonas = ['internal', 'external'];

      if (!validPersonas.includes(persona)) {
        console.error(`❌ Invalid persona. Choose from: ${validPersonas.join(', ')}`);
        process.exit(1);
      }

      fs.writeFileSync(globalPersonaConfigPath, JSON.stringify({ persona }, null, 2));
      console.log(`✅ Persona set to "${persona}" globally.`);
    });
}
