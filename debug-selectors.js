#!/usr/bin/env node

import { toSelector, densificationProperties, colorProperties, fontProperties } from './packages/eslint-plugin-slds/build/utils/property-matcher.js';

console.log('🔍 Debugging Property Selectors\n');

console.log('densificationProperties:', densificationProperties);
console.log('\nGenerated density selector:');
console.log(toSelector(densificationProperties));

console.log('\ncolorProperties:', colorProperties);
console.log('\nGenerated color selector:');
console.log(toSelector(colorProperties));

console.log('\nfontProperties:', fontProperties);
console.log('\nGenerated font selector:');
console.log(toSelector(fontProperties));

// Check if specific properties would match
const testProperties = ['border-radius', 'width', 'margin', 'font-weight'];
console.log('\n📋 Testing property matches:');

testProperties.forEach(prop => {
  const densityMatch = densificationProperties.some(pattern => {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp('^' + regexPattern + '$').test(prop);
    }
    return pattern === prop;
  });
  
  const colorMatch = colorProperties.some(pattern => {
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp('^' + regexPattern + '$').test(prop);
    }
    return pattern === prop;
  });
  
  const fontMatch = fontProperties.includes(prop);
  
  console.log(`${prop}: density=${densityMatch}, color=${colorMatch}, font=${fontMatch}`);
});

