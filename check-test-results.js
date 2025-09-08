#!/usr/bin/env node

import fs from 'fs';

try {
  const sarif = JSON.parse(fs.readFileSync('slds-linter-report.sarif', 'utf8'));
  const results = sarif.runs?.[0]?.results || [];
  
  console.log('🧪 Test Results for test-percentage.css:');
  console.log(`Total violations: ${results.length}`);
  
  const slds2Results = results.filter(r => r.ruleId === 'slds/no-hardcoded-values-slds2');
  console.log(`SLDS2 violations: ${slds2Results.length}`);
  
  slds2Results.forEach((result, i) => {
    console.log(`\n${i + 1}. Line ${result.locations?.[0]?.physicalLocation?.region?.startLine}`);
    console.log(`   Message: ${result.message?.text}`);
  });
  
  if (slds2Results.length === 0) {
    console.log('\n❌ No SLDS2 violations detected - our fixes may not be working');
  } else {
    console.log('\n✅ SLDS2 violations detected - let\'s check if they include percentage values');
  }
  
} catch (error) {
  console.error('Error reading SARIF:', error.message);
}

