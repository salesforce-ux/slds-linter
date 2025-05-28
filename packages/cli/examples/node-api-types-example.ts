/**
 * Example demonstrating proper TypeScript usage of the SLDS Linter Node API with types
 * 
 * This example shows how to import and use the API with proper TypeScript types
 */

// Method 1: Import directly from the root package (preferred)
import { 
  lint, 
  report, 
  LintConfig, 
  ReportConfig, 
  LintResult 
} from '@salesforce-ux/slds-linter';

// Method 2: Import from the executor module (alternative)
// import { 
//   lint, 
//   report, 
//   LintConfig, 
//   ReportConfig, 
//   LintResult 
// } from '@salesforce-ux/slds-linter/executor';

async function runTypedExample() {
  console.log('Running SLDS Linter with TypeScript types');
  
  // Define configuration with proper types
  const config: LintConfig = {
    directory: './src',
    fix: false
  };
  
  try {
    // Run linting with proper return type
    const results: LintResult[] = await lint(config);
    
    console.log(`Found ${results.length} files with issues`);
    
    // Display info about the first file with issues if any
    if (results.length > 0) {
      const firstResult = results[0];
      console.log(`File: ${firstResult.filePath}`);
      console.log(`Errors: ${firstResult.errors.length}`);
      console.log(`Warnings: ${firstResult.warnings.length}`);
      
      // Access typed properties of the first error if any
      if (firstResult.errors.length > 0) {
        const firstError = firstResult.errors[0];
        console.log(`Error at line ${firstError.line}:${firstError.column} - ${firstError.message} (${firstError.ruleId})`);
      }
    }
    
    // Generate a report with proper types
    const reportConfig: ReportConfig = {
      directory: './src',
      format: 'sarif'
    };
    
    // Generate a SARIF report using the results
    const reportStream = await report(reportConfig, results);
    
    // Handle the report stream
    let reportData = '';
    reportStream.on('data', chunk => {
      reportData += chunk;
    });
    
    reportStream.on('end', () => {
      console.log('Report generated successfully');
      // Optionally write to file or process further
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
runTypedExample(); 