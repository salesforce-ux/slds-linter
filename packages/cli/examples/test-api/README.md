# SLDS Linter Node API Tests

This directory contains simplified tests for the SLDS Linter Node API.

## Files

- **api-test.js**: Consolidated test file that verifies core API functionality
- **test.css**: Sample CSS file with SLDS linting issues for testing

## Running the Test

```bash
# Navigate to CLI package root
cd ../../

# Build the package
npm run build

# Run the test
cd examples/test-api
node api-test.js
```

## API Overview

The SLDS Linter Node API provides the following methods:

| Method | Description |
| ------ | ----------- |
| `lint(options)` | Lints files for SLDS compliance |
| `report(options)` | Generates reports in different formats |

The API also provides utility functions:

| Function | Description |
| -------- | ----------- |
| `normalizeConfig(options)` | Normalizes configuration options |

## Usage Example

```javascript
import { sldsExecutor } from '@salesforce-ux/slds-linter/executor';

// Lint files using glob patterns
const results = await sldsExecutor.lint({
  directory: "components/**/*.css",
  fix: false
});

// Generate a report
const reportStream = await sldsExecutor.report({
  issues: results,
  format: 'sarif'
});

// Process the stream
reportStream.pipe(fs.createWriteStream('lint-report.sarif'));
```

For more detailed examples, see the main documentation and the `api-test.js` file. 