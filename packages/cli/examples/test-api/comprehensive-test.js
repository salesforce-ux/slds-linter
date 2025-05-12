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
      
      // 2. Test batchFiles method
      console.log('\n2. Testing batchFiles method:');
      const batches = module.sldsExecutor.batchFiles(config);
      console.log(`Created ${batches.length} batches`);
      
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
        console.log(`File: ${firstFile.source}`);
        console.log(`Warnings: ${firstFile.warnings.length}`);
        
        firstFile.warnings.slice(0, 3).forEach((warning, i) => {
          console.log(`  ${i+1}. Line ${warning.line}, col ${warning.column}: ${warning.text}`);
        });
        
        if (firstFile.warnings.length > 3) {
          console.log(`  ... and ${firstFile.warnings.length - 3} more warnings`);
        }
      }
      
      // 4. Test report method
      console.log('\n4. Testing report method:');
      // JSON report
      const jsonReport = await module.sldsExecutor.report({
        issues: lintResults,
        format: 'json'
      });
      console.log(`Generated JSON report: ${jsonReport.length} characters`);
      
      // SARIF report
      const sarifReport = await module.sldsExecutor.report({
        issues: lintResults,
        format: 'sarif'
      });
      console.log(`Generated SARIF report: ${sarifReport.length} characters`);
      
      console.log('\nComprehensive API test completed successfully');
    } catch (error) {
      console.error('Test error:', error);
    }
  })
  .catch(error => {
    console.error('Module import error:', error);
  }); 