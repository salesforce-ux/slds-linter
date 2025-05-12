// Automated test for report generation through the SLDS Linter Node API
import fs from 'fs';
import path from 'path';

console.log('Starting automated report generation test...');

async function runReportTest() {
  try {
    // 1. Import the module
    console.log('Importing module...');
    const { sldsExecutor } = await import('../../build/executor/index.js');
    console.log('Module imported successfully');
    
    // 2. Run linting to get issues
    console.log('\nRunning lint to get issues...');
    const lintResults = await sldsExecutor.lint({
      files: ['./test.css']
    });
    
    console.log(`Found ${lintResults.length} files with issues`);
    
    // 3. Generate and test JSON report
    console.log('\nGenerating JSON report...');
    const jsonReportStream = await sldsExecutor.report({
      issues: lintResults,
      format: 'json'
    });
    
    const jsonReport = await streamToString(jsonReportStream);
    console.log(`JSON report size: ${jsonReport.length} characters`);
    
    // Validate JSON report
    validateJsonReport(jsonReport);
    
    // Save JSON report to file
    const jsonFilePath = path.join(process.cwd(), 'lint-report.json');
    fs.writeFileSync(jsonFilePath, jsonReport);
    console.log(`JSON report saved to: ${jsonFilePath}`);
    
    // 4. Generate and test SARIF report
    console.log('\nGenerating SARIF report...');
    const sarifReportStream = await sldsExecutor.report({
      issues: lintResults,
      format: 'sarif'
    });
    
    const sarifReport = await streamToString(sarifReportStream);
    console.log(`SARIF report size: ${sarifReport.length} characters`);
    
    // Validate SARIF report
    validateSarifReport(sarifReport);
    
    // Save SARIF report to file
    const sarifFilePath = path.join(process.cwd(), 'lint-report.sarif');
    fs.writeFileSync(sarifFilePath, sarifReport);
    console.log(`SARIF report saved to: ${sarifFilePath}`);
    
    console.log('\nReport generation tests completed successfully ✅');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Utility function to convert a stream to a string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    let data = '';
    
    stream.on('data', chunk => {
      data += chunk.toString();
    });
    
    stream.on('end', () => {
      resolve(data);
    });
    
    stream.on('error', error => {
      reject(error);
    });
  });
}

// Validate JSON report structure
function validateJsonReport(jsonStr) {
  try {
    const report = JSON.parse(jsonStr);
    console.log('JSON report is valid');
    
    if (!Array.isArray(report)) {
      throw new Error('JSON report is not an array');
    }
    
    console.log(`Report contains data for ${report.length} files`);
    
    // If we have results, check the first file
    if (report.length > 0) {
      const firstFile = report[0];
      if (!firstFile.source && !firstFile.filePath) {
        console.warn('Warning: File source/path is missing in report');
      }
      
      if (!Array.isArray(firstFile.warnings)) {
        throw new Error('Warnings is not an array');
      }
      
      console.log(`First file has ${firstFile.warnings.length} warnings`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ JSON report validation failed:', error.message);
    throw error;
  }
}

// Validate SARIF report structure
function validateSarifReport(sarifStr) {
  try {
    const report = JSON.parse(sarifStr);
    console.log('SARIF report is valid');
    
    // Basic SARIF structure validation
    if (!report.version) {
      console.warn('Warning: SARIF version is missing');
    }
    
    if (!Array.isArray(report.runs)) {
      throw new Error('SARIF report does not contain runs array');
    }
    
    console.log(`SARIF report contains ${report.runs.length} run(s)`);
    
    // Check first run if available
    if (report.runs.length > 0) {
      const firstRun = report.runs[0];
      if (!firstRun.tool || !firstRun.tool.driver) {
        console.warn('Warning: SARIF run is missing tool driver information');
      }
      
      console.log(`Tool: ${firstRun.tool?.driver?.name || 'Unknown'}`);
      
      if (Array.isArray(firstRun.results)) {
        console.log(`Results: ${firstRun.results.length} issues`);
      } else {
        console.warn('Warning: SARIF run does not contain results array');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ SARIF report validation failed:', error.message);
    throw error;
  }
}

// Run the tests
runReportTest(); 