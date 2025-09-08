#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create output directory
const outputDir = path.join(__dirname, 'comparison-reports');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Function to discover all lintable files in demo directory
function discoverDemoFiles() {
  const demoDir = path.join(__dirname, 'demo');
  const files = [];
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(__dirname, fullPath);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        // Include CSS, HTML, and CMP files
        if (entry.name.match(/\.(css|html|cmp)$/i)) {
          files.push(relativePath);
        }
      }
    }
  }
  
  scanDirectory(demoDir);
  return files.sort();
}

// Function to load and parse SARIF report
function loadSarifReport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return null;
  }
}

// Function to extract rules and results from SARIF
function extractSarifData(sarif) {
  if (!sarif?.runs?.[0]) {
    return { rules: [], results: [], toolInfo: {} };
  }

  const run = sarif.runs[0];
  
  return {
    rules: run.tool?.driver?.rules || [],
    results: run.results || [],
    toolInfo: {
      name: run.tool?.driver?.name,
      version: run.tool?.driver?.version || run.tool?.driver?.semanticVersion,
      informationUri: run.tool?.driver?.informationUri
    }
  };
}

// Function to group results by rule and file
function groupResultsByRuleAndFile(results) {
  const grouped = {};
  
  results.forEach(result => {
    const ruleId = result.ruleId || 'unknown';
    const file = result.locations?.[0]?.physicalLocation?.artifactLocation?.uri || 'unknown';
    
    if (!grouped[ruleId]) {
      grouped[ruleId] = {};
    }
    if (!grouped[ruleId][file]) {
      grouped[ruleId][file] = [];
    }
    
    grouped[ruleId][file].push({
      line: result.locations?.[0]?.physicalLocation?.region?.startLine,
      column: result.locations?.[0]?.physicalLocation?.region?.startColumn,
      message: result.message?.text,
      level: result.level || 'error'
    });
  });
  
  return grouped;
}

// Function to perform detailed comparison
function compareReports(publishedData, localData, publishedPath, localPath) {
  console.log('\n' + '='.repeat(100));
  console.log('📊 DETAILED SARIF COMPARISON REPORT');
  console.log('='.repeat(100));
  
  // Tool information
  console.log('\n📦 TOOL VERSIONS:');
  console.log(`  Published (0.5.2): ${publishedData.toolInfo.name} v${publishedData.toolInfo.version}`);
  console.log(`  Local Current:     ${localData.toolInfo.name} v${localData.toolInfo.version}`);
  console.log(`  Published URI:     ${publishedData.toolInfo.informationUri || 'N/A'}`);
  console.log(`  Local URI:         ${localData.toolInfo.informationUri || 'N/A'}`);
  
  // Rules comparison
  console.log('\n📋 AVAILABLE RULES:');
  const publishedRuleIds = new Set(publishedData.rules.map(r => r.id));
  const localRuleIds = new Set(localData.rules.map(r => r.id));
  const allRuleIds = new Set([...publishedRuleIds, ...localRuleIds]);
  
  console.log(`  Published: ${publishedRuleIds.size} rules`);
  console.log(`  Local:     ${localRuleIds.size} rules`);
  
  // New rules in local
  const newRules = [...localRuleIds].filter(id => !publishedRuleIds.has(id));
  if (newRules.length > 0) {
    console.log(`\n✨ NEW RULES IN LOCAL (${newRules.length}):`);
    newRules.forEach(rule => console.log(`    + ${rule}`));
  }
  
  // Removed rules
  const removedRules = [...publishedRuleIds].filter(id => !localRuleIds.has(id));
  if (removedRules.length > 0) {
    console.log(`\n❌ REMOVED RULES IN LOCAL (${removedRules.length}):`);
    removedRules.forEach(rule => console.log(`    - ${rule}`));
  }
  
  // Results comparison
  console.log('\n🐛 TOTAL ISSUES FOUND:');
  console.log(`  Published: ${publishedData.results.length} total issues`);
  console.log(`  Local:     ${localData.results.length} total issues`);
  const issueDiff = localData.results.length - publishedData.results.length;
  const diffIndicator = issueDiff > 0 ? `(+${issueDiff})` : issueDiff < 0 ? `(${issueDiff})` : '(no change)';
  console.log(`  Difference: ${diffIndicator}`);
  
  // Group results by rule and file
  const publishedByRule = groupResultsByRuleAndFile(publishedData.results);
  const localByRule = groupResultsByRuleAndFile(localData.results);
  
  // Per-rule comparison
  console.log('\n📊 ISSUES BY RULE:');
  console.log('  Rule ID'.padEnd(50) + '| Published | Local   | Diff    | Files');
  console.log('  ' + '-'.repeat(95));
  
  [...allRuleIds].sort().forEach(ruleId => {
    const pubCount = publishedByRule[ruleId] ? 
      Object.values(publishedByRule[ruleId]).reduce((sum, issues) => sum + issues.length, 0) : 0;
    const localCount = localByRule[ruleId] ? 
      Object.values(localByRule[ruleId]).reduce((sum, issues) => sum + issues.length, 0) : 0;
    const diff = localCount - pubCount;
    const diffStr = diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : '(=)';
    
    const pubFiles = publishedByRule[ruleId] ? Object.keys(publishedByRule[ruleId]).length : 0;
    const localFiles = localByRule[ruleId] ? Object.keys(localByRule[ruleId]).length : 0;
    const filesStr = `${pubFiles}→${localFiles}`;
    
    console.log(`  ${ruleId.padEnd(50)}| ${pubCount.toString().padStart(9)} | ${localCount.toString().padStart(7)} | ${diffStr.padStart(7)} | ${filesStr}`);
  });
  
  // Detailed file-by-file analysis for rules with differences
  console.log('\n🔍 DETAILED DIFFERENCES:');
  const rulesWithDifferences = [...allRuleIds].filter(ruleId => {
    const pubCount = publishedByRule[ruleId] ? 
      Object.values(publishedByRule[ruleId]).reduce((sum, issues) => sum + issues.length, 0) : 0;
    const localCount = localByRule[ruleId] ? 
      Object.values(localByRule[ruleId]).reduce((sum, issues) => sum + issues.length, 0) : 0;
    return pubCount !== localCount;
  });
  
  if (rulesWithDifferences.length === 0) {
    console.log('  ✅ No differences found between published and local versions!');
  } else {
    rulesWithDifferences.slice(0, 10).forEach(ruleId => { // Limit to first 10 for readability
      console.log(`\n  🔸 ${ruleId}:`);
      
      const pubFiles = new Set(publishedByRule[ruleId] ? Object.keys(publishedByRule[ruleId]) : []);
      const localFiles = new Set(localByRule[ruleId] ? Object.keys(localByRule[ruleId]) : []);
      const allFiles = new Set([...pubFiles, ...localFiles]);
      
      [...allFiles].sort().forEach(file => {
        const pubIssues = publishedByRule[ruleId]?.[file] || [];
        const localIssues = localByRule[ruleId]?.[file] || [];
        
        if (pubIssues.length !== localIssues.length) {
          const diff = localIssues.length - pubIssues.length;
          const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
          console.log(`    📄 ${file}: ${pubIssues.length} → ${localIssues.length} (${diffStr})`);
          
          // Show sample issues if there are new ones
          if (localIssues.length > pubIssues.length) {
            const newIssues = localIssues.slice(pubIssues.length, pubIssues.length + 2); // Show first 2 new issues
            newIssues.forEach(issue => {
              console.log(`       + Line ${issue.line}: ${issue.message}`);
            });
          }
        }
      });
    });
    
    if (rulesWithDifferences.length > 10) {
      console.log(`\n  ... and ${rulesWithDifferences.length - 10} more rules with differences`);
    }
  }
  
  // Summary statistics
  console.log('\n📈 SUMMARY:');
  console.log(`  • Total rules analyzed: ${allRuleIds.size}`);
  console.log(`  • Rules with differences: ${rulesWithDifferences.length}`);
  console.log(`  • New rules in local: ${newRules.length}`);
  console.log(`  • Removed rules: ${removedRules.length}`);
  console.log(`  • Net issue change: ${diffIndicator}`);
  
  console.log('\n📁 REPORT FILES:');
  console.log(`  • Published report: ${publishedPath}`);
  console.log(`  • Local report: ${localPath}`);
  
  console.log('\n' + '='.repeat(100));
}

// Main execution
async function main() {
  console.log('🔍 SLDS Linter SARIF Comparison Tool');
  console.log('🎯 Analyzing entire demo folder for comprehensive comparison\n');
  
  // Discover all demo files
  const demoFiles = discoverDemoFiles();
  console.log(`📂 Found ${demoFiles.length} lintable files in demo directory:`);
  demoFiles.forEach(file => console.log(`   • ${file}`));
  
  console.log('\n🚀 Generating SARIF reports...\n');
  
  const publishedPath = path.join(outputDir, 'published-0.5.2.sarif');
  const localPath = path.join(outputDir, 'local-current.sarif');
  
  // Generate report with published version (0.5.2)
  console.log('📦 Running published version @salesforce-ux/slds-linter@0.5.2...');
  try {
    const publishedCmd = `npx @salesforce-ux/slds-linter@0.5.2 report --format sarif --output ${outputDir} demo`;
    console.log(`   Command: ${publishedCmd}`);
    execSync(publishedCmd, { stdio: 'pipe', cwd: __dirname });
    
    // Rename the generated file
    const generatedFile = path.join(outputDir, 'slds-linter-report.sarif');
    if (fs.existsSync(generatedFile)) {
      fs.renameSync(generatedFile, publishedPath);
    }
    console.log('   ✅ Published version report generated');
  } catch (error) {
    console.error('   ❌ Error with published version:', error.message);
    process.exit(1);
  }

  // Generate report with local CLI
  console.log('\n🏗️  Running local CLI version...');
  try {
    const localCmd = `node packages/cli/build/index.js report --format sarif --output ${outputDir} demo`;
    console.log(`   Command: ${localCmd}`);
    execSync(localCmd, { stdio: 'pipe', cwd: __dirname });
    
    // Rename the generated file
    const generatedFile = path.join(outputDir, 'slds-linter-report.sarif');
    if (fs.existsSync(generatedFile)) {
      fs.renameSync(generatedFile, localPath);
    }
    console.log('   ✅ Local version report generated');
  } catch (error) {
    console.error('   ❌ Error with local version:', error.message);
    process.exit(1);
  }

  // Load and compare reports
  console.log('\n📊 Loading and analyzing reports...');
  const publishedSarif = loadSarifReport(publishedPath);
  const localSarif = loadSarifReport(localPath);

  if (!publishedSarif || !localSarif) {
    console.error('❌ Failed to load one or both SARIF reports');
    process.exit(1);
  }

  const publishedData = extractSarifData(publishedSarif);
  const localData = extractSarifData(localSarif);

  // Perform detailed comparison
  compareReports(publishedData, localData, publishedPath, localPath);
}

// Run the comparison
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
