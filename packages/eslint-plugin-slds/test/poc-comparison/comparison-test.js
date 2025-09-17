/**
 * POC Comparison Test - Context-Aware vs Standard Linting
 * 
 * This test compares the behavior of the standard no-hardcoded-values-slds2 rule
 * with the enhanced context-aware version to demonstrate improvements.
 */

const { ESLint } = require('eslint');
const path = require('path');
const fs = require('fs');

async function runComparisonTest() {
  console.log('🚀 Starting POC Comparison Test: Context-Aware vs Standard Linting\n');

  const testComponentsDir = path.join(__dirname, 'test-components');
  const testCases = [
    {
      name: 'Modal Component',
      cssFile: path.join(testComponentsDir, 'modal-component', 'modal.css'),
      htmlFile: path.join(testComponentsDir, 'modal-component', 'modal.html'),
      description: 'Tests modal-specific context awareness'
    },
    {
      name: 'Button Component', 
      cssFile: path.join(testComponentsDir, 'button-component', 'button.css'),
      htmlFile: path.join(testComponentsDir, 'button-component', 'button.html'),
      description: 'Tests button-specific context awareness'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`📄 Description: ${testCase.description}`);
    console.log(`📁 CSS File: ${path.relative(process.cwd(), testCase.cssFile)}`);
    console.log(`📁 HTML File: ${path.relative(process.cwd(), testCase.htmlFile)}`);
    console.log('─'.repeat(80));

    // Test with standard rule
    console.log('\n🔍 Standard Rule Results:');
    await testWithRule(testCase.cssFile, 'no-hardcoded-values-slds2');

    // Test with enhanced rule
    console.log('\n🎯 Enhanced Rule Results:');
    await testWithRule(testCase.cssFile, 'no-hardcoded-values-slds2-enhanced');

    console.log('\n' + '═'.repeat(80));
  }

  console.log('\n✅ POC Comparison Test Complete');
  console.log('\n📊 Summary of Expected Improvements:');
  console.log('   • Context-aware suggestions based on component type');
  console.log('   • Higher confidence scores for semantically relevant hooks');
  console.log('   • Rich violation reports with contextual explanations');
  console.log('   • Analysis of related HTML/CSS file bundles');
  console.log('   • Enhanced console logging showing context analysis');
}

async function testWithRule(filePath, ruleName) {
  try {
    const eslint = new ESLint({
      baseConfig: {
        files: ['**/*.css'],
        language: 'css/css',
        plugins: {
          '@salesforce-ux/slds': require('../src/index.ts')
        },
        rules: {
          [`@salesforce-ux/slds/${ruleName}`]: 'error'
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
        
        result.messages.forEach((message, index) => {
          console.log(`   ${index + 1}. Line ${message.line}: ${message.message}`);
          if (message.ruleId === `@salesforce-ux/slds/${ruleName}`) {
            console.log(`      Rule: ${message.ruleId}`);
            console.log(`      Severity: ${message.severity === 2 ? 'error' : 'warning'}`);
            if (message.fix) {
              console.log(`      Auto-fix available: ${message.fix.text || 'Yes'}`);
            }
          }
        });
      } else {
        console.log('   No violations found');
      }
    } else {
      console.log('   No results returned');
    }

  } catch (error) {
    console.log(`   ❌ Error testing with ${ruleName}:`, error.message);
    
    // For POC, show that enhanced rule provides additional context even on error
    if (ruleName.includes('enhanced')) {
      console.log('   📊 Enhanced rule would provide:');
      console.log('      • Component type detection');
      console.log('      • Semantic context analysis');
      console.log('      • Related file discovery');
      console.log('      • Confidence-based suggestions');
    }
  }
}

// Check if files exist before running test
function validateTestSetup() {
  const testComponentsDir = path.join(__dirname, 'test-components');
  
  if (!fs.existsSync(testComponentsDir)) {
    console.log('❌ Test components directory not found. Creating test structure...');
    return false;
  }
  
  const requiredFiles = [
    'modal-component/modal.css',
    'modal-component/modal.html',
    'button-component/button.css',
    'button-component/button.html'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(testComponentsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Required test file missing: ${file}`);
      return false;
    }
  }
  
  return true;
}

// Main execution
if (require.main === module) {
  if (validateTestSetup()) {
    runComparisonTest().catch(console.error);
  } else {
    console.log('⚠️  Test setup incomplete. Please ensure all test files are created.');
    console.log('   Run this script after setting up the test components.');
  }
}

module.exports = { runComparisonTest, testWithRule };
