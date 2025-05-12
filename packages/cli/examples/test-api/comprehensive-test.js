// Comprehensive test for SLDS Linter Node API
console.log('Starting comprehensive API test...');

// Updated import path for the new location
import('../../build/executor/index.js')
  .then(async module => {
    try {
      console.log('Module imported successfully');
      
      // 1. Test normalizeConfig method
      console.log('\n1. Testing normalizeConfig method:');
      const config = module.sldsExecutor.normalizeConfig({
        directory: './',
        files: ['./test.css'],
        fix: false
      });
      console.log('Normalized config:', config);
      
      // 2. Test file handling capabilities
      console.log('\n2. Testing file handling capabilities:');
      
      // Note: batchFiles is a private method and not part of the public API
      // Instead, let's demonstrate the file handling capabilities by running lint with different inputs
      
      // a. Test with a specific file
      console.log('a. Testing with a specific file:');
      const fileResults = await module.sldsExecutor.lint({
        files: ['./test.css']
      });
      console.log(`Found ${fileResults.length} files with specific file input`);
      
      // b. Test with a directory
      console.log('b. Testing with a directory:');
      const dirResults = await module.sldsExecutor.lint({
        directory: './'
      });
      console.log(`Found ${dirResults.length} files with directory input`);
      console.log(`Files found in directory scan:`);
      dirResults.forEach(result => console.log(` - ${result.filePath || result.source}`));
      
      // 3. Test lint method with a specific file
      console.log('\n3. Testing lint method with specific file:');
      const lintResults = await module.sldsExecutor.lint({
        files: ['./test.css'],
        fix: false
      });
      
      console.log(`Found ${lintResults.length} files with issues`);
      if (lintResults.length > 0) {
        console.log('First file issues:');
        const firstFile = lintResults[0];
        console.log(`File: ${firstFile.filePath || firstFile.source}`);
        console.log(`Warnings: ${firstFile.warnings.length}`);
        
        firstFile.warnings.slice(0, 3).forEach((warning, i) => {
          try {
            const parsedMessage = JSON.parse(warning.message);
            console.log(`  ${i+1}. Line ${warning.line}, col ${warning.column}: ${parsedMessage.message}`);
          } catch (e) {
            console.log(`  ${i+1}. Line ${warning.line}, col ${warning.column}: ${warning.message || warning.text}`);
          }
        });
        
        if (firstFile.warnings.length > 3) {
          console.log(`  ... and ${firstFile.warnings.length - 3} more warnings`);
        }
      }
      
      // 4. Test report method
      console.log('\n4. Testing report method:');
      // JSON report
      const jsonReportStream = await module.sldsExecutor.report({
        issues: lintResults,
        format: 'json'
      });
      
      // Properly collect the stream data
      let jsonReport = '';
      await new Promise(resolve => {
        jsonReportStream.on('data', chunk => {
          jsonReport += chunk.toString();
        });
        
        jsonReportStream.on('end', () => {
          console.log(`Generated JSON report: ${jsonReport.length} characters`);
          resolve();
        });
      });
      
      // SARIF report
      const sarifReportStream = await module.sldsExecutor.report({
        issues: lintResults,
        format: 'sarif'
      });
      
      // Properly collect the stream data
      let sarifReport = '';
      await new Promise(resolve => {
        sarifReportStream.on('data', chunk => {
          sarifReport += chunk.toString();
        });
        
        sarifReportStream.on('end', () => {
          console.log(`Generated SARIF report: ${sarifReport.length} characters`);
          resolve();
        });
      });
      
      console.log('\nComprehensive API test completed successfully');
    } catch (error) {
      console.error('Test error:', error);
    }
  })
  .catch(error => {
    console.error('Module import error:', error);
  }); 