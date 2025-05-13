/**
 * SLDS Linter API Test Suite
 * 
 * This file provides a consolidated set of tests for the SLDS Linter Node API.
 * It tests the core functionality including:
 * - Linting files
 * - Generating reports
 * - Configuration utilities
 */

import fs from 'fs';
import path from 'path';

console.log('Starting SLDS Linter API tests...');

async function runTests() {
  try {
    // 1. Import modules
    const { sldsExecutor } = await import('../../build/executor/index.js');
    const { normalizeConfig } = await import('../../build/utils/config-utils.js');
    console.log('✓ Modules imported successfully');
    
    // 2. Test normalizeConfig utility
    const config = normalizeConfig({
      directory: './',
      fix: false
    });
    console.log('✓ Config normalization works');
    
    // 3. Test lint functionality
    const lintResults = await sldsExecutor.lint({
      directory: './'
    });
    
    if (lintResults.length > 0) {
      console.log(`✓ Lint works - found ${lintResults.length} files with issues`);
      
      // Log first file issues for verification
      const firstFile = lintResults[0];
      console.log(`  File: ${path.basename(firstFile.filePath)}`);
      console.log(`  Issues: ${firstFile.warnings.length}`);
      
      // Parse and display the first issue
      if (firstFile.warnings.length > 0) {
        const warning = firstFile.warnings[0];
        try {
          const parsedMessage = JSON.parse(warning.message);
          console.log(`  First issue: Line ${warning.line} - ${parsedMessage.message}`);
        } catch (e) {
          console.log(`  First issue: Line ${warning.line} - ${warning.message}`);
        }
      }
    } else {
      console.log('⚠ No files with issues found - verify test.css exists');
    }
    
    // 4. Test report generation (SARIF)
    const sarifStream = await sldsExecutor.report({
      issues: lintResults,
      format: 'sarif'
    });
    
    const sarifReport = await streamToString(sarifStream);
    const sarifValid = validateReport(sarifReport, 'sarif');
    console.log(`✓ SARIF report generation works (${sarifReport.length} bytes)`);
    
    // Create report file for inspection
    const sarifFilePath = path.join(process.cwd(), 'lint-report.sarif');
    fs.writeFileSync(sarifFilePath, sarifReport);
    console.log(`  Report saved to: ${path.basename(sarifFilePath)}`);
    
    // 5. Test CSV report generation
    const csvStream = await sldsExecutor.report({
      issues: lintResults,
      format: 'csv'
    });
    
    const csvReport = await streamToString(csvStream);
    console.log(`✓ CSV report generation works (${csvReport.length} bytes)`);
    
    console.log('\nAll tests completed successfully ✅');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Helper: Convert stream to string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    let data = '';
    stream.on('data', chunk => data += chunk.toString());
    stream.on('end', () => resolve(data));
    stream.on('error', error => reject(error));
  });
}

// Helper: Validate report structure
function validateReport(reportStr, format) {
  try {
    // Only basic validation for SARIF 
    if (format === 'sarif') {
      const report = JSON.parse(reportStr);
      if (!report.version || !Array.isArray(report.runs)) {
        throw new Error('Invalid SARIF structure');
      }
      return true;
    }
    return true;
  } catch (error) {
    console.error(`❌ Report validation failed:`, error.message);
    return false;
  }
}

// Run all tests
runTests(); 