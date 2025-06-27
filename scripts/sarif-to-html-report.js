#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a static HTML page from SARIF report
 */
function generateSarifReport() {
    try {
        // Read the SARIF file
        const sarifPath = path.join(__dirname, '..', 'slds-linter-report.sarif');
        const sarifContent = fs.readFileSync(sarifPath, 'utf8');
        const sarifData = JSON.parse(sarifContent);

        // Extract results from the first run
        const results = sarifData.runs[0]?.results || [];
        
        // Group violations by file
        const fileViolations = {};
        
        results.forEach(result => {
            const location = result.locations[0];
            if (location && location.physicalLocation) {
                const fileUri = location.physicalLocation.artifactLocation.uri;
                const region = location.physicalLocation.region;
                
                if (!fileViolations[fileUri]) {
                    fileViolations[fileUri] = [];
                }
                
                fileViolations[fileUri].push({
                    ruleId: result.ruleId,
                    level: result.level,
                    message: result.message.text,
                    line: region.startLine,
                    column: region.startColumn,
                    endLine: region.endLine,
                    endColumn: region.endColumn,
                    fileUri
                });
            }
        });

        // Attach code snippets to each violation
        for (const [file, violations] of Object.entries(fileViolations)) {
            const absPath = path.join(__dirname, '..', file);
            let lines = null;
            if (fs.existsSync(absPath)) {
                try {
                    lines = fs.readFileSync(absPath, 'utf8').split(/\r?\n/);
                } catch (e) {
                    lines = null;
                }
            }
            violations.forEach(v => {
                if (lines) {
                    // Show up to 2 lines before and after, and all lines in the violation region
                    const start = Math.max(0, v.line - 3); // 0-based
                    const end = Math.min(lines.length, (v.endLine || v.line) + 2);
                    v.snippet = lines.slice(start, end).map((l, idx) => {
                        const lineNum = start + idx + 1;
                        return (lineNum === v.line ? '▶ ' : '  ') + lineNum.toString().padStart(4) + ': ' + l;
                    }).join('\n');
                } else {
                    v.snippet = '[Source file not found]';
                }
            });
        }

        // Generate HTML content
        const htmlContent = generateHTML(fileViolations);
        
        // Ensure site directory exists
        const siteDir = path.join(__dirname, '..', 'site');
        if (!fs.existsSync(siteDir)) {
            fs.mkdirSync(siteDir, { recursive: true });
        }
        
        // Write the HTML file
        const outputPath = path.join(siteDir, 'sarif-report.html');
        fs.writeFileSync(outputPath, htmlContent, 'utf8');
        
        console.log(`✅ SARIF report generated successfully at: ${outputPath}`);
        console.log(`📊 Total files with violations: ${Object.keys(fileViolations).length}`);
        console.log(`🚨 Total violations: ${results.length}`);
        
    } catch (error) {
        console.error('❌ Error generating SARIF report:', error.message);
        process.exit(1);
    }
}

/**
 * Generate HTML content from file violations
 */
function generateHTML(fileViolations) {
    const files = Object.keys(fileViolations).sort();
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SLDS Linter Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0176d3 0%, #014486 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .content {
            padding: 30px;
        }
        .file-section {
            margin-bottom: 40px;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            overflow: hidden;
        }
        .file-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #e1e5e9;
        }
        .file-header h4 {
            margin: 0;
            color: #0176d3;
            font-size: 1.2em;
            font-weight: 600;
        }
        .violations {
            padding: 0;
        }
        .violation {
            border-bottom: 1px solid #f1f3f4;
            padding: 0;
        }
        .violation:last-child {
            border-bottom: none;
        }
        .violation details {
            padding: 15px 20px;
        }
        .violation summary {
            cursor: pointer;
            font-weight: 500;
            color: #333;
            padding: 5px 0;
        }
        .violation summary:hover {
            color: #0176d3;
        }
        .violation-content {
            margin-top: 10px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid #0176d3;
        }
        .violation-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
            font-size: 0.9em;
            color: #666;
        }
        .rule-id {
            background: #e3f2fd;
            color: #1976d2;
            padding: 2px 8px;
            border-radius: 12px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.8em;
        }
        .level {
            text-transform: uppercase;
            font-weight: 600;
        }
        .level.warning {
            color: #f57c00;
        }
        .level.error {
            color: #d32f2f;
        }
        .level.info {
            color: #1976d2;
        }
        .location {
            color: #666;
        }
        .message {
            color: #333;
            line-height: 1.5;
        }
        .snippet {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            margin-top: 10px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 0.9em;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre;
        }
        .snippet code {
            background: none;
            padding: 0;
            border: none;
        }
        .stats {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e1e5e9;
            display: flex;
            justify-content: space-around;
            text-align: center;
        }
        .stat {
            flex: 1;
        }
        .stat-number {
            font-size: 2em;
            font-weight: 600;
            color: #0176d3;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .no-violations {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        .no-violations h2 {
            color: #0176d3;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SLDS Linter Report</h1>
            <p>Static Analysis Results Interface (SARIF) Report</p>
        </div>
        
        ${generateStats(fileViolations)}
        
        <div class="content">
            ${files.length === 0 ? generateNoViolations() : generateFileSections(files, fileViolations)}
        </div>
    </div>
    
    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Auto-expand first violation in each file
            document.querySelectorAll('.file-section').forEach(section => {
                const firstViolation = section.querySelector('.violation details');
                if (firstViolation) {
                    firstViolation.open = true;
                }
            });
            
            // Add click handlers for better UX
            document.querySelectorAll('summary').forEach(summary => {
                summary.addEventListener('click', function(e) {
                    const details = this.parentElement;
                    
                    // Close all other violations in the same file
                    const fileSection = details.closest('.file-section');
                    fileSection.querySelectorAll('details').forEach(d => {
                        if (d !== details) {
                            d.open = false;
                        }
                    });
                });
            });
            
            // Ensure details elements are properly initialized
            document.querySelectorAll('details').forEach(details => {
                // Force the details to be properly recognized by the browser
                details.setAttribute('open', details.hasAttribute('open'));
            });
        });
    </script>
</body>
</html>`;

    return html;
}

/**
 * Generate statistics section
 */
function generateStats(fileViolations) {
    const files = Object.keys(fileViolations);
    const totalViolations = files.reduce((sum, file) => sum + fileViolations[file].length, 0);
    
    return `
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${files.length}</div>
                <div class="stat-label">Files with Issues</div>
            </div>
            <div class="stat">
                <div class="stat-number">${totalViolations}</div>
                <div class="stat-label">Total Violations</div>
            </div>
            <div class="stat">
                <div class="stat-number">${Math.round((totalViolations / files.length) * 10) / 10}</div>
                <div class="stat-label">Avg per File</div>
            </div>
        </div>
    `;
}

/**
 * Generate file sections with violations
 */
function generateFileSections(files, fileViolations) {
    return files.map(file => {
        const violations = fileViolations[file];
        const violationsHtml = violations.map(violation => generateViolationHtml(violation)).join('');
        
        return `
            <div class="file-section">
                <div class="file-header">
                    <h4>${escapeHtml(file)}</h4>
                </div>
                <div class="violations">
                    ${violationsHtml}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Generate HTML for a single violation
 */
function generateViolationHtml(violation) {
    const levelClass = violation.level === 'warning' ? 'warning' : 
                      violation.level === 'error' ? 'error' : 'info';
    
    return `
        <div class="violation">
            <details>
                <summary>
                    ${escapeHtml(violation.message)}
                </summary>
                <div class="violation-content">
                    <div class="violation-meta">
                        <span class="rule-id">${escapeHtml(violation.ruleId)}</span>
                        <span class="level ${levelClass}">${violation.level}</span>
                        <span class="location">Line ${violation.line}, Column ${violation.column}</span>
                    </div>
                    <pre class="snippet"><code>${escapeHtml(violation.snippet || '')}</code></pre>
                </div>
            </details>
        </div>
    `;
}

/**
 * Generate no violations message
 */
function generateNoViolations() {
    return `
        <div class="no-violations">
            <h2>🎉 No Violations Found!</h2>
            <p>Your code is compliant with SLDS linting rules.</p>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    generateSarifReport();
}

export { generateSarifReport }; 