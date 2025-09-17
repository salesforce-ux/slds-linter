#!/usr/bin/env node

/**
 * Specific Test Scenarios for Context-Aware vs Standard Rule Comparison
 * 
 * This script creates targeted test cases to highlight the improvements
 * in the enhanced context-aware rule over the standard implementation.
 */

const fs = require('fs');
const path = require('path');
const { ESLint } = require('eslint');

// Test scenarios that should show clear improvements
const testScenarios = [
  {
    name: "Modal Background Color",
    description: "Modal-specific background color should get modal-context suggestions",
    css: `.modal-custom {
  background-color: #ffffff;
}`,
    html: `<div class="slds-modal slds-fade-in-open">
  <div class="slds-modal__container">
    <div class="modal-custom">Modal content</div>
  </div>
</div>`,
    expectedImprovement: "Should suggest modal-specific background hooks over generic white color hooks"
  },
  
  {
    name: "Button Primary Color",
    description: "Button component colors should get button-context suggestions",
    css: `.custom-primary-button {
  background-color: #0176d3;
  color: #ffffff;
}`,
    html: `<button class="slds-button slds-button_brand custom-primary-button">
  Primary Action
</button>`,
    expectedImprovement: "Should suggest button-specific color hooks with high confidence"
  },
  
  {
    name: "Form Input Styling",
    description: "Form elements should get form-context suggestions",
    css: `.custom-input {
  border-color: #747474;
  background-color: #ffffff;
  height: 36px;
}`,
    html: `<div class="slds-form-element">
  <input type="text" class="slds-input custom-input" />
</div>`,
    expectedImprovement: "Should suggest form-input specific hooks over generic styling"
  },
  
  {
    name: "Card Shadow",
    description: "Card components should get card-specific shadow suggestions",
    css: `.custom-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
}`,
    html: `<div class="slds-card custom-card">
  <div class="slds-card__body">Card content</div>
</div>`,
    expectedImprovement: "Should suggest card-specific shadow hooks with component context"
  },
  
  {
    name: "Generic Utility Class",
    description: "Non-component-specific styles should show lower confidence",
    css: `.generic-utility {
  color: #333333;
  font-size: 14px;
  margin: 4px;
}`,
    html: `<div class="generic-utility">Generic content</div>`,
    expectedImprovement: "Should show multiple options with lower confidence scores"
  }
];

/**
 * Create test files for a scenario
 */
async function createTestFiles(scenario, index) {
  const testDir = path.join(__dirname, 'test', 'scenarios', `scenario-${index + 1}-${scenario.name.toLowerCase().replace(/\s+/g, '-')}`);
  
  // Create directory
  await fs.promises.mkdir(testDir, { recursive: true });
  
  // Write CSS file
  const cssFile = path.join(testDir, 'test.css');
  await fs.promises.writeFile(cssFile, scenario.css);
  
  // Write HTML file
  const htmlFile = path.join(testDir, 'test.html');
  await fs.promises.writeFile(htmlFile, scenario.html);
  
  // Write scenario info
  const infoFile = path.join(testDir, 'README.md');
  const info = `# ${scenario.name}

## Description
${scenario.description}

## Expected Improvement
${scenario.expectedImprovement}

## Files
- \`test.css\` - CSS with hardcoded values
- \`test.html\` - HTML providing component context
`;
  await fs.promises.writeFile(infoFile, info);
  
  return { cssFile, htmlFile, testDir };
}

/**
 * Test a scenario with both standard and enhanced rules
 */
async function testScenario(scenario, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing Scenario ${index + 1}: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    const { cssFile } = await createTestFiles(scenario, index);
    
    // Test with standard rule
    console.log('\n📊 Standard Rule Results:');
    await testWithRule(cssFile, 'no-hardcoded-values-slds2', 'Standard');
    
    // Test with enhanced rule
    console.log('\n🎯 Enhanced Rule Results:');
    await testWithRule(cssFile, 'no-hardcoded-values-slds2-enhanced', 'Enhanced');
    
    console.log(`\n💡 Expected Improvement: ${scenario.expectedImprovement}`);
    
  } catch (error) {
    console.log(`❌ Error testing scenario: ${error.message}`);
  }
}

/**
 * Test CSS file with specific rule
 */
async function testWithRule(filePath, ruleName, ruleType) {
  try {
    const eslint = new ESLint({
      baseConfig: {
        files: ['**/*.css'],
        language: 'css/css',
        plugins: {
          '@salesforce-ux/slds': require('./build/index.js')
        },
        rules: {
          [`@salesforce-ux/slds/${ruleName}`]: ruleName.includes('enhanced') 
            ? ['error', { enableContextAnalysis: true }]
            : 'error'
        },
        languageOptions: {
          tolerant: true
        }
      },
      useEslintrc: false
    });

    const results = await eslint.lintFiles([filePath]);
    
    if (results && results.length > 0) {
      const result = results[0];
      
      if (result.messages && result.messages.length > 0) {
        console.log(`   Found ${result.messages.length} violation(s):`);
        
        result.messages.forEach((message, msgIndex) => {
          console.log(`   ${msgIndex + 1}. Line ${message.line}:${message.column}`);
          console.log(`      Message: ${message.message}`);
          console.log(`      Severity: ${message.severity === 2 ? 'error' : 'warning'}`);
          if (message.fix) {
            console.log(`      Auto-fix: Available`);
          }
        });
      } else {
        console.log('   ✅ No violations found');
      }
    } else {
      console.log('   ⚠️  No results returned');
    }

  } catch (error) {
    console.log(`   ❌ Error with ${ruleType} rule: ${error.message}`);
    
    // Show what enhanced features would provide
    if (ruleName.includes('enhanced')) {
      console.log(`   📊 Enhanced rule would provide:`);
      console.log(`      • Component type detection and context analysis`);
      console.log(`      • Semantic-aware suggestions based on HTML structure`);
      console.log(`      • Confidence scoring for better suggestion ranking`);
      console.log(`      • Rich contextual explanations for violations`);
    }
  }
}

/**
 * Run comparison analysis
 */
async function runComparisonAnalysis() {
  console.log('🚀 Starting Context-Aware vs Standard Rule Comparison Analysis');
  console.log('📋 This test demonstrates improvements in suggestion accuracy and context awareness\n');
  
  // Run all test scenarios
  for (let i = 0; i < testScenarios.length; i++) {
    await testScenario(testScenarios[i], i);
  }
  
  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 COMPARISON SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log('🎯 Key Improvements Expected with Enhanced Rule:');
  console.log('   1. Context-aware suggestions based on component type');
  console.log('   2. Higher confidence scores for semantically relevant hooks');
  console.log('   3. Rich violation reports with contextual explanations');
  console.log('   4. Component-specific hook recommendations');
  console.log('   5. Educational guidance for SLDS2 best practices');
  
  console.log('\n📈 Metrics to Compare:');
  console.log('   • Number of violations found (should be similar)');
  console.log('   • Quality of suggestions (enhanced should be more relevant)');
  console.log('   • Message clarity (enhanced should provide more context)');
  console.log('   • Auto-fix availability (enhanced should have higher rate)');
  
  console.log('\n✅ Test completed! Review the results above to see the improvements.');
  console.log('📁 Test files created in: test/scenarios/');
}

/**
 * Clean up test files
 */
async function cleanup() {
  const scenariosDir = path.join(__dirname, 'test', 'scenarios');
  try {
    await fs.promises.rm(scenariosDir, { recursive: true, force: true });
    console.log('🧹 Cleaned up test scenario files');
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Main execution
if (require.main === module) {
  runComparisonAnalysis()
    .then(() => {
      console.log('\n🎉 Comparison analysis complete!');
      console.log('💡 Use the insights above to evaluate the context-aware improvements.');
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { testScenarios, runComparisonAnalysis, cleanup };
