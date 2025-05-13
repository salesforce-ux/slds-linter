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

// Example 2: Generate a SARIF report from linting results
async function generateSarifReport() {
  console.log('\n--- Example 2: Generating a SARIF report ---');
  
  try {
    // First run linting to get results
    const lintResults = await sldsExecutor.lint({
      directory: './src'
    });
    
    // Generate report with the lint results
    const reportStream = await sldsExecutor.report({
      issues: lintResults,
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

// Example 3: Generate a CSV report directly from directory
async function generateCsvReport() {
  console.log('\n--- Example 3: Generating a CSV report ---');
  
  try {
    const reportStream = await sldsExecutor.report({
      directory: './src',
      format: 'csv'
    });
    
    // Save the report to a file
    const outputPath = path.join(process.cwd(), 'slds-lint-report.csv');
    const writeStream = fs.createWriteStream(outputPath);
    
    reportStream.pipe(writeStream);
    
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      reportStream.on('error', reject);
    });
    
    console.log(`CSV report saved to: ${outputPath}`);
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

runExamples(); runExamples();
