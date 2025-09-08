#!/usr/bin/env node

// Test the density dimension extraction directly
import { extractDimensionFromAST } from './packages/eslint-plugin-slds/build/rules/v9/no-hardcoded-values/handlers/densityHandler.js';

// Mock CSS AST nodes for testing
const testNodes = [
  { type: 'Dimension', value: '50', unit: '%' },
  { type: 'Dimension', value: '100', unit: 'px' },
  { type: 'Number', value: '700' },
  { type: 'Identifier', name: 'bold' }
];

console.log('🧪 Testing extractDimensionFromAST directly:\n');

testNodes.forEach((node, i) => {
  console.log(`Test ${i + 1}: ${JSON.stringify(node)}`);
  
  const result = extractDimensionFromAST(node, 'width');
  console.log(`Result: ${JSON.stringify(result)}\n`);
});

