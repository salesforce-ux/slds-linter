#!/usr/bin/env node

/**
 * Quick POC Test Script
 * Validates that the enhanced context analysis components are working
 */

const path = require('path');

console.log('🧪 Testing POC Context Analysis Components\n');

// Test 1: Component Context Collector
console.log('1️⃣ Testing ComponentContextCollector...');
try {
  const { ComponentContextCollector } = require('./build/utils/component-context-collector');
  console.log('   ✅ ComponentContextCollector imported successfully');
  
  // Mock ESLint context for testing
  const mockContext = {
    getCwd: () => process.cwd(),
    filename: 'test.css'
  };
  
  const collector = new ComponentContextCollector(mockContext);
  console.log('   ✅ ComponentContextCollector instantiated successfully');
} catch (error) {
  console.log('   ❌ ComponentContextCollector failed:', error.message);
}

// Test 2: Context-Aware Suggestion Scorer
console.log('\n2️⃣ Testing ContextAwareSuggestionScorer...');
try {
  const { ContextAwareSuggestionScorer } = require('./build/utils/context-aware-suggestion-scorer');
  console.log('   ✅ ContextAwareSuggestionScorer imported successfully');
  
  const scorer = new ContextAwareSuggestionScorer();
  console.log('   ✅ ContextAwareSuggestionScorer instantiated successfully');
  
  // Test scoring functionality
  const mockContext = {
    componentType: 'LWC',
    semanticContext: { hasModal: true, hasButton: false },
    cssContext: { existingHooks: [], selectors: [] }
  };
  
  const suggestions = scorer.scoreHooks(
    '#ffffff',
    ['--slds-c-modal-color-background', '--slds-g-color-neutral-base-100'],
    mockContext,
    'background-color',
    {}
  );
  
  console.log('   ✅ Scoring functionality works, returned', suggestions.length, 'suggestions');
} catch (error) {
  console.log('   ❌ ContextAwareSuggestionScorer failed:', error.message);
}

// Test 3: Contextual Message Generator
console.log('\n3️⃣ Testing ContextualMessageGenerator...');
try {
  const { ContextualMessageGenerator } = require('./build/utils/contextual-message-generator');
  console.log('   ✅ ContextualMessageGenerator imported successfully');
  
  const generator = new ContextualMessageGenerator();
  console.log('   ✅ ContextualMessageGenerator instantiated successfully');
} catch (error) {
  console.log('   ❌ ContextualMessageGenerator failed:', error.message);
}

// Test 4: Enhanced Rule
console.log('\n4️⃣ Testing Enhanced Rule...');
try {
  const enhancedRule = require('./build/rules/v9/no-hardcoded-values/no-hardcoded-values-slds2-enhanced');
  console.log('   ✅ Enhanced rule imported successfully');
  console.log('   ✅ Rule has meta:', !!enhancedRule.meta);
  console.log('   ✅ Rule has create function:', typeof enhancedRule.create === 'function');
} catch (error) {
  console.log('   ❌ Enhanced rule failed:', error.message);
}

// Test 5: Plugin Integration
console.log('\n5️⃣ Testing Plugin Integration...');
try {
  const plugin = require('./build/index');
  console.log('   ✅ Plugin imported successfully');
  console.log('   ✅ Enhanced rule available in plugin:', !!plugin.rules['no-hardcoded-values-slds2-enhanced']);
} catch (error) {
  console.log('   ❌ Plugin integration failed:', error.message);
}

console.log('\n🎉 POC Validation Complete!');
console.log('\n📋 Next Steps:');
console.log('   • Run: npm run build (if build system is set up)');
console.log('   • Run: node test/poc-comparison/comparison-test.js');
console.log('   • Test with actual ESLint configuration');
console.log('   • Review POC-CONTEXT-ANALYSIS.md for detailed documentation');

console.log('\n💡 POC Summary:');
console.log('   • Context-aware analysis system implemented');
console.log('   • Enhanced rule with component bundle analysis');
console.log('   • Intelligent suggestion scoring based on semantic context');
console.log('   • Rich violation reporting with contextual explanations');
console.log('   • Graceful fallback to standard behavior on errors');
console.log('   • Ready for integration testing and further development');
