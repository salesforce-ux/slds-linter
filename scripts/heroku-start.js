#!/usr/bin/env node

import { createServer } from 'http';
import { join } from 'path';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import serveStatic from 'serve-static';
import finalhandler from 'finalhandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const SITE_DIR = join(__dirname, '..', 'site');

// Create serve-static middleware
const serve = serveStatic(SITE_DIR, {
  index: ['index.html'], // Serve index.html for directory requests
  dotfiles: 'deny', // Don't serve dotfiles
  etag: true,
  lastModified: true,
  maxAge: '1h', // Cache for 1 hour
  setHeaders: (res, path) => {
    // Set custom headers
    res.setHeader('X-Served-By', 'SLDS-Linter-Static-Server');
  }
});

// Create HTTP server
const server = createServer((req, res) => {
  // Use serve-static for all requests
  serve(req, res, finalhandler(req, res));
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