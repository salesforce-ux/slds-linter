# 🔍 Generic SLDS Linter Comparison Guide

This guide shows you how to compare local vs published linter results for **any rule** and **any CSS files**.

## 📋 Prerequisites

1. **Python dependencies**:
   ```bash
   pip install pandas openpyxl
   ```

2. **Node.js environment** with access to:
   - Local CLI: `packages/cli/build/index.js`
   - Published versions via npm: `@salesforce-ux/slds-linter`

## 🚀 Quick Start

### Basic Usage
```bash
python3 generic-linter-comparison.py --files demo/uplift-bugs.css demo/small-set/hardcoded-values.css
```

### Filter by Specific Rule
```bash
python3 generic-linter-comparison.py \
  --files demo/uplift-bugs.css \
  --rule no-hardcoded-values-slds2
```

### Compare Against Different Published Version
```bash
python3 generic-linter-comparison.py \
  --files demo/uplift-bugs.css \
  --rule no-hardcoded-values-slds2 \
  --published-version 0.4.0
```

### Custom Output Name
```bash
python3 generic-linter-comparison.py \
  --files demo/uplift-bugs.css \
  --rule no-hardcoded-values-slds2 \
  --output-name my-custom-analysis
```

## 📖 Command Line Options

| Option | Description | Example | Default |
|--------|-------------|---------|---------|
| `--files` | CSS files to analyze (required) | `demo/test.css demo/other.css` | None |
| `--rule` | Filter by specific rule | `no-hardcoded-values-slds2` | All rules |
| `--published-version` | Published version to compare | `0.5.2`, `0.4.0` | `0.5.2` |
| `--output-name` | Report filename (no extension) | `my-analysis` | `generic-linter-comparison-report` |
| `--workspace` | Workspace root directory | `/path/to/project` | Current directory |

## 📊 Example Use Cases

### 1. **Test New Rule Implementation**
```bash
# Compare your new rule against published version
python3 generic-linter-comparison.py \
  --files demo/test-new-rule.css \
  --rule my-new-rule-name \
  --output-name new-rule-validation
```

### 2. **Regression Testing**
```bash
# Test all rules against comprehensive test suite
python3 generic-linter-comparison.py \
  --files demo/uplift-bugs.css demo/small-set/hardcoded-values.css demo/comprehensive-test.css \
  --output-name regression-test
```

### 3. **Rule-Specific Analysis**
```bash
# Focus on specific rule across multiple files
python3 generic-linter-comparison.py \
  --files demo/*.css \
  --rule no-slds-var-without-fallback \
  --output-name var-fallback-analysis
```

### 4. **Version Migration Testing**
```bash
# Compare against older version to see improvements
python3 generic-linter-comparison.py \
  --files demo/uplift-bugs.css \
  --published-version 0.4.0 \
  --output-name migration-from-v0.4.0
```

## 📈 Output Files Generated

### 1. **Excel Report** (`{output-name}.xlsx`)
- **Summary**: Overview of violations per file
- **Differences**: Detailed differences between versions
- **Local_Violations**: All local violations with full data
- **Published_Violations**: All published violations with full data

### 2. **SARIF Files** (`comparison-reports/`)
- `local-{output-name}.sarif`: Local linter results
- `published-{output-name}.sarif`: Published linter results

## 🔧 Advanced Usage

### Custom Workspace
```bash
python3 generic-linter-comparison.py \
  --workspace /path/to/different/project \
  --files test.css \
  --rule my-rule
```

### Multiple Rules (Run Separately)
```bash
# For multiple rules, run separate comparisons
python3 generic-linter-comparison.py --files demo/test.css --rule rule1 --output-name rule1-analysis
python3 generic-linter-comparison.py --files demo/test.css --rule rule2 --output-name rule2-analysis
```

## 📋 Step-by-Step Process

### For Any New Rule Comparison:

1. **Prepare your CSS test files**:
   ```bash
   # Create or identify CSS files that test your rule
   ls demo/  # See available test files
   ```

2. **Run comparison**:
   ```bash
   python3 generic-linter-comparison.py \
     --files demo/your-test-file.css \
     --rule your-rule-name \
     --output-name your-analysis
   ```

3. **Review results**:
   ```bash
   # Open the generated Excel file
   open your-analysis.xlsx
   
   # Or check the summary in terminal output
   ```

4. **Investigate differences** (if any):
   - Check the "Differences" sheet in Excel
   - Look at specific violations in "Local_Violations" vs "Published_Violations" sheets
   - Use SARIF files for programmatic analysis

### For Testing All Rules:

1. **Run without rule filter**:
   ```bash
   python3 generic-linter-comparison.py \
     --files demo/comprehensive-test.css \
     --output-name full-regression-test
   ```

2. **Review comprehensive report** covering all rules

## 🎯 Common Scenarios

### Scenario 1: New Feature Development
```bash
# Test your new hardcoded-values improvements
python3 generic-linter-comparison.py \
  --files demo/uplift-bugs.css demo/small-set/hardcoded-values.css \
  --rule no-hardcoded-values-slds2 \
  --output-name hardcoded-values-improvements
```

### Scenario 2: Bug Fix Validation  
```bash
# Verify bug fixes don't break existing functionality
python3 generic-linter-comparison.py \
  --files demo/bug-reproduction.css \
  --rule problematic-rule \
  --output-name bug-fix-validation
```

### Scenario 3: Performance Testing
```bash
# Test large files for performance regression
python3 generic-linter-comparison.py \
  --files demo/large-test-file.css \
  --output-name performance-test
```

## 🔍 Understanding the Output

### Excel Report Structure:
- **Summary Sheet**: High-level statistics per file
- **Differences Sheet**: Detailed differences with context
- **Violation Sheets**: Raw data for deep analysis

### Difference Types:
- `ONLY_IN_LOCAL`: New violations detected by local version
- `ONLY_IN_PUBLISHED`: Violations missed by local version  
- `DIFFERENT_SUGGESTIONS_OR_FORMAT`: Same violation, different suggestions/formatting

### Key Metrics:
- **Violation Count**: How many issues each version finds
- **Suggestion Quality**: Whether hook suggestions match
- **Message Format**: Consistency in error messages

## 🛠️ Troubleshooting

### Common Issues:

1. **"Module not found" errors**:
   ```bash
   pip install pandas openpyxl
   ```

2. **"Command not found" for published linter**:
   ```bash
   npm install -g @salesforce-ux/slds-linter@0.5.2
   ```

3. **Local CLI not found**:
   ```bash
   cd packages/cli && npm run build
   ```

4. **Permission errors**:
   ```bash
   chmod +x generic-linter-comparison.py
   ```

## 💡 Pro Tips

1. **Start with small files** for quick iterations
2. **Use specific rule filters** to focus analysis  
3. **Compare multiple published versions** to track improvements
4. **Save different output names** to track progress over time
5. **Use the Excel pivot tables** for deeper analysis of patterns

---

## 📞 Quick Reference Commands

```bash
# Most common usage - test hardcoded values rule
python3 generic-linter-comparison.py \
  --files demo/uplift-bugs.css demo/small-set/hardcoded-values.css \
  --rule no-hardcoded-values-slds2

# Test all rules on specific file
python3 generic-linter-comparison.py --files demo/comprehensive-test.css

# Compare specific rule against older version
python3 generic-linter-comparison.py \
  --files demo/test.css \
  --rule my-rule \
  --published-version 0.4.0
```
