# SLDS Linter Node API Tests

This directory contains tests for the SLDS Linter Node API.

## API Overview

The SLDS Linter Node API provides the following methods:

- `lint(options)` - Lints files for SLDS compliance
- `report(options)` - Generates reports in different formats
- `normalizeConfig(options)` - Normalizes configuration options
- `batchFiles(config)` - Creates batches of files for processing

## Test Results

We created several tests to verify the API functionality:

1. **Simple Test** (`simple-test.js`): Verifies basic API functionality by linting a sample CSS file.
2. **API Methods Test** (`api-methods-test.js`): Inspects the available methods in the API.
3. **File List Test** (`file-list-test.js`): Tests file batching functionality.
4. **Comprehensive Test** (`comprehensive-test.js`): Tests all API methods together.

## Usage Examples

### Basic Linting

```javascript
import { sldsExecutor } from '../../build/executor/index.js';

// Lint specific files
const results = await sldsExecutor.lint({
  files: ['./path/to/file.css'],
  fix: false // set to true to automatically fix issues
});

console.log(`Found ${results.length} files with issues`);
```

### Generating Reports

```javascript
import { sldsExecutor } from '../../build/executor/index.js';

// Lint files
const results = await sldsExecutor.lint({
  files: ['./path/to/file.css']
});

// Generate JSON report
const jsonReport = await sldsExecutor.report({
  issues: results,
  format: 'json'
});

// Generate SARIF report
const sarifReport = await sldsExecutor.report({
  issues: results,
  format: 'sarif'
});
```

## Notes

- The API is implemented using ESM modules
- When importing in CommonJS, use dynamic import: `const { sldsExecutor } = await import('...')`
- Some fields in the results may be undefined in the current implementation 