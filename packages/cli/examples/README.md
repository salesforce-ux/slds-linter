# SLDS Linter Examples

This directory contains examples showing how to use the SLDS Linter in your projects.

## Available Examples

- **node-api-example.mjs**: Simple example demonstrating how to use the Node.js API
- **test-api/**: Automated test script for validating API functionality

## Running the Examples

All examples use the `demo` directory for test files instead of including duplicate test files.

### Node API Example

```bash
# Navigate to examples directory
cd packages/cli/examples

# Run the Node API example
node node-api-example.mjs
```

### API Test Script

```bash
# Navigate to test-api directory
cd packages/cli/examples/test-api

# Run the API test script
node api-test.js
```

## Cleanup

After running examples, you may want to remove generated report files:

```bash
rm example-report.sarif example-report.csv api-test-report.sarif
```

## Demo Files

All examples utilize the project's `demo` directory for test files. The demo directory 
contains various CSS and HTML files with common styling issues that the SLDS Linter can detect.

To see available test files, check:
```
/demo/small-set/
``` 