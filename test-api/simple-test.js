// Simplest test for SLDS Linter Node API
console.log('Starting test script');

import('../packages/cli/build/executor/index.js')
  .then(module => {
    console.log('Module imported successfully');
    console.log('sldsExecutor available:', !!module.sldsExecutor);
    
    // Test linting on a specific file with known issues
    return module.sldsExecutor.lint({
      files: ['./test.css']
    })
    .then(results => {
      console.log(`Lint results: found ${results.length} files with issues`);
      
      if (results.length > 0) {
        console.log('Issues found in test.css:');
        results[0].warnings.forEach(warning => {
          console.log(` - Line ${warning.line}: ${warning.text}`);
        });
      }
      
      // Test report generation
      return module.sldsExecutor.report({
        issues: results,
        format: 'json'
      }).then(report => {
        console.log(`Generated report with ${report.length} characters`);
        console.log('Test completed successfully');
      });
    });
  })
  .catch(error => {
    console.error('Test failed with error:', error);
  }); 