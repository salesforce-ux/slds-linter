#!/usr/bin/env node

import { execSync } from 'child_process';
import { generateIndex } from './generate-index.js';


try {
  console.log('📦 Running yarn install...');
  execSync('yarn install', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Yarn install completed successfully');
} catch (error) {
  console.error('❌ Yarn install failed:', error.message);
  process.exit(1);
}


// Always run the main build command
console.log('📦 Running main build command...');
try {
  execSync('yarn build', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Main build completed successfully');
} catch (error) {
  console.error('❌ Main build failed:', error.message);
  process.exit(1);
}

console.log('🔧 Running additional commands...');

const additionalCommands = [
  'yarn coverage',
  'node ./packages/cli/build/index.js report "demo/**"',
  'node scripts/sarif-to-html-report.js',
  'cp -rf ./packages/stylelint-plugin-slds/coverage/lcov-report ./site/stylelint-plugin-coverage',
  'cp -rf ./packages/eslint-plugin-slds/coverage/lcov-report ./site/eslint-plugin-coverage',
  'cp -rf ./packages/cli/coverage/lcov-report ./site/cli-coverage'
];

for (const command of additionalCommands) {
  console.log(`🔨 Executing: ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${command} completed successfully`);
  } catch (error) {
    console.error(`❌ ${command} failed:`, error.message);
    // You can choose to exit here or continue with other commands
    // process.exit(1);
  }
}

console.log('🔧 Generating index.html...');
generateIndex();
console.log('✅ Index.html generated successfully');

console.log('🎉 All build tasks completed successfully');