#!/usr/bin/env node

import { execSync } from 'child_process';
import { generateIndex } from './generate-index.js';

// Check if we're running in a Heroku review app environment
const isHerokuReviewApp = process.env.HEROKU_REVIEW_APP === 'true' || 
                          process.env.HEROKU_APP_NAME?.includes('slds-linter') ||
                          process.env.HEROKU_PARENT_APP_NAME;

console.log('🚀 Starting build process...');

// Always run the main build command
console.log('📦 Running main build command...');
try {
  execSync('yarn workspaces foreach -At --jobs 1 run build', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Main build completed successfully');
} catch (error) {
  console.error('❌ Main build failed:', error.message);
  process.exit(1);
}

// Execute additional commands if running in Heroku review app
if (isHerokuReviewApp) {
  console.log('🔧 Detected Heroku review app environment, running additional commands...');
  
  // Generate index.html for the site folder
  try {
    console.log('📄 Generating index.html for site folder...');
    await generateIndex();
    console.log('✅ Index.html generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate index.html:', error.message);
  }
  
  // Add your additional commands here
  const additionalCommands = [
    'node ./packages/cli/build/index.js report "demo/**"',
    'node scripts/sarif-to-html-report.js'
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
  
  console.log('🎉 All build tasks completed successfully');
} else {
  console.log('🏠 Local development build completed');
} 