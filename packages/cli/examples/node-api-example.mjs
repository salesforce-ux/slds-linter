/**
 * Example demonstrating how to use the SLDS Linter Node.js API
 * 
 * To run this example:
 * 1. Install @salesforce-ux/slds-linter
 * 2. Run with: node node-api-example.mjs
 */

import { lint, report } from '@salesforce-ux/slds-linter/executor';
import fs from 'fs';
import path from 'path';

// Example 1: Lint files in a directory
async function lintDirectory() {
  console.log('--- Example 1: Linting files in a directory ---');
  
  try {
    const results = await lint({
      directory: './src', // Directory to scan
      fix: false // Don't auto-fix issues
    });
    
    console.log(`Found ${results.length} files with issues`);
    
    // Display summary of issues
    results.forEach(result => {
      console.log(`File: ${path.basename(result.filePath)}`);
      console.log(`- Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
    });
  } catch (error) {
    console.error('Linting failed:', error);
  }
}

// Example 2: Generate a SARIF report
async function generateSarifReport() {
  console.log('\n--- Example 2: Generating a SARIF report ---');
  
  try {
    // Run linting and generate report
    const lintResults = await lint({
      directory: './src'
    });
    
    const reportStream = await report({
      results: lintResults,
      format: 'sarif'
    });
    
    // Save report to file
    const outputPath = path.join(process.cwd(), 'slds-lint-report.sarif');
    reportStream.pipe(fs.createWriteStream(outputPath))
      .on('finish', () => console.log(`SARIF report saved to: ${path.basename(outputPath)}`))
      .on('error', err => console.error('Error saving report:', err));
  } catch (error) {
    console.error('Report generation failed:', error);
  }
}

// Example 3: Generate a CSV report directly from directory
async function generateCsvReport() {
  console.log('\n--- Example 3: Generating a CSV report ---');
  
  try {
    // Generate report directly from directory
    const reportStream = await report({
      directory: './src',
      format: 'csv'
    });
    
    // Save report to file
    const outputPath = path.join(process.cwd(), 'slds-lint-report.csv');
    reportStream.pipe(fs.createWriteStream(outputPath))
      .on('finish', () => console.log(`CSV report saved to: ${path.basename(outputPath)}`))
      .on('error', err => console.error('Error saving report:', err));
  } catch (error) {
    console.error('Report generation failed:', error);
  }
}

// Run all examples sequentially
async function runExamples() {
  await lintDirectory();
  await generateSarifReport();
  await generateCsvReport();
}

runExamples();
