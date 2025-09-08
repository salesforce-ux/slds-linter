#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadSarifReport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return null;
  }
}

function extractHardcodedValuesSlds2(sarif, version) {
  if (!sarif?.runs?.[0]?.results) {
    return [];
  }

  return sarif.runs[0].results
    .filter(result => result.ruleId === 'slds/no-hardcoded-values-slds2')
    .map(result => ({
      file: result.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'unknown',
      line: result.locations?.[0]?.physicalLocation?.region?.startLine,
      column: result.locations?.[0]?.physicalLocation?.region?.startColumn,
      endColumn: result.locations?.[0]?.physicalLocation?.region?.endColumn,
      message: result.message?.text,
      level: result.level || 'error',
      version
    }));
}

function groupByFileAndLine(violations) {
  const grouped = {};
  violations.forEach(violation => {
    const key = `${violation.file}:${violation.line}:${violation.column}`;
    grouped[key] = violation;
  });
  return grouped;
}

function analyzeHardcodedValuesDifferences() {
  console.log('🔍 Analyzing slds/no-hardcoded-values-slds2 Differences\n');
  console.log('=' .repeat(80));

  // Load SARIF reports
  const reportsDir = path.join(__dirname, 'comparison-reports');
  const publishedPath = path.join(reportsDir, 'published-0.5.2.sarif');
  const localPath = path.join(reportsDir, 'local-current.sarif');

  const publishedSarif = loadSarifReport(publishedPath);
  const localSarif = loadSarifReport(localPath);

  if (!publishedSarif || !localSarif) {
    console.error('❌ Failed to load SARIF reports');
    return;
  }

  // Extract hardcoded values violations
  const publishedViolations = extractHardcodedValuesSlds2(publishedSarif, 'published');
  const localViolations = extractHardcodedValuesSlds2(localSarif, 'local');

  console.log(`📊 TOTAL VIOLATIONS:`);
  console.log(`  Published: ${publishedViolations.length} violations`);
  console.log(`  Local:     ${localViolations.length} violations`);
  console.log(`  Difference: ${localViolations.length - publishedViolations.length} (${localViolations.length < publishedViolations.length ? 'DECREASE' : 'INCREASE'})\n`);

  // Group by file and line for comparison
  const publishedGrouped = groupByFileAndLine(publishedViolations);
  const localGrouped = groupByFileAndLine(localViolations);

  // Find violations that are in published but NOT in local (the -20 difference)
  const removedViolations = [];
  const addedViolations = [];
  const unchangedViolations = [];

  Object.keys(publishedGrouped).forEach(key => {
    if (!localGrouped[key]) {
      removedViolations.push(publishedGrouped[key]);
    } else {
      unchangedViolations.push(publishedGrouped[key]);
    }
  });

  Object.keys(localGrouped).forEach(key => {
    if (!publishedGrouped[key]) {
      addedViolations.push(localGrouped[key]);
    }
  });

  // Group by file for better analysis
  function groupByFile(violations) {
    const grouped = {};
    violations.forEach(violation => {
      if (!grouped[violation.file]) {
        grouped[violation.file] = [];
      }
      grouped[violation.file].push(violation);
    });
    return grouped;
  }

  console.log(`❌ VIOLATIONS REMOVED IN LOCAL VERSION (${removedViolations.length}):`);
  if (removedViolations.length === 0) {
    console.log('   None found.\n');
  } else {
    const removedByFile = groupByFile(removedViolations);
    Object.keys(removedByFile).sort().forEach(file => {
      console.log(`\n  📄 ${file} (${removedByFile[file].length} removed):`);
      removedByFile[file].sort((a, b) => a.line - b.line).forEach(violation => {
        console.log(`     Line ${violation.line}:${violation.column} - ${violation.message}`);
      });
    });
    console.log();
  }

  console.log(`✅ VIOLATIONS ADDED IN LOCAL VERSION (${addedViolations.length}):`);
  if (addedViolations.length === 0) {
    console.log('   None found.\n');
  } else {
    const addedByFile = groupByFile(addedViolations);
    Object.keys(addedByFile).sort().forEach(file => {
      console.log(`\n  📄 ${file} (${addedByFile[file].length} added):`);
      addedByFile[file].sort((a, b) => a.line - b.line).forEach(violation => {
        console.log(`     Line ${violation.line}:${violation.column} - ${violation.message}`);
      });
    });
    console.log();
  }

  console.log(`🔄 NET CHANGE ANALYSIS:`);
  console.log(`  • Violations removed: ${removedViolations.length}`);
  console.log(`  • Violations added: ${addedViolations.length}`);
  console.log(`  • Net change: ${addedViolations.length - removedViolations.length}`);
  console.log(`  • Unchanged violations: ${unchangedViolations.length}`);

  // Analyze patterns in removed violations
  if (removedViolations.length > 0) {
    console.log(`\n🔍 ANALYSIS OF REMOVED VIOLATIONS:`);
    
    const valuePatterns = {};
    const messagePatterns = {};
    
    removedViolations.forEach(violation => {
      // Extract value from message
      const valueMatch = violation.message.match(/the ([^s]*\s*static value|#[a-fA-F0-9]+|[\d.]+(?:px|rem|em|%)?)/);
      if (valueMatch) {
        const value = valueMatch[1];
        valuePatterns[value] = (valuePatterns[value] || 0) + 1;
      }
      
      // Categorize message type
      if (violation.message.includes("There's no replacement")) {
        messagePatterns['no-replacement'] = (messagePatterns['no-replacement'] || 0) + 1;
      } else if (violation.message.includes("Consider replacing")) {
        messagePatterns['has-suggestions'] = (messagePatterns['has-suggestions'] || 0) + 1;
      }
    });
    
    console.log(`\n  📊 Common removed values:`);
    Object.entries(valuePatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([value, count]) => {
        console.log(`     ${value}: ${count} times`);
      });
    
    console.log(`\n  📊 Message types removed:`);
    Object.entries(messagePatterns).forEach(([type, count]) => {
      console.log(`     ${type}: ${count} violations`);
    });
  }

  console.log('\n' + '=' .repeat(80));
}

// Run the analysis
analyzeHardcodedValuesDifferences();

