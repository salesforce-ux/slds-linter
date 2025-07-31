#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to validate SARIF file using NIST validator
function validateSarif(sarifFilePath) {
    try {
        const command = `curl --proto '=https' --tlsv1.2 -sSf -XPOST 'https://samate.nist.gov/SARD/sarif-validator' -F 'file=@${sarifFilePath}'`;
        const result = execSync(command, { encoding: 'utf-8' });
        const parsedResult = JSON.parse(result);
        return parsedResult;
    } catch (error) {
        console.error('Error validating SARIF file:', error.message);
        process.exit(1);
    }
}

// Function to generate HTML report
function generateHtmlReport(validationResults) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SARIF Validation Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .summary-stats {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .total-issues {
            font-size: 1.2em;
            color: #d32f2f;
            font-weight: bold;
        }
        .category-breakdown {
            background-color: white;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .category-breakdown h3 {
            margin-top: 0;
            color: #333;
        }
        .category-breakdown ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .category-breakdown li {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .category-breakdown li:last-child {
            border-bottom: none;
        }
        .error {
            background-color: #fff3f3;
            border-left: 4px solid #ff4444;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .warning {
            background-color: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .success {
            background-color: #f1f8e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .property-path {
            font-family: monospace;
            color: #2196F3;
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
        }
        .error-text {
            color: #d32f2f;
            font-weight: 500;
        }
        .error-value {
            font-family: monospace;
            background-color: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            margin-top: 8px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>SARIF Validation Report</h1>
        ${generateValidationContent(validationResults)}
    </div>
</body>
</html>`;

    return html;
}

// Function to generate validation content
function generateValidationContent(results) {
    let content = '';
    let totalIssues = 0;
    const categories = {
        'Missing Required Keys': 0,
        'Pattern Matching Errors': 0,
        'Invalid Enum Values': 0
    };

    // Check if results is an array (multiple validation results)
    const validationResults = Array.isArray(results) ? results : [results];

    validationResults.forEach((result, index) => {
        if (index > 0) {
            content += '<hr>';
        }

        // Handle validation errors
        if (result.errors && result.errors.length > 0) {
            totalIssues += result.errors.length;
            
            // Categorize errors
            result.errors.forEach(error => {
                if (error.includes('is missing required keys')) {
                    categories['Missing Required Keys']++;
                } else if (error.includes('does not match pattern')) {
                    categories['Pattern Matching Errors']++;
                } else if (error.includes('is not one of')) {
                    categories['Invalid Enum Values']++;
                }
            });

            // Add summary section
            content += `
                <div class="summary">
                    <h2>Validation Summary</h2>
                    <div class="summary-stats">
                        <div class="total-issues">
                            <strong>Total Issues:</strong> ${totalIssues}
                        </div>
                        <div class="category-breakdown">
                            <h3>Issues by Category:</h3>
                            <ul>
                                ${Object.entries(categories).map(([category, count]) => `
                                    <li><strong>${category}:</strong> ${count}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                <hr>
                <h2>Detailed Validation Errors</h2>`;

            // Add detailed errors
            result.errors.forEach(error => {
                const match = error.match(/property '([^']+)' ([^:]+): (.+)/);
                if (match) {
                    const [, propertyPath, errorText, errorValue] = match;
                    content += `
                        <div class="error">
                            <div>
                                <span class="property-path">${propertyPath}</span>
                                <span class="error-text">${errorText}</span>
                            </div>
                            <div class="error-value">${errorValue}</div>
                        </div>`;
                } else {
                    content += `
                        <div class="error">
                            <div class="error-text">${error}</div>
                        </div>`;
                }
            });
        }

        // Show success message if no errors
        if (!result.errors || result.errors.length === 0) {
            content += `
                <div class="success">
                    <strong>Success!</strong> The SARIF file is valid according to the NIST validator.
                </div>`;
        }
    });

    return content;
}

// Main execution
const sarifFilePath = path.join(__dirname, '..', 'slds-linter-report.sarif');

if (!fs.existsSync(sarifFilePath)) {
    console.error('❌ Error validating SARIF report:', 'slds-linter-report.sarif not found');
    process.exit(1);
}

try {
    console.log('Validating SARIF file...');
    const validationResults = validateSarif(sarifFilePath);

    const htmlReport = generateHtmlReport(validationResults);

    // Ensure site directory exists
    const siteDir = path.join(__dirname, '..', 'site');
    if (!fs.existsSync(siteDir)) {
        fs.mkdirSync(siteDir, { recursive: true });
    }
    
    // Write the HTML file
    const outputPath = path.join(siteDir, 'sarif-validation-report.html');
    fs.writeFileSync(outputPath, htmlReport);
    console.log(`✅ Validation report generated: ${outputPath}`);
} catch (error) {
    console.error('❌ Error generating validation report:', error.message);
    process.exit(1);
}