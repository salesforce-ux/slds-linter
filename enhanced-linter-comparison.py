#!/usr/bin/env python3
"""
Enhanced SLDS Linter Comparison Analysis
Compares local vs published v0.5.2 results for no-hardcoded-values-slds2 rule
Includes both text output parsing and SARIF data analysis
"""

import re
import json
import pandas as pd
from typing import List, Dict, Tuple
import os

def parse_sarif_file(file_path: str) -> List[Dict]:
    """Parse SARIF file and extract violations for no-hardcoded-values-slds2 rule only"""
    violations = []
    
    try:
        with open(file_path, 'r') as f:
            sarif_data = json.load(f)
        
        # Navigate SARIF structure
        for run in sarif_data.get('runs', []):
            for result in run.get('results', []):
                rule_id = result.get('ruleId', '')
                
                # Only process no-hardcoded-values-slds2 violations
                if 'no-hardcoded-values-slds2' not in rule_id:
                    continue
                
                message = result.get('message', {}).get('text', '')
                level = result.get('level', 'warning')
                
                # Extract locations
                for location in result.get('locations', []):
                    physical_location = location.get('physicalLocation', {})
                    artifact_location = physical_location.get('artifactLocation', {})
                    region = physical_location.get('region', {})
                    
                    file_uri = artifact_location.get('uri', '')
                    line_start = region.get('startLine', 0)
                    col_start = region.get('startColumn', 0)
                    line_end = region.get('endLine', line_start)
                    col_end = region.get('endColumn', col_start)
                    
                    # Extract hardcoded value from message
                    value_match = re.search(r'Consider replacing the ([^s]+?) static value', message)
                    if not value_match:
                        value_match = re.search(r'no replacement styling hook for the ([^s]+?) static value', message)
                    
                    hardcoded_value = value_match.group(1) if value_match else "Unknown"
                    
                    # Extract suggested hooks
                    hooks = []
                    if 'styling hook that has a similar value:' in message:
                        hook_matches = re.findall(r'--slds-[a-z0-9-]+', message)
                        hooks = hook_matches
                    elif 'no replacement styling hook' in message:
                        hooks = ["NO_REPLACEMENT"]
                    
                    violations.append({
                        'file': file_uri,
                        'line_start': line_start,
                        'col_start': col_start,
                        'line_end': line_end,
                        'col_end': col_end,
                        'hardcoded_value': hardcoded_value,
                        'suggested_hooks': ', '.join(hooks) if hooks else "Unknown",
                        'message': message.strip(),
                        'level': level,
                        'rule_id': rule_id
                    })
    
    except Exception as e:
        print(f"Error parsing SARIF file {file_path}: {e}")
    
    return violations

def parse_text_output(content: str) -> List[Dict]:
    """Parse text linter output and extract violations for no-hardcoded-values-slds2 rule only"""
    violations = []
    lines = content.strip().split('\n')
    
    for line in lines:
        # Only process warnings (⚠) for no-hardcoded-values-slds2 rule
        if '⚠' in line and 'slds/no-hardcoded-values-slds2' in line:
            # Extract position information using regex
            position_match = re.search(r'(\d+):(\d+)(\d+):(\d+)', line)
            if position_match:
                line_start = position_match.group(1)
                col_start = position_match.group(2) 
                line_end = position_match.group(3)
                col_end = position_match.group(4)
            else:
                # Fallback pattern
                position_match = re.search(r'(\d+):(\d+)', line)
                if position_match:
                    line_start = position_match.group(1)
                    col_start = position_match.group(2)
                    line_end = line_start
                    col_end = col_start
                else:
                    continue
                
            # Extract the message part - handle the terminal escape sequences
            message_part = line
            if ']8;;' in line:
                parts = line.split(']8;;')
                if len(parts) >= 2:
                    message_part = parts[1]
            
            # Clean up the message - remove all terminal escape sequences and illegal characters
            message_part = re.sub(r'\]8;;[^]]*\]8;;', '', message_part)  # Remove hyperlink sequences
            message_part = re.sub(r'cursor://[^\s]*', '', message_part)  # Remove cursor links
            message_part = message_part.split('slds/no-hardcoded-values-slds2')[0].strip()
            message_part = re.sub(r'[^\x20-\x7E]', '', message_part)  # Remove non-printable chars
            
            # Extract the hardcoded value being flagged
            value_match = re.search(r'Consider replacing the ([^s]+?) static value', message_part)
            if not value_match:
                value_match = re.search(r'no replacement styling hook for the ([^s]+?) static value', message_part)
            
            hardcoded_value = value_match.group(1) if value_match else "Unknown"
            
            # Extract suggested hooks
            hooks = []
            if 'styling hook that has a similar value:' in message_part:
                hook_matches = re.findall(r'--slds-[a-z0-9-]+', message_part)
                hooks = hook_matches
            elif 'no replacement styling hook' in message_part:
                hooks = ["NO_REPLACEMENT"]
            
            violations.append({
                'line_start': int(line_start),
                'col_start': int(col_start),
                'line_end': int(line_end), 
                'col_end': int(col_end),
                'hardcoded_value': hardcoded_value,
                'suggested_hooks': ', '.join(hooks) if hooks else "Unknown",
                'message': message_part
            })
    
    return violations

def compare_violations(local_violations: List[Dict], published_violations: List[Dict], file_name: str) -> List[Dict]:
    """Compare violations and find differences"""
    differences = []
    
    # Create lookup sets for easy comparison
    local_positions = {(v['line_start'], v['col_start'], v['hardcoded_value']) for v in local_violations}
    published_positions = {(v['line_start'], v['col_start'], v['hardcoded_value']) for v in published_violations}
    
    # Find violations only in local
    only_in_local = local_positions - published_positions
    for pos in only_in_local:
        local_violation = next(v for v in local_violations if (v['line_start'], v['col_start'], v['hardcoded_value']) == pos)
        differences.append({
            'file': file_name,
            'difference_type': 'ONLY_IN_LOCAL',
            'line': pos[0],
            'column': pos[1], 
            'hardcoded_value': pos[2],
            'local_hooks': local_violation['suggested_hooks'],
            'published_hooks': 'N/A',
            'local_message': local_violation['message'],
            'published_message': 'N/A'
        })
    
    # Find violations only in published
    only_in_published = published_positions - local_positions
    for pos in only_in_published:
        published_violation = next(v for v in published_violations if (v['line_start'], v['col_start'], v['hardcoded_value']) == pos)
        differences.append({
            'file': file_name,
            'difference_type': 'ONLY_IN_PUBLISHED',
            'line': pos[0],
            'column': pos[1],
            'hardcoded_value': pos[2],
            'local_hooks': 'N/A',
            'published_hooks': published_violation['suggested_hooks'],
            'local_message': 'N/A', 
            'published_message': published_violation['message']
        })
    
    # Find violations in both but with different suggestions
    common_positions = local_positions & published_positions
    for pos in common_positions:
        local_violation = next(v for v in local_violations if (v['line_start'], v['col_start'], v['hardcoded_value']) == pos)
        published_violation = next(v for v in published_violations if (v['line_start'], v['col_start'], v['hardcoded_value']) == pos)
        
        if local_violation['suggested_hooks'] != published_violation['suggested_hooks']:
            differences.append({
                'file': file_name,
                'difference_type': 'DIFFERENT_SUGGESTIONS',
                'line': pos[0],
                'column': pos[1],
                'hardcoded_value': pos[2],
                'local_hooks': local_violation['suggested_hooks'],
                'published_hooks': published_violation['suggested_hooks'],
                'local_message': local_violation['message'],
                'published_message': published_violation['message']
            })
    
    return differences

def main():
    """Main comparison function"""
    
    # Parse SARIF files
    print("Parsing SARIF files...")
    local_uplift_sarif = parse_sarif_file('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/local-uplift-bugs.sarif')
    published_uplift_sarif = parse_sarif_file('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/published-uplift-bugs.sarif')
    local_hardcoded_sarif = parse_sarif_file('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/local-hardcoded-values.sarif')
    published_hardcoded_sarif = parse_sarif_file('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/published-hardcoded-values.sarif')
    
    # Parse text outputs for comparison
    print("Parsing text outputs...")
    with open('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/local-uplift-bugs-results.txt', 'r') as f:
        local_uplift_text = parse_text_output(f.read())
    
    with open('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/published-uplift-bugs-results.txt', 'r') as f:
        published_uplift_text = parse_text_output(f.read())
        
    with open('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/local-hardcoded-values-results.txt', 'r') as f:
        local_hardcoded_text = parse_text_output(f.read())
        
    with open('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/published-hardcoded-values-results.txt', 'r') as f:
        published_hardcoded_text = parse_text_output(f.read())
    
    # Compare and find differences using SARIF data (more reliable)
    print("Comparing violations...")
    uplift_differences = compare_violations(local_uplift_sarif, published_uplift_sarif, 'uplift-bugs.css')
    hardcoded_differences = compare_violations(local_hardcoded_sarif, published_hardcoded_sarif, 'hardcoded-values.css')
    
    # Combine all differences
    all_differences = uplift_differences + hardcoded_differences
    
    # Create summary statistics
    summary_stats = {
        'uplift-bugs.css': {
            'local_sarif_violations': len(local_uplift_sarif),
            'published_sarif_violations': len(published_uplift_sarif),
            'local_text_violations': len(local_uplift_text),
            'published_text_violations': len(published_uplift_text),
            'differences_found': len(uplift_differences)
        },
        'hardcoded-values.css': {
            'local_sarif_violations': len(local_hardcoded_sarif),
            'published_sarif_violations': len(published_hardcoded_sarif),
            'local_text_violations': len(local_hardcoded_text),
            'published_text_violations': len(published_hardcoded_text),
            'differences_found': len(hardcoded_differences)
        }
    }
    
    # Create enhanced Excel report
    print("Generating Excel report...")
    with pd.ExcelWriter('/Users/ritesh.kumar2/Documents/projects/stylelint-sds/enhanced-slds-linter-comparison-report.xlsx', engine='openpyxl') as writer:
        
        # Summary sheet
        summary_df = pd.DataFrame.from_dict(summary_stats, orient='index')
        summary_df.to_excel(writer, sheet_name='Summary', index_label='File')
        
        # Differences sheet
        if all_differences:
            differences_df = pd.DataFrame(all_differences)
            differences_df.to_excel(writer, sheet_name='Differences', index=False)
        else:
            # Create empty sheet with headers if no differences
            empty_df = pd.DataFrame(columns=[
                'file', 'difference_type', 'line', 'column', 'hardcoded_value',
                'local_hooks', 'published_hooks', 'local_message', 'published_message'
            ])
            empty_df.to_excel(writer, sheet_name='Differences', index=False)
        
        # SARIF data sheets
        if local_uplift_sarif:
            pd.DataFrame(local_uplift_sarif).to_excel(writer, sheet_name='Local_Uplift_SARIF', index=False)
        if published_uplift_sarif:
            pd.DataFrame(published_uplift_sarif).to_excel(writer, sheet_name='Published_Uplift_SARIF', index=False)
        if local_hardcoded_sarif:
            pd.DataFrame(local_hardcoded_sarif).to_excel(writer, sheet_name='Local_Hardcoded_SARIF', index=False)
        if published_hardcoded_sarif:
            pd.DataFrame(published_hardcoded_sarif).to_excel(writer, sheet_name='Published_Hardcoded_SARIF', index=False)
        
        # Text parsing comparison sheets
        if local_uplift_text:
            pd.DataFrame(local_uplift_text).to_excel(writer, sheet_name='Local_Uplift_Text', index=False)
        if published_uplift_text:
            pd.DataFrame(published_uplift_text).to_excel(writer, sheet_name='Published_Uplift_Text', index=False)
        if local_hardcoded_text:
            pd.DataFrame(local_hardcoded_text).to_excel(writer, sheet_name='Local_Hardcoded_Text', index=False)
        if published_hardcoded_text:
            pd.DataFrame(published_hardcoded_text).to_excel(writer, sheet_name='Published_Hardcoded_Text', index=False)
    
    print("=== Enhanced SLDS Linter Comparison Report ===")
    print(f"\nSummary Statistics (SARIF Data):")
    print(f"uplift-bugs.css:")
    print(f"  - Local SARIF violations: {summary_stats['uplift-bugs.css']['local_sarif_violations']}")
    print(f"  - Published SARIF violations: {summary_stats['uplift-bugs.css']['published_sarif_violations']}")
    print(f"  - Local text violations: {summary_stats['uplift-bugs.css']['local_text_violations']}")  
    print(f"  - Published text violations: {summary_stats['uplift-bugs.css']['published_text_violations']}")
    print(f"  - Differences found: {summary_stats['uplift-bugs.css']['differences_found']}")
    
    print(f"\nhardcoded-values.css:")
    print(f"  - Local SARIF violations: {summary_stats['hardcoded-values.css']['local_sarif_violations']}")
    print(f"  - Published SARIF violations: {summary_stats['hardcoded-values.css']['published_sarif_violations']}")
    print(f"  - Local text violations: {summary_stats['hardcoded-values.css']['local_text_violations']}")
    print(f"  - Published text violations: {summary_stats['hardcoded-values.css']['published_text_violations']}")
    print(f"  - Differences found: {summary_stats['hardcoded-values.css']['differences_found']}")
    
    print(f"\nTotal differences found: {len(all_differences)}")
    
    if all_differences:
        print(f"\nDifference Types:")
        diff_types = {}
        for diff in all_differences:
            diff_type = diff['difference_type']
            diff_types[diff_type] = diff_types.get(diff_type, 0) + 1
        
        for diff_type, count in diff_types.items():
            print(f"  - {diff_type}: {count}")
    
    print(f"\nEnhanced Excel report saved to: enhanced-slds-linter-comparison-report.xlsx")
    print(f"SARIF files generated:")
    print(f"  - local-uplift-bugs.sarif")
    print(f"  - published-uplift-bugs.sarif") 
    print(f"  - local-hardcoded-values.sarif")
    print(f"  - published-hardcoded-values.sarif")

if __name__ == "__main__":
    main()

