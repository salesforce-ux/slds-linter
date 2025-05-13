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
        fix: false
      });
      console.log('Normalized config:', config);
      
      // 2. Test directory scanning
      console.log('\n2. Testing directory scanning:');
      const dirResults = await module.sldsExecutor.lint({
        directory: './'
      });
      console.log(`Found ${dirResults.length} files with directory input`);
      console.log(`Files found in directory scan:`);
      dirResults.forEach(result => console.log(` - ${result.filePath || result.source}`));
      
      // 3. Test lint method
      console.log('\n3. Testing lint method:');
      const lintResults = await module.sldsExecutor.lint({
        directory: './',
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
      
      // SARIF report
      console.log('a. Testing SARIF report generation:');
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
      
      // CSV report
      console.log('\nb. Testing CSV report generation:');
      const csvReportStream = await module.sldsExecutor.report({
        issues: lintResults,
        format: 'csv'
      });
      
      // Properly collect the stream data
      let csvReport = '';
      await new Promise(resolve => {
        csvReportStream.on('data', chunk => {
          csvReport += chunk.toString();
        });
        
        csvReportStream.on('end', () => {
          console.log(`Generated CSV report: ${csvReport.length} characters`);
          resolve();
        });
      });
      
      // 5. Test direct report generation from directory
      console.log('\n5. Testing direct report generation from directory:');
      const directReportStream = await module.sldsExecutor.report({
        directory: './',
        format: 'sarif'
      });
      
      // Properly collect the stream data
      let directReport = '';
      await new Promise(resolve => {
        directReportStream.on('data', chunk => {
          directReport += chunk.toString();
        });
        
        directReportStream.on('end', () => {
          console.log(`Generated direct report: ${directReport.length} characters`);
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