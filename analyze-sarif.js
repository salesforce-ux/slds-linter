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
    console.error(`Error loading ${filePath}:`, error.message);
    return null;
  }
}

function extractV9Rules(sarif) {
  const results = [];
  
  if (!sarif?.runs?.[0]?.results) {
    return results;
  }

  const run = sarif.runs[0];
  
  // Extract rules from tool driver
  const rules = run.tool?.driver?.rules || [];
  const v9Rules = rules.filter(rule => rule.id?.startsWith('v9/'));
  
  // Extract results for v9 rules
  const v9Results = run.results?.filter(result => 
    result.ruleId?.startsWith('v9/')
  ) || [];

  return {
    rules: v9Rules,
    results: v9Results,
    toolInfo: {
      name: run.tool?.driver?.name,
      version: run.tool?.driver?.version,
      semanticVersion: run.tool?.driver?.semanticVersion
    }
  };
}

function analyzeResults(publishedData, localData) {
  console.log('🔍 SARIF Analysis Report\n');
  console.log('=' .repeat(80));
  
  // Tool information
  console.log('\n📦 TOOL VERSIONS:');
  console.log(`Published (0.5.2): ${publishedData.toolInfo.name} v${publishedData.toolInfo.version || publishedData.toolInfo.semanticVersion}`);
  console.log(`Local Current:     ${localData.toolInfo.name} v${localData.toolInfo.version || localData.toolInfo.semanticVersion}`);
  
  // Rules comparison
  console.log('\n📋 V9 RULES AVAILABLE:');
  const publishedRuleIds = new Set(publishedData.rules.map(r => r.id));
  const localRuleIds = new Set(localData.rules.map(r => r.id));
  const allRuleIds = new Set([...publishedRuleIds, ...localRuleIds]);
  
  console.log(`Published: ${publishedRuleIds.size} rules`);
  console.log(`Local:     ${localRuleIds.size} rules`);
  
  // New rules in local
  const newRules = [...localRuleIds].filter(id => !publishedRuleIds.has(id));
  if (newRules.length > 0) {
    console.log(`\n✨ NEW RULES IN LOCAL:`, newRules);
  }
  
  // Removed rules
  const removedRules = [...publishedRuleIds].filter(id => !localRuleIds.has(id));
  if (removedRules.length > 0) {
    console.log(`\n❌ REMOVED RULES IN LOCAL:`, removedRules);
  }
  
  // Results comparison
  console.log('\n🐛 ISSUES FOUND:');
  console.log(`Published: ${publishedData.results.length} total issues`);
  console.log(`Local:     ${localData.results.length} total issues`);
  
  // Group results by rule
  function groupByRule(results) {
    const grouped = {};
    results.forEach(result => {
      const ruleId = result.ruleId;
      if (!grouped[ruleId]) {
        grouped[ruleId] = [];
      }
      grouped[ruleId].push(result);
    });
    return grouped;
  }
  
  const publishedByRule = groupByRule(publishedData.results);
  const localByRule = groupByRule(localData.results);
  
  console.log('\n📊 ISSUES BY RULE:');
  [...allRuleIds].sort().forEach(ruleId => {
    const pubCount = publishedByRule[ruleId]?.length || 0;
    const localCount = localByRule[ruleId]?.length || 0;
    const diff = localCount - pubCount;
    const diffStr = diff > 0 ? `(+${diff})` : diff < 0 ? `(${diff})` : '(=)';
    
    console.log(`  ${ruleId.padEnd(40)} | Pub: ${pubCount.toString().padStart(3)} | Local: ${localCount.toString().padStart(3)} ${diffStr}`);
  });
  
  // Detailed analysis for no-hardcoded-values
  console.log('\n🎯 DETAILED ANALYSIS: v9/no-hardcoded-values*');
  const hardcodedPublished = publishedData.results.filter(r => r.ruleId?.includes('no-hardcoded-values'));
  const hardcodedLocal = localData.results.filter(r => r.ruleId?.includes('no-hardcoded-values'));
  
  if (hardcodedPublished.length > 0 || hardcodedLocal.length > 0) {
    console.log(`\nPublished hardcoded-values issues: ${hardcodedPublished.length}`);
    console.log(`Local hardcoded-values issues: ${hardcodedLocal.length}`);
    
    // Show sample issues
    if (hardcodedLocal.length > 0) {
      console.log('\nSample Local Issues:');
      hardcodedLocal.slice(0, 5).forEach((result, i) => {
        const location = result.locations?.[0];
        const file = location?.physicalLocation?.artifactLocation?.uri;
        const startLine = location?.physicalLocation?.region?.startLine;
        const message = result.message?.text;
        
        console.log(`  ${i + 1}. ${file}:${startLine} - ${message}`);
      });
    }
    
    if (hardcodedPublished.length > 0) {
      console.log('\nSample Published Issues:');
      hardcodedPublished.slice(0, 5).forEach((result, i) => {
        const location = result.locations?.[0];
        const file = location?.physicalLocation?.artifactLocation?.uri;
        const startLine = location?.physicalLocation?.region?.startLine;
        const message = result.message?.text;
        
        console.log(`  ${i + 1}. ${file}:${startLine} - ${message}`);
      });
    }
  }
  
  console.log('\n' + '=' .repeat(80));
}

// Main execution
const reportsDir = path.join(__dirname, 'comparison-reports');
const publishedPath = path.join(reportsDir, 'published-0.5.2.sarif');
const localPath = path.join(reportsDir, 'local-current.sarif');

console.log('📁 Loading SARIF reports...');
const publishedSarif = loadSarifReport(publishedPath);
const localSarif = loadSarifReport(localPath);

if (!publishedSarif || !localSarif) {
  console.error('❌ Failed to load one or both SARIF reports');
  process.exit(1);
}

const publishedData = extractV9Rules(publishedSarif);
const localData = extractV9Rules(localSarif);

analyzeResults(publishedData, localData);

