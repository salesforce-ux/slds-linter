#!/bin/bash

# Generic SLDS Linter Comparison Script
# Wrapper script for easier usage of the Python comparison tool

set -e

# Default values
RULE=""
FILES=""
PUBLISHED_VERSION="0.5.2"
OUTPUT_NAME="linter-comparison-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to show usage
show_usage() {
    echo "🔍 Generic SLDS Linter Comparison Tool"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --files FILE1 FILE2...    CSS files to analyze (required)"
    echo "  -r, --rule RULE_NAME          Specific rule to filter (optional)"
    echo "  -v, --version VERSION         Published version to compare (default: 0.5.2)"
    echo "  -o, --output OUTPUT_NAME      Output report name (default: timestamped)"
    echo "  -h, --help                    Show this help message"
    echo ""
    echo "Examples:"
    echo ""
    echo "  # Compare specific rule on multiple files"
    echo "  $0 -f demo/uplift-bugs.css demo/small-set/hardcoded-values.css -r no-hardcoded-values-slds2"
    echo ""
    echo "  # Compare all rules on single file"  
    echo "  $0 -f demo/uplift-bugs.css"
    echo ""
    echo "  # Compare against older published version"
    echo "  $0 -f demo/test.css -r my-rule -v 0.4.0"
    echo ""
    echo "  # Custom output name"
    echo "  $0 -f demo/test.css -r my-rule -o my-analysis"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--files)
            shift
            FILES=""
            while [[ $# -gt 0 ]] && [[ $1 != -* ]]; do
                FILES="$FILES $1"
                shift
            done
            ;;
        -r|--rule)
            RULE="$2"
            shift 2
            ;;
        -v|--version)
            PUBLISHED_VERSION="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_NAME="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$FILES" ]]; then
    print_error "Files are required. Use -f or --files to specify CSS files to analyze."
    show_usage
    exit 1
fi

# Check if Python script exists
if [[ ! -f "generic-linter-comparison.py" ]]; then
    print_error "generic-linter-comparison.py not found in current directory"
    exit 1
fi

# Check if required Python modules are installed
python3 -c "import pandas, openpyxl" 2>/dev/null || {
    print_error "Required Python modules not installed"
    echo "Please run: pip install pandas openpyxl"
    exit 1
}

# Build command
CMD="python3 generic-linter-comparison.py --files$FILES"

if [[ -n "$RULE" ]]; then
    CMD="$CMD --rule $RULE"
fi

if [[ "$PUBLISHED_VERSION" != "0.5.2" ]]; then
    CMD="$CMD --published-version $PUBLISHED_VERSION"
fi

if [[ "$OUTPUT_NAME" != "linter-comparison-"* ]]; then
    CMD="$CMD --output-name $OUTPUT_NAME"
fi

# Show what we're going to run
print_info "Starting SLDS Linter Comparison"
echo ""
echo "📋 Configuration:"
echo "   Files:            $FILES"
echo "   Rule filter:      ${RULE:-"ALL RULES"}"
echo "   Published version: $PUBLISHED_VERSION"
echo "   Output name:      $OUTPUT_NAME"
echo ""

print_info "Running command: $CMD"
echo ""

# Execute the comparison
eval $CMD

# Check if successful
if [[ $? -eq 0 ]]; then
    print_success "Comparison completed successfully!"
    echo ""
    print_info "Generated files:"
    echo "   📊 Excel report: ${OUTPUT_NAME}.xlsx"
    echo "   📄 Local SARIF:  comparison-reports/local-${OUTPUT_NAME}.sarif"
    echo "   📄 Published SARIF: comparison-reports/published-${OUTPUT_NAME}.sarif"
    echo ""
    print_info "Open the Excel report to see detailed analysis:"
    echo "   open ${OUTPUT_NAME}.xlsx"
else
    print_error "Comparison failed. Check the output above for details."
    exit 1
fi
