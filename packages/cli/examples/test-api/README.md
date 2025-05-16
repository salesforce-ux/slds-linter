# API Test Example

This directory contains a simple test script to verify the Node.js API functionality of SLDS Linter.

## How it works

The `api-test.js` script tests the core API functions:

1. **Module loading**: Verifies that the API modules can be imported correctly
2. **Config normalization**: Tests that configuration parameters are properly normalized
3. **Linting**: Tests the linting functionality using files from the `demo` directory
4. **Report generation**: Tests both SARIF and CSV report formats

## How to run

```bash
# Navigate to this directory
cd packages/cli/examples/test-api

# Run the test script
node api-test.js
```

## Expected output

The script will display the test progress and results:

```
Starting SLDS Linter API tests...
✓ Modules imported successfully
✓ Config normalization works
✓ Lint works - found X files with issues
  File: hardcoded-values.css
  Issues: Y
  First issue: Line Z - [Issue message]
✓ SARIF report generation works (XXXX bytes)
  Report saved to: api-test-report.sarif
✓ CSV report generation works (XXX bytes)

All tests completed successfully ✅
```

## Cleanup

After running the tests, you may want to remove the generated report files:

```bash
rm api-test-report.sarif
```

## Files

- **api-test.js**: Test script that verifies core API functionality

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