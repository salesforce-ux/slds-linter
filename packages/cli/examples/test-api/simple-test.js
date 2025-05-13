// Simplest test for SLDS Linter Node API
console.log('Starting test script');

// Updated import path for the new location
import('../../build/executor/index.js')
  .then(module => {
    console.log('Module imported successfully');
    console.log('sldsExecutor available:', !!module.sldsExecutor);
    
    // Test linting on current directory
    return module.sldsExecutor.lint({
      directory: './'
    })
    .then(results => {
      console.log(`Lint results: found ${results.length} files with issues`);
      
      if (results.length > 0) {
        console.log('Issues found:');
        results[0].warnings.forEach(warning => {
          // Parse the JSON message string
          try {
            const parsedMessage = JSON.parse(warning.message);
            console.log(` - Line ${warning.line}: ${parsedMessage.message}`);
          } catch (e) {
            // Fallback if not JSON or parsing fails
            console.log(` - Line ${warning.line}: ${warning.message}`);
          }
        });
      }
      
      // Test report generation
      return module.sldsExecutor.report({
        issues: results,
        format: 'sarif'
      }).then(report => {
        // Collect report data from the stream
        let reportData = '';
        
        report.on('data', chunk => {
          reportData += chunk.toString();
        });
        
        return new Promise(resolve => {
          report.on('end', () => {
            console.log(`Generated SARIF report with ${reportData.length} characters`);
            console.log('Test completed successfully');
            resolve(reportData);
          });
        });
      });
    });
  })
  .catch(error => {
    console.error('Test failed with error:', error);
  }); 