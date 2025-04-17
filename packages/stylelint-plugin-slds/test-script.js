import stylelint from 'stylelint';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const result = await stylelint.lint({
      files: path.resolve(__dirname, 'test-aura.css'),
      config: {
        plugins: [path.resolve(__dirname, 'src/index.ts')],
        rules: {
          'slds/enforce-bem-usage': true
        },
        fix: true
      }
    });

    console.log('Lint Results:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if the file was fixed
    const fixedOutput = result.results[0].output;
    if (fixedOutput) {
      console.log('Fixed output:');
      console.log(fixedOutput);
    } else {
      console.log('No fixes applied');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 