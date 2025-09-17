# 📋 Step-by-Step Testing Guide: Context-Aware vs Standard SLDS2 Rules

This guide will help you test and compare the improvements between the existing `no-hardcoded-values-slds2` rule and the enhanced context-aware version.

## 🎯 **Testing Objectives**

1. **Compare suggestion accuracy** between standard and enhanced rules
2. **Measure context awareness** in different component scenarios
3. **Evaluate user experience improvements** in violation reporting
4. **Validate performance** and graceful fallback behavior

## 📝 **Step 1: Prepare Test Environment**

### 1.1 Verify POC Build Status
```bash
cd packages/eslint-plugin-slds

# Ensure everything is built
npm run build

# Verify POC components work
node test-poc.js
```

**Expected Output:**
```
🧪 Testing POC Context Analysis Components
1️⃣ Testing ComponentContextCollector...
   ✅ ComponentContextCollector imported successfully
   ✅ ComponentContextCollector instantiated successfully
[... other components should pass ...]
```

### 1.2 Create Test Configuration Files
```bash
# Create ESLint config for standard rule testing
cat > .eslintrc.standard.js << 'EOF'
module.exports = {
  plugins: ['@salesforce-ux/slds'],
  rules: {
    '@salesforce-ux/slds/no-hardcoded-values-slds2': 'error'
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  }
};
EOF

# Create ESLint config for enhanced rule testing
cat > .eslintrc.enhanced.js << 'EOF'
module.exports = {
  plugins: ['@salesforce-ux/slds'],
  rules: {
    '@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced': ['error', {
      enableContextAnalysis: true
    }]
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  }
};
EOF
```

## 🧪 **Step 2: Run Comparative Tests**

### 2.1 Test Modal Component Context
```bash
echo "🔍 Testing Modal Component..."

# Test with standard rule
echo "📊 Standard Rule Results:"
npx eslint test/poc-comparison/test-components/modal-component/modal.css \
  --config .eslintrc.standard.js \
  --format compact

echo ""
echo "🎯 Enhanced Rule Results:"
npx eslint test/poc-comparison/test-components/modal-component/modal.css \
  --config .eslintrc.enhanced.js \
  --format compact
```

### 2.2 Test Button Component Context
```bash
echo "🔍 Testing Button Component..."

# Test with standard rule
echo "📊 Standard Rule Results:"
npx eslint test/poc-comparison/test-components/button-component/button.css \
  --config .eslintrc.standard.js \
  --format compact

echo ""
echo "🎯 Enhanced Rule Results:"
npx eslint test/poc-comparison/test-components/button-component/button.css \
  --config .eslintrc.enhanced.js \
  --format compact
```

### 2.3 Run Automated Comparison Test
```bash
echo "🚀 Running Automated Comparison Test..."
node test/poc-comparison/comparison-test.js
```

## 📊 **Step 3: Run Specific Test Scenarios**

### 3.1 Run Targeted Comparison Tests
```bash
echo "🧪 Running Specific Test Scenarios..."
node test-specific-scenarios.js
```

This will test 5 specific scenarios:
1. **Modal Background Color** - Should suggest modal-specific hooks
2. **Button Primary Color** - Should get button-context suggestions  
3. **Form Input Styling** - Should get form-specific recommendations
4. **Card Shadow** - Should suggest card-specific shadow hooks
5. **Generic Utility** - Should show multiple options with lower confidence

### 3.2 Manual Verification Steps

#### Test Individual Files
```bash
# Test modal component
echo "Testing Modal Component Context..."
npx eslint test/poc-comparison/test-components/modal-component/modal.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2":"error"}}' \
  --format compact

echo "Enhanced version:"
npx eslint test/poc-comparison/test-components/modal-component/modal.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced":["error",{"enableContextAnalysis":true}]}}' \
  --format compact
```

#### Test Button Component
```bash
# Test button component
echo "Testing Button Component Context..."
npx eslint test/poc-comparison/test-components/button-component/button.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2":"error"}}' \
  --format compact

echo "Enhanced version:"
npx eslint test/poc-comparison/test-components/button-component/button.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced":["error",{"enableContextAnalysis":true}]}}' \
  --format compact
```

## 🔍 **Step 4: What to Look For**

### 4.1 Expected Improvements in Enhanced Rule

| Aspect | Standard Rule | Enhanced Rule |
|--------|---------------|---------------|
| **Suggestion Relevance** | Generic hooks for `#ffffff` | Modal-specific `--slds-c-modal-color-background` |
| **Confidence Level** | No confidence indication | 85% confidence based on context |
| **Message Quality** | "Replace #ffffff with SLDS2 hook" | "Replace #ffffff with --slds-c-modal-color-background (modal component context)" |
| **Context Awareness** | Property-based only | Component type + semantic analysis |
| **Auto-fix Rate** | Basic pattern matching | High-confidence context-driven fixes |

### 4.2 Key Metrics to Compare

#### Message Quality
- **Standard**: `Consider replacing '#ffffff' with SLDS2 styling hook`
- **Enhanced**: `Replace '#ffffff' with '--slds-c-modal-color-background' (modal component context). 85% confidence based on component contains modal elements`

#### Suggestion Accuracy
- **Standard**: May suggest generic color hooks
- **Enhanced**: Prioritizes component-specific hooks based on HTML context

#### Contextual Information
- **Standard**: No component context
- **Enhanced**: Shows component type, related files, confidence scores

## 📈 **Step 5: Performance Testing**

### 5.1 Test Performance Impact
```bash
echo "⏱️ Testing Performance Impact..."

# Time standard rule
time npx eslint test/poc-comparison/test-components/**/*.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2":"error"}}' \
  --format compact

# Time enhanced rule
time npx eslint test/poc-comparison/test-components/**/*.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced":["error",{"enableContextAnalysis":true}]}}' \
  --format compact
```

### 5.2 Test Graceful Degradation
```bash
# Test with missing HTML files (should fallback gracefully)
echo "🛡️ Testing Graceful Degradation..."
mkdir -p test/isolated
echo ".test { background-color: #ffffff; }" > test/isolated/isolated.css

npx eslint test/isolated/isolated.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced":["error",{"enableContextAnalysis":true}]}}' \
  --format compact

# Should work without errors, falling back to standard behavior
```

## 📋 **Step 6: Document Results**

### 6.1 Create Test Report
```bash
# Create a comprehensive test report
cat > test-results-$(date +%Y%m%d-%H%M%S).md << 'EOF'
# SLDS2 Context-Aware Rule Test Results

## Test Date
$(date)

## Environment
- Node.js: $(node --version)
- ESLint: $(npx eslint --version)
- Plugin Version: $(grep '"version"' package.json | cut -d'"' -f4)

## Test Results

### Modal Component Test
[Paste results here]

### Button Component Test  
[Paste results here]

### Performance Comparison
[Paste timing results here]

## Conclusions
[Document your observations]
EOF
```

### 6.2 Key Questions to Answer

1. **Accuracy**: Are the enhanced rule suggestions more relevant to the component context?
2. **Confidence**: Do the confidence scores help prioritize the best suggestions?
3. **Messages**: Are the enhanced messages more helpful for developers?
4. **Performance**: Is the context analysis overhead acceptable?
5. **Fallback**: Does the rule work correctly when context analysis fails?

## 🎯 **Step 7: Quick Start Command**

For a quick comparison test, run:
```bash
# One-command test
node test-specific-scenarios.js 2>&1 | tee comparison-results.log
```

This will:
- Test 5 specific scenarios
- Show side-by-side comparisons
- Generate detailed output
- Save results to a log file

## ✅ **Expected Outcomes**

After running these tests, you should see:

1. **Better Suggestions**: Enhanced rule provides more contextually relevant hook suggestions
2. **Higher Confidence**: Confidence scores help identify the best suggestions
3. **Richer Messages**: More informative error messages with context explanations
4. **Graceful Fallback**: Enhanced rule works even when context analysis fails
5. **Reasonable Performance**: Context analysis doesn't significantly slow down linting

## 🚀 **Next Steps**

1. Run the tests and document results
2. Compare suggestion quality between rules
3. Measure performance impact
4. Test with real-world SLDS2 migration projects
5. Gather feedback from developers using the enhanced rule
