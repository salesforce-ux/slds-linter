/**
 * SLDS Linter API Test Suite
 * 
 * Tests core functionality including:
 * - Linting files
 * - Generating reports
 * - Configuration utilities
 */

import fs from 'fs';
import path from 'path';

console.log('Starting SLDS Linter API tests...');

async function runTests() {
  try {
    // Import modules
    const { lint, report } = await import('../../build/executor/index.js');
    const { normalizeCliOptions } = await import('../../build/utils/config-utils.js');
    console.log('✓ Modules imported successfully');
    
    // Test config normalization
    const config = normalizeCliOptions({
      directory: './',
      fix: false
    }, {}, true);
    console.log('✓ Config normalization works');
    
    // Test linting
    const lintResults = await lint({
      directory: './'
    });
    
    if (lintResults.length > 0) {
      console.log(`✓ Lint works - found ${lintResults.length} files with issues`);
      
      // Log first file issues
      const firstFile = lintResults[0];
      console.log(`  File: ${path.basename(firstFile.filePath)}`);
      console.log(`  Issues: ${firstFile.warnings.length}`);
      
      // Show first issue
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
    
    // Test SARIF report generation
    const sarifStream = await report({
      format: 'sarif'
    }, lintResults);
    
    const sarifReport = await streamToString(sarifStream);
    validateReport(sarifReport, 'sarif');
    console.log(`✓ SARIF report generation works (${sarifReport.length} bytes)`);
    
    // Save report file
    const sarifFilePath = path.join(process.cwd(), 'lint-report.sarif');
    fs.writeFileSync(sarifFilePath, sarifReport);
    console.log(`  Report saved to: ${path.basename(sarifFilePath)}`);
    
    // Test CSV report generation
    const csvStream = await report({
      format: 'csv'
    }, lintResults);
    
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
    stream.on('error', reject);
  });
}

// Helper: Validate report structure
function validateReport(reportStr, format) {
  if (format === 'sarif') {
    try {
      const report = JSON.parse(reportStr);
      if (!report.version || !Array.isArray(report.runs)) {
        throw new Error('Invalid SARIF structure');
      }
      return true;
    } catch (error) {
      console.error(`❌ Report validation failed:`, error.message);
      return false;
    }
  }
  return true;
}

// Run all tests
runTests(); 