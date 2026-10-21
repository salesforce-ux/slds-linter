import styled from 'styled-components';

// Detected: deprecated classes in className are checked by this rule.
export function DeprecatedClassNameDemo() {
  return <div className="slds-action-overflow--touch">Deprecated className</div>;
}

// Not applicable: inline styles contain CSS declarations, not class names.
export function InlineStyleDemo() {
  return <div style={{ color: '#ba0517' }}>No class name to inspect</div>;
}

// Detected: static class selectors in styled-components are checked by this rule.
export const DeprecatedStyledComponent = styled.div`
  &.slds-action-overflow--touch {
    color: #ba0517;
  }
`;
