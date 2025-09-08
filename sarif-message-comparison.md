# SARIF Message Comparison: Local vs Published v0.5.2

## Key Files to Compare:
1. **Local Version**: `local-uplift-bugs.sarif` and `local-hardcoded-values.sarif`
2. **Published v0.5.2**: `published-uplift-bugs.sarif` and `published-hardcoded-values.sarif`

## Major Message Format Differences

### 1. **Hook Suggestion Format**

#### Local Version (Inline Format):
```
Consider replacing the white static value with an SLDS 2 styling hook that has a similar value: --slds-g-color-palette-neutral-100, --slds-g-color-neutral-base-100, --slds-g-color-brand-base-100, --slds-g-color-error-base-100, --slds-g-color-warning-base-100.
```

#### Published v0.5.2 (Numbered List Format):
```
Consider replacing the white static value with an SLDS 2 styling hook that has a similar value: 
1. --slds-g-color-palette-neutral-100
2. --slds-g-color-neutral-base-100
3. --slds-g-color-brand-base-100
4. --slds-g-color-error-base-100
5. --slds-g-color-warning-base-100 (slds/no-hardcoded-values-slds2).
```

### 2. **Rule ID Inclusion**

#### Local Version:
- **No rule ID suffix** in the message text
- Rule ID only in the separate `ruleId` field

#### Published v0.5.2:
- **Includes rule ID suffix** `(slds/no-hardcoded-values-slds2)` at the end of messages
- Also has the rule ID in the separate `ruleId` field

### 3. **Message Structure**

#### Local Version:
- **Compact format**: All hooks in single line, comma-separated
- **Cleaner appearance**: No extra formatting characters
- **Consistent**: All messages follow same pattern

#### Published v0.5.2:
- **Expanded format**: Multi-line with numbered list for multiple hooks
- **More verbose**: Includes rule ID redundantly in message text
- **Variable**: Single hooks vs multiple hooks formatted differently

## Example Comparison

### Same Violation - Different Message Format:

**Location**: Line 2, Column 15 (white background color)

**Local Message**:
```
Consider replacing the white static value with an SLDS 2 styling hook that has a similar value: --slds-g-color-palette-neutral-100, --slds-g-color-neutral-base-100, --slds-g-color-brand-base-100, --slds-g-color-error-base-100, --slds-g-color-warning-base-100.
```

**Published Message**:
```
Consider replacing the white static value with an SLDS 2 styling hook that has a similar value: 
1. --slds-g-color-palette-neutral-100
2. --slds-g-color-neutral-base-100
3. --slds-g-color-brand-base-100
4. --slds-g-color-error-base-100
5. --slds-g-color-warning-base-100 (slds/no-hardcoded-values-slds2).
```

## Statistics Summary

### uplift-bugs.css:
- **Local SARIF**: 66 violations
- **Published SARIF**: 66 violations  
- **Differences**: 4 (mainly formatting differences)

### hardcoded-values.css:
- **Local SARIF**: 22 violations
- **Published SARIF**: 20 violations
- **Differences**: 6 (2 missing violations + formatting differences)

## Key Insights

1. **Same Detection Capability**: Both versions detect the same violations in most cases
2. **Message Format Evolution**: Local version uses more compact, consistent formatting
3. **Redundancy Reduction**: Local version removes redundant rule ID from message text
4. **Better Readability**: Local version's inline format is more concise and easier to parse

## Recommendation

The **local version's message format is superior** because:
- More consistent formatting across all violations
- Eliminates redundant information (rule ID already in separate field)
- Easier to parse programmatically
- More compact and readable

The published v0.5.2 version appears to have some inconsistencies in message formatting that the local refactored version has addressed.

