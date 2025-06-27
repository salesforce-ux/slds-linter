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
    const totalViolations = files.reduce((sum, file) => sum + fileViolations[file].length, 0);
    
    // Helper functions for HTML generation
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    function generateFileList(files, fileViolations) {
        return files.map(file => {
            const violations = fileViolations[file];
            const errorCount = violations.filter(v => v.level === 'error').length;
            const warningCount = violations.filter(v => v.level === 'warning').length;
            const infoCount = violations.filter(v => v.level === 'info').length;
            
            let countClass = 'error';
            let count = errorCount;
            if (errorCount === 0 && warningCount > 0) {
                countClass = 'warning';
                count = warningCount;
            } else if (errorCount === 0 && warningCount === 0 && infoCount > 0) {
                countClass = 'info';
                count = infoCount;
            }
            
            return `
                <div class="file-item" data-file="${escapeHtml(file)}" onclick="selectFile('${escapeHtml(file)}')">
                    <div class="file-item-content">
                        <div class="file-name">${escapeHtml(file)}</div>
                        <div class="file-meta">
                            <span>${violations.length} violations</span>
                            <span class="violation-count ${countClass}">${count}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function generateNoViolationsSidebar() {
        return `
            <div class="no-violations">
                <h2>🎉 No Files with Issues</h2>
                <p>All files are compliant!</p>
            </div>
        `;
    }
    
    function generateNoViolations() {
        return `
            <div class="no-violations">
                <h2>🎉 No Violations Found!</h2>
                <p>Your code is compliant with SLDS linting rules.</p>
            </div>
        `;
    }
    
    function generateNoFileSelected() {
        return `
            <div class="no-file-selected">
                <h2>📁 Select a File</h2>
                <p>Choose a file from the sidebar to view its violations.</p>
            </div>
        `;
    }
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SLDS Linter Report</title>
    <style>
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: #f8f9fa;
            color: #333;
            height: 100vh;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #0176d3 0%, #014486 100%);
            color: white;
            padding: 15px 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
        }
        
        .header h1 {
            margin: 0;
            font-size: 1.8em;
            font-weight: 300;
        }
        
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 0.9em;
        }
        
        .stats-bar {
            background: white;
            padding: 15px 30px;
            border-bottom: 1px solid #e1e5e9;
            display: flex;
            gap: 30px;
            align-items: center;
            position: fixed;
            top: 80px;
            left: 0;
            right: 0;
            z-index: 99;
        }
        
        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .stat-number {
            font-size: 1.5em;
            font-weight: 600;
            color: #0176d3;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        
        .main-container {
            display: flex;
            height: 100vh;
            padding-top: 140px;
        }
        
        .sidebar {
            width: 350px;
            background: white;
            border-right: 1px solid #e1e5e9;
            overflow-y: auto;
            flex-shrink: 0;
        }
        
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid #e1e5e9;
            background: #f8f9fa;
        }
        
        .sidebar-header h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 1.1em;
        }
        
        .search-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .search-input:focus {
            outline: none;
            border-color: #0176d3;
            box-shadow: 0 0 0 2px rgba(1, 118, 211, 0.1);
        }
        
        .file-list {
            padding: 0;
        }
        
        .file-item {
            border-bottom: 1px solid #f1f3f4;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .file-item:hover {
            background-color: #f8f9fa;
        }
        
        .file-item.active {
            background-color: #e3f2fd;
            border-left: 4px solid #0176d3;
        }
        
        .file-item-content {
            padding: 15px 20px;
        }
        
        .file-name {
            font-weight: 500;
            color: #333;
            margin-bottom: 5px;
            font-size: 0.9em;
            word-break: break-all;
        }
        
        .file-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8em;
            color: #666;
        }
        
        .violation-count {
            background: #ff4444;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 0.7em;
            font-weight: 600;
        }
        
        .violation-count.warning {
            background: #ff8800;
        }
        
        .violation-count.info {
            background: #0176d3;
        }
        
        .content-area {
            flex: 1;
            overflow-y: auto;
            background: #f8f9fa;
        }
        
        .file-details {
            background: white;
            margin: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .file-details-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e1e5e9;
        }
        
        .file-details-header h2 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 1.3em;
        }
        
        .file-path {
            color: #666;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
        }
        
        .violations-list {
            padding: 0;
        }
        
        .violation-item {
            border-bottom: 1px solid #f1f3f4;
            padding: 0;
        }
        
        .violation-item:last-child {
            border-bottom: none;
        }
        
        .violation-header {
            padding: 15px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: background-color 0.2s ease;
        }
        
        .violation-header:hover {
            background-color: #f8f9fa;
        }
        
        .violation-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: white;
            flex-shrink: 0;
        }
        
        .violation-icon.error {
            background: #d32f2f;
        }
        
        .violation-icon.warning {
            background: #f57c00;
        }
        
        .violation-icon.info {
            background: #1976d2;
        }
        
        .violation-info {
            flex: 1;
            min-width: 0;
        }
        
        .violation-message {
            font-weight: 500;
            color: #333;
            margin-bottom: 5px;
            line-height: 1.4;
        }
        
        .violation-meta {
            display: flex;
            gap: 15px;
            font-size: 0.8em;
            color: #666;
        }
        
        .rule-id {
            background: #e3f2fd;
            color: #1976d2;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .location-info {
            color: #666;
        }
        
        .violation-content {
            padding: 0 20px 20px 59px;
            display: none;
        }
        
        .violation-content.expanded {
            display: block;
        }
        
        .code-snippet {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 0.9em;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre;
            margin-top: 10px;
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
        
        .no-file-selected {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .no-file-selected h2 {
            color: #0176d3;
            margin-bottom: 10px;
        }
        
        .file-item.hidden {
            display: none;
        }
        
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                height: 300px;
            }
            
            .content-area {
                height: calc(100vh - 440px);
            }
            
            .stats-bar {
                flex-wrap: wrap;
                gap: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SLDS Linter Report</h1>
    </div>
    
    <div class="stats-bar">
        <div class="stat-item">
            <span class="stat-number">${files.length}</span>
            <span class="stat-label">Files with Issues</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${totalViolations}</span>
            <span class="stat-label">Total Violations</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${files.length > 0 ? Math.round((totalViolations / files.length) * 10) / 10 : 0}</span>
            <span class="stat-label">Avg per File</span>
        </div>
    </div>
    
    <div class="main-container">
        <div class="sidebar">
            <div class="sidebar-header">
                <h3>📁 Files with Violations</h3>
                <input type="text" id="fileSearch" class="search-input" placeholder="Search files...">
            </div>
            <div class="file-list" id="fileList">
                ${files.length === 0 ? generateNoViolationsSidebar() : generateFileList(files, fileViolations)}
            </div>
        </div>
        
        <div class="content-area" id="contentArea">
            ${files.length === 0 ? generateNoViolations() : generateNoFileSelected()}
        </div>
    </div>
    
    <script>
        // File data for JavaScript
        const fileData = ${JSON.stringify(fileViolations)};
        const files = ${JSON.stringify(files)};
        
        // DOM elements
        const fileList = document.getElementById('fileList');
        const contentArea = document.getElementById('contentArea');
        const fileSearch = document.getElementById('fileSearch');
        
        // Current active file
        let activeFile = null;
        
        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
        
        // Initialize the interface
        function init() {
            if (files.length > 0) {
                selectFile(files[0]);
            }
            
            // Add search functionality
            fileSearch.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const fileItems = document.querySelectorAll('.file-item');
                
                fileItems.forEach(item => {
                    const fileName = item.querySelector('.file-name').textContent.toLowerCase();
                    if (fileName.includes(searchTerm)) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
            
            // Focus search on load
            fileSearch.focus();
        }
        
        // Select a file and show its violations
        function selectFile(fileName) {
            // Update active state
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const fileItem = document.querySelector(\`[data-file="\${fileName}"]\`);
            if (fileItem) {
                fileItem.classList.add('active');
            }
            
            activeFile = fileName;
            
            // Update content area
            contentArea.innerHTML = generateFileDetails(fileName, fileData[fileName]);
        }
        
        // Generate file details HTML
        function generateFileDetails(fileName, violations) {
            return \`
                <div class="file-details">
                    <div class="file-details-header">
                        <h2>\${escapeHtml(fileName)}</h2>
                        <div class="file-path">\${escapeHtml(fileName)}</div>
                    </div>
                    <div class="violations-list">
                        \${violations.map((violation, index) => generateViolationHtml(violation, index)).join('')}
                    </div>
                </div>
            \`;
        }
        
        // Generate violation HTML
        function generateViolationHtml(violation, index) {
            const levelClass = violation.level === 'warning' ? 'warning' : 
                              violation.level === 'error' ? 'error' : 'info';
            
            return \`
                <div class="violation-item">
                    <div class="violation-header" onclick="toggleViolation(\${index})">
                        <div class="violation-icon \${levelClass}">\${violation.level.charAt(0).toUpperCase()}</div>
                        <div class="violation-info">
                            <div class="violation-message">\${escapeHtml(violation.message)}</div>
                            <div class="violation-meta">
                                <span class="rule-id">\${escapeHtml(violation.ruleId)}</span>
                                <span class="location-info">Line \${violation.line}, Column \${violation.column}</span>
                            </div>
                        </div>
                    </div>
                    <div class="violation-content expanded" id="violation-\${index}">
                        <div class="code-snippet">\${escapeHtml(violation.snippet || '')}</div>
                    </div>
                </div>
            \`;
        }
        
        // Toggle violation expansion
        function toggleViolation(index) {
            const content = document.getElementById(\`violation-\${index}\`);
            content.classList.toggle('expanded');
        }
        
        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>`;

    return html;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    generateSarifReport();
}

export { generateSarifReport }; 