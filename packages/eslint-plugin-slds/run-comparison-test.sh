#!/bin/bash

# 🧪 SLDS2 Context-Aware Rule Comparison Test Script
# This script runs a comprehensive comparison between standard and enhanced rules

set -e

echo "🚀 SLDS2 Context-Aware vs Standard Rule Comparison Test"
echo "========================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify environment
echo -e "${BLUE}Step 1: Verifying Environment${NC}"
echo "----------------------------------------"

# Check if built
if [ ! -d "build" ]; then
    echo -e "${YELLOW}Building project...${NC}"
    npm run build
fi

# Verify POC components
echo -e "${GREEN}✓${NC} Running POC validation..."
node test-poc.js | grep -E "(✅|❌)" | head -5

echo ""

# Step 2: Run specific scenarios test
echo -e "${BLUE}Step 2: Running Specific Test Scenarios${NC}"
echo "----------------------------------------"
echo "Testing 5 targeted scenarios to highlight improvements..."
echo ""

node test-specific-scenarios.js

echo ""

# Step 3: Manual component tests
echo -e "${BLUE}Step 3: Manual Component Testing${NC}"
echo "----------------------------------------"

echo -e "${YELLOW}Testing Modal Component:${NC}"
echo "Standard rule:"
npx eslint test/poc-comparison/test-components/modal-component/modal.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2":"error"}}' \
  --format compact 2>/dev/null | head -5 || echo "No violations or rule not working"

echo ""
echo "Enhanced rule:"
npx eslint test/poc-comparison/test-components/modal-component/modal.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced":["error",{"enableContextAnalysis":true}]}}' \
  --format compact 2>/dev/null | head -5 || echo "Enhanced rule analysis (may show context logs)"

echo ""

echo -e "${YELLOW}Testing Button Component:${NC}"
echo "Standard rule:"
npx eslint test/poc-comparison/test-components/button-component/button.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2":"error"}}' \
  --format compact 2>/dev/null | head -5 || echo "No violations or rule not working"

echo ""
echo "Enhanced rule:"
npx eslint test/poc-comparison/test-components/button-component/button.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced":["error",{"enableContextAnalysis":true}]}}' \
  --format compact 2>/dev/null | head -5 || echo "Enhanced rule analysis (may show context logs)"

echo ""

# Step 4: Performance test
echo -e "${BLUE}Step 4: Performance Comparison${NC}"
echo "----------------------------------------"

echo -e "${YELLOW}Performance Test - Standard Rule:${NC}"
time npx eslint test/poc-comparison/test-components/**/*.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2":"error"}}' \
  --format compact >/dev/null 2>&1 || echo "Standard rule completed"

echo ""
echo -e "${YELLOW}Performance Test - Enhanced Rule:${NC}"
time npx eslint test/poc-comparison/test-components/**/*.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced":["error",{"enableContextAnalysis":true}]}}' \
  --format compact >/dev/null 2>&1 || echo "Enhanced rule completed"

echo ""

# Step 5: Graceful degradation test
echo -e "${BLUE}Step 5: Graceful Degradation Test${NC}"
echo "----------------------------------------"

# Create isolated test file
mkdir -p test/isolated
echo ".test { background-color: #ffffff; color: #333333; }" > test/isolated/isolated.css

echo -e "${YELLOW}Testing enhanced rule with isolated CSS (no HTML context):${NC}"
npx eslint test/isolated/isolated.css \
  --no-eslintrc \
  --config '{"plugins":["@salesforce-ux/slds"],"rules":{"@salesforce-ux/slds/no-hardcoded-values-slds2-enhanced":["error",{"enableContextAnalysis":true}]}}' \
  --format compact 2>/dev/null || echo "Enhanced rule handled isolation gracefully"

# Cleanup
rm -rf test/isolated

echo ""

# Summary
echo -e "${BLUE}🎉 Test Comparison Complete!${NC}"
echo "========================================================"
echo ""
echo -e "${GREEN}Key Things to Look For:${NC}"
echo "1. Enhanced rule should provide more contextual suggestions"
echo "2. Enhanced rule should show component-specific hooks"
echo "3. Enhanced rule should have reasonable performance overhead"
echo "4. Enhanced rule should work even without HTML context"
echo ""
echo -e "${YELLOW}📊 Expected Improvements:${NC}"
echo "• Context-aware suggestions (modal → modal hooks)"
echo "• Higher confidence scores for relevant suggestions"
echo "• Rich violation messages with component context"
echo "• Educational guidance for SLDS2 best practices"
echo ""
echo -e "${BLUE}📁 Files tested:${NC}"
echo "• test/poc-comparison/test-components/modal-component/"
echo "• test/poc-comparison/test-components/button-component/"
echo "• Generated scenario files (cleaned up automatically)"
echo ""
echo -e "${GREEN}✅ Ready for evaluation!${NC}"
echo "Review the output above to compare standard vs enhanced rule behavior."
