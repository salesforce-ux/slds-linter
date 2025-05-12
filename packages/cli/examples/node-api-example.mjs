/**
 * Example demonstrating how to use the SLDS Linter Node.js API
 * 
 * To run this example:
 * 1. Install @salesforce-ux/slds-linter
 * 2. Save this file as node-api-example.mjs
 * 3. Run with: node node-api-example.mjs
 */

import { sldsExecutor } from '@salesforce-ux/slds-linter/executor';
import fs from 'fs';
import path from 'path';

// Example 1: Lint files in a directory
async function lintDirectory() {
  console.log('--- Example 1: Linting files in a directory ---');
  
  try {
    const results = await sldsExecutor.lint({
      directory: './src', // Directory to scan
      fix: false // Don't auto-fix issues
    });
    
    console.log(`Found ${results.length} files with issues`);
    
    // Display summary of issues
    let totalErrors = 0;
    let totalWarnings = 0;
    
    for (const result of results) {
      console.log(`\nFile: ${result.filePath}`);
      console.log(`- Errors: ${result.errors.length}`);
      console.log(`- Warnings: ${result.warnings.length}`);
      
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
    }
    
    console.log(`\nTotal: ${totalErrors} errors, ${totalWarnings} warnings`);
  } catch (error) {
    console.error('Linting failed:', error);
  }
}

// Example 2: Lint specific files
async function lintSpecificFiles() {
  console.log('\n--- Example 2: Linting specific files ---');
  
  try {
    const results = await sldsExecutor.lint({
      files: [
        'src/components/button/button.scss',
        'src/components/card/card.html'
      ]
    });
    
    console.log(`Found ${results.length} files with issues`);
    
    // Display detailed issues
    for (const result of results) {
      console.log(`\nFile: ${result.filePath}`);
      
      if (result.errors.length > 0) {
        console.log('Errors:');
        for (const error of result.errors) {
          console.log(`- Line ${error.line}, Col ${error.column}: ${error.message} (${error.ruleId})`);
        }
      }
      
      if (result.warnings.length > 0) {
        console.log('Warnings:');
        for (const warning of result.warnings) {
          console.log(`- Line ${warning.line}, Col ${warning.column}: ${warning.message} (${warning.ruleId})`);
        }
      }
    }
  } catch (error) {
    console.error('Linting failed:', error);
  }
}

// Example 3: Generate a SARIF report
async function generateSarifReport() {
  console.log('\n--- Example 3: Generating a SARIF report ---');
  
  try {
    const reportStream = await sldsExecutor.report({
      directory: './src',
      format: 'sarif'
    });
    
    // Save the report to a file
    const outputPath = path.join(process.cwd(), 'slds-lint-report.sarif');
    const writeStream = fs.createWriteStream(outputPath);
    
    reportStream.pipe(writeStream);
    
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      reportStream.on('error', reject);
    });
    
    console.log(`SARIF report saved to: ${outputPath}`);
  } catch (error) {
    console.error('Report generation failed:', error);
  }
}

// Run all examples sequentially
async function runExamples() {
  await lintDirectory();
  await lintSpecificFiles();
  await generateSarifReport();
}

runExamples(); 