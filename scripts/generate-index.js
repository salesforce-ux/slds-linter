/**
 * This script generates the index.html file for the static site.
 * It is used to display the list of files in the site directory.
 * It is also used to display the status of the server.
 * It is also used to display the port and environment info.
 * It is also used to display the generated info.
 * It is also used to display the server info.
 * It is also used to display the generated info.
 * 
 * This script is used in the heroku-build.js script.
 */

import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { readdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File type descriptions
const fileDescriptions = {
  '.html': 'HTML document',
  '.css': 'CSS stylesheet',
  '.js': 'JavaScript file',
  '.json': 'JSON data file',
  '.png': 'PNG image',
  '.jpg': 'JPEG image',
  '.jpeg': 'JPEG image',
  '.gif': 'GIF image',
  '.svg': 'SVG vector image',
  '.ico': 'Icon file',
  '.txt': 'Text file',
  '.pdf': 'PDF document',
  '.md': 'Markdown file',
  '.xml': 'XML document',
  '.csv': 'CSV data file'
};

// Special file descriptions
const specialFiles = {
  'sarif-report.html': 'SARIF report viewer',
  'index.html': 'Landing page',
  'README.md': 'Project documentation',
  'CHANGELOG.md': 'Version history'
};

function getFileDescription(filename) {
  // Check for special files first
  if (specialFiles[filename]) {
    return specialFiles[filename];
  }
  
  // Check file extension
  const ext = extname(filename).toLowerCase();
  if (fileDescriptions[ext]) {
    return fileDescriptions[ext];
  }
  
  return 'File';
}

function generateFileList(files) {
  if (files.length === 0) {
    return '<p><em>No files found in the site directory.</em></p>';
  }
  
  const fileItems = files
    .filter(file => file !== 'index.html') // Don't list index.html in the list
    .map(file => {
      const description = getFileDescription(file);
      const ext = extname(file).toLowerCase();
      const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext);
      
      return `
        <div class="file-item">
          <a href="/${file}">${file}</a>
          <span class="file-description">- ${description}</span>
          ${isImage ? `<span class="file-preview"><img src="/${file}" alt="${file}" style="max-width: 50px; max-height: 50px; margin-left: 10px; border-radius: 4px;"></span>` : ''}
        </div>
      `;
    })
    .join('');
  
  return `
    <div class="file-list">
      <h3>📁 Available Files (${files.length - 1}):</h3>
      ${fileItems}
    </div>
  `;
}

export function generateHTML(files) {
  const fileList = generateFileList(files);
  const appName = process.env.HEROKU_APP_NAME || 'SLDS Linter PR Review App';
  const currentTime = Date.now();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SLDS Linter - Static Site</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0070d2;
            margin-bottom: 20px;
        }
        .file-list {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            margin-top: 20px;
        }
        .file-list h3 {
            margin-top: 0;
            color: #666;
        }
        .file-item {
            padding: 12px 0;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
        }
        .file-item:last-child {
            border-bottom: none;
        }
        .file-item a {
            color: #0070d2;
            text-decoration: none;
            font-weight: 500;
            min-width: 200px;
        }
        .file-item a:hover {
            text-decoration: underline;
        }
        .file-description {
            color: #666;
            margin-left: 10px;
        }
        .file-preview {
            margin-left: auto;
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        .status.running {
            background: #d4edda;
            color: #155724;
        }
        .info-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .info-section ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .info-section code {
            background: #f1f3f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .generated-info {
            font-size: 12px;
            color: #999;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ${appName}</h1>
        <p class="description">
            This site includes code coverage reports for all packages and a SARIF report viewer. 
            Click on any file or folder in the list below to navigate and explore the generated reports.
        </p>
        
        ${fileList}
        
        <div class="info-section">
            <p><strong>PR Info:</strong></p>
            <ul>
                <li>PR: <code>${process.env.HEROKU_PR_NUMBER}</code></li>
                <li>Branch: <code>${process.env.HEROKU_BRANCH}</code></li>
                <li>Commit: <code>${process.env.HEROKU_BUILD_COMMIT}</code></li>
                <li>Generated At: <code id="generatedTime"></code></li>
            </ul>
        </div>
        
        <div class="generated-info">
            <p>This page was automatically generated by <code>scripts/generate-index.js</code></p>
        </div>
    </div>

    <script>
        document.getElementById('generatedTime').textContent = new Date(${currentTime}).toLocaleString();
    </script>
</body>
</html>`;
}

export function generateIndex() {
  const SITE_DIR = join(__dirname, '..', 'site');
  let files = readdirSync(SITE_DIR, { withFileTypes: true });
  // sort folder first, then files
  files = files.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return 0;
  }).map(file => file.name);
  const html = generateHTML(files);
  writeFileSync(join(SITE_DIR, 'index.html'), html);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateIndex();
}