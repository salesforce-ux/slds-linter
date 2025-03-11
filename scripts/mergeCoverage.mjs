import { readdirSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Define Paths
const rootDir = process.cwd();
const packagesDir = join(rootDir, 'packages');
const coverageDir = join(rootDir, 'coverage');

// Ensure coverage directory exists
if (!existsSync(coverageDir)) {
    mkdirSync(coverageDir, { recursive: true });
}

// Collect coverage files from all packages
const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

let mergedCoverage = {};

// Merge coverage data
packageDirs.forEach((pkg) => {
    const coverageFile = join(packagesDir, pkg, 'coverage', 'coverage-final.json');
    if (existsSync(coverageFile)) {
        const coverageJSON = JSON.parse(readFileSync(coverageFile, 'utf-8'));
        for (const [filename, data] of Object.entries(coverageJSON)) {
            if (!mergedCoverage[filename]) {
                mergedCoverage[filename] = data;
            } else {
                // Merge statements
                for (const [stmtId, count] of Object.entries(data.s)) {
                    mergedCoverage[filename].s[stmtId] = (mergedCoverage[filename].s[stmtId] || 0) + count;
                }
                // Merge functions
                for (const [fnId, count] of Object.entries(data.f)) {
                    mergedCoverage[filename].f[fnId] = (mergedCoverage[filename].f[fnId] || 0) + count;
                }
                // Merge branches
                for (const [branchId, counts] of Object.entries(data.b)) {
                    if (!mergedCoverage[filename].b[branchId]) {
                        mergedCoverage[filename].b[branchId] = counts;
                    } else {
                        mergedCoverage[filename].b[branchId] = mergedCoverage[filename].b[branchId].map(
                            (val, idx) => val + counts[idx]
                        );
                    }
                }
            }
        }
    } else {
        console.warn(`⚠️ Coverage file not found for package: ${pkg}`);
    }
});

// Write merged coverage data to coverage directory
const mergedCoveragePath = join(coverageDir, 'merged-coverage.json');
writeFileSync(mergedCoveragePath, JSON.stringify(mergedCoverage, null, 2), 'utf-8');

// Print Coverage Summary
console.log('\n=============================== Coverage summary ===============================');
const summary = {
    Statements: { covered: 0, total: 0 },
    Branches: { covered: 0, total: 0 },
    Functions: { covered: 0, total: 0 },
    Lines: { covered: 0, total: 0 },
};

// Aggregate coverage summary from merged data
Object.values(mergedCoverage).forEach((fileCoverage) => {
    if (!fileCoverage.s || !fileCoverage.f || !fileCoverage.b) return;

    summary.Statements.covered += Object.values(fileCoverage.s).filter(count => count > 0).length;
    summary.Statements.total += Object.keys(fileCoverage.s).length;

    summary.Functions.covered += Object.values(fileCoverage.f).filter(count => count > 0).length;
    summary.Functions.total += Object.keys(fileCoverage.f).length;

    summary.Branches.covered += Object.values(fileCoverage.b).flat().filter(count => count > 0).length;
    summary.Branches.total += Object.keys(fileCoverage.b).length;

    summary.Lines.covered += Object.values(fileCoverage.l || fileCoverage.s).filter(count => count > 0).length;
    summary.Lines.total += Object.keys(fileCoverage.l || fileCoverage.s).length;
});

// Display results
Object.entries(summary).forEach(([metric, { covered, total }]) => {
    const percentage = total ? ((covered / total) * 100).toFixed(2) : '0.00';
    console.log(`${metric.padEnd(14)}: ${percentage}% (${covered}/${total})`);
});
console.log('================================================================================');

console.log(`✅ Merged coverage report saved to: ${mergedCoveragePath}`);
