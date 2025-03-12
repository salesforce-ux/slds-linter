import fs from 'fs';
import path from 'path';

const globalPersonaConfigPath = path.resolve(process.env.HOME || process.env.USERPROFILE || '', '.slds-linter-persona');

export function loadStoredPersona(): string {
  if (fs.existsSync(globalPersonaConfigPath)) {
    const config = JSON.parse(fs.readFileSync(globalPersonaConfigPath, 'utf8'));
    return config.persona || 'internal'; // ✅ Default to 'frontend'
  }

  // ✅ If persona config is missing, set a default one
  const defaultPersona = 'internal'; // Change to any default persona as needed
  fs.writeFileSync(globalPersonaConfigPath, JSON.stringify({ persona: defaultPersona }, null, 2));

  console.log(`🔹 No persona found. Defaulting to "${defaultPersona}".`);
  console.log(`💡 Run \`npx slds-linter set-persona\` to change your persona.`);
  
  return defaultPersona;
}
