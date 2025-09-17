#!/usr/bin/env node

/**
 * Enable Enhanced Rule for slds-linter CLI Testing
 * 
 * This script temporarily replaces the standard rule with the enhanced version
 * so you can test it through the slds-linter CLI.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Enabling Enhanced Rule for CLI Testing');
console.log('=========================================');

const indexPath = path.join(__dirname, 'src', 'index.ts');
const backupPath = path.join(__dirname, 'src', 'index.ts.backup');

/**
 * Backup and modify the index.ts file
 */
function enableEnhancedRule() {
  try {
    // Read current index.ts
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Create backup
    fs.writeFileSync(backupPath, indexContent);
    console.log('✅ Created backup: src/index.ts.backup');
    
    // Modify to use enhanced rule
    const modifiedContent = indexContent.replace(
      'import noHardcodedValuesSlds2 from \'./rules/v9/no-hardcoded-values/no-hardcoded-values-slds2\';',
      'import noHardcodedValuesSlds2 from \'./rules/v9/no-hardcoded-values/no-hardcoded-values-slds2-enhanced\';'
    );
    
    if (modifiedContent === indexContent) {
      console.log('❌ Could not find the import to replace');
      return false;
    }
    
    // Write modified content
    fs.writeFileSync(indexPath, modifiedContent);
    console.log('✅ Modified src/index.ts to use enhanced rule');
    
    return true;
    
  } catch (error) {
    console.log('❌ Error modifying index.ts:', error.message);
    return false;
  }
}

/**
 * Restore the original index.ts file
 */
function restoreOriginalRule() {
  try {
    if (!fs.existsSync(backupPath)) {
      console.log('❌ No backup found to restore');
      return false;
    }
    
    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    fs.writeFileSync(indexPath, backupContent);
    fs.unlinkSync(backupPath);
    
    console.log('✅ Restored original src/index.ts');
    console.log('✅ Removed backup file');
    
    return true;
    
  } catch (error) {
    console.log('❌ Error restoring index.ts:', error.message);
    return false;
  }
}

/**
 * Show usage instructions
 */
function showInstructions() {
  console.log('\n📋 How to Test Enhanced Rule with slds-linter');
  console.log('==============================================');
  console.log('');
  console.log('1️⃣ Enable enhanced rule:');
  console.log('   node enable-enhanced-rule.js enable');
  console.log('');
  console.log('2️⃣ Rebuild the plugin:');
  console.log('   npm run build');
  console.log('');
  console.log('3️⃣ Test with slds-linter:');
  console.log('   cd ../../..');
  console.log('   npx slds-linter lint packages/eslint-plugin-slds/test/poc-comparison');
  console.log('');
  console.log('4️⃣ Restore original rule:');
  console.log('   cd packages/eslint-plugin-slds');
  console.log('   node enable-enhanced-rule.js restore');
  console.log('');
  console.log('⚠️  Important: Always restore after testing to avoid breaking other tests');
}

/**
 * Main execution
 */
function main() {
  const command = process.argv[2];
  
  if (command === 'enable') {
    console.log('🔧 Enabling enhanced rule for CLI testing...\n');
    
    if (enableEnhancedRule()) {
      console.log('\n✅ Enhanced rule enabled successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. npm run build');
      console.log('   2. cd ../../.. && npx slds-linter lint packages/eslint-plugin-slds/test/poc-comparison');
      console.log('   3. cd packages/eslint-plugin-slds && node enable-enhanced-rule.js restore');
    } else {
      console.log('\n❌ Failed to enable enhanced rule');
    }
    
  } else if (command === 'restore') {
    console.log('🔄 Restoring original rule...\n');
    
    if (restoreOriginalRule()) {
      console.log('\n✅ Original rule restored successfully!');
      console.log('   You may want to run: npm run build');
    } else {
      console.log('\n❌ Failed to restore original rule');
    }
    
  } else {
    console.log('❌ Invalid command. Use "enable" or "restore"');
    showInstructions();
  }
}

if (require.main === module) {
  main();
}

module.exports = { enableEnhancedRule, restoreOriginalRule };
