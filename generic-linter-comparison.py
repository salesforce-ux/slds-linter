#!/usr/bin/env python3
"""
Generic SLDS Linter Comparison Tool
Compares local vs published linter results for any rule(s) and file(s)
Generates detailed Excel reports with SARIF data analysis
"""

import re
import json
import pandas as pd
import argparse
import os
import subprocess
from typing import List, Dict, Optional, Set
from pathlib import Path

class SLDSLinterComparator:
    def __init__(self, workspace_root: str = None):
        self.workspace_root = workspace_root or os.getcwd()
        self.output_dir = os.path.join(self.workspace_root, 'comparison-reports')
        os.makedirs(self.output_dir, exist_ok=True)
    
    def run_linter(self, files: List[str], version: str = 'local', output_name: str = 'report') -> str:
        """Run linter and generate SARIF report"""
        sarif_path = os.path.join(self.output_dir, f'{output_name}.sarif')
        
        if version == 'local':
            cmd = f"node packages/cli/build/index.js report --format sarif --output {self.output_dir} {' '.join(files)}"
        else:
            cmd = f"npx @salesforce-ux/slds-linter@{version} report --format sarif --output {self.output_dir} {' '.join(files)}"
        
        print(f"Running: {cmd}")
        
        try:
            subprocess.run(cmd, shell=True, check=True, cwd=self.workspace_root, 
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Rename generated file
            generated_file = os.path.join(self.output_dir, 'slds-linter-report.sarif')
            if os.path.exists(generated_file):
                os.rename(generated_file, sarif_path)
            
            return sarif_path
        except subprocess.CalledProcessError as e:
            print(f"Error running linter: {e}")
            return None
    
    def parse_sarif_file(self, file_path: str, rule_filter: Optional[str] = None) -> List[Dict]:
        """Parse SARIF file and extract violations, optionally filtered by rule"""
        violations = []
        
        try:
            with open(file_path, 'r') as f:
                sarif_data = json.load(f)
            
            for run in sarif_data.get('runs', []):
                for result in run.get('results', []):
                    rule_id = result.get('ruleId', '')
                    
                    # Apply rule filter if specified
                    if rule_filter and rule_filter not in rule_id:
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
                        
                        # Extract hardcoded value from message (for hardcoded-values rules)
                        value_match = re.search(r'Consider replacing the ([^s]+?) static value', message)
                        if not value_match:
                            value_match = re.search(r'no replacement styling hook for the ([^s]+?) static value', message)
                        
                        hardcoded_value = value_match.group(1) if value_match else ""
                        
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
                            'suggested_hooks': ', '.join(hooks) if hooks else "",
                            'message': message.strip(),
                            'level': level,
                            'rule_id': rule_id
                        })
        
        except Exception as e:
            print(f"Error parsing SARIF file {file_path}: {e}")
        
        return violations
    
    def compare_violations(self, local_violations: List[Dict], published_violations: List[Dict], 
                          file_name: str) -> List[Dict]:
        """Compare violations and find differences"""
        differences = []
        
        # Create lookup sets for easy comparison
        local_positions = {(v['line_start'], v['col_start'], v['hardcoded_value'], v['rule_id']) for v in local_violations}
        published_positions = {(v['line_start'], v['col_start'], v['hardcoded_value'], v['rule_id']) for v in published_violations}
        
        # Find violations only in local
        only_in_local = local_positions - published_positions
        for pos in only_in_local:
            local_violation = next(v for v in local_violations if 
                                 (v['line_start'], v['col_start'], v['hardcoded_value'], v['rule_id']) == pos)
            differences.append({
                'file': file_name,
                'difference_type': 'ONLY_IN_LOCAL',
                'rule_id': pos[3],
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
            published_violation = next(v for v in published_violations if 
                                     (v['line_start'], v['col_start'], v['hardcoded_value'], v['rule_id']) == pos)
            differences.append({
                'file': file_name,
                'difference_type': 'ONLY_IN_PUBLISHED',
                'rule_id': pos[3],
                'line': pos[0],
                'column': pos[1],
                'hardcoded_value': pos[2],
                'local_hooks': 'N/A',
                'published_hooks': published_violation['suggested_hooks'],
                'local_message': 'N/A', 
                'published_message': published_violation['message']
            })
        
        # Find violations in both but with different suggestions/messages
        common_positions = local_positions & published_positions
        for pos in common_positions:
            local_violation = next(v for v in local_violations if 
                                 (v['line_start'], v['col_start'], v['hardcoded_value'], v['rule_id']) == pos)
            published_violation = next(v for v in published_violations if 
                                     (v['line_start'], v['col_start'], v['hardcoded_value'], v['rule_id']) == pos)
            
            # Check for differences in suggestions or message format
            if (local_violation['suggested_hooks'] != published_violation['suggested_hooks'] or
                local_violation['message'] != published_violation['message']):
                differences.append({
                    'file': file_name,
                    'difference_type': 'DIFFERENT_SUGGESTIONS_OR_FORMAT',
                    'rule_id': pos[3],
                    'line': pos[0],
                    'column': pos[1],
                    'hardcoded_value': pos[2],
                    'local_hooks': local_violation['suggested_hooks'],
                    'published_hooks': published_violation['suggested_hooks'],
                    'local_message': local_violation['message'],
                    'published_message': published_violation['message']
                })
        
        return differences
    
    def generate_report(self, local_sarif: str, published_sarif: str, rule_filter: Optional[str] = None,
                       output_name: str = 'linter-comparison-report') -> str:
        """Generate comprehensive Excel comparison report"""
        
        print(f"Parsing SARIF files with rule filter: {rule_filter or 'ALL RULES'}")
        local_violations = self.parse_sarif_file(local_sarif, rule_filter)
        published_violations = self.parse_sarif_file(published_sarif, rule_filter)
        
        print(f"Local violations found: {len(local_violations)}")
        print(f"Published violations found: {len(published_violations)}")
        
        # Group violations by file
        local_by_file = {}
        published_by_file = {}
        
        for v in local_violations:
            file_name = v['file']
            if file_name not in local_by_file:
                local_by_file[file_name] = []
            local_by_file[file_name].append(v)
        
        for v in published_violations:
            file_name = v['file']
            if file_name not in published_by_file:
                published_by_file[file_name] = []
            published_by_file[file_name].append(v)
        
        # Compare violations for each file
        all_differences = []
        all_files = set(local_by_file.keys()) | set(published_by_file.keys())
        
        for file_name in all_files:
            local_file_violations = local_by_file.get(file_name, [])
            published_file_violations = published_by_file.get(file_name, [])
            file_differences = self.compare_violations(local_file_violations, published_file_violations, file_name)
            all_differences.extend(file_differences)
        
        # Create summary statistics
        summary_stats = {}
        for file_name in all_files:
            local_count = len(local_by_file.get(file_name, []))
            published_count = len(published_by_file.get(file_name, []))
            file_differences_count = len([d for d in all_differences if d['file'] == file_name])
            
            summary_stats[file_name] = {
                'local_violations': local_count,
                'published_violations': published_count,
                'difference': local_count - published_count,
                'differences_found': file_differences_count
            }
        
        # Generate Excel report
        excel_path = os.path.join(self.workspace_root, f'{output_name}.xlsx')
        print(f"Generating Excel report: {excel_path}")
        
        with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
            # Summary sheet
            if summary_stats:
                summary_df = pd.DataFrame.from_dict(summary_stats, orient='index')
                summary_df.to_excel(writer, sheet_name='Summary', index_label='File')
            
            # Differences sheet
            if all_differences:
                differences_df = pd.DataFrame(all_differences)
                differences_df.to_excel(writer, sheet_name='Differences', index=False)
            
            # All violations sheets
            if local_violations:
                pd.DataFrame(local_violations).to_excel(writer, sheet_name='Local_Violations', index=False)
            if published_violations:
                pd.DataFrame(published_violations).to_excel(writer, sheet_name='Published_Violations', index=False)
        
        # Print summary
        print("\n" + "="*80)
        print("📊 COMPARISON SUMMARY")
        print("="*80)
        print(f"Rule Filter: {rule_filter or 'ALL RULES'}")
        print(f"Total files analyzed: {len(all_files)}")
        print(f"Total differences found: {len(all_differences)}")
        
        for file_name, stats in summary_stats.items():
            print(f"\n📄 {file_name}:")
            print(f"  Local violations: {stats['local_violations']}")
            print(f"  Published violations: {stats['published_violations']}")
            print(f"  Net difference: {stats['difference']:+d}")
            print(f"  Differences found: {stats['differences_found']}")
        
        if all_differences:
            print(f"\n📋 DIFFERENCE TYPES:")
            diff_types = {}
            for diff in all_differences:
                diff_type = diff['difference_type']
                diff_types[diff_type] = diff_types.get(diff_type, 0) + 1
            
            for diff_type, count in diff_types.items():
                print(f"  - {diff_type}: {count}")
        
        return excel_path

def main():
    parser = argparse.ArgumentParser(description='Compare SLDS Linter results between local and published versions')
    parser.add_argument('--files', nargs='+', required=True,
                       help='CSS files to analyze (e.g., demo/uplift-bugs.css demo/small-set/hardcoded-values.css)')
    parser.add_argument('--rule', type=str, default=None,
                       help='Specific rule to filter (e.g., no-hardcoded-values-slds2). If not specified, compares all rules')
    parser.add_argument('--published-version', type=str, default='0.5.2',
                       help='Published version to compare against (default: 0.5.2)')
    parser.add_argument('--output-name', type=str, default='generic-linter-comparison-report',
                       help='Output report name (without .xlsx extension)')
    parser.add_argument('--workspace', type=str, default=None,
                       help='Workspace root directory (default: current directory)')
    
    args = parser.parse_args()
    
    # Initialize comparator
    comparator = SLDSLinterComparator(args.workspace)
    
    print("🔍 Generic SLDS Linter Comparison Tool")
    print(f"📁 Workspace: {comparator.workspace_root}")
    print(f"📋 Rule filter: {args.rule or 'ALL RULES'}")
    print(f"📄 Files: {', '.join(args.files)}")
    print(f"🏷️  Published version: {args.published_version}")
    
    # Generate SARIF reports
    print("\n🚀 Generating SARIF reports...")
    
    # Run local version
    local_sarif = comparator.run_linter(args.files, 'local', f'local-{args.output_name}')
    if not local_sarif or not os.path.exists(local_sarif):
        print("❌ Failed to generate local SARIF report")
        return 1
    
    # Run published version
    published_sarif = comparator.run_linter(args.files, args.published_version, f'published-{args.output_name}')
    if not published_sarif or not os.path.exists(published_sarif):
        print("❌ Failed to generate published SARIF report")
        return 1
    
    # Generate comparison report
    print("\n📊 Analyzing and comparing results...")
    excel_path = comparator.generate_report(local_sarif, published_sarif, args.rule, args.output_name)
    
    print(f"\n✅ Analysis complete!")
    print(f"📊 Excel report: {excel_path}")
    print(f"📄 Local SARIF: {local_sarif}")
    print(f"📄 Published SARIF: {published_sarif}")

if __name__ == "__main__":
    exit(main())
