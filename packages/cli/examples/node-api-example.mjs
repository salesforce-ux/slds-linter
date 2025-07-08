/**
 * Example demonstrating how to use the SLDS Linter Node.js API
 * 
 * To run this example:
 * 1. Install @salesforce-ux/slds-linter
 * 2. Run with: node node-api-example.mjs
 */

import { lint, report } from '@salesforce-ux/slds-linter/executor';
import { printLintResults } from '@salesforce-ux/slds-linter/utils';
import fs from 'fs';
import path from 'path';

// Example 1: Lint files in a directory
async function lintDirectory() {
  console.log('--- Example 1: Linting files in a directory ---');
  
  try {
    const results = await lint({
      directory: '../../demo/small-set', // Use demo directory for testing
      fix: false, // Don't auto-fix issues
      styleLinter: 'both', // Run both ESLint and Stylelint on style files
    });
    
    console.log(`Found ${results.length} files with issues`);
    
    // Display summary of issues
    printLintResults(results);

  } catch (error) {
    console.error('Linting failed:', error);
  }
}

// Example 2: Generate a SARIF report
async function generateSarifReport() {
  console.log('\n--- Example 2: Generating a SARIF report ---');
  
  try {
    // Run linting and generate report
    let lintResults = await lint({
      directory: '../../demo/small-set/hardcoded-values.css' // Use specific file from demo
    });
    
    if (!lintResults || lintResults.length === 0) {
      console.log('No lint issues found, creating sample data for report demo');
      lintResults = [{
        filePath: '../../demo/small-set/hardcoded-values.css',
        errors: [],
        warnings: [{
          line: 2,
          column: 13,
          endColumn: 17,
          message: "There’s no replacement styling hook for the 100% static value. Remove the static value. (slds/no-hardcoded-values-slds2).",
          ruleId: 'slds/no-hardcoded-values-slds2',
          severity: 1
        }]
      }];
      printLintResults(lintResults);
    }
    
    const reportStream = await report({
      format: 'sarif'
    }, lintResults);
    
    // Save report to file
    const outputPath = path.join(process.cwd(), 'example-report.sarif');
    const writeStream = fs.createWriteStream(outputPath);
    
    reportStream.pipe(writeStream)
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
    // First run lint to get results
    let lintResults = await lint({
      directory: '../../demo/small-set/deprecated_classes.css'
    });
    
    if (!lintResults || lintResults.length === 0) {
      console.log('No lint issues found, creating sample data for report demo');
      lintResults = [{
        filePath: '../../demo/small-set/deprecated_classes.css',
        errors: [],
        warnings: [{
          line: 1,
          column: 1,
          endColumn: 10,
          message: "Overriding .slds-button__icon isn’t supported. To differentiate SLDS and custom classes, create a CSS class in your namespace. Examples: myapp-input, myapp-button.",
          ruleId: 'slds/no-slds-class-overrides',
          severity: 1
        },
        {
          line: 2,
          column: 13,
          endColumn: 17,
          message: "There’s no replacement styling hook for the 23% static value. Remove the static value. (slds/no-hardcoded-values-slds2).",
          ruleId: 'slds/no-hardcoded-values-slds2',
          severity: 1
        }]
      }];
      printLintResults(lintResults);
    }
    
    // Generate report using the lint results
    const reportStream = await report({
      format: 'csv'
    }, lintResults);
    
    // Save report to file
    const outputPath = path.join(process.cwd(), 'example-report.csv');
    const writeStream = fs.createWriteStream(outputPath);
    
    reportStream.pipe(writeStream)
      .on('finish', () => console.log(`CSV report saved to: ${path.basename(outputPath)}`))
      .on('error', err => console.error('Error saving report:', err));
  } catch (error) {
    console.error('Report generation failed:', error);
  }
}

// Run all examples sequentially
async function runExamples() {
  try {
    await lintDirectory();
    await generateSarifReport();
    await generateCsvReport();
    console.log('\nExamples completed successfully! Check example-report.* files for outputs.');
    console.log('Note: Remember to delete the generated report files when done.');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

runExamples();
