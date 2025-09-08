#!/usr/bin/env node

import fs from 'fs';

try {
  const sarif = JSON.parse(fs.readFileSync('test-output/slds-linter-report.sarif', 'utf8'));
  const results = sarif.runs?.[0]?.results || [];
  
  console.log('🧪 Test Results for demo/uplift-bugs.css:');
  console.log(`Total violations: ${results.length}`);
  
  const slds2Results = results.filter(r => r.ruleId === 'slds/no-hardcoded-values-slds2');
  console.log(`SLDS2 violations: ${slds2Results.length}`);
  
  // Look specifically for percentage values
  const percentageResults = slds2Results.filter(r => r.message?.text.includes('100%'));
  console.log(`100% violations: ${percentageResults.length}`);
  
  slds2Results.forEach((result, i) => {
    const line = result.locations?.[0]?.physicalLocation?.region?.startLine;
    const message = result.message?.text;
    if (message.includes('100%') || line >= 60 && line <= 68) {
      console.log(`\n${i + 1}. Line ${line}`);
      console.log(`   Message: ${message}`);
    }
  });
  
  if (percentageResults.length === 0) {
    console.log('\n❌ No 100% violations detected in uplift-bugs.css');
    console.log('   The published version detected 10 violations for 100% values.');
    console.log('   Lines 60-68 should have violations for border-radius: 100%');
  } else {
    console.log('\n✅ 100% violations detected');
  }
  
} catch (error) {
  console.error('Error reading SARIF:', error.message);
}

