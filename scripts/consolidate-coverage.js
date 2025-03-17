import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import {join, relative} from 'path';

// Define Paths
const rootDir = process.cwd();
const packagesDir = join(rootDir, 'packages');
const coverageDir = join(rootDir, 'coverage');

// Ensure coverage directory exists
if (!existsSync(coverageDir)) {
    mkdirSync(coverageDir, { recursive: true });
}

// Function to read and parse a JSON file
function readJsonFile(filePath) {
  const fileContent = readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}

// Function to merge coverage data
function mergeCoverageData(coverageData) {
  const merged = {
    total: {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
    }
  };

  Object.values(coverageData).forEach(data => {    
    ['lines', 'statements', 'functions', 'branches'].forEach(key => {
        merged.total[key].total += data.total[key].total;
        merged.total[key].covered += data.total[key].covered;
        merged.total[key].skipped += data.total[key].skipped; 
    });
    Object.entries(data).forEach(([key, data])=>{
      if(key !== "total"){
        merged[relative(rootDir, key)] = data;
      }
    })
  });

  // Calculate percentages
  ['lines', 'statements', 'functions', 'branches'].forEach(key => {
    merged.total[key].pct = parseFloat((merged.total[key].covered / merged.total[key].total * 100).toFixed(2));
  });

  return merged;
}

// Main function
function consolidateCoverage() {  
  const consolidatedCoverage = {};

  // Read coverage data from each package
  readdirSync(packagesDir).forEach(packageName => {
    const coveragePath = join(packagesDir, packageName, 'coverage', 'coverage-summary.json');
    if (existsSync(coveragePath)) {
      const coverageData = readJsonFile(coveragePath);
      consolidatedCoverage[packageName] = coverageData;
    }
  });

  // Merge coverage data
  const mergedCoverage = mergeCoverageData(consolidatedCoverage);

  // Write consolidated coverage to a file
  const outputPath = join(coverageDir, 'coverage-summary.json');
  writeFileSync(outputPath, JSON.stringify(mergedCoverage, null, 2));

  console.log('===============================');
  console.log('        Coverage summary       ');
  console.log('===============================');
  console.table(mergedCoverage.total);
  console.log(`\n✅ Merged coverage report saved to:\n${outputPath}\n`);
}

consolidateCoverage();