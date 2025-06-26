import { extname } from 'path';

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
  const currentTime = new Date().toLocaleString();
  
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
        <h1>🚀 SLDS Linter Static Site</h1>
        <p>This is the static file server for the SLDS Linter project. The server is running and serving files from the <code>site</code> folder.</p>
        
        <div class="status running">● Running</div>
        
        ${fileList}
        
        <div class="info-section">
            <p><strong>Server Info:</strong></p>
            <ul>
                <li>Port: <code id="port">3000</code></li>
                <li>Public Folder: <code>site/</code></li>
                <li>Environment: <code id="env">development</code></li>
                <li>Generated: <code>${currentTime}</code></li>
            </ul>
        </div>
        
        <div class="generated-info">
            <p>This page was automatically generated by <code>scripts/generate-index.js</code></p>
        </div>
    </div>

    <script>
        // Update port and environment info
        document.getElementById('port').textContent = window.location.port || '80';
        document.getElementById('env').textContent = window.location.hostname === 'localhost' ? 'development' : 'production';
    </script>
</body>
</html>`;
}