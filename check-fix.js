#!/usr/bin/env node

import fs from 'fs';

try {
  const sarif = JSON.parse(fs.readFileSync('slds-linter-report.sarif', 'utf8'));
  const results = sarif.runs?.[0]?.results || [];
  
  console.log('🧪 Testing Percentage Fix:');
  console.log(`Total violations: ${results.length}`);
  
  const slds2Results = results.filter(r => r.ruleId === 'slds/no-hardcoded-values-slds2');
  console.log(`SLDS2 violations: ${slds2Results.length}`);
  
  slds2Results.forEach((result, i) => {
    console.log(`\n${i + 1}. Line ${result.locations?.[0]?.physicalLocation?.region?.startLine}`);
    console.log(`   Message: ${result.message?.text}`);
  });
  
  const percentageResults = slds2Results.filter(r => r.message?.text.includes('100%'));
  if (percentageResults.length > 0) {
    console.log('\n✅ SUCCESS! Percentage values are now being detected!');
  } else {
    console.log('\n❌ Still not detecting percentage values');
  }
  
} catch (error) {
  console.error('Error reading SARIF:', error.message);
}

