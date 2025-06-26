#!/usr/bin/env node

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const SITE_DIR = join(__dirname, '..', 'site');

// MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf'
};

// Create HTTP server
const server = createServer(async (req, res) => {
  try {
    // Parse URL and get file path
    const url = new URL(req.url, `http://${req.headers.host}`);
    let filePath = url.pathname;
    
    // Default to index.html if root path
    if (filePath === '/') {
      filePath = '/index.html';
    }
    
    // Resolve file path relative to site directory
    const fullPath = join(SITE_DIR, filePath);
    
    // Security check: ensure path is within site directory
    if (!fullPath.startsWith(SITE_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    
    // Check if file exists
    if (!existsSync(fullPath)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - File Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #333; }
            .error { color: #666; }
          </style>
        </head>
        <body>
          <h1>404 - File Not Found</h1>
          <p class="error">The requested file "${filePath}" was not found.</p>
          <p><a href="/">Go to Home</a></p>
        </body>
        </html>
      `);
      return;
    }
    
    // Read file
    const content = await readFile(fullPath);
    
    // Determine MIME type
    const ext = extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Set response headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });
    
    // Send response
    res.end(content);
    
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Static file server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${SITE_DIR}`);
  console.log(`🌐 Access the site at: http://localhost:${PORT}`);
  
  // Log available files
  console.log('\n📋 Available files:');
  try {
    const files = readdirSync(SITE_DIR);
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
  } catch (error) {
    console.log('   (Could not list files)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 