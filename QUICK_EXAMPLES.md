# 🚀 Quick Examples - SLDS Linter Comparison

## 🎯 Most Common Use Cases

### 1. **Test the `no-hardcoded-values-slds2` rule** (what we just did)
```bash
# Using Python script directly
python3 generic-linter-comparison.py \
  --files demo/uplift-bugs.css demo/small-set/hardcoded-values.css \
  --rule no-hardcoded-values-slds2 \
  --output-name hardcoded-values-test

# Using shell wrapper (easier)
./compare-linter.sh \
  -f demo/uplift-bugs.css demo/small-set/hardcoded-values.css \
  -r no-hardcoded-values-slds2 \
  -o hardcoded-values-test
```

### 2. **Test all rules on a single file**
```bash
# Check everything on uplift-bugs.css
./compare-linter.sh -f demo/uplift-bugs.css -o full-uplift-analysis
```

### 3. **Test a specific rule across multiple files**
```bash
# Test no-important-tag rule across all demo files
./compare-linter.sh \
  -f demo/small-set/no-important-tag.css demo/uplift-bugs.css \
  -r no-important-tag \
  -o important-tag-analysis
```

### 4. **Compare against older published version**
```bash
# See improvements since v0.4.0
./compare-linter.sh \
  -f demo/uplift-bugs.css \
  -v 0.4.0 \
  -o improvements-since-v0.4.0
```

## 📊 Real Example Output

When you run:
```bash
./compare-linter.sh -f demo/uplift-bugs.css -r no-hardcoded-values-slds2
```

You'll see:
```
🔍 Generic SLDS Linter Comparison Tool

📋 Configuration:
   Files:             demo/uplift-bugs.css
   Rule filter:      no-hardcoded-values-slds2
   Published version: 0.5.2
   Output name:      linter-comparison-20241220-143022

ℹ️  Running command: python3 generic-linter-comparison.py --files demo/uplift-bugs.css --rule no-hardcoded-values-slds2 --output-name linter-comparison-20241220-143022

Running: node packages/cli/build/index.js report --format sarif --output comparison-reports demo/uplift-bugs.css
Running: npx @salesforce-ux/slds-linter@0.5.2 report --format sarif --output comparison-reports demo/uplift-bugs.css
Parsing SARIF files with rule filter: no-hardcoded-values-slds2
Local violations found: 66
Published violations found: 66
Generating Excel report: linter-comparison-20241220-143022.xlsx

================================================================================
📊 COMPARISON SUMMARY
================================================================================
Rule Filter: no-hardcoded-values-slds2
Total files analyzed: 1
Total differences found: 4

📄 demo/uplift-bugs.css:
  Local violations: 66
  Published violations: 66
  Net difference: +0
  Differences found: 4

📋 DIFFERENCE TYPES:
  - DIFFERENT_SUGGESTIONS_OR_FORMAT: 4

✅ Comparison completed successfully!

ℹ️  Generated files:
   📊 Excel report: linter-comparison-20241220-143022.xlsx
   📄 Local SARIF:  comparison-reports/local-linter-comparison-20241220-143022.sarif
   📄 Published SARIF: comparison-reports/published-linter-comparison-20241220-143022.sarif
```

## 🎨 Available Rules to Test

Based on the codebase, here are some rules you can test:

### ESLint Rules (v9):
- `no-hardcoded-values-slds1`
- `no-hardcoded-values-slds2`
- `enforce-bem`
- `no-important-tag`
- `no-slds-var-without-fallback`

### Common Test Files:
- `demo/uplift-bugs.css` - Mixed violations
- `demo/small-set/hardcoded-values.css` - Hardcoded values focus
- `demo/small-set/no-important-tag.css` - Important tag violations
- `demo/small-set/enforce-bem.css` - BEM naming violations

## 🔄 Iterative Development Workflow

1. **Make code changes** to your rule
2. **Test specific rule**:
   ```bash
   ./compare-linter.sh -f demo/test-file.css -r your-rule-name -o iteration-1
   ```
3. **Review Excel report** for differences
4. **Fix issues** and repeat
5. **Final validation** with comprehensive test:
   ```bash
   ./compare-linter.sh -f demo/uplift-bugs.css demo/small-set/*.css -o final-validation
   ```

## 💾 File Organization

After running comparisons, you'll have:
```
📁 stylelint-sds/
├── 📊 your-analysis.xlsx              # Main Excel report
├── 📁 comparison-reports/
│   ├── 📄 local-your-analysis.sarif   # Local SARIF data
│   └── 📄 published-your-analysis.sarif # Published SARIF data
├── 🐍 generic-linter-comparison.py    # Python comparison engine
├── 🔧 compare-linter.sh              # Shell wrapper script
└── 📖 LINTER_COMPARISON_GUIDE.md     # Full documentation
```

## 🎯 Next Steps

1. **Try it out** with a simple example
2. **Customize** for your specific needs
3. **Integrate** into your development workflow
4. **Share** with your team for consistent testing

---

*This tool makes it easy to validate linter improvements and catch regressions across any rule!*
